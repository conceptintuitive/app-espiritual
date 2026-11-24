-- Migração: conteúdo escrito pela IA, carrossel, Reels e resposta automática
-- a comentários da automação social. Rode este script UMA VEZ inteiro, de
-- cima a baixo, no SQL Editor do Supabase (depois da 0024).
--
-- social_conteudos   o post de cada dia, pronto: carrossel, legenda, story,
--                    Reels (JSON), de onde veio (ia | ia-revisada | reserva),
--                    a revisão da IA e a aprovação do TikTok (Direct Post).
--                    O cron de domingo (/api/cron/social-semana) preenche a
--                    semana seguinte; o cron das 7h só lê.
-- social_posts       ganha o tipo 'reels', o status 'aguardando' (Reels
--                    renderizando / processando) e as colunas etapa e
--                    externo_id (id do render no Creatomate ou do container
--                    no Instagram).
-- social_respostas   SÓ o id de cada comentário já respondido (nunca a data,
--                    o texto nem o usuário), pra nunca responder 2 vezes.
-- social_alertas     data do último e-mail de erro por assunto (no máximo 1
--                    por dia vindo do cron da hora).
--
-- RLS ligado sem policy: só a service role (servidor) lê e escreve.

create table if not exists social_conteudos (
  data date primary key,              -- dia em Brasília
  tema text not null,                 -- numero, ponto_cego, mente, compat, pensador, comenta, semana
  serie text,
  indice integer,
  item text,
  conteudo jsonb not null,            -- { telas, legenda, story, reels, dias }
  fonte text not null default 'reserva', -- ia | ia-revisada | reserva
  revisao jsonb,                      -- o que a revisão e a checagem automática disseram
  versao text,                        -- muda quando o texto muda (cache das artes)
  gerado_em timestamptz not null default now(),
  tiktok_aprovacao jsonb              -- { aprovado, privacy_level, disable_comment, … } da tela /admin/tiktok
);
alter table social_conteudos enable row level security;

alter table social_posts drop constraint if exists social_posts_tipo_check;
alter table social_posts add constraint social_posts_tipo_check check (tipo in ('story', 'feed', 'reels'));
alter table social_posts drop constraint if exists social_posts_status_check;
alter table social_posts add constraint social_posts_status_check check (status in ('enviando', 'aguardando', 'ok', 'erro'));
alter table social_posts add column if not exists etapa text;       -- reels: render | container | publicado
alter table social_posts add column if not exists externo_id text;  -- reels: id do render / do container

insert into social_series (serie) values ('mente'), ('compat'), ('pensador')
on conflict (serie) do nothing;

create table if not exists social_respostas (
  comentario_id text primary key,
  modelo smallint,
  respondido_em timestamptz not null default now()
);
alter table social_respostas enable row level security;

create table if not exists social_alertas (
  chave text primary key,
  ultimo date
);
alter table social_alertas enable row level security;

-- Pra conferir a semana gerada:
--   select data, tema, item, fonte, revisao from social_conteudos order by data desc;
-- Regerar um dia: apague a linha (delete from social_conteudos where data = '2026-12-07')
-- e chame /api/cron/social-semana?secret=…&inicio=2026-12-07&dias=1
