'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  requestId: string;
  reviewedId: string;
  reviewedName: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  requestId,
  reviewedId,
  reviewedName,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      request_id: requestId,
      reviewed_id: reviewedId,
      rating: 0,
      comment: '',
    },
  });

  const ratingValue = watch('rating');
  const commentValue = watch('comment') || '';

  const onSubmit = async (data: CreateReviewInput) => {
    setServerError(null);

    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 500));
      toasts.reviewCreated();
      onReviewSubmitted?.();
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || "Erreur lors de l'envoi");
        return;
      }

      toasts.reviewCreated();
      onReviewSubmitted?.();
    } catch {
      toasts.genericError();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm">{serverError}</div>
      )}

      {/* Star selector */}
      <div>
        <label className="text-surface-50 mb-1.5 block text-sm font-medium">
          Note pour {reviewedName}
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starIndex = i + 1;
            const isFilled = starIndex <= (hoveredStar || ratingValue);

            return (
              <button
                key={i}
                type="button"
                onClick={() => setValue('rating', starIndex, { shouldValidate: true })}
                onMouseEnter={() => setHoveredStar(starIndex)}
                onMouseLeave={() => setHoveredStar(0)}
                className="rounded p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  weight={isFilled ? 'fill' : 'duotone'}
                  size={28}
                  className={cn(
                    'transition-colors',
                    isFilled ? 'text-amber-400' : 'text-surface-400'
                  )}
                />
              </button>
            );
          })}
          {ratingValue > 0 && (
            <span className="text-surface-100 ml-2 text-sm">{ratingValue}/5</span>
          )}
        </div>
        {errors.rating?.message && (
          <p className="text-error mt-1 text-xs">{errors.rating.message}</p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="text-surface-50 mb-1.5 block text-sm font-medium">
          Commentaire (optionnel)
        </label>
        <textarea
          placeholder="Partagez votre expérience..."
          className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-neutral-100 focus:ring-1 focus:outline-none"
          rows={3}
          maxLength={1000}
          {...register('comment')}
        />
        <div className="mt-1 flex justify-end">
          <span className="text-surface-200 text-xs">{commentValue.length}/1000</span>
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={ratingValue === 0}
        className="w-full"
      >
        Publier l&apos;avis
      </Button>
    </form>
  );
}
