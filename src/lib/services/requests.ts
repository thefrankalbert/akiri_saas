// ============================================
// Shipment Requests Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { ShipmentRequest, ApiResponse } from '@/types';
import type { CreateRequestInput } from '@/lib/validations';
import { PLATFORM_FEE_PERCENT } from '@/constants';

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

  // Check available weight
  if (input.weight_kg > listing.available_kg) {
    return {
      data: null,
      error: `Poids demandé (${input.weight_kg}kg) supérieur aux kilos disponibles (${listing.available_kg}kg)`,
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
      item_photos: [],
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
    return { data: null, error: 'Non autorisé', status: 403 };
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

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Confirm delivery with code
 */
export async function confirmDelivery(
  requestId: string,
  userId: string,
  confirmationCode: string
): Promise<ApiResponse<ShipmentRequest>> {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('shipment_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'delivered')
    .single();

  if (fetchError || !request) {
    return { data: null, error: 'Demande introuvable ou pas encore livrée', status: 404 };
  }

  // Verify the sender is confirming
  if (request.sender_id !== userId) {
    return { data: null, error: "Seul l'expéditeur peut confirmer la livraison", status: 403 };
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

  return { data: data as ShipmentRequest, error: null, status: 200 };
}

/**
 * Get requests for a specific listing
 */
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
