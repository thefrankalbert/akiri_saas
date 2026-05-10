import { getAuthUser, apiError, apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  return withServiceHandler('GET /api/connect/status', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createTransactionService(supabase, adminSupabase, getStripe());
    const data = await service.checkConnectStatus(user.id);
    return apiSuccess(data);
  });
}
