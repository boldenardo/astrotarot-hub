// VSL (video sales letter) — configuração centralizada.
// ÚNICO lugar onde a URL do vídeo existe. Para migrar para o domínio
// próprio (https://video.astrotarot.shop/vsl.mp4), defina a env
// NEXT_PUBLIC_VSL_URL na Vercel OU troque o fallback abaixo — nada mais.
// O nome do arquivo no R2 tem espaços — daí os %20. Trocar por um nome
// sem espaço evitaria isso, mas exige subir de novo lá; enquanto for
// assim, mantenha a URL codificada (URL crua com espaço não carrega).
export const VSL_URL =
  process.env.NEXT_PUBLIC_VSL_URL ??
  "https://pub-94956eceb3c048a7a62f1ebc80da35ec.r2.dev/vsl%202.0%20-%20AstroTarot%20APP%20-%20comprimido.mp4";

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

// Poster/thumbnail do player (1080x1080, mesmo aspecto 1:1 do vídeo, ~74KB).
// Frame extraído aos 3s da VSL: Master Aura sorrindo em contato direto.
// Sem poster o player abria PRETO até o Play — custo real de conversão.
export const VSL_POSTER: string | undefined = "/images/vsl-poster.webp";
