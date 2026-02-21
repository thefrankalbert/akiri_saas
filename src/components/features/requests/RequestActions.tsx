'use client';

import { CheckCircle, CreditCard, XCircle } from '@phosphor-icons/react';
import { Button, Card, CardContent } from '@/components/ui';
import { ReviewForm } from '@/components/features/reviews/ReviewForm';
import { formatCurrency } from '@/lib/utils';
import type { ShipmentRequest, Profile } from '@/types';

interface RequestActionsProps {
  request: ShipmentRequest;
  role: 'sender' | 'traveler';
  counterparty: Profile | undefined;
  actionLoading: boolean;
  confirmCode: string;
  hasReviewed: boolean;
  onSetConfirmCode: (code: string) => void;
  onSetHasReviewed: (value: boolean) => void;
  onStatusAction: (action: string) => Promise<void>;
}

export function RequestActions({
  request,
  role,
  counterparty,
  actionLoading,
  confirmCode,
  hasReviewed,
  onSetConfirmCode,
  onSetHasReviewed,
  onStatusAction,
}: RequestActionsProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {role === 'traveler' && request.status === 'pending' && (
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => onStatusAction('accept')}
              isLoading={actionLoading}
              leftIcon={<CheckCircle weight="duotone" size={16} />}
            >
              Accepter
            </Button>
            <Button
              variant="outline"
              className="text-error flex-1"
              onClick={() => onStatusAction('cancel')}
              isLoading={actionLoading}
              leftIcon={<XCircle weight="duotone" size={16} />}
            >
              Refuser
            </Button>
          </div>
        )}

        {role === 'sender' && request.status === 'accepted' && (
          <Button
            className="w-full"
            onClick={() => onStatusAction('pay')}
            isLoading={actionLoading}
            leftIcon={<CreditCard weight="duotone" size={16} />}
          >
            Procéder au paiement — {formatCurrency(request.total_price)}
          </Button>
        )}

        {role === 'sender' && request.status === 'delivered' && (
          <div className="space-y-3">
            <p className="text-surface-100 text-sm">
              Entrez le code à 6 chiffres pour confirmer la réception.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={confirmCode}
              onChange={(e) => onSetConfirmCode(e.target.value.replace(/\D/g, ''))}
              className="bg-surface-700 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-white/[0.08] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-neutral-100 focus:ring-1 focus:outline-none"
            />
            <Button
              className="w-full"
              onClick={() => onStatusAction('confirm')}
              isLoading={actionLoading}
              disabled={confirmCode.length !== 6}
              leftIcon={<CheckCircle weight="duotone" size={16} />}
            >
              Confirmer la livraison
            </Button>
          </div>
        )}

        {request.status === 'confirmed' && !hasReviewed && counterparty && (
          <div className="space-y-3">
            <div className="border-success/20 bg-success/10 rounded-xl border px-4 py-3">
              <p className="text-success text-sm font-medium">
                Livraison confirmée ! Partagez votre expérience.
              </p>
            </div>
            <ReviewForm
              requestId={request.id}
              reviewedId={counterparty.user_id}
              reviewedName={`${counterparty.first_name} ${counterparty.last_name}`}
              onReviewSubmitted={() => onSetHasReviewed(true)}
            />
          </div>
        )}

        {request.status === 'confirmed' && hasReviewed && (
          <div className="border-success/20 bg-success/10 rounded-xl border px-4 py-3 text-center">
            <CheckCircle weight="duotone" size={24} className="text-success mx-auto" />
            <p className="text-success mt-1 text-sm font-medium">Merci pour votre avis !</p>
          </div>
        )}

        {['paid', 'collected', 'in_transit'].includes(request.status) && (
          <p className="text-surface-100 text-center text-sm">
            {request.status === 'paid' && 'En attente de la collecte du colis par le voyageur.'}
            {request.status === 'collected' &&
              'Le colis a été collecté et sera bientôt en transit.'}
            {request.status === 'in_transit' && 'Le colis est en transit vers sa destination.'}
          </p>
        )}

        {request.status === 'cancelled' && (
          <p className="text-error text-center text-sm">Cette demande a été annulée.</p>
        )}
      </CardContent>
    </Card>
  );
}
