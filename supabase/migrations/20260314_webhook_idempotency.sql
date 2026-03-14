-- Webhook idempotency: prevent duplicate processing of Stripe events

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_processed_at ON processed_webhook_events (processed_at);

ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
