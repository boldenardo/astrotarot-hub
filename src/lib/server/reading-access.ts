// Link assinado para a leitura comprada — acesso SEM login.
//
// Por que existe: a primeira venda da Hotmart (03/09) foi aprovada às
// 04:08 e treze horas depois o comprador ainda não tinha retrato nenhum.
// Não faltou entrega — faltou ele atravessar um cadastro. O caminho era
// e-mail → /auth/register → criar conta no Clerk → /soulmate → apertar
// "Draw my soulmate" → esperar. Quatro barreiras entre pagar e ver.
//
// Agora o e-mail leva a uma página que já mostra tudo. O token é um HMAC
// do e-mail, no mesmo molde do link de descadastro: quem tem o link vê a
// própria leitura, e ninguém vê a de outro chutando endereço.
//
// NAMESPACE: o payload leva o prefixo "reading:" de propósito. Sem ele, o
// token de descadastro (mesmo segredo, mesmo e-mail) abriria a leitura, e
// um link de sair-da-lista viraria chave do produto pago.

import crypto from "node:crypto";

function secret(): string {
  return (
    process.env.EMAIL_TOKEN_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

const normalize = (email: string) => email.trim().toLowerCase();

export function readingToken(email: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`reading:${normalize(email)}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Comparação em tempo constante: não vaza o token por timing. */
export function verifyReadingToken(email: string, token: string): boolean {
  if (!secret() || !token || !email) return false;
  const expected = readingToken(email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** A URL que o e-mail de boas-vindas carrega. */
export function readingUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://astrotarot.shop";
  const qs = new URLSearchParams({
    e: normalize(email),
    t: readingToken(email),
  });
  return `${base}/reading?${qs}`;
}
