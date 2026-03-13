import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createAdminService } from '@/lib/services/admin';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ============================================
// Test Data Factories
// ============================================

const MOCK_ADMIN_ID = 'user-admin-001';
const MOCK_USER_ID = 'user-regular-002';

function mockAdminProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-admin-001',
    user_id: MOCK_ADMIN_ID,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_banned: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup() {
  const mockSupabase = createMockSupabase();
  const mockAdminSupabase = createMockSupabase();
  const service = createAdminService(asSupabase(mockSupabase), asSupabase(mockAdminSupabase));
  return { mockSupabase, mockAdminSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Admin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // requireAdmin
  // -----------------------------------------
  describe('requireAdmin', () => {
    it('returns admin profile when user is admin', async () => {
      const { mockSupabase, service } = setup();
      const adminProfile = mockAdminProfile();

      // auth.getUser()
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: MOCK_ADMIN_ID } },
      });

      // profiles: select().eq().single()
      mockSupabase._getChain('profiles').single.mockResolvedValueOnce({
        data: adminProfile,
        error: null,
      });

      const result = await service.requireAdmin();

      expect(result).toEqual(adminProfile);
      expect(result?.role).toBe('admin');
    });

    it('returns null when no authenticated user', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      });

      const result = await service.requireAdmin();

      expect(result).toBeNull();
    });

    it('returns null when user is not admin', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: MOCK_USER_ID } },
      });

      // Profile exists but role is not admin
      mockSupabase._getChain('profiles').single.mockResolvedValueOnce({
        data: { user_id: MOCK_USER_ID, role: 'user' },
        error: null,
      });

      const result = await service.requireAdmin();

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------
  // getAdminStats
  // -----------------------------------------
  describe('getAdminStats', () => {
    it('returns aggregated admin statistics', async () => {
      const { mockAdminSupabase, service } = setup();

      const profilesChain = mockAdminSupabase._getChain('profiles');
      const listingsChain = mockAdminSupabase._getChain('listings');
      const requestsChain = mockAdminSupabase._getChain('shipment_requests');
      const transactionsChain = mockAdminSupabase._getChain('transactions');

      // The 6 parallel queries in Promise.all:
      // 1. profiles.select(*, { count: 'exact', head: true }) -> chain ends at select
      profilesChain.select
        .mockResolvedValueOnce({ data: null, error: null, count: 100 })
        // 6. profiles.select().eq('id_verification_status','pending') -> chain ends at eq
        // But eq returns chain by default, so we need eq to resolve for this call
        // Actually, since these run in Promise.all, the select mock is called multiple times
        // Let's handle the second profiles.select call too
        .mockReturnValueOnce(profilesChain);

      // For the second profiles call (pending verifications), chain ends at .eq()
      profilesChain.eq.mockResolvedValueOnce({ data: null, error: null, count: 3 });

      // 2. listings.select(*, { count: 'exact', head: true })
      listingsChain.select.mockResolvedValueOnce({ data: null, error: null, count: 50 });

      // 3. shipment_requests.select(*, { count: 'exact', head: true })
      requestsChain.select
        .mockResolvedValueOnce({ data: null, error: null, count: 200 })
        // 5. shipment_requests.select().eq('status','disputed') -> chain ends at eq
        .mockReturnValueOnce(requestsChain);

      // For the disputed requests call, chain ends at .eq()
      requestsChain.eq.mockResolvedValueOnce({ data: null, error: null, count: 5 });

      // 4. transactions.select(*, { count: 'exact', head: true })
      transactionsChain.select
        .mockResolvedValueOnce({ data: null, error: null, count: 150 })
        // Second transactions query for revenue: select('platform_fee').eq('status','completed')
        .mockReturnValueOnce(transactionsChain);

      // Revenue query: chain ends at .eq()
      transactionsChain.eq.mockResolvedValueOnce({
        data: [{ platform_fee: 100 }, { platform_fee: 200 }, { platform_fee: 50 }],
        error: null,
      });

      const result = await service.getAdminStats();

      expect(result).toEqual({
        totalUsers: 100,
        totalListings: 50,
        totalRequests: 200,
        totalTransactions: 150,
        activeDisputes: 5,
        pendingVerifications: 3,
        revenue: 350,
      });
    });
  });

  // -----------------------------------------
  // listUsers
  // -----------------------------------------
  describe('listUsers', () => {
    it('returns paginated users', async () => {
      const { mockAdminSupabase, service } = setup();
      const users = [
        mockAdminProfile({ user_id: 'u1', role: 'user' }),
        mockAdminProfile({ user_id: 'u2', role: 'user' }),
      ];

      // Chain: select(*, { count: 'exact' }).order().range()
      // No search, so no .or() call. Chain ends at .range()
      mockAdminSupabase._getChain('profiles').range.mockResolvedValueOnce({
        data: users,
        count: 42,
        error: null,
      });

      const result = await service.listUsers(1, 20);

      expect(result.users).toEqual(users);
      expect(result.total).toBe(42);
    });

    it('applies search filter when provided', async () => {
      const { mockAdminSupabase, service } = setup();

      // With search, chain includes .or() before .order().range()
      mockAdminSupabase._getChain('profiles').range.mockResolvedValueOnce({
        data: [mockAdminProfile({ first_name: 'Jean' })],
        count: 1,
        error: null,
      });

      const result = await service.listUsers(1, 20, 'Jean');

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockAdminSupabase._getChain('profiles').or).toHaveBeenCalled();
    });

    it('throws INTERNAL on error', async () => {
      const { mockAdminSupabase, service } = setup();

      mockAdminSupabase._getChain('profiles').range.mockResolvedValueOnce({
        data: null,
        count: null,
        error: { message: 'Database error' },
      });

      try {
        await service.listUsers(1, 20);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
      }
    });
  });

  // -----------------------------------------
  // toggleUserBan
  // -----------------------------------------
  describe('toggleUserBan', () => {
    it('bans a user successfully', async () => {
      const { mockAdminSupabase, service } = setup();

      // Chain: update().eq() -> chain ends at eq
      mockAdminSupabase._getChain('profiles').eq.mockResolvedValueOnce({
        error: null,
      });

      const result = await service.toggleUserBan(MOCK_USER_ID, true);

      expect(result).toEqual({ updated: true });
    });

    it('unbans a user successfully', async () => {
      const { mockAdminSupabase, service } = setup();

      mockAdminSupabase._getChain('profiles').eq.mockResolvedValueOnce({
        error: null,
      });

      const result = await service.toggleUserBan(MOCK_USER_ID, false);

      expect(result).toEqual({ updated: true });
    });

    it('throws VALIDATION on error', async () => {
      const { mockAdminSupabase, service } = setup();

      mockAdminSupabase._getChain('profiles').eq.mockResolvedValueOnce({
        error: { message: 'Failed to update' },
      });

      try {
        await service.toggleUserBan(MOCK_USER_ID, true);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('Failed to update');
      }
    });
  });
});
