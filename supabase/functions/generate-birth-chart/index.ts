import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { birthDate, birthTime, birthLocation, name } = await req.json();

    if (!birthDate || !birthTime || !birthLocation) {
      return new Response(
        JSON.stringify({ error: "Dados de nascimento incompletos" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Prompt para o Groq gerar o mapa astral simplificado
    const prompt = `
      Você é um astrólogo especialista. Gere um resumo do mapa astral para:
      Nome: ${name || "Usuário"}
      Data: ${birthDate}
      Hora: ${birthTime}
      Local: ${birthLocation}

      Por favor, calcule mentalmente as posições aproximadas (Sol, Lua, Ascendente) e forneça uma interpretação curta e inspiradora.
      
      Formato da resposta (JSON):
      {
        "sun": {"sign": "Signo", "house": "Casa (ex: 5)", "interpretation": "Texto curto"},
        "moon": {"sign": "Signo", "house": "Casa (ex: 10)", "interpretation": "Texto curto"},
        "ascendant": {"sign": "Signo", "interpretation": "Texto curto"},
        "interpretation": "Um conselho curto e místico para o momento atual da pessoa."
      }
      
      Responda APENAS o JSON válido, sem markdown.
    `;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "Você é um astrólogo místico e preciso. Responda sempre em JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );

    const groqData = await response.json();
    const content = groqData.choices[0]?.message?.content;

    let chartData;
    try {
      // Tentar limpar o markdown se houver
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      chartData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Erro ao parsear JSON do Groq:", content);
      chartData = { error: "Erro ao gerar interpretação" };
    }

    return new Response(JSON.stringify(chartData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
