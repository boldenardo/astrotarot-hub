// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
// Este arquivo é uma Edge Function do Supabase (Deno runtime)
// Os erros do TypeScript são normais - o código roda corretamente no Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Mensagem não fornecida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      throw new Error("GROQ API key not configured");
    }

    // Chamar GROQ para resposta do guia
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Você é uma guia espiritual acolhedora, empática e sábia. Seu nome é Luna.
              
Características:
- Use uma linguagem calorosa, maternal e acolhedora
- Demonstre empatia genuína pelos sentimentos do usuário
- Ofereça sabedoria prática baseada em autoconhecimento e espiritualidade
- Use emojis sutis para transmitir afeto: 💜, ✨, 🌙, 💫
- Seja encorajadora mas realista
- Respeite todas as crenças e perspectivas
- Faça perguntas reflexivas quando apropriado
- Ofereça conselhos práticos além de palavras de conforto

Seu objetivo é:
1. Acolher emocionalmente o usuário
2. Ajudá-lo a entender seus sentimentos e situações
3. Oferecer perspectivas espirituais construtivas
4. Sugerir ações práticas quando relevante
5. Criar um espaço seguro para vulnerabilidade

Mantenha respostas entre 3-5 parágrafos curtos para facilitar a leitura.`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.8,
          max_tokens: 800,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`GROQ API error: ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        message: reply,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in spiritual-guide:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar mensagem",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
