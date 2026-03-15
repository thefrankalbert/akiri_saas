'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Package,
  CheckCircle,
  CurrencyEur,
  HandGrabbing,
  Truck,
  ShieldCheck,
  Star,
  ChatCircle,
  Checks,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { supabaseConfigured } from '@/lib/supabase/client';
import type { Notification, NotificationType, PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const iconMap: Record<NotificationType, React.ElementType> = {
  new_request: Package,
  request_accepted: CheckCircle,
  request_cancelled: Package,
  payment_received: CurrencyEur,
  parcel_collected: HandGrabbing,
  parcel_delivered: Truck,
  delivery_confirmed: ShieldCheck,
  dispute_opened: ShieldCheck,
  new_review: Star,
  new_message: ChatCircle,
};

const iconColorMap: Record<NotificationType, string> = {
  new_request: 'text-primary-400 bg-primary-500/10',
  request_accepted: 'text-success bg-success/10',
  request_cancelled: 'text-error bg-error/10',
  payment_received: 'text-success bg-success/10',
  parcel_collected: 'text-warning bg-warning/10',
  parcel_delivered: 'text-info bg-info/10',
  delivery_confirmed: 'text-success bg-success/10',
  dispute_opened: 'text-error bg-error/10',
  new_review: 'text-warning bg-warning/10',
  new_message: 'text-primary-400 bg-primary-500/10',
};

// ---------------------------------------------------------------------------
// Time ago helper
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "A l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `Il y a ${weeks} sem.`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Il y a ${months} mois`;
  return `Il y a ${Math.floor(months / 12)} an(s)`;
}

// ---------------------------------------------------------------------------
// Mock data fallback
// ---------------------------------------------------------------------------

const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'mock',
    type: 'new_request',
    title: 'Nouvelle demande de transport',
    body: 'Aminata souhaite envoyer 5 kg vers Dakar.',
    data: {},
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '2',
    user_id: 'mock',
    type: 'payment_received',
    title: 'Paiement recu',
    body: 'Vous avez recu 45,00 EUR pour votre transport.',
    data: {},
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: '3',
    user_id: 'mock',
    type: 'new_message',
    title: 'Nouveau message',
    body: 'Moussa vous a envoye un message.',
    data: {},
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '4',
    user_id: 'mock',
    type: 'delivery_confirmed',
    title: 'Livraison confirmee',
    body: 'La livraison du colis #4821 a ete confirmee.',
    data: {},
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // ---- Fetch notifications ------------------------------------------------

  const fetchNotifications = useCallback(async () => {
    if (!supabaseConfigured || !user) {
      setNotifications(mockNotifications);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications?per_page=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as { data: PaginatedResponse<Notification> };
      setNotifications(json.data.data);
    } catch {
      // Fallback to mock data on error
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ---- Mark single as read ------------------------------------------------

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

    if (!supabaseConfigured || !user) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [id] }),
      });
    } catch {
      // Silently fail — UI already updated optimistically
    }
  };

  // ---- Mark all as read ---------------------------------------------------

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (supabaseConfigured && user) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification_ids: unreadIds }),
        });
      } catch {
        // Silently fail
      }
    }

    setMarkingAll(false);
  };

  // ---- Derived state ------------------------------------------------------

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ---- Render: Loading ----------------------------------------------------

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-800 flex items-start gap-3 rounded-xl border border-white/[0.06] p-4"
            >
              <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Render: Empty state ------------------------------------------------

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="bg-surface-800 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Bell className="text-surface-400 h-8 w-8" weight="duotone" />
        </div>
        <h2 className="text-surface-100 text-lg font-semibold">Aucune notification</h2>
        <p className="text-surface-400 mt-1 text-sm">
          Vous recevrez des notifications pour vos envois et voyages.
        </p>
      </div>
    );
  }

  // ---- Render: Notification list ------------------------------------------

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-surface-50 text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary-500/15 text-primary-400 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            isLoading={markingAll}
            leftIcon={<Checks className="h-4 w-4" weight="bold" />}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type] ?? Bell;
          const colorClass = iconColorMap[notification.type] ?? 'text-surface-400 bg-surface-700';

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => !notification.is_read && markAsRead(notification.id)}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                notification.is_read
                  ? 'bg-surface-800/50 border-white/[0.04]'
                  : 'bg-surface-800 hover:bg-surface-700 border-white/[0.08]'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
              >
                <Icon className="h-5 w-5" weight="duotone" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm leading-snug ${
                      notification.is_read
                        ? 'text-surface-300 font-medium'
                        : 'text-surface-50 font-semibold'
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <span className="bg-primary-500 mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                  )}
                </div>
                <p className="text-surface-400 mt-0.5 text-sm leading-snug">{notification.body}</p>
                <p className="text-surface-500 mt-1 text-xs">{timeAgo(notification.created_at)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
