// ============================================
// Shipment Requests Service — Server-side business logic
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import type { ShipmentRequest, RequestStatus } from '@/types';
import type { CreateRequestInput } from '@/lib/validations';
import { PLATFORM_FEE_PERCENT } from '@/constants';
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
 * Callbacks for cross-service operations (payment capture/refund).
 * Allows the request service to remain decoupled from the transaction service.
 */
export interface RequestServiceDeps {
  capturePayment?: (requestId: string) => Promise<unknown>;
  refundPayment?: (requestId: string, userId: string) => Promise<unknown>;
}

export function createRequestService(
  supabase: SupabaseClient,
  _adminSupabase: SupabaseClient,
  deps: RequestServiceDeps = {}
) {
  /**
   * Create a new shipment request.
   */
  async function createRequest(
    senderId: string,
    input: CreateRequestInput
  ): Promise<ShipmentRequest> {
    // Fetch the listing to calculate price
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', input.listing_id)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      throw new ServiceError('Annonce introuvable ou inactive', 'NOT_FOUND');
    }

    // Prevent self-request
    if (listing.traveler_id === senderId) {
      throw new ServiceError(
        'Vous ne pouvez pas envoyer une demande sur votre propre annonce',
        'CONFLICT'
      );
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
      throw new ServiceError(
        effectiveAvailable <= 0
          ? 'Tous les kilos sont déjà réservés pour cette annonce'
          : `Seulement ${effectiveAvailable}kg disponibles (${reservedKg}kg déjà réservés)`,
        'VALIDATION'
      );
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
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Notify the traveler about the new request
    await createNotification(
      listing.traveler_id,
      'new_request',
      'Nouvelle demande de transport',
      `Vous avez reçu une nouvelle demande pour ${input.weight_kg}kg sur votre annonce ${listing.departure_city} → ${listing.arrival_city}.`,
      { request_id: data.id, listing_id: listing.id }
    );

    return data as ShipmentRequest;
  }

  /**
   * Accept a shipment request (by traveler).
   */
  async function acceptRequest(requestId: string, travelerId: string): Promise<ShipmentRequest> {
    // Verify the request belongs to a listing owned by this traveler
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable', 'NOT_FOUND');
    }

    if (request.listing.traveler_id !== travelerId) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Notify the sender that their request was accepted
    await createNotification(
      request.sender_id,
      'request_accepted',
      'Demande acceptée',
      `Votre demande de transport a été acceptée. Procédez au paiement pour confirmer.`,
      { request_id: requestId, listing_id: request.listing_id }
    );

    return data as ShipmentRequest;
  }

  /**
   * Mark parcel as collected by traveler.
   */
  async function collectParcel(requestId: string, travelerId: string): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable', 'NOT_FOUND');
    }

    if (request.listing.traveler_id !== travelerId) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    if (!isValidTransition(request.status, 'collected')) {
      throw new ServiceError(
        `Impossible de passer de "${request.status}" à "collected"`,
        'VALIDATION'
      );
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'collected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Notify sender
    await createNotification(
      request.sender_id,
      'parcel_collected',
      'Colis collecté',
      'Le voyageur a collecté votre colis. Le transport va commencer.',
      { request_id: requestId }
    );

    return data as ShipmentRequest;
  }

  /**
   * Mark parcel as in transit.
   */
  async function markInTransit(requestId: string, travelerId: string): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable', 'NOT_FOUND');
    }

    if (request.listing.traveler_id !== travelerId) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    if (!isValidTransition(request.status, 'in_transit')) {
      throw new ServiceError(
        `Impossible de passer de "${request.status}" à "in_transit"`,
        'VALIDATION'
      );
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'in_transit', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Notify sender
    await createNotification(
      request.sender_id,
      'parcel_delivered',
      'Colis en transit',
      'Votre colis est en cours de transport vers la destination.',
      { request_id: requestId }
    );

    return data as ShipmentRequest;
  }

  /**
   * Mark parcel as delivered (by traveler).
   */
  async function markDelivered(requestId: string, travelerId: string): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable', 'NOT_FOUND');
    }

    if (request.listing.traveler_id !== travelerId) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    if (!isValidTransition(request.status, 'delivered')) {
      throw new ServiceError(
        `Impossible de passer de "${request.status}" à "delivered"`,
        'VALIDATION'
      );
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Notify sender that parcel has been delivered — they need to confirm with code
    await createNotification(
      request.sender_id,
      'parcel_delivered',
      'Colis livré',
      'Le voyageur indique que votre colis a été livré. Confirmez la réception avec votre code de confirmation.',
      { request_id: requestId }
    );

    return data as ShipmentRequest;
  }

  /**
   * Confirm delivery with code (by sender).
   * This triggers payment capture (escrow release).
   */
  async function confirmDelivery(
    requestId: string,
    userId: string,
    confirmationCode: string
  ): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .eq('status', 'delivered')
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable ou pas encore livrée', 'NOT_FOUND');
    }

    // Verify the sender is confirming
    if (request.sender_id !== userId) {
      throw new ServiceError("Seul l'expéditeur peut confirmer la livraison", 'AUTH');
    }

    // Verify confirmation code
    if (request.confirmation_code !== confirmationCode) {
      throw new ServiceError('Code de confirmation incorrect', 'VALIDATION');
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Release escrow payment to traveler
    if (deps.capturePayment) {
      try {
        await deps.capturePayment(requestId);
      } catch (captureError) {
        logger.error('confirmDelivery: capturePayment failed', captureError, { requestId });
      }
    }

    // Notify traveler that delivery is confirmed and payment released
    await createNotification(
      request.listing.traveler_id,
      'delivery_confirmed',
      'Livraison confirmée',
      "L'expéditeur a confirmé la réception. Votre paiement va être libéré.",
      { request_id: requestId }
    );

    return data as ShipmentRequest;
  }

  /**
   * Cancel a request (by sender if pending/accepted, or by traveler if pending).
   */
  async function cancelRequest(requestId: string, userId: string): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable', 'NOT_FOUND');
    }

    // Verify user is either sender or traveler
    const isSender = request.sender_id === userId;
    const isTraveler = request.listing.traveler_id === userId;

    if (!isSender && !isTraveler) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    if (!isValidTransition(request.status, 'cancelled')) {
      throw new ServiceError(
        `Impossible d'annuler une demande au statut "${request.status}"`,
        'CONFLICT'
      );
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
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
      'Demande annulée',
      isSender
        ? "L'expéditeur a annulé sa demande de transport."
        : 'Le voyageur a annulé la demande de transport.',
      { request_id: requestId }
    );

    return data as ShipmentRequest;
  }

  /**
   * Open a dispute on a request.
   */
  async function openDispute(
    requestId: string,
    userId: string,
    reason: string
  ): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Demande introuvable', 'NOT_FOUND');
    }

    // Verify user is either sender or traveler
    const isSender = request.sender_id === userId;
    const isTraveler = request.listing.traveler_id === userId;

    if (!isSender && !isTraveler) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    if (!isValidTransition(request.status, 'disputed')) {
      throw new ServiceError(
        `Impossible d'ouvrir un litige au statut "${request.status}"`,
        'VALIDATION'
      );
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
      throw new ServiceError(error.message, 'VALIDATION');
    }

    // Notify the other party
    const notifyUserId = isSender ? request.listing.traveler_id : request.sender_id;
    await createNotification(
      notifyUserId,
      'request_accepted', // Closest type
      'Litige ouvert',
      `Un litige a été ouvert sur votre demande de transport. Raison : ${reason}`,
      { request_id: requestId, reason }
    );

    return data as ShipmentRequest;
  }

  /**
   * Resolve a dispute — either refund (cancel) or release payment (confirm).
   * Can be called by either party. In production, an admin panel would handle this.
   */
  async function resolveDispute(
    requestId: string,
    userId: string,
    resolution: 'refund' | 'release'
  ): Promise<ShipmentRequest> {
    const { data: request, error: fetchError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .eq('status', 'disputed')
      .single();

    if (fetchError || !request) {
      throw new ServiceError('Litige introuvable', 'NOT_FOUND');
    }

    const isSender = request.sender_id === userId;
    const isTraveler = request.listing.traveler_id === userId;

    if (!isSender && !isTraveler) {
      throw new ServiceError('Non autorisé', 'AUTH');
    }

    if (resolution === 'refund') {
      // Refund the sender — cancel the request
      if (deps.refundPayment) {
        try {
          await deps.refundPayment(requestId, request.sender_id);
        } catch (refundError) {
          logger.error('resolveDispute: refundPayment failed', refundError, { requestId });
        }
      }

      const { data, error } = await supabase
        .from('shipment_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw new ServiceError(error.message, 'VALIDATION');

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
        'Litige résolu — Remboursement',
        'Le litige a été résolu en votre faveur. Vous serez remboursé.',
        { request_id: requestId }
      );
      await createNotification(
        request.listing.traveler_id,
        'delivery_confirmed',
        'Litige résolu — Remboursement',
        "Le litige a été résolu. L'expéditeur sera remboursé.",
        { request_id: requestId }
      );

      return data as ShipmentRequest;
    }

    // resolution === 'release' — release payment to traveler
    if (deps.capturePayment) {
      try {
        await deps.capturePayment(requestId);
      } catch (captureError) {
        logger.error('resolveDispute: capturePayment failed', captureError, { requestId });
      }
    }

    const { data, error } = await supabase
      .from('shipment_requests')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw new ServiceError(error.message, 'VALIDATION');

    await createNotification(
      request.listing.traveler_id,
      'delivery_confirmed',
      'Litige résolu — Paiement libéré',
      'Le litige a été résolu en votre faveur. Votre paiement va être libéré.',
      { request_id: requestId }
    );
    await createNotification(
      request.sender_id,
      'delivery_confirmed',
      'Litige résolu — Paiement libéré',
      'Le litige a été résolu. Le paiement a été libéré au voyageur.',
      { request_id: requestId }
    );

    return data as ShipmentRequest;
  }

  /**
   * Get requests for a specific listing.
   */
  async function getRequestsByListing(listingId: string): Promise<ShipmentRequest[]> {
    const { data, error } = await supabase
      .from('shipment_requests')
      .select('*, sender:profiles!sender_id(*)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data as ShipmentRequest[]) || [];
  }

  /**
   * Get requests by sender.
   */
  async function getRequestsBySender(senderId: string): Promise<ShipmentRequest[]> {
    const { data, error } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*, traveler:profiles!traveler_id(*))')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data as ShipmentRequest[]) || [];
  }

  return {
    createRequest,
    acceptRequest,
    collectParcel,
    markInTransit,
    markDelivered,
    confirmDelivery,
    cancelRequest,
    openDispute,
    resolveDispute,
    getRequestsByListing,
    getRequestsBySender,
  };
}

// ============================================
// Pure utility function — standalone export
// ============================================

export function calculateFee(totalPrice: number): {
  platformFee: number;
  travelerPayout: number;
} {
  const platformFee = Math.round(totalPrice * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const travelerPayout = Math.round((totalPrice - platformFee) * 100) / 100;
  return { platformFee, travelerPayout };
}
