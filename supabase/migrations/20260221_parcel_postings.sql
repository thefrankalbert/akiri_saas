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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for parcel photos
INSERT INTO storage.buckets (id, name, public) VALUES ('parcel-photos', 'parcel-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload parcel photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'parcel-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view parcel photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'parcel-photos');
