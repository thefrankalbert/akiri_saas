'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxChars?: number;
  currentLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, maxChars, currentLength, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="text-surface-50 mb-2 block text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'bg-surface-700 w-full rounded-xl border px-4 py-3 text-sm text-neutral-100',
            'placeholder:text-surface-200',
            'transition-all duration-150',
            'focus:border-primary-500 focus:ring-primary-500/20 focus:ring-2 focus:outline-none',
            'disabled:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-40',
            error ? 'border-error ring-error/20 ring-2' : 'border-white/[0.08]',
            className
          )}
          {...props}
        />
        {(maxChars != null || error || hint) && (
          <div className="mt-1.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              {error && <p className="text-error text-xs">{error}</p>}
              {hint && !error && <p className="text-surface-200 text-xs">{hint}</p>}
            </div>
            {maxChars != null && (
              <span className="text-surface-200 shrink-0 text-xs">
                {currentLength ?? 0}/{maxChars}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
