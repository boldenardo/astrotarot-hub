// POST /api/hotmart/webhook — Webhook 2.0 da Hotmart (fonte da verdade da
// compra enquanto a Hotmart for o provider ativo).
//
// Segurança (na ordem):
//   1. limite de tamanho do payload (rejeita corpo > 256KB);
//   2. autenticidade via header X-HOTMART-HOTTOK comparado ao token
//      configurado no painel (env HOTMART_HOTTOK) — sem ele, 401;
//   3. validação de esquema mínima (event + data.buyer.email);
//   4. idempotência pela transação: a MESMA coluna única que protege o
//      webhook da Stripe (payments.stripe_checkout_session_id) guarda
//      "hotmart_<transaction>" — reuso deliberado do índice único já
//      testado em produção, em vez de migration nova no meio da troca.
//
// Espelha o caminho GUEST do webhook Stripe: cria/acha o usuário pelo
// e-mail do comprador, credita as 5 leituras (grant_readings), carimba o
// lead como convertido e dispara o e-mail de boas-vindas com o passo de
// ativação. Reembolso/chargeback marcam o payment — sem revogação
// automática de acesso (decisão manual do operador).

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { welcomeEmail } from "@/lib/server/email-templates";
import { sendEmail } from "@/lib/server/email";
import {
  setEntitlement,
  type AddonFeature,
} from "@/lib/server/entitlements-write";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256 * 1024;

/** Eventos oficiais (Webhook 2.0) que esta rota trata; o resto é 200 + ignore. */
const PURCHASE_APPROVED = "PURCHASE_APPROVED";
const PURCHASE_COMPLETE = "PURCHASE_COMPLETE";
const PURCHASE_REFUNDED = "PURCHASE_REFUNDED";
const PURCHASE_CHARGEBACK = "PURCHASE_CHARGEBACK";

interface HotmartWebhookBody {
  id?: string;
  event?: string;
  version?: string;
  data?: {
    buyer?: { email?: string; name?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      price?: { value?: number; currency_value?: string };
      checkout_country?: { iso?: string };
      sckPaymentLink?: string;
      /** Código da OFERTA — é ele que diz qual produto foi vendido. */
      offer?: { code?: string };
    };
    product?: { id?: number; name?: string; ucode?: string };
    subscription?: { subscriber?: { code?: string } };
  };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  // Autenticidade: hottok configurado no painel da Hotmart tem que bater.
  const expected = process.env.HOTMART_HOTTOK ?? "";
  const got = req.headers.get("x-hotmart-hottok") ?? "";
  if (!expected || got !== expected) {
    return NextResponse.json({ error: "Invalid hottok." }, { status: 401 });
  }

  let body: HotmartWebhookBody;
  try {
    body = JSON.parse(raw) as HotmartWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const event = body.event ?? "";
  const transaction = body.data?.purchase?.transaction ?? "";
  const email = (body.data?.buyer?.email ?? "").toLowerCase().trim();

  // Eventos que não tratamos: 200 mesmo assim (a Hotmart faz retry de
  // não-2xx; devolver erro geraria tempestade de reentregas inúteis).
  const handled = [
    PURCHASE_APPROVED,
    PURCHASE_COMPLETE,
    PURCHASE_REFUNDED,
    PURCHASE_CHARGEBACK,
  ].includes(event);
  if (!handled) return NextResponse.json({ received: true, ignored: event });

  if (!transaction || !email) {
    // Esquema fora do esperado: loga e aceita — reprocessar não vai mudar.
    console.error("[hotmart/webhook] payload sem transaction/email:", event);
    return NextResponse.json({ received: true, ignored: "missing fields" });
  }

  const reference = `hotmart_${transaction}`;
  const admin = getSupabaseAdmin();

  try {
    if (event === PURCHASE_APPROVED || event === PURCHASE_COMPLETE) {
      // 1. Usuário por e-mail (caminho guest idêntico ao da Stripe).
      let userId: string | null = null;
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
            name: body.data?.buyer?.name ?? null,
            subscription_plan: "FREE",
            subscription_status: "active",
            readings_left: 4,
          })
          .select("id")
          .maybeSingle();
        if (created) {
          userId = (created as { id: string }).id;
        } else if ((createErr as { code?: string } | null)?.code === "23505") {
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
      if (!userId) {
        console.error("[hotmart/webhook] sem user_id para", reference);
        return NextResponse.json({ received: true });
      }

      // 2. Idempotência: só concede se ESTA execução inseriu a linha.
      //    O índice único da coluna faz o trabalho (23505 = já processado —
      //    PURCHASE_COMPLETE chega depois do APPROVED para a MESMA venda).
      const { error: insErr } = await admin.from("payments").insert({
        user_id: userId,
        amount: body.data?.purchase?.price?.value ?? 0,
        currency: (body.data?.purchase?.price?.currency_value ?? "USD").toLowerCase(),
        status: "COMPLETED",
        payment_type: "READINGS_PACK",
        stripe_checkout_session_id: reference,
        paid_at: new Date().toISOString(),
      });
      if (insErr) {
        if ((insErr as { code?: string }).code === "23505") {
          return NextResponse.json({ received: true, duplicate: true });
        }
        throw insErr;
      }

      // 3. O QUE A PESSOA COMPROU.
      //
      // A versão de 20/08 concedia 5 créditos de tarot porque o único
      // produto do funil era o PACK5. Hoje o funil vende a leitura de alma
      // gêmea com o retrato — deixar isto como estava faria o comprador da
      // Hotmart pagar pelo retrato e receber créditos de tarot, com o
      // retrato seguindo trancado. É a mesma falha que a Stripe já teve.
      //
      // A Hotmart não carrega a nossa metadata de plano: o que volta é o
      // produto/oferta cadastrado no painel. Mapeamos por ele.
      const offerCode =
        body.data?.purchase?.offer?.code ??
        body.data?.product?.ucode ??
        "";
      const ENTITLEMENT_BY_OFFER: Record<string, AddonFeature[]> = {};
      const addOffer = (env: string | undefined, features: AddonFeature[]) => {
        if (env) ENTITLEMENT_BY_OFFER[env] = features;
      };
      addOffer(process.env.HOTMART_OFFER_FRONT, ["soulmate_portrait"]);
      addOffer(process.env.HOTMART_OFFER_DOWNSELL, ["soulmate_portrait"]);
      addOffer(process.env.HOTMART_OFFER_PORTRAIT, ["soulmate_portrait"]);
      addOffer(process.env.HOTMART_OFFER_CORD, ["cord_reading"]);
      addOffer(process.env.HOTMART_OFFER_VIBES, ["vibes"]);
      addOffer(process.env.HOTMART_OFFER_OTO, ["past_life"]);

      // Sem mapa para esta oferta, o padrão é o produto principal: é o que
      // o funil vende, e conceder a mais nunca deixa alguém pagando sem
      // receber. O contrário — não conceder nada — vira reembolso.
      const features = ENTITLEMENT_BY_OFFER[offerCode] ?? ["soulmate_portrait"];
      for (const feature of features) {
        await setEntitlement({
          userId,
          feature,
          active: true,
          source: "hotmart",
          reference: reference,
        });
      }
      if (!ENTITLEMENT_BY_OFFER[offerCode]) {
        console.warn(
          `[hotmart/webhook] oferta "${offerCode}" sem mapa — concedido soulmate_portrait por padrão`
        );
      }

      // 4. Lead convertido + boas-vindas (mesmo fluxo de ativação da Stripe).
      const { error: leadErr } = await admin
        .from("leads")
        .update({ converted_at: new Date().toISOString() })
        .eq("email", email)
        .is("converted_at", null);
      if (leadErr) console.error("[hotmart/webhook] leads:", leadErr);

      const { data: lead } = await admin
        .from("leads")
        .select("name")
        .eq("email", email)
        .maybeSingle();
      const mail = welcomeEmail({
        name: (lead as { name?: string } | null)?.name ?? body.data?.buyer?.name ?? null,
        email,
        locale: "en",
      });
      await sendEmail({ to: email, ...mail });

      return NextResponse.json({ received: true, granted: true });
    }

    // Reembolso/chargeback: marca o payment; acesso não é revogado aqui.
    const { error: refErr } = await admin
      .from("payments")
      .update({ status: event === PURCHASE_REFUNDED ? "REFUNDED" : "CHARGEBACK" })
      .eq("stripe_checkout_session_id", reference);
    if (refErr) console.error("[hotmart/webhook] refund mark:", refErr);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[hotmart/webhook] erro:", e);
    // 500 de propósito: a Hotmart reentrega e a idempotência segura o resto.
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
