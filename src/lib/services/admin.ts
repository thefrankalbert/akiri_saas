// ============================================
// Admin Service — Dashboard stats + management
// ============================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { ApiResponse, Profile } from '@/types';

/**
 * Verify the current user is an admin. Returns the profile if admin, null otherwise.
 */
export async function requireAdmin(): Promise<Profile | null> {
  const supabase = await createClient();
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
}

/**
 * Get dashboard statistics
 */
export async function getAdminStats(): Promise<
  ApiResponse<{
    totalUsers: number;
    totalListings: number;
    totalRequests: number;
    totalTransactions: number;
    activeDisputes: number;
    pendingVerifications: number;
    revenue: number;
  }>
> {
  const supabase = await createAdminClient();

  const [users, listings, requests, transactions, disputes, verifications] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('shipment_requests').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase
      .from('shipment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disputed'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id_verification_status', 'pending'),
  ]);

  // Calculate total revenue (platform fees)
  const { data: txData } = await supabase
    .from('transactions')
    .select('platform_fee')
    .eq('status', 'completed');

  const revenue = (txData || []).reduce((sum, t) => sum + Number(t.platform_fee || 0), 0);

  return {
    data: {
      totalUsers: users.count || 0,
      totalListings: listings.count || 0,
      totalRequests: requests.count || 0,
      totalTransactions: transactions.count || 0,
      activeDisputes: disputes.count || 0,
      pendingVerifications: verifications.count || 0,
      revenue,
    },
    error: null,
    status: 200,
  };
}

/**
 * List users with pagination
 */
export async function listUsers(
  page = 1,
  perPage = 20,
  search?: string
): Promise<ApiResponse<{ users: Profile[]; total: number }>> {
  const supabase = await createAdminClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from('profiles').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return { data: null, error: error.message, status: 400 };

  return {
    data: { users: (data || []) as Profile[], total: count || 0 },
    error: null,
    status: 200,
  };
}

/**
 * List disputes
 */
export async function listDisputes(
  page = 1,
  perPage = 20
): Promise<
  ApiResponse<{
    disputes: Array<{
      id: string;
      status: string;
      weight_kg: number;
      item_description: string;
      sender_id: string;
      listing: { traveler_id: string; departure_city: string; arrival_city: string } | null;
      created_at: string;
    }>;
    total: number;
  }>
> {
  const supabase = await createAdminClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await supabase
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

  if (error) return { data: null, error: error.message, status: 400 };

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join type inference
    data: { disputes: (data || []) as any, total: count || 0 },
    error: null,
    status: 200,
  };
}

/**
 * List transactions with pagination
 */
export async function listTransactions(
  page = 1,
  perPage = 20
): Promise<ApiResponse<{ transactions: Record<string, unknown>[]; total: number }>> {
  const supabase = await createAdminClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return { data: null, error: error.message, status: 400 };

  return {
    data: { transactions: data || [], total: count || 0 },
    error: null,
    status: 200,
  };
}

/**
 * Ban/unban a user
 */
export async function toggleUserBan(
  userId: string,
  banned: boolean
): Promise<ApiResponse<{ updated: boolean }>> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) return { data: null, error: error.message, status: 400 };

  return { data: { updated: true }, error: null, status: 200 };
}
