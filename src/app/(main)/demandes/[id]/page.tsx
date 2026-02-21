import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RequestDetailPage } from '@/components/features/requests';
import { Skeleton } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Demande ${id.slice(0, 8)} — Akiri`,
    description: "Détail d'une demande d'envoi",
  };
}

function DetailFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Skeleton className="mb-4 h-6 w-32" />
      <Skeleton className="mb-6 h-16 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default async function DemandeDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailFallback />}>
      <RequestDetailPage requestId={id} />
    </Suspense>
  );
}
