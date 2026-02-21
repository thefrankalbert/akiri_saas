'use client';

import { Check, X as XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/types';

interface RequestStatusStepperProps {
  currentStatus: RequestStatus;
}

const STEPS: { key: RequestStatus; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Acceptée' },
  { key: 'paid', label: 'Payée' },
  { key: 'collected', label: 'Collectée' },
  { key: 'in_transit', label: 'En transit' },
  { key: 'delivered', label: 'Livrée' },
  { key: 'confirmed', label: 'Confirmée' },
];

const TERMINAL_STATUSES: RequestStatus[] = ['cancelled', 'disputed'];

export function RequestStatusStepper({ currentStatus }: RequestStatusStepperProps) {
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full">
      {isTerminal ? (
        <div className="border-error/20 bg-error/10 flex items-center gap-2 rounded-lg border px-4 py-3">
          <XIcon weight="bold" size={16} className="text-error" />
          <span className="text-error text-sm font-medium">
            {currentStatus === 'cancelled' ? 'Demande annulée' : 'Litige en cours'}
          </span>
        </div>
      ) : (
        <div className="flex items-center">
          {STEPS.map((step, index) => {
            const isDone = index < currentIndex;
            const isActive = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      isDone && 'bg-success text-white',
                      isActive && 'bg-primary-500 text-white',
                      isFuture && 'bg-surface-600 text-surface-200'
                    )}
                  >
                    {isDone ? <Check weight="bold" size={12} /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'mt-1 max-w-[48px] text-center text-[10px] leading-tight sm:max-w-[72px] sm:text-xs',
                      isDone && 'text-success',
                      isActive && 'text-primary-400 font-medium',
                      isFuture && 'text-surface-200'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-1 h-0.5 flex-1',
                      index < currentIndex ? 'bg-success' : 'bg-surface-600'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
