'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Envelope, ArrowLeft, ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

function getStoredEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('akiri_signup_email') || '';
}

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive email from URL params or localStorage (no effect needed)
  const email = useMemo(() => {
    const emailParam = searchParams.get('email');
    return emailParam || getStoredEmail();
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) {
      setError("Impossible de renvoyer l'email. Veuillez vous réinscrire.");
      return;
    }

    setResending(true);
    setResent(false);
    setError(null);

    const supabase = createClient();

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
  };

  return (
    <Card className="glass-strong rounded-3xl border-white/[0.08]">
      <CardHeader className="text-center">
        <div className="bg-info/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Envelope className="text-info" size={32} />
        </div>
        <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
        <CardDescription>
          Nous vous avons envoyé un lien de confirmation. Cliquez sur le lien dans l&apos;email pour
          activer votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-info/10 text-info rounded-xl px-4 py-3 text-sm">
          <p className="font-medium">Vérifiez votre boîte de réception</p>
          <p className="text-info/80 mt-1">
            Si vous ne trouvez pas l&apos;email, pensez à vérifier vos spams ou courriers
            indésirables.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          isLoading={resending}
          leftIcon={<ArrowsClockwise size={16} />}
        >
          Renvoyer l&apos;email
        </Button>

        {resent && <p className="text-success text-center text-sm">Email renvoyé avec succès !</p>}

        {error && <p className="text-error text-center text-sm">{error}</p>}

        <div className="text-center">
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
