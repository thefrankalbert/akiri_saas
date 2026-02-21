'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from '@phosphor-icons/react';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
} from '@/components/ui';
import { createRequestSchema, type CreateRequestInput } from '@/lib/validations';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Listing } from '@/types';

interface SendRequestModalProps {
  listing: Listing;
  children: React.ReactNode;
}

export function SendRequestModal({ listing, children }: SendRequestModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      listing_id: listing.id,
      weight_kg: 1,
      item_description: '',
      special_instructions: '',
    },
  });

  const weightValue = watch('weight_kg') || 0;
  const dynamicPrice = weightValue * listing.price_per_kg;

  const onSubmit = async (data: CreateRequestInput) => {
    setServerError(null);

    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 500));
      toasts.requestCreated();
      setOpen(false);
      router.push('/demandes');
      return;
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || 'Erreur lors de la création');
        return;
      }

      toasts.requestCreated();
      setOpen(false);
      router.push('/demandes');
    } catch {
      toasts.genericError();
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Envoyer une demande</ModalTitle>
          <ModalDescription>
            {listing.departure_city} &rarr; {listing.arrival_city}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6">
          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
          )}

          <Input
            label="Poids (kg)"
            type="number"
            step={0.5}
            min={0.5}
            max={listing.available_kg}
            error={errors.weight_kg?.message}
            {...register('weight_kg', { valueAsNumber: true })}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Description du colis
            </label>
            <textarea
              placeholder="Décrivez le contenu de votre colis..."
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:outline-none"
              rows={3}
              {...register('item_description')}
            />
            {errors.item_description?.message && (
              <p className="mt-1 text-xs text-red-600">{errors.item_description.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Instructions spéciales
            </label>
            <textarea
              placeholder="Consignes particulières (optionnel)"
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:outline-none"
              rows={2}
              {...register('special_instructions')}
            />
          </div>

          {/* Dynamic price */}
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Package weight="duotone" size={16} />
              <span>
                {weightValue} kg × {formatCurrency(listing.price_per_kg)}/kg
              </span>
            </div>
            <span className="text-primary-600 text-lg font-bold">
              {formatCurrency(dynamicPrice)}
            </span>
          </div>

          <ModalFooter className="px-0">
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Envoyer la demande
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
