// Catálogo do Vibes & Meditations.
//
// ⚠️ DEPENDÊNCIA DE CONTEÚDO: as faixas precisam existir em
// public/vibes/*.mp3 (ou numa URL do R2, como a VSL). Enquanto o array
// estiver vazio a aba mostra "em breve" e o botão de assinar NÃO
// aparece — não se cobra $9.99/mês por uma prateleira vazia.
//
// Formato sugerido: mp3 mono 128kbps, 5 a 12 minutos, com fade in/out.

export interface VibeTrack {
  id: string;
  title: string;
  /** Para que serve, na linguagem de quem procura. */
  intention: "abundance" | "love" | "sleep" | "focus" | "release";
  /** Duração em segundos, exibida na lista. */
  duration: number;
  /** Caminho local (public/) ou URL absoluta. */
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

export const VIBE_TRACKS: VibeTrack[] = [];

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
