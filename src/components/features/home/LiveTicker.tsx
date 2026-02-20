'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui';
import { mockListings } from '@/lib/mock-data';

interface LiveFeedItem {
  travelerName: string;
  departure: string;
  arrival: string;
  kg: number;
  price: number;
}

export function LiveTicker() {
  const liveFeedItems: LiveFeedItem[] = useMemo(() => {
    return mockListings.slice(0, 10).map((listing) => ({
      travelerName: listing.traveler
        ? `${listing.traveler.first_name} ${listing.traveler.last_name?.charAt(0)}.`
        : 'Voyageur',
      departure: listing.departure_city,
      arrival: listing.arrival_city,
      kg: listing.available_kg,
      price: listing.price_per_kg,
    }));
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-neutral-950 py-3">
      <div className="flex items-center">
        <div className="z-10 flex shrink-0 items-center gap-1.5 bg-neutral-950 pr-2 pl-3 sm:gap-2 sm:pr-3 sm:pl-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase sm:text-xs">
            Live
          </span>
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="animate-marquee flex gap-8 whitespace-nowrap">
            {[...liveFeedItems, ...liveFeedItems].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-sm text-neutral-400">
                <span className="font-semibold text-neutral-200">{item.travelerName}</span>
                <span className="text-primary-400">&rarr;</span>
                <span>
                  {item.departure} &rarr; {item.arrival}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-white/5 text-neutral-400 ring-white/10"
                >
                  {item.kg}kg
                </Badge>
                <span className="text-primary-400 font-medium">{item.price}&euro;/kg</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
