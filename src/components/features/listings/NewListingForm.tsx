'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AirplaneTilt, Cube, Plus, X } from '@phosphor-icons/react';
import {
  Button,
  Input,
  TypeToggle,
  DatePicker,
  PhotoUpload,
  AnimatePresence,
  motion,
} from '@/components/ui';
import { createListingSchema, type CreateListingInput } from '@/lib/validations';
import { createParcelPostingSchema, type CreateParcelPostingInput } from '@/lib/validations';
import {
  SUPPORTED_COUNTRIES,
  ITEM_CATEGORIES,
  PARCEL_CATEGORIES,
  URGENCY_LEVELS,
} from '@/constants';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { toasts } from '@/lib/utils/toast';

// ─── Types ─────────────────────────────────────────────────
type FormType = 'listing' | 'parcel';

const TOGGLE_OPTIONS = [
  {
    value: 'listing',
    label: 'Kilos disponibles',
    icon: <AirplaneTilt size={16} weight="duotone" />,
  },
  { value: 'parcel', label: 'Colis à envoyer', icon: <Cube size={16} weight="duotone" /> },
];

// ─── Shared select classes ─────────────────────────────────
const selectCls =
  'bg-surface-700 flex h-10 w-full rounded-lg border border-white/[0.08] px-3 text-sm text-neutral-100 focus:border-primary-500 focus:ring-primary-500/20 focus:ring-2 focus:outline-none';

const compactInputCls = 'h-10 !rounded-lg';

// ─── Listing Sub-Form ──────────────────────────────────────
function ListingSubForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [collectionPoints, setCollectionPoints] = useState<string[]>(['']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      currency: 'EUR',
      accepted_items: [],
      refused_items: [],
      collection_points: [],
    },
  });

  const toggleCategory = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    setValue('accepted_items', updated as CreateListingInput['accepted_items'], {
      shouldValidate: true,
    });
  };

  const addCollectionPoint = () => setCollectionPoints([...collectionPoints, '']);

  const removeCollectionPoint = (index: number) => {
    const updated = collectionPoints.filter((_, i) => i !== index);
    setCollectionPoints(updated);
    setValue('collection_points', updated.filter(Boolean), { shouldValidate: true });
  };

  const updateCollectionPoint = (index: number, value: string) => {
    const updated = [...collectionPoints];
    updated[index] = value;
    setCollectionPoints(updated);
    setValue('collection_points', updated.filter(Boolean), { shouldValidate: true });
  };

  const onSubmit = async (data: CreateListingInput) => {
    if (!supabaseConfigured) {
      toasts.listingCreated();
      onSuccess();
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/annonces/new');
      return;
    }

    const { error } = await supabase.from('listings').insert({
      traveler_id: user.id,
      ...data,
      status: 'active',
    });

    if (error) {
      toasts.genericError(error.message);
      return;
    }

    toasts.listingCreated();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2.5">
      {/* Row 1: Departure country + city */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-surface-50 mb-1 block text-xs font-medium">Pays de départ</label>
          <select className={selectCls} {...register('departure_country')}>
            <option value="">Sélectionner</option>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.departure_country && (
            <p className="text-error mt-0.5 text-[10px]">{errors.departure_country.message}</p>
          )}
        </div>
        <Input
          label="Ville de départ"
          placeholder="Paris"
          className={compactInputCls}
          error={errors.departure_city?.message}
          {...register('departure_city')}
        />
      </div>

      {/* Row 2: Arrival country + city */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-surface-50 mb-1 block text-xs font-medium">
            Pays d&apos;arrivée
          </label>
          <select className={selectCls} {...register('arrival_country')}>
            <option value="">Sélectionner</option>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.arrival_country && (
            <p className="text-error mt-0.5 text-[10px]">{errors.arrival_country.message}</p>
          )}
        </div>
        <Input
          label="Ville d'arrivée"
          placeholder="Douala"
          className={compactInputCls}
          error={errors.arrival_city?.message}
          {...register('arrival_city')}
        />
      </div>

      {/* Row 3: Date */}
      <Controller
        control={control}
        name="departure_date"
        render={({ field }) => (
          <DatePicker
            label="Date de départ"
            value={field.value}
            onChange={(v) => field.onChange(v ?? '')}
            error={errors.departure_date?.message}
            placeholder="Choisir une date"
          />
        )}
      />

      {/* Row 4: Kilos + Price */}
      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="Kilos disponibles"
          type="number"
          placeholder="10"
          className={compactInputCls}
          error={errors.available_kg?.message}
          {...register('available_kg', { valueAsNumber: true })}
        />
        <Input
          label="Prix/kg (EUR)"
          type="number"
          step="0.5"
          placeholder="8"
          className={compactInputCls}
          error={errors.price_per_kg?.message}
          {...register('price_per_kg', { valueAsNumber: true })}
        />
      </div>

      {/* Row 5: Categories (chips) */}
      <div>
        <label className="text-surface-50 mb-1 block text-xs font-medium">Articles acceptés</label>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedCategories.includes(category)
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'bg-surface-700 text-surface-100 border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        {errors.accepted_items && (
          <p className="text-error mt-0.5 text-[10px]">{errors.accepted_items.message}</p>
        )}
      </div>

      {/* Row 6: Collection Points (compact) */}
      <div>
        <label className="text-surface-50 mb-1 block text-xs font-medium">Points de collecte</label>
        <div className="space-y-1.5">
          {collectionPoints.map((point, i) => (
            <div key={i} className="flex gap-1.5">
              <Input
                placeholder="Ex: Gare du Nord"
                value={point}
                className={compactInputCls}
                onChange={(e) => updateCollectionPoint(i, e.target.value)}
              />
              {collectionPoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCollectionPoint(i)}
                  className="text-surface-200 hover:bg-surface-700 shrink-0 rounded-lg p-2 hover:text-neutral-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCollectionPoint}
          className="text-primary-400 hover:text-primary-300 mt-1 inline-flex items-center gap-1 text-xs font-medium"
        >
          <Plus size={12} />
          Ajouter un point
        </button>
        {errors.collection_points && (
          <p className="text-error mt-0.5 text-[10px]">{errors.collection_points.message}</p>
        )}
      </div>

      {/* Row 7: Description */}
      <div>
        <label className="text-surface-50 mb-1 block text-xs font-medium">
          Description (optionnel)
        </label>
        <textarea
          className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500/20 flex min-h-[56px] w-full rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-neutral-100 focus:ring-2 focus:outline-none"
          placeholder="Infos complémentaires..."
          rows={2}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-error mt-0.5 text-[10px]">{errors.description.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="shadow-glow-primary mt-1 w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Publier mon annonce
      </Button>
    </form>
  );
}

// ─── Parcel Sub-Form ───────────────────────────────────────
function ParcelSubForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateParcelPostingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createParcelPostingSchema) as any,
    defaultValues: {
      photos: [],
      urgency: 'flexible',
      is_fragile: false,
    },
  });

  const urgencyValue = watch('urgency');
  const isFragile = watch('is_fragile');

  const handlePhotoAdd = async (file: File) => {
    setPhotoUploading(true);
    try {
      if (!supabaseConfigured) {
        // Mock: create an object URL for preview
        const url = URL.createObjectURL(file);
        const updated = [...photos, url];
        setPhotos(updated);
        setValue('photos', updated, { shouldValidate: true });
        setPhotoUploading(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `parcels/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('parcel-photos').upload(path, file);

      if (error) {
        toasts.genericError(error.message);
        setPhotoUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('parcel-photos').getPublicUrl(path);
      const updated = [...photos, publicUrl];
      setPhotos(updated);
      setValue('photos', updated, { shouldValidate: true });
    } catch {
      toasts.genericError('Erreur lors du téléchargement de la photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    setValue('photos', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateParcelPostingInput) => {
    if (!supabaseConfigured) {
      toasts.listingCreated();
      onSuccess();
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/annonces/new');
      return;
    }

    const { error } = await supabase.from('parcel_postings').insert({
      sender_id: user.id,
      ...data,
      status: 'active',
    });

    if (error) {
      toasts.genericError(error.message);
      return;
    }

    toasts.listingCreated();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2.5">
      {/* Row 1: Departure country + city */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-surface-50 mb-1 block text-xs font-medium">Pays de départ</label>
          <select className={selectCls} {...register('departure_country')}>
            <option value="">Sélectionner</option>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.departure_country && (
            <p className="text-error mt-0.5 text-[10px]">{errors.departure_country.message}</p>
          )}
        </div>
        <Input
          label="Ville de départ"
          placeholder="Paris"
          className={compactInputCls}
          error={errors.departure_city?.message}
          {...register('departure_city')}
        />
      </div>

      {/* Row 2: Arrival country + city */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-surface-50 mb-1 block text-xs font-medium">
            Pays d&apos;arrivée
          </label>
          <select className={selectCls} {...register('arrival_country')}>
            <option value="">Sélectionner</option>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.arrival_country && (
            <p className="text-error mt-0.5 text-[10px]">{errors.arrival_country.message}</p>
          )}
        </div>
        <Input
          label="Ville d'arrivée"
          placeholder="Douala"
          className={compactInputCls}
          error={errors.arrival_city?.message}
          {...register('arrival_city')}
        />
      </div>

      {/* Row 3: Date */}
      <Controller
        control={control}
        name="desired_date"
        render={({ field }) => (
          <DatePicker
            label="Date souhaitée (optionnel)"
            value={field.value ?? undefined}
            onChange={(v) => field.onChange(v ?? null)}
            error={errors.desired_date?.message}
            placeholder="Choisir une date"
          />
        )}
      />

      {/* Row 4: Weight + Category */}
      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="Poids (kg)"
          type="number"
          step="0.5"
          placeholder="5"
          className={compactInputCls}
          error={errors.weight_kg?.message}
          {...register('weight_kg', { valueAsNumber: true })}
        />
        <div>
          <label className="text-surface-50 mb-1 block text-xs font-medium">Catégorie</label>
          <select className={selectCls} {...register('category')}>
            <option value="">Sélectionner</option>
            {PARCEL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-error mt-0.5 text-[10px]">{errors.category.message}</p>
          )}
        </div>
      </div>

      {/* Row 5: Description */}
      <div>
        <label className="text-surface-50 mb-1 block text-xs font-medium">
          Description du colis
        </label>
        <textarea
          className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500/20 flex min-h-[56px] w-full rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-neutral-100 focus:ring-2 focus:outline-none"
          placeholder="Décrivez votre colis..."
          rows={2}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-error mt-0.5 text-[10px]">{errors.description.message}</p>
        )}
      </div>

      {/* Row 6: Photos */}
      <div>
        <label className="text-surface-50 mb-1 block text-xs font-medium">Photos (optionnel)</label>
        <PhotoUpload
          photos={photos}
          onAdd={handlePhotoAdd}
          onRemove={handlePhotoRemove}
          uploading={photoUploading}
          error={errors.photos?.message}
        />
      </div>

      {/* Row 7: Urgency pills + Fragile switch */}
      <div className="flex items-end gap-2.5">
        <div className="flex-1">
          <label className="text-surface-50 mb-1 block text-xs font-medium">Urgence</label>
          <div className="flex gap-1.5">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  setValue('urgency', level.value as CreateParcelPostingInput['urgency'], {
                    shouldValidate: true,
                  })
                }
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                  urgencyValue === level.value
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'bg-surface-700 text-surface-100 border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
        <label className="bg-surface-700 flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] px-3">
          <span className="text-xs font-medium text-neutral-100">Fragile</span>
          <button
            type="button"
            role="switch"
            aria-checked={isFragile}
            onClick={() => setValue('is_fragile', !isFragile, { shouldValidate: true })}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              isFragile ? 'bg-primary-500' : 'bg-surface-500'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                isFragile ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Row 8: Budget per kg (optional) */}
      <Input
        label="Budget max/kg (EUR, optionnel)"
        type="number"
        step="0.5"
        placeholder="10"
        className={compactInputCls}
        error={errors.budget_per_kg?.message}
        {...register('budget_per_kg', { setValueAs: (v: string) => (v === '' ? null : Number(v)) })}
      />

      {/* Submit */}
      <Button
        type="submit"
        className="shadow-glow-primary mt-1 w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Publier mon colis
      </Button>
    </form>
  );
}

// ─── Main Unified Form ─────────────────────────────────────
export function NewListingForm() {
  const router = useRouter();
  const [formType, setFormType] = useState<FormType>('listing');

  const handleSuccess = () => {
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-4 sm:px-6">
      {/* Type Toggle */}
      <TypeToggle
        options={TOGGLE_OPTIONS}
        value={formType}
        onChange={(v) => setFormType(v as FormType)}
        className="mb-4"
      />

      {/* Animated Form Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={formType}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {formType === 'listing' ? (
            <ListingSubForm onSuccess={handleSuccess} />
          ) : (
            <ParcelSubForm onSuccess={handleSuccess} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
