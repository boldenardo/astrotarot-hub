// Link de descadastro assinado.
//
// O e-mail precisa carregar um jeito de sair da lista — sem isso o Gmail
// e o Yahoo tratam disparo em massa como spam (regra de remetente em
// volume) e a CAN-SPAM, que vale para o público americano, é explícita
// sobre isso. Marcar como spam não é reversível: derruba a entrega de
// TODOS os e-mails do domínio, inclusive o de quem pagou.
//
// O token é um HMAC do e-mail: qualquer um pode descadastrar a si mesmo
// clicando, mas ninguém descadastra terceiros chutando endereço.

import crypto from "node:crypto";

/** Segredo do HMAC. Cai na service_role, que sempre existe no servidor. */
function secret(): string {
  return (
    process.env.EMAIL_TOKEN_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

const normalize = (email: string) => email.trim().toLowerCase();

export function unsubscribeToken(email: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(normalize(email))
    .digest("base64url")
    .slice(0, 32);
}

/** Comparação em tempo constante: não vaza o token por timing. */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!secret() || !token) return false;
  const expected = unsubscribeToken(email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://astrotarot.shop";
  const qs = new URLSearchParams({ e: normalize(email), t: unsubscribeToken(email) });
  return `${base}/api/email/unsubscribe?${qs}`;
}
