import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY") ?? "";
const RAPIDAPI_HOST = "astrologer.p.rapidapi.com";

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

    const { birthData } = await req.json();

    if (!birthData) {
      return new Response(
        JSON.stringify({ error: "Dados de nascimento incompletos" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 1. Buscar Mapa Astral na RapidAPI
    let chartData = null;
    if (RAPIDAPI_KEY) {
      try {
        const chartResponse = await fetch(
          `https://${RAPIDAPI_HOST}/api/v4/birth-chart`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": RAPIDAPI_HOST,
            },
            body: JSON.stringify({
              subject: {
                year: parseInt(birthData.year),
                month: parseInt(birthData.month),
                day: parseInt(birthData.day),
                hour: parseInt(birthData.hour),
                minute: parseInt(birthData.minute),
                latitude: birthData.latitude || -23.55,
                longitude: birthData.longitude || -46.63,
                city: birthData.city,
                nation: birthData.nation || "BR",
                timezone: birthData.timezone || "America/Sao_Paulo",
                zodiac_type: "Tropic",
                perspective_type: "Apparent Geocentric",
                houses_system_identifier: "P",
              },
              theme: "classic",
              language: "EN",
              wheel_only: false,
            }),
          }
        );

        if (chartResponse.ok) {
          chartData = await chartResponse.json();
        } else {
          console.error("RapidAPI Error:", await chartResponse.text());
        }
      } catch (err) {
        console.error("Erro ao buscar mapa astral:", err);
      }
    }

    const prompt = `
      Você é um astrólogo especialista em finanças e carreira. Gere um Guia de Abundância personalizado para:
      Nascimento: ${birthData.day}/${birthData.month}/${birthData.year} às ${
      birthData.hour
    }:${birthData.minute}
      Local: ${birthData.city}, ${birthData.nation}

      ${
        chartData
          ? `DADOS REAIS DO MAPA ASTRAL (Use estes dados para a análise): ${JSON.stringify(
              chartData
            ).substring(0, 3000)}`
          : "Analise o potencial de riqueza, carreira e sorte no mapa astral (Casas 2, 6, 8 e 10, Júpiter, Vênus)."
      }

      Formato da resposta (JSON estrito):
      {
        "currentCycle": "Nome do ciclo atual (ex: Expansão Jupteriana)",
        "scores": {
          "financial": 85,
          "career": 75,
          "investments": 60,
          "opportunities": 90
        },
        "favorablePeriods": ["Mês/Ano - Motivo", "Mês/Ano - Motivo"],
        "houses": {
          "house2": "Análise da Casa 2 (Recursos)",
          "house8": "Análise da Casa 8 (Transformação)",
          "house10": "Análise da Casa 10 (Carreira)",
          "house11": "Análise da Casa 11 (Ganhos)"
        },
        "jupiterPosition": "Júpiter em [Signo/Casa] - Significado",
        "recommendations": [
          "Recomendação prática 1",
          "Recomendação prática 2",
          "Recomendação prática 3"
        ]
      }
      
      Responda APENAS o JSON válido.
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
                "Você é um astrólogo financeiro experiente. Responda sempre em JSON válido.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      }
    );

    const groqData = await response.json();
    console.log("GROQ Response:", JSON.stringify(groqData)); // Debug log

    const content = groqData.choices[0]?.message?.content;
    if (!content) {
      throw new Error("GROQ retornou conteúdo vazio");
    }

    let analysisData;
    try {
      // Limpar markdown code blocks se existirem
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();

      // Tentar encontrar o primeiro { e o último }
      const firstBrace = cleanContent.indexOf("{");
      const lastBrace = cleanContent.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonString = cleanContent.substring(firstBrace, lastBrace + 1);
        analysisData = JSON.parse(jsonString);
      } else {
        analysisData = JSON.parse(cleanContent);
      }
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", content);
      console.error("Erro detalhado:", e);
      // Fallback para um objeto de erro estruturado em vez de lançar
      analysisData = {
        error: "Falha ao interpretar resposta da IA",
        raw_content: content,
      };
    }

    return new Response(
      JSON.stringify({ success: true, analysis: analysisData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
