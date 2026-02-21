import type { Metadata } from 'next';
import { ParcelDetail } from '@/components/features/parcels';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Colis ${id.slice(0, 8)}`,
    description: 'Details du colis a envoyer.',
  };
}

export default async function ParcelDetailPage({ params }: Props) {
  const { id } = await params;
  return <ParcelDetail parcelId={id} />;
}
