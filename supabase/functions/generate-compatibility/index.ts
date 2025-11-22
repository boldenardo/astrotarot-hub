import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY") ?? "";
const RAPIDAPI_HOST = "astrologer.p.rapidapi.com";

async function fetchBirthChart(personData: any) {
  if (!RAPIDAPI_KEY) return null;

  try {
    const response = await fetch(
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
            year: parseInt(personData.year),
            month: parseInt(personData.month),
            day: parseInt(personData.day),
            hour: parseInt(personData.hour),
            minute: parseInt(personData.minute),
            latitude: personData.latitude || -23.55,
            longitude: personData.longitude || -46.63,
            city: personData.city,
            nation: personData.nation || "BR",
            timezone: personData.timezone || "America/Sao_Paulo",
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

    if (response.ok) {
      return await response.json();
    } else {
      console.error("RapidAPI Error:", await response.text());
      return null;
    }
  } catch (err) {
    console.error("Erro ao buscar mapa astral:", err);
    return null;
  }
}

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

    const { personA, personB } = await req.json();

    if (!personA || !personB) {
      return new Response(
        JSON.stringify({ error: "Dados das duas pessoas são necessários" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar mapas astrais em paralelo
    const [chartA, chartB] = await Promise.all([
      fetchBirthChart(personA),
      fetchBirthChart(personB),
    ]);

    const prompt = `
      Você é um astrólogo especialista em Sinastria Amorosa. Analise a compatibilidade entre duas pessoas.

      PESSOA A: ${personA.name}
      Nascimento: ${personA.day}/${personA.month}/${personA.year}
      ${
        chartA
          ? `DADOS DO MAPA A: ${JSON.stringify(chartA).substring(0, 1500)}`
          : ""
      }

      PESSOA B: ${personB.name}
      Nascimento: ${personB.day}/${personB.month}/${personB.year}
      ${
        chartB
          ? `DADOS DO MAPA B: ${JSON.stringify(chartB).substring(0, 1500)}`
          : ""
      }

      Analise a compatibilidade baseada nos sóis, luas, vênus, marte e ascendentes (se disponíveis).

      Formato da resposta (JSON estrito):
      {
        "overall": 85,
        "love": 90,
        "communication": 70,
        "values": 80,
        "longTerm": 75,
        "synastry_analysis": {
          "strengths": ["Ponto forte 1", "Ponto forte 2"],
          "challenges": ["Desafio 1", "Desafio 2"],
          "emotional_connection": "Descrição da conexão emocional (Lua)",
          "sexual_chemistry": "Descrição da química (Vênus/Marte)",
          "communication_style": "Como se comunicam (Mercúrio)"
        },
        "final_verdict": "Um parágrafo resumindo o potencial do relacionamento."
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
                "Você é um especialista em sinastria amorosa. Responda sempre em JSON válido.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      }
    );

    const groqData = await response.json();
    console.log("GROQ Response:", JSON.stringify(groqData));

    const content = groqData.choices[0]?.message?.content;
    if (!content) {
      throw new Error("GROQ retornou conteúdo vazio");
    }

    let analysisData;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
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
