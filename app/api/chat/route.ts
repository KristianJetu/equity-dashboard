import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, portfolio } = await req.json();

  const systemPrompt = `Jsi osobní finanční asistent pro správu nemovitostního portfolia. Odpovídáš stručně, konkrétně a v češtině.

Zde jsou aktuální data portfolia:

NEMOVITOSTI:
${portfolio.properties.map((p: Record<string, unknown>) => `- ${p.name}: hodnota ${p.estimated_value} Kč, stav: ${p.status === "rented" ? "pronajato" : p.status === "vacant" ? "volné" : "plánováno"}, nájem: ${p.rent_amount} Kč/měs`).join("\n")}

HYPOTÉKY:
${portfolio.mortgages.map((m: Record<string, unknown>) => `- ${portfolio.properties.find((p: Record<string, unknown>) => p.id === m.property_id)?.name ?? "?"}: dluh ${m.outstanding_balance} Kč, splátka ${m.monthly_payment} Kč/měs${m.refix_date ? `, refix ${m.refix_date}` : ""}`).join("\n")}

PLATBY (posledních 12 měsíců):
${portfolio.payments.slice(0, 24).map((p: Record<string, unknown>) => `- ${portfolio.properties.find((pr: Record<string, unknown>) => pr.id === p.property_id)?.name ?? "?"}: ${p.month?.toString().slice(0, 7)}, nájem ${p.rent_received} Kč, splátka ${p.mortgage_payment} Kč, čistý zisk ${p.net_cashflow} Kč${p.payment_date ? `, zaplaceno ${p.payment_date}` : ""}${p.sender_name ? `, od ${p.sender_name}` : ""}`).join("\n")}

Celková hodnota portfolia: ${portfolio.properties.reduce((s: number, p: Record<string, unknown>) => s + (p.estimated_value as number), 0)} Kč
Celkový dluh: ${portfolio.mortgages.reduce((s: number, m: Record<string, unknown>) => s + (m.outstanding_balance as number), 0)} Kč
Vlastní kapitál: ${portfolio.properties.reduce((s: number, p: Record<string, unknown>) => s + (p.estimated_value as number), 0) - portfolio.mortgages.reduce((s: number, m: Record<string, unknown>) => s + (m.outstanding_balance as number), 0)} Kč`;

  const stream = await anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
