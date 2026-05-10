-- Add dedicated column for dispute reason on shipment_requests
-- Replaces the anti-pattern of overwriting special_instructions with "[LITIGE] reason"
ALTER TABLE shipment_requests
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
