'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import type { Profile, Conversation } from '@/types';

interface ChatHeaderProps {
  participant: Profile;
  conversation: Conversation;
  onBack: () => void;
  isTyping?: boolean;
}

export function ChatHeader({ participant, conversation, onBack, isTyping }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
      <button
        onClick={onBack}
        className="text-surface-200 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06] hover:text-neutral-100 md:hidden"
      >
        <ArrowLeft size={20} />
      </button>

      <Avatar
        firstName={participant.first_name}
        lastName={participant.last_name}
        src={participant.avatar_url}
        size="sm"
        isVerified={participant.is_verified}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-100">
          {participant.first_name} {participant.last_name}
        </p>
        <p className="text-surface-200 text-xs">
          {isTyping ? 'ecrit...' : participant.is_verified ? 'Profil verifie' : 'Membre'}
        </p>
      </div>

      {conversation.request_id && (
        <a
          href={`/demandes/${conversation.request_id}`}
          className="text-primary-400 shrink-0 text-xs hover:underline"
        >
          Voir la demande
        </a>
      )}
    </div>
  );
}
