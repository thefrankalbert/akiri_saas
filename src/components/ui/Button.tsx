'use client';

import { forwardRef } from 'react';
import { SpinnerGap } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]',
  secondary: 'bg-surface-700 text-neutral-100 border border-white/[0.08] hover:bg-surface-600',
  outline: 'bg-surface-700 text-neutral-100 border border-white/[0.08] hover:bg-surface-600',
  ghost: 'text-surface-100 hover:bg-surface-700 hover:text-neutral-100',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-13 px-7 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      fullWidth,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
          'focus-visible:outline-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2',
          'disabled:pointer-events-none disabled:opacity-40',
          isLoading && 'pointer-events-none opacity-80',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <SpinnerGap className="h-4 w-4 animate-spin text-white" weight="bold" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
