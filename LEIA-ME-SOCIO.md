# AstroTarot — pacote para desenvolvimento do funil

Projeto **Next.js 15 (App Router) + TypeScript + Tailwind**, com Clerk
(login), Supabase (banco) e Stripe (pagamento). Produção:
https://astrotarot.shop

## Como rodar

```bash
npm install
cp .env.example .env    # preencher com as chaves (ver abaixo)
npm run dev             # http://localhost:3000
```

O funil roda **sem** chaves de Stripe/Supabase — só o checkout e as áreas
logadas precisam delas. Para trabalhar no funil, basta `npm run dev`.

## Onde fica o funil

| O quê | Arquivo |
|---|---|
| **Roteiro do funil** (perguntas, falas, ordem) | `src/lib/quiz-data.ts` → `STEPS` |
| **Telas do funil** (chat, revelação, prova, vídeo) | `src/app/quiz/flow/page.tsx` |
| Entrada do funil | `src/app/quiz/page.tsx` |
| Página da oferta + VSL | `src/app/quiz/vsl/page.tsx` |
| Player da VSL (sem seek) | `src/components/VSLPlayer.tsx` |
| Config da VSL (URL, proporção, curva da barra) | `src/lib/vsl.ts` |
| Mídias do funil | `public/funnel/` |
| Fotos de prova social | `public/social-proof/` |

**Para mudar o roteiro do funil, mexa em `STEPS` (`src/lib/quiz-data.ts`).**
Cada passo tem um `kind` que define a tela:

- `name` — captura o nome em formato de conversa
- `chat` — só a guia falando + botão
- `question` — pergunta com opções (avança sozinha ao tocar)
- `reveal` — revelação do mapa natal
- `proof` — prova social (números + casais)
- `media` — vídeo (opcionalmente com áudio de narração)
- `location` — cidade do encontro (via `/api/geo`)
- `birthdate` / `email` — inputs
- `interstitial` — tela de "analisando" (última, navega para a VSL)

Ritmo da conversa: `MS_PER_CHAR` em `src/app/quiz/flow/page.tsx`
(quanto maior, mais devagar a guia "digita").

## Fluxo completo

```
/quiz  →  /quiz/flow  (15 passos)  →  /quiz/vsl  →  Stripe  →  /quiz/thank-you
```

Na `/quiz/vsl` a oferta fica **travada** até 90s de vídeo assistido
(`VSL_UNLOCK_SECONDS`).

## Chaves (`.env`)

O `.env` real **não vem neste pacote** — contém chaves de produção do
Stripe e do banco. Peça ao Luís as que precisar. Para trabalhar só no
funil, nenhuma é obrigatória.

## Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção (rode antes de entregar)
npm run seo:audit # checagem de SEO (roda contra produção)
```

## Cuidados

- **Não** commitar `.env`.
- O vídeo da VSL (58 MB) fica no Cloudflare R2, fora do repositório.
- `public/funnel/` já tem as mídias otimizadas — se trocar, comprimir
  antes (os originais tinham 20 MB e viraram 159 KB).
- Deploy é automático: push na branch `main` → Vercel.
