-- Migração 0034: contador anônimo das etapas do quiz.
-- Rode UMA VEZ inteiro no SQL Editor do Supabase; pode rodar de novo sem
-- problema. Sem ela o site funciona igual: só não conta (e a prévia avisa).
--
-- quiz_etapas: uma linha por sessão e por etapa alcançada
--   0 = viu a home · 1 = abriu o quiz (etapa 1) · 2, 3 = etapas 2 e 3 ·
--   4 = etapa 4 (nome e e-mail) · 5 = concluiu (análise criada)
-- `sessao` é um id aleatório gerado no navegador, 1 por aba (não é cookie,
-- não é id do aparelho e não se liga a nada da pessoa); com o unique, cada
-- sessão conta 1x por etapa. `origem` = de onde veio a visita, pelo rótulo
-- da campanha guardado no aparelho (instagram, tiktok, meta, google, outro,
-- direto). Sem IP, sem e-mail, sem nada que identifique.

create table if not exists quiz_etapas (
  id bigint generated always as identity primary key,
  dia date not null,                  -- dia em Brasília
  sessao text not null,
  etapa smallint not null check (etapa between 0 and 5),
  origem text not null default 'direto' check (origem in ('instagram', 'tiktok', 'meta', 'google', 'outro', 'direto')),
  criado_em timestamptz not null default now(),
  unique (sessao, etapa)
);
create index if not exists quiz_etapas_dia_idx on quiz_etapas (dia desc);
alter table quiz_etapas enable row level security;

-- Resumo por dia, origem e etapa (o que a prévia lê).
create or replace view quiz_etapas_resumo with (security_invoker = true) as
  select dia, origem, etapa, count(*)::int as sessoes
  from quiz_etapas
  group by dia, origem, etapa;
revoke all on quiz_etapas_resumo from anon, authenticated;

-- Pra conferir:
--   select origem, etapa, sum(sessoes) from quiz_etapas_resumo where dia >= current_date - 13 group by 1, 2 order by 1, 2;
