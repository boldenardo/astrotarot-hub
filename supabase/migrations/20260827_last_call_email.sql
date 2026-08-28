-- Segunda (e última) mensagem de recuperação, três dias depois da primeira.
--
-- Sem esta coluna o cron não tem como saber quem já recebeu a leva 2, e o
-- mesmo e-mail sairia todo dia. O código trata a ausência dela como "leva 2
-- desligada" (a leva 1 continua rodando normalmente), então aplicar isto é
-- o que LIGA a sequência — nada quebra enquanto não for aplicado.

alter table public.leads
  add column if not exists last_call_email_sent_at timestamptz;

-- A consulta do cron filtra por converted_at/unsubscribed_at/last_call e
-- ordena por recovery_email_sent_at. Índice parcial: só as linhas que ainda
-- podem receber a leva 2 entram nele.
create index if not exists leads_last_call_pending_idx
  on public.leads (recovery_email_sent_at)
  where last_call_email_sent_at is null
    and converted_at is null
    and unsubscribed_at is null;
