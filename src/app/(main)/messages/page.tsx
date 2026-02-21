import type { Metadata } from 'next';
import { MessagesPage } from '@/components/features/chat/MessagesPage';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Discutez avec vos voyageurs et expéditeurs.',
};

export default function Messages() {
  return <MessagesPage />;
}
