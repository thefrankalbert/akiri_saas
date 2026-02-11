'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Input } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types';
import { formatRelativeDate, truncate } from '@/lib/utils';

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchConversations = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || controller.signal.aborted) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (controller.signal.aborted) return;

      setConversations((data as Conversation[]) || []);
      setLoading(false);
    };

    fetchConversations();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Messages</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations list */}
        <div className="lg:col-span-1">
          <Input
            placeholder="Rechercher..."
            leftIcon={<Search className="h-4 w-4" />}
            className="mb-4"
          />

          {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-sm font-semibold text-neutral-700">Aucune conversation</h3>
                <p className="mt-1 text-xs text-neutral-500">Vos conversations apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      isSelected ? 'bg-primary-50 border-primary-200 border' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <Avatar firstName="U" size="md" />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-900">Conversation</p>
                        {conv.last_message_at && (
                          <span className="text-xs text-neutral-400">
                            {formatRelativeDate(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-neutral-500">
                          {truncate(conv.last_message, 40)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2">
          <Card className="h-[500px]">
            <CardContent className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-neutral-200" />
                <h3 className="mt-4 font-semibold text-neutral-700">
                  {selectedId
                    ? 'Chargement de la conversation...'
                    : 'Sélectionnez une conversation'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {selectedId
                    ? 'Les messages apparaîtront ici'
                    : 'Choisissez une conversation dans la liste pour commencer'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
