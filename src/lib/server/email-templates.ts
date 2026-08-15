// Templates de e-mail — HTML inline (clientes de e-mail ignoram <style>
// externo e a maioria descarta CSS moderno). Bilíngue EN/ES, seguindo o
// mesmo idioma em que a pessoa fez o funil.

import type { Locale } from "@/lib/i18n";

const BRAND = "#d4af37";
const BG = "#0e0a1a";
const CARD = "#171226";
const TEXT = "#e8e4f5";
const MUTED = "#b9b2d0";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astrotarot.shop";

function shell(content: string, preheader: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>AstroTarot</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${CARD};border-radius:16px;border:1px solid rgba(212,175,55,0.22);">
<tr><td style="padding:28px 24px;">
<p style="margin:0 0 20px;font-size:18px;font-weight:600;color:${BRAND};letter-spacing:0.5px;">AstroTarot</p>
${content}
</td></tr></table>
<p style="margin:18px 0 0;font-size:11px;color:${MUTED};max-width:520px;">
AstroTarot &middot; <a href="${APP_URL}" style="color:${MUTED};">astrotarot.shop</a><br>
You received this because you requested a reading on our site.
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
  const link = `${APP_URL}/quiz/vsl`;

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
      "Tu lectura de alma gemela te espera."
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
    "Your soulmate reading is waiting."
  );
  const text = `${name ? name + ", I" : "I"} read your chart. Open your full revelation: ${link}`;
  return { subject, html, text };
}

/* ------------------------------------------------------------------ */
/* 2. Carrinho abandonado — quem deu o e-mail e não comprou.            */
/* ------------------------------------------------------------------ */

export function abandonedCartEmail(input: {
  name?: string | null;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/quiz/vsl`;

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
      "Tu alma gemela sigue esperando."
    );
    return { subject, html, text: `Termina tu lectura: ${link}` };
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
    "Your soulmate is still waiting."
  );
  return { subject, html, text: `Finish your reading: ${link}` };
}

/* ------------------------------------------------------------------ */
/* 3. Boas-vindas pós-compra — com o passo de ativação (criar conta).   */
/* ------------------------------------------------------------------ */

export function welcomeEmail(input: {
  name?: string | null;
  email: string;
  locale: Locale;
}): { subject: string; html: string; text: string } {
  const name = input.name?.trim().split(/\s+/)[0];
  const link = `${APP_URL}/auth/register?email=${encodeURIComponent(input.email)}`;

  if (input.locale === "es") {
    const html = shell(
      [
        h1("¡Bienvenida a AstroTarot!"),
        p(
          "Tu pago está confirmado. Falta un paso: crea tu cuenta con ESTE MISMO correo y tu acceso se activa al instante."
        ),
        button("Crear mi cuenta", link),
        p(
          `<span style="color:${MUTED};font-size:13px;">Si ya la creaste, puedes ignorar este mensaje.</span>`
        ),
      ].join(""),
      "Falta un paso para activar tu acceso."
    );
    return {
      subject: name ? `${name}, activa tu acceso` : "Activa tu acceso",
      html,
      text: `Crea tu cuenta con este mismo correo: ${link}`,
    };
  }

  const html = shell(
    [
      h1("Welcome to AstroTarot!"),
      p(
        "Your payment is confirmed. One step left: create your account with THIS SAME email and your access unlocks instantly."
      ),
      button("Create my account", link),
      p(
        `<span style="color:${MUTED};font-size:13px;">If you already created it, you can ignore this.</span>`
      ),
    ].join(""),
    "One step left to activate your access."
  );
  return {
    subject: name ? `${name}, activate your access` : "Activate your access",
    html,
    text: `Create your account with this same email: ${link}`,
  };
}
