import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * Middleware de autenticação e verificação de permissões
 */

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    subscription_plan?: string;
    subscription_status?: string;
    readings_left?: number;
  };
}

/**
 * Verifica se o usuário está autenticado e retorna seus dados
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: any; error?: null } | { user: null; error: NextResponse }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      user: null,
      error: NextResponse.json({ error: "Token inválido" }, { status: 401 }),
    };
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", decoded.userId)
    .single();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      ),
    };
  }

  return { user };
}

/**
 * Verifica se o usuário tem permissão para acessar conteúdo premium
 */
export function checkPremiumAccess(user: any): boolean {
  if (!user) return false;

  // Plano premium ativo
  if (
    user.subscription_plan === "PREMIUM_MONTHLY" &&
    user.subscription_status === "active"
  ) {
    // Verificar se não expirou
    if (
      user.subscription_end_date &&
      new Date(user.subscription_end_date) > new Date()
    ) {
      return true;
    }
  }

  // Tem tiragens disponíveis
  if (user.subscription_plan === "SINGLE_READING" && user.readings_left > 0) {
    return true;
  }

  return false;
}

/**
 * Verifica se o usuário pode fazer uma tiragem do tarot
 */
export function canMakeReading(user: any): {
  allowed: boolean;
  reason?: string;
} {
  if (!user) {
    return { allowed: false, reason: "Usuário não encontrado" };
  }

  // Premium ativo
  if (
    user.subscription_plan === "PREMIUM_MONTHLY" &&
    user.subscription_status === "active"
  ) {
    if (
      user.subscription_end_date &&
      new Date(user.subscription_end_date) > new Date()
    ) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Assinatura expirada" };
  }

  // Tiragem única
  if (user.readings_left > 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason:
      "Sem tiragens disponíveis. Adquira uma tiragem ou assine o plano Premium.",
  };
}

/**
 * Consume uma tiragem do contador do usuário
 */
export async function consumeReading(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("subscription_plan, subscription_status, readings_left")
      .eq("id", userId)
      .single();

    if (error || !user) return false;

    // Se for premium, não consome
    if (
      user.subscription_plan === "PREMIUM_MONTHLY" &&
      user.subscription_status === "active"
    ) {
      return true;
    }

    // Se tiver tiragens, consome uma
    if (user.readings_left > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ readings_left: user.readings_left - 1 })
        .eq("id", userId);

      if (updateError) {
        console.error("Erro ao consumir tiragem:", updateError);
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro ao consumir tiragem:", error);
    return false;
  }
}

/**
 * Rotas que são sempre livres (FREE)
 */
export const FREE_ROUTES = [
  "/",
  "/challenge", // Jogo de 4 cartas grátis
  "/auth/login",
  "/auth/register",
];

/**
 * Rotas que requerem pagamento
 */
export const PREMIUM_ROUTES = [
  "/tarot", // Tiragem do tarot egípcio - R$ 9,90 ou Premium
  "/compatibility", // Compatibilidade - Premium
  "/predictions", // Previsões - Premium
  "/abundance", // Abundância - Premium
  "/personality", // Personalidade - Premium
  "/guia", // Guia espiritual - Premium
];

/**
 * Verifica se a rota requer premium
 */
export function isProtectedRoute(pathname: string): boolean {
  return PREMIUM_ROUTES.some((route) => pathname.startsWith(route));
}
