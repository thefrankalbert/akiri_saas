'use client';

import Link from 'next/link';
import { Package, MapPin, Lightbulb, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Avatar,
  Button,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockRequests } from '@/lib/mock-data';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_BADGE_VARIANT } from '@/constants';
import type { BadgeProps } from '@/components/ui';

export function DemandesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Demandes d&apos;envoi</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {mockRequests.length} demande{mockRequests.length > 1 ? 's' : ''} en cours
          </p>
        </div>
      </FadeIn>

      {mockRequests.length === 0 ? (
        <FadeIn>
          <Card className="py-16 text-center">
            <CardContent className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Search className="h-8 w-8 text-neutral-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-700">Aucune demande</h3>
              <p className="mt-2 max-w-sm text-sm text-neutral-500">
                Vous n&apos;avez pas encore de demande d&apos;envoi. Parcourez les annonces pour
                trouver un voyageur.
              </p>
              <Link href="/annonces" className="mt-4">
                <Button leftIcon={<Package className="h-4 w-4" />}>Voir les annonces</Button>
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockRequests.map((request) => {
            const badgeVariant = (REQUEST_STATUS_BADGE_VARIANT[request.status] ||
              'default') as BadgeProps['variant'];

            return (
              <StaggerItem key={request.id}>
                <Link href={`/annonces/${request.listing_id}`}>
                  <Card
                    className="group h-full overflow-hidden transition-shadow hover:shadow-md"
                    padding="none"
                  >
                    {/* Gradient bar */}
                    <div className="from-secondary-400 to-primary-400 h-[3px] bg-gradient-to-r" />
                    <CardContent className="p-5">
                      {/* Status badge */}
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant={badgeVariant}>
                          {REQUEST_STATUS_LABELS[request.status] || request.status}
                        </Badge>
                        <span className="text-xs text-neutral-400">
                          {formatDate(request.created_at)}
                        </span>
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
                          <span>&rarr;</span>
                          <span>{request.listing.arrival_city}</span>
                        </div>
                      )}

                      {/* Weight & Price */}
                      <div className="mt-3 flex items-center gap-3">
                        <Badge variant="primary" size="sm">
                          <Package className="mr-1 h-3 w-3" />
                          {request.weight_kg} kg
                        </Badge>
                        <span className="text-primary-600 text-sm font-bold">
                          {formatCurrency(request.total_price)}
                        </span>
                      </div>

                      {/* Special instructions */}
                      {request.special_instructions && (
                        <p className="mt-2 line-clamp-1 flex items-center gap-1 text-xs text-neutral-400">
                          <Lightbulb className="text-accent-500 h-3 w-3 shrink-0" />
                          {request.special_instructions}
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
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
