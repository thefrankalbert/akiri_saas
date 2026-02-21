'use client';

import Link from 'next/link';
import { ArrowLeft, Package } from '@phosphor-icons/react';
import { Button, Card, CardContent, Shimmer, FadeIn } from '@/components/ui';
import { useRequestDetail } from '@/lib/hooks/use-request-detail';
import { RequestHeader } from './RequestHeader';
import { RequestStatusStepper } from './RequestStatusStepper';
import { RequestDetails } from './RequestDetails';
import { RequestActions } from './RequestActions';

interface RequestDetailPageProps {
  requestId: string;
}

export function RequestDetailPage({ requestId }: RequestDetailPageProps) {
  const {
    request,
    loading,
    error,
    actionLoading,
    confirmCode,
    hasReviewed,
    role,
    counterparty,
    setConfirmCode,
    setHasReviewed,
    handleStatusAction,
    copyCode,
  } = useRequestDetail(requestId);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Shimmer className="mb-4 h-6 w-32" />
        <Shimmer className="mb-6 h-16 w-full rounded-2xl" />
        <Shimmer className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Package weight="duotone" size={48} className="text-surface-300 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-neutral-100">
          {error || 'Demande introuvable'}
        </h2>
        <Link href="/demandes" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft weight="bold" size={16} />}>
            Retour aux demandes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <FadeIn>
        <RequestHeader status={request.status} />

        <Card className="mb-4">
          <CardContent className="p-4">
            <RequestStatusStepper currentStatus={request.status} />
          </CardContent>
        </Card>

        <RequestDetails
          request={request}
          role={role}
          counterparty={counterparty}
          onCopyCode={copyCode}
        />

        <RequestActions
          request={request}
          role={role}
          counterparty={counterparty}
          actionLoading={actionLoading}
          confirmCode={confirmCode}
          hasReviewed={hasReviewed}
          onSetConfirmCode={setConfirmCode}
          onSetHasReviewed={setHasReviewed}
          onStatusAction={handleStatusAction}
        />
      </FadeIn>
    </div>
  );
}
