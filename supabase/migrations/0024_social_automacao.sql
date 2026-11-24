-- Migração: postagem automática diária no Instagram e no TikTok (app/api/cron/social).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- social_posts   log + trava: uma linha por (dia, rede, tipo). A linha é criada
--                ANTES de postar, com status 'enviando'; a unique impede que um
--                segundo disparo do cron no mesmo dia poste de novo. Erro fica
--                'erro' (o próximo disparo tenta de novo, até 3 vezes no dia).
-- social_series  em que item de cada série o feed parou (próximo índice).
--                O índice só cresce: item = índice % tamanho da série, então
--                nada repete antes de a série dar a volta.
-- social_tokens  token do Instagram renovado sozinho (o da variável de
--                ambiente vence em 60 dias).
--
-- Sem esta migração o cron NÃO posta nada (sem a trava não dá pra garantir 1
-- post por dia) e manda e-mail avisando. A prévia funciona sem ela.
-- RLS ligado sem policy: só a service role (servidor) lê e escreve.

create table if not exists social_posts (
  id bigint generated always as identity primary key,
  data date not null,                 -- dia em Brasília
  rede text not null check (rede in ('instagram', 'tiktok')),
  tipo text not null check (tipo in ('story', 'feed')),
  tema text,                          -- energia, numero, ponto_cego, anjo, animal, selo, comenta, semana
  serie text,                         -- série consumida (null em sábado/domingo e no story)
  indice integer,                     -- índice absoluto na série
  item text,                          -- ex.: '7', 'Escorpião', 'Vehuiah'
  status text not null default 'enviando' check (status in ('enviando', 'ok', 'erro')),
  post_id text,                       -- id do post no Instagram / publish_id no TikTok
  erro text,
  tentativas integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (data, rede, tipo)
);
create index if not exists social_posts_data_idx on social_posts (data desc);
alter table social_posts enable row level security;

create table if not exists social_series (
  serie text primary key,
  proximo integer not null default 0,
  updated_at timestamptz not null default now()
);
insert into social_series (serie) values ('numero'), ('ponto_cego'), ('anjo'), ('animal'), ('selo')
on conflict (serie) do nothing;
alter table social_series enable row level security;

create table if not exists social_tokens (
  rede text primary key,
  access_token text not null,
  expires_at timestamptz,
  env_hash text,                      -- de qual INSTAGRAM_ACCESS_TOKEN este veio
  renovado_em timestamptz,
  tentou_em timestamptz,
  ultimo_erro text,
  updated_at timestamptz not null default now()
);
alter table social_tokens enable row level security;

-- Pra conferir:  select data, rede, tipo, tema, item, status, post_id, erro from social_posts order by data desc, rede, tipo;
-- Recomeçar uma série do zero:  update social_series set proximo = 0 where serie = 'anjo';
