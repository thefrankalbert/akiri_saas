'use client';

// ============================================
// useParcels — Parcel postings data hook
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { ParcelPosting } from '@/types';
import type { SearchParcelsInput } from '@/lib/validations';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { mockParcelPostings } from '@/lib/mock-data';

interface ParcelsState {
  parcels: ParcelPosting[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useParcels(initialFilters?: Partial<SearchParcelsInput>) {
  const [state, setState] = useState<ParcelsState>({
    parcels: [],
    total: 0,
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<Partial<SearchParcelsInput>>({
    page: 1,
    per_page: DEFAULT_PAGE_SIZE,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });

  const supabase = createClient();
  const abortRef = useRef<AbortController | null>(null);

  // Fetch parcels within the effect to satisfy React Compiler rules
  useEffect(() => {
    // Skip when Supabase is not configured (local dev without env vars)
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        let filtered = [...mockParcelPostings].filter((p) => p.status === 'active');

        if (filters.departure_country) {
          filtered = filtered.filter((p) => p.departure_country === filters.departure_country);
        }
        if (filters.arrival_country) {
          filtered = filtered.filter((p) => p.arrival_country === filters.arrival_country);
        }
        if (filters.category) {
          filtered = filtered.filter((p) => p.category === filters.category);
        }
        if (filters.urgency) {
          filtered = filtered.filter((p) => p.urgency === filters.urgency);
        }

        setState({
          parcels: filtered,
          total: filtered.length,
          loading: false,
          error: null,
        });
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let query = supabase
          .from('parcel_postings')
          .select('*, sender:profiles!sender_id(*)', { count: 'exact' })
          .eq('status', 'active');

        // Apply filters
        if (filters.departure_country) {
          query = query.eq('departure_country', filters.departure_country);
        }
        if (filters.arrival_country) {
          query = query.eq('arrival_country', filters.arrival_country);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.urgency) {
          query = query.eq('urgency', filters.urgency);
        }
        if (filters.min_kg) {
          query = query.gte('weight_kg', filters.min_kg);
        }
        if (filters.max_kg) {
          query = query.lte('weight_kg', filters.max_kg);
        }

        // Sorting
        const sortBy = filters.sort_by || 'created_at';
        const sortOrder = filters.sort_order === 'desc';
        query = query.order(sortBy, { ascending: !sortOrder });

        // Pagination
        const page = filters.page || 1;
        const perPage = filters.per_page || DEFAULT_PAGE_SIZE;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        // Bail out if this effect was cleaned up
        if (controller.signal.aborted) return;

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return;
        }

        setState({
          parcels: (data as ParcelPosting[]) || [],
          total: count || 0,
          loading: false,
          error: null,
        });
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des colis',
        }));
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [supabase, filters]);

  const refetch = useCallback(() => {
    // Trigger re-fetch by updating filters with same values
    setFilters((prev) => ({ ...prev }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchParcelsInput>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const totalPages = Math.ceil(state.total / (filters.per_page || DEFAULT_PAGE_SIZE));

  return {
    ...state,
    filters,
    totalPages,
    currentPage: filters.page || 1,
    updateFilters,
    goToPage,
    refetch,
  };
}
