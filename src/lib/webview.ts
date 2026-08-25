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
export function openCheckout(opts: { url: string; sessionId?: string | null }): void {
  const { url, sessionId } = opts;
  const platform = os();

  if (!inAppBrowser() || !sessionId || platform === "other") {
    window.location.href = url;
    return;
  }

  const bridge = `${window.location.origin}/pay/${sessionId}`;
  const target =
    platform === "android"
      ? // package fixa o Chrome; sem ele instalado, o fallback_url abre o
        // navegador padrão do aparelho — qualquer um deles tem carteira.
        `intent://${window.location.host}/pay/${sessionId}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(bridge)};end`
      : `x-safari-https://${window.location.host}/pay/${sessionId}`;

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
