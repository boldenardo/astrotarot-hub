// Geração do retrato + dossiê — a ENTREGA do que o funil vende.
//
// Vivia inteira dentro de POST /api/soulmate/generate, que exige sessão do
// Clerk. Isso amarrava a entrega a um login, e o login custou caro: a
// primeira venda da Hotmart (03/09) pagou às 04:08 e treze horas depois
// ainda não tinha retrato nenhum — o comprador teria de criar conta e
// apertar "Draw my soulmate" para o produto existir.
//
// Aqui a geração passa a ser uma função chamável: pelo webhook, assim que
// o pagamento é aprovado, e pela página com link assinado, sem login.
// Quem autoriza é quem chama; esta função só entrega.

import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { DOSSIER_SYSTEM, buildDossierPrompt } from "@/lib/server/soulmate-prompt";
import { isCompleteDossier, type SoulmateReading } from "@/lib/soulmate-reading";
import { groqChatJson } from "@/lib/server/groq";
import { getImageProvider } from "@/lib/server/image-gen";

export const BUCKET = "soulmate";
/** Validade da URL assinada. Curta: a imagem é o produto vendido. */
export const SIGNED_URL_TTL_S = 60 * 60;

/** O mínimo que a geração precisa saber sobre quem comprou. */
export interface SoulmateProfile {
  id: string;
  email: string | null;
  name: string | null;
  birth_date: string | null;
  birth_location: string | null;
}

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

export type GenerateResult =
  | { ok: true; generated: boolean; portrait: PortraitOut }
  | { ok: false; code: "NOT_CONFIGURED" | "FAILED" };

export interface PortraitOut {
  image_url: string | null;
  preview_url: string | null;
  dossier: Dossier;
  sign: string | null;
}

/**
 * Gera (ou devolve) o retrato e o dossiê de um comprador.
 *
 * IDEMPOTENTE por usuário: gerar custa dinheiro, e a linha existente volta
 * sem gastar de novo. É o que deixa o webhook e a página chamarem sem medo
 * de duplicar — inclusive quando a Hotmart reenvia a mesma notificação.
 */
export async function generateSoulmateFor(
  profile: SoulmateProfile
): Promise<GenerateResult> {
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("soulmate_portraits")
    .select("image_url, preview_url, dossier, sign")
    .eq("user_id", profile.id)
    .maybeSingle();
  const row = existing as PortraitOut | null;
  // Pronto de verdade é ter os DOIS. Com o texto salvo e a imagem faltando
  // (provedor fora do ar), voltar aqui tenta só a imagem de novo — sem
  // gastar outra chamada de texto nem reescrever a leitura que ela já leu.
  if (row?.image_url && row?.dossier) {
    return { ok: true, generated: false, portrait: row };
  }

  const provider = getImageProvider();

  const sign = deriveSign(profile.birth_date);

  // As respostas do quiz vivem em `leads`, gravadas por e-mail. Best-effort:
  // quem comprou por outro caminho segue recebendo a leitura só pelo mapa.
  let quizAnswers: Record<string, string> | null = null;
  let leadReading: SoulmateReading | null = null;
  try {
    if (profile.email) {
      const { data: lead } = await admin
        .from("leads")
        .select("answers, soulmate_reading")
        .eq("email", profile.email.trim().toLowerCase())
        .maybeSingle();
      const a = lead?.answers;
      if (a && typeof a === "object") quizAnswers = a as Record<string, string>;
      const r = (lead as { soulmate_reading?: SoulmateReading } | null)
        ?.soulmate_reading;
      if (r?.cards?.length) leadReading = r;
    }
  } catch (e) {
    console.warn("[soulmate] respostas do quiz não carregadas:", e);
  }

  try {
    // 1. O dossiê. Reaproveita o da prévia grátis quando existe: a pessoa
    //    leu as cartas III e IV ANTES de pagar, e gerar de novo faria o
    //    obstáculo e a janela mudarem depois da compra.
    const reusable =
      leadReading?.source === "llm" && isCompleteDossier(leadReading.dossier)
        ? (leadReading.dossier as Dossier)
        : null;

    const dossier =
      reusable ??
      (await groqChatJson<Dossier>({
        system: DOSSIER_SYSTEM,
        user: buildDossierPrompt({
          name: profile.name,
          birthDate: profile.birth_date,
          birthLocation: profile.birth_location,
          sign,
          answers: quizAnswers,
          cards: leadReading?.cards,
          window: leadReading?.window ?? null,
        }),
        maxTokens: 900,
        temperature: 0.85,
      }));
    if (!reusable) assertComplete(dossier);

    // 1b. GRAVA O TEXTO ANTES DE TENTAR A IMAGEM.
    //
    // As duas coisas falhavam juntas: um 429 do provedor de imagem
    // derrubava a função inteira e a leitura — que já estava pronta e é a
    // maior parte do que foi vendido — não era gravada. Quem pagou ficava
    // sem nada em vez de sem metade.
    const prompt = buildImagePrompt(dossier.appearance);
    await admin.from("soulmate_portraits").upsert(
      {
        user_id: profile.id,
        dossier: { ...dossier, cards: leadReading?.cards ?? null },
        prompt,
        sign,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // 2. Retrato. Sem provedor ou com ele fora do ar, a leitura já está
    //    salva e a página mostra o texto dizendo que o desenho vem depois.
    if (!provider) {
      return {
        ok: true,
        generated: true,
        portrait: { image_url: null, preview_url: null, dossier, sign },
      };
    }
    let image;
    try {
      image = await provider.generate(prompt);
    } catch (e) {
      console.error("[soulmate] imagem falhou (texto ficou salvo):", e);
      return {
        ok: true,
        generated: true,
        portrait: { image_url: null, preview_url: null, dossier, sign },
      };
    }

    // 3. Storage: DUAS imagens de verdade — a prévia é pequena e borrada.
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

    const { error: insErr } = await admin
      .from("soulmate_portraits")
      .update({
        image_url: fullPath,
        preview_url: previewPath,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", profile.id);
    if (insErr) throw insErr;

    return {
      ok: true,
      generated: true,
      portrait: { image_url: fullPath, preview_url: previewPath, dossier, sign },
    };
  } catch (e) {
    console.error("[soulmate] geração falhou:", e);
    return { ok: false, code: "FAILED" };
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

// ANSWER_MEANING / describeAnswers / buildDossierPrompt saíram daqui em
// 28/08 para src/lib/server/soulmate-prompt.ts: a prévia grátis do fim do
// quiz precisa gerar o MESMO texto que esta rota, e duas cópias do prompt
// divergiriam na primeira alteração — com a diferença aparecendo para
// quem já tinha lido a prévia.

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
