"use client";

import React, { useMemo, useState } from "react";
import { createClient } from "@/lib/auth";

export type Listing = {
  id: string;
  url: string | null;
  source: string;
  title: string;
  city: string | null;
  price: number | null;
  area_m2: number | null;
  disposition: string | null;
  property_type: string | null;
  ownership: string | null;
  building_condition: string | null;
  energy_rating: string | null;
  description: string | null;
  image_url: string | null;
  estimated_rent: number | null;
  estimated_costs: number | null;
  status: "watching" | "contacted" | "viewing" | "offer" | "rejected" | "purchased";
  notes: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Listing["status"], string> = {
  watching: "Sleduji",
  contacted: "Kontaktováno",
  viewing: "Prohlídka",
  offer: "Nabídka podána",
  rejected: "Zavrženo",
  purchased: "Koupeno",
};
const STATUS_COLOR: Record<Listing["status"], string> = {
  watching: "#7c8378",
  contacted: "#a07b2f",
  viewing: "#a07b2f",
  offer: "#1f3d2e",
  rejected: "#c0392b",
  purchased: "#1f3d2e",
};

const fmt = (n: number) => Math.round(n).toLocaleString("cs-CZ");

const grossYieldPct = (l: Listing) => (l.price && l.estimated_rent ? ((l.estimated_rent * 12) / l.price) * 100 : null);
const pricePerM2 = (l: Listing) => (l.price && l.area_m2 ? l.price / l.area_m2 : null);

type SortKey = "price" | "area_m2" | "pricePerM2" | "yield" | "created_at";

type Props = { listings: Listing[]; onChanged: () => void };

export default function Listings({ listings, onChanged }: Props) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Listing["status"] | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const visible = statusFilter === "all" ? listings : listings.filter((l) => l.status === statusFilter);
  const sorted = useMemo(() => {
    const value = (l: Listing) => {
      if (sortKey === "pricePerM2") return pricePerM2(l);
      if (sortKey === "yield") return grossYieldPct(l);
      if (sortKey === "created_at") return new Date(l.created_at).getTime();
      return l[sortKey];
    };
    return [...visible].sort((a, b) => {
      const av = value(a), bv = value(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * sortDir;
    });
  }, [visible, sortKey, sortDir]);

  function sortBy(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  }

  async function updateStatus(id: string, status: Listing["status"]) {
    await supabase.from("listings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    onChanged();
  }
  async function remove(id: string) {
    if (!confirm("Smazat tento inzerát?")) return;
    await supabase.from("listings").delete().eq("id", id);
    onChanged();
  }

  const th = (label: string, key: SortKey) => (
    <th onClick={() => sortBy(key)} style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#7c8378", textAlign: "left", cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}{sortKey === key ? (sortDir === 1 ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", cursor: "pointer", background: "#f5f1e6", borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>Inzeráty</div>
        <span style={{ fontSize: 12, color: "#7c8378" }}>{listings.length} sledovaných</span>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); setShowAdd(true); }}
          style={{ background: "#1f3d2e", color: "#f5f1e6", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Přidat inzerát
        </button>
        <span style={{ fontSize: 12, color: "#7c8378" }}>{open ? "Sbalit ▴" : "Zobrazit ▾"}</span>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Listing["status"] | "all")}
              style={{ border: "1px solid #d9d3c0", background: "#f5f1e6", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#1c2b22" }}>
              <option value="all">Všechny stavy</option>
              {(Object.keys(STATUS_LABEL) as Listing["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>

          {sorted.length === 0 ? (
            <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "18px 20px", color: "#7c8378", fontSize: 14 }}>
              Žádné inzeráty. Klikni na „+ Přidat inzerát“.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "6px 10px", fontSize: 12, color: "#7c8378", textAlign: "left" }}>Inzerát</th>
                    {th("Cena", "price")}
                    {th("Plocha", "area_m2")}
                    {th("Kč/m²", "pricePerM2")}
                    {th("Výnos", "yield")}
                    <th style={{ padding: "6px 10px", fontSize: 12, color: "#7c8378", textAlign: "left" }}>Stav</th>
                    <th style={{ padding: "6px 10px" }} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((l) => {
                    const ppm2 = pricePerM2(l);
                    const y = grossYieldPct(l);
                    return (
                      <tr key={l.id} style={{ borderTop: "1px solid #e6e0d0" }}>
                        <td style={{ padding: "8px 10px", maxWidth: 260 }}>
                          <div style={{ fontWeight: 600, color: "#1c2b22", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ fontSize: 12, color: "#7c8378" }}>
                            {l.city ?? "—"}{l.disposition ? ` · ${l.disposition}` : ""}
                            {l.url && <> · <a href={l.url} target="_blank" rel="noreferrer" style={{ color: "#1f3d2e" }}>odkaz</a></>}
                          </div>
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{l.price != null ? `${fmt(l.price)} Kč` : "—"}</td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{l.area_m2 != null ? `${l.area_m2} m²` : "—"}</td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{ppm2 != null ? `${fmt(ppm2)} Kč` : "—"}</td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap", color: y != null ? "#1f3d2e" : "#7c8378", fontWeight: y != null ? 600 : 400 }}>
                          {y != null ? `${y.toFixed(1)} %` : "vyplň nájem"}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value as Listing["status"])}
                            style={{ border: "1px solid #d9d3c0", background: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 12, color: STATUS_COLOR[l.status], fontWeight: 600 }}>
                            {(Object.keys(STATUS_LABEL) as Listing["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <button type="button" onClick={() => remove(l.id)} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 12 }}>Smazat</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAdd && <AddListingModal supabase={supabase} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onChanged(); }} />}
    </div>
  );
}

type ParsedListing = {
  source: string; url: string; title: string | null; city: string | null; price: number | null;
  area_m2: number | null; disposition: string | null; property_type: string | null; ownership: string | null;
  building_condition: string | null; energy_rating: string | null; description: string | null; image_url: string | null;
};

function AddListingModal({ supabase, onClose, onSaved }: {
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [disposition, setDisposition] = useState("");
  const [estimatedRent, setEstimatedRent] = useState("");
  const [estimatedCosts, setEstimatedCosts] = useState("");
  const [notes, setNotes] = useState("");
  const [parsed, setParsed] = useState<ParsedListing | null>(null);

  async function fetchFromUrl() {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/parse-listing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const data = await res.json();
      if (!res.ok) { setFetchError(data.error ?? "Nepodařilo se stáhnout inzerát."); setManual(true); return; }
      const l: ParsedListing = data.listing;
      setParsed(l);
      setTitle(l.title ?? "");
      setCity(l.city ?? "");
      setPrice(l.price != null ? String(l.price) : "");
      setArea(l.area_m2 != null ? String(l.area_m2) : "");
      setDisposition(l.disposition ?? "");
      setManual(true); // odemkne editaci/uložení
    } catch (err) {
      console.error(err);
      setFetchError("Nepodařilo se stáhnout inzerát.");
      setManual(true);
    } finally {
      setFetching(false);
    }
  }

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("listings").insert({
      user_id: user!.id,
      url: url.trim() || null,
      source: parsed?.source ?? (url.includes("sreality.cz") ? "sreality" : "other"),
      title: title.trim(),
      city: city.trim() || null,
      price: price ? Number(price) : null,
      area_m2: area ? Number(area) : null,
      disposition: disposition.trim() || null,
      property_type: parsed?.property_type ?? null,
      ownership: parsed?.ownership ?? null,
      building_condition: parsed?.building_condition ?? null,
      energy_rating: parsed?.energy_rating ?? null,
      description: parsed?.description ?? null,
      image_url: parsed?.image_url ?? null,
      estimated_rent: estimatedRent ? Number(estimatedRent) : null,
      estimated_costs: estimatedCosts ? Number(estimatedCosts) : null,
      notes: notes.trim() || null,
    });
    if (error) { alert("Chyba: " + error.message); setSaving(false); return; }
    onSaved();
  }

  const field = (label: string, value: string, onChange: (v: string) => void, type = "text", placeholder = "") => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "28px 28px 24px", width: 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: "#1c2b22", marginBottom: 20 }}>Nový inzerát</div>

        {!manual && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Odkaz na inzerát (sreality.cz)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={url} placeholder="https://www.sreality.cz/detail/..." onChange={(e) => setUrl(e.target.value)}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none" }} />
              <button onClick={fetchFromUrl} disabled={fetching || !url.trim()}
                style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: fetching || !url.trim() ? 0.6 : 1 }}>
                {fetching ? "Stahuji…" : "Stáhnout"}
              </button>
            </div>
            {fetchError && <div style={{ color: "#c0392b", fontSize: 12, marginTop: 6 }}>{fetchError}</div>}
            <button onClick={() => setManual(true)} style={{ marginTop: 10, background: "none", border: "none", color: "#7c8378", fontSize: 12, textDecoration: "underline", cursor: "pointer" }}>
              Vyplnit ručně bez odkazu
            </button>
          </>
        )}

        {manual && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {parsed && !fetchError && (
              <div style={{ fontSize: 12, color: "#1f3d2e", background: "#d6e4d6", borderRadius: 8, padding: "8px 10px" }}>
                Data stažena automaticky — zkontroluj a doplň nájem a náklady.
              </div>
            )}
            {field("Název", title, setTitle, "text", "např. Byt 3+1 Most")}
            {field("Adresa / obec", city, setCity)}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>{field("Cena (Kč)", price, setPrice, "number")}</div>
              <div style={{ flex: 1 }}>{field("Plocha (m²)", area, setArea, "number")}</div>
            </div>
            {field("Dispozice", disposition, setDisposition, "text", "např. 3+1")}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>{field("Odhad nájmu (Kč/měs)", estimatedRent, setEstimatedRent, "number")}</div>
              <div style={{ flex: 1 }}>{field("Odhad náklady (Kč/měs)", estimatedCosts, setEstimatedCosts, "number")}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Poznámka</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", color: "#5c6359", cursor: "pointer" }}>
            Zrušit
          </button>
          {manual && (
            <button onClick={save} disabled={saving || !title.trim()}
              style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 600, opacity: saving || !title.trim() ? 0.6 : 1 }}>
              {saving ? "Ukládám…" : "Uložit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
