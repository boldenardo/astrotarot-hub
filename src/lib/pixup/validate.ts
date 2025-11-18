/**
 * Script de validação para verificar se as APIs do PixUp estão configuradas corretamente
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    apiKey: boolean;
    apiSecret: boolean;
    webhookSecret: boolean;
    baseUrl: string | null;
  };
}

/**
 * Valida a configuração das variáveis de ambiente do PixUp
 */
export function validatePixUpConfiguration(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    config: {
      apiKey: false,
      apiSecret: false,
      webhookSecret: false,
      baseUrl: null,
    },
  };

  // Verificar PIXUP_API_KEY
  const apiKey = process.env.PIXUP_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-pixup-api-key") {
    result.errors.push(
      "❌ PIXUP_API_KEY não está configurada ou está com valor padrão"
    );
    result.isValid = false;
  } else {
    result.config.apiKey = true;
  }

  // Verificar PIXUP_API_SECRET
  const apiSecret = process.env.PIXUP_API_SECRET;
  if (
    !apiSecret ||
    apiSecret.trim() === "" ||
    apiSecret === "your-pixup-api-secret"
  ) {
    result.errors.push(
      "❌ PIXUP_API_SECRET não está configurada ou está com valor padrão"
    );
    result.isValid = false;
  } else {
    result.config.apiSecret = true;
  }

  // Verificar PIXUP_WEBHOOK_SECRET (opcional mas recomendado)
  const webhookSecret = process.env.PIXUP_WEBHOOK_SECRET;
  if (
    !webhookSecret ||
    webhookSecret.trim() === "" ||
    webhookSecret === "your-pixup-webhook-secret"
  ) {
    result.warnings.push(
      "⚠️ PIXUP_WEBHOOK_SECRET não está configurado. Recomendado para segurança dos webhooks."
    );
  } else {
    result.config.webhookSecret = true;
  }

  // Verificar PIXUP_BASE_URL (opcional)
  const baseUrl = process.env.PIXUP_BASE_URL;
  if (baseUrl && baseUrl.trim() !== "") {
    result.config.baseUrl = baseUrl;
  } else {
    result.config.baseUrl = "https://api.pixupbr.com/v1 (padrão)";
    result.warnings.push(
      "ℹ️ PIXUP_BASE_URL não configurado, usando URL padrão: https://api.pixupbr.com/v1"
    );
  }

  // Verificar NEXT_PUBLIC_APP_URL (necessário para webhooks)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || appUrl.trim() === "") {
    result.warnings.push(
      "⚠️ NEXT_PUBLIC_APP_URL não está configurado. Necessário para configurar webhooks corretamente."
    );
  }

  return result;
}

/**
 * Testa a conexão com a API do PixUp (verifica se as credenciais são válidas)
 */
export async function testPixUpConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const validation = validatePixUpConfiguration();

    if (!validation.isValid) {
      return {
        success: false,
        message: "Configuração inválida. Corrija os erros antes de testar a conexão.",
        details: validation.errors,
      };
    }

    const apiKey = process.env.PIXUP_API_KEY!;
    const apiSecret = process.env.PIXUP_API_SECRET!;
    const baseUrl =
      process.env.PIXUP_BASE_URL || "https://api.pixupbr.com/v1";

    // Fazer uma requisição de teste para verificar as credenciais
    // Nota: Este endpoint pode variar dependendo da API real do PixUp
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: "✅ Conexão com PixUp estabelecida com sucesso!",
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `❌ Erro ao conectar com PixUp: ${response.status} ${response.statusText}`,
        details: error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Erro ao testar conexão: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Exibe um relatório completo da configuração do PixUp
 */
export function printPixUpConfigurationReport(): void {
  console.log("\n" + "=".repeat(60));
  console.log("📋 RELATÓRIO DE CONFIGURAÇÃO DO PIXUP");
  console.log("=".repeat(60) + "\n");

  const validation = validatePixUpConfiguration();

  console.log("🔑 Variáveis de Ambiente:");
  console.log(
    `  PIXUP_API_KEY: ${validation.config.apiKey ? "✅ Configurada" : "❌ Não configurada"}`
  );
  console.log(
    `  PIXUP_API_SECRET: ${validation.config.apiSecret ? "✅ Configurada" : "❌ Não configurada"}`
  );
  console.log(
    `  PIXUP_WEBHOOK_SECRET: ${validation.config.webhookSecret ? "✅ Configurada" : "⚠️ Não configurada"}`
  );
  console.log(`  PIXUP_BASE_URL: ${validation.config.baseUrl}\n`);

  if (validation.errors.length > 0) {
    console.log("🚨 ERROS CRÍTICOS:");
    validation.errors.forEach((error) => console.log(`  ${error}`));
    console.log();
  }

  if (validation.warnings.length > 0) {
    console.log("⚠️ AVISOS:");
    validation.warnings.forEach((warning) => console.log(`  ${warning}`));
    console.log();
  }

  if (validation.isValid) {
    console.log("✅ Status: Configuração válida!");
    console.log("ℹ️ Para testar a conexão, execute: npm run test:pixup\n");
  } else {
    console.log("❌ Status: Configuração inválida!");
    console.log("\n📚 Como configurar:");
    console.log("  1. Copie o arquivo .env.example para .env");
    console.log("  2. Acesse: http://pixupbr.com/");
    console.log("  3. Crie uma conta e obtenha suas credenciais");
    console.log("  4. Configure as variáveis no arquivo .env");
    console.log("  5. Execute este script novamente\n");
  }

  console.log("=".repeat(60) + "\n");
}

/**
 * Função auxiliar para verificar se o PixUp está configurado (para usar em middleware)
 */
export function isPixUpConfigured(): boolean {
  const validation = validatePixUpConfiguration();
  return validation.isValid;
}
