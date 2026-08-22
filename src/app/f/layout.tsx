import Image from "next/image";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/LocaleProvider";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale } from "@/lib/i18n";

// Casca dos funis experimentais (/f/*): mesma identidade do /quiz — sem
// navbar, sem footer, sem saídas; a marca não é link.
export default async function FunnelsLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const raw = store.get(LANG_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <LocaleProvider initialLocale={locale}>
      <div className="relative min-h-dvh overflow-x-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(700px 420px at 50% -8%, rgba(124, 92, 255, 0.16), transparent 60%), radial-gradient(520px 340px at 88% 12%, rgba(212, 175, 55, 0.08), transparent 55%), radial-gradient(600px 420px at 8% 92%, rgba(124, 92, 255, 0.08), transparent 60%)",
          }}
        />
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
        <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-10 pt-20">
          {children}
        </main>
      </div>
    </LocaleProvider>
  );
}
