import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SettingsPage } from '@/components/features/settings';
import { Skeleton } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Paramètres — Akiri',
  description: 'Gérez votre profil, vérification et paramètres de compte.',
};

function SettingsFallback() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="mb-4 h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function ParametresPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsPage />
    </Suspense>
  );
}
