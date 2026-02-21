'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useConversations, useMessages, useTypingIndicator } from '@/lib/hooks';
import { mockProfiles } from '@/lib/mock-data';
import { ConversationItem } from './ConversationItem';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { TypingIndicator } from './TypingIndicator';
import { EmptyChatState } from './EmptyChatState';

// Mock current user (first profile in demo mode)
const CURRENT_USER_ID = 'mock-user-001';
const CURRENT_PROFILE = mockProfiles[0];

type ViewMode = 'list' | 'chat';

export function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');

  const {
    conversations,
    loading: convsLoading,
    profilesMap,
    unreadCounts,
    markAsRead,
  } = useConversations(CURRENT_USER_ID);

  const {
    messages,
    loading: msgsLoading,
    hasMore,
    loadMore,
    sendMessage,
  } = useMessages(selectedId, CURRENT_USER_ID);

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(selectedId, CURRENT_USER_ID);

  // Merge current user profile into profilesMap
  const allProfilesMap = useMemo(
    () => ({
      ...profilesMap,
      [CURRENT_PROFILE.user_id]: CURRENT_PROFILE,
    }),
    [profilesMap]
  );

  // Find selected conversation & other participant
  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const otherParticipant = selectedConversation?.participants?.find(
    (p) => p.user_id !== CURRENT_USER_ID
  );

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((conv) => {
      const other = conv.participants?.find((p) => p.user_id !== CURRENT_USER_ID);
      if (!other) return false;
      const name = `${other.first_name} ${other.last_name}`.toLowerCase();
      return name.includes(q) || (conv.last_message || '').toLowerCase().includes(q);
    });
  }, [conversations, search]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setViewMode('chat');
    markAsRead(id);
  };

  const handleBack = () => {
    setViewMode('list');
    stopTyping();
  };

  const handleSendMessage = (
    content: string,
    contentType?: 'text' | 'image',
    mediaUrl?: string
  ) => {
    sendMessage(content, contentType, mediaUrl);
  };

  return (
    <div className="-mb-24 flex h-[calc(100dvh-4rem)] md:mb-0 md:h-[calc(100dvh-4rem)]">
      {/* Conversations panel */}
      <div
        className={cn(
          'w-full flex-col border-r border-white/[0.06] pb-16 md:flex md:w-80 md:pb-0 lg:w-96',
          viewMode === 'list' ? 'flex' : 'hidden'
        )}
      >
        {/* Search */}
        <div className="p-3">
          <Input
            placeholder="Rechercher..."
            leftIcon={<MagnifyingGlass size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2">
          {convsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-800 h-16 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <EmptyChatState variant="no-conversations" />
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => {
                const other = conv.participants?.find((p) => p.user_id !== CURRENT_USER_ID);
                return (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    otherParticipant={other}
                    isSelected={conv.id === selectedId}
                    unreadCount={unreadCounts[conv.id] || 0}
                    onClick={() => handleSelectConversation(conv.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={cn(
          'flex-1 flex-col pb-16 md:flex md:pb-0',
          viewMode === 'chat' ? 'flex' : 'hidden'
        )}
      >
        {selectedConversation && otherParticipant ? (
          <>
            <ChatHeader
              participant={otherParticipant}
              conversation={selectedConversation}
              onBack={handleBack}
              isTyping={typingUsers.length > 0}
            />
            <MessageList
              messages={messages}
              currentUserId={CURRENT_USER_ID}
              profilesMap={allProfilesMap}
              loading={msgsLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
            <TypingIndicator typingUsers={typingUsers} profilesMap={allProfilesMap} />
            <ChatInput
              conversationId={selectedConversation.id}
              onSendMessage={handleSendMessage}
              onTyping={startTyping}
            />
          </>
        ) : (
          <EmptyChatState variant="no-selection" />
        )}
      </div>
    </div>
  );
}
