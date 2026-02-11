// ============================================
// Profiles Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { Profile, ApiResponse } from '@/types';
import type { UpdateProfileInput } from '@/lib/validations';

/**
 * Get a profile by user_id
 */
export async function getProfileByUserId(userId: string): Promise<ApiResponse<Profile>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 404 };
  }

  return { data: data as Profile, error: null, status: 200 };
}

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<ApiResponse<Profile>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as Profile, error: null, status: 200 };
}
