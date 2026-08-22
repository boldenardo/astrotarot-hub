// POST /api/experiences/dream
// { dream: string (≤1500), answers?: Record<id,label>, pullCards?: boolean }
// → { success, result: DreamReading, readingsLeft, premium }
//
// O relato do sonho vai para a LLM e fica no `result` do histórico do
// próprio usuário — nunca para analytics. As 3 cartas (opcionais) são
// sorteadas em CÓDIGO; a LLM só lê cada uma em uma frase.

import { NextRequest, NextResponse } from "next/server";
import { EGYPTIAN_DECK } from "@/lib/tarot-data";
import type { DreamReading } from "@/lib/experiences/types";
import { dreamSystem, dreamUser } from "@/lib/experiences/prompts";
import { runExperience, str, strList, drawEgyptian, cleanAnswers } from "@/lib/experiences/run";

export const runtime = "nodejs";
export const maxDuration = 60;

const POSITIONS = ["What the dream is showing", "What it is asking", "What to carry into the day"];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const dream = str(body?.dream).slice(0, 1500);
  if (dream.length < 12) {
    return NextResponse.json(
      { error: "Tell Master Aura a little more about the dream (a sentence or two)." },
      { status: 400 }
    );
  }
  const answers = cleanAnswers(body?.answers);
  const pull = body?.pullCards === true;
  const cards = pull
    ? drawEgyptian(3).map((n, i) => {
        const c = EGYPTIAN_DECK.find((d) => d.id === n) ?? EGYPTIAN_DECK[0];
        return { number: c.id, name: c.name, position: POSITIONS[i] };
      })
    : undefined;

  return runExperience<DreamReading>({
    kind: "dream",
    subtype: pull ? "with-cards" : "reading",
    system: dreamSystem(),
    maxTokens: 1300,
    // Entrada guardada: só ids/rótulos enumerados + tamanho do relato.
    input: { answers, dreamLength: dream.length, cards: cards?.map((c) => c.number) ?? [] },
    user: (profile) =>
      dreamUser({ dream, answers, cards, firstName: profile.name?.split(/\s+/)[0] ?? null }),
    shape: (raw) => {
      const symbols = (Array.isArray(raw.symbols) ? raw.symbols : [])
        .slice(0, 5)
        .map((s) => {
          const o = (s ?? {}) as Record<string, unknown>;
          return { symbol: str(o.symbol), meaning: str(o.meaning) };
        })
        .filter((s) => s.symbol && s.meaning);
      const lines = strList(raw.cardLines, 3);
      return {
        readingType: "dream",
        headline: str(raw.headline, "Your dream reading"),
        mainTheme: str(raw.mainTheme),
        symbols,
        processing: str(raw.processing),
        lifeConnection: str(raw.lifeConnection),
        reflection: str(raw.reflection),
        followUps: strList(raw.followUps, 3),
        ...(cards
          ? { cards: cards.map((c, i) => ({ ...c, line: lines[i] ?? "" })) }
          : {}),
      };
    },
  });
}
