import { supabase } from "./supabase";

/**
 * Cria um novo pagamento usando Edge Function
 */
export async function createPayment(data: {
  type: "SINGLE_READING" | "SUBSCRIPTION";
  customerName?: string;
}) {
  const { data: result, error } = await supabase.functions.invoke(
    "create-payment",
    {
      body: data,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return result;
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

/**
 * Busca um pagamento específico
 */
export async function getPaymentById(id: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Verifica status de um pagamento
 */
export async function checkPaymentStatus(pixupPaymentId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("pixup_payment_id", pixupPaymentId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
