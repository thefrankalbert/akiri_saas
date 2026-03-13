// ============================================
// Verification Service — Phone & Identity KYC
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';
import { getVerificationProvider } from '@/lib/verification/provider';
import { sendOtpEmail } from '@/lib/email';
import type { VerificationSession } from '@/types';

const KYC_MODE = process.env.KYC_MODE || 'mock';

// OTP expiration in minutes
const OTP_EXPIRATION_MINUTES = 10;

/**
 * Generate a 6-digit OTP code
 */
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createVerificationService(
  supabase: SupabaseClient,
  _adminSupabase: SupabaseClient
) {
  /**
   * Update user's verification level based on completed verifications.
   * Level 1: Email verified (default)
   * Level 2: Phone verified
   * Level 3: ID verified
   */
  async function updateVerificationLevel(userId: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_verified, id_verification_status')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    let level: 1 | 2 | 3 = 1;

    if (profile.phone_verified) {
      level = 2;
    }

    if (profile.id_verification_status === 'verified') {
      level = 3;
    }

    await supabase
      .from('profiles')
      .update({
        verification_level: level,
        is_verified: level >= 2,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  /**
   * Send an OTP code to the user's phone number.
   */
  async function sendPhoneOtp(userId: string, phone: string): Promise<{ session_id: string }> {
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    // In mock mode, log the OTP only in development
    if (KYC_MODE === 'mock') {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[MOCK OTP] Phone: ${phone}, Code: ${otpCode}`);
      }
    }

    // Also send OTP via email as a reliable fallback
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser?.email) {
      await sendOtpEmail(authUser.email, otpCode);
    }

    // Store the OTP session in the database
    const { data, error } = await supabase
      .from('verification_sessions')
      .insert({
        user_id: userId,
        type: 'phone',
        provider: KYC_MODE === 'mock' ? 'mock' : 'twilio',
        external_session_id: null,
        status: 'pending',
        metadata: {
          phone,
          otp_code: otpCode,
        },
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message, 'VALIDATION');
    }

    return { session_id: data.id };
  }

  /**
   * Verify an OTP code submitted by the user.
   */
  async function verifyPhoneOtp(
    userId: string,
    phone: string,
    code: string
  ): Promise<{ verified: boolean }> {
    // Find the pending OTP session for this user and phone
    const { data: session, error: sessionError } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'phone')
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      throw new ServiceError(
        'Aucune session de vérification trouvée ou session expirée',
        'NOT_FOUND'
      );
    }

    const metadata = session.metadata as { phone: string; otp_code: string };

    // Check if phone matches
    if (metadata.phone !== phone) {
      throw new ServiceError('Numéro de téléphone incorrect', 'VALIDATION');
    }

    // Check if OTP matches
    if (metadata.otp_code !== code) {
      // Update session as failed
      await supabase
        .from('verification_sessions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', session.id);

      throw new ServiceError('Code de vérification incorrect', 'VALIDATION');
    }

    // OTP is correct - update session as verified
    await supabase
      .from('verification_sessions')
      .update({ status: 'verified', updated_at: new Date().toISOString() })
      .eq('id', session.id);

    // Update user profile with verified phone
    const now = new Date().toISOString();
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone,
        phone_verified: true,
        phone_verified_at: now,
        updated_at: now,
      })
      .eq('user_id', userId);

    if (profileError) {
      throw new ServiceError(profileError.message, 'VALIDATION');
    }

    // Update verification level
    await updateVerificationLevel(userId);

    return { verified: true };
  }

  /**
   * Create an identity verification session (Stripe Identity or mock).
   */
  async function createIdentitySession(
    userId: string,
    returnUrl?: string
  ): Promise<{ session_id: string; url: string }> {
    const provider = getVerificationProvider();

    try {
      const result = await provider.createIdentitySession(userId, returnUrl);

      // Store the session in the database
      const { data, error } = await supabase
        .from('verification_sessions')
        .insert({
          user_id: userId,
          type: 'identity',
          provider: KYC_MODE === 'mock' ? 'mock' : 'stripe',
          external_session_id: result.sessionId,
          status: 'pending',
          metadata: {},
        })
        .select()
        .single();

      if (error) {
        throw new ServiceError(error.message, 'VALIDATION');
      }

      // Update profile status to pending
      await supabase
        .from('profiles')
        .update({
          id_verification_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return { session_id: data.id, url: result.url };
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la création de la session';
      throw new ServiceError(errorMessage, 'INTERNAL', err);
    }
  }

  /**
   * Handle identity verification result (called from webhook or mock callback).
   */
  async function handleIdentityVerificationResult(
    sessionId: string,
    status: string
  ): Promise<{ updated: boolean }> {
    // Find the verification session
    const { data: session, error: sessionError } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('external_session_id', sessionId)
      .eq('type', 'identity')
      .single();

    if (sessionError || !session) {
      throw new ServiceError('Session de vérification non trouvée', 'NOT_FOUND');
    }

    const verificationSession = session as VerificationSession;
    const now = new Date().toISOString();

    // Update the session status
    await supabase
      .from('verification_sessions')
      .update({ status, updated_at: now })
      .eq('id', verificationSession.id);

    // Update user profile
    const profileUpdate: Record<string, unknown> = {
      id_verification_status: status,
      updated_at: now,
    };

    if (status === 'verified') {
      profileUpdate.id_verified_at = now;
      profileUpdate.id_verified = true;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', verificationSession.user_id);

    if (profileError) {
      throw new ServiceError(profileError.message, 'VALIDATION');
    }

    // Update verification level
    await updateVerificationLevel(verificationSession.user_id);

    return { updated: true };
  }

  /**
   * Get the user's current verification status.
   */
  async function getVerificationStatus(userId: string): Promise<{
    verification_level: 1 | 2 | 3;
    phone_verified: boolean;
    id_verification_status: 'none' | 'pending' | 'verified' | 'failed';
  }> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('verification_level, phone_verified, id_verification_status')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      throw new ServiceError('Profil non trouvé', 'NOT_FOUND');
    }

    return {
      verification_level: profile.verification_level || 1,
      phone_verified: profile.phone_verified || false,
      id_verification_status: profile.id_verification_status || 'none',
    };
  }

  return {
    sendPhoneOtp,
    verifyPhoneOtp,
    createIdentitySession,
    handleIdentityVerificationResult,
    getVerificationStatus,
  };
}
