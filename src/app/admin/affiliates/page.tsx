// Painel de afiliados — server component, dados via service role.
// Acesso: só e-mails listados em ADMIN_EMAILS (ver src/lib/server/admin.ts).

import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/server/admin";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

interface StatRow {
  code: string;
  name: string;
  email: string | null;
  commission_pct: number;
  active: boolean;
  clicks: number;
  sales: number;
  revenue: number;
  commission_due: number;
  last_sale_at: string | null;
}

interface SaleRow {
  code: string;
  email: string | null;
  amount: number;
  plan: string | null;
  kind: string;
  created_at: string;
}

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n || 0
  );

const day = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "—";

export default async function AffiliatesAdminPage() {
  // 404 (em vez de 403) para não confirmar a existência do painel.
  if (!(await isAdmin())) notFound();

  const admin = getSupabaseAdmin();
  const [{ data: stats }, { data: sales }] = await Promise.all([
    admin.from("affiliate_stats").select("*").order("revenue", { ascending: false }),
    admin
      .from("affiliate_sales")
      .select("code, email, amount, plan, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const rows = (stats ?? []) as StatRow[];
  const recent = (sales ?? []) as SaleRow[];

  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + Number(r.clicks || 0),
      sales: acc.sales + Number(r.sales || 0),
      revenue: acc.revenue + Number(r.revenue || 0),
      commission: acc.commission + Number(r.commission_due || 0),
    }),
    { clicks: 0, sales: 0, revenue: 0, commission: 0 }
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-ink-200">
      <h1 className="font-display text-3xl font-semibold text-ink-50">
        Affiliates
      </h1>
      <p className="mt-1 text-sm text-ink-400">
        Attribution is first-touch and lasts 90 days. Renewals keep crediting
        the affiliate who brought the customer.
      </p>

      {/* Totais */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Clicks", value: String(totals.clicks) },
          { label: "Sales", value: String(totals.sales) },
          { label: "Revenue", value: money(totals.revenue) },
          { label: "Commission owed", value: money(totals.commission) },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-ink-400">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-ink-50">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Por afiliado */}
      <h2 className="mt-10 font-display text-xl font-semibold text-gold-300">
        By affiliate
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-400">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4 text-right">Clicks</th>
              <th className="py-2 pr-4 text-right">Sales</th>
              <th className="py-2 pr-4 text-right">Conv.</th>
              <th className="py-2 pr-4 text-right">Revenue</th>
              <th className="py-2 pr-4 text-right">Rate</th>
              <th className="py-2 pr-4 text-right">Owed</th>
              <th className="py-2 text-right">Last sale</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-ink-400">
                  No affiliates yet. Add one in Supabase:{" "}
                  <code className="text-gold-300">
                    INSERT INTO affiliates (code, name, commission_pct) VALUES
                    (&apos;code&apos;, &apos;Name&apos;, 30);
                  </code>
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const conv =
                Number(r.clicks) > 0
                  ? ((Number(r.sales) / Number(r.clicks)) * 100).toFixed(1) + "%"
                  : "—";
              return (
                <tr key={r.code} className="border-b border-white/5">
                  <td className="py-2.5 pr-4">
                    <span className="font-mono text-gold-300">{r.code}</span>
                    {!r.active && (
                      <span className="ml-2 text-xs text-red-400">inactive</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">{r.name}</td>
                  <td className="py-2.5 pr-4 text-right">{r.clicks}</td>
                  <td className="py-2.5 pr-4 text-right">{r.sales}</td>
                  <td className="py-2.5 pr-4 text-right">{conv}</td>
                  <td className="py-2.5 pr-4 text-right">{money(Number(r.revenue))}</td>
                  <td className="py-2.5 pr-4 text-right">{r.commission_pct}%</td>
                  <td className="py-2.5 pr-4 text-right font-semibold text-gold-300">
                    {money(Number(r.commission_due))}
                  </td>
                  <td className="py-2.5 text-right text-ink-400">
                    {day(r.last_sale_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vendas recentes */}
      <h2 className="mt-10 font-display text-xl font-semibold text-gold-300">
        Recent attributed sales
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-400">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Plan</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-400">
                  No attributed sales yet.
                </td>
              </tr>
            )}
            {recent.map((s, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-2.5 pr-4 text-ink-400">{day(s.created_at)}</td>
                <td className="py-2.5 pr-4 font-mono text-gold-300">{s.code}</td>
                <td className="py-2.5 pr-4">{s.email ?? "—"}</td>
                <td className="py-2.5 pr-4">{s.plan ?? "—"}</td>
                <td className="py-2.5 pr-4">{s.kind}</td>
                <td className="py-2.5 text-right">{money(Number(s.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-xs text-ink-600">
        Affiliate link format:{" "}
        <code className="text-gold-300">https://astrotarot.shop/?ref=CODE</code>{" "}
        — works on any public page (e.g. /quiz?ref=CODE).
      </p>
    </main>
  );
}
