'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Package } from '@phosphor-icons/react';
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
  Textarea,
  DatePicker,
} from '@/components/ui';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { ParcelPosting } from '@/types';

// --- Validation schema ---
const makeOfferSchema = z.object({
  proposed_price: z.number({ error: 'Le prix est requis' }).min(1, 'Le prix minimum est 1 EUR'),
  departure_date: z
    .string({ error: 'La date de depart est requise' })
    .min(1, 'La date de depart est requise'),
  message: z.string().optional(),
});

type MakeOfferInput = z.infer<typeof makeOfferSchema>;

interface MakeOfferModalProps {
  parcel: ParcelPosting;
  children: React.ReactNode;
}

export function MakeOfferModal({ parcel, children }: MakeOfferModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MakeOfferInput>({
    resolver: zodResolver(makeOfferSchema),
    defaultValues: {
      proposed_price: parcel.budget_per_kg ? parcel.budget_per_kg * parcel.weight_kg : undefined,
      departure_date: '',
      message: '',
    },
  });

  const onSubmit = async (data: MakeOfferInput) => {
    setServerError(null);

    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 500));
      toasts.requestCreated();
      setOpen(false);
      return;
    }

    try {
      const res = await fetch(`/api/parcels/${parcel.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || "Erreur lors de la creation de l'offre");
        return;
      }

      toasts.requestCreated();
      setOpen(false);
      router.refresh();
    } catch {
      toasts.genericError();
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Proposer mes kilos</ModalTitle>
          <ModalDescription>Faites une offre pour transporter ce colis</ModalDescription>
        </ModalHeader>

        {/* Parcel summary */}
        <div className="bg-surface-700 mx-6 mb-4 rounded-xl border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin weight="duotone" size={16} className="text-primary-400 shrink-0" />
            <span className="font-medium text-neutral-100">{parcel.departure_city}</span>
            <span className="text-surface-300">&rarr;</span>
            <span className="font-medium text-neutral-100">{parcel.arrival_city}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <div className="text-surface-100 flex items-center gap-1">
              <Package weight="duotone" size={14} />
              <span>{parcel.weight_kg} kg</span>
            </div>
            {parcel.budget_per_kg && (
              <span className="text-primary-400 font-mono font-bold">
                Budget: {formatCurrency(parcel.budget_per_kg)}/kg
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6">
          {serverError && (
            <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm">{serverError}</div>
          )}

          <Input
            label="Prix propose (EUR)"
            type="number"
            step={1}
            min={1}
            placeholder="Ex: 80"
            error={errors.proposed_price?.message}
            {...register('proposed_price', { valueAsNumber: true })}
          />

          <Controller
            control={control}
            name="departure_date"
            render={({ field }) => (
              <DatePicker
                label="Date de depart"
                value={field.value}
                onChange={(v) => field.onChange(v ?? '')}
                error={errors.departure_date?.message}
                placeholder="Choisir votre date de depart"
              />
            )}
          />

          <Textarea
            label="Message (optionnel)"
            placeholder="Précisions sur votre voyage, points de collecte..."
            rows={3}
            {...register('message')}
          />

          <ModalFooter className="px-0">
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Envoyer l&apos;offre
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
