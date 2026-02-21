'use client';

import { Avatar, Badge } from '@/components/ui';
import { cn, formatRelativeDate, truncate } from '@/lib/utils';
import type { Conversation, Profile } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  otherParticipant: Profile | undefined;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  otherParticipant,
  isSelected,
  unreadCount,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
        isSelected ? 'border-primary-500 bg-surface-700 border-l-2' : 'hover:bg-surface-700/50'
      )}
    >
      <Avatar
        firstName={otherParticipant?.first_name || 'U'}
        lastName={otherParticipant?.last_name || ''}
        size="md"
        isVerified={otherParticipant?.is_verified}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-neutral-100">
            {otherParticipant
              ? `${otherParticipant.first_name} ${otherParticipant.last_name}`
              : 'Utilisateur'}
          </p>
          {conversation.last_message_at && (
            <span className="text-surface-200 shrink-0 text-[11px]">
              {formatRelativeDate(conversation.last_message_at)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          {conversation.last_message && (
            <p
              className={cn(
                'truncate text-xs',
                unreadCount > 0 ? 'font-medium text-neutral-100' : 'text-surface-100'
              )}
            >
              {truncate(conversation.last_message, 45)}
            </p>
          )}
          {unreadCount > 0 && (
            <Badge variant="primary" size="sm" className="shrink-0">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
