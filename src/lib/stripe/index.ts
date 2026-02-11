// ============================================
// Stripe Client — Server-side only (lazy init)
// ============================================

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Get the Stripe client instance (lazy-initialized).
 * Defers initialization to runtime so the build doesn't fail
 * when STRIPE_SECRET_KEY is not set during static analysis.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}
