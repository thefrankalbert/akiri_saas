'use client';

import Link from 'next/link';
import { CalendarBlank, MapPin, Package, Star } from '@phosphor-icons/react';
import { Avatar, Badge, Card, CardContent, Skeleton } from '@/components/ui';
import { StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Listing } from '@/types';

interface ListingGridProps {
  listings: Listing[];
  loading: boolean;
}

export function ListingGrid({ listings, loading }: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="bg-surface-800 rounded-2xl border border-white/[0.08] py-16 text-center">
        <Package weight="duotone" size={48} className="text-surface-300 mx-auto" />
        <h3 className="mt-4 text-lg font-semibold text-neutral-100">Aucune annonce</h3>
        <p className="text-surface-100 mt-2 text-sm">
          Aucune annonce ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <StaggerItem key={listing.id}>
          <Link href={`/annonces/${listing.id}`}>
            <Card
              className="h-full transition-all duration-200 hover:border-white/[0.15]"
              padding="none"
            >
              <CardContent className="p-2.5">
                {/* Route + Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin weight="duotone" size={14} className="text-primary-400" />
                    <span className="font-medium text-neutral-100">{listing.departure_city}</span>
                    <span className="text-surface-300">&rarr;</span>
                    <span className="font-medium text-neutral-100">{listing.arrival_city}</span>
                  </div>
                  <span className="text-surface-200 flex items-center gap-1 text-xs">
                    <CalendarBlank weight="duotone" size={12} />
                    {formatDate(listing.departure_date)}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-2 flex items-center gap-3">
                  <Badge variant="default" size="sm">
                    {listing.available_kg} kg
                  </Badge>
                  <span className="text-primary-400 font-mono text-sm font-bold">
                    {formatCurrency(listing.price_per_kg)}/kg
                  </span>
                </div>

                {/* Categories */}
                {listing.accepted_items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {listing.accepted_items.slice(0, 3).map((item) => (
                      <Badge key={item} variant="outline" size="sm">
                        {item}
                      </Badge>
                    ))}
                    {listing.accepted_items.length > 3 && (
                      <Badge variant="outline" size="sm">
                        +{listing.accepted_items.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Traveler */}
                {listing.traveler && (
                  <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-2">
                    <Avatar
                      src={listing.traveler.avatar_url}
                      firstName={listing.traveler.first_name}
                      lastName={listing.traveler.last_name}
                      size="sm"
                    />
                    <p className="text-surface-50 flex-1 text-xs font-medium">
                      {listing.traveler.first_name} {listing.traveler.last_name.charAt(0)}.
                    </p>
                    {listing.traveler.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star weight="fill" size={12} className="text-amber-400" />
                        <span className="text-xs font-medium text-neutral-100">
                          {listing.traveler.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
