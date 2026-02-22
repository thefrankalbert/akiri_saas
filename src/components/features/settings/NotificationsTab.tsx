'use client';

import { Bell, BellSlash } from '@phosphor-icons/react';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { Button } from '@/components/ui';

export function NotificationsTab() {
  const { permission, isSubscribed, isSupported, loading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className="bg-surface-800 rounded-2xl border border-white/[0.06] p-5">
        <div className="flex items-center gap-3">
          <BellSlash size={24} weight="duotone" className="text-surface-400" />
          <div>
            <p className="font-medium text-neutral-100">Notifications push</p>
            <p className="text-surface-300 text-sm">
              Votre navigateur ne supporte pas les notifications push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-800 rounded-2xl border border-white/[0.06] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell size={24} weight="duotone" className="text-primary-400" />
            <div>
              <p className="font-medium text-neutral-100">Notifications push</p>
              <p className="text-surface-300 text-sm">
                {isSubscribed
                  ? 'Vous recevez les notifications en temps réel.'
                  : 'Activez pour recevoir les alertes instantanément.'}
              </p>
            </div>
          </div>

          {isSubscribed ? (
            <Button variant="secondary" size="sm" onClick={unsubscribe} isLoading={loading}>
              Désactiver
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={subscribe}
              isLoading={loading}
              disabled={permission === 'denied'}
            >
              Activer
            </Button>
          )}
        </div>

        {permission === 'denied' && (
          <p className="text-error mt-3 text-xs">
            Les notifications sont bloquées. Autorisez-les dans les paramètres de votre navigateur.
          </p>
        )}
      </div>
    </div>
  );
}
