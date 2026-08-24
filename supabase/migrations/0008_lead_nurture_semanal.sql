-- Migração: nutrição semanal personalizada pra quem fez a prévia grátis mas
-- não comprou o manual, + descadastro (obrigatório em qualquer email de
-- marketing). Rode este script UMA VEZ inteiro, de cima a baixo, no SQL
-- Editor do Supabase.

alter table analises add column if not exists unsubscribed boolean default false;
alter table analises add column if not exists lead_ultima_semana_email text;
