-- Migração 0031: atribuição das redes sociais por formato.
-- Rode UMA VEZ inteiro no SQL Editor do Supabase. Pode rodar de novo sem
-- problema. Sem ela o site funciona igual: o contador de visitas e a UTM no
-- perfil só não gravam, e o funil da prévia avisa.
--
-- 1. social_visitas: uma linha por visita que chegou das redes (link da bio
--    /ig e /tt, ou qualquer link com utm_source=instagram|tiktok). Só o dia e
--    os rótulos da campanha: nada que identifique a pessoa (sem IP, sem
--    e-mail, sem id do aparelho). Contada pelo navegador, 1x por sessão.
-- 2. seu_dia_perfis.atribuicao: a UTM da chegada (utm_source, utm_medium,
--    utm_campaign, utm_content, dia do clique), gravada uma vez só, quando a
--    pessoa cria a conta do Seu Dia ou começa o teste grátis.

create table if not exists social_visitas (
  id bigint generated always as identity primary key,
  dia date not null,                  -- dia em Brasília
  source text not null check (source in ('instagram', 'tiktok')),
  medium text,                        -- bio | reel | story | feed | comentario
  campaign text,                      -- interativo | narrado | frase | carrossel | card | dia
  content text,                       -- carta | pausa | numero
  criado_em timestamptz not null default now()
);
create index if not exists social_visitas_dia_idx on social_visitas (dia desc);
alter table social_visitas enable row level security;

alter table seu_dia_perfis add column if not exists atribuicao jsonb;

-- Pra conferir:
--   select dia, source, medium, campaign, content, count(*) from social_visitas group by 1,2,3,4,5 order by 1 desc;
--   select atribuicao->>'utm_source', atribuicao->>'utm_medium', count(*) from seu_dia_perfis where atribuicao is not null group by 1,2;
