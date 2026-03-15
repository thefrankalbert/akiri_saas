// ============================================
// Push Notification Service — DI factory pattern
// ============================================

import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@akiri.app';

// Configure VAPID keys — wrapped in try/catch to prevent build failures
let vapidConfigured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  } catch (error) {
    console.warn('[push] VAPID key configuration failed — push notifications disabled:', error);
  }
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function createPushService(supabase: SupabaseClient) {
  return {
    /**
     * Save a push subscription for a user
     */
    async saveSubscription(userId: string, subscription: PushSubscriptionJSON): Promise<void> {
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      if (error) {
        logger.error('Failed to save push subscription', error, { userId });
        throw new ServiceError(error.message, 'VALIDATION');
      }
    },

    /**
     * Remove a push subscription
     */
    async removeSubscription(userId: string, endpoint: string): Promise<void> {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    },

    /**
     * Send a push notification to a specific user
     */
    async sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, keys')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) return;

      const payloadStr = JSON.stringify(payload);

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              payloadStr
            );
          } catch (err: unknown) {
            // If subscription expired (410 Gone), remove it
            if (
              err &&
              typeof err === 'object' &&
              'statusCode' in err &&
              (err as { statusCode: number }).statusCode === 410
            ) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
          }
        })
      );
    },
  };
}

// Standalone backward-compat export (used by notifications service)
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/server');
  const adminSupabase = await createAdminClient();
  const service = createPushService(adminSupabase);
  return service.sendPushToUser(userId, payload);
}
