'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { toasts } from '@/lib/utils/toast';
import { mockRequests } from '@/lib/mock-data';
import type { ShipmentRequest, Profile } from '@/types';

const CURRENT_USER_ID = 'mock-user-001';

export interface RequestDetailData {
  request: ShipmentRequest | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  confirmCode: string;
  hasReviewed: boolean;
  role: 'sender' | 'traveler';
  counterparty: Profile | undefined;
  setConfirmCode: (code: string) => void;
  setHasReviewed: (value: boolean) => void;
  handleStatusAction: (action: string) => Promise<void>;
  copyCode: () => void;
}

export function useRequestDetail(requestId: string): RequestDetailData {
  const [request, setRequest] = useState<ShipmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

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

  const role: 'sender' | 'traveler' =
    request?.sender_id === CURRENT_USER_ID ? 'sender' : 'traveler';

  const counterparty = role === 'sender' ? request?.listing?.traveler : request?.sender;

  const handleStatusAction = useCallback(
    async (action: string) => {
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
    },
    [request?.id, confirmCode]
  );

  const copyCode = useCallback(() => {
    if (request?.confirmation_code) {
      navigator.clipboard.writeText(request.confirmation_code);
      toasts.copiedToClipboard();
    }
  }, [request?.confirmation_code]);

  return {
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
  };
}
