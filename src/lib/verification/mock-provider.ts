// ============================================
// Mock Verification Provider (Development)
// ============================================

import type { VerificationProvider, IdentitySessionResult } from './provider';

export class MockVerificationProvider implements VerificationProvider {
  private sessions = new Map<string, 'pending' | 'processing' | 'verified' | 'failed'>();

  async createIdentitySession(userId: string, returnUrl?: string): Promise<IdentitySessionResult> {
    const sessionId = `mock_${userId}_${Date.now()}`;
    this.sessions.set(sessionId, 'pending');

    setTimeout(() => {
      this.sessions.set(sessionId, 'verified');
    }, 3000);

    const baseUrl = returnUrl || 'http://localhost:3000/profil/verification';
    const url = `${baseUrl}?mock_session=${sessionId}&mock_status=success`;

    return { sessionId, url };
  }

  async getVerificationStatus(
    sessionId: string
  ): Promise<'pending' | 'processing' | 'verified' | 'failed'> {
    return this.sessions.get(sessionId) || 'pending';
  }
}

let mockProviderInstance: MockVerificationProvider | null = null;

export function getMockProvider(): MockVerificationProvider {
  if (!mockProviderInstance) {
    mockProviderInstance = new MockVerificationProvider();
  }
  return mockProviderInstance;
}
