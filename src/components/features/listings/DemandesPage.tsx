'use client';

import Link from 'next/link';
import { Package, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockRequests } from '@/lib/mock-data';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/constants';

export function DemandesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Demandes d&apos;envoi</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {mockRequests.length} demande{mockRequests.length > 1 ? 's' : ''} en cours
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockRequests.map((request) => (
          <Link key={request.id} href={`/annonces/${request.listing_id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                {/* Status badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      REQUEST_STATUS_COLORS[request.status] || 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {REQUEST_STATUS_LABELS[request.status] || request.status}
                  </span>
                  <span className="text-xs text-neutral-400">{formatDate(request.created_at)}</span>
                </div>

                {/* Item description */}
                <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
                  {request.item_description}
                </h3>

                {/* Route from listing */}
                {request.listing && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3" />
                    <span>{request.listing.departure_city}</span>
                    <span>→</span>
                    <span>{request.listing.arrival_city}</span>
                  </div>
                )}

                {/* Weight & Price */}
                <div className="mt-3 flex items-center gap-3">
                  <Badge variant="default" size="sm">
                    <Package className="mr-1 h-3 w-3" />
                    {request.weight_kg} kg
                  </Badge>
                  <span className="text-primary-600 text-sm font-bold">
                    {formatCurrency(request.total_price)}
                  </span>
                </div>

                {/* Special instructions */}
                {request.special_instructions && (
                  <p className="mt-2 line-clamp-1 text-xs text-neutral-400">
                    💡 {request.special_instructions}
                  </p>
                )}

                {/* Sender */}
                {request.sender && (
                  <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
                    <Avatar
                      firstName={request.sender.first_name}
                      lastName={request.sender.last_name}
                      size="sm"
                    />
                    <span className="text-xs font-medium text-neutral-600">
                      {request.sender.first_name} {request.sender.last_name.charAt(0)}.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
