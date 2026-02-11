'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : error.message
      );
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bon retour !</CardTitle>
        <CardDescription>Connectez-vous à votre compte Akiri</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <div className="relative">
            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="Votre mot de passe"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/reset-password"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
            Se connecter
          </Button>

          <p className="text-center text-sm text-neutral-500">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-500 font-semibold"
            >
              Créer un compte
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
