// ============================================
// Reviews Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Review } from '@/types';
import type { CreateReviewInput } from '@/lib/validations';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import { createNotification } from './notifications';

export function createReviewsService(supabase: SupabaseClient) {
  /**
   * Update user's average rating after a new review
   */
  async function updateUserRating(userId: string): Promise<void> {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', userId);

    if (!reviews || reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from('profiles')
      .update({
        rating: Math.round(avgRating * 10) / 10,
        total_reviews: reviews.length,
      })
      .eq('user_id', userId);
  }

  return {
    /**
     * Create a review
     */
    async createReview(reviewerId: string, input: CreateReviewInput): Promise<Review> {
      // Verify the request is confirmed (delivery completed) and get listing info
      const { data: request, error: reqError } = await supabase
        .from('shipment_requests')
        .select('*, listing:listings!inner(traveler_id)')
        .eq('id', input.request_id)
        .eq('status', 'confirmed')
        .single();

      if (reqError || !request) {
        throw new ServiceError(
          'La livraison doit être confirmée avant de laisser un avis',
          'VALIDATION'
        );
      }

      // Verify the reviewer is part of the transaction (sender or traveler)
      const travelerId = (request.listing as { traveler_id: string })?.traveler_id;
      const isParticipant = request.sender_id === reviewerId || travelerId === reviewerId;

      if (!isParticipant) {
        throw new ServiceError('Non autorisé', 'AUTH');
      }

      // Check for existing review
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewer_id', reviewerId)
        .eq('request_id', input.request_id)
        .single();

      if (existing) {
        throw new ServiceError('Vous avez déjà laissé un avis pour cette transaction', 'CONFLICT');
      }

      // Create review
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: reviewerId,
          reviewed_id: input.reviewed_id,
          request_id: input.request_id,
          rating: input.rating,
          comment: input.comment || null,
        })
        .select('*, reviewer:profiles!reviewer_id(*)')
        .single();

      if (error) {
        logger.error('Failed to create review', { error: error.message });
        throw new ServiceError(error.message, 'VALIDATION');
      }

      // Update the reviewed user's average rating
      await updateUserRating(input.reviewed_id);

      // Notify the reviewed user
      await createNotification(
        input.reviewed_id,
        'new_review',
        'Nouvel avis',
        `Vous avez reçu un avis de ${input.rating}/5.`,
        { request_id: input.request_id, rating: input.rating }
      );

      return data as Review;
    },

    /**
     * Get reviews for a user
     */
    async getReviewsByUser(userId: string): Promise<Review[]> {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviewer_id(*)')
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch reviews', { error: error.message, userId });
        throw new ServiceError(error.message, 'INTERNAL');
      }

      return (data as Review[]) || [];
    },
  };
}
