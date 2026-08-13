// VSL (video sales letter) — configuração centralizada.
// ÚNICO lugar onde a URL do vídeo existe. Para migrar para o domínio
// próprio (https://video.astrotarot.shop/vsl.mp4), defina a env
// NEXT_PUBLIC_VSL_URL na Vercel OU troque o fallback abaixo — nada mais.
export const VSL_URL =
  process.env.NEXT_PUBLIC_VSL_URL ??
  "https://pub-94956eceb3c048a7a62f1ebc80da35ec.r2.dev/vsl.mp4";

// Proporção do vídeo. O MP4 atual é quadrado (1:1) — usar 16/9 criaria
// tarjas pretas nas laterais. Se trocar o vídeo, ajuste aqui.
export const VSL_ASPECT = "1 / 1";

// Curva da barra de progresso (retenção): a barra avança rápido no começo e
// desacelera no fim, passando a sensação de que o vídeo está perto de acabar.
//   exibido = (tempoReal / duração) ^ VSL_PROGRESS_EXPONENT
//
// Expoente < 1 = curva côncava. Com 0.45, em um vídeo de 5min28:
//   30s reais → 42% na barra | 90s → 56% | metade do vídeo → 73%
// A curva é monotônica e chega exatamente a 100% no fim (nunca "termina"
// antes, o que quebraria a confiança).
// 1 = linear (tempo real). Quanto menor, mais agressiva a ilusão.
export const VSL_PROGRESS_EXPONENT = 0.45;

// Poster/thumbnail do player. Ainda NÃO existe um arquivo de poster no repo —
// quando houver, salve-o em public/images/vsl-poster.webp (1280x720, <150KB)
// e este valor passa a ser usado automaticamente pelo VSLPlayer.
// Mantido undefined de propósito para não referenciar um asset inexistente.
export const VSL_POSTER: string | undefined = undefined;
// export const VSL_POSTER = "/images/vsl-poster.webp";
