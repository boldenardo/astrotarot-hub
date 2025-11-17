#!/usr/bin/env node
/**
 * Script CLI para validar a configuração das APIs do PixUp
 * Uso: node scripts/check-pixup-config.js [--test-connection]
 */

// Carregar variáveis de ambiente
require("dotenv").config();

const {
  validatePixUpConfiguration,
  testPixUpConnection,
  printPixUpConfigurationReport,
} = require("../src/lib/pixup/validate");

async function main() {
  const args = process.argv.slice(2);
  const shouldTestConnection = args.includes("--test-connection");

  // Exibir relatório de configuração
  printPixUpConfigurationReport();

  // Se solicitado, testar a conexão
  if (shouldTestConnection) {
    console.log("🔌 Testando conexão com PixUp...\n");

    const result = await testPixUpConnection();

    console.log(result.message);
    if (result.details) {
      console.log("Detalhes:", result.details);
    }
    console.log();

    // Sair com código de erro se a conexão falhar
    if (!result.success) {
      process.exit(1);
    }
  }

  // Verificar se está configurado
  const validation = validatePixUpConfiguration();
  if (!validation.isValid) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erro ao executar script:", error);
  process.exit(1);
});
