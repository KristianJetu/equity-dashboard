# Půjčky a Cashflow (detail)

> Načítá se jen na požádání (není součástí CLAUDE.md). Stručný přehled a odkazy: CLAUDE.md.

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

