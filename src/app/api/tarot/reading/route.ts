// POST /api/tarot/reading
// { selectedCards: [{ name, number, meaning?, description? }], question? }
// → { success: true, reading: { id, cards, interpretation, createdAt }, readingsLeft }
//
// Flow: requireUser → interpretation via Groq → ONLY then consume 1 reading
// (so the user is not charged if the AI fails) → save into tarot_readings.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, consumeReading } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { groqChat } from "@/lib/server/groq";
import { isPremium, hasReadingsLeft } from "@/lib/plans";

export const runtime = "nodejs";

interface SelectedCard {
  name: string;
  number: number;
  meaning?: string;
  description?: string;
}

function parseCards(value: unknown): SelectedCard[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    return null;
  }
  const cards: SelectedCard[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const c = item as Record<string, unknown>;
    if (typeof c.name !== "string" || !c.name.trim()) return null;
    if (typeof c.number !== "number" || Number.isNaN(c.number)) return null;
    cards.push({
      name: c.name.trim(),
      number: c.number,
      meaning: typeof c.meaning === "string" ? c.meaning : undefined,
      description: typeof c.description === "string" ? c.description : undefined,
    });
  }
  return cards;
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const profile = gate.profile;

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const cards = parseCards(body?.selectedCards);
  if (!cards) {
    return NextResponse.json(
      {
        error:
          "Send 'selectedCards' with at least 1 card ({ name, number }).",
      },
      { status: 400 }
    );
  }

  const question =
    typeof body?.question === "string" && body.question.trim()
      ? body.question.trim().slice(0, 500)
      : "General reading of the spread";

  const cardsText = cards
    .map((card, index) => {
      const extras = [card.meaning, card.description]
        .filter(Boolean)
        .join(" — ");
      return `Position ${index + 1}: ${card.name} (arcanum no. ${card.number})${
        extras ? ` — ${extras}` : ""
      }`;
    })
    .join("\n");

  // Check the balance BEFORE spending Groq: with no readings available, cut early
  // (the consumeReading below remains the definitive atomic guardian).
  if (!hasReadingsLeft(profile)) {
    return NextResponse.json(
      {
        error:
          "You have no readings available. Buy the 5 Readings Pack ($9.99) or subscribe to Unlimited Premium ($29.90/month).",
        code: "NO_READINGS_LEFT",
        needsPayment: true,
      },
      { status: 402 }
    );
  }

  let interpretation: string;
  try {
    interpretation = await groqChat({
      system: [
        "You are an experienced tarot reader, a specialist in the Egyptian Tarot.",
        "Always respond in English (US), with a mystical, warm, and encouraging tone.",
        "Write an interpretation of 300 to 400 words, in flowing prose divided into paragraphs, without headings and without markdown.",
        "Interpret each card considering the position it appeared in, connect the cards to one another into a single narrative, and end with practical advice for the querent.",
      ].join(" "),
      user: `Querent's question: ${question}\n\nCards of the spread (in the order they appeared):\n${cardsText}\n\nProvide the complete interpretation of the spread.`,
      maxTokens: 900,
      temperature: 0.8,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate the interpretation." },
      { status: 502 }
    );
  }

  // Interpretation ready — now consume the balance (atomic in the database).
  const consumed = await consumeReading(profile);
  if (!consumed.ok) return consumed.response;

  const admin = getSupabaseAdmin();
  const { data: inserted, error: insertError } = await admin
    .from("tarot_readings")
    .insert({
      user_id: profile.id,
      deck_type: "EGYPTIAN",
      spread_type: cards.length === 4 ? "FOUR_CARDS" : "FULL_SPREAD",
      cards,
      interpretation,
      is_premium: isPremium(profile),
    })
    .select("id, cards, interpretation, created_at")
    .single();

  if (insertError || !inserted) {
    // The reading was already generated (and the balance consumed): deliver it
    // anyway, without persisted history.
    return NextResponse.json({
      success: true,
      reading: {
        id: crypto.randomUUID(),
        cards,
        interpretation,
        createdAt: new Date().toISOString(),
      },
      readingsLeft: consumed.readingsLeft,
    });
  }

  return NextResponse.json({
    success: true,
    reading: {
      id: inserted.id,
      cards: inserted.cards,
      interpretation: inserted.interpretation,
      createdAt: inserted.created_at,
    },
    readingsLeft: consumed.readingsLeft,
  });
}
