'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  MapPin,
  ArrowLeft,
  CheckCircle,
  XCircle,
  CreditCard,
  LockKey,
  Star,
  Copy,
} from '@phosphor-icons/react';
import { Button, Card, CardContent, Avatar, Badge, Shimmer, FadeIn } from '@/components/ui';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/constants';
import { toasts } from '@/lib/utils/toast';
import { mockRequests } from '@/lib/mock-data';
import { RequestStatusStepper } from './RequestStatusStepper';
import { ReviewForm } from '@/components/features/reviews/ReviewForm';
import type { ShipmentRequest } from '@/types';

interface RequestDetailPageProps {
  requestId: string;
}

export function RequestDetailPage({ requestId }: RequestDetailPageProps) {
  const [request, setRequest] = useState<ShipmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  // For demo, assume current user is the sender (mock-user-001)
  const currentUserId = 'mock-user-001';

  useEffect(() => {
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const mock = mockRequests.find((r) => r.id === requestId);
        if (mock) {
          setRequest(mock);
        } else {
          setError('Demande introuvable');
        }
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchRequest = async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('shipment_requests')
        .select(
          '*, listing:listings!listing_id(*, traveler:profiles!traveler_id(*)), sender:profiles!sender_id(*)'
        )
        .eq('id', requestId)
        .single();

      if (controller.signal.aborted) return;

      if (err || !data) {
        setError('Demande introuvable');
        setLoading(false);
        return;
      }

      setRequest(data as unknown as ShipmentRequest);
      setLoading(false);
    };

    fetchRequest();

    return () => controller.abort();
  }, [requestId]);

  const role: 'sender' | 'traveler' = request?.sender_id === currentUserId ? 'sender' : 'traveler';

  const counterparty = role === 'sender' ? request?.listing?.traveler : request?.sender;

  const handleStatusAction = async (action: string) => {
    setActionLoading(true);

    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 500));
      if (action === 'accept') {
        toasts.requestAccepted();
        setRequest((prev) => (prev ? { ...prev, status: 'accepted' } : prev));
      } else if (action === 'cancel') {
        toasts.requestCancelled();
        setRequest((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      } else if (action === 'pay') {
        toasts.paymentSuccess();
        setRequest((prev) =>
          prev ? { ...prev, status: 'paid', confirmation_code: '482915' } : prev
        );
      } else if (action === 'confirm') {
        toasts.deliveryConfirmed();
        setRequest((prev) => (prev ? { ...prev, status: 'confirmed' } : prev));
      }
      setActionLoading(false);
      return;
    }

    try {
      if (action === 'pay') {
        const res = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: request?.id }),
        });
        if (res.ok) {
          toasts.paymentSuccess();
          setRequest((prev) => (prev ? { ...prev, status: 'paid' } : prev));
        } else {
          toasts.paymentFailed();
        }
      } else if (action === 'confirm') {
        const res = await fetch(`/api/requests/${request?.id}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: request?.id, confirmation_code: confirmCode }),
        });
        if (res.ok) {
          toasts.deliveryConfirmed();
          setRequest((prev) => (prev ? { ...prev, status: 'confirmed' } : prev));
        } else {
          toasts.genericError('Code de confirmation invalide');
        }
      } else {
        const res = await fetch(`/api/requests/${request?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'cancelled' }),
        });
        if (res.ok) {
          if (action === 'accept') toasts.requestAccepted();
          else toasts.requestCancelled();
          setRequest((prev) =>
            prev ? { ...prev, status: action === 'accept' ? 'accepted' : 'cancelled' } : prev
          );
        }
      }
    } catch {
      toasts.genericError();
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = () => {
    if (request?.confirmation_code) {
      navigator.clipboard.writeText(request.confirmation_code);
      toasts.copiedToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Shimmer className="mb-4 h-6 w-32" />
        <Shimmer className="mb-6 h-16 w-full rounded-lg" />
        <Shimmer className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Package weight="duotone" size={48} className="mx-auto text-neutral-300" />
        <h2 className="mt-4 text-xl font-semibold text-neutral-700">
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
      {/* Back */}
      <Link
        href="/demandes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft weight="bold" size={16} />
        Retour aux demandes
      </Link>

      <FadeIn>
        {/* Status header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-neutral-900">Détail de la demande</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              REQUEST_STATUS_COLORS[request.status] || 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {REQUEST_STATUS_LABELS[request.status] || request.status}
          </span>
        </div>

        {/* Stepper */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <RequestStatusStepper currentStatus={request.status} />
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mb-4">
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-neutral-900">{request.item_description}</h2>

            {request.listing && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin weight="duotone" size={14} />
                <span>
                  {request.listing.departure_city} &rarr; {request.listing.arrival_city}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Badge variant="default" size="sm">
                <Package weight="duotone" size={12} className="mr-1" />
                {request.weight_kg} kg
              </Badge>
              <span className="text-primary-600 font-bold">
                {formatCurrency(request.total_price)}
              </span>
            </div>

            {request.special_instructions && (
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-600">Instructions : </span>
                {request.special_instructions}
              </p>
            )}

            <p className="text-xs text-neutral-400">Créée le {formatDate(request.created_at)}</p>
          </CardContent>
        </Card>

        {/* Counterparty */}
        {counterparty && (
          <Card className="mb-4">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar
                src={counterparty.avatar_url}
                firstName={counterparty.first_name}
                lastName={counterparty.last_name}
                size="md"
                isVerified={counterparty.is_verified}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {counterparty.first_name} {counterparty.last_name}
                </p>
                {counterparty.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star weight="fill" size={12} className="text-amber-400" />
                    <span className="text-xs text-neutral-500">
                      {counterparty.rating.toFixed(1)} ({counterparty.total_reviews} avis)
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-neutral-400">
                {role === 'sender' ? 'Voyageur' : 'Expéditeur'}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Confirmation code — shown to sender when status >= paid */}
        {role === 'sender' &&
          request.confirmation_code &&
          ['paid', 'collected', 'in_transit', 'delivered', 'confirmed'].includes(
            request.status
          ) && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <LockKey weight="duotone" size={16} className="text-primary-500" />
                  <span className="font-medium">Code de confirmation</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-lg bg-neutral-100 px-4 py-2 font-mono text-lg font-bold tracking-widest text-neutral-900">
                    {request.confirmation_code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  >
                    <Copy weight="duotone" size={16} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  Communiquez ce code au voyageur à la livraison.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Actions */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* Traveler + pending → Accept/Refuse */}
            {role === 'traveler' && request.status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleStatusAction('accept')}
                  isLoading={actionLoading}
                  leftIcon={<CheckCircle weight="duotone" size={16} />}
                >
                  Accepter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600"
                  onClick={() => handleStatusAction('cancel')}
                  isLoading={actionLoading}
                  leftIcon={<XCircle weight="duotone" size={16} />}
                >
                  Refuser
                </Button>
              </div>
            )}

            {/* Sender + accepted → Pay */}
            {role === 'sender' && request.status === 'accepted' && (
              <Button
                className="w-full"
                onClick={() => handleStatusAction('pay')}
                isLoading={actionLoading}
                leftIcon={<CreditCard weight="duotone" size={16} />}
              >
                Procéder au paiement — {formatCurrency(request.total_price)}
              </Button>
            )}

            {/* Sender + delivered → Confirm with code */}
            {role === 'sender' && request.status === 'delivered' && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Entrez le code à 6 chiffres pour confirmer la réception.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-neutral-200 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-neutral-900 focus:ring-1 focus:outline-none"
                />
                <Button
                  className="w-full"
                  onClick={() => handleStatusAction('confirm')}
                  isLoading={actionLoading}
                  disabled={confirmCode.length !== 6}
                  leftIcon={<CheckCircle weight="duotone" size={16} />}
                >
                  Confirmer la livraison
                </Button>
              </div>
            )}

            {/* Confirmed → Review */}
            {request.status === 'confirmed' && !hasReviewed && counterparty && (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-700">
                    Livraison confirmée ! Partagez votre expérience.
                  </p>
                </div>
                <ReviewForm
                  requestId={request.id}
                  reviewedId={counterparty.user_id}
                  reviewedName={`${counterparty.first_name} ${counterparty.last_name}`}
                  onReviewSubmitted={() => setHasReviewed(true)}
                />
              </div>
            )}

            {request.status === 'confirmed' && hasReviewed && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                <CheckCircle weight="duotone" size={24} className="mx-auto text-emerald-500" />
                <p className="mt-1 text-sm font-medium text-emerald-700">Merci pour votre avis !</p>
              </div>
            )}

            {/* No action states */}
            {['paid', 'collected', 'in_transit'].includes(request.status) && (
              <p className="text-center text-sm text-neutral-500">
                {request.status === 'paid' && 'En attente de la collecte du colis par le voyageur.'}
                {request.status === 'collected' &&
                  'Le colis a été collecté et sera bientôt en transit.'}
                {request.status === 'in_transit' && 'Le colis est en transit vers sa destination.'}
              </p>
            )}

            {request.status === 'cancelled' && (
              <p className="text-center text-sm text-red-600">Cette demande a été annulée.</p>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
