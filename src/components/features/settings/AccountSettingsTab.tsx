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
        <label className="text-surface-50 mb-1.5 block text-sm font-medium">Adresse email</label>
        <div className="relative">
          <Envelope
            weight="duotone"
            size={18}
            className="text-surface-200 absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="email"
            value={email}
            disabled
            className="bg-surface-700 text-surface-100 w-full rounded-lg border border-white/[0.08] py-2 pr-3 pl-10 text-sm"
          />
        </div>
        <p className="text-surface-200 mt-1 text-xs">
          L&apos;adresse email ne peut pas être modifiée.
        </p>
      </div>

      {/* Password */}
      <div className="bg-surface-800 rounded-xl border border-white/[0.08] p-4">
        <div className="flex items-center gap-3">
          <LockKey weight="duotone" size={20} className="text-surface-200" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-neutral-100">Mot de passe</h3>
            <p className="text-surface-100 text-xs">Réinitialisez votre mot de passe par email.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetPassword}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Delete account */}
      <div className="border-error/20 bg-error/5 rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <Trash weight="duotone" size={20} className="text-error" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-neutral-100">Supprimer le compte</h3>
            <p className="text-surface-100 text-xs">Cette action est irréversible.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-error/20 text-error opacity-50"
          >
            Bientôt disponible
          </Button>
        </div>
      </div>
    </div>
  );
}
