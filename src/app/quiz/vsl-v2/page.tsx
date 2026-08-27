"use client";

// ============================================================================
// VARIANTE `vsl_v2_ignite` — área comercial do funil de quiz.
//
// A V1 (/quiz/vsl) continua intacta e é o CONTROLE. Esta rota existe para
// responder UMA pergunta: outra forma de apresentar a MESMA oferta aumenta
// a fração de gente que clica no CTA e abre o checkout?
//
// HIPÓTESE
//   O quiz termina com um retrato sendo desenhado e uma cidade dita em voz
//   alta. Quem chega aqui está segurando um rosto que ainda não viu. A V1
//   troca esse objeto por um DIAGNÓSTICO ("Your Soulmate Signal: Blocked")
//   com barra de três níveis — muda de assunto no primeiro scroll, e a
//   lacuna de curiosidade passa a ser AFIRMADA ("one part is still hidden")
//   em vez de DEMONSTRADA. Se a V2 continuar o fio do retrato e devolver à
//   pessoa, em linguagem de leitura, o que ela mesma respondeu — antes de
//   pedir dinheiro —, a oferta deixa de ser uma compra nova e vira o
//   fechamento de um loop que já está aberto.
//
// VARIÁVEL PRIMÁRIA: apresentação (narrativa, ordem, revelação parcial,
// identidade visual, microcopy do CTA).
//
// OFERTA (24/08): pagamento ÚNICO do que a página promete — a leitura
// completa com o retrato ($29, ou $37 no teste), com The Cord Reading como
// order bump no checkout. A assinatura saiu daqui: o funil inteiro constrói
// desejo por um retrato, e cobrar por acesso a um app no fim era vender
// outra coisa. Continuidade só depois da compra (/quiz/thank-you).
//
// Preço e garantia vivem em src/lib/offer.ts, atrás de env (o mesmo número
// escolhe o price id no servidor), para o teste 29 vs 37 rodar sem deploy.
//
// NENHUMA prova social fabricada: só as fotos que já existem no projeto.
// Sem número de usuários, sem nota média, sem depoimento sem consentimento,
// sem escassez, sem contagem regressiva.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import dynamic from "next/dynamic";
import VSLPlayer from "@/components/VSLPlayer";

// Só baixa quando alguém abre o checkout — carregar sempre custaria ~40KB
// a toda visita, inclusive de quem nunca clica em comprar.
const EmbeddedCheckoutPanel = dynamic(
  () => import("@/components/EmbeddedCheckoutPanel"),
  { ssr: false }
);
// Canvas de poeira estelar do modo cinema. ssr:false porque é 100% canvas
// e o gate abre cedo para parte das visitas — sem razão para pagar no SSR.
const GalaxyParticles = dynamic(() => import("@/components/GalaxyParticles"), {
  ssr: false,
});
import { trackEvent, trackPaymentInitiated } from "@/lib/analytics";
import { openCheckout } from "@/lib/webview";
import { getStoredRef, getVisitorId } from "@/lib/affiliate";
import {
  QUIZ_STORAGE_KEY,
  SIGN_LOVE_TRAIT,
  computeScore,
  type QuizScore,
} from "@/lib/quiz-data";
import { getStoredSource } from "@/lib/source";
import { getFunnelSessionId, getUtmParams } from "@/lib/funnel-session";
import {
  VARIANT_IGNITE,
  getDeviceClass,
  setFunnelVariant,
} from "@/lib/funnel-variant";
import {
  FRONT_PRICE_LABEL,
  FRONT_LIST_PRICE_LABEL,
  FRONT_PRICE_USD,
  FRONT_OFFER_ID,
  FRONT_INCLUDES,
  GUARANTEE_DAYS,
} from "@/lib/offer";
import { OFFER_LAYOUT } from "@/components/PlanPicker";
import { fmtMoney } from "@/lib/pricing";
import { useLocalPricing } from "@/lib/pricing-client";

// Oferta atual: front de pagamento único (ver src/lib/offer.ts).
// O front é UM produto de pagamento único. A assinatura saiu daqui e vive
// no pós-compra, então esta página não tem mais seletor de ciclo.
type PlanKey = "FRONT_READING";
const FRONT_PLAN: PlanKey = "FRONT_READING";

/** Rótulo agregado do funil nos eventos (o ciclo vai em label/offer). */
const OFFER_ID = "unlimited_sub";

const RETURNED_KEY = "astro_vsl_returned";

// 23/08: VSL DE VOLTA por decisão do dono — a página convertia melhor com
// o vídeo. O teste sem vídeo (20/08) rodou justamente na janela em que o
// checkout estava com o botão de pagar fora do alcance no celular (ver
// EmbeddedCheckoutPanel), então ele nunca mediu de verdade a hipótese
// "VSL atrapalha": nenhuma das duas versões conseguia receber um cartão.
// A oferta NÃO é gateada pelo vídeo — o player entra como ativo de
// retenção e o CTA continua visível desde o primeiro scroll.
const SHOW_VSL = true;

interface QuizStore {
  answers?: Record<string, string>;
  email?: string;
  name?: string;
  birthDate?: string;
  sign?: string;
  score?: QuizScore;
}

function readStore(): QuizStore {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as QuizStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// REVELAÇÃO PARCIAL
//
// Tudo abaixo é DERIVADO de respostas que a pessoa realmente deu no quiz —
// devolvido a ela em linguagem de leitura. Nada aqui afirma um fato novo
// sobre o futuro, cita uma carta que não foi tirada ou mostra um número
// que não foi calculado. É a diferença entre personalização real e teatro
// de personalização: o segundo funciona uma vez e queima a marca.
// ---------------------------------------------------------------------------

/** Espelho de q_status — a situação que a própria pessoa declarou. */
const STATUS_MIRROR: Record<string, string> = {
  searching: "single, and still waiting for your person",
  unsure: "with someone, and not sure they are the one",
  complicated: "inside something complicated",
  healing: "still healing from a love that ended",
};

/** Espelho de q_met + a lacuna que ele abre. Agenda dominante: RECONHECER. */
const MET_MIRROR: Record<string, { said: string; gap: string }> = {
  yes: {
    said: "you have already met them, and you think about them constantly",
    gap: "So your reading has one job: describe who your chart actually points to, in enough detail for you to hold it next to the person you cannot stop thinking about.",
  },
  maybe: {
    said: "someone comes to mind, and you cannot be sure",
    gap: "That is the exact question your reading answers. It describes who your chart points to — the traits, the way they show up — so the maybe stops being a maybe.",
  },
  no: {
    said: "you have not met them yet",
    gap: "Which makes the description the whole point. Your reading is what tells you who to recognize, before you walk past them.",
  },
  unsure: {
    said: "you would not know how to tell",
    gap: "Your reading exists for that exact problem. It does not hand you a name — it gives you traits specific enough to recognize.",
  },
};

/**
 * Espelho do atrito. `computeScore` é literalmente o somatório de q_status +
 * q_past + q_ready, então falar em "o que está no caminho" aqui é ler as
 * respostas de volta, não inventar um diagnóstico.
 */
const FRICTION_MIRROR: Record<QuizScore, string> = {
  LOW: "Your answers also pointed at something in the way — a door still open behind you, and a connection that keeps getting interrupted by it.",
  MEDIUM:
    "Your answers also pointed at something unsettled. Not blocking the connection — blurring it, which is harder to notice and easier to ignore.",
  HIGH: "Your answers pointed at almost nothing in the way. That is rarer than you would think, and it is usually the shortest window.",
};

/** O que continua selado até a compra. Tudo aqui é leitura de carta. */
const SEALED: Array<{ n: string; text: string }> = [
  { n: "I", text: "Who the cards point to" },
  { n: "II", text: "The traits that make them recognizable" },
  { n: "III", text: "What may be standing between you" },
  { n: "IV", text: "When your paths are most likely to cross" },
  { n: "V", text: "What the cards suggest doing next" },
];

/** O que a assinatura Unlimited abre — leituras sem contador. */
const PASS: Array<{ n: string; title: string }> = [
  { n: "01", title: "Your complete Soulmate Reading" },
  { n: "02", title: "Ask what may be standing between you" },
  { n: "03", title: "Ask when your paths are most likely to cross" },
  { n: "04", title: "Ask what the cards suggest doing next" },
  { n: "05", title: "Then keep asking — every reading is included" },
];

/** Fotos reais do projeto. Sem frase atribuída — nenhuma delas tem uma. */
const PROOF_PHOTOS = [
  "/social-proof/couple-2.webp",
  "/social-proof/couple-1.webp",
  "/social-proof/couple-4.webp",
  "/social-proof/couple-3.webp",
];

/**
 * Objeções que aparecem ANTES da prova.
 *
 * "Is this a subscription?" saiu daqui em 24/08: a resposta era "Yes —
 * $9.99 a month", e o front passou a ser pagamento único. Manter a
 * pergunta seria afirmar na própria página o contrário do que o botão
 * cobra — a incongruência que esta mudança existe para acabar. Removida,
 * não reescrita.
 */
const OBJECTIONS: Array<{ q: string; a: string }> = [
  {
    q: "Do I need an account first?",
    a: "No. Checkout is guest. You create the account afterwards with the same email, and your readings are already there.",
  },
  {
    q: "What if the reading does not land?",
    a: `You have ${GUARANTEE_DAYS} days. Email us and we refund every cent.`,
  },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What exactly do I unlock?",
    a: "Your complete Soulmate Reading with the portrait — who the cards point toward, the traits that make them recognizable, what may be standing between you, and when your paths are most likely to cross.",
  },
  {
    q: "When do I get access?",
    a: "Immediately after a successful payment. Create your account with the same email you used at checkout and your readings are already there.",
  },
  {
    q: "Is my payment secure?",
    a: "Payment is processed by Stripe. Your card details go straight to Stripe and never touch our servers.",
  },
  {
    q: "What happens to my quiz answers?",
    a: "They are carried into your first reading, so it continues from where the quiz stopped instead of starting over.",
  },
  {
    q: "How accurate is a reading?",
    a: "Your reading is built from your birth data and your quiz answers rather than a generic sun-sign column, so it is specific to you. Tarot is interpretation — it is offered for reflection and insight, not as a factual prediction of the future.",
  },
];

/**
 * Dimensões que acompanham TODO evento desta página.
 *
 * Função PURA sobre o store porque o `quiz_vsl_view` dispara no mesmo
 * effect que lê o localStorage — se dependesse do state já renderizado, o
 * evento mais importante do funil sairia sempre com o `signal` default e
 * `quiz_complete: false`, que é ruído puro no relatório.
 */
function buildParams(store: QuizStore) {
  const answers = store.answers ?? {};
  const hasQuiz = Object.keys(answers).length > 0;
  return {
    category: "quiz",
    variant: VARIANT_IGNITE,
    offer: OFFER_ID,
    signal: store.score ?? (hasQuiz ? computeScore(answers) : "MEDIUM"),
    quiz_complete: hasQuiz,
    device: getDeviceClass(),
    src: getStoredSource() ?? undefined,
    funnel_session_id: getFunnelSessionId(),
    offer_layout: OFFER_LAYOUT,
    ...getUtmParams(),
  };
}

// ---------------------------------------------------------------------------
// ENTRADA POR SCROLL
//
// Um IntersectionObserver por bloco é o caminho óbvio e tem um modo de falha
// caro: ele só avisa quando o elemento CRUZA a viewport. Num salto instantâneo
// — scroll restaurado no reload, volta do Stripe, fling no celular — o bloco
// pula de "abaixo da tela" para "acima da tela" sem nunca intersectar, e fica
// em opacity 0 PARA SEMPRE. Foi exatamente o que aconteceu no teste: 2 de 9
// blocos visíveis depois de um pulo até a oferta. Copy invisível é copy que
// não vende.
//
// Um único listener de scroll com rAF reavalia todos os pendentes: qualquer
// bloco que já esteja na tela — ou que tenha ficado para trás — aparece. O
// listener se remove sozinho quando não sobra ninguém. Zero biblioteca de
// animação: o LCP desta página é um vídeo.
// ---------------------------------------------------------------------------

type PendingReveal = { el: HTMLElement; show: () => void };

const pendingReveals = new Set<PendingReveal>();
let revealScheduled = false;
let revealListening = false;

function flushReveals() {
  revealScheduled = false;
  const limit = window.innerHeight * 0.94;
  for (const item of Array.from(pendingReveals)) {
    if (item.el.getBoundingClientRect().top < limit) {
      pendingReveals.delete(item);
      item.show();
    }
  }
  if (pendingReveals.size === 0 && revealListening) {
    window.removeEventListener("scroll", scheduleReveals);
    window.removeEventListener("resize", scheduleReveals);
    revealListening = false;
  }
}

function scheduleReveals() {
  if (revealScheduled) return;
  revealScheduled = true;
  requestAnimationFrame(flushReveals);
}

function watchReveal(el: HTMLElement, show: () => void) {
  const item: PendingReveal = { el, show };
  pendingReveals.add(item);
  if (!revealListening) {
    window.addEventListener("scroll", scheduleReveals, { passive: true });
    window.addEventListener("resize", scheduleReveals);
    revealListening = true;
  }
  scheduleReveals();
  return () => {
    pendingReveals.delete(item);
  };
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return watchReveal(el, () => setShown(true));
  }, []);

  return (
    <div ref={ref} data-shown={shown} className={`v2-reveal ${className}`}>
      {children}
    </div>
  );
}

/** Regra editorial com rótulo — o separador de seção da variante. */
function Rule({ label }: { label: string }) {
  return (
    <div className="mt-14 flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/35" />
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold-300/70">
        {label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/35" />
    </div>
  );
}

/* Céu do hero cinema — a estética ficou; o portão de 3:30 saiu.
   Ele derrubou lead→checkout de 25% para 8% na manhã em que rodou: a
   página inteira (oferta incluída) volta a existir desde o primeiro
   paint, que era a configuração que convertia.

   Céu: Coordenadas ESTÁTICAS: Math.random() no render
   divergiria entre servidor e browser e quebraria a hidratação. */
const GALAXY_STARS: Array<[number, number, number]> = [
  [4, 12, 1], [11, 34, 2], [18, 7, 1], [24, 58, 2], [31, 22, 1],
  [38, 80, 2], [44, 15, 1], [51, 47, 2], [57, 68, 1], [63, 9, 2],
  [69, 38, 1], [74, 83, 2], [81, 25, 1], [87, 55, 2], [93, 14, 1],
  [8, 72, 2], [27, 90, 1], [47, 88, 2], [66, 76, 1], [90, 66, 2],
  [15, 50, 1], [55, 30, 2], [78, 45, 1], [96, 35, 2],
];

/* Arcanos do baralho local (public/cards/egyptian) flutuando ao fundo —
   nada de hotlink: o snippet de referência puxava do Blogspot, que pode
   sumir a qualquer momento e vaza referer. */
const GALAXY_CARDS: Array<{
  n: number; left: string; top: string; rot: number; w: number; delay: number;
}> = [
  { n: 3, left: "4%", top: "10%", rot: -14, w: 82, delay: 0 },
  { n: 7, left: "78%", top: "7%", rot: 12, w: 70, delay: 2.2 },
  { n: 12, left: "10%", top: "64%", rot: 8, w: 90, delay: 4.1 },
  { n: 17, left: "74%", top: "58%", rot: -10, w: 86, delay: 1.3 },
  { n: 19, left: "42%", top: "80%", rot: 15, w: 74, delay: 3.2 },
  { n: 21, left: "38%", top: "3%", rot: -6, w: 66, delay: 5 },
];

function GalaxyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 10%, rgba(124,92,255,0.22), transparent 60%), radial-gradient(50% 35% at 85% 25%, rgba(212,175,55,0.10), transparent 55%), radial-gradient(70% 50% at 50% 95%, rgba(124,92,255,0.14), transparent 60%)",
        }}
      />
      <GalaxyParticles />
      {GALAXY_STARS.map(([l, t, s], i) => (
        <span
          key={i}
          className="galaxy-star absolute rounded-full bg-white"
          style={{ left: `${l}%`, top: `${t}%`, width: s, height: s, animationDelay: `${(i % 7) * 0.5}s` }}
        />
      ))}
      {GALAXY_CARDS.map((c) => (
        <Image
          key={c.n}
          src={`/cards/egyptian/${c.n}.jpg`}
          alt=""
          width={120}
          height={200}
          loading="lazy"
          className="galaxy-card absolute rounded-lg"
          style={{
            left: c.left, top: c.top, width: c.w, height: "auto",
            transform: `rotate(${c.rot}deg)`, animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function QuizVslV2Page() {
  const [store, setStore] = useState<QuizStore>({});
  const cur = useLocalPricing();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  // Ciclo selecionado no PlanPicker — mensal (o preço prometido) por padrão.
  const selectedPlan = FRONT_PLAN;
  const [error, setError] = useState<string | null>(null);
  /**
   * URL da Checkout Session quando o redirect NAO tirou a pessoa da pagina.
   *
   * 84% do trafego chega pela webview do Facebook, que nao e um navegador
   * completo: la o `location.href` pode ser engolido sem lancar erro. O
   * sintoma bate com os dados — 34 pessoas criaram sessao no Stripe e so 1
   * digitou cartao, e 5 delas clicaram varias vezes achando que travou.
   * Com a URL guardada, a falha silenciosa vira um link tocavel.
   */
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  /** Segredo da sessão embutida — presente = painel de pagamento aberto. */
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  /** Expiração real da sessão embutida — alimenta o cronômetro do painel. */
  const [checkoutExpiresAt, setCheckoutExpiresAt] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [returned, setReturned] = useState(false);

  const [emailModalPlan, setEmailModalPlan] = useState<PlanKey | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const offerRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);


  const viewFiredRef = useRef(false);
  const offerViewedRef = useRef(false);
  const ctaViewedRef = useRef(false);
  /** Trava síncrona contra duplo clique — setState não é imediato. */
  const submittingRef = useRef(false);

  const answers = store.answers ?? {};
  const score: QuizScore =
    store.score ??
    (Object.keys(answers).length > 0 ? computeScore(answers) : "MEDIUM");
  const firstName = store.name?.trim().split(/\s+/)[0];
  const sign = store.sign?.trim();
  const signTrait = sign ? SIGN_LOVE_TRAIT[sign] : undefined;
  const statusMirror = STATUS_MIRROR[answers.q_status ?? ""];
  const metMirror = MET_MIRROR[answers.q_met ?? ""];
  const hasQuiz = Object.keys(answers).length > 0;

  const baseParams = useCallback(() => buildParams(store), [store]);

  // Profundidade de rolagem da página (25/50/75/90%): com o passo do quiz
  // e os marcos do vídeo já medidos, este era o único buraco — saber em
  // qual BLOCO da carta as pessoas param de descer.
  const scrollFiredRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const marks: Array<[number, "vsl_scroll_25" | "vsl_scroll_50" | "vsl_scroll_75" | "vsl_scroll_90"]> = [
      [25, "vsl_scroll_25"],
      [50, "vsl_scroll_50"],
      [75, "vsl_scroll_75"],
      [90, "vsl_scroll_90"],
    ];
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      for (const [at, ev] of marks) {
        if (pct >= at && !scrollFiredRef.current.has(at)) {
          scrollFiredRef.current.add(at);
          trackEvent(ev, { ...baseParams(), value: at });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initial = readStore();

    // Visitante FRIO: chegou sem nenhum vestígio do quiz neste navegador
    // (link de bio, compartilhamento, histórico). A página inteira fala da
    // "sua leitura" — sem quiz não existe leitura, e em 25/08 17 de 19
    // entradas assim morreram aqui, enquanto quem entra pelo quiz começa
    // em 18 de 18. Devolve à porta do funil, preservando a query (?ref=
    // de afiliado sobrevive). Duas exceções que chegam LEGITIMAMENTE sem
    // localStorage: clique de e-mail (abre noutro navegador; links levam
    // ?from=email) e volta de checkout cancelado (?canceled=1 — o escape
    // do webview abre o checkout no Chrome, fora do navegador do quiz).
    if (!initial.answers || Object.keys(initial.answers).length === 0) {
      let exempt = false;
      let search = "";
      try {
        const sp = new URLSearchParams(window.location.search);
        exempt = sp.get("from") === "email" || sp.get("canceled") === "1";
        search = window.location.search;
      } catch {
        // sem window.location utilizável não há o que preservar
      }
      if (!exempt) {
        trackEvent("vsl_cold_redirect", { category: "quiz" });
        window.location.replace("/quiz" + search);
        return;
      }
    }

    setStore(initial);
    setFunnelVariant(VARIANT_IGNITE);

    // Denominador de tudo: quantas pessoas a área comercial recebeu.
    if (!viewFiredRef.current) {
      viewFiredRef.current = true;
      const params = buildParams(initial);
      trackEvent("quiz_vsl_view", params);
      trackEvent("quiz_result_viewed", params);
    }

    let canceled = false;
    try {
      canceled =
        new URLSearchParams(window.location.search).get("canceled") === "1";
      if (canceled) sessionStorage.setItem(RETURNED_KEY, "1");
      if (sessionStorage.getItem(RETURNED_KEY) === "1") setReturned(true);
    } catch {
      if (canceled) setReturned(true);
    }
  }, []);

  // Cidade: /api/geo (headers de borda da Vercel, geo por IP).
  //
  // Só entra no texto quando o visitante está nos EUA E veio cidade + sigla
  // de estado. O funil é escrito em en-US e cita Miami, Austin e Portland;
  // um IP brasileiro, uma VPN ou um IP de operadora fazia a própria leitura
  // dizer "São Paulo, SP" no ponto de maior confiança da página — sem erro
  // nenhum para avisar. Em qualquer outro caso o texto usa a versão sem
  // cidade, que continua fazendo sentido sozinha.
  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: {
            city?: string | null;
            region?: string | null;
            country?: string | null;
          } | null
        ) => {
          if (!alive || !d || d.country !== "US") return;
          const town = d.city?.trim();
          if (!town) return;
          // Convenção dos EUA: "Austin, TX". A Vercel manda a sigla ISO do
          // estado; se vier qualquer outra coisa, fica só a cidade.
          const st = d.region?.trim();
          setCity(st && /^[A-Z]{2}$/.test(st) ? `${town}, ${st}` : town);
        }
      )
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // -------------------------------------------------------------------
  // Medição de posição: offer_viewed, cta_viewed e a barra fixa.
  //
  // Um IntersectionObserver aqui tem o mesmo furo do Reveal — ele não avisa
  // sobre o que a pessoa PULOU. E offer_viewed é métrica de funil: perder o
  // evento num fling faria a V2 parecer pior do que é, que é o pior tipo de
  // erro num teste A/B. Um handler de scroll com rAF avalia posição real, e
  // "passou por cima" conta como visto — que é o que a métrica quer dizer.
  // -------------------------------------------------------------------
  useEffect(() => {
    let scheduled = false;

    const evaluate = () => {
      scheduled = false;
      const vh = window.innerHeight;

      const offerEl = offerRef.current;
      if (offerEl) {
        const rect = offerEl.getBoundingClientRect();
        if (!offerViewedRef.current && rect.top < vh) {
          offerViewedRef.current = true;
          trackEvent("offer_viewed", baseParams());
        }
        // Barra fixa só DEPOIS que a oferta apareceu uma vez, e só enquanto
        // ela não está na tela: antes disso cobriria o vídeo com um preço
        // que a pessoa ainda não sabe do que é.
        setShowSticky(
          offerViewedRef.current && (rect.bottom < 0 || rect.top > vh)
        );
      }

      const ctaEl = ctaRef.current;
      if (ctaEl && !ctaViewedRef.current) {
        const rect = ctaEl.getBoundingClientRect();
        if (rect.top < vh) {
          ctaViewedRef.current = true;
          trackEvent("cta_viewed", { ...baseParams(), cta_position: "primary" });
        }
      }
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(evaluate);
    };

    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [baseParams]);

  // Rede de segurança do painel embutido: MESMA compra como Checkout
  // hospedado (embedded:false). checkout.stripe.com abre em qualquer
  // webview; o iframe não. Usa o ciclo selecionado e o e-mail já salvo.
  const requestHostedUrl = useCallback(async (): Promise<string | null> => {
    const email = store.email?.trim();
    if (!email) return null;
    try {
      const res = await fetch("/api/quiz/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          email,
          ref: getStoredRef(),
          src: getStoredSource(),
          funnelSessionId: getFunnelSessionId(),
          signal: store.score,
          offer: FRONT_OFFER_ID,
          variant: VARIANT_IGNITE,
          cancelPath: "/quiz/vsl-v2",
          embedded: false,
          utm: getUtmParams(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      return data.url ?? null;
    } catch {
      return null;
    }
  }, [store.email, store.score, selectedPlan]);

  const checkout = useCallback(
    async (plan: PlanKey, email: string, ctaPosition: string) => {
      setLoadingPlan(plan);
      setError(null);
      try {
        const res = await fetch("/api/quiz/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            email,
            ref: getStoredRef(),
            src: getStoredSource(),
            funnelSessionId: getFunnelSessionId(),
            signal: score,
            offer: FRONT_OFFER_ID,
            variant: VARIANT_IGNITE,
            // Quem desiste no Stripe volta para ESTA página, não para a V1.
            cancelPath: "/quiz/vsl-v2",
            embedded: true,
            utm: getUtmParams(),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          clientSecret?: string;
          sessionId?: string;
          expiresAt?: number;
          error?: string;
        };
        if (!res.ok || !(data.clientSecret || data.url)) {
          trackEvent("checkout_error", {
            ...baseParams(),
            label: plan,
            status: res.status,
            cta_position: ctaPosition,
          });
          console.error("[quiz/vsl-v2] checkout falhou", res.status, data.error);
          setError(
            data.error ||
              "We couldn't open the secure checkout. Please try again."
          );
          setLoadingPlan(null);
          submittingRef.current = false;
          return;
        }
        // Só aqui a sessão existe de fato no Stripe. Separar este evento do
        // clique é o que distingue "oferta fraca" de "backend quebrado".
        trackEvent("checkout_session_created", {
          ...baseParams(),
          label: plan,
          session_id: data.sessionId,
          cta_position: ctaPosition,
        });
        // Caminho normal: o formulário abre AQUI, sem sair da página.
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setCheckoutExpiresAt(data.expiresAt ?? null);
          setLoadingPlan(null);
          submittingRef.current = false;
          return;
        }

        // Sem client_secret (modo embutido indisponível): volta ao redirect.
        trackEvent("checkout_redirect_started", {
          category: "quiz",
          label: plan,
          offer: OFFER_ID,
        });
        const url = data.url!;
        window.setTimeout(() => {
          if (!document.hidden) {
            setManualUrl(url);
            setLoadingPlan(null);
            submittingRef.current = false;
            trackEvent("checkout_error", {
              category: "quiz",
              label: plan,
              offer: OFFER_ID,
              reason: "redirect_blocked",
            });
          }
        }, 2500);
        openCheckout({ url, sessionId: data.sessionId });
      } catch (e) {
        trackEvent("checkout_error", {
          ...baseParams(),
          label: plan,
          reason: "network",
          cta_position: ctaPosition,
        });
        console.error("[quiz/vsl-v2] erro de rede no checkout:", e);
        setError("We couldn't open the secure checkout. Please try again.");
        setLoadingPlan(null);
        submittingRef.current = false;
      }
    },
    [score, baseParams]
  );

  // UMA página de dinheiro (26/08, decisão do dono): o CTA leva SEMPRE
  // para /quiz/checkout. O desvio hospedado (env CHECKOUT_SURFACE=hosted,
  // sessão da Stripe + redirect) saiu: 13 sessões passaram por ele em
  // 25/08, zero pagaram, e a página hospedada não tem nosso trackeamento.
  // O caminho antigo (`checkout` + modal de e-mail) fica adormecido no
  // arquivo — reativar é decisão de código, não de env.
  const startGuestCheckout = useCallback(
    (plan: PlanKey, ctaPosition: string) => {
      // Guarda síncrona: dois toques rápidos abririam duas navegações.
      if (submittingRef.current || loadingPlan) return;

      trackEvent("checkout_cta_clicked", {
        ...baseParams(),
        label: plan,
        offer: FRONT_OFFER_ID,
        cta_position: ctaPosition,
        surface: "custom",
      });
      trackPaymentInitiated(plan, FRONT_PRICE_USD);
      window.location.href = "/quiz/checkout";
    },
    [loadingPlan, baseParams]
  );

  const submitEmailModal = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    const plan = emailModalPlan;
    if (!plan) return;
    try {
      const next = { ...readStore(), email };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(next));
      setStore(next);
    } catch {
      // storage indisponível — o checkout segue funcionando
    }
    const snapshot = readStore();
    fetch("/api/quiz/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        email,
        name: snapshot.name,
        birthDate: snapshot.birthDate,
        sign: snapshot.sign,
        score: snapshot.score,
        answers: snapshot.answers,
        visitorId: getVisitorId(),
        ref: getStoredRef(),
        src: getStoredSource(),
      }),
    }).catch(() => {});
    trackEvent("lead_captured", { ...baseParams(), label: "vsl_v2_modal" });
    setEmailModalPlan(null);
    void checkout(plan, email, "email_modal");
  }, [emailInput, emailModalPlan, checkout, baseParams]);

  /** CTA. Vende o desejo; o preço fica logo abaixo, legível, sempre. */
  const Cta = ({ id }: { id: string }) => (
    <div className="mt-7">
      <button
        type="button"
        onClick={() => startGuestCheckout(selectedPlan, id)}
        disabled={loadingPlan !== null}
        data-cta={id}
        className="btn-gold flex w-full min-h-[60px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
      >
        {loadingPlan === selectedPlan ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Taking you to secure checkout...
          </>
        ) : (
          <>
            {/* O preço VAI no botão (27/08). "Show me who my soulmate is"
                levava a uma tela de pagamento sem nunca ter dito que havia
                uma — a emboscada que produzia 18 checkouts abertos e 1
                cartão digitado. Um botão que diz o preço é aceito por menos
                gente e traído por ninguém. */}
            Unseal my reading &mdash; {fmtMoney(cur, cur.front)}
            <span aria-hidden>&rarr;</span>
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-white/55">
        One payment of {fmtMoney(cur, cur.front)} &middot; Instant access &middot;{" "}
        {GUARANTEE_DAYS}-day money back &middot; Secure checkout by Stripe
      </p>
      {/* Redirect engolido pela webview: uma linha, sem berrar. */}
      {manualUrl && (
        <p className="mt-3 text-center text-sm text-white/70">
          Taking too long?{" "}
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold underline underline-offset-4"
          >
            Open the secure checkout
          </a>
        </p>
      )}
      {error && (
        <p className="mt-3 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <>
    {/* Some da tela enquanto o checkout está aberto — o formulário da
        Stripe tem de ser a página para o documento rolar (ver painel). */}
    <div className={clientSecret ? "hidden" : "w-full pb-40"}>
      {/* Céu do cinema, exatamente como no modo aprovado — só que a
          página inteira fica visível desde o primeiro paint. */}
      <GalaxyBackdrop />
      {/* ===================================================================
          ACIMA DA DOBRA — continuidade com o fim do quiz.
          Ordem deliberada: (1) isso é sobre você, (2) suas respostas foram
          lidas, (3) o retrato existe e está selado, (4) o vídeo.
          =================================================================== */}
      <section>
        {/* Faixa de estado: o retrato desenhado no quiz, ainda selado. É o
            objeto emocional que a pessoa trouxe do passo anterior. */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/images/soulmate-blur-portrait.webp"
              alt=""
              width={620}
              height={680}
              priority
              className="h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <span className="v2-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-300/80">
              Portrait drawn
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/70">
              <Lock className="h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
              Reading still sealed
            </p>
          </div>
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
          {sign ? `Read against your ${sign} chart` : "Read against your chart"}
        </p>

        <h1 className="mt-2 text-balance text-[1.75rem] leading-[1.1] min-[380px]:text-[2rem] sm:text-[2.4rem]">
          {firstName ? `${firstName}, their face is` : "Their face is"}{" "}
          <span className="text-gold drop-shadow-[0_0_22px_rgba(212,175,55,0.35)]">
            already drawn
          </span>
          .
          <span className="block text-white/70">
            Your reading is what says who it belongs to.
          </span>
        </h1>
      </section>

      {/* VÍDEO — encostado no H1. Nada entre a manchete e o player: em
          320px cada linha de texto aqui empurra o vídeo para fora da dobra,
          e o vídeo é o ativo de retenção da página. */}
      {SHOW_VSL && (
        <section className="mt-5">
          <VSLPlayer placement="quiz_result" variant={VARIANT_IGNITE} />
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Master Aura goes through what your answers turned up — and the one
            part she can only show you inside the reading.
          </p>
        </section>
      )}

      {/* Voltou do Stripe sem concluir. Sem desconto falso, sem contagem
          regressiva — só retoma de onde parou. */}
      {returned && (
        <div className="mt-6 rounded-2xl border border-amber-300/35 bg-amber-300/[0.06] p-4">
          <p className="text-sm text-white/85">
            Nothing was lost{firstName ? `, ${firstName}` : ""} — your reading
            is still here, exactly where you left it.
          </p>
        </div>
      )}

      {/* ===================================================================
          REVELAÇÃO PARCIAL — o coração da variante.
          Devolve à pessoa o que ela respondeu, em linguagem de leitura, e
          só então abre a lacuna. A V1 afirma a lacuna sem demonstrar nada.
          =================================================================== */}
      {/* Sem respostas no storage (link direto, e-mail de recuperação,
          storage limpo) este bloco inteiro sai do ar. Ele existe para
          DEVOLVER o que a pessoa respondeu — sem respostas, "your answers
          pointed at something" seria exatamente a personalização falsa que
          esta página se recusa a fazer. */}
      {hasQuiz && (
        <>
          {/* PONTE (27/08). O quiz termina prometendo ENTREGA ("your
              portrait is ready", "where should I send it") e a página
              seguinte cobra. Sem nada no meio, o preço é lido como isca —
              e a telemetria mostrava gente saindo pelo botão VOLTAR assim
              que via o valor. Esta ponte nomeia a troca antes de qualquer
              número aparecer: o mapa é de graça, ler o mapa é o trabalho. */}
          <Reveal className="mt-14">
            <p className="text-[15px] leading-relaxed text-white/80">
              Master Aura went quiet for a reason
              {firstName ? `, ${firstName}` : ""}. Drawing the face is the fast
              part &mdash; your chart does that on its own, and it cost you
              nothing but fifteen honest answers.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/80">
              But a face is not a person. Knowing who they are, what they carry,
              what keeps getting in the way, and when your paths bend toward
              each other &mdash; that has to be read, line by line, against your
              chart and your answers. That is the part with a price on it. It is
              also the part you actually came here for.
            </p>
          </Reveal>

          <Rule label="What your answers turned up" />

          <Reveal className="mt-6">
            <div className="space-y-5 border-l border-gold-400/25 pl-5">
              {signTrait && (
                <p className="text-[15px] leading-relaxed text-white/80">
                  <span className="font-medium text-gold">Sun in {sign}</span> —{" "}
                  {signTrait}.
                </p>
              )}

              {statusMirror && (
                <p className="text-[15px] leading-relaxed text-white/80">
                  Right now you are {statusMirror}.
                </p>
              )}

              {metMirror && (
                <p className="text-[15px] leading-relaxed text-white/80">
                  And you said {metMirror.said}.
                </p>
              )}

              <p className="text-[15px] leading-relaxed text-white/80">
                {FRICTION_MIRROR[score]}
              </p>

              <p className="text-[15px] leading-relaxed text-white/80">
                {city ? (
                  <>
                    And your chart placed the meeting near{" "}
                    <span className="font-medium text-white">{city}</span> — the
                    nearest place your paths are drawn to cross.
                  </>
                ) : (
                  "And your chart placed the meeting closer than you would guess."
                )}
              </p>
            </div>
          </Reveal>
        </>
      )}

      {/* A LACUNA — a única coisa que o vídeo não pode entregar. */}
      <Reveal className="mt-10">
        <h2 className="text-[1.6rem] leading-tight sm:text-[1.9rem]">
          {/* "None of THAT" só faz sentido se o bloco espelho existiu. */}
          {hasQuiz
            ? "None of that is the part you came for."
            : "The part you came for is still sealed."}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/75">
          {metMirror?.gap ??
            "Your reading has one job: describe who your chart points to, in enough detail that you would recognize them."}
        </p>
      </Reveal>

      {/* O QUE SEGUE SELADO */}
      <Reveal className="mt-8">
        <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {SEALED.map((item) => (
            <li
              key={item.n}
              className="flex items-center gap-3.5 px-4 py-3.5 text-sm text-white/75"
            >
              <span className="w-5 shrink-0 font-display text-xs tracking-widest text-gold-400/60">
                {item.n}
              </span>
              <span className="flex-1">{item.text}</span>
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-gold-400/70"
                aria-hidden
              />
            </li>
          ))}
        </ul>
      </Reveal>

      {/* ===================================================================
          PONTE — significado, consequência, saída. O produto entra como
          consequência da história, não como um botão que apareceu.
          =================================================================== */}
      <Reveal className="mt-10">
        <p className="text-[15px] leading-relaxed text-white/75">
          A signal you never read is a signal you act on anyway. It is why
          people stay a year too long in the wrong thing, and walk past the
          right one without a second look
          {city
            ? ` — sometimes on the same street in ${city}`
            : " — sometimes on the same street you already walk"}
          .
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-white/75">
          The reading is not a promise about your future. It is the description
          you have been missing — specific enough to recognize, and yours to
          keep.
        </p>
      </Reveal>

      {/* ===================================================================
          OFERTA — resultado primeiro, formato depois. Sem value stack.
          =================================================================== */}
      <div ref={offerRef}>
        <Rule label="Your complete reading" />

        <Reveal className="mt-6">
          <div className="rounded-3xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.07] to-transparent p-6">
            {/* Era repetição literal do H1 do topo: no ponto de maior
                resistência a página devolvia uma frase lida quatro minutos
                antes — nada novo na cabeça dela, logo nenhuma razão nova
                para agir. Agora nomeia a troca: o mapa guarda, a leitura
                revela. */}
            <h2 className="text-[1.55rem] leading-tight">
              {firstName ? `${firstName}, your` : "Your"} chart already holds
              this.
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-white/85">
              The face, the temperament, the timing &mdash; none of it gets
              invented on this page. It gets read out, against your birth chart
              and the fifteen answers you just gave. Here is what comes back:
            </p>

            <ul className="mt-4 space-y-2.5">
              {FRONT_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold-400"
                    aria-hidden
                  />
                  <span className="text-[15px] leading-snug text-white/85">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[15px] font-semibold leading-relaxed text-white">
              One payment of{" "}
              <span className="text-white/45 line-through">
                {fmtMoney(cur, cur.list)}
              </span>{" "}
              {fmtMoney(cur, cur.front)}. Yours to keep.
            </p>
            {/* "50% off só para quem fez o quiz" é a frase mais descontada
                da internet e não é verificável. Esta é: a home cobra
                {cur.list} de verdade, hoje. Convidar a conferir é coisa que
                só quem não está blefando faz — e dá um MOTIVO ao desconto,
                o que impede o preço novo de virar a próxima âncora de
                barganha. */}
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">
              The same reading is {fmtMoney(cur, cur.list)} from our home page.
              Go and check &mdash; it will still be there when you come back.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">
              You are not on the home page. You answered fifteen questions, so
              there is something real to read you against. That is worth half to
              us.
            </p>

            <p className="mt-4 text-[15px] leading-relaxed text-white/75">
              A single reading with a psychic runs $30 to $150, and ends when
              the call ends. This one you keep, and you can hold it next to the
              person you cannot stop thinking about.
            </p>

            {/* O medo dela não é perder o dinheiro — é pagar por um
                horóscopo genérico com o nome dela colado. A garantia antiga
                respondia a uma objeção que ela não tinha. Esta diz o caso de
                falha em voz alta. */}
            <p className="mt-4 text-[15px] leading-relaxed text-white/75">
              Here is the failure case, said out loud: you open it and it
              describes nobody. Someone tall. Someone kind. A Tuesday. If that
              is what lands, write to us and say so &mdash; all{" "}
              {fmtMoney(cur, cur.front)} back, {GUARANTEE_DAYS} days, no
              questions, and the portrait stays yours either way. We would
              rather refund you than have you carrying around a description of
              no one.
            </p>

            <div ref={ctaRef}>
              <Cta id="offer_card" />
            </div>
          </div>
        </Reveal>
      </div>

      {/* ===================================================================
          OBJEÇÕES — inline, antes da prova, na ordem em que aparecem.
          =================================================================== */}
      <Reveal className="mt-10">
        <div className="space-y-4">
          {OBJECTIONS.map((o) => (
            <div key={o.q}>
              <p className="text-sm font-semibold text-white/90">{o.q}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{o.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-gold-400"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-white/70">
            {GUARANTEE_DAYS} days to decide. If AstroTarot is not for you,
            email us and we refund every cent.
          </p>
        </div>
      </Reveal>

      {/* ===================================================================
          PROVA — só o que existe de verdade no projeto: fotos.
          Sem depoimento fabricado, sem contagem de usuários, sem estrelas
          sem origem. Um bloco honesto vale mais que um carrossel inventado.
          =================================================================== */}
      <Rule label="Already reading" />

      <Reveal className="mt-6">
        <div className="grid grid-cols-2 gap-2.5">
          {PROOF_PHOTOS.map((photo) => (
            <div
              key={photo}
              className="overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={photo}
                alt=""
                width={1080}
                height={1080}
                loading="lazy"
                sizes="(max-width: 640px) 45vw, 240px"
                className="aspect-square h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-white/40">
          People exploring their answers with AstroTarot.
        </p>
      </Reveal>

      <Reveal>
        <Cta id="after_proof" />
      </Reveal>

      {/* ===================================================================
          FAQ
          =================================================================== */}
      <Rule label="Before you decide" />

      <div className="mt-5 space-y-2">
        {FAQ_ITEMS.map((item, i) => {
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
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium"
              >
                {item.q}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
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

      {/* FECHAMENTO */}
      <Reveal className="mt-10">
        <p className="text-center text-[15px] leading-relaxed text-white/75">
          The portrait is drawn{firstName ? `, ${firstName}` : ""}. The only
          thing left is the name of what you are looking at.
        </p>
        <Cta id="after_faq" />
      </Reveal>

      {/* A antiga "segunda opção" Premium $14.99 saiu: a oferta principal
          agora É a assinatura ilimitada, por menos. Duas assinaturas na
          mesma página só disputariam entre si. */}

      {/* Barra fixa — só depois que a oferta já apareceu uma vez. */}
      {showSticky && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-3 pt-3 backdrop-blur-md"
          style={{
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={() => startGuestCheckout(selectedPlan, "sticky")}
            disabled={loadingPlan !== null}
            className="btn-gold mx-auto flex w-full max-w-lg min-h-[54px] items-center justify-center gap-2 rounded-full px-6 text-sm font-bold uppercase tracking-[0.06em] disabled:opacity-60"
          >
            {loadingPlan === selectedPlan ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Opening your reading...
              </>
            ) : (
              <>
                Show me who my soulmate is
                <span aria-hidden>&rarr;</span>
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-white/55">
            One payment of {FRONT_PRICE_LABEL} &middot; {GUARANTEE_DAYS}-day
            money back
          </p>
        </div>
      )}

      {/* Email modal (guest sem e-mail guardado) */}
      {emailModalPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="glass w-full max-w-sm rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Where should we send your reading?
              </h2>
              <button
                type="button"
                onClick={() => setEmailModalPlan(null)}
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
                if (e.key === "Enter") submitEmailModal();
              }}
              placeholder="you@email.com"
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-gold-400/60"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {emailError}
              </p>
            )}
            <button
              type="button"
              onClick={submitEmailModal}
              className="btn-gold mt-4 flex w-full min-h-[52px] items-center justify-center rounded-full px-6 font-semibold"
            >
              Continue to secure checkout
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Checkout embutido: a pessoa continua no nosso domínio e volta para
        a oferta se fechar. Irmão do conteúdo, não filho. */}
    {clientSecret && (
      <EmbeddedCheckoutPanel
        clientSecret={clientSecret}
        expiresAt={checkoutExpiresAt}
        onClose={() => setClientSecret(null)}
        requestHostedUrl={requestHostedUrl}
      />
    )}
    </>
  );
}
