/**
 * Cliente para integração com PixUp (http://pixupbr.com/)
 * Gateway de pagamento PIX brasileiro
 */

interface PixUpConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
}

// Configuração padrão com variáveis de ambiente
const defaultConfig: PixUpConfig = {
  clientId: process.env.PIXUP_CLIENT_ID || "",
  clientSecret: process.env.PIXUP_CLIENT_SECRET || "",
  baseUrl: process.env.PIXUP_BASE_URL || "https://api.pixupbr.com/v2",
};

/**
 * Gera o header de autenticação Basic Auth para PixUp
 * Concatena client_id:client_secret e codifica em base64
 */
function generateBasicAuthHeader(
  clientId: string,
  clientSecret: string
): string {
  const credentials = `${clientId}:${clientSecret}`;
  const base64Credentials = Buffer.from(credentials).toString("base64");
  return `Basic ${base64Credentials}`;
}

interface CreatePixPaymentParams {
  amount: number; // Valor em centavos (990 = R$ 9,90)
  description: string;
  customerName: string;
  customerEmail: string;
  customerDocument?: string; // CPF/CNPJ
  expiresInMinutes?: number; // Validade do PIX (padrão: 30 minutos)
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

interface PixPaymentResponse {
  id: string;
  status: "pending" | "paid" | "cancelled" | "expired";
  amount: number;
  qrCode: string; // Base64 da imagem QR Code
  qrCodeString: string; // String PIX copia e cola
  expiresAt: string; // ISO date
  createdAt: string;
}

interface CreateSubscriptionParams {
  amount: number; // Valor mensal em centavos
  description: string;
  customerName: string;
  customerEmail: string;
  customerDocument?: string;
  webhookUrl?: string;
  billingDay?: number; // Dia do mês para cobrança (1-28)
}

interface SubscriptionResponse {
  id: string;
  customerId: string;
  status: "active" | "cancelled" | "suspended";
  amount: number;
  nextBillingDate: string;
  createdAt: string;
}

class PixUpClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: PixUpConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = config.baseUrl || "https://api.pixupbr.com/v1";
    this.authHeader = generateBasicAuthHeader(this.clientId, this.clientSecret);
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ): Promise<any> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: this.authHeader,
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na requisição PixUp");
      }

      return data;
    } catch (error: any) {
      console.error("Erro PixUp:", error);
      throw new Error(error.message || "Erro ao comunicar com PixUp");
    }
  }

  /**
   * Cria um pagamento PIX único
   * @param params Parâmetros do pagamento
   * @returns Dados do pagamento incluindo QR Code
   */
  async createPixPayment(
    params: CreatePixPaymentParams
  ): Promise<PixPaymentResponse> {
    const payload = {
      amount: params.amount,
      description: params.description,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
        document: params.customerDocument,
      },
      expiresIn: params.expiresInMinutes || 30,
      webhookUrl: params.webhookUrl,
      metadata: params.metadata,
    };

    return this.makeRequest("/payments/pix", "POST", payload);
  }

  /**
   * Cria uma assinatura recorrente mensal
   * @param params Parâmetros da assinatura
   * @returns Dados da assinatura
   */
  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResponse> {
    const payload = {
      amount: params.amount,
      description: params.description,
      interval: "monthly",
      billingDay: params.billingDay || 1,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
        document: params.customerDocument,
      },
      webhookUrl: params.webhookUrl,
    };

    return this.makeRequest("/subscriptions", "POST", payload);
  }

  /**
   * Busca status de um pagamento
   * @param paymentId ID do pagamento
   * @returns Status atualizado do pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<PixPaymentResponse> {
    return this.makeRequest(`/payments/${paymentId}`, "GET");
  }

  /**
   * Cancela uma assinatura
   * @param subscriptionId ID da assinatura
   * @returns Confirmação do cancelamento
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    return this.makeRequest(`/subscriptions/${subscriptionId}/cancel`, "POST");
  }

  /**
   * Lista todas as assinaturas de um cliente
   * @param customerEmail Email do cliente
   * @returns Lista de assinaturas
   */
  async listCustomerSubscriptions(
    customerEmail: string
  ): Promise<SubscriptionResponse[]> {
    return this.makeRequest(
      `/subscriptions?customer_email=${encodeURIComponent(customerEmail)}`,
      "GET"
    );
  }

  /**
   * Reativa uma assinatura cancelada
   * @param subscriptionId ID da assinatura
   * @returns Assinatura reativada
   */
  async reactivateSubscription(
    subscriptionId: string
  ): Promise<SubscriptionResponse> {
    return this.makeRequest(
      `/subscriptions/${subscriptionId}/reactivate`,
      "POST"
    );
  }
}

// Singleton instance
let pixupClient: PixUpClient | null = null;

export function getPixUpClient(): PixUpClient {
  if (!pixupClient) {
    const clientId = process.env.PIXUP_CLIENT_ID || process.env.PIXUP_API_KEY;
    const clientSecret =
      process.env.PIXUP_CLIENT_SECRET || process.env.PIXUP_API_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "PixUp credentials not configured. Set PIXUP_CLIENT_ID and PIXUP_CLIENT_SECRET environment variables."
      );
    }

    pixupClient = new PixUpClient({
      clientId,
      clientSecret,
      baseUrl: process.env.PIXUP_BASE_URL,
    });
  }

  return pixupClient;
}

export type {
  CreatePixPaymentParams,
  PixPaymentResponse,
  CreateSubscriptionParams,
  SubscriptionResponse,
};

export { PixUpClient };
