import type { Recommendation } from "./types";

export type RecState = {
  rec_id: string;
  state: "snoozed" | "dismissed";
  snoozed_until: string | null;
  fingerprint: string;
};

/** Doporučení s termínem se vrátí nejpozději tolik dní před termínem. */
export const RETURN_BEFORE_DEADLINE_DAYS = 14;

const DAY_MS = 86_400_000;

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => new Date(s + "T00:00:00");

/**
 * Do kdy odložit: dnes + `days`, ale u doporučení s termínem nejpozději
 * RETURN_BEFORE_DEADLINE_DAYS před termínem (a aspoň na zítřek).
 * Po termínu (daysLeft < 0) se omezení neuplatní.
 */
export function snoozeUntil(rec: Recommendation, days: number, today: Date): { until: string; shortened: boolean } {
  const start = dayStart(today);
  let until = new Date(start.getTime() + days * DAY_MS);
  let shortened = false;
  if (rec.dueDate && rec.daysLeft != null && rec.daysLeft >= 0) {
    const limit = new Date(parse(rec.dueDate).getTime() - RETURN_BEFORE_DEADLINE_DAYS * DAY_MS);
    if (limit < until) { until = limit; shortened = true; }
  }
  const tomorrow = new Date(start.getTime() + DAY_MS);
  if (until < tomorrow) until = tomorrow;
  return { until: iso(until), shortened };
}

export type HiddenRecommendation = { rec: Recommendation; state: RecState };

/** Rozdělí doporučení na viditelná a skrytá (odložená / zahozená) podle uloženého stavu. */
export function applyState(
  recs: Recommendation[],
  states: RecState[],
  today: Date,
): { visible: Recommendation[]; hidden: HiddenRecommendation[] } {
  const byId = new Map(states.map((s) => [s.rec_id, s]));
  const t = dayStart(today).getTime();
  const visible: Recommendation[] = [];
  const hidden: HiddenRecommendation[] = [];
  for (const rec of recs) {
    const st = byId.get(rec.id);
    const sameSituation = st && st.fingerprint === rec.fingerprint;
    const active =
      sameSituation &&
      (st.state === "dismissed" || (st.state === "snoozed" && !!st.snoozed_until && parse(st.snoozed_until).getTime() > t));
    if (active && st) hidden.push({ rec, state: st });
    else visible.push(rec);
  }
  return { visible, hidden };
}
