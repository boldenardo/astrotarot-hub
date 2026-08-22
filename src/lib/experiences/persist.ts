// Persistência best-effort das experiências na tabela `experiences`
// (migration: supabase/migrations/20260821_experiences.sql). Se a tabela
// ainda não existir, a experiência funciona igual — só não fica no histórico.

import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import type { ExperienceResult } from "./types";

export async function persistExperience(params: {
  userId: string;
  kind: "ritual" | "dream" | "past-life" | "connection";
  subtype?: string | null;
  result: ExperienceResult;
  /** Entrada mínima (ids enumerados); nunca o relato livre inteiro. */
  input?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("experiences")
      .insert({
        user_id: params.userId,
        kind: params.kind,
        subtype: params.subtype ?? null,
        input: params.input ?? {},
        result: params.result,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("[experiences] persist skipped:", error.message);
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (e) {
    console.warn("[experiences] persist failed:", e);
    return null;
  }
}
