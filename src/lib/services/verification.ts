// ============================================
// Verification Service — Phone & Identity KYC
// ============================================

import { createClient } from '@/lib/supabase/server';
import { getVerificationProvider } from '@/lib/verification/provider';
import type { ApiResponse, VerificationSession } from '@/types';

const KYC_MODE = process.env.NEXT_PUBLIC_KYC_MODE || 'mock';

// OTP expiration in minutes
const OTP_EXPIRATION_MINUTES = 10;

/**
 * Generate a 6-digit OTP code
 */
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an OTP code to the user's phone number
 */
export async function sendPhoneOtp(
  userId: string,
  phone: string
): Promise<ApiResponse<{ session_id: string }>> {
  const supabase = await createClient();
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString();

  // In mock mode, log the OTP only in development
  if (KYC_MODE === 'mock') {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[MOCK OTP] Phone: ${phone}, Code: ${otpCode}`);
    }
  } else {
    // In production, send via Twilio or other SMS provider
    // TODO: Implement Twilio SMS sending
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
    return { data: null, error: error.message, status: 400 };
  }

  return { data: { session_id: data.id }, error: null, status: 200 };
}

/**
 * Verify an OTP code submitted by the user
 */
export async function verifyPhoneOtp(
  userId: string,
  phone: string,
  code: string
): Promise<ApiResponse<{ verified: boolean }>> {
  const supabase = await createClient();

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
    return {
      data: null,
      error: 'Aucune session de vérification trouvée ou session expirée',
      status: 404,
    };
  }

  const metadata = session.metadata as { phone: string; otp_code: string };

  // Check if phone matches
  if (metadata.phone !== phone) {
    return { data: null, error: 'Numéro de téléphone incorrect', status: 400 };
  }

  // Check if OTP matches
  if (metadata.otp_code !== code) {
    // Update session as failed
    await supabase
      .from('verification_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', session.id);

    return { data: null, error: 'Code de vérification incorrect', status: 400 };
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
    return { data: null, error: profileError.message, status: 400 };
  }

  // Update verification level
  await updateVerificationLevel(userId);

  return { data: { verified: true }, error: null, status: 200 };
}

/**
 * Create an identity verification session (Stripe Identity or mock)
 */
export async function createIdentitySession(
  userId: string,
  returnUrl?: string
): Promise<ApiResponse<{ session_id: string; url: string }>> {
  const supabase = await createClient();
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
      return { data: null, error: error.message, status: 400 };
    }

    // Update profile status to pending
    await supabase
      .from('profiles')
      .update({
        id_verification_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return {
      data: { session_id: data.id, url: result.url },
      error: null,
      status: 200,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Erreur lors de la création de la session';
    return { data: null, error: errorMessage, status: 500 };
  }
}

/**
 * Handle identity verification result (called from webhook or mock callback)
 */
export async function handleIdentityVerificationResult(
  sessionId: string,
  status: 'verified' | 'failed'
): Promise<ApiResponse<{ updated: boolean }>> {
  const supabase = await createClient();

  // Find the verification session
  const { data: session, error: sessionError } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('external_session_id', sessionId)
    .eq('type', 'identity')
    .single();

  if (sessionError || !session) {
    return { data: null, error: 'Session de vérification non trouvée', status: 404 };
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
    return { data: null, error: profileError.message, status: 400 };
  }

  // Update verification level
  await updateVerificationLevel(verificationSession.user_id);

  return { data: { updated: true }, error: null, status: 200 };
}

/**
 * Get the user's current verification status
 */
export async function getVerificationStatus(userId: string): Promise<
  ApiResponse<{
    verification_level: 1 | 2 | 3;
    phone_verified: boolean;
    id_verification_status: 'none' | 'pending' | 'verified' | 'failed';
  }>
> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('verification_level, phone_verified, id_verification_status')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return { data: null, error: 'Profil non trouvé', status: 404 };
  }

  return {
    data: {
      verification_level: profile.verification_level || 1,
      phone_verified: profile.phone_verified || false,
      id_verification_status: profile.id_verification_status || 'none',
    },
    error: null,
    status: 200,
  };
}

/**
 * Update user's verification level based on completed verifications
 * Level 1: Email verified (default)
 * Level 2: Phone verified
 * Level 3: ID verified
 */
async function updateVerificationLevel(userId: string): Promise<void> {
  const supabase = await createClient();

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
