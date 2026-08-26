-- RLS na payments dosud pokrývala jen roli `anon` (kvůli parse-email webhooku
-- z Google Apps Scriptu). Přihlášený uživatel (role `authenticated`) proto
-- neměl žádnou politiku, která by mu dovolila ruční platbu zapsat/upravit —
-- Supabase to tiše odmítl, appka na to jen nereagovala.
-- Stejný typ chyby už dřív nastal u tabulky `tenants`, viz CLAUDE.md.

DROP POLICY IF EXISTS "authenticated can read own payments" ON payments;
DROP POLICY IF EXISTS "authenticated can insert own payments" ON payments;
DROP POLICY IF EXISTS "authenticated can update own payments" ON payments;

CREATE POLICY "authenticated can read own payments" ON payments FOR SELECT TO authenticated
  USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "authenticated can insert own payments" ON payments FOR INSERT TO authenticated
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "authenticated can update own payments" ON payments FOR UPDATE TO authenticated
  USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));
