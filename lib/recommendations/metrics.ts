import type { RMortgage, RProperty, RecommendationInput } from "./types";

/** Prahy pravidel — jedno místo pro úpravu. */
export const THRESHOLDS = {
  minYieldPct: 4,
  maxLtvPct: 80,
  expensiveDebtRatePct: 7,
  refixWarnDays: 180,
  refixCriticalDays: 60,
  leaseWarnDays: 90,
  leaseCriticalDays: 30,
  refixStressPp: 2,
  minAssetValueForIdle: 500_000,
  insuranceWarnDays: 60,
};

export const isManaged = (p: RProperty) => p.ownership_type === "manager";

const DAY_MS = 86_400_000;

export function daysUntil(date: string | null | undefined, today: Date): number | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((d.getTime() - t.getTime()) / DAY_MS);
}

export function mortgagesOf(p: RProperty, mortgages: RMortgage[]) {
  return mortgages.filter((m) => m.property_id === p.id);
}

export const mortgagePayment = (ms: RMortgage[]) => ms.reduce((s, m) => s + (m.monthly_payment || 0), 0);
export const mortgageBalance = (ms: RMortgage[]) => ms.reduce((s, m) => s + (m.outstanding_balance || 0), 0);

/**
 * Měsíční cashflow uživatele z jedné nemovitosti.
 * Vlastněná: nájem (jen když je pronajatá) − splátky − náklady.
 * Spravovaná (manager): jen provize `management_fee` — nájem patří někomu jinému.
 */
export function propertyCashflow(p: RProperty, mortgages: RMortgage[]): number {
  if (isManaged(p)) return p.management_fee ?? 0;
  const rent = p.status === "rented" ? p.rent_amount : 0;
  return rent - mortgagePayment(mortgagesOf(p, mortgages)) - (p.monthly_costs ?? 0);
}

/** Hrubý roční výnos z nájmu v % z odhadované hodnoty. */
export function grossYieldPct(p: RProperty): number | null {
  if (!p.estimated_value || p.estimated_value <= 0) return null;
  return ((p.rent_amount * 12) / p.estimated_value) * 100;
}

/** Cashflow celého portfolia (bez plánovaných), vč. provizí ze správy. */
export function portfolioCashflow(input: RecommendationInput): number {
  return input.properties
    .filter((p) => p.status !== "planned")
    .reduce((s, p) => s + propertyCashflow(p, input.mortgages), 0);
}

/** Měsíční splátky vlastních půjček (`i_owe`). */
export function personalDebtPayments(input: RecommendationInput): number {
  return input.debts
    .filter((d) => d.direction === "i_owe")
    .reduce((s, d) => s + (d.monthly_payment ?? 0), 0);
}

export const fmt = (n: number) => Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " ");
