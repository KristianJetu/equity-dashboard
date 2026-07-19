import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ParsedPayment = {
  amount: number;
  date: string;
  sender_name: string;
  sender_account: string;
  note: string;
  payment_type: "rent" | "deposit" | "partial" | "other";
};

async function parseEmailWithClaude(emailText: string): Promise<ParsedPayment | null> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Jsi asistent pro parsování bankovních notifikačních emailů od mBanky. Email může obsahovat více transakcí — zajímají tě POUZE příchozí platby (řádky s "Prichozi platba" nebo "Prich. okamzita platba"). Ignoruj odchozí platby (řádky s "Odch.").

Pokud je více příchozích plateb, vezmi tu největší (je to pravděpodobně nájem).

Z příchozí platby extrahuj:
- amount: číslo (přijatá částka v CZK, pouze číslo)
- date: datum ve formátu YYYY-MM-DD (z hlavičky emailu)
- sender_name: jméno odesílatele. Pokud "AV:" obsahuje "pošta" nebo "posta", nastav "Česká pošta (složenka)"
- sender_account: číslo účtu odesílatele z "z uc. ..." (přesně jak je v emailu, např. "87123/0300")
- note: obsah "AV:" pole (variabilní symbol / zpráva), pokud existuje
- payment_type: "rent" (běžný nájem), "deposit" (kauce nebo první platba s kaucí — pokud je AV nebo poznámka zmiňuje kauci), "partial" (nižší než obvyklý nájem), "other"

Pokud údaj neexistuje, použij prázdný string nebo 0 pro amount.
Vrať POUZE validní JSON, žádný jiný text.

Email:
${emailText}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ParsedPayment;
  } catch {
    return null;
  }
}

async function findTenantByAccount(accountNumber: string): Promise<{ property_id: string; name: string } | null> {
  if (!accountNumber) return null;
  // Match by suffix of account number (emails often show partial account like ...25057/0300)
  const suffix = accountNumber.replace(/^\.+/, "");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tenants?account_number=ilike.*${encodeURIComponent(suffix)}&select=property_id,name`,
    { headers: supabaseHeaders }
  );
  if (!res.ok) return null;
  const tenants = await res.json();
  return tenants[0] ?? null;
}

async function getMortgagePayment(propertyId: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/mortgages?property_id=eq.${propertyId}&select=monthly_payment`,
    { headers: supabaseHeaders }
  );
  if (!res.ok) return 0;
  const mortgages = await res.json();
  return mortgages[0]?.monthly_payment ?? 0;
}

async function savePayment(
  propertyId: string | null,
  parsed: ParsedPayment,
  mortgagePayment: number,
  matchType: "auto" | "unmatched",
  rawEmailText: string
): Promise<string | null> {
  const month = parsed.date ? parsed.date.slice(0, 7) + "-01" : new Date().toISOString().slice(0, 7) + "-01";
  const netCashflow = propertyId ? parsed.amount - mortgagePayment : 0;

  const paymentData: Record<string, unknown> = {
    month,
    rent_received: parsed.amount,
    mortgage_payment: mortgagePayment,
    net_cashflow: netCashflow,
    status: matchType === "unmatched" ? "unmatched" : "paid",
    raw_email_text: rawEmailText,
    sender_name: parsed.sender_name,
    sender_account: parsed.sender_account,
    match_type: matchType,
    payment_type: parsed.payment_type ?? "rent",
  };

  if (propertyId) {
    paymentData.property_id = propertyId;

    // Check if payment for this month already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?property_id=eq.${propertyId}&month=eq.${month}`,
      { headers: supabaseHeaders }
    );
    const existing = await checkRes.json();

    if (existing.length > 0) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/payments?property_id=eq.${propertyId}&month=eq.${month}`,
        {
          method: "PATCH",
          headers: supabaseHeaders,
          body: JSON.stringify(paymentData),
        }
      );
      return existing[0].id;
    }
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify(paymentData),
  });
  if (!insertRes.ok) return null;
  const inserted = await insertRes.json();
  return inserted[0]?.id ?? null;
}

async function ensureTenant(accountNumber: string, name: string, propertyId: string): Promise<void> {
  if (!accountNumber) return;
  // Upsert tenant — pokud uz existuje, nic se nestane
  await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ account_number: accountNumber, name, property_id: propertyId }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const payload = (body.data && typeof body.data === "object" ? body.data : body) as Record<string, unknown>;
    const emailFrom: string = (payload.from as string) ?? "";
    const emailText: string = ((payload.text ?? payload.html) as string) ?? "";

    if (!emailFrom.includes("mbank.cz")) {
      return NextResponse.json({ ok: true, skipped: "not mbank" });
    }

    if (!emailText) {
      return NextResponse.json({ ok: false, error: "no email body" }, { status: 400 });
    }

    const parsed = await parseEmailWithClaude(emailText);
    if (!parsed || !parsed.amount) {
      return NextResponse.json({ ok: false, error: "parse failed" }, { status: 422 });
    }

    // Pokus o sparovani podle cisla uctu
    const tenant = await findTenantByAccount(parsed.sender_account);

    if (tenant) {
      // Zname najemnika — automaticke sparovani
      const mortgagePayment = await getMortgagePayment(tenant.property_id);
      await savePayment(tenant.property_id, parsed, mortgagePayment, "auto", emailText);
      return NextResponse.json({ ok: true, match: "auto", amount: parsed.amount, propertyId: tenant.property_id });
    } else {
      // Nezname najemnika — ulozime jako nesparovane
      await savePayment(null, parsed, 0, "unmatched", emailText);
      return NextResponse.json({ ok: true, match: "unmatched", amount: parsed.amount, sender: parsed.sender_name });
    }
  } catch (err) {
    console.error("inbound-email error:", err);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
