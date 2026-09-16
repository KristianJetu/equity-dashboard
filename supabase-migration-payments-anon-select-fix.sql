-- Bezpečnostní oprava (2026-09-09): tabulka `payments` byla čitelná bez přihlášení.
-- `supabase-migration-payments-rls.sql` vytvořila politiku "anon can read payments" se
-- SELECT USING(true), zjevně symetricky ke skutečně potřebným anon INSERT/UPDATE politikám
-- (ty používá server-side webhook app/api/parse-email/route.ts). Ten endpoint ale z `payments`
-- nikdy nečte — jen INSERTuje a PATCHuje — takže SELECT politika pro `anon` byla zbytečná
-- a jen otevírala data (částky nájmu, data, property_id, status) komukoliv s veřejným
-- anon klíčem, bez ohledu na přihlášení.
--
-- Přihlášení uživatelé čtou platby dál normálně přes politiku
-- "authenticated can read own payments" (beze změny) — tahle oprava nic nerozbije.

DROP POLICY IF EXISTS "anon can read payments" ON payments;
