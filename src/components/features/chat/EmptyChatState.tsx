'use client';

import Link from 'next/link';
import { ChatCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui';

interface EmptyChatStateProps {
  variant: 'no-selection' | 'no-conversations';
}

export function EmptyChatState({ variant }: EmptyChatStateProps) {
  if (variant === 'no-conversations') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <ChatCircle className="text-surface-300" size={64} weight="duotone" />
        <h3 className="mt-4 font-semibold text-neutral-100">Pas encore de messages</h3>
        <p className="text-surface-100 mt-1 text-sm">
          Explorez les annonces pour contacter un voyageur
        </p>
        <Link href="/annonces" className="mt-4">
          <Button size="sm" leftIcon={<MagnifyingGlass size={16} />}>
            Explorer les annonces
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <ChatCircle className="text-surface-300" size={64} weight="duotone" />
      <h3 className="mt-4 font-semibold text-neutral-100">Selectionnez une conversation</h3>
      <p className="text-surface-100 mt-1 text-sm">
        Choisissez une conversation dans la liste pour commencer
      </p>
    </div>
  );
}
