import type { Metadata } from 'next';
import { NewListingForm } from '@/components/features/listings/NewListingForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Publier une annonce',
  description: 'Publiez une nouvelle annonce de transport de colis.',
};

export default function NewListingPage() {
  return <NewListingForm />;
}
