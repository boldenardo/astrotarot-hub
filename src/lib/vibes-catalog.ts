// Catálogo do Vibes & Meditations.
//
// As faixas vivem no bucket PRIVADO `vibes` do Supabase Storage — nunca
// em public/ e nunca como URL absoluta. O campo `src` guarda o CAMINHO
// dentro do bucket; o player pede uma signed URL a /api/vibes/stream,
// que só responde para quem tem o entitlement `vibes` (bump de $19 no
// checkout ou add-on de $9.99/mês). Upload: scripts/upload-vibes-audio.mjs
// (fontes em deliverables/vibes-audio/, fora do git).
//
// Formato: mp3 128kbps estéreo (estéreo preserva o 8D da faixa de sono).

export interface VibeTrack {
  id: string;
  title: string;
  /** Para que serve, na linguagem de quem procura. */
  intention: "abundance" | "love" | "sleep" | "focus" | "release";
  /** Duração em segundos, exibida na lista. */
  duration: number;
  /** Caminho do arquivo dentro do bucket privado `vibes`. */
  src: string;
}

export const VIBE_INTENTIONS: Record<
  VibeTrack["intention"],
  { label: string; description: string }
> = {
  abundance: {
    label: "Abundance",
    description: "Open the channel money already wants to take",
  },
  love: {
    label: "Love",
    description: "Call in the connection your chart keeps pointing to",
  },
  sleep: {
    label: "Deep sleep",
    description: "Let the day close so tomorrow can open",
  },
  focus: {
    label: "Focus",
    description: "Quiet the noise and finish what matters",
  },
  release: {
    label: "Release",
    description: "Put down what stopped being yours to carry",
  },
};

export const VIBE_TRACKS: VibeTrack[] = [
  {
    id: "manifestation",
    title: "Gain Abundance, Love & Happiness",
    intention: "abundance",
    duration: 1312,
    src: "tracks/manifestation.mp3",
  },
  {
    id: "raise-vibration",
    title: "Prosperity from the Inside Out",
    intention: "abundance",
    duration: 948,
    src: "tracks/raise-vibration.mp3",
  },
  {
    id: "gratitude",
    title: "Generating Gratitude",
    intention: "abundance",
    duration: 901,
    src: "tracks/gratitude.mp3",
  },
  {
    id: "connection",
    title: "Manifest Your Soulmate",
    intention: "love",
    duration: 1062,
    src: "tracks/connection.mp3",
  },
  {
    id: "self-love",
    title: "Self-Love & Inner Child Healing",
    intention: "love",
    duration: 1311,
    src: "tracks/self-love.mp3",
  },
  {
    id: "sleep-well",
    title: "Guided Sleep Talkdown",
    intention: "sleep",
    duration: 1771,
    src: "tracks/sleep-well.mp3",
  },
  {
    id: "awakening",
    title: "Setting Clear Daily Intentions",
    intention: "focus",
    duration: 541,
    src: "tracks/awakening.mp3",
  },
  {
    id: "tranquility",
    title: "Anxiety Relief",
    intention: "release",
    duration: 121,
    src: "tracks/tranquility.mp3",
  },
  {
    id: "relax-moment",
    title: "Calming Overthinking",
    intention: "release",
    duration: 1405,
    src: "tracks/relax-moment.mp3",
  },
  {
    id: "release",
    title: "Detachment from Over-Thinking",
    intention: "release",
    duration: 2535,
    src: "tracks/release.mp3",
  },
];

export function tracksByIntention(): Array<{
  intention: VibeTrack["intention"];
  label: string;
  description: string;
  tracks: VibeTrack[];
}> {
  return (
    Object.keys(VIBE_INTENTIONS) as Array<VibeTrack["intention"]>
  )
    .map((intention) => ({
      intention,
      ...VIBE_INTENTIONS[intention],
      tracks: VIBE_TRACKS.filter((t) => t.intention === intention),
    }))
    .filter((group) => group.tracks.length > 0);
}
