// Helpers de dados do usuário no client — falam com as rotas /api/me
// (autenticadas via Clerk + service role). O client NÃO acessa o Supabase
// diretamente, então o RLS permanece como tranca extra.

export interface MeProfile {
  id: string;
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

export interface MeReading {
  id: string;
  cards: unknown;
  interpretation: string | null;
  spread_type: string | null;
  deck_type: string | null;
  is_premium: boolean;
  created_at: string;
}

/** Perfil do usuário logado, ou null se não autenticado. */
export async function getMyProfile(): Promise<MeProfile | null> {
  const res = await fetch("/api/me", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load profile.");
  const data = await res.json();
  return data.profile as MeProfile;
}

/** Histórico de leituras de tarot do usuário. */
export async function getMyReadings(limit = 5): Promise<MeReading[]> {
  const res = await fetch(`/api/me/readings?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.readings ?? []) as MeReading[];
}

/** Atualiza nome + dados de nascimento; retorna o perfil atualizado. */
export async function updateMyProfile(updates: {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
}): Promise<MeProfile> {
  const res = await fetch("/api/me/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save profile.");
  }
  const data = await res.json();
  return data.profile as MeProfile;
}
