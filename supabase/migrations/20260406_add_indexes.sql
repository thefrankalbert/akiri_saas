-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_sender_created ON shipment_requests(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_listing_created ON shipment_requests(listing_id, created_at DESC);
