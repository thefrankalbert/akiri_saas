'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import { toasts } from '@/lib/utils/toast';
import { mockRequests } from '@/lib/mock-data';
import type { ShipmentRequest, Profile, RequestStatus } from '@/types';

const CURRENT_USER_ID = 'mock-user-001';

export interface RequestDetailData {
  request: ShipmentRequest | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  confirmCode: string;
  confirmationCode: string | null;
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
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
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

      // Fetch confirmation code from separate table (sender-only via RLS)
      const { data: codeData } = await supabase
        .from('confirmation_codes')
        .select('code')
        .eq('request_id', requestId)
        .single();
      if (codeData) setConfirmationCode(codeData.code);

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
          setRequest((prev) => (prev ? { ...prev, status: 'paid' } : prev));
          setConfirmationCode('482915');
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
            const json = await res.json();
            if (json.data?.url) {
              window.location.href = json.data.url;
              return;
            }
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
            body: JSON.stringify({ action }),
          });
          if (res.ok) {
            const statusMap: Record<string, RequestStatus> = {
              accept: 'accepted',
              cancel: 'cancelled',
              collect: 'collected',
              in_transit: 'in_transit',
              deliver: 'delivered',
            };
            const newStatus: RequestStatus = statusMap[action] ?? (action as RequestStatus);
            if (action === 'accept') toasts.requestAccepted();
            else if (action === 'cancel') toasts.requestCancelled();
            setRequest((prev) => (prev ? { ...prev, status: newStatus } : prev));
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
    if (confirmationCode) {
      navigator.clipboard.writeText(confirmationCode);
      toasts.copiedToClipboard();
    }
  }, [confirmationCode]);

  return {
    request,
    loading,
    error,
    actionLoading,
    confirmCode,
    confirmationCode,
    hasReviewed,
    role,
    counterparty,
    setConfirmCode,
    setHasReviewed,
    handleStatusAction,
    copyCode,
  };
}
