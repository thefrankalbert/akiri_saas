'use client';

import { Shimmer } from '@/components/ui';
import { useDashboardData } from '@/lib/hooks/use-dashboard-data';
import { DashboardHero } from './DashboardHero';
import { DashboardQuickActions } from './DashboardQuickActions';
import { DashboardActivityTimeline } from './DashboardActivityTimeline';
import { DashboardTrustIndicators } from './DashboardTrustIndicators';

export function DashboardPage() {
  const { profile, stats, activities, loading, statItems } = useDashboardData();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-7 lg:px-8">
        <Shimmer className="mb-6 h-32 w-full rounded-2xl" />
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-10 w-32 rounded-lg" />
          ))}
        </div>
        <Shimmer className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-7 lg:px-8">
      <DashboardHero profile={profile} statItems={statItems} />
      <DashboardQuickActions stats={stats} />
      <DashboardActivityTimeline activities={activities} />
      <DashboardTrustIndicators />
    </div>
  );
}
