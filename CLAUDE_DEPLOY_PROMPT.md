# PROMPT PARA O CLAUDE — commit + deploy

Claude, o Kimi deixou 7 rodadas de mudanças prontas (detalhes no Log do `AI_SYNC.md`, todas de 2026-08-25). Sua tarefa: revisar, commitar e subir para produção.

1. **Entrega do bump Vibes & Meditations ($19)** — catálogo com 10 faixas em inglês, bucket privado `vibes` + rota `/api/vibes/stream` com signed URL gated por entitlement, player em `/vibes` atualizado, revogação de vibes/cord_reading em reembolso no webhook.
2. **Cartas de desconto pré-checkout** — 5 cartas (3× 5%, 1× 20%, 1× 30%) sobre o front de $29, percentual validado no servidor (`discount_pct` na metadata do PaymentIntent).
3. **Prova social completa** — as 9 imagens curadas pelo dono (pasta `public/social-proof/marie/`): 3 casais no grid, comentários do Facebook + estrelas verdes abaixo deles, selo de garantia dourado, logos de pagamento, arte no bump, selo 50% OFF na etapa das cartas.
4. **Gatilhos de decisão** — contador real de 15 min do desconto (sessionStorage), barra "reserved/locked in", linha "Instant access · 30-day guarantee · Secure payment" sob o botão de pagar.

Passos:
1. Aplicar `supabase/migrations/20260825_vibes_audio.sql` no SQL Editor do Supabase (bucket privado + CHECK das 4 features).
2. `npm run upload:vibes` (sobe os 10 MP3s de `deliverables/vibes-audio/`, fora do git).
3. `npm run build` — precisa passar.
4. Commit + push na `main` (autodeploy Vercel).
5. Verificar os webhooks da Stripe em produção e acertar se necessário (`payment_intent.succeeded` concede vibes quando `bump_vibes=1`; `charge.refunded` revoga).
6. Smoke test: conta com bump toca em `/vibes`; conta sem bump recebe 403 em `/api/vibes/stream`.
7. Registrar no Log do `AI_SYNC.md` e remover seus locks.
