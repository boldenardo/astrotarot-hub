// Roteiro do funil em espanhol.
//
// Tradução de VENDA, não literal: o espanhol neutro (LatAm/US) usa "tú",
// evita gírias regionais e mantém o ritmo íntimo da Master Aura. Os ids,
// values e a ordem são idênticos ao inglês — o motor do quiz, o score e o
// analytics não sabem que existe idioma.

import type { QuizStep } from "@/lib/quiz-data";
import { ZODIAC_SIGNS } from "@/lib/quiz-data";

/** Nome do signo em espanhol, por nome interno (que segue em inglês). */
export const SIGN_ES: Record<string, string> = {
  Aries: "Aries",
  Taurus: "Tauro",
  Gemini: "Géminis",
  Cancer: "Cáncer",
  Leo: "Leo",
  Virgo: "Virgo",
  Libra: "Libra",
  Scorpio: "Escorpio",
  Sagittarius: "Sagitario",
  Capricorn: "Capricornio",
  Aquarius: "Acuario",
  Pisces: "Piscis",
};

const DATES_ES: Record<string, string> = {
  Capricorn: "22 dic – 19 ene",
  Aquarius: "20 ene – 18 feb",
  Pisces: "19 feb – 20 mar",
  Aries: "21 mar – 19 abr",
  Taurus: "20 abr – 20 may",
  Gemini: "21 may – 20 jun",
  Cancer: "21 jun – 22 jul",
  Leo: "23 jul – 22 ago",
  Virgo: "23 ago – 22 sep",
  Libra: "23 sep – 22 oct",
  Scorpio: "23 oct – 21 nov",
  Sagittarius: "22 nov – 21 dic",
};

/** Traço de amor por signo — usado na revelação do mapa. */
export const SIGN_LOVE_TRAIT_ES: Record<string, string> = {
  Aries: "amas rápido, entera y sin red de seguridad",
  Taurus: "amas una vez — y te quedas",
  Gemini: "te enamoras de la mente antes que de nada",
  Cancer: "amas con todo el corazón, y lo cuidas con celo",
  Leo: "amas con el corazón entero",
  Virgo: "demuestras amor cuidando los detalles",
  Libra: "naciste para el vínculo de a dos",
  Scorpio: "amas a una profundidad que pocos alcanzan",
  Sagittarius: "amas a quien camina a tu lado, no detrás",
  Capricorn: "construyes un amor hecho para durar",
  Aquarius: "amas justo a quien nadie más entiende",
  Pisces: "sientes la conexión antes de que ocurra",
};

export const STEPS_ES: QuizStep[] = [
  {
    id: "name",
    kind: "name",
    messages: [
      "Soy Master Aura. Antes de abrir tu carta astral, necesito una cosa de ti.",
      "Dime — ¿cómo te llamo?",
    ],
    placeholder: "Tu nombre",
    cta: "Continuar",
  },
  {
    id: "c_welcome",
    kind: "chat",
    messages: [
      "Es un verdadero placer conocerte, {name}. ✨",
      "Ya siento una conexión especial formándose a tu alrededor.",
      "¿Estás lista para descubrir a la persona que el universo ha estado preparando para ti?",
    ],
    cta: "Sí, estoy lista ✨",
  },
  {
    id: "q_status",
    kind: "question",
    intro: [
      "Primero, dime dónde está tu corazón ahora mismo. Las cartas leen la verdad, no la respuesta que quisiéramos que fuera cierta.",
    ],
    question: "¿Dónde estás en el amor en este momento?",
    options: [
      { value: "searching", label: "Soltera, esperando a mi persona" },
      { value: "unsure", label: "Con alguien, pero dudo que sea la indicada" },
      { value: "complicated", label: "En algo complicado" },
      { value: "healing", label: "Sanando de un amor que terminó" },
    ],
  },
  {
    id: "q_met",
    kind: "question",
    question: "¿Sientes que ya la conociste?",
    options: [
      { value: "yes", label: "Sí — y pienso en esa persona todo el tiempo" },
      { value: "maybe", label: "Quizás... alguien me viene a la mente" },
      { value: "no", label: "No, todavía no" },
      { value: "unsure", label: "No sabría cómo darme cuenta" },
    ],
  },
  {
    id: "q_sign",
    kind: "question",
    intro: [
      "Cada uno de nosotros lleva un alma gemela escrita en las estrellas desde el día en que nace.",
      "Dime tu signo para leer tu carta y poder visualizarla.",
    ],
    question: "¿Cuál es tu signo zodiacal?",
    options: ZODIAC_SIGNS.map((sign) => ({
      value: sign.name,
      label: SIGN_ES[sign.name] ?? sign.name,
      symbol: sign.symbol,
      hint: DATES_ES[sign.name] ?? sign.dates,
    })),
  },
  {
    id: "reveal_chart",
    kind: "reveal",
    eyebrow: "Lo que revela tu carta astral",
    lines: [
      { icon: "sun", title: "Sol en {sign}", text: "{trait}." },
      {
        icon: "venus",
        title: "Venus activa",
        text: "te atrae alguien que te adora y te admira.",
      },
      {
        icon: "house",
        title: "Casa 7 encendida",
        text: "una conexión de alma gemela ya se está formando.",
      },
    ],
    closing:
      "Tu carta me dice algo poco común: la alineación para encontrar a tu alma gemela se está abriendo ahora mismo. Con esto, por fin puedo visualizar su rostro.",
    cta: "Continuar",
  },
  {
    id: "q_past",
    kind: "question",
    intro: [
      "Antes de dibujarla, algo puede nublar la imagen: una puerta abierta al pasado.",
    ],
    question: "¿Hay alguien del pasado en quien todavía piensas?",
    options: [
      { value: "often", label: "Sí — casi todos los días" },
      { value: "sometimes", label: "A veces, de la nada" },
      { value: "letting_go", label: "Estoy intentando soltarlo" },
      { value: "no", label: "No, ese capítulo está cerrado" },
    ],
  },
  {
    id: "q_ready",
    kind: "question",
    question: "Si apareciera mañana, ¿estarías lista?",
    options: [
      { value: "yes", label: "Sí — hace tiempo que lo estoy" },
      { value: "scared", label: "Sí, pero sinceramente me da miedo" },
      { value: "work", label: "Todavía me falta sanar un poco" },
      { value: "unsure", label: "No sé si la reconocería" },
    ],
  },
  {
    id: "proof",
    kind: "proof",
    title: "Vas a encontrar a tu alma gemela pronto",
    subtitle: "Ellas también esperaron. Y entonces todo cambió.",
    cta: "Continuar",
  },
  { id: "birthdate", kind: "birthdate" },
  {
    id: "media_drawing",
    kind: "media",
    messages: [
      "Con tu carta astral, estoy preparando el retrato de tu alma gemela. Empiezo ahora mismo 👇🔮",
    ],
    src: "/funnel/portrait-drawing.mp4",
    poster: "/funnel/portrait-drawing-poster.webp",
    aspect: "16 / 9",
    audio: "/funnel/soulmate-narration.mp3",
    caption: "Inicial · Fecha de nacimiento · Signo · Lugar del encuentro · Fecha",
    cta: "Continuar",
  },
  {
    id: "location",
    kind: "location",
    cta: "Muéstrame la revelación ✨",
  },
  {
    id: "media_reveal",
    kind: "media",
    messages: [
      "Las cartas ya se asentaron. Esta es la energía de la persona a la que tu carta sigue apuntando.",
    ],
    src: "/funnel/soulmate-reveal.mp4",
    poster: "/funnel/soulmate-reveal-poster.webp",
    aspect: "16 / 9",
    cta: "Revelar su rostro",
  },
  { id: "email", kind: "email" },
  {
    id: "analyzing",
    kind: "interstitial",
    title: "Leyendo tu firma de alma gemela",
    body: "Un momento — esto tarda unos segundos.",
  },
];

/** Etapas da tela de "analisando". */
export const ANALYZING_STAGES_ES = [
  "Mapeando tu carta astral",
  "Ubicando tu Venus y tu casa 7",
  "Sacando tus cartas de alma gemela",
  "Compilando tu Lectura de Alma Gemela",
];

/** Textos de interface do funil (botões, rótulos, avisos). */
export const UI_ES = {
  letter: {
    name: "Nombre",
    birthDate: "Fecha de nacimiento",
    zodiac: "Signo",
    title: "Tu Alma Gemela",
    fields: [
      "Inicial del nombre",
      "Fecha de nacimiento",
      "Signo",
      "Lugar del encuentro",
      "Fecha del encuentro",
    ],
  },
  back: "Volver",
  progress: "Progreso del quiz",
  continue: "Continuar",
  showAllMessages: "Ver todos los mensajes",
  typing: "Escribiendo",
  yourFirstName: "Tu nombre",
  nameError: "Dime tu nombre para poder leer tu carta.",
  birthdateIntro:
    "Tu fecha exacta de nacimiento es lo que convierte una lectura en un retrato — fija la posición de Venus en el momento en que naciste.",
  birthdateLabel: "Fecha de nacimiento",
  birthdateError: "Ingresa tu fecha de nacimiento completa.",
  birthdateFuture: "Tu fecha de nacimiento no puede estar en el futuro.",
  emailIntro: (name?: string) =>
    name
      ? `${name}, tu retrato está listo. ¿A dónde te envío tu Lectura de Alma Gemela completa?`
      : "Tu retrato está listo. ¿A dónde te envío tu Lectura de Alma Gemela completa?",
  emailLabel: "Correo electrónico",
  emailError: "Ingresa un correo electrónico válido.",
  emailSuggestion: (fix: string) => `¿Quisiste decir ${fix}?`,
  emailSuggestionTail: " Toca para corregir, o continúa con lo que escribiste.",
  emailCta: "Revelar a mi alma gemela",
  noSpam: "Sin spam. Tu lectura es privada.",
  locating: "Ubicando el punto de encuentro en tu carta...",
  locationWithPlace: (place: string) =>
    `Tu carta astral muestra que es probable que encuentres a tu alma gemela cerca de 📍 ${place}. Preparé una revelación especial para ti, veámosla ahora mismo. ✨`,
  locationGeneric: (name?: string) =>
    `Tu carta astral muestra que el punto de encuentro está cerca de donde estás ahora${
      name ? `, ${name}` : ""
    }. Preparé una revelación especial para ti, veámosla ahora mismo. ✨`,
  tapToHear: "Toca para escuchar a Master Aura",
  voiceMessage: "Mensaje de voz de Master Aura",
  pauseAudio: "Pausar",
  analyzingTitle: "Leyendo tu",
  analyzingTitleAccent: "firma de alma gemela",
  analyzingBody: (name?: string) =>
    name ? `Un momento, ${name} — esto tarda unos segundos.` : "Un momento — esto tarda unos segundos.",
  proofReadings: "lecturas realizadas",
  proofRating: "calificación promedio",
  verifiedMember: "Miembro verificado",
  fiveStars: "5 de 5 estrellas",
} as const;
