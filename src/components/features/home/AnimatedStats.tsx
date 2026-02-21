'use client';

import { useState, useEffect } from 'react';
import { Users, Package, GlobeHemisphereWest, Star } from '@phosphor-icons/react';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

const heroStats = [
  {
    label: 'Voyageurs actifs',
    value: 2500,
    suffix: '+',
    icon: Users,
    iconColor: 'text-primary-400',
    iconBg: 'bg-primary-500/10',
  },
  {
    label: 'Colis livrés',
    value: 15000,
    suffix: '+',
    icon: Package,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
  {
    label: 'Corridors',
    value: 25,
    suffix: '+',
    icon: GlobeHemisphereWest,
    iconColor: 'text-accent-400',
    iconBg: 'bg-accent-500/10',
  },
  {
    label: 'Satisfaction',
    value: 4.8,
    suffix: '/5',
    icon: Star,
    iconColor: 'text-warning',
    iconBg: 'bg-warning-light',
  },
];

function formatStatValue(value: number, suffix: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace('.', ',')}k${suffix}`;
  }
  return `${value}${suffix}`;
}

export function AnimatedStats() {
  const [displayedStats, setDisplayedStats] = useState(heroStats.map(() => 0));
  const { inViewRef, inView } = useInView(0.2);

  useEffect(() => {
    if (!inView) return;

    const targets = heroStats.map((s) => s.value);
    const steps = 50;
    const interval = 2000 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);

      setDisplayedStats(
        targets.map((target) => {
          const val = target * eased;
          return target < 10 ? Math.round(val * 10) / 10 : Math.round(val);
        })
      );

      if (step >= steps) {
        clearInterval(timer);
        setDisplayedStats(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section
      ref={inViewRef}
      className="bg-surface-800 relative border-y border-white/[0.06] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {heroStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'glass group relative overflow-hidden rounded-lg p-5 text-center transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.06] sm:p-6',
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  className={cn(
                    'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg',
                    stat.iconBg
                  )}
                >
                  <Icon weight="duotone" size={24} className={stat.iconColor} />
                </div>
                <div className="font-mono text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl">
                  {formatStatValue(displayedStats[i], stat.suffix)}
                </div>
                <div className="text-surface-100 mt-1 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
