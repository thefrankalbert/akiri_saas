// ============================================
// Stripe Identity Webhook Handler
// ============================================

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { handleIdentityVerificationResult } from '@/lib/services/verification';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_IDENTITY_WEBHOOK_SECRET environment variable');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'identity.verification_session.verified': {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await handleIdentityVerificationResult(session.id, 'verified');
        break;
      }

      case 'identity.verification_session.requires_input':
      case 'identity.verification_session.canceled': {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await handleIdentityVerificationResult(session.id, 'failed');
        break;
      }

      default:
      // Unhandled event type — no action needed
    }
  } catch (err) {
    console.error('Stripe Identity webhook processing error:', err);
    // Still return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
