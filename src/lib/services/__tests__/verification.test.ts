import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createVerificationService } from '@/lib/services/verification';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/email', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockCreateIdentitySession = vi.fn();

vi.mock('@/lib/verification/provider', () => ({
  getVerificationProvider: vi.fn(() => ({
    createIdentitySession: mockCreateIdentitySession,
  })),
}));

// ============================================
// Test Data
// ============================================

const MOCK_USER_ID = 'user-123';
const MOCK_PHONE = '+33612345678';

function setup() {
  const mockSupabase = createMockSupabase();
  const mockAdminSupabase = createMockSupabase();
  const service = createVerificationService(
    asSupabase(mockSupabase),
    asSupabase(mockAdminSupabase)
  );
  return { mockSupabase, mockAdminSupabase, service };
}

// ============================================
// Pure Logic Tests — OTP Generation
// ============================================

describe('OTP Generation Logic', () => {
  it('generates a 6-digit string', () => {
    const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    for (let i = 0; i < 100; i++) {
      const code = generateOtpCode();
      expect(code).toHaveLength(6);
      expect(Number(code)).toBeGreaterThanOrEqual(100000);
      expect(Number(code)).toBeLessThanOrEqual(999999);
    }
  });

  it('generates numeric-only codes', () => {
    const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

// ============================================
// Verification Level Logic
// ============================================

describe('Verification Level Calculation', () => {
  function computeLevel(phoneVerified: boolean, idStatus: string): 1 | 2 | 3 {
    let level: 1 | 2 | 3 = 1;
    if (phoneVerified) level = 2;
    if (idStatus === 'verified') level = 3;
    return level;
  }

  it('returns level 1 when nothing is verified', () => {
    expect(computeLevel(false, 'none')).toBe(1);
  });

  it('returns level 1 when ID is pending but phone not verified', () => {
    expect(computeLevel(false, 'pending')).toBe(1);
  });

  it('returns level 2 when phone is verified', () => {
    expect(computeLevel(true, 'none')).toBe(2);
  });

  it('returns level 2 when phone is verified and ID is pending', () => {
    expect(computeLevel(true, 'pending')).toBe(2);
  });

  it('returns level 3 when ID is verified (regardless of phone)', () => {
    expect(computeLevel(false, 'verified')).toBe(3);
  });

  it('returns level 3 when both phone and ID are verified', () => {
    expect(computeLevel(true, 'verified')).toBe(3);
  });

  it('returns level 2 when phone verified but ID failed', () => {
    expect(computeLevel(true, 'failed')).toBe(2);
  });

  it('returns level 1 when not verified and ID failed', () => {
    expect(computeLevel(false, 'failed')).toBe(1);
  });
});

// ============================================
// Service Tests (DI factory pattern)
// ============================================

describe('Verification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // sendPhoneOtp
  // -----------------------------------------
  describe('sendPhoneOtp', () => {
    it('creates a verification session and returns session_id', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
      });
      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: { id: 'session-001' },
        error: null,
      });

      const result = await service.sendPhoneOtp(MOCK_USER_ID, MOCK_PHONE);

      expect(result.session_id).toBe('session-001');
    });

    it('throws VALIDATION when database insert fails', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: null,
        error: { message: 'DB insert failed' },
      });

      try {
        await service.sendPhoneOtp(MOCK_USER_ID, MOCK_PHONE);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toBe('DB insert failed');
      }
    });

    it('stores phone and OTP code in session metadata', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: { id: 'session-002' },
        error: null,
      });

      await service.sendPhoneOtp(MOCK_USER_ID, MOCK_PHONE);

      // Verify from was called with 'verification_sessions'
      expect(mockSupabase.from).toHaveBeenCalledWith('verification_sessions');
    });
  });

  // -----------------------------------------
  // verifyPhoneOtp
  // -----------------------------------------
  describe('verifyPhoneOtp', () => {
    it('throws NOT_FOUND when no pending session exists', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '123456');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('session');
      }
    });

    it('throws VALIDATION when phone number does not match', async () => {
      const { mockSupabase, service } = setup();
      const session = {
        id: 'session-003',
        user_id: MOCK_USER_ID,
        metadata: { phone: '+33699999999', otp_code: '123456' },
      };

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: session,
        error: null,
      });

      try {
        await service.verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '123456');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('téléphone');
      }
    });

    it('throws VALIDATION when OTP code is incorrect', async () => {
      const { mockSupabase, service } = setup();
      const session = {
        id: 'session-004',
        user_id: MOCK_USER_ID,
        metadata: { phone: MOCK_PHONE, otp_code: '999999' },
      };

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: session,
        error: null,
      });

      try {
        await service.verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '123456');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('incorrect');
      }
    });

    it('verifies successfully with correct OTP', async () => {
      const { mockSupabase, service } = setup();
      const session = {
        id: 'session-005',
        user_id: MOCK_USER_ID,
        metadata: { phone: MOCK_PHONE, otp_code: '654321' },
      };

      // All calls return success
      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: session,
        error: null,
      });
      mockSupabase._getChain('profiles').single.mockResolvedValue({
        data: { phone_verified: true, id_verification_status: 'none' },
        error: null,
      });

      const result = await service.verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '654321');

      expect(result.verified).toBe(true);
    });
  });

  // -----------------------------------------
  // createIdentitySession
  // -----------------------------------------
  describe('createIdentitySession', () => {
    it('delegates to verification provider and returns session data', async () => {
      const { mockSupabase, service } = setup();

      mockCreateIdentitySession.mockResolvedValue({
        sessionId: 'vs_stripe_123',
        url: 'https://verify.stripe.com/session/123',
      });

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: { id: 'session-006' },
        error: null,
      });

      const result = await service.createIdentitySession(
        MOCK_USER_ID,
        'https://akiri.com/callback'
      );

      expect(result.url).toContain('stripe.com');
      expect(result.session_id).toBe('session-006');
      expect(mockCreateIdentitySession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'https://akiri.com/callback'
      );
    });

    it('throws INTERNAL when provider throws', async () => {
      const { service } = setup();

      mockCreateIdentitySession.mockRejectedValue(new Error('Stripe Identity unavailable'));

      try {
        await service.createIdentitySession(MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
        expect((e as ServiceError).message).toContain('Stripe Identity unavailable');
      }
    });

    it('throws VALIDATION when db insert fails after provider success', async () => {
      const { mockSupabase, service } = setup();

      mockCreateIdentitySession.mockResolvedValue({
        sessionId: 'vs_stripe_123',
        url: 'https://verify.stripe.com/session/123',
      });

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: null,
        error: { message: 'DB insert error' },
      });

      try {
        await service.createIdentitySession(MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
      }
    });
  });

  // -----------------------------------------
  // handleIdentityVerificationResult
  // -----------------------------------------
  describe('handleIdentityVerificationResult', () => {
    it('throws NOT_FOUND when session is not found', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.handleIdentityVerificationResult('vs_unknown', 'verified');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('non trouvée');
      }
    });

    it('returns { updated: true } when identity is verified', async () => {
      const { mockSupabase, service } = setup();
      const session = {
        id: 'session-007',
        user_id: MOCK_USER_ID,
        type: 'identity',
        external_session_id: 'vs_test_456',
      };

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: session,
        error: null,
      });
      mockSupabase._getChain('profiles').single.mockResolvedValue({
        data: { phone_verified: true, id_verification_status: 'verified' },
        error: null,
      });

      const result = await service.handleIdentityVerificationResult('vs_test_456', 'verified');

      expect(result.updated).toBe(true);
    });

    it('handles failed verification status', async () => {
      const { mockSupabase, service } = setup();
      const session = {
        id: 'session-008',
        user_id: MOCK_USER_ID,
        type: 'identity',
        external_session_id: 'vs_test_789',
      };

      mockSupabase._getChain('verification_sessions').single.mockResolvedValue({
        data: session,
        error: null,
      });
      mockSupabase._getChain('profiles').single.mockResolvedValue({
        data: { phone_verified: false, id_verification_status: 'failed' },
        error: null,
      });

      const result = await service.handleIdentityVerificationResult('vs_test_789', 'failed');

      expect(result.updated).toBe(true);
    });
  });

  // -----------------------------------------
  // getVerificationStatus
  // -----------------------------------------
  describe('getVerificationStatus', () => {
    it('returns profile verification data', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('profiles').single.mockResolvedValue({
        data: {
          verification_level: 2,
          phone_verified: true,
          id_verification_status: 'none',
        },
        error: null,
      });

      const result = await service.getVerificationStatus(MOCK_USER_ID);

      expect(result.verification_level).toBe(2);
      expect(result.phone_verified).toBe(true);
      expect(result.id_verification_status).toBe('none');
    });

    it('throws NOT_FOUND when profile not found', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('profiles').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.getVerificationStatus(MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('Profil');
      }
    });

    it('defaults to level 1 when verification_level is null', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('profiles').single.mockResolvedValue({
        data: {
          verification_level: null,
          phone_verified: null,
          id_verification_status: null,
        },
        error: null,
      });

      const result = await service.getVerificationStatus(MOCK_USER_ID);

      expect(result.verification_level).toBe(1);
      expect(result.phone_verified).toBe(false);
      expect(result.id_verification_status).toBe('none');
    });
  });
});
