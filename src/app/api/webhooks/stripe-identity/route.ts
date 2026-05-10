// ============================================
// Stripe Identity Webhook Handler
// ============================================

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createVerificationService } from '@/lib/services/verification';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('Missing STRIPE_IDENTITY_WEBHOOK_SECRET environment variable');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const adminSupabase = await createAdminClient();
    const service = createVerificationService(adminSupabase, adminSupabase);

    switch (event.type) {
      case 'identity.verification_session.verified': {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await service.handleIdentityVerificationResult(session.id, 'verified');
        break;
      }

      case 'identity.verification_session.requires_input':
      case 'identity.verification_session.canceled': {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await service.handleIdentityVerificationResult(session.id, 'failed');
        break;
      }

      default:
      // Unhandled event type — no action needed
    }
  } catch (err) {
    logger.error('Stripe Identity webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
