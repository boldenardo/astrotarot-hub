// Permissão do downsell de abandono ($19.99) — server-only.
//
// A página diz, com todas as letras, que o preço não dá para voltar e
// pegar. Só é honesto dizer isso porque a decisão mora AQUI, amarrada ao
// e-mail no banco: limpar localStorage, abrir aba anônima ou reabrir o
// link não muda nada. O token que viaja na URL é opaco — o e-mail nunca
// entra em query string.
//
// FALHA FECHADA: tabela ausente, erro de rede, token desconhecido, o que
// for — a resposta é "não elegível", e a pessoa vê o preço cheio. O erro
// caro aqui é dar desconto de graça, não deixar de dar.

import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase-admin";

const TABLE = "downsell_grants";

/**
 * Registra a permissão no momento em que a sessão de checkout é criada.
 * Devolve o token da cancel_url, ou null se não deu para registrar (aí a
 * cancel_url volta para a VSL, sem oferta de desconto).
 */
export function createDownsellGrant(params: {
  email: string;
  quizSessionId?: string | null;
  checkoutSessionId?: string | null;
}): string {
  const token = randomUUID().replace(/-/g, "");
  // FORA do caminho crítico (25/08): o clique de compra esperava ~250ms
  // por este insert antes de falar com a Stripe. O token volta na hora e
  // o insert corre em paralelo com a criação da sessão (~1s) — se ele
  // perder a corrida ou falhar, o token não acha grant e resolveDownsell
  // devolve preço cheio: falha fechada, como sempre.
  void getSupabaseAdmin()
    .from(TABLE)
    .insert({
      token,
      email: params.email.toLowerCase(),
      quiz_session_id: params.quizSessionId ?? null,
      stripe_checkout_session_id: params.checkoutSessionId ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("[downsell] grant não registrado:", error.message);
    });
  return token;
}

export interface DownsellDecision {
  eligible: boolean;
  email: string | null;
}

/**
 * Decide se ESTE token ainda vale $19.99 e marca a exibição.
 *
 * A regra do dono: o e-mail vê a oferta UMA vez. Então o token só vale se
 * for o primeiro a ser exibido para aquele e-mail — um segundo abandono,
 * com token novo, cai no preço cheio. Reabrir o MESMO token continua
 * valendo: é o mesmo abandono, não uma segunda chance.
 *
 * @param markSeen false para só consultar (usado na hora de cobrar, que
 * não pode "gastar" a permissão de novo).
 */
export async function resolveDownsell(
  token: string,
  markSeen = true
): Promise<DownsellDecision> {
  if (!token || !/^[a-f0-9]{32}$/.test(token)) return { eligible: false, email: null };
  try {
    const admin = getSupabaseAdmin();
    const { data: grant, error } = await admin
      .from(TABLE)
      .select("token, email, seen_at, used_at")
      .eq("token", token)
      .maybeSingle();
    if (error || !grant) return { eligible: false, email: null };

    const email = String(grant.email);
    if (grant.used_at) return { eligible: false, email };

    // Já comprou alguma vez com este e-mail? Então não é abandono.
    const { data: paid } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .not("stripe_customer_id", "is", null)
      .limit(1);
    if (paid && paid.length) return { eligible: false, email };

    // Qualquer OUTRO token deste e-mail já exibido ou usado queima a oferta.
    const { data: others } = await admin
      .from(TABLE)
      .select("token, seen_at, used_at")
      .eq("email", email)
      .neq("token", token)
      .limit(50);
    const burned = (others ?? []).some((o) => o.seen_at || o.used_at);
    if (burned) return { eligible: false, email };

    if (markSeen && !grant.seen_at) {
      await admin
        .from(TABLE)
        .update({ seen_at: new Date().toISOString() })
        .eq("token", token);
    }
    return { eligible: true, email };
  } catch (e) {
    console.warn("[downsell] consulta falhou, tratando como não elegível:", e);
    return { eligible: false, email: null };
  }
}

/** Fecha a permissão: a partir daqui este e-mail nunca mais vê $19.99. */
export async function markDownsellUsed(token: string): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from(TABLE)
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);
  } catch {
    // best-effort: a cobrança já aconteceu, não vale derrubar por isto
  }
}
