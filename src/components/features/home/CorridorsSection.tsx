'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  GlobeHemisphereWest,
  AirplaneTilt,
  Package,
  TrendUp,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { SUPPORTED_COUNTRIES } from '@/constants';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';
import { mockListings } from '@/lib/mock-data';

export function CorridorsSection() {
  const { inViewRef, inView } = useInView(0.1);

  const topCorridors = useMemo(() => {
    const corridorMap = new Map<
      string,
      {
        count: number;
        from: string;
        to: string;
        fromCountry: string;
        toCountry: string;
        fromFlag: string;
        toFlag: string;
        totalKg: number;
        avgPrice: number;
      }
    >();

    for (const listing of mockListings) {
      const fromCountry = SUPPORTED_COUNTRIES.find((c) => c.name === listing.departure_country);
      const toCountry = SUPPORTED_COUNTRIES.find((c) => c.name === listing.arrival_country);
      if (!fromCountry || !toCountry) continue;

      const key = `${fromCountry.code}-${toCountry.code}`;
      const existing = corridorMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalKg += listing.available_kg;
        existing.avgPrice = (existing.avgPrice + listing.price_per_kg) / 2;
      } else {
        corridorMap.set(key, {
          count: 1,
          from: listing.departure_city,
          to: listing.arrival_city,
          fromCountry: listing.departure_country,
          toCountry: listing.arrival_country,
          fromFlag: fromCountry.flag,
          toFlag: toCountry.flag,
          totalKg: listing.available_kg,
          avgPrice: listing.price_per_kg,
        });
      }
    }

    return Array.from(corridorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, []);

  return (
    <section ref={inViewRef} className="bg-surface-900 relative overflow-hidden py-20 sm:py-28">
      {/* Radial gradient top */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,92,231,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            'flex flex-col items-start justify-between gap-6 transition-all duration-700 sm:flex-row sm:items-end',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div>
            <div className="text-primary-400 flex items-center gap-2 text-sm font-medium">
              <GlobeHemisphereWest weight="duotone" size={16} />
              <span>Corridors actifs</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl lg:text-5xl">
              Les routes les
              <br />
              <span className="text-surface-200">plus populaires.</span>
            </h2>
          </div>
          <Link
            href="/corridors"
            className="group text-primary-400 hover:text-primary-300 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            Voir tous les corridors
            <ArrowRight
              weight="bold"
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Corridor cards */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topCorridors.map((corridor, i) => (
            <Link
              key={i}
              href="/corridors"
              className={cn(
                'glass group hover:border-primary-500/20 relative overflow-hidden rounded-xl p-5 transition-all duration-500 hover:bg-white/[0.06]',
                inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Route flags */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{corridor.fromFlag}</span>
                  <div className="flex flex-col items-center">
                    <div className="via-primary-500 h-px w-8 bg-gradient-to-r from-transparent to-transparent" />
                    <AirplaneTilt weight="duotone" size={12} className="text-primary-400 my-0.5" />
                    <div className="via-primary-500 h-px w-8 bg-gradient-to-r from-transparent to-transparent" />
                  </div>
                  <span className="text-2xl">{corridor.toFlag}</span>
                </div>
                <ArrowRight
                  weight="bold"
                  size={14}
                  className="text-surface-200 group-hover:text-primary-400 ml-auto transition-all group-hover:translate-x-1"
                />
              </div>

              {/* Route name */}
              <p className="mt-3 text-sm font-semibold text-neutral-100">
                {corridor.from}
                <span className="text-surface-200 mx-1.5">&rarr;</span>
                {corridor.to}
              </p>
              <p className="text-surface-100 text-xs">
                {corridor.fromCountry} &rarr; {corridor.toCountry}
              </p>

              {/* Stats row */}
              <div className="mt-4 flex items-center gap-4">
                <div className="text-surface-100 flex items-center gap-1.5 text-xs">
                  <Package weight="duotone" size={12} className="text-primary-400" />
                  <span>
                    <span className="font-medium text-neutral-200">{corridor.count}</span> annonce
                    {corridor.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-surface-100 flex items-center gap-1.5 text-xs">
                  <TrendUp weight="duotone" size={12} className="text-emerald-400" />
                  <span>
                    <span className="font-medium text-neutral-200">{corridor.totalKg}kg</span> dispo
                  </span>
                </div>
              </div>

              {/* Glow on hover */}
              <div className="bg-primary-500/0 group-hover:bg-primary-500/20 pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full blur-2xl transition-all duration-500" />
            </Link>
          ))}
        </div>

        {/* Country pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {SUPPORTED_COUNTRIES.map((country) => (
            <Link key={country.code} href={`/annonces?to=${country.code}`}>
              <span className="glass text-surface-100 hover:border-primary-500/20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/[0.06] hover:text-neutral-100">
                <span className="shrink-0">{country.flag}</span>
                {country.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/corridors">
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl border-white/[0.08] bg-white/[0.03] text-neutral-100 backdrop-blur-xl hover:bg-white/[0.06]"
              rightIcon={<ArrowRight weight="bold" size={16} />}
            >
              Explorer tous les corridors
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
