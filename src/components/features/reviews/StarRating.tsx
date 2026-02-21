'use client';

import { Star } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export function StarRating({ rating, size = 16, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          weight={i < rating ? 'fill' : 'duotone'}
          size={size}
          className={i < rating ? 'text-amber-400' : 'text-surface-400'}
        />
      ))}
    </div>
  );
}
