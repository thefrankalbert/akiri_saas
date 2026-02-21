# Sender Parcel Posting — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add bilateral marketplace to Akiri — senders publish parcels, travelers make carry offers, with unified form, visual DatePicker, photo upload, matching engine.

**Architecture:** New `parcel_postings` + `carry_offers` tables mirror the existing `listings` + `shipment_requests` pattern. Unified form with type toggle replaces separate creation flows. Matching engine scores corridor compatibility and notifies both sides.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, Supabase, react-day-picker, date-fns, react-hook-form + zod/v4

**Design doc:** `docs/plans/2026-02-21-sender-parcel-posting-design.md`

---

## Task 1: Install react-day-picker

**Files:**

- Modify: `package.json`

**Step 1: Install dependency**

```bash
pnpm add react-day-picker
```

Note: `date-fns` is already installed (v4.1.0).

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-day-picker for visual calendar"
```

---

## Task 2: Types — ParcelPosting, CarryOffer

**Files:**

- Modify: `src/types/index.ts`

**Step 1: Add types after ShipmentRequest**

```typescript
// --- Parcel Posting (sender publishes a parcel) ---

export type ParcelCategory =
  | 'clothing'
  | 'electronics'
  | 'food'
  | 'documents'
  | 'cosmetics'
  | 'other';

export type UrgencyLevel = 'flexible' | 'within_2_weeks' | 'urgent';

export type ParcelStatus = 'active' | 'matched' | 'in_progress' | 'completed' | 'cancelled';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ParcelPosting {
  id: string;
  sender_id: string;
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  weight_kg: number;
  description: string;
  category: ParcelCategory;
  photos: string[];
  budget_per_kg: number | null;
  urgency: UrgencyLevel;
  is_fragile: boolean;
  desired_date: string | null;
  status: ParcelStatus;
  created_at: string;
  updated_at: string;
  // Joined
  sender?: Profile;
}

export interface CarryOffer {
  id: string;
  parcel_id: string;
  traveler_id: string;
  listing_id: string | null;
  proposed_price: number;
  departure_date: string;
  message: string | null;
  status: OfferStatus;
  created_at: string;
  // Joined
  parcel?: ParcelPosting;
  traveler?: Profile;
  listing?: Listing;
}
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add ParcelPosting and CarryOffer types"
```

---

## Task 3: Constants — Categories, urgency, status labels

**Files:**

- Modify: `src/constants/index.ts`

**Step 1: Add constants after existing ITEM_CATEGORIES**

```typescript
// Parcel categories
export const PARCEL_CATEGORIES = [
  { value: 'clothing', label: 'Vetements' },
  { value: 'electronics', label: 'Electronique' },
  { value: 'food', label: 'Alimentaire' },
  { value: 'documents', label: 'Documents' },
  { value: 'cosmetics', label: 'Cosmetiques' },
  { value: 'other', label: 'Autre' },
] as const;

export const URGENCY_LEVELS = [
  { value: 'flexible', label: 'Flexible', color: 'text-surface-100' },
  { value: 'within_2_weeks', label: '< 2 semaines', color: 'text-warning' },
  { value: 'urgent', label: 'Urgent', color: 'text-error' },
] as const;

export const PARCEL_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  matched: 'Matche',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

export const PARCEL_STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success',
  matched: 'bg-primary-500/10 text-primary-400',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-surface-600 text-surface-200',
  cancelled: 'bg-error/10 text-error',
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Acceptee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
};

export const OFFER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100/10 text-warning',
  accepted: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
  cancelled: 'bg-surface-600 text-surface-200',
};

export const MAX_PARCEL_PHOTOS = 3;
export const MAX_PARCEL_WEIGHT_KG = 30;
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/constants/index.ts
git commit -m "feat: add parcel category, urgency, and status constants"
```

---

## Task 4: Validations — parcelPostingSchema, carryOfferSchema

**Files:**

- Modify: `src/lib/validations/index.ts`

**Step 1: Add schemas after createRequestSchema**

```typescript
import { MAX_PARCEL_WEIGHT_KG } from '@/constants';

// --- Parcel Posting ---

export const createParcelPostingSchema = z.object({
  departure_city: z.string().min(2, 'Ville de depart requise'),
  departure_country: z.string().min(2, 'Pays de depart requis'),
  arrival_city: z.string().min(2, "Ville d'arrivee requise"),
  arrival_country: z.string().min(2, "Pays d'arrivee requis"),
  weight_kg: z
    .number()
    .min(0.5, 'Minimum 0.5 kg')
    .max(MAX_PARCEL_WEIGHT_KG, `Maximum ${MAX_PARCEL_WEIGHT_KG} kg`),
  description: z
    .string()
    .min(10, 'Decrivez votre colis en au moins 10 caracteres')
    .max(500, 'Description trop longue'),
  category: z.enum(['clothing', 'electronics', 'food', 'documents', 'cosmetics', 'other'], {
    message: 'Categorie requise',
  }),
  photos: z.array(z.string().url()).max(3, 'Maximum 3 photos').optional().default([]),
  budget_per_kg: z.number().min(1, 'Minimum 1 EUR/kg').nullable().optional(),
  urgency: z.enum(['flexible', 'within_2_weeks', 'urgent']).default('flexible'),
  is_fragile: z.boolean().default(false),
  desired_date: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'La date souhaitee doit etre dans le futur' }
    ),
});

export type CreateParcelPostingInput = z.infer<typeof createParcelPostingSchema>;

export const createCarryOfferSchema = z.object({
  parcel_id: z.string().uuid('ID de colis invalide'),
  listing_id: z.string().uuid("ID d'annonce invalide").nullable().optional(),
  proposed_price: z.number().min(1, 'Minimum 1 EUR'),
  departure_date: z.string().refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: 'La date de depart doit etre dans le futur' }
  ),
  message: z.string().max(500, 'Message trop long').nullable().optional(),
});

export type CreateCarryOfferInput = z.infer<typeof createCarryOfferSchema>;

export const searchParcelsSchema = z.object({
  departure_country: z.string().optional(),
  arrival_country: z.string().optional(),
  min_kg: z.number().min(0).optional(),
  max_kg: z.number().min(0).optional(),
  category: z.string().optional(),
  urgency: z.string().optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(50).default(20),
  sort_by: z.enum(['created_at', 'weight_kg', 'urgency', 'budget_per_kg']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchParcelsInput = z.infer<typeof searchParcelsSchema>;
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/lib/validations/index.ts
git commit -m "feat: add parcel posting and carry offer validation schemas"
```

---

## Task 5: Mock data — mockParcelPostings, mockCarryOffers

**Files:**

- Modify: `src/lib/mock-data.ts`

**Step 1: Add after mockRequests**

```typescript
import type { ParcelPosting, CarryOffer } from '@/types';

export const mockParcelPostings: ParcelPosting[] = [
  {
    id: 'mock-parcel-001',
    sender_id: 'mock-user-005',
    departure_city: 'Paris',
    departure_country: 'France',
    arrival_city: 'Douala',
    arrival_country: 'Cameroun',
    weight_kg: 8,
    description:
      'Carton de vetements et chaussures pour ma famille. Contient des habits neufs et quelques paires de baskets.',
    category: 'clothing',
    photos: [],
    budget_per_kg: 10,
    urgency: 'within_2_weeks',
    is_fragile: false,
    desired_date: '2026-03-20T00:00:00.000Z',
    status: 'active',
    created_at: '2026-02-18T14:00:00.000Z',
    updated_at: '2026-02-18T14:00:00.000Z',
    sender: mockProfiles[4],
  },
  {
    id: 'mock-parcel-002',
    sender_id: 'mock-user-008',
    departure_city: 'Bruxelles',
    departure_country: 'Belgique',
    arrival_city: 'Abidjan',
    arrival_country: "Cote d'Ivoire",
    weight_kg: 3,
    description: 'Tablette iPad et accessoires electroniques. Emballage original.',
    category: 'electronics',
    photos: [],
    budget_per_kg: null,
    urgency: 'urgent',
    is_fragile: true,
    desired_date: '2026-03-05T00:00:00.000Z',
    status: 'active',
    created_at: '2026-02-19T09:30:00.000Z',
    updated_at: '2026-02-19T09:30:00.000Z',
    sender: mockProfiles[7],
  },
  {
    id: 'mock-parcel-003',
    sender_id: 'mock-user-010',
    departure_city: 'Lyon',
    departure_country: 'France',
    arrival_city: 'Dakar',
    arrival_country: 'Senegal',
    weight_kg: 12,
    description: 'Produits cosmetiques et soins capillaires. Plusieurs flacons bien emballes.',
    category: 'cosmetics',
    photos: [],
    budget_per_kg: 8,
    urgency: 'flexible',
    is_fragile: true,
    desired_date: null,
    status: 'active',
    created_at: '2026-02-20T11:00:00.000Z',
    updated_at: '2026-02-20T11:00:00.000Z',
    sender: mockProfiles[9],
  },
  {
    id: 'mock-parcel-004',
    sender_id: 'mock-user-012',
    departure_city: 'Paris',
    departure_country: 'France',
    arrival_city: 'Kinshasa',
    arrival_country: 'RD Congo',
    weight_kg: 5,
    description: 'Documents administratifs et livres scolaires pour mes enfants.',
    category: 'documents',
    photos: [],
    budget_per_kg: 12,
    urgency: 'within_2_weeks',
    is_fragile: false,
    desired_date: '2026-03-10T00:00:00.000Z',
    status: 'active',
    created_at: '2026-02-20T16:00:00.000Z',
    updated_at: '2026-02-20T16:00:00.000Z',
    sender: mockProfiles[11],
  },
  {
    id: 'mock-parcel-005',
    sender_id: 'mock-user-015',
    departure_city: 'Marseille',
    departure_country: 'France',
    arrival_city: 'Bamako',
    arrival_country: 'Mali',
    weight_kg: 15,
    description: 'Alimentation seche: epices, condiments, conserves. Bien emballe sous vide.',
    category: 'food',
    photos: [],
    budget_per_kg: 7,
    urgency: 'flexible',
    is_fragile: false,
    desired_date: null,
    status: 'active',
    created_at: '2026-02-21T08:00:00.000Z',
    updated_at: '2026-02-21T08:00:00.000Z',
    sender: mockProfiles[14],
  },
  {
    id: 'mock-parcel-006',
    sender_id: 'mock-user-018',
    departure_city: 'Paris',
    departure_country: 'France',
    arrival_city: 'Douala',
    arrival_country: 'Cameroun',
    weight_kg: 6,
    description: 'Jouets et vetements pour enfants. Cadeaux anniversaire.',
    category: 'other',
    photos: [],
    budget_per_kg: 11,
    urgency: 'urgent',
    is_fragile: false,
    desired_date: '2026-03-01T00:00:00.000Z',
    status: 'matched',
    created_at: '2026-02-15T10:00:00.000Z',
    updated_at: '2026-02-19T14:00:00.000Z',
    sender: mockProfiles[17],
  },
];

export const mockCarryOffers: CarryOffer[] = [
  {
    id: 'mock-offer-001',
    parcel_id: 'mock-parcel-001',
    traveler_id: 'mock-user-001',
    listing_id: 'mock-listing-001',
    proposed_price: 80,
    departure_date: '2026-03-15T08:00:00.000Z',
    message: 'Je pars le 15 mars, je peux prendre votre colis sans probleme.',
    status: 'pending',
    created_at: '2026-02-19T10:00:00.000Z',
    parcel: undefined, // populated when needed
    traveler: mockProfiles[0],
    listing: mockListings[0],
  },
  {
    id: 'mock-offer-002',
    parcel_id: 'mock-parcel-001',
    traveler_id: 'mock-user-003',
    listing_id: 'mock-listing-002',
    proposed_price: 72,
    departure_date: '2026-04-02T06:30:00.000Z',
    message: null,
    status: 'pending',
    created_at: '2026-02-19T15:00:00.000Z',
    parcel: undefined,
    traveler: mockProfiles[2],
    listing: mockListings[1],
  },
  {
    id: 'mock-offer-003',
    parcel_id: 'mock-parcel-006',
    traveler_id: 'mock-user-002',
    listing_id: null,
    proposed_price: 66,
    departure_date: '2026-02-28T10:00:00.000Z',
    message: 'Je voyage bientot, je peux prendre vos affaires.',
    status: 'accepted',
    created_at: '2026-02-16T12:00:00.000Z',
    parcel: undefined,
    traveler: mockProfiles[1],
    listing: undefined,
  },
];
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "feat: add mock parcel postings and carry offers data"
```

---

## Task 6: UI — DatePicker component

**Files:**

- Create: `src/components/ui/DatePicker.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create DatePicker**

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (date: string | null) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  placeholder = 'Choisir une date',
  minDate = new Date(),
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value) : undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange?.(day.toISOString());
    } else {
      onChange?.(null);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && (
        <label className="text-surface-50 mb-1.5 block text-sm font-medium">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'bg-surface-700 flex h-10 w-full items-center gap-2 rounded-xl border px-3 text-sm transition-colors',
          error ? 'border-error' : 'border-white/[0.08] focus:border-primary-500',
          disabled && 'cursor-not-allowed opacity-50',
          selected ? 'text-neutral-100' : 'text-surface-200'
        )}
      >
        <CalendarBlank weight="duotone" size={16} className="text-surface-200 shrink-0" />
        {selected ? format(selected, 'd MMMM yyyy', { locale: fr }) : placeholder}
      </button>

      {open && (
        <div className="bg-surface-800 absolute top-full z-50 mt-1 rounded-xl border border-white/[0.08] p-3 shadow-xl">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={fr}
            disabled={{ before: minDate }}
            classNames={{
              root: 'text-neutral-100',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex justify-center py-1 text-sm font-medium',
              nav: 'flex items-center justify-between absolute top-3 left-3 right-3',
              button_previous: 'text-surface-200 hover:text-neutral-100 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-700',
              button_next: 'text-surface-200 hover:text-neutral-100 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-700',
              weekdays: 'flex',
              weekday: 'text-surface-200 w-9 text-center text-xs font-medium',
              week: 'flex',
              day: 'h-9 w-9 text-center text-sm',
              day_button: 'h-9 w-9 rounded-lg transition-colors hover:bg-surface-600',
              selected: 'bg-primary-500 text-white hover:bg-primary-600 rounded-lg',
              today: 'font-bold text-primary-400',
              disabled: 'text-surface-400 opacity-50 cursor-not-allowed',
              outside: 'text-surface-400 opacity-30',
            }}
          />
        </div>
      )}

      {error && <p className="text-error mt-1 text-xs">{error}</p>}
    </div>
  );
}
```

**Step 2: Export from index**

Add to `src/components/ui/index.ts`:

```typescript
export { DatePicker } from './DatePicker';
```

**Step 3: Verify**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/components/ui/DatePicker.tsx src/components/ui/index.ts
git commit -m "feat: add DatePicker component with react-day-picker and French locale"
```

---

## Task 7: UI — TypeToggle component

**Files:**

- Create: `src/components/ui/TypeToggle.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create TypeToggle**

```typescript
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypeToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TypeToggleProps {
  options: TypeToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TypeToggle({ options, value, onChange, className }: TypeToggleProps) {
  const selectedIndex = options.findIndex((o) => o.value === value);

  return (
    <div
      className={cn(
        'bg-surface-700 relative flex rounded-xl border border-white/[0.08] p-1',
        className
      )}
    >
      {/* Sliding background */}
      <motion.div
        className="bg-primary-500 absolute top-1 bottom-1 rounded-lg"
        initial={false}
        animate={{
          left: `calc(${(selectedIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
            value === option.value ? 'text-white' : 'text-surface-200 hover:text-neutral-100'
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Export from index**

Add to `src/components/ui/index.ts`:

```typescript
export { TypeToggle } from './TypeToggle';
```

**Step 3: Verify**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/components/ui/TypeToggle.tsx src/components/ui/index.ts
git commit -m "feat: add TypeToggle pill selector component with animated sliding background"
```

---

## Task 8: UI — PhotoUpload component

**Files:**

- Create: `src/components/ui/PhotoUpload.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create PhotoUpload**

```typescript
'use client';

import { useRef } from 'react';
import { Camera, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { MAX_PARCEL_PHOTOS } from '@/constants';

interface PhotoUploadProps {
  photos: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  uploading?: boolean;
  error?: string;
  className?: string;
}

export function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  uploading = false,
  error,
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAdd(file);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {photos.map((url, i) => (
          <div key={i} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PARCEL_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'bg-surface-700 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.12] transition-colors hover:border-primary-500/30 hover:bg-surface-600',
              uploading && 'animate-pulse cursor-wait'
            )}
          >
            <Camera weight="duotone" size={18} className="text-surface-200" />
            <span className="text-surface-200 mt-0.5 text-[9px]">
              {uploading ? '...' : 'Photo'}
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-error mt-1 text-xs">{error}</p>}
    </div>
  );
}
```

**Step 2: Export from index**

Add to `src/components/ui/index.ts`:

```typescript
export { PhotoUpload } from './PhotoUpload';
```

**Step 3: Verify**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/components/ui/PhotoUpload.tsx src/components/ui/index.ts
git commit -m "feat: add PhotoUpload compact strip component for parcel photos"
```

---

## Task 9: Navigation — add Colis nav item

**Files:**

- Modify: `src/lib/navigation.ts`

**Step 1: Add Colis item to NAVIGATION_ITEMS**

Import `Cube` from `@phosphor-icons/react` (represents a parcel/package).

Add after the `corridors` item:

```typescript
{ id: 'parcels', label: 'Colis', href: '/colis', icon: Cube, showOnMobile: false, showOnDesktop: true, order: 4.5 },
```

Note: `showOnMobile: false` because BottomNav has 5 items max. `order: 4.5` puts it between corridors (4) and messages (5) in the Sidebar.

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/lib/navigation.ts
git commit -m "feat: add Colis navigation item to sidebar"
```

---

## Task 10: DB migration — parcel_postings + carry_offers

**Files:**

- Create: `supabase/migrations/20260221_parcel_postings.sql`

**Step 1: Create migration**

```sql
-- Parcel Postings: senders publish parcels they want to ship
CREATE TABLE IF NOT EXISTS parcel_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  departure_city TEXT NOT NULL,
  departure_country TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  arrival_country TEXT NOT NULL,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 30),
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clothing', 'electronics', 'food', 'documents', 'cosmetics', 'other')),
  photos TEXT[] DEFAULT '{}',
  budget_per_kg NUMERIC CHECK (budget_per_kg IS NULL OR budget_per_kg > 0),
  urgency TEXT NOT NULL DEFAULT 'flexible' CHECK (urgency IN ('flexible', 'within_2_weeks', 'urgent')),
  is_fragile BOOLEAN NOT NULL DEFAULT false,
  desired_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Carry Offers: travelers offer to carry a parcel
CREATE TABLE IF NOT EXISTS carry_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES parcel_postings(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  proposed_price NUMERIC NOT NULL CHECK (proposed_price > 0),
  departure_date DATE NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parcel_postings_sender ON parcel_postings(sender_id);
CREATE INDEX idx_parcel_postings_corridor ON parcel_postings(departure_country, arrival_country);
CREATE INDEX idx_parcel_postings_status ON parcel_postings(status);
CREATE INDEX idx_carry_offers_parcel ON carry_offers(parcel_id);
CREATE INDEX idx_carry_offers_traveler ON carry_offers(traveler_id);

-- RLS
ALTER TABLE parcel_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE carry_offers ENABLE ROW LEVEL SECURITY;

-- Parcel postings: anyone can read active, owner can CRUD
CREATE POLICY "Anyone can view active parcels" ON parcel_postings
  FOR SELECT USING (status = 'active' OR sender_id = auth.uid());

CREATE POLICY "Authenticated users can create parcels" ON parcel_postings
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Owner can update own parcels" ON parcel_postings
  FOR UPDATE USING (auth.uid() = sender_id);

-- Carry offers: parcel owner + offer creator can read, travelers can create
CREATE POLICY "Parcel owner and offer creator can view offers" ON carry_offers
  FOR SELECT USING (
    traveler_id = auth.uid()
    OR parcel_id IN (SELECT id FROM parcel_postings WHERE sender_id = auth.uid())
  );

CREATE POLICY "Authenticated travelers can create offers" ON carry_offers
  FOR INSERT WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Offer creator can update own offers" ON carry_offers
  FOR UPDATE USING (auth.uid() = traveler_id);

CREATE POLICY "Parcel owner can update offer status" ON carry_offers
  FOR UPDATE USING (
    parcel_id IN (SELECT id FROM parcel_postings WHERE sender_id = auth.uid())
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE parcel_postings;
ALTER PUBLICATION supabase_realtime ADD TABLE carry_offers;

-- Updated_at trigger
CREATE TRIGGER update_parcel_postings_updated_at
  BEFORE UPDATE ON parcel_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for parcel photos
INSERT INTO storage.buckets (id, name, public) VALUES ('parcel-photos', 'parcel-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload parcel photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'parcel-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view parcel photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'parcel-photos');
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260221_parcel_postings.sql
git commit -m "feat: add parcel_postings and carry_offers tables with RLS"
```

---

## Task 11: Service layer — parcels.ts

**Files:**

- Create: `src/lib/services/parcels.ts`

**Step 1: Create service** following the pattern from `services/listings.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { ParcelPosting, PaginatedResponse, ApiResponse } from '@/types';
import type { CreateParcelPostingInput, SearchParcelsInput } from '@/lib/validations';

export async function getParcels(
  params: Partial<SearchParcelsInput> = {}
): Promise<PaginatedResponse<ParcelPosting>> {
  const supabase = await createClient();
  const {
    departure_country,
    arrival_country,
    min_kg,
    max_kg,
    category,
    urgency,
    page = 1,
    per_page = 20,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = params;

  let query = supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)', { count: 'exact' })
    .eq('status', 'active');

  if (departure_country) query = query.eq('departure_country', departure_country);
  if (arrival_country) query = query.eq('arrival_country', arrival_country);
  if (min_kg) query = query.gte('weight_kg', min_kg);
  if (max_kg) query = query.lte('weight_kg', max_kg);
  if (category) query = query.eq('category', category);
  if (urgency) query = query.eq('urgency', urgency);

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  query = query.order(sort_by, { ascending: sort_order === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: [], total: 0, page, per_page, total_pages: 0 };
  }

  const total = count || 0;
  return {
    data: (data as ParcelPosting[]) || [],
    total,
    page,
    per_page,
    total_pages: Math.ceil(total / per_page),
  };
}

export async function getParcelById(id: string): Promise<ApiResponse<ParcelPosting>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: 'Colis introuvable', status: 404 };
  }

  return { data: data as ParcelPosting, error: null, status: 200 };
}

export async function createParcel(
  senderId: string,
  input: CreateParcelPostingInput
): Promise<ApiResponse<ParcelPosting>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parcel_postings')
    .insert({ ...input, sender_id: senderId })
    .select('*, sender:profiles!sender_id(*)')
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as ParcelPosting, error: null, status: 201 };
}

export async function updateParcelStatus(
  id: string,
  senderId: string,
  status: string
): Promise<ApiResponse<ParcelPosting>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parcel_postings')
    .update({ status })
    .eq('id', id)
    .eq('sender_id', senderId)
    .select('*, sender:profiles!sender_id(*)')
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as ParcelPosting, error: null, status: 200 };
}

export async function getParcelsBySender(senderId: string): Promise<ParcelPosting[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)')
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false });

  return (data as ParcelPosting[]) || [];
}
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/lib/services/parcels.ts
git commit -m "feat: add parcels service layer with CRUD operations"
```

---

## Task 12: Service layer — offers.ts

**Files:**

- Create: `src/lib/services/offers.ts`

**Step 1: Create service**

```typescript
import { createClient } from '@/lib/supabase/server';
import type { CarryOffer, ApiResponse } from '@/types';
import type { CreateCarryOfferInput } from '@/lib/validations';

export async function getOffersByParcel(parcelId: string): Promise<CarryOffer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('carry_offers')
    .select('*, traveler:profiles!traveler_id(*), listing:listings!listing_id(*)')
    .eq('parcel_id', parcelId)
    .order('created_at', { ascending: false });

  return (data as CarryOffer[]) || [];
}

export async function createOffer(
  travelerId: string,
  input: CreateCarryOfferInput
): Promise<ApiResponse<CarryOffer>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('carry_offers')
    .insert({ ...input, traveler_id: travelerId })
    .select('*, traveler:profiles!traveler_id(*)')
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as CarryOffer, error: null, status: 201 };
}

export async function acceptOffer(
  offerId: string,
  senderId: string
): Promise<ApiResponse<CarryOffer>> {
  const supabase = await createClient();

  // Verify sender owns the parcel
  const { data: offer } = await supabase
    .from('carry_offers')
    .select('*, parcel:parcel_postings!parcel_id(*)')
    .eq('id', offerId)
    .single();

  if (!offer || (offer.parcel as { sender_id: string })?.sender_id !== senderId) {
    return { data: null, error: 'Non autorise', status: 403 };
  }

  // Accept this offer
  const { data: updated, error } = await supabase
    .from('carry_offers')
    .update({ status: 'accepted' })
    .eq('id', offerId)
    .select('*, traveler:profiles!traveler_id(*)')
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Reject all other pending offers for this parcel
  await supabase
    .from('carry_offers')
    .update({ status: 'rejected' })
    .eq('parcel_id', offer.parcel_id)
    .neq('id', offerId)
    .eq('status', 'pending');

  // Update parcel status to matched
  await supabase.from('parcel_postings').update({ status: 'matched' }).eq('id', offer.parcel_id);

  return { data: updated as CarryOffer, error: null, status: 200 };
}

export async function rejectOffer(
  offerId: string,
  senderId: string
): Promise<ApiResponse<CarryOffer>> {
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from('carry_offers')
    .select('parcel:parcel_postings!parcel_id(sender_id)')
    .eq('id', offerId)
    .single();

  if (!offer || (offer.parcel as { sender_id: string })?.sender_id !== senderId) {
    return { data: null, error: 'Non autorise', status: 403 };
  }

  const { data: updated, error } = await supabase
    .from('carry_offers')
    .update({ status: 'rejected' })
    .eq('id', offerId)
    .select('*, traveler:profiles!traveler_id(*)')
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: updated as CarryOffer, error: null, status: 200 };
}
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/lib/services/offers.ts
git commit -m "feat: add carry offers service with accept/reject logic"
```

---

## Task 13: Service layer — matching.ts

**Files:**

- Create: `src/lib/services/matching.ts`

**Step 1: Create matching service**

```typescript
import { createClient } from '@/lib/supabase/server';
import type { Listing, ParcelPosting } from '@/types';

interface MatchResult {
  listing: Listing;
  score: number;
}

interface ParcelMatchResult {
  parcel: ParcelPosting;
  score: number;
}

export async function findMatchingListings(parcel: {
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  weight_kg: number;
  budget_per_kg: number | null;
  desired_date: string | null;
}): Promise<MatchResult[]> {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from('listings')
    .select('*, traveler:profiles!traveler_id(*)')
    .eq('status', 'active')
    .eq('departure_country', parcel.departure_country)
    .eq('arrival_country', parcel.arrival_country);

  if (!listings || listings.length === 0) return [];

  const scored = (listings as Listing[]).map((listing) => {
    let score = 1; // base score for same corridor

    if (listing.departure_city === parcel.departure_city) score += 3;
    if (listing.arrival_city === parcel.arrival_city) score += 3;
    if (listing.available_kg >= parcel.weight_kg) score += 2;
    if (parcel.desired_date && listing.departure_date <= parcel.desired_date) score += 2;
    if (parcel.budget_per_kg && listing.price_per_kg <= parcel.budget_per_kg) score += 1;

    return { listing, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function findMatchingParcels(listing: {
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  available_kg: number;
  price_per_kg: number;
  departure_date: string;
}): Promise<ParcelMatchResult[]> {
  const supabase = await createClient();

  const { data: parcels } = await supabase
    .from('parcel_postings')
    .select('*, sender:profiles!sender_id(*)')
    .eq('status', 'active')
    .eq('departure_country', listing.departure_country)
    .eq('arrival_country', listing.arrival_country);

  if (!parcels || parcels.length === 0) return [];

  const scored = (parcels as ParcelPosting[]).map((parcel) => {
    let score = 1;

    if (parcel.departure_city === listing.departure_city) score += 3;
    if (parcel.arrival_city === listing.arrival_city) score += 3;
    if (listing.available_kg >= parcel.weight_kg) score += 2;
    if (parcel.desired_date && listing.departure_date <= parcel.desired_date) score += 2;
    if (parcel.budget_per_kg && listing.price_per_kg <= parcel.budget_per_kg) score += 1;

    return { parcel, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/lib/services/matching.ts
git commit -m "feat: add corridor matching engine with scoring algorithm"
```

---

## Task 14: API routes — /api/parcels

**Files:**

- Create: `src/app/api/parcels/route.ts`

**Step 1: Create route** following the pattern from `api/listings/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody, parseSearchParams } from '@/lib/api/helpers';
import { getParcels, createParcel } from '@/lib/services/parcels';
import { createParcelPostingSchema, searchParcelsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.url, searchParcelsSchema);
  const result = await getParcels(params || {});
  return apiSuccess(result);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorise', 401);

  const body = await parseBody(request, createParcelPostingSchema);
  if (!body) return apiError('Donnees invalides', 400);

  const result = await createParcel(user.id, body);
  if (result.error) return apiError(result.error, result.status);

  return apiSuccess(result.data, 201);
}
```

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/app/api/parcels/route.ts
git commit -m "feat: add /api/parcels GET+POST route"
```

---

## Task 15: API routes — /api/parcels/[id] and /api/parcels/[id]/offers

**Files:**

- Create: `src/app/api/parcels/[id]/route.ts`
- Create: `src/app/api/parcels/[id]/offers/route.ts`

**Step 1: Create parcel detail route**

```typescript
import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getParcelById, updateParcelStatus } from '@/lib/services/parcels';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await getParcelById(id);
  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorise', 401);

  const { id } = await params;
  const body = await request.json();

  if (!body.status) return apiError('Statut requis', 400);

  const result = await updateParcelStatus(id, user.id, body.status);
  if (result.error) return apiError(result.error, result.status);

  return apiSuccess(result.data);
}
```

**Step 2: Create offers route**

```typescript
import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getOffersByParcel, createOffer, acceptOffer, rejectOffer } from '@/lib/services/offers';
import { createCarryOfferSchema } from '@/lib/validations';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const offers = await getOffersByParcel(id);
  return apiSuccess(offers);
}

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorise', 401);

  const { id } = await params;
  const body = await parseBody(request, createCarryOfferSchema);
  if (!body) return apiError('Donnees invalides', 400);

  if (body.parcel_id !== id) return apiError('ID de colis incohérent', 400);

  const result = await createOffer(user.id, body);
  if (result.error) return apiError(result.error, result.status);

  return apiSuccess(result.data, 201);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorise', 401);

  const body = await request.json();
  const { offer_id, action } = body;

  if (!offer_id || !action) return apiError('offer_id et action requis', 400);

  if (action === 'accept') {
    const result = await acceptOffer(offer_id, user.id);
    if (result.error) return apiError(result.error, result.status);
    return apiSuccess(result.data);
  }

  if (action === 'reject') {
    const result = await rejectOffer(offer_id, user.id);
    if (result.error) return apiError(result.error, result.status);
    return apiSuccess(result.data);
  }

  return apiError('Action invalide', 400);
}
```

**Step 3: Verify**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/app/api/parcels/
git commit -m "feat: add /api/parcels/[id] and /api/parcels/[id]/offers routes"
```

---

## Task 16: API route — /api/parcels/upload

**Files:**

- Create: `src/app/api/parcels/upload/route.ts`

**Step 1: Create upload route** following the pattern from chat upload

```typescript
import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorise', 401);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return apiError('Fichier requis', 400);
  if (file.size > MAX_FILE_SIZE) return apiError('Fichier trop volumineux (max 5MB)', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return apiError('Type de fichier non supporte', 400);

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${user.id}/${uuidv4()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from('parcel-photos')
    .upload(fileName, file, { contentType: file.type });

  if (error) return apiError('Erreur upload', 500);

  const { data: urlData } = supabase.storage.from('parcel-photos').getPublicUrl(fileName);

  return apiSuccess({ url: urlData.publicUrl }, 201);
}
```

Note: Uses `crypto.randomUUID()` for unique filenames. If `uuid` is not available, use `crypto.randomUUID()` instead of `v4`.

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/app/api/parcels/upload/route.ts
git commit -m "feat: add /api/parcels/upload photo upload route"
```

---

## Task 17: Hooks — use-parcels.ts and use-parcel-detail.ts

**Files:**

- Create: `src/lib/hooks/use-parcels.ts`
- Create: `src/lib/hooks/use-parcel-detail.ts`
- Modify: `src/lib/hooks/index.ts`

**Step 1: Create use-parcels hook** following the pattern from `use-listings.ts`

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { mockParcelPostings } from '@/lib/mock-data';
import type { ParcelPosting } from '@/types';
import type { SearchParcelsInput } from '@/lib/validations';

interface ParcelsState {
  parcels: ParcelPosting[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useParcels() {
  const [state, setState] = useState<ParcelsState>({
    parcels: [],
    total: 0,
    loading: true,
    error: null,
  });
  const [filters, setFilters] = useState<Partial<SearchParcelsInput>>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const abortRef = useRef<AbortController>();

  const fetchParcels = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!supabaseConfigured) {
      let filtered = [...mockParcelPostings].filter((p) => p.status === 'active');

      if (filters.departure_country)
        filtered = filtered.filter((p) => p.departure_country === filters.departure_country);
      if (filters.arrival_country)
        filtered = filtered.filter((p) => p.arrival_country === filters.arrival_country);
      if (filters.category) filtered = filtered.filter((p) => p.category === filters.category);
      if (filters.urgency) filtered = filtered.filter((p) => p.urgency === filters.urgency);

      setState({ parcels: filtered, total: filtered.length, loading: false, error: null });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const supabase = createClient();
      let query = supabase
        .from('parcel_postings')
        .select('*, sender:profiles!sender_id(*)', { count: 'exact' })
        .eq('status', 'active');

      if (filters.departure_country)
        query = query.eq('departure_country', filters.departure_country);
      if (filters.arrival_country) query = query.eq('arrival_country', filters.arrival_country);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.urgency) query = query.eq('urgency', filters.urgency);
      if (filters.min_kg) query = query.gte('weight_kg', filters.min_kg);
      if (filters.max_kg) query = query.lte('weight_kg', filters.max_kg);

      const page = filters.page || 1;
      const perPage = filters.per_page || 20;
      const from = (page - 1) * perPage;

      query = query
        .order(filters.sort_by || 'created_at', { ascending: filters.sort_order === 'asc' })
        .range(from, from + perPage - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setState({
        parcels: (data as ParcelPosting[]) || [],
        total: count || 0,
        loading: false,
        error: null,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setState((prev) => ({ ...prev, loading: false, error: 'Erreur de chargement' }));
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchParcels();
    return () => abortRef.current?.abort();
  }, [fetchParcels]);

  const updateFilters = useCallback((newFilters: Partial<SearchParcelsInput>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const totalPages = Math.ceil(state.total / (filters.per_page || 20));

  return { ...state, filters, totalPages, updateFilters, refetch: fetchParcels };
}
```

**Step 2: Create use-parcel-detail hook**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { mockParcelPostings, mockCarryOffers } from '@/lib/mock-data';
import type { ParcelPosting, CarryOffer } from '@/types';

interface ParcelDetailState {
  parcel: ParcelPosting | null;
  offers: CarryOffer[];
  loading: boolean;
  error: string | null;
}

export function useParcelDetail(parcelId: string | null) {
  const [state, setState] = useState<ParcelDetailState>({
    parcel: null,
    offers: [],
    loading: true,
    error: null,
  });

  const fetchDetail = useCallback(async () => {
    if (!parcelId) {
      setState({ parcel: null, offers: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    if (!supabaseConfigured) {
      const parcel = mockParcelPostings.find((p) => p.id === parcelId) || null;
      const offers = mockCarryOffers.filter((o) => o.parcel_id === parcelId);
      setState({
        parcel,
        offers,
        loading: false,
        error: parcel ? null : 'Colis introuvable',
      });
      return;
    }

    try {
      const supabase = createClient();

      const [parcelRes, offersRes] = await Promise.all([
        supabase
          .from('parcel_postings')
          .select('*, sender:profiles!sender_id(*)')
          .eq('id', parcelId)
          .single(),
        supabase
          .from('carry_offers')
          .select('*, traveler:profiles!traveler_id(*), listing:listings!listing_id(*)')
          .eq('parcel_id', parcelId)
          .order('created_at', { ascending: false }),
      ]);

      setState({
        parcel: parcelRes.data as ParcelPosting | null,
        offers: (offersRes.data as CarryOffer[]) || [],
        loading: false,
        error: parcelRes.error ? 'Colis introuvable' : null,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Erreur de chargement' }));
    }
  }, [parcelId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { ...state, refetch: fetchDetail };
}
```

**Step 3: Add exports to hooks/index.ts**

```typescript
export { useParcels } from './use-parcels';
export { useParcelDetail } from './use-parcel-detail';
```

**Step 4: Verify**

```bash
pnpm typecheck
```

**Step 5: Commit**

```bash
git add src/lib/hooks/use-parcels.ts src/lib/hooks/use-parcel-detail.ts src/lib/hooks/index.ts
git commit -m "feat: add useParcels and useParcelDetail hooks with mock fallback"
```

---

## Task 18: Modify NewListingForm — unified toggle + parcel section

**Files:**

- Modify: `src/components/features/listings/NewListingForm.tsx`

This is the most complex task. The form currently creates listings only. It needs:

1. A `TypeToggle` at the top: "Kilos disponibles" / "Colis a envoyer"
2. Common fields (departure/arrival city+country, date) stay in place
3. A dynamic section below that changes based on toggle (fade animation)
4. The DatePicker replaces `<Input type="date">`
5. "Colis" section adds: weight, category, description, photos, urgency+fragile, budget
6. Submit creates either a listing or a parcel_posting

**Step 1: Rewrite the form**

Read the current `NewListingForm.tsx` (309 lines), then:

- Import `TypeToggle`, `DatePicker`, `PhotoUpload` from `@/components/ui`
- Import `AirplaneTilt`, `Cube`, `Warning` from `@phosphor-icons/react`
- Import `PARCEL_CATEGORIES`, `URGENCY_LEVELS` from `@/constants`
- Import `createParcelPostingSchema`, `CreateParcelPostingInput` from `@/lib/validations`
- Add `formType` state: `useState<'listing' | 'parcel'>('listing')`
- Use `AnimatePresence` + `motion.div` for the dynamic section transition
- When `formType === 'parcel'`, use a second `useForm<CreateParcelPostingInput>` or use a single form with conditional fields
- On submit: if listing → POST `/api/listings`, if parcel → POST `/api/parcels`
- Replace `<Input type="date">` with `<DatePicker>` for both types
- Add photo upload state + upload handler for parcel type
- Add urgency pills and fragile toggle for parcel type
- Ensure the form fits on one mobile screen without scrolling (compact: `h-10` inputs, `gap-2.5` spacing, 2 fields per row)

**Implementation approach**: Use a SINGLE form component with conditional rendering. Don't use two separate useForm instances — that would be complex. Instead, manage the toggle state and render different field groups. Each type has its own submit handler and validation schema.

The complete rewritten code should be provided by the implementing engineer based on the existing form structure. Key constraint: **zero scroll on mobile** — everything must fit in `100dvh - 8rem`.

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Test on mobile simulator**

Open `http://localhost:3000/annonces/new` in the iPhone 16 Pro Max simulator. Verify:

- Toggle switches smoothly between types
- All fields visible without scrolling
- DatePicker opens calendar popup correctly
- Photo upload works (select, preview, remove)
- Urgency pills and fragile toggle work
- Form submits correctly for both types

**Step 4: Commit**

```bash
git add src/components/features/listings/NewListingForm.tsx
git commit -m "feat: unified form with type toggle, DatePicker, photo upload, parcel fields"
```

---

## Task 19: Components — ParcelCard + ParcelsPage

**Files:**

- Create: `src/components/features/parcels/ParcelCard.tsx`
- Create: `src/components/features/parcels/ParcelsPage.tsx`
- Create: `src/components/features/parcels/index.ts`

**Step 1: Create ParcelCard** following the pattern from `ListingGrid.tsx` cards

```typescript
'use client';

import Link from 'next/link';
import {
  MapPin,
  Package,
  Warning,
  Clock,
} from '@phosphor-icons/react';
import { Card, CardContent, Badge, Avatar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { PARCEL_CATEGORIES, URGENCY_LEVELS, PARCEL_STATUS_COLORS, PARCEL_STATUS_LABELS } from '@/constants';
import type { ParcelPosting } from '@/types';

interface ParcelCardProps {
  parcel: ParcelPosting;
}

export function ParcelCard({ parcel }: ParcelCardProps) {
  const category = PARCEL_CATEGORIES.find((c) => c.value === parcel.category);
  const urgency = URGENCY_LEVELS.find((u) => u.value === parcel.urgency);

  return (
    <Link href={`/colis/${parcel.id}`}>
      <Card className="h-full transition-all duration-200 hover:border-white/[0.15]" padding="none">
        <CardContent className="p-3">
          {/* Status + urgency */}
          <div className="mb-2 flex items-center justify-between">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PARCEL_STATUS_COLORS[parcel.status] || ''}`}>
              {PARCEL_STATUS_LABELS[parcel.status] || parcel.status}
            </span>
            <div className="flex items-center gap-1.5">
              {parcel.is_fragile && (
                <Badge variant="warning" size="sm">
                  <Warning weight="fill" size={10} className="mr-0.5" />
                  Fragile
                </Badge>
              )}
              {urgency && parcel.urgency !== 'flexible' && (
                <Badge variant={parcel.urgency === 'urgent' ? 'error' : 'warning'} size="sm">
                  <Clock weight="duotone" size={10} className="mr-0.5" />
                  {urgency.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <h3 className="line-clamp-2 text-sm font-medium text-neutral-100">
            {parcel.description}
          </h3>

          {/* Route */}
          <div className="text-surface-100 mt-1.5 flex min-w-0 items-center gap-1 truncate text-xs">
            <MapPin weight="duotone" size={12} className="shrink-0" />
            <span className="truncate">{parcel.departure_city}</span>
            <span className="shrink-0">&rarr;</span>
            <span className="truncate">{parcel.arrival_city}</span>
          </div>

          {/* Weight + Category + Budget */}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="default" size="sm">
              <Package weight="duotone" size={12} className="mr-1" />
              {parcel.weight_kg} kg
            </Badge>
            {category && (
              <Badge variant="outline" size="sm">
                {category.label}
              </Badge>
            )}
            {parcel.budget_per_kg ? (
              <span className="text-primary-400 font-mono text-xs font-bold">
                ~{parcel.budget_per_kg} EUR/kg
              </span>
            ) : (
              <span className="text-surface-200 text-xs">Offres ouvertes</span>
            )}
          </div>

          {/* Sender + date */}
          {parcel.sender && (
            <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2">
              <div className="flex items-center gap-2">
                <Avatar
                  firstName={parcel.sender.first_name}
                  lastName={parcel.sender.last_name}
                  src={parcel.sender.avatar_url}
                  size="sm"
                />
                <span className="text-surface-100 text-xs font-medium">
                  {parcel.sender.first_name} {parcel.sender.last_name.charAt(0)}.
                </span>
              </div>
              <span className="text-surface-200 text-[11px]">{formatDate(parcel.created_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Create ParcelsPage** following the pattern from `ListingsPage.tsx`

The ParcelsPage should have:

- Header "Colis a envoyer" + count
- Filter row: country dropdowns, category select, urgency select
- Grid of ParcelCards (1 col mobile, 2 cols sm, 3 cols lg)
- Loading skeletons, empty state
- Uses `useParcels()` hook

**Step 3: Create index.ts exports**

```typescript
export { ParcelCard } from './ParcelCard';
export { ParcelsPage } from './ParcelsPage';
```

**Step 4: Verify**

```bash
pnpm build
```

**Step 5: Commit**

```bash
git add src/components/features/parcels/
git commit -m "feat: add ParcelCard and ParcelsPage components"
```

---

## Task 20: Page — /colis

**Files:**

- Create: `src/app/(main)/colis/page.tsx`

**Step 1: Create page** following the pattern from `annonces/page.tsx`

```typescript
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ParcelsPage } from '@/components/features/parcels';
import { Skeleton } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Colis a envoyer',
  description: 'Parcourez les colis a transporter et proposez vos kilos.',
};

function ParcelsFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ColisPage() {
  return (
    <Suspense fallback={<ParcelsFallback />}>
      <ParcelsPage />
    </Suspense>
  );
}
```

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/app/(main)/colis/page.tsx
git commit -m "feat: add /colis page route"
```

---

## Task 21: Components — MakeOfferModal + OfferCard

**Files:**

- Create: `src/components/features/parcels/MakeOfferModal.tsx`
- Create: `src/components/features/parcels/OfferCard.tsx`

**Step 1: Create MakeOfferModal** following the pattern from `SendRequestModal.tsx`

The modal should have:

- `children` prop as trigger (like SendRequestModal)
- Form with: proposed_price (number input), departure_date (DatePicker), message (optional textarea)
- Optional: select an existing listing (if traveler has listings on this corridor)
- Dynamic display: shows the parcel info at the top
- Submit: POST to `/api/parcels/[id]/offers`
- Mock fallback with toast

**Step 2: Create OfferCard**

A card for the parcel owner to see received offers:

- Traveler avatar + name + rating
- Proposed price, departure date
- Optional message
- Optional link to traveler's listing
- Accept / Reject buttons
- Status badge if already accepted/rejected

**Step 3: Export**

Add to `src/components/features/parcels/index.ts`:

```typescript
export { MakeOfferModal } from './MakeOfferModal';
export { OfferCard } from './OfferCard';
```

**Step 4: Verify**

```bash
pnpm build
```

**Step 5: Commit**

```bash
git add src/components/features/parcels/MakeOfferModal.tsx src/components/features/parcels/OfferCard.tsx src/components/features/parcels/index.ts
git commit -m "feat: add MakeOfferModal and OfferCard components"
```

---

## Task 22: Components — MatchedTravelers + ParcelDetail

**Files:**

- Create: `src/components/features/parcels/MatchedTravelers.tsx`
- Create: `src/components/features/parcels/ParcelDetail.tsx`

**Step 1: Create MatchedTravelers**

A section showing auto-matched travelers for a parcel:

- Title "Voyageurs compatibles"
- List of up to 5 matching listings with: traveler avatar, route, date, price/kg, compatibility score badge
- Each is a Link to the listing detail
- Uses mock data in demo mode (filter mockListings by same corridor)

**Step 2: Create ParcelDetail** following the pattern from `ListingDetail.tsx`

The detail page should have:

- Back button
- 2-column layout on desktop (detail + sidebar)
- Left column: photos carousel (if any), description, category badge, route with MapPin, weight + budget, urgency + fragile badges, desired date
- Right column (sidebar): Sender profile card (avatar, name, rating), action buttons ("Proposer mes kilos" via MakeOfferModal + "Contacter" link), MatchedTravelers section
- If the current user is the parcel owner: show "Offres recues" section with OfferCards instead of action buttons

**Step 3: Export**

Add to `src/components/features/parcels/index.ts`:

```typescript
export { MatchedTravelers } from './MatchedTravelers';
export { ParcelDetail } from './ParcelDetail';
```

**Step 4: Verify**

```bash
pnpm build
```

**Step 5: Commit**

```bash
git add src/components/features/parcels/
git commit -m "feat: add MatchedTravelers and ParcelDetail components"
```

---

## Task 23: Page — /colis/[id]

**Files:**

- Create: `src/app/(main)/colis/[id]/page.tsx`

**Step 1: Create dynamic page** following the pattern from `annonces/[id]/page.tsx`

```typescript
import type { Metadata } from 'next';
import { ParcelDetail } from '@/components/features/parcels';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Colis ${id.slice(0, 8)}`,
    description: 'Details du colis a envoyer.',
  };
}

export default async function ParcelDetailPage({ params }: Props) {
  const { id } = await params;
  return <ParcelDetail parcelId={id} />;
}
```

**Step 2: Verify**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/app/(main)/colis/
git commit -m "feat: add /colis/[id] detail page route"
```

---

## Task 24: Build verification + final cleanup

**Step 1: Full build**

```bash
pnpm build
```

Expected: zero errors, `/colis` and `/colis/[id]` appear in the route list.

**Step 2: Test on mobile simulator**

Open `http://localhost:3000` in the iPhone 16 Pro Max simulator. Verify:

1. Sidebar shows "Colis" link
2. `/colis` shows the parcel grid with 5 active mock parcels
3. Clicking a card opens `/colis/[id]` with detail page
4. "Proposer mes kilos" opens the MakeOfferModal
5. `/annonces/new` shows the toggle, switching between listing and parcel forms
6. DatePicker opens a visual calendar with French locale
7. Photo upload shows compact strip
8. Urgency pills and fragile switch work
9. No horizontal overflow on any page

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: final polish for sender parcel posting feature"
```

---

## Execution order summary

| #   | Task                            | Files                | Depends on |
| --- | ------------------------------- | -------------------- | ---------- |
| 1   | Install react-day-picker        | package.json         | —          |
| 2   | Types                           | types/index.ts       | —          |
| 3   | Constants                       | constants/index.ts   | —          |
| 4   | Validations                     | validations/index.ts | 2, 3       |
| 5   | Mock data                       | mock-data.ts         | 2          |
| 6   | DatePicker UI                   | ui/DatePicker.tsx    | 1          |
| 7   | TypeToggle UI                   | ui/TypeToggle.tsx    | —          |
| 8   | PhotoUpload UI                  | ui/PhotoUpload.tsx   | 3          |
| 9   | Navigation                      | navigation.ts        | —          |
| 10  | DB migration                    | SQL file             | —          |
| 11  | Service: parcels                | services/parcels.ts  | 2, 4       |
| 12  | Service: offers                 | services/offers.ts   | 2, 4       |
| 13  | Service: matching               | services/matching.ts | 2          |
| 14  | API: /parcels                   | api/parcels/route.ts | 11, 4      |
| 15  | API: /parcels/[id] + offers     | api/parcels/[id]/    | 11, 12, 4  |
| 16  | API: upload                     | api/parcels/upload   | —          |
| 17  | Hooks                           | hooks/               | 2, 5       |
| 18  | Unified form                    | NewListingForm.tsx   | 4, 6, 7, 8 |
| 19  | ParcelCard + ParcelsPage        | parcels/             | 17, 3      |
| 20  | Page /colis                     | app/colis/           | 19         |
| 21  | MakeOfferModal + OfferCard      | parcels/             | 6, 4       |
| 22  | MatchedTravelers + ParcelDetail | parcels/             | 17, 21, 19 |
| 23  | Page /colis/[id]                | app/colis/[id]/      | 22         |
| 24  | Build verification              | —                    | all        |
