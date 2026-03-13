import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';

export async function GET(request: NextRequest) {
  return withServiceHandler('GET /api/admin/transactions', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const data = await service.listTransactions(page);
    return apiSuccess(data);
  });
}
