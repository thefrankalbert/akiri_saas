'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-100">
          Quelque chose s&apos;est mal pass&eacute;
        </h1>
        <p className="mb-6 text-neutral-400">
          Une erreur inattendue est survenue. Veuillez r&eacute;essayer.
        </p>
        <button
          onClick={reset}
          className="bg-primary-500 hover:bg-primary-400 rounded-xl px-6 py-3 font-semibold text-white transition-colors"
        >
          R&eacute;essayer
        </button>
      </div>
    </div>
  );
}
