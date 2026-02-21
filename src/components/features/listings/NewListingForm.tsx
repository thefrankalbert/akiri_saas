'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plane, MapPin, Calendar, Package, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { createListingSchema, type CreateListingInput } from '@/lib/validations';
import { SUPPORTED_COUNTRIES, ITEM_CATEGORIES } from '@/constants';
import { createClient } from '@/lib/supabase/client';

export function NewListingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [collectionPoints, setCollectionPoints] = useState<string[]>(['']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
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

  const addCollectionPoint = () => {
    setCollectionPoints([...collectionPoints, '']);
  };

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
    setServerError(null);

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
      setServerError(error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="border-neutral-200/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 flex h-10 w-10 items-center justify-center rounded-xl">
              <Plane className="text-primary-600 h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Publier une annonce</CardTitle>
              <CardDescription>
                Indiquez votre trajet et les kilos disponibles dans vos bagages
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Route */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <MapPin className="h-4 w-4" />
                Itinéraire
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Pays de départ
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                    {...register('departure_country')}
                  >
                    <option value="">Sélectionner</option>
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.departure_country && (
                    <p className="text-error mt-1 text-xs">{errors.departure_country.message}</p>
                  )}
                </div>
                <Input
                  label="Ville de départ"
                  placeholder="Paris"
                  error={errors.departure_city?.message}
                  {...register('departure_city')}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Pays d&apos;arrivée
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                    {...register('arrival_country')}
                  >
                    <option value="">Sélectionner</option>
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.arrival_country && (
                    <p className="text-error mt-1 text-xs">{errors.arrival_country.message}</p>
                  )}
                </div>
                <Input
                  label="Ville d'arrivée"
                  placeholder="Douala"
                  error={errors.arrival_city?.message}
                  {...register('arrival_city')}
                />
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <Calendar className="h-4 w-4" />
                Dates
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Date de départ"
                  type="date"
                  error={errors.departure_date?.message}
                  {...register('departure_date')}
                />
                <Input
                  label="Date d'arrivée (optionnel)"
                  type="date"
                  error={errors.arrival_date?.message}
                  {...register('arrival_date')}
                />
              </div>
            </div>

            {/* Weight & Price */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <Package className="h-4 w-4" />
                Kilos et prix
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Kilos disponibles"
                  type="number"
                  placeholder="10"
                  error={errors.available_kg?.message}
                  {...register('available_kg', { valueAsNumber: true })}
                />
                <Input
                  label="Prix par kilo (EUR)"
                  type="number"
                  step="0.5"
                  placeholder="8"
                  error={errors.price_per_kg?.message}
                  {...register('price_per_kg', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Articles acceptés
              </label>
              <div className="flex flex-wrap gap-2">
                {ITEM_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {errors.accepted_items && (
                <p className="text-error mt-1 text-xs">{errors.accepted_items.message}</p>
              )}
            </div>

            {/* Collection Points */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Points de collecte
              </label>
              <div className="space-y-2">
                {collectionPoints.map((point, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Ex: Gare du Nord, Paris"
                      value={point}
                      onChange={(e) => updateCollectionPoint(i, e.target.value)}
                    />
                    {collectionPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCollectionPoint(i)}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addCollectionPoint}
                className="text-primary-600 hover:text-primary-500 mt-2 inline-flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Ajouter un point
              </button>
              {errors.collection_points && (
                <p className="text-error mt-1 text-xs">{errors.collection_points.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Description (optionnel)
              </label>
              <textarea
                className="focus:border-primary-500 focus:ring-primary-500/20 flex min-h-[100px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
                placeholder="Informations complémentaires sur votre trajet..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-error mt-1 text-xs">{errors.description.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Publier l&apos;annonce
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
