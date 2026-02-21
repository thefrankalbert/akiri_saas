'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Package,
  Star,
  Shield,
  MessageCircle,
  ArrowLeft,
  Clock,
  CheckCircle,
} from 'lucide-react';
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Package className="mx-auto h-16 w-16 text-neutral-300" />
        <h2 className="mt-4 text-xl font-semibold text-neutral-700">
          {error || 'Annonce introuvable'}
        </h2>
        <Link href="/annonces" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Retour aux annonces
          </Button>
        </Link>
      </div>
    );
  }

  const totalCost = listing.available_kg * listing.price_per_kg;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/annonces"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux annonces
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Route */}
              <div className="flex items-center gap-3">
                <MapPin className="text-primary-500 h-5 w-5" />
                <div>
                  <h1 className="truncate text-xl font-bold text-neutral-900">
                    {listing.departure_city}, {listing.departure_country}
                  </h1>
                  <p className="text-neutral-500">&darr;</p>
                  <h1 className="truncate text-xl font-bold text-neutral-900">
                    {listing.arrival_city}, {listing.arrival_country}
                  </h1>
                </div>
              </div>

              {/* Date & Status */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge variant="info" size="md">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {formatDate(listing.departure_date)}
                </Badge>
                <Badge variant={listing.status === 'active' ? 'success' : 'default'} size="md">
                  {listing.status === 'active' ? 'Active' : listing.status}
                </Badge>
              </div>

              {/* Key info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-neutral-50 p-4 text-center">
                  <Package className="text-primary-500 mx-auto h-6 w-6" />
                  <p className="mt-2 text-2xl font-bold text-neutral-900">
                    {listing.available_kg} kg
                  </p>
                  <p className="text-sm text-neutral-500">disponibles</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4 text-center">
                  <span className="text-primary-600 text-2xl font-bold">
                    {formatCurrency(listing.price_per_kg)}
                  </span>
                  <p className="text-sm text-neutral-500">par kilo</p>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-neutral-700">Description</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Accepted items */}
              {listing.accepted_items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-neutral-700">Articles acceptés</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {listing.accepted_items.map((item) => (
                      <Badge key={item} variant="outline">
                        <CheckCircle className="text-secondary-500 mr-1 h-3 w-3" />
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection points */}
              {listing.collection_points.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-neutral-700">Points de collecte</h3>
                  <ul className="mt-2 space-y-1">
                    {listing.collection_points.map((point, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Published date */}
              <div className="mt-6 border-t border-neutral-100 pt-4">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Clock className="h-3.5 w-3.5" />
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
                  <span className="text-neutral-500">Prix par kg</span>
                  <span className="font-medium">{formatCurrency(listing.price_per_kg)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Kilos disponibles</span>
                  <span className="font-medium">{listing.available_kg} kg</span>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-700">Total max</span>
                    <span className="text-primary-600 text-lg font-bold">
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
                  <Button
                    variant="outline"
                    className="w-full"
                    leftIcon={<MessageCircle className="h-4 w-4" />}
                  >
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
                    <p className="font-semibold text-neutral-900">
                      {listing.traveler.first_name} {listing.traveler.last_name}
                    </p>
                    {listing.traveler.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="fill-accent-500 text-accent-500 h-4 w-4" />
                        <span className="text-sm font-medium">
                          {listing.traveler.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-neutral-400">
                          ({listing.traveler.total_reviews} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="font-bold text-neutral-900">{listing.traveler.total_trips}</p>
                    <p className="text-neutral-500">trajets</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-2">
                    <p className="font-bold text-neutral-900">{listing.traveler.total_shipments}</p>
                    <p className="text-neutral-500">envois</p>
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
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Shield className="text-secondary-500 h-4 w-4" />
                Paiement sécurisé par Stripe
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Shield className="text-secondary-500 h-4 w-4" />
                Argent bloqué jusqu&apos;à la livraison
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
