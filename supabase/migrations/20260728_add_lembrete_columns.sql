-- Colunas de controle para o cron de recuperação de carrinho (/api/cron/lembretes).
-- Rode este SQL no SQL Editor do Supabase (não é aplicado automaticamente).
alter table public.analises
  add column if not exists lembrete_1_enviado_em timestamptz,
  add column if not exists lembrete_2_enviado_em timestamptz;
