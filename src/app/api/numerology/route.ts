// POST /api/numerology
// { fullName, birthDate: 'YYYY-MM-DD' }
// → { result: NumerologyResult (local calculation), interpretation: string }

import { NextRequest, NextResponse } from "next/server";
import { requirePremium } from "@/lib/server/plan-gate";
import { groqChat } from "@/lib/server/groq";
import { computeNumerology, parseBirthDate } from "@/lib/numerology";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gate = await requirePremium("numerology");
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const fullName =
    typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const birthDateRaw =
    typeof body?.birthDate === "string" ? body.birthDate.trim() : "";

  if (!fullName || fullName.length < 2) {
    return NextResponse.json(
      { error: "Send 'fullName' with the full name." },
      { status: 400 }
    );
  }

  const birth = parseBirthDate(birthDateRaw);
  if (!birth) {
    return NextResponse.json(
      { error: "Send 'birthDate' in the format YYYY-MM-DD." },
      { status: 400 }
    );
  }

  // 100% local calculation (Pythagorean system) — no data leaves the server.
  const result = computeNumerology(fullName, birth);

  const numbersText = [
    `Life Path: ${result.lifePath.number}${result.lifePath.isMaster ? " (master number)" : ""}`,
    `Expression (Destiny): ${result.expression.number}${result.expression.isMaster ? " (master number)" : ""}`,
    `Soul Urge: ${result.soulUrge.number}${result.soulUrge.isMaster ? " (master number)" : ""}`,
    `Personality: ${result.personality.number}${result.personality.isMaster ? " (master number)" : ""}`,
    `Birthday: ${result.birthday.number}${result.birthday.isMaster ? " (master number)" : ""}`,
  ].join("\n");

  try {
    const interpretation = await groqChat({
      system: [
        "You are an experienced numerologist, a specialist in the Pythagorean system.",
        "Always respond in English (US), with a warm, inspiring, and personal tone.",
        "Write an interpretation of 200 to 300 words, in flowing prose divided into paragraphs, without headings and without markdown.",
        "Explicitly cite each of the numbers provided and what it reveals, connecting them into a single reading of the person.",
      ].join(" "),
      user: `Full name: ${fullName}\nDate of birth: ${birthDateRaw}\n\nCalculated numbers (Pythagorean system):\n${numbersText}\n\nWrite the personalized numerology interpretation.`,
      maxTokens: 700,
      temperature: 0.7,
    });

    return NextResponse.json({ result, interpretation });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }
}
