// Autenticação + gating de plano para rotas de API (App Router).
// Toda rota de feature deve passar por aqui antes de gastar créditos
// de APIs externas (astrologyapi.com, Groq).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "./supabase-admin";
import { isPremium, type PremiumFeature, FEATURE_LABELS } from "../plans";

export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  subscription_plan: string;
  subscription_status: string;
  readings_left: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

type GateResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; response: NextResponse };

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route handlers nem sempre podem gravar cookies; o middleware
            // já mantém a sessão renovada.
          }
        },
      },
    }
  );
}

/** Exige usuário logado; retorna o perfil da tabela `users`. */
export async function requireUser(): Promise<GateResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Faça login para continuar.", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (error || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Perfil de usuário não encontrado.", code: "PROFILE_NOT_FOUND" },
        { status: 404 }
      ),
    };
  }

  return { ok: true, profile: profile as UserProfile };
}

/** Exige plano Premium Ilimitado ativo para a feature indicada. */
export async function requirePremium(
  feature: PremiumFeature
): Promise<GateResult> {
  const gate = await requireUser();
  if (!gate.ok) return gate;

  if (!isPremium(gate.profile)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `${FEATURE_LABELS[feature]} é exclusivo do plano Premium Ilimitado (US$ 29,90/mês).`,
          code: "PREMIUM_REQUIRED",
          feature,
        },
        { status: 403 }
      ),
    };
  }

  return gate;
}

type ConsumeResult =
  | { ok: true; readingsLeft: number | "ilimitado" }
  | { ok: false; response: NextResponse };

/**
 * Consome 1 leitura do saldo (atômico, via função SQL consume_reading).
 * Premium ativo não consome saldo.
 */
export async function consumeReading(
  profile: UserProfile
): Promise<ConsumeResult> {
  if (isPremium(profile)) {
    return { ok: true, readingsLeft: "ilimitado" };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("consume_reading", {
    p_user_id: profile.id,
  });

  if (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Erro ao registrar a leitura. Tente novamente.", code: "CONSUME_FAILED" },
        { status: 500 }
      ),
    };
  }

  if (data === null || data === undefined) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Você não tem leituras disponíveis. Compre o Pacote 5 Leituras (US$ 9,99) ou assine o Premium Ilimitado (US$ 29,90/mês).",
          code: "NO_READINGS_LEFT",
          needsPayment: true,
        },
        { status: 402 }
      ),
    };
  }

  return { ok: true, readingsLeft: data as number };
}
