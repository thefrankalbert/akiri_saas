-- Fix RLS UPDATE policies missing WITH CHECK (post-update state not validated)
-- and fix trigger using unreliable current_setting('role') for service_role detection

-- ─── shipment_requests ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Involved parties can update requests" ON shipment_requests;
CREATE POLICY "Involved parties can update requests"
  ON shipment_requests FOR UPDATE
  USING (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT traveler_id FROM listings WHERE id = listing_id
    )
  )
  WITH CHECK (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT traveler_id FROM listings WHERE id = listing_id
    )
  );

-- ─── conversations ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- ─── messages ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Participants can update messages (read status)" ON messages;
CREATE POLICY "Participants can update messages (read status)"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

-- ─── Fix trigger: use JWT claims instead of unreliable current_setting('role') ─
-- current_setting('role') returns 'anon'/'authenticated' (PostgREST roles),
-- not 'service_role'. Use request.jwt.claims to detect service_role calls.
CREATE OR REPLACE FUNCTION prevent_role_self_elevation()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR (current_setting('request.jwt.claims', true)::json->>'role') != 'service_role'
  THEN
    NEW.role := OLD.role;
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
