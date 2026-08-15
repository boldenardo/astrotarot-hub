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
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { sendEmail, isEmailConfigured } from "@/lib/server/email";
import { abandonedCartEmail } from "@/lib/server/email-templates";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Idade mínima do lead: não perseguir quem acabou de sair da página. */
const MIN_AGE_HOURS = 4;
/** Teto por execução — protege contra rajada e contra limite do provedor. */
const BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
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

  // ?dry=1 — mostra a fila sem mandar nada. Serve para conferir a
  // configuração (segredo, chave, consulta) antes de disparar de
  // verdade: um envio errado não tem botão de desfazer.
  if (req.nextUrl.searchParams.get("dry") === "1") {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      configured: true,
      candidates: leads.length,
      emails: leads.map((l) => l.email),
    });
  }

  let sent = 0;

  for (const lead of leads) {
    // Idioma do lead não é guardado hoje; recuperação sai em inglês, que
    // é o padrão do site. (Melhoria futura: coluna `locale` em leads.)
    const mail = abandonedCartEmail({
      name: lead.name,
      email: lead.email,
      locale: "en",
    });
    const ok = await sendEmail({ to: lead.email, ...mail });
    if (ok) {
      sent++;
      // Carimba ANTES de seguir: se a execução morrer no meio, ninguém
      // recebe o mesmo e-mail duas vezes na próxima rodada.
      await admin
        .from("leads")
        .update({ recovery_email_sent_at: new Date().toISOString() })
        .eq("email", lead.email);
    }
  }

  return NextResponse.json({ ok: true, candidates: leads.length, sent });
}
