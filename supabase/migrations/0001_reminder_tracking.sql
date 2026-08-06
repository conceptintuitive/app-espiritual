-- Migração: rastreio de lembretes de recuperação para quem preencheu o formulário e não comprou.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- Por quê o passo 2 existe: ADD COLUMN ... DEFAULT now() preenche created_at = now()
-- em TODAS as linhas já existentes. Sem o passo 2, todo mundo que já preencheu o
-- formulário no passado pareceria ter sido criado "agora" — e o cron de lembretes
-- (que dispara para quem tem ~1h ou ~24h de idade) mandaria e-mail pra base toda de
-- uma vez só. O passo 2 empurra os registros antigos pra um passado distante,
-- fora da janela do cron, imediatamente após o passo 1. Só as análises criadas
-- DEPOIS desta migração terão created_at correto desde o início.

-- 1) Coluna de criação (se ainda não existir)
alter table analises add column if not exists created_at timestamptz default now();

-- 2) Empurra os registros já existentes para fora da janela do cron (rodar logo após o passo 1)
update analises
set created_at = now() - interval '999 days'
where created_at > now() - interval '1 minute';

-- 3) Colunas de controle de envio (evita reenviar o mesmo lembrete)
alter table analises add column if not exists reminder_1h_sent_at timestamptz;
alter table analises add column if not exists reminder_24h_sent_at timestamptz;
