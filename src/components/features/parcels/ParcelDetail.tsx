'use client';

import Link from 'next/link';
import {
  MapPin,
  CalendarBlank,
  Package,
  Star,
  ShieldCheck,
  ChatCircle,
  ArrowLeft,
  Clock,
  Warning,
  Scales,
  Airplane,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { MakeOfferModal } from './MakeOfferModal';
import { OfferCard } from './OfferCard';
import { MatchedTravelers } from './MatchedTravelers';
import { useParcelDetail } from '@/lib/hooks/use-parcel-detail';
import { formatCurrency, formatDate, formatRelativeDate, cn } from '@/lib/utils';
import {
  PARCEL_CATEGORIES,
  PARCEL_STATUS_LABELS,
  PARCEL_STATUS_COLORS,
  URGENCY_LEVELS,
} from '@/constants';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';

interface ParcelDetailProps {
  parcelId: string;
}

export function ParcelDetail({ parcelId }: ParcelDetailProps) {
  const { parcel, offers, loading, error, refetch } = useParcelDetail(parcelId);

  // Accept / reject offer handlers
  const handleAcceptOffer = async (offerId: string) => {
    if (!supabaseConfigured) {
      toasts.requestAccepted();
      return;
    }
    try {
      const res = await fetch(`/api/parcels/${parcelId}/offers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, status: 'accepted' }),
      });
      if (!res.ok) {
        toasts.genericError();
        return;
      }
      toasts.requestAccepted();
      refetch();
    } catch {
      toasts.genericError();
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!supabaseConfigured) {
      toasts.requestCancelled();
      return;
    }
    try {
      const res = await fetch(`/api/parcels/${parcelId}/offers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, status: 'rejected' }),
      });
      if (!res.ok) {
        toasts.genericError();
        return;
      }
      toasts.requestCancelled();
      refetch();
    } catch {
      toasts.genericError();
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error / Not found state ---
  if (error || !parcel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:px-7 lg:px-8">
        <Package className="text-surface-300 mx-auto" size={64} />
        <h2 className="mt-4 text-xl font-semibold text-neutral-100">
          {error || 'Colis introuvable'}
        </h2>
        <Link href="/colis" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
            Retour aux colis
          </Button>
        </Link>
      </div>
    );
  }

  const categoryLabel =
    PARCEL_CATEGORIES.find((c) => c.value === parcel.category)?.label ?? parcel.category;
  const urgencyMeta = URGENCY_LEVELS.find((u) => u.value === parcel.urgency);
  const statusLabel = PARCEL_STATUS_LABELS[parcel.status] ?? parcel.status;
  const statusColor = PARCEL_STATUS_COLORS[parcel.status] ?? 'bg-white/10 text-surface-50';

  // For the demo, check if user is parcel owner (mock-user-006 is the sender for parcel-001)
  // In production this would compare with auth user id
  const isOwner = false; // Default to traveler view for demo; real app checks auth

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
      {/* Back button */}
      <Link
        href="/colis"
        className="text-surface-100 mb-6 inline-flex items-center gap-1 text-sm font-medium hover:text-neutral-100"
      >
        <ArrowLeft size={16} />
        Retour aux colis
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ===== Main content (2 cols) ===== */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Photos carousel */}
              {parcel.photos.length > 0 && (
                <div className="-mx-6 -mt-6 mb-6">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto px-6 pt-6 pb-2">
                    {parcel.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="h-48 w-64 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Route */}
              <div className="flex items-center gap-3">
                <MapPin className="text-primary-400 shrink-0" size={20} />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-bold text-neutral-100">
                    {parcel.departure_city}, {parcel.departure_country}
                  </h1>
                  <p className="text-surface-200">&darr;</p>
                  <h1 className="truncate text-xl font-bold text-neutral-100">
                    {parcel.arrival_city}, {parcel.arrival_country}
                  </h1>
                </div>
              </div>

              {/* Status + Urgency + Fragile badges */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge className={cn('rounded-full', statusColor)} size="md">
                  {statusLabel}
                </Badge>
                {urgencyMeta && (
                  <Badge
                    variant={
                      urgencyMeta.value === 'urgent'
                        ? 'error'
                        : urgencyMeta.value === 'within_2_weeks'
                          ? 'warning'
                          : 'default'
                    }
                    size="md"
                  >
                    {urgencyMeta.label}
                  </Badge>
                )}
                {parcel.is_fragile && (
                  <Badge variant="error" size="md">
                    <Warning weight="bold" size={14} className="mr-1" />
                    Fragile
                  </Badge>
                )}
              </div>

              {/* Key info: Weight + Category */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-surface-700 rounded-xl p-4 text-center">
                  <Scales className="text-primary-400 mx-auto" size={24} />
                  <p className="mt-2 font-mono text-xl font-bold text-neutral-100 sm:text-2xl">
                    {parcel.weight_kg} kg
                  </p>
                  <p className="text-surface-100 text-sm">a envoyer</p>
                </div>
                <div className="bg-surface-700 rounded-xl p-4 text-center">
                  <Package className="text-primary-400 mx-auto" size={24} />
                  <p className="mt-2 text-lg font-bold text-neutral-100">{categoryLabel}</p>
                  <p className="text-surface-100 text-sm">categorie</p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-surface-50 text-sm font-semibold">Description</h3>
                <p className="text-surface-100 mt-2 text-sm leading-relaxed">
                  {parcel.description}
                </p>
              </div>

              {/* Budget */}
              {parcel.budget_per_kg && (
                <div className="mt-6">
                  <h3 className="text-surface-50 text-sm font-semibold">Budget indicatif</h3>
                  <p className="text-primary-400 mt-1 font-mono text-lg font-bold">
                    {formatCurrency(parcel.budget_per_kg)}/kg
                    <span className="text-surface-100 ml-2 font-sans text-sm font-normal">
                      soit {formatCurrency(parcel.budget_per_kg * parcel.weight_kg)} total
                    </span>
                  </p>
                </div>
              )}

              {/* Desired date */}
              {parcel.desired_date && (
                <div className="mt-6">
                  <h3 className="text-surface-50 text-sm font-semibold">Date souhaitee</h3>
                  <p className="text-surface-100 mt-1 flex items-center gap-1 text-sm">
                    <CalendarBlank weight="duotone" size={16} />
                    {formatDate(parcel.desired_date)}
                  </p>
                </div>
              )}

              {/* Published date */}
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <p className="text-surface-200 flex items-center gap-1 text-xs">
                  <Clock size={14} />
                  Publie {formatRelativeDate(parcel.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Offers received (visible to owner) */}
          {isOwner && offers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-surface-50 mb-3 flex items-center gap-2 text-sm font-semibold">
                <Airplane weight="duotone" size={18} className="text-primary-400" />
                Offres recues ({offers.length})
              </h3>
              <div className="space-y-3">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectOffer}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== Sidebar ===== */}
        <div className="space-y-4">
          {/* Sender profile card */}
          {parcel.sender && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={parcel.sender.avatar_url}
                    firstName={parcel.sender.first_name}
                    lastName={parcel.sender.last_name}
                    size="lg"
                    isVerified={parcel.sender.is_verified}
                  />
                  <div>
                    <p className="font-semibold text-neutral-100">
                      {parcel.sender.first_name} {parcel.sender.last_name}
                    </p>
                    {parcel.sender.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="fill-accent-500 text-accent-500" size={16} />
                        <span className="text-sm font-medium text-neutral-100">
                          {parcel.sender.rating.toFixed(1)}
                        </span>
                        <span className="text-surface-200 text-xs">
                          ({parcel.sender.total_reviews} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-surface-700 rounded-lg p-2">
                    <p className="font-bold text-neutral-100">{parcel.sender.total_trips}</p>
                    <p className="text-surface-100">trajets</p>
                  </div>
                  <div className="bg-surface-700 rounded-lg p-2">
                    <p className="font-bold text-neutral-100">{parcel.sender.total_shipments}</p>
                    <p className="text-surface-100">envois</p>
                  </div>
                </div>
                <Link href={`/profil/${parcel.sender.user_id}`} className="mt-3 block">
                  <Button variant="ghost" className="w-full" size="sm">
                    Voir le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Action buttons for travelers */}
          {!isOwner && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <MakeOfferModal parcel={parcel}>
                  <Button className="w-full" size="lg">
                    <Airplane weight="duotone" size={18} className="mr-2" />
                    Proposer mes kilos
                  </Button>
                </MakeOfferModal>
                <Link href="/messages" className="block">
                  <Button variant="outline" className="w-full" leftIcon={<ChatCircle size={16} />}>
                    Contacter l&apos;expediteur
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Offers received (sidebar for owner view) */}
          {isOwner && offers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offres recues ({offers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6 pt-0">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectOffer}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Trust badges */}
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-surface-100 flex items-center gap-2 text-sm">
                <ShieldCheck className="text-success" size={16} />
                Paiement securise par Stripe
              </div>
              <div className="text-surface-100 flex items-center gap-2 text-sm">
                <ShieldCheck className="text-success" size={16} />
                Argent bloque jusqu&apos;a la livraison
              </div>
            </CardContent>
          </Card>

          {/* Matched travelers */}
          <MatchedTravelers parcel={parcel} />
        </div>
      </div>
    </div>
  );
}
