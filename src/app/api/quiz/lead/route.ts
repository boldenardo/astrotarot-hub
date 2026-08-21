// POST /api/quiz/lead — persiste o lead do funil de quiz no servidor.
// Público por natureza (o visitante não tem conta), mas só escreve na
// tabela leads, com upsert idempotente por email — re-submits atualizam
// respostas/score em vez de duplicar. Sem esta rota, o email capturado
// no quiz morre no localStorage de quem não compra na hora.

import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email-normalize";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { normalizeCode } from "@/lib/affiliate";
import { sendEmail } from "@/lib/server/email";
import { leadReadingEmail } from "@/lib/server/email-templates";
import { LANG_COOKIE, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SCORES = new Set(["LOW", "MEDIUM", "HIGH"]);
const MAX_ANSWERS_BYTES = 2048;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

/** Este lead já recebeu a leitura por e-mail? Evita reenvio a cada submit. */
async function leadAlreadyEmailed(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string
): Promise<boolean> {
  const { data } = await admin
    .from("leads")
    .select("reading_email_sent_at")
    .eq("email", email)
    .maybeSingle();
  return Boolean((data as { reading_email_sent_at?: string } | null)?.reading_email_sent_at);
}

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    name?: string;
    birthDate?: string;
    sign?: string;
    score?: string;
    answers?: Record<string, string>;
    visitorId?: string;
    ref?: string | null;
    src?: string | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email ?? "").slice(0, 254));
  if (!email) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // answers: só pares string→string, com teto de tamanho serializado.
  let answers: Record<string, string> | null = null;
  if (body.answers && typeof body.answers === "object") {
    const entries = Object.entries(body.answers)
      .filter(([k, v]) => typeof k === "string" && typeof v === "string")
      .map(([k, v]) => [k.slice(0, 64), v.slice(0, 200)] as const);
    const candidate = Object.fromEntries(entries);
    if (JSON.stringify(candidate).length <= MAX_ANSWERS_BYTES) {
      answers = candidate;
    }
  }

  const birthDate = cleanText(body.birthDate, 10);
  const score = cleanText(body.score, 10)?.toUpperCase() ?? null;

  const name = cleanText(body.name, 100);
  const sign = cleanText(body.sign, 20);

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("leads").upsert(
      {
        email,
        name,
        birth_date: birthDate && DATE_RE.test(birthDate) ? birthDate : null,
        sign,
        score: score && SCORES.has(score) ? score : null,
        answers,
        visitor_id: cleanText(body.visitorId, 64),
        affiliate_code: normalizeCode(body.ref ?? undefined),
        source: "quiz",
        source_platform: cleanText(body.src, 20),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    if (error) {
      console.error("[quiz/lead] upsert falhou:", error);
    } else {
      // A leitura prometida, entregue de fato — no idioma do funil.
      // Só no PRIMEIRO cadastro deste e-mail: reenviar a cada re-submit
      // seria spam e queimaria a reputação do domínio.
      const isNew = !(await leadAlreadyEmailed(admin, email));
      if (isNew) {
        const cookieLang = req.cookies.get(LANG_COOKIE)?.value;
        const locale = isLocale(cookieLang) ? cookieLang : DEFAULT_LOCALE;
        const mail = leadReadingEmail({ name, sign, locale });
        const sent = await sendEmail({ to: email, ...mail });
        if (sent) {
          await admin
            .from("leads")
            .update({ reading_email_sent_at: new Date().toISOString() })
            .eq("email", email);
        }
      }
    }
  } catch (e) {
    console.error("[quiz/lead] erro:", e);
  }

  // Sempre 200: o funil nunca pode travar por causa da captura de lead.
  return NextResponse.json({ ok: true });
}
