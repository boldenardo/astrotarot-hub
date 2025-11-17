import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const payment = await prisma.payment.findFirst({
    where: { pixupId: data.id },
    include: { user: { include: { subscription: true } } },
  });

  if (!payment) {
    console.error("Pagamento não encontrado:", data.id);
    return;
  }

  // Atualizar status do pagamento
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
    },
  });

  // Se for pagamento de tiragem única
  if (payment.paymentType === "SINGLE_READING") {
    // Adicionar 1 tiragem ao contador do usuário
    await prisma.subscription.update({
      where: { userId: payment.userId },
      data: {
        readingsLeft: {
          increment: 1,
        },
      },
    });

    console.log(`✅ Usuário ${payment.userId} ganhou 1 tiragem`);
  }

  // Se for assinatura
  if (payment.paymentType === "SUBSCRIPTION") {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await prisma.subscription.update({
      where: { userId: payment.userId },
      data: {
        plan: "PREMIUM_MONTHLY",
        status: "active",
        startDate: new Date(),
        endDate: nextMonth,
      },
    });

    console.log(`✅ Assinatura Premium ativada para usuário ${payment.userId}`);
  }

  // TODO: Enviar email de confirmação
}

async function handlePaymentExpired(data: any) {
  console.log("⏰ Pagamento expirado:", data.id);

  await prisma.payment.updateMany({
    where: { pixupId: data.id },
    data: { status: "FAILED" },
  });
}

async function handlePaymentCancelled(data: any) {
  console.log("❌ Pagamento cancelado:", data.id);

  await prisma.payment.updateMany({
    where: { pixupId: data.id },
    data: { status: "CANCELLED" },
  });
}

async function handleSubscriptionRenewed(data: any) {
  console.log("🔄 Assinatura renovada:", data.subscriptionId);

  const subscription = await prisma.subscription.findFirst({
    where: { pixupSubId: data.subscriptionId },
  });

  if (!subscription) {
    console.error("Assinatura não encontrada:", data.subscriptionId);
    return;
  }

  // Criar registro de pagamento da renovação
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      amount: 29.9,
      currency: "BRL",
      status: "COMPLETED",
      paymentType: "SUBSCRIPTION",
      pixupId: data.paymentId,
      paidAt: new Date(),
    },
  });

  // Estender período da assinatura
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "active",
      endDate: nextMonth,
    },
  });

  console.log(`✅ Assinatura renovada até ${nextMonth.toLocaleDateString()}`);
}

async function handleSubscriptionFailed(data: any) {
  console.log("⚠️ Falha na renovação da assinatura:", data.subscriptionId);

  await prisma.subscription.updateMany({
    where: { pixupSubId: data.subscriptionId },
    data: { status: "suspended" },
  });

  // TODO: Enviar email notificando falha no pagamento
}

async function handleSubscriptionCancelled(data: any) {
  console.log("🚫 Assinatura cancelada:", data.subscriptionId);

  await prisma.subscription.updateMany({
    where: { pixupSubId: data.subscriptionId },
    data: {
      status: "cancelled",
      autoRenew: false,
    },
  });

  // TODO: Enviar email de cancelamento
}
