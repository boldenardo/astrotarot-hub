import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/LocaleProvider";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Free Soulmate Tarot Reading | AstroTarot",
  description:
    "Answer 8 quick questions and let the cards reveal who your soulmate is, what they're like and when your paths cross.",
  alternates: {
    canonical: "https://astrotarot.shop/quiz",
  },
};

// Funnel layout: no navbar, no footer, no exits. Brand mark is NOT a link.
export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Idioma vem do cookie que o middleware grava a partir do Accept-Language:
  // assim o HTML do servidor já sai traduzido, sem flash de inglês.
  const store = await cookies();
  const raw = store.get(LANG_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <LocaleProvider initialLocale={locale}>{renderShell(children)}</LocaleProvider>
  );
}

function renderShell(children: React.ReactNode) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(700px 420px at 50% -8%, rgba(124, 92, 255, 0.16), transparent 60%), radial-gradient(520px 340px at 88% 12%, rgba(212, 175, 55, 0.08), transparent 55%), radial-gradient(600px 420px at 8% 92%, rgba(124, 92, 255, 0.08), transparent 60%)",
        }}
      />

      {/* Brand mark: ancorada no TOPO DA PÁGINA (absolute), não na viewport —
          ao rolar ela sai de vista em vez de flutuar sobre o conteúdo.
          Não é link: o funil não tem saídas. */}
      <div className="absolute inset-x-0 top-0 z-40 flex justify-center pt-5">
        <span className="flex items-center gap-2.5 text-lg font-semibold tracking-wide sm:text-xl">
          <Image
            src="/brand/astrotarot-logo.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-9 w-9 object-contain drop-shadow-[0_0_14px_rgba(212,175,55,0.45)] sm:h-10 sm:w-10"
          />
          <span className="text-gold">AstroTarot</span>
        </span>
      </div>

      {/* Centered content column */}
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-10 pt-20">
        {children}
      </main>
    </div>
  );
}
