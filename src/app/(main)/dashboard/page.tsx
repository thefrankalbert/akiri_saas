import type { Metadata } from 'next';
import { DashboardPage } from '@/components/features/dashboard/DashboardPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description: 'Gérez vos annonces, demandes et transactions.',
};

export default function Dashboard() {
  return <DashboardPage />;
}
