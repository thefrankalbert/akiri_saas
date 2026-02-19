// ============================================
// Stripe Identity Verification Provider
// ============================================

import Stripe from 'stripe';
import type { VerificationProvider, IdentitySessionResult } from './provider';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export class StripeIdentityProvider implements VerificationProvider {
  async createIdentitySession(userId: string, returnUrl?: string): Promise<IdentitySessionResult> {
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url:
        returnUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/profil/verification?session_id={VERIFICATION_SESSION_ID}`,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async getVerificationStatus(
    sessionId: string
  ): Promise<'pending' | 'processing' | 'verified' | 'failed'> {
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);

    switch (session.status) {
      case 'verified':
        return 'verified';
      case 'processing':
        return 'processing';
      case 'canceled':
      case 'requires_input':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
