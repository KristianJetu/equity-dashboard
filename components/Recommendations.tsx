"use client";

import React, { useMemo, useState } from "react";
import { buildRecommendations } from "@/lib/recommendations/engine";
import type { Category, Recommendation, RecommendationInput, Severity } from "@/lib/recommendations/types";

const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: "Kritické", color: "#c0392b", bg: "#f6dedb" },
  important: { label: "Důležité", color: "#a07b2f", bg: "#efe3c6" },
  opportunity: { label: "Příležitosti", color: "#1f3d2e", bg: "#d6e4d6" },
  data: { label: "Data k opravě", color: "#7c8378", bg: "#e6e0d0" },
};
const SEVERITY_ORDER: Severity[] = ["critical", "important", "opportunity", "data"];

const CATEGORY_LABEL: Record<Category, string> = {
  cashflow: "Cashflow",
  financing: "Financování",
  leases: "Nájmy",
  debts: "Půjčky",
  assets: "Majetek",
  data: "Data",
};

const fmt = (n: number) => Math.round(n).toLocaleString("cs-CZ");

type Props = {
  input: RecommendationInput;
  propertyName: (id: string | null) => string | null;
};

export default function Recommendations({ input, propertyName }: Props) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [showData, setShowData] = useState(false);

  const all = useMemo(() => buildRecommendations(input), [input]);
  const visible = category === "all" ? all : all.filter((r) => r.category === category);
  const counts = SEVERITY_ORDER.map((s) => ({ s, n: all.filter((r) => r.severity === s).length }));
  const categories = Array.from(new Set(all.map((r) => r.category)));

  if (all.length === 0) {
    return (
      <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "18px 20px", color: "#1f3d2e", fontSize: 14 }}>
        Žádná doporučení — portfolio vypadá v pořádku.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {counts.filter((c) => c.n > 0).map(({ s, n }) => (
          <span key={s} style={{ background: SEVERITY_META[s].bg, color: SEVERITY_META[s].color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            {SEVERITY_META[s].label}: {n}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value as Category | "all")}
          style={{ border: "1px solid #d9d3c0", background: "#f5f1e6", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#1c2b22" }}>
          <option value="all">Všechny oblasti</option>
          {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      {SEVERITY_ORDER.map((sev) => {
        const items = visible.filter((r) => r.severity === sev);
        if (items.length === 0) return null;
        const meta = SEVERITY_META[sev];
        const collapsed = sev === "data" && !showData;
        return (
          <div key={sev} style={{ marginBottom: 18 }}>
            <div
              onClick={sev === "data" ? () => setShowData((v) => !v) : undefined}
              style={{ fontSize: 13, fontWeight: 700, color: meta.color, marginBottom: 8, cursor: sev === "data" ? "pointer" : "default" }}>
              {meta.label} ({items.length}){sev === "data" ? (collapsed ? " ▸" : " ▾") : ""}
            </div>
            {!collapsed && (
              <div style={{ display: "grid", gap: 10 }}>
                {items.map((r) => <Card key={r.id} r={r} propertyName={propertyName(r.propertyId)} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ r, propertyName }: { r: Recommendation; propertyName: string | null }) {
  const meta = SEVERITY_META[r.severity];
  return (
    <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "14px 18px", borderLeft: `3px solid ${meta.color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{r.title}</div>
          <div style={{ fontSize: 12, color: "#7c8378", marginTop: 2 }}>
            {CATEGORY_LABEL[r.category]}
            {propertyName ? ` · ${propertyName.trim()}` : ""}
            {r.daysLeft != null && r.daysLeft >= 0 ? ` · za ${r.daysLeft} dní` : ""}
          </div>
        </div>
        {r.impactCzkMonth != null && r.impactCzkMonth !== 0 && (
          <div style={{ textAlign: "right", flexShrink: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: r.impactCzkMonth < 0 ? "#c0392b" : "#1f3d2e" }}>
            {r.impactCzkMonth < 0 ? "−" : "+"}{fmt(Math.abs(r.impactCzkMonth))} Kč/měs
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, color: "#3a4a40", marginTop: 8, lineHeight: 1.5 }}>{r.why}</div>
      <div style={{ fontSize: 13, color: "#1f3d2e", marginTop: 6, fontWeight: 600 }}>→ {r.action}</div>
    </div>
  );
}
