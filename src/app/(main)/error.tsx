'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="mb-4 text-6xl">&#x1F6A7;</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Oups, une erreur est survenue</h1>
        <p className="mb-6 max-w-md text-gray-600">
          Nous n&apos;avons pas pu charger cette page. Veuillez r&eacute;essayer ou retourner au
          tableau de bord.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-primary hover:bg-primary/90 rounded-xl px-6 py-3 font-semibold text-white transition-colors"
          >
            R&eacute;essayer
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
