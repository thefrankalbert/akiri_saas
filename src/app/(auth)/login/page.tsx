import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { Skeleton } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre compte Akiri.',
};

function LoginFormFallback() {
  return (
    <div className="bg-surface-800 space-y-4 rounded-xl border border-white/[0.08] p-6">
      <Skeleton className="mx-auto h-8 w-48" />
      <Skeleton className="mx-auto h-4 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
