-- Coluna de controle para o order bump "Calendário Espiritual Estendido — 90 dias".
-- Rode este SQL no SQL Editor do Supabase (não é aplicado automaticamente).
alter table public.analises
  add column if not exists bump_calendario_90 boolean not null default false;
