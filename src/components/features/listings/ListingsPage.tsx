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
  ChevronUp,
} from 'lucide-react';
import { Button, Input, Card, CardContent, Badge, Avatar, Skeleton, Select } from '@/components/ui';
import { StaggerContainer, StaggerItem } from '@/components/ui';
import { useListings } from '@/lib/hooks';
import { SUPPORTED_COUNTRIES } from '@/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

function findCountryFlag(countryName: string): string {
  const country = SUPPORTED_COUNTRIES.find((c) => c.name === countryName);
  return country?.flag ?? '';
}

export function ListingsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { listings, loading, totalPages, currentPage, updateFilters, goToPage } = useListings();

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    updateFilters({ sort_order: newOrder });
  };

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
              <Select
                label="Pays de d&eacute;part"
                onChange={(e) => updateFilters({ departure_country: e.target.value || undefined })}
              >
                <option value="">Tous</option>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Pays d'arriv&eacute;e"
                onChange={(e) => updateFilters({ arrival_country: e.target.value || undefined })}
              >
                <option value="">Tous</option>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </Select>
              <div>
                <Input
                  label="Poids minimum (kg)"
                  type="number"
                  placeholder="0"
                  onChange={(e) =>
                    updateFilters({ min_kg: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div>
                <Input
                  label="Prix max (/kg)"
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
          {loading ? 'Chargement...' : `${listings.length} annonce(s) trouv\u00e9e(s)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Trier par</span>
          <Select
            className="w-auto"
            onChange={(e) =>
              updateFilters({
                sort_by: e.target.value as 'departure_date' | 'price_per_kg',
              })
            }
          >
            <option value="departure_date">Date de d&eacute;part</option>
            <option value="price_per_kg">Prix/kg</option>
            <option value="available_kg">Kilos disponibles</option>
            <option value="created_at">Plus r&eacute;cent</option>
          </Select>
          <button
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            onClick={toggleSortOrder}
            aria-label={sortOrder === 'desc' ? 'Tri d\u00e9croissant' : 'Tri croissant'}
          >
            {sortOrder === 'desc' ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
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
              Aucune annonce ne correspond &agrave; vos crit&egrave;res de recherche.
            </p>
          </CardContent>
        </Card>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <StaggerItem key={listing.id}>
              <Link href={`/annonces/${listing.id}`}>
                <Card
                  className="group h-full overflow-hidden transition-shadow hover:shadow-md"
                  padding="none"
                >
                  {/* Gradient bar */}
                  <div className="from-primary-400 to-secondary-500 h-[3px] bg-gradient-to-r" />
                  <CardContent className="p-5">
                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="text-primary-500 h-4 w-4" />
                      <span className="font-medium text-neutral-900">
                        {findCountryFlag(listing.departure_country)} {listing.departure_city}
                      </span>
                      <span className="text-neutral-400">&rarr;</span>
                      <span className="font-medium text-neutral-900">
                        {findCountryFlag(listing.arrival_country)} {listing.arrival_city}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(listing.departure_date)}
                    </div>

                    {/* Details */}
                    <div className="mt-4 flex items-center gap-3">
                      <Badge variant="primary">{listing.available_kg} kg</Badge>
                      {listing.accepted_items.length > 0 && (
                        <Badge variant="accent">{listing.accepted_items.length} cat.</Badge>
                      )}
                      <span className="text-primary-600 ml-auto text-lg font-bold">
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
            Pr&eacute;c&eacute;dent
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
