'use client';

import { useEffect, useState } from 'react';
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
  CheckCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { SendRequestModal } from '@/components/features/requests/SendRequestModal';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { Listing } from '@/types';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import { mockListings } from '@/lib/mock-data';

interface ListingDetailProps {
  listingId: string;
}

export function ListingDetail({ listingId }: ListingDetailProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const mock = mockListings.find((l) => l.id === listingId);
        if (mock) {
          setListing(mock);
        } else {
          setError('Annonce introuvable');
        }
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchListing = async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('listings')
        .select('*, traveler:profiles!traveler_id(*)')
        .eq('id', listingId)
        .single();

      if (controller.signal.aborted) return;

      if (err) {
        setError('Annonce introuvable');
        setLoading(false);
        return;
      }

      setListing(data as Listing);
      setLoading(false);
    };

    fetchListing();

    return () => controller.abort();
  }, [listingId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:px-7 lg:px-8">
        <Package className="text-surface-300 mx-auto" size={64} />
        <h2 className="mt-4 text-xl font-semibold text-neutral-100">
          {error || 'Annonce introuvable'}
        </h2>
        <Link href="/annonces" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
            Retour aux annonces
          </Button>
        </Link>
      </div>
    );
  }

  const totalCost = listing.available_kg * listing.price_per_kg;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
      {/* Back button */}
      <Link
        href="/annonces"
        className="text-surface-100 mb-6 inline-flex items-center gap-1 text-sm font-medium hover:text-neutral-100"
      >
        <ArrowLeft size={16} />
        Retour aux annonces
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Route */}
              <div className="flex items-center gap-3">
                <MapPin className="text-primary-400" size={20} />
                <div>
                  <h1 className="truncate text-xl font-bold text-neutral-100">
                    {listing.departure_city}, {listing.departure_country}
                  </h1>
                  <p className="text-surface-200">&darr;</p>
                  <h1 className="truncate text-xl font-bold text-neutral-100">
                    {listing.arrival_city}, {listing.arrival_country}
                  </h1>
                </div>
              </div>

              {/* Date & Status */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge variant="info" size="md">
                  <CalendarBlank className="mr-1" size={14} />
                  {formatDate(listing.departure_date)}
                </Badge>
                <Badge variant={listing.status === 'active' ? 'success' : 'default'} size="md">
                  {listing.status === 'active' ? 'Active' : listing.status}
                </Badge>
              </div>

              {/* Key info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-surface-700 rounded-xl p-4 text-center">
                  <Package className="text-primary-400 mx-auto" size={24} />
                  <p className="mt-2 font-mono text-2xl font-bold text-neutral-100">
                    {listing.available_kg} kg
                  </p>
                  <p className="text-surface-100 text-sm">disponibles</p>
                </div>
                <div className="bg-surface-700 rounded-xl p-4 text-center">
                  <span className="text-primary-400 font-mono text-2xl font-bold">
                    {formatCurrency(listing.price_per_kg)}
                  </span>
                  <p className="text-surface-100 text-sm">par kilo</p>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="mt-6">
                  <h3 className="text-surface-50 text-sm font-semibold">Description</h3>
                  <p className="text-surface-100 mt-2 text-sm leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Accepted items */}
              {listing.accepted_items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-surface-50 text-sm font-semibold">Articles acceptés</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {listing.accepted_items.map((item) => (
                      <Badge key={item} variant="outline">
                        <CheckCircle className="text-success mr-1" size={12} />
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection points */}
              {listing.collection_points.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-surface-50 text-sm font-semibold">Points de collecte</h3>
                  <ul className="mt-2 space-y-1">
                    {listing.collection_points.map((point, i) => (
                      <li key={i} className="text-surface-100 flex items-center gap-2 text-sm">
                        <MapPin className="text-surface-200" size={14} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Published date */}
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <p className="text-surface-200 flex items-center gap-1 text-xs">
                  <Clock size={14} />
                  Publiée {formatRelativeDate(listing.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-100">Prix par kg</span>
                  <span className="font-medium text-neutral-100">
                    {formatCurrency(listing.price_per_kg)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-100">Kilos disponibles</span>
                  <span className="font-medium text-neutral-100">{listing.available_kg} kg</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3">
                  <div className="flex justify-between">
                    <span className="text-surface-50 font-medium">Total max</span>
                    <span className="text-primary-400 font-mono text-lg font-bold">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <SendRequestModal listing={listing}>
                  <Button className="w-full" size="lg">
                    Envoyer une demande
                  </Button>
                </SendRequestModal>
                <Link href="/messages" className="block">
                  <Button variant="outline" className="w-full" leftIcon={<ChatCircle size={16} />}>
                    Contacter le voyageur
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Traveler card */}
          {listing.traveler && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={listing.traveler.avatar_url}
                    firstName={listing.traveler.first_name}
                    lastName={listing.traveler.last_name}
                    size="lg"
                    isVerified={listing.traveler.is_verified}
                  />
                  <div>
                    <p className="font-semibold text-neutral-100">
                      {listing.traveler.first_name} {listing.traveler.last_name}
                    </p>
                    {listing.traveler.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="fill-accent-500 text-accent-500" size={16} />
                        <span className="text-sm font-medium text-neutral-100">
                          {listing.traveler.rating.toFixed(1)}
                        </span>
                        <span className="text-surface-200 text-xs">
                          ({listing.traveler.total_reviews} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-surface-700 rounded-lg p-2">
                    <p className="font-bold text-neutral-100">{listing.traveler.total_trips}</p>
                    <p className="text-surface-100">trajets</p>
                  </div>
                  <div className="bg-surface-700 rounded-lg p-2">
                    <p className="font-bold text-neutral-100">{listing.traveler.total_shipments}</p>
                    <p className="text-surface-100">envois</p>
                  </div>
                </div>
                <Link href={`/profil/${listing.traveler.user_id}`} className="mt-3 block">
                  <Button variant="ghost" className="w-full" size="sm">
                    Voir le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Trust */}
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-surface-100 flex items-center gap-2 text-sm">
                <ShieldCheck className="text-success" size={16} />
                Paiement sécurisé par Stripe
              </div>
              <div className="text-surface-100 flex items-center gap-2 text-sm">
                <ShieldCheck className="text-success" size={16} />
                Argent bloqué jusqu&apos;à la livraison
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
