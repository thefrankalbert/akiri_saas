'use client';

import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive' | 'gradient' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  default: 'bg-surface-800 border border-white/[0.08] rounded-2xl',
  bordered: 'bg-surface-800 border border-white/[0.08] rounded-2xl',
  elevated:
    'bg-surface-800 border border-white/[0.08] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
  interactive:
    'bg-surface-800 border border-white/[0.08] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary-500/30 cursor-pointer transition-all duration-300',
  gradient: 'glass rounded-2xl',
  glass: 'glass rounded-2xl',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  glow = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        hover &&
          variant !== 'elevated' &&
          variant !== 'interactive' &&
          'transition-all duration-200 hover:border-white/[0.12]',
        glow && 'hover:shadow-glow-primary',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  as: Tag = 'h3',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) {
  return (
    <Tag className={cn('text-base font-semibold text-neutral-100', className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-surface-100 text-sm', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Animated Stats Card for dashboard-style displays
interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const statsVariantStyles: Record<string, { iconBg: string; iconColor: string }> = {
  default: {
    iconBg: 'bg-surface-600',
    iconColor: 'text-surface-100',
  },
  primary: {
    iconBg: 'bg-primary-500/10',
    iconColor: 'text-primary-400',
  },
  secondary: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  accent: {
    iconBg: 'bg-accent-500/10',
    iconColor: 'text-accent-400',
  },
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className,
  ...props
}: StatsCardProps) {
  const styles = statsVariantStyles[variant];

  return (
    <div
      className={cn('bg-surface-800 rounded-2xl border border-white/[0.08] p-5', className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              styles.iconBg
            )}
          >
            <span className={styles.iconColor}>{icon}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-surface-100 text-sm">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="font-mono text-2xl font-bold text-neutral-100 tabular-nums">{value}</p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-error'
                )}
              >
                {trend.isPositive ? '\u2191' : '\u2193'}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && <p className="text-surface-200 mt-1 text-xs">{description}</p>}
        </div>
      </div>
    </div>
  );
}
