"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildRecommendations } from "@/lib/recommendations/engine";
import { applyState, snoozeUntil, type RecState } from "@/lib/recommendations/state";
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
const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("cs-CZ");

const METHOD_ROWS: [string, string, string, string][] = [
  ["Cashflow", "Nájem nepokrývá splátky a náklady", "rozdíl < 0 Kč/měs", "důležité"],
  ["", "Prázdná nemovitost se splátkou", "prázdná a splátka > 0", "kritické"],
  ["", "Prázdný majetek bez splátky", "hodnota nad 500 tis. Kč", "příležitost"],
  ["", "Celkové cashflow po splátkách půjček", "záporné (s příjmem z profilu)", "kritické, bez příjmu důležité"],
  ["Financování", "Blíží se refixace hypotéky", "do 180 dní; do 60 dní, nebo když by při +2 p. b. cashflow kleslo pod nulu", "důležité / kritické"],
  ["", "Vysoké zadlužení nemovitosti (dluh vůči hodnotě, LTV)", "dluh nad 80 % hodnoty", "kritické"],
  ["", "Končí splatnost hypotéky", "do 12 měsíců", "důležité"],
  ["Nájmy", "Končí nájemní smlouva", "do 90 dní; do 30 dní nebo po termínu", "důležité / kritické"],
  ["", "Nízký výnos z nájmu", "roční nájem pod 4 % hodnoty", "příležitost"],
  ["Půjčky", "Vaše půjčka po splatnosti", "termín v minulosti", "kritické"],
  ["", "Drahá půjčka", "úrok 7 % a více", "důležité"],
  ["", "Pohledávka po splatnosti nebo nesplácená", "termín uplynul, nebo poznámka uvádí neuhrazené splátky", "důležité"],
  ["", "Pohledávka bez splátek a termínu", "obojí prázdné", "příležitost"],
  ["Plány", "Plánovaná nemovitost prodělává", "záporné cashflow při plánovaném nájmu", "důležité"],
  ["Data", "Chybí hodnota, sazba, refix, pojištění; podezřelá platba", "pole prázdné nebo neplatné", "data"],
];

type Props = {
  input: RecommendationInput;
  propertyName: (id: string | null) => string | null;
  states: RecState[];
  onSetState: (rec: Recommendation, state: "snoozed" | "dismissed", until: string | null) => void;
  onRestore: (recId: string) => void;
};

export default function Recommendations({ input, propertyName, states, onSetState, onRestore }: Props) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [showData, setShowData] = useState(false);
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const methodRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showMethod) methodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showMethod]);

  const today = useMemo(() => new Date(), []);
  const { visible: all, hidden } = useMemo(
    () => applyState(buildRecommendations(input), states, today),
    [input, states, today],
  );
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
          aria-label="Jak se doporučení tvoří"
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
          <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Jak se doporučení tvoří</div>
          <div>
            Aplikace porovnává vaše údaje (nemovitosti, hypotéky, nájmy, půjčky, příjem) s pevnými pravidly, např. „refix do 180 dní“ nebo „nájem nepokrývá splátku“. Nepoužívají se tržní odhady ani AI, jen vaše čísla.
          </div>
          <div style={{ marginTop: 6 }}>
            <b>Řazení:</b> nejdřív závažnost (kritické, důležité, příležitosti, data), uvnitř podle měsíčního dopadu v Kč a blízkosti termínu.
          </div>
          <div style={{ marginTop: 6, color: "#7c8378" }}>Přesnost závisí na úplnosti dat, chybějící údaje hlásí sekce „Data k opravě“.</div>
          <button type="button"
            onClick={() => { setShowMethod(true); setShowInfo(false); }}
            style={{ marginTop: 8, background: "none", border: "none", padding: 0, color: "#1f3d2e", fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            Podrobná metodika →
          </button>
        </div>
      )}
    </div>
  );

  const method = showMethod && (
    <div ref={methodRef} style={{ marginTop: 8, background: "#fffdf6", border: "1px solid #d9d3c0", borderRadius: 10, padding: "12px 14px", overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: 13, flex: 1 }}>Podrobná metodika</div>
        <button type="button" onClick={() => setShowMethod(false)}
          style={{ background: "none", border: "none", color: "#7c8378", fontSize: 12, cursor: "pointer" }}>Zavřít ✕</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#3a4a40" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#7c8378" }}>
            {["Oblast", "Co se hlídá", "Kdy se zobrazí", "Závažnost"].map((h) => <th key={h} style={{ padding: "4px 8px", fontWeight: 600 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {METHOD_ROWS.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid #ece6d3", verticalAlign: "top" }}>
              <td style={{ padding: "5px 8px", fontWeight: 600, color: "#1f3d2e", whiteSpace: "nowrap" }}>{row[0]}</td>
              <td style={{ padding: "5px 8px" }}>{row[1]}</td>
              <td style={{ padding: "5px 8px" }}>{row[2]}</td>
              <td style={{ padding: "5px 8px", whiteSpace: "nowrap" }}>{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 12, color: "#7c8378", marginTop: 8, lineHeight: 1.5 }}>
        Odhad dopadu refixace počítá se zvýšením sazby o 2 procentní body z aktuálního zůstatku. Nemovitosti ve správě se do cashflow počítají jen provizí.
        Odložené doporučení s termínem se vrátí nejpozději 14 dní před termínem; zahozené se ukáže znovu, když se termín změní.
      </div>
    </div>
  );

  return (
    <div>
      {header}
      {method}
      {open && (
        <div style={{ marginTop: 14 }}>
          {all.length === 0 ? (
            <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "18px 20px", color: "#1f3d2e", fontSize: 14 }}>
              Žádná aktivní doporučení{hidden.length ? " — zbytek je odložený nebo zahozený." : " — portfolio vypadá v pořádku."}
            </div>
          ) : (
            <>
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
                        {items.map((r) => (
                          <Card key={r.id} r={r} today={today} propertyName={propertyName(r.propertyId)}
                            menuOpen={menuFor === r.id}
                            onMenu={(v) => setMenuFor(v ? r.id : null)}
                            onSetState={onSetState} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {hidden.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div onClick={() => setShowHidden((v) => !v)} style={{ fontSize: 13, fontWeight: 700, color: "#7c8378", marginBottom: 8, cursor: "pointer" }}>
                Skryté ({hidden.length}) {showHidden ? "▾" : "▸"}
              </div>
              {showHidden && (
                <div style={{ display: "grid", gap: 8 }}>
                  {hidden.map(({ rec, state }) => (
                    <div key={rec.id} style={{ background: "#f0ebdc", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#3a4a40" }}>{rec.title}</div>
                        <div style={{ fontSize: 12, color: "#7c8378" }}>
                          {state.state === "dismissed" ? "Zahozeno" : `Odloženo do ${fmtDate(state.snoozed_until ?? "")}`}
                        </div>
                      </div>
                      <button type="button" onClick={() => onRestore(rec.id)}
                        style={{ background: "#1f3d2e", color: "#f5f1e6", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Obnovit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

function Card({ r, today, propertyName, menuOpen, onMenu, onSetState }: {
  r: Recommendation;
  today: Date;
  propertyName: string | null;
  menuOpen: boolean;
  onMenu: (open: boolean) => void;
  onSetState: Props["onSetState"];
}) {
  const meta = SEVERITY_META[r.severity];
  const s30 = snoozeUntil(r, 30, today);
  const s90 = snoozeUntil(r, 90, today);
  const item = (label: string, hint: string | null, onClick: () => void, danger = false) => (
    <button type="button" onClick={() => { onClick(); onMenu(false); }}
      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 14px", fontSize: 13, cursor: "pointer", color: danger ? "#c0392b" : "#1c2b22" }}>
      <div>{label}</div>
      {hint && <div style={{ fontSize: 11, color: "#7c8378" }}>{hint}</div>}
    </button>
  );
  return (
    <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "14px 18px", borderLeft: `3px solid ${meta.color}`, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{r.title}</div>
          <div style={{ fontSize: 12, color: "#7c8378", marginTop: 2 }}>
            {CATEGORY_LABEL[r.category]}
            {propertyName ? ` · ${propertyName.trim()}` : ""}
            {r.daysLeft != null && r.daysLeft >= 0 ? ` · za ${r.daysLeft} dní` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {r.impactCzkMonth != null && r.impactCzkMonth !== 0 && (
            <div style={{ textAlign: "right", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: r.impactCzkMonth < 0 ? "#c0392b" : "#1f3d2e" }}>
              {r.impactCzkMonth < 0 ? "−" : "+"}{fmt(Math.abs(r.impactCzkMonth))} Kč/měs
            </div>
          )}
          <button type="button" aria-label="Akce s doporučením" onClick={() => onMenu(!menuOpen)}
            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: menuOpen ? "#e6e0d0" : "transparent", cursor: "pointer", fontSize: 18, lineHeight: 1, color: "#7c8378" }}>
            ⋯
          </button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#3a4a40", marginTop: 8, lineHeight: 1.5 }}>{r.why}</div>
      <div style={{ fontSize: 13, color: "#1f3d2e", marginTop: 6, fontWeight: 600 }}>→ {r.action}</div>
      {menuOpen && (
        <>
          <div onClick={() => onMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
          <div style={{ position: "absolute", right: 14, top: 44, zIndex: 21, background: "#fffdf6", border: "1px solid #d9d3c0", borderRadius: 10, boxShadow: "0 6px 20px rgba(31,61,46,0.15)", minWidth: 210, padding: "4px 0" }}>
            {item("Odložit na 30 dní", s30.shortened ? `Vrátí se ${fmtDate(s30.until)}, před termínem` : `Vrátí se ${fmtDate(s30.until)}`, () => onSetState(r, "snoozed", s30.until))}
            {item("Odložit na 90 dní", s90.shortened ? `Vrátí se ${fmtDate(s90.until)}, před termínem` : `Vrátí se ${fmtDate(s90.until)}`, () => onSetState(r, "snoozed", s90.until))}
            {item("Zahodit", r.dueDate ? "Ukáže se znovu při změně termínu" : "Už se nebude zobrazovat", () => onSetState(r, "dismissed", null), true)}
          </div>
        </>
      )}
    </div>
  );
}
