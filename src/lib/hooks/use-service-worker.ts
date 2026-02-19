'use client';

import { useEffect } from 'react';

/**
 * Register the service worker for PWA support.
 * Only registers in production or when SW is available.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // In development, unregister any existing service worker to avoid stale cache
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      // Also clear all caches
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  }, []);
}
