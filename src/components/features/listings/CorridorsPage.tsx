'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Plane,
  Package,
  Users,
  Calendar,
  Star,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Card, CardContent, Badge, Avatar, Button } from '@/components/ui';
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
  { badge: 'success' | 'warning' | 'info'; label: string; icon: typeof Plane }
> = {
  new_listing: { badge: 'success', label: 'Nouvelle annonce', icon: Package },
  departure_soon: { badge: 'warning', label: 'Départ imminent', icon: Plane },
  delivery_confirmed: { badge: 'info', label: 'Livraison confirmée', icon: CheckCircle2 },
};

// ============================================
// Component
// ============================================

export function CorridorsPage() {
  // --- State ---
  const [visibleEvents, setVisibleEvents] = useState<MockActivityEvent[]>([]);
  const [_currentEventIndex, _setCurrentEventIndex] = useState(0);
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
      .slice(0, 8);
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
      {/* ===== SECTION 1: Hero Stats Bar ===== */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Hub des corridors</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Suivez en temps réel l&apos;activité de la communauté
            </p>
          </div>
          <Badge variant="error" size="md" className="animate-pulse-live flex items-center gap-1.5">
            <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-red-500" />
            EN DIRECT
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: Package,
              label: 'Annonces actives',
              value: displayedStats.listings,
              color: 'text-primary-500',
              bg: 'bg-primary-50',
            },
            {
              icon: TrendingUp,
              label: 'Kilos disponibles',
              value: `${displayedStats.kg} kg`,
              color: 'text-secondary-500',
              bg: 'bg-secondary-50',
            },
            {
              icon: Globe,
              label: 'Corridors actifs',
              value: displayedStats.corridors,
              color: 'text-accent-500',
              bg: 'bg-accent-50',
            },
            {
              icon: Users,
              label: 'Voyageurs',
              value: displayedStats.travelers,
              color: 'text-info',
              bg: 'bg-blue-50',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} padding="sm">
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      stat.bg
                    )}
                  >
                    <Icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <div>
                    <p
                      key={statPulseKey}
                      className="animate-count-pulse text-xl font-bold text-neutral-900"
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-neutral-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ===== SECTION 2: Live Activity Feed ===== */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Radio className="animate-pulse-live h-4 w-4 text-red-500" />
          <h2 className="text-lg font-semibold text-neutral-900">Activité en direct</h2>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {visibleEvents.map((event, index) => {
              const config = ACTIVITY_CONFIG[event.type];
              const Icon = config.icon;
              const { profile, listing } = event;

              return (
                <Link
                  key={`${event.id}-${index}`}
                  href={`/annonces/${listing.id}`}
                  className={cn(
                    'flex items-center gap-3 p-3 transition-colors hover:bg-neutral-50 sm:p-4',
                    index === 0 && 'animate-slide-in-right'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      event.type === 'new_listing' && 'bg-green-100',
                      event.type === 'departure_soon' && 'bg-amber-100',
                      event.type === 'delivery_confirmed' && 'bg-blue-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        event.type === 'new_listing' && 'text-green-600',
                        event.type === 'departure_soon' && 'text-amber-600',
                        event.type === 'delivery_confirmed' && 'text-blue-600'
                      )}
                    />
                  </div>

                  <Avatar
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    size="sm"
                    isVerified={profile.is_verified}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      <span className="font-semibold">
                        {profile.first_name} {profile.last_name.charAt(0)}.
                      </span>
                      {' — '}
                      {listing.departure_city} → {listing.arrival_city}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant={config.badge} size="sm">
                        {config.label}
                      </Badge>
                      {event.type === 'new_listing' && (
                        <span className="text-xs text-neutral-500">
                          {listing.available_kg}kg — {listing.price_per_kg}€/kg
                        </span>
                      )}
                      {event.type === 'departure_soon' && (
                        <span className="text-xs text-neutral-500">
                          {formatDaysUntil(listing.departure_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-xs text-neutral-400">{event.relativeTime}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ===== SECTION 3: Corridors Populaires ===== */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Corridors populaires</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {corridors.map((corridor, index) => {
            const isImminentDeparture =
              corridor.nextDeparture && daysUntil(corridor.nextDeparture.departure_date) <= 7;

            const TrendIcon =
              corridor.trend === 'up'
                ? TrendingUp
                : corridor.trend === 'down'
                  ? TrendingDown
                  : Minus;

            const trendColor =
              corridor.trend === 'up'
                ? 'text-green-500'
                : corridor.trend === 'down'
                  ? 'text-red-500'
                  : 'text-neutral-400';

            return (
              <Link
                key={corridor.key}
                href={`/annonces?from=${corridor.fromCountry.code}&to=${corridor.toCountry.code}`}
                className="animate-slide-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Card
                  className={cn(
                    'h-full transition-all hover:shadow-md',
                    isImminentDeparture && 'ring-2 ring-amber-200'
                  )}
                >
                  <CardContent className="p-4 sm:p-5">
                    {/* Route header */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{corridor.fromCountry.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {corridor.departureCity}
                        </p>
                      </div>
                      <ArrowRight className="text-primary-400 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1 text-right">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {corridor.arrivalCity}
                        </p>
                      </div>
                      <span className="text-2xl">{corridor.toCountry.flag}</span>
                    </div>

                    {/* Stats row */}
                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {corridor.count} annonce{corridor.count > 1 ? 's' : ''}
                      </span>
                      <span className="text-primary-600 flex items-center gap-1 font-medium">
                        ~{corridor.avgPrice} €/kg
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
                      </span>
                    </div>

                    {/* Next departure + Top traveler */}
                    <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                      {corridor.nextDeparture && (
                        <Badge variant={isImminentDeparture ? 'warning' : 'outline'} size="sm">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDaysUntil(corridor.nextDeparture.departure_date)}
                        </Badge>
                      )}
                      {corridor.topTraveler && (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            firstName={corridor.topTraveler.first_name}
                            lastName={corridor.topTraveler.last_name}
                            size="sm"
                            isVerified={corridor.topTraveler.is_verified}
                          />
                          <div className="flex items-center gap-0.5">
                            <Star className="fill-accent-500 text-accent-500 h-3 w-3" />
                            <span className="text-xs font-medium">
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

      {/* ===== SECTION 4: Prochains Départs ===== */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Plane className="text-primary-500 h-5 w-5" />
          <h2 className="text-lg font-semibold text-neutral-900">Prochains départs</h2>
        </div>

        <div className="space-y-3">
          {upcomingDepartures.map((listing) => {
            const days = daysUntil(listing.departure_date);
            const isImminent = days <= 5;
            const traveler = listing.traveler;

            return (
              <Link key={listing.id} href={`/annonces/${listing.id}`}>
                <Card
                  className={cn(
                    'transition-all hover:shadow-md',
                    isImminent && 'border-l-4 border-l-amber-400'
                  )}
                  padding="none"
                >
                  <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                    {traveler && (
                      <Avatar
                        firstName={traveler.first_name}
                        lastName={traveler.last_name}
                        size="md"
                        isVerified={traveler.is_verified}
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {traveler
                          ? `${traveler.first_name} ${traveler.last_name.charAt(0)}.`
                          : 'Voyageur'}
                        {' — '}
                        {listing.departure_city} → {listing.arrival_city}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(listing.departure_date)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Package className="h-3 w-3" />
                          {listing.available_kg} kg
                        </span>
                        <span className="text-primary-600 text-xs font-medium">
                          {listing.price_per_kg} €/kg
                        </span>
                      </div>
                    </div>

                    <Badge variant={isImminent ? 'warning' : 'info'} size="sm" className="shrink-0">
                      {formatDaysUntil(listing.departure_date)}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== SECTION 5: Tous les pays ===== */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Tous les pays</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {SUPPORTED_COUNTRIES.map((country) => (
            <Link key={country.code} href={`/annonces?to=${country.code}`}>
              <span className="hover:border-primary-300 hover:bg-primary-50 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors sm:px-4 sm:py-2">
                <span className="text-lg">{country.flag}</span>
                {country.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== CTA Banner ===== */}
      <div className="from-primary-500 to-primary-600 rounded-2xl bg-gradient-to-r p-6 text-center text-white sm:p-8">
        <h2 className="text-xl font-bold">Votre corridor n&apos;est pas listé ?</h2>
        <p className="text-primary-100 mt-2">
          Publiez une annonce et ouvrez un nouveau corridor pour la communauté !
        </p>
        <Link href="/annonces/new" className="mt-4 inline-block">
          <Button className="text-primary-600 hover:bg-primary-50 border-2 border-white bg-white">
            Publier une annonce
          </Button>
        </Link>
      </div>
    </div>
  );
}
