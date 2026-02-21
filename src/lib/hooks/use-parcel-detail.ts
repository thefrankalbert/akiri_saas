'use client';

// ============================================
// useParcelDetail — Single parcel detail hook
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { ParcelPosting, CarryOffer } from '@/types';
import { mockParcelPostings, mockCarryOffers } from '@/lib/mock-data';

interface ParcelDetailState {
  parcel: ParcelPosting | null;
  offers: CarryOffer[];
  loading: boolean;
  error: string | null;
}

export function useParcelDetail(parcelId: string | null) {
  const [state, setState] = useState<ParcelDetailState>({
    parcel: null,
    offers: [],
    loading: true,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();
  const abortRef = useRef<AbortController | null>(null);

  // Fetch parcel detail within the effect to satisfy React Compiler rules
  useEffect(() => {
    if (!parcelId) {
      queueMicrotask(() => {
        setState({ parcel: null, offers: [], loading: false, error: null });
      });
      return;
    }

    // Skip when Supabase is not configured (local dev without env vars)
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const parcel = mockParcelPostings.find((p) => p.id === parcelId) || null;
        const offers = mockCarryOffers.filter((o) => o.parcel_id === parcelId);
        setState({
          parcel,
          offers,
          loading: false,
          error: parcel ? null : 'Colis introuvable',
        });
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [parcelRes, offersRes] = await Promise.all([
          supabase
            .from('parcel_postings')
            .select('*, sender:profiles!sender_id(*)')
            .eq('id', parcelId)
            .single(),
          supabase
            .from('carry_offers')
            .select('*, traveler:profiles!traveler_id(*), listing:listings!listing_id(*)')
            .eq('parcel_id', parcelId)
            .order('created_at', { ascending: false }),
        ]);

        // Bail out if this effect was cleaned up
        if (controller.signal.aborted) return;

        if (parcelRes.error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Colis introuvable',
          }));
          return;
        }

        setState({
          parcel: parcelRes.data as ParcelPosting | null,
          offers: (offersRes.data as CarryOffer[]) || [],
          loading: false,
          error: null,
        });
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement du colis',
        }));
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [supabase, parcelId, refreshKey]);

  const refetch = useCallback(() => {
    // Trigger re-fetch by incrementing refresh key
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    ...state,
    refetch,
  };
}
