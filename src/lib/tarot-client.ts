import { supabase } from "./supabase";

/**
 * Cria uma nova leitura de Tarot usando Edge Function
 */
export async function createTarotReading(data: {
  selectedCards: Array<{
    name: string;
    number: number;
    meaning?: string;
    description?: string;
  }>;
  question?: string;
}) {
  const { data: result, error } = await supabase.functions.invoke(
    "create-tarot-reading",
    {
      body: data,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return result;
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
