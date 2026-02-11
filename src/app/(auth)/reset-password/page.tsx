import type { Metadata } from 'next';
import { ResetPassword } from '@/components/features/auth/ResetPassword';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe Akiri.',
};

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
