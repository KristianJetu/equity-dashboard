# Platby a nájemníci (detail)

> Načítá se jen na požádání (není součástí CLAUDE.md). Stručný přehled a odkazy: CLAUDE.md.

## Systém plateb — Google Apps Script (aktivní řešení)
- Nájemník pošle nájem → mBanka pošle notifikační email na krislasek65@gmail.com
- **Google Apps Script** (`Gmail Mbank to App`) běží každou hodinu a čte nepřečtené emaily od `kontakt@mbank.cz`
- Script pošle HTML obsah emailu na `POST /api/parse-email` s hlavičkou `x-parse-secret`
- Endpoint rozparsuje email přes Claude API a uloží platbu do `payments`
- Pokud je číslo účtu odesílatele v tabulce `tenants` → automatické spárování s nemovitostí
- Pokud ne → platba uložena jako "unmatched" k ručnímu přiřazení
- Endpoint také odstraňuje `...` prefix z čísla účtu (mBanka ho někdy posílá jako `...64183/0800`)
- **Proč ne Resend webhook:** mBanka používá S/MIME podpis → HTML obsah je příloha, Resend ho neposkytne přes API. Gmail S/MIME dekóduje automaticky.
- **Apps Script URL:** https://script.google.com/home/projects/1BaVpCJ5ToNCp0BJ8-WYvbpCw63RKN3ilhykBZAadss8EvW-xqJYt8KI/edit
- **Trigger:** každou hodinu, time-driven
- **Env var:** `PARSE_EMAIL_SECRET=mbank-secret-2026` (Vercel Production)
- **Klíčový soubor:** `app/api/parse-email/route.ts`
- **Stav (2026-08-28):** kořenová příčina, proč platby z emailů nikdy neukládaly (chybějící RLS INSERT politika na `payments` pro `anon`), je opravená a ověřená (viz sekce RLS níže). `parse-email/route.ts` teď navíc vrací `ok:false` s detailem chyby při selhání zápisu místo tichého falešného úspěchu. Zbývá ověřit, jestli Apps Script trigger vůbec najde nepřečtené emaily od `kontakt@mbank.cz` — v inboxu ke dni 2026-08-26 nebyl žádný nepřečtený, takže tahle druhá (nezávislá) otázka zůstává otevřená, dořešeno jako pokročilá funkce.

## Ruční evidence plateb (doplňkové řešení k email parsingu)
- Tlačítko **"+ Přidat platbu"** v sekci Platby (`AddPaymentModal`) — nemovitost, měsíc, částka, datum; upsert do `payments` (stejný property_id+month přepíše existující záznam)
- Na kartě nemovitosti (sekce Nemovitosti) badge **"Nájem po splatnosti o X dní"**, pokud aktuální měsíc nemá zaplacenou platbu a je po `rent_due_day` — obsahuje rovnou tlačítko na přidání platby
- **Kalendář plateb** v sekci Platby — matice nemovitosti × měsíce aktuálního roku, zelená/červená/šedá podle stavu, klik na buňku otevře přidání nebo detail platby
- `PaymentModal` (klik na existující platbu) umožňuje editaci částky a data i **mazání platby** (inline potvrzení) — ověřeno funkční 2026-08-28
- **RLS na tabulce `payments`:** stejný vzorec chyby jako u `tenants` — politiky existovaly jen pro roli `anon` (kvůli parse-email webhooku), chyběly pro `authenticated`, takže ruční přidání/úprava/mazání platby z appky se tiše neuložily. Navíc `anon` INSERT politika chyběla úplně (ověřeno přímým testem přes REST API — proto ani automatické párování z mBank emailů nikdy neukládalo platby). Oprava: `supabase-migration-payments-rls.sql` + `supabase-migration-payments-delete.sql` — obě spuštěné a ověřené funkční.
- **Bezpečnostní incident 2026-09-09/16 — `payments` čitelná bez přihlášení:** `supabase-migration-payments-rls.sql` vytvořila u vzniku i politiku `"anon can read payments" FOR SELECT TO anon USING (true)` — kdokoliv s veřejným `anon` klíčem (běžná součást JS bundlu appky) mohl přes REST API číst reálné platby (částky nájmu, data, property_id, status) bez přihlášení. `app/api/parse-email/route.ts` (jediný kód, co by `anon` roli k `payments` měl potřebovat) z `payments` nikdy nečte, jen INSERTuje a PATCHuje — SELECT politika byla čistě zbytečná díra. Oprava: `supabase-migration-payments-anon-select-fix.sql` (`DROP POLICY "anon can read payments" ON payments;`) — spuštěno a ověřeno funkční 2026-09-16 (anonymní dotaz vrací `[]`, přihlášení uživatelé čtou dál normálně přes `authenticated can read own payments`). Při zavádění nové `anon` politiky na jakékoliv tabulce vždy ověřit přímým REST dotazem bez auth hlavičky, ne jen předpokládat že je potřeba symetricky k INSERT/UPDATE.

- **Oprava 2026-09-21 — `parse-email` od 16. 9. neukládal žádné platby:** po zrušení `anon` SELECT politiky (viz incident výše) padal každý zápis z endpointu na RLS (`42501`), protože INSERT s `Prefer: return=representation` (RETURNING) vyžaduje i SELECT oprávnění. Emaily se rozparsovaly, ale neuložily se. Oprava: `app/api/parse-email/route.ts` teď používá `SUPABASE_SERVICE_ROLE_KEY` (fallback na anon klíč, pokud chybí) — **proměnná musí být nastavená ve Vercelu (Production)**, jinak zápis znovu selže. Bezpečnost: endpoint je chráněný tajným klíčem `x-parse-secret` (bez něj vrací 401), service role klíč zůstává jen na serveru (žádný `NEXT_PUBLIC_` prefix, nikdy do klienta, gitu ani logů). Kdo zná `PARSE_EMAIL_SECRET`, může přes endpoint zapisovat platby — při podezření na únik secret změnit ve Vercelu i v Apps Scriptu. Emaily zpracované mezi 16. 9. a 21. 9. se nezpracovaly zpětně; ověřeno testem s reálným emailem (Most, 18 994 Kč, 18. 9.).
- **Platba poštovní poukázkou** přijde v emailu jako běžná "Prichozi platba" z účtu nájemníka (ověřeno na Mostu, `87123/0300`, zpráva "AV: pošta …") a spáruje se automaticky.

## Sekce Nájemníci
- Přehled nájemníků s kartami — jméno, číslo účtu, přiřazená nemovitost, poznámky (zkrácené na 2 řádky)
- Tlačítko **"+ Přidat nájemníka"** — ruční přidání (jméno, účet, nemovitost, poznámky)
- Tlačítko **"Upravit"** na každé kartě otevře modal pro editaci a mazání
- Mazání má vlastní inline potvrzení ("Opravdu smazat? / Ano, smazat / Zrušit")
- **RLS na tabulce `tenants`:** nutné mít politiky pro roli `authenticated` i `anon`
  ```sql
  -- Pokud chybí authenticated politiky (přihlášený uživatel nevidí nájemníky):
  CREATE POLICY "authenticated can read tenants" ON tenants FOR SELECT TO authenticated USING (true);
  CREATE POLICY "authenticated can insert tenants" ON tenants FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "authenticated can update tenants" ON tenants FOR UPDATE TO authenticated USING (true);
  ```
- **Naplnění tabulky z existujících plateb** (pokud je tenants prázdná):
  ```sql
  INSERT INTO tenants (account_number, name, property_id)
  SELECT DISTINCT ON (sender_account) sender_account, sender_name, property_id
  FROM payments WHERE sender_account IS NOT NULL AND sender_account != '' AND property_id IS NOT NULL;
  ```

