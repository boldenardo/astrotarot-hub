// Cliente Supabase com service role — SOMENTE no servidor.
// Ignora RLS: usado para escrever plano/saldo de leituras a partir de
// webhooks Stripe e rotas de API. Nunca importar em componentes client.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.startsWith("COLE_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — copie em Supabase > Settings > API Keys."
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
