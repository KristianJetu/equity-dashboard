# Equity Dashboard — Dokumentace projektu

## Sekce Dluhy
- Tabulka `debts`: id, user_id, direction (`i_owe`/`they_owe`), name, amount_original, amount_remaining, monthly_payment, interest_rate, note, due_date
- RLS: `USING (user_id = auth.uid())` na SELECT/INSERT/UPDATE/DELETE — každý vidí jen své záznamy
- Komponenta `DebtModal` (samostatná funkce před `AddTenantModal`) — přidání, editace, mazání
- State: `debts`, `debtModal` v hlavním `EquityDashboard`
- Fetch v hlavním `useEffect` spolu s properties/mortgages/tenants

## Cashflow sekce — přepínač Reálné / Vč. plánovaných
- Header cashflow sekce obsahuje přepínač `showPlanned` (state v `EquityDashboard.tsx`)
- Při zapnutí se do výpočtu příjmů/výdajů zahrnou i nemovitosti se statusem `planned`
- Plánované položky mají badge „plánovaná" a jemně zelené pozadí — bez přerušovaného rámečku
- Přepínač je i v sekci „Tvé nemovitosti" (`showPlannedProps`) — zobrazí plánované nemovitosti v přehledu karet, umožňuje jejich editaci přes modal

## Co to je
Aplikace pro správu portfolia nemovitostí. Majitel vidí přehled nemovitostí, hypotéky, nájmy, cashflow a historii plateb. Multi-user — každý uživatel vidí jen svá data.

## Stack
- **Next.js 15** (App Router), TypeScript, Tailwind CSS v4
- **Supabase** — databáze + autentizace (Row Level Security)
- **Vercel** — hosting, automatický deploy z `main` větve
- **Resend** — příjem emailů (inbound email webhook)
- **Claude API** (claude-haiku-4-5-20251001) — parsování bankovních emailů + AI asistent

## URLs
- **Produkce:** https://equity-dashboard-six.vercel.app
- **Supabase projekt:** https://svlwjfimdifxonmrtdyd.supabase.co
- **GitHub:** https://github.com/KristianJetu/equity-dashboard

## Databázové tabulky
- `profiles` — uživatelský profil (full_name, onboarding_done)
- `properties` — nemovitosti (name, address, status, rent_amount, estimated_value, monthly_costs, pojištění, ...)
- `mortgages` — hypotéky (property_id, bank, loan_amount, monthly_payment, refix_date, ...)
- `payments` — platby nájmu (property_id, month, rent_received, status, sender_name, ...)
- `tenants` — nájemníci a jejich čísla účtů (pro automatické párování plateb); sloupce: id, account_number (unique), name, property_id, notes, created_at
- `messages` — historie komunikace s nájemníky (property_id, channel: whatsapp/email/sms/other, direction: inbound/outbound, content, created_at) — zprávy se vkládají ručně (copy-paste), appka je jen loguje a AI z nich + z dat o platbách/smlouvě navrhuje odpověď. Migrace: `supabase-migration-messages.sql`.

## Autentizace
- Supabase Auth (email + heslo)
- Nový uživatel: admin ho pozve přes Supabase Dashboard → dostane email s odkazem
- Flow pozvánky: email → `/auth/callback` (vymění token) → `/set-password` (nastaví heslo) → `/onboarding`
- Middleware (`middleware.ts`) kontroluje session a `onboarding_done` — nepřihlášený → `/login`, bez onboardingu → `/onboarding`
- RLS politiky zajišťují že každý uživatel vidí jen svá data (`user_id = auth.uid()`)

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
- **Stav (2026-08-26):** automatické párování mBank emailů zatím nepotvrzeno jako funkční — zatím žádný nepřečtený email od `kontakt@mbank.cz` v inboxu (buď skript maily po zpracování označuje jako přečtené, nebo je nikdy nedostane jako nepřečtené). Zatím nedořešeno, odloženo jako pokročilá funkce.

## Ruční evidence plateb (doplňkové řešení k email parsingu)
- Tlačítko **"+ Přidat platbu"** v sekci Platby (`AddPaymentModal`) — nemovitost, měsíc, částka, datum; upsert do `payments` (stejný property_id+month přepíše existující záznam)
- Na kartě nemovitosti (sekce Nemovitosti) badge **"Nájem po splatnosti o X dní"**, pokud aktuální měsíc nemá zaplacenou platbu a je po `rent_due_day` — obsahuje rovnou tlačítko na přidání platby
- **Kalendář plateb** v sekci Platby — matice nemovitosti × měsíce aktuálního roku, zelená/červená/šedá podle stavu, klik na buňku otevře přidání nebo detail platby
- Zatím chybí v UI: **editace částky/data u již zapsané platby** a **mazání platby** — jen přes SQL v Supabase
- **RLS na tabulce `payments`:** stejný vzorec chyby jako u `tenants` — politiky existovaly jen pro roli `anon` (kvůli parse-email webhooku), chyběly pro `authenticated`, takže ruční přidání platby z appky se tiše neuložilo. Oprava: `supabase-migration-payments-rls.sql`

## Přidání nového uživatele
1. Supabase Dashboard → Authentication → Users → Invite user
2. Limit: 2 pozvánky/hodinu (free plán). Při překročení nastav heslo přes SQL:
   ```sql
   UPDATE auth.users SET encrypted_password = crypt('Heslo123!', gen_salt('bf')) WHERE email = 'email@example.com';
   ```
3. Pokud `confirmed_at` je NULL → účet není potvrzený, přihlášení neprojde. Oprav:
   ```sql
   UPDATE auth.users SET confirmed_at = now() WHERE email = 'email@example.com';
   ```

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

## Supabase nastavení
- **Site URL:** https://equity-dashboard-six.vercel.app
- **Redirect URLs:** https://equity-dashboard-six.vercel.app/auth/callback
- Email rate limit: 2/hodinu na free plánu

## Klíčové soubory
- `components/EquityDashboard.tsx` — hlavní komponenta dashboardu
- `app/onboarding/page.tsx` — 7-krokový wizard pro nové uživatele
- `app/login/page.tsx` — přihlašovací stránka
- `app/set-password/page.tsx` — nastavení hesla po pozvánce
- `app/auth/callback/route.ts` — zpracování auth tokenu z emailu
- `app/api/inbound-email/route.ts` — starý Resend webhook (nepoužívá se, ponechán pro referenci)
- `app/api/parse-email/route.ts` — aktivní endpoint pro Google Apps Script
- `app/api/suggest-reply/route.ts` — AI návrh odpovědi nájemníkovi (kontext: nemovitost, platby, smlouva, historie zpráv)
- `middleware.ts` — ochrana rout, kontrola session + onboardingu
- `lib/auth.ts` — browser Supabase klient
- `lib/auth-server.ts` — server Supabase klient
