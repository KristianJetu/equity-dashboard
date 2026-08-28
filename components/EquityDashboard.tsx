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
  notes?: string | null;
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

const translations = {
  cs: {
    dashboard: "Dashboard",
    nemovitosti: "Nemovitosti",
    platby: "Platby",
    najemnici: "Nájemníci",
    komunikace: "Komunikace",
    asistent: "Asistent",
    dluhy: "Dluhy",
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
    bezDluhu: "Bez dluhů",
    vcBilanceZDluhy: "Vč. bilance z Dluhy",
    bilanceZDluhy: "bilance z Dluhy",
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
    dluhy: "Debts",
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
    bezDluhu: "Excl. debts",
    vcBilanceZDluhy: "Incl. debts balance",
    bilanceZDluhy: "debts balance",
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
    id: "dluhy", title: "Dluhy",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
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
  return new Date(dateStr).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
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

function PropertyModal({ property, mortgage, supabase, onClose, onSaved }: {
  property: Property;
  mortgage: Mortgage | undefined;
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: () => void;
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
  const [notes, setNotes] = useState(property.notes ?? "");
  const [addMortgage, setAddMortgage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      notes: notes || null,
    }).eq("id", property.id);
    if (mortgage) {
      const { error: mortErr } = await supabase.from("mortgages").update({
        monthly_payment: Number(monthlyPayment),
        outstanding_balance: loanAmount ? Number(loanAmount) : mortgage.outstanding_balance,
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
        outstanding_balance: Number(loanAmount),
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

  const field = (label: string, value: string, onChange: (v: string) => void, type = "number", suffix = "") => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div className="flex items-center gap-2">
        <input type={type} value={value} onChange={e => { onChange(e.target.value); setSaved(false); }}
          lang={type === "date" ? "cs" : undefined}
          style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22" }} />
        {suffix && <span style={{ fontSize: 13, color: "#9a9483" }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "clamp(18px, 5vw, 32px) clamp(18px, 5vw, 32px) clamp(16px, 4vw, 28px)", width: "min(640px, 92vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: "#1c2b22" }}>Detail nemovitosti</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9483", fontSize: 22 }}>×</button>
        </div>

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
        {field("Hodnota nemovitosti", estimatedValue, setEstimatedValue, "number", "Kč")}
        {field("Výše nájmu", rentAmount, setRentAmount, "number", "Kč / měs")}
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
        {field("Kupní cena", purchasePrice, setPurchasePrice, "number", "Kč")}
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
          {field("Výše úvěru", loanAmount, setLoanAmount, "number", "Kč")}
          {field("Datum čerpání", loanStartDate, setLoanStartDate, "date")}
          {field("Úroková sazba", interestRate, setInterestRate, "number", "%")}
          {field("Splatnost", loanTermYears, setLoanTermYears, "number", "let")}
          {field("Měsíční splátka", monthlyPayment, setMonthlyPayment, "number", "Kč / měs")}
          {field("Konec fixace", refixDate, setRefixDate, "date")}
        </>}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Nájemní smlouva</div>
        {field("Začátek nájmu", leaseStart, setLeaseStart, "date")}
        {field("Konec nájmu", leaseEnd, setLeaseEnd, "date")}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Pojištění</div>
        {field("Pojišťovna", insuranceCompany, setInsuranceCompany, "text")}
        {field("Platnost od", insuranceFrom, setInsuranceFrom, "date")}
        {field("Platnost do", insuranceTo, setInsuranceTo, "date")}
        {field("Roční pojistné", insuranceAmount, setInsuranceAmount, "number", "Kč / rok")}
        {field("Odkaz na smlouvu", insuranceUrl, setInsuranceUrl, "url")}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Dokumenty</div>
        {field("Odkaz na dokument", documentUrl, setDocumentUrl, "url")}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Náklady</div>
        {field("Měsíční náklady (paušál)", monthlyCosts, setMonthlyCosts, "number", "Kč / měs")}

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 14, color: "#5c6359", cursor: "pointer" }}>Zavřít</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: saved ? "#2d6a4f" : "#1f3d2e", fontSize: 14, fontWeight: 600, color: "#f5f1e6", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saved ? "✓ Uloženo" : saving ? "Ukládám…" : "Uložit"}
          </button>
        </div>
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



// ── Growth Chart ─────────────────────────────────────────────────────────────
function GrowthChart({ properties, mortgages }: { properties: Property[]; mortgages: Mortgage[] }) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [range, setRange] = React.useState<"5" | "10" | "all">("all");
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
        const termMs = (mort.loan_term_years ?? 30) * 365 * 86400000;
        const loanAmt = mort.loan_amount ?? mort.outstanding_balance;
        debt += Math.max(0, loanAmt * (1 - Math.max(0, Math.min(1, (ms - loanMs) / termMs))));
      }
    }
    allPoints.push({ ms, value, debt });
  }

  if (allPoints.length === 0) return null;

  const maxVal = Math.max(...allPoints.map(p => p.value));
  const minVal = Math.min(...allPoints.map(p => Math.min(p.value - p.debt, 0)));
  const valRange = maxVal - minVal || 1;
  const toX = (ms: number) => PAD_L + ((ms - minMs) / totalMs) * (W - PAD_L - PAD_R);
  const toY = (v: number) => PAD_T + (1 - (v - minVal) / valRange) * (H - PAD_T - PAD_B);

  const valuePts = allPoints.map(p => `${toX(p.ms).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
  const debtPts = allPoints.map(p => `${toX(p.ms).toFixed(1)},${toY(p.debt).toFixed(1)}`).join(" ");
  const equityPts = allPoints.map(p => `${toX(p.ms).toFixed(1)},${toY(p.value - p.debt).toFixed(1)}`).join(" ");
  const equityFill = equityPts + ` ${toX(maxMs).toFixed(1)},${toY(minVal).toFixed(1)} ${toX(minMs).toFixed(1)},${toY(minVal).toFixed(1)}`;
  const todayX = toX(nowMs);

  const startYear = new Date(minMs).getFullYear();
  const endYear = new Date(maxMs).getFullYear();
  const labelMs: number[] = [];
  const firstLabel = Math.ceil(startYear / 5) * 5;
  for (let y = firstLabel; y <= endYear; y += 5) labelMs.push(new Date(y, 0, 1).getTime());

  const gridVals = [maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map(v => ({ v, y: toY(v) }));

  // Average annual equity growth (from first point with value > 0 to today)
  const firstPt = allPoints.find(p => p.value - p.debt > 0);
  const todayPt = allPoints.find(p => p.ms >= nowMs);
  const avgGrowthPct = firstPt && todayPt && firstPt.ms < todayPt.ms && firstPt.value - firstPt.debt > 0
    ? (Math.pow((todayPt.value - todayPt.debt) / (firstPt.value - firstPt.debt), 1 / ((todayPt.ms - firstPt.ms) / (365 * 86400000))) - 1) * 100
    : null;

  const purchaseMarkers: { ms: number }[] = [];
  const seenDates = new Set<string>();
  for (const p of properties) {
    if (p.purchase_date && !seenDates.has(p.purchase_date)) {
      const ms = new Date(p.purchase_date).getTime();
      if (ms <= nowMs) { purchaseMarkers.push({ ms }); seenDates.add(p.purchase_date); }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const ms = minMs + ((svgX - PAD_L) / (W - PAD_L - PAD_R)) * totalMs;
    const idx = allPoints.reduce((best, p, i) => Math.abs(p.ms - ms) < Math.abs(allPoints[best].ms - ms) ? i : best, 0);
    setHoverIdx(idx);
  };

  const hp = hoverIdx !== null ? allPoints[hoverIdx] : null;
  const hpX = hp ? toX(hp.ms) : 0;
  const tooltipRight = hpX > W * 0.6;

  return (
    <div style={{ padding: "34px 4px 8px" }}>
      <div className="eq-chart-header flex justify-between items-center mb-3">
        <div className="eq-chart-title" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{"Jak rosteš v čase"}</div>
        <div className="flex items-center gap-4" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Range switcher */}
          <div style={{ display: "flex", background: "#e6e0d0", borderRadius: 16, padding: 2 }}>
            {(["5", "10", "all"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{ padding: "8px 14px", borderRadius: 14, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: range === r ? "#1f3d2e" : "transparent",
                  color: range === r ? "#f5f1e6" : "#5c6359" }}>
                {r === "all" ? "Vše" : `${r} let`}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4" style={{ fontSize: 11, fontWeight: 600, color: "#5c6359" }}>
            {([{ color: "#1f3d2e", label: "Majetek" }, { color: "#c39a3f", label: "Hodnota portfolia" }, { color: "#b08c7a", label: "Dluh" }] as {color:string;label:string}[]).map(({ color, label }) => (
              <span key={label} className="inline-flex items-center gap-[6px]">
                <span style={{ width: 14, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />{label}
              </span>
            ))}
          </div>
        </div>
      </div>
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
          <text x={todayX + 4} y={PAD_T + 10} fontSize="9" fill="#c9a24b" fontWeight="600">dnes</text>
          {/* Chart lines */}
          <polygon points={equityFill} fill="url(#eqfill)" />
          <polyline points={debtPts} fill="none" stroke="#b08c7a" strokeWidth="2" />
          <polyline points={valuePts} fill="none" stroke="#c39a3f" strokeWidth="2" />
          <polyline points={equityPts} fill="none" stroke="#1f3d2e" strokeWidth="3" />
          {(() => {
            const tp = allPoints.find(p => p.ms >= nowMs);
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
              {new Date(hp.ms).toLocaleDateString("cs-CZ", { month: "short", year: "numeric" })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div><span style={{ color: "#c39a3f" }}>{"Hodnota portfolia"}</span>{"  "}{fmtMil(hp.value)} mil</div>
              <div><span style={{ color: "#b08c7a" }}>{"Dluh"}</span>{"  "}{fmtMil(hp.debt)} mil</div>
              <div><span style={{ color: "#6fcf8a" }}>{"Majetek"}</span>{"  "}{fmtMil(hp.value - hp.debt)} mil</div>
            </div>
          </div>
        )}
      </div>
      {/* Avg annual growth stat */}
      {avgGrowthPct !== null && (
        <div style={{ marginTop: 10, display: "flex", gap: 24, fontSize: 12, color: "#7c8378" }}>
          <span>{"Průměrný roční růst majetku:"} <strong style={{ color: avgGrowthPct >= 0 ? "#4a7c59" : "#c0392b" }}>{avgGrowthPct >= 0 ? "+" : ""}{avgGrowthPct.toFixed(1)} %</strong></span>
        </div>
      )}
    </div>
  );
}

// ── Cashflow Extra (donut + nejlepší/nejhorší) ────────────────────────────────
function CashflowExtra({ properties, mortgages, showPlanned }: { properties: Property[]; mortgages: Mortgage[]; showPlanned: boolean }) {
  if (properties.length === 0) return null;

  const visibleProps = showPlanned ? properties : properties.filter(p => p.status !== "planned");
  const totalRent = visibleProps.reduce((s, p) => s + (p.status === "rented" || (showPlanned && p.status === "planned") ? p.rent_amount : 0), 0);
  const totalMortgage = mortgages.filter(m => visibleProps.some(p => p.id === m.property_id)).reduce((s, m) => s + m.monthly_payment, 0);
  const totalInsurance = visibleProps.reduce((s, p) => s + (p.insurance_amount ? p.insurance_amount / 12 : 0), 0);
  const totalCosts = visibleProps.reduce((s, p) => s + (p.monthly_costs ?? 0), 0);
  const net = totalRent - totalMortgage - totalInsurance - totalCosts;

  const propCashflow = visibleProps.map(p => {
    const mortgage = mortgages.find(m => m.property_id === p.id);
    const income = (p.status === "rented" || (showPlanned && p.status === "planned")) ? p.rent_amount : 0;
    const out = (mortgage?.monthly_payment ?? 0) + (p.insurance_amount ? p.insurance_amount / 12 : 0) + (p.monthly_costs ?? 0);
    return { id: p.id, name: p.name, netCf: income - out };
  });
  const best = propCashflow.reduce((a, b) => b.netCf > a.netCf ? b : a);
  const worst = propCashflow.reduce((a, b) => b.netCf < a.netCf ? b : a);

  const cx = 80, cy = 80, R = 60, sw = 20;
  const circ = 2 * Math.PI * R;
  const slices = [
    { label: "Splátky", value: totalMortgage, color: "#c0392b" },
    { label: "Pojistky", value: Math.round(totalInsurance), color: "#e07b39" },
    { label: "Náklady", value: totalCosts, color: "#b8860b" },
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
            <text x={cx} y={cy - 7} textAnchor="middle" fill="#7c8378" fontSize="9" fontWeight="700">PŘÍJMY</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fill="#1f3d2e" fontSize="13" fontWeight="800">{fmt(totalRent)}</text>
            <text x={cx} y={cy + 23} textAnchor="middle" fill="#9a9483" fontSize="9">Kč / měs</text>
            {showPlanned && (() => {
              const plannedRent = properties.filter(p => p.status === "planned").reduce((s, p) => s + p.rent_amount, 0);
              if (!plannedRent) return null;
              return <text x={cx} y={cy + 36} textAnchor="middle" fill="#4a7c59" fontSize="8">z toho {fmt(plannedRent)} plán.</text>;
            })()}
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Struktura výdajů</div>
          {slices.map(sl => (
            <div key={sl.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#5c6359", flex: 1 }}>{sl.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: sl.label === "Čistý příjem" ? "#1f3d2e" : "#c0392b" }}>
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
        <div style={{ padding: "15px 18px", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#d6e4d6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1f3d2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1c2b22", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tenant.name || "—"}</div>
            <div style={{ fontSize: 12, color: "#9a9483", marginTop: 1 }}>{tenant.account_number}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {property && (
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1f3d2e", background: "#d6e4d6", borderRadius: 20, padding: "3px 10px" }}>{property.name}</div>
            )}
            <button onClick={() => setShowEdit(true)}
              style={{ padding: "5px 13px", borderRadius: 7, border: "1px solid #d2cab4", background: "#faf8f3", color: "#5c6359", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EquityDashboard() {
  const SECTION_IDS = ["dashboard", "nemovitosti", "platby", "najemnici", "komunikace", "asistent", "dluhy", "nastaveni"];

  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unmatchedPayments, setUnmatchedPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("··");
  const [language, setLanguage] = useState<"cs" | "en">("cs");
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
      supabase.from("profiles").select("language").eq("id", user.id).single().then(({ data: profile }) => {
        if (profile?.language === "en" || profile?.language === "cs") setLanguage(profile.language);
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
      const [{ data: props }, { data: morts }, { data: tens }, { data: dts }] = await Promise.all([
        supabase.from("properties").select("*").order("sort_order", { ascending: true }),
        supabase.from("mortgages").select("*"),
        supabase.from("tenants").select("*"),
        supabase.from("debts").select("*").order("created_at", { ascending: true }),
      ]);
      setProperties(props ?? []);
      setMortgages(morts ?? []);
      setTenants(tens ?? []);
      setDebts(dts ?? []);
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
  const debtsBalance = debts.reduce((s, d) => s + (d.direction === "they_owe" ? d.amount_remaining : -d.amount_remaining), 0);
  const displayEquity = showDebtsBalance ? equity + debtsBalance : equity;
  const filteredPayments = activeFilter ? payments.filter((p) => p.property_id === activeFilter) : payments;
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
          onClose={() => setSelectedProperty(null)}
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
          <GrowthChart properties={properties} mortgages={mortgages} />
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
                const isDragOver = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;
                return (
                  <div key={p.id}
                    draggable
                    onDragStart={() => { setDragIndex(idx); }}
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(idx); }}
                    onDragEnd={() => { if (dragIndex !== null && dragOverIndex !== null) handleDrop(dragIndex, dragOverIndex, displayList); setDragIndex(null); setDragOverIndex(null); }}
                    onClick={() => setSelectedProperty(p)}
                    style={{ background: p.status === "planned" ? "#eef5ee" : "#f5f1e6", borderRadius: 10, padding: "15px 18px", border: isDragOver ? "2px dashed #1f3d2e" : "1px solid transparent", cursor: "grab", transition: "box-shadow 0.15s", opacity: dragIndex === idx ? 0.5 : 1 }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,61,46,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
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
                        <div className="eq-prop-info" style={{ fontSize: 12, color: "#7c8378", marginTop: 2 }}>
                          {p.status === "rented" ? t("najemMesicne")(fmt(p.rent_amount)) : p.address ?? ""}
                          {mortgage ? ` · ${t("splatkaX")(fmt(mortgage.monthly_payment))}` : ""}
                          {mortgage?.refix_date ? ` · ${t("konecFixaceX")(mortgage.refix_date)}` : ""}
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
                        {p.status === "rented" && !isManaged && (() => {
                          const now = new Date();
                          const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
                          const hasPaid = payments.some(pay => pay.property_id === p.id && pay.month === monthStr && pay.rent_received > 0);
                          if (hasPaid) return null;
                          const dueDay = p.rent_due_day ?? 15;
                          const overdueDays = now.getDate() - dueDay;
                          if (overdueDays <= 0) return null;
                          const isAdvance = (p.rent_timing ?? "advance") === "advance";
                          const nextMonthName = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString("cs", { month: "long" });
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 6, padding: "4px 6px 4px 10px", borderRadius: 20, background: "#fde8e8", color: "#c0392b", fontSize: 12, fontWeight: 700 }}>
                              <span>{t("najemPoSplatnosti")(overdueDays)}{isAdvance ? ` (za ${nextMonthName})` : ""}</span>
                              <button onClick={e => { e.stopPropagation(); setAddPaymentModal({ open: true, propertyId: p.id, month: monthStr }); }}
                                style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 12, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer" }}>
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
                      </div>
                      <div className="flex items-center gap-3" style={{ flexShrink: 0, paddingLeft: 8 }}>
                        {!isManaged && <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{fmtMil(p.estimated_value)} mil</span>}
                        <button onClick={e => { e.stopPropagation(); if (!isManaged) handleToggleStatus(p.id, p.status); }} className={`inline-flex items-center rounded-[20px] ${cls}`} style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", padding: "5px 11px", border: "none", cursor: isManaged ? "default" : "pointer" }}>{label}</button>
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
                          <div style={{ fontSize: 11, color: "#9a9483", marginTop: 3 }}>{t("dluhHodnota")(fmtMil(mortgage.outstanding_balance), fmtMil(p.estimated_value))}</div>
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
          <div className="eq-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>{t("mesicniCashflow")}</div>
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

          {/* Cashflow přehled */}
          {(() => {
            const rentedProps = properties.filter(p => p.status === "rented");
            const plannedProps = properties.filter(p => p.status === "planned");

            const realRent = rentedProps.reduce((s, p) => s + p.rent_amount, 0);
            const plannedRent = showPlanned ? plannedProps.reduce((s, p) => s + p.rent_amount, 0) : 0;
            const totalRent = realRent + plannedRent;

            const totalMortgage = mortgages.reduce((s, m) => s + m.monthly_payment, 0);
            const totalInsurance = properties.filter(p => showPlanned || p.status !== "planned").reduce((s, p) => s + (p.insurance_amount ? p.insurance_amount / 12 : 0), 0);
            const totalCosts = properties.filter(p => showPlanned || p.status !== "planned").reduce((s, p) => s + (p.monthly_costs ?? 0), 0);
            const totalOut = totalMortgage + totalInsurance + totalCosts;
            const net = totalRent - totalOut;

            const propCf = properties
              .filter(p => showPlanned || p.status !== "planned")
              .map(p => {
                const mortgage = mortgages.find(m => m.property_id === p.id);
                const income = p.status === "rented" ? p.rent_amount : (p.status === "planned" ? p.rent_amount : 0);
                const out = (mortgage?.monthly_payment ?? 0) + (p.insurance_amount ? p.insurance_amount / 12 : 0) + (p.monthly_costs ?? 0);
                return { id: p.id, name: p.name, income, out, net: income - out, status: p.status, planned: p.status === "planned" };
              });

            const toggleCf = (key: "income" | "expenses" | "net") =>
              setCfExpanded(prev => prev === key ? null : key);

            const panelStyle = (key: "income" | "expenses" | "net") => ({
              flex: 1, cursor: "pointer" as const,
              borderRight: key !== "net" ? "1px solid #d2cab4" : undefined,
              paddingRight: key !== "net" ? 24 : undefined,
              paddingLeft: key !== "income" ? 24 : undefined,
              background: cfExpanded === key ? "rgba(31,61,46,0.04)" : undefined,
              borderRadius: 8,
              padding: "8px 12px",
            });

            return (
              <>
                {/* Souhrnný box */}
                <div style={{ background: "#f5f1e6", borderRadius: 12, padding: "14px 12px", marginBottom: 4 }}>
                  <div className="eq-cf-panels" style={{ display: "flex", gap: 0, alignItems: "center" }}>
                    {/* Příjmy */}
                    <div style={panelStyle("income")} onClick={() => toggleCf("income")}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("prijmy")}</div>
                        <span style={{ fontSize: 11, color: "#9a9483" }}>{cfExpanded === "income" ? "▴" : "▾"}</span>
                      </div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 800, color: "#1f3d2e", marginTop: 4 }}>+{fmt(totalRent)} Kč</div>
                      {showPlanned && plannedRent > 0
                        ? <div style={{ fontSize: 11, color: "#4a7c59", marginTop: 2 }}>{t("zTohoPlanovane")(fmt(plannedRent))}</div>
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
                      <div style={{ fontSize: 11, color: "#9a9483", marginTop: 2 }}>{t("mesicne")}</div>
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
                          border: "none",
                          borderLeft: `3px solid ${p.net >= 0 ? "#1f3d2e" : "#c0392b"}`,
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
                </div>
              </>
            );
          })()}

          <CashflowExtra properties={properties} mortgages={mortgages} showPlanned={showPlanned} />

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
                          let bg = "#e6e0d0", color = "#9a9483", content = "";
                          if (payment) { bg = "#d6e4d6"; color = "#1f3d2e"; content = "✓"; }
                          else if (p.status === "rented" && !isFuture && !isNotYetDue) { bg = "#fde8e8"; color = "#c0392b"; content = "!"; }
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
            <button onClick={() => setActiveFilter(null)}
              className="cursor-pointer rounded-[20px] border-none"
              style={{ fontWeight: 600, fontSize: 12, padding: "7px 13px", color: activeFilter === null ? "#f5f1e6" : "#5c6359", background: activeFilter === null ? "#1f3d2e" : "#e6e0d0" }}>
              Vše
            </button>
            {properties.filter((p) => p.status !== "planned").map((p) => (
              <button key={p.id} onClick={() => setActiveFilter(p.id)}
                className="cursor-pointer rounded-[20px] border-none"
                style={{ fontWeight: 600, fontSize: 12, padding: "7px 13px", color: activeFilter === p.id ? "#f5f1e6" : "#5c6359", background: activeFilter === p.id ? "#1f3d2e" : "#e6e0d0" }}>
                {p.name.split(" ")[0]}
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
                {filteredPayments.map((p) => {
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
                {p.name.split(" ")[0]}
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
