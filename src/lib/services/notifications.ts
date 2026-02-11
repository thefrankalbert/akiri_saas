// ============================================
// Notifications Service — Server-side business logic
// ============================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Notification, ApiResponse, PaginatedResponse } from '@/types';
import type { NotificationType } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/constants';

/**
 * Get notifications for a user (paginated)
 */
export async function getNotifications(
  userId: string,
  page: number = 1,
  perPage: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<Notification>> {
  const supabase = await createClient();

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], total: 0, page, per_page: perPage, total_pages: 0 };
  }

  const total = count || 0;

  return {
    data: (data as Notification[]) || [],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
): Promise<ApiResponse<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .in('id', notificationIds);

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: null, error: null, status: 200 };
}

/**
 * Create a notification (uses admin client — service role)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<ApiResponse<Notification>> {
  const supabase = await createAdminClient();

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, body, data })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: notification as Notification, error: null, status: 201 };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    return 0;
  }

  return count || 0;
}
