'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, CalendarBlank, Package, Star, Airplane } from '@phosphor-icons/react';
import { Avatar, Badge, Card, CardContent, Skeleton } from '@/components/ui';
import { supabaseConfigured, createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockListings } from '@/lib/mock-data';
import type { ParcelPosting, Listing } from '@/types';

interface MatchedTravelersProps {
  parcel: ParcelPosting;
}

export function MatchedTravelers({ parcel }: MatchedTravelersProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Mock mode: filter listings by matching countries
      queueMicrotask(() => {
        const matched = mockListings
          .filter(
            (l) =>
              l.departure_country.toLowerCase() === parcel.departure_country.toLowerCase() &&
              l.arrival_country.toLowerCase() === parcel.arrival_country.toLowerCase() &&
              l.status === 'active'
          )
          .slice(0, 5);
        setListings(matched);
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchMatches = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('listings')
        .select('*, traveler:profiles!traveler_id(*)')
        .eq('departure_country', parcel.departure_country)
        .eq('arrival_country', parcel.arrival_country)
        .eq('status', 'active')
        .gte('available_kg', parcel.weight_kg)
        .order('departure_date', { ascending: true })
        .limit(5);

      if (controller.signal.aborted) return;

      setListings((data as Listing[]) || []);
      setLoading(false);
    };

    fetchMatches();

    return () => controller.abort();
  }, [parcel.departure_country, parcel.arrival_country, parcel.weight_kg]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Airplane weight="duotone" size={18} className="text-primary-400" />
        <h3 className="text-surface-50 text-sm font-semibold">
          Voyageurs compatibles ({listings.length})
        </h3>
      </div>
      <div className="space-y-2">
        {listings.map((listing) => (
          <Link key={listing.id} href={`/annonces/${listing.id}`}>
            <Card className="transition-all duration-200 hover:border-white/[0.15]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {listing.traveler && (
                    <Avatar
                      src={listing.traveler.avatar_url}
                      firstName={listing.traveler.first_name}
                      lastName={listing.traveler.last_name}
                      size="sm"
                      isVerified={listing.traveler.is_verified}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin weight="duotone" size={12} className="text-primary-400 shrink-0" />
                      <span className="truncate font-medium text-neutral-100">
                        {listing.departure_city}
                      </span>
                      <span className="text-surface-300 shrink-0">&rarr;</span>
                      <span className="truncate font-medium text-neutral-100">
                        {listing.arrival_city}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-surface-100 flex items-center gap-1">
                        <CalendarBlank weight="duotone" size={12} />
                        {formatDate(listing.departure_date)}
                      </span>
                      <Badge variant="default" size="sm">
                        <Package weight="duotone" size={10} className="mr-0.5" />
                        {listing.available_kg} kg
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-400 font-mono text-sm font-bold">
                      {formatCurrency(listing.price_per_kg)}/kg
                    </p>
                    {listing.traveler && listing.traveler.rating > 0 && (
                      <div className="flex items-center justify-end gap-0.5">
                        <Star weight="fill" size={10} className="text-amber-400" />
                        <span className="text-surface-100 text-xs">
                          {listing.traveler.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
