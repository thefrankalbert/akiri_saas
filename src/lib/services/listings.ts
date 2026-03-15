// ============================================
// Listings Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Listing, PaginatedResponse } from '@/types';
import type { CreateListingInput, SearchListingsInput } from '@/lib/validations';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';

export function createListingsService(supabase: SupabaseClient) {
  return {
    /**
     * Get a paginated list of active listings with filters
     */
    async getListings(
      params: Partial<SearchListingsInput> = {}
    ): Promise<PaginatedResponse<Listing>> {
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
        logger.error('getListings: erreur lors de la récupération', error);
        throw new ServiceError('Erreur lors de la récupération des annonces', 'INTERNAL', error);
      }

      const total = count || 0;

      return {
        data: (data as Listing[]) || [],
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      };
    },

    /**
     * Get a single listing by ID
     */
    async getListingById(id: string): Promise<Listing> {
      const { data, error } = await supabase
        .from('listings')
        .select('*, traveler:profiles!traveler_id(*)')
        .eq('id', id)
        .single();

      if (error) {
        throw new ServiceError('Annonce introuvable', 'NOT_FOUND');
      }

      return data as Listing;
    },

    /**
     * Create a new listing
     */
    async createListing(travelerId: string, input: CreateListingInput): Promise<Listing> {
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
        logger.error('createListing: erreur lors de la création', error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }

      return data as Listing;
    },

    /**
     * Update a listing
     */
    async updateListing(
      id: string,
      travelerId: string,
      updates: Partial<CreateListingInput>
    ): Promise<Listing> {
      const { data, error } = await supabase
        .from('listings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('traveler_id', travelerId) // Ensure ownership
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ServiceError('Non autorisé à modifier cette annonce', 'AUTH');
        }
        logger.error('updateListing: erreur lors de la mise à jour', error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }

      return data as Listing;
    },

    /**
     * Cancel a listing (soft delete)
     */
    async cancelListing(id: string, travelerId: string): Promise<void> {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('traveler_id', travelerId)
        .eq('status', 'active')
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ServiceError('Annonce introuvable ou non autorisé', 'NOT_FOUND');
        }
        logger.error("cancelListing: erreur lors de l'annulation", error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }
    },

    /**
     * Get listings by traveler
     */
    async getListingsByTraveler(travelerId: string): Promise<Listing[]> {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('traveler_id', travelerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('getListingsByTraveler: erreur lors de la récupération', error);
        throw new ServiceError('Erreur lors de la récupération des annonces', 'INTERNAL', error);
      }

      return (data as Listing[]) || [];
    },
  };
}
