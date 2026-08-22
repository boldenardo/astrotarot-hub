// POST /api/experiences/ritual
// { type, intention, answers: Record<id,label>, personLabel? }
// → { success, result: RitualResult, readingsLeft, premium }
//
// Engine comum de ritual: a LLM escreve o ritual; o CÓDIGO decide a fase da
// lua e sorteia a carta. No cord-cutting a leitura da conexão vem na mesma
// chamada (um crédito, uma experiência).

import { NextRequest, NextResponse } from "next/server";
import { EGYPTIAN_DECK } from "@/lib/tarot-data";
import { moonContext } from "@/lib/experiences/moon";
import { zodiacFromBirthDate } from "@/lib/experiences/zodiac";
import {
  isRitualType,
  type RitualResult,
  type RitualStep,
  type ConnectionReading,
} from "@/lib/experiences/types";
import { ritualSystem, ritualUser, RITUAL_LABELS } from "@/lib/experiences/prompts";
import { runExperience, str, num, drawEgyptian, cleanAnswers } from "@/lib/experiences/run";

export const runtime = "nodejs";
export const maxDuration = 60;

const ACTIONS = new Set(["light", "card", "write", "release", "breathe", "none"]);

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const type = body?.type;
  if (!isRitualType(type)) {
    return NextResponse.json({ error: "Invalid ritual type." }, { status: 400 });
  }
  const intention = str(body?.intention).slice(0, 80) || RITUAL_LABELS[type].intent;
  const answers = cleanAnswers(body?.answers);
  const personLabel = str(body?.personLabel).slice(0, 40) || null;

  const moon = moonContext();
  const [cardNumber] = drawEgyptian(1);
  const card = EGYPTIAN_DECK.find((c) => c.id === cardNumber) ?? EGYPTIAN_DECK[0];

  return runExperience<RitualResult>({
    kind: "ritual",
    subtype: type,
    system: ritualSystem(type),
    maxTokens: type === "cord-cutting" ? 2000 : 1500,
    input: { type, intention, answers, moon: moon.key, card: cardNumber },
    user: (profile) =>
      ritualUser({
        type,
        intention,
        answers: personLabel ? { ...answers, person: personLabel } : answers,
        moon,
        card: { number: card.id, name: card.name },
        firstName: profile.name?.split(/\s+/)[0] ?? null,
        zodiac: zodiacFromBirthDate(profile.birth_date),
      }),
    shape: (raw) => {
      const steps: RitualStep[] = (Array.isArray(raw.steps) ? raw.steps : [])
        .slice(0, 7)
        .map((s) => {
          const o = (s ?? {}) as Record<string, unknown>;
          const action = str(o.action, "none");
          return {
            title: str(o.title, "Step"),
            instruction: str(o.instruction),
            seconds: Math.max(0, Math.min(90, Math.round(num(o.seconds, 0)))),
            action: (ACTIONS.has(action) ? action : "none") as RitualStep["action"],
          };
        })
        .filter((s) => s.instruction);
      if (steps.length < 3) throw new Error("too few steps");

      const items = (Array.isArray(raw.items) ? raw.items : [])
        .slice(0, 5)
        .map((it) => {
          const o = (it ?? {}) as Record<string, unknown>;
          return {
            name: str(o.name, "Item"),
            detail: str(o.detail) || undefined,
            meaning: str(o.meaning),
          };
        })
        .filter((it) => it.meaning);

      let connection: ConnectionReading | undefined;
      if (type === "cord-cutting" && raw.connection && typeof raw.connection === "object") {
        const c = raw.connection as Record<string, unknown>;
        connection = {
          readingType: "connection",
          headline: str(c.headline, "Your connection"),
          emotionalAttachment: str(c.emotionalAttachment),
          unfinishedFeelings: str(c.unfinishedFeelings),
          recurringThoughts: str(c.recurringThoughts),
          holdingOnto: str(c.holdingOnto),
          mayNeedRelease: str(c.mayNeedRelease),
          reflection: str(c.reflection),
        };
      }

      return {
        readingType: "ritual",
        type,
        intention,
        headline: str(raw.headline, RITUAL_LABELS[type].title),
        reading: str(raw.reading),
        moon: { label: moon.label, emoji: moon.emoji, guidance: moon.guidance },
        items,
        steps,
        card: { number: card.id, name: card.name, line: str(raw.cardLine) },
        affirmation: str(raw.affirmation),
        reflection: str(raw.reflection),
        nextStep: str(raw.nextStep),
        ...(connection ? { connection } : {}),
      };
    },
  });
}
