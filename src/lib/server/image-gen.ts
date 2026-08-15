// Geração de imagem — server-only, atrás de UMA interface.
// Trocar de provider deve ser mexer numa função, não caçar chamadas
// espalhadas: hoje é Gemini ("nano banana"), amanhã pode ser outro.

export interface GeneratedImage {
  /** Bytes da imagem gerada. */
  data: Buffer;
  /** MIME real retornado pelo provider (ex.: "image/png"). */
  contentType: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(prompt: string): Promise<GeneratedImage>;
}

/** Gemini image (a.k.a. "nano banana"), via REST — sem SDK novo no bundle. */
class GeminiImageProvider implements ImageProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model = process.env.GEMINI_IMAGE_MODEL ||
      "gemini-2.5-flash-image"
  ) {}

  async generate(prompt: string): Promise<GeneratedImage> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `[image-gen] gemini respondeu ${res.status}: ${detail.slice(0, 300)}`
      );
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data?: string; mimeType?: string };
            inline_data?: { data?: string; mime_type?: string };
          }>;
        };
      }>;
    };

    // A resposta mistura camelCase e snake_case conforme a versão da API.
    for (const part of json.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData ?? part.inline_data;
      const b64 = inline?.data;
      if (b64) {
        return {
          data: Buffer.from(b64, "base64"),
          contentType:
            (part.inlineData?.mimeType ?? part.inline_data?.mime_type) ||
            "image/png",
        };
      }
    }

    throw new Error("[image-gen] resposta do gemini não trouxe imagem");
  }
}

/**
 * Provider ativo. Retorna null quando não há chave configurada — quem
 * chama decide o que fazer (a rota do retrato responde 503 e NÃO cobra).
 */
export function getImageProvider(): ImageProvider | null {
  const key = process.env.GEMINI_API_KEY;
  if (key) return new GeminiImageProvider(key);
  return null;
}
