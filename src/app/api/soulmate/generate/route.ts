// POST /api/soulmate/generate — Draw Your Soulmate.
//
// O quiz PROMETE o retrato, então o plano base ($14.99) já entrega uma
// prévia; o add-on de $24.99 destrava a versão grande, sem marca, com o
// dossiê completo e o download. Quem só assina nunca fica sem nada.
//
// Gerar custa dinheiro, então isto é IDEMPOTENTE por usuário: se já
// existe linha em soulmate_portraits, devolve a existente sem gerar de
// novo. Uma pessoa, um retrato.

import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireUser, hasEntitlement } from "@/lib/server/plan-gate";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { groqChatJson } from "@/lib/server/groq";
import { getImageProvider } from "@/lib/server/image-gen";
import { isPremium } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

// Sem `export`: um route handler do Next só pode exportar os verbos HTTP
// e as opções de rota — exportar outra coisa quebra o build de tipos.
const BUCKET = "soulmate";
/** Validade da URL assinada. Curta: a imagem é o produto vendido. */
const SIGNED_URL_TTL_S = 60 * 60;

interface Dossier {
  /** Descrição física, usada como base do prompt de imagem. */
  appearance: string;
  /** Traços de personalidade em frases curtas. */
  traits: string[];
  /** Quando os caminhos se cruzam. */
  meeting_window: string;
  /** Onde/como a pessoa vai reconhecê-lo. */
  how_to_recognize: string;
  /**
   * O que as cartas dizem que pode estar no caminho.
   *
   * A oferta vende este item desde sempre ("What the cards say may be
   * standing between you", FRONT_INCLUDES) e o schema não o tinha — a
   * leitura entregue não respondia o que o checkout cobrava.
   */
  obstacle: string;
  /**
   * O que as cartas sugerem fazer a seguir — item 6 de FRONT_INCLUDES,
   * vendido desde sempre e nunca gerado até 27/08.
   */
  next_step: string;
  /** Parágrafo de fecho, tom da Master Aura. */
  closing: string;
}

/**
 * Nada de dossiê pela metade gravado para sempre.
 *
 * A trava de idempotência devolve o registro existente sem regenerar: se o
 * modelo esquecesse uma chave, o comprador pagava por seis itens, recebia
 * cinco, e não havia caminho de volta. Melhor falhar agora — a UI pede
 * para tentar de novo — do que persistir uma entrega incompleta.
 */
function assertComplete(d: Dossier): void {
  const missing = (
    ["appearance", "meeting_window", "how_to_recognize", "obstacle", "next_step", "closing"] as const
  ).filter((k) => typeof d[k] !== "string" || !d[k].trim());
  if (!Array.isArray(d.traits) || d.traits.length < 3) missing.push("traits" as never);
  if (missing.length) {
    throw new Error(`dossiê incompleto do modelo: faltou ${missing.join(", ")}`);
  }
}

export async function POST() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const { profile } = gate;

  // Destrava por assinatura OU por compra avulsa do retrato ($29/$19.99/
  // $17): o entitlement é exatamente "eu paguei por isto". Antes, quem
  // comprava o front do funil ficava barrado aqui — pagava pelo retrato e
  // não conseguia gerá-lo.
  const owns = await hasEntitlement(profile.id, "soulmate_portrait");
  if (!isPremium(profile) && !owns) {
    return NextResponse.json(
      {
        error: "Your soulmate portrait is part of the membership.",
        code: "PREMIUM_REQUIRED",
      },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdmin();

  // Já existe? Devolve sem gastar um centavo a mais.
  const { data: existing } = await admin
    .from("soulmate_portraits")
    .select("image_url, preview_url, dossier, sign")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (existing?.image_url) {
    return NextResponse.json({ portrait: existing, generated: false });
  }

  const provider = getImageProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "Portrait generation is not available right now.", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const sign = deriveSign(profile.birth_date);

  // As respostas do quiz vivem em `leads`, gravadas por e-mail no passo do
  // e-mail (/api/quiz/lead). Best-effort: quem comprou por outro caminho
  // (sem quiz) segue recebendo a leitura só pelo mapa natal.
  let quizAnswers: Record<string, string> | null = null;
  try {
    if (profile.email) {
      const { data: lead } = await admin
        .from("leads")
        .select("answers")
        .eq("email", profile.email.trim().toLowerCase())
        .maybeSingle();
      const a = lead?.answers;
      if (a && typeof a === "object") quizAnswers = a as Record<string, string>;
    }
  } catch (e) {
    console.warn("[soulmate/generate] respostas do quiz não carregadas:", e);
  }

  try {
    // 1. Dossiê pelo Groq, a partir dos dados reais de nascimento.
    const dossier = await groqChatJson<Dossier>({
      system:
        "You are Master Aura, an astrologer writing a soulmate reading. " +
        "Always respond in English (US). Return ONLY valid JSON with keys: " +
        "appearance, traits (array of 4 short strings), meeting_window, " +
        "how_to_recognize, obstacle, next_step, closing. " +
        "obstacle is one short paragraph on what the cards say may be " +
        "standing between them — a pattern or fear on her side, never a " +
        "flaw in the other person and never a warning of harm. " +
        "next_step is one short paragraph with what the cards suggest she " +
        "does next — one concrete, doable thing in the coming weeks, framed " +
        "as guidance and never as an instruction with a promised outcome. " +
        "appearance must be a single vivid paragraph describing a real " +
        "adult person's face and presence (hair, eyes, build, style, age " +
        "range 28-45) with no names and no celebrity references. " +
        "Never promise certainty about the future; write as interpretation.",
      user: buildDossierPrompt({
        name: profile.name,
        birthDate: profile.birth_date,
        birthLocation: profile.birth_location,
        sign,
        answers: quizAnswers,
      }),
      maxTokens: 900,
      temperature: 0.85,
    });
    assertComplete(dossier);

    // 2. Retrato, a partir da descrição que o dossiê acabou de produzir.
    const prompt = buildImagePrompt(dossier.appearance);
    const image = await provider.generate(prompt);

    // 3. Storage: DUAS imagens de verdade — a prévia é uma versão pequena e
    //    borrada, gerada aqui. Antes prévia e original eram o MESMO arquivo
    //    num bucket público: quem assinava por $14,99 já tinha a imagem
    //    completa e o add-on de $24,99 não protegia nada.
    const ext = image.contentType.includes("jpeg") ? "jpg" : "png";
    const fullPath = `${profile.id}/portrait.${ext}`;
    const previewPath = `${profile.id}/preview.jpg`;

    const previewBuffer = await sharp(image.data)
      .resize(420, 420, { fit: "cover" })
      .blur(14)
      .modulate({ brightness: 0.92 })
      .jpeg({ quality: 70 })
      .toBuffer();

    const [up, upPreview] = await Promise.all([
      admin.storage.from(BUCKET).upload(fullPath, image.data, {
        contentType: image.contentType,
        upsert: true,
      }),
      admin.storage.from(BUCKET).upload(previewPath, previewBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      }),
    ]);
    if (up.error) throw up.error;
    if (upPreview.error) throw upPreview.error;

    // Guardamos os CAMINHOS, não URLs: o bucket é privado e a URL assinada
    // é emitida na leitura (GET /api/soulmate), conforme o entitlement.
    const { error: insErr } = await admin.from("soulmate_portraits").upsert(
      {
        user_id: profile.id,
        image_url: fullPath,
        preview_url: previewPath,
        dossier,
        prompt,
        sign,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (insErr) throw insErr;

    // Devolve já assinado para a tela que acabou de pedir a geração.
    const signedPreview = await admin.storage
      .from(BUCKET)
      .createSignedUrl(previewPath, SIGNED_URL_TTL_S);

    return NextResponse.json({
      portrait: {
        image_url: null, // só sai com o add-on
        preview_url: signedPreview.data?.signedUrl ?? null,
        dossier,
        sign,
      },
      generated: true,
    });
  } catch (e) {
    console.error("[soulmate/generate] falhou:", e);
    return NextResponse.json(
      { error: "We couldn't draw your portrait right now. Please try again." },
      { status: 500 }
    );
  }
}

function deriveSign(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  const ranges: Array<[string, number, number, number, number]> = [
    ["Capricorn", 12, 22, 1, 19],
    ["Aquarius", 1, 20, 2, 18],
    ["Pisces", 2, 19, 3, 20],
    ["Aries", 3, 21, 4, 19],
    ["Taurus", 4, 20, 5, 20],
    ["Gemini", 5, 21, 6, 20],
    ["Cancer", 6, 21, 7, 22],
    ["Leo", 7, 23, 8, 22],
    ["Virgo", 8, 23, 9, 22],
    ["Libra", 9, 23, 10, 22],
    ["Scorpio", 10, 23, 11, 21],
    ["Sagittarius", 11, 22, 12, 21],
  ];
  for (const [name, fm, fd, tm, td] of ranges) {
    if (fm === 12 && tm === 1) {
      if ((month === 12 && day >= fd) || (month === 1 && day <= td)) return name;
    } else if ((month === fm && day >= fd) || (month === tm && day <= td)) {
      return name;
    }
  }
  return null;
}

/**
 * O que cada resposta do quiz significa em linguagem de leitura.
 *
 * Sem isto o dossiê saía SÓ do mapa natal — e o funil inteiro promete o
 * contrário: "Who they are, in the words the cards used", "what may be
 * standing between you", e a Master Aura passa quinze passos dizendo que
 * está lendo as respostas. Quem pagasse receberia um texto que qualquer
 * pessoa do mesmo signo receberia igual: reembolso na certa.
 */
const ANSWER_MEANING: Record<string, Record<string, string>> = {
  q_status: {
    searching: "is actively looking for love and tired of near-misses",
    complicated: "is in something undefined that keeps her guessing",
    healing: "is recovering from a relationship that ended badly",
    taken: "is with someone but questions whether they are the one",
  },
  q_met: {
    yes: "believes she has already crossed paths with this person",
    maybe: "suspects they have already met but is not sure",
    no: "does not think they have met yet",
  },
  q_past: {
    often: "feels déjà vu about a specific person very often",
    sometimes: "occasionally feels a pull she cannot explain",
    no: "has not felt that kind of recognition",
  },
  q_ready: {
    yes: "says she is ready for it now",
    unsure: "wants it but is afraid of being hurt again",
    no: "is still putting herself back together first",
  },
};

function describeAnswers(answers: Record<string, string> | null): string {
  if (!answers) return "";
  const lines: string[] = [];
  for (const [key, value] of Object.entries(answers)) {
    const meaning = ANSWER_MEANING[key]?.[value];
    if (meaning) lines.push(`She ${meaning}.`);
  }
  return lines.join(" ");
}

function buildDossierPrompt(input: {
  name: string | null;
  birthDate: string | null;
  birthLocation: string | null;
  sign: string | null;
  answers: Record<string, string> | null;
}): string {
  const said = describeAnswers(input.answers);
  return [
    `Person: ${input.name ?? "the seeker"}.`,
    input.birthDate ? `Born on ${input.birthDate}.` : "",
    input.birthLocation ? `Birth place: ${input.birthLocation}.` : "",
    input.sign ? `Sun sign: ${input.sign}.` : "",
    said ? `What she told you in the reading: ${said}` : "",
    "Read their chart and describe the soulmate their Venus and 7th house point to.",
    said
      ? "Weave what she told you into the reading so she recognizes her own " +
        "words — especially in obstacle and closing. Never quote the questions back."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildImagePrompt(appearance: string): string {
  // Fotorrealista, retrato único, sem texto e sem semelhança com pessoa real.
  return [
    "Photorealistic portrait photograph of one adult person, head and shoulders,",
    "looking softly toward the camera, warm cinematic lighting, shallow depth of field,",
    "neutral dark background with a faint golden glow, 85mm lens, natural skin texture.",
    "The person is fictional and must not resemble any real or famous individual.",
    "No text, no watermark, no border, single subject only.",
    `Appearance: ${appearance}`,
  ].join(" ");
}
