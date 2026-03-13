import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';

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
  return withServiceHandler('PATCH /api/admin/users', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const body = await request.json();
    const { user_id, action } = body;

    if (!user_id || !action) {
      return apiError('user_id et action requis', 400);
    }

    if (action === 'ban' || action === 'unban') {
      const data = await service.toggleUserBan(user_id, action === 'ban');
      return apiSuccess(data);
    }

    return apiError('Action inconnue', 400);
  });
}
