import type { Metadata } from 'next';
import { NotificationsPage } from '@/components/features/notifications/NotificationsPage';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Consultez vos notifications et restez informé de vos envois et voyages.',
};

export default function Notifications() {
  return <NotificationsPage />;
}
