// ============================================
// Listings Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { Listing, ApiResponse, PaginatedResponse } from '@/types';
import type { CreateListingInput, SearchListingsInput } from '@/lib/validations';
import { DEFAULT_PAGE_SIZE } from '@/constants';

/**
 * Get a paginated list of active listings with filters
 */
export async function getListings(
  params: Partial<SearchListingsInput> = {}
): Promise<PaginatedResponse<Listing>> {
  const supabase = await createClient();

  const page = params.page || 1;
  const perPage = params.per_page || DEFAULT_PAGE_SIZE;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('listings')
    .select('*, traveler:profiles!traveler_id(*)', { count: 'exact' })
    .eq('status', 'active')
    .gte('departure_date', new Date().toISOString());

  // Apply filters
  if (params.departure_country) {
    query = query.eq('departure_country', params.departure_country);
  }
  if (params.arrival_country) {
    query = query.eq('arrival_country', params.arrival_country);
  }
  if (params.min_kg) {
    query = query.gte('available_kg', params.min_kg);
  }
  if (params.max_price) {
    query = query.lte('price_per_kg', params.max_price);
  }
  if (params.departure_after) {
    query = query.gte('departure_date', params.departure_after);
  }
  if (params.departure_before) {
    query = query.lte('departure_date', params.departure_before);
  }

  // Sort
  const sortBy = params.sort_by || 'departure_date';
  const isDesc = params.sort_order === 'desc';
  query = query.order(sortBy, { ascending: !isDesc });

  // Paginate
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: [], total: 0, page, per_page: perPage, total_pages: 0 };
  }

  const total = count || 0;

  return {
    data: (data as Listing[]) || [],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

/**
 * Get a single listing by ID
 */
export async function getListingById(id: string): Promise<ApiResponse<Listing>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('*, traveler:profiles!traveler_id(*)')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 404 };
  }

  return { data: data as Listing, error: null, status: 200 };
}

/**
 * Create a new listing
 */
export async function createListing(
  travelerId: string,
  input: CreateListingInput
): Promise<ApiResponse<Listing>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .insert({
      traveler_id: travelerId,
      ...input,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as Listing, error: null, status: 201 };
}

/**
 * Update a listing
 */
export async function updateListing(
  id: string,
  travelerId: string,
  updates: Partial<CreateListingInput>
): Promise<ApiResponse<Listing>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('traveler_id', travelerId) // Ensure ownership
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as Listing, error: null, status: 200 };
}

/**
 * Cancel a listing (soft delete)
 */
export async function cancelListing(id: string, travelerId: string): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('listings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('traveler_id', travelerId)
    .eq('status', 'active');

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: null, error: null, status: 200 };
}

/**
 * Get listings by traveler
 */
export async function getListingsByTraveler(travelerId: string): Promise<Listing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('traveler_id', travelerId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data as Listing[]) || [];
}
