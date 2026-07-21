// POST /api/tarot/reading
// { selectedCards: [{ name, number, meaning?, description? }], question? }
// → { success: true, reading: { id, cards, interpretation, createdAt }, readingsLeft }
//
// Fluxo: requireUser → interpretação via Groq → SÓ então consome 1 leitura
// (para não cobrar o usuário se a IA falhar) → grava em tarot_readings.

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
          "Envie 'selectedCards' com ao menos 1 carta ({ name, number }).",
      },
      { status: 400 }
    );
  }

  const question =
    typeof body?.question === "string" && body.question.trim()
      ? body.question.trim().slice(0, 500)
      : "Interpretação geral da tiragem";

  const cardsText = cards
    .map((card, index) => {
      const extras = [card.meaning, card.description]
        .filter(Boolean)
        .join(" — ");
      return `Posição ${index + 1}: ${card.name} (arcano nº ${card.number})${
        extras ? ` — ${extras}` : ""
      }`;
    })
    .join("\n");

  // Checa o saldo ANTES de gastar o Groq: sem leituras disponíveis, corta cedo
  // (o consumeReading abaixo continua sendo o guardião atômico definitivo).
  if (!hasReadingsLeft(profile)) {
    return NextResponse.json(
      {
        error:
          "Você não tem leituras disponíveis. Compre o Pacote 5 Leituras (US$ 9,99) ou assine o Premium Ilimitado (US$ 29,90/mês).",
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
        "Você é um tarólogo brasileiro experiente, especialista no Tarot Egípcio.",
        "Fale sempre em português do Brasil, com tom místico, acolhedor e encorajador.",
        "Escreva uma interpretação de 300 a 400 palavras, em texto corrido dividido em parágrafos, sem títulos e sem markdown.",
        "Interprete cada carta considerando a posição em que saiu, conecte as cartas entre si em uma narrativa única e finalize com um conselho prático para o consulente.",
      ].join(" "),
      user: `Pergunta do consulente: ${question}\n\nCartas da tiragem (na ordem em que saíram):\n${cardsText}\n\nFaça a interpretação completa da tiragem.`,
      maxTokens: 900,
      temperature: 0.8,
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao gerar a interpretação." },
      { status: 502 }
    );
  }

  // Interpretação pronta — agora sim consome o saldo (atômico no banco).
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
    // A leitura já foi gerada (e o saldo consumido): entrega mesmo assim,
    // sem histórico persistido.
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
