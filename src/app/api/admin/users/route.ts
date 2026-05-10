import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminService } from '@/lib/services/admin';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

const adminUserActionSchema = z.object({
  user_id: z.string().uuid(),
  action: z.enum(['ban', 'unban']),
});

export async function GET(request: NextRequest) {
  return withServiceHandler('GET /api/admin/users', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || undefined;

    const data = await service.listUsers(page, 20, search);
    return apiSuccess(data);
  });
}

export async function PATCH(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const limit = await rateLimit(`admin-users:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  return withServiceHandler('PATCH /api/admin/users', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const body = await request.json();
    const parsed = adminUserActionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('user_id (uuid) et action (ban|unban) requis', 400);
    }

    const { user_id, action } = parsed.data;
    const data = await service.toggleUserBan(user_id, action === 'ban');
    return apiSuccess(data);
  });
}
