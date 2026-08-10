// VSL (video sales letter) — configuração centralizada.
// ÚNICO lugar onde a URL do vídeo existe. Para migrar para o domínio
// próprio (https://video.astrotarot.shop/vsl.mp4), defina a env
// NEXT_PUBLIC_VSL_URL na Vercel OU troque o fallback abaixo — nada mais.
export const VSL_URL =
  process.env.NEXT_PUBLIC_VSL_URL ??
  "https://pub-94956eceb3c048a7a62f1ebc80da35ec.r2.dev/vsl.mp4";

// Poster/thumbnail do player. Ainda NÃO existe um arquivo de poster no repo —
// quando houver, salve-o em public/images/vsl-poster.webp (1280x720, <150KB)
// e este valor passa a ser usado automaticamente pelo VSLPlayer.
// Mantido undefined de propósito para não referenciar um asset inexistente.
export const VSL_POSTER: string | undefined = undefined;
// export const VSL_POSTER = "/images/vsl-poster.webp";
