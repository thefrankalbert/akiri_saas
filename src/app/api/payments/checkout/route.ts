import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { createCheckoutSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const body = await parseBody(request, createCheckoutSchema);
  if (!body) return apiError('Données invalides', 400);

  return withServiceHandler('POST /api/payments/checkout', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createTransactionService(supabase, adminSupabase, getStripe());
    const data = await service.createCheckoutSession(body.request_id, user.id);
    return apiSuccess(data);
  });
}
