-- ============================================
-- Migration: Critical Blockers Fix
-- Date: 2026-02-22
-- ============================================

-- 1. Add Stripe Connect fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT FALSE;

-- 2. Add payout fields to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT DEFAULT NULL;

-- 3. Add missing phone verification fields to profiles (if not exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Index on stripe_connect_account_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_connect
  ON profiles (stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

-- 5. Index on stripe_transfer_id for payout tracking
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_transfer
  ON transactions (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;
