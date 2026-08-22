// Helper Groq — SOMENTE no servidor (rotas de API).
// Sem fallback mock: se a chave faltar ou a chamada falhar, o erro sobe
// e a rota decide o que responder (nunca entregar dado inventado ao usuário).

import Groq from "groq-sdk";

// O modelo é configurável: em 22/08/2026 a Groq aposentou o
// llama-3.3-70b-versatile (model_not_found) e TODAS as leituras pararam.
// Nunca mais um nome fixo sem saída de emergência por env.
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let cached: Groq | null = null;

function getGroq(): Groq {
  if (cached) return cached;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurada.");
  }
  cached = new Groq({ apiKey });
  return cached;
}

interface GroqChatOptions {
  system: string;
  user: string;
  /** Força resposta em JSON válido (response_format json_object). */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/** Chamada de chat simples; retorna o texto da resposta. */
export async function groqChat({
  system,
  user,
  json = false,
  maxTokens = 1500,
  temperature = 0.7,
}: GroqChatOptions): Promise<string> {
  const groq = getGroq();
  // Modelos de raciocínio (gpt-oss) consomem o orçamento pensando: sem
  // esforço baixo + piso de tokens, respostas curtas voltam VAZIAS.
  const reasoning = /gpt-oss|qwen3|compound/i.test(GROQ_MODEL);
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: reasoning ? Math.max(maxTokens, 1200) : maxTokens,
    ...(json ? { response_format: { type: "json_object" as const } } : {}),
    ...(reasoning ? ({ reasoning_effort: "low" } as Record<string, unknown>) : {}),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq retornou resposta vazia.");
  }
  return content;
}

/** Chat com resposta JSON tipada (extrai o primeiro objeto JSON do texto). */
export async function groqChatJson<T>(options: Omit<GroqChatOptions, "json">): Promise<T> {
  const raw = await groqChat({ ...options, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Alguns modelos embrulham o JSON em texto/markdown mesmo em json mode.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error("Groq não retornou JSON válido.");
  }
}
