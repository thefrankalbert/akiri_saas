'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { cn } from '@/lib/utils';

interface IdentityVerificationProps {
  status: 'none' | 'pending' | 'verified' | 'failed';
  onStartVerification?: () => void;
  className?: string;
}

export function IdentityVerification({
  status,
  onStartVerification,
  className,
}: IdentityVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verification/identity/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_url: `${window.location.origin}/profil/verification`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Une erreur est survenue');
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Identity verification
      if (result.url) {
        window.location.href = result.url;
      } else {
        // Mock mode - just trigger callback
        onStartVerification?.();
        setIsLoading(false);
      }
    } catch {
      setError('Erreur de connexion au serveur');
      setIsLoading(false);
    }
  };

  // Verified state
  if (status === 'verified') {
    return (
      <Card className={cn('border-green-200 bg-green-50', className)}>
        <CardContent className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-green-800">Identité vérifiée</p>
            <p className="text-sm text-green-600">Votre pièce d&apos;identité a été validée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending state
  if (status === 'pending') {
    return (
      <Card className={cn('border-amber-200 bg-amber-50', className)}>
        <CardContent className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <SpinnerGap className="animate-spin text-amber-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-amber-800">Vérification en cours</p>
            <p className="text-sm text-amber-600">
              Nous vérifions votre pièce d&apos;identité. Cela peut prendre quelques minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <WarningCircle className="text-red-600" size={20} />
            </div>
            <div>
              <CardTitle className="text-red-800">Vérification échouée</CardTitle>
              <CardDescription className="text-red-600">
                La vérification de votre identité n&apos;a pas pu être complétée
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <Button onClick={handleStartVerification} isLoading={isLoading} className="w-full">
            Réessayer la vérification
          </Button>
        </CardContent>
      </Card>
    );
  }

  // None state - show start verification
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 flex h-10 w-10 items-center justify-center rounded-full">
            <ShieldCheck className="text-primary-600" size={20} />
          </div>
          <div>
            <CardTitle>Vérifier votre identité</CardTitle>
            <CardDescription>
              Scannez une pièce d&apos;identité officielle pour être vérifié
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4 space-y-2 text-sm text-neutral-600">
          <p>Documents acceptés :</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Carte nationale d&apos;identité</li>
            <li>Passeport</li>
            <li>Permis de conduire</li>
          </ul>
        </div>

        <Button onClick={handleStartVerification} isLoading={isLoading} className="w-full">
          Commencer la vérification
        </Button>

        <p className="mt-3 text-center text-xs text-neutral-500">
          Vos données sont sécurisées et traitées par Stripe Identity
        </p>
      </CardContent>
    </Card>
  );
}
