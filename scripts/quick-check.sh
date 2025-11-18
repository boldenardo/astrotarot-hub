#!/bin/bash

# Script de verificação rápida do status das APIs do PixUp
# Uso: ./scripts/quick-check.sh

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "   🔍 VERIFICAÇÃO RÁPIDA - APIs do PixUp"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado"
    echo ""
    echo "📝 Ação necessária:"
    echo "   1. Copie o arquivo de exemplo: cp .env.example .env"
    echo "   2. Edite o arquivo .env com suas credenciais"
    echo ""
    exit 1
fi

echo "✅ Arquivo .env encontrado"
echo ""

# Verificar se as variáveis estão configuradas
echo "🔑 Verificando variáveis de ambiente..."
echo ""

# Carregar .env
export $(cat .env | grep -v '^#' | xargs)

# Verificar PIXUP_API_KEY
if [ -z "$PIXUP_API_KEY" ] || [ "$PIXUP_API_KEY" = "your-pixup-api-key" ]; then
    echo "❌ PIXUP_API_KEY: Não configurada"
    ERRORS=1
else
    echo "✅ PIXUP_API_KEY: Configurada"
fi

# Verificar PIXUP_API_SECRET
if [ -z "$PIXUP_API_SECRET" ] || [ "$PIXUP_API_SECRET" = "your-pixup-api-secret" ]; then
    echo "❌ PIXUP_API_SECRET: Não configurada"
    ERRORS=1
else
    echo "✅ PIXUP_API_SECRET: Configurada"
fi

# Verificar PIXUP_WEBHOOK_SECRET
if [ -z "$PIXUP_WEBHOOK_SECRET" ] || [ "$PIXUP_WEBHOOK_SECRET" = "your-pixup-webhook-secret" ]; then
    echo "⚠️  PIXUP_WEBHOOK_SECRET: Não configurada (recomendado)"
else
    echo "✅ PIXUP_WEBHOOK_SECRET: Configurada"
fi

echo ""

# Verificar se há erros
if [ ! -z "$ERRORS" ]; then
    echo "═══════════════════════════════════════════════════════════"
    echo "   ❌ STATUS: Configuração Incompleta"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "📚 Como configurar:"
    echo ""
    echo "   1. Acesse: http://pixupbr.com/"
    echo "   2. Crie uma conta e obtenha suas credenciais"
    echo "   3. Edite o arquivo .env com suas credenciais"
    echo "   4. Execute: npm run check:pixup"
    echo ""
    echo "📖 Documentação completa: PIXUP_CONFIG.md"
    echo ""
    exit 1
else
    echo "═══════════════════════════════════════════════════════════"
    echo "   ✅ STATUS: Configuração Válida"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "✨ As APIs do PixUp estão configuradas!"
    echo ""
    echo "🔌 Para testar a conexão, execute:"
    echo "   npm run test:pixup"
    echo ""
    exit 0
fi
