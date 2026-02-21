'use client';

import { CheckCircle, WarningCircle, Clock } from '@phosphor-icons/react';
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
  1: { label: 'Email vérifié', icon: CheckCircle, variant: 'outline' as const },
  2: { label: 'Téléphone vérifié', icon: CheckCircle, variant: 'info' as const },
  3: { label: 'Identité vérifiée', icon: CheckCircle, variant: 'success' as const },
};

const statusConfig = {
  none: { icon: WarningCircle, color: 'text-neutral-400' },
  pending: { icon: Clock, color: 'text-amber-500' },
  verified: { icon: CheckCircle, color: 'text-green-500' },
  failed: { icon: WarningCircle, color: 'text-red-500' },
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

  const sizeMap = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  if (!showLabel) {
    return (
      <Icon
        size={sizeMap[size]}
        className={cn(status === 'verified' ? 'text-green-500' : statusCfg.color, className)}
      />
    );
  }

  return (
    <Badge variant={level === 3 ? 'success' : 'outline'} size={size} className={className}>
      <Icon className="mr-1" size={sizeMap[size]} />
      {config.label}
    </Badge>
  );
}
