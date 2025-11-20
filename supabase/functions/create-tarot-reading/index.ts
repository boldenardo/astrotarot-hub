// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
// Este arquivo é uma Edge Function do Supabase (Deno runtime)
// Os erros do TypeScript são normais - o código roda corretamente no Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify authentication
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

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check readings available
    if (profile.readings_left <= 0 && profile.subscription_plan === "FREE") {
      return new Response(
        JSON.stringify({
          error:
            "Você não tem leituras disponíveis. Assine o plano Premium ou compre uma leitura avulsa.",
          needsPayment: true,
          readingsLeft: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Parse request body
    const { selectedCards, question } = await req.json();

    if (!selectedCards || selectedCards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma carta selecionada" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Call GROQ for interpretation
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      throw new Error("GROQ API key not configured");
    }

    const cardsDescription = selectedCards
      .map(
        (card: any, index: number) =>
          `${index + 1}. ${card.name} (${card.number}) - ${card.meaning}`
      )
      .join("\n");

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
              content: `Você é um expert em Tarot Egípcio com décadas de experiência. 
              Suas interpretações são profundas, místicas e transformadoras. 
              Use uma linguagem envolvente, poética e que inspire confiança.
              Conecte as cartas entre si para criar uma narrativa coesa.
              Seja específico e evite generalidades vazias.`,
            },
            {
              role: "user",
              content: `🔮 Interprete esta tiragem do Tarot Egípcio:

**Pergunta do Consulente:** ${question || "Orientação geral"}

**Cartas Selecionadas:**
${cardsDescription}

Forneça uma interpretação completa que:
1. Analise cada carta individualmente
2. Conecte as cartas para criar uma história coesa
3. Responda diretamente à pergunta do consulente
4. Ofereça orientação prática e insights profundos
5. Use uma linguagem mística mas acessível

Formato da resposta:
**🌟 Visão Geral**
[Introdução contextual]

**📖 Interpretação das Cartas**
[Análise de cada carta]

**💫 Mensagem Central**
[Conexão entre as cartas e resposta à pergunta]

**🎯 Orientação Prática**
[Conselhos práticos e próximos passos]`,
            },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`GROQ API error: ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const interpretation = groqData.choices[0].message.content;

    // Save reading to database
    const { data: reading, error: readingError } = await supabaseClient
      .from("tarot_readings")
      .insert({
        user_id: profile.id,
        deck_type: "EGYPTIAN",
        spread_type: selectedCards.length === 4 ? "FOUR_CARDS" : "FULL_SPREAD",
        cards: selectedCards,
        interpretation: interpretation,
        is_premium: profile.subscription_plan === "PREMIUM_MONTHLY",
      })
      .select()
      .single();

    if (readingError) {
      throw new Error(`Error saving reading: ${readingError.message}`);
    }

    // Decrement readings for FREE plan
    if (profile.subscription_plan === "FREE") {
      const { error: updateError } = await supabaseClient
        .from("users")
        .update({ readings_left: profile.readings_left - 1 })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Error updating readings_left:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reading: {
          id: reading.id,
          cards: reading.cards,
          interpretation: reading.interpretation,
          createdAt: reading.created_at,
        },
        readingsLeft:
          profile.subscription_plan === "FREE"
            ? profile.readings_left - 1
            : "ilimitado",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-tarot-reading:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar leitura",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
