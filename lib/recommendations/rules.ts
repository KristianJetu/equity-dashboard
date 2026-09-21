import {
  THRESHOLDS as T,
  daysUntil,
  fmt,
  grossYieldPct,
  isManaged,
  mortgageBalance,
  mortgagePayment,
  mortgagesOf,
  personalDebtPayments,
  portfolioCashflow,
  propertyCashflow,
} from "./metrics";
import type { Recommendation, RecommendationInput } from "./types";

type Rec = Omit<Recommendation, "dueDate" | "daysLeft"> & { dueDate?: string | null; daysLeft?: number | null };
type Rule = (input: RecommendationInput, today: Date) => Rec[];

const owned = (i: RecommendationInput) => i.properties.filter((p) => !isManaged(p) && p.status !== "planned");

/* ───────────── Cashflow (C) ───────────── */

const C1: Rule = (i) =>
  owned(i)
    .filter((p) => p.status === "rented")
    .map((p) => ({ p, cf: propertyCashflow(p, i.mortgages) }))
    .filter(({ cf }) => cf < 0)
    .map(({ p, cf }) => ({
      id: `C1:${p.id}`, rule: "C1", severity: "important", category: "cashflow", propertyId: p.id,
      title: `${p.name.trim()}: záporné cashflow`,
      why: `Nájem ${fmt(p.rent_amount)} Kč nepokryje splátky a náklady, měsíčně doplácíte ${fmt(-cf)} Kč.`,
      action: "Zvažte navýšení nájmu, refinancování nebo snížení nákladů.",
      impactCzkMonth: cf,
    }));

const C2: Rule = (i) =>
  owned(i)
    .filter((p) => p.status === "vacant")
    .map((p) => ({ p, cf: propertyCashflow(p, i.mortgages), pay: mortgagePayment(mortgagesOf(p, i.mortgages)) }))
    .filter(({ pay }) => pay > 0)
    .map(({ p, cf, pay }) => ({
      id: `C2:${p.id}`, rule: "C2", severity: "critical", category: "cashflow", propertyId: p.id,
      title: `${p.name.trim()}: prázdná nemovitost se splátkou`,
      why: `Nemovitost nenese nájem a platíte ${fmt(pay)} Kč splátky. Měsíční ztráta ${fmt(-cf)} Kč (ročně ${fmt(-cf * 12)} Kč).`,
      action: "Pronajměte, prodejte, nebo nemovitost přefinancujte.",
      impactCzkMonth: cf,
    }));

const C3: Rule = (i) =>
  owned(i)
    .filter((p) => p.status === "vacant" && p.estimated_value >= T.minAssetValueForIdle)
    .filter((p) => mortgagePayment(mortgagesOf(p, i.mortgages)) === 0)
    .map((p) => ({
      id: `C3:${p.id}`, rule: "C3", severity: "opportunity", category: "cashflow", propertyId: p.id,
      title: `${p.name.trim()}: nevyužitý majetek`,
      why: `Prázdná nemovitost v hodnotě ${fmt(p.estimated_value)} Kč nenese žádný příjem.`,
      action: "Pronajměte ji, nebo zvažte prodej a uvolnění kapitálu.",
      impactCzkMonth: null,
    }));

const C4: Rule = (i) =>
  owned(i)
    .filter((p) => p.status === "rented" && p.rent_amount === 0 && p.estimated_value >= T.minAssetValueForIdle)
    .map((p) => ({
      id: `C4:${p.id}`, rule: "C4", severity: "opportunity", category: "cashflow", propertyId: p.id,
      title: `${p.name.trim()}: pronajatá bez evidovaného nájmu`,
      why: `Je vedená jako pronajatá, ale nájem je 0 Kč (hodnota ${fmt(p.estimated_value)} Kč). Nájem může být součástí jiné nemovitosti.`,
      action: "Doplňte výši nájmu, nebo nemovitost sloučte s tou, ke které patří.",
      impactCzkMonth: null,
    }));

const C5: Rule = (i) => {
  const propsCf = portfolioCashflow(i);
  const debtPay = personalDebtPayments(i);
  const { incomeEmployment, incomeOther, householdCosts } = i.profile;
  const hasIncome = incomeEmployment != null && incomeEmployment > 0;
  if (!hasIncome) {
    const net = propsCf - debtPay;
    if (net >= 0) return [];
    return [{
      id: "C5:portfolio", rule: "C5", severity: "important", category: "cashflow", propertyId: null,
      title: "Cashflow po splátkách půjček je záporné",
      why: `Nemovitosti vydělají ${fmt(propsCf)} Kč/měs, splátky vašich půjček stojí ${fmt(debtPay)} Kč/měs — rozdíl ${fmt(net)} Kč/měs musíte krýt z jiných příjmů. Příjem ze zaměstnání v profilu není vyplněn.`,
      action: "Vyplňte příjem v profilu; nejdřív umořte nejdražší půjčky.",
      impactCzkMonth: net,
    }];
  }
  const net = propsCf - debtPay + (incomeEmployment ?? 0) + (incomeOther ?? 0) - (householdCosts ?? 0);
  if (net >= 0) return [];
  return [{
    id: "C5:portfolio", rule: "C5", severity: "critical", category: "cashflow", propertyId: null,
    title: "Celkové měsíční cashflow je záporné",
    why: `Po započtení příjmu, splátek půjček a nákladů domácnosti vychází ${fmt(net)} Kč/měs.`,
    action: "Snižte splátky (umoření nebo refinancování) nebo zvyšte příjmy z nájmů.",
    impactCzkMonth: net,
  }];
};

/* ───────────── Financování a refixace (F) ───────────── */

const F1: Rule = (i, today) => {
  const out: Rec[] = [];
  for (const p of owned(i)) {
    for (const m of mortgagesOf(p, i.mortgages)) {
      const left = daysUntil(m.refix_date, today);
      if (left == null || left < 0 || left > T.refixWarnDays || !(m.outstanding_balance > 0)) continue;
      const rateKnown = !!m.interest_rate && m.interest_rate > 0;
      const extra = (m.outstanding_balance * (T.refixStressPp / 100)) / 12;
      const cfNow = propertyCashflow(p, i.mortgages);
      const cfAfter = cfNow - extra;
      const severity = left <= T.refixCriticalDays || (cfNow >= 0 && cfAfter < 0) ? "critical" : "important";
      out.push({
        id: `F1:${m.id}`, rule: "F1", severity, category: "financing", propertyId: p.id,
        title: `${p.name.trim()}: refixace hypotéky za ${left} dní`,
        why: `Zůstatek ${fmt(m.outstanding_balance)} Kč. Při zvýšení sazby o ${T.refixStressPp} p. b. vzroste splátka zhruba o ${fmt(extra)} Kč/měs a cashflow nemovitosti bude ${fmt(cfAfter)} Kč/měs (nyní ${fmt(cfNow)} Kč).${rateKnown ? "" : " Aktuální sazba není v datech vyplněna."}`,
        action: "Začněte jednat s bankou o nové sazbě a porovnejte nabídky.",
        impactCzkMonth: -extra, dueDate: m.refix_date, daysLeft: left,
      });
    }
  }
  return out;
};

const F5: Rule = (i) =>
  owned(i)
    .map((p) => ({ p, bal: mortgageBalance(mortgagesOf(p, i.mortgages)) }))
    .filter(({ p, bal }) => p.estimated_value > 0 && (bal / p.estimated_value) * 100 > T.maxLtvPct)
    .map(({ p, bal }) => ({
      id: `F5:${p.id}`, rule: "F5", severity: "critical", category: "financing", propertyId: p.id,
      title: `${p.name.trim()}: vysoké LTV`,
      why: `Dluh ${fmt(bal)} Kč je ${Math.round((bal / p.estimated_value) * 100)} % hodnoty nemovitosti (limit ${T.maxLtvPct} %).`,
      action: "Zvažte mimořádnou splátku nebo aktualizaci ocenění.",
      impactCzkMonth: null,
    }));

const F6: Rule = (i, today) => {
  const out: Rec[] = [];
  for (const p of owned(i)) {
    for (const m of mortgagesOf(p, i.mortgages)) {
      if (!m.loan_start_date || !m.loan_term_years || m.loan_term_years <= 0 || !(m.outstanding_balance > 0)) continue;
      const end = new Date(m.loan_start_date + "T00:00:00");
      end.setFullYear(end.getFullYear() + m.loan_term_years);
      const left = daysUntil(end.toISOString().slice(0, 10), today);
      if (left == null || left < 0 || left > 365) continue;
      out.push({
        id: `F6:${m.id}`, rule: "F6", severity: "important", category: "financing", propertyId: p.id,
        title: `${p.name.trim()}: hypotéka končí za ${left} dní`,
        why: `Podle data čerpání a doby splácení končí splatnost, zůstatek je ${fmt(m.outstanding_balance)} Kč.`,
        action: "Ověřte, zda zůstatek bude splacen, nebo domluvte prodloužení.",
        impactCzkMonth: null, dueDate: end.toISOString().slice(0, 10), daysLeft: left,
      });
    }
  }
  return out;
};

/* ───────────── Nájmy a správa (L) ───────────── */

const L1L2: Rule = (i, today) => {
  const out: Rec[] = [];
  for (const p of owned(i)) {
    if (p.status !== "rented" || !p.lease_end) continue;
    const left = daysUntil(p.lease_end, today);
    if (left == null) continue;
    if (left < 0) {
      out.push({
        id: `L2:${p.id}`, rule: "L2", severity: "critical", category: "leases", propertyId: p.id,
        title: `${p.name.trim()}: nájemní smlouva vypršela`,
        why: `Konec nájmu byl ${p.lease_end} (před ${-left} dny), nemovitost je stále vedena jako pronajatá.`,
        action: "Prodlužte smlouvu, nebo aktualizujte stav nemovitosti.",
        impactCzkMonth: -p.rent_amount, dueDate: p.lease_end, daysLeft: left,
      });
    } else if (left <= T.leaseWarnDays) {
      out.push({
        id: `L1:${p.id}`, rule: "L1", severity: left <= T.leaseCriticalDays ? "critical" : "important",
        category: "leases", propertyId: p.id,
        title: `${p.name.trim()}: nájem končí za ${left} dní`,
        why: `Konec nájemní smlouvy ${p.lease_end}. Ohroženo ${fmt(p.rent_amount)} Kč/měs.`,
        action: "Domluvte s nájemníkem prodloužení, případně navýšení nájmu.",
        impactCzkMonth: -p.rent_amount, dueDate: p.lease_end, daysLeft: left,
      });
    }
  }
  return out;
};

const L3: Rule = (i) =>
  owned(i)
    .filter((p) => p.status === "rented" && p.rent_amount > 0)
    .map((p) => ({ p, y: grossYieldPct(p) }))
    .filter((x): x is { p: typeof x.p; y: number } => x.y != null && x.y < T.minYieldPct)
    .map(({ p, y }) => {
      const target = (p.estimated_value * (T.minYieldPct / 100)) / 12;
      return {
        id: `L3:${p.id}`, rule: "L3", severity: "opportunity" as const, category: "leases" as const, propertyId: p.id,
        title: `${p.name.trim()}: nízký výnos z nájmu (${y.toFixed(1)} %)`,
        why: `Nájem ${fmt(p.rent_amount)} Kč při hodnotě ${fmt(p.estimated_value)} Kč. Výnos ${T.minYieldPct} % by odpovídal nájmu ${fmt(target)} Kč/měs.`,
        action: "Zvažte navýšení nájmu při prodloužení smlouvy, nebo prodej a přesun kapitálu.",
        impactCzkMonth: target - p.rent_amount,
      };
    });

/* ───────────── Půjčky a pohledávky (D) ───────────── */

const D1: Rule = (i, today) =>
  i.debts
    .filter((d) => d.direction === "i_owe" && d.amount_remaining > 0 && d.due_date)
    .map((d) => ({ d, left: daysUntil(d.due_date, today) }))
    .filter((x): x is { d: typeof x.d; left: number } => x.left != null && x.left < 0)
    .map(({ d, left }) => ({
      id: `D1:${d.id}`, rule: "D1", severity: "critical" as const, category: "debts" as const, propertyId: null,
      title: `${d.name}: splatnost uplynula`,
      why: `Splatnost byla ${d.due_date} (před ${-left} dny), zbývá ${fmt(d.amount_remaining)} Kč.`,
      action: "Ověřte, zda je půjčka splacena, prodloužena, nebo je v systému špatné datum.",
      impactCzkMonth: null, dueDate: d.due_date ?? null, daysLeft: left,
    }));

const D2: Rule = (i) =>
  i.debts
    .filter((d) => d.direction === "i_owe" && d.amount_remaining > 0 && (d.interest_rate ?? 0) >= T.expensiveDebtRatePct)
    .sort((a, b) => (b.interest_rate ?? 0) - (a.interest_rate ?? 0))
    .map((d) => ({
      id: `D2:${d.id}`, rule: "D2", severity: "important" as const, category: "debts" as const, propertyId: null,
      title: `${d.name}: drahá půjčka (${d.interest_rate} %)`,
      why: `Zbývá ${fmt(d.amount_remaining)} Kč, úrok zhruba ${fmt((d.amount_remaining * (d.interest_rate ?? 0)) / 100 / 12)} Kč/měs.`,
      action: "Umořte přednostně nejdražší půjčky, nebo je refinancujte levněji.",
      impactCzkMonth: -((d.amount_remaining * (d.interest_rate ?? 0)) / 100 / 12),
    }));

const D3: Rule = (i, today) =>
  i.debts
    .filter((d) => d.direction === "they_owe" && d.amount_remaining > 0)
    .map((d) => {
      const left = daysUntil(d.due_date, today);
      const overdue = left != null && left < 0;
      const arrears = /neuhrazen|nezaplacen/i.test(d.note ?? "");
      return { d, left, overdue, arrears };
    })
    .filter((x) => x.overdue || x.arrears)
    .map(({ d, left, overdue }) => ({
      id: `D3:${d.id}`, rule: "D3", severity: "important" as const, category: "debts" as const, propertyId: null,
      title: `${d.name}: pohledávka v prodlení`,
      why: overdue
        ? `Splatnost ${d.due_date} uplynula, zbývá ${fmt(d.amount_remaining)} Kč.`
        : `Zbývá ${fmt(d.amount_remaining)} Kč a poznámka uvádí neuhrazené splátky.`,
      action: "Kontaktujte dlužníka, domluvte splátkový kalendář nebo zvažte vymáhání.",
      impactCzkMonth: d.monthly_payment ?? null, dueDate: d.due_date ?? null, daysLeft: left,
    }));

const D4: Rule = (i) =>
  i.debts
    .filter((d) => d.direction === "they_owe" && d.amount_remaining > 0 && !d.monthly_payment && !d.due_date)
    .map((d) => ({
      id: `D4:${d.id}`, rule: "D4", severity: "opportunity" as const, category: "debts" as const, propertyId: null,
      title: `${d.name}: pohledávka bez splátek a termínu`,
      why: `${fmt(d.amount_remaining)} Kč nemá stanovenou splátku ani splatnost, návratnost není zajištěna.`,
      action: "Domluvte splátkový kalendář nebo termín splatnosti.",
      impactCzkMonth: null,
    }));

const D5: Rule = (i) =>
  i.debts
    .filter((d) => (d.interest_rate ?? 0) < 0)
    .map((d) => ({
      id: `D5:${d.id}`, rule: "D5", severity: "data" as const, category: "data" as const, propertyId: null,
      title: `${d.name}: záporná úroková sazba`,
      why: `Sazba ${d.interest_rate} % je pravděpodobně překlep.`,
      action: "Opravte úrokovou sazbu.",
      impactCzkMonth: null,
    }));

/* ───────────── Majetek (A) ───────────── */

const A3: Rule = (i) =>
  i.properties
    .filter((p) => p.status === "planned")
    .map((p) => ({ p, cf: propertyCashflow({ ...p, status: "rented" }, i.mortgages) }))
    .filter(({ cf }) => cf < 0)
    .map(({ p, cf }) => ({
      id: `A3:${p.id}`, rule: "A3", severity: "important" as const, category: "assets" as const, propertyId: p.id,
      title: `${p.name.trim()} (plánovaná): záporné cashflow`,
      why: `Při plánovaném nájmu ${fmt(p.rent_amount)} Kč by nemovitost prodělávala ${fmt(-cf)} Kč/měs.`,
      action: "Před nákupem vyjednejte vyšší nájem, nižší sazbu nebo vyšší vlastní vklad.",
      impactCzkMonth: cf,
    }));

/* ───────────── Kvalita dat (Q) ───────────── */

const Q: Rule = (i) => {
  const out: Rec[] = [];
  const base = { severity: "data" as const, category: "data" as const, impactCzkMonth: null };
  for (const p of i.properties.filter((p) => !isManaged(p) && p.status !== "planned" && !(p.estimated_value > 0))) {
    out.push({ ...base, id: `Q1:${p.id}`, rule: "Q1", propertyId: p.id, title: `${p.name.trim()}: chybí hodnota nemovitosti`,
      why: "Odhadovaná hodnota je 0 Kč, proto nelze spočítat výnos ani LTV.", action: "Doplňte odhadovanou hodnotu." });
  }
  for (const p of owned(i)) {
    for (const m of mortgagesOf(p, i.mortgages).filter((m) => m.outstanding_balance > 0)) {
      if (!m.refix_date) out.push({ ...base, id: `Q2:${m.id}`, rule: "Q2", propertyId: p.id, title: `${p.name.trim()}: chybí datum refixace`,
        why: "Bez data refixace modul nemůže hlídat termín.", action: "Doplňte datum refixace hypotéky." });
      if (!m.interest_rate || m.interest_rate <= 0) out.push({ ...base, id: `Q3:${m.id}`, rule: "Q3", propertyId: p.id, title: `${p.name.trim()}: chybí úroková sazba`,
        why: "Bez sazby nelze odhadnout dopad refixace.", action: "Doplňte aktuální úrokovou sazbu." });
      if (m.loan_term_years != null && m.loan_term_years <= 0) out.push({ ...base, id: `Q4:${m.id}`, rule: "Q4", propertyId: p.id, title: `${p.name.trim()}: neplatná doba splácení`,
        why: `Doba splácení je ${m.loan_term_years} let.`, action: "Opravte dobu splácení hypotéky." });
    }
  }
  const noInsurance = owned(i).filter((p) => p.status !== "vacant" && !p.insurance_to);
  if (noInsurance.length) {
    out.push({ ...base, id: "Q5:insurance", rule: "Q5", propertyId: null, title: `Chybí platnost pojištění u ${noInsurance.length} nemovitostí`,
      why: `Modul nemůže hlídat konec pojištění: ${noInsurance.map((p) => p.name.trim()).join(", ")}.`, action: "Doplňte datum konce pojištění." });
  }
  for (const pay of i.payments.filter((x) => x.status === "paid" && x.rent_received > 0 && x.rent_received < 100)) {
    out.push({ ...base, id: `Q6:${pay.id}`, rule: "Q6", propertyId: pay.property_id, title: `Podezřelá platba ${pay.month.slice(0, 7)}`,
      why: `Přijato jen ${fmt(pay.rent_received)} Kč, pravděpodobně chyba zadání.`, action: "Zkontrolujte a opravte částku platby." });
  }
  return out;
};

export const RULES: Rule[] = [C1, C2, C3, C4, C5, F1, F5, F6, L1L2, L3, D1, D2, D3, D4, D5, A3, Q];
