import type { Metadata } from 'next';
import { ActivityFeedPage } from '@/components/features/activity/ActivityFeedPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Activité',
  description: 'Historique complet de votre activité sur Akiri.',
};

export default function Activite() {
  return <ActivityFeedPage />;
}
