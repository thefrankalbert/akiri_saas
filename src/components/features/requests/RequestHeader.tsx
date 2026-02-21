'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/constants';
import type { RequestStatus } from '@/types';

interface RequestHeaderProps {
  status: RequestStatus;
}

export function RequestHeader({ status }: RequestHeaderProps) {
  return (
    <>
      <Link
        href="/demandes"
        className="text-surface-100 mb-4 inline-flex items-center gap-1 text-sm font-medium hover:text-neutral-100"
      >
        <ArrowLeft weight="bold" size={16} />
        Retour aux demandes
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-100">Détail de la demande</h1>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            REQUEST_STATUS_COLORS[status] || 'bg-surface-700 text-surface-100'
          }`}
        >
          {REQUEST_STATUS_LABELS[status] || status}
        </span>
      </div>
    </>
  );
}
