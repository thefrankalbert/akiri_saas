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
      <Card className={cn('border-success/20 bg-success/5', className)}>
        <CardContent className="flex items-center gap-3">
          <div className="bg-success/10 flex h-10 w-10 items-center justify-center rounded-full">
            <CheckCircle className="text-success" size={20} />
          </div>
          <div>
            <p className="text-success font-medium">Identité vérifiée</p>
            <p className="text-success/80 text-sm">Votre pièce d&apos;identité a été validée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending state
  if (status === 'pending') {
    return (
      <Card className={cn('border-warning/20 bg-warning/5', className)}>
        <CardContent className="flex items-center gap-3">
          <div className="bg-warning/10 flex h-10 w-10 items-center justify-center rounded-full">
            <SpinnerGap className="text-warning animate-spin" size={20} />
          </div>
          <div>
            <p className="text-warning font-medium">Vérification en cours</p>
            <p className="text-warning/80 text-sm">
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
      <Card className={cn('border-error/20 bg-error/5', className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-error/10 flex h-10 w-10 items-center justify-center rounded-full">
              <WarningCircle className="text-error" size={20} />
            </div>
            <div>
              <CardTitle className="text-error">Vérification échouée</CardTitle>
              <CardDescription className="text-error/80">
                La vérification de votre identité n&apos;a pas pu être complétée
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-error/10 text-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</div>
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
          <div className="bg-primary-500/10 flex h-10 w-10 items-center justify-center rounded-full">
            <ShieldCheck className="text-primary-400" size={20} />
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
          <div className="bg-error/10 text-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="text-surface-100 mb-4 space-y-2 text-sm">
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

        <p className="text-surface-200 mt-3 text-center text-xs">
          Vos données sont sécurisées et traitées par Stripe Identity
        </p>
      </CardContent>
    </Card>
  );
}
