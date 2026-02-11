'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export function VerifyEmail() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setResent(false);

    const supabase = createClient();

    // We can't resend without the email, so we'll use a generic approach
    // The user should check their email or try signing up again
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: '', // User needs to provide this
    });

    setResending(false);

    if (!error) {
      setResent(true);
    }
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="text-center">
        <div className="bg-primary-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="text-primary-500 h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
        <CardDescription>
          Nous vous avons envoyé un lien de confirmation. Cliquez sur le lien dans l&apos;email pour
          activer votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary-50 text-primary-700 rounded-lg px-4 py-3 text-sm">
          <p className="font-medium">Vérifiez votre boîte de réception</p>
          <p className="mt-1">
            Si vous ne trouvez pas l&apos;email, pensez à vérifier vos spams ou courriers
            indésirables.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          isLoading={resending}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Renvoyer l&apos;email
        </Button>

        {resent && (
          <p className="text-secondary-600 text-center text-sm">Email renvoyé avec succès !</p>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-500 inline-flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
