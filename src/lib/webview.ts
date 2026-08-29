// Escape de webview no momento do pagamento.
//
// O TESTE (25/08): a maior parte do tráfego chega pela webview do
// Facebook/Instagram, onde o checkout da Stripe mostra só o campo de
// cartão cru — Google Pay e Apple Pay não existem ali. A hipótese do dono:
// ninguém digita cartão num site que conheceu há oito minutos, mas pagar
// com um toque numa interface conhecida (Google/Apple no navegador real)
// é outra conversa. Este módulo tenta abrir o checkout no navegador DE
// VERDADE; se o app bloquear, cai no redirect normal em ~1,4s — o escape
// nunca pode custar uma venda.
//
// Medição: checkout_escape_attempted / checkout_escape_failed nos eventos
// (GA4 + funnel_events). É o que dirá se a hipótese é verdadeira.

import { trackEvent } from "@/lib/analytics";

/** Navegador embutido de app (FB/IG/Messenger/TikTok/etc.)? */
export function inAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|FBMD|TikTok|musical_ly|Bytedance|Snapchat|Line\//i.test(ua)) {
    return true;
  }
  // Webview Android genérica ("; wv)") — Chrome de verdade não tem "wv".
  return /Android/i.test(ua) && /\bwv\b/.test(ua);
}

function os(): "android" | "ios" | "other" {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "other";
}

/**
 * Abre a URL do Checkout. Fora de webview: redirect direto, como sempre.
 * Dentro de webview (e com sessionId): tenta pular para o navegador real
 * via a ponte /pay/<id> (URL sem fragmento — intent:// e x-safari- não
 * transportam #). Se em 1,4s a página ainda estiver visível, o app
 * bloqueou o pulo → segue o redirect normal dentro da webview.
 */
export function openCheckout(opts: {
  url: string;
  sessionId?: string | null;
  /** Rastreio de variante, para a ponte não perder a atribuição. */
  sck?: string | null;
}): void {
  const { url, sessionId } = opts;
  const platform = os();

  // iOS FICA DE FORA do escape (25/08, testado pelo dono no FB real):
  // a Meta remendou o x-safari-https — o Safari abre com a URL mutilada
  // (404) — e, pior, o fallback por timer perde o "user activation" e a
  // webview bloqueia até o redirect normal. No iOS, redirect direto no
  // clique, como sempre foi. O teste do escape roda só no Android, onde
  // intent:// segue sendo o padrão da indústria.
  if (!inAppBrowser() || !sessionId || platform !== "android") {
    window.location.href = url;
    return;
  }

  // A query sobrevive ao intent:// (só o fragmento não sobrevive), então é
  // por ela que a atribuição de variante atravessa o pulo. O e-mail NÃO vai:
  // esta string inteira passa pelo app do Facebook.
  const sck = typeof opts.sck === "string" ? opts.sck.trim().slice(0, 40) : "";
  const path = `/pay/${sessionId}${sck ? `?sck=${encodeURIComponent(sck)}` : ""}`;
  const bridge = `${window.location.origin}${path}`;
  const target =
    // package fixa o Chrome; sem ele instalado, o fallback_url abre o
    // navegador padrão do aparelho — qualquer um deles tem carteira.
    `intent://${window.location.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(bridge)};end`;

  trackEvent("checkout_escape_attempted", {
    category: "checkout",
    label: platform,
  });

  window.setTimeout(() => {
    // Escape funcionou → o app foi para segundo plano e isto nem roda com
    // a página visível. Ainda visível = bloqueado: paga-se na webview mesmo.
    if (!document.hidden) {
      trackEvent("checkout_escape_failed", {
        category: "checkout",
        label: platform,
      });
      window.location.href = url;
    }
  }, 1400);

  window.location.href = target;
}
