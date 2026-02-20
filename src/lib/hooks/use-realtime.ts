'use client';

// ============================================
// useRealtime — Supabase Realtime subscription hook
// ============================================

import { useEffect, useRef } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  /** The table to subscribe to */
  table: string;
  /** The schema (defaults to 'public') */
  schema?: string;
  /** The event to listen for */
  event?: RealtimeEvent;
  /** Optional filter (e.g., 'user_id=eq.123') */
  filter?: string;
  /** Callback when a change is received */
  onData: (payload: {
    eventType: string;
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void;
  /** Whether the subscription is enabled */
  enabled?: boolean;
}

export function useRealtime({
  table,
  schema = 'public',
  event = '*',
  filter,
  onData,
  enabled = true,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled || !supabaseConfigured) return;

    const channelName = `${schema}:${table}${filter ? `:${filter}` : ''}`;

    const channelConfig: {
      event: RealtimeEvent;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          onData({
            eventType: payload.eventType,
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, table, schema, event, filter, onData, enabled]);
}
