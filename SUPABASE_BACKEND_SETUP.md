# 🚀 Configuração Completa do Backend no Supabase

## ✅ PASSO 1: Executar Schema SQL

### Acesse o SQL Editor do Supabase:

1. Abra: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/sql
2. Clique em "New Query"
3. Cole o conteúdo completo do arquivo `supabase/schema.sql`
4. Clique em "Run" (ou pressione Ctrl+Enter)
5. Verifique se aparece: ✅ "Success. No rows returned"

### Verificar Tabelas Criadas:

- Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/editor
- Deve mostrar 4 tabelas:
  - ✅ users
  - ✅ payments
  - ✅ tarot_readings
  - ✅ birth_charts

---

## ✅ PASSO 2: Configurar Autenticação JWT do Supabase

### Problema Atual:

Estamos usando JWT customizado. Vamos migrar para o **Supabase Auth** nativo.

### Migração:

#### 2.1 - Habilitar Email/Password Auth:

1. Acesse: https://supabase.com/dashboard/project/workzjugpmwbbbkxdgtu/auth/providers
2. Em "Email", certifique-se que está habilitado
3. Desabilite "Confirm email" (para testes rápidos)

#### 2.2 - Atualizar Schema de Users:

O Supabase Auth cria automaticamente a tabela `auth.users`.
Nossa tabela `public.users` será uma extensão para dados adicionais.

Execute no SQL Editor:

```sql
-- Adicionar coluna auth_id para vincular com auth.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar trigger para criar perfil quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, subscription_plan, subscription_status, readings_left)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'FREE', 'active', 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automático
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar políticas RLS para usar auth.uid()
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

-- Atualizar outras políticas
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = payments.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = NEW.user_id AND users.auth_id = auth.uid()
  ));

-- Similar para tarot_readings
DROP POLICY IF EXISTS "Users can view own readings" ON tarot_readings;
DROP POLICY IF EXISTS "Users can create own readings" ON tarot_readings;

CREATE POLICY "Users can view own readings"
  ON tarot_readings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = tarot_readings.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own readings"
  ON tarot_readings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = NEW.user_id AND users.auth_id = auth.uid()
  ));

-- Similar para birth_charts
DROP POLICY IF EXISTS "Users can view own charts" ON birth_charts;
DROP POLICY IF EXISTS "Users can create own charts" ON birth_charts;

CREATE POLICY "Users can view own charts"
  ON birth_charts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = birth_charts.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can create own charts"
  ON birth_charts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = NEW.user_id AND users.auth_id = auth.uid()
  ));
```

---

## ✅ PASSO 3: Criar Edge Functions (Backend no Supabase)

### 3.1 - Instalar Supabase CLI (se ainda não tiver):

```bash
npm install -g supabase
```

### 3.2 - Login no Supabase:

```bash
supabase login
```

### 3.3 - Vincular com projeto:

```bash
supabase link --project-ref workzjugpmwbbbkxdgtu
```

### 3.4 - Criar Edge Functions:

#### A) Function: create-tarot-reading

```bash
supabase functions new create-tarot-reading
```

Arquivo: `supabase/functions/create-tarot-reading/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verificar leituras disponíveis
    if (profile.readings_left <= 0 && profile.subscription_plan === "FREE") {
      return new Response(
        JSON.stringify({
          error: "Você não tem leituras disponíveis",
          needsPayment: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    const { selectedCards, question } = await req.json();

    // Chamar GROQ para interpretação (substituir com sua chave)
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "Você é um expert em Tarot Egípcio...",
            },
            {
              role: "user",
              content: `Interprete estas cartas: ${JSON.stringify(
                selectedCards
              )}. Pergunta: ${question}`,
            },
          ],
        }),
      }
    );

    const groqData = await groqResponse.json();
    const interpretation = groqData.choices[0].message.content;

    // Salvar leitura
    const { data: reading, error: readingError } = await supabaseClient
      .from("tarot_readings")
      .insert({
        user_id: profile.id,
        deck_type: "EGYPTIAN",
        spread_type: selectedCards.length === 4 ? "FOUR_CARDS" : "FULL_SPREAD",
        cards: selectedCards,
        interpretation: interpretation,
        is_premium: profile.subscription_plan === "PREMIUM_MONTHLY",
      })
      .select()
      .single();

    // Decrementar leituras se FREE
    if (profile.subscription_plan === "FREE") {
      await supabaseClient
        .from("users")
        .update({ readings_left: profile.readings_left - 1 })
        .eq("id", profile.id);
    }

    return new Response(JSON.stringify({ reading, interpretation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

#### B) Function: create-payment

```bash
supabase functions new create-payment
```

Arquivo: `supabase/functions/create-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: profile } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    const { type, customerName } = await req.json();

    // Chamar PixUp para criar pagamento
    const pixupAuth = await fetch("https://api.pixup.com.br/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: Deno.env.get("PIXUP_CLIENT_ID"),
        client_secret: Deno.env.get("PIXUP_CLIENT_SECRET"),
      }),
    });

    const { access_token } = await pixupAuth.json();

    const amount = type === "SINGLE_READING" ? 9.9 : 29.9;

    const pixupPayment = await fetch("https://api.pixup.com.br/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        currency: "BRL",
        description:
          type === "SINGLE_READING" ? "Leitura Única" : "Plano Premium Mensal",
      }),
    });

    const pixupData = await pixupPayment.json();

    // Salvar pagamento
    const { data: payment } = await supabaseClient
      .from("payments")
      .insert({
        user_id: profile.id,
        amount: amount,
        currency: "BRL",
        status: "PENDING",
        payment_type: type,
        pixup_payment_id: pixupData.id,
        pixup_qr_code: pixupData.qr_code,
        pixup_qr_string: pixupData.qr_code_text,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({ payment, qrCode: pixupData.qr_code }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### 3.5 - Deploy das Edge Functions:

```bash
supabase functions deploy create-tarot-reading
supabase functions deploy create-payment
```

### 3.6 - Configurar Secrets (variáveis de ambiente):

```bash
supabase secrets set GROQ_API_KEY=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
supabase secrets set RAPIDAPI_KEY=e8c7dd832bmsh5827d578ec63c6cp142643jsn0cd4dd73bbd9
supabase secrets set PIXUP_CLIENT_ID=666ba0275e971f9045fee8e6e03499f5715a04f2753e52f79172faef5b05bb05
supabase secrets set PIXUP_CLIENT_SECRET=seu_secret_aqui
```

---

## ✅ PASSO 4: Atualizar Frontend

### 4.1 - Remover rotas de API locais (src/app/api/\*\*)

Não precisaremos mais das rotas `/api/*` locais.

### 4.2 - Atualizar componentes para usar Supabase diretamente:

#### Exemplo: Registro

```typescript
// src/lib/auth-client.ts
import { supabase } from "@/lib/supabase";

export async function signUp(
  email: string,
  password: string,
  name: string,
  birthData?: any
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        birth_date: birthData?.birthDate,
        birth_time: birthData?.birthTime,
        birth_location: birthData?.birthLocation,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}
```

#### Exemplo: Criar Leitura de Tarot

```typescript
// src/lib/tarot-client.ts
import { supabase } from "@/lib/supabase";

export async function createTarotReading(
  selectedCards: any[],
  question: string
) {
  const { data, error } = await supabase.functions.invoke(
    "create-tarot-reading",
    {
      body: { selectedCards, question },
    }
  );

  if (error) throw error;
  return data;
}
```

---

## ✅ PASSO 5: Testar

### 5.1 - Teste de Registro:

```typescript
const { user, session } = await signUp(
  "teste@example.com",
  "senha123",
  "Teste User"
);
console.log("Token:", session?.access_token);
```

### 5.2 - Teste de Login:

```typescript
const { session } = await signIn("teste@example.com", "senha123");
console.log("Logado:", session?.user.email);
```

### 5.3 - Teste de Leitura (com token):

```typescript
const reading = await createTarotReading(selectedCards, "Qual meu futuro?");
console.log("Interpretação:", reading.interpretation);
```

---

## 🎯 VANTAGENS DA MIGRAÇÃO:

✅ **Sem servidor local**: Tudo roda no Supabase
✅ **Autenticação robusta**: JWT nativo do Supabase
✅ **RLS automático**: Segurança em nível de linha
✅ **Edge Functions**: Backend escalável e rápido
✅ **Banco de dados gerenciado**: PostgreSQL otimizado
✅ **Sem problemas de conexão local**: Tudo na nuvem
✅ **Deploy simplificado**: `git push` e pronto!

---

## 📝 PRÓXIMOS PASSOS:

1. ✅ Executar schema.sql no Supabase SQL Editor
2. ✅ Executar comandos de atualização de políticas RLS
3. ✅ Criar Edge Functions
4. ✅ Configurar secrets
5. ✅ Atualizar frontend para usar Supabase Auth
6. ✅ Remover arquivos de API locais
7. ✅ Testar tudo
8. ✅ Deploy na Vercel

---

**Status:** Pronto para executar! 🚀
