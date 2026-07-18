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
};

async function parseEmailWithClaude(emailText: string): Promise<ParsedPayment | null> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Jsi asistent pro parsování bankovních notifikačních emailů. Z níže uvedeného emailu od mBanky extrahuj tyto informace a vrať je jako JSON objekt:
- amount: číslo (částka v CZK, pouze číslo bez mezer nebo symbolů)
- date: datum ve formátu YYYY-MM-DD
- sender_name: jméno odesílatele platby
- sender_account: číslo účtu odesílatele
- note: poznámka nebo zpráva pro příjemce (pokud existuje)

Pokud nějaký údaj neexistuje, použij prázdný string nebo 0 pro amount.
Vrať POUZE validní JSON objekt, žádný jiný text.

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

async function matchPropertyByAmount(amount: number): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?select=id,name,rent_amount&status=neq.planned`,
    { headers: supabaseHeaders }
  );
  if (!res.ok) return null;
  const properties = await res.json();

  // Match property where rent_amount is within 5% of received amount
  const match = properties.find(
    (p: { id: string; name: string; rent_amount: number }) =>
      Math.abs(p.rent_amount - amount) / p.rent_amount < 0.05
  );
  return match?.id ?? null;
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
  propertyId: string,
  parsed: ParsedPayment,
  mortgagePayment: number
): Promise<boolean> {
  const month = parsed.date.slice(0, 7) + "-01";
  const netCashflow = parsed.amount - mortgagePayment;

  // Check if payment for this month already exists
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/payments?property_id=eq.${propertyId}&month=eq.${month}`,
    { headers: supabaseHeaders }
  );
  const existing = await checkRes.json();

  if (existing.length > 0) {
    // Update existing
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?property_id=eq.${propertyId}&month=eq.${month}`,
      {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({
          rent_received: parsed.amount,
          mortgage_payment: mortgagePayment,
          net_cashflow: netCashflow,
          status: "paid",
        }),
      }
    );
    return updateRes.ok;
  } else {
    // Insert new
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({
        property_id: propertyId,
        month,
        rent_received: parsed.amount,
        mortgage_payment: mortgagePayment,
        net_cashflow: netCashflow,
        status: "paid",
      }),
    });
    return insertRes.ok;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Resend inbound webhook payload
    const emailFrom: string = body.from ?? "";
    const emailText: string = body.text ?? body.html ?? "";

    // Log Gmail forwarding verification emails so we can confirm the address
    if (emailFrom.includes("forwarding-noreply@google.com") || emailFrom.includes("gmail.com")) {
      console.log("GMAIL_VERIFY_EMAIL:", emailText);
      return NextResponse.json({ ok: true, skipped: "gmail verification logged" });
    }

    // Only process mBank notifications
    if (!emailFrom.includes("mbank.cz")) {
      return NextResponse.json({ ok: true, skipped: "not mbank" });
    }

    if (!emailText) {
      return NextResponse.json({ ok: false, error: "no email body" }, { status: 400 });
    }

    // Parse email with Claude
    const parsed = await parseEmailWithClaude(emailText);
    if (!parsed || !parsed.amount) {
      return NextResponse.json({ ok: false, error: "parse failed" }, { status: 422 });
    }

    // Match to property
    const propertyId = await matchPropertyByAmount(parsed.amount);
    if (!propertyId) {
      return NextResponse.json({ ok: false, error: `no property match for amount ${parsed.amount}` }, { status: 422 });
    }

    // Get mortgage payment for net cashflow calculation
    const mortgagePayment = await getMortgagePayment(propertyId);

    // Save to Supabase
    const saved = await savePayment(propertyId, parsed, mortgagePayment);
    if (!saved) {
      return NextResponse.json({ ok: false, error: "save failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, amount: parsed.amount, propertyId });
  } catch (err) {
    console.error("inbound-email error:", err);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
