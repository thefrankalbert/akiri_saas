'use client';

import { useCallback, useSyncExternalStore } from 'react';

export const CONSENT_KEY = 'akiri_cookie_consent';

function getConsentSnapshot(): string | null {
  return localStorage.getItem(CONSENT_KEY);
}

function getConsentServerSnapshot(): string | null {
  return null;
}

// Subscribe to storage events for cross-tab sync
function subscribeToConsent(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useCookieConsent() {
  const stored = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );
  const consent = stored === null ? null : stored === 'true';

  const acceptCookies = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'true');
    // Reload to allow PostHog to initialize
    window.location.reload();
  }, []);

  const declineCookies = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'false');
    // Dispatch storage event so useSyncExternalStore picks up the change
    window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_KEY, newValue: 'false' }));
  }, []);

  return { consent, acceptCookies, declineCookies };
}

export function CookieConsent() {
  const { consent, acceptCookies, declineCookies } = useCookieConsent();

  // Don't render on server (useSyncExternalStore returns null via server snapshot)
  // or if consent already given/declined
  if (consent !== null) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row">
        <p className="flex-1 text-sm text-neutral-600">
          Nous utilisons des cookies analytiques pour améliorer votre expérience. Vous pouvez
          accepter ou refuser leur utilisation.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={declineCookies}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-neutral-50"
          >
            Refuser
          </button>
          <button
            onClick={acceptCookies}
            className="bg-primary rounded-lg px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
