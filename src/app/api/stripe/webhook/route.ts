// POST /api/stripe/webhook — recebe eventos assinados do Stripe e
// atualiza plano/saldo do usuário via service role (ignora RLS).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

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

/**
 * Concede (ou revoga) um add-on comprado fora do plano base.
 * Idempotente por (user_id, feature): reentrega do Stripe apenas
 * reafirma o mesmo direito em vez de duplicar linha.
 */
async function setEntitlement(params: {
  userId: string;
  feature: "soulmate_portrait" | "vibes";
  active: boolean;
  source?: string;
  reference?: string | null;
  expiresAt?: string | null;
}) {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: params.userId,
        feature: params.feature,
        active: params.active,
        source: params.source ?? "stripe_one_time",
        stripe_reference: params.reference ?? null,
        expires_at: params.expiresAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feature" }
    );
    if (error) {
      console.error("[stripe/webhook] setEntitlement falhou:", error);
    }
  } catch (e) {
    console.error("[stripe/webhook] setEntitlement erro:", e);
  }
}

/** Price ids dos add-ons (undefined quando ainda não configurados). */
const VIBES_PRICE = process.env.STRIPE_PRICE_VIBES_MONTHLY;
const PORTRAIT_PRICE = process.env.STRIPE_PRICE_SOULMATE_PORTRAIT;

/**
 * Sincroniza o add-on recorrente Vibes com o que a assinatura realmente
 * contém: se o item do price de Vibes está lá, o direito vale até o fim
 * do período; se saiu, o direito é revogado.
 */
async function syncVibesFromSubscription(
  sub: Stripe.Subscription,
  userId: string
) {
  if (!VIBES_PRICE) return;
  const item = sub.items.data.find((i) => i.price?.id === VIBES_PRICE);
  if (item) {
    const end = item.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null;
    await setEntitlement({
      userId,
      feature: "vibes",
      active: sub.status === "active" || sub.status === "trialing",
      source: "stripe_subscription_item",
      reference: item.id,
      expiresAt: end,
    });
  } else {
    await setEntitlement({
      userId,
      feature: "vibes",
      active: false,
      source: "stripe_subscription_item",
      reference: null,
    });
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
            // Compra única: ou é o add-on do retrato, ou o pacote de leituras.
            if (session.metadata?.product === "soulmate_portrait") {
              await setEntitlement({
                userId,
                feature: "soulmate_portrait",
                active: true,
                source: "stripe_one_time",
                reference: session.id,
              });
            } else {
              // Pacote de 5 leituras — crédito atômico via função SQL.
              const { error } = await admin.rpc("grant_readings", {
                p_user_id: userId,
                p_amount: 5,
              });
              if (error) {
                console.error("[stripe/webhook] grant_readings falhou:", error);
              }
            }
          } else if (session.mode === "subscription") {
            const now = new Date();
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null;

            // Plano/duração vêm do metadata (PREMIUM_YEARLY = 365 dias);
            // default mensal preserva o comportamento das sessões antigas.
            const yearly = session.metadata?.plan === "PREMIUM_YEARLY";
            await admin
              .from("users")
              .update({
                subscription_plan: yearly ? "PREMIUM_YEARLY" : "PREMIUM_MONTHLY",
                subscription_status: "active",
                subscription_start_date: now.toISOString(),
                subscription_end_date: new Date(
                  now.getTime() + (yearly ? 365 * ONE_DAY_MS : THIRTY_DAYS_MS)
                ).toISOString(),
                stripe_subscription_id: subscriptionId,
              })
              .eq("id", userId);
          }

          // Lead do quiz convertido: carimba converted_at (best-effort;
          // não pode quebrar a concessão do benefício).
          if (guestEmailRaw) {
            const { error: leadErr } = await admin
              .from("leads")
              .update({ converted_at: new Date().toISOString() })
              .eq("email", guestEmailRaw.toLowerCase().trim())
              .is("converted_at", null);
            if (leadErr) {
              console.error("[stripe/webhook] leads.converted_at:", leadErr);
            }
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

        // O add-on Vibes vive como item DENTRO desta assinatura: quem manda
        // é o que a assinatura contém agora, não o que continha antes.
        await syncVibesFromSubscription(sub, user.id);
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

        // Assinatura acabou: Vibes cai junto. O retrato é compra única e
        // continua valendo — quem pagou por ele não perde o que comprou.
        await setEntitlement({
          userId: user.id,
          feature: "vibes",
          active: false,
          source: "stripe_subscription_item",
        });
        break;
      }

      // Reembolso ou disputa: revoga o add-on de compra única para que a
      // pessoa não siga com o produto depois do dinheiro voltar.
      //
      // A revogação precisa acertar o charge CERTO. A condição antiga era
      // `if (PORTRAIT_PRICE || ...)` — PORTRAIT_PRICE é a env var, sempre
      // truthy quando o produto existe, então QUALQUER reembolso (inclusive
      // de um pack de $9,99) derrubava o retrato de $24,99 já pago.
      case "charge.refunded":
      case "charge.dispute.created": {
        const charge = event.data.object as Stripe.Charge;
        const user = await findUserByCustomerId(customerIdOf(charge.customer));
        if (!user) break;

        // O entitlement guarda o id da sessão de checkout que o concedeu.
        // Resolvemos o payment_intent do charge e comparamos com ela.
        const intentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null;

        let isPortraitCharge = false;
        if (intentId) {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: intentId,
            limit: 1,
          });
          const session = sessions.data[0];
          isPortraitCharge =
            session?.metadata?.product === "soulmate_portrait" ||
            (!!PORTRAIT_PRICE &&
              session?.metadata?.price_id === PORTRAIT_PRICE);
        }

        if (isPortraitCharge) {
          await setEntitlement({
            userId: user.id,
            feature: "soulmate_portrait",
            active: false,
            source: "stripe_one_time",
            reference: charge.id,
          });
        }
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
