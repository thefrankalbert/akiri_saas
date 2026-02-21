'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Envelope, Lock, Eye, EyeSlash, User } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accept_terms: false as unknown as true,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setServerError('Un compte existe déjà avec cette adresse email');
      } else {
        setServerError(error.message);
      }
      return;
    }

    // Store email for verification page resend functionality
    localStorage.setItem('akiri_signup_email', data.email);

    // Redirect to verification page
    router.push('/verify');
  };

  return (
    <Card className="glass-strong rounded-3xl border-white/[0.08]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez la communauté Akiri et commencez à envoyer ou transporter des colis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm">{serverError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              placeholder="Jean"
              leftIcon={<User size={16} />}
              error={errors.first_name?.message}
              autoComplete="given-name"
              {...registerField('first_name')}
            />
            <Input
              label="Nom"
              placeholder="Dupont"
              error={errors.last_name?.message}
              autoComplete="family-name"
              {...registerField('last_name')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            leftIcon={<Envelope size={16} />}
            error={errors.email?.message}
            autoComplete="email"
            {...registerField('email')}
          />

          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 caractères"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-surface-200 hover:text-neutral-100"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            hint="Au moins 8 caractères, une majuscule, une minuscule et un chiffre"
            autoComplete="new-password"
            {...registerField('password')}
          />

          <Input
            label="Confirmer le mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="Retapez votre mot de passe"
            leftIcon={<Lock size={16} />}
            error={errors.confirm_password?.message}
            autoComplete="new-password"
            {...registerField('confirm_password')}
          />

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="bg-surface-700 text-primary-500 focus:ring-primary-500 mt-1 h-4 w-4 rounded border-white/[0.08]"
              {...registerField('accept_terms')}
            />
            <span className="text-surface-100 text-sm">
              J&apos;accepte les{' '}
              <Link href="/cgu" className="text-primary-400 font-medium hover:underline">
                conditions g&eacute;n&eacute;rales d&apos;utilisation
              </Link>{' '}
              et la{' '}
              <Link
                href="/confidentialite"
                className="text-primary-400 font-medium hover:underline"
              >
                politique de confidentialit&eacute;
              </Link>
            </span>
          </label>
          {errors.accept_terms && (
            <p className="text-error text-xs">{errors.accept_terms.message}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
            Créer mon compte
          </Button>

          <p className="text-surface-100 text-center text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
