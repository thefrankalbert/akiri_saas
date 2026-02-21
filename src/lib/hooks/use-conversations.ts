'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { useRealtime } from './use-realtime';
import type { Conversation, Profile } from '@/types';
import { mockConversations, mockMessages } from '@/lib/mock-data';

interface ConversationsState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}

export function useConversations(currentUserId: string) {
  const [state, setState] = useState<ConversationsState>({
    conversations: [],
    loading: true,
    error: null,
  });

  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const supabase = createClient();
  const abortRef = useRef<AbortController | null>(null);

  // Build profiles map from conversations
  const buildProfilesMap = useCallback((conversations: Conversation[]) => {
    const map: Record<string, Profile> = {};
    for (const conv of conversations) {
      if (conv.participants) {
        for (const p of conv.participants) {
          map[p.user_id] = p;
        }
      }
    }
    return map;
  }, []);

  // Compute unread counts from mock messages
  const getUnreadCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    if (!supabaseConfigured) {
      for (const msg of mockMessages) {
        if (!msg.is_read && msg.sender_id !== currentUserId) {
          counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
        }
      }
    }
    return counts;
  }, [currentUserId]);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const pMap = buildProfilesMap(mockConversations);
        setProfilesMap(pMap);
        setUnreadCounts(getUnreadCounts());
        setState({
          conversations: mockConversations,
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
        const res = await fetch('/api/conversations', { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (!res.ok) {
          setState((prev) => ({ ...prev, loading: false, error: 'Erreur de chargement' }));
          return;
        }

        const json = await res.json();
        const conversations = (json.data || []) as Conversation[];

        // Fetch profiles for all participant IDs
        const allParticipantIds = new Set<string>();
        for (const conv of conversations) {
          for (const pid of conv.participant_ids) {
            allParticipantIds.add(pid);
          }
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', Array.from(allParticipantIds));

        if (controller.signal.aborted) return;

        const pMap: Record<string, Profile> = {};
        for (const p of (profiles || []) as Profile[]) {
          pMap[p.user_id] = p;
        }

        // Attach participants to conversations
        for (const conv of conversations) {
          conv.participants = conv.participant_ids.map((id) => pMap[id]).filter(Boolean);
        }

        setProfilesMap(pMap);

        // Fetch unread counts
        const { data: unreadData } = await supabase
          .from('messages')
          .select('conversation_id', { count: 'exact' })
          .eq('is_read', false)
          .neq('sender_id', currentUserId);

        if (!controller.signal.aborted) {
          const counts: Record<string, number> = {};
          for (const row of (unreadData || []) as { conversation_id: string }[]) {
            counts[row.conversation_id] = (counts[row.conversation_id] || 0) + 1;
          }
          setUnreadCounts(counts);
        }

        setState({
          conversations,
          loading: false,
          error: null,
        });
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des conversations',
        }));
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [supabase, currentUserId, buildProfilesMap, getUnreadCounts]);

  // Realtime: conversation updates
  useRealtime({
    table: 'conversations',
    event: '*',
    onData: useCallback((payload: { eventType: string; new: Record<string, unknown> }) => {
      const updated = payload.new as unknown as Conversation;
      if (!updated?.id) return;

      setState((prev) => {
        const idx = prev.conversations.findIndex((c) => c.id === updated.id);
        if (idx >= 0) {
          const next = [...prev.conversations];
          next[idx] = { ...next[idx], ...updated };
          next.sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''));
          return { ...prev, conversations: next };
        }
        return prev;
      });
    }, []),
    enabled: supabaseConfigured,
  });

  // Realtime: new messages → update last_message + increment unread
  useRealtime({
    table: 'messages',
    event: 'INSERT',
    onData: useCallback(
      (payload: { new: Record<string, unknown> }) => {
        const msg = payload.new as unknown as {
          conversation_id: string;
          content: string;
          created_at: string;
          sender_id: string;
        };
        if (!msg?.conversation_id) return;

        setState((prev) => {
          const next = prev.conversations.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
              : c
          );
          next.sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''));
          return { ...prev, conversations: next };
        });

        if (msg.sender_id !== currentUserId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1,
          }));
        }
      },
      [currentUserId]
    ),
    enabled: supabaseConfigured,
  });

  const markAsRead = useCallback(async (conversationId: string) => {
    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });

    if (supabaseConfigured) {
      await fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' });
    }
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return {
    ...state,
    profilesMap,
    unreadCounts,
    totalUnread,
    markAsRead,
  };
}
