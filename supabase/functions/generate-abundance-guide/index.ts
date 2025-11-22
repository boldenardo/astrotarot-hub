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
        "financial_prosperity": {
          "score": 85,
          "summary": "Resumo do potencial financeiro",
          "advice": "Conselho prático para ganhar dinheiro",
          "best_periods": ["Mês/Ano", "Mês/Ano"]
        },
        "professional_success": {
          "score": 75,
          "summary": "Resumo do potencial de carreira",
          "ideal_careers": ["Carreira 1", "Carreira 2"],
          "advice": "Como crescer profissionalmente"
        },
        "investments": {
          "score": 60,
          "risk_profile": "Conservador/Moderado/Arrojado",
          "advice": "Onde focar investimentos (imóveis, ações, etc)"
        },
        "opportunities": {
          "score": 90,
          "luck_factor": "Alta/Média/Baixa",
          "upcoming_opportunities": "O que esperar em breve"
        },
        "power_colors": ["Cor 1", "Cor 2"],
        "wealth_stones": ["Pedra 1", "Pedra 2"],
        "mantra": "Um mantra curto para atrair abundância"
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
    const content = groqData.choices[0]?.message?.content;

    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysisData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", content);
      throw new Error("Falha ao gerar guia de abundância");
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
