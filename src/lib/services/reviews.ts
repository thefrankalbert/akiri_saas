// ============================================
// Reviews Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { Review, ApiResponse } from '@/types';
import type { CreateReviewInput } from '@/lib/validations';
import { createNotification } from './notifications';

/**
 * Create a review
 */
export async function createReview(
  reviewerId: string,
  input: CreateReviewInput
): Promise<ApiResponse<Review>> {
  const supabase = await createClient();

  // Verify the request is confirmed (delivery completed) and get listing info
  const { data: request, error: reqError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!inner(traveler_id)')
    .eq('id', input.request_id)
    .eq('status', 'confirmed')
    .single();

  if (reqError || !request) {
    return {
      data: null,
      error: 'La livraison doit être confirmée avant de laisser un avis',
      status: 400,
    };
  }

  // Verify the reviewer is part of the transaction (sender or traveler)
  const travelerId = (request.listing as { traveler_id: string })?.traveler_id;
  const isParticipant = request.sender_id === reviewerId || travelerId === reviewerId;

  if (!isParticipant) {
    return { data: null, error: 'Non autorisé', status: 403 };
  }

  // Check for existing review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('request_id', input.request_id)
    .single();

  if (existing) {
    return {
      data: null,
      error: 'Vous avez déjà laissé un avis pour cette transaction',
      status: 409,
    };
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
    return { data: null, error: error.message, status: 400 };
  }

  // Update the reviewed user's average rating
  await updateUserRating(input.reviewed_id);

  // Notify the reviewed user
  await createNotification(
    input.reviewed_id,
    'new_review',
    'Nouvel avis',
    `Vous avez re\u00e7u un avis de ${input.rating}/5.`,
    { request_id: input.request_id, rating: input.rating }
  );

  return { data: data as Review, error: null, status: 201 };
}

/**
 * Get reviews for a user
 */
export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(*)')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data as Review[]) || [];
}

/**
 * Update user's average rating after a new review
 */
async function updateUserRating(userId: string): Promise<void> {
  const supabase = await createClient();

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
