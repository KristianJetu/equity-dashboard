# Equity Dashboard — Dokumentace projektu

## Soubory k nemovitostem (nastaveno 2026-08-29)
- **Supabase Storage** — bucket `property-files` (private), cesta `{user_id}/{property_id}/{timestamp}.{ext}`
- **Tabulka `property_files`**: id, user_id, property_id, bucket, path, name, size, mime_type, category (`contract`/`insurance`/`photo`/`other`), note, created_at
- **RLS**: uživatel vidí/nahrává/maže jen soubory kde `user_id = auth.uid()`. Storage politiky navíc kontrolují `(storage.foldername(name))[1] = auth.uid()::text`
- **UI**: záložka "Soubory" v `PropertyModal` — upload s výběrem kategorie + poznámkou, seznam souborů, otevření přes signed URL (1 hod), mazání
- **Migrace**: `supabase-migration-files.sql` — spuštěna a ověřena funkční 2026-08-29
- **Signed URL**: soubory nejsou veřejně přístupné, URL se generuje na vyžádání přes `supabase.storage.createSignedUrl` s platností 1 hod


## Ocenění nemovitostí (nastaveno 2026-09-06, rozšířeno 2026-09-07)
- **Tabulka `property_valuations`**: id, user_id, property_id, value, valuation_date, note, created_at — historie odhadů hodnoty v čase
- **RLS**: stejný vzorec jako `property_files` — politiky pro `authenticated` s `user_id = auth.uid()` na SELECT/INSERT/UPDATE/DELETE
- **`properties.estimated_value` zůstává "aktuální hodnota"** — při přidání nového ocenění se přepíše (žádné jiné výpočty se neměnily, equity/LTV/cashflow projekce čtou dál `estimated_value`)
- **UI**: záložka "Ocenění" v `PropertyModal` (mezi "Detaily" a "Soubory") — formulář na přidání (hodnota, datum, poznámka), historie se zobrazenou změnou oproti předchozímu záznamu, mazání
- **Graf vývoje hodnoty**: `ValuationChart` — ručně kreslený SVG (styl jako hlavní graf "Jak rosteš v čase"), hover tooltip, zobrazí se nad formulářem v záložce Ocenění jakmile jsou k dispozici aspoň 2 body. Prvním bodem je `purchase_price`/`purchase_date`, pokud jsou vyplněné.
- **Badge na kartě nemovitosti**: "Ocenění po termínu" pokud od posledního ocenění (nebo od `purchase_date`, pokud ještě žádné ocenění není) uplynulo 90+ dní; klik otevře rovnou záložku Ocenění. Nezobrazuje se pro spravované (`ownership_type = manager`) ani plánované nemovitosti.
- **Delta od posledního ocenění**: na kartě nemovitosti (vedle cenové pilulky) i souhrnně v hero sekci Majetek — rozdíl mezi dvěma nejnovějšími záznamy v `property_valuations` na nemovitost, zobrazí se jen když má nemovitost aspoň 2 záznamy. Souhrn v Majetku ukazuje měsíc nejnovějšího ocenění (ne konkrétní den, protože nemovitosti se oceňují v různé dny) a jmenovitě všechny nemovitosti, které do součtu přispěly.
- **Výnos z nájmu** na kartě nemovitosti (pod LTV blokem, jen u pronajatých vlastních nemovitostí): "Hrubý výnos" = roční nájem / hodnota nemovitosti; "Výnos na kapitál" = roční čistý cashflow (nájem − splátka − pojistka/12 − náklady) / vlastní kapitál (hodnota − zbývající dluh).
- **Migrace**: `supabase-migration-valuations.sql` — spuštěna a ověřena funkční 2026-09-07

## Finanční profil pro projekce (nastaveno 2026-09-07)
- **Sloupce v `profiles`**: `birth_year`, `income_employment`, `income_other`, `dti_projection_enabled` (bool) — vše nepovinné
- **Účel**: podklad pro budoucí DTI/DSTI výpočet v Optimistické projekci grafu "Jak rosteš v čase" (kolik dalších nemovitostí lze financovat, max. délka úvěru dle věku). Nepoužívá se nikde jinde v appce — příjem z nájmů appka počítá zvlášť z `properties`.
- **UI**: v modalu Nastavení, pod přepínačem jazyka — celé za jedním přepínačem (`dtiEnabled`), skryté dokud ho uživatel sám nezapne. Text nad poli vysvětluje, k čemu přesně slouží.
- **Migrace**: `supabase-migration-financial-profile.sql` — je potřeba spustit v Supabase SQL editoru
- **Stav (2026-09-07)**: implementováno — `simulateOptimisticAcquisitions()` v `EquityDashboard.tsx` simuluje jednotlivé budoucí akvizice měsíc po měsíci (5 let dopředu):
  - Hromadí čistý cashflow portfolia (nájmy − splátky − pojistky − náklady) jako "naspořený kapitál"
  - Jakmile kapitál pokryje zálohu na další nemovitost (cena × (1 − LTV), výchozí LTV 70 %), zkontroluje bankovní income test odvozený z reálné nabídky ČSOB: `příjem (zaměstnání+jiné+nájmy vč. nové) − všechny splátky (nová počítaná při sazbě +2 p.b. stress test) − životní náklady ≥ 0`
  - Cena další akvizice vychází z průměru posledních dvou hypoték a roste tempem konzervativního CAGR portfolia; nájem nové nemovitosti se odhaduje z průměrného poměru nájem/hodnota stávajícího portfolia
  - Splatnost nové hypotéky = min(30 let, do 70 let věku) — bez vyplněného roku narození se akvizice nesimulují vůbec
  - Sazba nových úvěrů zůstává konstantní (5,31 % p.a., z nabídky) — bez vlastní budoucí projekce úrokových sazeb
  - Bez zapnutého Finančního profilu spadne Optimistická zpátky na jednoduché "historický CAGR × 1,3"

## Pokročilé nastavení projekce (nastaveno 2026-09-07)
- **Sloupec `profiles.projection_settings`** (jsonb) — sbaluje ~15 vzájemně souvisejících parametrů simulace Optimistické projekce (viz `ProjectionSettings` typ a `DEFAULT_PROJECTION_SETTINGS` v `EquityDashboard.tsx`): strop DSTI/DTI, uznání nájmu bankou, sazba/stress-test nových úvěrů, max. věk splatnosti, tempa růstu (plat/nájem/cena akvizice), výnos nové nemovitosti, výchozí cena další akvizice (nebo auto-odhad), min. rozestup mezi akvizicemi, počáteční a roční vklad vlastního kapitálu, zahrnutí osobních půjček do DSTI/DTI. Sbaleno do jednoho jsonb sloupce místo řady samostatných — jde o desítky vzájemně souvisejících "kohoutků" simulace, ne o obecná data profilu.
- **UI**: modal `ProjectionSettingsModal`, otevíraný odkazem "⚙ Upravit předpoklady" u vysvětlivky Optimistické projekce (zobrazí se jen když je Optimistická vybraná a Finanční profil zapnutý) — ne v hlavním Nastavení, kam by se netrefilo tolik pokročilých parametrů.
- **Výpočet**: `simulateOptimisticAcquisitions()` — opravená verze, vychází z ověřovací kalkulačky (viz níže): nová akvizice se financuje kombinací vlastního kapitálu (počáteční + roční vklad) a zbytku jako navýšeného dluhu (refinancování portfolia v rámci LTV), ne už čistě naspořeným cashflow ani jen 70% hypotékou na tu jednu nemovitost. Gatuje se testem DSTI + DTI + LTV portfolia současně, počítá i osobní půjčky (`debts` tabulka) pokud je zapnuto.
- **Migrace**: `supabase-migration-projection-settings.sql` — je potřeba spustit v Supabase SQL editoru
- **Vývoj modelu**: než šlo do appky, model + parametry (uznání nájmu bankou, DSTI/DTI stropy dle reálných bank, tempo růstu nájmů) se ověřovaly v samostatné interaktivní kalkulačce (Artifact) na reálných datech portfolia — najdeš historii ve zprávách s Claude z 2026-09-07.

## Záloha databáze (nastaveno 2026-08-29)
- **Skript:** `scripts/backup-database.mjs` — exportuje všech 9 tabulek přes `SUPABASE_SERVICE_ROLE_KEY` (obchází RLS), uloží kombinovaný soubor do `backups/backup-<datum>.json` a rozdělený po tabulkách do `backups/<datum>/*.json`. `raw_email_text` u plateb se vynechává (velké, jen diagnostické).
- **`SUPABASE_SERVICE_ROLE_KEY`** je v `.env.local` (a měl by být i ve Vercelu, pokud se má používat i odjinud) — nikdy ho nedávat do gitu ani ho nevypisovat.
- **`backups/`** je v `.gitignore` — zálohy (obsahují citlivá finanční data) nepatří do gitu.
- **Google Disk:** složka "Equity Dashboard zálohy" (folder ID `1ib_iRfk0JnmpNa4OURAbrKFQzKl8GPy0`) na účtu krislasek65@gmail.com — soubory po tabulkách, pojmenované `<datum>_<tabulka>.json`.
- **Automatizace:** naplánovaná úloha `equity-dashboard-db-backup` (Claude Code scheduled task, běží každé pondělí ~8:21) — spustí skript a nahraje výstup na Disk. Běží jen když je appka Claude Code spuštěná; pokud ne, doběhne při dalším spuštění.
- Supabase free plán nemá vlastní automatické zálohy/PITR — tohle je náhrada. Pro plnohodnotnější řešení zvážit upgrade na Supabase Pro (denní zálohy + 7denní PITR).

## Sekce Půjčky (do 2026-09-07 „Dluhy" — přejmenováno)
- Tabulka zůstává `debts` (jen UI název se změnil): id, user_id, direction (`i_owe`/`they_owe`), name, amount_original, amount_remaining, monthly_payment, interest_rate, note, due_date
- RLS: `USING (user_id = auth.uid())` na SELECT/INSERT/UPDATE/DELETE — každý vidí jen své záznamy
- Komponenta `DebtModal` (samostatná funkce před `AddTenantModal`) — přidání, editace, mazání
- State: `debts`, `debtModal` v hlavním `EquityDashboard`
- Fetch v hlavním `useEffect` spolu s properties/mortgages/tenants
- **Přejmenování 2026-09-07**: nav položka, nadpis sekce a přepínače v Majetku/Cashflow přejmenovány z "Dluhy" na "Půjčky" (a EN varianta z "Debts" na "Loans") — slovo "dluhy" jazykově naznačovalo, že uživatel je vždy dlužník, ale sekce obsahuje obě strany (`i_owe` i `they_owe`). Beze změny zůstalo slovo "Dluh" tam, kde jde jednoznačně o zůstatek hypotéky (graf "Jak rosteš v čase", LTV na kartě nemovitosti) — to je jiný, nezaměnitelný koncept.

## Cashflow sekce — přepínače Reálné / Vč. plánovaných a Bez půjček / Vč. půjček
- Header cashflow sekce obsahuje přepínač `showPlanned` (state v `EquityDashboard.tsx`)
- Při zapnutí se do výpočtu příjmů/výdajů zahrnou i nemovitosti se statusem `planned`
- Plánované položky mají badge „plánovaná" a jemně zelené pozadí — bez přerušovaného rámečku
- Přepínač je i v sekci „Tvé nemovitosti" (`showPlannedProps`) — zobrazí plánované nemovitosti v přehledu karet, umožňuje jejich editaci přes modal
- **Přepínač bilance půjček** (`showDebtsInCashflow`, nastaveno 2026-09-07) — zobrazí se jen když existuje aspoň jeden záznam v Půjčkách. Po zapnutí se do příjmů/výdajů/čistého cashflow připočtou měsíční splátky z `debts.monthly_payment` (`they_owe` jako příjem, `i_owe` jako výdaj). Promítá se i do souhrnných panelů, per-nemovitost mřížky (nová karta "Půjčky" s rozpisem jednotlivých položek) a do donut grafu "Kam jdou příjmy" v `CashflowExtra` (segment "Splátky půjček").

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
- **Stav (2026-08-28):** kořenová příčina, proč platby z emailů nikdy neukládaly (chybějící RLS INSERT politika na `payments` pro `anon`), je opravená a ověřená (viz sekce RLS níže). `parse-email/route.ts` teď navíc vrací `ok:false` s detailem chyby při selhání zápisu místo tichého falešného úspěchu. Zbývá ověřit, jestli Apps Script trigger vůbec najde nepřečtené emaily od `kontakt@mbank.cz` — v inboxu ke dni 2026-08-26 nebyl žádný nepřečtený, takže tahle druhá (nezávislá) otázka zůstává otevřená, dořešeno jako pokročilá funkce.

## Ruční evidence plateb (doplňkové řešení k email parsingu)
- Tlačítko **"+ Přidat platbu"** v sekci Platby (`AddPaymentModal`) — nemovitost, měsíc, částka, datum; upsert do `payments` (stejný property_id+month přepíše existující záznam)
- Na kartě nemovitosti (sekce Nemovitosti) badge **"Nájem po splatnosti o X dní"**, pokud aktuální měsíc nemá zaplacenou platbu a je po `rent_due_day` — obsahuje rovnou tlačítko na přidání platby
- **Kalendář plateb** v sekci Platby — matice nemovitosti × měsíce aktuálního roku, zelená/červená/šedá podle stavu, klik na buňku otevře přidání nebo detail platby
- `PaymentModal` (klik na existující platbu) umožňuje editaci částky a data i **mazání platby** (inline potvrzení) — ověřeno funkční 2026-08-28
- **RLS na tabulce `payments`:** stejný vzorec chyby jako u `tenants` — politiky existovaly jen pro roli `anon` (kvůli parse-email webhooku), chyběly pro `authenticated`, takže ruční přidání/úprava/mazání platby z appky se tiše neuložily. Navíc `anon` INSERT politika chyběla úplně (ověřeno přímým testem přes REST API — proto ani automatické párování z mBank emailů nikdy neukládalo platby). Oprava: `supabase-migration-payments-rls.sql` + `supabase-migration-payments-delete.sql` — obě spuštěné a ověřené funkční.

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
