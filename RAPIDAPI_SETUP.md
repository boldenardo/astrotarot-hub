# 🔮 Integração com Astrologer API (RapidAPI)

## Configuração

### 1. Obter API Key

1. Acesse: https://rapidapi.com/hub
2. Crie conta gratuita
3. Procure por "Astrologer API"
4. Ou acesse direto: https://rapidapi.com/myastro/api/astrologer
5. Clique em "Subscribe to Test"
6. Escolha plano gratuito (Basic - 500 requests/mês)
7. Copie sua API Key (X-RapidAPI-Key)

### 2. Configurar no Projeto

Adicione no `.env`:

```env
RAPIDAPI_KEY="sua-key-aqui"
```

## Endpoints Disponíveis

### 1. Birth Chart (Mapa Natal)

```typescript
POST / api / v4 / birth - chart;

// Exemplo de uso no código:
const birthData = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  latitude: -23.5505,
  longitude: -46.6333,
  city: "São Paulo",
  nation: "BR",
  timezone: "America/Sao_Paulo",
  name: "User",
};

const chart = await astrologerService.generateBirthChart(birthData);
```

**Resposta:**

```json
{
  "data": {
    "points": {
      "Sun": { "sign": "Taurus", "abs_pos": 24.5, "house": 10 },
      "Moon": { "sign": "Cancer", "abs_pos": 12.3, "house": 4 }
    },
    "houses": {
      "1": { "sign": "Leo", "abs_pos": 5 }
    },
    "aspects": [
      {
        "first_point": "Sun",
        "second_point": "Moon",
        "type": "trine",
        "orb": 2.5
      }
    ]
  }
}
```

### 2. Transit Aspects (Trânsitos)

```typescript
POST / api / v4 / transit - aspects - data;

const transits = await astrologerService.getTransits(birthData, new Date());
```

Retorna aspectos dos planetas atuais com o mapa natal.

### 3. Natal Aspects (Aspectos Natais)

```typescript
POST / api / v4 / natal - aspects - data;

const aspects = await astrologerService.getNatalAspects(birthData);
```

Retorna todos os aspectos no mapa natal.

### 4. Outros Endpoints Disponíveis

- **Synastry Chart**: Comparação entre dois mapas (compatibilidade)
- **Composite Chart**: Mapa composto de relacionamento
- **Relationship Score**: Pontuação de compatibilidade
- **Now**: Posições planetárias atuais

## Uso no Projeto

### API de Mapa Astral

```typescript
// src/app/api/astrology/chart/route.ts
GET / api / astrology / chart;

// Headers necessários:
Authorization: Bearer<JWT_TOKEN>;
```

### Integração com Tarot

```typescript
// Quando desbloquear interpretação premium
POST / api / tarot / unlock;

// A API cruza automaticamente:
// - Carta do tarot
// - Planeta correspondente
// - Posição no mapa natal do usuário
```

## Formato de Dados de Nascimento

```typescript
interface BirthData {
  year: number; // 1990
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  latitude: number; // -90 to 90
  longitude: number; // -180 to 180
  city: string; // "São Paulo"
  nation: string; // "BR" (código ISO)
  timezone: string; // "America/Sao_Paulo"
  name?: string; // "John Doe"
}
```

## Geocoding (Converter Cidade em Lat/Long)

Para converter o `birthLocation` do usuário em coordenadas:

### Opção 1: OpenCage Geocoding (Recomendado)

```bash
npm install opencage-api-client
```

```typescript
import { geocode } from "opencage-api-client";

async function getCoordinates(location: string) {
  const result = await geocode({
    q: location,
    key: process.env.OPENCAGE_API_KEY,
  });

  return {
    latitude: result.results[0].geometry.lat,
    longitude: result.results[0].geometry.lng,
    timezone: result.results[0].annotations.timezone.name,
  };
}
```

### Opção 2: Google Geocoding API

```typescript
import axios from "axios";

async function getCoordinates(location: string) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json`,
    {
      params: {
        address: location,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    }
  );

  const result = response.data.results[0];
  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
  };
}
```

### Opção 3: Database de Cidades (Offline)

Use uma biblioteca como `city-timezones`:

```bash
npm install city-timezones
```

```typescript
import ct from "city-timezones";

const cityData = ct.lookupViaCity("São Paulo");
// { lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo' }
```

## Modo Mock (Desenvolvimento)

Se `RAPIDAPI_KEY` não estiver configurada, o serviço usa dados mock automaticamente:

```typescript
// Retorna mapa natal fictício com:
- Sol em Escorpião
- Lua em Câncer
- Outros planetas distribuídos
```

## Limites e Custos

### Plano Gratuito (Basic)

- **500 requests/mês**
- Todos os endpoints disponíveis
- Suficiente para MVP

### Monitoramento

```typescript
// Adicione logging para monitorar uso:
console.log("[Astrologer API] Chamada:", endpoint, "User:", userId);
```

### Cache

Para reduzir chamadas:

```typescript
// Mapa astral é cacheado por 30 dias
if (user.birthChart && user.birthChart.generatedAt > thirtyDaysAgo) {
  return user.birthChart; // Usa cache
}
```

## Testes

### Testar no Postman/Insomnia

```bash
curl --request POST \
  --url https://astrologer.p.rapidapi.com/api/v4/birth-chart \
  --header 'Content-Type: application/json' \
  --header 'x-rapidapi-host: astrologer.p.rapidapi.com' \
  --header 'x-rapidapi-key: SUA_KEY_AQUI' \
  --data '{
    "subject": {
      "year": 1990,
      "month": 5,
      "day": 15,
      "hour": 14,
      "minute": 30,
      "longitude": -46.6333,
      "latitude": -23.5505,
      "city": "Sao Paulo",
      "nation": "BR",
      "timezone": "America/Sao_Paulo",
      "name": "Test User",
      "zodiac_type": "Tropic",
      "sidereal_mode": null,
      "perspective_type": "Apparent Geocentric",
      "houses_system_identifier": "P"
    },
    "theme": "classic",
    "language": "EN",
    "wheel_only": false
  }'
```

### Testar no Código

```typescript
// Crie um script de teste:
// test-astrology.ts

import { astrologerService } from "./src/lib/astroseek";

async function test() {
  const birthData = {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    latitude: -23.5505,
    longitude: -46.6333,
    city: "São Paulo",
    nation: "BR",
    timezone: "America/Sao_Paulo",
    name: "Test",
  };

  console.log("Gerando mapa astral...");
  const chart = await astrologerService.generateBirthChart(birthData);
  console.log("Planetas:", chart.planets);

  console.log("\nBuscando trânsitos...");
  const transits = await astrologerService.getTransits(birthData);
  console.log("Eventos:", transits.events);
}

test();
```

Execute:

```bash
npx tsx test-astrology.ts
```

## Troubleshooting

### Erro 401 Unauthorized

- Verifique se `RAPIDAPI_KEY` está configurada
- Confirme que copiou a key completa
- Reinicie o servidor após adicionar no `.env`

### Erro 429 Too Many Requests

- Ultrapassou limite de 500 requests/mês
- Implemente cache mais agressivo
- Considere upgrade de plano

### Erro 400 Bad Request

- Verifique formato dos dados (year, month, day devem ser números)
- Timezone deve ser válido (ex: "America/Sao_Paulo")
- Nation deve ser código ISO de 2 letras ("BR", "US", "GB")

### Mock não funciona

- Certifique-se que o service não tem a key configurada
- Ou force mock removendo temporariamente a key do `.env`

## Próximas Melhorias

1. **Geocoding Automático**

   - Converter `birthLocation` em coordenadas automaticamente
   - Usar OpenCage ou Google Maps API

2. **Cache em Redis**

   - Cachear mapas astrais por 30 dias
   - Cachear trânsitos diários

3. **Background Jobs**

   - Gerar previsões diárias via cron
   - Enviar notificações de trânsitos importantes

4. **Visualização**

   - Renderizar wheel chart com D3.js ou SVG
   - Mostrar aspectos visualmente

5. **Relatórios PDF**
   - Gerar mapa astral completo em PDF
   - Incluir interpretações detalhadas

---

**Documentação oficial**: https://rapidapi.com/myastro/api/astrologer

**Suporte**: Se tiver dúvidas, pergunte!
