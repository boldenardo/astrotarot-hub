// POST /api/stripe/webhook — recebe eventos assinados do Stripe e
// atualiza plano/saldo do usuário via service role (ignora RLS).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function findUserByCustomerId(customerId: string | null) {
  if (!customerId) return null;
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("users")
    .select("id, affiliate_code")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data as { id: string; affiliate_code: string | null } | null;
}

/**
 * Credita uma venda ao afiliado. Só grava se o código existir e estiver
 * ativo. Idempotente: os índices únicos de sessão/fatura absorvem
 * reentregas do Stripe (23505 é sucesso silencioso).
 */
async function recordAffiliateSale(params: {
  code: string | null | undefined;
  userId: string | null;
  email: string | null;
  amount: number;
  currency: string;
  plan: string | null;
  kind: "initial" | "renewal";
  sessionId?: string | null;
  invoiceId?: string | null;
}) {
  const code = params.code?.trim().toLowerCase();
  if (!code) return;

  const admin = getSupabaseAdmin();
  try {
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("code, commission_pct")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (!affiliate) return;

    const { error } = await admin.from("affiliate_sales").insert({
      code,
      user_id: params.userId,
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      plan: params.plan,
      kind: params.kind,
      commission_pct: (affiliate as { commission_pct: number }).commission_pct,
      stripe_checkout_session_id: params.sessionId ?? null,
      stripe_invoice_id: params.invoiceId ?? null,
    });
    if (error && (error as { code?: string }).code !== "23505") {
      console.error("[stripe/webhook] affiliate_sales insert falhou:", error);
    }

    // First-touch permanente no usuário — é o que credita as renovações.
    if (params.userId) {
      await admin
        .from("users")
        .update({ affiliate_code: code })
        .eq("id", params.userId)
        .is("affiliate_code", null);
    }
  } catch (e) {
    // Tracking de afiliado NUNCA pode derrubar o processamento do pagamento.
    console.error("[stripe/webhook] recordAffiliateSale erro:", e);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Assinatura do webhook ausente ou não configurada." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error("[stripe/webhook] assinatura inválida:", e);
    return NextResponse.json(
      { error: "Assinatura do webhook inválida." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Idempotência por evento: registra o event.id antes de processar.
  // Violação de unicidade (23505) → evento já processado, encerra.
  const { error: dedupErr } = await admin
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type });
  if (dedupErr) {
    if ((dedupErr as { code?: string }).code === "23505") {
      return NextResponse.json({ received: true });
    }
    throw dedupErr;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        let userId: string | null =
          session.metadata?.user_id || session.client_reference_id || null;

        // Caminho GUEST (funil do quiz): sem user_id → resolve/cria o
        // usuário pelo e-mail do checkout (metadata.quiz_email tem
        // prioridade sobre customer_details.email).
        const guestEmailRaw =
          session.metadata?.quiz_email || session.customer_details?.email;
        if (!userId && guestEmailRaw) {
          const email = guestEmailRaw.toLowerCase().trim();
          const { data: existing } = await admin
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (existing) {
            userId = (existing as { id: string }).id;
          } else {
            const { data: created, error: createErr } = await admin
              .from("users")
              .insert({
                email,
                name: session.customer_details?.name ?? null,
                subscription_plan: "FREE",
                subscription_status: "active",
                readings_left: 4,
              })
              .select("id")
              .maybeSingle();

            if (created) {
              userId = (created as { id: string }).id;
            } else if ((createErr as { code?: string } | null)?.code === "23505") {
              // Corrida: outra execução criou o usuário — re-seleciona.
              const { data: raced } = await admin
                .from("users")
                .select("id")
                .eq("email", email)
                .maybeSingle();
              if (raced) userId = (raced as { id: string }).id;
            } else if (createErr) {
              throw createErr;
            }
          }
        }

        if (!userId) {
          console.error(
            "[stripe/webhook] checkout.session.completed sem user_id:",
            session.id
          );
          break;
        }

        const customerId = customerIdOf(session.customer);
        if (customerId) {
          await admin
            .from("users")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const paymentUpdate: Record<string, unknown> = {
          status: "COMPLETED",
          paid_at: new Date().toISOString(),
        };
        if (paymentIntentId) {
          paymentUpdate.stripe_payment_intent_id = paymentIntentId;
        }
        // Valor REAL pago (considera cupons) — Stripe usa centavos.
        if (typeof session.amount_total === "number") {
          paymentUpdate.amount = session.amount_total / 100;
        }
        if (session.currency) {
          paymentUpdate.currency = session.currency;
        }

        // Virada atômica: só concede o benefício se ESTA execução virou
        // a linha de PENDING para COMPLETED (idempotência forte).
        const { data: flipped } = await admin
          .from("payments")
          .update(paymentUpdate)
          .eq("stripe_checkout_session_id", session.id)
          .neq("status", "COMPLETED")
          .select("id");

        let granted = Boolean(flipped && flipped.length > 0);

        // Caminho GUEST: não existe linha PENDING (o checkout do quiz não
        // insere). Se a virada não afetou nada, insere a linha COMPLETED —
        // o índice único de stripe_checkout_session_id garante que só UMA
        // execução insere; 23505 = outra já processou → não concede.
        if (!granted) {
          const { error: guestInsErr } = await admin.from("payments").insert({
            user_id: userId,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "usd",
            status: "COMPLETED",
            payment_type:
              session.mode === "subscription" ? "SUBSCRIPTION" : "READINGS_PACK",
            stripe_checkout_session_id: session.id,
            ...(paymentIntentId
              ? { stripe_payment_intent_id: paymentIntentId }
              : {}),
            paid_at: new Date().toISOString(),
          });
          if (!guestInsErr) {
            granted = true;
          } else if ((guestInsErr as { code?: string }).code !== "23505") {
            throw guestInsErr;
          }
          // 23505 → sessão já processada em outra execução: não concede.
        }

        if (granted) {
          if (session.mode === "payment") {
            // Pacote de 5 leituras — crédito atômico via função SQL.
            const { error } = await admin.rpc("grant_readings", {
              p_user_id: userId,
              p_amount: 5,
            });
            if (error) {
              console.error("[stripe/webhook] grant_readings falhou:", error);
            }
          } else if (session.mode === "subscription") {
            const now = new Date();
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null;

            await admin
              .from("users")
              .update({
                subscription_plan: "PREMIUM_MONTHLY",
                subscription_status: "active",
                subscription_start_date: now.toISOString(),
                subscription_end_date: new Date(
                  now.getTime() + THIRTY_DAYS_MS
                ).toISOString(),
                stripe_subscription_id: subscriptionId,
              })
              .eq("id", userId);
          }

          // Venda atribuída ao afiliado (só quando o benefício foi concedido
          // nesta execução — garante 1 crédito por compra).
          await recordAffiliateSale({
            code: session.metadata?.affiliate_code,
            userId,
            email: guestEmailRaw?.toLowerCase().trim() ?? null,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "usd",
            plan: session.mode === "subscription" ? "PREMIUM" : "PACK5",
            kind: "initial",
            sessionId: session.id,
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== "subscription_cycle") break;

        // Dedup por fatura: se já registramos esta renovação, encerra.
        const { data: already } = await admin
          .from("payments")
          .select("id")
          .eq("stripe_invoice_id", invoice.id)
          .maybeSingle();
        if (already) break;

        const user = await findUserByCustomerId(customerIdOf(invoice.customer));
        if (!user) break;

        const now = new Date();
        // Fim do período real informado pelo Stripe (segundos → ms).
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        const endDate = periodEnd
          ? new Date(periodEnd * 1000)
          : new Date(Date.now() + THIRTY_DAYS_MS);

        await admin
          .from("users")
          .update({
            subscription_status: "active",
            subscription_end_date: endDate.toISOString(),
          })
          .eq("id", user.id);

        const { error: insErr } = await admin.from("payments").insert({
          user_id: user.id,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency ?? "usd",
          status: "COMPLETED",
          payment_type: "SUBSCRIPTION",
          paid_at: now.toISOString(),
          stripe_invoice_id: invoice.id,
        });
        if (insErr && (insErr as { code?: string }).code !== "23505") {
          throw insErr;
        }

        // Renovação: credita o afiliado que trouxe o cliente (comissão
        // recorrente). A atribuição vive em users.affiliate_code.
        await recordAffiliateSale({
          code: user.affiliate_code,
          userId: user.id,
          email: invoice.customer_email ?? null,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency ?? "usd",
          plan: "PREMIUM",
          kind: "renewal",
          invoiceId: invoice.id,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const user = await findUserByCustomerId(customerIdOf(invoice.customer));
        if (!user) break;

        await admin
          .from("users")
          .update({ subscription_status: "suspended" })
          .eq("id", user.id);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await findUserByCustomerId(customerIdOf(sub.customer));
        if (!user) break;

        let status: string | null = null;
        if (sub.status === "active") status = "active";
        else if (sub.status === "past_due" || sub.status === "unpaid") {
          status = "suspended";
        }

        if (status) {
          await admin
            .from("users")
            .update({ subscription_status: status })
            .eq("id", user.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await findUserByCustomerId(customerIdOf(sub.customer));
        if (!user) break;

        await admin
          .from("users")
          .update({
            subscription_plan: "FREE",
            subscription_status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("id", user.id);
        break;
      }

      default:
        // Evento não tratado — confirma o recebimento mesmo assim.
        break;
    }
  } catch (e) {
    console.error(`[stripe/webhook] erro ao processar ${event.type}:`, e);
    // Apaga o marcador para permitir reprocessamento na reentrega.
    await admin.from("stripe_events").delete().eq("event_id", event.id);
    // 500 faz o Stripe reenviar o evento; o processamento é idempotente.
    return NextResponse.json(
      { error: "Erro ao processar o evento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
