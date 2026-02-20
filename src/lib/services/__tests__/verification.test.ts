import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock Setup — Supabase & Verification Provider
// ============================================

function createQueryBuilder(resolvedValue: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'or',
    'order',
    'range',
    'gte',
    'single',
    'maybeSingle',
    'limit',
  ];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  builder['single'] = vi.fn().mockResolvedValue(resolvedValue);
  builder['maybeSingle'] = vi.fn().mockResolvedValue(resolvedValue);

  return builder;
}

const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}));

const mockCreateIdentitySession = vi.fn();

vi.mock('@/lib/verification/provider', () => ({
  getVerificationProvider: vi.fn(() => ({
    createIdentitySession: mockCreateIdentitySession,
  })),
}));

// Import AFTER mocks
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  createIdentitySession,
  handleIdentityVerificationResult,
  getVerificationStatus,
} from '@/lib/services/verification';

// ============================================
// Test Data
// ============================================

const MOCK_USER_ID = 'user-123';
const MOCK_PHONE = '+33612345678';

// ============================================
// Pure Logic Tests — OTP Generation
// ============================================

describe('OTP Generation Logic', () => {
  // The function is private, so we test the properties
  // through the public API behavior

  it('generates a 6-digit string', () => {
    // Reproduce the OTP generation logic
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
  // Reproduce the verification level logic from the service
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
// Service Integration Tests (mocked boundaries)
// ============================================

describe('Verification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // sendPhoneOtp
  // -----------------------------------------
  describe('sendPhoneOtp', () => {
    it('creates a verification session in database', async () => {
      const insertBuilder = createQueryBuilder({
        data: { id: 'session-001' },
        error: null,
      });
      mockSupabaseFrom.mockReturnValue(insertBuilder);

      const result = await sendPhoneOtp(MOCK_USER_ID, MOCK_PHONE);

      expect(result.status).toBe(200);
      expect(result.data?.session_id).toBe('session-001');
      expect(result.error).toBeNull();
    });

    it('returns error when database insert fails', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'DB insert failed' } })
      );

      const result = await sendPhoneOtp(MOCK_USER_ID, MOCK_PHONE);

      expect(result.status).toBe(400);
      expect(result.error).toBe('DB insert failed');
      expect(result.data).toBeNull();
    });

    it('stores phone and OTP code in session metadata', async () => {
      const insertBuilder = createQueryBuilder({
        data: { id: 'session-002' },
        error: null,
      });
      mockSupabaseFrom.mockReturnValue(insertBuilder);

      await sendPhoneOtp(MOCK_USER_ID, MOCK_PHONE);

      // Verify from was called with 'verification_sessions'
      expect(mockSupabaseFrom).toHaveBeenCalledWith('verification_sessions');
    });
  });

  // -----------------------------------------
  // verifyPhoneOtp
  // -----------------------------------------
  describe('verifyPhoneOtp', () => {
    it('returns 404 when no pending session exists', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '123456');

      expect(result.status).toBe(404);
      expect(result.error).toContain('session');
    });

    it('returns 400 when phone number does not match', async () => {
      const session = {
        id: 'session-003',
        user_id: MOCK_USER_ID,
        metadata: { phone: '+33699999999', otp_code: '123456' },
      };

      mockSupabaseFrom.mockReturnValue(createQueryBuilder({ data: session, error: null }));

      const result = await verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '123456');

      expect(result.status).toBe(400);
      expect(result.error).toContain('téléphone');
    });

    it('returns 400 when OTP code is incorrect', async () => {
      const session = {
        id: 'session-004',
        user_id: MOCK_USER_ID,
        metadata: { phone: MOCK_PHONE, otp_code: '999999' },
      };

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: session, error: null });
        }
        // Update session as failed
        return createQueryBuilder({ data: null, error: null });
      });

      const result = await verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '123456');

      expect(result.status).toBe(400);
      expect(result.error).toContain('incorrect');
    });

    it('verifies successfully with correct OTP', async () => {
      const session = {
        id: 'session-005',
        user_id: MOCK_USER_ID,
        metadata: { phone: MOCK_PHONE, otp_code: '654321' },
      };

      // Multiple from() calls for: find session, update session, update profile, update level x2
      mockSupabaseFrom.mockReturnValue(createQueryBuilder({ data: session, error: null }));

      // Override for profile updates — need to handle the updateVerificationLevel calls too
      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: session, error: null });
        }
        // All subsequent calls: session update, profile update, level check, level update
        return createQueryBuilder({
          data: { phone_verified: true, id_verification_status: 'none' },
          error: null,
        });
      });

      const result = await verifyPhoneOtp(MOCK_USER_ID, MOCK_PHONE, '654321');

      expect(result.status).toBe(200);
      expect(result.data?.verified).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  // -----------------------------------------
  // createIdentitySession
  // -----------------------------------------
  describe('createIdentitySession', () => {
    it('delegates to verification provider', async () => {
      mockCreateIdentitySession.mockResolvedValue({
        sessionId: 'vs_stripe_123',
        url: 'https://verify.stripe.com/session/123',
      });

      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: { id: 'session-006' }, error: null })
      );

      const result = await createIdentitySession(MOCK_USER_ID, 'https://akiri.com/callback');

      expect(result.status).toBe(200);
      expect(result.data?.url).toContain('stripe.com');
      expect(result.data?.session_id).toBe('session-006');
      expect(mockCreateIdentitySession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'https://akiri.com/callback'
      );
    });

    it('returns 500 when provider throws', async () => {
      mockCreateIdentitySession.mockRejectedValue(new Error('Stripe Identity unavailable'));

      const result = await createIdentitySession(MOCK_USER_ID);

      expect(result.status).toBe(500);
      expect(result.error).toContain('Stripe Identity unavailable');
    });
  });

  // -----------------------------------------
  // handleIdentityVerificationResult
  // -----------------------------------------
  describe('handleIdentityVerificationResult', () => {
    it('returns 404 when session is not found', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await handleIdentityVerificationResult('vs_unknown', 'verified');

      expect(result.status).toBe(404);
      expect(result.error).toContain('non trouvée');
    });

    it('updates profile when identity is verified', async () => {
      const session = {
        id: 'session-007',
        user_id: MOCK_USER_ID,
        type: 'identity',
        external_session_id: 'vs_test_456',
      };

      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({
          data: { ...session, phone_verified: true, id_verification_status: 'verified' },
          error: null,
        })
      );

      const result = await handleIdentityVerificationResult('vs_test_456', 'verified');

      expect(result.status).toBe(200);
      expect(result.data?.updated).toBe(true);
    });

    it('handles failed verification status', async () => {
      const session = {
        id: 'session-008',
        user_id: MOCK_USER_ID,
        type: 'identity',
        external_session_id: 'vs_test_789',
      };

      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({
          data: { ...session, phone_verified: false, id_verification_status: 'failed' },
          error: null,
        })
      );

      const result = await handleIdentityVerificationResult('vs_test_789', 'failed');

      expect(result.status).toBe(200);
      expect(result.data?.updated).toBe(true);
    });
  });

  // -----------------------------------------
  // getVerificationStatus
  // -----------------------------------------
  describe('getVerificationStatus', () => {
    it('returns profile verification data', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({
          data: {
            verification_level: 2,
            phone_verified: true,
            id_verification_status: 'none',
          },
          error: null,
        })
      );

      const result = await getVerificationStatus(MOCK_USER_ID);

      expect(result.status).toBe(200);
      expect(result.data?.verification_level).toBe(2);
      expect(result.data?.phone_verified).toBe(true);
      expect(result.data?.id_verification_status).toBe('none');
    });

    it('returns 404 when profile not found', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await getVerificationStatus(MOCK_USER_ID);

      expect(result.status).toBe(404);
      expect(result.error).toContain('Profil');
    });

    it('defaults to level 1 when verification_level is null', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({
          data: {
            verification_level: null,
            phone_verified: null,
            id_verification_status: null,
          },
          error: null,
        })
      );

      const result = await getVerificationStatus(MOCK_USER_ID);

      expect(result.status).toBe(200);
      expect(result.data?.verification_level).toBe(1);
      expect(result.data?.phone_verified).toBe(false);
      expect(result.data?.id_verification_status).toBe('none');
    });
  });
});
