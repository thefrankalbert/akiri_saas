'use client';

import { Package, CaretDown } from '@phosphor-icons/react';
import { Badge, Skeleton } from '@/components/ui';
import { StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import { useParcels } from '@/lib/hooks';
import { SUPPORTED_COUNTRIES, PARCEL_CATEGORIES, URGENCY_LEVELS } from '@/constants';
import { ParcelCard } from './ParcelCard';

export function ParcelsPage() {
  const { parcels, total, loading, updateFilters } = useParcels();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-7 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-100">Colis a envoyer</h1>
        <Badge variant="primary" size="md">
          {loading ? '...' : total}
        </Badge>
      </div>

      {/* Filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Departure country */}
        <select
          className="bg-surface-700 min-w-0 appearance-none rounded-lg border border-white/[0.08] px-2 py-1.5 pr-7 text-sm text-neutral-100"
          onChange={(e) =>
            updateFilters({
              departure_country: e.target.value || undefined,
            })
          }
          defaultValue=""
        >
          <option value="">Depart</option>
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        {/* Arrival country */}
        <select
          className="bg-surface-700 min-w-0 appearance-none rounded-lg border border-white/[0.08] px-2 py-1.5 pr-7 text-sm text-neutral-100"
          onChange={(e) =>
            updateFilters({
              arrival_country: e.target.value || undefined,
            })
          }
          defaultValue=""
        >
          <option value="">Arrivee</option>
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          className="bg-surface-700 min-w-0 appearance-none rounded-lg border border-white/[0.08] px-2 py-1.5 pr-7 text-sm text-neutral-100"
          onChange={(e) =>
            updateFilters({
              category:
                (e.target.value as (typeof PARCEL_CATEGORIES)[number]['value']) || undefined,
            })
          }
          defaultValue=""
        >
          <option value="">Categorie</option>
          {PARCEL_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Urgency */}
        <select
          className="bg-surface-700 min-w-0 appearance-none rounded-lg border border-white/[0.08] px-2 py-1.5 pr-7 text-sm text-neutral-100"
          onChange={(e) =>
            updateFilters({
              urgency: (e.target.value as (typeof URGENCY_LEVELS)[number]['value']) || undefined,
            })
          }
          defaultValue=""
        >
          <option value="">Urgence</option>
          {URGENCY_LEVELS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="text-surface-100 hidden text-sm sm:inline">Trier par</span>
          <select
            className="bg-surface-700 appearance-none rounded-lg border border-white/[0.08] px-2 py-1 pr-7 text-sm text-neutral-100"
            onChange={(e) =>
              updateFilters({
                sort_by: e.target.value as 'created_at' | 'weight_kg',
              })
            }
          >
            <option value="created_at">Plus recent</option>
            <option value="weight_kg">Poids</option>
          </select>
          <button
            className="text-surface-200 hover:text-neutral-100"
            onClick={() => updateFilters({ sort_order: 'desc' })}
          >
            <CaretDown weight="bold" size={16} />
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-surface-100 mb-4 text-sm">
        {loading ? 'Chargement...' : `${parcels.length} colis trouves`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : parcels.length === 0 ? (
        <div className="bg-surface-800 rounded-2xl border border-white/[0.08] py-16 text-center">
          <Package weight="duotone" size={48} className="text-surface-300 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-100">Aucun colis</h3>
          <p className="text-surface-100 mt-2 text-sm">
            Aucun colis ne correspond a vos criteres de recherche.
          </p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {parcels.map((parcel) => (
            <StaggerItem key={parcel.id}>
              <ParcelCard parcel={parcel} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
