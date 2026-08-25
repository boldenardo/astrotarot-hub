// GET /pay/<cs_...> — ponte para o Checkout hospedado, SEM fragmento.
//
// Por que existe: para escapar da webview do Facebook/Instagram usamos
// intent:// (Android), que não transporta o fragmento #... da URL do
// Checkout. O navegador externo abre ESTA rota (URL limpa, nosso domínio)
// e ela devolve 302 para a URL completa da Stripe.
//
// EDGE runtime de propósito (25/08): no tráfego orgânico quase todo
// visitante encontra a função fria — em Node o cold start somava ~1s no
// meio do pulo webview→Chrome. Edge abre em dezenas de ms, e a única
// dependência é um GET na API da Stripe.
//
// Sem open redirect: o destino nunca vem da query — é sempre o session.url
// que a PRÓPRIA Stripe devolve para o id validado.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  const { session: id } = await params;
  const fallback = new URL("/quiz/vsl-v2", req.url);
  const key = process.env.STRIPE_SECRET_KEY;

  if (!/^cs_(live|test)_[a-zA-Z0-9]+$/.test(id) || !key) {
    return NextResponse.redirect(fallback);
  }

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${id}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (res.ok) {
      const session = (await res.json()) as { status?: string; url?: string | null };
      // Sessão aberta → Stripe. Expirada/paga → funil (a oferta segue lá).
      if (session.status === "open" && session.url) {
        return NextResponse.redirect(session.url);
      }
    }
  } catch {
    // id desconhecido/timeout cai no fallback
  }
  return NextResponse.redirect(fallback);
}
