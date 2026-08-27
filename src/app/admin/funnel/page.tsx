// /admin/funnel — onde os leads morrem, tela por tela.
//
// Lê funnel_events (nossa telemetria própria; ver /api/telemetry) e monta:
//   1. a ESCADA DO QUIZ — quantas sessões únicas viram cada um dos 15
//      passos, com a queda de cada degrau;
//   2. o FUNIL DA PÁGINA DE VENDAS — vídeo, rolagem, oferta, CTA, checkout,
//      escape de webview, downsell;
//   3. o recorte por webview (Facebook × navegador normal);
//   4. as últimas jornadas individuais, para ver o filme de cada sessão.
//
// Acesso: ADMIN_EMAILS (mesmo gate do /admin/affiliates). Janela via
// ?days=N (padrão 7). Sessões de QA (variant qa*) ficam de fora.

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/server/admin";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

interface Row {
  event: string;
  funnel_session_id: string | null;
  webview: string | null;
  variant: string | null;
  params: Record<string, unknown> | null;
  created_at: string;
}

const QUIZ_STEP_LABELS: Record<number, string> = {
  0: "Nome",
  1: "Boas-vindas",
  2: "Status do coração",
  3: "Já conheceu?",
  4: "Signo",
  5: "Revelação do mapa",
  6: "Porta aberta (ex)",
  7: "Pronta?",
  8: "Encontro em breve",
  9: "Data de nascimento",
  10: "Preparando retrato",
  11: "Onde vão se encontrar",
  12: "Energia das cartas",
  13: "E-mail",
  14: "Analisando",
};

/** Ordem do funil da página de vendas (evento → rótulo). */
const SALES_FUNNEL: Array<[string, string]> = [
  ["quiz_vsl_view", "Chegou na página de vendas"],
  ["vsl_video_started", "Deu play no vídeo"],
  ["vsl_video_25", "Vídeo 25%"],
  ["vsl_video_50", "Vídeo 50%"],
  ["vsl_video_75", "Vídeo 75%"],
  ["vsl_video_completed", "Vídeo 90%+"],
  ["vsl_scroll_25", "Rolou 25% da página"],
  ["vsl_scroll_50", "Rolou 50%"],
  ["vsl_scroll_75", "Rolou 75%"],
  ["vsl_scroll_90", "Rolou 90%"],
  ["offer_viewed", "Viu a oferta"],
  ["cta_viewed", "Viu o botão"],
  ["checkout_cta_clicked", "Clicou em comprar"],
  ["checkout_session_created", "Sessão Stripe criada"],
  ["checkout_escape_attempted", "Escape p/ Chrome tentado"],
  ["checkout_escape_failed", "Escape bloqueado"],
  ["checkout_error", "Erro/redirect bloqueado"],
  ["downsell_viewed", "Viu o downsell $9.99"],
  ["downsell_clicked", "Clicou no downsell"],
  ["lead_captured", "E-mail capturado"],
];

function uniq(rows: Row[], event: string): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    if (r.event === event && r.funnel_session_id) s.add(r.funnel_session_id);
  }
  return s;
}

function pct(n: number, base: number): string {
  if (!base) return "—";
  return `${Math.round((n / base) * 100)}%`;
}

export default async function FunnelAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  if (!(await isAdmin())) redirect("/");

  const { days: daysRaw } = await searchParams;
  const days = Math.min(30, Math.max(1, Number(daysRaw) || 7));
  const since = new Date(Date.now() - days * 86400e3).toISOString();

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("funnel_events")
    .select("event, funnel_session_id, webview, variant, params, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20000);

  const rows = ((data ?? []) as Row[]).filter(
    (r) => !/^qa/.test(String(r.variant ?? ""))
  );

  // ---- escada do quiz ----
  const stepSessions = new Map<number, Set<string>>();
  for (const r of rows) {
    if (r.event !== "quiz_step_viewed" || !r.funnel_session_id) continue;
    const idx = Number(r.params?.step_index);
    if (!Number.isInteger(idx)) continue;
    if (!stepSessions.has(idx)) stepSessions.set(idx, new Set());
    stepSessions.get(idx)!.add(r.funnel_session_id);
  }
  const maxStep = Math.max(14, ...stepSessions.keys());
  const quizLadder: Array<{ idx: number; n: number; drop: number }> = [];
  for (let i = 0; i <= maxStep; i++) {
    const n = stepSessions.get(i)?.size ?? 0;
    const prev = i === 0 ? n : quizLadder[i - 1].n;
    quizLadder.push({ idx: i, n, drop: prev > 0 ? prev - n : 0 });
  }
  const quizStart = quizLadder[0]?.n ?? 0;

  // ---- funil da página de vendas ----
  const sales = SALES_FUNNEL.map(([event, label]) => {
    const all = uniq(rows, event);
    const fb = new Set(
      [...all].filter((sid) =>
        rows.some(
          (r) =>
            r.funnel_session_id === sid &&
            r.event === event &&
            r.webview === "facebook"
        )
      )
    );
    return { event, label, n: all.size, fb: fb.size };
  });
  const salesBase = sales[0]?.n ?? 0;

  // ---- jornadas recentes (últimas 20 sessões com atividade) ----
  const bySession = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.funnel_session_id) continue;
    if (!bySession.has(r.funnel_session_id))
      bySession.set(r.funnel_session_id, []);
    bySession.get(r.funnel_session_id)!.push(r);
  }
  const journeys = [...bySession.entries()]
    .sort(
      (a, b) =>
        (b[1][b[1].length - 1]?.created_at ?? "").localeCompare(
          a[1][a[1].length - 1]?.created_at ?? ""
        )
    )
    .slice(0, 20)
    .map(([sid, list]) => {
      const compact: string[] = [];
      for (const r of list) {
        let tag = r.event
          .replace("checkout_", "ck·")
          .replace("quiz_step_viewed", `q${r.params?.step_index ?? "?"}`)
          .replace("vsl_video_", "vid·")
          .replace("vsl_scroll_", "scr·");
        if (compact[compact.length - 1] !== tag) compact.push(tag);
      }
      return {
        sid: sid.slice(0, 8),
        when: list[list.length - 1].created_at.slice(5, 16).replace("T", " "),
        webview: list[0].webview ?? "?",
        trail: compact.join(" → "),
      };
    });

  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-white/50";
  const td = "px-3 py-1.5 text-sm text-white/85";

  return (
    <main className="min-h-screen bg-[#0e0a1a] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-white">
          Funil — onde os leads param
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Últimos {days} dias · sessões de QA excluídas · janelas:{" "}
          {[1, 7, 14, 30].map((d) => (
            <a
              key={d}
              href={`/admin/funnel?days=${d}`}
              className={`mr-2 underline underline-offset-2 ${d === days ? "text-gold-300" : "text-white/60"}`}
            >
              {d}d
            </a>
          ))}
        </p>

        <h2 className="mt-8 font-display text-lg font-semibold text-white">
          1 · Quiz ({quizStart} sessões entraram)
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className={th}>Passo</th>
                <th className={th}>Tela</th>
                <th className={th}>Sessões</th>
                <th className={th}>% do início</th>
                <th className={th}>Perdeu aqui</th>
              </tr>
            </thead>
            <tbody>
              {quizLadder.map((s) => (
                <tr key={s.idx} className="border-t border-white/5">
                  <td className={td}>{s.idx}</td>
                  <td className={td}>{QUIZ_STEP_LABELS[s.idx] ?? "—"}</td>
                  <td className={td}>{s.n}</td>
                  <td className={td}>{pct(s.n, quizStart)}</td>
                  <td className={`${td} ${s.drop > 0 && s.n > 0 && s.drop / (s.n + s.drop) > 0.25 ? "font-semibold text-red-400" : "text-white/50"}`}>
                    {s.idx === 0 ? "—" : `-${s.drop}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 font-display text-lg font-semibold text-white">
          2 · Página de vendas → checkout
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className={th}>Etapa</th>
                <th className={th}>Sessões</th>
                <th className={th}>% da página</th>
                <th className={th}>via Facebook</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.event} className="border-t border-white/5">
                  <td className={td}>{s.label}</td>
                  <td className={td}>{s.n}</td>
                  <td className={td}>{pct(s.n, salesBase)}</td>
                  <td className={`${td} text-white/55`}>{s.fb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-white/45">
          O que acontece DENTRO do checkout.stripe.com não emite evento — o
          próximo sinal depois de &ldquo;Sessão Stripe criada&rdquo; é
          pagamento (webhook) ou expiração em 30&nbsp;min.
        </p>

        <h2 className="mt-8 font-display text-lg font-semibold text-white">
          3 · Últimas jornadas
        </h2>
        <div className="mt-3 space-y-2">
          {journeys.map((j) => (
            <div
              key={j.sid + j.when}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <p className="text-[11px] text-white/45">
                {j.when} · {j.sid} · {j.webview}
              </p>
              <p className="mt-0.5 break-words text-[13px] leading-relaxed text-white/80">
                {j.trail}
              </p>
            </div>
          ))}
          {!journeys.length && (
            <p className="text-sm text-white/50">Sem sessões na janela.</p>
          )}
        </div>
      </div>
    </main>
  );
}
