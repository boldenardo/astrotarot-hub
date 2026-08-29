// De qual PÁGINA da Hotmart cada produto do funil é vendido.
//
// A diferença estrutural em relação à Stripe: lá o servidor montava o
// preço na hora (bumps marcados, carta de desconto, moeda do país). Aqui
// cada oferta é uma página fixa criada no painel da Hotmart, e o que
// mandamos é a pessoa para o link certo. O preço vive lá, não aqui.
//
// Consequência que precisa estar clara para quem mexer nisto: enquanto o
// provider for `hotmart`, o checkout próprio (/quiz/checkout) sai do
// caminho, e com ele as cartas de desconto, os order bumps ao vivo e o
// preço em rand.
//
// O que se ganha em troca é para venda INTERNACIONAL (o público real é
// África do Sul, Índia, Nepal, Tanzânia, EUA — não Brasil): a Hotmart é
// merchant of record, processa com adquirência própria em vários países e
// oferece PayPal, que é a saída de quem tem cartão bloqueado para
// e-commerce internacional — o `transaction_not_allowed` que derrubou a
// venda de 29/08. O checkout também converte a moeda por país sozinho.
//
// Cada URL entra por env, sem deploy: criar a oferta no painel e colar o
// link na Vercel liga aquele produto.

// Produto AstroTarot na conta CNS NEGOCIOS DIGITAIS LTDA (lido do painel
// em 29/08): ID 8387609, código V107320990D, oferta base `msxqi5zi` a
// US$ 14,99 — o MESMO preço que o funil anuncia hoje.
//
// O link vai como padrão no código, e não só em env, pelo mesmo motivo dos
// price ids da Stripe: ele não é segredo (aparece na barra de endereço de
// qualquer comprador) e assim a troca de gateway não depende de a env ter
// chegado na Vercel. A env continua tendo prioridade.
const FRONT_DEFAULT = "https://pay.hotmart.com/V107320990D?off=msxqi5zi";

/** Plano do funil → env com a URL da oferta na Hotmart. */
const OFFER_ENV: Record<string, string | undefined> = {
  // O produto principal: a leitura completa com o retrato.
  FRONT_READING: process.env.HOTMART_CHECKOUT_URL_FRONT || FRONT_DEFAULT,
  // Downsell de quem recusou o front.
  DOWNSELL_19: process.env.HOTMART_CHECKOUT_URL_DOWNSELL,
  // Só o retrato, do e-mail de abandono.
  DOWNSELL_PORTRAIT: process.env.HOTMART_CHECKOUT_URL_PORTRAIT,
  // Order bump vendido avulso dentro da conta.
  CORD_READING: process.env.HOTMART_CHECKOUT_URL_CORD,
  // OTO pós-compra.
  OTO_PASTLIFE: process.env.HOTMART_CHECKOUT_URL_OTO,
  // Assinaturas — só ligam quando existir produto de assinatura no painel.
  SUB_MONTHLY: process.env.HOTMART_CHECKOUT_URL_SUB_MONTHLY,
  SUB_SEMIANNUAL: process.env.HOTMART_CHECKOUT_URL_SUB_SEMIANNUAL,
  SUB_ANNUAL: process.env.HOTMART_CHECKOUT_URL_SUB_ANNUAL,
  // Legado (e-mails já enviados, páginas em cache).
  PACK5: process.env.HOTMART_CHECKOUT_URL_PACK5,
};

/**
 * A URL de checkout da Hotmart para este plano, já com o e-mail
 * pré-preenchido e a variante do funil no rastreio.
 *
 * Devolve `null` quando não há oferta configurada — e quem chama traduz
 * isso em erro explícito. Nunca inventa um link nem cai para outro plano:
 * mandar a pessoa para a oferta errada cobra o valor errado.
 */
export function hotmartCheckoutUrl(
  plan: string,
  opts: { email: string; variant?: string | null }
): string | null {
  const base = OFFER_ENV[plan];
  if (!base) return null;
  try {
    const url = new URL(base);
    // `email` pré-preenche o checkout; `sck` é o parâmetro de rastreio
    // nativo da Hotmart e volta nos relatórios de venda, o que mantém a
    // atribuição por braço do funil depois da troca de gateway.
    url.searchParams.set("email", opts.email);
    const variant =
      typeof opts.variant === "string" ? opts.variant.trim().slice(0, 40) : "";
    if (variant) url.searchParams.set("sck", variant);
    return url.toString();
  } catch {
    // Env com URL malformada: melhor 503 explícito do que redirect quebrado.
    return null;
  }
}

/** Os planos que já têm oferta criada no painel. Serve ao diagnóstico. */
export function configuredHotmartPlans(): string[] {
  return Object.entries(OFFER_ENV)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);
}
