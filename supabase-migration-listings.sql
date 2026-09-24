-- Modul Inzeráty — sledování a srovnávání nabídek nemovitostí k akvizici (např. ze sreality.cz).
-- Data se buď natáhnou automaticky z URL (server-side fetch + parsování __NEXT_DATA__, bez AI),
-- nebo se vyplní ručně jako záloha, když automatické stažení nevyjde.

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text,
  source text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  city text,
  price numeric,
  area_m2 numeric,
  disposition text,
  property_type text,
  ownership text,
  building_condition text,
  energy_rating text,
  description text,
  image_url text,
  estimated_rent numeric,
  estimated_costs numeric,
  status text NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'contacted', 'viewing', 'offer', 'rejected', 'purchased')),
  notes text,
  raw jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_user_id_idx ON listings(user_id);

-- RLS: každý vidí a mění jen své inzeráty
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own listings" ON listings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users insert own listings" ON listings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own listings" ON listings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own listings" ON listings
  FOR DELETE TO authenticated USING (user_id = auth.uid());
