'use client';

import { MapPin, Package, Star, LockKey, Copy } from '@phosphor-icons/react';
import { Card, CardContent, Avatar, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ShipmentRequest, Profile } from '@/types';

interface RequestDetailsProps {
  request: ShipmentRequest;
  role: 'sender' | 'traveler';
  counterparty: Profile | undefined;
  onCopyCode: () => void;
}

export function RequestDetails({ request, role, counterparty, onCopyCode }: RequestDetailsProps) {
  return (
    <>
      {/* Info */}
      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-semibold text-neutral-100">{request.item_description}</h2>

          {request.listing && (
            <div className="text-surface-100 flex items-center gap-1.5 text-sm">
              <MapPin weight="duotone" size={14} />
              <span>
                {request.listing.departure_city} &rarr; {request.listing.arrival_city}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Badge variant="default" size="sm">
              <Package weight="duotone" size={12} className="mr-1" />
              {request.weight_kg} kg
            </Badge>
            <span className="text-primary-400 font-mono font-bold">
              {formatCurrency(request.total_price)}
            </span>
          </div>

          {request.special_instructions && (
            <p className="text-surface-100 text-xs">
              <span className="text-surface-50 font-medium">Instructions : </span>
              {request.special_instructions}
            </p>
          )}

          <p className="text-surface-200 text-xs">Créée le {formatDate(request.created_at)}</p>
        </CardContent>
      </Card>

      {/* Counterparty */}
      {counterparty && (
        <Card className="mb-4">
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar
              src={counterparty.avatar_url}
              firstName={counterparty.first_name}
              lastName={counterparty.last_name}
              size="md"
              isVerified={counterparty.is_verified}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-100">
                {counterparty.first_name} {counterparty.last_name}
              </p>
              {counterparty.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star weight="fill" size={12} className="text-amber-400" />
                  <span className="text-surface-100 text-xs">
                    {counterparty.rating.toFixed(1)} ({counterparty.total_reviews} avis)
                  </span>
                </div>
              )}
            </div>
            <span className="text-surface-200 text-xs">
              {role === 'sender' ? 'Voyageur' : 'Expéditeur'}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Confirmation code */}
      {role === 'sender' &&
        request.confirmation_code &&
        ['paid', 'collected', 'in_transit', 'delivered', 'confirmed'].includes(request.status) && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="text-surface-100 flex items-center gap-2 text-sm">
                <LockKey weight="duotone" size={16} className="text-primary-400" />
                <span className="font-medium">Code de confirmation</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-surface-700 rounded-lg px-4 py-2 font-mono text-lg font-bold tracking-widest text-neutral-100">
                  {request.confirmation_code}
                </span>
                <button
                  onClick={onCopyCode}
                  className="text-surface-200 hover:bg-surface-700 rounded-lg p-2 transition-colors hover:text-neutral-100"
                >
                  <Copy weight="duotone" size={16} />
                </button>
              </div>
              <p className="text-surface-200 mt-1 text-xs">
                Communiquez ce code au voyageur à la livraison.
              </p>
            </CardContent>
          </Card>
        )}
    </>
  );
}
