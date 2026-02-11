import type { Metadata } from 'next';
import { TransactionsPage } from '@/components/features/transactions/TransactionsPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'Historique de vos paiements et transactions.',
};

export default function Transactions() {
  return <TransactionsPage />;
}
