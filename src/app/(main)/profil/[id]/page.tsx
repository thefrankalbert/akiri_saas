import type { Metadata } from 'next';
import { ProfilePage } from '@/components/features/profile/ProfilePage';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Profil ${id.slice(0, 8)}`,
    description: "Profil d'un utilisateur Akiri.",
  };
}

export default async function ProfileDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProfilePage userId={id} />;
}
