// GET /api/me — perfil do usuário logado (plano, saldo de leituras, dados).
// Provisiona a linha em `users` na primeira vez (via requireUser).

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/plan-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  return NextResponse.json({ profile: gate.profile });
}
