"use client";

// ENGINE dos funis de dor. Um componente, três configs.
//
// Fluxo: HOOK → QUIZ (conversa com a Master Aura) → TRANSIÇÃO → ESCOLHA
// DA CARTA → MICRO-REVELAÇÃO → OPEN LOOP → LP → CHECKOUT existente.
// Sem VSL — a hipótese em teste é dor+quiz+LP, não vídeo.
//
// A conversa preserva a característica do Control: a Aura DIGITA, a
// resposta vira balão dourado do lado da pessoa, e nas perguntas-chave a
// Aura responde de volta ("reaction") — ela ouve, não só pergunta. A
// thread ACUMULA como um DM de verdade, diferente do Control que troca de
// tela: aqui a pessoa rola para cima e revê o que confessou, o que
// aumenta o investimento psicológico antes da carta.
//
// Isolamento: nada aqui é importado pelo Control. Daqui só se usa o que
// já existia — checkout embutido, analytics, cartas, avatar, CardBack.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Lock, ShieldCheck, Star, X } from "lucide-react";
import CardBack from "@/components/CardBack";
import { trackEvent, trackPaymentInitiated } from "@/lib/analytics";
import { getStoredRef } from "@/lib/affiliate";
import { getStoredSource } from "@/lib/source";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
import { PROOF_STATS } from "@/lib/proof-stats";
import {
  activeQuiz,
  dominantPattern,
  genderOf,
  fillTokensDeep,
  genderizeDeep,
  genderizeText,
  type PainFunnelConfig,
  type PainImage,
  type PainSession,
} from "@/lib/pain-funnels/types";
import { moonLine } from "@/lib/experiences/moon";
import {
  PlanFinePrint,
  OFFER_LAYOUT,
  DEFAULT_SUB_PLAN,
  SUB_PLANS,
  type SubPlanKey,
} from "@/components/PlanPicker";

const EmbeddedCheckoutPanel = dynamic(
  () => import("@/components/EmbeddedCheckoutPanel"),
  { ssr: false }
);

const AURA_PHOTO = "/brand/master-aura.webp";

/** Cadência da conversa — mesma família de tempos do Control. */
const TYPE_MS_PER_CHAR = 26;
const TYPE_MIN_MS = 700;
const TYPE_MAX_MS = 2400;

type Stage = "hook" | "quiz" | "transition" | "pick" | "reveal";

type ThreadItem =
  | { kind: "aura"; text: string }
  | { kind: "me"; text: string }
  | { kind: "image"; image: PainImage };

function storageKey(segment: string) {
  return `astro_pain_${segment}`;
}

function readSession(segment: string): PainSession {
  try {
    const raw = localStorage.getItem(storageKey(segment));
    if (!raw) return { answers: {} };
    const p = JSON.parse(raw) as PainSession;
    return p && typeof p === "object" && p.answers ? p : { answers: {} };
  } catch {
    return { answers: {} };
  }
}

function saveSession(segment: string, s: PainSession) {
  try {
    localStorage.setItem(storageKey(segment), JSON.stringify(s));
  } catch {
    // modo privado — o funil segue só em memória
  }
}

export default function PainFunnel({ config: rawConfig }: { config: PainFunnelConfig }) {
  const seg = rawConfig.segment;

  // Variante B (skipHook): nasce direto na conversa — sem landing.
  const [stage, setStage] = useState<Stage>("hook");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Pronomes do ex seguem o gênero respondido na primeira pergunta; antes
  // disso a copy usa o default (feminino, maioria do tráfego) — o hook é
  // neutro de qualquer forma. `config` abaixo é a versão já traduzida.
  const gender = genderOf(rawConfig, answers);
  // Pronomes + tokens de copy ({pattern} = padrão dominante, {moon} = lua
  // real) resolvidos UMA vez para a config inteira — LP, open loop, tudo.
  const config = useMemo(() => {
    const g = genderizeDeep(rawConfig, gender);
    const pat = dominantPattern(rawConfig, answers);
    return fillTokensDeep(g, { pattern: pat.label, moon: moonLine() });
  }, [rawConfig, gender, answers]);
  const genderRef = useRef(gender);
  genderRef.current = gender;
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [typing, setTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [cardIndex, setCardIndex] = useState<number | null>(null);
  // Pergunta de texto livre (sonho): o texto fica SÓ aqui e na sessão do
  // browser — nunca em analytics. O preview da IA alimenta os tokens
  // {dreamTheme}/{dreamSymbols} do bloco de preview.
  const [textInput, setTextInput] = useState("");
  const [textBusy, setTextBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ theme: string; symbols: string[] } | null>(null);
  // Ciclo da assinatura Unlimited escolhido no LP (mensal por padrão).
  const [selectedPlan, setSelectedPlan] = useState<SubPlanKey>(DEFAULT_SUB_PLAN);
  const [flipped, setFlipped] = useState(false);
  const [lpVisible, setLpVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Checkout (mesma máquina das páginas de venda).
  const [email, setEmail] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutExpiresAt, setCheckoutExpiresAt] = useState<number | null>(null);
  const submittingRef = useRef(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const viewFiredRef = useRef(false);
  const lpFiredRef = useRef(false);
  const offerRef = useRef<HTMLDivElement | null>(null);

  const pattern = useMemo(
    () => dominantPattern(config, answers),
    [config, answers]
  );
  const card = cardIndex != null ? config.cards[cardIndex] : null;

  const base = useCallback(
    (extra?: Record<string, unknown>) => ({
      category: "pain_funnel",
      segment: seg,
      ...(rawConfig.funnelId ? { funnel_id: rawConfig.funnelId } : {}),
      ...(rawConfig.variantId ? { variant_id: rawConfig.variantId } : {}),
      funnel_session_id: getFunnelSessionId(),
      offer_layout: OFFER_LAYOUT,
      plan: selectedPlan,
      ...getUtmParams(),
      ...extra,
    }),
    [seg, selectedPlan, rawConfig.funnelId, rawConfig.variantId]
  );

  // ---- montagem: view + retomada de sessão ----
  useEffect(() => {
    if (!viewFiredRef.current) {
      viewFiredRef.current = true;
      trackEvent("pain_funnel_view", base());
    }
    const s = readSession(seg);
    if (s.email) setEmail(s.email);
    try {
      const ai = sessionStorage.getItem(`astro_pain_${seg}_ai`);
      if (ai) setAiPreview(JSON.parse(ai));
    } catch {}
    if (s.stage && s.stage !== "quiz" && Object.keys(s.answers).length) {
      // Retomada pós-quiz: reconstrói o essencial sem reanimar a conversa.
      setAnswers(s.answers);
      if (s.stage === "pick" || s.stage === "transition") setStage("pick");
      else if (s.stage === "reveal" || s.stage === "lp") {
        setCardIndex(s.cardIndex ?? 0);
        setFlipped(true);
        setStage("reveal");
        setLpVisible(true);
      }
    }
    return () => {
      for (const t of timersRef.current) window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, typing, showOptions]);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Enfileira mensagens da Aura com digitação, depois roda `then`. */
  const auraSays = useCallback(
    (messages: string[], then?: () => void) => {
      let delay = 250;
      for (const raw of messages) {
        const msg = genderizeText(raw, genderRef.current);
        const typeFor = Math.min(
          TYPE_MAX_MS,
          Math.max(TYPE_MIN_MS, msg.length * TYPE_MS_PER_CHAR)
        );
        later(() => setTyping(true), delay);
        delay += typeFor;
        later(() => {
          setTyping(false);
          setThread((t) => [...t, { kind: "aura", text: msg }]);
        }, delay);
        delay += 350;
      }
      if (then) later(then, delay + 120);
    },
    [later]
  );

  /** A Aura "manda uma foto": entra no thread como bolha dela, sem digitação. */
  const auraSends = useCallback((image: PainImage) => {
    setThread((t) => [...t, { kind: "image", image }]);
  }, []);

  /** Mensagens → (foto) → pergunta → opções. A foto fica entre o contexto e a pergunta. */
  const askQuestion = useCallback(
    (q: { aura: string[]; question: string; image?: PainImage }) => {
      if (q.image) {
        const img = q.image;
        auraSays(q.aura, () => {
          auraSends(img);
          later(() => auraSays([q.question], () => setShowOptions(true)), 900);
        });
      } else {
        auraSays([...q.aura, q.question], () => setShowOptions(true));
      }
    },
    [auraSays, auraSends, later]
  );

  const startQuiz = useCallback(() => {
    setStage("quiz");
    trackEvent("pain_quiz_started", base());
    const q = activeQuiz(rawConfig, {})[0];
    askQuestion(q);
  }, [askQuestion, base, rawConfig]);

  // Variante "direto na conversa" (skipHook): sem landing. Só dispara
  // depois da hidratação (o SSR renderiza a landing invisível, igual ao v1,
  // porque nascer já em "quiz" quebrava a hidratação desta rota).
  // O guard é marcado no DISPARO (não no agendamento): o setStage("quiz")
  // re-executa este efeito antes de a Aura começar a digitar e, sem ele,
  // a primeira pergunta entrava duas vezes (visto em produção).
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!rawConfig.skipHook || autoStartedRef.current) return;
    if (thread.length > 0 || typing || showOptions) return;
    const s = readSession(seg);
    if (s.stage && s.stage !== "quiz" && Object.keys(s.answers).length) return;
    const t = window.setTimeout(() => {
      if (autoStartedRef.current) return;
      autoStartedRef.current = true;
      if (stage === "hook") setStage("quiz");
      trackEvent("pain_quiz_started", base());
      askQuestion(activeQuiz(rawConfig, {})[0]);
    }, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, thread.length, typing, showOptions]);


  const advance = useCallback(
    (nextIndex: number, nextAnswers: Record<string, string>) => {
      const list = activeQuiz(rawConfig, nextAnswers);
      if (nextIndex >= list.length) {
        trackEvent("pain_quiz_completed", base({
          pattern: dominantPattern(rawConfig, nextAnswers).id,
        }));
        saveSession(seg, { answers: nextAnswers, stage: "transition" });
        setStage("transition");
        if (rawConfig.transitionImage) auraSends(rawConfig.transitionImage);
        auraSays(rawConfig.transition, () => {
          setStage("pick");
          saveSession(seg, { answers: nextAnswers, stage: "pick" });
          trackEvent("pain_tarot_started", base());
        });
        return;
      }
      setQIndex(nextIndex);
      askQuestion(list[nextIndex]);
    },
    [askQuestion, auraSays, auraSends, base, rawConfig, seg]
  );

  const answer = useCallback(
    (optionId: string, label: string) => {
      if (!showOptions) return;
      setShowOptions(false);
      const q = activeQuiz(rawConfig, answers)[qIndex];
      const nextAnswers = { ...answers, [q.id]: optionId };
      setAnswers(nextAnswers);
      setThread((t) => [...t, { kind: "me", text: label }]);
      trackEvent("pain_quiz_answered", base({
        question_id: q.id,
        answer_id: optionId,
        q_index: qIndex + 1,
      }));
      saveSession(seg, { answers: nextAnswers, stage: "quiz", qIndex: qIndex + 1 });

      // A reação é o que faz parecer conversa: ela responde ANTES de seguir.
      // A opção pode trazer a própria (ex.: pergunta de gênero).
      const reaction = q.options.find((o) => o.id === optionId)?.reaction ?? q.reaction;
      if (reaction) {
        auraSays([reaction], () => advance(qIndex + 1, nextAnswers));
      } else {
        later(() => advance(qIndex + 1, nextAnswers), 650);
      }
    },
    [advance, answers, auraSays, base, rawConfig, later, qIndex, seg, showOptions]
  );

  /** Pergunta de texto livre → endpoint de preview → reação da Aura → segue. */
  const submitText = useCallback(async () => {
    const q = activeQuiz(rawConfig, answers)[qIndex];
    const text = textInput.trim();
    if (!q || text.length < 12 || textBusy) return;
    setTextBusy(true);
    setShowOptions(false);
    setThread((t) => [...t, { kind: "me", text }]);
    let reaction = "Thank you for telling me. I can see it.";
    try {
      if (q.aiEndpoint) {
        const res = await fetch(q.aiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dream: text }),
        });
        const data = (await res.json().catch(() => ({}))) as { theme?: string; symbols?: string[]; reaction?: string };
        if (res.ok && data.reaction) {
          reaction = data.reaction;
          const preview = { theme: data.theme ?? "", symbols: data.symbols ?? [] };
          setAiPreview(preview);
          try { sessionStorage.setItem(`astro_pain_${seg}_ai`, JSON.stringify(preview)); } catch {}
          if (preview.symbols.length) {
            reaction = `${reaction} What I see in it: ${preview.symbols.join(", ")}.`;
          }
        }
      }
    } catch {
      // sem IA, a conversa segue — a pessoa nunca fica presa num spinner
    }
    const nextAnswers = { ...answers, [q.id]: "told" };
    setAnswers(nextAnswers);
    trackEvent("pain_quiz_answered", base({ question_id: q.id, answer_id: "text", q_index: qIndex + 1 }));
    saveSession(seg, { answers: nextAnswers, stage: "quiz", qIndex: qIndex + 1 });
    setTextInput("");
    setTextBusy(false);
    auraSays([reaction], () => advance(qIndex + 1, nextAnswers));
  }, [advance, answers, auraSays, base, qIndex, rawConfig, seg, textBusy, textInput]);

  const pickCard = useCallback(
    (i: number) => {
      if (cardIndex != null) return;
      setCardIndex(i);
      trackEvent("pain_card_selected", base({ card_slot: i }));
      later(() => {
        setFlipped(true);
        trackEvent("pain_card_revealed", base({
          card: config.cards[i].number,
          pattern: pattern.id,
        }));
        saveSession(seg, { answers, stage: "reveal", cardIndex: i });
        setStage("reveal");
      }, 700);
      later(() => {
        setLpVisible(true);
        if (!lpFiredRef.current) {
          lpFiredRef.current = true;
          trackEvent("pain_lp_viewed", base({ pattern: pattern.id }));
        }
        saveSession(seg, { answers, stage: "lp", cardIndex: i });
      }, 3400);
    },
    [answers, base, cardIndex, config.cards, later, pattern.id, seg]
  );

  // offer_viewed quando o primeiro CTA da LP entra na viewport
  useEffect(() => {
    if (!lpVisible) return;
    const el = offerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired) {
        fired = true;
        trackEvent("pain_offer_viewed", base({ pattern: pattern.id }));
        obs.disconnect();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [lpVisible, base, pattern.id]);

  // ---- checkout (mesmo backend do Control; nada novo de pagamento) ----
  const checkout = useCallback(
    async (buyerEmail: string) => {
      setLoadingPay(true);
      setPayError(null);
      try {
        const res = await fetch("/api/quiz/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: selectedPlan,
            email: buyerEmail,
            ref: getStoredRef(),
            src: getStoredSource(),
            funnelSessionId: getFunnelSessionId(),
            offer: SUB_PLANS[selectedPlan].offerId,
            variant: rawConfig.funnelId ? `${rawConfig.funnelId}_${rawConfig.variantId ?? "v1"}` : `pain_${seg}`,
            cancelPath: rawConfig.funnelId && rawConfig.variantId ? `/f/${rawConfig.funnelId}/${rawConfig.variantId}` : `/quiz/${seg}`,
            embedded: true,
            utm: getUtmParams(),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          clientSecret?: string;
          url?: string;
          expiresAt?: number;
          error?: string;
        };
        if (!res.ok || !(data.clientSecret || data.url)) {
          setPayError(data.error || "We couldn't open the secure checkout. Please try again.");
          setLoadingPay(false);
          submittingRef.current = false;
          return;
        }
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setCheckoutExpiresAt(data.expiresAt ?? null);
          setLoadingPay(false);
          submittingRef.current = false;
          return;
        }
        window.location.href = data.url!;
      } catch {
        setPayError("We couldn't open the secure checkout. Please try again.");
        setLoadingPay(false);
        submittingRef.current = false;
      }
    },
    [seg, selectedPlan, rawConfig.funnelId, rawConfig.variantId]
  );

  const buy = useCallback(
    (position: string) => {
      if (submittingRef.current || loadingPay) return;
      submittingRef.current = true;
      trackEvent("pain_checkout_clicked", base({
        pattern: pattern.id,
        cta_position: position,
      }));
      trackPaymentInitiated(selectedPlan, SUB_PLANS[selectedPlan].amount);
      if (!email) {
        setEmailInput("");
        setEmailError(null);
        setEmailModal(true);
        submittingRef.current = false;
        return;
      }
      void checkout(email);
    },
    [base, checkout, email, loadingPay, pattern.id, selectedPlan]
  );

  const submitEmail = useCallback(() => {
    const v = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmail(v);
    saveSession(seg, { answers, stage: "lp", cardIndex: cardIndex ?? 0, email: v });
    setEmailModal(false);
    void checkout(v);
  }, [answers, cardIndex, checkout, emailInput, seg]);

  // O LP-Copywriter entrega o CTA como "frase de reforço [RÓTULO] microcopy".
  // O botão recebe só o rótulo; a frase vira linha acima. A microcopy
  // depois do colchete (preço, garantia) é descartada: a recorrência já
  // aparece em letra pequena sob o botão, uma vez só.
  const Cta = ({ id, label }: { id: string; label?: string }) => {
    const raw = (label ?? config.lp.ctaB).trim();
    let lead = "";
    let btn = raw;
    const bracket = raw.match(/^(.*?)\[(.+?)\](.*)$/s);
    if (bracket) {
      lead = bracket[1].trim();
      btn = bracket[2].trim();
    } else {
      const parts = raw.split(/(?<=[.!?])\s+/);
      const last = parts[parts.length - 1] ?? "";
      if (parts.length > 1 && last.length <= 48) {
        btn = last.replace(/\.$/, "");
        lead = parts.slice(0, -1).join(" ");
      } else if (raw.length > 60) {
        lead = raw;
        btn = "Open my full reading";
      }
    }
    return (
    <div className="mt-6">
      {lead && (
        <p className="mb-3 text-center text-[15px] leading-relaxed text-white/85">
          {lead}
        </p>
      )}
      <button
        type="button"
        onClick={() => buy(id)}
        disabled={loadingPay}
        data-cta={id}
        className="btn-gold flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold uppercase tracking-wide disabled:opacity-60"
      >
        {loadingPay ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Opening your reading...
          </>
        ) : (
          <>
            {btn}
            <span aria-hidden>&rarr;</span>
          </>
        )}
      </button>
      <PlanFinePrint
        value={selectedPlan}
        onChange={setSelectedPlan}
        disabled={loadingPay}
        onOpenOptions={() =>
          trackEvent("pain_plan_options_opened", base({ pattern: pattern.id }))
        }
      />
      <p className="mt-2 text-center text-xs text-white/45">
        Instant access &middot; 7-day money-back guarantee &middot; Secure
        checkout by Stripe
      </p>
      {payError && (
        <p className="mt-2 text-center text-sm text-red-400" role="alert">
          {payError}
        </p>
      )}
    </div>
    );
  };

  /* ============================== RENDER ============================== */

  return (
    <div className="w-full pb-24">
      {/* ---------- HOOK ---------- */}
      {stage === "hook" && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: rawConfig.skipHook ? 0 : 1, y: 0 }}
          className={`flex min-h-[70vh] flex-col items-center justify-center text-center ${
            rawConfig.skipHook ? "invisible" : ""
          }`}
        >
          {config.hook.image && (
            <div className="relative mb-6 w-full max-w-[260px] overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
              <Image
                src={config.hook.image.src}
                alt={config.hook.image.alt}
                width={960}
                height={1280}
                sizes="260px"
                priority
                className="aspect-[3/4] w-full object-cover"
              />
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0a1a] via-transparent to-transparent" />
            </div>
          )}
          <h1 className="text-balance text-[1.9rem] font-semibold leading-[1.15] text-[#e8e4f5] sm:text-4xl">
            {config.hook.line}
          </h1>
          <p className="mt-4 max-w-md text-balance text-base text-[#b9b2d0]">
            {config.hook.sub}
          </p>
          <button
            type="button"
            onClick={startQuiz}
            className="btn-gold mt-8 flex min-h-[56px] w-full max-w-sm items-center justify-center rounded-2xl px-8 text-base font-semibold"
          >
            {config.hook.cta}
          </button>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-[#8d80b8]">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Private &middot; 2 minutes &middot; No sign-up to start
          </p>
        </motion.section>
      )}

      {/* ---------- CONVERSA (quiz + transição) ---------- */}
      {(stage === "quiz" || stage === "transition") && (
        <section className="mx-auto w-full max-w-lg">
          <div className="space-y-3 pb-4">
            {thread.map((item, i) =>
              item.kind === "image" ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-end gap-2"
                >
                  <Image
                    src={AURA_PHOTO}
                    alt=""
                    width={56}
                    height={56}
                    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
                  />
                  <div className="w-[70%] max-w-[260px] overflow-hidden rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04]">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      width={960}
                      height={1280}
                      sizes="260px"
                      className="aspect-[3/4] w-full object-cover"
                    />
                  </div>
                </motion.div>
              ) : item.kind === "aura" ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2"
                >
                  <Image
                    src={AURA_PHOTO}
                    alt=""
                    width={56}
                    height={56}
                    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
                  />
                  <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[15px] leading-snug text-[#e8e4f5]">
                    {item.text}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#d4af37] to-[#a9822f] px-4 py-2.5 text-[15px] font-medium leading-snug text-[#1a1330]">
                    {item.text}
                  </p>
                </motion.div>
              )
            )}
            {typing && (
              <div className="flex items-end gap-2">
                <Image
                  src={AURA_PHOTO}
                  alt=""
                  width={56}
                  height={56}
                  className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
                />
                <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-[#b9b2d0]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                    />
                  ))}
                </span>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          <AnimatePresence>
            {showOptions && stage === "quiz" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-2.5 pb-6"
              >
                {activeQuiz(config, answers)[qIndex]?.kind === "text" ? (
                  <div className="glass rounded-2xl p-3">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value.slice(0, 600))}
                      placeholder={activeQuiz(config, answers)[qIndex]?.placeholder ?? "Tell me what you dreamed…"}
                      rows={4}
                      className="w-full resize-none rounded-xl bg-transparent px-2 py-1.5 text-[15px] leading-snug text-[#e8e4f5] placeholder:text-white/35 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={submitText}
                      disabled={textBusy || textInput.trim().length < 12}
                      className="btn-gold mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {textBusy ? "Master Aura is reading it…" : "Send to Master Aura"}
                    </button>
                    <p className="mt-2 text-center text-[11px] text-white/40">Private — your words stay on this device.</p>
                  </div>
                ) : null}
                {activeQuiz(config, answers)[qIndex]?.kind !== "text" && activeQuiz(config, answers)[qIndex]?.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => answer(opt.id, opt.label)}
                    className="glass rounded-2xl px-4 py-3.5 text-left text-[15px] leading-snug text-[#e8e4f5] transition-all hover:border-[rgba(212,175,55,0.4)] active:scale-[0.98]"
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* ---------- ESCOLHA DA CARTA ---------- */}
      {stage === "pick" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto w-full max-w-lg text-center"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[#b9b2d0]">
            Trust your hand
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#e8e4f5]">
            Choose <span className="text-gold">one card</span>
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 px-4 sm:grid-cols-4">
            {config.cards.map((_, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => pickCard(i)}
                initial={{ opacity: 0, y: 20, rotate: i % 2 ? 3 : -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.96 }}
                className="mx-auto w-full max-w-[130px]"
                aria-label={`Card ${i + 1}`}
              >
                <CardBack className="aspect-[2/3] w-full" />
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* ---------- MICRO-REVELAÇÃO + OPEN LOOP ---------- */}
      {stage === "reveal" && card && (
        <section className="mx-auto w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-[240px]"
          >
            <div className="overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.45)] shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
              <Image
                src={`/cards/egyptian/${card.number}.jpg`}
                alt={card.name}
                width={360}
                height={600}
                priority
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-center font-display text-xl font-semibold text-gold">
              {card.name}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass mt-6 rounded-2xl p-5"
          >
            <p className="text-[15px] leading-relaxed text-white/85">
              {card.interpretation}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85">
              {card.patternLine.replace("{pattern}", pattern.label)}
            </p>
            <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-4 py-3 text-sm text-[#e8d9a8]">
              Your pattern: <span className="font-semibold">{pattern.label}</span>
              {" — "}
              {pattern.description}
            </p>
          </motion.div>

          {/* PREVIEW — valor real antes do paywall (tokens resolvidos aqui) */}
          {config.preview && lpVisible && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass mt-6 rounded-2xl border border-amber-300/20 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d4af37]">
                {config.preview.title}
              </p>
              <dl className="mt-4 space-y-3.5">
                {config.preview.items.map((it) => (
                  <div key={it.label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{it.label}</dt>
                    <dd className="mt-0.5 text-[15px] leading-relaxed text-white/85">
                      {it.text
                        .replace(/{pattern}/g, pattern.label)
                        .replace(/{moon}/g, moonLine())
                        .replace(/{dreamTheme}/g, aiPreview?.theme || "the thread your dream keeps pulling")
                        .replace(/{dreamSymbols}/g, aiPreview?.symbols?.length ? aiPreview.symbols.join(", ") : "the images that stayed with you")}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}

          {/* OPEN LOOP: 1 revelada, 2 selada, 3 selada */}
          {lpVisible && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <p className="text-center text-[15px] text-white/80">
                {config.openLoop.surfaceLine}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="overflow-hidden rounded-xl border border-[rgba(212,175,55,0.4)]">
                    <Image
                      src={`/cards/egyptian/${card.number}.jpg`}
                      alt=""
                      width={200}
                      height={340}
                      className="h-auto w-full"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-gold">
                    Revealed
                  </p>
                </div>
                {[config.openLoop.card2, config.openLoop.card3].map((tease, i) => (
                  <div key={i} className="text-center">
                    <div className="relative">
                      <CardBack className="aspect-[10/17] w-full opacity-80" />
                      <Lock
                        className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gold"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] leading-tight text-white/55">
                      {tease}
                    </p>
                  </div>
                ))}
              </div>

              <div ref={offerRef}>
                <Cta id="open_loop" label={config.openLoop.cta} />
              </div>
            </motion.div>
          )}

          {/* ---------- LP (LP Copywriter, etapas 1→10) ---------- */}
          {lpVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-14"
            >
              <h2 className="text-balance text-[1.65rem] font-semibold leading-[1.15] text-[#e8e4f5] sm:text-3xl">
                {config.lp.headline}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#b9b2d0]">
                {config.lp.subheadline}
              </p>

              <div className="mt-6 space-y-4">
                {config.lp.connection.map((p, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-white/85">
                    {p}
                  </p>
                ))}
              </div>

              {/* Tabela — 5 critérios, sem números inventados */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-white/[0.05] text-[12px] font-semibold uppercase tracking-wide text-white/60">
                  <div className="px-3 py-2.5"></div>
                  <div className="px-3 py-2.5">On your own</div>
                  <div className="px-3 py-2.5 text-gold">With your reading</div>
                </div>
                {config.lp.comparison.map((row) => (
                  <div
                    key={row.criterion}
                    className="grid grid-cols-[1.1fr_1fr_1fr] border-t border-white/5 text-[13px] leading-snug"
                  >
                    <div className="px-3 py-3 font-medium text-white/80">
                      {row.criterion}
                    </div>
                    <div className="px-3 py-3 text-white/55">{row.without}</div>
                    <div className="px-3 py-3 text-[#e8d9a8]">{row.with}</div>
                  </div>
                ))}
              </div>

              {/* Autoridade — só fatos reais */}
              <div className="glass mt-8 rounded-2xl p-5">
                <div className="flex items-center gap-1" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-white/85">
                    {PROOF_STATS.rating} &middot; {PROOF_STATS.readings} readings
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                  {config.lp.authority}
                </p>
              </div>

              {/* Empilhamento de valor — benefício antes da feature */}
              <div className="mt-8 space-y-4">
                {config.lp.value.map((v) => (
                  <div key={v.feature} className="flex items-start gap-3">
                    <Star className="mt-1 h-4 w-4 shrink-0 fill-gold text-gold" aria-hidden />
                    <p className="text-[15px] leading-snug text-white/85">
                      {v.benefit}{" "}
                      <span className="text-white/50">({v.feature})</span>
                    </p>
                  </div>
                ))}
                <p className="pt-1 text-center text-lg font-semibold text-[#e8e4f5]">
                  {config.lp.priceLine}
                </p>
              </div>

              <Cta id="value_stack" />

              {/* Garantia — 7 dias, a real */}
              <div className="glass mt-10 rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                  <h3 className="font-semibold text-white/90">
                    7-day money-back guarantee
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {config.lp.guarantee}
                </p>
              </div>

              {/* FAQ — exatamente 4 */}
              <div className="mt-10">
                <h3 className="text-center text-lg font-semibold text-white/90">
                  Questions, answered
                </h3>
                <div className="mt-4 space-y-2">
                  {config.lp.faq.map((item, i) => {
                    const open = openFaq === i;
                    return (
                      <div
                        key={item.q}
                        className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(open ? null : i)}
                          aria-expanded={open}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-white/90"
                        >
                          {item.q}
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        {open && (
                          <p className="px-4 pb-4 text-sm leading-relaxed text-white/70">
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Cta id="final" />
            </motion.div>
          )}
        </section>
      )}

      {/* ---------- e-mail modal ---------- */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="glass w-full max-w-sm rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white/95">
                Where should we send your reading?
              </h2>
              <button
                type="button"
                onClick={() => setEmailModal(false)}
                aria-label="Close"
                className="text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEmail();
              }}
              placeholder="you@email.com"
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-gold-400/60"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {emailError}
              </p>
            )}
            <button
              type="button"
              onClick={submitEmail}
              className="btn-gold mt-4 flex w-full min-h-[52px] items-center justify-center rounded-full px-6 font-semibold"
            >
              Continue to secure checkout
            </button>
          </div>
        </div>
      )}

      {/* ---------- checkout embutido ---------- */}
      {clientSecret && (
        <EmbeddedCheckoutPanel
          clientSecret={clientSecret}
          expiresAt={checkoutExpiresAt}
          onClose={() => setClientSecret(null)}
        />
      )}
    </div>
  );
}
