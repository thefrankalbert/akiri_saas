'use client';

import { useState, useEffect } from 'react';
import { Users, Package, Globe, Star } from 'lucide-react';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

const heroStats = [
  {
    label: 'Voyageurs actifs',
    value: 2500,
    suffix: '+',
    icon: Users,
    color: 'from-primary-500 to-primary-600',
  },
  {
    label: 'Colis livrés',
    value: 15000,
    suffix: '+',
    icon: Package,
    color: 'from-secondary-500 to-secondary-600',
  },
  { label: 'Corridors', value: 25, suffix: '+', icon: Globe, color: 'from-blue-500 to-blue-600' },
  {
    label: 'Satisfaction',
    value: 4.8,
    suffix: '/5',
    icon: Star,
    color: 'from-accent-500 to-accent-600',
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
    <section ref={inViewRef} className="relative bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {heroStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 text-center shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-6',
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', stat.color)} />
                <div
                  className={cn(
                    'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                    stat.color
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                  {formatStatValue(displayedStats[i], stat.suffix)}
                </div>
                <div className="mt-1 text-sm text-neutral-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
