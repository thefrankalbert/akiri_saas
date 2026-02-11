import type { Metadata } from 'next';
import { DemandesPage } from '@/components/features/listings/DemandesPage';

export const metadata: Metadata = {
  title: 'Demandes',
  description: "Consultez les demandes d'envoi de colis.",
};

export default function Demandes() {
  return <DemandesPage />;
}
