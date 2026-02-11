// ============================================
// Corridors Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { Corridor } from '@/types';

/**
 * Get active corridors (aggregated from listings)
 * Returns departure/arrival country pairs with count and average price
 */
export async function getCorridors(): Promise<Corridor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('departure_country, arrival_country, price_per_kg')
    .eq('status', 'active')
    .gte('departure_date', new Date().toISOString());

  if (error || !data) {
    return [];
  }

  // Aggregate by route
  const corridorMap = new Map<
    string,
    { departure_country: string; arrival_country: string; count: number; totalPrice: number }
  >();

  for (const listing of data) {
    const key = `${listing.departure_country}→${listing.arrival_country}`;
    const existing = corridorMap.get(key);

    if (existing) {
      existing.count += 1;
      existing.totalPrice += Number(listing.price_per_kg);
    } else {
      corridorMap.set(key, {
        departure_country: listing.departure_country,
        arrival_country: listing.arrival_country,
        count: 1,
        totalPrice: Number(listing.price_per_kg),
      });
    }
  }

  // Convert to Corridor array, sorted by count desc
  const corridors: Corridor[] = Array.from(corridorMap.values())
    .map((c) => ({
      departure_country: c.departure_country,
      arrival_country: c.arrival_country,
      active_listings: c.count,
      avg_price_per_kg: Math.round((c.totalPrice / c.count) * 100) / 100,
    }))
    .sort((a, b) => b.active_listings - a.active_listings);

  return corridors;
}
