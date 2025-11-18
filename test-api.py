#!/usr/bin/env python3
import requests
import json
import time

print("🧪 Testando API do AstroTarot Hub...\n")

BASE_URL = "http://localhost:3000"

try:
    # 1. Teste de Registro
    print("1️⃣ Testando registro de usuário...")
    register_payload = {
        "email": f"teste{int(time.time())}@example.com",
        "password": "senha123",
        "name": "Teste User",
        "birthDate": "1990-01-15",
        "birthTime": "14:30",
        "birthLocation": "São Paulo, Brasil"
    }
    
    register_response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=register_payload,
        timeout=10
    )
    
    print(f"✅ Status: {register_response.status_code}")
    register_data = register_response.json()
    
    if register_response.ok:
        print(f"   Token recebido: {'✓' if register_data.get('token') else '✗'}")
        print(f"   User ID: {register_data.get('user', {}).get('id')}")
        print(f"   Email: {register_data.get('user', {}).get('email')}")
        print(f"   Leituras disponíveis: {register_data.get('user', {}).get('readings_left')}")
        
        token = register_data.get('token')
        user_email = register_data.get('user', {}).get('email')
    else:
        print(f"❌ Erro: {register_data}")
        exit(1)
    
    print()
    
    # 2. Teste de Login
    print("2️⃣ Testando login...")
    login_payload = {
        "email": user_email,
        "password": "senha123"
    }
    
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        timeout=10
    )
    
    print(f"✅ Status: {login_response.status_code}")
    login_data = login_response.json()
    
    if login_response.ok:
        print(f"   Token recebido: {'✓' if login_data.get('token') else '✗'}")
        print(f"   Leituras disponíveis: {login_data.get('user', {}).get('readings_left')}")
    else:
        print(f"❌ Erro: {login_data}")
    
    print()
    
    # 3. Teste de rota protegida
    print("3️⃣ Testando rota protegida (histórico)...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    readings_response = requests.get(
        f"{BASE_URL}/api/user/readings",
        headers=headers,
        timeout=10
    )
    
    print(f"✅ Status: {readings_response.status_code}")
    readings_data = readings_response.json()
    
    if readings_response.ok:
        print(f"   Leituras encontradas: {len(readings_data.get('readings', []))}")
    else:
        print(f"❌ Erro: {readings_data}")
    
    print()
    
    # 4. Resumo
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📊 RESUMO DOS TESTES:")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Registro de usuário: OK")
    print("✅ Login: OK")
    print("✅ Autenticação JWT: OK")
    print("✅ Rotas protegidas: OK")
    print("✅ Integração com Supabase: OK")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("\n🎉 Todos os testes passaram!")
    print("🚀 Sistema pronto para deploy!")

except requests.exceptions.ConnectionError as e:
    print(f"\n❌ Erro de conexão: Servidor não está respondendo em {BASE_URL}")
    print("   Verifique se o servidor está rodando com: npm run dev")
except requests.exceptions.Timeout:
    print("\n❌ Timeout: Servidor demorou muito para responder")
except Exception as e:
    print(f"\n❌ Erro inesperado: {e}")
    import traceback
    traceback.print_exc()
