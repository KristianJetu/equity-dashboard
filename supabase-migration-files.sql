-- 1. Tabulka pro metadata souborů
CREATE TABLE IF NOT EXISTS property_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  path text NOT NULL,
  name text NOT NULL,
  size integer,
  mime_type text,
  category text NOT NULL CHECK (category IN ('contract', 'insurance', 'photo', 'other')),
  note text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own files" ON property_files
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users insert own files" ON property_files
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own files" ON property_files
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users delete own files" ON property_files
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2. Storage buckety (spusť v Supabase Dashboard → Storage nebo přes API)
-- Buckety musíš vytvořit ručně v Dashboard → Storage → New bucket:
--   Název: "property-files"  |  Public: NE (private)

-- 3. Storage RLS politiky (po vytvoření bucketu přidat v Dashboard → Storage → Policies)
-- Nebo přes SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;

-- Uživatel může nahrávat jen do složky se svým user_id
CREATE POLICY "users upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Uživatel může číst jen své soubory
CREATE POLICY "users read own files storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Uživatel může mazat jen své soubory
CREATE POLICY "users delete own files storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
