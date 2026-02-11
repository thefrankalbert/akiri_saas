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
  confirmation_code   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_listing ON shipment_requests(listing_id);
CREATE INDEX idx_requests_sender ON shipment_requests(sender_id);
CREATE INDEX idx_requests_status ON shipment_requests(status);

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
