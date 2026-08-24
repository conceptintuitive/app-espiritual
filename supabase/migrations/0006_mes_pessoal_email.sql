-- Migração: reengajamento mensal por email pra quem já comprou a Projeção de
-- 12 Meses — "seu Mês Pessoal de [mês] chegou", uma vez por mês, reaproveitando
-- o mesmo cron externo que já dispara /api/cron/lembretes.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.

alter table analises add column if not exists tier2_ultimo_email_mes text;
