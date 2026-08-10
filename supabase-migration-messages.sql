-- Historie komunikace s nájemníky (ručně vkládaná, kanál je jen metadata)
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  channel text CHECK (channel IN ('whatsapp', 'email', 'sms', 'other')) DEFAULT 'whatsapp',
  direction text CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read messages" ON messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon can insert messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon can delete messages" ON messages FOR DELETE TO anon, authenticated USING (true);
