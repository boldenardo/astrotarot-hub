// POST /api/email/recover — carrinho abandonado.
//
// Busca leads que deram o e-mail no quiz, NÃO compraram e ainda não
// receberam o e-mail de recuperação, e dispara um lote.
//
// Protegido por segredo compartilhado (header x-cron-secret), porque
// dispara e-mail em massa: exposto, viraria uma máquina de spam com o
// nosso domínio no remetente.
//
// Como agendar (Vercel → Settings → Cron Jobs, ou qualquer scheduler):
//   POST https://astrotarot.shop/api/email/recover
//   header: x-cron-secret: <CRON_SECRET>
// Uma vez por dia é suficiente — o filtro de idade evita mandar cedo
// demais (a pessoa ainda pode estar comprando).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { sendEmail, isEmailConfigured } from "@/lib/server/email";
import {
  abandonedCartEmail,
  openOrderEmail,
  lastCallEmail,
} from "@/lib/server/email-templates";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Idade mínima do lead: não perseguir quem acabou de sair da página. */
const MIN_AGE_HOURS = 4;
/** Teto por execução — protege contra rajada e contra limite do provedor. */
const BATCH_SIZE = 50;
/** Segunda (e última) mensagem: três dias depois da primeira. */
const LAST_CALL_AFTER_DAYS = 3;

/**
 * E-mails que chegaram a montar um pedido e não pagaram.
 *
 * Vale UMA chamada à Stripe por execução, não uma por lead. Quem está aqui
 * escolheu carta de desconto e viu o formulário do cartão — merece uma
 * mensagem diferente de quem só deixou o e-mail no quiz.
 */
async function emailsWithOpenOrder(): Promise<Set<string>> {
  const out = new Set<string>();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return out;
  try {
    const stripe = new Stripe(key);
    const since = Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60;
    const list = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: since },
    });
    for (const pi of list.data) {
      if (pi.status === "succeeded") continue;
      const mail = (pi.metadata?.quiz_email || "").trim().toLowerCase();
      if (mail) out.add(mail);
    }
  } catch (e) {
    console.warn("[email/recover] Stripe indisponível, seguindo sem:", e);
  }
  return out;
}

/**
 * GET — como o cron da Vercel chama.
 *
 * A Vercel invoca crons com GET e manda `Authorization: Bearer CRON_SECRET`
 * sozinha quando a env existe. É o que permite agendar por código
 * (vercel.json) em vez de depender de configuração manual no painel — que
 * foi exatamente o passo que ficou 4 dias sem acontecer, com 93 leads
 * acumulando na fila.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return runBatch(req);
}

/** POST — chamada manual/externa com o header x-cron-secret. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return runBatch(req);
}

async function runBatch(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email not configured.", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const cutoff = new Date(Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000).toISOString();
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("leads")
    .select("email, name")
    .is("converted_at", null)
    .is("recovery_email_sent_at", null)
    // Quem pediu para sair fica fora — ignorar isso é o caminho mais
    // rápido para o domínio inteiro cair em spam.
    .is("unsubscribed_at", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[email/recover] query falhou:", error);
    return NextResponse.json(
      { error: "Query failed.", detail: error.message },
      { status: 500 }
    );
  }

  const leads = (data ?? []) as Array<{ email: string; name: string | null }>;

  // LEVA 2 — três dias depois da primeira e só para quem continua sem
  // comprar. A coluna `last_call_email_sent_at` é o que impede o mesmo
  // e-mail de sair todo dia; sem ela (migration ainda não aplicada) a
  // consulta falha e a leva 2 simplesmente não roda — a leva 1 segue
  // intacta, que é o comportamento seguro.
  const lastCallCutoff = new Date(
    Date.now() - LAST_CALL_AFTER_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  let lastCall: Array<{ email: string; name: string | null }> = [];
  const { data: lcData, error: lcError } = await admin
    .from("leads")
    .select("email, name")
    .is("converted_at", null)
    .is("unsubscribed_at", null)
    .is("last_call_email_sent_at", null)
    .not("recovery_email_sent_at", "is", null)
    .lt("recovery_email_sent_at", lastCallCutoff)
    .order("recovery_email_sent_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (lcError) {
    console.warn("[email/recover] leva 2 pulada:", lcError.message);
  } else {
    lastCall = (lcData ?? []) as Array<{ email: string; name: string | null }>;
  }

  const openOrders = await emailsWithOpenOrder();

  // ?dry=1 — mostra a fila sem mandar nada. Serve para conferir a
  // configuração (segredo, chave, consulta) antes de disparar de
  // verdade: um envio errado não tem botão de desfazer.
  if (req.nextUrl.searchParams.get("dry") === "1") {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      configured: true,
      candidates: leads.length,
      withOpenOrder: leads.filter((l) => openOrders.has(l.email.toLowerCase()))
        .length,
      lastCallCandidates: lastCall.length,
      lastCallAvailable: !lcError,
      emails: leads.map((l) => l.email),
    });
  }

  let sent = 0;
  let sentOpenOrder = 0;

  for (const lead of leads) {
    // Idioma do lead não é guardado hoje; recuperação sai em inglês, que
    // é o padrão do site. (Melhoria futura: coluna `locale` em leads.)
    const hasOpenOrder = openOrders.has(lead.email.trim().toLowerCase());
    const mail = hasOpenOrder
      ? openOrderEmail({ name: lead.name, email: lead.email, locale: "en" })
      : abandonedCartEmail({
          name: lead.name,
          email: lead.email,
          locale: "en",
        });
    const ok = await sendEmail({ to: lead.email, ...mail });
    if (ok) {
      sent++;
      if (hasOpenOrder) sentOpenOrder++;
      // Carimba ANTES de seguir: se a execução morrer no meio, ninguém
      // recebe o mesmo e-mail duas vezes na próxima rodada.
      await admin
        .from("leads")
        .update({ recovery_email_sent_at: new Date().toISOString() })
        .eq("email", lead.email);
    }
  }

  let sentLastCall = 0;
  for (const lead of lastCall) {
    const mail = lastCallEmail({
      name: lead.name,
      email: lead.email,
      locale: "en",
    });
    const ok = await sendEmail({ to: lead.email, ...mail });
    if (ok) {
      sentLastCall++;
      await admin
        .from("leads")
        .update({ last_call_email_sent_at: new Date().toISOString() })
        .eq("email", lead.email);
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: leads.length,
    sent,
    sentOpenOrder,
    lastCallCandidates: lastCall.length,
    sentLastCall,
  });
}
