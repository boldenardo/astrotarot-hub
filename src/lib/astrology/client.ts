// AstrologyAPI.com client — SERVER-SIDE ONLY.
// Credentials live in env (no NEXT_PUBLIC_) so they never reach the browser,
// and every call goes out from our own server → no CORS, no leaked key.

const BASE_URL =
  process.env.ASTROLOGY_API_BASE_URL ?? "https://json.astrologyapi.com/v1";
const USER_ID = process.env.ASTROLOGY_API_USER_ID ?? "";
const API_KEY = process.env.ASTROLOGY_API_KEY ?? "";

/** Default response language for the API (signs, aspects, etc.). */
export const DEFAULT_LANGUAGE = "en";

export interface BirthInput {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number; // UTC offset in hours, e.g. -5 (New York), -3 (São Paulo)
}

export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value.toLowerCase());
}

export function isConfigured(): boolean {
  return Boolean(API_KEY) && !API_KEY.startsWith("cole_");
}

// Chaves novas ("ak-...") autenticam sozinhas via header x-astrologyapi-key;
// contas antigas usam Basic Auth com USER_ID + API_KEY.
function authHeaders(): Record<string, string> {
  if (!USER_ID || USER_ID.startsWith("cole_") || API_KEY.startsWith("ak-")) {
    return { "x-astrologyapi-key": API_KEY };
  }
  const token = Buffer.from(`${USER_ID}:${API_KEY}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

/** Low-level POST helper. Returns parsed JSON or throws with a useful message. */
export async function callAstrologyApi<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
  language = DEFAULT_LANGUAGE
): Promise<T> {
  if (!isConfigured()) {
    throw new Error("AstrologyAPI credentials missing (ASTROLOGY_API_KEY).");
  }

  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      "Accept-Language": language,
    },
    body: JSON.stringify(body),
    // Astrology data changes at most daily — cache to spare API credits.
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AstrologyAPI '${endpoint}' failed: ${res.status} ${detail}`);
  }

  return (await res.json()) as T;
}

// ---- Typed endpoint wrappers ----

/** Full natal chart: planets, houses and aspects (tropical / western). */
export function westernHoroscope(birth: BirthInput, language = DEFAULT_LANGUAGE) {
  return callAstrologyApi("western_horoscope", { ...birth }, language);
}

/** Daily transits relative to the natal chart. */
export function dailyTransits(birth: BirthInput, language = DEFAULT_LANGUAGE) {
  return callAstrologyApi("tropical_transits/daily", { ...birth }, language);
}

/** Natal wheel chart (returns a chart image URL). */
export function natalWheelChart(birth: BirthInput) {
  return callAstrologyApi("natal_wheel_chart", { ...birth });
}

/** Daily horoscope prediction for a sun sign. */
export function dailySunSign(sign: ZodiacSign, language = DEFAULT_LANGUAGE) {
  return callAstrologyApi(`sun_sign_prediction/daily/${sign}`, {}, language);
}

/** Synastry (relationship compatibility) between two birth charts. */
export function synastry(p: BirthInput, s: BirthInput, language = DEFAULT_LANGUAGE) {
  return callAstrologyApi(
    "synastry_horoscope",
    {
      p_day: p.day, p_month: p.month, p_year: p.year, p_hour: p.hour, p_min: p.min, p_lat: p.lat, p_lon: p.lon, p_tzone: p.tzone,
      s_day: s.day, s_month: s.month, s_year: s.year, s_hour: s.hour, s_min: s.min, s_lat: s.lat, s_lon: s.lon, s_tzone: s.tzone,
    },
    language
  );
}
