import type { Metadata } from 'next';
import { CorridorsPage } from '@/components/features/listings/CorridorsPage';

export const metadata: Metadata = {
  title: 'Corridors',
  description: 'Explorez les corridors de transport les plus populaires de la diaspora.',
};

export default function Corridors() {
  return <CorridorsPage />;
}
