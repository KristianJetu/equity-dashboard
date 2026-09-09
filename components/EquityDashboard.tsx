"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/auth";

type Property = {
  id: string;
  name: string;
  address: string | null;
  bank: string | null;
  type?: string | null;
  ownership_type?: string | null;
  status: "rented" | "vacant" | "planned";
  rent_amount: number;
  estimated_value: number;
  sort_order?: number | null;
  rent_due_day?: number;
  rent_timing?: "advance" | "current";
  purchase_date?: string | null;
  purchase_price?: number | null;
  annual_growth_pct?: number | null;
  lease_start?: string | null;
  lease_end?: string | null;
  insurance_company?: string | null;
  insurance_from?: string | null;
  insurance_to?: string | null;
  insurance_amount?: number | null;
  insurance_url?: string | null;
  document_url?: string | null;
  monthly_costs?: number | null;
  management_fee?: number | null;
  notes?: string | null;
};

type PropertyFile = {
  id: string;
  user_id: string;
  property_id: string | null;
  bucket: string;
  path: string;
  name: string;
  size: number | null;
  mime_type: string | null;
  category: "contract" | "insurance" | "photo" | "other";
  note: string | null;
  created_at: string;
};

type PropertyValuation = {
  id: string;
  user_id: string;
  property_id: string;
  value: number;
  valuation_date: string;
  note: string | null;
  created_at: string;
};

type Mortgage = {
  id: string;
  property_id: string;
  bank: string | null;
  outstanding_balance: number;
  monthly_payment: number;
  refix_date: string | null;
  loan_amount?: number | null;
  loan_start_date?: string | null;
  interest_rate?: number | null;
  loan_term_years?: number | null;
};

type Payment = {
  id: string;
  property_id: string | null;
  month: string;
  payment_date?: string | null;
  rent_received: number;
  mortgage_payment: number;
  net_cashflow: number;
  status: string;
  sender_name?: string;
  sender_account?: string;
  match_type?: string;
  payment_type?: string;
  raw_email_text?: string;
};

type Tenant = {
  id: string;
  account_number: string;
  name: string;
  property_id: string | null;
  notes?: string | null;
};

type Message = {
  id: string;
  property_id: string;
  channel: "whatsapp" | "email" | "sms" | "other";
  direction: "inbound" | "outbound";
  content: string;
  created_at: string;
};

type Debt = {
  id: string;
  direction: "i_owe" | "they_owe";
  name: string;
  amount_original: number;
  amount_remaining: number;
  monthly_payment?: number | null;
  interest_rate?: number | null;
  note?: string | null;
  due_date?: string | null;
};

type ProjectionPlanSettings = {
  profile: { birthYear: string; incomeEmployment: string; incomeOther: string; householdCosts: string; assumedLtvPct: string };
  projection: ProjectionSettings;
};
type ProjectionPlan = {
  id: string;
  user_id: string;
  label: string | null;
  settings: ProjectionPlanSettings;
  points: SimPt[];
  status: "active" | "superseded" | "archived";
  supersedes_id: string | null;
  created_at: string;
};

const translations = {
  cs: {
    dashboard: "Dashboard",
    nemovitosti: "Nemovitosti",
    platby: "Platby",
    najemnici: "Nájemníci",
    komunikace: "Komunikace",
    asistent: "Asistent",
    dluhy: "Půjčky",
    ukoly: "Úkoly",
    nastaveni: "Nastavení",
    majetek: "Majetek",
    tveNemovitosti: "Tvé nemovitosti",
    mesicniCashflow: "Měsíční cashflow",
    komunikaceSNajemniky: "Komunikace s nájemníky",
    jazykAplikace: "Jazyk aplikace",
    jazykPopis: "Rozhraní je zatím jen v češtině — přepínač si uloží tvou preferenci pro budoucí anglickou verzi.",
    cestina: "Čeština",
    anglictina: "English",
    zavrit: "Zavřít",
    tvujVlastniKapital: "Tvůj vlastní kapitál",
    bezDluhu: "Bez půjček",
    vcBilanceZDluhy: "Vč. bilance z Půjček",
    bilanceZDluhy: "bilance z Půjček",
    hodnotaPortfolia: "Hodnota portfolia",
    vlastniKapital: "Vlastní kapitál",
    uveryNaNemovitosti: "Úvěry na nemovitosti",
    konecFixaceHypoteky: "Konec fixace hypotéky",
    konecPojistky: "Konec pojistky",
    konecNajemniSmlouvy: "Konec nájemní smlouvy",
    dnes: "dnes!",
    zitra: "zítra",
    zaDni: (n: number) => `za ${n} dní`,
    pridat: "+ Přidat",
    realne: "Reálné",
    planovane: "Plánované",
    spravovano: "Spravováno",
    planovanaBadge: "plánovaná",
    typDum: "Dům",
    typGaraz: "Garáž",
    typPozemek: "Pozemek",
    typKomercni: "Komerční",
    typOstatni: "Ostatní",
    najemMesicne: (kc: string) => `Nájem ${kc} Kč / měs`,
    splatkaX: (kc: string) => `Splátka ${kc} Kč`,
    konecFixaceX: (d: string) => `Konec fixace ${d}`,
    konecFixaceZaDni: (d: number, date: string) => `⚠ Konec fixace za ${d} dní (${date})`,
    dluhHodnota: (dluh: string, hodnota: string) => `Dluh ${dluh} mil · Hodnota ${hodnota} mil`,
    prijmy: "Příjmy",
    vydaje: "Výdaje",
    cistyCashflow: "Čistý cashflow",
    zTohoPlanovane: (kc: string) => `z toho +${kc} Kč plánované`,
    mesicne: "měsíčně",
    planZkr: "plán.",
    planNajemZkr: "Plán. nájem",
    najem: "Nájem",
    splatka: "Splátka",
    pojistne: "Pojistné",
    naklady: "Náklady",
    prijem: "Příjem",
    planPrijemLower: "plán. příjem",
    prijemLower: "příjem",
    vydajeLower: "výdaje",
    planovanyNajem: "Plánovaný nájem",
    splatkaHypoteky: "Splátka hypotéky",
    pridatPlatbu: "+ Přidat platbu",
    najemPoSplatnosti: (n: number) => `Nájem po splatnosti o ${n} ${n === 1 ? "den" : n < 5 ? "dny" : "dní"}`,
    platbaPrijdeZaDni: (n: number) => `Platba za nájem má přijít za ${n} ${n === 1 ? "den" : n < 5 ? "dny" : "dní"}`,
    historiePlateb: "Historie plateb",
    kalendarPlateb: "Kalendář plateb",
    zaplacenoLabel: "Zaplaceno",
    nezaplacenoLabel: "Nezaplaceno",
    nadchaziLabel: "Nadchází",
  },
  en: {
    dashboard: "Dashboard",
    nemovitosti: "Properties",
    platby: "Payments",
    najemnici: "Tenants",
    komunikace: "Communication",
    asistent: "Assistant",
    dluhy: "Loans",
    ukoly: "Tasks",
    nastaveni: "Settings",
    majetek: "Net worth",
    tveNemovitosti: "Your properties",
    mesicniCashflow: "Monthly cashflow",
    komunikaceSNajemniky: "Tenant communication",
    jazykAplikace: "App language",
    jazykPopis: "The interface is currently Czech-only — this toggle saves your preference for the upcoming English version.",
    cestina: "Czech",
    anglictina: "English",
    zavrit: "Close",
    tvujVlastniKapital: "Your net worth",
    bezDluhu: "Excl. loans",
    vcBilanceZDluhy: "Incl. loans balance",
    bilanceZDluhy: "loans balance",
    hodnotaPortfolia: "Portfolio value",
    vlastniKapital: "Net worth",
    uveryNaNemovitosti: "Property loans",
    konecFixaceHypoteky: "Mortgage fixation ending",
    konecPojistky: "Insurance ending",
    konecNajemniSmlouvy: "Lease ending",
    dnes: "today!",
    zitra: "tomorrow",
    zaDni: (n: number) => `in ${n} days`,
    pridat: "+ Add",
    realne: "Active",
    planovane: "Planned",
    spravovano: "Managed",
    planovanaBadge: "planned",
    typDum: "House",
    typGaraz: "Garage",
    typPozemek: "Land",
    typKomercni: "Commercial",
    typOstatni: "Other",
    najemMesicne: (kc: string) => `Rent ${kc} Kč / mo`,
    splatkaX: (kc: string) => `Payment ${kc} Kč`,
    konecFixaceX: (d: string) => `Fixation ends ${d}`,
    konecFixaceZaDni: (d: number, date: string) => `⚠ Fixation ends in ${d} days (${date})`,
    dluhHodnota: (dluh: string, hodnota: string) => `Loan ${dluh}M · Value ${hodnota}M`,
    prijmy: "Income",
    vydaje: "Expenses",
    cistyCashflow: "Net cashflow",
    zTohoPlanovane: (kc: string) => `of which +${kc} Kč planned`,
    mesicne: "monthly",
    planZkr: "plan.",
    planNajemZkr: "Planned rent",
    najem: "Rent",
    splatka: "Payment",
    pojistne: "Insurance",
    naklady: "Costs",
    prijem: "Income",
    planPrijemLower: "planned income",
    prijemLower: "income",
    vydajeLower: "expenses",
    planovanyNajem: "Planned rent",
    splatkaHypoteky: "Mortgage payment",
    pridatPlatbu: "+ Add payment",
    najemPoSplatnosti: (n: number) => `Rent overdue by ${n} day${n === 1 ? "" : "s"}`,
    platbaPrijdeZaDni: (n: number) => `Rent payment expected in ${n} day${n === 1 ? "" : "s"}`,
    historiePlateb: "Payment history",
    kalendarPlateb: "Payment calendar",
    zaplacenoLabel: "Paid",
    nezaplacenoLabel: "Unpaid",
    nadchaziLabel: "Upcoming",
  },
} as const;

const NAV_ITEMS = [
  {
    id: "dashboard", title: "Dashboard",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  },
  {
    id: "nemovitosti", title: "Nemovitosti",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l6-4 6 4v13" /><path d="M15 21V11l6 4v6" /><line x1="2" y1="21" x2="22" y2="21" /></svg>,
  },
  {
    id: "platby", title: "Platby",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="11" y2="15" /></svg>,
  },
  {
    id: "najemnici", title: "Nájemníci",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: "komunikace", title: "Komunikace",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    id: "asistent", title: "Asistent",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.8-5.4A8.5 8.5 0 1 1 21 11.5z" /></svg>,
  },
  {
    id: "dluhy", title: "Půjčky",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  {
    id: "ukoly", title: "Úkoly",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    id: "nastaveni", title: "Nastavení",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
];

function statusBadge(status: string, lang: "cs" | "en" = "cs") {
  if (status === "rented") return { label: lang === "cs" ? "Pronajato" : "Rented", cls: "text-[#1f3d2e] bg-[#d6e4d6]" };
  if (status === "vacant") return { label: lang === "cs" ? "Volné" : "Vacant", cls: "text-[#a07b2f] bg-[#efe3c6]" };
  return { label: lang === "cs" ? "Plánováno" : "Planned", cls: "text-[#7c8378] bg-[#e6e0d0]" };
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmt(n: number) { return new Intl.NumberFormat("cs-CZ").format(Math.round(n)); }
function fmtMil(n: number) { return (n / 1_000_000).toFixed(1).replace(".", ","); }
function monthLabel(dateStr: string) {
  const s = new Date(dateStr).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}
function daysLate(paymentDate: string, month: string, dueDay: number): number {
  const paid = new Date(paymentDate);
  const [year, mon] = month.split("-").map(Number);
  const due = new Date(year, mon - 1, dueDay);
  return Math.round((paid.getTime() - due.getTime()) / 86400000);
}
function matchTypeLabel(t?: string) {
  if (t === "auto") return { label: "Automaticky", color: "#1f3d2e", bg: "#d6e4d6" };
  if (t === "manual") return { label: "Ručně", color: "#a07b2f", bg: "#efe3c6" };
  return { label: "Nespárováno", color: "#c0392b", bg: "#fde8e8" };
}
function paymentTypeLabel(t?: string) {
  if (t === "deposit") return "Kauce";
  if (t === "partial") return "Částečná platba";
  if (t === "other") return "Ostatní";
  return "Nájem";
}

// ── Property Detail Modal ─────────────────────────────────────────────────────

// ── File Image Preview ────────────────────────────────────────────────────────
function FilePreview({ path, mimeType, supabase, onClick }: {
  path: string;
  mimeType: string | null;
  supabase: ReturnType<typeof createClient>;
  onClick: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage.from("property-files").createSignedUrl(path, 3600)
      .then(({ data }) => { if (data?.signedUrl) setUrl(data.signedUrl); });
  }, [path]);

  if (!url) return null;

  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType?.startsWith("image/");

  if (isImage) return (
    <div onClick={onClick} style={{ cursor: "pointer", width: "100%", height: 160, overflow: "hidden", background: "#f0ebe1" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );

  if (isPdf) return (
    <div style={{ position: "relative", width: "100%", height: 200, overflow: "hidden", background: "#f5f1e6", borderBottom: "1px solid #e8e2d6" }}>
      <iframe src={url} style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }} />
      <div onClick={onClick} style={{ position: "absolute", inset: 0, cursor: "pointer" }} />
    </div>
  );

  return null;
}

// ── Property Files Tab ────────────────────────────────────────────────────────
const FILE_CATEGORIES = [
  { value: "contract", label: "Smlouva" },
  { value: "insurance", label: "Pojistka" },
  { value: "photo", label: "Fotka" },
  { value: "other", label: "Ostatní" },
] as const;

function PropertyFilesTab({ propertyId, supabase }: {
  propertyId: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const [files, setFiles] = useState<PropertyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<PropertyFile["category"]>("contract");
  const [note, setNote] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [filterCat, setFilterCat] = useState<PropertyFile["category"] | "all">("all");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingNoteVal, setEditingNoteVal] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const dragOver = useRef<string | null>(null);

  async function loadFiles() {
    setLoading(true);
    const { data } = await supabase
      .from("property_files")
      .select("*")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setFiles(data ?? []);
    setLoading(false);
  }

  async function handleDrop(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const reordered = [...files];
    const from = reordered.findIndex(f => f.id === draggedId);
    const to = reordered.findIndex(f => f.id === targetId);
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    setFiles(reordered);
    await Promise.all(
      reordered.map((f, i) => supabase.from("property_files").update({ sort_order: i }).eq("id", f.id))
    );
  }

  async function getSignedUrl(path: string): Promise<string> {
    if (signedUrls[path]) return signedUrls[path];
    const { data } = await supabase.storage
      .from("property-files")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }));
      return data.signedUrl;
    }
    return "";
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(e.target.files ?? []);
    if (fileList.length === 0) return;
    const oversized = fileList.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      alert(`Tyto soubory překračují limit 10 MB:\n${oversized.map(f => f.name).join("\n")}`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    for (const file of fileList) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("property-files").upload(path, file);
      if (uploadErr) { alert("Chyba při nahrávání " + file.name + ": " + uploadErr.message); continue; }
      await supabase.from("property_files").insert({
        user_id: user.id, property_id: propertyId, bucket: "property-files",
        path, name: file.name, size: file.size, mime_type: file.type, category, note: note || null,
      });
    }
    setNote("");
    if (fileRef.current) fileRef.current.value = "";
    await loadFiles();
    setUploading(false);
  }

  async function handleDelete(f: PropertyFile) {
    if (!confirm(`Smazat soubor "${f.name}"?`)) return;
    await supabase.storage.from("property-files").remove([f.path]);
    await supabase.from("property_files").delete().eq("id", f.id);
    setFiles(prev => prev.filter(x => x.id !== f.id));
  }

  async function handleOpen(f: PropertyFile) {
    const url = await getSignedUrl(f.path);
    if (url) window.open(url, "_blank");
  }

  useEffect(() => { loadFiles(); }, [propertyId]);

  const catLabel = (c: string) => FILE_CATEGORIES.find(x => x.value === c)?.label ?? c;
  const fmtSize = (b: number | null) => b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : "";

  if (loading) return <div style={{ padding: 24, color: "#9a9483", textAlign: "center" }}>Načítám…</div>;

  return (
    <div>
      {/* Upload */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d6", padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Nahrát soubor</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {FILE_CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              style={{ padding: "5px 14px", borderRadius: 20, border: "1.5px solid", borderColor: category === c.value ? "#1f3d2e" : "#d2cab4", background: category === c.value ? "#1f3d2e" : "#faf8f3", color: category === c.value ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {c.label}
            </button>
          ))}
        </div>
        <input
          placeholder="Poznámka (volitelné)"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22", marginBottom: 10, boxSizing: "border-box" }}
        />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, background: uploading ? "#e8e2d6" : "#1f3d2e", color: "#f5f1e6", fontSize: 13, fontWeight: 600, cursor: uploading ? "default" : "pointer" }}>
          {uploading ? "Nahrávám…" : "Vybrat soubor"}
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Filter */}
      {files.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {([["all", "Vše"], ["contract", "Smlouvy"], ["insurance", "Pojistky"], ["photo", "Fotky"], ["other", "Ostatní"]] as const).map(([val, label]) => {
            const count = val === "all" ? files.length : files.filter(f => f.category === val).length;
            if (val !== "all" && count === 0) return null;
            return (
              <button key={val} onClick={() => setFilterCat(val)}
                style={{ padding: "4px 12px", borderRadius: 20, border: "1.5px solid", borderColor: filterCat === val ? "#1f3d2e" : "#d2cab4", background: filterCat === val ? "#1f3d2e" : "#faf8f3", color: filterCat === val ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {label} <span style={{ opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9a9483", fontSize: 13, padding: 24 }}>Žádné soubory</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {files.filter(f => filterCat === "all" || f.category === filterCat).map(f => {
            const hasPreview = f.mime_type?.startsWith("image/") || f.mime_type === "application/pdf";
            return (
            <div key={f.id}
              draggable
              onDragStart={() => { dragOver.current = f.id; }}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={() => { if (dragOver.current) handleDrop(dragOver.current, f.id); dragOver.current = null; }}
              style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e2d6", overflow: "hidden", cursor: "grab" }}>
              {hasPreview && (
                <FilePreview path={f.path} mimeType={f.mime_type} supabase={supabase} onClick={() => handleOpen(f)} />
              )}
              <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ cursor: "grab", flexShrink: 0, opacity: 0.35, padding: "0 2px" }}>
                <svg width="12" height="16" viewBox="0 0 12 16" fill="#5c6359"><circle cx="4" cy="3" r="1.3"/><circle cx="8" cy="3" r="1.3"/><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="4" cy="13" r="1.3"/><circle cx="8" cy="13" r="1.3"/></svg>
              </div>
              {!hasPreview && (
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eef4ee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f3d2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1c2b22", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>
                  <span style={{ background: "#eef4ee", color: "#2d6a4f", borderRadius: 4, padding: "1px 6px", fontWeight: 600, marginRight: 6 }}>{catLabel(f.category)}</span>
                  {fmtSize(f.size)}
                  {editingNote === f.id ? (
                    <span style={{ marginLeft: 6 }} onClick={e => e.stopPropagation()}>
                      <input autoFocus value={editingNoteVal} onChange={e => setEditingNoteVal(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === "Enter") {
                            await supabase.from("property_files").update({ note: editingNoteVal || null }).eq("id", f.id);
                            setFiles(prev => prev.map(x => x.id === f.id ? { ...x, note: editingNoteVal || null } : x));
                            setEditingNote(null);
                          } else if (e.key === "Escape") { setEditingNote(null); }
                        }}
                        style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, border: "1px solid #d2cab4", width: 120 }} />
                    </span>
                  ) : (
                    <span onClick={e => { e.stopPropagation(); setEditingNote(f.id); setEditingNoteVal(f.note ?? ""); }}
                      style={{ marginLeft: 6, color: f.note ? "#7c8378" : "#c0b8a8", cursor: "text" }}>
                      · {f.note ?? "přidat poznámku"}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleOpen(f)}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #d2cab4", background: "#faf8f3", color: "#1c2b22", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Otevřít
                </button>
                <button onClick={() => handleDelete(f)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #f5c6c6", background: "#fff5f5", color: "#c0392b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  ×
                </button>
              </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Valuation history chart ───────────────────────────────────────────────────
function ValuationChart({ points }: { points: { ms: number; value: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (points.length < 2) return null;

  const W = 600, H = 150, PAD_L = 46, PAD_R = 10, PAD_T = 14, PAD_B = 20;
  const minMs = points[0].ms, maxMs = points[points.length - 1].ms;
  const totalMs = Math.max(maxMs - minMs, 1);
  const values = points.map(p => p.value);
  const minV = Math.min(...values), maxV = Math.max(...values);
  const pad = (maxV - minV) * 0.15 || maxV * 0.08 || 1;
  const lo = Math.max(0, minV - pad), hi = maxV + pad;
  const toX = (ms: number) => PAD_L + ((ms - minMs) / totalMs) * (W - PAD_L - PAD_R);
  const toY = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B);

  const linePts = points.map(p => `${toX(p.ms).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
  const fillPts = `${toX(minMs).toFixed(1)},${(H - PAD_B).toFixed(1)} ${linePts} ${toX(maxMs).toFixed(1)},${(H - PAD_B).toFixed(1)}`;
  const gridVals = Array.from({ length: 4 }, (_, i) => lo + (hi - lo) * i / 3);
  const showAllLabels = points.length <= 6;
  const labelPoints = showAllLabels ? points : [points[0], points[points.length - 1]];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const ms = minMs + ((svgX - PAD_L) / (W - PAD_L - PAD_R)) * totalMs;
    const idx = points.reduce((best, p, i) => Math.abs(p.ms - ms) < Math.abs(points[best].ms - ms) ? i : best, 0);
    setHoverIdx(idx);
  }

  const hp = hoverIdx !== null ? points[hoverIdx] : null;
  const hpX = hp ? toX(hp.ms) : 0;
  const tooltipRight = hpX > W * 0.6;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        style={{ display: "block", overflow: "visible", cursor: "crosshair" }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id="valfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c39a3f" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#c39a3f" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={toY(v).toFixed(1)} x2={W - PAD_R} y2={toY(v).toFixed(1)} stroke="#e8e2d6" strokeWidth="1" />
            <text x={PAD_L - 6} y={toY(v) + 3} textAnchor="end" fontSize="9" fill="#9a9483">{fmtMil(v)}M</text>
          </g>
        ))}
        <polygon points={fillPts} fill="url(#valfill)" />
        <polyline points={linePts} fill="none" stroke="#c39a3f" strokeWidth="2.5" />
        {points.map((p, i) => <circle key={i} cx={toX(p.ms).toFixed(1)} cy={toY(p.value).toFixed(1)} r="3.5" fill="#c39a3f" />)}
        {labelPoints.map((p, i) => (
          <text key={i} x={toX(p.ms).toFixed(1)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9a9483">
            {new Date(p.ms).toLocaleDateString("cs-CZ", { month: "numeric", year: "2-digit" })}
          </text>
        ))}
        {hp && <line x1={hpX.toFixed(1)} y1={PAD_T} x2={hpX.toFixed(1)} y2={H - PAD_B} stroke="#888" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />}
        {hp && <circle cx={hpX.toFixed(1)} cy={toY(hp.value).toFixed(1)} r="4.5" fill="#c39a3f" stroke="#fff" strokeWidth="1.5" />}
      </svg>
      {hp && (
        <div style={{
          position: "absolute", top: 0,
          ...(tooltipRight ? { right: `${((W - hpX) / W * 100).toFixed(1)}%` } : { left: `${(hpX / W * 100 + 1).toFixed(1)}%` }),
          background: "#1c2b22", color: "#f5f1e6", borderRadius: 8, padding: "6px 10px",
          fontSize: 11, fontWeight: 600, pointerEvents: "none", whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 10,
        }}>
          <div style={{ color: "#c9a24b", fontSize: 9, marginBottom: 2 }}>
            {new Date(hp.ms).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {fmt(hp.value)} Kč
        </div>
      )}
    </div>
  );
}

// ── Property Valuations Tab ───────────────────────────────────────────────────
function PropertyValuationsTab({ propertyId, currentValue, purchaseDate, purchasePrice, supabase, onValueChanged }: {
  propertyId: string;
  currentValue: number;
  purchaseDate?: string;
  purchasePrice?: string;
  supabase: ReturnType<typeof createClient>;
  onValueChanged: (newValue: number) => void;
}) {
  const [valuations, setValuations] = useState<PropertyValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState("");

  async function loadValuations() {
    setLoading(true);
    const { data } = await supabase
      .from("property_valuations")
      .select("*")
      .eq("property_id", propertyId)
      .order("valuation_date", { ascending: false });
    setValuations(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadValuations(); }, [propertyId]);

  async function handleAdd() {
    if (!newValue) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const value = Number(newValue);
    await supabase.from("property_valuations").insert({
      user_id: user.id, property_id: propertyId, value, valuation_date: newDate, note: newNote || null,
    });
    await supabase.from("properties").update({ estimated_value: value }).eq("id", propertyId);
    setNewValue("");
    setNewNote("");
    setNewDate(new Date().toISOString().slice(0, 10));
    await loadValuations();
    onValueChanged(value);
    setSaving(false);
  }

  async function handleDelete(v: PropertyValuation) {
    if (!confirm("Smazat toto ocenění?")) return;
    await supabase.from("property_valuations").delete().eq("id", v.id);
    setValuations(prev => prev.filter(x => x.id !== v.id));
  }

  if (loading) return <div style={{ padding: 24, color: "#9a9483", textAlign: "center" }}>Načítám…</div>;

  const chartPoints = (() => {
    const pts: { ms: number; value: number }[] = [];
    if (purchaseDate && purchasePrice) {
      const ms = new Date(purchaseDate).getTime();
      if (!isNaN(ms)) pts.push({ ms, value: Number(purchasePrice) });
    }
    for (const v of valuations) {
      const ms = new Date(v.valuation_date).getTime();
      if (!isNaN(ms)) pts.push({ ms, value: v.value });
    }
    return pts.sort((a, b) => a.ms - b.ms);
  })();

  return (
    <div>
      {chartPoints.length >= 2 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d6", padding: "16px 16px 6px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Vývoj hodnoty</div>
          <ValuationChart points={chartPoints} />
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e2d6", padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Přidat ocenění</div>
        <div style={{ fontSize: 11, color: "#9a9483", marginBottom: 10 }}>Aktuální hodnota: {fmt(currentValue)} Kč</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <input
            type="text" inputMode="numeric" placeholder="Nová hodnota (Kč)"
            value={newValue !== "" ? Number(newValue).toLocaleString("cs-CZ") : ""}
            onChange={e => setNewValue(e.target.value.replace(/\D/g, ""))}
            style={{ flex: "1 1 160px", padding: "8px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22" }} />
          <input
            type="date" lang="cs" value={newDate} onChange={e => setNewDate(e.target.value)}
            style={{ flex: "1 1 140px", padding: "8px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22" }} />
        </div>
        <input
          placeholder="Poznámka (např. odhad realitky, srovnání inzerátů)"
          value={newNote} onChange={e => setNewNote(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22", marginBottom: 10, boxSizing: "border-box" }} />
        <button onClick={handleAdd} disabled={saving || !newValue}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: saving || !newValue ? "#e8e2d6" : "#1f3d2e", color: "#f5f1e6", fontSize: 13, fontWeight: 600, cursor: saving || !newValue ? "default" : "pointer" }}>
          {saving ? "Ukládám…" : "+ Přidat ocenění"}
        </button>
      </div>

      {valuations.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9a9483", fontSize: 13, padding: 24 }}>Zatím žádná historie ocenění</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {valuations.map((v, i) => {
            const prev = valuations[i + 1];
            const diff = prev ? v.value - prev.value : null;
            return (
              <div key={v.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e2d6", padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1c2b22" }}>
                    {fmt(v.value)} Kč
                    {diff !== null && diff !== 0 && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: diff > 0 ? "#1f3d2e" : "#c0392b" }}>
                        {diff > 0 ? "+" : ""}{fmt(diff)} Kč
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>
                    {fmtDate(v.valuation_date)}{v.note ? ` · ${v.note}` : ""}
                  </div>
                </div>
                <button onClick={() => handleDelete(v)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #f5c6c6", background: "#fff5f5", color: "#c0392b", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Property Modal ────────────────────────────────────────────────────────────
function PropertyModal({ property, mortgage, supabase, onClose, onSaved, defaultTab = "details" }: {
  property: Property;
  mortgage: Mortgage | undefined;
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: () => void;
  defaultTab?: "details" | "files" | "valuations";
}) {
  const [name, setName] = useState(property.name);
  const [type, setType] = useState(property.type ?? "apartment");
  const [ownershipType, setOwnershipType] = useState(property.ownership_type ?? "owner");
  const [status, setStatus] = useState(property.status);
  const [estimatedValue, setEstimatedValue] = useState(String(property.estimated_value));
  const [rentAmount, setRentAmount] = useState(String(property.rent_amount));
  const [rentDueDay, setRentDueDay] = useState(String(property.rent_due_day ?? 15));
  const [rentTiming, setRentTiming] = useState<"advance" | "current">(property.rent_timing ?? "advance");
  const [purchaseDate, setPurchaseDate] = useState(property.purchase_date ?? "");
  const [purchasePrice, setPurchasePrice] = useState(String(property.purchase_price ?? ""));
  const [annualGrowthPct, setAnnualGrowthPct] = useState(String(property.annual_growth_pct ?? 3));
  const [monthlyPayment, setMonthlyPayment] = useState(String(mortgage?.monthly_payment ?? ""));
  const [refixDate, setRefixDate] = useState(mortgage?.refix_date ?? "");
  const [loanAmount, setLoanAmount] = useState(String(mortgage?.loan_amount ?? ""));
  const [outstandingBalance, setOutstandingBalance] = useState(String(mortgage?.outstanding_balance ?? ""));
  const [loanStartDate, setLoanStartDate] = useState(mortgage?.loan_start_date ?? "");
  const [interestRate, setInterestRate] = useState(String(mortgage?.interest_rate ?? ""));
  const [loanTermYears, setLoanTermYears] = useState(String(mortgage?.loan_term_years ?? ""));
  const [leaseStart, setLeaseStart] = useState(property.lease_start ?? "");
  const [leaseEnd, setLeaseEnd] = useState(property.lease_end ?? "");
  const [insuranceCompany, setInsuranceCompany] = useState(property.insurance_company ?? "");
  const [insuranceFrom, setInsuranceFrom] = useState(property.insurance_from ?? "");
  const [insuranceTo, setInsuranceTo] = useState(property.insurance_to ?? "");
  const [insuranceAmount, setInsuranceAmount] = useState(String(property.insurance_amount ?? ""));
  const [insuranceUrl, setInsuranceUrl] = useState(property.insurance_url ?? "");
  const [documentUrl, setDocumentUrl] = useState(property.document_url ?? "");
  const [monthlyCosts, setMonthlyCosts] = useState(String(property.monthly_costs ?? ""));
  const [managementFee, setManagementFee] = useState(String(property.management_fee ?? ""));
  const [notes, setNotes] = useState(property.notes ?? "");
  const [addMortgage, setAddMortgage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "files" | "valuations">(defaultTab);

  async function handleSave() {
    setSaving(true);
    await supabase.from("properties").update({
      name, status, type, ownership_type: ownershipType,
      estimated_value: Number(estimatedValue),
      rent_amount: Number(rentAmount),
      rent_due_day: Number(rentDueDay),
      rent_timing: rentTiming,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? Number(purchasePrice) : null,
      annual_growth_pct: annualGrowthPct ? Number(annualGrowthPct) : 3,
      lease_start: leaseStart || null,
      lease_end: leaseEnd || null,
      insurance_company: insuranceCompany || null,
      insurance_from: insuranceFrom || null,
      insurance_to: insuranceTo || null,
      insurance_amount: insuranceAmount ? Number(insuranceAmount) : null,
      insurance_url: insuranceUrl || null,
      document_url: documentUrl || null,
      monthly_costs: monthlyCosts ? Number(monthlyCosts) : null,
      management_fee: managementFee ? Number(managementFee) : null,
      notes: notes || null,
    }).eq("id", property.id);
    if (mortgage) {
      const { error: mortErr } = await supabase.from("mortgages").update({
        monthly_payment: Number(monthlyPayment),
        outstanding_balance: outstandingBalance ? Number(outstandingBalance) : mortgage.outstanding_balance,
        refix_date: refixDate || null,
        loan_amount: loanAmount ? Number(loanAmount) : null,
        loan_start_date: loanStartDate || null,
        interest_rate: interestRate ? Number(interestRate) : null,
        loan_term_years: loanTermYears ? Number(loanTermYears) : null,
      }).eq("id", mortgage.id);
      if (mortErr) { console.error("mortgage save error:", mortErr); alert("Chyba při ukládání hypotéky: " + mortErr.message); setSaving(false); return; }
    } else if (addMortgage && loanAmount) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: mortErr } = await supabase.from("mortgages").insert({
        user_id: user!.id,
        property_id: property.id,
        bank: null,
        outstanding_balance: outstandingBalance ? Number(outstandingBalance) : Number(loanAmount),
        monthly_payment: Number(monthlyPayment) || 0,
        refix_date: refixDate || null,
        loan_amount: Number(loanAmount),
        loan_start_date: loanStartDate || null,
        interest_rate: interestRate ? Number(interestRate) : null,
        loan_term_years: loanTermYears ? Number(loanTermYears) : null,
      });
      if (mortErr) { console.error("mortgage insert error:", mortErr); alert("Chyba při přidávání hypotéky: " + mortErr.message); setSaving(false); return; }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onSaved(); onClose(); }, 800);
  }

  const field = (label: string, value: string, onChange: (v: string) => void, type = "number", suffix = "", hint = "") => {
    const isMoney = type === "money";
    const displayValue = isMoney && value !== "" ? Number(value).toLocaleString("cs-CZ") : value;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
        <div className="flex items-center gap-2">
          <input
            type={isMoney ? "text" : type}
            inputMode={isMoney ? "numeric" : undefined}
            value={isMoney ? displayValue : value}
            onChange={e => {
              if (isMoney) {
                const raw = e.target.value.replace(/\D/g, "");
                onChange(raw);
              } else {
                onChange(e.target.value);
              }
              setSaved(false);
            }}
            lang={type === "date" ? "cs" : undefined}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22" }} />
          {suffix && <span style={{ fontSize: 13, color: "#9a9483" }}>{suffix}</span>}
        </div>
        {hint && <div style={{ fontSize: 11, color: "#9a9483", marginTop: 5 }}>{hint}</div>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "clamp(18px, 5vw, 32px) clamp(18px, 5vw, 32px) clamp(16px, 4vw, 28px)", width: "min(640px, 92vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: "#1c2b22" }}>Detail nemovitosti</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9483", fontSize: 22 }}>×</button>
        </div>

        {/* Záložky */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#ede9de", borderRadius: 10, padding: 4 }}>
          {(["details", "valuations", "files"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#1c2b22" : "#9a9483", fontWeight: activeTab === tab ? 700 : 500, fontSize: 13, cursor: "pointer", boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {tab === "details" ? "Detaily" : tab === "valuations" ? "Ocenění" : "Soubory"}
            </button>
          ))}
        </div>

        {activeTab === "files" ? (
          <PropertyFilesTab propertyId={property.id} supabase={supabase} />
        ) : activeTab === "valuations" ? (
          <PropertyValuationsTab
            propertyId={property.id}
            currentValue={Number(estimatedValue)}
            purchaseDate={purchaseDate}
            purchasePrice={purchasePrice}
            supabase={supabase}
            onValueChanged={v => { setEstimatedValue(String(v)); onSaved(); }}
          />
        ) : (<>

        {field("Název nemovitosti", name, setName, "text")}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Typ</div>
          <select value={type} onChange={e => { setType(e.target.value); setSaved(false); }}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22" }}>
            <option value="apartment">Byt</option>
            <option value="house">Dům</option>
            <option value="garage">Garáž</option>
            <option value="land">Pozemek</option>
            <option value="commercial">Komerční</option>
            <option value="other">Ostatní</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Vlastnictví</div>
          <div className="flex gap-2">
            {(["owner", "manager"] as const).map(o => (
              <button key={o} onClick={() => { setOwnershipType(o); setSaved(false); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `2px solid ${ownershipType === o ? "#1f3d2e" : "#d2cab4"}`, background: ownershipType === o ? "#1f3d2e" : "transparent", color: ownershipType === o ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {o === "owner" ? "Vlastním" : "Spravuji"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Stav</div>
          <div className="flex gap-2">
            {(["rented", "vacant", "planned"] as const).map(s => (
              <button key={s} onClick={() => { setStatus(s); setSaved(false); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `2px solid ${status === s ? "#1f3d2e" : "#d2cab4"}`, background: status === s ? "#1f3d2e" : "transparent", color: status === s ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {s === "rented" ? "Pronajato" : s === "vacant" ? "Volné" : "Plánováno"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Poznámky</div>
          <textarea value={notes} onChange={e => { setNotes(e.target.value); setSaved(false); }} placeholder="Poznámky, technické info, kontakty…"
            style={{ width: "100%", minHeight: 200, padding: "10px 13px", borderRadius: 9, border: "1.5px solid #d2cab4", background: "#fff", fontSize: 15, color: "#1c2b22", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.8, outline: "none" }} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Nemovitost</div>
        {field("Hodnota nemovitosti", estimatedValue, setEstimatedValue, "money", "Kč")}
        {field("Výše nájmu", rentAmount, setRentAmount, "money", "Kč / měs")}
        {field("Den splatnosti nájmu", rentDueDay, setRentDueDay, "number", "v měsíci")}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Způsob platby nájmu</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["advance", "current"] as const).map(opt => (
              <button key={opt} onClick={() => { setRentTiming(opt); setSaved(false); }}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: `2px solid ${rentTiming === opt ? "#1f3d2e" : "#d2cab4"}`, background: rentTiming === opt ? "#1f3d2e" : "#fff", color: rentTiming === opt ? "#fff" : "#1c2b22", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                {opt === "advance" ? "Měsíc předem" : "V běžném měsíci"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9a9483", marginTop: 5 }}>
            {rentTiming === "advance" ? "Platba v srpnu = záříjový nájem" : "Platba 5. srpna = srpnový nájem"}
          </div>
        </div>
        {field("Datum koupě", purchaseDate, setPurchaseDate, "date")}
        {field("Kupní cena", purchasePrice, setPurchasePrice, "money", "Kč")}
        {field("Odhadovaný roční růst hodnoty", annualGrowthPct, setAnnualGrowthPct, "number", "% / rok")}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hypotéka</div>
          {!mortgage && !addMortgage && (
            <button onClick={() => setAddMortgage(true)}
              style={{ fontSize: 12, fontWeight: 600, color: "#1f3d2e", background: "none", border: "1px solid #1f3d2e", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
              + Přidat
            </button>
          )}
        </div>
        {(mortgage || addMortgage) && <>
          {field("Výše úvěru", loanAmount, setLoanAmount, "money", "Kč", "Historická částka půjčená bankou při čerpání — jen pro přehled, nepoužívá se ve výpočtech.")}
          {field("Zbývající dluh", outstandingBalance, setOutstandingBalance, "money", "Kč", "Aktuální nedoplatek — používá se pro výpočet vlastního kapitálu, LTV a výnosu na kapitál.")}
          {field("Datum čerpání", loanStartDate, setLoanStartDate, "date")}
          {field("Úroková sazba", interestRate, setInterestRate, "number", "%")}
          {field("Splatnost", loanTermYears, setLoanTermYears, "number", "let")}
          {field("Měsíční splátka", monthlyPayment, setMonthlyPayment, "money", "Kč / měs")}
          {field("Konec fixace", refixDate, setRefixDate, "date")}
        </>}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Nájemní smlouva</div>
        {field("Začátek nájmu", leaseStart, setLeaseStart, "date")}
        {field("Konec nájmu", leaseEnd, setLeaseEnd, "date")}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Pojištění</div>
        {field("Pojišťovna", insuranceCompany, setInsuranceCompany, "text")}
        {field("Platnost od", insuranceFrom, setInsuranceFrom, "date")}
        {field("Platnost do", insuranceTo, setInsuranceTo, "date")}
        {field("Roční pojistné", insuranceAmount, setInsuranceAmount, "money", "Kč / rok")}
        {field("Odkaz na smlouvu", insuranceUrl, setInsuranceUrl, "url")}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Dokumenty</div>
        {field("Odkaz na dokument", documentUrl, setDocumentUrl, "url")}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Náklady</div>
        {field("Měsíční náklady (paušál)", monthlyCosts, setMonthlyCosts, "money", "Kč / měs")}
        {ownershipType === "manager" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Správa</div>
            {field("Provize za správu", managementFee, setManagementFee, "money", "Kč / měs")}
            <div style={{ fontSize: 12, color: "#9a9483", marginTop: -8, marginBottom: 16 }}>Pouze tato částka se počítá do tvého cashflow. Nájem a náklady nemovitosti se nezahrnují.</div>
          </>
        )}

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 14, color: "#5c6359", cursor: "pointer" }}>Zavřít</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: saved ? "#2d6a4f" : "#1f3d2e", fontSize: 14, fontWeight: 600, color: "#f5f1e6", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saved ? "✓ Uloženo" : saving ? "Ukládám…" : "Uložit"}
          </button>
        </div>
        </>)}
      </div>
    </div>
  );
}

// ── Payment Detail Modal ──────────────────────────────────────────────────────
function PaymentModal({
  payment, properties, supabase, onClose, onSave, onDelete,
}: {
  payment: Payment;
  properties: Property[];
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSave: (paymentId: string, propertyId: string, rentReceived: number, paymentDate: string) => Promise<void>;
  onDelete: (paymentId: string) => Promise<void>;
}) {
  const [selectedProperty, setSelectedProperty] = useState(payment.property_id ?? "");
  const [rentReceived, setRentReceived] = useState(String(payment.rent_received));
  const [paymentDate, setPaymentDate] = useState(payment.payment_date ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const match = matchTypeLabel(payment.match_type);


  async function handleSave() {
    if (!selectedProperty || !rentReceived) return;
    setSaving(true);
    setError("");
    try {
      await onSave(payment.id, selectedProperty, Number(rentReceived), paymentDate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await onDelete(payment.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smazání se nezdařilo.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "clamp(18px, 5vw, 32px) clamp(18px, 5vw, 32px) clamp(16px, 4vw, 28px)", width: "min(560px, 92vw)", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: "#1c2b22" }}>
              Detail platby
            </div>
            <div style={{ fontSize: 13, color: "#7c8378", marginTop: 2 }}>{monthLabel(payment.month)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9483", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {/* Částky */}
        <div className="flex gap-3 mb-6">
          <div style={{ flex: 1, background: "#ece6d8", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Nájem (Kč)</div>
            <input type="number" value={rentReceived} onChange={e => setRentReceived(e.target.value)}
              style={{ width: "100%", border: "none", background: "transparent", fontWeight: 700, fontSize: 16, color: "#1f3d2e", padding: 0, outline: "none" }} />
          </div>
          <div style={{ flex: 1, background: "#ece6d8", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Výdaje</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#a07b2f" }}>−{fmt(payment.mortgage_payment)} Kč</div>
          </div>
          <div style={{ flex: 1, background: "#ece6d8", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Čistý zisk</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: payment.net_cashflow >= 0 ? "#1f3d2e" : "#c0392b" }}>
              {(Number(rentReceived || 0) - payment.mortgage_payment) >= 0 ? "+" : ""}{fmt(Number(rentReceived || 0) - payment.mortgage_payment)} Kč
            </div>
          </div>
        </div>

        {/* Datum platby */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Datum platby</div>
          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }} />
        </div>

        {/* Odesílatel + poznámky k nájemníkovi */}
        {(payment.sender_name || payment.sender_account) && (
          <div style={{ background: "#ece6d8", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Odesílatel</div>
            {payment.sender_name && <div style={{ fontSize: 14, fontWeight: 600, color: "#1c2b22" }}>{payment.sender_name}</div>}
            {payment.sender_account && <div style={{ fontSize: 13, color: "#7c8378", marginTop: 2 }}>Účet: {payment.sender_account}</div>}
          </div>
        )}

        {/* Tagy */}
        <div className="flex gap-2 mb-5">
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, color: match.color, background: match.bg }}>{match.label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, color: "#5c6359", background: "#e6e0d0" }}>{paymentTypeLabel(payment.payment_type)}</span>
        </div>

        {/* Přiřazení nemovitosti */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Přiřazená nemovitost</div>
          <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", cursor: "pointer" }}>
            <option value="">— Nevybráno —</option>
            {properties.filter(p => p.status !== "planned").map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Raw email */}
        {payment.raw_email_text && (
          <details style={{ marginBottom: 20 }}>
            <summary style={{ fontSize: 12, fontWeight: 600, color: "#9a9483", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>Původní email</summary>
            <pre style={{ fontSize: 11, color: "#7c8378", background: "#ece6d8", borderRadius: 8, padding: "12px", marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflowY: "auto" }}>
              {payment.raw_email_text}
            </pre>
          </details>
        )}

        {error && (
          <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: "#fde8e8", color: "#c0392b", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Akce */}
        <div className="flex gap-3 justify-between items-center">
          {confirmDelete ? (
            <div className="flex gap-2 items-center">
              <span style={{ fontSize: 13, color: "#c0392b", fontWeight: 600 }}>Opravdu smazat?</span>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#c0392b", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {deleting ? "Mažu…" : "Ano, smazat"}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 13, color: "#5c6359", cursor: "pointer" }}>
                Zrušit
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #f5c0c0", background: "transparent", fontSize: 14, color: "#c0392b", cursor: "pointer" }}>
              Smazat platbu
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 14, color: "#5c6359", cursor: "pointer" }}>
              Zavřít
            </button>
            <button onClick={handleSave} disabled={!selectedProperty || !rentReceived || saving}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: (selectedProperty && rentReceived) ? "#1f3d2e" : "#c5bfb0", fontSize: 14, fontWeight: 600, color: "#f5f1e6", cursor: (selectedProperty && rentReceived) ? "pointer" : "not-allowed" }}>
              {saving ? "Ukládám…" : "Uložit změny"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// ── Pokročilé nastavení Optimistické projekce (viz ProjectionSettingsModal) ───────
type ProjectionSettings = {
  dstiCap: number; // podíl splátek na uznaném příjmu, např. 0.70
  dtiCap: number; // násobek ročního příjmu, např. 7
  rentRecognition: number; // podíl nájmu uznaný bankou, např. 0.70
  salaryGrowth: number; // roční tempo růstu platu, např. 0.025
  rentGrowth: number; // roční tempo růstu nájmů, např. 0.04
  priceGrowth: number; // roční tempo zdražování další akvizice, např. 0.04
  newYield: number; // předpokládaný hrubý nájemní výnos nové nemovitosti, např. 0.049
  newLoanRate: number; // úroková sazba nových úvěrů, např. 0.0531
  stressAdd: number; // stress-test přirážka k sazbě, např. 0.02
  maxAge: number; // max. věk na konci splatnosti nového úvěru
  cooldownMonths: number; // min. rozestup mezi akvizicemi
  initialCash: number; // počáteční hotovost na akvizici (Kč)
  annualCash: number; // roční vklad vlastního kapitálu (Kč/rok)
  basePrice: number | null; // výchozí cena další akvizice (Kč); null = odvodit z hypoték
  includeDebts: boolean; // počítat i osobní půjčky do DSTI/DTI
};
const DEFAULT_PROJECTION_SETTINGS: ProjectionSettings = {
  dstiCap: 0.70, dtiCap: 7, rentRecognition: 0.70, salaryGrowth: 0.025, rentGrowth: 0.04,
  priceGrowth: 0.04, newYield: 0.049, newLoanRate: 0.0531, stressAdd: 0.02, maxAge: 70,
  cooldownMonths: 3, initialCash: 0, annualCash: 0, basePrice: null, includeDebts: true,
};

// Interpoluje hodnotu/dluh uloženého plánu k danému datu — pro srovnání "plán vs. realita".
function planValueAtMs(points: SimPt[], ms: number): { value: number; debt: number } | null {
  if (points.length === 0) return null;
  if (ms <= points[0].ms) return { value: points[0].value, debt: points[0].debt };
  if (ms >= points[points.length - 1].ms) return { value: points[points.length - 1].value, debt: points[points.length - 1].debt };
  for (let i = 1; i < points.length; i++) {
    if (points[i].ms >= ms) {
      const a = points[i - 1], b = points[i];
      const f = (ms - a.ms) / (b.ms - a.ms || 1);
      return { value: a.value + (b.value - a.value) * f, debt: a.debt + (b.debt - a.debt) * f };
    }
  }
  return null;
}

// ── Optimistic scenario: simulate future acquisitions funded by a mix of own capital and
// LTV-headroom refinancing, gated by DSTI/DTI tests derived from a real ČSOB mortgage offer.
type SimPt = { ms: number; value: number; debt: number; bought?: boolean };
type ProjectionPurchase = { price: number; cash: number; loan: number; rent: number; payment: number; ms: number };
type ProjectionYearRow = {
  year: number; age: number; value: number; debt: number; equity: number;
  income: number; debtService: number; dsti: number; dti: number; surplus: number;
  purchases: ProjectionPurchase[];
};
function simulateOptimisticAcquisitions(
  allPoints: SimPt[],
  nowMs: number,
  properties: Property[],
  mortgages: Mortgage[],
  debts: Debt[],
  birthYearStr: string,
  incomeEmploymentStr: string,
  incomeOtherStr: string,
  householdCostsStr: string,
  assumedLtvPctStr: string,
  settings: ProjectionSettings,
): { points: SimPt[]; rows: ProjectionYearRow[] } | null {
  const birthYear = Number(birthYearStr);
  if (!birthYear) return null;

  const YEAR_MS = 365 * 86400000;
  const ltv = (Number(assumedLtvPctStr) || 70) / 100;
  const incomeEmployment0 = Number(incomeEmploymentStr) || 0;
  const incomeOther0 = Number(incomeOtherStr) || 0;
  const costs0 = Number(householdCostsStr) || 0;
  const age0 = new Date(nowMs).getFullYear() - birthYear;

  const ownedProps = properties.filter(p => p.ownership_type !== "manager");
  const ownedRented = ownedProps.filter(p => p.status === "rented");
  const baseMonthlyRent = ownedRented.reduce((s, p) => s + p.rent_amount, 0);
  const baseMonthlyDebtService = mortgages.filter(m => ownedProps.some(p => p.id === m.property_id)).reduce((s, m) => s + m.monthly_payment, 0);
  const baseMonthlyOtherCosts = ownedProps.reduce((s, p) => s + (p.insurance_amount ? p.insurance_amount / 12 : 0) + (p.monthly_costs ?? 0), 0);

  // Velikost "příští" akvizice — buď zadaná ručně (Pokročilé nastavení projekce), nebo
  // odvozená z průměru posledních dvou hypoték; dál roste tempem priceGrowth.
  const recentLoans = mortgages
    .map(m => ({ amt: m.loan_amount ?? m.outstanding_balance, ms: m.loan_start_date ? new Date(m.loan_start_date).getTime() : 0 }))
    .filter(x => x.amt > 0)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 2);
  const autoBasePrice = recentLoans.length > 0 ? recentLoans.reduce((s, x) => s + x.amt, 0) / recentLoans.length : 3000000;
  let nextPurchasePrice = settings.basePrice ?? autoBasePrice;
  let cashPool = settings.initialCash;

  function monthlyPayment(principal: number, annualRate: number, termYears: number): number {
    const r = annualRate / 12, n = termYears * 12;
    if (n <= 0) return Infinity;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  // Osobní půjčky — hrubý odhad doby do splacení (zbývá / splátka), stejně jako v ověřovací
  // kalkulačce. Počítají se do DSTI/DTI jen když je includeDebts zapnuté.
  const debtEntries = settings.includeDebts
    ? debts.filter(d => (d.monthly_payment ?? 0) > 0).map(d => ({
        direction: d.direction,
        payment: d.monthly_payment as number,
        remaining0: d.amount_remaining,
        monthsLeft: Math.round(d.amount_remaining / (d.monthly_payment as number)),
      }))
    : [];

  type SimProp = { startMs: number; purchasePrice: number; rentMonthly: number; loanAmount: number; paymentMonthly: number; termMs: number };
  const simProps: SimProp[] = [];
  let lastPurchaseMonth = -Infinity;
  let prevMs = nowMs;
  let monthIdx = 0;

  const result: SimPt[] = [];
  const rows: ProjectionYearRow[] = [];
  let yearPurchases: ProjectionPurchase[] = [];
  for (const base of allPoints) {
    if (base.ms <= nowMs) continue;
    monthIdx++;
    const monthsElapsed = Math.max(0, (base.ms - prevMs) / (30 * 86400000));
    prevMs = base.ms;
    const yearsFromNow = (base.ms - nowMs) / YEAR_MS;
    const age = age0 + yearsFromNow;
    let boughtThisMonth = false;

    nextPurchasePrice *= Math.pow(1 + settings.priceGrowth, monthsElapsed / 12);
    cashPool += (settings.annualCash / 12) * monthsElapsed;

    let debtsService = 0, debtsIncome = 0, debtsBalance = 0;
    for (const d of debtEntries) {
      if (monthIdx > d.monthsLeft) continue;
      if (d.direction === "i_owe") { debtsService += d.payment; debtsBalance += Math.max(0, d.remaining0 - d.payment * monthIdx); }
      else debtsIncome += d.payment;
    }

    const salary = incomeEmployment0 * Math.pow(1 + settings.salaryGrowth, yearsFromNow) + incomeOther0;
    const baseRentNow = baseMonthlyRent * Math.pow(1 + settings.rentGrowth, yearsFromNow);
    const simRentTotal = simProps.reduce((s, sp) => s + (base.ms >= sp.startMs ? sp.rentMonthly * Math.pow(1 + settings.rentGrowth, (base.ms - sp.startMs) / YEAR_MS) : 0), 0);
    const simDebtServiceTotal = simProps.reduce((s, sp) => s + (base.ms >= sp.startMs ? sp.paymentMonthly : 0), 0);

    let simValue = 0, simDebt = 0;
    for (const sp of simProps) {
      if (base.ms < sp.startMs) continue;
      simValue += sp.purchasePrice * Math.pow(1.03, (base.ms - sp.startMs) / YEAR_MS);
      const payoffMs = sp.startMs + sp.termMs;
      simDebt += base.ms >= payoffMs ? 0 : Math.max(0, sp.loanAmount * (payoffMs - base.ms) / sp.termMs);
    }
    const totalValue = base.value + simValue;
    const totalDebt = base.debt + simDebt;

    const remainingTermYears = Math.min(30, Math.floor(settings.maxAge - age));

    if (remainingTermYears >= 5 && (monthIdx - lastPurchaseMonth) >= settings.cooldownMonths) {
      const purchasePrice = nextPurchasePrice;
      // Vlastní kapitál (počáteční hotovost + roční vklady) se použije jako záloha první;
      // zbytek ceny se financuje navýšeným dluhem (refinancováním stávajícího portfolia
      // v rámci LTV headroomu), ne samostatnou hypotékou jen na tu jednu nemovitost.
      const cashUsed = Math.min(cashPool, purchasePrice);
      const loanNeeded = purchasePrice - cashUsed;
      const ltvOk = (totalDebt + loanNeeded) <= ltv * (totalValue + purchasePrice);

      const stressPay = loanNeeded > 0 ? monthlyPayment(loanNeeded, settings.newLoanRate + settings.stressAdd, remainingTermYears) : 0;
      const realPay = loanNeeded > 0 ? monthlyPayment(loanNeeded, settings.newLoanRate, remainingTermYears) : 0;
      const rentEstimate = (purchasePrice * settings.newYield) / 12;
      const recognizedIncome = salary + settings.rentRecognition * (baseRentNow + simRentTotal + rentEstimate) + debtsIncome;
      const totalDebtSvc = baseMonthlyDebtService + simDebtServiceTotal + debtsService + stressPay;
      const dstiAfter = recognizedIncome > 0 ? totalDebtSvc / recognizedIncome : 1;
      const dtiAfter = recognizedIncome > 0 ? (totalDebt + debtsBalance + loanNeeded) / (recognizedIncome * 12) : 99;
      // Bankovní income test z reálné nabídky: příjem − splátka (stress-testovaná) − životní
      // náklady ≥ 0, plus stropy DSTI/DTI a LTV portfolia.
      if (ltvOk && recognizedIncome - totalDebtSvc - costs0 >= 0 && dstiAfter <= settings.dstiCap && dtiAfter <= settings.dtiCap) {
        simProps.push({ startMs: base.ms, purchasePrice, rentMonthly: rentEstimate, loanAmount: loanNeeded, paymentMonthly: realPay, termMs: remainingTermYears * YEAR_MS });
        cashPool -= cashUsed;
        lastPurchaseMonth = monthIdx;
        yearPurchases.push({ price: purchasePrice, cash: cashUsed, loan: loanNeeded, rent: rentEstimate, payment: realPay, ms: base.ms });
        boughtThisMonth = true;
      }
    }

    result.push({ ms: base.ms, value: totalValue, debt: totalDebt, bought: boughtThisMonth });

    const recognizedIncomeNow = salary + settings.rentRecognition * (baseRentNow + simRentTotal) + debtsIncome;
    const totalDebtSvcNow = baseMonthlyDebtService + simDebtServiceTotal + debtsService;
    if (monthIdx % 12 === 0) {
      rows.push({
        year: new Date(nowMs).getFullYear() + monthIdx / 12,
        age: Math.round(age),
        value: totalValue, debt: totalDebt, equity: totalValue - totalDebt,
        income: recognizedIncomeNow, debtService: totalDebtSvcNow,
        dsti: recognizedIncomeNow > 0 ? totalDebtSvcNow / recognizedIncomeNow : 0,
        dti: recognizedIncomeNow > 0 ? (totalDebt + debtsBalance) / (recognizedIncomeNow * 12) : 0,
        surplus: recognizedIncomeNow - totalDebtSvcNow - costs0,
        purchases: yearPurchases,
      });
      yearPurchases = [];
    }
  }
  return { points: result, rows };
}

// Budoucí trajektorie bez akvizic (jen organický růst existujících nemovitostí + amortizace
// existujících hypoték) — stejný vzorec jako "future" větev v GrowthChart, ale nezávislý na
// jeho rozsahu grafu, aby si náhled v ProjectionPreviewModal mohl zvolit vlastní horizont.
function buildFutureBaseline(properties: Property[], mortgages: Mortgage[], nowMs: number, horizonYears: number): SimPt[] {
  const YEAR_MS = 365 * 86400000;
  const totalMonths = Math.round(horizonYears * 12);
  const points: SimPt[] = [];
  for (let m = 1; m <= totalMonths; m++) {
    const ms = nowMs + (m / 12) * YEAR_MS;
    let value = 0, debt = 0;
    for (const p of properties) {
      const growth = (p.annual_growth_pct ?? 3) / 100;
      value += p.estimated_value * Math.pow(1 + growth, (ms - nowMs) / YEAR_MS);
      const mort = mortgages.find(mm => mm.property_id === p.id);
      if (mort) {
        const loanMs = mort.loan_start_date ? new Date(mort.loan_start_date).getTime() : (p.purchase_date ? new Date(p.purchase_date).getTime() : nowMs);
        const termMs = (mort.loan_term_years ?? 30) * YEAR_MS;
        const payoffMs = loanMs + termMs;
        if (ms < payoffMs) {
          const t = (ms - nowMs) / (payoffMs - nowMs || 1);
          debt += Math.max(0, mort.outstanding_balance * (1 - t));
        }
      }
    }
    points.push({ ms, value, debt });
  }
  return points;
}

// ── Projection Preview Modal ───────────────────────────────────────────────────
type ProjectionModalSave = {
  birthYear: string; incomeEmployment: string; incomeOther: string; householdCosts: string; assumedLtvPct: string;
  settings: ProjectionSettings;
};
function ProjectionPreviewModal({ properties, mortgages, debts, birthYear, incomeEmployment, incomeOther, householdCosts, assumedLtvPct, settings, lang, onClose, onSave, plans, onSavePlan, onArchivePlan }: {
  properties: Property[]; mortgages: Mortgage[]; debts: Debt[];
  birthYear: string; incomeEmployment: string; incomeOther: string; householdCosts: string; assumedLtvPct: string;
  settings: ProjectionSettings;
  lang: "cs" | "en";
  onClose: () => void;
  onSave: (next: ProjectionModalSave) => void;
  plans: ProjectionPlan[];
  onSavePlan: (settings: ProjectionPlanSettings, points: SimPt[], label?: string) => Promise<void>;
  onArchivePlan: (id: string) => Promise<void>;
}) {
  const t = (cs: string, en: string) => lang === "cs" ? cs : en;
  type PreviewForm = ProjectionSettings & {
    birthYear: string; incomeEmployment: string; incomeOther: string; householdCosts: string; assumedLtvPct: string;
    horizonYears: number;
  };
  const [form, setForm] = useState<PreviewForm>({ ...settings, birthYear, incomeEmployment, incomeOther, householdCosts, assumedLtvPct, horizonYears: 5 });
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planLabelInput, setPlanLabelInput] = useState("");
  const [showPlansList, setShowPlansList] = useState(false);

  function set<K extends keyof PreviewForm>(key: K, value: PreviewForm[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave({
      birthYear: form.birthYear, incomeEmployment: form.incomeEmployment, incomeOther: form.incomeOther,
      householdCosts: form.householdCosts, assumedLtvPct: form.assumedLtvPct,
      settings: {
        dstiCap: form.dstiCap, dtiCap: form.dtiCap, rentRecognition: form.rentRecognition, salaryGrowth: form.salaryGrowth,
        rentGrowth: form.rentGrowth, priceGrowth: form.priceGrowth, newYield: form.newYield, newLoanRate: form.newLoanRate,
        stressAdd: form.stressAdd, maxAge: form.maxAge, cooldownMonths: form.cooldownMonths, initialCash: form.initialCash,
        annualCash: form.annualCash, basePrice: form.basePrice, includeDebts: form.includeDebts,
      },
    });
    setSaving(false);
    onClose();
  }

  const sliderField = (label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, display: (v: number) => string, hint = "") => (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--ppm-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontWeight: 600, fontSize: 12.5, color: "var(--ppm-accent)", flexShrink: 0 }}>{display(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--ppm-accent)", display: "block" }} />
      {hint && <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10.5, color: "var(--ppm-text-faint)", marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );

  const panelStyle: React.CSSProperties = { background: "var(--ppm-panel)", border: "1px solid var(--ppm-border)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 };
  const panelHead = (title: string, sub: string) => (
    <>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: "var(--ppm-text)", marginBottom: 3 }}>{title}</div>
      <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11.5, color: "var(--ppm-text-faint)", marginBottom: 14 }}>{sub}</div>
    </>
  );

  const [tip, setTip] = useState<{ x: number; y: number; below: boolean; text: string } | null>(null);
  function showTip(e: React.SyntheticEvent, text: string) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const below = r.top < 160;
    setTip({ x: r.left + r.width / 2, y: below ? r.bottom + 10 : r.top - 10, below, text });
  }
  function hideTip() { setTip(null); }
  const IconBuilding = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -1.5, marginRight: 3 }}>
      <path d="M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
      <path d="M14 9h4a1 1 0 0 1 1 1v11" />
      <path d="M9 8h.01M9 12h.01M9 16h.01" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  );

  // ── Živý náhled ──────────────────────────────────────────────────────────
  const nowMs = Date.now();
  const ownedProps = properties.filter(p => p.ownership_type !== "manager");
  const todayValue = ownedProps.reduce((s, p) => s + p.estimated_value, 0);
  const todayDebt = mortgages.filter(m => ownedProps.some(p => p.id === m.property_id)).reduce((s, m) => s + m.outstanding_balance, 0);

  const baseline = buildFutureBaseline(properties, mortgages, nowMs, form.horizonYears);
  const sim = simulateOptimisticAcquisitions(baseline, nowMs, properties, mortgages, debts, form.birthYear, form.incomeEmployment, form.incomeOther, form.householdCosts, form.assumedLtvPct, form);
  const rows = sim?.rows ?? [];
  const chartPoints: SimPt[] = [{ ms: nowMs, value: todayValue, debt: todayDebt }, ...(sim?.points ?? [])];
  const totalPurchases = rows.reduce((s, r) => s + r.purchases.length, 0);
  const lastRow = rows[rows.length - 1];

  const tiles: { k: string; v: string; accent?: boolean; warn?: boolean }[] = [
    { k: t("Majetek dnes", "Equity today"), v: `${fmtMil(todayValue - todayDebt)} ${t("mil", "M")}` },
    { k: t(`Majetek za ${form.horizonYears} let`, `Equity in ${form.horizonYears} years`), v: lastRow ? `${fmtMil(lastRow.equity)} ${t("mil", "M")}` : "—", accent: true },
    { k: t(`Hodnota portfolia za ${form.horizonYears} let`, `Portfolio value in ${form.horizonYears} years`), v: lastRow ? `${fmtMil(lastRow.value)} ${t("mil", "M")}` : "—" },
    { k: t(`Dluh za ${form.horizonYears} let`, `Debt in ${form.horizonYears} years`), v: lastRow ? `${fmtMil(lastRow.debt)} ${t("mil", "M")}` : "—" },
    { k: t("Simulovaných akvizic", "Simulated acquisitions"), v: String(totalPurchases) },
    { k: t("DSTI / DTI na konci", "DSTI / DTI at the end"), v: lastRow ? `${Math.round(lastRow.dsti * 100)} % · ${lastRow.dti.toFixed(1)}×` : "—", warn: lastRow ? (lastRow.dsti > form.dstiCap || lastRow.dti > form.dtiCap) : false },
  ];

  // Malý statický graf (bez hoveru) — hodnota / dluh / majetek + tečkované značky akvizic
  const CW = 640, CH = 200, CPL = 52, CPR = 14, CPT = 14, CPB = 24;
  const chartMinMs = chartPoints[0]?.ms ?? nowMs;
  const chartMaxMs = chartPoints[chartPoints.length - 1]?.ms ?? nowMs;
  const chartMaxV = Math.max(...chartPoints.map(p => p.value), 1);
  const cToX = (ms: number) => CPL + (ms - chartMinMs) / ((chartMaxMs - chartMinMs) || 1) * (CW - CPL - CPR);
  const cToY = (v: number) => CPT + (1 - v / chartMaxV) * (CH - CPT - CPB);
  const valuePts = chartPoints.map(p => `${cToX(p.ms).toFixed(1)},${cToY(p.value).toFixed(1)}`).join(" ");
  const debtPts = chartPoints.map(p => `${cToX(p.ms).toFixed(1)},${cToY(p.debt).toFixed(1)}`).join(" ");
  const eqPts = chartPoints.map(p => `${cToX(p.ms).toFixed(1)},${cToY(p.value - p.debt).toFixed(1)}`).join(" ");
  const chartGridVals = [0.25, 0.5, 0.75, 1].map(f => f * chartMaxV);
  const buyPts = chartPoints.filter(p => p.bought);

  // ── Plán: uložení/aktualizace snímku aktuálního nastavení + trajektorie, pro pozdější srovnání s realitou ──
  const currentPlanSettings: ProjectionPlanSettings = {
    profile: { birthYear: form.birthYear, incomeEmployment: form.incomeEmployment, incomeOther: form.incomeOther, householdCosts: form.householdCosts, assumedLtvPct: form.assumedLtvPct },
    projection: {
      dstiCap: form.dstiCap, dtiCap: form.dtiCap, rentRecognition: form.rentRecognition, salaryGrowth: form.salaryGrowth,
      rentGrowth: form.rentGrowth, priceGrowth: form.priceGrowth, newYield: form.newYield, newLoanRate: form.newLoanRate,
      stressAdd: form.stressAdd, maxAge: form.maxAge, cooldownMonths: form.cooldownMonths, initialCash: form.initialCash,
      annualCash: form.annualCash, basePrice: form.basePrice, includeDebts: form.includeDebts,
    },
  };
  const activePlan = plans.find(p => p.status === "active") ?? null;
  const planSettingsChanged = activePlan ? JSON.stringify(activePlan.settings) !== JSON.stringify(currentPlanSettings) : false;
  const activePlanNow = activePlan ? planValueAtMs(activePlan.points, nowMs) : null;
  const activePlanEquityNow = activePlanNow ? activePlanNow.value - activePlanNow.debt : null;
  const realEquityNow = todayValue - todayDebt;
  const planDeltaNow = activePlanEquityNow !== null ? realEquityNow - activePlanEquityNow : null;

  async function handleSavePlan() {
    setSavingPlan(true);
    await onSavePlan(currentPlanSettings, sim?.points ?? [], planLabelInput.trim() || undefined);
    setPlanLabelInput("");
    setSavingPlan(false);
  }

  function loadPlanIntoForm(plan: ProjectionPlan) {
    setForm(f => ({ ...f, ...plan.settings.projection, ...plan.settings.profile }));
    setShowPlansList(false);
  }

  const refRows = ownedProps.map(p => {
    const propMortgages = mortgages.filter(m => m.property_id === p.id);
    return {
      name: p.name,
      value: p.estimated_value,
      rent: p.rent_amount || 0,
      debt: propMortgages.reduce((s, m) => s + m.outstanding_balance, 0),
      payment: propMortgages.reduce((s, m) => s + m.monthly_payment, 0),
    };
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{
      background: "rgba(6,9,7,0.72)", padding: 16,
      ["--ppm-bg" as string]: "#121a13", ["--ppm-panel" as string]: "#1a251b", ["--ppm-panel-2" as string]: "#212d22",
      ["--ppm-border" as string]: "#2c3a2d", ["--ppm-text" as string]: "#eef2ea", ["--ppm-text-dim" as string]: "#9fac9a",
      ["--ppm-text-faint" as string]: "#6c7a6a", ["--ppm-accent" as string]: "#d3a052", ["--ppm-accent-soft" as string]: "rgba(211,160,82,0.14)",
      ["--ppm-positive" as string]: "#7cc493", ["--ppm-positive-soft" as string]: "rgba(124,196,147,0.13)",
      ["--ppm-negative" as string]: "#e0796a", ["--ppm-negative-soft" as string]: "rgba(224,121,106,0.13)", ["--ppm-debt" as string]: "#c9a06f",
    } as React.CSSProperties} onClick={onClose}>
      <div style={{ background: "var(--ppm-bg)", borderRadius: 16, padding: "clamp(16px, 2.6vw, 34px)", width: "min(1440px, 94vw)", maxHeight: "94vh", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: "1px solid var(--ppm-border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24, color: "var(--ppm-text)" }}>{t("Projekce budoucích akvizic", "Future acquisition projection")}</div>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: "var(--ppm-text-dim)", marginTop: 5, maxWidth: 720, lineHeight: 1.5 }}>{t("Simuluje, kdy by šlo koupit další nemovitost financovanou refinancováním portfolia (LTV) a bankovním income testem (DSTI/DTI) — bez nutnosti našetřit hotovost na zálohu. Uprav si vstupy a zkontroluj, jestli výsledek dává smysl.", "Simulates when you could buy another property financed by refinancing the portfolio (LTV) and a bank income test (DSTI/DTI) — without needing to save cash for a down payment. Adjust the inputs and check whether the result makes sense.")}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ppm-text-faint)", fontSize: 24, flexShrink: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* Plán — uložení snímku a srovnání s realitou v čase */}
        <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              {activePlan ? (
                <>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14.5, color: "var(--ppm-text)" }}>
                    {t("Aktivní plán:", "Active plan:")} {activePlan.label ?? new Date(activePlan.created_at).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-US")}
                  </div>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: "var(--ppm-text-dim)", marginTop: 3 }}>
                    {planDeltaNow !== null ? (
                      <>
                        {t("Podle plánu bys teď měl mít majetek", "According to the plan, your equity right now should be")} <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "var(--ppm-text)" }}>{fmtMil(activePlanEquityNow!)} M</strong>,{" "}
                        {t("aktuálně máš", "you currently have")} <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "var(--ppm-text)" }}>{fmtMil(realEquityNow)} M</strong>
                        {" → "}
                        <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: planDeltaNow >= 0 ? "var(--ppm-positive)" : "var(--ppm-negative)" }}>
                          {planDeltaNow >= 0 ? "+" : ""}{fmt(planDeltaNow)} Kč {planDeltaNow >= 0 ? t("napřed", "ahead") : t("ve skluzu", "behind")}
                        </strong>
                      </>
                    ) : t("Plán ještě nemá žádné body k porovnání.", "The plan has no points to compare yet.")}
                  </div>
                  {planSettingsChanged && (
                    <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11.5, color: "var(--ppm-accent)", marginTop: 4 }}>
                      {t("Aktuální nastavení se liší od uloženého plánu.", "Current settings differ from the saved plan.")}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12.5, color: "var(--ppm-text-dim)" }}>
                  {t("Zatím žádný uložený plán — ulož si aktuální předpoklady, ať můžeš za čas vidět, jestli jsi napřed nebo ve skluzu.", "No saved plan yet — save the current assumptions so you can later see whether you're ahead of or behind schedule.")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input value={planLabelInput} onChange={e => setPlanLabelInput(e.target.value)} placeholder={t("Název plánu (volitelné)", "Plan name (optional)")}
                style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid var(--ppm-border)", background: "var(--ppm-panel-2)", fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: "var(--ppm-text)", width: 160 }} />
              <button onClick={handleSavePlan} disabled={savingPlan || !form.birthYear}
                style={{ fontFamily: "'Work Sans', sans-serif", padding: "8px 13px", borderRadius: 7, border: "none", background: savingPlan || !form.birthYear ? "var(--ppm-text-faint)" : "var(--ppm-accent)", color: "#141a12", fontSize: 12.5, fontWeight: 700, cursor: savingPlan || !form.birthYear ? "default" : "pointer", whiteSpace: "nowrap" }}>
                {savingPlan ? t("Ukládám…", "Saving…") : activePlan ? t("Aktualizovat plán", "Update plan") : t("Uložit jako plán", "Save as plan")}
              </button>
              {plans.length > 0 && (
                <button onClick={() => setShowPlansList(v => !v)}
                  style={{ fontFamily: "'Work Sans', sans-serif", padding: "8px 11px", borderRadius: 7, border: "1px solid var(--ppm-border)", background: "transparent", color: "var(--ppm-text-dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {showPlansList ? t("Skrýt plány", "Hide plans") : t("Moje plány", "My plans")} ({plans.length})
                </button>
              )}
            </div>
          </div>
          {showPlansList && (
            <div style={{ borderTop: "1px solid var(--ppm-border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {plans.map(p => {
                const pNow = planValueAtMs(p.points, nowMs);
                const pDelta = pNow ? realEquityNow - (pNow.value - pNow.debt) : null;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontFamily: "'Work Sans', sans-serif", color: "var(--ppm-text-dim)", background: "var(--ppm-panel-2)", borderRadius: 8, padding: "8px 11px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "var(--ppm-text)", minWidth: 130 }}>{p.label ?? new Date(p.created_at).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-US")}</span>
                    <span style={{ padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                      background: p.status === "active" ? "var(--ppm-positive-soft)" : "var(--ppm-panel)", color: p.status === "active" ? "var(--ppm-positive)" : "var(--ppm-text-faint)" }}>
                      {p.status === "active" ? t("aktivní", "active") : p.status === "superseded" ? t("nahrazený", "superseded") : t("archivovaný", "archived")}
                    </span>
                    {pDelta !== null && (
                      <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: pDelta >= 0 ? "var(--ppm-positive)" : "var(--ppm-negative)" }}>
                        {pDelta >= 0 ? "+" : ""}{fmt(pDelta)} Kč
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <button onClick={() => loadPlanIntoForm(p)}
                      style={{ fontFamily: "'Work Sans', sans-serif", padding: "5px 9px", borderRadius: 6, border: "1px solid var(--ppm-border)", background: "transparent", color: "var(--ppm-text-dim)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {t("Načíst do formuláře", "Load into form")}
                    </button>
                    {p.status !== "archived" && (
                      <button onClick={() => onArchivePlan(p.id)}
                        style={{ fontFamily: "'Work Sans', sans-serif", padding: "5px 9px", borderRadius: 6, border: "1px solid var(--ppm-border)", background: "transparent", color: "var(--ppm-text-faint)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {t("Archivovat", "Archive")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* LEVÝ SLOUPEC — vstupy */}
          <div style={{ flex: "1 1 300px", minWidth: "min(280px, 100%)" }}>
            <div style={panelStyle}>
              {panelHead(t("Osobní a příjmové vstupy", "Personal & income inputs"), t("Z profilu appky, doplň co chybí", "From your app profile — fill in what's missing"))}
              <div style={{ marginBottom: 11 }}>
                <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--ppm-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("Rok narození", "Birth year")}</div>
                <input type="number" value={form.birthYear} onChange={e => set("birthYear", e.target.value)} placeholder={t("např. 1988", "e.g. 1988")}
                  style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid var(--ppm-border)", background: "var(--ppm-panel-2)", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 13, color: "var(--ppm-text)", boxSizing: "border-box" }} />
                {!form.birthYear && <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10.5, color: "var(--ppm-negative)", marginTop: 4 }}>{t("Bez roku narození nejde spočítat maximální délku úvěru — náhled vpravo zůstane prázdný.", "Without a birth year the maximum loan term can't be calculated — the preview on the right will stay empty.")}</div>}
              </div>
              {sliderField(t("Čistý příjem ze zaměstnání", "Net income from employment"), Number(form.incomeEmployment) || 0, v => set("incomeEmployment", String(v)), 0, 200000, 1000, v => `${fmt(v)} Kč`)}
              {sliderField(t("Čistý příjem z jiných zdrojů", "Net income from other sources"), Number(form.incomeOther) || 0, v => set("incomeOther", String(v)), 0, 100000, 1000, v => `${fmt(v)} Kč`)}
              {sliderField(t("Měsíční životní náklady", "Monthly living costs"), Number(form.householdCosts) || 0, v => set("householdCosts", String(v)), 0, 60000, 500, v => `${fmt(v)} Kč`)}
              <label className="flex items-center gap-2" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11.5, color: "var(--ppm-text-dim)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.includeDebts} onChange={e => set("includeDebts", e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--ppm-accent)", background: "var(--ppm-panel-2)", border: "1px solid var(--ppm-border)", borderRadius: 3 }} />
                {t("Počítat i současné osobní půjčky do DSTI/DTI", "Also count existing personal loans toward DSTI/DTI")}
              </label>
            </div>

            <div style={panelStyle}>
              {panelHead(t("Bankovní parametry", "Bank parameters"), t("LTV, sazby, uznání příjmů", "LTV, rates, income recognition"))}
              {sliderField(t("Cílové LTV", "Target LTV"), Number(form.assumedLtvPct) || 70, v => set("assumedLtvPct", String(v)), 50, 90, 1, v => `${v} %`)}
              {sliderField(t("Sazba nových úvěrů", "Rate on new loans"), form.newLoanRate * 100, v => set("newLoanRate", v / 100), 2, 10, 0.01, v => `${v.toFixed(2)} %`)}
              {sliderField(t("Stress-test přirážka", "Stress-test add-on"), form.stressAdd * 100, v => set("stressAdd", v / 100), 0, 4, 0.1, v => `${v.toFixed(1)} p.b.`)}
              {sliderField(t("Uznání nájmu bankou", "Bank's rent recognition"), Math.round(form.rentRecognition * 100), v => set("rentRecognition", v / 100), 40, 100, 5, v => `${v} %`,
                t("Banky obvykle uznávají 40–70 % nájmu; dlouhodobé smlouvy (12+ měs.) bývají na horní hranici.", "Banks typically recognize 40–70% of rent; long-term leases (12+ months) tend to sit at the upper end."))}
              {sliderField(t("Max. věk na konci splatnosti", "Max. age at loan maturity"), form.maxAge, v => set("maxAge", v), 60, 80, 1, v => t(`${v} let`, `${v} yrs`))}
              {sliderField(t("Strop DSTI banky", "Bank's DSTI cap"), Math.round(form.dstiCap * 100), v => set("dstiCap", v / 100), 40, 80, 1, v => `${v} %`,
                t("ČNB od 7/2023 nevyžaduje závazně. Reálně: Komerční banka 50 %, Česká spořitelna 55–60 %, Hypoteční banka (ČSOB) až 70 %.", "The Czech National Bank hasn't required this bindingly since 7/2023. In practice: Komerční banka 50%, Česká spořitelna 55–60%, Hypoteční banka (ČSOB) up to 70%."))}
              {sliderField(t("Strop DTI (násobek ročního příjmu)", "DTI cap (multiple of annual income)"), form.dtiCap, v => set("dtiCap", v), 3, 12, 0.5, v => `${v.toFixed(1)}×`,
                t("ČNB od 4/2026 doporučuje pro investiční hypotéky max. 7×.", "The Czech National Bank recommends a max. of 7× for investment mortgages, effective 4/2026."))}
            </div>

            <div style={{ ...panelStyle, marginBottom: 0 }}>
              {panelHead(t("Růst v čase", "Growth over time"), t("Co žene simulaci dopředu", "What drives the simulation forward"))}
              {sliderField(t("Růst platu", "Salary growth"), form.salaryGrowth * 100, v => set("salaryGrowth", v / 100), 0, 8, 0.1, v => t(`${v.toFixed(1)} %/rok`, `${v.toFixed(1)} %/yr`))}
              {sliderField(t("Růst nájmů", "Rent growth"), form.rentGrowth * 100, v => set("rentGrowth", v / 100), 0, 10, 0.1, v => t(`${v.toFixed(1)} %/rok`, `${v.toFixed(1)} %/yr`),
                t("Aktuální tržní růst nájmů v ČR běží kolem 5–6 % (místy až 10 %), ale trh se stabilizuje.", "Current market rent growth in Czechia runs around 5–6% (locally up to 10%), but the market is stabilizing."))}
              <div style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--ppm-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Výchozí cena další akvizice", "Default price of next acquisition")}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontWeight: 600, fontSize: 12.5, color: "var(--ppm-accent)", flexShrink: 0 }}>{form.basePrice === null ? t("auto", "auto") : `${fmt(form.basePrice)} Kč`}</span>
                </div>
                <label className="flex items-center gap-2" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11.5, color: "var(--ppm-text-dim)", marginBottom: form.basePrice === null ? 0 : 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.basePrice === null} onChange={e => set("basePrice", e.target.checked ? null : 3400000)}
                    style={{ width: 14, height: 14, accentColor: "var(--ppm-accent)", background: "var(--ppm-panel-2)", border: "1px solid var(--ppm-border)", borderRadius: 3 }} />
                  {t("Automaticky (průměr posledních dvou hypoték)", "Automatic (average of the last two mortgages)")}
                </label>
                {form.basePrice !== null && (
                  <input type="range" min={1000000} max={10000000} step={100000} value={form.basePrice}
                    onChange={e => set("basePrice", Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--ppm-accent)", display: "block" }} />
                )}
              </div>
              {sliderField(t("Růst ceny další akvizice", "Growth in next acquisition's price"), form.priceGrowth * 100, v => set("priceGrowth", v / 100), 0, 12, 0.1, v => t(`${v.toFixed(1)} %/rok`, `${v.toFixed(1)} %/yr`))}
              {sliderField(t("Výnos nové nemovitosti", "New property's yield"), form.newYield * 100, v => set("newYield", v / 100), 2, 10, 0.1, v => t(`${v.toFixed(1)} %/rok`, `${v.toFixed(1)} %/yr`),
                t("Předpokládaný hrubý nájemní výnos (roční nájem / cena) budoucí akvizice.", "Assumed gross rental yield (annual rent / price) of the future acquisition."))}
              {sliderField(t("Počáteční hotovost na akvizici", "Initial cash for acquisition"), form.initialCash, v => set("initialCash", v), 0, 5000000, 100000, v => `${fmt(v)} Kč`,
                t("Jednorázová hotovost k dispozici teď — použije se jako vlastní kapitál do první koupě.", "One-time cash available now — used as own capital toward the first purchase."))}
              {sliderField(t("Roční vklad vlastního kapitálu", "Annual own-capital contribution"), form.annualCash, v => set("annualCash", v), 0, 3000000, 50000, v => t(`${fmt(v)} Kč/rok`, `${fmt(v)} Kč/yr`),
                t("Kolik vlastní hotovosti mimo cashflow z nájmů ročně přiléváš do investičního koloběhu.", "How much of your own cash, outside rental cashflow, you add to the investment cycle each year."))}
              {sliderField(t("Horizont náhledu", "Preview horizon"), form.horizonYears, v => set("horizonYears", v), 3, 20, 1, v => t(`${v} let`, `${v} yrs`))}
              {sliderField(t("Min. rozestup mezi akvizicemi", "Min. gap between acquisitions"), form.cooldownMonths, v => set("cooldownMonths", v), 3, 36, 1, v => t(`${v} měs.`, `${v} mo`),
                t("Bez tohoto omezení model jakmile jednou nastartuje, kupuje prakticky nepřetržitě.", "Without this limit, once the model gets going it buys almost continuously."))}
            </div>
          </div>

          {/* PRAVÝ SLOUPEC — živý náhled */}
          <div style={{ flex: "1 1 480px", minWidth: "min(420px, 100%)" }}>
            <div style={panelStyle}>
              {panelHead(t("Souhrn za horizont", "Summary over the horizon"), t(`Simulace na ${form.horizonYears} let dopředu, na tvých skutečných datech`, `Simulation ${form.horizonYears} years ahead, on your real data`))}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 10, marginBottom: form.birthYear ? 16 : 0 }}>
                {tiles.map(t => (
                  <div key={t.k} style={{ background: "var(--ppm-panel-2)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--ppm-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{t.k}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 19, fontWeight: 600, color: t.warn ? "var(--ppm-negative)" : t.accent ? "var(--ppm-accent)" : "var(--ppm-text)" }}>{t.v}</div>
                  </div>
                ))}
              </div>

              {!form.birthYear ? (
                <div style={{ fontFamily: "'Work Sans', sans-serif", textAlign: "center", color: "var(--ppm-text-faint)", fontSize: 13, padding: "32px 20px 4px" }}>
                  {t("Vyplň rok narození vlevo, ať appka spočítá náhled.", "Fill in your birth year on the left so the app can calculate the preview.")}
                </div>
              ) : (
                <>
                  <svg viewBox={`0 0 ${CW} ${CH}`} width="100%" height={CH} style={{ display: "block", overflow: "visible" }}>
                    {chartGridVals.map((v, i) => (
                      <g key={i}>
                        <line x1={CPL} y1={cToY(v).toFixed(1)} x2={CW - CPR} y2={cToY(v).toFixed(1)} stroke="var(--ppm-border)" strokeWidth="1" />
                        <text x={CPL - 6} y={cToY(v) + 3} textAnchor="end" fontSize="9" fontFamily="'IBM Plex Mono', ui-monospace, monospace" fill="var(--ppm-text-faint)">{fmtMil(v)}M</text>
                      </g>
                    ))}
                    {buyPts.map((p, i) => (
                      <line key={i} x1={cToX(p.ms).toFixed(1)} y1={CPT} x2={cToX(p.ms).toFixed(1)} y2={CH - CPB} stroke="var(--ppm-text-faint)" strokeWidth="1" strokeDasharray="3 3" />
                    ))}
                    <polyline points={debtPts} fill="none" stroke="var(--ppm-debt)" strokeWidth="2" />
                    <polyline points={valuePts} fill="none" stroke="var(--ppm-accent)" strokeWidth="2" />
                    <polyline points={eqPts} fill="none" stroke="var(--ppm-positive)" strokeWidth="2.6" />
                    {buyPts.map((p, i) => (
                      <circle key={i} cx={cToX(p.ms).toFixed(1)} cy={cToY(p.value - p.debt).toFixed(1)} r="4" fill="var(--ppm-accent)" stroke="var(--ppm-panel)" strokeWidth="1.5" />
                    ))}
                  </svg>
                  <div className="flex gap-4" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 500, color: "var(--ppm-text-dim)", marginTop: 10 }}>
                    <span className="inline-flex items-center gap-[6px]"><span style={{ width: 13, height: 3, borderRadius: 2, background: "var(--ppm-accent)", display: "inline-block" }} />{t("Hodnota portfolia", "Portfolio value")}</span>
                    <span className="inline-flex items-center gap-[6px]"><span style={{ width: 13, height: 3, borderRadius: 2, background: "var(--ppm-debt)", display: "inline-block" }} />{t("Dluh", "Debt")}</span>
                    <span className="inline-flex items-center gap-[6px]"><span style={{ width: 13, height: 3, borderRadius: 2, background: "var(--ppm-positive)", display: "inline-block" }} />{t("Majetek", "Equity")}</span>
                    <span className="inline-flex items-center gap-[6px]"><span style={{ width: 11, height: 0, borderTop: "1px dashed var(--ppm-text-faint)", display: "inline-block" }} />{t("Akvizice", "Acquisition")}</span>
                  </div>
                </>
              )}
            </div>

            {form.birthYear && (
              <div style={panelStyle}>
                {panelHead(t("Rok po roce", "Year by year"), t("DSTI = splátky/uznaný příjem · DTI = celkový dluh/roční příjem · zůstatek = příjem − splátky (stress) − náklady", "DSTI = debt service/recognized income · DTI = total debt/annual income · surplus = income − debt service (stress) − costs"))}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {(lang === "cs"
                          ? ["Rok", "Věk", "Hodnota", "Dluh", "Majetek", "Příjem", "Splátky", "DSTI", "DTI", "Zůstatek", "Akvizice"]
                          : ["Year", "Age", "Value", "Debt", "Equity", "Income", "Payments", "DSTI", "DTI", "Surplus", "Acquisition"]
                        ).map((h, i) => (
                          <th key={h} style={{ fontFamily: "'Work Sans', sans-serif", textAlign: i === 0 ? "left" : "right", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--ppm-text-faint)", fontWeight: 600, paddingBottom: 7, borderBottom: "1px solid var(--ppm-border)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.year} style={{ background: r.purchases.length ? "var(--ppm-positive-soft)" : undefined }}>
                          <td style={{ fontFamily: "'Work Sans', sans-serif", padding: "7px 8px 7px 0", fontWeight: 600, color: "var(--ppm-text)", borderBottom: "1px solid var(--ppm-border)" }}>{r.year}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text)", borderBottom: "1px solid var(--ppm-border)" }}>{r.age}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text)", borderBottom: "1px solid var(--ppm-border)" }}>{fmtMil(r.value)} M</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text)", borderBottom: "1px solid var(--ppm-border)" }}>{fmtMil(r.debt)} M</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text)", borderBottom: "1px solid var(--ppm-border)" }}>{fmtMil(r.equity)} M</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{fmt(r.income)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{fmt(r.debtService)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: r.dsti > form.dstiCap ? "var(--ppm-negative)" : "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{Math.round(r.dsti * 100)} %</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: r.dti > form.dtiCap ? "var(--ppm-negative)" : "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{r.dti.toFixed(1)}×</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{fmt(r.surplus)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", borderBottom: "1px solid var(--ppm-border)" }}>
                            {r.purchases.length ? r.purchases.map((b, i) => (
                              <span key={i}
                                onMouseEnter={e => showTip(e, t(`Nová investice\n\nCena: ${fmt(b.price)} Kč\nZ toho vlastní hotovost: ${fmt(b.cash)} Kč\nNový dluh (refinancování): ${fmt(b.loan)} Kč\nOdhad nájmu: ${fmt(b.rent)} Kč/měs\nSplátka nového dluhu: ${fmt(b.payment)} Kč/měs`, `New investment\n\nPrice: ${fmt(b.price)} Kč\nOwn cash used: ${fmt(b.cash)} Kč\nNew debt (refinancing): ${fmt(b.loan)} Kč\nEstimated rent: ${fmt(b.rent)} Kč/mo\nNew debt payment: ${fmt(b.payment)} Kč/mo`))}
                                onMouseLeave={hideTip}
                                tabIndex={0}
                                onFocus={e => showTip(e, t(`Nová investice\n\nCena: ${fmt(b.price)} Kč\nZ toho vlastní hotovost: ${fmt(b.cash)} Kč\nNový dluh (refinancování): ${fmt(b.loan)} Kč\nOdhad nájmu: ${fmt(b.rent)} Kč/měs\nSplátka nového dluhu: ${fmt(b.payment)} Kč/měs`, `New investment\n\nPrice: ${fmt(b.price)} Kč\nOwn cash used: ${fmt(b.cash)} Kč\nNew debt (refinancing): ${fmt(b.loan)} Kč\nEstimated rent: ${fmt(b.rent)} Kč/mo\nNew debt payment: ${fmt(b.payment)} Kč/mo`))}
                                onBlur={hideTip}
                                style={{ display: "inline-block", marginLeft: 4, fontFamily: "'Work Sans', sans-serif", fontSize: 10.5, fontWeight: 600, color: "var(--ppm-positive)", background: "var(--ppm-positive-soft)", borderRadius: 20, padding: "2px 8px", cursor: "help", borderBottom: "1px dotted var(--ppm-positive)" }}>
                                <IconBuilding />{fmtMil(b.price)} M
                              </span>
                            )) : <span style={{ color: "var(--ppm-text-faint)" }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {refRows.length > 0 && (
              <div style={{ ...panelStyle, marginBottom: 0 }}>
                {panelHead(t("Vstupní portfolio", "Input portfolio"), t("Vlastněné nemovitosti (bez spravovaných) — základ simulace, aktuální stav", "Owned properties (excluding managed ones) — the simulation's baseline, current state"))}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {(lang === "cs"
                          ? ["Nemovitost", "Hodnota", "Nájem/měs", "Dluh", "Splátka/měs"]
                          : ["Property", "Value", "Rent/mo", "Debt", "Payment/mo"]
                        ).map((h, i) => (
                          <th key={h} style={{ fontFamily: "'Work Sans', sans-serif", textAlign: i === 0 ? "left" : "right", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--ppm-text-faint)", fontWeight: 600, paddingBottom: 7, borderBottom: "1px solid var(--ppm-border)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {refRows.map(r => (
                        <tr key={r.name}>
                          <td style={{ fontFamily: "'Work Sans', sans-serif", padding: "6px 8px 6px 0", color: "var(--ppm-text)", borderBottom: "1px solid var(--ppm-border)" }}>{r.name}</td>
                          <td style={{ textAlign: "right", padding: "6px 8px", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{fmt(r.value)} Kč</td>
                          <td style={{ textAlign: "right", padding: "6px 8px", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{r.rent ? `${fmt(r.rent)} Kč` : "—"}</td>
                          <td style={{ textAlign: "right", padding: "6px 8px", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{r.debt ? `${fmt(r.debt)} Kč` : "—"}</td>
                          <td style={{ textAlign: "right", padding: "6px 8px", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "var(--ppm-text-dim)", borderBottom: "1px solid var(--ppm-border)" }}>{r.payment ? `${fmt(r.payment)} Kč` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: "var(--ppm-text-faint)", marginTop: 14, lineHeight: 1.6, borderTop: "1px solid var(--ppm-border)", paddingTop: 12 }}>
                  {t("Nová akvizice se financuje kombinací vlastního kapitálu (počáteční + roční vklad výše) a zbytku jako navýšeného dluhu — refinancováním portfolia v rámci LTV, ne samostatnou hypotékou jen na tu jednu nemovitost. Musí zároveň projít testem LTV, DSTI i DTI (a osobními půjčkami, pokud jsou zapnuté). Osobní půjčky se v simulaci splácí lineárně (zbývá / splátka), ne podle skutečné amortizace.", "A new acquisition is financed by a mix of own capital (initial + annual contribution above) and the rest as added debt — by refinancing the portfolio within LTV, not a separate mortgage on just that one property. It must pass the LTV, DSTI and DTI tests at once (and personal loans, if enabled). Personal loans are paid off linearly in the simulation (remaining / payment), not by their real amortization.")}
                </div>
              </div>
            )}
          </div>
        </div>

        {tip && (
          <div style={{
            position: "fixed", left: tip.x, top: tip.y, transform: `translate(-50%, ${tip.below ? "0" : "-100%"})`,
            background: "var(--ppm-text)", color: "var(--ppm-bg)", padding: "9px 11px", borderRadius: 9,
            fontFamily: "'Work Sans', sans-serif", fontSize: 11.5, fontWeight: 500, whiteSpace: "pre-line",
            width: "max-content", maxWidth: 230, lineHeight: 1.55, boxShadow: "0 8px 24px rgba(0,0,0,0.45)", zIndex: 200, pointerEvents: "none",
          }}>
            {tip.text}
          </div>
        )}

        <div className="flex gap-3" style={{ marginTop: 10, paddingTop: 13, borderTop: "1px solid var(--ppm-border)" }}>
          <button onClick={() => setForm(f => ({ ...DEFAULT_PROJECTION_SETTINGS, birthYear: f.birthYear, incomeEmployment: f.incomeEmployment, incomeOther: f.incomeOther, householdCosts: f.householdCosts, assumedLtvPct: f.assumedLtvPct, horizonYears: f.horizonYears }))}
            style={{ fontFamily: "'Work Sans', sans-serif", padding: "9px 14px", borderRadius: 7, border: "1px solid var(--ppm-border)", background: "transparent", color: "var(--ppm-text-dim)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {t("Výchozí hodnoty", "Default values")}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ fontFamily: "'Work Sans', sans-serif", padding: "9px 16px", borderRadius: 7, border: "1px solid var(--ppm-border)", background: "transparent", color: "var(--ppm-text-dim)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t("Zavřít", "Close")}
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ fontFamily: "'Work Sans', sans-serif", padding: "9px 16px", borderRadius: 7, border: "none", background: saving ? "var(--ppm-text-faint)" : "var(--ppm-accent)", color: "#141a12", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
            {saving ? t("Ukládám…", "Saving…") : t("Uložit", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Growth Chart ─────────────────────────────────────────────────────────────
function GrowthChart({ properties, mortgages, debts, dtiEnabled, birthYear, incomeEmployment, incomeOther, householdCosts, assumedLtvPct, projectionSettings, lang, onOpenProjectionSettings, activePlan }: {
  properties: Property[]; mortgages: Mortgage[]; debts: Debt[];
  dtiEnabled: boolean; birthYear: string; incomeEmployment: string; incomeOther: string; householdCosts: string; assumedLtvPct: string;
  projectionSettings: ProjectionSettings; lang: "cs" | "en"; onOpenProjectionSettings: () => void;
  activePlan: ProjectionPlan | null;
}) {
  const t = (cs: string, en: string) => lang === "cs" ? cs : en;
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [range, setRange] = React.useState<"5" | "10" | "all">("all");
  const [scenario, setScenario] = React.useState<"pesimisticka" | "konzervativni" | "optimisticka">("konzervativni");
  const [showProjection, setShowProjection] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const W = 600, H = 240, PAD_L = 40, PAD_R = 16, PAD_T = 20, PAD_B = 30;
  const nowMs = Date.now();
  const FUTURE_YEARS = 5;

  let earliestMs = nowMs;
  for (const p of properties) {
    if (p.purchase_date) {
      const ms = new Date(p.purchase_date).getTime();
      if (ms < earliestMs) earliestMs = ms;
    }
  }
  if (earliestMs === nowMs) earliestMs = nowMs - 2 * 365 * 86400000;

  const minMs = range === "all" ? earliestMs
    : range === "10" ? Math.max(earliestMs, nowMs - 10 * 365 * 86400000)
    : Math.max(earliestMs, nowMs - 5 * 365 * 86400000);
  const maxMs = nowMs + FUTURE_YEARS * 365 * 86400000;
  const totalMs = maxMs - minMs;

  type Pt = { ms: number; value: number; debt: number };
  const allPoints: Pt[] = [];
  const MONTHS = Math.round(totalMs / (30 * 86400000));
  for (let i = 0; i <= MONTHS; i++) {
    const ms = minMs + (i / MONTHS) * totalMs;
    let value = 0, debt = 0;
    for (const p of properties) {
      const growth = (p.annual_growth_pct ?? 3) / 100;
      const purchaseMs = p.purchase_date ? new Date(p.purchase_date).getTime() : nowMs;
      if (!p.purchase_date) {
        value += ms <= nowMs ? p.estimated_value : p.estimated_value * Math.pow(1 + growth, (ms - nowMs) / (365 * 86400000));
      } else {
        const purchasePrice = p.purchase_price ?? p.estimated_value;
        if (ms < purchaseMs) {
          // not yet purchased
        } else if (ms <= nowMs) {
          const t = Math.min(1, (ms - purchaseMs) / (nowMs - purchaseMs || 1));
          value += purchasePrice + t * (p.estimated_value - purchasePrice);
        } else {
          value += p.estimated_value * Math.pow(1 + growth, (ms - nowMs) / (365 * 86400000));
        }
      }
      const mort = mortgages.find(m => m.property_id === p.id);
      if (mort) {
        const loanMs = mort.loan_start_date ? new Date(mort.loan_start_date).getTime() : purchaseMs;
        if (ms >= loanMs) {
          const loanAmt = mort.loan_amount ?? mort.outstanding_balance;
          const termMs = (mort.loan_term_years ?? 30) * 365 * 86400000;
          const payoffMs = loanMs + termMs;
          if (ms <= nowMs) {
            // Interpolate between the loan amount at drawdown and the actual current balance —
            // real mortgages front-load interest, so a pure linear-amortization model would
            // understate today's balance if it ignored the real outstanding_balance.
            const t = Math.min(1, (ms - loanMs) / (nowMs - loanMs || 1));
            debt += Math.max(0, loanAmt + t * (mort.outstanding_balance - loanAmt));
          } else if (ms < payoffMs) {
            const t = (ms - nowMs) / (payoffMs - nowMs || 1);
            debt += Math.max(0, mort.outstanding_balance * (1 - t));
          }
        }
      }
    }
    allPoints.push({ ms, value, debt });
  }

  if (allPoints.length === 0) return null;

  // Average annual growth (from first point with a positive value/equity to today) — this is
  // always computed from the real historical trajectory (allPoints), regardless of which
  // future scenario is selected below, since it describes the past, not a projection.
  const firstPt = allPoints.find(p => p.value - p.debt > 0);
  const todayPt = allPoints.find(p => p.ms >= nowMs);
  const avgGrowthPct = firstPt && todayPt && firstPt.ms < todayPt.ms && firstPt.value - firstPt.debt > 0
    ? (Math.pow((todayPt.value - todayPt.debt) / (firstPt.value - firstPt.debt), 1 / ((todayPt.ms - firstPt.ms) / (365 * 86400000))) - 1) * 100
    : null;
  const firstValPt = allPoints.find(p => p.value > 0);
  const avgPortfolioGrowthPct = firstValPt && todayPt && firstValPt.ms < todayPt.ms
    ? (Math.pow(todayPt.value / firstValPt.value, 1 / ((todayPt.ms - firstValPt.ms) / (365 * 86400000))) - 1) * 100
    : null;

  // Future projection scenarios. "Pesimistická" keeps the original per-property projection
  // (each property compounds at its own annual_growth_pct — i.e. organic appreciation only,
  // no further acquisitions). "Konzervativní" and "optimistická" instead extrapolate the whole
  // portfolio forward using the historical blended CAGR above (which already reflects past
  // acquisitions), scaled up for the optimistic case. Debt is identical in every scenario.
  const conservativeRate = (avgPortfolioGrowthPct ?? 5) / 100;
  const scenarioRate = scenario === "optimisticka" ? conservativeRate * 1.3 : conservativeRate;
  // When the optional financial profile (věk + příjem) is vyplněný, Optimistická scénář
  // reálně simuluje jednotlivé budoucí akvizice financované z naspořeného kapitálu (viz
  // simulateOptimisticAcquisitions výše). Bez profilu spadne zpátky na jednoduché ×1,3 tempo.
  const dtiSimulation = scenario === "optimisticka" && dtiEnabled
    ? simulateOptimisticAcquisitions(allPoints, nowMs, properties, mortgages, debts, birthYear, incomeEmployment, incomeOther, householdCosts, assumedLtvPct, projectionSettings)
    : null;
  // Dluh v "Historickém tempu" (a ve fallbacku Simulace akvizic bez Finančního profilu):
  // držet LTV napořád na dnešní úrovni by bylo taky nepřesné — dnešní nízké LTV je dané tím,
  // že staré hypotéky už léta amortizují, ale KAŽDÁ další akvizice (ať už "historickým tempem"
  // nebo simulovaně) se financuje blízko cílového LTV z bankovních parametrů (typicky ~70 %),
  // takže s dalším růstem přes nové akvizice se poměr dluh/hodnota postupně posouvá právě
  // k tomuhle cílovému LTV, ne že by zůstal navěky na dnešních ~40 %.
  // Vzorec: stávající dluh dál amortizuje normálně (p.debt ze základní trajektorie, jen
  // stávající hypotéky bez nových akvizic) a každá koruna PŘÍRŮSTKU hodnoty nad dnešek se
  // financuje z targetLtv % dluhu a (1-targetLtv) % vlastního kapitálu — přesně jako u
  // skutečné akvizice:
  //   debt(t) = p.debt(t) + targetLtv × (value(t) − hodnota_dnes)
  // V t=dnes: p.debt = dluh_dnes a přírůstek je 0 → dluh přesně sedí na reálný dnešek.
  // Pro t→∞ dluh_existujících hypoték doamortizuje k 0 a poměr dluh/hodnota se blíží targetLtv.
  const targetLtv = (Number(assumedLtvPct) || 70) / 100;
  const chartPoints: Pt[] = !showProjection || scenario === "pesimisticka" || !todayPt
    ? allPoints
    : dtiSimulation
    ? [...allPoints.filter(p => p.ms <= nowMs), ...dtiSimulation.points]
    : allPoints.map(p => {
        if (p.ms <= nowMs) return p;
        const value = todayPt.value * Math.pow(1 + scenarioRate, (p.ms - nowMs) / (365 * 86400000));
        const debt = p.debt + targetLtv * (value - todayPt.value);
        return { ms: p.ms, value, debt };
      });

  const maxVal = Math.max(...chartPoints.map(p => p.value));
  const minVal = Math.min(...chartPoints.map(p => Math.min(p.value - p.debt, 0)));
  const valRange = maxVal - minVal || 1;
  const toX = (ms: number) => PAD_L + ((ms - minMs) / totalMs) * (W - PAD_L - PAD_R);
  const toY = (v: number) => PAD_T + (1 - (v - minVal) / valRange) * (H - PAD_T - PAD_B);

  const valuePts = chartPoints.map(p => `${toX(p.ms).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
  const debtPts = chartPoints.map(p => `${toX(p.ms).toFixed(1)},${toY(p.debt).toFixed(1)}`).join(" ");
  const equityPts = chartPoints.map(p => `${toX(p.ms).toFixed(1)},${toY(p.value - p.debt).toFixed(1)}`).join(" ");
  const equityFill = equityPts + ` ${toX(maxMs).toFixed(1)},${toY(minVal).toFixed(1)} ${toX(minMs).toFixed(1)},${toY(minVal).toFixed(1)}`;
  const todayX = toX(nowMs);

  const startYear = new Date(minMs).getFullYear();
  const endYear = new Date(maxMs).getFullYear();
  const labelMs: number[] = [];
  const firstLabel = Math.ceil(startYear / 5) * 5;
  for (let y = firstLabel; y <= endYear; y += 5) labelMs.push(new Date(y, 0, 1).getTime());

  const gridVals = [maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map(v => ({ v, y: toY(v) }));

  const purchaseMarkers: { ms: number }[] = [];
  const seenDates = new Set<string>();
  for (const p of properties) {
    if (p.purchase_date && !seenDates.has(p.purchase_date)) {
      const ms = new Date(p.purchase_date).getTime();
      if (ms <= nowMs) { purchaseMarkers.push({ ms }); seenDates.add(p.purchase_date); }
    }
  }
  const futurePurchases: ProjectionPurchase[] = dtiSimulation
    ? dtiSimulation.rows.flatMap(r => r.purchases).sort((a, b) => a.ms - b.ms)
    : [];

  // Uložený plán — trajektorie i majetková delta oproti realitě, zobrazí se jen u scénáře "Simulace akvizic"
  const planOverlayPts = activePlan && scenario === "optimisticka"
    ? activePlan.points.filter(p => p.ms >= minMs && p.ms <= maxMs)
    : [];
  const planEquityPts = planOverlayPts.map(p => `${toX(p.ms).toFixed(1)},${toY(p.value - p.debt).toFixed(1)}`).join(" ");
  const planNowVal = activePlan && scenario === "optimisticka" ? planValueAtMs(activePlan.points, nowMs) : null;
  const planEquityNow = planNowVal ? planNowVal.value - planNowVal.debt : null;
  const realEquityNow = todayPt ? todayPt.value - todayPt.debt : null;
  const planDelta = planEquityNow !== null && realEquityNow !== null ? realEquityNow - planEquityNow : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const ms = minMs + ((svgX - PAD_L) / (W - PAD_L - PAD_R)) * totalMs;
    const idx = chartPoints.reduce((best, p, i) => Math.abs(p.ms - ms) < Math.abs(chartPoints[best].ms - ms) ? i : best, 0);
    setHoverIdx(idx);
  };

  const hp = hoverIdx !== null ? chartPoints[hoverIdx] : null;
  const hpX = hp ? toX(hp.ms) : 0;
  const tooltipRight = hpX > W * 0.6;

  return (
    <div style={{ padding: "34px 4px 8px" }}>
      <div className="eq-chart-header flex justify-between items-center mb-3">
        <div className="eq-chart-title" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{t("Jak rosteš v čase", "How you grow over time")}</div>
        <div className="flex items-center gap-4" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Range switcher */}
          <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 16, padding: 2 }}>
            {(["5", "10", "all"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{ padding: "8px 14px", borderRadius: 14, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: range === r ? "#1f3d2e" : "transparent",
                  color: range === r ? "#f5f1e6" : "#5c6359" }}>
                {r === "all" ? t("Vše", "All") : t(`${r} let`, `${r} yrs`)}
              </button>
            ))}
          </div>
          {/* Predikce do budoucna */}
          <button onClick={() => setShowProjection(v => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 16, border: `1.5px solid ${showProjection ? "#1f3d2e" : "#d2cab4"}`, background: showProjection ? "#1f3d2e" : "transparent", color: showProjection ? "#f5f1e6" : "#5c6359", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            <span style={{ width: 26, height: 14, borderRadius: 8, background: showProjection ? "#c9a24b" : "#d2cab4", position: "relative", display: "inline-block", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 1.5, left: showProjection ? 13 : 1.5, width: 11, height: 11, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
            </span>
            {t("Predikce do budoucna", "Future forecast")}
          </button>
          {/* Legend */}
          <div className="flex gap-4" style={{ fontSize: 11, fontWeight: 600, color: "#5c6359" }}>
            {([{ color: "#1f3d2e", label: t("Majetek", "Equity") }, { color: "#c39a3f", label: t("Hodnota portfolia", "Portfolio value") }, { color: "#b08c7a", label: t("Dluh", "Debt") }] as {color:string;label:string}[]).map(({ color, label }) => (
              <span key={label} className="inline-flex items-center gap-[6px]">
                <span style={{ width: 14, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />{label}
              </span>
            ))}
            {planOverlayPts.length > 1 && (
              <span className="inline-flex items-center gap-[6px]">
                <span style={{ width: 14, height: 0, borderTop: "1.5px dashed #9a9483", display: "inline-block" }} />{t("Plán", "Plan")}
              </span>
            )}
          </div>
        </div>
      </div>
      {showProjection && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "inline-flex", flexWrap: "wrap", background: "#e6e0d0", borderRadius: 16, padding: 2 }}>
            {([["pesimisticka", t("Bez akvizic", "No acquisitions")], ["konzervativni", t("Historické tempo", "Historical pace")], ["optimisticka", t("Simulace akvizic", "Acquisition simulation")]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setScenario(val)}
                style={{ padding: "7px 14px", borderRadius: 14, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: scenario === val ? "#1f3d2e" : "transparent",
                  color: scenario === val ? "#f5f1e6" : "#5c6359" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9a9483", marginTop: 6, lineHeight: 1.5, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span>
              {scenario === "pesimisticka" && t("Bez akvizic: každá nemovitost roste jen vlastním tempem (bez dalších nákupů) — žádná nová akvizice se nepředpokládá.", "No acquisitions: each property grows only at its own pace (no further purchases) — no new acquisition is assumed.")}
              {scenario === "konzervativni" && t("Historické tempo: pokračování dosavadního tempa — portfolio roste stejným historickým ročním tempem, jaké dosud reálně dosahovalo (viz \"Průměrný roční růst hodnoty portfolia\" níže).", "Historical pace: continuing the current pace — the portfolio grows at the same historical annual rate it has actually achieved so far (see \"Average annual portfolio value growth\" below).")}
              {scenario === "optimisticka" && (dtiEnabled
                ? t("Simulace akvizic: simuluje jednotlivé budoucí nákupy nemovitostí (financované kombinací vlastního kapitálu a refinancování portfolia), s ohledem na tvůj věk, příjem a bankovní testy DSTI/DTI/LTV (nastaveno v Nastavení → Finanční profil).", "Acquisition simulation: simulates individual future property purchases (financed by a mix of your own capital and refinancing the portfolio), factoring in your age, income, and bank DSTI/DTI/LTV tests (set up in Settings → Financial profile).")
                : t("Simulace akvizic: historické tempo × 1,3 — pro přesnější odhad založený na tvém věku, příjmu a skutečné bonitě nastav Finanční profil v Nastavení.", "Acquisition simulation: historical pace × 1.3 — for a more accurate estimate based on your age, income and actual creditworthiness, set up your Financial profile in Settings."))}
            </span>
            {scenario === "optimisticka" && dtiEnabled && (
              <button onClick={onOpenProjectionSettings}
                style={{ flexShrink: 0, background: "none", border: "none", padding: 0, color: "#1f3d2e", fontSize: 11, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
                ⚙ {t("Upravit předpoklady", "Edit assumptions")}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="eq-chart-wrap" style={{ position: "relative" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height="250"
          style={{ display: "block", overflow: "visible", cursor: "crosshair" }}
          onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
          <defs>
            <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f3d2e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1f3d2e" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Left grid + axis */}
          {gridVals.map(({ y }, i) => <line key={i} x1={PAD_L} y1={y.toFixed(1)} x2={W - PAD_R} y2={y.toFixed(1)} stroke="#d8d0bd" strokeWidth="1" />)}
          {gridVals.map(({ v, y }, i) => (
            <text key={i} x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9a9483">{fmtMil(v)}M</text>
          ))}
          {/* Today line */}
          <line x1={todayX.toFixed(1)} y1={PAD_T} x2={todayX.toFixed(1)} y2={H - PAD_B} stroke="#c9a24b" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={todayX + 4} y={PAD_T + 10} fontSize="9" fill="#c9a24b" fontWeight="600">{t("dnes", "today")}</text>
          {/* Chart lines */}
          <polygon points={equityFill} fill="url(#eqfill)" />
          <polyline points={debtPts} fill="none" stroke="#b08c7a" strokeWidth="2" />
          <polyline points={valuePts} fill="none" stroke="#c39a3f" strokeWidth="2" />
          <polyline points={equityPts} fill="none" stroke="#1f3d2e" strokeWidth="3" />
          {planOverlayPts.length > 1 && (
            <polyline points={planEquityPts} fill="none" stroke="#9a9483" strokeWidth="1.5" strokeDasharray="5 3" />
          )}
          {(() => {
            const tp = chartPoints.find(p => p.ms >= nowMs);
            if (!tp) return null;
            return <circle cx={todayX.toFixed(1)} cy={toY(tp.value - tp.debt).toFixed(1)} r="4.5" fill="#1f3d2e" />;
          })()}
          {/* Purchase markers */}
          {purchaseMarkers.map((m, i) => {
            const x = toX(m.ms);
            return (
              <g key={i}>
                <line x1={x.toFixed(1)} y1={(H - PAD_B).toFixed(1)} x2={x.toFixed(1)} y2={(H - PAD_B + 6).toFixed(1)} stroke="#c39a3f" strokeWidth="2" />
                <circle cx={x.toFixed(1)} cy={(H - PAD_B + 8).toFixed(1)} r="3" fill="#c39a3f" opacity="0.8" />
              </g>
            );
          })}
          {/* Future (simulated) purchase markers — hollow to distinguish from real past purchases */}
          {futurePurchases.map((m, i) => {
            const x = toX(m.ms);
            return (
              <g key={i}>
                <line x1={x.toFixed(1)} y1={(H - PAD_B).toFixed(1)} x2={x.toFixed(1)} y2={(H - PAD_B + 6).toFixed(1)} stroke="#c39a3f" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
                <circle cx={x.toFixed(1)} cy={(H - PAD_B + 8).toFixed(1)} r="3" fill="none" stroke="#c39a3f" strokeWidth="1.5" opacity="0.8" />
              </g>
            );
          })}
          {/* X axis labels */}
          {labelMs.map((ms, i) => (
            <text key={i} x={toX(ms).toFixed(1)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9a9483">{new Date(ms).getFullYear()}</text>
          ))}
          {/* Hover */}
          {hp && <line x1={hpX.toFixed(1)} y1={PAD_T} x2={hpX.toFixed(1)} y2={H - PAD_B} stroke="#888" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />}
          {hp && <>
            <circle cx={hpX.toFixed(1)} cy={toY(hp.value).toFixed(1)} r="3.5" fill="#c39a3f" />
            <circle cx={hpX.toFixed(1)} cy={toY(hp.value - hp.debt).toFixed(1)} r="3.5" fill="#1f3d2e" />
            <circle cx={hpX.toFixed(1)} cy={toY(hp.debt).toFixed(1)} r="3" fill="#b08c7a" />
          </>}
        </svg>
        {/* Tooltip */}
        {hp && (
          <div style={{
            position: "absolute",
            top: `${Math.max(0, (toY(hp.value) / H * 250 - 10))}px`,
            ...(tooltipRight ? { right: `${((W - hpX) / W * 100).toFixed(1)}%` } : { left: `${(hpX / W * 100 + 1).toFixed(1)}%` }),
            background: "#1c2b22", color: "#f5f1e6", borderRadius: 8, padding: "8px 12px",
            fontSize: 12, fontWeight: 600, pointerEvents: "none", whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 10,
          }}>
            <div style={{ color: "#9ab8a0", fontSize: 10, marginBottom: 4 }}>
              {new Date(hp.ms).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-US", { month: "short", year: "numeric" })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div><span style={{ color: "#c39a3f" }}>{t("Hodnota portfolia", "Portfolio value")}</span>{"  "}{fmtMil(hp.value)} {t("mil", "M")}</div>
              <div><span style={{ color: "#b08c7a" }}>{t("Dluh", "Debt")}</span>{"  "}{fmtMil(hp.debt)} {t("mil", "M")}</div>
              <div><span style={{ color: "#6fcf8a" }}>{t("Majetek", "Equity")}</span>{"  "}{fmtMil(hp.value - hp.debt)} {t("mil", "M")}</div>
            </div>
          </div>
        )}
      </div>
      {/* Avg annual growth stat */}
      {(avgGrowthPct !== null || avgPortfolioGrowthPct !== null) && (
        <div style={{ marginTop: 10, display: "flex", gap: 24, fontSize: 12, color: "#7c8378", flexWrap: "wrap" }}>
          {avgGrowthPct !== null && (
            <span>{t("Průměrný roční růst majetku:", "Average annual equity growth:")} <strong style={{ color: avgGrowthPct >= 0 ? "#4a7c59" : "#c0392b" }}>{avgGrowthPct >= 0 ? "+" : ""}{avgGrowthPct.toFixed(1)} %</strong></span>
          )}
          {avgPortfolioGrowthPct !== null && (
            <span>{t("Průměrný roční růst hodnoty portfolia:", "Average annual portfolio value growth:")} <strong style={{ color: avgPortfolioGrowthPct >= 0 ? "#c39a3f" : "#c0392b" }}>{avgPortfolioGrowthPct >= 0 ? "+" : ""}{avgPortfolioGrowthPct.toFixed(1)} %</strong></span>
          )}
        </div>
      )}
      {showProjection && todayPt && (scenario === "konzervativni" || (scenario === "optimisticka" && !dtiEnabled)) && (
        <div style={{ marginTop: 4, fontSize: 10, color: "#b0aa99", lineHeight: 1.4 }}>
          {t(
            `Odhad dluhu: stávající hypotéky dál doamortizují, každá koruna růstu hodnoty nad dnešek se počítá jako ${Math.round(targetLtv * 100)} % dluh / ${100 - Math.round(targetLtv * 100)} % vlastní kapitál (cílové LTV z Bankovních parametrů) — zjednodušený odhad, ne simulace jednotlivých nákupů.`,
            `Debt estimate: existing mortgages keep amortizing; each unit of value growth above today's is split ${Math.round(targetLtv * 100)}% debt / ${100 - Math.round(targetLtv * 100)}% equity (target LTV from Bank parameters) — a simplified estimate, not a purchase-by-purchase simulation.`
          )}
        </div>
      )}
      {/* Odchylka od uloženého plánu */}
      {scenario === "optimisticka" && activePlan && planDelta !== null && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#7c8378" }}>
          {t("Podle plánu z", "According to the plan from")} {new Date(activePlan.created_at).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-US", { month: "short", year: "numeric" })}
          {" ("}{activePlan.label ?? t("bez názvu", "unnamed")}{"): "}
          <strong style={{ color: planDelta >= 0 ? "#4a7c59" : "#c0392b" }}>
            {planDelta >= 0 ? "+" : ""}{fmt(planDelta)} Kč {planDelta >= 0 ? t("napřed", "ahead") : t("ve skluzu", "behind")}
          </strong>
        </div>
      )}
      {/* Planned future acquisitions list (Simulace akvizic scenario) */}
      {scenario === "optimisticka" && futurePurchases.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #e6e0d0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {t("Plánované akvizice", "Planned acquisitions")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {futurePurchases.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#5c6359", background: "#f5f1e6", borderRadius: 8, padding: "8px 12px", flexWrap: "wrap" }}>
                <span style={{ color: "#c39a3f", fontWeight: 700, minWidth: 78 }}>
                  {t("cca", "approx.")} {String(new Date(m.ms).getMonth() + 1).padStart(2, "0")}/{new Date(m.ms).getFullYear()}
                </span>
                <span style={{ fontWeight: 600, minWidth: 110 }}>{fmt(m.price)} Kč</span>
                <span style={{ color: "#9a9483" }}>{t("nájem", "rent")} ~{fmt(Math.round(m.rent))} Kč/měs</span>
                <span style={{ color: "#9a9483" }}>{t("splátka", "payment")} ~{fmt(Math.round(m.payment))} Kč/měs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cashflow Extra (donut + nejlepší/nejhorší) ────────────────────────────────
function CashflowExtra({ properties, mortgages, debts, showPlanned, showDebtsInCashflow }: { properties: Property[]; mortgages: Mortgage[]; debts: Debt[]; showPlanned: boolean; showDebtsInCashflow: boolean }) {
  if (properties.length === 0) return null;

  const visibleProps = showPlanned ? properties : properties.filter(p => p.status !== "planned");
  const ownedProps = visibleProps.filter(p => p.ownership_type !== "manager");
  const managedProps = visibleProps.filter(p => p.ownership_type === "manager");
  const totalRent = ownedProps.reduce((s, p) => s + (p.status === "rented" || (showPlanned && p.status === "planned") ? p.rent_amount : 0), 0);
  const totalMortgage = mortgages.filter(m => ownedProps.some(p => p.id === m.property_id)).reduce((s, m) => s + m.monthly_payment, 0);
  const totalInsurance = ownedProps.reduce((s, p) => s + (p.insurance_amount ? p.insurance_amount / 12 : 0), 0);
  const totalCosts = ownedProps.reduce((s, p) => s + (p.monthly_costs ?? 0), 0);
  const totalMgmtFee = managedProps.reduce((s, p) => s + (p.management_fee ?? 0), 0);
  const debtsIncome = showDebtsInCashflow ? debts.filter(d => d.direction === "they_owe").reduce((s, d) => s + (d.monthly_payment ?? 0), 0) : 0;
  const debtsExpense = showDebtsInCashflow ? debts.filter(d => d.direction === "i_owe").reduce((s, d) => s + (d.monthly_payment ?? 0), 0) : 0;
  const net = totalRent + debtsIncome - totalMortgage - totalInsurance - totalCosts - debtsExpense + totalMgmtFee;

  const propCashflow = visibleProps.map(p => {
    const isManaged = p.ownership_type === "manager";
    const mortgage = mortgages.find(m => m.property_id === p.id);
    const income = isManaged ? (p.management_fee ?? 0) : (p.status === "rented" || (showPlanned && p.status === "planned")) ? p.rent_amount : 0;
    const out = isManaged ? 0 : (mortgage?.monthly_payment ?? 0) + (p.insurance_amount ? p.insurance_amount / 12 : 0) + (p.monthly_costs ?? 0);
    return { id: p.id, name: p.name, netCf: income - out };
  });
  const best = propCashflow.reduce((a, b) => b.netCf > a.netCf ? b : a);
  const worst = propCashflow.reduce((a, b) => b.netCf < a.netCf ? b : a);

  const cx = 80, cy = 80, R = 60, sw = 20;
  const circ = 2 * Math.PI * R;
  const slices = [
    { label: "Splátky hypoték", value: totalMortgage, color: "#b85c5c" },
    { label: "Pojistky", value: Math.round(totalInsurance), color: "#c4a882" },
    { label: "Náklady", value: totalCosts, color: "#a89070" },
    { label: "Splátky půjček", value: debtsExpense, color: "#8a6d8f" },
    { label: "Čistý příjem", value: Math.max(net, 0), color: "#1f3d2e" },
  ].filter(s => s.value > 0);
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;

  let acc = 0;
  const donutSlices = slices.map(sl => {
    const dashLen = (sl.value / total) * circ;
    const startAngle = (acc / total) * 360 - 90;
    acc += sl.value;
    return { ...sl, dashLen, gap: circ - dashLen, startAngle };
  });

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
      {/* Donut */}
      <div style={{ background: "#f5f1e6", borderRadius: 12, padding: "22px 24px", flex: "1 1 300px", display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ flexShrink: 0 }}>
          <svg width={160} height={160} viewBox="0 0 160 160">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e0d9c8" strokeWidth={sw} />
            {donutSlices.map(sl => (
              <circle key={sl.label} cx={cx} cy={cy} r={R}
                fill="none" stroke={sl.color} strokeWidth={sw}
                strokeDasharray={`${sl.dashLen} ${sl.gap}`}
                transform={`rotate(${sl.startAngle} ${cx} ${cy})`}
              />
            ))}
            <text x={cx} y={cy - 7} textAnchor="middle" fill="#7c8378" fontSize="9" fontWeight="700">ČISTÝ CF</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fill={net >= 0 ? "#1f3d2e" : "#c0392b"} fontSize="13" fontWeight="800">{net >= 0 ? "+" : ""}{fmt(net)}</text>
            <text x={cx} y={cy + 23} textAnchor="middle" fill="#9a9483" fontSize="9">Kč / měs</text>
            {showPlanned && (() => {
              const plannedRent = properties.filter(p => p.status === "planned").reduce((s, p) => s + p.rent_amount, 0);
              if (!plannedRent) return null;
              return <text x={cx} y={cy + 36} textAnchor="middle" fill="#4a7c59" fontSize="8">z toho {fmt(plannedRent)} plán.</text>;
            })()}
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Kam jdou příjmy</div>
          {slices.map(sl => (
            <div key={sl.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#5c6359", flex: 1 }}>{sl.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: sl.label === "Čistý příjem" ? "#1f3d2e" : "#b85c5c" }}>
                {sl.label === "Čistý příjem" ? "+" : "−"}{fmt(sl.value)} Kč
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Nejlepší / nejhorší */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 200px" }}>
        <div style={{ background: "#eaf4ed", border: "1.5px solid #a8d5b5", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2d7a4f", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>🏆 Nejlepší nemovitost</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1c2b22", marginBottom: 4 }}>{best.name}</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 800, color: "#1f3d2e" }}>
            {best.netCf >= 0 ? "+" : ""}{fmt(best.netCf)} Kč
          </div>
          <div style={{ fontSize: 11, color: "#5a8a6a", marginTop: 2 }}>čistý cashflow / měs</div>
        </div>
        <div style={{ background: "#fdf0ee", border: "1.5px solid #f0b8b0", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a0392b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>💸 Nejhorší nemovitost</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1c2b22", marginBottom: 4 }}>{worst.name}</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 800, color: "#c0392b" }}>
            {worst.netCf >= 0 ? "+" : ""}{fmt(worst.netCf)} Kč
          </div>
          <div style={{ fontSize: 11, color: "#a07070", marginTop: 2 }}>čistý cashflow / měs</div>
        </div>
      </div>
    </div>
  );
}

// ── Tenant Edit Modal ─────────────────────────────────────────────────────────
function TenantEditModal({ tenant, properties, supabase, onClose, onSaved, onDeleted }: {
  tenant: Tenant;
  properties: Property[];
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: (t: Tenant) => void;
  onDeleted: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(tenant.name ?? "");
  const [account, setAccount] = useState(tenant.account_number ?? "");
  const [propertyId, setPropertyId] = useState(tenant.property_id ?? "");
  const [notes, setNotes] = useState(tenant.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const updates = { name: name.trim(), account_number: account.trim(), property_id: propertyId || null, notes: notes.trim() || null };
    await supabase.from("tenants").update(updates).eq("id", tenant.id);
    onSaved({ ...tenant, ...updates });
    setSaving(false);
    onClose();
  }

  async function deleteTenant() {
    await supabase.from("tenants").delete().eq("id", tenant.id);
    onDeleted(tenant.id);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 18, width: 640, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}>
        {/* Modal header */}
        <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#d6e4d6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f3d2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 700, color: "#1c2b22" }}>{tenant.name || "Nájemník"}</div>
            <div style={{ fontSize: 12, color: "#9a9483", marginTop: 1 }}>{tenant.account_number}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f0ebe1", color: "#5c6359", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Jméno</label>
              <input value={name} onChange={e => setName(e.target.value)}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid #e0d8cc", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Číslo účtu</label>
              <input value={account} onChange={e => setAccount(e.target.value)}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid #e0d8cc", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Nemovitost</label>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid #e0d8cc", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }}>
              <option value="">— nevybráno —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Poznámky</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kontakt, dohody, smlouva, reference…"
              style={{ width: "100%", minHeight: 260, padding: "14px 16px", borderRadius: 9, border: "1.5px solid #e0d8cc", background: "#faf8f3", fontSize: 15, color: "#1c2b22", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.8, outline: "none", letterSpacing: "0.01em" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#c0392b", fontWeight: 600 }}>Opravdu smazat?</span>
              <button onClick={deleteTenant}
                style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                Ano, smazat
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e0d8cc", background: "#faf8f3", color: "#5c6359", cursor: "pointer", fontWeight: 600 }}>
                Zrušit
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #f5c6c6", background: "#fff5f5", color: "#c0392b", cursor: "pointer", fontWeight: 600 }}>
              Smazat nájemníka
            </button>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose}
              style={{ fontSize: 13, padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e0d8cc", background: "#faf8f3", color: "#5c6359", cursor: "pointer", fontWeight: 600 }}>
              Zrušit
            </button>
            <button onClick={save} disabled={saving}
              style={{ fontSize: 13, padding: "9px 22px", borderRadius: 9, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Ukládám…" : "Uložit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tenant Card ───────────────────────────────────────────────────────────────
function TenantCard({ tenant, properties, supabase, onSaved, onDeleted }: {
  tenant: Tenant;
  properties: Property[];
  supabase: ReturnType<typeof createClient>;
  onSaved: (t: Tenant) => void;
  onDeleted: (id: string) => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const property = properties.find(p => p.id === tenant.property_id);

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e2d6", overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#d6e4d6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1f3d2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1c2b22", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.name || "—"}</div>
            <div style={{ fontSize: 12, color: "#9a9483", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.account_number}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            {property && (
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1f3d2e", background: "#d6e4d6", borderRadius: 20, padding: "3px 10px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.name}</div>
            )}
            <button onClick={() => setShowEdit(true)}
              style={{ padding: "5px 13px", borderRadius: 7, border: "1px solid #d2cab4", background: "#faf8f3", color: "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              Upravit
            </button>
          </div>
        </div>
        {tenant.notes && (
          <div style={{ borderTop: "1px solid #f0ebe1", padding: "9px 18px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <svg style={{ flexShrink: 0, marginTop: 2 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0a898" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <div style={{ fontSize: 12.5, color: "#6b6257", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tenant.notes}</div>
          </div>
        )}
      </div>
      {showEdit && (
        <TenantEditModal tenant={tenant} properties={properties} supabase={supabase}
          onClose={() => setShowEdit(false)}
          onSaved={t => { onSaved(t); setShowEdit(false); }}
          onDeleted={id => { onDeleted(id); setShowEdit(false); }} />
      )}
    </>
  );
}

// ── Add Property Modal ────────────────────────────────────────────────────────
function AddPropertyModal({ supabase, onClose, onSaved }: {
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: (p: Property) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("apartment");
  const [ownershipType, setOwnershipType] = useState("owner");
  const [status, setStatus] = useState<"rented" | "vacant" | "planned">("vacant");
  const [address, setAddress] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("properties").insert({
      user_id: user!.id,
      name: name.trim(),
      type,
      status,
      address: address.trim() || null,
      estimated_value: estimatedValue ? Number(estimatedValue) : 0,
      rent_amount: rentAmount ? Number(rentAmount) : 0,
      monthly_costs: 0,
      ownership_type: ownershipType,
    }).select().single();
    if (error) { alert("Chyba: " + error.message); setSaving(false); return; }
    onSaved(data);
    onClose();
  }

  const field = (label: string, value: string, onChange: (v: string) => void, type = "text", placeholder = "") => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "28px 28px 24px", width: 460, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: "#1c2b22", marginBottom: 20 }}>Nová nemovitost</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Název", name, setName, "text", "např. Byt Praha 3")}
          {field("Adresa", address, setAddress, "text", "")}

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Typ</div>
            <select value={type} onChange={e => setType(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22" }}>
              <option value="apartment">Byt</option>
              <option value="house">Dům</option>
              <option value="garage">Garáž</option>
              <option value="land">Pozemek</option>
              <option value="commercial">Komerční</option>
              <option value="other">Ostatní</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Vlastnictví</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["owner", "manager"] as const).map(o => (
                <button key={o} onClick={() => setOwnershipType(o)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `2px solid ${ownershipType === o ? "#1f3d2e" : "#d2cab4"}`, background: ownershipType === o ? "#1f3d2e" : "transparent", color: ownershipType === o ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {o === "owner" ? "Vlastním" : "Spravuji"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Stav</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["rented", "vacant", "planned"] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `2px solid ${status === s ? "#1f3d2e" : "#d2cab4"}`, background: status === s ? "#1f3d2e" : "transparent", color: status === s ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {s === "rented" ? "Pronajato" : s === "vacant" ? "Volné" : "Plánováno"}
                </button>
              ))}
            </div>
          </div>

          {field("Odhadovaná hodnota (Kč)", estimatedValue, setEstimatedValue, "number", "0")}
          {field("Měsíční nájem (Kč)", rentAmount, setRentAmount, "number", "0")}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onClose}
            style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", color: "#5c6359", cursor: "pointer" }}>
            Zrušit
          </button>
          <button onClick={save} disabled={saving || !name.trim()}
            style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 600, opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? "Ukládám…" : "Přidat"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Payment Modal (ruční přidání platby) ───────────────────────────────────
function AddPaymentModal({
  properties, mortgages, supabase, onClose, onSaved, defaultPropertyId, defaultMonth,
}: {
  properties: Property[];
  mortgages: Mortgage[];
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: (p: Payment) => void;
  defaultPropertyId?: string;
  defaultMonth?: string;
}) {
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? "");
  const [month, setMonth] = useState((defaultMonth ?? new Date().toISOString().slice(0, 7) + "-01").slice(0, 7));
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (propertyId && !amount) {
      const prop = properties.find(p => p.id === propertyId);
      if (prop?.rent_amount) setAmount(String(prop.rent_amount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function handleSave() {
    if (!propertyId || !amount) return;
    setSaving(true);
    setError("");
    const monthFull = month + "-01";
    const mortgage = mortgages.find(m => m.property_id === propertyId);
    const mortgagePayment = mortgage?.monthly_payment ?? 0;
    const rentReceived = Number(amount);
    const netCashflow = rentReceived - mortgagePayment;

    const { data: existing, error: selectErr } = await supabase.from("payments").select("id").eq("property_id", propertyId).eq("month", monthFull);
    if (selectErr) {
      setSaving(false);
      setError(selectErr.message);
      return;
    }
    let saved: Payment | null = null;
    let saveErr: { message: string } | null = null;
    if (existing && existing.length > 0) {
      const { data, error: updErr } = await supabase.from("payments").update({
        rent_received: rentReceived, mortgage_payment: mortgagePayment, net_cashflow: netCashflow,
        status: "paid", match_type: "manual", payment_type: "rent", payment_date: paymentDate,
      }).eq("id", existing[0].id).select().single();
      saved = data;
      saveErr = updErr;
    } else {
      const { data, error: insErr } = await supabase.from("payments").insert({
        property_id: propertyId, month: monthFull, rent_received: rentReceived, mortgage_payment: mortgagePayment,
        net_cashflow: netCashflow, status: "paid", match_type: "manual", payment_type: "rent", payment_date: paymentDate,
      }).select().single();
      saved = data;
      saveErr = insErr;
    }
    setSaving(false);
    if (saveErr || !saved) {
      setError(saveErr?.message || "Uložení se nezdařilo (žádná data se nevrátila).");
      return;
    }
    onSaved(saved);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#faf8f3", borderRadius: 16, padding: "28px 28px 24px", width: 420, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: "#1c2b22", marginBottom: 20 }}>Přidat platbu</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Nemovitost</div>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }}>
              <option value="">— Vyber —</option>
              {properties.filter(p => p.status !== "planned").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Měsíc</div>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Částka (Kč)</div>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Datum platby</div>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "#fde8e8", color: "#c0392b", fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="flex gap-3 justify-end" style={{ marginTop: 20 }}>
          <button onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 14, color: "#5c6359", cursor: "pointer" }}>
            Zrušit
          </button>
          <button onClick={handleSave} disabled={!propertyId || !amount || saving}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: (!propertyId || !amount) ? "#c5bfb0" : "#1f3d2e", fontSize: 14, fontWeight: 600, color: "#f5f1e6", cursor: (!propertyId || !amount) ? "not-allowed" : "pointer" }}>
            {saving ? "Ukládám…" : "Uložit platbu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Debt Modal ────────────────────────────────────────────────────────────────
function DebtModal({ debt, supabase, onClose, onSaved, onDeleted }: {
  debt: Debt | null;
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: (d: Debt) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState({
    direction: (debt?.direction ?? "i_owe") as "i_owe" | "they_owe",
    name: debt?.name ?? "",
    amount_original: debt?.amount_original?.toString() ?? "",
    amount_remaining: debt?.amount_remaining?.toString() ?? "",
    monthly_payment: debt?.monthly_payment?.toString() ?? "",
    interest_rate: debt?.interest_rate?.toString() ?? "",
    note: debt?.note ?? "",
    due_date: debt?.due_date ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!form.name.trim() || !form.amount_remaining) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id: user!.id,
      direction: form.direction,
      name: form.name.trim(),
      amount_original: parseFloat(form.amount_original) || parseFloat(form.amount_remaining) || 0,
      amount_remaining: parseFloat(form.amount_remaining) || 0,
      monthly_payment: form.monthly_payment ? parseFloat(form.monthly_payment) : null,
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
      note: form.note.trim() || null,
      due_date: form.due_date || null,
    };
    if (debt) {
      await supabase.from("debts").update(payload).eq("id", debt.id);
      onSaved({ ...debt, ...payload });
    } else {
      const { data } = await supabase.from("debts").insert(payload).select().single();
      if (data) onSaved(data);
    }
    setSaving(false);
    onClose();
  }

  async function deleteDebt() {
    if (!debt) return;
    await supabase.from("debts").delete().eq("id", debt.id);
    onDeleted(debt.id);
    onClose();
  }

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div key={key}>
      <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>{label}</div>
      <input type={type} value={form[key] as string} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#faf8f3", borderRadius: 16, padding: "28px 28px 24px", width: 420, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: "#1c2b22", marginBottom: 20 }}>
          {debt ? "Upravit záznam" : "Nový záznam"}
        </div>

        <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 20, padding: 3, marginBottom: 16 }}>
          {(["i_owe", "they_owe"] as const).map(dir => (
            <button key={dir} onClick={() => setForm(f => ({ ...f, direction: dir }))}
              style={{ flex: 1, padding: "6px 0", borderRadius: 18, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
                background: form.direction === dir ? (dir === "i_owe" ? "#c0392b" : "#1f3d2e") : "transparent",
                color: form.direction === dir ? "#f5f1e6" : "#5c6359" }}>
              {dir === "i_owe" ? "Já dlužím" : "Mně dluží"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {field("Komu / od koho", "name", "text", "např. Spotřebitelský úvěr, Půjčka…")}
          {field("Zbývá splatit (Kč)", "amount_remaining", "number", "0")}
          {field("Původní částka (Kč)", "amount_original", "number", "0")}
          {field("Měsíční splátka (Kč)", "monthly_payment", "number", "")}
          {field("Úroková sazba (%)", "interest_rate", "number", "")}
          {field("Splatnost do", "due_date", "date", "")}
          {field("Poznámka", "note", "text", "")}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <div>
            {debt && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)}
                style={{ fontSize: 13, color: "#c0392b", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                Smazat
              </button>
            )}
            {debt && confirmDelete && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#7c8378" }}>Opravdu smazat?</span>
                <button onClick={deleteDebt} style={{ fontSize: 12, color: "#c0392b", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Ano</button>
                <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 12, color: "#5c6359", background: "none", border: "none", cursor: "pointer" }}>Zrušit</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose}
              style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", color: "#5c6359", cursor: "pointer" }}>
              Zrušit
            </button>
            <button onClick={save} disabled={saving || !form.name.trim() || !form.amount_remaining}
              style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 600, opacity: saving || !form.name.trim() || !form.amount_remaining ? 0.6 : 1 }}>
              {saving ? "Ukládám…" : "Uložit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Tenant Modal ──────────────────────────────────────────────────────────
function AddTenantModal({ properties, supabase, onClose, onSaved }: {
  properties: Property[];
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: (t: Tenant) => void;
}) {
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: err } = await supabase.from("tenants").insert({
      name: name.trim(),
      account_number: account.trim() || null,
      property_id: propertyId || null,
      notes: notes.trim() || null,
      user_id: user!.id,
    }).select().single();
    if (err) {
      setError(err.code === "23505" ? "Nájemník s tímto číslem účtu už existuje." : "Chyba při ukládání, zkus to znovu.");
    } else if (data) {
      onSaved(data as Tenant);
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 24px", width: 420, maxWidth: "92vw", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 700, color: "#1c2b22", marginBottom: 20 }}>Přidat nájemníka</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Jméno *</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jan Novák"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Číslo účtu</div>
            <input value={account} onChange={e => setAccount(e.target.value)} placeholder="64183/0800"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Nemovitost</div>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22", boxSizing: "border-box" }}>
              <option value="">— nevybráno —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Poznámky</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kontakt, reference, dohody…"
              style={{ width: "100%", minHeight: 70, padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 13, color: "#1c2b22", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 12, padding: "9px 13px", borderRadius: 8, background: "#fff5f5", border: "1px solid #f5c6c6", color: "#c0392b", fontSize: 13 }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", color: "#5c6359", cursor: "pointer", fontWeight: 600 }}>Zrušit</button>
          <button onClick={save} disabled={saving || !name.trim()}
            style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 600, opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? "Ukládám…" : "Přidat"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Todoist Úkoly sekce ───────────────────────────────────────────────────────
type TodoistTask = { id: string; content: string; priority: number; due?: { date: string } | null; labels: string[]; checked: boolean };

const LABEL_GROUPS: { label: string; title: string; color: string }[] = [
  { label: "akvizice", title: "Akvizice", color: "#c4a060" },
  { label: "hostivice", title: "Hostivice", color: "#4a7c59" },
  { label: "most", title: "Most", color: "#4a7c59" },
  { label: "zahalka", title: "Zahálka", color: "#4a7c59" },
];

function priorityColor(p: number) {
  if (p === 1) return "#c0392b";
  if (p === 2) return "#e67e22";
  if (p === 3) return "#3498db";
  return "#9a9483";
}

function TodoistSection() {
  const [tasks, setTasks] = React.useState<TodoistTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [completing, setCompleting] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    const results: TodoistTask[] = [];
    await Promise.all(LABEL_GROUPS.map(async g => {
      try {
        const res = await fetch(`/api/todoist-tasks?label=${g.label}`);
        if (res.ok) { const data = await res.json(); results.push(...data); }
      } catch {}
    }));
    const unique = Array.from(new Map(results.map(t => [t.id, t])).values());
    setTasks(unique);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleComplete = async (taskId: string) => {
    setCompleting(taskId);
    await fetch(`/api/todoist-tasks?complete=${taskId}`, { method: "POST" });
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCompleting(null);
  };

  const grouped = LABEL_GROUPS.map(g => ({
    ...g,
    tasks: tasks.filter(t => t.labels.includes(g.label)),
  })).filter(g => g.tasks.length > 0);

  return (
    <div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 700, color: "#1c2b22", marginBottom: 20 }}>Úkoly</div>
      {loading ? (
        <div style={{ color: "#9a9483", fontSize: 14 }}>Načítám úkoly…</div>
      ) : grouped.length === 0 ? (
        <div style={{ color: "#9a9483", fontSize: 14 }}>Žádné úkoly. Přidej label v Todoist.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {grouped.map(g => (
            <div key={g.label} style={{ background: "#f5f1e6", borderRadius: 12, padding: "18px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color }} />
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1c2b22", textTransform: "uppercase", letterSpacing: "0.08em" }}>{g.title}</div>
                <div style={{ fontSize: 12, color: "#9a9483" }}>({g.tasks.length})</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.tasks.sort((a, b) => a.priority - b.priority).map(task => (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e3ddcb" }}>
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={completing === task.id}
                      style={{ flexShrink: 0, marginTop: 1, width: 18, height: 18, borderRadius: "50%", border: `2px solid ${priorityColor(task.priority)}`, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {completing === task.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9a9483" }} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "#1c2b22", lineHeight: 1.4 }}>{task.content}</div>
                      {task.due && (
                        <div style={{ fontSize: 11, color: "#9a9483", marginTop: 3 }}>
                          {new Date(task.due.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "long" })}
                        </div>
                      )}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor(task.priority), flexShrink: 0, marginTop: 5 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EquityDashboard() {
  const SECTION_IDS = ["dashboard", "nemovitosti", "platby", "najemnici", "komunikace", "asistent", "dluhy", "nastaveni"];

  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unmatchedPayments, setUnmatchedPayments] = useState<Payment[]>([]);
  const [propertyFiles, setPropertyFiles] = useState<PropertyFile[]>([]);
  const [fileThumbUrls, setFileThumbUrls] = useState<Record<string, string>>({});
  const [valuations, setValuations] = useState<PropertyValuation[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyModalTab, setPropertyModalTab] = useState<"details" | "files" | "valuations">("details");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("··");
  const [language, setLanguage] = useState<"cs" | "en">("cs");
  const [dtiEnabled, setDtiEnabled] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [incomeEmployment, setIncomeEmployment] = useState("");
  const [incomeOther, setIncomeOther] = useState("");
  const [householdCosts, setHouseholdCosts] = useState("");
  const [assumedLtvPct, setAssumedLtvPct] = useState("70");
  const [savingFinancialProfile, setSavingFinancialProfile] = useState(false);
  const [projectionSettings, setProjectionSettings] = useState<ProjectionSettings>(DEFAULT_PROJECTION_SETTINGS);
  const [showProjectionSettingsModal, setShowProjectionSettingsModal] = useState(false);
  const [projectionPlans, setProjectionPlans] = useState<ProjectionPlan[]>([]);
  function t<K extends keyof typeof translations["cs"]>(key: K): typeof translations["cs"][K] {
    return translations[language][key] as typeof translations["cs"][K];
  }
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserEmail(user.email ?? null);
      const fullName = user.user_metadata?.full_name as string | undefined;
      if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        const initials = parts.length >= 2
          ? parts[0][0] + parts[parts.length - 1][0]
          : fullName.slice(0, 2);
        setUserInitials(initials.toUpperCase());
      } else if (user.email) {
        setUserInitials(user.email.slice(0, 2).toUpperCase());
      }
      supabase.from("profiles").select("language, birth_year, income_employment, income_other, dti_projection_enabled, household_costs, assumed_ltv_pct, projection_settings").eq("id", user.id).single().then(({ data: profile }) => {
        if (profile?.language === "en" || profile?.language === "cs") setLanguage(profile.language);
        if (profile?.dti_projection_enabled) setDtiEnabled(true);
        if (profile?.birth_year) setBirthYear(String(profile.birth_year));
        if (profile?.income_employment) setIncomeEmployment(String(profile.income_employment));
        if (profile?.income_other) setIncomeOther(String(profile.income_other));
        if (profile?.household_costs) setHouseholdCosts(String(profile.household_costs));
        if (profile?.assumed_ltv_pct) setAssumedLtvPct(String(profile.assumed_ltv_pct));
        if (profile?.projection_settings) setProjectionSettings({ ...DEFAULT_PROJECTION_SETTINGS, ...profile.projection_settings });
      });
    });
  }, []);

  async function saveLanguage(lang: "cs" | "en") {
    setLanguage(lang);
    setSavingLanguage(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").upsert({ id: user.id, language: lang });
    setSavingLanguage(false);
  }

  async function saveFinancialProfile(next?: { dtiEnabled?: boolean }) {
    setSavingFinancialProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        dti_projection_enabled: next?.dtiEnabled ?? dtiEnabled,
        birth_year: birthYear ? Number(birthYear) : null,
        income_employment: incomeEmployment ? Number(incomeEmployment) : null,
        income_other: incomeOther ? Number(incomeOther) : null,
        household_costs: householdCosts ? Number(householdCosts) : null,
        assumed_ltv_pct: assumedLtvPct ? Number(assumedLtvPct) : 70,
      });
    }
    setSavingFinancialProfile(false);
  }

  async function saveProjectionModal(next: ProjectionModalSave) {
    setBirthYear(next.birthYear);
    setIncomeEmployment(next.incomeEmployment);
    setIncomeOther(next.incomeOther);
    setHouseholdCosts(next.householdCosts);
    setAssumedLtvPct(next.assumedLtvPct);
    setProjectionSettings(next.settings);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        birth_year: next.birthYear ? Number(next.birthYear) : null,
        income_employment: next.incomeEmployment ? Number(next.incomeEmployment) : null,
        income_other: next.incomeOther ? Number(next.incomeOther) : null,
        household_costs: next.householdCosts ? Number(next.householdCosts) : null,
        assumed_ltv_pct: next.assumedLtvPct ? Number(next.assumedLtvPct) : 70,
        projection_settings: next.settings,
      });
    }
  }

  async function saveProjectionPlan(settings: ProjectionPlanSettings, points: SimPt[], label?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const prevActive = projectionPlans.find(p => p.status === "active") ?? null;
    if (prevActive) {
      await supabase.from("projection_plans").update({ status: "superseded" }).eq("id", prevActive.id);
    }
    const { data } = await supabase.from("projection_plans").insert({
      user_id: user.id,
      label: label || new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }),
      settings, points, status: "active", supersedes_id: prevActive?.id ?? null,
    }).select().single();
    setProjectionPlans(prev => [
      ...(data ? [data as ProjectionPlan] : []),
      ...prev.map(p => p.id === prevActive?.id ? { ...p, status: "superseded" as const } : p),
    ]);
  }

  async function archiveProjectionPlan(id: string) {
    await supabase.from("projection_plans").update({ status: "archived" }).eq("id", id);
    setProjectionPlans(prev => prev.map(p => p.id === id ? { ...p, status: "archived" as const } : p));
  }

  type ChatMessage = { role: "user" | "assistant"; content: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Komunikace
  const [commPropertyId, setCommPropertyId] = useState<string | null>(null);
  const [commMessages, setCommMessages] = useState<Message[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [incomingText, setIncomingText] = useState("");
  const [incomingDirection, setIncomingDirection] = useState<"inbound" | "outbound">("inbound");
  const [incomingChannel, setIncomingChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [draftText, setDraftText] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [savingMsg, setSavingMsg] = useState(false);
  const [cfExpanded, setCfExpanded] = useState<"income" | "expenses" | "net" | null>(null);
  const [cfPropExpanded, setCfPropExpanded] = useState<string | null>(null);
  const [showPlanned, setShowPlanned] = useState(false);
  const [showPlannedProps, setShowPlannedProps] = useState(false);
  const [showDebtsInCashflow, setShowDebtsInCashflow] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showDebtsBalance, setShowDebtsBalance] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtModal, setDebtModal] = useState<{ open: boolean; debt: Debt | null }>({ open: false, debt: null });
  const [addPaymentModal, setAddPaymentModal] = useState<{ open: boolean; propertyId?: string; month?: string }>({ open: false });
  const [copied, setCopied] = useState(false);

  async function loadMessages(propertyId: string) {
    setCommLoading(true);
    const { data } = await supabase.from("messages").select("*").eq("property_id", propertyId).order("created_at", { ascending: true });
    setCommMessages(data ?? []);
    setCommLoading(false);
  }

  useEffect(() => {
    if (commPropertyId) loadMessages(commPropertyId);
  }, [commPropertyId]);

  async function handleLogIncoming() {
    const text = incomingText.trim();
    if (!text || !commPropertyId) return;
    setSavingMsg(true);
    const { data: { user: msgUser } } = await supabase.auth.getUser();
    await supabase.from("messages").insert({ property_id: commPropertyId, channel: incomingChannel, direction: incomingDirection, content: text, user_id: msgUser!.id });
    setIncomingText("");
    setDraftText("");
    await loadMessages(commPropertyId);
    setSavingMsg(false);
  }

  async function handleSuggestReply() {
    const text = incomingText.trim();
    if (!text || !commPropertyId || suggesting) return;
    setSuggesting(true);
    setDraftText("");
    try {
      const res = await fetch("/api/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: commPropertyId, incomingMessage: text, channel: incomingChannel }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setDraftText(data.draft ?? "");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSaveOutgoing() {
    const text = draftText.trim();
    const incoming = incomingText.trim();
    if (!text || !commPropertyId) return;
    setSavingMsg(true);
    const { data: { user: outUser } } = await supabase.auth.getUser();
    if (incoming) {
      await supabase.from("messages").insert({ property_id: commPropertyId, channel: incomingChannel, direction: "inbound", content: incoming, user_id: outUser!.id });
    }
    await supabase.from("messages").insert({ property_id: commPropertyId, channel: incomingChannel, direction: "outbound", content: text, user_id: outUser!.id });
    setIncomingText("");
    setDraftText("");
    await loadMessages(commPropertyId);
    setSavingMsg(false);
  }

  async function handleCopyDraft() {
    if (!draftText) return;
    await navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function loadPayments() {
    const { data } = await supabase.from("payments").select("*").order("month", { ascending: false });
    const pays = data ?? [];
    setPayments(pays.filter(p => p.property_id !== null));
    setUnmatchedPayments(pays.filter(p => p.property_id === null));
  }

  useEffect(() => {
    async function load() {
      const [{ data: props }, { data: morts }, { data: tens }, { data: dts }, { data: files }, { data: vals }, { data: plans }] = await Promise.all([
        supabase.from("properties").select("*").order("sort_order", { ascending: true }),
        supabase.from("mortgages").select("*"),
        supabase.from("tenants").select("*"),
        supabase.from("debts").select("*").order("created_at", { ascending: true }),
        supabase.from("property_files").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("property_valuations").select("*").order("valuation_date", { ascending: false }),
        supabase.from("projection_plans").select("*").order("created_at", { ascending: false }),
      ]);
      setProperties(props ?? []);
      setMortgages(morts ?? []);
      setTenants(tens ?? []);
      setDebts(dts ?? []);
      setValuations(vals ?? []);
      setProjectionPlans(plans ?? []);
      const allFiles = files ?? [];
      setPropertyFiles(allFiles);
      // Generuj signed URLs pro obrázky (pro miniatury na kartách)
      const imageFiles = allFiles.filter(f => f.mime_type?.startsWith("image/"));
      const urlEntries = await Promise.all(
        imageFiles.map(async f => {
          const { data } = await supabase.storage.from("property-files").createSignedUrl(f.path, 3600);
          return [f.id, data?.signedUrl ?? ""] as [string, string];
        })
      );
      setFileThumbUrls(Object.fromEntries(urlEntries.filter(([, url]) => url)));
      await loadPayments();
      setLoading(false);
    }
    load();

    // Realtime — automatická aktualizace když přijde nová platba
    const channel = supabase
      .channel("payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        loadPayments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // No auto-select — default shows all payments

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 200;
      let cur = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) cur = id;
      }
      setActiveSection(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const portfolio = { properties, mortgages, payments: [...payments, ...unmatchedPayments] };
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, portfolio }),
    });

    if (!res.ok || !res.body) { setChatLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistantText };
        return updated;
      });
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setChatLoading(false);
  }

  async function handleToggleStatus(propertyId: string, currentStatus: string) {
    const newStatus = currentStatus === "rented" ? "vacant" : "rented";
    const label = newStatus === "rented" ? "Pronajato" : "Volné";
    if (!confirm(`Změnit stav na "${label}"?`)) return;
    await supabase.from("properties").update({ status: newStatus }).eq("id", propertyId);
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus as Property["status"] } : p));
  }

  async function handleAssignPayment(paymentId: string, propertyId: string, rentReceived: number, paymentDate: string) {
    const property = properties.find(p => p.id === propertyId);
    const payment = [...payments, ...unmatchedPayments].find(p => p.id === paymentId);
    if (!property || !payment) return;

    const mortgage = mortgages.find(m => m.property_id === propertyId);
    const mortgagePayment = mortgage?.monthly_payment ?? 0;
    const netCashflow = rentReceived - mortgagePayment;

    const { error } = await supabase.from("payments").update({
      property_id: propertyId,
      rent_received: rentReceived,
      payment_date: paymentDate || null,
      mortgage_payment: mortgagePayment,
      net_cashflow: netCashflow,
      status: "paid",
      match_type: "manual",
    }).eq("id", paymentId);
    if (error) throw new Error(error.message);

    if (payment.sender_account) {
      const { data: { user: upsertUser } } = await supabase.auth.getUser();
      await supabase.from("tenants").upsert({
        account_number: payment.sender_account,
        name: payment.sender_name ?? "",
        property_id: propertyId,
        user_id: upsertUser!.id,
      }, { onConflict: "account_number", ignoreDuplicates: true });
    }

    await loadPayments();
  }

  async function handleDeletePayment(paymentId: string) {
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);
    if (error) throw new Error(error.message);
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    setUnmatchedPayments(prev => prev.filter(p => p.id !== paymentId));
  }

  const activeProperties = properties.filter((p) => p.status !== "planned");
  const ownedProperties = activeProperties.filter((p) => p.ownership_type !== "manager");
  const totalValue = ownedProperties.reduce((s, p) => s + p.estimated_value, 0);
  const totalDebt = mortgages.filter(m => ownedProperties.some(p => p.id === m.property_id)).reduce((s, m) => s + m.outstanding_balance, 0);
  const equity = totalValue - totalDebt;
  const valuationGrowth = (() => {
    let delta = 0;
    let latestDate: string | null = null;
    const propNames: string[] = [];
    for (const p of ownedProperties) {
      const propVals = valuations.filter(v => v.property_id === p.id);
      if (propVals.length < 2) continue;
      const gapDays = (new Date(propVals[0].valuation_date).getTime() - new Date(propVals[1].valuation_date).getTime()) / 86400000;
      if (gapDays > 90) continue;
      delta += propVals[0].value - propVals[1].value;
      propNames.push(p.name);
      if (!latestDate || propVals[0].valuation_date > latestDate) latestDate = propVals[0].valuation_date;
    }
    return latestDate ? { delta, date: latestDate, propNames } : null;
  })();
  const debtsBalance = debts.reduce((s, d) => s + (d.direction === "they_owe" ? d.amount_remaining : -d.amount_remaining), 0);
  const displayEquity = showDebtsBalance ? equity + debtsBalance : equity;
  const filteredPayments = (activeFilter ? payments.filter((p) => p.property_id === activeFilter) : payments)
    .slice()
    .sort((a, b) => b.month.localeCompare(a.month));
  const activeProperty = properties.find((p) => p.id === activeFilter);

  type Alert = { type: "danger" | "warning" | "info"; label: string; property: string; daysLeft: number };
  const alerts: Alert[] = [];
  const today = Date.now();
  for (const p of properties) {
    const mort = mortgages.find(m => m.property_id === p.id);
    if (mort?.refix_date) {
      const d = Math.round((new Date(mort.refix_date).getTime() - today) / 86400000);
      if (d <= 90) alerts.push({ type: d <= 30 ? "danger" : "warning", label: t("konecFixaceHypoteky"), property: p.name, daysLeft: d });
    }
    if (p.insurance_to) {
      const d = Math.round((new Date(p.insurance_to).getTime() - today) / 86400000);
      if (d <= 60) alerts.push({ type: d <= 14 ? "danger" : "warning", label: t("konecPojistky"), property: p.name, daysLeft: d });
    }
    if (p.lease_end) {
      const d = Math.round((new Date(p.lease_end).getTime() - today) / 86400000);
      if (d <= 120) alerts.push({ type: d <= 14 ? "danger" : "warning", label: t("konecNajemniSmlouvy"), property: p.name, daysLeft: d });
    }
  }
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  async function handleDrop(fromIndex: number, toIndex: number, list: Property[]) {
    if (fromIndex === toIndex) return;
    const reordered = [...list];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
    setProperties(prev => {
      const ids = new Set(updated.map(p => p.id));
      return [...updated, ...prev.filter(p => !ids.has(p.id))];
    });
    await Promise.all(updated.map(p => supabase.from("properties").update({ sort_order: p.sort_order }).eq("id", p.id)));
  }

  return (
    <div className="min-h-screen" style={{ background: "#ece6d8", fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          mortgage={mortgages.find(m => m.property_id === selectedProperty.id)}
          supabase={supabase}
          defaultTab={propertyModalTab}
          onClose={async () => {
            setSelectedProperty(null);
            setPropertyModalTab("details");
            const [{ data: files }, { data: vals }] = await Promise.all([
              supabase.from("property_files").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
              supabase.from("property_valuations").select("*").order("valuation_date", { ascending: false }),
            ]);
            setValuations(vals ?? []);
            const allFiles = files ?? [];
            setPropertyFiles(allFiles);
            const imageFiles = allFiles.filter(f => f.mime_type?.startsWith("image/"));
            const urlEntries = await Promise.all(
              imageFiles.filter(f => !fileThumbUrls[f.id]).map(async f => {
                const { data } = await supabase.storage.from("property-files").createSignedUrl(f.path, 3600);
                return [f.id, data?.signedUrl ?? ""] as [string, string];
              })
            );
            if (urlEntries.length > 0) setFileThumbUrls(prev => ({ ...prev, ...Object.fromEntries(urlEntries.filter(([, url]) => url)) }));
          }}
          onSaved={async () => {
            const [{ data: props }, { data: morts }] = await Promise.all([
              supabase.from("properties").select("*").order("sort_order", { ascending: true }),
              supabase.from("mortgages").select("*"),
            ]);
            setProperties(props ?? []);
            setMortgages(morts ?? []);
          }}
        />
      )}

      {/* Add Property Modal */}
      {showAddProperty && (
        <AddPropertyModal
          supabase={supabase}
          onClose={() => setShowAddProperty(false)}
          onSaved={p => { setProperties(prev => [...prev, p]); setShowAddProperty(false); }}
        />
      )}

      {/* Debt Modal */}
      {debtModal.open && (
        <DebtModal
          debt={debtModal.debt}
          supabase={supabase}
          onClose={() => setDebtModal({ open: false, debt: null })}
          onSaved={d => setDebts(prev => debtModal.debt ? prev.map(x => x.id === d.id ? d : x) : [...prev, d])}
          onDeleted={id => setDebts(prev => prev.filter(x => x.id !== id))}
        />
      )}

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          properties={properties}
          supabase={supabase}
          onClose={() => setSelectedPayment(null)}
          onSave={handleAssignPayment}
          onDelete={handleDeletePayment}
        />
      )}

      {/* Add Payment Modal */}
      {addPaymentModal.open && (
        <AddPaymentModal
          properties={properties}
          mortgages={mortgages}
          supabase={supabase}
          defaultPropertyId={addPaymentModal.propertyId}
          defaultMonth={addPaymentModal.month}
          onClose={() => setAddPaymentModal({ open: false })}
          onSaved={p => setPayments(prev => {
            const exists = prev.some(x => x.id === p.id);
            return exists ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev];
          })}
        />
      )}

      {/* Projection Preview Modal */}
      {showProjectionSettingsModal && (
        <ProjectionPreviewModal
          properties={properties} mortgages={mortgages} debts={debts}
          birthYear={birthYear} incomeEmployment={incomeEmployment} incomeOther={incomeOther}
          householdCosts={householdCosts} assumedLtvPct={assumedLtvPct}
          settings={projectionSettings}
          lang={language}
          onClose={() => setShowProjectionSettingsModal(false)}
          onSave={saveProjectionModal}
          plans={projectionPlans}
          onSavePlan={saveProjectionPlan}
          onArchivePlan={archiveProjectionPlan}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,34,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setSettingsOpen(false)}>
          <div style={{ background: "#faf8f3", borderRadius: 16, padding: "28px 28px 24px", width: 420, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: "#1c2b22", marginBottom: 20 }}>{t("nastaveni")}</div>
            <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1c2b22", marginBottom: 4 }}>{t("jazykAplikace")}</div>
              <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 12 }}>
                {t("jazykPopis")}
              </div>
              <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 20, padding: 3, width: "fit-content" }}>
                <button onClick={() => saveLanguage("cs")} disabled={savingLanguage}
                  style={{ padding: "6px 16px", borderRadius: 18, border: "none", background: language === "cs" ? "#1f3d2e" : "transparent", color: language === "cs" ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: savingLanguage ? "default" : "pointer" }}>
                  {t("cestina")}
                </button>
                <button onClick={() => saveLanguage("en")} disabled={savingLanguage}
                  style={{ padding: "6px 16px", borderRadius: 18, border: "none", background: language === "en" ? "#1f3d2e" : "transparent", color: language === "en" ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: savingLanguage ? "default" : "pointer" }}>
                  {t("anglictina")}
                </button>
              </div>
            </div>

            <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "18px 20px", marginTop: 14 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: dtiEnabled ? 12 : 0 }}>
                <div style={{ flex: 1, paddingRight: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1c2b22" }}>Finanční profil pro projekce</div>
                  <div style={{ fontSize: 12, color: "#7c8378", marginTop: 4 }}>
                    Volitelné — použije se jen pro Simulaci akvizic v grafu "Jak rosteš v čase" (odhad, kolik dalších nemovitostí si ještě můžeš dovolit financovat). Nikde jinde se nepoužije.
                  </div>
                </div>
                <button onClick={() => { const next = !dtiEnabled; setDtiEnabled(next); saveFinancialProfile({ dtiEnabled: next }); }}
                  style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 12, border: "none", background: dtiEnabled ? "#1f3d2e" : "#d2cab4", position: "relative", cursor: "pointer" }}>
                  <span style={{ position: "absolute", top: 2, left: dtiEnabled ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                </button>
              </div>

              {dtiEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Rok narození</div>
                    <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)}
                      placeholder="např. 1988"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ fontSize: 11, color: "#9a9483", marginTop: 4 }}>Určuje maximální délku nové hypotéky — banky obvykle nepůjčují za hranici ~70 let věku.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Měsíční čistý příjem ze zaměstnání/podnikání</div>
                    <input type="number" value={incomeEmployment} onChange={e => setIncomeEmployment(e.target.value)}
                      placeholder="Kč"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Měsíční čistý příjem z jiných zdrojů</div>
                    <input type="number" value={incomeOther} onChange={e => setIncomeOther(e.target.value)}
                      placeholder="Kč"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ fontSize: 11, color: "#9a9483", marginTop: 4 }}>Např. další práce, dividendy — nájmy z nemovitostí se počítají zvlášť, sem je nepiš.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Měsíční životní náklady (mimo bydlení a splátek)</div>
                    <input type="number" value={householdCosts} onChange={e => setHouseholdCosts(e.target.value)}
                      placeholder="Kč"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ fontSize: 11, color: "#9a9483", marginTop: 4 }}>Domácnost, jídlo, běžné výdaje — banky tohle při posuzování úvěru odečítají od příjmu, než spočítají, kolik zbývá na splátku.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#7c8378", marginBottom: 4 }}>Předpokládané LTV pro budoucí úvěry</div>
                    <input type="number" value={assumedLtvPct} onChange={e => setAssumedLtvPct(e.target.value)}
                      placeholder="%"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ fontSize: 11, color: "#9a9483", marginTop: 4 }}>Jaký podíl ceny další nemovitosti očekáváš, že ti banka půjčí — výchozích 70 % odpovídá běžné nabídce.</div>
                  </div>
                  <button onClick={() => saveFinancialProfile()} disabled={savingFinancialProfile}
                    style={{ padding: "8px 0", borderRadius: 8, border: "none", background: savingFinancialProfile ? "#e8e2d6" : "#1f3d2e", color: "#f5f1e6", fontSize: 13, fontWeight: 600, cursor: savingFinancialProfile ? "default" : "pointer" }}>
                    {savingFinancialProfile ? "Ukládám…" : "Uložit"}
                  </button>
                </div>
              )}
            </div>

            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              style={{ marginTop: 12, width: "100%", padding: "10px 0", borderRadius: 10, border: "none", background: "transparent", color: "#c0392b", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Odhlásit se
            </button>
            <button onClick={() => setSettingsOpen(false)}
              style={{ marginTop: 8, width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid #d2cab4", background: "transparent", color: "#5c6359", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {t("zavrit")}
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR (na mobilu se přes globals.css mění na spodní tab bar) */}
      <aside className="eq-sidebar fixed top-0 left-0 bottom-0 flex flex-col items-center py-[22px] z-50" style={{ width: 78, background: "#1f3d2e" }}>
        <div className="eq-sidebar-logo flex items-center justify-center mb-[30px] flex-none" style={{ width: 34, height: 34, borderRadius: 9, background: "#c9a24b" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1f3d2e" }} />
        </div>
        <div className="eq-nav-items flex flex-col gap-2 items-center">
          {NAV_ITEMS.map((item) => {
            const label = (translations[language] as unknown as Record<string, string>)[item.id] ?? item.title;
            if (item.id === "nastaveni") {
              return (
                <button key={item.id} title={label} onClick={() => setSettingsOpen(true)}
                  className="flex items-center justify-center transition-colors duration-150 rounded-[12px]"
                  style={{ width: 46, height: 46, background: settingsOpen ? "rgba(255,255,255,.12)" : "transparent", border: "none", cursor: "pointer" }}>
                  <span style={{ color: settingsOpen ? "#f5f1e6" : "#86a191", display: "flex" }}>{item.icon}</span>
                </button>
              );
            }
            const on = activeSection === item.id;
            return (
              <a key={item.id} href={`#${item.id}`} title={label}
                className="flex items-center justify-center transition-colors duration-150 rounded-[12px]"
                style={{ width: 46, height: 46, background: on ? "rgba(255,255,255,.12)" : "transparent", textDecoration: "none" }}>
                <span style={{ color: on ? "#f5f1e6" : "#86a191", display: "flex" }}>{item.icon}</span>
              </a>
            );
          })}
        </div>
        {/* Badge na nespárované */}
        {unmatchedPayments.length > 0 && (
          <a href="#platby" className="eq-sidebar-badge" style={{ marginTop: 8, textDecoration: "none" }}>
            <span style={{ background: "#c0392b", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unmatchedPayments.length}
            </span>
          </a>
        )}
        <button title={userEmail ?? "Odhlásit"} onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
          className="eq-sidebar-logout mt-auto flex items-center justify-center rounded-[12px]"
          style={{ width: 46, height: 46, background: "transparent", border: "none", cursor: "pointer" }}>
          <span style={{ color: "#86a191", display: "flex" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="eq-main" style={{ marginLeft: 78, padding: "40px 48px 160px", maxWidth: 1140 }}>

        {/* Topbar */}
        <div className="eq-topbar flex justify-between items-center mb-[30px]">
          <div className="flex items-center gap-[11px]">
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#c39a3f" }} />
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 23, fontWeight: 700, letterSpacing: "-0.01em", color: "#1c2b22" }}>{t("majetek")}</div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 13, color: "#7c8378" }}>
              {new Date().toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}
            </span>
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: "50%", background: "#1f3d2e", color: "#ece6d8", fontWeight: 600, fontSize: 12 }}>{userInitials}</div>
          </div>
        </div>

        {/* DASHBOARD */}
        <section id="dashboard" style={{ scrollMarginTop: 28 }}>
          <div className="eq-header-card" style={{ background: "#1f3d2e", borderRadius: 14, padding: "38px 42px" }}>
            {loading ? (
              <div style={{ color: "#9db8a6", fontSize: 15 }}>Načítám data…</div>
            ) : (
              <div className="eq-header-card flex justify-between items-start gap-10">
                <div className="flex-1">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9db8a6" }}>{t("tvujVlastniKapital")}</div>
                    {debts.length > 0 && (
                      <div style={{ display: "flex", background: "rgba(255,255,255,.10)", borderRadius: 14, padding: 2 }}>
                        <button onClick={() => setShowDebtsBalance(false)}
                          style={{ padding: "3px 8px", borderRadius: 12, border: "none", background: !showDebtsBalance ? "#c9a24b" : "transparent", color: !showDebtsBalance ? "#1f3d2e" : "#9db8a6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          {t("bezDluhu")}
                        </button>
                        <button onClick={() => setShowDebtsBalance(true)}
                          style={{ padding: "3px 8px", borderRadius: 12, border: "none", background: showDebtsBalance ? "#c9a24b" : "transparent", color: showDebtsBalance ? "#1f3d2e" : "#9db8a6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          {t("vcBilanceZDluhy")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="eq-equity-number" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: 90, lineHeight: 0.94, letterSpacing: "-0.02em", color: "#f5f1e6", marginTop: 14 }}>
                    {fmtMil(displayEquity)}<span style={{ fontSize: 36, color: "#9db8a6", fontWeight: 600 }}> mil Kč</span>
                  </div>
                  {showDebtsBalance && debtsBalance !== 0 && (
                    <div style={{ fontSize: 13, color: "#cfe0d4", marginTop: 6 }}>
                      {debtsBalance >= 0 ? "+" : "−"}{fmtMil(Math.abs(debtsBalance))} mil Kč {t("bilanceZDluhy")}
                    </div>
                  )}
                  <div className="eq-equity-row flex items-center gap-[14px] mt-[22px]">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1f3d2e", background: "#c9a24b", borderRadius: 30, padding: "8px 15px", fontSize: 14, fontWeight: 700 }}>
                      {ownedProperties.length} {language === "cs"
                        ? (ownedProperties.length === 1 ? "nemovitost" : ownedProperties.length < 5 ? "nemovitosti" : "nemovitostí")
                        : (ownedProperties.length === 1 ? "property" : "properties")}
                    </span>
                    <span style={{ fontSize: 15, color: "#cfe0d4", fontWeight: 500 }}>{t("hodnotaPortfolia")} {fmtMil(totalValue)} mil Kč</span>
                  </div>
                  {valuationGrowth && (
                    <div style={{ fontSize: 13, color: valuationGrowth.delta >= 0 ? "#9db8a6" : "#e0a8a0", marginTop: 8, fontWeight: 600 }}>
                      {valuationGrowth.delta >= 0 ? "▲ +" : "▼ "}{fmt(Math.abs(valuationGrowth.delta))} Kč od posledního ocenění ({monthLabel(valuationGrowth.date)}, {valuationGrowth.propNames.join(", ")})
                    </div>
                  )}
                  {totalDebt > 0 && (
                    <div className="eq-header-progress" style={{ marginTop: 26, maxWidth: 440 }}>
                      <div className="flex justify-between items-baseline mb-[9px]" style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9db8a6" }}>
                        <span>{t("vlastniKapital")}</span>
                        <span style={{ color: "#e7c773" }}>{Math.round((equity / totalValue) * 100)} %</span>
                      </div>
                      <div style={{ height: 9, borderRadius: 6, background: "rgba(255,255,255,.14)", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (equity / totalValue) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#9db8a6,#c9a24b)" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="eq-header-stats text-right flex flex-col gap-[22px]" style={{ paddingTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f9d8a" }}>{t("hodnotaPortfolia")}</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 30, color: "#f5f1e6", marginTop: 5 }}>{fmtMil(totalValue)} mil Kč</div>
                  </div>
                  {totalDebt > 0 && (
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f9d8a" }}>{t("uveryNaNemovitosti")}</div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 30, color: "#f5f1e6", marginTop: 5 }}>{fmtMil(totalDebt)} mil Kč</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f9d8a" }}>{t("nemovitosti")}</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 30, color: "#f5f1e6", marginTop: 5 }}>{ownedProperties.length} {language === "cs"
                      ? (ownedProperties.length === 1 ? "objekt" : ownedProperties.length < 5 ? "objekty" : "objektů")
                      : (ownedProperties.length === 1 ? "unit" : "units")}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((a, i) => {
                const bg = a.type === "danger" ? "#fde8e8" : "#fef6e4";
                const color = a.type === "danger" ? "#c0392b" : "#a07b2f";
                const icon = a.type === "danger" ? "⚠️" : "🔔";
                const daysText = a.daysLeft <= 0 ? t("dnes") : a.daysLeft === 1 ? t("zitra") : t("zaDni")(a.daysLeft);
                return (
                  <div key={i} style={{ background: bg, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{a.label}</span>
                        <span style={{ fontSize: 13, color: "#5c6359" }}> · {a.property}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color, whiteSpace: "nowrap" }}>{daysText}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart */}
          <GrowthChart properties={properties} mortgages={mortgages} debts={debts}
            dtiEnabled={dtiEnabled} birthYear={birthYear} incomeEmployment={incomeEmployment}
            incomeOther={incomeOther} householdCosts={householdCosts} assumedLtvPct={assumedLtvPct}
            projectionSettings={projectionSettings} lang={language} onOpenProjectionSettings={() => setShowProjectionSettingsModal(true)}
            activePlan={projectionPlans.find(p => p.status === "active") ?? null} />
        </section>

        {/* NEMOVITOSTI */}
        <section id="nemovitosti" style={{ marginTop: 38, scrollMarginTop: 28 }}>
          <div className="eq-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{t("tveNemovitosti")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setShowAddProperty(true)}
                style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 600 }}>
                {t("pridat")}
              </button>
            <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 20, padding: 3 }}>
              <button onClick={() => setShowPlannedProps(false)}
                style={{ padding: "5px 14px", borderRadius: 18, border: "none", background: !showPlannedProps ? "#1f3d2e" : "transparent", color: !showPlannedProps ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {t("realne")}
              </button>
              <button onClick={() => setShowPlannedProps(true)}
                style={{ padding: "5px 14px", borderRadius: 18, border: "none", background: showPlannedProps ? "#4a7c59" : "transparent", color: showPlannedProps ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {t("planovane")}
              </button>
            </div>
            </div>
          </div>
          {loading ? <div style={{ color: "#7c8378" }}>Načítám…</div> : (
            <div className="flex flex-col gap-[10px]">
              {(showPlannedProps ? properties : activeProperties).map((p, idx) => {
                const displayList = showPlannedProps ? properties : activeProperties;
                const isManaged = p.ownership_type === "manager";
                const { label, cls } = isManaged
                  ? { label: t("spravovano"), cls: "text-[#2255aa] bg-[#dce8f8]" }
                  : statusBadge(p.status, language);
                const mortgage = isManaged ? undefined : mortgages.find((m) => m.property_id === p.id);
                const propValuations = valuations.filter(v => v.property_id === p.id);
                const valuationGapDays = propValuations.length >= 2 ? (new Date(propValuations[0].valuation_date).getTime() - new Date(propValuations[1].valuation_date).getTime()) / 86400000 : null;
                const valuationDelta = propValuations.length >= 2 && valuationGapDays !== null && valuationGapDays <= 90 ? propValuations[0].value - propValuations[1].value : null;
                const isDragOver = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;
                return (
                  <div key={p.id}
                    draggable
                    onDragStart={() => { setDragIndex(idx); }}
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(idx); }}
                    onDragEnd={() => { if (dragIndex !== null && dragOverIndex !== null) handleDrop(dragIndex, dragOverIndex, displayList); setDragIndex(null); setDragOverIndex(null); }}
                    onClick={() => setSelectedProperty(p)}
                    style={{ position: "relative", background: p.status === "planned" ? "#eef5ee" : "#f5f1e6", borderRadius: 10, padding: "15px 18px", border: isDragOver ? "2px dashed #1f3d2e" : "1px solid transparent", cursor: "grab", transition: "box-shadow 0.15s", opacity: dragIndex === idx ? 0.5 : 1, overflow: "hidden" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,61,46,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                    {/* Hero fotka jako jemné pozadí karty */}
                    {(() => {
                      const pFiles = propertyFiles.filter(f => f.property_id === p.id);
                      const heroFile = pFiles.find(f => f.mime_type?.startsWith("image/") && fileThumbUrls[f.id]);
                      if (!heroFile) return null;
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fileThumbUrls[heroFile.id]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, pointerEvents: "none", userSelect: "none", WebkitMaskImage: "linear-gradient(to right, transparent 50%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,1) 100%)", maskImage: "linear-gradient(to right, transparent 50%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,1) 100%)" }} />
                      );
                    })()}
                    <div className="flex items-center justify-between">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="eq-prop-name-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {(() => {
                            const icons: Record<string, React.ReactElement> = {
                              apartment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="1"/><rect x="8" y="5" width="2" height="2"/><rect x="14" y="5" width="2" height="2"/><rect x="8" y="9" width="2" height="2"/><rect x="14" y="9" width="2" height="2"/><rect x="8" y="13" width="2" height="2"/><rect x="14" y="13" width="2" height="2"/><path d="M10 22v-4h4v4"/></svg>,
                              house: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
                              garage: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M2 7l2-4h16l2 4"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="8" y1="12" x2="8" y2="21"/><line x1="16" y1="12" x2="16" y2="21"/></svg>,
                              land: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M3 20l4-8 4 4 3-6 4 10"/></svg>,
                              commercial: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/><rect x="13" y="13" width="3" height="3"/><rect x="13" y="17" width="3" height="3"/></svg>,
                              other: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                            };
                            return icons[p.type ?? "apartment"] ?? icons.apartment;
                          })()}
                          <span className="eq-prop-name" style={{ fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{p.name}</span>
                          {p.status === "planned" && <span style={{ fontSize: 10, fontWeight: 700, color: "#4a7c59", background: "#d6ead6", borderRadius: 10, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("planovanaBadge")}</span>}
                          {p.type && p.type !== "apartment" && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#7c8378", background: "#e6e0d0", borderRadius: 10, padding: "2px 8px" }}>
                              {{ house: t("typDum"), garage: t("typGaraz"), land: t("typPozemek"), commercial: t("typKomercni"), other: t("typOstatni") }[p.type] ?? p.type}
                            </span>
                          )}
                        </div>
                        <div className="eq-prop-info" style={{ fontSize: 12, color: "#7c8378", marginTop: 2, whiteSpace: "normal", lineHeight: 1.4 }}>
                          {p.status === "rented" ? t("najemMesicne")(fmt(p.rent_amount)) : p.address ?? ""}
                          {p.address && p.status === "rented" ? <span style={{ color: "#b0a898" }}> · {p.address}</span> : null}
                          {mortgage ? ` · ${t("splatkaX")(fmt(mortgage.monthly_payment))}` : ""}
                          {mortgage?.refix_date ? ` · Fixace ${mortgage.refix_date}` : ""}
                        </div>
                        {mortgage?.refix_date && (() => {
                          const days = daysUntil(mortgage.refix_date);
                          if (days > 90) return null;
                          const urgent = days <= 30;
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 10px", borderRadius: 20, background: urgent ? "#fde8e8" : "#efe3c6", color: urgent ? "#c0392b" : "#a07b2f", fontSize: 12, fontWeight: 700 }}>
                              {t("konecFixaceZaDni")(days, mortgage.refix_date)}
                            </div>
                          );
                        })()}
                        {p.insurance_to && (() => {
                          const days = daysUntil(p.insurance_to);
                          if (days > 60 || days < 0) return null;
                          const urgent = days <= 14;
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 10px", borderRadius: 20, background: urgent ? "#fde8e8" : "#efe3c6", color: urgent ? "#c0392b" : "#a07b2f", fontSize: 12, fontWeight: 700 }}>
                              🛡 Pojistka vyprší za {days} dní ({p.insurance_to})
                            </div>
                          );
                        })()}
                        {p.status === "rented" && !isManaged && p.rent_amount > 0 && (() => {
                          const now = new Date();
                          const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
                          const hasPaid = payments.some(pay => pay.property_id === p.id && pay.month === monthStr && pay.rent_received > 0);
                          if (hasPaid) return null;
                          const dueDay = p.rent_due_day ?? 15;
                          const overdueDays = now.getDate() - dueDay;
                          if (overdueDays < -5 || overdueDays === 0) return null;
                          const isAdvance = (p.rent_timing ?? "advance") === "advance";
                          const nextMonthName = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString("cs", { month: "long" });
                          const suffix = isAdvance ? ` (za ${nextMonthName})` : "";
                          const isOverdue = overdueDays > 0;
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 6, padding: "4px 6px 4px 10px", borderRadius: 20, background: isOverdue ? "#fde8e8" : "#efe3c6", color: isOverdue ? "#c0392b" : "#a07b2f", fontSize: 12, fontWeight: 700 }}>
                              <span>{isOverdue ? t("najemPoSplatnosti")(overdueDays) : t("platbaPrijdeZaDni")(-overdueDays)}{suffix}</span>
                              <button onClick={e => { e.stopPropagation(); setAddPaymentModal({ open: true, propertyId: p.id, month: monthStr }); }}
                                style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 12, border: "none", background: isOverdue ? "#c0392b" : "#a07b2f", color: "#fff", cursor: "pointer" }}>
                                {t("pridatPlatbu")}
                              </button>
                            </div>
                          );
                        })()}
                        {p.lease_end && (() => {
                          const daysLeft = Math.round((new Date(p.lease_end).getTime() - Date.now()) / 86400000);
                          if (daysLeft > 120 || daysLeft < 0) return null;
                          const isDanger = daysLeft <= 30;
                          const leaseEndFmt = new Date(p.lease_end).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 10px", borderRadius: 20, background: isDanger ? "#fde8e8" : "#fff8e1", color: isDanger ? "#c0392b" : "#a07b2f", fontSize: 12, fontWeight: 700 }}>
                              ⏳ Konec smlouvy za {daysLeft} dní ({leaseEndFmt})
                            </div>
                          );
                        })()}
                        {!isManaged && p.status !== "planned" && (() => {
                          const propValuations = valuations.filter(v => v.property_id === p.id);
                          const lastDates = [...propValuations.map(v => v.valuation_date), ...(p.purchase_date ? [p.purchase_date] : [])];
                          if (lastDates.length === 0) return null;
                          const lastDate = lastDates.reduce((a, b) => (a > b ? a : b));
                          const daysSince = Math.round((Date.now() - new Date(lastDate).getTime()) / 86400000);
                          if (daysSince < 90) return null;
                          return (
                            <div onClick={e => { e.stopPropagation(); setPropertyModalTab("valuations"); setSelectedProperty(p); }}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 10px", borderRadius: 20, background: "#efe3c6", color: "#a07b2f", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              📐 Ocenění po termínu ({daysSince} dní)
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ flexShrink: 0, paddingLeft: 8, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: p.status === "planned" ? "rgba(238,245,238,0.92)" : "rgba(245,241,230,0.92)", borderRadius: 20, padding: "6px 10px 6px 12px" }}>
                          {!isManaged && <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{fmtMil(p.estimated_value)} mil</span>}
                          <button onClick={e => { e.stopPropagation(); if (!isManaged) handleToggleStatus(p.id, p.status); }} className={`inline-flex items-center rounded-[20px] ${cls}`} style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", padding: "5px 11px", border: "none", cursor: isManaged ? "default" : "pointer" }}>{label}</button>
                        </div>
                        {!isManaged && valuationDelta !== null && valuationDelta !== 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: valuationDelta > 0 ? "#1f3d2e" : "#c0392b", paddingRight: 4 }}>
                            {valuationDelta > 0 ? "▲ +" : "▼ "}{fmt(Math.abs(valuationDelta))} Kč
                          </span>
                        )}
                      </div>
                    </div>
                    {mortgage && (() => {
                      const ltv = Math.round((mortgage.outstanding_balance / p.estimated_value) * 100);
                      const color = ltv > 80 ? "#c0392b" : ltv > 60 ? "#a07b2f" : "#1f3d2e";
                      return (
                        <div style={{ marginTop: 10 }}>
                          <div className="flex justify-between" style={{ fontSize: 11, color: "#9a9483", marginBottom: 4 }}>
                            <span>LTV</span><span style={{ color, fontWeight: 600 }}>{ltv} %</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: "#e3ddcb", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(ltv, 100)}%`, height: "100%", background: color, transition: "width .4s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "#9a9483", marginTop: 3 }}>
                            {t("dluhHodnota")(fmtMil(mortgage.outstanding_balance), fmtMil(p.estimated_value))}
                            {" · "}
                            <span style={{ color: "#1f3d2e", fontWeight: 600 }}>Vlastní {fmtMil(p.estimated_value - mortgage.outstanding_balance)} mil</span>
                          </div>
                        </div>
                      );
                    })()}
                    {p.status === "rented" && !isManaged && p.rent_amount > 0 && p.estimated_value > 0 && (() => {
                      const grossYield = (p.rent_amount * 12 / p.estimated_value) * 100;
                      const monthlyOut = (mortgage?.monthly_payment ?? 0) + (p.insurance_amount ? p.insurance_amount / 12 : 0) + (p.monthly_costs ?? 0);
                      const annualNetCashflow = (p.rent_amount - monthlyOut) * 12;
                      const equityValue = p.estimated_value - (mortgage?.outstanding_balance ?? 0);
                      const equityYield = equityValue > 0 ? (annualNetCashflow / equityValue) * 100 : null;
                      return (
                        <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 11, color: "#9a9483" }}>
                          <span>Hrubý výnos <strong style={{ color: "#1f3d2e" }}>{grossYield.toFixed(1)} %</strong></span>
                          {equityYield !== null && (
                            <span>Výnos na kapitál <strong style={{ color: equityYield >= 0 ? "#1f3d2e" : "#c0392b" }}>{equityYield.toFixed(1)} %</strong></span>
                          )}
                        </div>
                      );
                    })()}
                    {/* Soubory — hero + miniatury */}
                    {(() => {
                      const pFiles = propertyFiles.filter(f => f.property_id === p.id);
                      if (pFiles.length === 0) return null;
                      const MAX_THUMBS = 6;
                      const visible = pFiles.slice(0, MAX_THUMBS);
                      const rest = pFiles.length - MAX_THUMBS;
                      return (
                        <div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "nowrap", overflow: "hidden" }}>
                          {visible.map(f => {
                            const thumbUrl = fileThumbUrls[f.id];
                            const isImage = f.mime_type?.startsWith("image/");
                            return (
                              <div key={f.id}
                                onClick={e => { e.stopPropagation(); setPropertyModalTab("files"); setSelectedProperty(p); }}
                                title={f.name}
                                style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: "1px solid #e0d8cc", background: "#f0ebe1", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isImage && thumbUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c8378" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <span style={{ fontSize: 8, color: "#9a9483", fontWeight: 700, textTransform: "uppercase" }}>
                                      {f.category === "contract" ? "sml" : f.category === "insurance" ? "poj" : "doc"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {rest > 0 && (
                            <div onClick={e => { e.stopPropagation(); setPropertyModalTab("files"); setSelectedProperty(p); }}
                              style={{ width: 48, height: 48, borderRadius: 8, border: "1px solid #e0d8cc", background: "#f0ebe1", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#7c8378" }}>
                              +{rest}
                            </div>
                          )}
                        </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PLATBY */}
        <section id="platby" style={{ marginTop: 38, scrollMarginTop: 28 }}>
          <div className="eq-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{t("mesicniCashflow")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {debts.length > 0 && (
                <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 20, padding: 3 }}>
                  <button onClick={() => setShowDebtsInCashflow(false)}
                    style={{ padding: "5px 14px", borderRadius: 18, border: "none", background: !showDebtsInCashflow ? "#1f3d2e" : "transparent", color: !showDebtsInCashflow ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Bez půjček
                  </button>
                  <button onClick={() => setShowDebtsInCashflow(true)}
                    style={{ padding: "5px 14px", borderRadius: 18, border: "none", background: showDebtsInCashflow ? "#4a7c59" : "transparent", color: showDebtsInCashflow ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Vč. půjček
                  </button>
                </div>
              )}
              <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 20, padding: 3 }}>
                <button onClick={() => setShowPlanned(false)}
                  style={{ padding: "5px 14px", borderRadius: 18, border: "none", background: !showPlanned ? "#1f3d2e" : "transparent", color: !showPlanned ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {t("realne")}
                </button>
                <button onClick={() => setShowPlanned(true)}
                  style={{ padding: "5px 14px", borderRadius: 18, border: "none", background: showPlanned ? "#4a7c59" : "transparent", color: showPlanned ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {t("planovane")}
                </button>
              </div>
            </div>
          </div>

          {/* Cashflow přehled */}
          {(() => {
            const visProps = properties.filter(p => showPlanned || p.status !== "planned");
            const ownedCf = visProps.filter(p => p.ownership_type !== "manager");
            const managedCf = visProps.filter(p => p.ownership_type === "manager");

            const realRent = ownedCf.filter(p => p.status === "rented").reduce((s, p) => s + p.rent_amount, 0);
            const plannedRent = showPlanned ? ownedCf.filter(p => p.status === "planned").reduce((s, p) => s + p.rent_amount, 0) : 0;
            const totalMgmtFee = managedCf.reduce((s, p) => s + (p.management_fee ?? 0), 0);
            const totalRent = realRent + plannedRent + totalMgmtFee;

            const totalMortgage = mortgages.filter(m => ownedCf.some(p => p.id === m.property_id)).reduce((s, m) => s + m.monthly_payment, 0);
            const totalInsurance = ownedCf.reduce((s, p) => s + (p.insurance_amount ? p.insurance_amount / 12 : 0), 0);
            const totalCosts = ownedCf.reduce((s, p) => s + (p.monthly_costs ?? 0), 0);
            const debtsIncome = showDebtsInCashflow ? debts.filter(d => d.direction === "they_owe").reduce((s, d) => s + (d.monthly_payment ?? 0), 0) : 0;
            const debtsExpense = showDebtsInCashflow ? debts.filter(d => d.direction === "i_owe").reduce((s, d) => s + (d.monthly_payment ?? 0), 0) : 0;
            const totalOut = totalMortgage + totalInsurance + totalCosts + debtsExpense;
            const net = totalRent + debtsIncome - totalOut;

            const propCf = visProps.map(p => {
                const isManaged = p.ownership_type === "manager";
                const mortgage = mortgages.find(m => m.property_id === p.id);
                const income = isManaged ? (p.management_fee ?? 0) : (p.status === "rented" ? p.rent_amount : (p.status === "planned" ? p.rent_amount : 0));
                const out = isManaged ? 0 : (mortgage?.monthly_payment ?? 0) + (p.insurance_amount ? p.insurance_amount / 12 : 0) + (p.monthly_costs ?? 0);
                return { id: p.id, name: p.name, income, out, net: income - out, status: p.status, planned: p.status === "planned" };
              });

            const toggleCf = (key: "income" | "expenses" | "net") =>
              setCfExpanded(prev => prev === key ? null : key);

            const panelStyle = (key: "income" | "expenses" | "net") => ({
              flex: 1, cursor: "pointer" as const,
              borderRight: undefined,
              paddingRight: key !== "net" ? 24 : undefined,
              paddingLeft: key !== "income" ? 24 : undefined,
              background: cfExpanded === key ? "rgba(31,61,46,0.04)" : undefined,
              borderRadius: 8,
              padding: "8px 12px",
            });

            return (
              <>
                {/* Souhrnný box */}
                <div style={{ paddingBottom: 16, marginBottom: 12, borderBottom: "2px solid #d2cab4" }}>
                  <div className="eq-cf-panels" style={{ display: "flex", gap: 0, alignItems: "center" }}>
                    {/* Příjmy */}
                    <div style={panelStyle("income")} onClick={() => toggleCf("income")}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("prijmy")}</div>
                        <span style={{ fontSize: 11, color: "#9a9483" }}>{cfExpanded === "income" ? "▴" : "▾"}</span>
                      </div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 800, color: "#1f3d2e", marginTop: 4 }}>+{fmt(totalRent + debtsIncome)} Kč</div>
                      {showPlanned && plannedRent > 0
                        ? <div style={{ fontSize: 11, color: "#4a7c59", marginTop: 2 }}>{t("zTohoPlanovane")(fmt(plannedRent))}</div>
                        : debtsIncome > 0
                        ? <div style={{ fontSize: 11, color: "#4a7c59", marginTop: 2 }}>z toho +{fmt(debtsIncome)} Kč z půjček</div>
                        : <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>{t("mesicne")}</div>
                      }
                    </div>
                    {/* Výdaje */}
                    <div style={panelStyle("expenses")} onClick={() => toggleCf("expenses")}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("vydaje")}</div>
                        <span style={{ fontSize: 11, color: "#9a9483" }}>{cfExpanded === "expenses" ? "▴" : "▾"}</span>
                      </div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 800, color: "#c0392b", marginTop: 4 }}>−{fmt(totalOut)} Kč</div>
                      {debtsExpense > 0
                        ? <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>z toho −{fmt(debtsExpense)} Kč splátky půjček</div>
                        : <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>{t("mesicne")}</div>
                      }
                    </div>
                    {/* Čistý cashflow */}
                    <div style={panelStyle("net")} onClick={() => toggleCf("net")}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("cistyCashflow")}</div>
                        <span style={{ fontSize: 11, color: "#9a9483" }}>{cfExpanded === "net" ? "▴" : "▾"}</span>
                      </div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 800, color: net >= 0 ? "#1f3d2e" : "#c0392b", marginTop: 4 }}>
                        {net >= 0 ? "+" : ""}{fmt(net)} Kč
                      </div>
                      <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>{t("mesicne")}</div>
                    </div>
                  </div>

                  {/* Rozbalený detail — grid karet per nemovitost */}
                  {cfExpanded && (
                    <div style={{ borderTop: "1px solid #d2cab4", marginTop: 14, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 10 }}>
                      {properties.filter(p => showPlanned || p.status !== "planned").map(p => {
                        const isPlanned = p.status === "planned";
                        const mortgage = mortgages.find(m => m.property_id === p.id);
                        const income = p.status === "rented" || p.status === "planned" ? p.rent_amount : 0;
                        const mortgage_payment = mortgage?.monthly_payment ?? 0;
                        const insurance = p.insurance_amount ? p.insurance_amount / 12 : 0;
                        const costs = p.monthly_costs ?? 0;
                        const totalOut = mortgage_payment + insurance + costs;
                        const net = income - totalOut;

                        return (
                          <div key={p.id} style={{ background: isPlanned ? "#eef5ee" : "#ede9dd", borderRadius: 8, padding: "12px 14px", border: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#5c6359", textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.name}</div>
                              {isPlanned && <span style={{ fontSize: 9, fontWeight: 700, color: "#4a7c59", background: "#d6ead6", borderRadius: 8, padding: "1px 5px" }}>{t("planZkr")}</span>}
                            </div>

                            {cfExpanded === "income" || cfExpanded === "net" ? (
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: "#5c6359" }}>{isPlanned ? t("planNajemZkr") : t("najem")}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#1f3d2e" }}>+{fmt(income)} Kč</span>
                              </div>
                            ) : null}

                            {cfExpanded === "expenses" || cfExpanded === "net" ? (
                              <>
                                {mortgage_payment > 0 && (
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: "#5c6359" }}>{t("splatka")}</span>
                                    <span style={{ fontSize: 12, color: "#c0392b" }}>−{fmt(mortgage_payment)} Kč</span>
                                  </div>
                                )}
                                {insurance > 0 && (
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: "#5c6359" }}>{t("pojistne")}</span>
                                    <span style={{ fontSize: 12, color: "#c0392b" }}>−{fmt(insurance)} Kč</span>
                                  </div>
                                )}
                                {costs > 0 && (
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: "#5c6359" }}>{t("naklady")}</span>
                                    <span style={{ fontSize: 12, color: "#c0392b" }}>−{fmt(costs)} Kč</span>
                                  </div>
                                )}
                              </>
                            ) : null}

                            <div style={{ borderTop: "1px solid #d2cab4", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#1c2b22" }}>
                                {cfExpanded === "income" ? t("prijem") : cfExpanded === "expenses" ? t("vydaje") : "Cashflow"}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: cfExpanded === "income" ? "#1f3d2e" : cfExpanded === "expenses" ? "#c0392b" : net >= 0 ? "#1f3d2e" : "#c0392b" }}>
                                {cfExpanded === "income" ? `+${fmt(income)}` : cfExpanded === "expenses" ? `−${fmt(totalOut)}` : `${net >= 0 ? "+" : ""}${fmt(net)}`} Kč
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Per-nemovitost cashflow */}
                <div className="eq-cf-prop-grid" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                  {propCf.map(p => {
                    const isOpen = cfPropExpanded === p.id;
                    const mortgage = mortgages.find(m => m.property_id === p.id);
                    const expItems: { label: string; amount: number }[] = [];
                    if (mortgage?.monthly_payment) expItems.push({ label: t("splatkaHypoteky"), amount: mortgage.monthly_payment });
                    const prop = properties.find(pr => pr.id === p.id);
                    if (prop?.insurance_amount) expItems.push({ label: t("pojistne"), amount: prop.insurance_amount / 12 });
                    if (prop?.monthly_costs) expItems.push({ label: t("naklady"), amount: prop.monthly_costs });
                    return (
                      <div key={p.id}
                        onClick={() => setCfPropExpanded(prev => prev === p.id ? null : p.id)}
                        style={{
                          flex: "0 0 calc(33.333% - 8px)",
                          background: p.planned ? "#eef5ee" : "#f5f1e6",
                          borderRadius: 10, padding: "16px 18px",
                          border: "1px solid #e3ddcb",
                          cursor: "pointer", opacity: p.planned ? 0.85 : 1,
                          boxSizing: "border-box",
                        }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#5c6359" }}>{p.name}</div>
                            {p.planned && <span style={{ fontSize: 10, fontWeight: 700, color: "#4a7c59", background: "#d6ead6", borderRadius: 10, padding: "1px 7px" }}>{t("planovanaBadge")}</span>}
                          </div>
                          <span style={{ fontSize: 11, color: "#9a9483" }}>{isOpen ? "▴" : "▾"}</span>
                        </div>
                        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800, color: p.net >= 0 ? "#1f3d2e" : "#c0392b", marginBottom: 6 }}>
                          {p.net >= 0 ? "+" : ""}{fmt(p.net)} Kč
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9a9483" }}>
                          <span>{p.planned ? t("planPrijemLower") : t("prijemLower")} +{fmt(p.income)} Kč</span>
                          <span>−{fmt(p.out)} {t("vydajeLower")}</span>
                        </div>
                        {isOpen && (
                          <div style={{ borderTop: "1px solid #d2cab4", marginTop: 12, paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, color: "#5c6359" }}>{p.planned ? t("planovanyNajem") : t("najem")}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#1f3d2e" }}>+{fmt(p.income)} Kč</span>
                            </div>
                            {expItems.map(item => (
                              <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "#5c6359" }}>{item.label}</span>
                                <span style={{ fontSize: 12, color: "#c0392b" }}>−{fmt(item.amount)} Kč</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #d2cab4", paddingTop: 4, marginTop: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#1c2b22" }}>{t("cistyCashflow")}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: p.net >= 0 ? "#1f3d2e" : "#c0392b" }}>{p.net >= 0 ? "+" : ""}{fmt(p.net)} Kč</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {showDebtsInCashflow && debts.some(d => d.monthly_payment) && (() => {
                    const relevantDebts = debts.filter(d => d.monthly_payment);
                    const debtIncome = relevantDebts.filter(d => d.direction === "they_owe").reduce((s, d) => s + (d.monthly_payment ?? 0), 0);
                    const debtExpense = relevantDebts.filter(d => d.direction === "i_owe").reduce((s, d) => s + (d.monthly_payment ?? 0), 0);
                    const netDebt = debtIncome - debtExpense;
                    const isOpen = cfPropExpanded === "__debts__";
                    return (
                      <div key="__debts__"
                        onClick={() => setCfPropExpanded(prev => prev === "__debts__" ? null : "__debts__")}
                        style={{ flex: "0 0 calc(33.333% - 8px)", background: "#f5f1e6", borderRadius: 10, padding: "16px 18px", border: "1px solid #e3ddcb", cursor: "pointer", boxSizing: "border-box" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#5c6359" }}>Půjčky</div>
                          <span style={{ fontSize: 11, color: "#9a9483" }}>{isOpen ? "▴" : "▾"}</span>
                        </div>
                        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800, color: netDebt >= 0 ? "#1f3d2e" : "#c0392b", marginBottom: 6 }}>
                          {netDebt >= 0 ? "+" : ""}{fmt(netDebt)} Kč
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9a9483" }}>
                          <span>{t("prijemLower")} +{fmt(debtIncome)} Kč</span>
                          <span>−{fmt(debtExpense)} {t("vydajeLower")}</span>
                        </div>
                        {isOpen && (
                          <div style={{ borderTop: "1px solid #d2cab4", marginTop: 12, paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                            {relevantDebts.map(d => (
                              <div key={d.id} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "#5c6359" }}>{d.name}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: d.direction === "they_owe" ? "#1f3d2e" : "#c0392b" }}>
                                  {d.direction === "they_owe" ? "+" : "−"}{fmt(d.monthly_payment ?? 0)} Kč
                                </span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #d2cab4", paddingTop: 4, marginTop: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#1c2b22" }}>{t("cistyCashflow")}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: netDebt >= 0 ? "#1f3d2e" : "#c0392b" }}>{netDebt >= 0 ? "+" : ""}{fmt(netDebt)} Kč</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            );
          })()}

          <CashflowExtra properties={properties} mortgages={mortgages} debts={debts} showPlanned={showPlanned} showDebtsInCashflow={showDebtsInCashflow} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{t("historiePlateb")}</div>
            <button onClick={() => setAddPaymentModal({ open: true })}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer", fontWeight: 600 }}>
              {t("pridatPlatbu")}
            </button>
          </div>

          {/* Kalendář plateb — matice nemovitosti × měsíce */}
          {(() => {
            const year = new Date().getFullYear();
            const currentMonthNum = new Date().getMonth() + 1;
            const today = new Date().getDate();
            const monthNamesCs = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];
            const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthNames = language === "cs" ? monthNamesCs : monthNamesEn;
            const calProps = properties.filter(p => p.status !== "planned");
            if (calProps.length === 0) return null;
            return (
              <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "16px 18px", marginBottom: 18, overflowX: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1c2b22", marginBottom: 12 }}>{t("kalendarPlateb")} {year}</div>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", fontSize: 11, color: "#9a9483", fontWeight: 600, padding: "0 8px 6px 0" }}></th>
                      {monthNames.map((m, i) => (
                        <th key={i} style={{ fontSize: 11, color: "#9a9483", fontWeight: 600, padding: "0 4px 6px", textAlign: "center" }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calProps.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontSize: 12, fontWeight: 600, color: "#1c2b22", padding: "4px 8px 4px 0", whiteSpace: "nowrap" }}>{p.name}</td>
                        {monthNames.map((_, i) => {
                          const m = i + 1;
                          const monthStr = `${year}-${String(m).padStart(2, "0")}-01`;
                          const payment = payments.find(pay => pay.property_id === p.id && pay.month === monthStr && pay.rent_received > 0);
                          const dueDay = p.rent_due_day ?? 15;
                          const isNotYetDue = m === currentMonthNum && today <= dueDay;
                          const isFuture = m > currentMonthNum;
                          const monthDate = new Date(year, m - 1, 1);
                          const leaseStartMonth = p.lease_start ? new Date(new Date(p.lease_start).getFullYear(), new Date(p.lease_start).getMonth(), 1) : null;
                          const leaseEndMonth = p.lease_end ? new Date(new Date(p.lease_end).getFullYear(), new Date(p.lease_end).getMonth(), 1) : null;
                          const notApplicable = (leaseStartMonth && monthDate < leaseStartMonth) || (leaseEndMonth && monthDate > leaseEndMonth) || p.rent_amount === 0;
                          const isVacant = !isFuture && !!notApplicable;
                          let bg = "#e6e0d0", color = "#9a9483", content = "";
                          if (payment) { bg = "#d6e4d6"; color = "#1f3d2e"; content = "✓"; }
                          else if (isVacant) { bg = "#c8c2b0"; color = "#7c7668"; }
                          else if (!notApplicable && p.status === "rented" && p.rent_amount > 0 && !isFuture && !isNotYetDue) { bg = "#fde8e8"; color = "#c0392b"; content = "!"; }
                          return (
                            <td key={m} style={{ textAlign: "center", padding: 3 }}>
                              <div
                                onClick={() => payment ? setSelectedPayment(payment) : setAddPaymentModal({ open: true, propertyId: p.id, month: monthStr })}
                                title={payment ? `+${fmt(payment.rent_received)} Kč` : ""}
                                style={{ width: 26, height: 22, borderRadius: 5, background: bg, color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto" }}>
                                {content}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#7c8378", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#d6e4d6", display: "inline-block" }} />{t("zaplacenoLabel")}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#fde8e8", display: "inline-block" }} />{t("nezaplacenoLabel")}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#c8c2b0", display: "inline-block" }} />{language === "cs" ? "Volné" : "Vacant"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#e6e0d0", display: "inline-block" }} />{t("nadchaziLabel")}</span>
                </div>
              </div>
            );
          })()}

          {/* Nespárované platby */}
          {unmatchedPayments.length > 0 && (
            <div style={{ background: "#fde8e8", border: "1px solid #f5c0c0", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: "#c0392b", fontSize: 13, fontWeight: 700 }}>⚠ {unmatchedPayments.length} {unmatchedPayments.length === 1 ? "nespárovaná platba" : unmatchedPayments.length < 5 ? "nespárované platby" : "nespárovaných plateb"}</span>
              </div>
              {unmatchedPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between"
                  style={{ fontSize: 13, color: "#7c3030", padding: "6px 0", borderTop: "1px solid #f5c0c0" }}>
                  <span>
                    <strong>{fmt(p.rent_received)} Kč</strong>
                    {p.sender_name ? ` od ${p.sender_name}` : ""}
                    {" · "}{p.payment_date ? fmtDate(p.payment_date) : monthLabel(p.month)}
                  </span>
                  <button onClick={() => setSelectedPayment(p)}
                    style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer" }}>
                    Přiřadit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Filtry nemovitostí */}
          <div className="flex gap-[7px] flex-wrap mb-4">
            <button onClick={() => { setActiveFilter(null); setShowAllPayments(false); }}
              className="cursor-pointer rounded-[20px] border-none"
              style={{ fontWeight: 600, fontSize: 12, padding: "7px 13px", color: activeFilter === null ? "#f5f1e6" : "#5c6359", background: activeFilter === null ? "#1f3d2e" : "#e6e0d0" }}>
              Vše
            </button>
            {properties.filter((p) => p.status !== "planned").map((p) => (
              <button key={p.id} onClick={() => { setActiveFilter(p.id); setShowAllPayments(false); }}
                className="cursor-pointer rounded-[20px] border-none"
                style={{ fontWeight: 600, fontSize: 12, padding: "7px 13px", color: activeFilter === p.id ? "#f5f1e6" : "#5c6359", background: activeFilter === p.id ? "#1f3d2e" : "#e6e0d0" }}>
                {p.name}
              </button>
            ))}
          </div>

          {loading ? <div style={{ color: "#7c8378" }}>Načítám…</div>
            : filteredPayments.length === 0 ? (
              <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "24px 20px", color: "#9a9483", fontSize: 14 }}>
                Žádné platby zatím.
              </div>
            ) : (
              <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "6px 20px" }}>
                <div className="flex" style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9a9483", padding: "13px 0 10px" }}>
                  <span className="flex-1">Měsíc</span>
                  <span className="eq-pay-col" style={{ width: 120, textAlign: "right" }}>Nájem</span>
                  <span className="eq-pay-col" style={{ width: 120, textAlign: "right" }}>Výdaje</span>
                  <span className="eq-pay-col" style={{ width: 120, textAlign: "right" }}>Čistý zisk</span>
                </div>
                {(activeFilter || showAllPayments ? filteredPayments : filteredPayments.slice(0, 6)).map((p) => {
                  const prop = properties.find(pr => pr.id === p.property_id);
                  const dueDay = prop?.rent_due_day ?? 15;
                  const late = p.payment_date ? daysLate(p.payment_date, p.month, dueDay) : null;
                  return (
                    <div key={p.id}
                      className="flex cursor-pointer items-center"
                      onClick={() => setSelectedPayment(p)}
                      style={{ fontVariantNumeric: "tabular-nums", fontSize: 14, padding: "11px 0", borderTop: "1px solid #e3ddcb", color: "#1c2b22", borderRadius: 6, transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#ece6d8")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span>{monthLabel(p.month)}</span>
                          {prop && !activeFilter && <span style={{ fontSize: 11, fontWeight: 600, color: "#1f3d2e", background: "#d6e4d6", borderRadius: 20, padding: "2px 9px" }}>{prop.name}</span>}
                          {p.match_type === "auto" && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#e8e2d6", color: "#7c8378", fontWeight: 600 }}>auto</span>}
                        </span>
                        <span className="flex items-center gap-2 flex-wrap" style={{ marginTop: 3 }}>
                          {p.sender_name && <span style={{ fontSize: 12, color: "#5c6359" }}>{p.sender_name}</span>}
                          {p.payment_date && <span style={{ fontSize: 12, color: "#9a9483" }}>{fmtDate(p.payment_date)}</span>}
                          {late !== null && (
                            late > 0
                              ? <span style={{ fontSize: 11, fontWeight: 700, color: "#c0392b" }}>{late} {late === 1 ? "den" : late < 5 ? "dny" : "dní"} po splatnosti</span>
                              : late < 0
                                ? <span style={{ fontSize: 11, fontWeight: 700, color: "#1f3d2e" }}>{Math.abs(late)} {Math.abs(late) === 1 ? "den" : Math.abs(late) < 5 ? "dny" : "dní"} před splatností</span>
                                : <span style={{ fontSize: 11, fontWeight: 700, color: "#1f3d2e" }}>V den splatnosti</span>
                          )}
                        </span>
                      </span>
                      <span className="eq-pay-col" style={{ width: 120, textAlign: "right", color: "#1f3d2e", fontWeight: 600 }}>+{fmt(p.rent_received)}</span>
                      <span className="eq-pay-col" style={{ width: 120, textAlign: "right", color: "#a07b2f" }}>−{fmt(p.mortgage_payment)}</span>
                      <span className="eq-pay-col" style={{ width: 120, textAlign: "right", fontWeight: 700, color: p.net_cashflow >= 0 ? undefined : "#c0392b" }}>
                        {p.net_cashflow >= 0 ? "+" : ""}{fmt(p.net_cashflow)}
                      </span>
                    </div>
                  );
                })}
                {!activeFilter && filteredPayments.length > 6 && (
                  <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                    <button onClick={() => setShowAllPayments(v => !v)}
                      style={{ fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 20, border: "1.5px solid #d2cab4", background: "transparent", color: "#5c6359", cursor: "pointer" }}>
                      {showAllPayments ? "Zobrazit méně" : `Zobrazit vše (${filteredPayments.length})`}
                    </button>
                  </div>
                )}
              </div>
            )}
        </section>

        {/* NÁJEMNÍCI */}
        <section id="najemnici" style={{ marginTop: 38, scrollMarginTop: 28 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{t("najemnici")}</div>
            <button onClick={() => setShowAddTenant(true)}
              style={{ fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", cursor: "pointer" }}>
              + Přidat nájemníka
            </button>
          </div>
          {tenants.length === 0 ? (
            <div style={{ color: "#9a9483", fontSize: 14, padding: "24px 0" }}>Zatím žádní nájemníci. Přidej je ručně nebo přiřaď platbu k nemovitosti.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tenants.map(tenant => (
                <TenantCard key={tenant.id} tenant={tenant} properties={properties} supabase={supabase}
                  onSaved={t => setTenants(prev => prev.map(x => x.id === t.id ? t : x))}
                  onDeleted={id => setTenants(prev => prev.filter(x => x.id !== id))} />
              ))}
            </div>
          )}
          {showAddTenant && (
            <AddTenantModal properties={properties} supabase={supabase}
              onClose={() => setShowAddTenant(false)}
              onSaved={t => { setTenants(prev => [...prev, t]); setShowAddTenant(false); }} />
          )}
        </section>

        {/* KOMUNIKACE */}
        <section id="komunikace" style={{ marginTop: 38, scrollMarginTop: 28 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 14 }}>{t("komunikaceSNajemniky")}</div>

          {/* Výběr nemovitosti */}
          <div className="flex gap-[7px] flex-wrap mb-4">
            {activeProperties.map((p) => (
              <button key={p.id} onClick={() => { setCommPropertyId(p.id); setIncomingText(""); setDraftText(""); }}
                className="cursor-pointer rounded-[20px] border-none"
                style={{ fontWeight: 600, fontSize: 12, padding: "7px 13px", color: commPropertyId === p.id ? "#f5f1e6" : "#5c6359", background: commPropertyId === p.id ? "#1f3d2e" : "#e6e0d0" }}>
                {p.name}
              </button>
            ))}
          </div>

          {!commPropertyId ? (
            <div style={{ fontSize: 14, color: "#7c8378", lineHeight: 1.6 }}>
              Vyber nemovitost a veď historii komunikace s nájemníkem — vlož zprávu, kterou ti poslal (přes WhatsApp, email nebo SMS), a AI ti navrhne odpověď podle stavu plateb a smlouvy.
            </div>
          ) : (
            <>
              {/* Historie zpráv */}
              <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "16px 18px", marginBottom: 16, maxHeight: 340, overflowY: "auto" }}>
                {commLoading ? (
                  <div style={{ color: "#9a9483", fontSize: 13 }}>Načítám…</div>
                ) : commMessages.length === 0 ? (
                  <div style={{ color: "#9a9483", fontSize: 13 }}>Zatím žádná zaznamenaná komunikace.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {commMessages.map((m) => (
                      <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`} style={{ gap: 6, alignItems: "flex-end" }}>
                        {/* Delete button — inbound: right of bubble; outbound: left of bubble */}
                        {m.direction === "outbound" && (
                          <button onClick={async () => {
                            await supabase.from("messages").delete().eq("id", m.id);
                            setCommMessages(prev => prev.filter(x => x.id !== m.id));
                          }} title="Smazat zprávu"
                            style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: "none", background: "transparent", color: "#c0a898", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6, fontSize: 14, lineHeight: 1 }}>
                            ×
                          </button>
                        )}
                        <div style={{ maxWidth: "78%" }}>
                          <div style={{
                            padding: "9px 13px", borderRadius: m.direction === "outbound" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                            background: m.direction === "outbound" ? "#1f3d2e" : "#fff",
                            color: m.direction === "outbound" ? "#f5f1e6" : "#1c2b22",
                            fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                          }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#9a9483", marginTop: 3, textAlign: m.direction === "outbound" ? "right" : "left" }}>
                            {m.channel} · {fmtDate(m.created_at)}
                          </div>
                        </div>
                        {m.direction === "inbound" && (
                          <button onClick={async () => {
                            await supabase.from("messages").delete().eq("id", m.id);
                            setCommMessages(prev => prev.filter(x => x.id !== m.id));
                          }} title="Smazat zprávu"
                            style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: "none", background: "transparent", color: "#c0a898", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6, fontSize: 14, lineHeight: 1 }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nová zpráva */}
              <div className="flex items-center gap-3 mb-3">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em" }}>Vlož zprávu</div>
                <div className="flex" style={{ background: "#ede9dd", borderRadius: 20, padding: 2 }}>
                  {(["inbound", "outbound"] as const).map(d => (
                    <button key={d} onClick={() => setIncomingDirection(d)}
                      style={{ padding: "4px 12px", borderRadius: 18, border: "none", background: incomingDirection === d ? "#1f3d2e" : "transparent", color: incomingDirection === d ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {d === "inbound" ? "Přijatá" : "Odeslaná"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                {(["whatsapp", "email", "sms"] as const).map(c => (
                  <button key={c} onClick={() => setIncomingChannel(c)}
                    style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${incomingChannel === c ? "#1f3d2e" : "#d2cab4"}`, background: incomingChannel === c ? "#1f3d2e" : "transparent", color: incomingChannel === c ? "#f5f1e6" : "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                value={incomingText}
                onChange={e => setIncomingText(e.target.value)}
                placeholder={incomingDirection === "inbound" ? "Vlož text zprávy, kterou ti nájemník poslal…" : "Vlož text zprávy, kterou jsi poslal nájemníkovi…"}
                rows={3}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22", resize: "vertical", marginBottom: 10 }}
              />
              <div className="flex gap-2 mb-4">
                <button onClick={handleLogIncoming} disabled={!incomingText.trim() || savingMsg}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 13, fontWeight: 600, color: "#5c6359", cursor: !incomingText.trim() ? "not-allowed" : "pointer" }}>
                  Uložit do historie
                </button>
                {incomingDirection === "inbound" && (
                  <button onClick={handleSuggestReply} disabled={!incomingText.trim() || suggesting}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: !incomingText.trim() ? "#9db8a6" : "#1f3d2e", fontSize: 13, fontWeight: 600, color: "#f5f1e6", cursor: !incomingText.trim() ? "not-allowed" : "pointer" }}>
                    {suggesting ? "Přemýšlím…" : "Navrhni odpověď"}
                  </button>
                )}
              </div>

              {/* Návrh odpovědi */}
              {(draftText || suggesting) && (
                <div style={{ background: "#fff", border: "1px solid #d2cab4", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Návrh odpovědi</div>
                  <textarea
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    placeholder={suggesting ? "Generuji návrh…" : ""}
                    rows={4}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fdfbf5", fontSize: 14, color: "#1c2b22", resize: "vertical", marginBottom: 10 }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCopyDraft} disabled={!draftText}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 13, fontWeight: 600, color: "#5c6359", cursor: "pointer" }}>
                      {copied ? "✓ Zkopírováno" : "Kopírovat"}
                    </button>
                    <button onClick={handleSaveOutgoing} disabled={!draftText || savingMsg}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1f3d2e", fontSize: 13, fontWeight: 600, color: "#f5f1e6", cursor: "pointer" }}>
                      Uložit jako odeslané
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ASISTENT */}
        <section id="asistent" style={{ marginTop: 38, scrollMarginTop: 28 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 14 }}>{t("asistent")}</div>

          {/* Historie konverzací */}
          {chatMessages.length === 0 ? (
            <div style={{ fontSize: 14, color: "#7c8378", lineHeight: 1.6, marginBottom: 16 }}>
              Zeptej se na cokoli o svém portfoliu — výnosy, cash-flow, vývoj equity nebo srovnání nemovitostí.
            </div>
          ) : (
            <div className="flex flex-col gap-3" style={{ marginBottom: 16 }}>
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <button onClick={() => setChatMessages(prev => prev.filter((_, j) => j !== i))}
                      title="Smazat"
                      style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: "none", background: "transparent", color: "#b0a898", cursor: "pointer", fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
                      ×
                    </button>
                  )}
                  <div style={{
                    maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.role === "user" ? "#1f3d2e" : "#f5f1e6",
                    color: m.role === "user" ? "#f5f1e6" : "#1c2b22",
                    fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {m.content || <span style={{ opacity: 0.5 }}>…</span>}
                  </div>
                  {m.role === "user" && (
                    <button onClick={() => setChatMessages(prev => prev.filter((_, j) => j !== i))}
                      title="Smazat"
                      style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: "none", background: "transparent", color: "#b0a898", cursor: "pointer", fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Chat input přímo v sekci */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f5f1e6", borderRadius: 14, padding: "10px 14px" }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              placeholder="Zeptej se na své portfolio…"
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: "#1c2b22", outline: "none", fontFamily: "inherit" }}
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: chatLoading || !chatInput.trim() ? "#9db8a6" : "#1f3d2e", border: "none", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
              {chatLoading
                ? <svg width="15" height="15" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="#f5f1e6" strokeWidth="1.8" strokeDasharray="20 10"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f1e6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
        </section>

        {/* DLUHY */}
        <section id="dluhy" style={{ marginTop: 38, scrollMarginTop: 28, paddingBottom: 100 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 14 }}>{t("dluhy")}</div>

          {(() => {
            const iOwe = debts.filter(d => d.direction === "i_owe");
            const theyOwe = debts.filter(d => d.direction === "they_owe");
            const totalIOwe = iOwe.reduce((s, d) => s + d.amount_remaining, 0);
            const totalTheyOwe = theyOwe.reduce((s, d) => s + d.amount_remaining, 0);
            const balance = totalTheyOwe - totalIOwe;

            const DebtCard = ({ d }: { d: Debt }) => (
              <div onClick={() => setDebtModal({ open: true, debt: d })}
                style={{ background: "#f5f1e6", borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "box-shadow 0.15s", borderLeft: `3px solid ${d.direction === "i_owe" ? "#c0392b" : "#1f3d2e"}` }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,61,46,0.10)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#1c2b22", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "#7c8378", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>
                      {d.monthly_payment ? `Splátka ${fmt(d.monthly_payment)} Kč/měs` : ""}
                      {d.monthly_payment && d.interest_rate ? " · " : ""}
                      {d.interest_rate ? `Úrok ${d.interest_rate} %` : ""}
                      {d.due_date ? `${d.monthly_payment || d.interest_rate ? " · " : ""}Splatnost ${d.due_date}` : ""}
                    </div>
                    {d.note && (
                      <div style={{
                        fontSize: 12, color: "#9a9483", marginTop: 4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>{d.note}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 8 }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: d.direction === "i_owe" ? "#c0392b" : "#1f3d2e" }}>
                      {d.direction === "i_owe" ? "−" : "+"}{fmt(d.amount_remaining)} Kč
                    </div>
                    {d.amount_original !== d.amount_remaining && (
                      <div style={{ fontSize: 11, color: "#9a9483" }}>z {fmt(d.amount_original)} Kč</div>
                    )}
                  </div>
                </div>
                {d.amount_original > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 4, borderRadius: 3, background: "#e3ddcb", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100 - (d.amount_remaining / d.amount_original) * 100, 100)}%`, height: "100%", background: d.direction === "i_owe" ? "#c0392b" : "#1f3d2e", transition: "width .4s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9a9483", marginTop: 3 }}>
                      Splaceno {fmt(d.amount_original - d.amount_remaining)} Kč z {fmt(d.amount_original)} Kč
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div>
                {/* Souhrn */}
                <div className="eq-debt-stats" style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "Já dlužím", value: totalIOwe, color: "#c0392b", bg: "#fde8e8" },
                    { label: "Mně dluží", value: totalTheyOwe, color: "#1f3d2e", bg: "#d6e4d6" },
                    { label: "Bilance", value: Math.abs(balance), color: balance >= 0 ? "#1f3d2e" : "#c0392b", bg: "#f5f1e6", prefix: balance >= 0 ? "+" : "−" },
                  ].map(({ label, value, color, bg, prefix }) => (
                    <div key={label} style={{ flex: 1, minWidth: 0, background: bg, borderRadius: 10, padding: "14px 18px" }}>
                      <div style={{ fontSize: 11, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 22, color }}>{prefix ?? ""}{fmt(value)} Kč</div>
                    </div>
                  ))}
                </div>

                {/* Já dlužím */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Já dlužím</div>
                    <button onClick={() => setDebtModal({ open: true, debt: null })}
                      style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #e3ddcb", background: "transparent", color: "#5c6359", cursor: "pointer", fontWeight: 600 }}>
                      + Přidat
                    </button>
                  </div>
                  {iOwe.length === 0
                    ? <div style={{ fontSize: 13, color: "#9a9483" }}>Žádné záznamy</div>
                    : <div className="flex flex-col gap-[8px]">{iOwe.map(d => <DebtCard key={d.id} d={d} />)}</div>
                  }
                </div>

                {/* Mně dluží */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1f3d2e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mně dluží</div>
                    <button onClick={() => setDebtModal({ open: true, debt: null })}
                      style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #e3ddcb", background: "transparent", color: "#5c6359", cursor: "pointer", fontWeight: 600 }}>
                      + Přidat
                    </button>
                  </div>
                  {theyOwe.length === 0
                    ? <div style={{ fontSize: 13, color: "#9a9483" }}>Žádné záznamy</div>
                    : <div className="flex flex-col gap-[8px]">{theyOwe.map(d => <DebtCard key={d.id} d={d} />)}</div>
                  }
                </div>
              </div>
            );
          })()}
        </section>

        {/* Odhlásit — jen na mobilu, dole po scrollu */}
        <div className="eq-mobile-logout" style={{ display: "none", padding: "8px 0 24px" }}>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
            style={{ width: "100%", padding: "14px", background: "#f0ebe0", border: "none", borderRadius: 12, color: "#7c8378", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Odhlásit
          </button>
        </div>

        {/* ÚKOLY — zatím jen pro vlastníka, ostatní uživatelé sekci nevidí */}
        {userEmail === "krislasek65@gmail.com" && (
          <section id="ukoly" style={{ marginTop: 38, scrollMarginTop: 28, paddingBottom: 100 }}>
            <TodoistSection />
          </section>
        )}

        {/* NASTAVENÍ — skryté, jen jako kotva pro navigaci */}
        <section id="nastaveni" className="eq-settings-section" style={{ display: "none" }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 20 }}>{t("nastaveni")}</div>

          <div style={{ background: "#f5f1e6", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
            {/* Přihlášený účet */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e0d0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1f3d2e", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8a84b", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {userEmail?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1c2b22" }}>{userEmail}</div>
                <div style={{ fontSize: 12, color: "#9a9483" }}>Přihlášený účet</div>
              </div>
            </div>

            {/* Jazyk */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e0d0" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1c2b22", marginBottom: 10 }}>{t("jazykAplikace")}</div>
              <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 20, padding: 3, width: "fit-content" }}>
                <button onClick={() => saveLanguage("cs")} disabled={savingLanguage}
                  style={{ padding: "6px 16px", borderRadius: 18, border: "none", background: language === "cs" ? "#1f3d2e" : "transparent", color: language === "cs" ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: savingLanguage ? "default" : "pointer", fontFamily: "inherit" }}>
                  {t("cestina")}
                </button>
                <button onClick={() => saveLanguage("en")} disabled={savingLanguage}
                  style={{ padding: "6px 16px", borderRadius: 18, border: "none", background: language === "en" ? "#1f3d2e" : "transparent", color: language === "en" ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: savingLanguage ? "default" : "pointer", fontFamily: "inherit" }}>
                  {t("anglictina")}
                </button>
              </div>
            </div>

            {/* Odhlásit */}
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              style={{ width: "100%", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit", textAlign: "left" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#c0392b" }}>Odhlásit se</span>
            </button>
          </div>
        </section>

      </main>

      {/* FLOATING CHAT */}
      {/* Chat bar — desktop: vždy viditelný, mobil: tlačítko → otevře input */}
      <div className="eq-chatbar fixed bottom-0 right-0 z-[60]"
        style={{ left: 78, padding: "18px 48px 22px", background: "linear-gradient(to top, #ece6d8 60%, rgba(236,230,216,0))", pointerEvents: "none" }}>
        <div style={{ maxWidth: 1044, pointerEvents: "auto" }}>
          <div className="flex items-center gap-3"
            style={{ border: "1px solid #d2cab4", background: "#f7f3e9", borderRadius: 28, padding: "10px 12px 10px 14px", boxShadow: "0 6px 24px rgba(31,61,46,.12)" }}>
            <button className="flex items-center justify-center flex-none"
              onClick={() => setChatMessages([])}
              title="Nový rozhovor"
              style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #cfc6af", background: "transparent", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <line x1="8" y1="3" x2="8" y2="13" stroke="#5c6359" strokeWidth="1.7" />
                <line x1="3" y1="8" x2="13" y2="8" stroke="#5c6359" strokeWidth="1.7" />
              </svg>
            </button>
            <input
              ref={chatInputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              placeholder={activeProperty ? `Ptej se na ${activeProperty.name} nebo celé portfolio…` : "Zeptej se na své portfolio…"}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#1c2b22" }}
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="flex items-center justify-center flex-none"
              style={{ width: 38, height: 38, borderRadius: "50%", background: chatLoading || !chatInput.trim() ? "#9db8a6" : "#1f3d2e", border: "none", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
              {chatLoading
                ? <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="#f5f1e6" strokeWidth="1.8" strokeDasharray="20 10"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                : <svg width="16" height="16" viewBox="0 0 16 16"><line x1="8" y1="13" x2="8" y2="3" stroke="#f5f1e6" strokeWidth="1.9"/><polyline points="4,7 8,3 12,7" fill="none" stroke="#f5f1e6" strokeWidth="1.9"/></svg>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobil: floating chat tlačítko (skryté na desktopu přes CSS) */}
      <div className="eq-chat-fab">
        {mobileChatOpen ? (
          <div style={{ position: "fixed", bottom: 72, left: 12, right: 12, zIndex: 70, background: "#f7f3e9", borderRadius: 20, border: "1px solid #d2cab4", boxShadow: "0 8px 32px rgba(31,61,46,.18)", padding: "10px 10px 10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              autoFocus
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); setMobileChatOpen(false); } }}
              placeholder="Zeptej se na portfolio…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#1c2b22" }}
            />
            <button onClick={() => { handleSendChat(); setMobileChatOpen(false); }}
              disabled={chatLoading || !chatInput.trim()}
              style={{ width: 36, height: 36, borderRadius: "50%", background: chatLoading || !chatInput.trim() ? "#9db8a6" : "#1f3d2e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 16 16"><line x1="8" y1="13" x2="8" y2="3" stroke="#f5f1e6" strokeWidth="1.9"/><polyline points="4,7 8,3 12,7" fill="none" stroke="#f5f1e6" strokeWidth="1.9"/></svg>
            </button>
            <button onClick={() => setMobileChatOpen(false)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "transparent", border: "1px solid #cfc6af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="2" x2="12" y2="12" stroke="#5c6359" strokeWidth="1.7"/><line x1="12" y1="2" x2="2" y2="12" stroke="#5c6359" strokeWidth="1.7"/></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => setMobileChatOpen(true)}
            style={{ position: "fixed", bottom: 72, right: 16, zIndex: 70, width: 48, height: 48, borderRadius: "50%", background: "#1f3d2e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(31,61,46,.3)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5f1e6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
