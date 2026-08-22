"use client";

// Seletor da assinatura Unlimited — mensal (âncora $9.99) / semestral /
// anual. Um componente só para TODOS os funis: o preço mostrado aqui não
// pode divergir dos prices da Stripe (ver .env STRIPE_PRICE_SUB_*).
//
// Mensal vem pré-selecionado de propósito: é o número prometido pela
// página inteira — trocar a seleção para cima é escolha da pessoa, nunca
// surpresa no checkout.

import { useState } from "react";
import { CircleCheck } from "lucide-react";

export type SubPlanKey = "SUB_MONTHLY" | "SUB_SEMIANNUAL" | "SUB_ANNUAL";

export const SUB_PLANS: Record<
  SubPlanKey,
  {
    label: string;
    price: string;
    per: string;
    note: string;
    badge?: string;
    /** Valor USD para eventos de analytics. */
    amount: number;
    offerId: string;
  }
> = {
  SUB_MONTHLY: {
    label: "Monthly",
    price: "$9.99",
    per: "/month",
    note: "Unlimited readings · cancel anytime",
    amount: 9.99,
    offerId: "unlimited_999_monthly",
  },
  SUB_SEMIANNUAL: {
    label: "6 months",
    price: "$39.99",
    per: "/6 months",
    note: "$6.66 a month · 2 months free",
    badge: "SAVE 33%",
    amount: 39.99,
    offerId: "unlimited_3999_semiannual",
  },
  SUB_ANNUAL: {
    label: "Annual",
    price: "$59.99",
    per: "/year",
    note: "$4.99 a month",
    badge: "BEST VALUE · 50% OFF",
    amount: 59.99,
    offerId: "unlimited_5999_annual",
  },
};

export const DEFAULT_SUB_PLAN: SubPlanKey = "SUB_MONTHLY";

export default function PlanPicker({
  value,
  onChange,
  disabled,
}: {
  value: SubPlanKey;
  onChange: (plan: SubPlanKey) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5" role="radiogroup" aria-label="Choose your plan">
      {(Object.keys(SUB_PLANS) as SubPlanKey[]).map((key) => {
        const p = SUB_PLANS[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`relative flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
              selected
                ? "border-gold-400/70 bg-gold-400/[0.09]"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            } disabled:opacity-60`}
          >
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selected ? "border-gold-400" : "border-white/30"
              }`}
            >
              {selected && <CircleCheck className="h-5 w-5 text-gold-400" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/90">
                  {p.label}
                </span>
                {p.badge && (
                  <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gold-300">
                    {p.badge}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-white/55">{p.note}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-base font-bold text-gold">{p.price}</span>
              <span className="block text-[11px] text-white/45">{p.per}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Layout "um botão só": o CTA principal fala do MOTIVO (a leitura); a
 * recorrência fica numa linha pequena logo abaixo, e os ciclos mais longos
 * só aparecem se a pessoa pedir. Mede-se com `offer_layout: "single_cta"`.
 *
 * Por que: com 3 cards iguais acima do botão, a tela pedia uma decisão de
 * ciclo antes da decisão que importa — e 38 checkouts abertos seguidos sem
 * uma tentativa de cartão disseram que a decisão travava ali.
 */
export const OFFER_LAYOUT = "single_cta";

export function PlanFinePrint({
  value,
  onChange,
  disabled,
  onOpenOptions,
}: {
  value: SubPlanKey;
  onChange: (plan: SubPlanKey) => void;
  disabled?: boolean;
  /** Disparado uma vez quando a pessoa abre os ciclos longos. */
  onOpenOptions?: () => void;
}) {
  const [open, setOpen] = useState(value !== DEFAULT_SUB_PLAN);
  const p = SUB_PLANS[value];
  return (
    <div className="mt-2.5 text-center">
      <p className="text-[13px] text-white/60">
        <span className="text-gold">{p.price}</span>
        {p.per} &middot; unlimited readings &middot; cancel anytime
      </p>
      {!open ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
            onOpenOptions?.();
          }}
          className="mt-1.5 text-[12px] text-white/40 underline decoration-white/20 underline-offset-2 hover:text-white/70 disabled:opacity-60"
        >
          Prefer to pay less per month? 6 months {SUB_PLANS.SUB_SEMIANNUAL.price}{" "}
          &middot; 1 year {SUB_PLANS.SUB_ANNUAL.price}
        </button>
      ) : (
        <div className="mt-3 text-left">
          <PlanPicker value={value} onChange={onChange} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
