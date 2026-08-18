// Conteúdo do funil por idioma — ponto único de troca.
//
// O motor do quiz (ordem dos passos, score, analytics) não sabe que existe
// idioma: os ids e os `value` das opções são os MESMOS em todas as línguas.
// Só o texto muda.

import {
  ANALYZING_STAGES,
  SIGN_LOVE_TRAIT,
  STEPS,
  type QuizStep,
} from "@/lib/quiz-data";
import type { Locale } from "@/lib/i18n";
import {
  ANALYZING_STAGES_ES,
  SIGN_ES,
  SIGN_LOVE_TRAIT_ES,
  STEPS_ES,
  UI_ES,
} from "@/lib/i18n/quiz-es";

export const UI_EN = {
  back: "Go back",
  progress: "Quiz progress",
  continue: "Continue",
  showAllMessages: "Show all messages",
  typing: "Typing",
  yourFirstName: "Your first name",
  nameError: "Please tell me your name so I can read your chart.",
  birthdateIntro:
    "Your exact birth date is what turns a reading into a portrait — it fixes the position of Venus at the moment you were born.",
  birthdateLabel: "Birth date",
  birthdateError: "Please enter your full birth date.",
  birthdateFuture: "Your birth date can't be in the future.",
  emailIntro: (name?: string) =>
    name
      ? `${name}, your portrait is ready. Where should I send your full Soulmate Reading?`
      : "Your portrait is ready. Where should I send your full Soulmate Reading?",
  emailLabel: "Email address",
  emailError: "Please enter a valid email address.",
  emailSuggestion: (fix: string) => `Did you mean ${fix}?`,
  emailSuggestionTail: " Tap to fix, or continue to keep what you typed.",
  emailCta: "Reveal my soulmate",
  noSpam: "No spam. Your reading stays private.",
  locating: "Locating the meeting point in your chart...",
  locationWithPlace: (place: string) =>
    `Your birth chart shows that you are likely to meet your soulmate near to 📍 ${place}. I have prepared a special revelation for you, let's see it right now. ✨`,
  locationGeneric: (name?: string) =>
    `Your birth chart shows the meeting point is close to where you are right now${
      name ? `, ${name}` : ""
    }. I have prepared a special revelation for you, let's see it right now. ✨`,
  tapToHear: "Tap to hear Master Aura",
  voiceMessage: "Voice message from Master Aura",
  pauseAudio: "Pause",
  analyzingTitle: "Reading your",
  analyzingTitleAccent: "soulmate signature",
  analyzingBody: (name?: string) =>
    name ? `Hold on, ${name} — this takes a few seconds.` : "Hold on — this takes a few seconds.",
  proofReadings: "readings delivered",
  proofRating: "average rating",
  verifiedMember: "Verified member",
  fiveStars: "5 out of 5 stars",
} as const;

export type QuizUI = typeof UI_EN;

export interface QuizContent {
  locale: Locale;
  steps: QuizStep[];
  ui: QuizUI;
  analyzingStages: string[];
  /** Traço de amor por signo, já no idioma. */
  loveTrait: Record<string, string>;
  /** Nome do signo exibido (o interno segue em inglês). */
  signLabel: (name: string) => string;
}

export function getQuizContent(locale: Locale): QuizContent {
  if (locale === "es") {
    return {
      locale,
      steps: STEPS_ES,
      ui: UI_ES as unknown as QuizUI,
      analyzingStages: ANALYZING_STAGES_ES,
      loveTrait: SIGN_LOVE_TRAIT_ES,
      signLabel: (name) => SIGN_ES[name] ?? name,
    };
  }
  return {
    locale: "en",
    steps: STEPS,
    ui: UI_EN,
    analyzingStages: ANALYZING_STAGES,
    loveTrait: SIGN_LOVE_TRAIT,
    signLabel: (name) => name,
  };
}

/** Última etapa do "analisando", personalizada com o primeiro nome. */
export function analyzingStagesFor(content: QuizContent, name?: string): string[] {
  const trimmed = name?.trim();
  if (!trimmed) return content.analyzingStages;
  const stages = [...content.analyzingStages];
  stages[stages.length - 1] =
    content.locale === "es"
      ? `Compilando la Lectura de ${trimmed}`
      : `Compiling ${trimmed}'s Soulmate Reading`;
  return stages;
}
