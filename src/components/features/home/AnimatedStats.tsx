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
  },
  {
    label: 'Colis livrés',
    value: 15000,
    suffix: '+',
    icon: Package,
  },
  {
    label: 'Corridors',
    value: 25,
    suffix: '+',
    icon: GlobeHemisphereWest,
  },
  {
    label: 'Satisfaction',
    value: 4.8,
    suffix: '/5',
    icon: Star,
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
    <section ref={inViewRef} className="relative bg-neutral-950 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {heroStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'group relative overflow-hidden rounded-lg border border-white/5 bg-white/5 p-5 text-center transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.08] sm:p-6',
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                  <Icon weight="duotone" size={24} className="text-primary-400" />
                </div>
                <div className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {formatStatValue(displayedStats[i], stat.suffix)}
                </div>
                <div className="mt-1 text-sm text-neutral-400">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
