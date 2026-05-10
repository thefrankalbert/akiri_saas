-- Add RLS policy for service role on processed_webhook_events
DROP POLICY IF EXISTS "service_role_manage" ON processed_webhook_events;
CREATE POLICY "service_role_all" ON processed_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
