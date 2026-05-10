import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminService } from '@/lib/services/admin';
import { createRequestService } from '@/lib/services/requests';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';
import { resolveDisputeSchema, recoverStuckSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

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
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const limit = await rateLimit(`admin-disputes:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  return withServiceHandler('PATCH /api/admin/disputes', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const adminService = createAdminService(supabase, adminSupabase);

    const admin = await adminService.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const body = await request.json();
    const parsed = resolveDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('request_id (uuid) et resolution (refund|release) requis', 400);
    }

    const { request_id, resolution } = parsed.data;

    // Wire payment dependencies so dispute resolution actually moves money
    const txService = createTransactionService(supabase, adminSupabase, getStripe());
    const requestService = createRequestService(supabase, adminSupabase, {
      capturePayment: (reqId) => txService.capturePayment(reqId),
      refundPayment: (reqId, userId) => txService.refundPayment(reqId, userId),
    });
    const data = await requestService.resolveDispute(request_id, admin.user_id, resolution);
    return apiSuccess(data);
  });
}

/**
 * POST: Recover a request stuck in 'accepted' status after a failed webhook.
 * Checks Stripe for actual payment status and updates accordingly.
 */
export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/admin/disputes/recover', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const adminService = createAdminService(supabase, adminSupabase);

    const admin = await adminService.requireAdmin();
    if (!admin) {
      return apiError('Non autorisé', 403);
    }

    const body = await request.json();
    const parsed = recoverStuckSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('request_id (uuid) et action "recover_stuck" requis', 400);
    }

    const { request_id } = parsed.data;

    // Find the stuck request
    const { data: req, error: reqError } = await adminSupabase
      .from('shipment_requests')
      .select('id, status')
      .eq('id', request_id)
      .eq('status', 'accepted')
      .single();

    if (reqError || !req) {
      return apiError('Demande introuvable ou pas en statut "accepted"', 404);
    }

    // Check if there's a transaction with a Stripe PaymentIntent
    const { data: tx } = await adminSupabase
      .from('transactions')
      .select('id, stripe_payment_intent_id, status')
      .eq('request_id', request_id)
      .single();

    if (!tx?.stripe_payment_intent_id) {
      return apiError('Aucun paiement Stripe trouvé pour cette demande', 404);
    }

    // Check Stripe for the actual payment status
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id);

    if (paymentIntent.status === 'requires_capture') {
      // Payment was successful but webhook failed — recover by updating status
      await adminSupabase
        .from('transactions')
        .update({ status: 'held', updated_at: new Date().toISOString() })
        .eq('id', tx.id);

      await adminSupabase
        .from('shipment_requests')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', request_id);

      logger.info('[ADMIN] Recovered stuck request', { request_id, payment_status: 'held' });
      return apiSuccess({ recovered: true, new_status: 'paid' });
    }

    if (paymentIntent.status === 'canceled') {
      // Payment was cancelled — clean up
      await adminSupabase
        .from('transactions')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', tx.id);

      await adminSupabase
        .from('shipment_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', request_id);

      logger.info('[ADMIN] Recovered stuck request (cancelled)', { request_id });
      return apiSuccess({ recovered: true, new_status: 'cancelled' });
    }

    // Other possible statuses: succeeded (already captured), processing, requires_action (3DS),
    // requires_payment_method. These need manual investigation in the Stripe dashboard.
    return apiSuccess({
      recovered: false,
      stripe_status: paymentIntent.status,
      message: `Statut Stripe: ${paymentIntent.status} — intervention manuelle requise`,
    });
  });
}
