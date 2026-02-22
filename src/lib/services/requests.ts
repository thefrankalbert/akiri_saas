// ============================================
// Shipment Requests Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { ShipmentRequest, ApiResponse, RequestStatus } from '@/types';
import type { CreateRequestInput } from '@/lib/validations';
import { PLATFORM_FEE_PERCENT } from '@/constants';
import { capturePayment, refundPayment } from './transactions';
import { createNotification } from './notifications';

// Valid state transitions: each key lists the statuses it can transition FROM
const VALID_TRANSITIONS: Record<string, RequestStatus[]> = {
  accepted: ['pending'],
  paid: ['accepted'], // Set by Stripe webhook only
  collected: ['paid'],
  in_transit: ['collected'],
  delivered: ['in_transit'],
  confirmed: ['delivered', 'disputed'], // disputed → confirmed = release payment
  disputed: ['paid', 'collected', 'in_transit', 'delivered'],
  cancelled: ['pending', 'accepted', 'disputed'], // disputed → cancelled = refund
};

/**
 * Validate that a state transition is allowed
 */
function isValidTransition(from: RequestStatus, to: RequestStatus): boolean {
  const allowed = VALID_TRANSITIONS[to];
  return allowed ? allowed.includes(from) : false;
}

/**
 * Generate a 6-digit confirmation code
 */
function generateConfirmationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a new shipment request
 */
export async function createRequest(
  senderId: string,
  input: CreateRequestInput
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  // Fetch the listing to calculate price
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', input.listing_id)
    .eq('status', 'active')
    .single();

  if (listingError || !listing) {
    return { data: null, error: 'Annonce introuvable ou inactive', status: 404 };
  }

  // Check available weight accounting for pending/active requests (prevent overbooking)
  const { data: activeRequests } = await supabase
    .from('shipment_requests')
    .select('weight_kg')
    .eq('listing_id', input.listing_id)
    .in('status', ['pending', 'accepted', 'paid', 'collected', 'in_transit', 'delivered']);

  const reservedKg = (activeRequests || []).reduce((sum, r) => sum + Number(r.weight_kg), 0);
  const effectiveAvailable = listing.available_kg - reservedKg;

  if (input.weight_kg > effectiveAvailable) {
    return {
      data: null,
      error:
        effectiveAvailable <= 0
          ? 'Tous les kilos sont d\u00e9j\u00e0 r\u00e9serv\u00e9s pour cette annonce'
          : `Seulement ${effectiveAvailable}kg disponibles (${reservedKg}kg d\u00e9j\u00e0 r\u00e9serv\u00e9s)`,
      status: 400,
    };
  }

  // Prevent self-request
  if (listing.traveler_id === senderId) {
    return {
      data: null,
      error: 'Vous ne pouvez pas envoyer une demande sur votre propre annonce',
      status: 400,
    };
  }

  // Calculate total price
  const totalPrice = Math.round(input.weight_kg * listing.price_per_kg * 100) / 100;

  const { data, error } = await supabase
    .from('shipment_requests')
    .insert({
      listing_id: input.listing_id,
      sender_id: senderId,
      weight_kg: input.weight_kg,
      item_description: input.item_description,
      item_photos: input.item_photos || [],
      special_instructions: input.special_instructions || null,
      status: 'pending',
      total_price: totalPrice,
      confirmation_code: generateConfirmationCode(),
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Notify the traveler about the new request
  await createNotification(
    listing.traveler_id,
    'new_request',
    'Nouvelle demande de transport',
    `Vous avez re\u00e7u une nouvelle demande pour ${input.weight_kg}kg sur votre annonce ${listing.departure_city} \u2192 ${listing.arrival_city}.`,
    { request_id: data.id, listing_id: listing.id }
  );

  return { data: data as ShipmentRequest, error: null, status: 201 };
}

/**
 * Accept a shipment request (by traveler)
 */
export async function acceptRequest(
  requestId: string,
  travelerId: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  // Verify the request belongs to a listing owned by this traveler
  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable', status: 404 };
  }

  if (request.listing.traveler_id !== travelerId) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Notify the sender that their request was accepted
  await createNotification(
    request.sender_id,
    'request_accepted',
    'Demande accept\u00e9e',
    `Votre demande de transport a \u00e9t\u00e9 accept\u00e9e. Proc\u00e9dez au paiement pour confirmer.`,
    { request_id: requestId, listing_id: request.listing_id }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Mark parcel as collected by traveler
 */
export async function collectParcel(
  requestId: string,
  travelerId: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable', status: 404 };
  }

  if (request.listing.traveler_id !== travelerId) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  if (!isValidTransition(request.status, 'collected')) {
    return {
      data: null,
      error: `Impossible de passer de "${request.status}" \u00e0 "collected"`,
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'collected', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Notify sender
  await createNotification(
    request.sender_id,
    'parcel_collected',
    'Colis collect\u00e9',
    'Le voyageur a collect\u00e9 votre colis. Le transport va commencer.',
    { request_id: requestId }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Mark parcel as in transit
 */
export async function markInTransit(
  requestId: string,
  travelerId: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable', status: 404 };
  }

  if (request.listing.traveler_id !== travelerId) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  if (!isValidTransition(request.status, 'in_transit')) {
    return {
      data: null,
      error: `Impossible de passer de "${request.status}" \u00e0 "in_transit"`,
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'in_transit', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Notify sender
  await createNotification(
    request.sender_id,
    'parcel_delivered',
    'Colis en transit',
    'Votre colis est en cours de transport vers la destination.',
    { request_id: requestId }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Mark parcel as delivered (by traveler)
 */
export async function markDelivered(
  requestId: string,
  travelerId: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable', status: 404 };
  }

  if (request.listing.traveler_id !== travelerId) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  if (!isValidTransition(request.status, 'delivered')) {
    return {
      data: null,
      error: `Impossible de passer de "${request.status}" \u00e0 "delivered"`,
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Notify sender that parcel has been delivered — they need to confirm with code
  await createNotification(
    request.sender_id,
    'parcel_delivered',
    'Colis livr\u00e9',
    'Le voyageur indique que votre colis a \u00e9t\u00e9 livr\u00e9. Confirmez la r\u00e9ception avec votre code de confirmation.',
    { request_id: requestId }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Confirm delivery with code (by sender)
 * This triggers payment capture (escrow release)
 */
export async function confirmDelivery(
  requestId: string,
  userId: string,
  confirmationCode: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .eq('status', 'delivered')
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable ou pas encore livr\u00e9e', status: 404 };
  }

  // Verify the sender is confirming
  if (request.sender_id !== userId) {
    return { data: null, error: "Seul l'exp\u00e9diteur peut confirmer la livraison", status: 403 };
  }

  // Verify confirmation code
  if (request.confirmation_code !== confirmationCode) {
    return { data: null, error: 'Code de confirmation incorrect', status: 400 };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Release escrow payment to traveler
  await capturePayment(requestId);

  // Notify traveler that delivery is confirmed and payment released
  await createNotification(
    request.listing.traveler_id,
    'delivery_confirmed',
    'Livraison confirm\u00e9e',
    "L'exp\u00e9diteur a confirm\u00e9 la r\u00e9ception. Votre paiement va \u00eatre lib\u00e9r\u00e9.",
    { request_id: requestId }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Cancel a request (by sender if pending/accepted, or by traveler if pending)
 */
export async function cancelRequest(
  requestId: string,
  userId: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable', status: 404 };
  }

  // Verify user is either sender or traveler
  const isSender = request.sender_id === userId;
  const isTraveler = request.listing.traveler_id === userId;

  if (!isSender && !isTraveler) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  if (!isValidTransition(request.status, 'cancelled')) {
    return {
      data: null,
      error: `Impossible d'annuler une demande au statut "${request.status}"`,
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Restore kg to listing if request was accepted (kg were decremented by DB trigger)
  if (request.status === 'accepted') {
    await supabase
      .from('listings')
      .update({
        available_kg: request.listing.available_kg + request.weight_kg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.listing_id);
  }

  // Notify the other party
  const notifyUserId = isSender ? request.listing.traveler_id : request.sender_id;
  await createNotification(
    notifyUserId,
    'request_accepted', // Closest type — ideally we'd add 'request_cancelled'
    'Demande annul\u00e9e',
    isSender
      ? "L'exp\u00e9diteur a annul\u00e9 sa demande de transport."
      : 'Le voyageur a annul\u00e9 la demande de transport.',
    { request_id: requestId }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Open a dispute on a request
 */
export async function openDispute(
  requestId: string,
  userId: string,
  reason: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable', status: 404 };
  }

  // Verify user is either sender or traveler
  const isSender = request.sender_id === userId;
  const isTraveler = request.listing.traveler_id === userId;

  if (!isSender && !isTraveler) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  if (!isValidTransition(request.status, 'disputed')) {
    return {
      data: null,
      error: `Impossible d'ouvrir un litige au statut "${request.status}"`,
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({
      status: 'disputed',
      special_instructions: `[LITIGE] ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Notify the other party
  const notifyUserId = isSender ? request.listing.traveler_id : request.sender_id;
  await createNotification(
    notifyUserId,
    'request_accepted', // Closest type
    'Litige ouvert',
    `Un litige a \u00e9t\u00e9 ouvert sur votre demande de transport. Raison : ${reason}`,
    { request_id: requestId, reason }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Get requests for a specific listing
 */
/**
 * Resolve a dispute — either refund (cancel) or release payment (confirm)
 * Can be called by either party. In production, an admin panel would handle this.
 */
export async function resolveDispute(
  requestId: string,
  userId: string,
  resolution: 'refund' | 'release'
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .eq('status', 'disputed')
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Litige introuvable', status: 404 };
  }

  const isSender = request.sender_id === userId;
  const isTraveler = request.listing.traveler_id === userId;

  if (!isSender && !isTraveler) {
    return { data: null, error: 'Non autoris\u00e9', status: 403 };
  }

  if (resolution === 'refund') {
    // Refund the sender — cancel the request
    await refundPayment(requestId, request.sender_id);

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) return { data: null, error: error.message, status: 400 };

    // Restore kg
    await supabase
      .from('listings')
      .update({
        available_kg: request.listing.available_kg + request.weight_kg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.listing_id);

    // Notify both parties
    await createNotification(
      request.sender_id,
      'delivery_confirmed',
      'Litige r\u00e9solu — Remboursement',
      'Le litige a \u00e9t\u00e9 r\u00e9solu en votre faveur. Vous serez rembours\u00e9.',
      { request_id: requestId }
    );
    await createNotification(
      request.listing.traveler_id,
      'delivery_confirmed',
      'Litige r\u00e9solu — Remboursement',
      "Le litige a \u00e9t\u00e9 r\u00e9solu. L'exp\u00e9diteur sera rembours\u00e9.",
      { request_id: requestId }
    );

    return { data: data as ShipmentRequest, error: null, status: 200 };
  }

  // resolution === 'release' — release payment to traveler
  await capturePayment(requestId);

  const { data, error } = await supabase
    .from('shipment_requests')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) return { data: null, error: error.message, status: 400 };

  await createNotification(
    request.listing.traveler_id,
    'delivery_confirmed',
    'Litige r\u00e9solu — Paiement lib\u00e9r\u00e9',
    'Le litige a \u00e9t\u00e9 r\u00e9solu en votre faveur. Votre paiement va \u00eatre lib\u00e9r\u00e9.',
    { request_id: requestId }
  );
  await createNotification(
    request.sender_id,
    'delivery_confirmed',
    'Litige r\u00e9solu — Paiement lib\u00e9r\u00e9',
    'Le litige a \u00e9t\u00e9 r\u00e9solu. Le paiement a \u00e9t\u00e9 lib\u00e9r\u00e9 au voyageur.',
    { request_id: requestId }
  );

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

export async function getRequestsByListing(listingId: string): Promise<ShipmentRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shipment_requests')
    .select('*, sender:profiles!sender_id(*)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data as ShipmentRequest[]) || [];
}

/**
 * Get requests by sender
 */
export async function getRequestsBySender(senderId: string): Promise<ShipmentRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*, traveler:profiles!traveler_id(*))')
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data as ShipmentRequest[]) || [];
}

/**
 * Calculate platform fee for a request
 */
export function calculateFee(totalPrice: number): {
  platformFee: number;
  travelerPayout: number;
} {
  const platformFee = Math.round(totalPrice * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const travelerPayout = Math.round((totalPrice - platformFee) * 100) / 100;
  return { platformFee, travelerPayout };
}
