// Geocodificação de cidades via Nominatim (OpenStreetMap) — SOMENTE no servidor.
// Sem chave de API; exige apenas um User-Agent identificável.

export interface GeoPoint {
  lat: number;
  lon: number;
}

/**
 * Busca as coordenadas de uma cidade (opcionalmente com país).
 * Retorna null em qualquer erro — quem chama decide o fallback.
 */
export async function geocodeCity(
  city: string,
  country?: string
): Promise<GeoPoint | null> {
  try {
    const query = country ? `${city},${country}` : city;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "astrotarot-hub/1.0" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = Number.parseFloat(data[0]?.lat ?? "");
    const lon = Number.parseFloat(data[0]?.lon ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

    return { lat, lon };
  } catch {
    return null;
  }
}
