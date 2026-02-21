'use client';

import Link from 'next/link';
import { Package, ChatCircle, Plus, GlobeHemisphereWest } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { FadeIn } from '@/components/ui';
import type { DashboardStats } from '@/lib/hooks/use-dashboard-data';

interface DashboardQuickActionsProps {
  stats: DashboardStats;
}

interface QuickAction {
  href: string;
  icon: PhosphorIcon;
  label: string;
  bg: string;
}

export function DashboardQuickActions({ stats }: DashboardQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      href: '/annonces/new',
      icon: Plus,
      label: 'Publier',
      bg: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20',
    },
    {
      href: '/annonces',
      icon: Package,
      label: 'Envoyer',
      bg: 'bg-surface-700 border border-white/[0.08] text-neutral-100 hover:bg-surface-600',
    },
    {
      href: '/corridors',
      icon: GlobeHemisphereWest,
      label: 'Corridors',
      bg: 'bg-surface-700 border border-white/[0.08] text-neutral-100 hover:bg-surface-600',
    },
    {
      href: '/messages',
      icon: ChatCircle,
      label: stats.unreadMessages > 0 ? `Messages (${stats.unreadMessages})` : 'Messages',
      bg: 'bg-surface-700 border border-white/[0.08] text-neutral-100 hover:bg-surface-600',
    },
  ];

  return (
    <FadeIn delay={0.1}>
      <div className="mb-6 flex flex-wrap gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${action.bg}`}
            >
              <Icon weight="bold" size={15} />
              {action.label}
            </Link>
          );
        })}
      </div>
    </FadeIn>
  );
}
