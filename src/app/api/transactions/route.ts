import { getAuthUser, apiError, apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page')) || 20));

  return withServiceHandler('GET /api/transactions', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createTransactionService(supabase, adminSupabase, getStripe());
    const data = await service.getTransactionsByUser(user.id, page, perPage);
    return apiSuccess(data);
  });
}
