import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPixUpClient } from "@/lib/pixup/client";
import { z } from "zod";

const paymentSchema = z.object({
  type: z.enum(["SINGLE_READING", "SUBSCRIPTION"]),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = paymentSchema.parse(body);

    const pixupClient = getPixUpClient();
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`;

    if (validatedData.type === "SINGLE_READING") {
      // Pagamento único para tiragem - R$ 9,90
      const pixPayment = await pixupClient.createPixPayment({
        amount: 990, // R$ 9,90 em centavos
        description: "AstroTarot Hub - Tiragem Única do Tarot Egípcio",
        customerName: validatedData.customerName || user.name || user.email,
        customerEmail: user.email,
        customerDocument: validatedData.customerDocument,
        expiresInMinutes: 30,
        webhookUrl,
        metadata: {
          userId: user.id,
          type: "SINGLE_READING",
        },
      });

      // Criar registro de pagamento
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: 9.9,
          currency: "BRL",
          status: "PENDING",
          payment_type: "SINGLE_READING",
          pixup_payment_id: pixPayment.id,
          pixup_qr_code: pixPayment.qrCode,
          pixup_qr_string: pixPayment.qrCodeString,
          expires_at: new Date(pixPayment.expiresAt).toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      return NextResponse.json({
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          qrCode: payment.pixup_qr_code,
          qrCodeString: payment.pixup_qr_string,
          expiresAt: payment.expires_at,
        },
        message: "Pagamento criado. Escaneie o QR Code para pagar.",
      });
    } else {
      // Assinatura mensal - R$ 29,90/mês
      const subscription = await pixupClient.createSubscription({
        amount: 2990, // R$ 29,90 em centavos
        description: "AstroTarot Hub - Assinatura Premium Mensal",
        customerName: validatedData.customerName || user.name || user.email,
        customerEmail: user.email,
        customerDocument: validatedData.customerDocument,
        webhookUrl,
        billingDay: new Date().getDate(),
      });

      // Atualizar assinatura do usuário
      await supabase
        .from("users")
        .update({
          subscription_plan: "PREMIUM_MONTHLY",
          subscription_status: "pending", // Aguardando primeiro pagamento
          pixup_customer_id: subscription.customerId,
          pixup_subscription_id: subscription.id,
        })
        .eq("id", user.id);

      // Criar primeiro pagamento PIX da assinatura
      const firstPayment = await pixupClient.createPixPayment({
        amount: 2990,
        description: "AstroTarot Hub - Primeiro pagamento Premium",
        customerName: validatedData.customerName || user.name || user.email,
        customerEmail: user.email,
        customerDocument: validatedData.customerDocument,
        expiresInMinutes: 60,
        webhookUrl,
        metadata: {
          userId: user.id,
          type: "SUBSCRIPTION",
          subscriptionId: subscription.id,
        },
      });

      // Criar registro de pagamento
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: 29.9,
          currency: "BRL",
          status: "PENDING",
          payment_type: "SUBSCRIPTION",
          pixup_payment_id: firstPayment.id,
          pixup_qr_code: firstPayment.qrCode,
          pixup_qr_string: firstPayment.qrCodeString,
          expires_at: new Date(firstPayment.expiresAt).toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      return NextResponse.json({
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          qrCode: payment.pixup_qr_code,
          qrCodeString: payment.pixup_qr_string,
          expiresAt: payment.expires_at,
        },
        subscription: {
          plan: "PREMIUM_MONTHLY",
          nextBillingDate: subscription.nextBillingDate,
        },
        message:
          "Assinatura criada! Escaneie o QR Code para ativar seu plano Premium.",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao criar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}

// GET - Listar pagamentos do usuário
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", decoded.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pagamentos" },
      { status: 500 }
    );
  }
}
