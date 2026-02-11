// ============================================
// Transactions Service — Server-side business logic
// ============================================

import { getStripe } from '@/lib/stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Transaction, ApiResponse, PaginatedResponse } from '@/types';
import { PLATFORM_FEE_PERCENT } from '@/constants';
import { DEFAULT_PAGE_SIZE } from '@/constants';

/**
 * Create a Stripe Checkout Session for an accepted request
 * Uses manual capture for escrow: funds are held until delivery is confirmed
 */
export async function createCheckoutSession(
  requestId: string,
  userId: string
): Promise<ApiResponse<{ url: string }>> {
  const supabase = await createClient();

  // Fetch the request with listing details
  const { data: request, error: reqError } = await supabase
    .from('shipment_requests')
    .select('*, listing:listings!listing_id(*)')
    .eq('id', requestId)
    .eq('status', 'accepted')
    .single();

  if (reqError || !request) {
    return { data: null, error: 'Demande introuvable ou non accept\u00e9e', status: 404 };
  }

  // Verify the user is the sender
  if (request.sender_id !== userId) {
    return { data: null, error: "Seul l'exp\u00e9diteur peut effectuer le paiement", status: 403 };
  }

  // Check if a transaction already exists for this request
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id, status')
    .eq('request_id', requestId)
    .maybeSingle();

  if (existingTx && existingTx.status !== 'pending') {
    return {
      data: null,
      error: 'Un paiement existe d\u00e9j\u00e0 pour cette demande',
      status: 409,
    };
  }

  // Calculate fees
  const totalPrice = Number(request.total_price);
  const platformFee = Math.round(totalPrice * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const amountInCents = Math.round(totalPrice * 100);

  // Determine currency
  const currency = (request.listing?.currency || 'EUR').toLowerCase();

  // Create Stripe Checkout Session
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_intent_data: {
      capture_method: 'manual', // Escrow: hold funds until delivery confirmed
      metadata: {
        request_id: requestId,
        payer_id: userId,
        payee_id: request.listing.traveler_id,
      },
    },
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Transport de colis - ${request.listing.departure_city} \u2192 ${request.listing.arrival_city}`,
            description: `${request.weight_kg}kg - ${request.item_description.substring(0, 100)}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      request_id: requestId,
      payer_id: userId,
      payee_id: request.listing.traveler_id,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transactions?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/annonces/${request.listing_id}?payment=cancelled`,
  });

  // Create or update transaction record
  const adminSupabase = await createAdminClient();

  if (existingTx) {
    // Update existing pending transaction
    await adminSupabase
      .from('transactions')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingTx.id);
  } else {
    // Create new transaction
    await adminSupabase.from('transactions').insert({
      request_id: requestId,
      payer_id: userId,
      payee_id: request.listing.traveler_id,
      amount: totalPrice,
      currency: currency.toUpperCase(),
      platform_fee: platformFee,
      stripe_payment_intent_id: session.payment_intent as string,
      status: 'pending',
    });
  }

  return { data: { url: session.url! }, error: null, status: 200 };
}

/**
 * Capture a held payment (release escrow to traveler)
 * Called when sender confirms delivery with 6-digit code
 */
export async function capturePayment(requestId: string): Promise<ApiResponse<Transaction>> {
  const adminSupabase = await createAdminClient();

  // Find the transaction
  const { data: transaction, error: txError } = await adminSupabase
    .from('transactions')
    .select('*')
    .eq('request_id', requestId)
    .eq('status', 'held')
    .single();

  if (txError || !transaction) {
    return { data: null, error: 'Transaction introuvable ou non retenue', status: 404 };
  }

  try {
    // Capture the payment in Stripe
    await getStripe().paymentIntents.capture(transaction.stripe_payment_intent_id!);

    // Update transaction status
    const { data, error } = await adminSupabase
      .from('transactions')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', transaction.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, status: 400 };
    }

    return { data: data as Transaction, error: null, status: 200 };
  } catch (stripeError) {
    const message =
      stripeError instanceof Error ? stripeError.message : 'Erreur lors de la capture du paiement';
    return { data: null, error: message, status: 500 };
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(requestId: string): Promise<ApiResponse<Transaction>> {
  const adminSupabase = await createAdminClient();

  // Find the transaction
  const { data: transaction, error: txError } = await adminSupabase
    .from('transactions')
    .select('*')
    .eq('request_id', requestId)
    .in('status', ['held', 'pending'])
    .single();

  if (txError || !transaction) {
    return { data: null, error: 'Transaction introuvable ou non remboursable', status: 404 };
  }

  try {
    if (transaction.status === 'held') {
      // Cancel the uncaptured PaymentIntent (releases the hold)
      await getStripe().paymentIntents.cancel(transaction.stripe_payment_intent_id!);
    }
    // If status is 'pending', just mark as refunded (no Stripe action needed)

    // Update transaction status
    const { data, error } = await adminSupabase
      .from('transactions')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', transaction.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, status: 400 };
    }

    // Also update request status to cancelled
    await adminSupabase
      .from('shipment_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    return { data: data as Transaction, error: null, status: 200 };
  } catch (stripeError) {
    const message =
      stripeError instanceof Error ? stripeError.message : 'Erreur lors du remboursement';
    return { data: null, error: message, status: 500 };
  }
}

/**
 * Get paginated transactions for a user (as payer or payee)
 */
export async function getTransactionsByUser(
  userId: string,
  page: number = 1,
  perPage: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<Transaction>> {
  const supabase = await createClient();

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], total: 0, page, per_page: perPage, total_pages: 0 };
  }

  const total = count || 0;

  return {
    data: (data as Transaction[]) || [],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

/**
 * Get a single transaction by request ID
 */
export async function getTransactionByRequest(
  requestId: string
): Promise<ApiResponse<Transaction>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 404 };
  }

  return { data: data as Transaction, error: null, status: 200 };
}
