import { supabase } from "./supabase";

/**
 * Inicia o checkout do Stripe para o plano escolhido.
 * Redireciona o navegador para a página de pagamento do Stripe.
 */
export async function startCheckout(plan: "PACK5" | "PREMIUM"): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });

  if (res.status === 401) {
    window.location.href = "/auth/login?redirect=/cart";
    return;
  }

  let data: { url?: string; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // resposta sem corpo JSON — tratada abaixo
  }

  if (res.ok && data.url) {
    window.location.href = data.url;
    return;
  }

  throw new Error(
    data.error || "Não foi possível iniciar o pagamento. Tente novamente."
  );
}

/**
 * Busca histórico de pagamentos do usuário
 */
export async function getUserPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
