'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Sliders,
  MapPin,
  CalendarBlank,
  Package,
  Star,
  CaretDown,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import { useListings } from '@/lib/hooks';
import { SUPPORTED_COUNTRIES } from '@/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ListingsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const { listings, loading, totalPages, currentPage, updateFilters, goToPage } = useListings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Annonces</h1>
          <p className="text-surface-100 mt-1 text-sm">
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
            leftIcon={<MagnifyingGlass weight="duotone" size={16} />}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Sliders weight="duotone" size={16} />}
          >
            <span className="hidden sm:inline">Filtres</span>
          </Button>
        </div>

        {showFilters && (
          <div className="bg-surface-800 rounded-xl border border-white/[0.08] p-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-surface-50 mb-1.5 block text-sm font-medium">
                  Pays de départ
                </label>
                <select
                  className="bg-surface-700 h-10 w-full appearance-none rounded-lg border border-white/[0.08] px-3 pr-8 text-sm text-neutral-100"
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
                <label className="text-surface-50 mb-1.5 block text-sm font-medium">
                  Pays d&apos;arriv&eacute;e
                </label>
                <select
                  className="bg-surface-700 h-10 w-full appearance-none rounded-lg border border-white/[0.08] px-3 pr-8 text-sm text-neutral-100"
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
                <label className="text-surface-50 mb-1.5 block text-sm font-medium">
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
                <label className="text-surface-50 mb-1.5 block text-sm font-medium">
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
            </div>
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-surface-100 text-sm">
          {loading ? 'Chargement...' : `${listings.length} annonce(s) trouvée(s)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-surface-100 text-sm">Trier par</span>
          <select
            className="bg-surface-700 appearance-none rounded-lg border border-white/[0.08] px-2 py-1 pr-7 text-sm text-neutral-100"
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
            className="text-surface-200 hover:text-neutral-100"
            onClick={() =>
              updateFilters({
                sort_order: 'desc',
              })
            }
          >
            <CaretDown weight="bold" size={16} />
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-surface-800 rounded-2xl border border-white/[0.08] py-16 text-center">
          <Package weight="duotone" size={48} className="text-surface-300 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-100">Aucune annonce</h3>
          <p className="text-surface-100 mt-2 text-sm">
            Aucune annonce ne correspond à vos critères de recherche.
          </p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <StaggerItem key={listing.id}>
              <Link href={`/annonces/${listing.id}`}>
                <Card
                  className="h-full transition-all duration-200 hover:border-white/[0.15]"
                  padding="none"
                >
                  <CardContent className="p-2.5">
                    {/* Route + Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin weight="duotone" size={14} className="text-primary-400" />
                        <span className="font-medium text-neutral-100">
                          {listing.departure_city}
                        </span>
                        <span className="text-surface-300">&rarr;</span>
                        <span className="font-medium text-neutral-100">{listing.arrival_city}</span>
                      </div>
                      <span className="text-surface-200 flex items-center gap-1 text-xs">
                        <CalendarBlank weight="duotone" size={12} />
                        {formatDate(listing.departure_date)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-2 flex items-center gap-3">
                      <Badge variant="default" size="sm">
                        {listing.available_kg} kg
                      </Badge>
                      <span className="text-primary-400 font-mono text-sm font-bold">
                        {formatCurrency(listing.price_per_kg)}/kg
                      </span>
                    </div>

                    {/* Categories */}
                    {listing.accepted_items.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
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
                      <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-2">
                        <Avatar
                          src={listing.traveler.avatar_url}
                          firstName={listing.traveler.first_name}
                          lastName={listing.traveler.last_name}
                          size="sm"
                        />
                        <p className="text-surface-50 flex-1 text-xs font-medium">
                          {listing.traveler.first_name} {listing.traveler.last_name.charAt(0)}.
                        </p>
                        {listing.traveler.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star weight="fill" size={12} className="text-amber-400" />
                            <span className="text-xs font-medium text-neutral-100">
                              {listing.traveler.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
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
          <span className="text-surface-100 flex items-center px-3 text-sm">
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
