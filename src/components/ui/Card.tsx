import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white shadow-card rounded-xl',
  bordered: 'bg-white border border-neutral-200 rounded-xl',
  elevated: 'bg-white shadow-soft rounded-xl',
  interactive: 'bg-white shadow-card rounded-xl cursor-pointer',
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
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        variant === 'interactive' &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]',
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
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-neutral-900', className)} {...props}>
      {children}
    </h3>
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
