// ============================================
// Profiles Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import type { UpdateProfileInput } from '@/lib/validations';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';

export function createProfilesService(supabase: SupabaseClient) {
  return {
    /**
     * Get a profile by user_id
     */
    async getProfileByUserId(userId: string): Promise<Profile> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Failed to fetch profile', { error: error.message, userId });
        throw new ServiceError(error.message, 'NOT_FOUND');
      }

      return data as Profile;
    },

    /**
     * Update a user's profile
     */
    async updateProfile(userId: string, updates: UpdateProfileInput): Promise<Profile> {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update profile', { error: error.message, userId });
        throw new ServiceError(error.message, 'VALIDATION');
      }

      return data as Profile;
    },
  };
}
