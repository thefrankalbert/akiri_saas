// ============================================
// Stripe Webhook Handler
// ============================================

import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/services/notifications';
import { sendConfirmationCodeEmail, sendPaymentEmail } from '@/lib/email';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Stripe webhook error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const adminSupabase = await createAdminClient();

  try {
    switch (event.type) {
      // ─── Payment authorized & held ─────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const requestId = session.metadata?.request_id;
        const payerId = session.metadata?.payer_id;

        if (!requestId) break;

        // Update transaction status to 'held' (funds authorized)
        await adminSupabase
          .from('transactions')
          .update({
            status: 'held',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);

        // Update request status to 'paid'
        await adminSupabase
          .from('shipment_requests')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        // Notify payer
        if (payerId) {
          await createNotification(
            payerId,
            'payment_received',
            'Paiement effectu\u00e9',
            'Votre paiement a \u00e9t\u00e9 autoris\u00e9 et est en attente de la livraison.',
            { request_id: requestId }
          );
        }

        // Notify traveler (payee)
        const payeeId = session.metadata?.payee_id;
        if (payeeId) {
          await createNotification(
            payeeId,
            'payment_received',
            'Paiement re\u00e7u',
            "L'exp\u00e9diteur a effectu\u00e9 le paiement. Vous pouvez proc\u00e9der \u00e0 la collecte du colis.",
            { request_id: requestId }
          );
        }

        // Send confirmation code to sender via email
        if (payerId && requestId) {
          const { data: req } = await adminSupabase
            .from('shipment_requests')
            .select('confirmation_code, listing:listings!listing_id(departure_city, arrival_city)')
            .eq('id', requestId)
            .single();

          const { data: profile } = await adminSupabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', payerId)
            .single();

          if (req && profile) {
            // Get sender email from auth
            const {
              data: { user: authUser },
            } = await adminSupabase.auth.admin.getUserById(payerId);
            const listing = req.listing as unknown as {
              departure_city: string;
              arrival_city: string;
            } | null;
            const route = listing
              ? `${listing.departure_city} \u2192 ${listing.arrival_city}`
              : 'votre trajet';

            if (authUser?.email && req.confirmation_code) {
              await sendConfirmationCodeEmail(authUser.email, req.confirmation_code, route);
            }

            // Send payment confirmation email
            const amountCents = session.amount_total;
            if (authUser?.email && amountCents) {
              await sendPaymentEmail(
                authUser.email,
                amountCents / 100,
                (session.currency || 'EUR').toUpperCase(),
                route
              );
            }
          }
        }

        break;
      }

      // ─── Payment failed ────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const requestId = paymentIntent.metadata?.request_id;
        const payerId = paymentIntent.metadata?.payer_id;

        if (payerId && requestId) {
          await createNotification(
            payerId,
            'payment_received',
            'Paiement \u00e9chou\u00e9',
            'Votre paiement a \u00e9chou\u00e9. Veuillez r\u00e9essayer.',
            { request_id: requestId }
          );
        }

        break;
      }

      // ─── Refund processed ──────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Find and update transaction
          await adminSupabase
            .from('transactions')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('stripe_payment_intent_id', paymentIntentId);

          // Find the transaction to get request_id for cascading update
          const { data: tx } = await adminSupabase
            .from('transactions')
            .select('request_id, payer_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();

          if (tx) {
            await adminSupabase
              .from('shipment_requests')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', tx.request_id);

            await createNotification(
              tx.payer_id,
              'payment_received',
              'Remboursement effectu\u00e9',
              'Votre paiement a \u00e9t\u00e9 rembours\u00e9.',
              { request_id: tx.request_id }
            );
          }
        }

        break;
      }

      // ─── Connect account updated (onboarding) ──────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.user_id;

        if (userId && account.charges_enabled && account.payouts_enabled) {
          await adminSupabase
            .from('profiles')
            .update({
              stripe_connect_onboarded: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }

        break;
      }

      default:
      // Unhandled event type — no action needed
    }
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    // Still return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true });
}
