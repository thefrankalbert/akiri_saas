-- Prevent users from updating their own role or is_banned fields
-- Uses a trigger instead of RLS WITH CHECK to avoid recursive read issues

CREATE OR REPLACE FUNCTION prevent_role_self_elevation()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.role := OLD.role;
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_prevent_role_self_elevation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_elevation();
