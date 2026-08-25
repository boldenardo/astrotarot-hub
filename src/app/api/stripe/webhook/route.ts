// POST /api/stripe/webhook — recebe eventos assinados do Stripe e
// atualiza plano/saldo do usuário via service role (ignora RLS).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import type { AddonFeature } from "@/lib/server/plan-gate";
import { sendEmail } from "@/lib/server/email";
import {
  welcomeEmail,
  paymentFailedEmail,
  abandonedPortraitEmail,
  reviewAskHtml,
} from "@/lib/server/email-templates";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { unsubscribeUrl } from "@/lib/server/email-unsubscribe";

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
  feature: AddonFeature;
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
            // ENTREGA POR PLANO (25/08). Antes havia só dois caminhos —
            // "retrato" ou "senão, credita 5 leituras" — escritos quando o
            // único one-off era o PACK5. Resultado: quem comprava o front
            // de $29 (Soulmate Reading + Portrait) ganhava 5 créditos de
            // tarot e o retrato continuava TRANCADO. A pessoa pagava por
            // uma coisa e recebia outra.
            const metaPlan = session.metadata?.plan ?? "";
            const ENTITLEMENT_BY_PLAN: Record<string, AddonFeature[]> = {
              FRONT_READING: ["soulmate_portrait"],
              DOWNSELL_19: ["soulmate_portrait"],
              DOWNSELL_PORTRAIT: ["soulmate_portrait"],
              OTO_PASTLIFE: ["past_life"],
              CORD_READING: ["cord_reading"],
            };
            if (ENTITLEMENT_BY_PLAN[metaPlan]) {
              for (const feature of ENTITLEMENT_BY_PLAN[metaPlan]) {
                await setEntitlement({
                  userId,
                  feature,
                  active: true,
                  source: "stripe_one_time",
                  reference: session.id,
                });
              }
              // Order bump do front: The Cord Reading pode ter vindo como
              // optional_item na MESMA sessão — só os line items sabem.
              if (metaPlan === "FRONT_READING" || metaPlan === "DOWNSELL_19") {
                try {
                  const cordPrice =
                    process.env.STRIPE_PRICE_BUMP_CORD ||
                    "price_1U7yhi07YF1LaBzh4ConA7Ic";
                  const items = await stripe.checkout.sessions.listLineItems(
                    session.id,
                    { limit: 10 }
                  );
                  if (items.data.some((li) => li.price?.id === cordPrice)) {
                    await setEntitlement({
                      userId,
                      feature: "cord_reading",
                      active: true,
                      source: "stripe_one_time",
                      reference: session.id,
                    });
                  }
                } catch (e) {
                  console.error("[stripe/webhook] line items do cord bump:", e);
                }
              }
            } else if (session.metadata?.product === "soulmate_portrait") {
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
              // Order bump: o retrato pode ter vindo como optional_item na
              // MESMA sessão. O metadata não sabe disso — só os line items
              // dizem o que de fato foi comprado.
              try {
                const portraitPrice = process.env.STRIPE_PRICE_SOULMATE_PORTRAIT;
                if (portraitPrice) {
                  const items = await stripe.checkout.sessions.listLineItems(
                    session.id,
                    { limit: 10 }
                  );
                  if (items.data.some((li) => li.price?.id === portraitPrice)) {
                    await setEntitlement({
                      userId,
                      feature: "soulmate_portrait",
                      active: true,
                      source: "stripe_one_time",
                      reference: session.id,
                    });
                  }
                }
              } catch (e) {
                console.error("[stripe/webhook] line items do bump:", e);
              }
            }
          } else if (session.mode === "subscription") {
            const now = new Date();
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null;

            // Plano/duração vêm do metadata. A oferta Unlimited do funil tem
            // 3 ciclos (SUB_*); os nomes antigos seguem funcionando para as
            // sessões criadas antes da troca.
            const metaPlan = session.metadata?.plan ?? "";
            const cycle =
              metaPlan === "SUB_ANNUAL" || metaPlan === "PREMIUM_YEARLY"
                ? { plan: "PREMIUM_YEARLY", days: 365 }
                : metaPlan === "SUB_SEMIANNUAL"
                  ? { plan: "PREMIUM_SEMIANNUAL", days: 183 }
                  : { plan: "PREMIUM_MONTHLY", days: 30 };
            await admin
              .from("users")
              .update({
                subscription_plan: cycle.plan,
                subscription_status: "active",
                subscription_start_date: now.toISOString(),
                subscription_end_date: new Date(
                  now.getTime() + cycle.days * ONE_DAY_MS
                ).toISOString(),
                stripe_subscription_id: subscriptionId,
              })
              .eq("id", userId);

            // Order bump do retrato também existe na assinatura (item avulso
            // opcional na primeira fatura) — só os line items contam a verdade.
            try {
              const portraitPrice = process.env.STRIPE_PRICE_SOULMATE_PORTRAIT;
              if (portraitPrice) {
                const items = await stripe.checkout.sessions.listLineItems(
                  session.id,
                  { limit: 10 }
                );
                if (items.data.some((li) => li.price?.id === portraitPrice)) {
                  await setEntitlement({
                    userId,
                    feature: "soulmate_portrait",
                    active: true,
                    source: "stripe_one_time",
                    reference: session.id,
                  });
                }
              }
            } catch (e) {
              console.error("[stripe/webhook] bump da assinatura:", e);
            }
          }

          // Lead do quiz convertido: carimba converted_at (best-effort;
          // não pode quebrar a concessão do benefício).
          if (guestEmailRaw) {
            const leadEmail = guestEmailRaw.toLowerCase().trim();
            const { error: leadErr } = await admin
              .from("leads")
              .update({ converted_at: new Date().toISOString() })
              .eq("email", leadEmail)
              .is("converted_at", null);
            if (leadErr) {
              console.error("[stripe/webhook] leads.converted_at:", leadErr);
            }

            // Boas-vindas com o passo de ativação. O checkout é GUEST: sem
            // criar a conta com o MESMO e-mail, a pessoa paga e não acessa
            // nada — este e-mail é o que fecha esse buraco.
            const { data: lead } = await admin
              .from("leads")
              .select("name")
              .eq("email", leadEmail)
              .maybeSingle();
            const mail = welcomeEmail({
              name: (lead as { name?: string } | null)?.name ?? null,
              email: leadEmail,
              locale: session.metadata?.locale === "es" ? "es" : "en",
            });
            await sendEmail({ to: leadEmail, ...mail });
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

      // Fechou a aba em vez de clicar em voltar: a cancel_url nunca correu,
      // então a oferta de $19.99 não chegou a aparecer. A sessão expira em
      // 30 minutos e cai aqui — é o único sinal que temos desse abandono.
      // Último degrau da escada: $29 → $19.99 → só o retrato, $17.
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.plan !== "FRONT_READING") break;

        const email = (
          session.metadata?.quiz_email ||
          session.customer_details?.email ||
          session.customer_email ||
          ""
        )
          .trim()
          .toLowerCase();
        if (!email) break;

        const admin = getSupabaseAdmin();

        // Descadastrado ou já convertido entre o abandono e a expiração:
        // não recebe. Um e-mail de recuperação para quem já comprou é a
        // forma mais rápida de queimar a marca.
        const { data: lead0 } = await admin
          .from("leads")
          .select("unsubscribed_at, converted_at")
          .eq("email", email)
          .maybeSingle();
        if (lead0?.unsubscribed_at || lead0?.converted_at) break;

        // Um e-mail por sessão: reenvio dispara na cara de quem já recebeu.
        const { data: already } = await admin
          .from("stripe_events")
          .select("event_id")
          .eq("event_id", `expired_${session.id}`)
          .maybeSingle();
        if (already) break;

        const { data: lead } = await admin
          .from("leads")
          .select("name")
          .eq("email", email)
          .maybeSingle();

        const mail = abandonedPortraitEmail({ name: lead?.name ?? null });
        const sent = await sendEmail({
          to: email,
          ...mail,
          unsubscribeUrl: unsubscribeUrl(email),
        });
        console.log(
          `[webhook] checkout expirado ${session.id} → downsell $17 para ${email}: ${sent ? "enviado" : "NAO enviado"}`
        );
        if (sent) {
          await admin
            .from("stripe_events")
            .insert({ event_id: `expired_${session.id}`, type: "checkout.session.expired" });
        }
        break;
      }

      // ── CHECKOUT PRÓPRIO (26/08): a compra vem por PaymentIntent, sem
      // Checkout Session — a entrega inteira acontece AQUI. Só PIs com
      // metadata.source=custom_checkout; os PIs de sessões hospedadas não
      // têm esse metadata e seguem pelo checkout.session.completed.
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.source !== "custom_checkout") break;

        const piEmail = (pi.metadata.quiz_email || "").toLowerCase().trim();
        if (!piEmail) break;

        let piUserId: string | null = null;
        {
          const { data: existing } = await admin
            .from("users")
            .select("id")
            .eq("email", piEmail)
            .maybeSingle();
          if (existing) piUserId = (existing as { id: string }).id;
          else {
            const { data: created, error: createErr } = await admin
              .from("users")
              .insert({
                email: piEmail,
                subscription_plan: "FREE",
                subscription_status: "active",
                readings_left: 4,
              })
              .select("id")
              .maybeSingle();
            if (created) piUserId = (created as { id: string }).id;
            else if ((createErr as { code?: string } | null)?.code === "23505") {
              const { data: raced } = await admin
                .from("users")
                .select("id")
                .eq("email", piEmail)
                .maybeSingle();
              if (raced) piUserId = (raced as { id: string }).id;
            }
          }
        }
        if (!piUserId) break;

        const piCustomer =
          typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
        if (piCustomer) {
          await admin
            .from("users")
            .update({ stripe_customer_id: piCustomer })
            .eq("id", piUserId);
        }

        await admin.from("payments").insert({
          user_id: piUserId,
          amount: pi.amount / 100,
          currency: pi.currency ?? "usd",
          status: "COMPLETED",
          payment_type: "FRONT_READING",
          stripe_payment_intent_id: pi.id,
          paid_at: new Date().toISOString(),
        });

        // ENTREGA: retrato sempre; bumps conforme as flags do intent.
        const piFeatures = ["soulmate_portrait"];
        if (pi.metadata.bump_cord === "1") piFeatures.push("cord_reading");
        if (pi.metadata.bump_vibes === "1") piFeatures.push("vibes");
        for (const feature of piFeatures) {
          const { data: ent } = await admin
            .from("user_entitlements")
            .select("id")
            .eq("user_id", piUserId)
            .eq("feature", feature)
            .maybeSingle();
          if (ent) {
            await admin
              .from("user_entitlements")
              .update({ active: true, stripe_reference: pi.id })
              .eq("id", (ent as { id: string }).id);
          } else {
            await admin.from("user_entitlements").insert({
              user_id: piUserId,
              feature,
              active: true,
              source: "custom_checkout",
              stripe_reference: pi.id,
            });
          }
        }

        await admin
          .from("leads")
          .update({ converted_at: new Date().toISOString() })
          .eq("email", piEmail)
          .is("converted_at", null);
        const { data: piLead } = await admin
          .from("leads")
          .select("name")
          .eq("email", piEmail)
          .maybeSingle();
        const piMail = welcomeEmail({
          name: (piLead as { name?: string } | null)?.name ?? null,
          email: piEmail,
          locale: DEFAULT_LOCALE,
        });
        piMail.html = piMail.html.replace("</body>", reviewAskHtml() + "</body>");
        await sendEmail({ to: piEmail, ...piMail });

        console.log(
          "[stripe/webhook] custom checkout pago " +
            pi.id +
            " " +
            String(pi.amount / 100) +
            " -> entregue (" +
            piFeatures.join(",") +
            ")"
        );
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

      // Compra ÚNICA recusada pelo banco (o pacote de leituras).
      //
      // Quem digitou o cartão é a pessoa com maior intenção do funil, e até
      // aqui não recebia absolutamente nada — o lote de carrinho abandonado
      // ainda a trataria como quem "desistiu", que é o diagnóstico errado.
      // Recusa de emissor costuma passar na segunda tentativa.
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const email = (
          pi.last_payment_error?.payment_method?.billing_details?.email ??
          pi.receipt_email ??
          ""
        )
          .toLowerCase()
          .trim();
        if (!email) break;

        // Só o primeiro tropeço gera e-mail: várias tentativas seguidas no
        // mesmo cartão não podem virar várias mensagens.
        const { data: lead } = await admin
          .from("leads")
          .select("email, name, converted_at, recovery_email_sent_at, unsubscribed_at")
          .eq("email", email)
          .maybeSingle();
        if (
          !lead ||
          lead.converted_at ||
          lead.recovery_email_sent_at ||
          lead.unsubscribed_at
        ) {
          break;
        }

        const mail = paymentFailedEmail({
          name: lead.name,
          email,
          locale: DEFAULT_LOCALE,
        });
        const sent = await sendEmail({ to: email, ...mail });
        if (sent) {
          // Carimba o mesmo campo do carrinho abandonado: a pessoa já
          // recebeu a mensagem de recuperação que cabia no caso dela.
          await admin
            .from("leads")
            .update({ recovery_email_sent_at: new Date().toISOString() })
            .eq("email", email);
        }
        console.warn(
          `[stripe/webhook] pagamento recusado (${pi.last_payment_error?.decline_code ?? "?"}) para ${email}; e-mail enviado=${sent}`
        );
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

          // Checkout próprio (Payment Element): não há Session — a
          // verdade está na metadata do PaymentIntent. Reembolso do
          // front derruba o retrato e os bumps que vieram junto.
          if (!session) {
            const pi = await stripe.paymentIntents.retrieve(intentId);
            if (pi.metadata?.source === "custom_checkout") {
              isPortraitCharge = true;
              if (pi.metadata?.bump_vibes === "1") {
                await setEntitlement({
                  userId: user.id,
                  feature: "vibes",
                  active: false,
                  source: "custom_checkout",
                  reference: charge.id,
                });
              }
              if (pi.metadata?.bump_cord === "1") {
                await setEntitlement({
                  userId: user.id,
                  feature: "cord_reading",
                  active: false,
                  source: "custom_checkout",
                  reference: charge.id,
                });
              }
            }
          }
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
