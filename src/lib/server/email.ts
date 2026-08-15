// Envio de e-mail — server-only, atrás de UMA interface.
//
// Hoje é Resend (REST, sem SDK novo no bundle). Trocar de provedor deve
// ser mexer numa função, não caçar chamadas espalhadas.
//
// REGRA DE OURO: e-mail NUNCA derruba o fluxo que o disparou. Toda função
// aqui devolve boolean e engole o erro — uma venda não pode falhar porque
// o provedor de e-mail está fora do ar.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Texto puro — melhora entregabilidade e cobre clientes sem HTML. */
  text?: string;
  replyTo?: string;
  /**
   * Marca o envio como promocional. Adiciona os cabeçalhos de descadastro
   * de um clique (RFC 8058), que Gmail e Yahoo exigem de quem manda em
   * volume — sem eles o disparo em massa vai para spam.
   * Não use em transacional (recibo, boas-vindas): esses não são lista.
   */
  unsubscribeUrl?: string;
}

/** Remetente configurado. Precisa ser de domínio verificado no Resend. */
function fromAddress(): string {
  return process.env.EMAIL_FROM || "AstroTarot <hello@astrotarot.shop>";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Envia um e-mail. Retorna false (sem lançar) quando não há chave
 * configurada ou o provedor recusa — quem chama segue o fluxo normal.
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        ...(msg.text ? { text: msg.text } : {}),
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        ...(msg.unsubscribeUrl
          ? {
              headers: {
                "List-Unsubscribe": `<${msg.unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] resend ${res.status}: ${detail.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] envio falhou:", e);
    return false;
  }
}
