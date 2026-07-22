// Autenticação + gating de plano para rotas de API (App Router).
// Toda rota de feature deve passar por aqui antes de gastar créditos
// de APIs externas (astrologyapi.com, Groq).

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "./supabase-admin";
import { isPremium, type PremiumFeature, FEATURE_LABELS } from "../plans";

export interface UserProfile {
  id: string;
  clerk_user_id: string | null;
  auth_id: string | null;
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

const unauthorized = (): GateResult => ({
  ok: false,
  response: NextResponse.json(
    { error: "Please sign in to continue.", code: "AUTH_REQUIRED" },
    { status: 401 }
  ),
});

/**
 * Garante uma linha em `users` para o usuário do Clerk (cria na primeira vez —
 * "provisionamento lazy"). Isto substitui o trigger handle_new_user do
 * Supabase Auth e faz o fluxo "comprar e já entrar" funcionar.
 */
async function provisionProfile(clerkUserId: string): Promise<UserProfile | null> {
  const admin = getSupabaseAdmin();

  const existing = await admin
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (existing.data) return existing.data as UserProfile;

  // Primeira vez: puxa e-mail/nome do Clerk e cria (ou vincula por e-mail).
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress ??
    `${clerkUserId}@clerk.local`;
  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim() ||
    cu?.username ||
    null;

  const inserted = await admin
    .from("users")
    .insert({
      clerk_user_id: clerkUserId,
      email,
      name,
      subscription_plan: "FREE",
      subscription_status: "active",
      readings_left: 4,
    })
    .select("*")
    .single();

  if (!inserted.error && inserted.data) return inserted.data as UserProfile;

  // E-mail já existe (usuário legado do Supabase Auth): vincula o clerk_user_id.
  if ((inserted.error as { code?: string })?.code === "23505") {
    const linked = await admin
      .from("users")
      .update({ clerk_user_id: clerkUserId })
      .eq("email", email)
      .select("*")
      .maybeSingle();
    if (linked.data) return linked.data as UserProfile;
    console.error("[plan-gate] email-link update failed:", linked.error);
  }

  console.error("[plan-gate] provision insert failed:", inserted.error);
  return null;
}

/** Exige usuário logado (Clerk); retorna/provisiona o perfil da tabela `users`. */
export async function requireUser(): Promise<GateResult> {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  let profile: UserProfile | null = null;
  try {
    profile = await provisionProfile(userId);
  } catch (e) {
    // Nunca deixar virar 500 sem corpo: loga o motivo real (visível nos logs
    // da Vercel) e devolve um código que aponta para configuração do servidor.
    console.error("[plan-gate] provisionProfile threw:", e);
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Server configuration error.",
          code: "SERVER_MISCONFIGURED",
          detail: e instanceof Error ? e.message : "unknown",
        },
        { status: 500 }
      ),
    };
  }

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "We couldn't load your profile.", code: "PROFILE_ERROR" },
        { status: 500 }
      ),
    };
  }

  return { ok: true, profile };
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
          error: `${FEATURE_LABELS[feature]} is exclusive to the Unlimited Premium plan ($29.90/month).`,
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
  | { ok: true; readingsLeft: number | "unlimited" }
  | { ok: false; response: NextResponse };

/**
 * Consumes 1 reading from the balance (atomic, via the consume_reading SQL
 * function). Active premium users don't consume the balance.
 */
export async function consumeReading(
  profile: UserProfile
): Promise<ConsumeResult> {
  if (isPremium(profile)) {
    return { ok: true, readingsLeft: "unlimited" };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("consume_reading", {
    p_user_id: profile.id,
  });

  if (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to record the reading. Please try again.", code: "CONSUME_FAILED" },
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
            "You have no readings left. Buy the 5-Reading Pack ($9.99) or subscribe to Unlimited Premium ($29.90/month).",
          code: "NO_READINGS_LEFT",
          needsPayment: true,
        },
        { status: 402 }
      ),
    };
  }

  return { ok: true, readingsLeft: data as number };
}
