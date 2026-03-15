import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createProfilesService } from '@/lib/services/profiles';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ============================================
// Test Data Factories
// ============================================

const MOCK_USER_ID = 'user-profile-123';

function mockProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-001',
    user_id: MOCK_USER_ID,
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean@example.com',
    phone: '+33612345678',
    rating: 4.5,
    total_reviews: 10,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup() {
  const mockSupabase = createMockSupabase();
  const service = createProfilesService(asSupabase(mockSupabase));
  return { mockSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Profiles Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // getProfileByUserId
  // -----------------------------------------
  describe('getProfileByUserId', () => {
    it('returns profile successfully', async () => {
      const { mockSupabase, service } = setup();
      const profile = mockProfile();

      // Chain: select().eq().single()
      mockSupabase._getChain('profiles').single.mockResolvedValueOnce({
        data: profile,
        error: null,
      });

      const result = await service.getProfileByUserId(MOCK_USER_ID);

      expect(result).toEqual(profile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('throws NOT_FOUND when profile does not exist', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('profiles').single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows found' },
      });

      try {
        await service.getProfileByUserId('nonexistent-user');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('No rows found');
      }
    });
  });

  // -----------------------------------------
  // updateProfile
  // -----------------------------------------
  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const { mockSupabase, service } = setup();
      const updatedProfile = mockProfile({ first_name: 'Pierre' });

      // Chain: update().eq().select().single()
      mockSupabase._getChain('profiles').single.mockResolvedValueOnce({
        data: updatedProfile,
        error: null,
      });

      const result = await service.updateProfile(MOCK_USER_ID, { first_name: 'Pierre' });

      expect(result).toEqual(updatedProfile);
      expect(result.first_name).toBe('Pierre');
    });

    it('throws VALIDATION on update error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('profiles').single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      try {
        await service.updateProfile(MOCK_USER_ID, { first_name: 'Pierre' });
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('Update failed');
      }
    });
  });
});
