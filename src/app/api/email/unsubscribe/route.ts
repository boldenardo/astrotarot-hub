// Descadastro da lista promocional.
//
// GET  — a pessoa clicou no link do rodapé; responde com uma página.
// POST — descadastro de um clique do Gmail/Apple Mail (RFC 8058). O
//        cliente de e-mail chama isto sozinho, sem abrir o navegador,
//        e espera 200 com corpo vazio.
//
// Sem token válido não descadastra ninguém: o link é assinado por HMAC,
// então não dá para tirar terceiros da lista chutando endereços.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { verifyUnsubscribeToken } from "@/lib/server/email-unsubscribe";

export const runtime = "nodejs";

const COPY = {
  en: {
    ok: "You're unsubscribed.",
    okBody: "You won't get promotional emails from us again.",
    bad: "Invalid link",
    badBody: "This unsubscribe link is not valid. Reply to any of our emails and we'll remove you by hand.",
  },
  es: {
    ok: "Cancelaste tu suscripción.",
    okBody: "No volverás a recibir correos promocionales nuestros.",
    bad: "Enlace inválido",
    badBody: "Este enlace no es válido. Responde a cualquiera de nuestros correos y te quitamos de la lista a mano.",
  },
} as const;

function page(title: string, body: string, status: number) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AstroTarot</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0e0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="max-width:420px;padding:32px 24px;text-align:center;">
<p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#d4af37;letter-spacing:.5px;">AstroTarot</p>
<h1 style="margin:0 0 12px;font-size:22px;color:#e8e4f5;font-weight:600;">${title}</h1>
<p style="margin:0;font-size:15px;line-height:1.6;color:#b9b2d0;">${body}</p>
</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/** Marca o lead como descadastrado. Idempotente. */
async function unsubscribe(email: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdmin()
      .from("leads")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email);
    if (error) {
      console.error("[email/unsubscribe] update falhou:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email/unsubscribe] erro:", e);
    return false;
  }
}

function parse(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const lang = req.nextUrl.searchParams.get("lang");
  const copy = lang === "es" ? COPY.es : COPY.en;
  return { email, token, copy, valid: Boolean(email) && verifyUnsubscribeToken(email, token) };
}

export async function GET(req: NextRequest) {
  const { email, copy, valid } = parse(req);
  if (!valid) return page(copy.bad, copy.badBody, 400);

  // Falha de banco não vira erro na cara de quem clicou: o pedido é
  // legítimo e a pessoa não tem o que fazer com um 500. Fica no log.
  await unsubscribe(email);
  return page(copy.ok, copy.okBody, 200);
}

export async function POST(req: NextRequest) {
  const { email, valid } = parse(req);
  if (!valid) return new NextResponse(null, { status: 400 });
  await unsubscribe(email);
  return new NextResponse(null, { status: 200 });
}
