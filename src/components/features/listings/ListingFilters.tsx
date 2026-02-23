'use client';

import { MagnifyingGlass, Sliders } from '@phosphor-icons/react';
import { Button, Input, Select } from '@/components/ui';
import { SUPPORTED_COUNTRIES } from '@/constants';

interface ListingFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  onUpdateFilters: (filters: Record<string, string | number | undefined>) => void;
}

export function ListingFilters({
  showFilters,
  onToggleFilters,
  onUpdateFilters,
}: ListingFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher un trajet..."
          leftIcon={<MagnifyingGlass weight="duotone" size={16} />}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={onToggleFilters}
          leftIcon={<Sliders weight="duotone" size={16} />}
        >
          <span className="hidden sm:inline">Filtres</span>
        </Button>
      </div>

      {showFilters && (
        <div className="bg-surface-800 rounded-xl border border-white/[0.08] p-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Select
              label="Pays de départ"
              onChange={(e) => onUpdateFilters({ departure_country: e.target.value || undefined })}
            >
              <option value="">Tous</option>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </Select>
            <Select
              label="Pays d'arrivée"
              onChange={(e) => onUpdateFilters({ arrival_country: e.target.value || undefined })}
            >
              <option value="">Tous</option>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Poids minimum (kg)"
              type="number"
              placeholder="0"
              onChange={(e) =>
                onUpdateFilters({
                  min_kg: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Input
              label="Prix max (/kg)"
              type="number"
              placeholder="50"
              onChange={(e) =>
                onUpdateFilters({
                  max_price: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
