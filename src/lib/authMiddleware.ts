import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Middleware de autenticação e verificação de permissões
 */

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    subscription?: {
      plan: string;
      status: string;
      readingsLeft: number;
    };
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

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { subscription: true },
  });

  if (!user) {
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
  if (!user.subscription) return false;

  const sub = user.subscription;

  // Plano premium ativo
  if (sub.plan === "PREMIUM_MONTHLY" && sub.status === "active") {
    // Verificar se não expirou
    if (sub.endDate && new Date(sub.endDate) > new Date()) {
      return true;
    }
  }

  // Tem tiragens disponíveis
  if (sub.plan === "SINGLE_READING" && sub.readingsLeft > 0) {
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
  if (!user.subscription) {
    return { allowed: false, reason: "Nenhuma assinatura encontrada" };
  }

  const sub = user.subscription;

  // Premium ativo
  if (sub.plan === "PREMIUM_MONTHLY" && sub.status === "active") {
    if (sub.endDate && new Date(sub.endDate) > new Date()) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Assinatura expirada" };
  }

  // Tiragem única
  if (sub.readingsLeft > 0) {
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
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    // Se for premium, não consome
    if (
      subscription.plan === "PREMIUM_MONTHLY" &&
      subscription.status === "active"
    ) {
      return true;
    }

    // Se tiver tiragens, consome uma
    if (subscription.readingsLeft > 0) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          readingsLeft: {
            decrement: 1,
          },
        },
      });
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
