import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminService } from '@/lib/services/admin';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';

export async function GET() {
  return withServiceHandler('GET /api/admin/stats', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const data = await service.getAdminStats();
    return apiSuccess(data);
  });
}
