// HotmartTokenManager — OAuth client_credentials com cache, renovação
// antecipada e lock anti-refresh-simultâneo.
//
// O token NUNCA sai daqui: nem em log, nem em erro, nem em resposta de
// tool. Quem precisa autenticar pede um header pronto via authHeader().

import { HotmartError } from "./errors";

const TOKEN_URL = "https://api-sec-vlc.hotmart.com/security/oauth/token";
/** Renova 5 min antes de expirar — nunca corre com token na iminência de morrer. */
const EXPIRY_SLACK_MS = 5 * 60 * 1000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

export class HotmartTokenManager {
  private cached: CachedToken | null = null;
  /** Lock: refreshes concorrentes aguardam a MESMA promise em vez de duplicar. */
  private inflight: Promise<CachedToken> | null = null;

  // Campos explícitos (não parameter properties): o runner de testes usa o
  // strip-only do Node, que não aceita `private` em parâmetro de construtor.
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly fetchImpl: typeof fetch;

  constructor(
    clientId = process.env.HOTMART_CLIENT_ID ?? "",
    clientSecret = process.env.HOTMART_CLIENT_SECRET ?? "",
    fetchImpl: typeof fetch = fetch
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.fetchImpl = fetchImpl;
  }

  configured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /** Header Authorization pronto para uso. Token em si não é exposto além disto. */
  async authHeader(): Promise<string> {
    const token = await this.getToken();
    return `Bearer ${token}`;
  }

  /** Descarta o token em cache (usado no retry pós-401). */
  invalidate(): void {
    this.cached = null;
  }

  private async getToken(): Promise<string> {
    if (!this.configured()) {
      throw new HotmartError(
        "HOTMART_AUTH_FAILED",
        "HOTMART_CLIENT_ID/HOTMART_CLIENT_SECRET are not configured."
      );
    }
    const now = Date.now();
    if (this.cached && this.cached.expiresAt - EXPIRY_SLACK_MS > now) {
      return this.cached.value;
    }
    if (!this.inflight) {
      this.inflight = this.requestToken().finally(() => {
        this.inflight = null;
      });
    }
    const fresh = await this.inflight;
    return fresh.value;
  }

  private async requestToken(): Promise<CachedToken> {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const url =
      `${TOKEN_URL}?grant_type=client_credentials` +
      `&client_id=${encodeURIComponent(this.clientId)}` +
      `&client_secret=${encodeURIComponent(this.clientSecret)}`;

    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new HotmartError(
        "HOTMART_TIMEOUT",
        `Token request failed: ${e instanceof Error ? e.name : "network error"}`
      );
    }

    if (!res.ok) {
      // Corpo do erro pode ecoar dados sensíveis — não propaga o body cru.
      throw new HotmartError("HOTMART_AUTH_FAILED", `Token endpoint returned HTTP ${res.status}.`, {
        status: res.status,
      });
    }

    const body = (await res.json().catch(() => null)) as
      | { access_token?: string; expires_in?: number }
      | null;
    if (!body?.access_token) {
      throw new HotmartError("HOTMART_AUTH_FAILED", "Token endpoint returned no access_token.");
    }

    this.cached = {
      value: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };
    return this.cached;
  }
}

/** Instância única por processo — o cache/lock só funciona compartilhado. */
let singleton: HotmartTokenManager | null = null;
export function getTokenManager(): HotmartTokenManager {
  if (!singleton) singleton = new HotmartTokenManager();
  return singleton;
}
