"use client";
import { useState } from "react";
import { createClient } from "@/lib/auth";
import { useRouter } from "next/navigation";

const supabase = createClient();

const STEPS = [
  "Vítejte",
  "O vás",
  "Nemovitost",
  "Pořízení",
  "Hypotéka",
  "Nájem",
  "Pojištění",
  "Hotovo",
];

type PropertyData = {
  name: string;
  address: string;
  estimated_value: string;
  status: "rented" | "vacant" | "planned";
  purchase_date: string;
  purchase_price: string;
  annual_growth_pct: string;
  has_mortgage: boolean;
  mortgage_bank: string;
  loan_amount: string;
  loan_start_date: string;
  interest_rate: string;
  loan_term_years: string;
  monthly_payment: string;
  refix_date: string;
  rent_amount: string;
  rent_due_day: string;
  lease_start: string;
  lease_end: string;
  insurance_company: string;
  insurance_from: string;
  insurance_to: string;
  insurance_amount: string;
  insurance_url: string;
};

function emptyProperty(): PropertyData {
  return {
    name: "", address: "", estimated_value: "", status: "rented",
    purchase_date: "", purchase_price: "", annual_growth_pct: "3",
    has_mortgage: false,
    mortgage_bank: "", loan_amount: "", loan_start_date: "",
    interest_rate: "", loan_term_years: "", monthly_payment: "", refix_date: "",
    rent_amount: "", rent_due_day: "15",
    lease_start: "", lease_end: "",
    insurance_company: "", insurance_from: "", insurance_to: "",
    insurance_amount: "", insurance_url: "",
  };
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #d2cab4", background: "#faf8f3",
  fontSize: 14, color: "#1c2b22", boxSizing: "border-box" as const,
};
const labelStyle = {
  fontSize: 12, fontWeight: 600 as const, color: "#7c8378",
  textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6, display: "block",
};

function Field({ label, value, onChange, type = "text", suffix }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; suffix?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
        {suffix && <span style={{ fontSize: 13, color: "#9a9483", whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [propertyCount, setPropertyCount] = useState(1);
  const [properties, setProperties] = useState<PropertyData[]>([emptyProperty()]);
  const [currentProp, setCurrentProp] = useState(0);
  const [saving, setSaving] = useState(false);

  function updateProp(field: keyof PropertyData, value: string | boolean) {
    setProperties(prev => prev.map((p, i) => i === currentProp ? { ...p, [field]: value } : p));
  }

  const prop = properties[currentProp];
  const totalProps = properties.length;
  const isLastProp = currentProp === totalProps - 1;

  function handlePropCountChange(n: number) {
    setPropertyCount(n);
    setProperties(Array.from({ length: n }, (_, i) => properties[i] ?? emptyProperty()));
  }

  function nextProp() {
    if (!isLastProp) {
      setCurrentProp(i => i + 1);
      setStep(2); // back to property step for next one
    } else {
      setStep(s => s + 1);
    }
  }

  function prevStep() {
    if (step === 2 && currentProp > 0) {
      setCurrentProp(i => i - 1);
      setStep(7); // go to insurance of previous prop
    } else {
      setStep(s => Math.max(0, s - 1));
    }
  }

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.auth.updateUser({ data: { full_name: fullName } });

    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: user.id, full_name: fullName, onboarding_done: true,
    });
    if (profileErr) {
      alert("Chyba při ukládání profilu: " + profileErr.message);
      setSaving(false);
      return;
    }

    for (const p of properties) {
      const { data: propData, error: propErr } = await supabase.from("properties").insert({
        user_id: user.id,
        name: p.name || "Nemovitost",
        address: p.address || null,
        status: p.status,
        estimated_value: Number(p.estimated_value) || 0,
        rent_amount: Number(p.rent_amount) || 0,
        rent_due_day: Number(p.rent_due_day) || 15,
        purchase_date: p.purchase_date || null,
        purchase_price: p.purchase_price ? Number(p.purchase_price) : null,
        annual_growth_pct: p.annual_growth_pct ? Number(p.annual_growth_pct) : 3,
        lease_start: p.lease_start || null,
        lease_end: p.lease_end || null,
        insurance_company: p.insurance_company || null,
        insurance_from: p.insurance_from || null,
        insurance_to: p.insurance_to || null,
        insurance_amount: p.insurance_amount ? Number(p.insurance_amount) : null,
        insurance_url: p.insurance_url || null,
      }).select().single();

      if (propErr) {
        alert("Chyba při ukládání nemovitosti: " + propErr.message);
        setSaving(false);
        return;
      }

      if (propData && p.has_mortgage) {
        const { error: mortErr } = await supabase.from("mortgages").insert({
          user_id: user.id,
          property_id: propData.id,
          bank: p.mortgage_bank || null,
          outstanding_balance: Number(p.loan_amount) || 0,
          monthly_payment: Number(p.monthly_payment) || 0,
          refix_date: p.refix_date || null,
          loan_amount: p.loan_amount ? Number(p.loan_amount) : null,
          loan_start_date: p.loan_start_date || null,
          interest_rate: p.interest_rate ? Number(p.interest_rate) : null,
          loan_term_years: p.loan_term_years ? Number(p.loan_term_years) : null,
        });
        if (mortErr) {
          alert("Chyba při ukládání hypotéky: " + mortErr.message);
          setSaving(false);
          return;
        }
      }
    }

    router.push("/");
  }

  const progress = step / (STEPS.length - 1);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1e6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: "#1c2b22" }}>🏡 Equity Dashboard</div>
        </div>

        {/* Progress bar */}
        {step > 0 && step < STEPS.length - 1 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#7c8378", fontWeight: 600 }}>{STEPS[step]}</span>
              <span style={{ fontSize: 12, color: "#7c8378" }}>Krok {step} z {STEPS.length - 2}</span>
            </div>
            <div style={{ height: 4, background: "#e0d9c8", borderRadius: 4 }}>
              <div style={{ height: 4, background: "#1f3d2e", borderRadius: 4, width: `${progress * 100}%`, transition: "width 0.3s" }} />
            </div>
            {totalProps > 1 && step >= 2 && step <= 7 && (
              <div style={{ fontSize: 12, color: "#9a9483", marginTop: 6 }}>
                Nemovitost {currentProp + 1} z {totalProps}: <strong>{prop.name || "bez názvu"}</strong>
              </div>
            )}
          </div>
        )}

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "36px 36px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>

          {/* KROK 0 — Vítejte */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1c2b22", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 12 }}>Vítejte v Equity Dashboard!</div>
              <p style={{ color: "#5c6359", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                Než začnete, provedeme vás rychlým nastavením. Během několika kroků zadáte základní údaje o svých nemovitostech a hypotékách — čím více informací vyplníte, tím přesnější přehled o svém portfoliu získáte.
              </p>
              <p style={{ color: "#7c8378", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
                <strong>Nevíte si rady s přesným číslem?</strong> Nevadí — zadejte odhad a hodnoty můžete kdykoliv upravit v nastavení nemovitosti.
              </p>
              <button onClick={() => setStep(1)} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Začít nastavení →
              </button>
            </div>
          )}

          {/* KROK 1 — O vás */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>O vás</div>
              <div style={{ fontSize: 13, color: "#7c8378", marginBottom: 24 }}>Jak vás máme oslovovat?</div>
              <Field label="Jméno a příjmení" value={fullName} onChange={setFullName} />
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Počet nemovitostí</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => handlePropCountChange(n)}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${propertyCount === n ? "#1f3d2e" : "#d2cab4"}`, background: propertyCount === n ? "#1f3d2e" : "transparent", color: propertyCount === n ? "#f5f1e6" : "#5c6359", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                      {n}
                    </button>
                  ))}
                </div>
                {propertyCount === 5 && <div style={{ fontSize: 12, color: "#9a9483", marginTop: 6 }}>Více nemovitostí můžete přidat později v dashboardu.</div>}
              </div>
            </div>
          )}

          {/* KROK 2 — Nemovitost */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Nemovitost {totalProps > 1 ? `${currentProp + 1}` : ""}</div>
              <div style={{ fontSize: 13, color: "#7c8378", marginBottom: 24 }}>Základní informace o nemovitosti</div>
              <Field label="Název" value={prop.name} onChange={v => updateProp("name", v)} />
              <Field label="Adresa" value={prop.address} onChange={v => updateProp("address", v)} />
              <Field label="Aktuální odhadovaná hodnota" value={prop.estimated_value} onChange={v => updateProp("estimated_value", v)} type="number" suffix="Kč" />
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Stav</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {([["rented", "Pronajato"], ["vacant", "Volné"], ["planned", "Plánované"]] as const).map(([val, lbl]) => (
                    <button key={val} onClick={() => updateProp("status", val)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `2px solid ${prop.status === val ? "#1f3d2e" : "#d2cab4"}`, background: prop.status === val ? "#1f3d2e" : "transparent", color: prop.status === val ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KROK 3 — Pořízení */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Pořízení nemovitosti</div>
              <div style={{ fontSize: 13, color: "#7c8378", marginBottom: 24 }}>Slouží pro výpočet historického růstu hodnoty v grafu</div>
              <Field label="Datum koupě" value={prop.purchase_date} onChange={v => updateProp("purchase_date", v)} type="date" />
              <Field label="Kupní cena" value={prop.purchase_price} onChange={v => updateProp("purchase_price", v)} type="number" suffix="Kč" />
              <Field label="Odhadovaný roční růst hodnoty" value={prop.annual_growth_pct} onChange={v => updateProp("annual_growth_pct", v)} type="number" suffix="% / rok" />
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Má nemovitost hypotéku?</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {([true, false] as const).map(val => (
                    <button key={String(val)} onClick={() => updateProp("has_mortgage", val)}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${prop.has_mortgage === val ? "#1f3d2e" : "#d2cab4"}`, background: prop.has_mortgage === val ? "#1f3d2e" : "transparent", color: prop.has_mortgage === val ? "#f5f1e6" : "#5c6359", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {val ? "Ano" : "Ne"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KROK 4 — Hypotéka */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Hypotéka</div>
              <div style={{ fontSize: 13, color: "#7c8378", marginBottom: 24 }}>Detaily o hypotečním úvěru</div>
              <Field label="Banka" value={prop.mortgage_bank} onChange={v => updateProp("mortgage_bank", v)} />
              <Field label="Výše úvěru" value={prop.loan_amount} onChange={v => updateProp("loan_amount", v)} type="number" suffix="Kč" />
              <Field label="Datum čerpání" value={prop.loan_start_date} onChange={v => updateProp("loan_start_date", v)} type="date" />
              <Field label="Úroková sazba" value={prop.interest_rate} onChange={v => updateProp("interest_rate", v)} type="number" suffix="%" />
              <Field label="Splatnost" value={prop.loan_term_years} onChange={v => updateProp("loan_term_years", v)} type="number" suffix="let" />
              <Field label="Měsíční splátka" value={prop.monthly_payment} onChange={v => updateProp("monthly_payment", v)} type="number" suffix="Kč / měs" />
              <Field label="Datum refixu" value={prop.refix_date} onChange={v => updateProp("refix_date", v)} type="date" />
            </div>
          )}

          {/* KROK 5 — Nájem */}
          {step === 5 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Nájem</div>
              <div style={{ fontSize: 13, color: "#7c8378", marginBottom: 24 }}>Detaily o nájemní smlouvě</div>
              <Field label="Výše nájmu" value={prop.rent_amount} onChange={v => updateProp("rent_amount", v)} type="number" suffix="Kč / měs" />
              <Field label="Den splatnosti" value={prop.rent_due_day} onChange={v => updateProp("rent_due_day", v)} type="number" suffix="v měsíci" />
              <Field label="Začátek nájemní smlouvy" value={prop.lease_start} onChange={v => updateProp("lease_start", v)} type="date" />
              <Field label="Konec nájemní smlouvy" value={prop.lease_end} onChange={v => updateProp("lease_end", v)} type="date" />
            </div>
          )}

          {/* KROK 6 — Pojištění */}
          {step === 6 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1c2b22", marginBottom: 6 }}>Pojištění</div>
              <div style={{ fontSize: 13, color: "#7c8378", marginBottom: 24 }}>Informace o pojistné smlouvě</div>
              <Field label="Pojišťovna" value={prop.insurance_company} onChange={v => updateProp("insurance_company", v)} />
              <Field label="Platnost od" value={prop.insurance_from} onChange={v => updateProp("insurance_from", v)} type="date" />
              <Field label="Platnost do" value={prop.insurance_to} onChange={v => updateProp("insurance_to", v)} type="date" />
              <Field label="Roční pojistné" value={prop.insurance_amount} onChange={v => updateProp("insurance_amount", v)} type="number" suffix="Kč / rok" />
              <Field label="Odkaz na smlouvu" value={prop.insurance_url} onChange={v => updateProp("insurance_url", v)} />
            </div>
          )}

          {/* KROK 7 — Hotovo */}
          {step === 7 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1c2b22", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 12 }}>Vše nastaveno!</div>
              <p style={{ color: "#5c6359", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Zadali jste údaje pro <strong>{totalProps} {totalProps === 1 ? "nemovitost" : totalProps < 5 ? "nemovitosti" : "nemovitostí"}</strong>. Vše můžete kdykoliv upravit v detailu nemovitosti.
              </p>
              <div style={{ background: "#f5f1e6", borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
                {properties.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < properties.length - 1 ? "1px solid #e0d9c8" : "none" }}>
                    <span style={{ fontSize: 14, color: "#1c2b22", fontWeight: 600 }}>{p.name || `Nemovitost ${i + 1}`}</span>
                    <span style={{ fontSize: 13, color: "#7c8378" }}>{p.estimated_value ? `${Number(p.estimated_value).toLocaleString("cs-CZ")} Kč` : "—"}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleFinish} disabled={saving}
                style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Ukládám…" : "Přejít do dashboardu →"}
              </button>
            </div>
          )}

          {/* Navigační tlačítka */}
          {step > 0 && step < 7 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
              <button onClick={prevStep}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #d2cab4", background: "transparent", fontSize: 14, color: "#5c6359", cursor: "pointer" }}>
                ← Zpět
              </button>
              <button onClick={() => {
                if (step === 4 && !prop.has_mortgage) { setStep(5); return; }
                if (step === 6) { nextProp(); return; }
                setStep(s => s + 1);
              }}
                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {step === 6 && !isLastProp ? `Další nemovitost →` : "Pokračovat →"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
