'use client';

import { useEffect } from 'react';

/**
 * Register the service worker for PWA support.
 * Only registers in production or when SW is available.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, []);
}
