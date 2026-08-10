import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchOne<T>(table: string, query: string): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: supabaseHeaders });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function fetchMany<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: supabaseHeaders });
  if (!res.ok) return [];
  return res.json();
}

export async function POST(req: NextRequest) {
  const { propertyId, incomingMessage, channel } = await req.json();
  if (!propertyId || !incomingMessage) {
    return NextResponse.json({ error: "missing propertyId or incomingMessage" }, { status: 400 });
  }

  const property = await fetchOne<Record<string, unknown>>(
    "properties", `id=eq.${propertyId}&select=*`
  );
  const tenant = await fetchOne<Record<string, unknown>>(
    "tenants", `property_id=eq.${propertyId}&select=name&limit=1`
  );
  const recentPayments = await fetchMany<Record<string, unknown>>(
    "payments", `property_id=eq.${propertyId}&select=month,payment_date,rent_received,status&order=month.desc&limit=3`
  );
  const history = await fetchMany<Record<string, unknown>>(
    "messages", `property_id=eq.${propertyId}&select=direction,content,channel,created_at&order=created_at.desc&limit=10`
  );

  if (!property) {
    return NextResponse.json({ error: "property not found" }, { status: 404 });
  }

  const dueDay = (property.rent_due_day as number) ?? 15;
  const lastPayment = recentPayments[0];

  const systemPrompt = `Jsi asistent majitele nemovitosti, který pomáhá psát odpovědi nájemníkům. Navrhni stručnou, zdvořilou a věcnou odpověď v češtině na zprávu níže. Piš tak, jak by ji majitel poslal přímo (bez oslovení "Vážený...", pokud to není email — piš neformálním, ale slušným tónem vhodným pro WhatsApp/SMS). Vrať POUZE text zprávy, žádné vysvětlování ani uvozovky.

KONTEXT NEMOVITOSTI:
- Nemovitost: ${property.name}
- Nájemník: ${tenant?.name || "neznámý"}
- Nájem: ${property.rent_amount} Kč/měsíc, splatnost ${dueDay}. den v měsíci
- Nájemní smlouva: ${property.lease_start ?? "?"} – ${property.lease_end ?? "?"}

POSLEDNÍ PLATBY:
${recentPayments.length ? recentPayments.map(p => `- ${p.month}: ${p.rent_received} Kč, stav: ${p.status}${p.payment_date ? `, zaplaceno ${p.payment_date}` : ""}`).join("\n") : "- žádné záznamy"}
${lastPayment ? `\nPoslední platba byla ${lastPayment.status === "paid" ? "uhrazena" : "neuhrazena"}.` : ""}

PŘEDCHOZÍ KOMUNIKACE (od nejnovější):
${history.length ? history.reverse().map(m => `- [${m.direction === "inbound" ? "nájemník" : "majitel"}, ${m.channel}] ${m.content}`).join("\n") : "- žádná historie"}

Kanál nové zprávy: ${channel ?? "whatsapp"}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: `Zpráva od nájemníka: "${incomingMessage}"\n\nNavrhni odpověď.` }],
    });

    const draft = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("suggest-reply error:", err);
    return NextResponse.json({ error: "Nepodařilo se vygenerovat návrh. Zkus to prosím znovu." }, { status: 502 });
  }
}
