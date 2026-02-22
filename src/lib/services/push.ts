// ============================================
// Push Notification Service
// ============================================

import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@akiri.app';

// Configure VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionJSON
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<{ success: boolean }> {
  const supabase = await createAdminClient();

  await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);

  return { success: true };
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const supabase = await createAdminClient();

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
}
