'use client';

import { Envelope, LockKey, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/hooks';
import { toasts } from '@/lib/utils/toast';

interface AccountSettingsTabProps {
  email: string;
}

export function AccountSettingsTab({ email }: AccountSettingsTabProps) {
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) return;
    try {
      await resetPassword(email);
      toasts.resetPasswordSent();
    } catch {
      toasts.genericError();
    }
  };

  return (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adresse email</label>
        <div className="relative">
          <Envelope
            weight="duotone"
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-3 pl-10 text-sm text-neutral-500"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          L&apos;adresse email ne peut pas être modifiée.
        </p>
      </div>

      {/* Password */}
      <div className="rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          <LockKey weight="duotone" size={20} className="text-neutral-400" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-neutral-900">Mot de passe</h3>
            <p className="text-xs text-neutral-500">Réinitialisez votre mot de passe par email.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetPassword}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Delete account */}
      <div className="rounded-lg border border-red-100 p-4">
        <div className="flex items-center gap-3">
          <Trash weight="duotone" size={20} className="text-red-400" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-neutral-900">Supprimer le compte</h3>
            <p className="text-xs text-neutral-500">Cette action est irréversible.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-red-200 text-red-600 opacity-50"
          >
            Bientôt disponible
          </Button>
        </div>
      </div>
    </div>
  );
}
