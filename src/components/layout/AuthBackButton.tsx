'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';

export function AuthBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      aria-label="Retour"
    >
      <ArrowLeft weight="bold" size={20} />
    </button>
  );
}
