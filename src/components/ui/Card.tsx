'use client';

import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive' | 'gradient' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white border border-neutral-200/60 rounded-lg shadow-xs',
  bordered: 'bg-white border border-neutral-200 rounded-lg',
  elevated: 'bg-white border border-neutral-200/60 rounded-lg shadow-soft',
  interactive: 'bg-white border border-neutral-200/60 rounded-lg shadow-xs cursor-pointer',
  gradient: 'bg-white border border-neutral-200/60 rounded-lg shadow-xs',
  glass: 'bg-white/80 backdrop-blur-lg border border-neutral-200/40 rounded-lg shadow-sm',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
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
        hover && 'hover:shadow-soft transition-all duration-200 hover:border-neutral-300',
        variant === 'interactive' &&
          'hover:shadow-soft transition-all duration-200 hover:border-neutral-300 active:scale-[0.99]',
        glow && 'hover:ring-primary-200 hover:ring-2',
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
    <div className={cn('mb-4', className)} {...props}>
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
    <Tag className={cn('text-lg font-semibold text-neutral-900', className)} {...props}>
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
    <p className={cn('text-sm text-neutral-500', className)} {...props}>
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
    <div className={cn('mt-4 flex items-center gap-2', className)} {...props}>
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

const statsVariantStyles: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
  default: {
    bg: 'bg-white',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-600',
  },
  primary: {
    bg: 'bg-white',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  secondary: {
    bg: 'bg-white',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  accent: {
    bg: 'bg-white',
    iconBg: 'bg-accent-50',
    iconColor: 'text-accent-600',
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
    <Card
      variant="elevated"
      padding="lg"
      hover
      className={cn('group', styles.bg, className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
          {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
          {trend && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-error'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              styles.iconBg
            )}
          >
            <span className={styles.iconColor}>{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
