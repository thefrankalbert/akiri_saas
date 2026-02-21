import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getNotifications, markNotificationsAsRead } from '@/lib/services/notifications';

const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()),
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));

  const result = await getNotifications(user.id, page, perPage);
  return apiSuccess(result);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, markReadSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await markNotificationsAsRead(user.id, body.notification_ids);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(null);
}
