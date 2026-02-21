'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CaretDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { useListings } from '@/lib/hooks';
import { ListingFilters } from './ListingFilters';
import { ListingGrid } from './ListingGrid';
import { ListingPagination } from './ListingPagination';

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

      <ListingFilters
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onUpdateFilters={updateFilters}
      />

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
            onClick={() => updateFilters({ sort_order: 'desc' })}
          >
            <CaretDown weight="bold" size={16} />
          </button>
        </div>
      </div>

      <ListingGrid listings={listings} loading={loading} />
      <ListingPagination currentPage={currentPage} totalPages={totalPages} onGoToPage={goToPage} />
    </div>
  );
}
