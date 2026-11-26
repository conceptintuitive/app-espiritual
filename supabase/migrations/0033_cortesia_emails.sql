-- 0033 — e-mails do fim da cortesia de 30 dias do Manual (nov/2026).
-- Trava de cada e-mail por análise (lib/cortesiaEmail.js, cron de lembretes):
--   cortesia_d25_em: "seus 30 dias acabam em 5 dias"
--   cortesia_d30_em: "seus 30 dias terminaram"
-- Opcional: sem ela, o lote do cron não faz nada.

alter table public.analises add column if not exists cortesia_d25_em timestamptz;
alter table public.analises add column if not exists cortesia_d30_em timestamptz;

-- O cron procura Manuais pagos há 25 a 33 dias.
create index if not exists analises_paid_at_pago_idx on public.analises (paid_at) where payment_status = 'paid';
