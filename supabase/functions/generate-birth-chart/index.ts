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

    // Buscar o ID interno do usuário na tabela 'users'
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verificar se já existe um mapa astral salvo para este usuário
    const { data: existingChart } = await supabaseClient
      .from("birth_charts")
      .select("chart_data, transits")
      .eq("user_id", userProfile.id)
      .single();

    if (existingChart) {
      console.log("Retornando mapa astral do cache (banco de dados)");
      return new Response(
        JSON.stringify({
          ...existingChart.chart_data,
          raw_data: existingChart.transits,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { birthDate, birthTime, birthLocation, name, latitude, longitude } =
      await req.json();

    if (!birthDate || !birthTime || !birthLocation) {
      return new Response(
        JSON.stringify({ error: "Dados de nascimento incompletos" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Parse date and time
    const [year, month, day] = birthDate.split("-");
    const [hour, minute] = birthTime.split(":");

    // 1. Buscar Mapa Astral na RapidAPI
    let realChartData = null;
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
                year: parseInt(year),
                month: parseInt(month),
                day: parseInt(day),
                hour: parseInt(hour),
                minute: parseInt(minute),
                latitude: latitude || -23.55,
                longitude: longitude || -46.63,
                city: birthLocation,
                nation: "BR",
                timezone: "America/Sao_Paulo",
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
          realChartData = await chartResponse.json();
        } else {
          console.error("RapidAPI Error:", await chartResponse.text());
        }
      } catch (err) {
        console.error("Erro ao buscar mapa astral:", err);
      }
    }

    // Prompt para o Groq gerar o mapa astral simplificado
    const prompt = `
      Você é um astrólogo especialista. Gere um resumo do mapa astral para:
      Nome: ${name || "Usuário"}
      Data: ${birthDate}
      Hora: ${birthTime}
      Local: ${birthLocation}

      ${
        realChartData
          ? `DADOS REAIS DO MAPA ASTRAL (Use estes dados para a análise): ${JSON.stringify(
              realChartData
            ).substring(0, 3000)}`
          : "Por favor, calcule mentalmente as posições aproximadas (Sol, Lua, Ascendente) e forneça uma interpretação curta e inspiradora."
      }
      
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

      // Salvar no banco de dados para cache
      if (chartData && !chartData.error) {
        await supabaseClient.from("birth_charts").insert({
          user_id: userProfile.id,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_location: birthLocation,
          latitude: latitude,
          longitude: longitude,
          chart_data: chartData,
          transits: realChartData, // Salva os dados brutos da API também, se houver
        });
      }
    } catch (e) {
      console.error("Erro ao parsear JSON do Groq:", content);
      chartData = { error: "Erro ao gerar interpretação" };
    }

    return new Response(
      JSON.stringify({
        ...chartData,
        raw_data: realChartData,
      }),
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
