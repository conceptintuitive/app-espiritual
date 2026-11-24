-- Migração 0027: conversão do /resultado (nov/2026).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do
-- Supabase. Tudo é opcional pro site: sem ela, cada parte nova se desliga
-- sozinha (o resto continua igual).
--
-- 1. manual_avaliacoes: a avaliação do e-mail de 3 dias depois da compra
--    ("O Manual bate com você?", 1 clique + 1 frase opcional + autorização pra
--    publicar). NÃO guarda nome nem signo: na hora de mostrar o depoimento,
--    o site lê o primeiro nome e o signo da própria análise, e só se
--    autoriza_publicar = true. `oculto` = true esconde um depoimento do site
--    (é só mudar no Table Editor).
-- 2. analises.avaliacao_email_em: quando o e-mail de avaliação saiu (1 por
--    análise; trava atômica do cron).
-- 3. seu_dia_perfis.cadastro_quiz_em: a pessoa marcou "Quero receber meu dia
--    às 7h por e-mail" no quiz. Junto com verificado_em, libera o e-mail das 7h.

create table if not exists manual_avaliacoes (
  analise_id uuid primary key references analises(id) on delete cascade,
  resposta feedback_resposta not null,             -- tipo da migração 0012
  frase text check (frase is null or char_length(frase) <= 400),
  autoriza_publicar boolean not null default false,
  oculto boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Sem policy de propósito: só a service role lê e escreve (rotas do servidor).
alter table manual_avaliacoes enable row level security;

alter table analises add column if not exists avaliacao_email_em timestamptz;

alter table seu_dia_perfis add column if not exists cadastro_quiz_em timestamptz;
