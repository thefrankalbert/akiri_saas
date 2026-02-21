// ============================================
// Matching Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { Listing, ParcelPosting } from '@/types';

interface MatchResult {
  listing: Listing;
  score: number;
}

interface ParcelMatchResult {
  parcel: ParcelPosting;
  score: number;
}

/**
 * Find the top 5 active listings matching a parcel's corridor.
 *
 * Scoring:
 * - Same city departure: +3
 * - Same city arrival: +3
 * - Same corridor (country-level): +1
 * - Weight capacity >= parcel weight: +2
 * - Date match (listing departure before desired date): +2
 * - Budget match (price_per_kg <= budget_per_kg): +1
 */
export async function findMatchingListings(parcel: ParcelPosting): Promise<MatchResult[]> {
  const supabase = await createClient();

  // Fetch active listings in the same corridor (country-level)
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*, traveler:profiles!traveler_id(*)')
    .eq('status', 'active')
    .eq('departure_country', parcel.departure_country)
    .eq('arrival_country', parcel.arrival_country)
    .gte('departure_date', new Date().toISOString());

  if (error || !listings) {
    return [];
  }

  const scored: MatchResult[] = (listings as Listing[]).map((listing) => {
    let score = 1; // Base score for same corridor (country-level)

    // Same city departure
    if (listing.departure_city.toLowerCase() === parcel.departure_city.toLowerCase()) {
      score += 3;
    }

    // Same city arrival
    if (listing.arrival_city.toLowerCase() === parcel.arrival_city.toLowerCase()) {
      score += 3;
    }

    // Weight capacity
    if (listing.available_kg >= parcel.weight_kg) {
      score += 2;
    }

    // Date match
    if (parcel.desired_date && listing.departure_date <= parcel.desired_date) {
      score += 2;
    }

    // Budget match
    if (parcel.budget_per_kg && listing.price_per_kg <= parcel.budget_per_kg) {
      score += 1;
    }

    return { listing, score };
  });

  // Sort by score descending and return top 5
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

/**
 * Find the top 5 active parcels matching a listing's corridor (inverse matching).
 *
 * Scoring:
 * - Same city departure: +3
 * - Same city arrival: +3
 * - Same corridor (country-level): +1
 * - Weight capacity >= parcel weight: +2
 * - Date match (parcel desired_date >= listing departure): +2
 * - Budget match (budget_per_kg >= price_per_kg): +1
 */
export async function findMatchingParcels(listing: Listing): Promise<ParcelMatchResult[]> {
  const supabase = await createClient();

  // Fetch active parcels in the same corridor (country-level)
  const { data: parcels, error } = await supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)')
    .eq('status', 'active')
    .eq('departure_country', listing.departure_country)
    .eq('arrival_country', listing.arrival_country);

  if (error || !parcels) {
    return [];
  }

  const scored: ParcelMatchResult[] = (parcels as ParcelPosting[]).map((parcel) => {
    let score = 1; // Base score for same corridor (country-level)

    // Same city departure
    if (parcel.departure_city.toLowerCase() === listing.departure_city.toLowerCase()) {
      score += 3;
    }

    // Same city arrival
    if (parcel.arrival_city.toLowerCase() === listing.arrival_city.toLowerCase()) {
      score += 3;
    }

    // Weight capacity
    if (listing.available_kg >= parcel.weight_kg) {
      score += 2;
    }

    // Date match
    if (parcel.desired_date && parcel.desired_date >= listing.departure_date) {
      score += 2;
    }

    // Budget match
    if (parcel.budget_per_kg && parcel.budget_per_kg >= listing.price_per_kg) {
      score += 1;
    }

    return { parcel, score };
  });

  // Sort by score descending and return top 5
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}
