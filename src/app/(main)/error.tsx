'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowCounterClockwise, House } from '@phosphor-icons/react';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="bg-surface-800 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06]">
          <ArrowCounterClockwise size={28} weight="duotone" className="text-amber-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-100">Oups, une erreur est survenue</h1>
        <p className="text-surface-200 mx-auto mb-6 max-w-md text-sm">
          Nous n&apos;avons pas pu charger cette page. Veuillez r&eacute;essayer ou retourner au
          tableau de bord.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-primary-500 hover:bg-primary-400 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            <ArrowCounterClockwise size={16} />
            R&eacute;essayer
          </button>
          <Link
            href="/dashboard"
            className="bg-surface-800 hover:bg-surface-700 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-6 py-3 text-sm font-semibold text-neutral-200 transition-colors"
          >
            <House size={16} />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
