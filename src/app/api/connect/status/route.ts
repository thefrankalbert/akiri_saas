import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createTransactionService } from '@/lib/services/transactions';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createTransactionService(supabase, adminSupabase, getStripe());
    const data = await service.checkConnectStatus(user.id);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/connect/status', error, { userId: user.id });
    return apiError('Erreur interne', 500);
  }
}
