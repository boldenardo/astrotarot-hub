// GET /pay/<cs_...> — ponte para o Checkout hospedado, SEM fragmento.
//
// Por que existe: para escapar da webview do Facebook/Instagram usamos
// intent:// (Android) e x-safari-https:// (iOS), e nenhum dos dois
// transporta o fragmento #... — que na URL do Checkout da Stripe carrega
// parte da sessão. Então o navegador externo abre ESTA rota (URL limpa,
// nosso domínio) e ela devolve 302 para a URL completa da Stripe, com
// fragmento e tudo.
//
// Sem open redirect: o destino nunca vem da query — é sempre o session.url
// que a PRÓPRIA Stripe devolve para o id validado.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  const { session: id } = await params;
  const fallback = new URL("/quiz/vsl-v2", req.url);

  if (!/^cs_(live|test)_[a-zA-Z0-9]+$/.test(id) || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(fallback);
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(id);
    // Sessão aberta → Stripe. Expirada/paga → funil (a oferta segue lá).
    if (session.status === "open" && session.url) {
      return NextResponse.redirect(session.url);
    }
  } catch {
    // id desconhecido cai no fallback
  }
  return NextResponse.redirect(fallback);
}
