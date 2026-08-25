// POST /api/experiences/past-life
// { mode: "self" | "connection", answers: Record<id,label>, birthSeason?, personLabel? }
// → { success, result: PastLifeReading, readingsLeft, premium }
//
// Arquétipo SIMBÓLICO — o prompt proíbe reconstrução histórica factual.
// Signo vem do perfil (quando houver); estação de nascimento é enumerada.

import { NextRequest, NextResponse } from "next/server";
import type { PastLifeReading } from "@/lib/experiences/types";
import { pastLifeSystem, pastLifeUser } from "@/lib/experiences/prompts";
import { zodiacFromBirthDate } from "@/lib/experiences/zodiac";
import { runExperience, str, cleanAnswers } from "@/lib/experiences/run";

export const runtime = "nodejs";
export const maxDuration = 60;

const SEASONS = new Set(["winter", "spring", "summer", "autumn"]);

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const mode = body?.mode === "connection" ? "connection" : "self";
  const answers = cleanAnswers(body?.answers);
  if (Object.keys(answers).length < 2) {
    return NextResponse.json({ error: "Answer Master Aura first." }, { status: 400 });
  }
  const seasonRaw = str(body?.birthSeason).toLowerCase();
  const birthSeason = SEASONS.has(seasonRaw) ? seasonRaw : null;
  const personLabel = str(body?.personLabel).slice(0, 40) || null;

  return runExperience<PastLifeReading>({
    kind: "past-life",
    // Past Life Connection ($27, avulso) destrava sem consumir crédito.
    freeWith: "past_life",
    subtype: mode,
    system: pastLifeSystem(),
    maxTokens: 1400,
    input: { mode, answers, birthSeason },
    user: (profile) =>
      pastLifeUser({
        answers,
        mode,
        birthSeason,
        zodiac: zodiacFromBirthDate(profile.birth_date),
        firstName: profile.name?.split(/\s+/)[0] ?? null,
        personLabel,
      }),
    shape: (raw) => {
      const c = raw.connection && typeof raw.connection === "object" ? (raw.connection as Record<string, unknown>) : null;
      return {
        readingType: "past-life",
        headline: str(raw.headline, "Your past-life archetype"),
        archetype: str(raw.archetype, "The Keeper"),
        era: str(raw.era),
        role: str(raw.role),
        centralLesson: str(raw.centralLesson),
        emotionalPattern: str(raw.emotionalPattern),
        relationshipPattern: str(raw.relationshipPattern),
        today: str(raw.today),
        reflection: str(raw.reflection),
        ...(mode === "connection" && c
          ? {
              connection: {
                bond: str(c.bond),
                whyFamiliar: str(c.whyFamiliar),
                whatRepeats: str(c.whatRepeats),
                whatItAsks: str(c.whatItAsks),
              },
            }
          : {}),
      };
    },
  });
}
