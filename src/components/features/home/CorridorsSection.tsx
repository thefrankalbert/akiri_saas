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
  const { inViewRef, inView } = useInView(0.15);

  const topCorridors = useMemo(() => {
    const corridorMap = new Map<
      string,
      { count: number; from: string; to: string; fromFlag: string; toFlag: string; totalKg: number }
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
      } else {
        corridorMap.set(key, {
          count: 1,
          from: listing.departure_city,
          to: listing.arrival_city,
          fromFlag: fromCountry.flag,
          toFlag: toCountry.flag,
          totalKg: listing.available_kg,
        });
      }
    }

    return Array.from(corridorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, []);

  return (
    <section ref={inViewRef} className="bg-neutral-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'mx-auto max-w-2xl text-center transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="bg-primary-50 text-primary-600 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <GlobeHemisphereWest weight="duotone" size={16} />
            Corridors
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            Les routes les plus actives
          </h2>
          <p className="mt-3 text-neutral-500">
            Des voyageurs disponibles chaque semaine sur ces corridors
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topCorridors.map((corridor, i) => (
            <Link
              key={i}
              href="/corridors"
              className={cn(
                'transition-all duration-500',
                inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="group hover:border-primary-200 relative overflow-hidden rounded-lg border border-neutral-200/60 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-3xl">
                    <span className="shrink-0">{corridor.fromFlag}</span>
                    <div className="bg-primary-50 flex h-7 w-7 items-center justify-center rounded-full">
                      <AirplaneTilt weight="duotone" size={14} className="text-primary-600" />
                    </div>
                    <span className="shrink-0">{corridor.toFlag}</span>
                  </div>
                  <ArrowRight
                    weight="bold"
                    size={16}
                    className="group-hover:text-primary-500 ml-auto text-neutral-300 transition-transform group-hover:translate-x-1"
                  />
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-neutral-900">
                  {corridor.from} &rarr; {corridor.to}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Package weight="duotone" size={12} />
                    {corridor.count} annonce{corridor.count > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendUp weight="duotone" size={12} className="text-primary-500" />
                    {corridor.totalKg}kg dispo
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Country pills */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
          {SUPPORTED_COUNTRIES.map((country) => (
            <Link key={country.code} href={`/annonces?to=${country.code}`}>
              <span className="hover:border-primary-200 hover:bg-primary-50 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200/60 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors">
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
              className="rounded-xl"
              rightIcon={<ArrowRight weight="bold" size={16} />}
            >
              Explorer le hub des corridors
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
