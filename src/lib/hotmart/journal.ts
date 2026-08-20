// Mutation journal — todo write real (ou tentativa) vira uma linha JSONL em
// mcp/hotmart/journal.jsonl (gitignored). Sem secrets, sem token, sem dados
// bancários: só o suficiente para auditar quem fez o quê, quando, em qual
// recurso e com qual resultado. Nunca lança: auditoria não derruba a
// operação que audita.

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

const JOURNAL_PATH = join(process.cwd(), "mcp", "hotmart", "journal.jsonl");

export interface JournalEntry {
  operation_id: string;
  /** Nome da tool MCP quando a mutação veio por ela; action já identifica. */
  tool?: string;
  resource_id: string;
  action: string;
  previous_state?: string | null;
  requested_at: string;
  executed_at?: string;
  result: "success" | "failed" | "unconfirmed" | "dry_run" | "preflight" | "blocked";
  new_state?: string | null;
  detail?: string;
}

/** jo***@gmail.com — identifica sem expor (fase PII). */
export function maskEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.includes("@")) return null;
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}

export function newOperationId(): string {
  return randomUUID();
}

export function journal(entry: JournalEntry): void {
  try {
    mkdirSync(dirname(JOURNAL_PATH), { recursive: true });
    appendFileSync(
      JOURNAL_PATH,
      JSON.stringify({ ts: new Date().toISOString(), provider: "hotmart", ...entry }) + "\n",
      "utf8"
    );
  } catch {
    // journal indisponível — a operação segue
  }
}
