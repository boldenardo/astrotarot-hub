// Utilitário de fuso horário — SOMENTE no servidor.
// Converte um identificador IANA (ex.: 'America/Sao_Paulo') no offset UTC em
// horas (número), formato exigido pela astrologyapi.com (campo tzone).

// @ts-expect-error — tz-lookup não traz tipos próprios
import tzLookup from "tz-lookup";

/**
 * Retorna o offset UTC em horas para o fuso informado, na data informada
 * (respeita horário de verão quando aplicável). Ex.: 'America/Sao_Paulo' → -3;
 * 'Asia/Kolkata' → 5.5. Em caso de falha, retorna -3 (Brasília).
 */
export function tzOffsetHours(timeZone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const part = formatter
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;

    if (!part) return -3;

    // Formatos possíveis: 'GMT-3', 'GMT+5:30', 'GMT' (UTC puro).
    const match = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(part.trim());
    if (!match) return -3;
    if (!match[2]) return 0; // 'GMT' sem offset = UTC

    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = match[3] ? Number(match[3]) : 0;
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return -3;

    return sign * (hours + minutes / 60);
  } catch {
    return -3;
  }
}

/**
 * Offset UTC (em horas) correto para um nascimento: deriva o fuso IANA a partir
 * das coordenadas e calcula o offset NO INSTANTE do nascimento (respeitando
 * horário de verão histórico). Um `timezone` explícito, quando informado, tem
 * prioridade sobre o lookup por coordenadas.
 */
export function birthTzone(
  lat: number,
  lon: number,
  birthUtcApprox: Date,
  explicitTimezone?: string | null
): number {
  let iana = explicitTimezone && explicitTimezone.trim() ? explicitTimezone : null;
  if (!iana) {
    try {
      iana = tzLookup(lat, lon);
    } catch {
      iana = null;
    }
  }
  return tzOffsetHours(iana ?? "America/Sao_Paulo", birthUtcApprox);
}
