// ============================================
// Offers Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { CarryOffer, ApiResponse } from '@/types';
import type { CreateCarryOfferInput } from '@/lib/validations';

/**
 * Get all carry offers for a parcel with traveler profile and listing
 */
export async function getOffersByParcel(parcelId: string): Promise<CarryOffer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('carry_offers')
    .select('*, traveler:profiles!traveler_id(*), listing:listings!listing_id(*)')
    .eq('parcel_id', parcelId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data as CarryOffer[]) || [];
}

/**
 * Create a carry offer on a parcel posting
 */
export async function createOffer(
  travelerId: string,
  input: CreateCarryOfferInput
): Promise<ApiResponse<CarryOffer>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('carry_offers')
    .insert({
      traveler_id: travelerId,
      ...input,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as CarryOffer, error: null, status: 201 };
}

/**
 * Accept a carry offer — verify sender owns the parcel, accept the offer,
 * reject all other pending offers for the same parcel, update parcel status to 'matched'
 */
export async function acceptOffer(
  offerId: string,
  senderId: string
): Promise<ApiResponse<CarryOffer>> {
  const supabase = await createClient();

  // Fetch the offer with its parcel to verify ownership
  const { data: offer, error: fetchError } = await supabase
    .from('carry_offers')
    .select('*, parcel:parcel_postings!parcel_id(*)')
    .eq('id', offerId)
    .single();

  if (fetchError || !offer) {
    return { data: null, error: 'Offre introuvable', status: 404 };
  }

  // Verify the sender owns the parcel
  const parcel = (offer as CarryOffer).parcel;
  if (!parcel || parcel.sender_id !== senderId) {
    return { data: null, error: 'Non autorise', status: 403 };
  }

  // Accept this offer
  const { data: accepted, error: acceptError } = await supabase
    .from('carry_offers')
    .update({ status: 'accepted' })
    .eq('id', offerId)
    .select()
    .single();

  if (acceptError) {
    return { data: null, error: acceptError.message, status: 400 };
  }

  // Reject all other pending offers for the same parcel
  await supabase
    .from('carry_offers')
    .update({ status: 'rejected' })
    .eq('parcel_id', (offer as CarryOffer).parcel_id)
    .eq('status', 'pending')
    .neq('id', offerId);

  // Update parcel status to 'matched'
  await supabase
    .from('parcel_postings')
    .update({ status: 'matched', updated_at: new Date().toISOString() })
    .eq('id', (offer as CarryOffer).parcel_id);

  return { data: accepted as CarryOffer, error: null, status: 200 };
}

/**
 * Reject a carry offer — verify sender owns the parcel, reject the offer
 */
export async function rejectOffer(
  offerId: string,
  senderId: string
): Promise<ApiResponse<CarryOffer>> {
  const supabase = await createClient();

  // Fetch the offer with its parcel to verify ownership
  const { data: offer, error: fetchError } = await supabase
    .from('carry_offers')
    .select('*, parcel:parcel_postings!parcel_id(*)')
    .eq('id', offerId)
    .single();

  if (fetchError || !offer) {
    return { data: null, error: 'Offre introuvable', status: 404 };
  }

  // Verify the sender owns the parcel
  const parcel = (offer as CarryOffer).parcel;
  if (!parcel || parcel.sender_id !== senderId) {
    return { data: null, error: 'Non autorise', status: 403 };
  }

  // Reject the offer
  const { data: rejected, error: rejectError } = await supabase
    .from('carry_offers')
    .update({ status: 'rejected' })
    .eq('id', offerId)
    .select()
    .single();

  if (rejectError) {
    return { data: null, error: rejectError.message, status: 400 };
  }

  return { data: rejected as CarryOffer, error: null, status: 200 };
}
