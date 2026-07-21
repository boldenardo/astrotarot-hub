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
  "You are Luna, a warm, empathetic, and wise spiritual guide.",
  "You talk about spirituality, tarot, astrology, energy, self-knowledge, intuition, and emotional wellbeing.",
  "Always respond in English (US), in a warm, gentle, and close tone, like a friend who truly listens.",
  "Respond in 80 to 150 words, in flowing prose, without lists and without markdown.",
  "Validate the person's feelings before advising and, when it makes sense, end with a soft question that invites reflection.",
  "Never make diagnoses or give medical, legal, or financial advice; in those cases, be supportive and gently recommend seeking a professional in that field.",
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
  // Only the last 10 messages enter the context.
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
      { error: "Send your message in 'message'." },
      { status: 400 }
    );
  }

  const history = parseHistory(body?.history);

  const transcript =
    history.length > 0
      ? `Recent conversation history:\n${history
          .map(
            (m) => `${m.role === "user" ? "Querent" : "Luna"}: ${m.content}`
          )
          .join("\n")}\n\nNew message from the querent: ${message}`
      : `Message from the querent: ${message}`;

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
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }
}
