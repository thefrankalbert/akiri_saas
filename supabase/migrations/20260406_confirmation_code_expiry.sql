-- Add expiration to confirmation codes
ALTER TABLE confirmation_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Set default: codes created before this migration get 14-day window
UPDATE confirmation_codes SET expires_at = created_at + INTERVAL '14 days' WHERE expires_at IS NULL;
