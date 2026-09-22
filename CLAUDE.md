# Equity Dashboard — Dokumentace projektu

> Tento soubor se načítá celý při každé session, proto je stručný. Podrobnosti k jednotlivým oblastem jsou v `docs/` (čti jen když se úkol týká dané oblasti). Kompletní dohledatelná dokumentace a historie změn je v Notionu.

## Pravidlo pro zápis změn (pokyn uživatele, 2026-09-21)
Když uživatel řekne **"ulož to" / "zapiš to" / "zapiš změnu"**:
1. **Vždy zapsat do Notionu** — tam se dokumentace dohledává (co, proč, kdy, jak ověřeno).
2. Zbytek podle logiky toho, co bylo napsáno:
   - trvalé pravidlo / konfigurace, které musí vědět každá session → **krátce** sem do `CLAUDE.md` (max. pár řádků),
   - podrobný popis funkce, incidentu nebo postupu → do příslušného souboru v `docs/`,
   - preference uživatele nebo způsob práce → do paměti (memory).
3. Do `CLAUDE.md` nepsat historii incidentů ani dlouhé popisy — jen odkaz do `docs/`.

## Co to je
Aplikace pro správu portfolia nemovitostí. Majitel vidí přehled nemovitostí, hypotéky, nájmy, cashflow a historii plateb. Multi-user — každý uživatel vidí jen svá data.

## Stack
- **Next.js 15** (App Router), TypeScript, Tailwind CSS v4
- **Supabase** — databáze + autentizace (Row Level Security)
- **Vercel** — hosting, automatický deploy z `main` větve
- **Resend** — příjem emailů (inbound email webhook, dnes se nepoužívá)
- **Claude API** (claude-haiku-4-5-20251001) — parsování bankovních emailů + AI asistent

## URLs
- **Produkce:** https://equity-dashboard-six.vercel.app
- **Supabase projekt:** https://svlwjfimdifxonmrtdyd.supabase.co
- **GitHub:** https://github.com/KristianJetu/equity-dashboard

## Databázové tabulky
- `profiles` — uživatelský profil (full_name, onboarding_done + finanční profil a `projection_settings`)
- `properties` — nemovitosti (name, address, status, rent_amount, estimated_value, monthly_costs, pojištění, ...)
- `mortgages` — hypotéky (property_id, bank, loan_amount, monthly_payment, refix_date, ...)
- `payments` — platby nájmu (property_id, month, rent_received, status, sender_name, ...)
- `tenants` — nájemníci a čísla účtů pro automatické párování plateb (id, account_number unique, name, property_id, notes)
- `messages` — historie komunikace s nájemníky, ručně kopírované zprávy + AI návrh odpovědi (migrace `supabase-migration-messages.sql`)
- `debts` — sekce Půjčky · `property_files` + Storage bucket `property-files` · `property_valuations` · `projection_plans` · `recommendation_state` (odložená/zahozená doporučení)

## Autentizace
- Supabase Auth (email + heslo); nového uživatele zve admin přes Supabase Dashboard
- Flow pozvánky: email → `/auth/callback` → `/set-password` → `/onboarding`
- `middleware.ts` kontroluje session a `onboarding_done`
- RLS: každý uživatel vidí jen svá data (`user_id = auth.uid()`)

## Kritická pravidla (platí vždy)
- **Platby z emailů:** mBank notifikace → Google Apps Script (každou hodinu, jen nepřečtené emaily) → `POST /api/parse-email` (hlavička `x-parse-secret`) → Claude parsuje → `payments`; spárování podle čísla účtu v `tenants`, jinak `unmatched`.
- **`app/api/parse-email/route.ts` zapisuje přes `SUPABASE_SERVICE_ROLE_KEY`** (anon nemá SELECT na `payments`, INSERT s RETURNING by padl na RLS). Proměnná **musí být nastavená ve Vercelu (Production)**, jinak zápis selže. Ověřeno 2026-09-21.
- **Bezpečnost:** service role klíč jen na serveru (bez `NEXT_PUBLIC_`), nikdy do klienta, gitu ani logů, nevypisovat. Při zavádění nové `anon` RLS politiky vždy ověřit přímým REST dotazem bez auth hlavičky, že nevystavuje data. `PARSE_EMAIL_SECRET` při podezření na únik změnit ve Vercelu i v Apps Scriptu.
- **Zálohy:** `scripts/backup-database.mjs` (service role, výstup do `backups/`, ta je v `.gitignore`); týdně naplánovaná úloha, výstup na Google Disk.
- **Poštovní poukázka** přijde v emailu jako běžná "Prichozi platba" z účtu nájemníka a spáruje se automaticky.

## Přehled dokumentace v `docs/`
- `docs/nemovitosti.md` — soubory k nemovitostem (Storage, `property_files`), ocenění (`property_valuations`, graf, badge, výnosy z nájmu)
- `docs/projekce.md` — graf "Jak rosteš v čase", tři scénáře, simulace akvizic, finanční profil, pokročilé nastavení, plány k porovnání s realitou (`projection_plans`)
- `docs/platby.md` — email parsing detailně, ruční evidence plateb, kalendář, RLS na `payments`, bezpečnostní incident 2026-09-09/16, oprava 2026-09-21, sekce Nájemníci
- `docs/pujcky-cashflow.md` — sekce Půjčky (`debts`), cashflow přepínače
- `docs/doporuceni.md` — modul Doporučení: pravidla a prahy (`lib/recommendations/`), odložit/zahodit/obnovit, `recommendation_state`
- `docs/zaloha-a-provoz.md` — záloha DB, přidání uživatele, Supabase nastavení (Site URL, redirecty)

## Klíčové soubory
- `components/EquityDashboard.tsx` — hlavní komponenta dashboardu
- `lib/recommendations/` + `components/Recommendations.tsx` — modul Doporučení (čistá logika pravidel + UI)
- `app/onboarding/page.tsx` — 7-krokový wizard pro nové uživatele
- `app/login/page.tsx`, `app/set-password/page.tsx`, `app/auth/callback/route.ts` — přihlášení a pozvánky
- `app/api/parse-email/route.ts` — aktivní endpoint pro Google Apps Script
- `app/api/inbound-email/route.ts` — starý Resend webhook (nepoužívá se)
- `app/api/suggest-reply/route.ts` — AI návrh odpovědi nájemníkovi
- `middleware.ts` — ochrana rout; `lib/auth.ts` (browser klient), `lib/auth-server.ts` (server klient)
