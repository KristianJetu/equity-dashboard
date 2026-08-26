-- KOŘENOVÁ PŘÍČINA (ověřeno přímým testem přes REST API 2026-08-26):
-- Tabulka `payments` má zapnuté RLS, ale NEMÁ žádnou funkční INSERT politiku
-- pro roli `anon` ani `authenticated`. Proto:
--   1) automatické párování z mBank emailů (parse-email endpoint, píše přes
--      anon klíč) nikdy neuložilo platbu do DB — endpoint chybu tiše polykal
--      a hlásil úspěch (opraveno v app/api/parse-email/route.ts),
--   2) ruční přidání platby z appky (přihlášený uživatel) taky selhávalo.
--
-- Zároveň CHECK constraint na `status` povoloval jen ('paid','pending','missing'),
-- ale appka zapisuje i 'unmatched' — pro jistotu ho rozšiřujeme, ať to není
-- druhá skrytá překážka hned po opravě RLS.

DROP POLICY IF EXISTS "anon can insert payments" ON payments;
DROP POLICY IF EXISTS "anon can read payments" ON payments;
DROP POLICY IF EXISTS "anon can update payments" ON payments;
DROP POLICY IF EXISTS "authenticated can read own payments" ON payments;
DROP POLICY IF EXISTS "authenticated can insert own payments" ON payments;
DROP POLICY IF EXISTS "authenticated can update own payments" ON payments;

-- anon — používá server-side parse-email endpoint (Google Apps Script webhook)
CREATE POLICY "anon can insert payments" ON payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can read payments" ON payments FOR SELECT TO anon USING (true);
CREATE POLICY "anon can update payments" ON payments FOR UPDATE TO anon USING (true);

-- authenticated — přihlášený uživatel v appce (ruční přidání/editace platby)
CREATE POLICY "authenticated can read own payments" ON payments FOR SELECT TO authenticated
  USING (property_id IS NULL OR property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "authenticated can insert own payments" ON payments FOR INSERT TO authenticated
  WITH CHECK (property_id IS NULL OR property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "authenticated can update own payments" ON payments FOR UPDATE TO authenticated
  USING (property_id IS NULL OR property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

-- Rozšíření CHECK constraintu na status o 'unmatched' (appka ho reálně zapisuje)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('paid', 'pending', 'missing', 'unmatched'));
