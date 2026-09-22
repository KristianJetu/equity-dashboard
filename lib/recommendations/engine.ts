import { daysUntil } from "./metrics";
import { RULES } from "./rules";
import type { Recommendation, RecommendationInput, Severity } from "./types";

const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 4, important: 3, opportunity: 2, data: 1 };

/** Spustí všechna pravidla a vrátí doporučení seřazená od nejdůležitějšího. */
export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const today = input.today ?? new Date();
  const list: Recommendation[] = RULES.flatMap((rule) => rule(input, today)).map((r) => ({
    ...r,
    dueDate: r.dueDate ?? null,
    fingerprint: r.dueDate ?? "",
    daysLeft: r.daysLeft ?? (r.dueDate ? daysUntil(r.dueDate, today) : null),
  }));

  const score = (r: Recommendation) => {
    const urgency = r.daysLeft != null && r.daysLeft >= 0 ? Math.max(0, 180 - r.daysLeft) : 0;
    return SEVERITY_WEIGHT[r.severity] * 1_000_000 + Math.abs(r.impactCzkMonth ?? 0) + urgency * 10;
  };
  return list.sort((a, b) => score(b) - score(a));
}
