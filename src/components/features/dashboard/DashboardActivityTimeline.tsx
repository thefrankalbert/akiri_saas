'use client';

import Link from 'next/link';
import {
  AirplaneTilt,
  Package,
  ChatCircle,
  TrendUp,
  Star,
  Clock,
  CaretRight,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { FadeIn } from '@/components/ui';
import type { ActivityItem } from '@/lib/hooks/use-dashboard-data';
import { formatRelativeDate } from '@/lib/utils';

interface DashboardActivityTimelineProps {
  activities: ActivityItem[];
}

const activityIcons: Record<ActivityItem['icon'], PhosphorIcon> = {
  plane: AirplaneTilt,
  package: Package,
  message: ChatCircle,
  payment: TrendUp,
  star: Star,
};

const statusDot: Record<string, string> = {
  success: 'bg-success',
  pending: 'bg-warning',
  info: 'bg-info',
};

export function DashboardActivityTimeline({ activities }: DashboardActivityTimelineProps) {
  return (
    <FadeIn delay={0.2}>
      <div className="bg-surface-800 rounded-2xl border border-white/[0.08] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-neutral-100">
            <Clock weight="duotone" size={14} className="text-surface-200" />
            Activité récente
          </h2>
          <Link
            href="/activite"
            className="text-primary-400 hover:text-primary-300 flex items-center gap-0.5 text-xs font-medium"
          >
            Tout voir
            <CaretRight weight="bold" size={12} />
          </Link>
        </div>

        {activities.length > 0 ? (
          <div className="space-y-0.5">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.icon];
              return (
                <div
                  key={activity.id}
                  className="hover:bg-surface-700 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${statusDot[activity.status || 'info']}`}
                  />
                  <Icon weight="duotone" size={16} className="text-surface-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-neutral-100">{activity.title}</span>
                    <span className="text-surface-400 mx-1.5">&middot;</span>
                    <span className="text-surface-100 text-sm">{activity.description}</span>
                  </div>
                  <span className="text-surface-200 shrink-0 text-[11px]">
                    {formatRelativeDate(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Clock weight="duotone" size={24} className="text-surface-300 mx-auto" />
            <p className="text-surface-100 mt-2 text-sm">Aucune activité récente</p>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
