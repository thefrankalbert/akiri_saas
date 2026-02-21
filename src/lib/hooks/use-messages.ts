'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseConfigured } from '@/lib/supabase/client';
import { useRealtime } from './use-realtime';
import type { Message } from '@/types';
import { mockMessages as allMockMessages } from '@/lib/mock-data';

interface MessagesState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useMessages(conversationId: string | null, currentUserId: string) {
  const [state, setState] = useState<MessagesState>({
    messages: [],
    loading: false,
    error: null,
    hasMore: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) {
      queueMicrotask(() => {
        setState({ messages: [], loading: false, error: null, hasMore: false });
      });
      return;
    }

    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const msgs = allMockMessages.filter((m) => m.conversation_id === conversationId);
        setState({ messages: msgs, loading: false, error: null, hasMore: false });
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    isInitialLoad.current = true;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        if (!res.ok) {
          setState((prev) => ({ ...prev, loading: false, error: 'Erreur de chargement' }));
          return;
        }

        const json = await res.json();
        const messages = (json.data || []) as Message[];

        setState({
          messages,
          loading: false,
          error: null,
          hasMore: messages.length >= 50,
        });

        isInitialLoad.current = false;
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des messages',
        }));
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [conversationId]);

  // Load more (cursor pagination)
  const loadMore = useCallback(async () => {
    if (!conversationId || !state.hasMore || state.loading || !supabaseConfigured) return;

    const oldest = state.messages[0];
    if (!oldest) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=50&before=${oldest.created_at}`
      );
      if (!res.ok) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const json = await res.json();
      const older = (json.data || []) as Message[];

      setState((prev) => ({
        ...prev,
        messages: [...older, ...prev.messages],
        loading: false,
        hasMore: older.length >= 50,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [conversationId, state.hasMore, state.loading, state.messages]);

  // Realtime: new messages
  useRealtime({
    table: 'messages',
    event: 'INSERT',
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    onData: useCallback(
      (payload: { new: Record<string, unknown> }) => {
        const msg = payload.new as unknown as Message;
        if (!msg?.id || msg.conversation_id !== conversationId) return;

        setState((prev) => {
          // Avoid duplicates (optimistic messages)
          if (prev.messages.some((m) => m.id === msg.id)) return prev;
          // Replace temp message if this is from current user
          const filtered = prev.messages.filter(
            (m) =>
              !(
                m.id.startsWith('temp-') &&
                m.sender_id === msg.sender_id &&
                m.content === msg.content
              )
          );
          return { ...prev, messages: [...filtered, msg] };
        });

        // Auto mark as read
        if (msg.sender_id !== currentUserId && supabaseConfigured) {
          fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' });
        }
      },
      [conversationId, currentUserId]
    ),
    enabled: supabaseConfigured && !!conversationId,
  });

  // Send message (optimistic)
  const sendMessage = useCallback(
    async (content: string, contentType: 'text' | 'image' = 'text', mediaUrl?: string) => {
      if (!conversationId || !content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        content_type: contentType,
        media_url: mediaUrl || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // Optimistic append
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, tempMessage],
      }));

      if (!supabaseConfigured) return;

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            content,
            content_type: contentType,
            media_url: mediaUrl || null,
          }),
        });

        if (!res.ok) {
          // Remove temp message on failure
          setState((prev) => ({
            ...prev,
            messages: prev.messages.filter((m) => m.id !== tempId),
          }));
        }
      } catch {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempId),
        }));
      }
    },
    [conversationId, currentUserId]
  );

  return {
    ...state,
    loadMore,
    sendMessage,
  };
}
