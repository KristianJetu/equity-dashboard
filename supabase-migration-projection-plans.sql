-- Uložené plány "Simulace akvizic" — snímek nastavení + vypočítané trajektorie v čase,
-- aby šlo zpětně sledovat, jestli je reálný vývoj napřed nebo ve skluzu oproti plánu.
-- Nová verze (po změně předpokladů) starou nastaví na "superseded" a odkáže na ni přes supersedes_id,
-- takže historie zůstává dohledatelná.

CREATE TABLE IF NOT EXISTS projection_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  settings jsonb NOT NULL,
  points jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'archived')),
  supersedes_id uuid REFERENCES projection_plans(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projection_plans_user_id_idx ON projection_plans(user_id);

-- RLS
ALTER TABLE projection_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own projection plans" ON projection_plans
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users insert own projection plans" ON projection_plans
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own projection plans" ON projection_plans
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users delete own projection plans" ON projection_plans
  FOR DELETE TO authenticated USING (user_id = auth.uid());
