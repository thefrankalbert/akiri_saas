'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, MapPin, CheckCircle, XCircle, CreditCard } from '@phosphor-icons/react';
import { Card, CardContent, Badge, Avatar, Button } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/constants';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';
import type { ShipmentRequest } from '@/types';

interface RequestCardProps {
  request: ShipmentRequest;
  role: 'sender' | 'traveler';
  onAction?: () => void;
}

export function RequestCard({ request, role, onAction }: RequestCardProps) {
  const router = useRouter();
  const counterparty = role === 'sender' ? request.listing?.traveler : request.sender;

  const handleAction = async (action: string) => {
    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 300));
      if (action === 'accept') toasts.requestAccepted();
      if (action === 'cancel') toasts.requestCancelled();
      if (action === 'pay') router.push(`/demandes/${request.id}`);
      if (action === 'confirm') router.push(`/demandes/${request.id}`);
      onAction?.();
      return;
    }

    try {
      if (action === 'accept') {
        await fetch(`/api/requests/${request.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' }),
        });
        toasts.requestAccepted();
      } else if (action === 'cancel') {
        await fetch(`/api/requests/${request.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        toasts.requestCancelled();
      } else if (action === 'pay') {
        router.push(`/demandes/${request.id}`);
      } else if (action === 'confirm') {
        router.push(`/demandes/${request.id}`);
      }
      onAction?.();
    } catch {
      toasts.genericError();
    }
  };

  return (
    <Link href={`/demandes/${request.id}`}>
      <Card className="h-full transition-colors hover:border-neutral-300">
        <CardContent className="p-3">
          {/* Status + date */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                REQUEST_STATUS_COLORS[request.status] || 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {REQUEST_STATUS_LABELS[request.status] || request.status}
            </span>
            <span className="text-[11px] text-neutral-400">{formatDate(request.created_at)}</span>
          </div>

          {/* Description */}
          <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">
            {request.item_description}
          </h3>

          {/* Route */}
          {request.listing && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-500">
              <MapPin weight="duotone" size={12} />
              <span>{request.listing.departure_city}</span>
              <span>&rarr;</span>
              <span>{request.listing.arrival_city}</span>
            </div>
          )}

          {/* Weight + Price */}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="default" size="sm">
              <Package weight="duotone" size={12} className="mr-1" />
              {request.weight_kg} kg
            </Badge>
            <span className="text-primary-600 text-sm font-bold">
              {formatCurrency(request.total_price)}
            </span>
          </div>

          {/* Counterparty */}
          {counterparty && (
            <div className="mt-2 flex items-center gap-2 border-t border-neutral-100 pt-2">
              <Avatar
                firstName={counterparty.first_name}
                lastName={counterparty.last_name}
                src={counterparty.avatar_url}
                size="sm"
              />
              <span className="text-xs font-medium text-neutral-600">
                {counterparty.first_name} {counterparty.last_name.charAt(0)}.
              </span>
            </div>
          )}

          {/* Inline actions */}
          {role === 'traveler' && request.status === 'pending' && (
            <div
              className="mt-2 flex gap-2 border-t border-neutral-100 pt-2"
              onClick={(e) => e.preventDefault()}
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => handleAction('accept')}
                leftIcon={<CheckCircle weight="duotone" size={14} />}
              >
                Accepter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs text-red-600"
                onClick={() => handleAction('cancel')}
                leftIcon={<XCircle weight="duotone" size={14} />}
              >
                Refuser
              </Button>
            </div>
          )}

          {role === 'sender' && request.status === 'accepted' && (
            <div
              className="mt-2 border-t border-neutral-100 pt-2"
              onClick={(e) => e.preventDefault()}
            >
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={() => handleAction('pay')}
                leftIcon={<CreditCard weight="duotone" size={14} />}
              >
                Payer
              </Button>
            </div>
          )}

          {role === 'sender' && request.status === 'delivered' && (
            <div
              className="mt-2 border-t border-neutral-100 pt-2"
              onClick={(e) => e.preventDefault()}
            >
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={() => handleAction('confirm')}
                leftIcon={<CheckCircle weight="duotone" size={14} />}
              >
                Confirmer la livraison
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
