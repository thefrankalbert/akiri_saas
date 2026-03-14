'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, CreditCard } from '@phosphor-icons/react';
import { Button, Input, Textarea } from '@/components/ui';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { AvatarUpload } from './AvatarUpload';

interface ProfileSettingsTabProps {
  profile: Profile | null;
}

export function ProfileSettingsTab({ profile }: ProfileSettingsTabProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
    },
  });

  const bioValue = watch('bio') || '';

  const handleConnectOnboard = async () => {
    setConnectError(null);
    setConnectLoading(true);

    try {
      const res = await fetch('/api/connect/onboard', {
        method: 'POST',
      });

      if (!res.ok) {
        const json = await res.json();
        setConnectError(json.error || 'Erreur lors de la configuration des paiements');
        return;
      }

      const json = await res.json();
      window.location.href = json.data.url;
    } catch {
      setConnectError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setConnectLoading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError(null);

    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 500));
      toasts.profileUpdated();
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || 'Erreur lors de la mise à jour');
        return;
      }

      toasts.profileUpdated();
    } catch {
      toasts.genericError();
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex justify-center">
        <AvatarUpload
          currentUrl={profile?.avatar_url || null}
          firstName={profile?.first_name || ''}
          lastName={profile?.last_name || ''}
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm">{serverError}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Prénom"
            placeholder="Votre prénom"
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Nom"
            placeholder="Votre nom"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          label="Téléphone"
          placeholder="+33612345678"
          hint="Format international avec indicatif pays"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Textarea
          label="Bio"
          placeholder="Décrivez-vous en quelques mots..."
          rows={3}
          maxLength={500}
          maxChars={500}
          currentLength={bioValue.length}
          error={errors.bio?.message}
          {...register('bio')}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Enregistrer les modifications
        </Button>
      </form>

      {/* Stripe Connect — Recevoir des paiements */}
      <div className="border-neutral-200 space-y-3 border-t pt-6">
        <h3 className="text-lg font-semibold">Recevoir des paiements</h3>

        {profile?.stripe_connect_onboarded ? (
          <div className="bg-success/10 text-success inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <CheckCircle size={20} weight="fill" />
            Paiements configurés
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-neutral-600 text-sm">
              Pour recevoir des paiements en tant que voyageur, vous devez configurer votre compte
              de paiement. Vous serez redirigé vers notre partenaire Stripe pour compléter la
              vérification.
            </p>

            {connectError && (
              <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm">
                {connectError}
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              isLoading={connectLoading}
              onClick={handleConnectOnboard}
            >
              <CreditCard size={20} weight="bold" />
              Configurer les paiements
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
