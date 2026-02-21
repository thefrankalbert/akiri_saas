'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';

export function AuthBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-surface-200 hover:bg-surface-800 rounded-lg p-2 transition-colors duration-150 hover:text-neutral-100"
      aria-label="Retour"
    >
      <ArrowLeft weight="bold" size={20} />
    </button>
  );
}
