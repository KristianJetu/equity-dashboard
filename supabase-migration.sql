-- Tabulka najemniku (plni se automaticky ze systemu)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id),
  name text,
  account_number text UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read tenants" ON tenants FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert tenants" ON tenants FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can update tenants" ON tenants FOR UPDATE TO anon USING (true);

-- Rozsireni tabulky payments o audit a sparovani
ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_email_text text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sender_account text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS match_type text DEFAULT 'manual';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'rent';
ALTER TABLE payments ALTER COLUMN property_id DROP NOT NULL;
