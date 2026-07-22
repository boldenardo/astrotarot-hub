// GET /api/health — production diagnostics.
// Reports ONLY booleans (never values) for each required env var, plus a live
// database connectivity check using the service-role client. Safe to expose.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Remove qualquer coisa parecida com token/JWT de mensagens de erro antes de
// expor — mensagens de bibliotecas podem ecoar valores de headers.
function redactSecrets(message: string): string {
  return message
    .replace(/eyJ[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]{5,}){0,2}/g, "[redacted]")
    .replace(/(sk|pk|whsec|gsk|ak)[_-][A-Za-z0-9_-]{8,}/g, "[redacted]")
    .slice(0, 300);
}

function present(
  value: string | undefined | null,
  placeholderPrefixes: string[] = []
): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !placeholderPrefixes.some((p) =>
    trimmed.toUpperCase().startsWith(p.toUpperCase())
  );
}

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: present(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    SUPABASE_SERVICE_ROLE_KEY: present(process.env.SUPABASE_SERVICE_ROLE_KEY, [
      "COLE_",
    ]),
    CLERK_SECRET_KEY: present(process.env.CLERK_SECRET_KEY),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: present(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ),
    STRIPE_SECRET_KEY: present(process.env.STRIPE_SECRET_KEY, ["cole_"]),
    STRIPE_WEBHOOK_SECRET: present(process.env.STRIPE_WEBHOOK_SECRET, [
      "cole_",
    ]),
    STRIPE_PRICE_READINGS_PACK: present(
      process.env.STRIPE_PRICE_READINGS_PACK
    ),
    STRIPE_PRICE_PREMIUM_MONTHLY: present(
      process.env.STRIPE_PRICE_PREMIUM_MONTHLY
    ),
    GROQ_API_KEY: present(process.env.GROQ_API_KEY),
    ASTROLOGY_API_KEY: present(process.env.ASTROLOGY_API_KEY, ["cole_"]),
    NEXT_PUBLIC_APP_URL: present(process.env.NEXT_PUBLIC_APP_URL),
  };

  let db: { ok: boolean; code?: string; message?: string } = { ok: false };
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { getSupabaseAdmin } = await import("@/lib/server/supabase-admin");
      const admin = getSupabaseAdmin();
      const { error } = await admin
        .from("users")
        .select("id", { head: true, count: "exact" })
        .limit(1);
      db = error
        ? { ok: false, code: error.code, message: redactSecrets(error.message) }
        : { ok: true };
    } catch (e) {
      db = {
        ok: false,
        message: redactSecrets(e instanceof Error ? e.message : "unknown"),
      };
    }
  } else {
    db = { ok: false, message: "Supabase env vars missing in this deployment" };
  }

  const missing = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return NextResponse.json({
    ok: missing.length === 0 && db.ok,
    missing,
    env,
    db,
  });
}
