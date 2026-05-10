-- ============================================
-- Akiri SaaS - Database Schema
-- ============================================
-- Run this in the Supabase SQL Editor after creating the project.
-- Tables match src/types/index.ts exactly.

-- ─── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Profiles ───────────────────────────────────────────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name  TEXT NOT NULL DEFAULT '',
  phone      TEXT,
  avatar_url TEXT,
  bio        TEXT,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  id_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  rating         NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews  INT NOT NULL DEFAULT 0,
  total_trips    INT NOT NULL DEFAULT 0,
  total_shipments INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ─── 2. Listings (Annonces) ────────────────────────────────
CREATE TABLE listings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  departure_city    TEXT NOT NULL,
  departure_country TEXT NOT NULL,
  arrival_city      TEXT NOT NULL,
  arrival_country   TEXT NOT NULL,
  departure_date    TIMESTAMPTZ NOT NULL,
  arrival_date      TIMESTAMPTZ,
  available_kg      NUMERIC(5,2) NOT NULL CHECK (available_kg >= 0 AND available_kg <= 30),
  price_per_kg      NUMERIC(8,2) NOT NULL CHECK (price_per_kg >= 0),
  currency          TEXT NOT NULL DEFAULT 'EUR',
  description       TEXT,
  accepted_items    TEXT[] NOT NULL DEFAULT '{}',
  refused_items     TEXT[] NOT NULL DEFAULT '{}',
  collection_points TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_traveler ON listings(traveler_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_departure ON listings(departure_country, departure_date);
CREATE INDEX idx_listings_route ON listings(departure_country, arrival_country);

-- ─── 3. Shipment Requests (Demandes) ──────────────────────
CREATE TABLE shipment_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id          UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id           UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  weight_kg           NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 30),
  item_description    TEXT NOT NULL,
  item_photos         TEXT[] NOT NULL DEFAULT '{}',
  special_instructions TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending', 'accepted', 'paid', 'collected',
                        'in_transit', 'delivered', 'confirmed', 'disputed', 'cancelled'
                      )),
  total_price         NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_listing ON shipment_requests(listing_id);
CREATE INDEX idx_requests_sender ON shipment_requests(sender_id);
CREATE INDEX idx_requests_status ON shipment_requests(status);

-- ─── 3b. Confirmation Codes (sender-only access) ────────────
-- Stored separately so the traveler cannot read them via RLS.
CREATE TABLE confirmation_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES shipment_requests(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE confirmation_codes ENABLE ROW LEVEL SECURITY;

-- Only the sender of the related request can read the confirmation code
CREATE POLICY "Sender can view confirmation code" ON confirmation_codes
  FOR SELECT USING (
    auth.uid() = (SELECT sender_id FROM shipment_requests WHERE id = request_id)
  );

-- Authenticated senders can insert (enforced by FK + app logic)
CREATE POLICY "Sender can create confirmation code" ON confirmation_codes
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT sender_id FROM shipment_requests WHERE id = request_id)
  );

-- ─── 4. Transactions ──────────────────────────────────────
CREATE TABLE transactions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id               UUID NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
  payer_id                 UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  payee_id                 UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount                   NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency                 TEXT NOT NULL DEFAULT 'EUR',
  platform_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_request ON transactions(request_id);
CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_transactions_payee ON transactions(payee_id);

-- ─── 5. Reviews ───────────────────────────────────────────
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reviewed_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  request_id   UUID NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
  rating       INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reviewer_id, request_id)
);

CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_reviews_request ON reviews(request_id);

-- ─── 6. Conversations ────────────────────────────────────
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  request_id      UUID REFERENCES shipment_requests(id) ON DELETE SET NULL,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN (participant_ids);
CREATE INDEX idx_conversations_request ON conversations(request_id);

-- ─── 7. Messages ─────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  content_type    TEXT NOT NULL DEFAULT 'text'
                  CHECK (content_type IN ('text', 'image', 'voice', 'system')),
  media_url       TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ─── 8. Notifications ────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
    'new_request', 'request_accepted', 'payment_received',
    'parcel_collected', 'parcel_delivered', 'delivery_confirmed',
    'new_review', 'new_message'
  )),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- ─── Auto-create profile on signup ────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Auto-update updated_at ──────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_requests_updated_at
  BEFORE UPDATE ON shipment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Decrement available_kg on request accepted ──────────
CREATE OR REPLACE FUNCTION handle_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE listings
    SET available_kg = available_kg - NEW.weight_kg
    WHERE id = NEW.listing_id
      AND available_kg >= NEW.weight_kg;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not enough available kilos on this listing';
    END IF;

    -- Auto-set listing to 'full' if no kg left
    UPDATE listings
    SET status = 'full'
    WHERE id = NEW.listing_id
      AND available_kg = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_request_accepted
  AFTER UPDATE ON shipment_requests
  FOR EACH ROW EXECUTE FUNCTION handle_request_accepted();

-- ─── Recalculate user rating on new review ───────────────
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE user_id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ─────────────────────────────────────────────
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Listings ─────────────────────────────────────────────
CREATE POLICY "Listings are publicly readable"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Travelers can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = traveler_id)
  WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Travelers can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = traveler_id);

-- ─── Shipment Requests ───────────────────────────────────
CREATE POLICY "Senders can view own requests"
  ON shipment_requests FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT traveler_id FROM listings WHERE id = listing_id
    )
  );

CREATE POLICY "Authenticated users can create requests"
  ON shipment_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Involved parties can update requests"
  ON shipment_requests FOR UPDATE
  USING (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT traveler_id FROM listings WHERE id = listing_id
    )
  );

-- ─── Transactions ─────────────────────────────────────────
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- Writes are service-role only (no INSERT/UPDATE policy for anon)

-- ─── Reviews ──────────────────────────────────────────────
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ─── Conversations ────────────────────────────────────────
CREATE POLICY "Participants can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- ─── Messages ─────────────────────────────────────────────
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Participants can update messages (read status)"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

-- ─── Notifications ────────────────────────────────────────
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Writes are service-role only (no INSERT policy for anon)

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('item-photos', 'item-photos', false);

-- Avatars: anyone can read, authenticated users can upload their own
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Item photos: authenticated users only
CREATE POLICY "Authenticated users can view item photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'item-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload item photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-photos'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- Parcel Postings: senders publish parcels they want to ship
CREATE TABLE IF NOT EXISTS parcel_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  departure_city TEXT NOT NULL,
  departure_country TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  arrival_country TEXT NOT NULL,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 30),
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clothing', 'electronics', 'food', 'documents', 'cosmetics', 'other')),
  photos TEXT[] DEFAULT '{}',
  budget_per_kg NUMERIC CHECK (budget_per_kg IS NULL OR budget_per_kg > 0),
  urgency TEXT NOT NULL DEFAULT 'flexible' CHECK (urgency IN ('flexible', 'within_2_weeks', 'urgent')),
  is_fragile BOOLEAN NOT NULL DEFAULT false,
  desired_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Carry Offers: travelers offer to carry a parcel
CREATE TABLE IF NOT EXISTS carry_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES parcel_postings(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  proposed_price NUMERIC NOT NULL CHECK (proposed_price > 0),
  departure_date DATE NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parcel_postings_sender ON parcel_postings(sender_id);
CREATE INDEX idx_parcel_postings_corridor ON parcel_postings(departure_country, arrival_country);
CREATE INDEX idx_parcel_postings_status ON parcel_postings(status);
CREATE INDEX idx_carry_offers_parcel ON carry_offers(parcel_id);
CREATE INDEX idx_carry_offers_traveler ON carry_offers(traveler_id);

-- RLS
ALTER TABLE parcel_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE carry_offers ENABLE ROW LEVEL SECURITY;

-- Parcel postings: anyone can read active, owner can CRUD
CREATE POLICY "Anyone can view active parcels" ON parcel_postings
  FOR SELECT USING (status = 'active' OR sender_id = auth.uid());

CREATE POLICY "Authenticated users can create parcels" ON parcel_postings
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Owner can update own parcels" ON parcel_postings
  FOR UPDATE USING (auth.uid() = sender_id);

-- Carry offers: parcel owner + offer creator can read, travelers can create
CREATE POLICY "Parcel owner and offer creator can view offers" ON carry_offers
  FOR SELECT USING (
    traveler_id = auth.uid()
    OR parcel_id IN (SELECT id FROM parcel_postings WHERE sender_id = auth.uid())
  );

CREATE POLICY "Authenticated travelers can create offers" ON carry_offers
  FOR INSERT WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Offer creator can update own offers" ON carry_offers
  FOR UPDATE USING (auth.uid() = traveler_id);

CREATE POLICY "Parcel owner can update offer status" ON carry_offers
  FOR UPDATE USING (
    parcel_id IN (SELECT id FROM parcel_postings WHERE sender_id = auth.uid())
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE parcel_postings;
ALTER PUBLICATION supabase_realtime ADD TABLE carry_offers;

-- Updated_at trigger
CREATE TRIGGER update_parcel_postings_updated_at
  BEFORE UPDATE ON parcel_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for parcel photos
INSERT INTO storage.buckets (id, name, public) VALUES ('parcel-photos', 'parcel-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload parcel photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'parcel-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view parcel photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'parcel-photos');
-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Add is_banned column for user suspension
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
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
-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
-- Webhook idempotency: prevent duplicate processing of Stripe events

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_processed_at ON processed_webhook_events (processed_at);

ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
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

-- SECURITY: OTP verification is handled server-side only; no client SELECT needed.
-- Removed to prevent users from reading their own OTP codes from metadata.
-- Storage bucket for chat media (images shared in conversations)

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can read chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');
