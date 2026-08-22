// POST /api/experiences/dream-preview — PÚBLICO (funil Dream Decoder).
// { dream: string (≤600) } → { theme, symbols[], reaction }
//
// Entrega valor real antes do paywall: a Aura identifica os símbolos do
// relato e reage em uma frase. Sem login, sem crédito, sem persistência e
// com limite por IP (6 por 10 min) — o custo é uma chamada curta à LLM.

import { NextRequest, NextResponse } from "next/server";
import { groqChatJson } from "@/lib/server/groq";
import { str, strList, rateLimit } from "@/lib/experiences/run";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  if (!rateLimit(`dream-preview:${ip}`)) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const dream = str(body?.dream).slice(0, 600);
  if (dream.length < 12) {
    return NextResponse.json({ error: "Tell Master Aura a little more." }, { status: 400 });
  }

  try {
    const raw = await groqChatJson<Record<string, unknown>>({
      system: [
        "You are Master Aura, an intimate spiritual guide. You read dreams symbolically (what the mind may be processing) — never prophecy, never diagnosis.",
        "Short, warm, specific, a little unsettling. Hedged language ('may', 'can speak to'). Always English (US). JSON only.",
        'Schema: {"theme": string (max 8 words), "symbols": [string] (2-4 symbols that actually appear), "reaction": string (1-2 sentences Master Aura says back to the person about THIS dream — no questions, no promises)}',
      ].join(" "),
      user: `The dream, in their words: """${dream}"""`,
      maxTokens: 300,
      temperature: 0.7,
    });
    return NextResponse.json({
      theme: str(raw.theme),
      symbols: strList(raw.symbols, 4),
      reaction: str(raw.reaction),
    });
  } catch (e) {
    console.error("[dream-preview] AI failed:", e);
    return NextResponse.json({ error: "Master Aura couldn't read that just now." }, { status: 502 });
  }
}
