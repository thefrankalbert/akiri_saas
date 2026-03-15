// ============================================
// Offers Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CarryOffer } from '@/types';
import type { CreateCarryOfferInput } from '@/lib/validations';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import { createNotification } from './notifications';

export function createOffersService(supabase: SupabaseClient) {
  return {
    /**
     * Get all carry offers for a parcel with traveler profile and listing
     */
    async getOffersByParcel(parcelId: string): Promise<CarryOffer[]> {
      const { data, error } = await supabase
        .from('carry_offers')
        .select('*, traveler:profiles!traveler_id(*), listing:listings!listing_id(*)')
        .eq('parcel_id', parcelId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('getOffersByParcel: erreur lors de la récupération', error);
        throw new ServiceError('Erreur lors de la récupération des offres', 'INTERNAL', error);
      }

      return (data as CarryOffer[]) || [];
    },

    /**
     * Create a carry offer on a parcel posting
     */
    async createOffer(travelerId: string, input: CreateCarryOfferInput): Promise<CarryOffer> {
      // Fetch the parcel to get sender_id for notification and ownership check
      const { data: parcel } = await supabase
        .from('parcel_postings')
        .select('sender_id, departure_city, arrival_city')
        .eq('id', input.parcel_id)
        .single();

      // Prevent travelers from offering on their own parcels
      if (parcel && parcel.sender_id === travelerId) {
        throw new ServiceError(
          'Vous ne pouvez pas faire une offre sur votre propre colis',
          'CONFLICT'
        );
      }

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
        logger.error('createOffer: erreur lors de la création', error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }

      // Notify parcel owner about the new offer
      if (parcel) {
        await createNotification(
          parcel.sender_id,
          'new_request',
          'Nouvelle offre de transport',
          `Un voyageur propose de transporter votre colis ${parcel.departure_city} → ${parcel.arrival_city} pour ${input.proposed_price}€.`,
          { parcel_id: input.parcel_id, offer_id: data.id }
        );
      }

      return data as CarryOffer;
    },

    /**
     * Accept a carry offer — verify sender owns the parcel, accept the offer,
     * reject all other pending offers for the same parcel, update parcel status to 'matched'
     */
    async acceptOffer(offerId: string, senderId: string): Promise<CarryOffer> {
      // Fetch the offer with its parcel to verify ownership
      const { data: offer, error: fetchError } = await supabase
        .from('carry_offers')
        .select('*, parcel:parcel_postings!parcel_id(*)')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        throw new ServiceError('Offre introuvable', 'NOT_FOUND');
      }

      // Verify the sender owns the parcel
      const parcel = (offer as CarryOffer).parcel;
      if (!parcel || parcel.sender_id !== senderId) {
        throw new ServiceError('Non autorisé', 'AUTH');
      }

      // Accept this offer, reject siblings, and update parcel status in parallel
      const [acceptResult] = await Promise.all([
        supabase
          .from('carry_offers')
          .update({ status: 'accepted' })
          .eq('id', offerId)
          .select()
          .single(),
        supabase
          .from('carry_offers')
          .update({ status: 'rejected' })
          .eq('parcel_id', (offer as CarryOffer).parcel_id)
          .eq('status', 'pending')
          .neq('id', offerId),
        supabase
          .from('parcel_postings')
          .update({ status: 'matched', updated_at: new Date().toISOString() })
          .eq('id', (offer as CarryOffer).parcel_id),
      ]);

      const { data: accepted, error: acceptError } = acceptResult;

      if (acceptError) {
        logger.error("acceptOffer: erreur lors de l'acceptation", acceptError);
        throw new ServiceError(acceptError.message, 'INTERNAL', acceptError);
      }

      // Notify the traveler their offer was accepted
      await createNotification(
        (offer as CarryOffer).traveler_id,
        'request_accepted',
        'Offre acceptée',
        "Votre offre de transport a été acceptée par l'expéditeur.",
        { parcel_id: (offer as CarryOffer).parcel_id, offer_id: offerId }
      );

      return accepted as CarryOffer;
    },

    /**
     * Reject a carry offer — verify sender owns the parcel, reject the offer
     */
    async rejectOffer(offerId: string, senderId: string): Promise<CarryOffer> {
      // Fetch the offer with its parcel to verify ownership
      const { data: offer, error: fetchError } = await supabase
        .from('carry_offers')
        .select('*, parcel:parcel_postings!parcel_id(*)')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        throw new ServiceError('Offre introuvable', 'NOT_FOUND');
      }

      // Verify the sender owns the parcel
      const parcel = (offer as CarryOffer).parcel;
      if (!parcel || parcel.sender_id !== senderId) {
        throw new ServiceError('Non autorisé', 'AUTH');
      }

      // Reject the offer
      const { data: rejected, error: rejectError } = await supabase
        .from('carry_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId)
        .select()
        .single();

      if (rejectError) {
        logger.error('rejectOffer: erreur lors du rejet', rejectError);
        throw new ServiceError(rejectError.message, 'INTERNAL', rejectError);
      }

      return rejected as CarryOffer;
    },
  };
}
