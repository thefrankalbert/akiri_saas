import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ListingsPage } from '@/components/features/listings/ListingsPage';
import { Skeleton } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Annonces',
  description:
    'Parcourez les annonces de voyageurs proposant des kilos disponibles pour transporter vos colis.',
};

function ListingsFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<ListingsFallback />}>
      <ListingsPage />
    </Suspense>
  );
}
