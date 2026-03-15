// ============================================
// Notifications Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Notification, PaginatedResponse } from '@/types';
import type { NotificationType } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import { sendPushToUser } from './push';

export function createNotificationsService(supabase: SupabaseClient) {
  return {
    /**
     * Get notifications for a user (paginated)
     */
    async getNotifications(
      userId: string,
      page: number = 1,
      perPage: number = DEFAULT_PAGE_SIZE
    ): Promise<PaginatedResponse<Notification>> {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error('getNotifications: erreur lors de la récupération', error);
        throw new ServiceError(
          'Erreur lors de la récupération des notifications',
          'INTERNAL',
          error
        );
      }

      const total = count || 0;

      return {
        data: (data as Notification[]) || [],
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      };
    },

    /**
     * Mark notifications as read
     */
    async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .in('id', notificationIds);

      if (error) {
        logger.error('markNotificationsAsRead: erreur lors de la mise à jour', error);
        throw new ServiceError(
          'Erreur lors de la mise à jour des notifications',
          'VALIDATION',
          error
        );
      }
    },

    /**
     * Create a notification and fire a push notification
     */
    async createNotification(
      userId: string,
      type: NotificationType,
      title: string,
      body: string,
      data: Record<string, unknown> = {}
    ): Promise<Notification> {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, type, title, body, data })
        .select()
        .single();

      if (error) {
        logger.error('createNotification: erreur lors de la création', error);
        throw new ServiceError(
          'Erreur lors de la création de la notification',
          'VALIDATION',
          error
        );
      }

      // Also send push notification (fire-and-forget)
      sendPushToUser(userId, {
        title,
        body,
        url: typeof data.url === 'string' ? data.url : '/',
        tag: type,
      }).catch(() => {});

      return notification as Notification;
    },

    /**
     * Get unread notification count for a user
     */
    async getUnreadNotificationCount(userId: string): Promise<number> {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        logger.error('getUnreadNotificationCount: erreur lors du comptage', error);
        return 0;
      }

      return count || 0;
    },
  };
}

// -------------------------------------------------
// Standalone backward-compat export (used by other services not yet migrated)
// TODO: Remove once all callers use DI
// -------------------------------------------------
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<Notification> {
  const { createAdminClient } = await import('@/lib/supabase/server');
  const adminSupabase = await createAdminClient();
  const service = createNotificationsService(adminSupabase);
  return service.createNotification(userId, type, title, body, data);
}
