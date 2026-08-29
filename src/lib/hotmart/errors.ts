// Taxonomia de erros Hotmart — todo erro que sai do client/serviço carrega
// um destes códigos. Nunca "sucesso presumido": o que não deu para
// confirmar sai como UNCONFIRMED, não como feito.

export type HotmartErrorCode =
  | "HOTMART_AUTH_FAILED"
  | "HOTMART_PERMISSION_DENIED"
  | "HOTMART_RATE_LIMITED"
  | "HOTMART_TIMEOUT"
  | "HOTMART_RESOURCE_NOT_FOUND"
  | "HOTMART_INVALID_STATE"
  | "HOTMART_OPERATION_UNAVAILABLE"
  | "HOTMART_MUTATION_FAILED"
  | "HOTMART_MUTATION_UNCONFIRMED"
  | "HOTMART_VALIDATION_ERROR"
  | "HOTMART_WRITES_DISABLED"
  | "HOTMART_BULK_WRITES_DISABLED"
  | "HOTMART_API_ERROR";

export class HotmartError extends Error {
  readonly code: HotmartErrorCode;
  readonly status?: number;
  /** Corpo da resposta da Hotmart, já sem headers/token. */
  readonly detail?: unknown;

  constructor(code: HotmartErrorCode, message: string, opts?: { status?: number; detail?: unknown }) {
    super(message);
    this.name = "HotmartError";
    this.code = code;
    this.status = opts?.status;
    this.detail = opts?.detail;
  }
}

export function mapHttpError(status: number, body: unknown): HotmartError {
  if (status === 401) return new HotmartError("HOTMART_AUTH_FAILED", "Hotmart rejected the credentials/token.", { status, detail: body });
  if (status === 403) return new HotmartError("HOTMART_PERMISSION_DENIED", "Credentials lack permission for this resource.", { status, detail: body });
  if (status === 404) return new HotmartError("HOTMART_RESOURCE_NOT_FOUND", "Resource not found on Hotmart.", { status, detail: body });
  if (status === 422 || status === 400) return new HotmartError("HOTMART_VALIDATION_ERROR", "Hotmart refused the request parameters/state.", { status, detail: body });
  if (status === 429) return new HotmartError("HOTMART_RATE_LIMITED", "Hotmart rate limit hit.", { status, detail: body });
  return new HotmartError("HOTMART_API_ERROR", `Hotmart API returned HTTP ${status}.`, { status, detail: body });
}
