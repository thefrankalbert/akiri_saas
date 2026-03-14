-- Verification sessions for phone OTP and identity verification

CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('phone', 'identity')),
  provider TEXT NOT NULL CHECK (provider IN ('mock', 'stripe', 'twilio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  external_session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_sessions_user ON verification_sessions (user_id, type, status);

ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification sessions" ON verification_sessions
  FOR SELECT USING (auth.uid() = user_id);
