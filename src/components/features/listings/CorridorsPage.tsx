'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  GlobeHemisphereWest,
  TrendUp,
  TrendDown,
  Minus,
  AirplaneTilt,
  Package,
  UsersThree,
  CalendarBlank,
  Star,
  CheckCircle,
  Broadcast,
} from '@phosphor-icons/react';
import { Card, CardContent, Badge, Avatar } from '@/components/ui';
import { SUPPORTED_COUNTRIES } from '@/constants';
import { cn, formatDate } from '@/lib/utils';
import {
  mockListings,
  mockActivityFeed,
  type MockActivityEvent,
  type ActivityEventType,
} from '@/lib/mock-data';
import type { Listing, Profile } from '@/types';

// ============================================
// Types & Helpers
// ============================================

interface ComputedCorridor {
  fromCountry: (typeof SUPPORTED_COUNTRIES)[number];
  toCountry: (typeof SUPPORTED_COUNTRIES)[number];
  key: string;
  departureCity: string;
  arrivalCity: string;
  listings: Listing[];
  count: number;
  avgPrice: number;
  totalKg: number;
  nextDeparture: Listing | null;
  topTraveler: Profile | null;
  trend: 'up' | 'down' | 'stable';
}

function findCountryByName(name: string) {
  return SUPPORTED_COUNTRIES.find((c) => c.name === name);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

function formatDaysUntil(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} j`;
}

function getTrend(index: number): 'up' | 'down' | 'stable' {
  const trends: Array<'up' | 'down' | 'stable'> = [
    'up',
    'up',
    'stable',
    'up',
    'down',
    'stable',
    'up',
    'stable',
    'up',
    'down',
    'stable',
  ];
  return trends[index % trends.length];
}

const ACTIVITY_CONFIG: Record<
  ActivityEventType,
  { badge: 'success' | 'warning' | 'info'; label: string; icon: typeof AirplaneTilt }
> = {
  new_listing: { badge: 'success', label: 'Nouvelle annonce', icon: Package },
  departure_soon: { badge: 'warning', label: 'Départ imminent', icon: AirplaneTilt },
  delivery_confirmed: { badge: 'info', label: 'Livraison confirmée', icon: CheckCircle },
};

// ============================================
// Component
// ============================================

export function CorridorsPage() {
  // --- State ---
  const [visibleEvents, setVisibleEvents] = useState<MockActivityEvent[]>([]);
  const [, setCurrentEventIndex] = useState(0);
  const [displayedStats, setDisplayedStats] = useState({
    listings: 0,
    kg: 0,
    corridors: 0,
    travelers: 0,
  });
  const [statPulseKey, setStatPulseKey] = useState(0);

  // --- Computed data ---
  const corridors = useMemo(() => {
    const corridorMap = new Map<string, Listing[]>();

    for (const listing of mockListings) {
      const key = `${listing.departure_city}-${listing.arrival_city}`;
      if (!corridorMap.has(key)) corridorMap.set(key, []);
      corridorMap.get(key)!.push(listing);
    }

    const result: ComputedCorridor[] = [];

    Array.from(corridorMap.entries()).forEach(([key, listings], index) => {
      const first = listings[0];
      const fromCountry = findCountryByName(first.departure_country);
      const toCountry = findCountryByName(first.arrival_country);

      if (!fromCountry || !toCountry) return;

      const sorted = [...listings].sort(
        (a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
      );

      const avgPrice = Math.round(
        listings.reduce((sum, l) => sum + l.price_per_kg, 0) / listings.length
      );

      const totalKg = listings.reduce((sum, l) => sum + l.available_kg, 0);

      const topTraveler =
        listings
          .map((l) => l.traveler)
          .filter((t): t is Profile => !!t)
          .sort((a, b) => b.rating - a.rating)[0] || null;

      result.push({
        fromCountry,
        toCountry,
        key,
        departureCity: first.departure_city,
        arrivalCity: first.arrival_city,
        listings,
        count: listings.length,
        avgPrice,
        totalKg,
        nextDeparture: sorted[0] ?? null,
        topTraveler,
        trend: getTrend(index),
      });
    });

    return result.sort((a, b) => b.count - a.count);
  }, []);

  const aggregateStats = useMemo(() => {
    const uniqueTravelerIds = new Set(mockListings.map((l) => l.traveler_id));
    return {
      listings: mockListings.length,
      kg: mockListings.reduce((sum, l) => sum + l.available_kg, 0),
      corridors: corridors.length,
      travelers: uniqueTravelerIds.size,
    };
  }, [corridors]);

  const upcomingDepartures = useMemo(() => {
    return [...mockListings]
      .sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())
      .slice(0, 5);
  }, []);

  // --- Effects ---

  // Animated counter on mount
  useEffect(() => {
    const target = aggregateStats;
    const steps = 30;
    const interval = 1500 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);

      setDisplayedStats({
        listings: Math.round(target.listings * eased),
        kg: Math.round(target.kg * eased),
        corridors: Math.round(target.corridors * eased),
        travelers: Math.round(target.travelers * eased),
      });

      if (step >= steps) {
        clearInterval(timer);
        setDisplayedStats(target);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [aggregateStats]);

  // Live activity feed cycling
  useEffect(() => {
    setVisibleEvents(mockActivityFeed.slice(0, 3));
    setCurrentEventIndex(3);

    const timer = setInterval(() => {
      setCurrentEventIndex((prev) => {
        const nextIndex = (prev + 1) % mockActivityFeed.length;

        setVisibleEvents((prevEvents) => {
          const newEvent = mockActivityFeed[nextIndex];
          return [newEvent, ...prevEvents].slice(0, 5);
        });

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Periodic stat pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setStatPulseKey((prev) => prev + 1);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  // --- Render ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ===== PAGE HEADER ===== */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
            Hub des corridors
          </h1>
          <p className="text-surface-100 mt-1 text-sm">
            Suivez en temps réel l&apos;activité de la communauté
          </p>
        </div>
        <Badge
          variant="error"
          size="sm"
          className="animate-pulse-live mt-1 flex items-center gap-1.5"
        >
          <span className="animate-pulse-dot bg-error inline-block h-2 w-2 rounded-full" />
          EN DIRECT
        </Badge>
      </div>

      {/* ===== STATS BAR ===== */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: Package,
            label: 'Annonces actives',
            value: displayedStats.listings,
            color: 'text-primary-400',
            bg: 'bg-primary-500/10',
          },
          {
            icon: TrendUp,
            label: 'Kilos disponibles',
            value: `${displayedStats.kg} kg`,
            color: 'text-success',
            bg: 'bg-success/10',
          },
          {
            icon: GlobeHemisphereWest,
            label: 'Corridors actifs',
            value: displayedStats.corridors,
            color: 'text-accent-400',
            bg: 'bg-accent-500/10',
          },
          {
            icon: UsersThree,
            label: 'Voyageurs',
            value: displayedStats.travelers,
            color: 'text-info',
            bg: 'bg-info/10',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="none">
              <CardContent className="flex items-center gap-2.5 p-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    stat.bg
                  )}
                >
                  <Icon weight="duotone" size={16} className={stat.color} />
                </div>
                <div className="min-w-0">
                  <p
                    key={statPulseKey}
                    className="animate-count-pulse font-mono text-base font-semibold text-neutral-100"
                  >
                    {stat.value}
                  </p>
                  <p className="text-surface-100 truncate text-[11px]">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== MAIN CONTENT: 2-column layout on desktop ===== */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* LEFT: Corridors populaires (2/3) */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-neutral-100">Corridors populaires</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {corridors.map((corridor, index) => {
              const isImminentDeparture =
                corridor.nextDeparture && daysUntil(corridor.nextDeparture.departure_date) <= 7;

              const TrendIcon =
                corridor.trend === 'up' ? TrendUp : corridor.trend === 'down' ? TrendDown : Minus;

              const trendColor =
                corridor.trend === 'up'
                  ? 'text-success'
                  : corridor.trend === 'down'
                    ? 'text-error'
                    : 'text-surface-300';

              return (
                <Link
                  key={corridor.key}
                  href={`/annonces?from=${corridor.fromCountry.code}&to=${corridor.toCountry.code}`}
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <Card
                    className={cn(
                      'hover:bg-surface-700 h-full transition-all duration-200 hover:border-white/[0.15]',
                      isImminentDeparture && 'ring-warning/30 ring-2'
                    )}
                  >
                    <CardContent className="p-3">
                      {/* Route header */}
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-base">{corridor.fromCountry.flag}</span>
                        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-100">
                          {corridor.departureCity}
                        </p>
                        <ArrowRight weight="bold" size={12} className="text-primary-400 shrink-0" />
                        <p className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-neutral-100">
                          {corridor.arrivalCity}
                        </p>
                        <span className="shrink-0 text-base">{corridor.toCountry.flag}</span>
                      </div>

                      {/* Stats row */}
                      <div className="text-surface-100 mt-2 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <Package weight="duotone" size={11} />
                          {corridor.count} annonce{corridor.count > 1 ? 's' : ''}
                        </span>
                        <span className="text-primary-400 font-mono font-medium">
                          ~{corridor.avgPrice} €/kg
                        </span>
                        <TrendIcon weight="duotone" size={12} className={trendColor} />
                      </div>

                      {/* Next departure + Top traveler */}
                      <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2">
                        {corridor.nextDeparture && (
                          <Badge variant={isImminentDeparture ? 'warning' : 'outline'} size="sm">
                            <CalendarBlank weight="duotone" size={10} className="mr-0.5" />
                            {formatDaysUntil(corridor.nextDeparture.departure_date)}
                          </Badge>
                        )}
                        {corridor.topTraveler && (
                          <div className="flex items-center gap-1">
                            <Avatar
                              firstName={corridor.topTraveler.first_name}
                              lastName={corridor.topTraveler.last_name}
                              size="sm"
                              isVerified={corridor.topTraveler.is_verified}
                            />
                            <div className="flex items-center gap-0.5">
                              <Star weight="fill" size={10} className="text-amber-400" />
                              <span className="text-[11px] font-medium text-neutral-100">
                                {corridor.topTraveler.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Activity feed sidebar (1/3) */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Broadcast weight="duotone" size={16} className="animate-pulse-live text-error" />
            <h2 className="text-sm font-semibold text-neutral-100">Activité en direct</h2>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {visibleEvents.map((event, index) => {
                const config = ACTIVITY_CONFIG[event.type];
                const Icon = config.icon;
                const { profile, listing } = event;

                return (
                  <Link
                    key={`${event.id}-${index}`}
                    href={`/annonces/${listing.id}`}
                    className={cn(
                      'hover:bg-surface-700 flex items-start gap-2.5 p-3 transition-colors',
                      index === 0 && 'animate-slide-in-right'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        event.type === 'new_listing' && 'bg-success/10',
                        event.type === 'departure_soon' && 'bg-warning/10',
                        event.type === 'delivery_confirmed' && 'bg-info/10'
                      )}
                    >
                      <Icon
                        weight="duotone"
                        size={14}
                        className={cn(
                          event.type === 'new_listing' && 'text-success',
                          event.type === 'departure_soon' && 'text-warning',
                          event.type === 'delivery_confirmed' && 'text-info'
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-100">
                        {profile.first_name} {profile.last_name.charAt(0)}.
                      </p>
                      <p className="text-surface-100 mt-0.5 truncate text-xs">
                        {listing.departure_city} → {listing.arrival_city}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={config.badge} size="sm">
                          {config.label}
                        </Badge>
                        <span className="text-surface-200 text-[10px]">{event.relativeTime}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ===== BOTTOM: Departures + Countries side by side ===== */}
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* LEFT: Prochains départs (3/5) */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <AirplaneTilt weight="duotone" size={18} className="text-primary-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Prochains départs</h2>
          </div>

          <div className="space-y-2">
            {upcomingDepartures.map((listing) => {
              const days = daysUntil(listing.departure_date);
              const isImminent = days <= 5;
              const traveler = listing.traveler;

              return (
                <Link key={listing.id} href={`/annonces/${listing.id}`}>
                  <Card
                    className={cn(
                      'hover:bg-surface-700 transition-all duration-200 hover:border-white/[0.15]',
                      isImminent && 'border-l-warning border-l-2'
                    )}
                    padding="none"
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      {traveler && (
                        <Avatar
                          firstName={traveler.first_name}
                          lastName={traveler.last_name}
                          size="sm"
                          isVerified={traveler.is_verified}
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-100">
                          {traveler
                            ? `${traveler.first_name} ${traveler.last_name.charAt(0)}.`
                            : 'Voyageur'}
                          {' — '}
                          {listing.departure_city} → {listing.arrival_city}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="text-surface-100 flex items-center gap-1 text-xs">
                            <CalendarBlank weight="duotone" size={12} />
                            {formatDate(listing.departure_date)}
                          </span>
                          <span className="text-surface-100 flex items-center gap-1 text-xs">
                            <Package weight="duotone" size={12} />
                            {listing.available_kg} kg
                          </span>
                          <span className="text-primary-400 font-mono text-xs font-medium">
                            {listing.price_per_kg} €/kg
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={isImminent ? 'warning' : 'info'}
                        size="sm"
                        className="shrink-0"
                      >
                        {formatDaysUntil(listing.departure_date)}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Tous les pays (2/5) */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-100">Tous les pays</h2>
          <Card padding="none">
            <CardContent className="flex flex-wrap gap-2 p-4">
              {SUPPORTED_COUNTRIES.map((country) => (
                <Link key={country.code} href={`/annonces?to=${country.code}`}>
                  <span className="bg-surface-700 hover:border-primary-500/30 hover:bg-surface-600 inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-sm font-medium text-neutral-100 transition-colors">
                    <span className="text-base">{country.flag}</span>
                    {country.name}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== CTA Banner ===== */}
      <Card
        padding="none"
        className="from-primary-600 to-primary-700 overflow-hidden border-0 bg-gradient-to-r"
      >
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Votre corridor n&apos;est pas listé ?
            </h2>
            <p className="text-primary-100 mt-1 text-sm">
              Publiez une annonce et ouvrez un nouveau corridor pour la communauté.
            </p>
          </div>
          <Link
            href="/annonces/new"
            className="text-primary-700 inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100"
          >
            Publier une annonce
            <ArrowRight weight="bold" size={16} />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
