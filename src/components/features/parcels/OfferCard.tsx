'use client';

import Link from 'next/link';
import { CalendarBlank, ChatCircle, Check, X, ArrowSquareOut, Star } from '@phosphor-icons/react';
import { Avatar, Badge, Button, Card, CardContent } from '@/components/ui';
import { OFFER_STATUS_LABELS, OFFER_STATUS_COLORS } from '@/constants';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { CarryOffer } from '@/types';

interface OfferCardProps {
  offer: CarryOffer;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
}

export function OfferCard({ offer, onAccept, onReject }: OfferCardProps) {
  const statusLabel = OFFER_STATUS_LABELS[offer.status] ?? offer.status;
  const statusColor = OFFER_STATUS_COLORS[offer.status] ?? 'bg-white/10 text-surface-50';

  return (
    <Card className="transition-all duration-200 hover:border-white/[0.15]">
      <CardContent className="p-4">
        {/* Traveler info + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {offer.traveler && (
              <Avatar
                src={offer.traveler.avatar_url}
                firstName={offer.traveler.first_name}
                lastName={offer.traveler.last_name}
                size="md"
                isVerified={offer.traveler.is_verified}
              />
            )}
            <div className="min-w-0">
              {offer.traveler && (
                <p className="truncate font-semibold text-neutral-100">
                  {offer.traveler.first_name} {offer.traveler.last_name}
                </p>
              )}
              {offer.traveler && offer.traveler.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="fill-accent-500 text-accent-500" size={14} />
                  <span className="text-xs font-medium text-neutral-100">
                    {offer.traveler.rating.toFixed(1)}
                  </span>
                  <span className="text-surface-200 text-xs">
                    ({offer.traveler.total_reviews} avis)
                  </span>
                </div>
              )}
            </div>
          </div>

          <Badge className={cn('shrink-0 rounded-full', statusColor)} size="sm">
            {statusLabel}
          </Badge>
        </div>

        {/* Proposed price + departure date */}
        <div className="mt-3 flex items-center gap-4">
          <div className="bg-primary-500/10 rounded-xl px-3 py-2 text-center">
            <p className="text-primary-400 font-mono text-lg font-bold">
              {formatCurrency(offer.proposed_price)}
            </p>
            <p className="text-surface-100 text-xs">Prix propose</p>
          </div>
          <div className="text-surface-100 flex items-center gap-1.5 text-sm">
            <CalendarBlank weight="duotone" size={16} className="text-surface-200" />
            <span>Depart: {formatDate(offer.departure_date)}</span>
          </div>
        </div>

        {/* Message */}
        {offer.message && (
          <div className="mt-3 flex items-start gap-2">
            <ChatCircle weight="duotone" size={16} className="text-surface-200 mt-0.5 shrink-0" />
            <p className="text-surface-100 text-sm leading-relaxed">{offer.message}</p>
          </div>
        )}

        {/* Link to traveler's listing */}
        {offer.listing_id && (
          <Link
            href={`/annonces/${offer.listing_id}`}
            className="text-primary-400 hover:text-primary-300 mt-3 inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <ArrowSquareOut size={14} />
            Voir l&apos;annonce du voyageur
          </Link>
        )}

        {/* Accept / Reject actions (only for pending offers) */}
        {offer.status === 'pending' && (onAccept || onReject) && (
          <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3">
            {onAccept && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept(offer.id)}
                leftIcon={<Check size={16} />}
              >
                Accepter
              </Button>
            )}
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onReject(offer.id)}
                leftIcon={<X size={16} />}
              >
                Refuser
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
