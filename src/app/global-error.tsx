'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="fr">
      <body className="bg-[#0A0A0F] text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
            <h1 className="mb-2 text-2xl font-bold">Quelque chose s&apos;est mal pass&eacute;</h1>
            <p className="mb-6 text-neutral-400">
              Une erreur inattendue est survenue. Veuillez r&eacute;essayer.
            </p>
            <button
              onClick={reset}
              className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500"
            >
              R&eacute;essayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
