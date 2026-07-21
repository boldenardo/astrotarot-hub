// POST /api/numerology
// { fullName, birthDate: 'YYYY-MM-DD' }
// → { result: NumerologyResult (cálculo local), interpretation: string }

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
      { error: "Envie 'fullName' com o nome completo." },
      { status: 400 }
    );
  }

  const birth = parseBirthDate(birthDateRaw);
  if (!birth) {
    return NextResponse.json(
      { error: "Envie 'birthDate' no formato YYYY-MM-DD." },
      { status: 400 }
    );
  }

  // Cálculo 100% local (sistema pitagórico) — nenhum dado sai do servidor.
  const result = computeNumerology(fullName, birth);

  const numbersText = [
    `Caminho de Vida: ${result.lifePath.number}${result.lifePath.isMaster ? " (número mestre)" : ""}`,
    `Expressão (Destino): ${result.expression.number}${result.expression.isMaster ? " (número mestre)" : ""}`,
    `Impulso da Alma: ${result.soulUrge.number}${result.soulUrge.isMaster ? " (número mestre)" : ""}`,
    `Personalidade: ${result.personality.number}${result.personality.isMaster ? " (número mestre)" : ""}`,
    `Dia de Nascimento: ${result.birthday.number}${result.birthday.isMaster ? " (número mestre)" : ""}`,
  ].join("\n");

  try {
    const interpretation = await groqChat({
      system: [
        "Você é um numerólogo brasileiro experiente, especialista no sistema pitagórico.",
        "Fale sempre em português do Brasil, com tom acolhedor, inspirador e pessoal.",
        "Escreva uma interpretação de 200 a 300 palavras, em texto corrido dividido em parágrafos, sem títulos e sem markdown.",
        "Cite explicitamente cada um dos números fornecidos e o que ele revela, conectando-os em uma leitura única da pessoa.",
      ].join(" "),
      user: `Nome completo: ${fullName}\nData de nascimento: ${birthDateRaw}\n\nNúmeros calculados (sistema pitagórico):\n${numbersText}\n\nEscreva a interpretação numerológica personalizada.`,
      maxTokens: 700,
      temperature: 0.7,
    });

    return NextResponse.json({ result, interpretation });
  } catch {
    return NextResponse.json(
      { error: "Falha ao gerar a interpretação." },
      { status: 502 }
    );
  }
}
