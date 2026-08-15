// Recompensas do streak — TODAS de custo marginal zero.
//
// Regra do produto: bonificar sem gerar despesa por usuário. Nada aqui
// chama API paga na hora do resgate. Mensagens e leituras são texto
// pronto; wallpapers saem de uma biblioteca gerada UMA vez em lote
// (scripts/generate-wallpapers.mjs) e servida como arquivo estático.

export interface StreakReward {
  /** Dias de sequência necessários. */
  milestone: number;
  kind: "message" | "wallpaper" | "reading";
  title: string;
  description: string;
}

export const STREAK_REWARDS: StreakReward[] = [
  {
    milestone: 3,
    kind: "message",
    title: "A message from Master Aura",
    description: "Three days in a row. She wrote something for you.",
  },
  {
    milestone: 7,
    kind: "wallpaper",
    title: "Your zodiac wallpaper",
    description: "A full week. Take your sign with you everywhere.",
  },
  {
    milestone: 14,
    kind: "reading",
    title: "Your week ahead",
    description: "Two weeks straight. Here's what the transits say is coming.",
  },
  {
    milestone: 30,
    kind: "wallpaper",
    title: "The Moon Phase collection",
    description: "Thirty days. Very few people get here.",
  },
];

/** Frases da Master Aura — sorteadas pela sequência, sem chamada de IA. */
export const AURA_MESSAGES: string[] = [
  "The fact that you keep coming back means something. The cards notice consistency.",
  "You are not behind. You are exactly where the timing wanted you.",
  "What feels like a delay is usually protection you can't see yet.",
  "Someone is thinking about you today with more warmth than they'll admit.",
  "The door you keep knocking on is not the one that opens. Look left.",
  "Your patience is not passive. It is doing work you can't measure yet.",
  "Stop asking whether you're too much. Ask whether they're enough.",
  "A conversation you've been avoiding is lighter than you think it is.",
];

/** Escolhe a mensagem de forma estável para um dia e uma pessoa. */
export function pickMessage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AURA_MESSAGES[Math.abs(hash) % AURA_MESSAGES.length];
}

/** Marcos já alcançados e ainda não entregues. */
export function pendingRewards(
  currentStreak: number,
  claimed: number[]
): StreakReward[] {
  return STREAK_REWARDS.filter(
    (r) => currentStreak >= r.milestone && !claimed.includes(r.milestone)
  );
}

/** Próximo marco, para mostrar o quanto falta. */
export function nextMilestone(currentStreak: number): StreakReward | null {
  return STREAK_REWARDS.find((r) => r.milestone > currentStreak) ?? null;
}
