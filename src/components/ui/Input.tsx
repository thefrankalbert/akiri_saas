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
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900',
              'placeholder:text-neutral-400',
              'transition-colors duration-150',
              'focus:border-primary-500 focus:ring-primary-500/20 focus:ring-2 focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-50',
              error ? 'border-error focus:border-error focus:ring-error/20' : 'border-neutral-300',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-error mt-1.5 text-xs">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
