import { supabase } from "./supabase";

/** Erro de API com status HTTP e código de negócio (ex.: NO_READINGS_LEFT). */
export class TarotApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TarotApiError";
    this.status = status;
    this.code = code;
  }
}

export interface TarotReadingResponse {
  success: true;
  reading: {
    id: string;
    cards: unknown;
    interpretation: string;
    createdAt: string;
  };
  readingsLeft: number | "unlimited";
}

/**
 * Creates a new Tarot reading via the Next.js API route.
 */
export async function createTarotReading(data: {
  selectedCards: Array<{
    name: string;
    number: number;
    meaning?: string;
    description?: string;
  }>;
  question?: string;
}): Promise<TarotReadingResponse> {
  const res = await fetch("/api/tarot/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok) {
    throw new TarotApiError(
      result?.error || "Não foi possível gerar sua leitura agora.",
      res.status,
      result?.code
    );
  }

  return result as TarotReadingResponse;
}

/**
 * Busca histórico de leituras do usuário
 */
export async function getUserReadings() {
  const { data, error } = await supabase
    .from("tarot_readings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Busca uma leitura específica
 */
export async function getReadingById(id: string) {
  const { data, error } = await supabase
    .from("tarot_readings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
