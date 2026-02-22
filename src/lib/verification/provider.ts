// ============================================
// Verification Provider Interface
// ============================================

export interface IdentitySessionResult {
  sessionId: string;
  url: string;
}

export interface VerificationProvider {
  createIdentitySession(userId: string, returnUrl?: string): Promise<IdentitySessionResult>;

  getVerificationStatus(
    sessionId: string
  ): Promise<'pending' | 'processing' | 'verified' | 'failed'>;
}

export function getVerificationProvider(): VerificationProvider {
  const mode = process.env.KYC_MODE || 'mock';

  if (mode === 'stripe') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { StripeIdentityProvider } = require('./stripe-provider');
    return new StripeIdentityProvider();
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockVerificationProvider } = require('./mock-provider');
  return new MockVerificationProvider();
}
