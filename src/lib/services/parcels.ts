// ============================================
// Parcels Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { ParcelPosting, ParcelStatus, ApiResponse, PaginatedResponse } from '@/types';
import type { CreateParcelPostingInput, SearchParcelsInput } from '@/lib/validations';
import { DEFAULT_PAGE_SIZE } from '@/constants';

/**
 * Get a paginated list of active parcel postings with filters
 */
export async function getParcels(
  params: Partial<SearchParcelsInput> = {}
): Promise<PaginatedResponse<ParcelPosting>> {
  const supabase = await createClient();

  const page = params.page || 1;
  const perPage = params.per_page || DEFAULT_PAGE_SIZE;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)', { count: 'exact' })
    .eq('status', 'active');

  // Apply filters
  if (params.departure_country) {
    query = query.eq('departure_country', params.departure_country);
  }
  if (params.arrival_country) {
    query = query.eq('arrival_country', params.arrival_country);
  }
  if (params.min_kg) {
    query = query.gte('weight_kg', params.min_kg);
  }
  if (params.max_kg) {
    query = query.lte('weight_kg', params.max_kg);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.urgency) {
    query = query.eq('urgency', params.urgency);
  }

  // Sort
  const sortBy = params.sort_by || 'created_at';
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
    data: (data as ParcelPosting[]) || [],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

/**
 * Get a single parcel posting by ID with sender profile
 */
export async function getParcelById(id: string): Promise<ApiResponse<ParcelPosting>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 404 };
  }

  return { data: data as ParcelPosting, error: null, status: 200 };
}

/**
 * Create a new parcel posting
 */
export async function createParcel(
  senderId: string,
  input: CreateParcelPostingInput
): Promise<ApiResponse<ParcelPosting>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('parcel_postings')
    .insert({
      sender_id: senderId,
      ...input,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as ParcelPosting, error: null, status: 201 };
}

/**
 * Update parcel posting status (owner only)
 */
export async function updateParcelStatus(
  id: string,
  senderId: string,
  status: ParcelStatus
): Promise<ApiResponse<ParcelPosting>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('parcel_postings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('sender_id', senderId) // Ensure ownership
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as ParcelPosting, error: null, status: 200 };
}

/**
 * Get all parcel postings by sender
 */
export async function getParcelsBySender(senderId: string): Promise<ParcelPosting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('parcel_postings')
    .select('*')
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data as ParcelPosting[]) || [];
}
