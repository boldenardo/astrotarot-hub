"use client";

// Porta de entrada do funil.
//
// A versão anterior era um bloco de texto centralizado: logo, título,
// parágrafo, botão. Correta e esquecível — nada na tela mostrava o que a
// pessoa vai ganhar.
//
// Agora o rosto borrado ocupa o centro. É a promessa inteira numa imagem,
// e é a peça que o funil já usa no reveal: quem começa aqui reconhece o
// final. O brilho que atravessa o retrato sugere que ele está sendo
// revelado — a lacuna de curiosidade fica visível em vez de descrita.
//
// Bilíngue desde o primeiro pixel: 84% do tráfego chega pela webview do
// Facebook e boa parte fala espanhol; a porta do funil não pode ser o
// único lugar em inglês.

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Star, Clock, Lock } from "lucide-react";
import { ZODIAC_SIGNS } from "@/lib/quiz-data";
import { PROOF_STATS } from "@/lib/proof-stats";
import { useQuizContent } from "@/components/LocaleProvider";
import CardBack from "@/components/CardBack";
import { trackEvent } from "@/lib/analytics";

// Headline reescrita em 26/08 para o tráfego FRIO que passou a pousar aqui
// (redirect da VSL + links de bio). A anterior — "Their face is already in
// your chart" — abria com um pronome sem dono: quem vinha do funil sabia
// quem era "their"; quem chega frio, não. A nova nomeia o desejo (Schwartz,
// mercado em sofisticação 3–4: promessa concreta + mecanismo) e troca
// "chart" (astrologia) por "cards" (a marca é tarot, e é o que o quiz usa).
// O aviso sob o CTA é o padrão do funil de referência (Psychic Marie):
// curiosidade + intensidade social no ponto exato da decisão.
const COPY = {
  en: {
    badge: "Free soulmate reading",
    h1a: "Your soulmate's face",
    h1b: "is already in your cards",
    caption: "Your soulmate",
    locked: "Revealed at the end of your reading",
    sub: "Answer a few questions and let your cards describe them — their look, their nature, and when your paths cross.",
    cta: "Reveal my soulmate",
    warning: "Most people are shocked by how specific their reading gets.",
    guided: "Master Aura reads your answers as you go.",
    guidedBy: "Guided by",
    minutes: "2 minutes",
    free: "Free",
    readings: "readings",
    quote:
      "The soulmate reading described him before we even met — down to details that still give me chills. Six months later, he walked into my life.",
    quoteBy: "Jessica L. — Miami, FL",
  },
  es: {
    badge: "Lectura de alma gemela gratis",
    h1a: "El rostro de tu alma gemela",
    h1b: "ya está en tus cartas",
    caption: "Tu alma gemela",
    locked: "Se revela al final de tu lectura",
    sub: "Responde unas preguntas y deja que tus cartas lo describan — cómo es, cómo se siente, y cuándo se cruzan sus caminos.",
    cta: "Revelar mi alma gemela",
    warning: "La mayoría se sorprende de lo específica que es su lectura.",
    guided: "Master Aura lee tus respuestas mientras avanzas.",
    guidedBy: "Guiada por",
    minutes: "2 minutos",
    free: "Gratis",
    readings: "lecturas",
    quote:
      "La lectura lo describió antes de que nos conociéramos — con detalles que todavía me erizan la piel. Seis meses después, entró en mi vida.",
    quoteBy: "Jessica L. — Miami, FL",
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.5, ease: "easeOut" },
  }),
};

export default function QuizLandingPage() {
  const { locale } = useQuizContent();
  const t = COPY[locale] ?? COPY.en;

  // Denominador da landing: sem este evento, quem chegava aqui e saía era
  // invisível — não dava para saber se a headline convertia ou espantava.
  const viewFiredRef = useRef(false);
  useEffect(() => {
    if (viewFiredRef.current) return;
    viewFiredRef.current = true;
    trackEvent("quiz_landing_view", { category: "quiz", locale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Barra fixa: aparece quando o botão principal sai da tela, para o CTA
  // nunca ficar fora do alcance do polegar numa página que rola.
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <motion.span
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.07)] px-4 py-1.5 text-xs font-medium tracking-wide text-[#e8d9a8]"
      >
        <Star className="h-3 w-3 fill-[#d4af37] text-[#d4af37]" aria-hidden />
        {t.badge}
      </motion.span>

      <motion.h1
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-5 text-balance text-4xl leading-[1.08] sm:text-5xl"
      >
        {t.h1a}{" "}
        <span className="text-gold drop-shadow-[0_0_22px_rgba(212,175,55,0.4)]">
          {t.h1b}
        </span>
        .
      </motion.h1>

      {/* O retrato: peça central da página. */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative mt-8 w-full max-w-[290px]"
      >
        {/* Cartas abertas atrás do retrato: liga o tarot à revelação. */}
        <div aria-hidden className="absolute inset-x-0 top-6 flex justify-center">
          <div className="relative h-[220px] w-[200px]">
            <div className="absolute left-0 top-4 h-[190px] w-[124px] -rotate-[18deg]">
              <CardBack className="h-full w-full opacity-70" />
            </div>
            <div className="absolute right-0 top-4 h-[190px] w-[124px] rotate-[18deg]">
              <CardBack className="h-full w-full opacity-70" />
            </div>
          </div>
        </div>

        {/* Aura pulsante */}
        <motion.div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.35),transparent_68%)] blur-2xl"
          animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative overflow-hidden rounded-[26px] border border-[rgba(212,175,55,0.35)] shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <Image
            src="/images/soulmate-blur-portrait.webp"
            alt="A soulmate portrait, still blurred"
            width={620}
            height={680}
            priority
            className="h-auto w-full object-cover"
          />

          {/* Brilho varrendo o retrato: sugere que está sendo revelado. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/2"
            style={{
              background:
                "linear-gradient(100deg, transparent, rgba(255,255,255,0.30), transparent)",
              mixBlendMode: "screen",
            }}
            animate={{ x: ["-120%", "260%"] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              repeatDelay: 1.6,
              ease: "easeInOut",
            }}
          />

          {/* Selo: nomeia o que a pessoa está vendo e por que está borrado. */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-3 pt-10">
            <p className="text-sm font-semibold text-[#f2ecff]">{t.caption}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-[#c9c0e4]">
              <Lock className="h-3 w-3 shrink-0 text-gold" aria-hidden />
              {t.locked}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.p
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-6 max-w-md text-balance text-base text-[#b9b2d0]"
      >
        {t.sub}
      </motion.p>

      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        ref={ctaRef}
        className="mt-7 w-full max-w-sm"
      >
        <Link
          href="/quiz/flow"
          onClick={() =>
            trackEvent("quiz_landing_cta_clicked", {
              category: "quiz",
              cta_position: "hero",
            })
          }
          className="btn-gold flex min-h-[58px] w-full items-center justify-center rounded-2xl px-8 text-base font-semibold"
        >
          {t.cta}
        </Link>
        {/* Aviso-curiosidade no ponto da decisão (padrão do funil de
            referência): intensidade social, sem inventar número novo. */}
        <p className="mt-3 text-xs text-[#e8d9a8]">
          <span aria-hidden>⚠️</span> {t.warning}
        </p>
        <span className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#b9b2d0]">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {t.minutes}
          <span aria-hidden>&bull;</span> {t.free}
        </span>
      </motion.div>

      {/* Master Aura */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-6 flex items-center gap-2.5 text-sm text-[#b9b2d0]"
      >
        <Image
          src="/brand/master-aura.webp"
          alt="Master Aura"
          width={56}
          height={56}
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
        />
        <span>
          {t.guidedBy}{" "}
          <span className="font-medium text-[#e8d9a8]">Master Aura</span> &mdash;{" "}
          {t.guided}
        </span>
      </motion.div>

      {/* Prova social */}
      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-5 flex items-center text-sm text-[#b9b2d0]"
      >
        <span className="flex -space-x-2" aria-hidden="true">
          {/* Só rostos femininos: o funil vende leitura de alma gêmea para
              mulheres, e a prova social precisa parecer com quem lê. */}
          {[
            "/testimonials/t7.jpg",
            "/testimonials/t1.jpg",
            "/testimonials/t6.jpg",
            "/testimonials/t4.jpg",
          ].map((src) => (
            <Image
              key={src}
              src={src}
              alt=""
              width={56}
              height={56}
              className="h-8 w-8 rounded-full border-2 border-[#161027] object-cover"
            />
          ))}
        </span>
        <span className="ml-2.5 flex items-center gap-1.5">
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" />
            ))}
          </span>
          <span className="font-semibold text-[#e8e4f5]">
            {PROOF_STATS.rating}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>
            {PROOF_STATS.readings} {t.readings}
          </span>
        </span>
      </motion.div>

      <motion.figure
        custom={7}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="glass mt-6 w-full max-w-sm rounded-2xl p-4 text-left"
      >
        <blockquote className="text-sm leading-relaxed text-[#d6d0e8]">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <figcaption className="mt-3 flex items-center gap-2.5">
          {/* t3: foto exclusiva desta pessoa — t4 já é "Brittany W." na VSL. */}
          <Image
            src="/testimonials/t3.jpg"
            alt="Jessica L."
            width={64}
            height={64}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
          />
          <span className="text-xs text-[#b9b2d0]">{t.quoteBy}</span>
        </figcaption>
      </motion.figure>

      <motion.div
        custom={8}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        aria-hidden="true"
        className="mb-4 mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-sm text-[rgba(232,228,245,0.28)]"
      >
        {ZODIAC_SIGNS.map((sign) => (
          <span
            key={sign.name}
            className="flex h-6 w-6 items-center justify-center"
          >
            {sign.symbol}
          </span>
        ))}
      </motion.div>

      {/* Barra fixa: só quando o botão principal saiu da tela. */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 p-3 backdrop-blur-md">
          <Link
            href="/quiz/flow"
            onClick={() =>
              trackEvent("quiz_landing_cta_clicked", {
                category: "quiz",
                cta_position: "sticky",
              })
            }
            className="btn-gold mx-auto flex min-h-[50px] w-full max-w-sm items-center justify-center rounded-2xl px-6 text-sm font-semibold"
          >
            {t.cta}
          </Link>
        </div>
      )}
    </div>
  );
}
