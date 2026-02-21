'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useTypingIndicator(conversationId: string | null, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!supabaseConfigured || !conversationId) {
      queueMicrotask(() => setTypingUsers([]));
      return;
    }

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state).filter((id) => id !== currentUserId);
        setTypingUsers(users);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [supabase, conversationId, currentUserId]);

  const startTyping = useCallback(() => {
    if (!supabaseConfigured || !channelRef.current) return;

    channelRef.current.track({ typing: true });

    // Auto stop after 2s debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      channelRef.current?.untrack();
    }, 2000);
  }, []);

  const stopTyping = useCallback(() => {
    if (!supabaseConfigured || !channelRef.current) return;
    channelRef.current.untrack();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { typingUsers, startTyping, stopTyping };
}
