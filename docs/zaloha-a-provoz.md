# Záloha databáze a provoz (detail)

> Načítá se jen na požádání (není součástí CLAUDE.md). Stručný přehled a odkazy: CLAUDE.md.

## Záloha databáze (nastaveno 2026-08-29)
- **Skript:** `scripts/backup-database.mjs` — exportuje přes `SUPABASE_SERVICE_ROLE_KEY` (obchází RLS) **všechny tabulky**, jejichž seznam si zjistí z OpenAPI schématu PostgRESTu (`GET /rest/v1/`), takže nová tabulka se do zálohy dostane automaticky. Stránkuje po 1000 řádcích. Uloží kombinovaný soubor do `backups/backup-<datum>.json` a rozdělený po tabulkách do `backups/<datum>/*.json`. `raw_email_text` u plateb se vynechává (velké, jen diagnostické).
- **Storage:** skript stahuje i soubory z bucketu `property-files` do `backups/<datum>/storage/` (jen lokálně, na Disk ne — desítky MB).
- **Oprava 2026-10-02:** do té doby měl skript pevný seznam 9 tabulek a v záloze chyběly `property_files`, `property_valuations`, `projection_plans`, `recommendation_state` i soubory ve Storage.
- **`SUPABASE_SERVICE_ROLE_KEY`** je v `.env.local` (a měl by být i ve Vercelu, pokud se má používat i odjinud) — nikdy ho nedávat do gitu ani ho nevypisovat.
- **`backups/`** je v `.gitignore` — zálohy (obsahují citlivá finanční data) nepatří do gitu.
- **Google Disk:** složka "Equity Dashboard zálohy" (folder ID `1ib_iRfk0JnmpNa4OURAbrKFQzKl8GPy0`) na účtu krislasek65@gmail.com — soubory po tabulkách, pojmenované `<datum>_<tabulka>.json`.
- **Automatizace:** naplánovaná úloha `equity-dashboard-db-backup` (Claude Code scheduled task, běží každé pondělí ~8:21) — spustí skript a nahraje výstup na Disk. Běží jen když je appka Claude Code spuštěná; pokud ne, doběhne při dalším spuštění.
- Supabase free plán nemá vlastní automatické zálohy/PITR — tohle je náhrada. Pro plnohodnotnější řešení zvážit upgrade na Supabase Pro (denní zálohy + 7denní PITR).

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

