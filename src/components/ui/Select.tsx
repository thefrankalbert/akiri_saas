'use client';

import { forwardRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="text-surface-50 mb-2 block text-sm font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'bg-surface-700 flex h-12 w-full appearance-none rounded-xl border px-4 pr-10 text-sm text-neutral-100',
              'transition-all duration-150',
              'focus:border-primary-500 focus:ring-primary-500/20 focus:ring-2 focus:outline-none',
              'disabled:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-40',
              error ? 'border-error ring-error/20 ring-2' : 'border-white/[0.08]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <CaretDown
            size={14}
            weight="bold"
            className="text-surface-200 pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
          />
        </div>
        {error && <p className="text-error mt-1.5 text-xs">{error}</p>}
        {hint && !error && <p className="text-surface-200 mt-1.5 text-xs">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
