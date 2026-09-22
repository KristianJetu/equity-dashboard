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

const CRITERIA: { title: string; items: string[] }[] = [
  { title: "Cashflow", items: [
    "Nemovitost s nájmem, která měsíčně prodělává (nájem − splátky − náklady < 0)",
    "Prázdná nemovitost, na kterou platíte splátku",
    "Prázdný nebo nepronajatý majetek nad 500 tis. Kč",
    "Celkové cashflow po splátkách vašich půjček (a po započtení příjmu z profilu) je záporné",
  ] },
  { title: "Financování", items: [
    "Refixace hypotéky do 180 dní (do 60 dní = kritické), s odhadem dopadu při růstu sazby o 2 p. b.",
    "LTV nad 80 % hodnoty nemovitosti",
    "Hypotéka, jejíž splatnost končí do 12 měsíců",
  ] },
  { title: "Nájmy", items: [
    "Konec nájemní smlouvy do 90 dní (do 30 dní = kritické) nebo už vypršela",
    "Hrubý výnos z nájmu pod 4 % ročně z hodnoty nemovitosti",
  ] },
  { title: "Půjčky a pohledávky", items: [
    "Vaše půjčka po splatnosti",
    "Vaše půjčka s úrokem 7 % a více",
    "Pohledávka po splatnosti nebo s neuhrazenými splátkami v poznámce",
    "Pohledávka bez splátky a bez termínu splatnosti",
  ] },
  { title: "Majetek a data", items: [
    "Plánovaná nemovitost, která by měla záporné cashflow",
    "Chybějící nebo podezřelé údaje (hodnota, sazba, refix, pojištění, platby)",
  ] },
];

type Props = {
  input: RecommendationInput;
  propertyName: (id: string | null) => string | null;
};

export default function Recommendations({ input, propertyName }: Props) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [showData, setShowData] = useState(false);
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const all = useMemo(() => buildRecommendations(input), [input]);
  const visible = category === "all" ? all : all.filter((r) => r.category === category);
  const counts = SEVERITY_ORDER.map((s) => ({ s, n: all.filter((r) => r.severity === s).length }));
  const categories = Array.from(new Set(all.map((r) => r.category)));

  const header = (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", cursor: "pointer", background: "#f5f1e6", borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>Doporučení</div>
        <button
          type="button"
          aria-label="Podle jakých kritérií se doporučení tvoří"
          onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}
          style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px solid #7c8378", background: showInfo ? "#1f3d2e" : "transparent", color: showInfo ? "#f5f1e6" : "#7c8378", fontSize: 12, fontWeight: 700, fontStyle: "italic", fontFamily: "Georgia, serif", cursor: "pointer", lineHeight: 1, padding: 0 }}>
          i
        </button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {counts.filter((c) => c.n > 0).map(({ s, n }) => (
            <span key={s} style={{ background: SEVERITY_META[s].bg, color: SEVERITY_META[s].color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
              {SEVERITY_META[s].label}: {n}
            </span>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#7c8378" }}>{open ? "Sbalit" : "Zobrazit vše"} {open ? "▴" : "▾"}</span>
      </div>
      {showInfo && (
        <div style={{ background: "#fffdf6", border: "1px solid #d9d3c0", borderRadius: 10, padding: "14px 18px", marginTop: 8, fontSize: 13, color: "#3a4a40", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Podle čeho se doporučení tvoří</div>
          <div style={{ color: "#7c8378", marginBottom: 8 }}>
            Modul vyhodnocuje vaše nemovitosti, hypotéky, půjčky a příjem podle pevných pravidel. Seřazuje je podle závažnosti, potom podle finančního dopadu a blízkosti termínu. Nemovitosti ve správě se počítají jen provizí.
          </div>
          {CRITERIA.map((g) => (
            <div key={g.title} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600, color: "#1f3d2e" }}>{g.title}</div>
              <ul style={{ margin: "2px 0 0 18px", padding: 0, listStyle: "disc" }}>
                {g.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (all.length === 0) {
    return (
      <div>
        {header}
        {open && (
          <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "18px 20px", color: "#1f3d2e", fontSize: 14, marginTop: 10 }}>
            Žádná doporučení — portfolio vypadá v pořádku.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {header}
      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
      )}
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
