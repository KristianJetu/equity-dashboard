-- Historie ocenění nemovitostí (pravidelná revaluace, cca jednou za 3 měsíce)

CREATE TABLE IF NOT EXISTS property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  valuation_date date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_valuations_property_id_idx ON property_valuations(property_id);

-- RLS
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own valuations" ON property_valuations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users insert own valuations" ON property_valuations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own valuations" ON property_valuations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users delete own valuations" ON property_valuations
  FOR DELETE TO authenticated USING (user_id = auth.uid());
