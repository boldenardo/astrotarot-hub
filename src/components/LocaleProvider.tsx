"use client";

// Fornece o idioma do funil às telas client.
//
// O valor inicial vem do SERVIDOR (cookie gravado pelo middleware a partir
// do Accept-Language), então a primeira tela já sai traduzida — sem flash
// de inglês. Depois da hidratação, navigator.language confirma: se o
// browser diz outra coisa (cache antigo, VPN, perfil), corrigimos e
// regravamos o cookie.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  localeFromNavigator,
  type Locale,
} from "@/lib/i18n";
import { getQuizContent, type QuizContent } from "@/lib/i18n/content";

const LocaleContext = createContext<QuizContent>(getQuizContent(DEFAULT_LOCALE));

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const fromBrowser = localeFromNavigator();
    if (fromBrowser !== locale) {
      setLocale(fromBrowser);
      document.cookie = `${LANG_COOKIE}=${fromBrowser}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    }
    // Só na montagem: trocar de idioma no meio do funil confundiria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = useMemo(() => getQuizContent(locale), [locale]);

  return (
    <LocaleContext.Provider value={content}>{children}</LocaleContext.Provider>
  );
}

/** Conteúdo do funil no idioma ativo (steps, textos de UI, etc.). */
export function useQuizContent(): QuizContent {
  return useContext(LocaleContext);
}
