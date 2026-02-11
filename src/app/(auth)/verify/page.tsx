import type { Metadata } from 'next';
import { VerifyEmail } from '@/components/features/auth/VerifyEmail';

export const metadata: Metadata = {
  title: 'Vérification email',
  description: 'Vérifiez votre adresse email pour activer votre compte Akiri.',
};

export default function VerifyPage() {
  return <VerifyEmail />;
}
