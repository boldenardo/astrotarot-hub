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

serve(async (req: Request) => {
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

    const { data: profile } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const { type, customerName } = await req.json();

    // Validate payment type
    if (!["SINGLE_READING", "SUBSCRIPTION"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Tipo de pagamento inválido" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get PixUp credentials
    const pixupClientId = Deno.env.get("PIXUP_CLIENT_ID");
    const pixupClientSecret = Deno.env.get("PIXUP_CLIENT_SECRET");

    if (!pixupClientId || !pixupClientSecret) {
      throw new Error("PixUp credentials not configured");
    }

    // Authenticate with PixUp
    const authResponse = await fetch("https://api.pixupbr.com/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: pixupClientId,
        client_secret: pixupClientSecret,
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`PixUp auth failed: ${errorText}`);
    }

    const { access_token } = await authResponse.json();

    // Calculate amount based on type
    const amount = type === "SINGLE_READING" ? 9.9 : 29.9;
    const description =
      type === "SINGLE_READING"
        ? "AstroTarot Hub - Leitura Única do Tarot Egípcio"
        : "AstroTarot Hub - Plano Premium Mensal";

    // Create payment on PixUp
    const paymentResponse = await fetch("https://api.pixupbr.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        currency: "BRL",
        description: description,
        customer: {
          name: customerName || profile.name || "Cliente",
          email: profile.email,
        },
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`PixUp payment creation failed: ${errorText}`);
    }

    const pixupData = await paymentResponse.json();

    // Save payment to database
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: profile.id,
        amount: amount,
        currency: "BRL",
        status: "PENDING",
        payment_type: type,
        pixup_payment_id: pixupData.id || pixupData.payment_id,
        pixup_qr_code: pixupData.qr_code || pixupData.qrCode,
        pixup_qr_string: pixupData.qr_code_text || pixupData.qrCodeText,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Error saving payment: ${paymentError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          expiresAt: payment.expires_at,
          qrCode: payment.pixup_qr_code,
          qrString: payment.pixup_qr_string,
        },
        type: type,
        message:
          type === "SINGLE_READING"
            ? "🎯 Pagamento criado! Escaneie o QR Code para fazer sua leitura do Tarot Egípcio."
            : "⭐ Pagamento criado! Escaneie o QR Code para ativar seu Plano Premium e ter acesso ILIMITADO.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-payment:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao criar pagamento",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
