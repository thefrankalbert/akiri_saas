import type { Metadata } from 'next';
import { ListingDetail } from '@/components/features/listings/ListingDetail';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Annonce ${id.slice(0, 8)}`,
    description: "Détails de l'annonce de transport de colis.",
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  return <ListingDetail listingId={id} />;
}
