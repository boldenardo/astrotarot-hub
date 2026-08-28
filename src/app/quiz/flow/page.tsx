"use client";

// Funil de alma gêmea em formato de conversa (DM).
//
// Regras de ritmo:
// - A Master Aura NÃO comenta cada resposta: fala em momentos-chave, no
//   tempo de quem digita de verdade (ver typingDelayFor) — a espera é o
//   que cria a sensação de conversa íntima.
// - Quem não quer esperar toca na conversa e revela tudo de uma vez.
// - Perguntas avançam sozinhas ao toque (sem botão "continuar").
// - Estado e posição persistem em localStorage; um refresh volta para a
//   MESMA tela, inclusive nas que não têm resposta (vídeo, cidade).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SoulmateLetter from "@/components/SoulmateLetter";
import {
  ArrowLeft,
  BadgeCheck,
  CircleCheck,
  Heart,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
import {
  STEPS,
  ZODIAC_SIGNS,
  computeScore,
  loadQuizState,
  resolveReactionText,
  resumeIndex,
  saveQuizState,
  signFromDate,
  type QuizState,
  type QuizStep,
} from "@/lib/quiz-data";
import { useQuizContent } from "@/components/LocaleProvider";
import { analyzingStagesFor, type QuizContent, type QuizUI } from "@/lib/i18n/content";
import { trackEvent } from "@/lib/analytics";
import { getStoredRef, getVisitorId } from "@/lib/affiliate";
import { PROOF_STATS } from "@/lib/proof-stats";
import {
  prefersNoTransitions,
  rememberLowEndDevice,
} from "@/lib/funnel-variant";
import { captureSource, getStoredSource } from "@/lib/source";
import { suggestEmailFix } from "@/lib/email-hint";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUIDE_PHOTO = "/brand/master-aura.webp";

// Tempo máximo para uma troca de passo se resolver sozinha. A entrada leva
// 280ms e a saída outros 280ms; 1500ms dá folga em aparelho lento sem
// deixar ninguém olhando uma tela morta.
const STEP_SETTLE_MS = 1500;

/** Marca de "já recarreguei por chunk faltando" — evita loop de reload. */
const CHUNK_RELOAD_KEY = "astro_quiz_chunk_reload";

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -40 : 40 }),
};

export default function QuizFlowPage() {
  const router = useRouter();
  // Conteúdo no idioma detectado (steps + textos). Os ids e os `value`
  // das opções são iguais em todo idioma, então score e analytics não mudam.
  const content = useQuizContent();
  const { ui } = content;
  const LOCALIZED_STEPS = content.steps;
  const [state, setState] = useState<QuizState>({ answers: {} });
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const advancingRef = useRef(false);
  const startedRef = useRef(false);
  // Watchdog da transição (ver efeito abaixo).
  const [presenceKey, setPresenceKey] = useState(0);
  const [degraded, setDegraded] = useState(false);
  const settledRef = useRef<string | null>(null);

  // Depois de um deploy, uma aba aberta (ou uma navegação com HTML em
  // cache) ainda aponta para chunks que não existem mais no servidor. O
  // JS que falta nunca carrega, a tela para de responder e — como se vê
  // num ChunkLoadError — nada disso vira erro visível para quem está do
  // outro lado. Recarregar uma vez resolve, e o progresso está no
  // localStorage, então a pessoa volta ao mesmo passo.
  useEffect(() => {
    const onChunkError = (e: Event) => {
      const msg = String(
        (e as PromiseRejectionEvent).reason?.message ??
          (e as ErrorEvent).message ??
          ""
      );
      if (!/ChunkLoadError|Loading chunk \S+ failed/i.test(msg)) return;
      try {
        if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      } catch {
        return; // sem sessionStorage não dá para evitar loop de reload
      }
      console.warn("[quiz] chunk faltando (deploy novo?). Recarregando uma vez.");
      trackEvent("quiz_chunk_reload", { category: "quiz", label: msg.slice(0, 80) });
      window.location.reload();
    };
    window.addEventListener("error", onChunkError);
    window.addEventListener("unhandledrejection", onChunkError);
    return () => {
      window.removeEventListener("error", onChunkError);
      window.removeEventListener("unhandledrejection", onChunkError);
    };
  }, []);

  // Restaura o estado e retoma exatamente onde a pessoa parou.
  useEffect(() => {
    // Aparelho fraco (ou quem pediu menos movimento): entra JÁ sem
    // animação de transição, em vez de esperar o watchdog socorrer depois
    // de 1,5s travado — socorro que em 4 sessões chegou tarde demais.
    // Fora do estado inicial de propósito: ler navigator no primeiro
    // render divergiria do HTML do servidor e quebraria a hidratação.
    if (prefersNoTransitions()) setDegraded(true);

    const restored = loadQuizState();
    setState(restored);
    setStepIndex(resumeIndex(restored));
    setHydrated(true);
    if (!startedRef.current) {
      startedRef.current = true;
      // First-touch da plataforma (?src=ig|tt|yt...) antes de qualquer coisa.
      const src = captureSource();
      trackEvent("quiz_started", { category: "quiz", label: src ?? "unknown", src });
    }
  }, []);

  // Persiste estado + posição (o passo entra no mesmo objeto para que um
  // refresh volte para a mesma tela, inclusive nas telas sem resposta).
  useEffect(() => {
    if (hydrated) saveQuizState({ ...state, stepIndex });
  }, [state, stepIndex, hydrated]);

  // Um evento por tela: é o que permite ver em QUAL passo as pessoas caem.
  // Refire em retomada (refresh/volta) de propósito — também é sinal.
  useEffect(() => {
    if (!hydrated) return;
    const current = LOCALIZED_STEPS[Math.min(stepIndex, LOCALIZED_STEPS.length - 1)];
    trackEvent("quiz_step_viewed", {
      category: "quiz",
      label: current.id,
      step_id: current.id,
      step_index: stepIndex,
    });
  }, [stepIndex, hydrated]);

  const step: QuizStep = LOCALIZED_STEPS[Math.min(stepIndex, LOCALIZED_STEPS.length - 1)];

  // WATCHDOG DA TRANSIÇÃO.
  //
  // `AnimatePresence mode="wait"` só monta o próximo passo depois que a
  // ANIMAÇÃO DE SAÍDA do anterior avisa que terminou. Quando esse aviso não
  // chega — aba em segundo plano, rAF estrangulado no celular, tela
  // bloqueada no meio do gesto, animação interrompida — o passo velho fica
  // na tela para sempre enquanto o estado já avançou. É uma falha muda: o
  // console não acusa nada e o monitoramento não vê. Aqui a troca se
  // resolve na marra: remontamos o bloco (descartando a saída pendente) e
  // desligamos a animação pelo resto da sessão, para não cair de novo.
  useEffect(() => {
    if (!hydrated) return;
    if (settledRef.current === step.id) return;
    // SEM ANIMAÇÃO NÃO HÁ onAnimationComplete (28/08). Com `degraded`, o
    // motion.div entra com initial={false} e duration 0 — o Framer não
    // dispara o aviso de conclusão porque não houve o que concluir, e o
    // watchdog passava a acusar TODA transição como travada. Isso virou
    // um laço: cada falso travamento gravava "aparelho fraco" no
    // navegador, que degradava a visita seguinte, que travava de novo.
    // Em 28/08 os 7 leads do dia dispararam o evento (eram 1-2 por dia).
    // Sem animação o passo já está assentado no primeiro paint.
    if (degraded) {
      settledRef.current = step.id;
      return;
    }
    const t = window.setTimeout(() => {
      if (settledRef.current === step.id) return;
      settledRef.current = step.id;
      // Também no console: a falha original não gerava erro nenhum, então
      // não aparecia em nenhum monitoramento nem num F12 aberto na hora.
      console.warn(
        `[quiz] transição não assentou em ${STEP_SETTLE_MS}ms (passo "${step.id}", índice ${stepIndex}). Forçando a troca e desligando a animação.`
      );
      trackEvent("quiz_transition_stuck", {
        category: "quiz",
        label: step.id,
        step_id: step.id,
        step_index: stepIndex,
      });
      setDegraded(true);
      // Este aparelho já provou que não aguenta: a próxima visita dele
      // nasce sem animação nenhuma.
      rememberLowEndDevice();
      setPresenceKey((k) => k + 1);
    }, STEP_SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [step.id, stepIndex, hydrated, degraded]);
  const progress = Math.round(((stepIndex + 1) / LOCALIZED_STEPS.length) * 100);
  const isAnalyzing = step.id === "analyzing";
  const firstName = state.name?.trim().split(/\s+/)[0];

  // Trava de transição: com AnimatePresence mode="wait", trocar a key
  // durante a animação de saída deixa a tela presa. Duplo clique / duplo
  // submit é comum no mobile, então bloqueamos avanços em sequência.
  const transitionLockRef = useRef(false);
  const withTransitionLock = useCallback((move: () => void) => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    move();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
      window.setTimeout(() => {
        transitionLockRef.current = false;
      }, 400);
    } else {
      transitionLockRef.current = false;
    }
  }, []);

  const goNext = useCallback(() => {
    withTransitionLock(() => {
      advancingRef.current = false;
      setDirection(1);
      setStepIndex((i) => Math.min(i + 1, LOCALIZED_STEPS.length - 1));
    });
  }, [withTransitionLock]);

  const goBack = useCallback(() => {
    withTransitionLock(() => {
      advancingRef.current = false;
      setDirection(-1);
      setStepIndex((i) => Math.max(i - 1, 0));
    });
  }, [withTransitionLock]);

  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
        ...(questionId === "q_sign" ? { sign: value } : null),
      }));
      // Pausa para o balão dela ASSENTAR na conversa antes de trocar de
      // tela. Com 220ms a resposta aparecia e sumia no mesmo piscar, o que
      // anulava o efeito de estar conversando com alguém.
      window.setTimeout(goNext, 760);
    },
    [goNext]
  );

  const handleName = useCallback(
    (name: string) => {
      setState((prev) => ({ ...prev, name: name.trim() || undefined }));
      goNext();
    },
    [goNext]
  );

  const handleBirthdate = useCallback(
    (birthDate: string) => {
      const derived = signFromDate(birthDate);
      setState((prev) => ({ ...prev, birthDate, sign: derived ?? prev.sign }));
      goNext();
    },
    [goNext]
  );

  const handleEmail = useCallback(
    (email: string) => {
      setState((prev) => {
        const next = { ...prev, email };
        // Persiste o lead no servidor (fire-and-forget; keepalive protege
        // contra a navegação seguinte). Sem isso, quem não compra na hora
        // é perdido para sempre — o email morria no localStorage.
        fetch("/api/quiz/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            email,
            name: next.name,
            birthDate: next.birthDate,
            sign: next.sign,
            score: computeScore(next.answers),
            answers: next.answers,
            visitorId: getVisitorId(),
            ref: getStoredRef(),
            src: getStoredSource(),
          }),
        }).catch(() => {});
        return next;
      });
      trackEvent("lead_captured", { category: "quiz", label: "quiz_email" });
      goNext();
    },
    [goNext]
  );

  const handleAnalyzingDone = useCallback(() => {
    setState((prev) => {
      const next: QuizState = { ...prev, score: computeScore(prev.answers) };
      saveQuizState(next); // flush antes de navegar
      return next;
    });
    trackEvent("quiz_completed", { category: "quiz" });
    // Saída do funil apontada para a VARIANTE (vsl_v2_ignite) em 17/08/2026.
    // A V1 continua servindo em /quiz/vsl — nada foi apagado: para voltar
    // atrás, troque só esta linha. Ver src/lib/funnel-variant.ts.
    router.push("/quiz/vsl-v2");
  }, [router]);

  const vars = useMemo(
    () => ({ name: firstName, sign: state.sign, birthDate: state.birthDate }),
    [firstName, state.sign]
  );

  // Sem gate de hidratação: a primeira tela precisa aparecer no HTML inicial.
  // Bloquear tudo até `hydrated` mostrava um spinner em conexões lentas —
  // custo direto de conversão logo na entrada do funil. O passo salvo é
  // aplicado no effect acima, logo após a hidratação.
  return (
    <div className="flex flex-1 flex-col">
      {/* Progresso */}
      <div
        className="mb-3 mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ui.progress}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #edd9a3, #d4af37 60%, #a9822f)",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Voltar */}
      {stepIndex > 0 && !isAnalyzing && (
        <button
          type="button"
          onClick={goBack}
          aria-label={ui.back}
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] text-[#b9b2d0] transition-colors hover:text-[#e8e4f5]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
      )}

      {/* Alinhado ao TOPO, não centralizado: com centralização vertical as
          telas curtas (nome, boas-vindas) começavam quase na metade da tela
          e empurravam o botão para o fim do polegar. */}
      <div className="relative flex flex-1 flex-col justify-start pt-1">
        <AnimatePresence key={presenceKey} mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={degraded ? undefined : slideVariants}
            initial={degraded ? false : "enter"}
            animate={degraded ? { opacity: 1, x: 0 } : "center"}
            exit={degraded ? { opacity: 1 } : "exit"}
            transition={degraded ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
            onAnimationComplete={() => {
              settledRef.current = step.id;
            }}
            className="w-full"
          >
            {step.kind === "name" && (
              <NameStep
                ui={ui}
                messages={step.messages}
                placeholder={step.placeholder}
                cta={step.cta}
                initialValue={state.name ?? ""}
                onContinue={handleName}
              />
            )}

            {step.kind === "chat" && (
              <ChatStep
                ui={ui}
                messages={step.messages.map((m) => resolveReactionText(m, vars))}
                cta={step.cta}
                onContinue={goNext}
              />
            )}

            {step.kind === "question" && (
              <QuestionStep
                ui={ui}
                step={step}
                selected={state.answers[step.id]}
                vars={vars}
                onAnswer={handleAnswer}
              />
            )}

            {step.kind === "reveal" && (
              <RevealStep step={step} sign={state.sign} content={content} onContinue={goNext} />
            )}

            {step.kind === "proof" && (
              <ProofStep step={step} ui={ui} onContinue={goNext} />
            )}

            {step.kind === "media" && (
              <MediaStep
                ui={ui}
                step={step}
                vars={vars}
                onContinue={goNext}
              />
            )}

            {step.kind === "location" && (
              <LocationStep
                ui={ui}
                cta={step.cta}
                vars={vars}
                onContinue={goNext}
              />
            )}

            {step.kind === "birthdate" && (
              <BirthdateStep
                ui={ui}
                initialValue={state.birthDate ?? ""}
                onContinue={handleBirthdate}
              />
            )}

            {step.kind === "email" && (
              <EmailStep
                ui={ui}
                initialEmail={state.email ?? ""}
                name={firstName}
                onContinue={handleEmail}
              />
            )}

            {isAnalyzing && (
              <AnalyzingScreen name={state.name} content={content} onDone={handleAnalyzingDone} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------ Chat bubbles ----------------------------- */

/** Bolha da guia com avatar — o bloco visual base da conversa. */
function GuideBubble({
  children,
  showAvatar = true,
}: {
  children: React.ReactNode;
  showAvatar?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      {showAvatar ? (
        <Image
          src={GUIDE_PHOTO}
          alt=""
          width={72}
          height={72}
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
        />
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden />
      )}
      <div className="glass max-w-[85%] rounded-2xl rounded-bl-md border border-[rgba(212,175,55,0.25)] px-4 py-3 text-left text-[15px] leading-relaxed text-[#e8e4f5]">
        {children}
      </div>
    </div>
  );
}

/** Três pontinhos de "digitando". */
function TypingBubble() {
  return (
    <GuideBubble>
      <span className="flex h-5 items-center gap-1.5" aria-label="Typing">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </span>
    </GuideBubble>
  );
}

// Ritmo de digitação: proporcional ao tamanho da mensagem, como uma pessoa
// escrevendo de verdade. Uma frase curta leva ~1,2s; uma longa, até 4,5s.
// Conversa íntima > velocidade: a espera é o que cria a sensação de que
// alguém está do outro lado pensando na resposta.
const MS_PER_CHAR = 32;
const TYPING_MIN_MS = 1200;
const TYPING_MAX_MS = 4500;

function typingDelayFor(message: string | undefined): number {
  const len = message?.length ?? 60;
  return Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, len * MS_PER_CHAR));
}

/**
 * Revela as mensagens uma a uma com "digitando" entre elas, no ritmo de
 * quem realmente escreve. Retorna quantas já apareceram e se terminou.
 */
function useMessageReveal(messages: string[], typeFirst = false) {
  const count = messages.length;
  /**
   * Quantas mensagens já nascem visíveis.
   *
   * Por padrão a PRIMEIRA já vem pronta, inclusive no HTML do servidor:
   * numa tela de entrada, esperar para ter conteúdo custa conversão.
   *
   * Com `typeFirst`, ela também é digitada. Isso é para os momentos em que
   * a guia está mandando uma mensagem de verdade no meio da conversa — ver
   * a bolha aparecer é o que faz parecer uma pessoa do outro lado, e não um
   * bloco de texto que já estava lá. Só faz sentido depois que a tela já
   * tem contexto; na porta do funil continuaria custando caro.
   */
  const initialShown = typeFirst ? 0 : count > 0 ? 1 : 0;
  const [shown, setShown] = useState(initialShown);
  const [typing, setTyping] = useState(count > initialShown);

  // Os textos entram por ref: os componentes montam o array a cada render
  // (map + interpolação de nome), e usá-lo como dependência reiniciaria o
  // timer a cada render — a conversa nunca avançaria.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    setShown(initialShown);
    setTyping(count > initialShown);
  }, [count, initialShown]);

  useEffect(() => {
    if (shown >= count) {
      setTyping(false);
      return;
    }
    setTyping(true);
    // O tempo é o da PRÓXIMA mensagem (a que está sendo "digitada").
    const t = window.setTimeout(() => {
      setShown((s) => s + 1);
    }, typingDelayFor(messagesRef.current[shown]));
    return () => window.clearTimeout(t);
  }, [shown, count]);

  /** Revela tudo de uma vez — para quem não quer esperar o ritmo lento. */
  const revealAll = useCallback(() => setShown(count), [count]);

  return {
    shown,
    typing: typing && shown < count,
    done: shown >= count,
    revealAll,
  };
}

/**
 * Conversa da guia. É a ÚNICA dona do estado de revelação — avisa o passo
 * pai via `onDone` para ele mostrar o input/botão. Antes cada passo
 * chamava o hook por conta própria e, ao pular a digitação, o conteúdo
 * seguinte não aparecia.
 */
function GuideConversation({
  messages,
  onDone,
  typeFirst = false,
}: {
  messages: string[];
  onDone?: () => void;
  /** Digita também a PRIMEIRA mensagem (ver useMessageReveal). */
  typeFirst?: boolean;
}) {
  const { shown, typing, done, revealAll } = useMessageReveal(
    messages,
    typeFirst
  );
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  return (
    // Tocar em qualquer lugar da conversa adianta as mensagens: o ritmo
    // lento cria intimidade, mas ninguém pode ficar preso esperando.
    <div
      className="flex flex-col gap-2"
      onClick={typing ? revealAll : undefined}
      role={typing ? "button" : undefined}
      tabIndex={typing ? 0 : undefined}
      aria-label={typing ? "Show all messages" : undefined}
      onKeyDown={
        typing
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                revealAll();
              }
            }
          : undefined
      }
    >
      {messages.slice(0, shown).map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GuideBubble showAvatar={i === 0}>{m}</GuideBubble>
        </motion.div>
      ))}
      {typing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TypingBubble />
        </motion.div>
      )}
    </div>
  );
}

/** Botão primário do funil (pill dourado, largura total). */
function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-gold mt-6 flex min-h-[56px] w-full items-center justify-center rounded-full px-8 text-base disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/* --------------------------------- Name --------------------------------- */

function NameStep({
  ui,
  messages,
  placeholder,
  cta,
  initialValue,
  onContinue,
}: {
  ui: QuizUI;
  messages: string[];
  placeholder?: string;
  cta?: string;
  initialValue: string;
  onContinue: (name: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  // Se esta tela continuar montada depois do submit, a troca de passo não
  // aconteceu — e sem isto o botão ficava desabilitado para sempre, sem
  // nenhuma forma de tentar de novo a não ser recarregar.
  useEffect(() => {
    if (!submitted) return;
    const t = window.setTimeout(() => setSubmitted(false), STEP_SETTLE_MS + 500);
    return () => window.clearTimeout(t);
  }, [submitted]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return; // evita duplo submit (Enter + clique)
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError(ui.nameError);
      return;
    }
    setSubmitted(true);
    onContinue(trimmed);
  };

  return (
    <form onSubmit={submit} noValidate>
      <GuideConversation messages={messages} onDone={() => setDone(true)} />
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label htmlFor="quiz-name" className="sr-only">
            Your first name
          </label>
          <input
            id="quiz-name"
            type="text"
            autoComplete="given-name"
            autoFocus
            placeholder={placeholder ?? ui.yourFirstName}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="glass glass-gold mt-6 block min-h-[56px] w-full min-w-0 rounded-2xl px-4 text-center text-base text-[#e8e4f5] placeholder:text-[rgba(185,178,208,0.6)] outline-none focus:border-[#d4af37]"
          />
          {error && (
            <p role="alert" className="mt-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={submitted}>
            {cta ?? ui.continue}
          </PrimaryButton>
        </motion.div>
      )}
    </form>
  );
}

/* --------------------------------- Chat --------------------------------- */

function ChatStep({
  ui,
  messages,
  cta,
  onContinue,
}: {
  ui: QuizUI;
  messages: string[];
  cta?: string;
  onContinue: () => void;
}) {
  const [done, setDone] = useState(false);
  return (
    <div>
      {/* typeFirst (26/08, pedido do dono): no meio do fluxo a primeira
          mensagem também nasce DIGITADA. Pronta na tela, ela entregava
          "conteúdo de página"; ver a bolha sendo escrita é o que faz
          parecer uma pessoa do outro lado. */}
      <GuideConversation messages={messages} typeFirst onDone={() => setDone(true)} />
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PrimaryButton onClick={onContinue}>{cta ?? ui.continue}</PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------- Question -------------------------------- */

function QuestionStep({
  ui,
  step,
  selected,
  vars,
  onAnswer,
}: {
  ui: QuizUI;
  step: Extract<QuizStep, { kind: "question" }>;
  selected?: string;
  vars: { name?: string; sign?: string; birthDate?: string };
  onAnswer: (questionId: string, value: string) => void;
}) {
  const intro = step.intro?.map((m) => resolveReactionText(m, vars));
  const [introDone, setIntroDone] = useState(false);
  const isSignGrid = step.id === "q_sign";
  /**
   * O que ela acabou de tocar, para virar balão do lado dela.
   *
   * Antes a resposta simplesmente sumia: a pessoa escolhia e a tela
   * trocava, sem nada indicando que alguém do outro lado tinha ouvido.
   * Numa conversa, o que você diz fica na conversa.
   */
  const [answered, setAnswered] = useState<{ label: string } | null>(null);
  const showOptions = (!intro || introDone) && !answered;

  const pick = (value: string, label: string) => {
    if (answered) return;
    setAnswered({ label });
    onAnswer(step.id, value);
  };

  return (
    <div>
      {intro && (
        // typeFirst: a intro de pergunta é sempre meio de conversa — a
        // reação da guia à resposta anterior precisa parecer escrita agora.
        <GuideConversation messages={intro} typeFirst onDone={() => setIntroDone(true)} />
      )}

      {/* A resposta dela entra na conversa, alinhada à direita — é o que
          faz a tela parecer DM e não formulário. */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mt-4 flex justify-end"
        >
          <span className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#d4af37] to-[#a9822f] px-4 py-2.5 text-[15px] font-medium leading-snug text-[#1a1330] shadow-[0_6px_18px_rgba(212,175,55,0.28)]">
            {answered.label}
          </span>
        </motion.div>
      )}

      {showOptions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={intro ? "mt-6" : ""}
        >
          <h2 className="text-balance text-center text-xl font-semibold leading-snug text-[#e8e4f5] sm:text-2xl">
            {step.question}
          </h2>
          {step.subtitle && (
            <p className="mt-2 text-center text-sm text-[#b9b2d0]">
              {step.subtitle}
            </p>
          )}

          {/* Os 12 signos em lista vertical exigiam rolagem longa no celular
              (só 5 cabiam na tela). Em grade de 3 colunas os 12 cabem numa
              tela só, que é onde o tráfego orgânico decide. */}
          <div
            className={`mt-5 grid gap-2.5 ${
              isSignGrid ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"
            }`}
          >
            {step.options.map((opt) => {
              const isSelected = selected === opt.value;
              const base =
                "glass rounded-2xl transition-all active:scale-[0.98] " +
                (isSelected
                  ? "glass-gold ring-1 ring-[#d4af37]"
                  : "hover:border-[rgba(212,175,55,0.4)]");

              if (isSignGrid) {
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => pick(opt.value, opt.label)}
                    className={`${base} flex min-h-[92px] flex-col items-center justify-center gap-1 px-1.5 py-3 text-center`}
                  >
                    <span
                      className="text-2xl leading-none text-[#e8d9a8]"
                      aria-hidden
                    >
                      {opt.symbol}
                    </span>
                    <span className="text-[13px] font-medium leading-tight text-[#e8e4f5]">
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="text-[10px] leading-tight text-[#b9b2d0]">
                        {opt.hint}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pick(opt.value, opt.label)}
                  className={`${base} flex min-h-[60px] items-center gap-3 px-4 py-3 text-left`}
                >
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-[#e8e4f5]">
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="text-xs text-[#b9b2d0]">{opt.hint}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* -------------------------------- Reveal --------------------------------- */

const REVEAL_ICONS = {
  sun: Sun,
  venus: Heart,
  house: InfinityIcon,
} as const;

function RevealStep({
  step,
  sign,
  content,
  onContinue,
}: {
  step: Extract<QuizStep, { kind: "reveal" }>;
  sign?: string;
  content: QuizContent;
  onContinue: () => void;
}) {
  const signData = ZODIAC_SIGNS.find((s) => s.name === sign);
  const trait = sign ? content.loveTrait[sign] : undefined;
  const vars = { sign, trait };

  const fill = (text: string) =>
    text
      .replace("{sign}", sign ? content.signLabel(sign) : "")
      .replace("{trait}", vars.trait ?? "");

  // Destaca a ÚLTIMA frase do fecho ("...posso finalmente ver o rosto dela").
  // Feito por posição, não por texto em inglês — assim vale em qualquer idioma.
  const sentences = step.closing.match(/[^.!?]+[.!?]*/g) ?? [step.closing];
  const closingHighlight = sentences.length > 1 ? sentences[sentences.length - 1].trim() : "";
  const closingLead = closingHighlight
    ? step.closing.slice(0, step.closing.length - closingHighlight.length)
    : step.closing;

  return (
    <div className="text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {step.eyebrow}
      </p>

      {/* Card do signo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass glass-gold relative mt-4 overflow-hidden rounded-3xl px-6 py-8"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.18),transparent_60%)]"
        />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#edd9a3] to-[#a9822f] text-3xl text-[#1a1330]">
            {signData?.symbol ?? "✦"}
          </span>
          <p className="mt-3 font-display text-3xl font-semibold text-[#e8e4f5]">
            {sign ? content.signLabel(sign) : ""}
          </p>
          {signData && (
            <p className="mt-1 text-sm text-[#b9b2d0]">
              {signData.element} · {signData.dates}
            </p>
          )}
        </div>
      </motion.div>

      {/* Leituras do mapa */}
      <ul className="mt-4 flex flex-col gap-2.5 text-left">
        {step.lines.map((line, i) => {
          const Icon = REVEAL_ICONS[line.icon];
          return (
            <motion.li
              key={line.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.35, duration: 0.35 }}
              className="glass flex items-start gap-3 rounded-2xl px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(212,175,55,0.14)]">
                <Icon className="h-4 w-4 text-[#d4af37]" aria-hidden />
              </span>
              <span className="text-[15px] leading-snug text-[#e8e4f5]">
                <span className="font-semibold">{fill(line.title)}</span>{" "}
                <span className="text-[#b9b2d0]">— {fill(line.text)}</span>
              </span>
            </motion.li>
          );
        })}
      </ul>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
      >
        <p className="glass mt-4 rounded-2xl px-5 py-4 text-[15px] leading-relaxed text-[#e8e4f5]">
          {closingLead}
          {closingHighlight && (
            <span className="font-semibold text-[#d4af37]">{closingHighlight}</span>
          )}
        </p>
        <PrimaryButton onClick={onContinue}>
          {step.cta ?? content.ui.continue}
        </PrimaryButton>
      </motion.div>
    </div>
  );
}

/* --------------------------------- Proof --------------------------------- */

const PROOF_COUPLES = [
  {
    photo: "/social-proof/couple-1.webp",
    quote: "After years of waiting, I found him — exactly like the reading said.",
    author: "Sarah C.",
  },
  {
    photo: "/social-proof/couple-2.webp",
    quote: "I found my husband right after my soulmate reading.",
    author: "Ellen T.",
  },
  {
    photo: "/social-proof/couple-3.webp",
    quote:
      "It described him so perfectly I thought it was a coincidence — until we met.",
    author: "Megan R.",
  },
  {
    photo: "/social-proof/couple-4.webp",
    quote: "Aura described my partner perfectly. Now I know he's the one.",
    author: "Claire B.",
  },
];

function ProofStep({
  step,
  ui,
  onContinue,
}: {
  step: Extract<QuizStep, { kind: "proof" }>;
  ui: QuizUI;
  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-[#e8e4f5]">
        {step.title.replace(" soon", "")}{" "}
        <span className="text-gold">soon</span>
      </h2>
      {step.subtitle && (
        <p className="mt-2 text-sm text-[#b9b2d0]">{step.subtitle}</p>
      )}

      <div className="glass mt-5 flex items-center justify-center gap-6 rounded-2xl px-4 py-4">
        <div>
          <p className="font-display text-2xl font-semibold text-[#e8d9a8]">
            {PROOF_STATS.readings}
          </p>
          <p className="text-xs text-[#b9b2d0]">{ui.proofReadings}</p>
        </div>
        <span className="h-8 w-px bg-[rgba(255,255,255,0.12)]" aria-hidden />
        <div>
          <p className="flex items-center justify-center gap-1 font-display text-2xl font-semibold text-[#e8d9a8]">
            {PROOF_STATS.rating}
            <Star className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" aria-hidden />
          </p>
          <p className="text-xs text-[#b9b2d0]">{ui.proofRating}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {PROOF_COUPLES.map((c, i) => (
          <motion.figure
            key={c.author}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
            className="glass overflow-hidden rounded-2xl text-left"
          >
            <Image
              src={c.photo}
              alt=""
              width={320}
              height={320}
              aria-hidden
              className="aspect-square w-full object-cover"
            />
            <figcaption className="p-3">
              <span className="flex gap-0.5" aria-label={ui.fiveStars}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-3 w-3 fill-[#d4af37] text-[#d4af37]"
                    aria-hidden
                  />
                ))}
              </span>
              <p className="mt-1.5 text-xs leading-snug text-[#d6d0e8]">
                &ldquo;{c.quote}&rdquo;
              </p>
              <p className="mt-2 text-[11px] text-[#b9b2d0]">{c.author}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <PrimaryButton onClick={onContinue}>{step.cta ?? "Continue"}</PrimaryButton>
    </div>
  );
}

/* --------------------------------- Media --------------------------------- */

/**
 * A guia manda um ÁUDIO, e o vídeo chega depois.
 *
 * O passo mostrava narração e animação ao mesmo tempo: a voz virava trilha
 * sonora de um vídeo, e a pessoa lia a legenda em vez de escutar. Como
 * mensagem de voz numa DM — bolha, onda, duração correndo — a voz vira o
 * conteúdo, e o retrato chegando depois soa como a guia terminando de
 * desenhar enquanto fala. Mesma promessa, na ordem em que ela convence.
 */
// Depois que o áudio começa. Era 7s — tempo de a pessoa achar que
// travou e sair antes de ver o que veio depois.
// Quanto tempo "Master Aura está gravando um áudio..." fica na tela
// antes de o voice note aparecer. Curto: é tempero, não espera.
const RECORDING_MS = 2600;

const VOICE_NOTE_VIDEO_DELAY_MS = 2500;

/**
 * O áudio NÃO toca sozinho: a pessoa aperta o play.
 *
 * Autoplay resolvia a mensagem de voz por ela e transformava a bolha em
 * decoração — e, na metade dos casos, o browser mutava ou bloqueava e a
 * narração passava sem ninguém ouvir. Apertar o play é um micro-compromisso
 * e a única forma de saber que o som está de fato ligado.
 *
 * Rede de segurança: se ninguém tocar em nada, o vídeo e o botão de seguir
 * aparecem assim mesmo depois deste tempo. É longo de propósito — quem está
 * ali vai tocar antes; ele existe só para que ninguém fique preso num passo
 * sem saída.
 */
// Saída para quem NUNCA toca no play. Eram 20s encarando três
// pontinhos — uma eternidade em funil de tráfego frio.
const VOICE_NOTE_IDLE_MS = 6000;

/**
 * Alturas fixas da onda. Constante, e não aleatória: Math.random aqui daria
 * marcações diferentes no servidor e no cliente (mismatch de hidratação).
 */
const WAVE_BARS = [
  38, 62, 45, 80, 55, 95, 70, 48, 88, 60, 100, 72, 52, 84, 44, 66, 92, 58, 76,
  40, 68, 96, 50, 82, 64, 46, 90, 56, 74, 42,
];

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Mensagem de voz da guia — bolha, onda e relógio, no estilo de uma DM. */
function VoiceNote({
  ui,
  src,
  audioRef,
  playing,
  started,
  elapsed,
  duration,
  onToggle,
}: {
  ui: QuizUI;
  src: string;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playing: boolean;
  /** Já tocou alguma vez. Antes disso o play pulsa e o texto convida. */
  started: boolean;
  elapsed: number;
  duration: number;
  onToggle: () => void;
}) {
  const ratio = duration > 0 ? Math.min(1, elapsed / duration) : 0;
  const filled = Math.round(ratio * WAVE_BARS.length);

  return (
    <div className="mt-3 flex items-end gap-2">
      <Image
        src={GUIDE_PHOTO}
        alt=""
        width={72}
        height={72}
        aria-hidden="true"
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
      />
      <div className="glass flex w-full max-w-[85%] items-center gap-3 rounded-2xl rounded-bl-md border border-[rgba(212,175,55,0.25)] px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? ui.pauseAudio : ui.tapToHear}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[#1a1330] ${
            started ? "" : "animate-pulse"
          }`}
        >
          {playing ? (
            <Pause className="h-4 w-4 fill-current" aria-hidden />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="flex h-7 w-full items-center gap-[2px]"
            role="progressbar"
            aria-label={ui.voiceMessage}
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {WAVE_BARS.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`min-w-[2px] flex-1 rounded-full transition-colors ${
                  i < filled ? "bg-[#d4af37]" : "bg-[rgba(255,255,255,0.22)]"
                }`}
              />
            ))}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#b9b2d0]">
            <span className="tabular-nums">
              {formatClock(elapsed > 0 ? elapsed : duration)}
            </span>
            {!started && <span>{ui.tapToHear}</span>}
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="auto" />
    </div>
  );
}

function MediaStep({
  ui,
  step,
  vars,
  onContinue,
}: {
  ui: QuizUI;
  step: Extract<QuizStep, { kind: "media" }>;
  vars: { name?: string; sign?: string; birthDate?: string };
  onContinue: () => void;
}) {
  const messages = step.messages.map((m) => resolveReactionText(m, vars));
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Começa parado: quem manda no play é a pessoa (ver VOICE_NOTE_IDLE_MS).
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const hasAudio = Boolean(step.audio);
  // Sem áudio (passo da revelação) nada muda: o vídeo entra junto com a fala.
  const [videoReady, setVideoReady] = useState(!hasAudio);
  // "Gravando áudio…" entre a mensagem digitada e o voice note: o áudio
  // não pode simplesmente EXISTIR na tela — alguém precisa estar gravando.
  const [recDone, setRecDone] = useState(!hasAudio);

  useEffect(() => {
    if (!done || !hasAudio || recDone) return;
    const id = window.setTimeout(() => setRecDone(true), RECORDING_MS);
    return () => window.clearTimeout(id);
  }, [done, hasAudio, recDone]);

  // Sem autoplay. Só a limpeza: sair do passo para o áudio.
  // recDone nas dependências (26/08): o <audio> só entra no DOM depois do
  // "gravando áudio…" — sem re-executar nesse momento, audioRef.current
  // ainda era null e NENHUM listener era anexado: o play até soava, mas
  // relógio ficava em 0:00, o ícone nunca virava pause e o passo parecia
  // quebrado (reclamação real do dono, 26/08).
  useEffect(() => {
    if (!done || !hasAudio || !recDone) return;
    const el = audioRef.current;
    if (!el) return;
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, [done, hasAudio, recDone]);

  // O vídeo chega DEPOIS da voz: o contador dos 7s só começa quando o áudio
  // toca de verdade. O timer de ocioso é a saída para quem nunca tocar.
  useEffect(() => {
    if (!done || !hasAudio || videoReady) return;
    let delay: number | undefined;
    const start = () => {
      if (delay != null) return;
      delay = window.setTimeout(
        () => setVideoReady(true),
        VOICE_NOTE_VIDEO_DELAY_MS
      );
    };
    const el = audioRef.current;
    el?.addEventListener("playing", start);
    const idle = window.setTimeout(() => setVideoReady(true), VOICE_NOTE_IDLE_MS);
    return () => {
      el?.removeEventListener("playing", start);
      window.clearTimeout(idle);
      if (delay != null) window.clearTimeout(delay);
    };
  }, [done, hasAudio, videoReady, recDone]);

  const toggleAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      // O toque É o gesto do usuário, então o play não deveria ser recusado;
      // se for, o passo continua saindo pelo timer de ocioso.
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  // Relógio e onda da mensagem de voz.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setElapsed(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration)) setDuration(el.duration);
    };
    const onPlay = () => {
      setPlaying(true);
      setStarted(true);
    };
    const onStop = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onStop);
    el.addEventListener("ended", onStop);
    onMeta();
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onStop);
      el.removeEventListener("ended", onStop);
    };
  }, [done, hasAudio, recDone]);

  return (
    <div>
      {/* A guia DIGITA esta mensagem antes de mandar. É o passo em que ela
          diz que está desenhando o retrato — vir com o texto já pronto na
          tela entregava que era conteúdo de página, não alguém escrevendo. */}
      <GuideConversation
        messages={messages}
        onDone={() => setDone(true)}
        typeFirst
      />

      {done && hasAudio && !recDone && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="mt-3 text-sm italic text-[#b7abdd]"
          role="status"
        >
          {ui.recordingAudio}
        </motion.p>
      )}

      {done && recDone && hasAudio && step.audio && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <VoiceNote
            ui={ui}
            src={step.audio}
            audioRef={audioRef}
            playing={playing}
            started={started}
            elapsed={elapsed}
            duration={duration}
            onToggle={toggleAudio}
          />
        </motion.div>
      )}

      {/* Enquanto a voz corre, a guia "ainda está desenhando". */}
      {/* Bolha de "digitando" só faz sentido enquanto algo ainda vem.
          Com a carta na tela, ela ficava piscando ao lado do conteúdo. */}
      {done && recDone && !videoReady && !step.letter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3"
        >
          <TypingBubble />
        </motion.div>
      )}

      {done && (videoReady || step.letter) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {step.letter ? (
            <div className="mt-3">
              <SoulmateLetter
                name={vars.name}
                birthDate={vars.birthDate}
                sign={vars.sign}
                labels={ui.letter}
              />
            </div>
          ) : (
            <div
              className="relative mt-3 overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.25)] bg-black"
              style={{ aspectRatio: step.aspect }}
            >
              <video
                src={step.src}
                poster={step.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {step.caption && (
            <p className="mt-2 text-center text-xs text-[#b9b2d0]">
              {step.caption}
            </p>
          )}
          <PrimaryButton onClick={onContinue}>
            {step.cta ?? ui.continue}
          </PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}

/* -------------------------------- Location ------------------------------- */

function LocationStep({
  ui,
  cta,
  vars,
  onContinue,
}: {
  ui: QuizUI;
  cta?: string;
  vars: { name?: string; sign?: string; birthDate?: string };
  onContinue: () => void;
}) {
  const name = vars.name;
  const [place, setPlace] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { city?: string | null; region?: string | null }) => {
        if (!alive) return;
        // "Rio de Janeiro, Rio de Janeiro": capital com nome do estado
        // duplicava o rótulo. Um Set resolve sem caso especial.
        const label = [...new Set([d.city, d.region].filter(Boolean))].join(", ");
        setPlace(label || null);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const messages = [
    place
      ? ui.locationWithPlace(place)
      : ui.locationGeneric(name),
  ];

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <MapPin className="h-6 w-6 animate-pulse text-[#d4af37]" aria-hidden />
        <p className="mt-3 text-sm text-[#b9b2d0]">
          {ui.locating}
        </p>
      </div>
    );
  }

  return (
    <div>
      <GuideConversation messages={messages} onDone={() => setDone(true)} />
      {/* A carta: os dados dela na folha da esquerda, a do soulmate sendo
          escrita na direita — e "Meeting location" preenchida com a cidade
          que acabou de aparecer na conversa. É o fecho do funil antes da
          página de venda. */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-4"
        >
          <SoulmateLetter
            name={vars.name}
            birthDate={vars.birthDate}
            sign={vars.sign}
            meetingPlace={place}
            labels={ui.letter}
          />
        </motion.div>
      )}
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PrimaryButton onClick={onContinue}>
            {cta ?? ui.continue}
          </PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------- Birthdate ------------------------------- */

function BirthdateStep({
  ui,
  initialValue,
  onContinue,
}: {
  ui: QuizUI;
  initialValue: string;
  onContinue: (birthDate: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [maxDate, setMaxDate] = useState<string>();

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setMaxDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !signFromDate(value)) {
      setError(ui.birthdateError);
      return;
    }
    if (maxDate && value > maxDate) {
      setError(ui.birthdateFuture);
      return;
    }
    onContinue(value);
  };

  return (
    <form onSubmit={submit} noValidate>
      <GuideConversation
        messages={[
          ui.birthdateIntro,
        ]}
      />
      <label htmlFor="quiz-birthdate" className="sr-only">
        {ui.birthdateLabel}
      </label>
      <input
        id="quiz-birthdate"
        type="date"
        required
        max={maxDate}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        // appearance-none + min-w-0/max-w-full: o iOS Safari dá largura
        // intrínseca ao controle nativo de data e estoura o w-full sem isso.
        className="glass glass-gold mt-6 block min-h-[56px] w-full min-w-0 max-w-full appearance-none rounded-2xl px-4 text-center text-base text-[#e8e4f5] outline-none focus:border-[#d4af37] [color-scheme:dark] [&::-webkit-date-and-time-value]:text-center"
      />
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      <PrimaryButton type="submit">{ui.continue}</PrimaryButton>
    </form>
  );
}

/* --------------------------------- Email -------------------------------- */

function EmailStep({
  ui,
  initialEmail,
  name,
  onContinue,
}: {
  ui: QuizUI;
  initialEmail: string;
  name?: string;
  onContinue: (email: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  // Sugestão de correção de domínio (ex.: gmail.l.com → gmail.com).
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(ui.emailError);
      return;
    }
    // "gmail.l.com" passa no regex mas não existe: a leitura nunca chega e
    // o lead morre. Sugerimos uma vez; se insistir, respeitamos.
    const fix = suggestEmailFix(trimmed);
    if (fix && fix !== suggestion) {
      setSuggestion(fix);
      return;
    }
    onContinue(trimmed);
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setEmail(suggestion);
    setSuggestion(null);
    onContinue(suggestion);
  };

  return (
    <form onSubmit={submit} noValidate>
      <GuideConversation
        messages={[
          ui.emailIntro(name),
        ]}
      />

      <label htmlFor="quiz-email" className="sr-only">
        {ui.emailLabel}
      </label>
      <input
        id="quiz-email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
          setSuggestion(null);
        }}
        // O erro aparece só depois de sair do campo com algo inválido
        // escrito — nunca com o campo vazio, e nunca antes de a pessoa
        // ter escrito qualquer coisa. O submit continua validando também.
        onBlur={() => {
          const trimmed = email.trim();
          if (trimmed && !EMAIL_RE.test(trimmed)) setError(ui.emailError);
        }}
        className="glass glass-gold mt-6 block min-h-[56px] w-full min-w-0 rounded-2xl px-4 text-center text-base text-[#e8e4f5] placeholder:text-[rgba(185,178,208,0.6)] outline-none focus:border-[#d4af37]"
      />
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      {suggestion && (
        <p className="mt-2 text-center text-sm text-[#e8d9a8]">
          {ui.emailSuggestion("")}{" "}
          <button
            type="button"
            onClick={acceptSuggestion}
            className="font-semibold underline underline-offset-2"
          >
            {suggestion}
          </button>
          {ui.emailSuggestionTail}
        </p>
      )}

      <PrimaryButton type="submit">{ui.emailCta}</PrimaryButton>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#b9b2d0]">
        <Lock className="h-3 w-3" aria-hidden="true" />
        {ui.noSpam}
      </p>
    </form>
  );
}

/* ------------------------------- Analyzing ------------------------------ */

const STAGE_INTERVAL_MS = 1100; // 4 stages ≈ 4.4s + exit pause

function AnalyzingScreen({
  name,
  content,
  onDone,
}: {
  name?: string;
  content: QuizContent;
  onDone: () => void;
}) {
  const [completed, setCompleted] = useState(0);
  const doneRef = useRef(false);
  const stages = analyzingStagesFor(content, name);
  const firstName = name?.trim();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCompleted((c) => {
        if (c >= stages.length) return c;
        return c + 1;
      });
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [stages.length]);

  useEffect(() => {
    if (completed >= stages.length && !doneRef.current) {
      doneRef.current = true;
      const timeout = window.setTimeout(onDone, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [completed, stages.length, onDone]);

  const pct = Math.min(100, Math.round((completed / stages.length) * 100));

  return (
    <div className="text-center" aria-live="polite">
      <h2 className="text-balance text-2xl leading-snug sm:text-3xl">
        {content.ui.analyzingTitle}{" "}
        <span className="text-gold">{content.ui.analyzingTitleAccent}</span>
      </h2>
      <p className="mt-2 text-sm text-[#b9b2d0]">
        {content.ui.analyzingBody(firstName)}
      </p>

      <div className="mx-auto mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #edd9a3, #d4af37 60%, #a9822f)",
          }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      </div>

      <ul className="mt-6 flex flex-col gap-3 text-left">
        {stages.map((stage, i) => {
          const isDone = i < completed;
          const isCurrent = i === completed;
          return (
            <li
              key={stage}
              className={`glass flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors duration-300 ${
                isDone ? "glass-gold" : ""
              } ${isDone || isCurrent ? "text-[#e8e4f5]" : "text-[rgba(185,178,208,0.5)]"}`}
            >
              {isDone ? (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex shrink-0"
                >
                  <CircleCheck className="h-5 w-5 text-[#d4af37]" aria-hidden="true" />
                </motion.span>
              ) : isCurrent ? (
                <Loader2
                  className="h-5 w-5 shrink-0 animate-spin text-[#b9b2d0]"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-[rgba(255,255,255,0.15)]"
                  aria-hidden="true"
                />
              )}
              <span>{stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
