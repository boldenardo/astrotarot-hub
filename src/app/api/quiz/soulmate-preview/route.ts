// POST /api/quiz/soulmate-preview — a leitura de alma gêmea, de graça.
//
// POR QUE EXISTE
//
// A porta do funil anuncia "Free soulmate reading", o quiz diz que o retrato
// está pronto e pergunta para onde enviar, e a página seguinte cobra. Nada
// grátis era entregue em lugar nenhum — e 27% de quem começa o quiz o REFAZ
// (alguns cinco e sete vezes), procurando o caminho grátis que a nossa copy
// prometeu. Esta rota torna a promessa verdadeira.
//
// GERA A LEITURA INTEIRA, não uma amostra separada. A compra não gera texto
// nenhum: ela DESTRAVA o que já está aqui e dispara só o retrato. É o que
// garante que as cinco cartas e o texto sejam os mesmos antes e depois —
// se a prévia sorteasse duas cartas e a compra sorteasse outras, "as cartas
// já se assentaram" viraria mentira na cara de quem pagou.
//
// Sem login, sem crédito. Molde: /api/experiences/dream-preview.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { groqChatJson } from "@/lib/server/groq";
import { drawEgyptian, rateLimit } from "@/lib/experiences/run";
import { normalizeEmail } from "@/lib/email-normalize";
import {
  DOSSIER_SYSTEM,
  buildDossierPrompt,
  ANSWER_MEANING,
} from "@/lib/server/soulmate-prompt";
import {
  fallbackFree,
  isCompleteDossier,
  isRealDate,
  pickFree,
  toPublicReading,
  signOf,
  solarWindow,
  toDrawnCards,
  type SoulmateDossier,
  type SoulmateReading,
} from "@/lib/soulmate-reading";

export const runtime = "nodejs";
export const maxDuration = 30;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Respostas do quiz saneadas — só as chaves que o prompt sabe ler. */
function cleanAnswers(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 12)) {
    if (typeof val !== "string") continue;
    if (!ANSWER_MEANING[k]) continue;
    out[k] = val.slice(0, 40);
  }
  return out;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  if (!rateLimit(`sm-preview:${ip}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: {
    email?: string;
    name?: string;
    birthDate?: string;
    answers?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const birthDate = typeof body.birthDate === "string" ? body.birthDate.slice(0, 10) : "";
  const answers = cleanAnswers(body.answers);
  const name = typeof body.name === "string" ? body.name.slice(0, 80) : null;

  // Sem estes três não há leitura possível — e recusar antes da Groq é o
  // que impede um POST vazio de gastar tokens.
  // isRealDate e o que impede "1994-02-31" de virar uma leitura inteira com
// o signo errado: o regex aceita, e `new Date` rola para 03/03 calado.
  if (
    !email ||
    !DATE_RE.test(birthDate) ||
    !isRealDate(birthDate) ||
    Object.keys(answers).length < 2
  ) {
    return NextResponse.json({ error: "Not enough to read." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // ── Cache por e-mail ───────────────────────────────────────────────────
  // É AQUI que os 27% morrem: refazer o quiz com o mesmo e-mail devolve as
  // MESMAS cartas, em vez de sortear de novo. A tirada deixa de ser loteria.
  //
  // E é aqui também que a rota deixa de ser um oráculo: quem já tem data de
  // nascimento gravada só recebe (ou regrava) se a data do corpo bater. Sem
  // isso, digitar o e-mail de outra pessoa devolveria a leitura dela.
  interface CachedRow {
    soulmate_reading?: SoulmateReading | null;
    birth_date?: string | null;
  }
  let cachedRow: CachedRow | null = null;
  let columnMissing = false;
  try {
    const { data, error } = await admin
      .from("leads")
      .select("soulmate_reading, birth_date")
      .eq("email", email)
      .maybeSingle();
    // Coluna ainda não aplicada (migration pendente) → segue sem cache.
    if (error) columnMissing = true;
    else cachedRow = (data ?? null) as CachedRow | null;
  } catch {
    columnMissing = true;
  }

  if (cachedRow?.birth_date && cachedRow.birth_date.slice(0, 10) !== birthDate) {
    return NextResponse.json({ error: "Not your reading." }, { status: 403 });
  }

  const cached = cachedRow?.soulmate_reading;
  if (cached?.cards?.length) {
    return NextResponse.json({ ...toPublicReading(cached), cached: true });
  }

  // ── Tirada: SEMPRE em código ───────────────────────────────────────────
  // O modelo recebe as cartas prontas. Ele nunca inventa nome de carta, e
  // por isso a tirada continua válida mesmo quando a Groq falha.
  const cards = toDrawnCards(drawEgyptian(5));
  const sign = signOf(birthDate);
  const window = solarWindow(birthDate);

  let dossier: SoulmateDossier | null = null;
  try {
    const raw = await groqChatJson<SoulmateDossier>({
      system: DOSSIER_SYSTEM,
      user: buildDossierPrompt({
        name,
        birthDate,
        birthLocation: null,
        sign,
        answers,
        cards,
        window,
      }),
      maxTokens: 900,
      temperature: 0.85,
    });
    if (isCompleteDossier(raw)) dossier = raw;
  } catch (e) {
    console.warn("[soulmate-preview] Groq falhou, indo de fallback:", e);
  }

  const fallback = fallbackFree(cards, window, sign);
  const reading: SoulmateReading = {
    cards,
    dossier,
    // "fallback" NUNCA é reaproveitado pelo caminho pago: quem comprar
    // recebe texto gerado de verdade, não o significado canônico da carta.
    source: dossier ? "llm" : "fallback",
    free: pickFree(dossier, fallback),
    ...(window ? { window } : {}),
  };

  // Persistir é best-effort: sem a migration aplicada, a prévia continua
  // funcionando nesta sessão (o navegador guarda a cópia).
  if (!columnMissing) {
    try {
      // UPSERT, não update.
      //
      // O prefetch da tirada dispara no passo do e-mail, no MESMO instante
      // em que /api/quiz/lead cria a linha do lead. Um update que chegasse
      // primeiro atingiria zero linhas — sem erro nenhum — e a leitura se
      // perderia em silêncio: a pessoa refaria o quiz e receberia cartas
      // novas, que é exatamente o comportamento que esta rota existe para
      // acabar. O upsert grava de qualquer jeito, e o lead preenche o resto
      // depois (colunas diferentes, uma não apaga a outra).
      //
      // birth_date entra junto porque é ele que arma a trava anti-oráculo
      // da próxima chamada.
      await admin.from("leads").upsert(
        {
          email,
          birth_date: birthDate,
          soulmate_reading: reading,
          soulmate_reading_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    } catch (e) {
      console.warn("[soulmate-preview] leitura não persistida:", e);
    }
  }

  // NUNCA devolver o dossiê inteiro: as três cartas pagas ficam no servidor.
  return NextResponse.json({ ...toPublicReading(reading), cached: false });
}
