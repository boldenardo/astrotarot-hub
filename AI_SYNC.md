# AI_SYNC — Kimi ↔ Claude (dupla de engenharia)

**Propósito:** canal assíncrono entre Kimi Code e Claude Code neste projeto.
Ambos os agentes compartilham este working directory — este arquivo é o canal oficial de troca.

## Protocolo

1. **Antes de editar qualquer arquivo:** rode `git status --short` e leia a seção "Estado atual" abaixo. Se o outro agente marcou um arquivo como 🔒 em edição, não toque nele até o 🔒 sair.
2. **Ao começar uma tarefa:** registre em "Estado atual" com seu nome, timestamp e arquivos que vai tocar.
3. **Ao terminar:** descreva o que fez em "Log", com decisões técnicas e porquês. Remova seus 🔒.
4. **Revisão cruzada:** se discordar de algo do outro agente, NÃO reverta direto. Abra um item em "Discordâncias abertas" com sua hipótese e um teste proposto. Discordância se resolve por teste/build, não por opinião.
5. **Validação obrigatória:** `npm run build` deve passar após cada rodada de mudanças. Anote o resultado no Log.

## Estado atual

| Agente | Tarefa | Arquivos 🔒 | Desde |
|---|---|---|---|
| Kimi | AEO/GEO: structured data + metadata + FAQ + llms.txt + /about | `src/lib/seo.ts`, `src/components/JsonLd.tsx`, `src/lib/faq-data.ts`, `src/components/FaqSection.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/*/layout.tsx`, `src/app/about/`, `public/llms.txt`, `src/app/sitemap.ts` | 2026-08-09 00:30 |

## Contexto da tarefa (AEO + GEO + backlinks)

Plano aprovado pelo usuário (arquivo de plano na sessão Kimi):
- **Kimi implementa:** JSON-LD (Organization, WebSite, WebApplication, FAQPage, BreadcrumbList), metadata por rota pública via `layout.tsx` (todas as pages são `"use client"`), seção FAQ na home, `/about` (E-E-A-T), `public/llms.txt`, sitemap atualizado.
- **Usuário executa:** `reports/CHECKLIST_EXECUCAO.md` (backlinks manuais — Search Console, diretórios, launches).
- Diagnóstico: `robots.ts`/`sitemap.ts` OK; zero JSON-LD; só root layout tem metadata; home sem FAQ.

## Decisões técnicas (Kimi) — abertas a contestação

1. **Sem `aggregateRating` no JSON-LD** — os testimonials da home não são reviews verificáveis; incluir rating violaria diretrizes do Google (risco de manual action). Se Claude discordar, proponha teste.
2. **Sem `SearchAction` no WebSite schema** — o site não tem busca interna; schema inválido seria pior que ausente.
3. **Metadata via `layout.tsx` por rota** (padrão já usado em `/quiz`) em vez de converter pages client→server — conversão quebraria os hooks das páginas interativas.
4. **FAQ estática (sempre no HTML)** em vez de accordion com conteúdo oculto — crawlers/LLMs extraem melhor conteúdo visível no SSR.

## Discordâncias abertas

_(nenhuma)_

## Log

### 2026-08-09 — Kimi
- Diagnóstico completo: ver seção "Contexto da tarefa".
- Criados `src/lib/seo.ts` (geradores JSON-LD) e `src/components/JsonLd.tsx` (renderer seguro para server/client).
- Em andamento: FAQ, metadata por rota, /about, llms.txt, build de validação.
