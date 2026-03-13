import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin';
import { createRequestService } from '@/lib/services/requests';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  return withServiceHandler('GET /api/admin/disputes', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const data = await service.listDisputes(page);
    return apiSuccess(data);
  });
}

export async function PATCH(request: NextRequest) {
  return withServiceHandler('PATCH /api/admin/disputes', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const adminService = createAdminService(supabase, adminSupabase);

    const admin = await adminService.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const body = await request.json();
    const { request_id, resolution } = body;

    if (!request_id || !['refund', 'release'].includes(resolution)) {
      return apiError('request_id et resolution (refund|release) requis', 400);
    }

    const requestService = createRequestService(supabase, adminSupabase);
    const data = await requestService.resolveDispute(request_id, admin.user_id, resolution);
    return apiSuccess(data);
  });
}
