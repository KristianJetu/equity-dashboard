# Hlasový asistent (`/asistent`)

Samostatná stránka aplikace pro ovládání hlasem, hlavně z mobilu (PWA zkratka „Asistent“ na ikoně aplikace, odkaz v postranním panelu a v sekci účtu).

## Jak funguje
- **Diktování:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), jazyk `cs-CZ`, průběžný přepis do políčka. Volba „Odeslat hned po domluvení“ pošle pokyn automaticky po konci řeči. Funguje v Chromu (Android, desktop) a Safari (iOS); ve Firefoxu chybí.
- **Odpovědi nahlas:** `speechSynthesis`, přepínač Hlas zap./vyp. a jazyk odpovědí CZ/EN. Český hlas musí být v telefonu nainstalovaný.
- **Server:** `app/api/assistant/route.ts` – vyžaduje přihlášení (Supabase session, RLS), model `claude-opus-5-5` s effort `low`, ruční tool-use smyčka (max 6 kol), záložní model při odmítnutí (`server-side-fallback-2026-06-01` → `claude-opus-4-8`).
- **Nástroje:** Todoist (`lib/assistant/todoist.ts`, REST API v1, `TODOIST_API_TOKEN`) – vypsat úkoly filtrem, projekty, přidat, dokončit, vrátit. Kontext portfolia (nemovitosti, hypotéky, platby za 2 měsíce, nespárované platby, půjčky) se načítá ze Supabase při každém dotazu.
- **„Spusť denní přehled“:** očíslovaný plán dne z úkolů a portfolia (po termínu, nespárované platby, chybějící nájmy, konce pojištění/refixace/nájmů do 60 dní, půjčky).
- Konverzace je jen v `localStorage` prohlížeče; server dostává posledních 20 zpráv.

## Proměnné prostředí
`ANTHROPIC_API_KEY`, `TODOIST_API_TOKEN` (obě už ve Vercelu pro `/api/chat` a `/api/todoist-tasks`).

## Zatím chybí
Gmail a Google Kalendář (vyžadují Google OAuth). V Claude je zatím pokrývá artefakt „Kristiánův přehled“.
