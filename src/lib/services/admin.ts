// ============================================
// Admin Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import { paginationRange } from '@/lib/utils/pagination';

export function createAdminService(supabase: SupabaseClient, adminSupabase: SupabaseClient) {
  return {
    /**
     * Verify the current user is an admin. Returns the profile if admin, null otherwise.
     */
    async requireAdmin(): Promise<Profile | null> {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') return null;

      return profile as Profile;
    },

    /**
     * Get dashboard statistics
     */
    async getAdminStats(): Promise<{
      totalUsers: number;
      totalListings: number;
      totalRequests: number;
      totalTransactions: number;
      activeDisputes: number;
      pendingVerifications: number;
      revenue: number;
    }> {
      const [users, listings, requests, transactions, disputes, verifications, revenueResult] =
        await Promise.all([
          adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
          adminSupabase.from('listings').select('*', { count: 'exact', head: true }),
          adminSupabase.from('shipment_requests').select('*', { count: 'exact', head: true }),
          adminSupabase.from('transactions').select('*', { count: 'exact', head: true }),
          adminSupabase
            .from('shipment_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'disputed'),
          adminSupabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('id_verification_status', 'pending'),
          adminSupabase.from('transactions').select('platform_fee').eq('status', 'completed'),
        ]);

      // Check for errors in any of the queries
      const queryError = [
        users,
        listings,
        requests,
        transactions,
        disputes,
        verifications,
        revenueResult,
      ].find((r) => r.error)?.error;

      if (queryError) {
        logger.error('Failed to fetch admin stats', queryError);
        throw new ServiceError('Failed to fetch admin statistics', 'INTERNAL');
      }

      const revenue = (revenueResult.data || []).reduce(
        (sum, t) => sum + Number(t.platform_fee || 0),
        0
      );

      return {
        totalUsers: users.count || 0,
        totalListings: listings.count || 0,
        totalRequests: requests.count || 0,
        totalTransactions: transactions.count || 0,
        activeDisputes: disputes.count || 0,
        pendingVerifications: verifications.count || 0,
        revenue,
      };
    },

    /**
     * List users with pagination
     */
    async listUsers(
      page = 1,
      perPage = 20,
      search?: string
    ): Promise<{ users: Profile[]; total: number }> {
      const { from, to } = paginationRange(page, perPage);

      let query = adminSupabase.from('profiles').select('*', { count: 'exact' });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error('Failed to list users', error, { page, perPage, search });
        throw new ServiceError('Failed to list users', 'INTERNAL');
      }

      return { users: (data || []) as Profile[], total: count || 0 };
    },

    /**
     * List disputes
     */
    async listDisputes(
      page = 1,
      perPage = 20
    ): Promise<{
      disputes: Array<{
        id: string;
        status: string;
        weight_kg: number;
        item_description: string;
        sender_id: string;
        listing: {
          traveler_id: string;
          departure_city: string;
          arrival_city: string;
        } | null;
        created_at: string;
      }>;
      total: number;
    }> {
      const { from, to } = paginationRange(page, perPage);

      const { data, count, error } = await adminSupabase
        .from('shipment_requests')
        .select(
          'id, status, weight_kg, item_description, sender_id, listing:listings(traveler_id, departure_city, arrival_city), created_at',
          {
            count: 'exact',
          }
        )
        .eq('status', 'disputed')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error('Failed to list disputes', error, { page, perPage });
        throw new ServiceError('Failed to list disputes', 'INTERNAL');
      }

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join type inference
        disputes: (data || []) as any,
        total: count || 0,
      };
    },

    /**
     * List transactions with pagination
     */
    async listTransactions(
      page = 1,
      perPage = 20
    ): Promise<{ transactions: Record<string, unknown>[]; total: number }> {
      const { from, to } = paginationRange(page, perPage);

      const { data, count, error } = await adminSupabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error('Failed to list transactions', error, { page, perPage });
        throw new ServiceError('Failed to list transactions', 'INTERNAL');
      }

      return { transactions: data || [], total: count || 0 };
    },

    /**
     * Ban/unban a user
     */
    async toggleUserBan(userId: string, banned: boolean): Promise<{ updated: boolean }> {
      const { error } = await adminSupabase
        .from('profiles')
        .update({ is_banned: banned, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to toggle user ban', error, { userId, banned });
        throw new ServiceError(error.message, 'VALIDATION');
      }

      return { updated: true };
    },
  };
}
