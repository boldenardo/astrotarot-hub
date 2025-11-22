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

    const {
      name,
      day,
      month,
      year,
      hour,
      minute,
      city,
      nation,
      latitude,
      longitude,
      timezone,
    } = await req.json();

    if (!day || !month || !year || !city) {
      return new Response(
        JSON.stringify({ error: "Dados de nascimento incompletos" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 1. Buscar Trânsitos na RapidAPI
    let transitsData = null;
    if (RAPIDAPI_KEY) {
      try {
        const date = new Date();
        const transitResponse = await fetch(
          `https://${RAPIDAPI_HOST}/api/v4/transit-aspects-data`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": RAPIDAPI_HOST,
            },
            body: JSON.stringify({
              first_subject: {
                year: parseInt(year),
                month: parseInt(month),
                day: parseInt(day),
                hour: parseInt(hour),
                minute: parseInt(minute),
                latitude: latitude || -23.55,
                longitude: longitude || -46.63,
                city: city,
                nation: nation || "BR",
                timezone: timezone || "America/Sao_Paulo",
                zodiac_type: "Tropic",
                perspective_type: "Apparent Geocentric",
                houses_system_identifier: "P",
              },
              transit_subject: {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hour: date.getHours(),
                minute: date.getMinutes(),
                latitude: latitude || -23.55,
                longitude: longitude || -46.63,
                city: city,
                nation: nation || "BR",
                timezone: timezone || "America/Sao_Paulo",
                zodiac_type: "Tropic",
                perspective_type: "Apparent Geocentric",
                houses_system_identifier: "P",
              },
              theme: "classic",
              language: "EN",
              active_aspects: [
                { name: "conjunction", orb: 5 },
                { name: "opposition", orb: 5 },
                { name: "trine", orb: 5 },
                { name: "square", orb: 5 },
              ],
            }),
          }
        );

        if (transitResponse.ok) {
          transitsData = await transitResponse.json();
        } else {
          console.error("RapidAPI Error:", await transitResponse.text());
        }
      } catch (err) {
        console.error("Erro ao buscar trânsitos:", err);
      }
    }

    // 2. Gerar Prompt com dados reais (se disponíveis)
    const prompt = `
      Você é um astrólogo especialista. Gere uma previsão diária personalizada para hoje (${new Date().toLocaleDateString(
        "pt-BR"
      )}) para:
      Nome: ${name || "Usuário"}
      Nascimento: ${day}/${month}/${year} às ${hour}:${minute}
      Local: ${city}, ${nation}

      ${
        transitsData
          ? `DADOS REAIS DOS TRÂNSITOS (Use estes dados para a análise): ${JSON.stringify(
              transitsData
            ).substring(0, 3000)}`
          : "Analise os trânsitos astrológicos atuais (calcule mentalmente as posições aproximadas)."
      }

      Formato da resposta (JSON estrito):
      {
        "date": "${new Date().toLocaleDateString("pt-BR")}",
        "moonPhase": {
          "name": "Fase da Lua Atual",
          "emoji": "🌑/Mw/🌕/etc",
          "meaning": "Significado curto",
          "percentage": 50
        },
        "majorTransits": [
          {
            "transit": "Planeta em Signo",
            "natal": "Casa/Planeta afetado",
            "aspect": "Conjunção/Oposição/etc",
            "energy": "Positiva/Desafiadora/Neutra",
            "description": "Explicação curta do impacto",
            "areas": ["Amor", "Trabalho", "etc"]
          }
        ],
        "energyRatings": {
          "love": 80,
          "career": 70,
          "health": 90,
          "finances": 60,
          "spirituality": 85
        },
        "bestTimeOfDay": {
          "morning": "Foco em...",
          "afternoon": "Bom para...",
          "evening": "Ideal para..."
        },
        "luckyColor": "Cor do dia",
        "luckyNumber": 7,
        "recommendation": "Conselho principal do dia",
        "warning": "O que evitar hoje"
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
                "Você é um astrólogo místico e preciso. Responda sempre em JSON válido.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      }
    );

    const groqData = await response.json();
    const content = groqData.choices[0]?.message?.content;

    let predictionData;
    try {
      // Tenta extrair JSON se houver texto extra
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      predictionData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", content);
      throw new Error("Falha ao gerar previsão válida");
    }

    return new Response(JSON.stringify(predictionData), {
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
