// POST /api/spiritual-guide
// { message, history?: [{ role: 'user'|'assistant', content }] }
// → { success: true, message }

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";
import { groqChat } from "@/lib/server/groq";

export const runtime = "nodejs";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

const LUNA_SYSTEM = [
  "Você é Luna, uma guia espiritual brasileira, acolhedora, empática e sábia.",
  "Você conversa sobre espiritualidade, tarot, astrologia, energia, autoconhecimento, intuição e bem-estar emocional.",
  "Fale sempre em português do Brasil, em tom caloroso, gentil e próximo, como uma amiga que escuta de verdade.",
  "Responda em 80 a 150 palavras, em texto corrido, sem listas e sem markdown.",
  "Valide os sentimentos da pessoa antes de aconselhar e, quando fizer sentido, termine com uma pergunta suave que convide à reflexão.",
  "Nunca faça diagnósticos nem dê conselhos médicos, jurídicos ou financeiros; nesses casos, acolha e recomende com carinho buscar um profissional da área.",
].join(" ");

function parseHistory(value: unknown): HistoryMessage[] {
  if (!Array.isArray(value)) return [];
  const history: HistoryMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    if (
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
    ) {
      history.push({ role: m.role, content: m.content.trim().slice(0, 1000) });
    }
  }
  // Só as últimas 10 mensagens entram no contexto.
  return history.slice(-10);
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const message =
    typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!message) {
    return NextResponse.json(
      { error: "Envie sua mensagem em 'message'." },
      { status: 400 }
    );
  }

  const history = parseHistory(body?.history);

  const transcript =
    history.length > 0
      ? `Histórico recente da conversa:\n${history
          .map(
            (m) => `${m.role === "user" ? "Consulente" : "Luna"}: ${m.content}`
          )
          .join("\n")}\n\nNova mensagem do consulente: ${message}`
      : `Mensagem do consulente: ${message}`;

  try {
    const reply = await groqChat({
      system: LUNA_SYSTEM,
      user: transcript,
      maxTokens: 400,
      temperature: 0.8,
    });

    return NextResponse.json({ success: true, message: reply.trim() });
  } catch {
    return NextResponse.json(
      { error: "Falha ao gerar a interpretação." },
      { status: 502 }
    );
  }
}
