import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'primary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<string, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success/15 text-emerald-800 ring-1 ring-success/30',
  warning: 'bg-accent-100 text-accent-800 ring-1 ring-accent-300',
  error: 'bg-red-100 text-red-800 ring-1 ring-red-200',
  info: 'bg-secondary-100 text-secondary-800 ring-1 ring-secondary-200',
  outline: 'border border-neutral-300 text-neutral-600',
  primary: 'bg-primary-100 text-primary-800 ring-1 ring-primary-200',
  accent: 'bg-accent-100 text-accent-800 ring-1 ring-accent-200',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-3.5 py-1 text-sm',
};

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
