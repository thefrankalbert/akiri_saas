'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { mockProfiles } from '@/lib/mock-data';

// Demo credentials for testing without Supabase
const DEMO_CREDENTIALS = {
  email: 'demo@akiri.app',
  password: 'Demo1234!',
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Demo login handler (when Supabase is not configured)
  const handleDemoLogin = () => {
    // Store demo session in localStorage
    const demoUser = {
      id: 'demo-user-001',
      email: DEMO_CREDENTIALS.email,
      created_at: new Date().toISOString(),
    };
    const demoProfile = mockProfiles[0]; // Use first mock profile

    localStorage.setItem('akiri_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('akiri_demo_profile', JSON.stringify(demoProfile));
    localStorage.setItem('akiri_demo_session', 'true');

    router.push(redirectTo);
    router.refresh();
  };

  // Fill demo credentials
  const fillDemoCredentials = () => {
    setValue('email', DEMO_CREDENTIALS.email);
    setValue('password', DEMO_CREDENTIALS.password);
  };

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    // If Supabase is not configured, use demo mode
    if (!supabaseConfigured) {
      if (data.email === DEMO_CREDENTIALS.email && data.password === DEMO_CREDENTIALS.password) {
        handleDemoLogin();
        return;
      }
      setServerError('Mode démo: utilisez les identifiants de démonstration');
      return;
    }

    try {
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
    } catch (err) {
      // Network error or Supabase not configured properly
      console.error('Login error:', err);
      setServerError(
        'Impossible de se connecter au serveur. Vérifiez votre connexion ou utilisez le mode démo.'
      );
    }
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bon retour !</CardTitle>
        <CardDescription>Connectez-vous à votre compte Akiri</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Demo Mode Banner */}
        {!supabaseConfigured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Mode Démonstration</p>
                <p className="mt-1 text-sm text-amber-700">
                  Supabase n&apos;est pas configuré. Utilisez le mode démo pour tester
                  l&apos;application.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={handleDemoLogin}
                    className="bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    Connexion Démo Rapide
                  </Button>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="text-sm font-medium text-amber-800 underline hover:text-amber-900"
                  >
                    ou remplir le formulaire
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
