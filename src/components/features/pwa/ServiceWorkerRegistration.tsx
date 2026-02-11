'use client';

import { useServiceWorker } from '@/lib/hooks/use-service-worker';

export function ServiceWorkerRegistration() {
  useServiceWorker();
  return null;
}
