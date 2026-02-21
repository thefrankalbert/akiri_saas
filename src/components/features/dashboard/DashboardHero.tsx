'use client';

import Link from 'next/link';
import { ArrowRight, GearSix, WarningCircle } from '@phosphor-icons/react';
import { Avatar, FadeIn } from '@/components/ui';
import type { Profile } from '@/types';

interface DashboardHeroProps {
  profile: Profile | null;
  statItems: { label: string; value: string | number; href: string }[];
}

export function DashboardHero({ profile, statItems }: DashboardHeroProps) {
  return (
    <FadeIn>
      <div className="bg-surface-800 mb-6 rounded-2xl px-5 py-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: avatar + greeting */}
          <div className="flex min-w-0 items-center gap-3">
            {profile && (
              <div className="ring-primary-500/30 shrink-0 rounded-full ring-2">
                <Avatar
                  src={profile.avatar_url}
                  firstName={profile.first_name}
                  lastName={profile.last_name}
                  size="md"
                  isVerified={profile.is_verified}
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-neutral-100 sm:text-lg">
                Bonjour, {profile?.first_name || 'Utilisateur'}
              </h1>
              <p className="text-surface-100 flex items-center gap-1.5 text-xs">
                Voici votre tableau de bord
                <Link
                  href="/parametres"
                  className="text-surface-200 transition-colors hover:text-neutral-100"
                >
                  <GearSix weight="duotone" size={14} />
                </Link>
              </p>
            </div>
          </div>

          {/* Right: inline stats */}
          <div className="hidden items-center gap-6 sm:flex">
            {statItems.map((s) => (
              <Link key={s.label} href={s.href} className="group text-center">
                <p className="group-hover:text-primary-400 text-lg font-bold text-neutral-100 transition-colors">
                  {s.value}
                </p>
                <p className="text-surface-100 text-[10px]">{s.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile stats row */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
          {statItems.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="bg-surface-700 hover:bg-surface-600 rounded-xl p-3 text-center transition-colors"
            >
              <p className="text-sm font-bold text-neutral-100">{s.value}</p>
              <p className="text-surface-100 text-[10px]">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* Verification inline if needed */}
        {profile && !profile.is_verified && (
          <div className="border-warning/20 bg-warning/10 mt-4 flex items-center justify-between rounded-xl border px-3 py-2">
            <div className="flex items-center gap-2">
              <WarningCircle weight="duotone" size={16} className="text-warning" />
              <span className="text-warning text-xs">Identité non vérifiée</span>
            </div>
            <Link
              href="/profil/verification"
              className="text-warning flex items-center gap-1 text-xs font-medium hover:text-amber-300"
            >
              Vérifier
              <ArrowRight weight="bold" size={12} />
            </Link>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
