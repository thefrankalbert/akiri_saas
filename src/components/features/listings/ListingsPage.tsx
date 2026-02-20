'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Package,
  Star,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { useListings } from '@/lib/hooks';
import { SUPPORTED_COUNTRIES } from '@/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ListingsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const { listings, loading, totalPages, currentPage, updateFilters, goToPage } = useListings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Annonces</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Trouvez un voyageur pour transporter votre colis
          </p>
        </div>
        <Link href="/annonces/new">
          <Button size="sm">Publier</Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher un trajet..."
            leftIcon={<Search className="h-4 w-4" />}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Filtres</span>
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Pays de départ
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                  onChange={(e) =>
                    updateFilters({ departure_country: e.target.value || undefined })
                  }
                >
                  <option value="">Tous</option>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Pays d&apos;arriv&eacute;e
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                  onChange={(e) => updateFilters({ arrival_country: e.target.value || undefined })}
                >
                  <option value="">Tous</option>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Poids minimum (kg)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  onChange={(e) =>
                    updateFilters({ min_kg: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Prix max (/kg)
                </label>
                <Input
                  type="number"
                  placeholder="50"
                  onChange={(e) =>
                    updateFilters({
                      max_price: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sort */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {loading ? 'Chargement...' : `${listings.length} annonce(s) trouvée(s)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Trier par</span>
          <select
            className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
            onChange={(e) =>
              updateFilters({
                sort_by: e.target.value as 'departure_date' | 'price_per_kg',
              })
            }
          >
            <option value="departure_date">Date de départ</option>
            <option value="price_per_kg">Prix/kg</option>
            <option value="available_kg">Kilos disponibles</option>
            <option value="created_at">Plus récent</option>
          </select>
          <button
            className="text-neutral-400 hover:text-neutral-600"
            onClick={() =>
              updateFilters({
                sort_order: 'desc',
              })
            }
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-neutral-300" />
            <h3 className="mt-4 text-lg font-semibold text-neutral-700">Aucune annonce</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Aucune annonce ne correspond à vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/annonces/${listing.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="text-primary-500 h-4 w-4" />
                    <span className="font-medium text-neutral-900">{listing.departure_city}</span>
                    <span className="text-neutral-400">&rarr;</span>
                    <span className="font-medium text-neutral-900">{listing.arrival_city}</span>
                  </div>

                  {/* Date */}
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(listing.departure_date)}
                  </div>

                  {/* Details */}
                  <div className="mt-4 flex items-center gap-4">
                    <Badge variant="default">{listing.available_kg} kg disponibles</Badge>
                    <span className="text-primary-600 text-lg font-bold">
                      {formatCurrency(listing.price_per_kg)}/kg
                    </span>
                  </div>

                  {/* Categories */}
                  {listing.accepted_items.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {listing.accepted_items.slice(0, 3).map((item) => (
                        <Badge key={item} variant="outline" size="sm">
                          {item}
                        </Badge>
                      ))}
                      {listing.accepted_items.length > 3 && (
                        <Badge variant="outline" size="sm">
                          +{listing.accepted_items.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Traveler */}
                  {listing.traveler && (
                    <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
                      <Avatar
                        src={listing.traveler.avatar_url}
                        firstName={listing.traveler.first_name}
                        lastName={listing.traveler.last_name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-700">
                          {listing.traveler.first_name} {listing.traveler.last_name.charAt(0)}.
                        </p>
                      </div>
                      {listing.traveler.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="fill-accent-500 text-accent-500 h-3.5 w-3.5" />
                          <span className="text-sm font-medium text-neutral-700">
                            {listing.traveler.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Précédent
          </Button>
          <span className="flex items-center px-3 text-sm text-neutral-500">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
