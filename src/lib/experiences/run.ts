// Runner compartilhado das rotas /api/experiences/*:
//   requireUser → pré-checagem de saldo (barata) → IA → SÓ ENTÃO consome
//   1 crédito (free) → persiste (best-effort) → responde.
// Premium = ilimitado. Falha da IA = ninguém é cobrado (mesma ordem do tarô).

import { NextResponse } from "next/server";
import {
  requireUser,
  consumeReading,
  hasEntitlement,
  type AddonFeature,
  type UserProfile,
} from "@/lib/server/plan-gate";
import { isPremium, hasReadingsLeft } from "@/lib/plans";
import { groqChatJson } from "@/lib/server/groq";
import { persistExperience } from "./persist";
import type { ExperienceResult } from "./types";

export async function runExperience<T extends ExperienceResult>(params: {
  kind: "ritual" | "dream" | "past-life" | "connection";
  subtype?: string | null;
  system: string;
  /** Prompt do usuário — pode depender do perfil (nome, signo). */
  user: string | ((profile: UserProfile) => string);
  maxTokens?: number;
  /** Normaliza o JSON cru da LLM no contrato da UI (defensivo). */
  shape: (raw: Record<string, unknown>, profile: UserProfile) => T;
  input?: Record<string, unknown>;
  /**
   * Entitlement que destrava esta experiência sem consumir crédito —
   * é como uma compra avulsa ($9 cord, $27 past life) vira funcionalidade.
   */
  freeWith?: AddonFeature;
}) {
  const gate = await requireUser();
  if (!gate.ok) return gate.response;
  const profile = gate.profile;

  const owned = params.freeWith
    ? await hasEntitlement(profile.id, params.freeWith)
    : false;

  if (!owned && !isPremium(profile) && !hasReadingsLeft(profile)) {
    return NextResponse.json(
      {
        error: "You have no readings left. Unlimited opens every experience.",
        code: "NO_READINGS_LEFT",
        needsPayment: true,
      },
      { status: 402 }
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = await groqChatJson<Record<string, unknown>>({
      system: params.system,
      user: typeof params.user === "function" ? params.user(profile) : params.user,
      maxTokens: params.maxTokens ?? 1400,
      temperature: 0.75,
    });
  } catch (e) {
    console.error(`[experiences/${params.kind}] AI failed:`, e);
    return NextResponse.json(
      { error: "Master Aura couldn't finish this reading. Please try again." },
      { status: 502 }
    );
  }

  let result: T;
  try {
    result = params.shape(raw, profile);
  } catch (e) {
    console.error(`[experiences/${params.kind}] bad shape:`, e);
    return NextResponse.json(
      { error: "Master Aura couldn't finish this reading. Please try again." },
      { status: 502 }
    );
  }

  // Compra avulsa não desconta crédito: a pessoa já pagou por ESTA feature.
  const consumed = owned
    ? ({ ok: true, readingsLeft: "unlimited" } as const)
    : await consumeReading(profile);
  if (!consumed.ok) return consumed.response;

  await persistExperience({
    userId: profile.id,
    kind: params.kind,
    subtype: params.subtype ?? null,
    result,
    input: params.input,
  });

  return NextResponse.json({
    success: true,
    result,
    readingsLeft: consumed.readingsLeft,
    premium: isPremium(profile),
  });
}

/* ---------- helpers de normalização (a LLM é criativa com tipos) ---------- */

export const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : fallback;

export const strList = (v: unknown, max = 8): string[] =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === "string").map((x) => (x as string).trim()).slice(0, max)
    : [];

export const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Sorteio de N arcanos egípcios distintos (1-22) — código, não LLM. */
export function drawEgyptian(n: number): number[] {
  const pool = Array.from({ length: 22 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Respostas enumeradas do chat (id → rótulo), saneadas. Nunca texto livre longo. */
export function cleanAnswers(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 12)) {
    if (typeof val === "string" && /^[a-zA-Z0-9_-]{1,40}$/.test(k)) out[k] = val.slice(0, 160);
  }
  return out;
}

/**
 * Limitador de taxa em memória por chave (IP) — suficiente para rotas
 * públicas de preview numa única instância; zera a cada cold start.
 */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max = 6, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (b.n >= max) return false;
  b.n++;
  return true;
}
