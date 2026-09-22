-- Stav doporučení (modul Doporučení): odložení na 30/90 dní a zahození.
-- rec_id je stabilní klíč doporučení (např. "F1:<id hypotéky>"), fingerprint je "otisk situace"
-- (např. datum refixace nebo konce nájmu) — když se situace změní, doporučení se ukáže znovu.

CREATE TABLE IF NOT EXISTS recommendation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rec_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('snoozed', 'dismissed')),
  snoozed_until date,
  fingerprint text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, rec_id)
);

CREATE INDEX IF NOT EXISTS recommendation_state_user_id_idx ON recommendation_state(user_id);

-- RLS: každý vidí a mění jen své záznamy
ALTER TABLE recommendation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own recommendation state" ON recommendation_state
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users insert own recommendation state" ON recommendation_state
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own recommendation state" ON recommendation_state
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own recommendation state" ON recommendation_state
  FOR DELETE TO authenticated USING (user_id = auth.uid());
