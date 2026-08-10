# Equity Dashboard — Dokumentace projektu

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
- `tenants` — nájemníci a jejich čísla účtů (pro automatické párování plateb)
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
- **Proč ne Resend webhook:** mBanka používá S/MIME podpis → HTML obsah je příloha, Resend ho neposkytne přes API. Gmail S/MIME dekóduje automaticky.
- **Apps Script URL:** https://script.google.com/home/projects/1BaVpCJ5ToNCp0BJ8-WYvbpCw63RKN3ilhykBZAadss8EvW-xqJYt8KI/edit
- **Trigger:** každou hodinu, time-driven
- **Env var:** `PARSE_EMAIL_SECRET=mbank-secret-2026` (Vercel Production)
- **Klíčový soubor:** `app/api/parse-email/route.ts`

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
