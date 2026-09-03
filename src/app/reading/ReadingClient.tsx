"use client";

// A leitura comprada, aberta por link — SEM cadastro.
//
// É a tela que a primeira compradora da Hotmart não teve. O caminho era
// e-mail → criar conta no Clerk → achar /soulmate → apertar "Draw my
// soulmate" → esperar. Quatro barreiras entre pagar e ver, e a primeira
// venda travou na primeira delas: treze horas depois de aprovada, nenhum
// retrato existia.
//
// Aqui a página chega e o retrato já está pronto (o webhook manda gerar no
// instante da aprovação). Se ainda não estiver, ela mesma pede a geração e
// mostra o desenho acontecendo — nunca um botão a mais para apertar.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Sparkles, Download } from "lucide-react";
import { POSITIONS } from "@/lib/soulmate-reading";

interface Card {
  position: string;
  arcanum: number;
  name: string;
  image: string;
}
interface Dossier {
  appearance: string;
  traits: string[];
  meeting_window: string;
  how_to_recognize: string;
  obstacle?: string;
  next_step?: string;
  closing: string;
  cards?: Card[] | null;
}
interface State {
  status: "ready" | "pending" | "not_purchased";
  portrait_pending?: boolean;
  name?: string | null;
  sign?: string | null;
  image_url?: string | null;
  preview_url?: string | null;
  dossier?: Dossier | null;
}

/** Quanto tempo esperamos o retrato antes de assumir que falhou. */
const MAX_WAIT_MS = 3 * 60 * 1000;

export default function ReadingClient() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const beganAt = useRef(Date.now());

  const creds = useCallback(() => {
    const sp = new URLSearchParams(window.location.search);
    return { e: sp.get("e") ?? "", t: sp.get("t") ?? "" };
  }, []);

  const load = useCallback(async (): Promise<State | null> => {
    const { e, t } = creds();
    const res = await fetch(`/api/reading?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}`);
    if (res.status === 403) {
      setError("This link is no longer valid. Please use the link from your purchase email.");
      return null;
    }
    const data = (await res.json()) as State;
    setState(data);
    return data;
  }, [creds]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const first = await load();
      if (!first || first.status !== "pending") return;

      // Ainda não existe: pede a geração UMA vez e fica olhando. O POST é
      // idempotente no servidor, então uma corrida com o webhook não gera
      // dois retratos nem cobra duas vezes.
      const { e, t } = creds();
      void fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e, t }),
      }).catch(() => {});

      const tick = window.setInterval(async () => {
        if (Date.now() - beganAt.current > MAX_WAIT_MS) {
          window.clearInterval(tick);
          setError(
            "The drawing is taking longer than usual. Your purchase is safe — reload this page in a few minutes and it will be here."
          );
          return;
        }
        const s = await load();
        // Só para de olhar quando o DESENHO chega. A leitura costuma
        // aparecer antes dele, e a página já a mostra enquanto espera.
        if (s && s.status === "ready" && !s.portrait_pending) {
          window.clearInterval(tick);
        }
      }, 5000);
    })();
  }, [load, creds]);

  const first = state?.name?.trim().split(/\s+/)[0];

  if (error) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="text-[15px] leading-relaxed text-white/80">{error}</p>
        <Link
          href="/"
          className="btn-ghost mt-6 inline-flex min-h-[48px] items-center rounded-full px-8 font-medium"
        >
          Back to AstroTarot
        </Link>
      </div>
    );
  }

  // Enquanto carrega ou enquanto desenha, a MESMA tela: ela não precisa
  // saber a diferença entre "buscando" e "gerando", só que está vindo.
  if (!state || state.status === "pending") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" aria-hidden />
        <p className="mt-5 font-display text-[1.4rem] leading-tight text-white">
          {first ? `${first}, your portrait is being drawn.` : "Your portrait is being drawn."}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/70">
          This takes about a minute. Keep this page open &mdash; it appears here
          on its own, and this link keeps working if you close it.
        </p>
      </div>
    );
  }

  if (state.status === "not_purchased") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="text-[15px] leading-relaxed text-white/80">
          We could not find a purchase on this email yet. If you just paid, give
          it a minute and reload &mdash; the confirmation can take a moment.
        </p>
      </div>
    );
  }

  const d = state.dossier;
  const cards = d?.cards ?? null;

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-24 pt-10">
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
          Your reading
        </p>
        <h1 className="mt-3 font-display text-[1.7rem] leading-tight text-white">
          {first ? `${first}, here they are.` : "Here they are."}
        </h1>
      </header>

      {/* O desenho ainda vindo: diz onde ele está, sem esconder a
          leitura que já está pronta logo abaixo. */}
      {state.portrait_pending && (
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-gold-400/[0.06] p-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold-400" aria-hidden />
          <p className="text-[14px] leading-snug text-white/80">
            Your portrait is still being drawn. Your reading is below and it is
            final &mdash; the face appears on this same page, and the link in
            your email always brings you back.
          </p>
        </div>
      )}

      {/* O RETRATO. É o que ela comprou. */}
      {(state.image_url || state.preview_url) && (
        <figure className="glass glass-gold mt-7 overflow-hidden rounded-3xl">
          <Image
            src={(state.image_url ?? state.preview_url) as string}
            alt="Your soulmate portrait"
            width={1024}
            height={1024}
            unoptimized
            priority
            className="h-auto w-full"
          />
        </figure>
      )}

      {state.image_url && (
        <a
          href={state.image_url}
          download="my-soulmate.png"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full font-medium"
        >
          <Download className="h-4 w-4" aria-hidden /> Save my portrait
        </a>
      )}

      {d && (
        <div className="glass mt-6 rounded-3xl p-6">
          <h2 className="font-display text-xl text-white">What Master Aura saw</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/85">
            {d.appearance}
          </p>

          {d.traits?.length > 0 && (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {d.traits.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-white/85">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
            {[
              ["When your paths cross", d.meeting_window],
              ["How you'll recognize them", d.how_to_recognize],
              ["What may be standing between you", d.obstacle],
              ["What the cards suggest doing next", d.next_step],
            ].map(([title, body]) =>
              body ? (
                <div key={title as string}>
                  <h3 className="text-sm font-semibold text-gold-300">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-white/85">
                    {body}
                  </p>
                </div>
              ) : null
            )}
            {d.closing && (
              <p className="text-[15px] leading-relaxed text-white/75">{d.closing}</p>
            )}
          </div>

          {/* As cinco cartas, agora todas abertas — fecha o laço da
              revelação, onde três ficaram viradas para baixo. */}
          {cards && cards.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold text-gold-300">Your five cards</h3>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {cards.map((c) => (
                  <div key={c.position} className="text-center">
                    <Image
                      src={c.image}
                      alt=""
                      width={160}
                      height={272}
                      className="h-auto w-full rounded-lg border border-white/10"
                    />
                    <p
                      translate="no"
                      className="notranslate mt-1 text-[10px] font-semibold text-gold-300"
                    >
                      {c.position}
                    </p>
                    <p className="text-[9px] leading-tight text-white/50">
                      {POSITIONS.find((p) => p.id === c.position)?.title ?? c.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-[13px] leading-relaxed text-white/45">
        This link is yours &mdash; keep the email and you can come back to this
        page any time.
      </p>
    </div>
  );
}
