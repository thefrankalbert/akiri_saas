import type { Metadata } from 'next';
import { RegisterForm } from '@/components/features/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte Akiri et commencez à envoyer ou transporter des colis.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
