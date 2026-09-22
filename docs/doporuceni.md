# Modul Doporučení (detail)

> Načítá se jen na požádání (není součástí CLAUDE.md). Stručný přehled a odkazy: CLAUDE.md. Kompletní zápis vč. historie je v Notionu ("2026-09-22 — Modul Doporučení").

## Co to je
Sekce **Doporučení** v dashboardu (za Dashboardem, ikona žárovky). Podle pevných pravidel projde portfolio přihlášeného uživatele a vypíše, co je nejdůležitější řešit (cashflow, financování, nájmy, půjčky, kvalita dat). Bez AI a bez tržních dat — počítá se jen z vlastních údajů uživatele.

## Architektura
`lib/recommendations/` je čistá logika bez přístupu k DB; vstup předává `EquityDashboard.tsx` (`recommendationInput`, data už načtená v dashboardu).
- `types.ts` — `Recommendation`, `RecommendationInput`, závažnosti (`critical` / `important` / `opportunity` / `data`) a kategorie
- `metrics.ts` — **`THRESHOLDS` (všechny prahy na jednom místě)**, cashflow nemovitosti, výnos, `daysUntil`
- `rules.ts` — pravidla (`RULES`)
- `engine.ts` — `buildRecommendations()`: spustí pravidla a seřadí (závažnost → |dopad v Kč| → blízkost termínu)
- `state.ts` — `snoozeUntil()`, `applyState()` (odložení / zahození)
- `components/Recommendations.tsx` — UI

## Pravidla a prahy
| ID | Co | Práh | Závažnost |
|---|---|---|---|
| C1 | Nájem nepokrývá splátky a náklady | cashflow < 0 | důležité |
| C2 | Prázdná nemovitost se splátkou | vacant + splátka > 0 | kritické |
| C3 | Prázdný majetek bez splátky | hodnota ≥ 500 tis. | příležitost |
| C4 | Pronajatá bez evidovaného nájmu | rent = 0, hodnota ≥ 500 tis. | příležitost |
| C5 | Cashflow po splátkách vlastních půjček | < 0 (s příjmem z profilu kritické, bez důležité) | kritické / důležité |
| F1 | Refixace hypotéky | ≤ 180 dní; ≤ 60 dní nebo při +2 p. b. cashflow < 0 = kritické | důležité / kritické |
| F5 | LTV | > 80 % | kritické |
| F6 | Konec splatnosti hypotéky | ≤ 12 měsíců | důležité |
| L1/L2 | Konec nájemní smlouvy | ≤ 90 dní; ≤ 30 dní nebo po termínu = kritické | důležité / kritické |
| L3 | Nízký výnos z nájmu | hrubý výnos < 4 % | příležitost |
| D1 | Vlastní půjčka po splatnosti | termín v minulosti | kritické |
| D2 | Drahá půjčka | úrok ≥ 7 % | důležité |
| D3 | Pohledávka po splatnosti / nesplácená | termín uplynul nebo poznámka "neuhrazen/nezaplacen" | důležité |
| D4 | Pohledávka bez splátky a termínu | obojí prázdné | příležitost |
| D5 | Záporná úroková sazba | < 0 | data |
| A3 | Plánovaná nemovitost prodělává | cashflow < 0 při plánovaném nájmu | důležité |
| Q1–Q6 | Chybí hodnota / refix / sazba / pojištění, neplatná doba splácení, podezřelá platba (< 100 Kč) | — | data |

Pravidla pro spravované nemovitosti (`ownership_type = manager`): do cashflow se počítá jen `management_fee` (provize), nájem a náklady patří někomu jinému. Plánované (`planned`) se do C1–C5 nepočítají.

## Odložit / Zahodit / Obnovit
Menu ⋯ na kartě: *Odložit na 30 dní*, *Odložit na 90 dní*, *Zahodit*; skrytá doporučení jsou v sekci "Skryté (N)" s tlačítkem *Obnovit*.
- Odložení u doporučení s termínem se vrátí nejpozději `RETURN_BEFORE_DEADLINE_DAYS` (14) dní před termínem (po termínu bez omezení, aspoň na zítřek).
- **Fingerprint** (= `dueDate ?? ""`): odložené i zahozené doporučení se ukáže znovu, když se termín změní (nový refix, nová smlouva). Bez termínu platí zahození trvale.
- Doporučení se identifikují klíčem `rec_id` (např. `F1:<id hypotéky>`, `C5:portfolio`).

### Tabulka `recommendation_state`
`id`, `user_id`, `rec_id`, `state` (`snoozed`/`dismissed`), `snoozed_until` (date), `fingerprint`, `created_at`; unikát (`user_id`, `rec_id`); RLS `user_id = auth.uid()` na SELECT/INSERT/UPDATE/DELETE. Migrace `supabase-migration-recommendation-state.sql` (spuštěna 2026-09-22). Anonymní SELECT vrací `[]`, anonymní INSERT je blokován RLS. Zápis stavu je v `EquityDashboard.tsx` (`setRecommendationState`, `restoreRecommendation`); chyba zápisu se jen loguje do konzole.

## Zobrazení
Výchozí stav je **sbalený** (řádek s počty). Ikona **i** = krátký popover + odkaz na podrobnou metodiku (tabulka pravidel, konstanta `METHOD_ROWS`). Při změně pravidla nebo prahu je potřeba upravit i `METHOD_ROWS`.

**Metodika je nezávislá na stavu `open`** — zobrazí se i když je seznam doporučení sbalený (`{method}` se renderuje vždy hned pod hlavičkou, mimo blok `{open && (...)}`). Dřív byla součástí rozbaleného seznamu, takže klik na "Podrobná metodika →" ze sbaleného stavu nic nezobrazil (oprava `2cfd1e8`). Po otevření metodiky stránka automaticky scrolluje na tabulku (`methodRef` + `scrollIntoView`, commit `279fc2e`), protože sekce Doporučení bývá níž na stránce.

## Ověření
Pravidla lze spustit nad zálohou: `npx tsc lib/recommendations/*.ts --outDir <tmp> --module commonjs --target es2020` a vstup sestavit z `backups/backup-*.json` jen pro jedno `user_id` (záloha obsahuje data všech uživatelů!).

## Závěrečná kontrola (2026-09-22)
Před uzavřením fáze 1 provedena zpětná kontrola:
- **Bezpečnost:** anonymní SELECT vrací `[]`, anonymní INSERT odmítnut RLS (`42501`). Navíc otestováno na reálném řádku (vytvořeném přes service role jen pro test, poté smazaném): anonymní UPDATE i DELETE vrátí úspěch, ale 0 ovlivněných řádků — RLS `user_id = auth.uid()` funguje na všech čtyřech operacích. `user_id` se v kódu vždy bere z `supabase.auth.getUser()`.
- **Pravidla:** znovu pročteno `rules.ts`, `metrics.ts`, `engine.ts`, `state.ts` — bez nálezu. Drobnost bez dopadu: `today` se v komponentě počítá jen při načtení stránky, takže "za X dní" se přes půlnoc aktualizuje až po obnovení.
- **Náklady na AI:** modul nepoužívá Claude/AI vůbec — pravidla jsou čistý TypeScript v prohlížeči, texty jsou statické šablony v kódu. Nulový dopad na Anthropic API účet (na rozdíl od `parse-email`, `suggest-reply` a `chat`, které Claude Haiku volají).
- **Aktualizace po úpravě dat:** doporučení se přepočítají hned po uložení změny v modalu nemovitosti/hypotéky (`onSaved` znovu načte data z DB), bez obnovení stránky. Odložené/zahozené doporučení se vrátí až při změně jeho "otisku situace" (termínu), ne při jakékoliv úpravě dat — to je záměr.

## Nápady na fázi 2
Skóre nemovitostí a žebříček, karta 3 nejdůležitějších doporučení na hlavní obrazovce, pravidla A1/A2/A4 (nejlepší nemovitost, volný kapitál, koncentrace), historie (C6, L4), AI shrnutí, email, nastavitelné prahy, anglické texty.
