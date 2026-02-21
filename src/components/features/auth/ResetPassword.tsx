'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Envelope, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

const resetSchema = z.object({
  email: z.email('Adresse email invalide'),
});

type ResetInput = z.infer<typeof resetSchema>;

export function ResetPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    setServerError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="glass-strong rounded-3xl border-white/[0.08]">
        <CardHeader className="text-center">
          <div className="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle className="text-success" size={32} />
          </div>
          <CardTitle className="text-2xl">Email envoyé !</CardTitle>
          <CardDescription>
            Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre
            mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full" leftIcon={<ArrowLeft size={16} />}>
              Retour à la connexion
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong rounded-3xl border-white/[0.08]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de
          passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm">{serverError}</div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            leftIcon={<Envelope size={16} />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
            Envoyer le lien
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
