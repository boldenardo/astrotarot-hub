// Idioma do funil.
//
// Detecção em DUAS camadas, nesta ordem:
//   1. Middleware lê o header Accept-Language e grava o cookie `astro_lang`.
//      É o que o Safari e o Chrome enviam em toda requisição — então a
//      primeira tela já sai no idioma certo, sem flash de inglês.
//   2. No browser, navigator.language confirma/corrige (ex.: pessoa com
//      Accept-Language antigo em cache) e regrava o cookie.
//
// Sem rota /es: o funil é uma peça de conversão, não conteúdo indexável —
// duplicar URL só dividiria o tráfego pago e complicaria o SEO das páginas
// públicas, que seguem em inglês.

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LANG_COOKIE = "astro_lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** "es-419,es;q=0.9,en;q=0.8" → "es" */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const entries = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        q: q ? Number(q.slice(2)) || 0 : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    // "es", "es-es", "es-419", "es-mx"… todos caem em espanhol.
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Idioma do browser (client-side). Safari e Chrome expõem os dois campos. */
export function localeFromNavigator(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean) as string[];
  for (const tag of candidates) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
