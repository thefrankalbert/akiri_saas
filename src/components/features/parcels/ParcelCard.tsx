'use client';

import Link from 'next/link';
import { CalendarBlank, MapPin, Package, Warning, Scales, Star } from '@phosphor-icons/react';
import { Avatar, Badge, Card, CardContent } from '@/components/ui';
import {
  PARCEL_CATEGORIES,
  PARCEL_STATUS_COLORS,
  PARCEL_STATUS_LABELS,
  URGENCY_LEVELS,
} from '@/constants';
import { formatCurrency, formatRelativeDate, cn } from '@/lib/utils';
import type { ParcelPosting } from '@/types';

interface ParcelCardProps {
  parcel: ParcelPosting;
}

export function ParcelCard({ parcel }: ParcelCardProps) {
  const categoryLabel =
    PARCEL_CATEGORIES.find((c) => c.value === parcel.category)?.label ?? parcel.category;
  const urgencyMeta = URGENCY_LEVELS.find((u) => u.value === parcel.urgency);
  const statusLabel = PARCEL_STATUS_LABELS[parcel.status] ?? parcel.status;
  const statusColor = PARCEL_STATUS_COLORS[parcel.status] ?? 'bg-white/10 text-surface-50';

  return (
    <Link href={`/colis/${parcel.id}`}>
      <Card className="h-full transition-all duration-200 hover:border-white/[0.15]" padding="none">
        <CardContent className="overflow-hidden p-2.5">
          {/* Status + Urgency + Fragile badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn('rounded-full', statusColor)} size="sm">
              {statusLabel}
            </Badge>
            {urgencyMeta && urgencyMeta.value !== 'flexible' && (
              <Badge variant="warning" size="sm">
                {urgencyMeta.label}
              </Badge>
            )}
            {parcel.is_fragile && (
              <Badge variant="error" size="sm">
                <Warning weight="bold" size={10} className="mr-0.5" />
                Fragile
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-sm text-neutral-100">{parcel.description}</p>

          {/* Route */}
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <MapPin weight="duotone" size={14} className="text-primary-400 shrink-0" />
            <span className="truncate font-medium text-neutral-100">{parcel.departure_city}</span>
            <span className="text-surface-300 shrink-0">&rarr;</span>
            <span className="truncate font-medium text-neutral-100">{parcel.arrival_city}</span>
          </div>

          {/* Weight + Category + Budget */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">
              <Scales weight="duotone" size={12} className="mr-0.5" />
              {parcel.weight_kg} kg
            </Badge>
            <Badge variant="outline" size="sm">
              {categoryLabel}
            </Badge>
            <span className="text-primary-400 ml-auto font-mono text-sm font-bold">
              {parcel.budget_per_kg
                ? `${formatCurrency(parcel.budget_per_kg)}/kg`
                : 'Offres ouvertes'}
            </span>
          </div>

          {/* Sender + Date */}
          {parcel.sender && (
            <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-2">
              <Avatar
                src={parcel.sender.avatar_url}
                firstName={parcel.sender.first_name}
                lastName={parcel.sender.last_name}
                size="sm"
              />
              <p className="text-surface-50 min-w-0 flex-1 truncate text-xs font-medium">
                {parcel.sender.first_name} {parcel.sender.last_name.charAt(0)}.
              </p>
              {parcel.sender.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star weight="fill" size={12} className="text-amber-400" />
                  <span className="text-xs font-medium text-neutral-100">
                    {parcel.sender.rating.toFixed(1)}
                  </span>
                </div>
              )}
              <span className="text-surface-200 flex shrink-0 items-center gap-1 text-xs">
                <CalendarBlank weight="duotone" size={12} />
                {formatRelativeDate(parcel.created_at)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
