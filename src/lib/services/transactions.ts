// ============================================
// Transactions Service — Server-side business logic
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import type { Transaction, PaginatedResponse } from '@/types';
import { DEFAULT_PAGE_SIZE, APP_URL } from '@/constants';
import { calculateTransactionFees } from '@/lib/utils';
import { sendPayoutEmail } from '@/lib/email';

export function createTransactionService(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  stripe: Stripe
) {
  /**
   * Create a Stripe Checkout Session for an accepted request.
   * Uses manual capture for escrow: funds are held until delivery is confirmed.
   */
  async function createCheckoutSession(
    requestId: string,
    userId: string
  ): Promise<{ url: string }> {
    // Fetch the request with listing details
    const { data: request, error: reqError } = await supabase
      .from('shipment_requests')
      .select('*, listing:listings!listing_id(*)')
      .eq('id', requestId)
      .eq('status', 'accepted')
      .single();

    if (reqError || !request) {
      throw new ServiceError('Demande introuvable ou non acceptée', 'NOT_FOUND');
    }

    // Verify the user is the sender
    if (request.sender_id !== userId) {
      throw new ServiceError("Seul l'expéditeur peut effectuer le paiement", 'AUTH');
    }

    // Check if a transaction already exists for this request
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('request_id', requestId)
      .maybeSingle();

    if (existingTx && existingTx.status !== 'pending') {
      throw new ServiceError('Un paiement existe déjà pour cette demande', 'CONFLICT');
    }

    // Calculate fees
    const totalPrice = Number(request.total_price);
    const { platformFee, payoutAmount } = calculateTransactionFees(totalPrice);
    const amountInCents = Math.round(totalPrice * 100);

    // Determine currency
    const currency = (request.listing?.currency || 'EUR').toLowerCase();

    // Create Stripe Checkout Session with idempotency key to prevent duplicate charges
    const session = await stripe.checkout.sessions.create(
      {
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
                name: `Transport de colis - ${request.listing.departure_city} → ${request.listing.arrival_city}`,
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
        success_url: `${APP_URL}/transactions?payment=success`,
        cancel_url: `${APP_URL}/annonces/${request.listing_id}?payment=cancelled`,
      },
      {
        idempotencyKey: `checkout_${requestId}_${userId}`,
      }
    );

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
        payout_amount: payoutAmount,
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'pending',
      });
    }

    return { url: session.url! };
  }

  /**
   * Capture a held payment (release escrow to traveler).
   * Called when sender confirms delivery with 6-digit code.
   * If traveler has Stripe Connect, creates a transfer to their connected account.
   */
  async function capturePayment(requestId: string, _userId?: string): Promise<Transaction> {
    // Find the transaction
    const { data: transaction, error: txError } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('request_id', requestId)
      .eq('status', 'held')
      .single();

    if (txError || !transaction) {
      throw new ServiceError('Transaction introuvable ou non retenue', 'NOT_FOUND');
    }

    try {
      // Capture the payment in Stripe
      await stripe.paymentIntents.capture(transaction.stripe_payment_intent_id!);

      // Calculate payout amount (amount minus platform fee)
      const payoutAmount =
        transaction.payout_amount ||
        Math.round((transaction.amount - transaction.platform_fee) * 100) / 100;

      // Try to create Stripe Transfer if traveler has Connect account
      let transferId: string | null = null;
      const { data: payeeProfile } = await adminSupabase
        .from('profiles')
        .select('stripe_connect_account_id, stripe_connect_onboarded')
        .eq('user_id', transaction.payee_id)
        .single();

      if (payeeProfile?.stripe_connect_account_id && payeeProfile?.stripe_connect_onboarded) {
        try {
          const transfer = await stripe.transfers.create({
            amount: Math.round(payoutAmount * 100),
            currency: transaction.currency.toLowerCase(),
            destination: payeeProfile.stripe_connect_account_id,
            transfer_group: `request_${requestId}`,
            metadata: {
              request_id: requestId,
              transaction_id: transaction.id,
            },
          });
          transferId = transfer.id;
        } catch (transferError) {
          // Log transfer failure but don't fail the capture
          logger.error('[PAYOUT] Transfer failed', transferError);
        }
      }

      // Update transaction status
      const { data, error } = await adminSupabase
        .from('transactions')
        .update({
          status: 'released',
          payout_amount: payoutAmount,
          stripe_transfer_id: transferId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id)
        .select()
        .single();

      if (error) {
        throw new ServiceError(error.message, 'VALIDATION');
      }

      // Send payout email to traveler
      const {
        data: { user: payeeUser },
      } = await adminSupabase.auth.admin.getUserById(transaction.payee_id);
      if (payeeUser?.email) {
        await sendPayoutEmail(payeeUser.email, payoutAmount, transaction.currency);
      }

      return data as Transaction;
    } catch (stripeError) {
      if (stripeError instanceof ServiceError) throw stripeError;
      const message =
        stripeError instanceof Error
          ? stripeError.message
          : 'Erreur lors de la capture du paiement';
      throw new ServiceError(message, 'INTERNAL', stripeError);
    }
  }

  /**
   * Refund a payment.
   */
  async function refundPayment(requestId: string, userId: string): Promise<Transaction> {
    // Find the transaction
    const { data: transaction, error: txError } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('request_id', requestId)
      .in('status', ['held', 'pending'])
      .single();

    if (txError || !transaction) {
      throw new ServiceError('Transaction introuvable ou non remboursable', 'NOT_FOUND');
    }

    // Verify the user is the payer
    if (transaction.payer_id !== userId) {
      throw new ServiceError('Non autorisé à rembourser cette transaction', 'AUTH');
    }

    try {
      if (transaction.status === 'held') {
        // Cancel the uncaptured PaymentIntent (releases the hold)
        await stripe.paymentIntents.cancel(transaction.stripe_payment_intent_id!);
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
        throw new ServiceError(error.message, 'VALIDATION');
      }

      // Also update request status to cancelled
      await adminSupabase
        .from('shipment_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      return data as Transaction;
    } catch (stripeError) {
      if (stripeError instanceof ServiceError) throw stripeError;
      const message =
        stripeError instanceof Error ? stripeError.message : 'Erreur lors du remboursement';
      throw new ServiceError(message, 'INTERNAL', stripeError);
    }
  }

  /**
   * Create a Stripe Connect onboarding link for a traveler.
   */
  async function createConnectOnboardingLink(userId: string): Promise<{ url: string }> {
    // Check if traveler already has a connected account
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('stripe_connect_account_id, first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new ServiceError('Profil introuvable', 'NOT_FOUND');
    }

    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      // Create a new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { user_id: userId },
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Save the account ID to the profile
      await adminSupabase
        .from('profiles')
        .update({
          stripe_connect_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // Create an onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/profil?connect=refresh`,
      return_url: `${APP_URL}/profil?connect=success`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  /**
   * Check and update Stripe Connect onboarding status.
   */
  async function checkConnectStatus(userId: string): Promise<{ onboarded: boolean }> {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarded')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return { onboarded: false };
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const onboarded = (account.charges_enabled && account.payouts_enabled) || false;

    // Only write if status actually changed
    if (profile.stripe_connect_onboarded !== onboarded) {
      await adminSupabase
        .from('profiles')
        .update({
          stripe_connect_onboarded: onboarded,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    return { onboarded };
  }

  /**
   * Get paginated transactions for a user (as payer or payee).
   */
  async function getTransactionsByUser(
    userId: string,
    page: number = 1,
    perPage: number = DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<Transaction>> {
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
   * Get a single transaction by request ID.
   */
  async function getTransactionByRequest(requestId: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error) {
      throw new ServiceError(error.message, 'NOT_FOUND');
    }

    return data as Transaction;
  }

  return {
    createCheckoutSession,
    capturePayment,
    refundPayment,
    createConnectOnboardingLink,
    checkConnectStatus,
    getTransactionsByUser,
    getTransactionByRequest,
  };
}

// ============================================
// Pure utility functions — standalone exports
// ============================================

export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}
