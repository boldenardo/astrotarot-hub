import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

/**
 * Webhook para receber notificações de pagamento do PixUp
 * Chamado quando:
 * - Pagamento PIX é confirmado
 * - Pagamento expira
 * - Assinatura é renovada
 * - Assinatura falha
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificar assinatura do webhook (segurança)
    const signature = req.headers.get("x-pixup-signature");
    const webhookSecret = process.env.PIXUP_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(body))
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Assinatura inválida do webhook PixUp");
        return NextResponse.json(
          { error: "Assinatura inválida" },
          { status: 401 }
        );
      }
    }

    const { event, data } = body;

    switch (event) {
      case "payment.paid":
        await handlePaymentPaid(data);
        break;

      case "payment.expired":
        await handlePaymentExpired(data);
        break;

      case "payment.cancelled":
        await handlePaymentCancelled(data);
        break;

      case "subscription.renewed":
        await handleSubscriptionRenewed(data);
        break;

      case "subscription.failed":
        await handleSubscriptionFailed(data);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(data);
        break;

      default:
        console.log(`Evento não tratado: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook PixUp:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

async function handlePaymentPaid(data: any) {
  console.log("💰 Pagamento confirmado:", data.id);

  const { data: payment, error } = await supabase
    .from("payments")
    .select("*, users(*)")
    .eq("pixup_payment_id", data.id)
    .single();

  if (error || !payment) {
    console.error("Pagamento não encontrado:", data.id);
    return;
  }

  // Atualizar status do pagamento
  await supabase
    .from("payments")
    .update({
      status: "COMPLETED",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // Se for pagamento de tiragem única
  if (payment.payment_type === "SINGLE_READING") {
    const user = payment.users;
    // Adicionar 1 tiragem ao contador do usuário
    await supabase
      .from("users")
      .update({
        readings_left: (user.readings_left || 0) + 1,
      })
      .eq("id", payment.user_id);

    console.log(`✅ Usuário ${payment.user_id} ganhou 1 tiragem`);
  }

  // Se for assinatura
  if (payment.payment_type === "SUBSCRIPTION") {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await supabase
      .from("users")
      .update({
        subscription_plan: "PREMIUM_MONTHLY",
        subscription_status: "active",
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: nextMonth.toISOString(),
      })
      .eq("id", payment.user_id);

    console.log(`✅ Assinatura Premium ativada para usuário ${payment.user_id}`);
  }

  // TODO: Enviar email de confirmação
}

async function handlePaymentExpired(data: any) {
  console.log("⏰ Pagamento expirado:", data.id);

  await supabase
    .from("payments")
    .update({ status: "FAILED" })
    .eq("pixup_payment_id", data.id);
}

async function handlePaymentCancelled(data: any) {
  console.log("❌ Pagamento cancelado:", data.id);

  await supabase
    .from("payments")
    .update({ status: "CANCELLED" })
    .eq("pixup_payment_id", data.id);
}

async function handleSubscriptionRenewed(data: any) {
  console.log("🔄 Assinatura renovada:", data.subscriptionId);

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("pixup_subscription_id", data.subscriptionId)
    .single();

  if (error || !user) {
    console.error("Assinatura não encontrada:", data.subscriptionId);
    return;
  }

  // Criar registro de pagamento da renovação
  await supabase.from("payments").insert({
    user_id: user.id,
    amount: 29.9,
    currency: "BRL",
    status: "COMPLETED",
    payment_type: "SUBSCRIPTION",
    pixup_payment_id: data.paymentId,
    paid_at: new Date().toISOString(),
  });

  // Estender período da assinatura
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await supabase
    .from("users")
    .update({
      subscription_status: "active",
      subscription_end_date: nextMonth.toISOString(),
    })
    .eq("id", user.id);

  console.log(`✅ Assinatura renovada até ${nextMonth.toLocaleDateString()}`);
}

async function handleSubscriptionFailed(data: any) {
  console.log("⚠️ Falha na renovação da assinatura:", data.subscriptionId);

  await supabase
    .from("users")
    .update({ subscription_status: "suspended" })
    .eq("pixup_subscription_id", data.subscriptionId);

  // TODO: Enviar email notificando falha no pagamento
}

async function handleSubscriptionCancelled(data: any) {
  console.log("🚫 Assinatura cancelada:", data.subscriptionId);

  await supabase
    .from("users")
    .update({
      subscription_status: "cancelled",
    })
    .eq("pixup_subscription_id", data.subscriptionId);

  // TODO: Enviar email de cancelamento
}
