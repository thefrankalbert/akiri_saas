'use client';

import { CheckCircle, ShieldCheck, Star } from '@phosphor-icons/react';
import { FadeIn } from '@/components/ui';

export function DashboardTrustIndicators() {
  return (
    <FadeIn delay={0.3}>
      <div className="text-surface-200 mt-6 flex flex-wrap items-center justify-center gap-5 text-xs">
        <span className="flex items-center gap-1.5">
          <ShieldCheck weight="duotone" size={14} className="text-success" />
          Paiements sécurisés
        </span>
        <span className="flex items-center gap-1.5">
          <Star weight="duotone" size={14} className="text-amber-400" />
          Profils vérifiés
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle weight="duotone" size={14} className="text-primary-400" />
          Escrow garanti
        </span>
      </div>
    </FadeIn>
  );
}
