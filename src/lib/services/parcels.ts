// ============================================
// Parcels Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParcelPosting, ParcelStatus, PaginatedResponse } from '@/types';
import type { CreateParcelPostingInput, SearchParcelsInput } from '@/lib/validations';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import { paginationRange } from '@/lib/utils/pagination';

export function createParcelsService(supabase: SupabaseClient) {
  return {
    /**
     * Get a paginated list of active parcel postings with filters
     */
    async getParcels(
      params: Partial<SearchParcelsInput> = {}
    ): Promise<PaginatedResponse<ParcelPosting>> {
      const page = params.page || 1;
      const perPage = params.per_page || DEFAULT_PAGE_SIZE;
      const { from, to } = paginationRange(page, perPage);

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
        logger.error('getParcels: erreur lors de la récupération', error);
        throw new ServiceError('Erreur lors de la récupération des colis', 'INTERNAL', error);
      }

      const total = count || 0;

      return {
        data: (data as ParcelPosting[]) || [],
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      };
    },

    /**
     * Get a single parcel posting by ID with sender profile
     */
    async getParcelById(id: string): Promise<ParcelPosting> {
      const { data, error } = await supabase
        .from('parcel_postings')
        .select('*, sender:profiles!sender_id(*)')
        .eq('id', id)
        .single();

      if (error) {
        throw new ServiceError('Colis introuvable', 'NOT_FOUND');
      }

      return data as ParcelPosting;
    },

    /**
     * Create a new parcel posting
     */
    async createParcel(senderId: string, input: CreateParcelPostingInput): Promise<ParcelPosting> {
      if (input.weight_kg > 30) {
        throw new ServiceError('Le poids maximum est de 30 kg', 'VALIDATION');
      }

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
        logger.error('createParcel: erreur lors de la création', error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }

      return data as ParcelPosting;
    },

    /**
     * Update parcel posting status (owner only)
     */
    async updateParcelStatus(
      id: string,
      senderId: string,
      status: ParcelStatus
    ): Promise<ParcelPosting> {
      const { data, error } = await supabase
        .from('parcel_postings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('sender_id', senderId) // Ensure ownership
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ServiceError('Non autorisé à modifier ce colis', 'AUTH');
        }
        logger.error('updateParcelStatus: erreur lors de la mise à jour', error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }

      return data as ParcelPosting;
    },

    /**
     * Get all parcel postings by sender
     */
    async getParcelsBySender(senderId: string): Promise<ParcelPosting[]> {
      const { data, error } = await supabase
        .from('parcel_postings')
        .select('*')
        .eq('sender_id', senderId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('getParcelsBySender: erreur lors de la récupération', error);
        throw new ServiceError('Erreur lors de la récupération des colis', 'INTERNAL', error);
      }

      return (data as ParcelPosting[]) || [];
    },
  };
}
