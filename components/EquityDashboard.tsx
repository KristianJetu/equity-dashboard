"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTable } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

type Property = {
  id: string;
  name: string;
  address: string | null;
  bank: string | null;
  status: "rented" | "vacant" | "planned";
  rent_amount: number;
  estimated_value: number;
  rent_due_day?: number;
  purchase_date?: string | null;
  purchase_price?: number | null;
  annual_growth_pct?: number | null;
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
    id: "asistent", title: "Asistent",
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.8-5.4A8.5 8.5 0 1 1 21 11.5z" /></svg>,
  },
];

function statusBadge(status: string) {
  if (status === "rented") return { label: "Pronajato", cls: "text-[#1f3d2e] bg-[#d6e4d6]" };
  if (status === "vacant") return { label: "Volné", cls: "text-[#a07b2f] bg-[#efe3c6]" };
  return { label: "Plánováno", cls: "text-[#7c8378] bg-[#e6e0d0]" };
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

function PropertyModal({ property, mortgage, onClose, onSaved }: {
  property: Property;
  mortgage: Mortgage | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(property.name);
  const [status, setStatus] = useState(property.status);
  const [estimatedValue, setEstimatedValue] = useState(String(property.estimated_value));
  const [rentAmount, setRentAmount] = useState(String(property.rent_amount));
  const [rentDueDay, setRentDueDay] = useState(String(property.rent_due_day ?? 15));
  const [purchaseDate, setPurchaseDate] = useState(property.purchase_date ?? "");
  const [purchasePrice, setPurchasePrice] = useState(String(property.purchase_price ?? ""));
  const [annualGrowthPct, setAnnualGrowthPct] = useState(String(property.annual_growth_pct ?? 3));
  const [monthlyPayment, setMonthlyPayment] = useState(String(mortgage?.monthly_payment ?? ""));
  const [refixDate, setRefixDate] = useState(mortgage?.refix_date ?? "");
  const [loanAmount, setLoanAmount] = useState(String(mortgage?.loan_amount ?? ""));
  const [loanStartDate, setLoanStartDate] = useState(mortgage?.loan_start_date ?? "");
  const [interestRate, setInterestRate] = useState(String(mortgage?.interest_rate ?? ""));
  const [loanTermYears, setLoanTermYears] = useState(String(mortgage?.loan_term_years ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${property.id}`, {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({
        name,
        status,
        estimated_value: Number(estimatedValue),
        rent_amount: Number(rentAmount),
        rent_due_day: Number(rentDueDay),
        purchase_date: purchaseDate || null,
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        annual_growth_pct: annualGrowthPct ? Number(annualGrowthPct) : 3,
      }),
    });
    if (mortgage) {
      await fetch(`${SUPABASE_URL}/rest/v1/mortgages?id=eq.${mortgage.id}`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({
          monthly_payment: Number(monthlyPayment),
          refix_date: refixDate || null,
          loan_amount: loanAmount ? Number(loanAmount) : null,
          loan_start_date: loanStartDate || null,
          interest_rate: interestRate ? Number(interestRate) : null,
          loan_term_years: loanTermYears ? Number(loanTermYears) : null,
        }),
      });
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
          style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#fff", fontSize: 14, color: "#1c2b22" }} />
        {suffix && <span style={{ fontSize: 13, color: "#9a9483" }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "32px 32px 28px", width: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: "#1c2b22" }}>Detail nemovitosti</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9483", fontSize: 22 }}>×</button>
        </div>

        {field("Název nemovitosti", name, setName, "text")}

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

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Nemovitost</div>
        {field("Hodnota nemovitosti", estimatedValue, setEstimatedValue, "number", "Kč")}
        {field("Výše nájmu", rentAmount, setRentAmount, "number", "Kč / měs")}
        {field("Den splatnosti nájmu", rentDueDay, setRentDueDay, "number", "v měsíci")}
        {field("Datum koupě", purchaseDate, setPurchaseDate, "date")}
        {field("Kupní cena", purchasePrice, setPurchasePrice, "number", "Kč")}
        {field("Odhadovaný roční růst hodnoty", annualGrowthPct, setAnnualGrowthPct, "number", "% / rok")}

        {mortgage && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 8 }}>Hypotéka</div>
          {field("Výše úvěru", loanAmount, setLoanAmount, "number", "Kč")}
          {field("Datum čerpání", loanStartDate, setLoanStartDate, "date")}
          {field("Úroková sazba", interestRate, setInterestRate, "number", "%")}
          {field("Splatnost", loanTermYears, setLoanTermYears, "number", "let")}
          {field("Měsíční splátka", monthlyPayment, setMonthlyPayment, "number", "Kč / měs")}
          {field("Datum refixu", refixDate, setRefixDate, "date")}
        </>}

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
  payment, properties, onClose, onSave,
}: {
  payment: Payment;
  properties: Property[];
  onClose: () => void;
  onSave: (paymentId: string, propertyId: string) => Promise<void>;
}) {
  const [selectedProperty, setSelectedProperty] = useState(payment.property_id ?? "");
  const [saving, setSaving] = useState(false);
  const match = matchTypeLabel(payment.match_type);

  async function handleSave() {
    if (!selectedProperty) return;
    setSaving(true);
    await onSave(payment.id, selectedProperty);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div style={{ background: "#f5f1e6", borderRadius: 16, padding: "32px 32px 28px", width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
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
          {[
            { label: "Nájem", value: `+${fmt(payment.rent_received)} Kč`, color: "#1f3d2e" },
            { label: "Výdaje", value: `−${fmt(payment.mortgage_payment)} Kč`, color: "#a07b2f" },
            { label: "Čistý zisk", value: `${payment.net_cashflow >= 0 ? "+" : ""}${fmt(payment.net_cashflow)} Kč`, color: payment.net_cashflow >= 0 ? "#1f3d2e" : "#c0392b" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, background: "#ece6d8", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#9a9483", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Odesílatel */}
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

        {/* Akce */}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 14, color: "#5c6359", cursor: "pointer" }}>
            Zavřít
          </button>
          <button onClick={handleSave} disabled={!selectedProperty || saving}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: selectedProperty ? "#1f3d2e" : "#c5bfb0", fontSize: 14, fontWeight: 600, color: "#f5f1e6", cursor: selectedProperty ? "pointer" : "not-allowed" }}>
            {saving ? "Ukládám…" : "Uložit přiřazení"}
          </button>
        </div>
      </div>
    </div>
  );
}



// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EquityDashboard() {
  const navLinksRef = useRef<Record<string, HTMLAnchorElement | null>>({});
  const SECTION_IDS = ["dashboard", "nemovitosti", "platby", "asistent"];

  const [properties, setProperties] = useState<Property[]>([]);
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unmatchedPayments, setUnmatchedPayments] = useState<Payment[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  type ChatMessage = { role: "user" | "assistant"; content: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  async function loadPayments() {
    const pays = await fetchTable<Payment>("payments", "month.desc");
    setPayments(pays.filter(p => p.property_id !== null));
    setUnmatchedPayments(pays.filter(p => p.property_id === null));
  }

  useEffect(() => {
    async function load() {
      const [props, morts] = await Promise.all([
        fetchTable<Property>("properties", "sort_order.asc"),
        fetchTable<Mortgage>("mortgages"),
      ]);
      setProperties(props);
      setMortgages(morts);
      await loadPayments();
      setLoading(false);
    }
    load();
  }, []);

  // No auto-select — default shows all payments

  useEffect(() => {
    const setActive = (id: string) => {
      Object.entries(navLinksRef.current).forEach(([k, a]) => {
        if (!a) return;
        const on = k === id;
        a.style.background = on ? "rgba(255,255,255,.12)" : "transparent";
        const ic = a.querySelector<HTMLElement>(".nav-icon");
        if (ic) ic.style.color = on ? "#f5f1e6" : "#86a191";
      });
    };
    const onScroll = () => {
      let cur = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) cur = id;
      }
      setActive(cur);
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
    await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}`, {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({ status: newStatus }),
    });
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus as Property["status"] } : p));
  }

  async function handleAssignPayment(paymentId: string, propertyId: string) {
    const property = properties.find(p => p.id === propertyId);
    const payment = [...payments, ...unmatchedPayments].find(p => p.id === paymentId);
    if (!property || !payment) return;

    const mortgage = mortgages.find(m => m.property_id === propertyId);
    const mortgagePayment = mortgage?.monthly_payment ?? 0;
    const netCashflow = payment.rent_received - mortgagePayment;

    // Aktualizuj platbu
    await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${paymentId}`, {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({
        property_id: propertyId,
        mortgage_payment: mortgagePayment,
        net_cashflow: netCashflow,
        status: "paid",
        match_type: "manual",
      }),
    });

    // Uloz najemnika pro automaticke parovani priste
    if (payment.sender_account) {
      await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify({
          account_number: payment.sender_account,
          name: payment.sender_name ?? "",
          property_id: propertyId,
        }),
      });
    }

    await loadPayments();
  }

  const activeProperties = properties.filter((p) => p.status !== "planned");
  const totalValue = activeProperties.reduce((s, p) => s + p.estimated_value, 0);
  const totalDebt = mortgages.reduce((s, m) => s + m.outstanding_balance, 0);
  const equity = totalValue - totalDebt;
  const filteredPayments = activeFilter ? payments.filter((p) => p.property_id === activeFilter) : payments;
  const activeProperty = properties.find((p) => p.id === activeFilter);

  return (
    <div className="min-h-screen" style={{ background: "#ece6d8", fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          mortgage={mortgages.find(m => m.property_id === selectedProperty.id)}
          onClose={() => setSelectedProperty(null)}
          onSaved={async () => {
            const [props, morts] = await Promise.all([
              fetchTable<Property>("properties", "sort_order.asc"),
              fetchTable<Mortgage>("mortgages"),
            ]);
            setProperties(props);
            setMortgages(morts);
          }}
        />
      )}

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          properties={properties}
          onClose={() => setSelectedPayment(null)}
          onSave={handleAssignPayment}
        />
      )}

      {/* SIDEBAR */}
      <aside className="fixed top-0 left-0 bottom-0 flex flex-col items-center py-[22px] z-50" style={{ width: 78, background: "#1f3d2e" }}>
        <div className="flex items-center justify-center mb-[30px] flex-none" style={{ width: 34, height: 34, borderRadius: 9, background: "#c9a24b" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1f3d2e" }} />
        </div>
        <div className="flex flex-col gap-2 items-center">
          {NAV_ITEMS.map((item) => (
            <a key={item.id} href={`#${item.id}`} title={item.title}
              ref={(el) => { navLinksRef.current[item.id] = el; }}
              className="flex items-center justify-center transition-colors duration-150 rounded-[12px]"
              style={{ width: 46, height: 46, background: item.id === "dashboard" ? "rgba(255,255,255,.12)" : "transparent", textDecoration: "none" }}>
              <span className="nav-icon" style={{ color: item.id === "dashboard" ? "#f5f1e6" : "#86a191", display: "flex" }}>{item.icon}</span>
            </a>
          ))}
        </div>
        {/* Badge na nespárované */}
        {unmatchedPayments.length > 0 && (
          <a href="#platby" style={{ marginTop: 8, textDecoration: "none" }}>
            <span style={{ background: "#c0392b", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unmatchedPayments.length}
            </span>
          </a>
        )}
        <a href="#nastaveni" title="Nastavení" ref={(el) => { navLinksRef.current["nastaveni"] = el; }}
          className="mt-auto flex items-center justify-center rounded-[12px]"
          style={{ width: 46, height: 46, background: "transparent", textDecoration: "none" }}>
          <span className="nav-icon" style={{ color: "#86a191", display: "flex" }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
        </a>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 78, padding: "40px 48px 160px", maxWidth: 1140 }}>

        {/* Topbar */}
        <div className="flex justify-between items-center mb-[30px]">
          <div className="flex items-center gap-[11px]">
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#c39a3f" }} />
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 23, fontWeight: 700, letterSpacing: "-0.01em", color: "#1c2b22" }}>Equity</div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 13, color: "#7c8378" }}>
              {new Date().toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}
            </span>
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: "50%", background: "#1f3d2e", color: "#ece6d8", fontWeight: 600, fontSize: 12 }}>KL</div>
          </div>
        </div>

        {/* DASHBOARD */}
        <section id="dashboard" style={{ scrollMarginTop: 28 }}>
          <div style={{ background: "#1f3d2e", borderRadius: 14, padding: "38px 42px" }}>
            {loading ? (
              <div style={{ color: "#9db8a6", fontSize: 15 }}>Načítám data…</div>
            ) : (
              <div className="flex justify-between items-start gap-10">
                <div className="flex-1">
                  <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9db8a6" }}>Tvůj vlastní kapitál</div>
                  <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: 90, lineHeight: 0.94, letterSpacing: "-0.02em", color: "#f5f1e6", marginTop: 14 }}>
                    {fmtMil(equity)}<span style={{ fontSize: 36, color: "#9db8a6", fontWeight: 600 }}> mil Kč</span>
                  </div>
                  <div className="flex items-center gap-[14px] mt-[22px]">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1f3d2e", background: "#c9a24b", borderRadius: 30, padding: "8px 15px", fontSize: 14, fontWeight: 700 }}>
                      {activeProperties.length} nemovitostí
                    </span>
                    <span style={{ fontSize: 15, color: "#cfe0d4", fontWeight: 500 }}>Hodnota portfolia {fmtMil(totalValue)} mil Kč</span>
                  </div>
                  {totalDebt > 0 && (
                    <div style={{ marginTop: 26, maxWidth: 440 }}>
                      <div className="flex justify-between items-baseline mb-[9px]" style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9db8a6" }}>
                        <span>Vlastní kapitál / Hodnota portfolia</span>
                        <span style={{ color: "#e7c773" }}>{Math.round((equity / totalValue) * 100)} %</span>
                      </div>
                      <div style={{ height: 9, borderRadius: 6, background: "rgba(255,255,255,.14)", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (equity / totalValue) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#9db8a6,#c9a24b)" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col gap-[22px]" style={{ paddingTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f9d8a" }}>Hodnota portfolia</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 30, color: "#f5f1e6", marginTop: 5 }}>{fmtMil(totalValue)} mil Kč</div>
                  </div>
                  {totalDebt > 0 && (
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f9d8a" }}>Celkový dluh</div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 30, color: "#f5f1e6", marginTop: 5 }}>{fmtMil(totalDebt)} mil Kč</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f9d8a" }}>Nemovitosti</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 30, color: "#f5f1e6", marginTop: 5 }}>{activeProperties.length} objektů</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div style={{ padding: "34px 4px 8px" }}>
            <div className="flex justify-between items-center mb-4">
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22" }}>Jak rosteš v čase</div>
              <div className="flex gap-5" style={{ fontSize: 12, fontWeight: 600, color: "#5c6359" }}>
                {[{ color: "#1f3d2e", label: "Equity" }, { color: "#c39a3f", label: "Hodnota" }, { color: "#b08c7a", label: "Dluh" }].map(({ color, label }) => (
                  <span key={label} className="inline-flex items-center gap-[7px]">
                    <span style={{ width: 18, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />{label}
                  </span>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 600 240" width="100%" height="250" preserveAspectRatio="none" style={{ display: "block" }}>
              <defs>
                <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f3d2e" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#1f3d2e" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[60, 110, 160, 210].map((y) => <line key={y} x1="40" y1={y} x2="579" y2={y} stroke="#d8d0bd" strokeWidth="1" />)}
              <polygon points="40,149.8 89,148.8 138,147.8 187,146.9 236,145.9 285,144.9 334,144 383,143 432,142 481,141.1 530,140.1 579,139.1 579,220 40,220" fill="url(#eqfill)" />
              <polyline points="40,105.3 89,105.8 138,106.7 187,107.6 236,108.4 285,109.3 334,109.8 383,110.2 432,110.7 481,111.1 530,111.6 579,112" fill="none" stroke="#b08c7a" strokeWidth="2" />
              <polyline points="40,46.7 89,45.3 138,44 187,42.7 236,41.8 285,40.4 334,38.7 383,36.9 432,35.6 481,34.2 530,32.4 579,31.1" fill="none" stroke="#c39a3f" strokeWidth="2" />
              <polyline points="40,149.8 89,148.8 138,147.8 187,146.9 236,145.9 285,144.9 334,144 383,143 432,142 481,141.1 530,140.1 579,139.1" fill="none" stroke="#1f3d2e" strokeWidth="3" />
              <circle cx="579" cy="139.1" r="4.5" fill="#1f3d2e" />
            </svg>
            <div className="flex justify-between pt-[6px]" style={{ fontSize: 11, fontWeight: 500, color: "#9a9483", paddingLeft: 36 }}>
              {["čvc", "říj", "led", "dub", "čvn"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        </section>

        {/* NEMOVITOSTI */}
        <section id="nemovitosti" style={{ marginTop: 38, scrollMarginTop: 28 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 14 }}>Tvé nemovitosti</div>
          {loading ? <div style={{ color: "#7c8378" }}>Načítám…</div> : (
            <div className="flex flex-col gap-[10px]">
              {activeProperties.map((p) => {
                const { label, cls } = statusBadge(p.status);
                const mortgage = mortgages.find((m) => m.property_id === p.id);
                return (
                  <div key={p.id} onClick={() => setSelectedProperty(p)} style={{ background: "#f5f1e6", borderRadius: 10, padding: "15px 18px", border: p.status === "planned" ? "1px dashed #c9c0aa" : "1px solid transparent", cursor: "pointer", transition: "box-shadow 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,61,46,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#7c8378", marginTop: 2 }}>
                          {p.status === "rented" ? `Nájem ${fmt(p.rent_amount)} Kč / měs` : p.address ?? ""}
                          {mortgage ? ` · Splátka ${fmt(mortgage.monthly_payment)} Kč` : ""}
                          {mortgage?.refix_date ? ` · Refix ${mortgage.refix_date}` : ""}
                        </div>
                        {mortgage?.refix_date && (() => {
                          const days = daysUntil(mortgage.refix_date);
                          if (days > 90) return null;
                          const urgent = days <= 30;
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 10px", borderRadius: 20, background: urgent ? "#fde8e8" : "#efe3c6", color: urgent ? "#c0392b" : "#a07b2f", fontSize: 12, fontWeight: 700 }}>
                              ⚠ Refix za {days} dní ({mortgage.refix_date})
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 15, color: "#1c2b22" }}>{fmtMil(p.estimated_value)} mil</span>
                        <button onClick={e => { e.stopPropagation(); handleToggleStatus(p.id, p.status); }} className={`inline-flex items-center rounded-[20px] ${cls}`} style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", padding: "5px 11px", border: "none", cursor: "pointer" }}>{label}</button>
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
                          <div style={{ fontSize: 11, color: "#9a9483", marginTop: 3 }}>Dluh {fmtMil(mortgage.outstanding_balance)} mil · Hodnota {fmtMil(p.estimated_value)} mil</div>
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
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 14 }}>Historie plateb</div>

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
                  <span style={{ width: 120, textAlign: "right" }}>Nájem</span>
                  <span style={{ width: 120, textAlign: "right" }}>Výdaje</span>
                  <span style={{ width: 120, textAlign: "right" }}>Čistý zisk</span>
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
                        <span className="flex items-center gap-2">
                          <span>{monthLabel(p.month)}</span>
                          {p.match_type === "auto" && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#d6e4d6", color: "#1f3d2e", fontWeight: 600 }}>auto</span>}
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
                      <span style={{ width: 120, textAlign: "right", color: "#1f3d2e", fontWeight: 600 }}>+{fmt(p.rent_received)}</span>
                      <span style={{ width: 120, textAlign: "right", color: "#a07b2f" }}>−{fmt(p.mortgage_payment)}</span>
                      <span style={{ width: 120, textAlign: "right", fontWeight: 700, color: p.net_cashflow >= 0 ? undefined : "#c0392b" }}>
                        {p.net_cashflow >= 0 ? "+" : ""}{fmt(p.net_cashflow)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
        </section>

        {/* ASISTENT */}
        <section id="asistent" style={{ marginTop: 38, scrollMarginTop: 28, paddingBottom: 100 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 600, color: "#1c2b22", marginBottom: 14 }}>Asistent</div>
          {chatMessages.length === 0 ? (
            <div style={{ fontSize: 14, color: "#7c8378", lineHeight: 1.6 }}>
              Zeptej se na cokoli o svém portfoliu — výnosy, cash-flow, vývoj equity nebo srovnání nemovitostí.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div style={{
                    maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.role === "user" ? "#1f3d2e" : "#f5f1e6",
                    color: m.role === "user" ? "#f5f1e6" : "#1c2b22",
                    fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {m.content || <span style={{ opacity: 0.5 }}>…</span>}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </section>

      </main>

      {/* FLOATING CHAT */}
      <div className="fixed bottom-0 right-0 z-[60]"
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
    </div>
  );
}
