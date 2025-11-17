/**
 * Cliente para integração com PixUp (http://pixupbr.com/)
 * Gateway de pagamento PIX brasileiro
 */

interface PixUpConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

// Configuração padrão com variáveis de ambiente
const defaultConfig: PixUpConfig = {
  apiKey: process.env.PIXUP_API_KEY || "",
  apiSecret: process.env.PIXUP_API_SECRET || "",
  baseUrl: "https://api.pixupbr.com/v1",
};

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
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: PixUpConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || "https://api.pixupbr.com/v1";
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ): Promise<any> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
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
    const apiKey = process.env.PIXUP_API_KEY;
    const apiSecret = process.env.PIXUP_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "PixUp credentials not configured. Set PIXUP_API_KEY and PIXUP_API_SECRET environment variables."
      );
    }

    pixupClient = new PixUpClient({
      apiKey,
      apiSecret,
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
