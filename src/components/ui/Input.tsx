'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="text-surface-50 mb-2 block text-sm font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="text-surface-200 pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'bg-surface-700 flex h-12 w-full rounded-xl border px-4 text-sm text-neutral-100',
              'placeholder:text-surface-200',
              'transition-all duration-150',
              'focus:border-primary-500 focus:ring-primary-500/20 focus:ring-2 focus:outline-none',
              'disabled:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-40',
              error ? 'border-error ring-error/20 ring-2' : 'border-white/[0.08]',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="text-surface-200 absolute top-1/2 right-3.5 -translate-y-1/2">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-error mt-1.5 text-xs">{error}</p>}
        {hint && !error && <p className="text-surface-200 mt-1.5 text-xs">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
