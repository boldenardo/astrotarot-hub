// Templates de e-mail — HTML inline (clientes de e-mail ignoram <style>
// externo e a maioria descarta CSS moderno). Bilíngue EN/ES, seguindo o
// mesmo idioma em que a pessoa fez o funil.

import type { Locale } from "@/lib/i18n";
import { unsubscribeUrl } from "./email-unsubscribe";

const BRAND = "#d4af37";
const BG = "#0e0a1a";
const CARD = "#171226";
const TEXT = "#e8e4f5";
const MUTED = "#b9b2d0";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astrotarot.shop";

const FOOTER = {
  en: {
    why: "You received this because you requested a reading on our site.",
    unsub: "Unsubscribe",
  },
  es: {
    why: "Recibiste esto porque pediste una lectura en nuestro sitio.",
    unsub: "Cancelar suscripción",
  },
} as const;

interface ShellOptions {
  preheader: string;
  locale: Locale;
  /** Presente só em e-mail promocional — transacional não é lista. */
  unsubscribeUrl?: string;
}

function shell(content: string, opts: ShellOptions): string {
  const t = FOOTER[opts.locale] ?? FOOTER.en;
  const unsub = opts.unsubscribeUrl
    ? `<br><a href="${opts.unsubscribeUrl}" style="color:${MUTED};">${t.unsub}</a>`
    : "";
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>AstroTarot</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${CARD};border-radius:16px;border:1px solid rgba(212,175,55,0.22);">
<tr><td style="padding:28px 24px;">
<p style="margin:0 0 20px;font-size:18px;font-weight:600;color:${BRAND};letter-spacing:0.5px;">AstroTarot</p>
${content}
</td></tr></table>
<p style="margin:18px 0 0;font-size:11px;color:${MUTED};max-width:520px;">
AstroTarot &middot; <a href="${APP_URL}" style="color:${MUTED};">astrotarot.shop</a><br>
${t.why}${unsub}
</p>
</td></tr></table></body></html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;">
<tr><td style="border-radius:999px;background:linear-gradient(135deg,#edd9a3,#d4af37 55%,#a9822f);">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#1a1330;text-decoration:none;border-radius:999px;">${label}</a>
</td></tr></table>`;
}

const p = (text: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${TEXT};">${text}</p>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${TEXT};font-weight:600;">${text}</h1>`;

/* ------------------------------------------------------------------ */
/* 1. Leitura entregue — dispara quando o lead é capturado no quiz.     */
/*    O funil PROMETE enviar a leitura; sem isto a promessa é quebrada. */
/* ------------------------------------------------------------------ */

export function leadReadingEmail(input: {
  name?: string | null;
  sign?: string | null;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const sign = input.sign ?? null;
  const link = `${APP_URL}/quiz/vsl-v2?from=email`;

  if (input.locale === "es") {
    const subject = name
      ? `${name}, tu lectura de alma gemela está lista`
      : "Tu lectura de alma gemela está lista";
    const html = shell(
      [
        h1(name ? `${name}, ya leí tu carta.` : "Ya leí tu carta."),
        p(
          sign
            ? `Tu Sol en ${sign} y tu casa 7 muestran una conexión que ya se está formando — y pude ver su rostro.`
            : "Tu carta muestra una conexión que ya se está formando — y pude ver su rostro."
        ),
        p("Abre tu revelación completa mientras la energía sigue activa:"),
        button("Ver mi revelación", link),
        p(
          `<span style="color:${MUTED};font-size:13px;">Con cariño,<br>Master Aura</span>`
        ),
      ].join(""),
      { preheader: "Tu lectura de alma gemela te espera.", locale: "es" }
    );
    const text = `${name ? name + ", ya" : "Ya"} leí tu carta. Abre tu revelación completa: ${link}`;
    return { subject, html, text };
  }

  const subject = name
    ? `${name}, your soulmate reading is ready`
    : "Your soulmate reading is ready";
  const html = shell(
    [
      h1(name ? `${name}, I read your chart.` : "I read your chart."),
      p(
        sign
          ? `Your Sun in ${sign} and your 7th house show a connection already forming — and I could see their face.`
          : "Your chart shows a connection already forming — and I could see their face."
      ),
      p("Open your full revelation while the energy is still active:"),
      button("See my revelation", link),
      p(
        `<span style="color:${MUTED};font-size:13px;">With care,<br>Master Aura</span>`
      ),
    ].join(""),
    { preheader: "Your soulmate reading is waiting.", locale: "en" }
  );
  const text = `${name ? name + ", I" : "I"} read your chart. Open your full revelation: ${link}`;
  return { subject, html, text };
}

/* ------------------------------------------------------------------ */
/* 2. Cartão recusado — a pessoa TENTOU pagar e o banco negou.          */
/*                                                                      */
/* É o sinal de intenção mais alto do funil inteiro: ela digitou o       */
/* cartão. Tratar isso como "carrinho abandonado" é errar o diagnóstico  */
/* na cara dela — não desistiu, foi barrada. Recusa de emissor costuma   */
/* passar numa segunda tentativa (a própria Stripe devolve              */
/* advice_code: try_again_later), então o e-mail diz o que aconteceu e   */
/* devolve o link, sem culpar ninguém e sem expor dado do cartão.       */
/* ------------------------------------------------------------------ */

export function paymentFailedEmail(input: {
  name?: string | null;
  email: string;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/quiz/vsl-v2?from=email`;

  if (input.locale === "es") {
    const html = shell(
      [
        h1(
          name
            ? `${name}, tu banco rechazó el pago`
            : "Tu banco rechazó el pago"
        ),
        p(
          "No fue culpa tuya y no se te cobró nada. A veces el banco bloquea una compra nueva por seguridad — suele funcionar al segundo intento, o con otra tarjeta."
        ),
        p("Tu lectura sigue reservada:"),
        button("Terminar mi lectura", link),
        p(
          `<span style="color:${MUTED};font-size:13px;">Master Aura</span>`
        ),
      ].join(""),
      { preheader: "No se te cobró nada — tu lectura sigue esperando.", locale: "es" }
    );
    return {
      subject: name ? `${name}, no pudimos procesar tu pago` : "No pudimos procesar tu pago",
      html,
      text: `Tu banco rechazó el pago y no se te cobró nada. Termina tu lectura: ${link}`,
    };
  }

  const html = shell(
    [
      h1(name ? `${name}, your bank declined the payment` : "Your bank declined the payment"),
      p(
        "Nothing was charged, and nothing on your end went wrong. Banks often block a first purchase from a new merchant — a second try, or a different card, usually goes through."
      ),
      p("Your reading is still held for you:"),
      button("Finish my reading", link),
      p(`<span style="color:${MUTED};font-size:13px;">Master Aura</span>`),
    ].join(""),
    { preheader: "You weren't charged — your reading is still waiting.", locale: "en" }
  );
  return {
    subject: name ? `${name}, we couldn't process your payment` : "We couldn't process your payment",
    html,
    text: `Your bank declined the payment and you were not charged. Finish your reading: ${link}`,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Carrinho abandonado — quem deu o e-mail e não comprou.            */
/* ------------------------------------------------------------------ */

export function abandonedCartEmail(input: {
  name?: string | null;
  /** Necessário para assinar o link de descadastro. */
  email: string;
  locale: Locale;
}): { subject: string; html: string; text: string; unsubscribeUrl: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/quiz/vsl-v2?from=email`;
  // Este é o único e-mail promocional dos três: quem não comprou não pediu
  // para ser perseguido, então ele carrega saída.
  const unsub = unsubscribeUrl(input.email);

  if (input.locale === "es") {
    const subject = name
      ? `${name}, tu revelación sigue esperando`
      : "Tu revelación sigue esperando";
    const html = shell(
      [
        h1("Tu carta no cambió — tú sí puedes cambiarla."),
        p(
          name
            ? `${name}, dejaste tu revelación a medio abrir. La alineación que vi en tu carta no se queda abierta para siempre.`
            : "Dejaste tu revelación a medio abrir. La alineación que vi en tu carta no se queda abierta para siempre."
        ),
        button("Terminar mi lectura", link),
        p(
          `<span style="color:${MUTED};font-size:13px;">Master Aura</span>`
        ),
      ].join(""),
      {
        preheader: "Tu alma gemela sigue esperando.",
        locale: "es",
        unsubscribeUrl: unsub,
      }
    );
    return {
      subject,
      html,
      text: `Termina tu lectura: ${link}\n\nCancelar suscripción: ${unsub}`,
      unsubscribeUrl: unsub,
    };
  }

  const subject = name
    ? `${name}, your revelation is still waiting`
    : "Your revelation is still waiting";
  const html = shell(
    [
      h1("Your chart hasn't changed — but you can."),
      p(
        name
          ? `${name}, you left your revelation half-open. The alignment I saw in your chart doesn't stay open forever.`
          : "You left your revelation half-open. The alignment I saw in your chart doesn't stay open forever."
      ),
      button("Finish my reading", link),
      p(`<span style="color:${MUTED};font-size:13px;">Master Aura</span>`),
    ].join(""),
    {
      preheader: "Your soulmate is still waiting.",
      locale: "en",
      unsubscribeUrl: unsub,
    }
  );
  return {
    subject,
    html,
    text: `Finish your reading: ${link}\n\nUnsubscribe: ${unsub}`,
    unsubscribeUrl: unsub,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Boas-vindas pós-compra — com o passo de ativação (criar conta).   */
/* ------------------------------------------------------------------ */

/**
 * P.S. do e-mail de boas-vindas: pede UMA frase de review em resposta.
 * É a máquina de depoimentos REAIS — cada venda vira prova com nome,
 * sobre o nosso produto, sem fabricar nada. As respostas caem na caixa
 * do endereço de envio (EMAIL_FROM).
 */
/* ------------------------------------------------------------------ */
/* 3b. Pedido montado e não pago.                                       */
/*                                                                      */
/* Difere do abandono comum de propósito: esta pessoa escolheu a carta  */
/* de desconto, viu o formulário do cartão e parou ali. Mandar para ela */
/* o mesmo "sua leitura está esperando" de quem só deu o e-mail joga    */
/* fora a informação mais valiosa que temos — ela já decidiu comprar.   */
/* ------------------------------------------------------------------ */

export function openOrderEmail(input: {
  name?: string | null;
  email: string;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/quiz/checkout?from=email`;
  const unsub = unsubscribeUrl(input.email);

  if (input.locale === "es") {
    const html = shell(
      [
        h1(name ? `${name}, tu pedido sigue abierto` : "Tu pedido sigue abierto"),
        p(
          "Llegaste hasta la pantalla del pago y algo te detuvo ahí. Pasa: la mitad de las veces es el banco, la otra mitad es que no era el momento."
        ),
        p(
          "Tu lectura sigue reservada con el descuento que elegiste. No hace falta responder nada de nuevo — el pedido está armado tal como lo dejaste."
        ),
        button("Terminar mi pedido", link),
        p(
          `<span style="color:${MUTED};font-size:13px;">Si fue el banco quien rechazó, otra tarjeta suele resolverlo al primer intento.</span>`
        ),
      ].join(""),
      {
        preheader: "Tu lectura sigue reservada, con tu descuento.",
        locale: "es",
        unsubscribeUrl: unsub,
      }
    );
    return {
      subject: name ? `${name}, dejaste tu lectura a un paso` : "Dejaste tu lectura a un paso",
      html,
      text: `Tu pedido sigue abierto: ${link}`,
    };
  }

  const html = shell(
    [
      h1(name ? `${name}, your order is still open` : "Your order is still open"),
      p(
        "You made it all the way to the payment screen and something stopped you there. It happens — half the time it is the bank, the other half it simply was not the moment."
      ),
      p(
        "Your reading is still held, with the discount you picked. Nothing to answer again: the order is sitting exactly where you left it."
      ),
      button("Finish my order", link),
      p(
        `<span style="color:${MUTED};font-size:13px;">If it was the bank that declined, a different card usually clears on the first try.</span>`
      ),
    ].join(""),
    {
      preheader: "Your reading is still held, with your discount.",
      locale: "en",
      unsubscribeUrl: unsub,
    }
  );
  return {
    subject: name ? `${name}, you left your reading one step away` : "You left your reading one step away",
    html,
    text: `Your order is still open: ${link}`,
  };
}

/* ------------------------------------------------------------------ */
/* 3c. Última tentativa, três dias depois.                              */
/*                                                                      */
/* Sem desconto novo e sem prazo inventado — o único gancho honesto que */
/* existe é o real: as respostas moram no navegador em que ela fez o    */
/* quiz, e trocar de aparelho significa começar do zero.                */
/* ------------------------------------------------------------------ */

export function lastCallEmail(input: {
  name?: string | null;
  email: string;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/quiz/vsl-v2?from=email`;
  const unsub = unsubscribeUrl(input.email);

  if (input.locale === "es") {
    const html = shell(
      [
        h1("Antes de que se pierdan tus respuestas"),
        p(
          "Hace unos días respondiste quince preguntas y no volviste. No te voy a insistir de nuevo después de este correo."
        ),
        p(
          "Solo una cosa práctica: tus respuestas viven en el navegador donde hiciste el quiz. Si cambias de teléfono o borras los datos, hay que empezar de cero. Este enlace todavía las encuentra."
        ),
        button("Volver a mi lectura", link),
      ].join(""),
      {
        preheader: "Tus respuestas siguen ahí — por ahora.",
        locale: "es",
        unsubscribeUrl: unsub,
      }
    );
    return {
      subject: name ? `${name}, tus respuestas siguen ahí` : "Tus respuestas siguen ahí",
      html,
      text: `Vuelve a tu lectura: ${link}`,
    };
  }

  const html = shell(
    [
      h1("Before your answers go"),
      p(
        "A few days ago you answered fifteen questions and did not come back. I will not write about it again after this one."
      ),
      p(
        "One practical thing, though: your answers live in the browser you took the quiz on. Change phones or clear your data and it starts from zero. This link still finds them."
      ),
      button("Go back to my reading", link),
    ].join(""),
    {
      preheader: "Your answers are still there — for now.",
      locale: "en",
      unsubscribeUrl: unsub,
    }
  );
  return {
    subject: name ? `${name}, your answers are still there` : "Your answers are still there",
    html,
    text: `Go back to your reading: ${link}`,
  };
}

export function reviewAskHtml(): string {
  return p(
    `<span style="color:${MUTED};font-size:13px;">P.S. When you have read it — just hit reply and tell me one thing your reading got right. Real answers from real readers are the only reviews we show.</span>`
  );
}

export function welcomeEmail(input: {
  name?: string | null;
  email: string;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  // Leva à LEITURA, não a um cadastro solto (27/08). O e-mail antigo
  // mandava para /auth/register, o cadastro caía em /dashboard, e a pessoa
  // que acabou de pagar para ver um rosto tinha de achar o card certo entre
  // oito. `redirect_url` é o parâmetro que o Clerk respeita — o
  // fallbackRedirectUrl da página só vale quando ele não vem.
  const link =
    `${APP_URL}/auth/register?email=${encodeURIComponent(input.email)}` +
    `&redirect_url=${encodeURIComponent("/soulmate")}`;

  if (input.locale === "es") {
    const html = shell(
      [
        h1("Tu lectura te está esperando"),
        p(
          "Tu pago está confirmado. Falta un paso, y es corto: crea tu cuenta con ESTE MISMO correo — es así como reconocemos que la lectura es tuya."
        ),
        p(
          "El botón te lleva directo a tu página de alma gemela. Ahí tocas <strong>Draw my soulmate</strong> y el retrato se revela mientras lo lees."
        ),
        button("Abrir mi lectura", link),
        p(
          `<span style="color:${MUTED};font-size:13px;">Guarda este correo: el mismo enlace funciona siempre que quieras volver.</span>`
        ),
      ].join(""),
      { preheader: "Un paso corto y tu retrato se revela.", locale: "es" }
    );
    return {
      subject: name ? `${name}, tu lectura está lista` : "Tu lectura está lista",
      html,
      text: `Crea tu cuenta con este mismo correo y abre tu lectura: ${link}`,
    };
  }

  const html = shell(
    [
      h1("Your reading is waiting for you"),
      p(
        "Your payment is confirmed. One short step left: create your account with THIS SAME email — that is how we know the reading belongs to you."
      ),
      p(
        "The button takes you straight to your soulmate page. Tap <strong>Draw my soulmate</strong> there and the portrait comes through while you read."
      ),
      button("Open my reading", link),
      p(
        `<span style="color:${MUTED};font-size:13px;">Keep this email — the same link works any time you want to come back.</span>`
      ),
    ].join(""),
    { preheader: "One short step and your portrait comes through.", locale: "en" }
  );
  return {
    subject: name ? `${name}, your reading is ready` : "Your reading is ready",
    html,
    text: `Create your account with this same email and open your reading: ${link}`,
  };
}

/**
 * Última etapa da escada: quem abandonou o checkout E não voltou pela
 * oferta de $19.99. Dispara no `checkout.session.expired`, ou seja, só
 * para quem fechou a aba sem clicar em nada — a cancel_url nunca correu.
 *
 * Oferece o retrato sozinho por $17, que é o degrau mais barato que
 * existe. Nada aqui promete o que a leitura completa entrega.
 */
export function abandonedPortraitEmail(input: {
  name?: string | null;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/cart?plan=downsell_portrait`;
  const subject = name
    ? `${name}, your portrait is still drawn`
    : "Your portrait is still drawn";
  const html = shell(
    [
      h1(name ? `${name}, it is still here.` : "It is still here."),
      p(
        "You did not finish, and the portrait did not go anywhere. It is drawn and it is yours to look at."
      ),
      p(
        "If the full reading is more than you wanted right now, you can take the portrait on its own for $17."
      ),
      button("See the portrait — $17", link),
      p(
        `<span style="color:${MUTED};font-size:13px;">Master Aura</span>`
      ),
    ].join(""),
    { preheader: "The portrait is drawn and waiting.", locale: "en" }
  );
  const text = `${name ? name + ", it" : "It"} is still here. The portrait is drawn. Take it on its own for $17: ${link}`;
  return { subject, html, text };
}
