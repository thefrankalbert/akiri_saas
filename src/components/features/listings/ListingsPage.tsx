'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CaretDown, CaretUp, Plus } from '@phosphor-icons/react';
import { Button, Select } from '@/components/ui';
import { useListings } from '@/lib/hooks';
import { ListingFilters } from './ListingFilters';
import { ListingGrid } from './ListingGrid';
import { ListingPagination } from './ListingPagination';

export function ListingsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const { listings, loading, filters, totalPages, currentPage, updateFilters, goToPage } =
    useListings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-100">Annonces</h1>
          <p className="text-surface-100 mt-1 truncate text-sm">
            Trouvez un voyageur pour transporter votre colis
          </p>
        </div>
        <Link href="/annonces/new" className="shrink-0">
          <Button size="sm" leftIcon={<Plus weight="bold" size={14} />}>
            Publier
          </Button>
        </Link>
      </div>

      <ListingFilters
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onUpdateFilters={updateFilters}
      />

      {/* Sort */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-surface-100 min-w-0 truncate text-sm">
          {loading ? 'Chargement...' : `${listings.length} annonce(s) trouvée(s)`}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-surface-100 hidden text-sm sm:inline">Trier par</span>
          <Select
            className="h-9 !rounded-lg"
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
          </Select>
          <button
            className="text-surface-200 hover:bg-surface-700 rounded-lg p-1.5 transition-colors hover:text-neutral-100"
            onClick={() =>
              updateFilters({
                sort_order: filters.sort_order === 'desc' ? 'asc' : 'desc',
              })
            }
          >
            {filters.sort_order === 'desc' ? (
              <CaretDown weight="bold" size={16} />
            ) : (
              <CaretUp weight="bold" size={16} />
            )}
          </button>
        </div>
      </div>

      <ListingGrid listings={listings} loading={loading} />
      <ListingPagination currentPage={currentPage} totalPages={totalPages} onGoToPage={goToPage} />
    </div>
  );
}
