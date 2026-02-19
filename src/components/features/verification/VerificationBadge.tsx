'use client';

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  level: 1 | 2 | 3;
  status?: 'none' | 'pending' | 'verified' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  1: { label: 'Email vérifié', icon: CheckCircle2, variant: 'outline' as const },
  2: { label: 'Téléphone vérifié', icon: CheckCircle2, variant: 'info' as const },
  3: { label: 'Identité vérifiée', icon: CheckCircle2, variant: 'success' as const },
};

const statusConfig = {
  none: { icon: AlertCircle, color: 'text-neutral-400' },
  pending: { icon: Clock, color: 'text-amber-500' },
  verified: { icon: CheckCircle2, color: 'text-green-500' },
  failed: { icon: AlertCircle, color: 'text-red-500' },
};

export function VerificationBadge({
  level,
  status = 'verified',
  size = 'md',
  showLabel = true,
  className,
}: VerificationBadgeProps) {
  const config = levelConfig[level];
  const statusCfg = statusConfig[status];
  const Icon = status === 'verified' ? config.icon : statusCfg.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (!showLabel) {
    return (
      <Icon
        className={cn(
          sizeClasses[size],
          status === 'verified' ? 'text-green-500' : statusCfg.color,
          className
        )}
      />
    );
  }

  return (
    <Badge variant={level === 3 ? 'success' : 'outline'} size={size} className={className}>
      <Icon className={cn('mr-1', sizeClasses[size])} />
      {config.label}
    </Badge>
  );
}
