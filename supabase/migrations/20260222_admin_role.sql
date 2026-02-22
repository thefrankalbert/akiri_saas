-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Add is_banned column for user suspension
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
