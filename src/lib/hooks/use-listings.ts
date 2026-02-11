'use client';

// ============================================
// useListings — Listings data hook
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Listing } from '@/types';
import type { SearchListingsInput } from '@/lib/validations';
import { DEFAULT_PAGE_SIZE } from '@/constants';

interface ListingsState {
  listings: Listing[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useListings(initialFilters?: Partial<SearchListingsInput>) {
  const [state, setState] = useState<ListingsState>({
    listings: [],
    total: 0,
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<Partial<SearchListingsInput>>({
    page: 1,
    per_page: DEFAULT_PAGE_SIZE,
    sort_by: 'departure_date',
    sort_order: 'asc',
    ...initialFilters,
  });

  const supabase = createClient();
  const abortRef = useRef<AbortController | null>(null);

  // Fetch listings within the effect to satisfy React Compiler rules
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let query = supabase
          .from('listings')
          .select('*, traveler:profiles!traveler_id(*)', { count: 'exact' })
          .eq('status', 'active')
          .gte('departure_date', new Date().toISOString());

        // Apply filters
        if (filters.departure_country) {
          query = query.eq('departure_country', filters.departure_country);
        }
        if (filters.arrival_country) {
          query = query.eq('arrival_country', filters.arrival_country);
        }
        if (filters.min_kg) {
          query = query.gte('available_kg', filters.min_kg);
        }
        if (filters.max_price) {
          query = query.lte('price_per_kg', filters.max_price);
        }
        if (filters.departure_after) {
          query = query.gte('departure_date', filters.departure_after);
        }
        if (filters.departure_before) {
          query = query.lte('departure_date', filters.departure_before);
        }

        // Sorting
        const sortBy = filters.sort_by || 'departure_date';
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
          listings: (data as Listing[]) || [],
          total: count || 0,
          loading: false,
          error: null,
        });
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des annonces',
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

  const updateFilters = useCallback((newFilters: Partial<SearchListingsInput>) => {
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
