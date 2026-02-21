'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { MessageBubble } from './MessageBubble';
import { ImageLightbox } from './ImageLightbox';
import { formatMessageDate } from '@/lib/utils';
import type { Message, Profile } from '@/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  profilesMap: Record<string, Profile>;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function MessageList({
  messages,
  currentUserId,
  profilesMap,
  loading,
  hasMore,
  onLoadMore,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const isNewMessage = messages.length - prevMessageCount.current <= 2;
      if (isNewMessage) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  const firstMessageConvId = messages[0]?.conversation_id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [firstMessageConvId]);

  // IntersectionObserver for load more
  useEffect(() => {
    if (!hasMore || loading) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Group messages by date
  const getDateKey = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }, []);

  const handleImageClick = useCallback((url: string) => {
    setLightboxSrc(url);
  }, []);

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {/* Load more sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-2">
            {loading && <CircleNotch size={20} className="text-surface-200 animate-spin" />}
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const isOwn = msg.sender_id === currentUserId;
            const showAvatar =
              !prev || prev.sender_id !== msg.sender_id || prev.content_type === 'system';

            // Date separator
            const showDateSep = !prev || getDateKey(prev.created_at) !== getDateKey(msg.created_at);

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex justify-center py-2">
                    <span className="text-surface-200 rounded-full bg-white/[0.04] px-3 py-0.5 text-[11px] font-medium">
                      {formatMessageDate(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  senderProfile={profilesMap[msg.sender_id]}
                  showAvatar={showAvatar}
                  onImageClick={handleImageClick}
                />
              </div>
            );
          })}
        </div>

        <div ref={bottomRef} />
      </div>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
