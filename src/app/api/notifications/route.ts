import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createNotificationsService } from '@/lib/services/notifications';

const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()),
});

export async function GET(request: NextRequest) {
  return withServiceHandler('GET /api/notifications', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));

    const supabase = await createClient();
    const service = createNotificationsService(supabase);
    const data = await service.getNotifications(user.id, page, perPage);
    return apiSuccess(data);
  });
}

export async function PATCH(request: NextRequest) {
  return withServiceHandler('PATCH /api/notifications', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await parseBody(request, markReadSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createNotificationsService(supabase);
    await service.markNotificationsAsRead(user.id, body.notification_ids);
    return apiSuccess(null);
  });
}
