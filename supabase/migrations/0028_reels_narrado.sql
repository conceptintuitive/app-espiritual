-- Migração 0028: Reels NARRADO (30–40s, ElevenLabs). Rode este script UMA VEZ
-- inteiro no SQL Editor do Supabase, ANTES de ligar SOCIAL_REELS_NARRADO=on.
-- Sem ela, o modo narrado não liga (cai sempre no card de 9s, com aviso por
-- e-mail), e nada mais muda.
--
-- 1. social_reels_narrados: o roteiro do dia (escrito e revisado pela IA) e a
--    narração (caminho do MP3 no bucket "reels", tempo de cada palavra pra
--    legenda e duração). Refazer o roteiro apaga a narração (ela é refeita).
-- 2. social_narracao_uso: cada narração feita, com os caracteres gastos no
--    ElevenLabs. A soma do mês é a trava de custo (ELEVENLABS_LIMITE_MES,
--    padrão 25000): passou, o Reels sai no card de 9s.
-- 3. O bucket "reels" (migração 0026) passa a aceitar MP3 (a narração).

create table if not exists social_reels_narrados (
  data date primary key,                 -- dia em Brasília
  tema text,
  roteiro jsonb not null,                -- ganchos, gancho, porque, virada, pratica, fechamento, legenda
  fonte text not null,                   -- ia | ia-revisada
  revisao jsonb,                         -- o que a revisão e a checagem disseram
  texto text not null,                   -- o texto falado (o que vai pro ElevenLabs)
  audio_caminho text,                    -- MP3 no bucket reels
  palavras jsonb,                        -- [{ texto, ini, fim }] em segundos
  duracao numeric,                       -- segundos de fala
  gerado_em timestamptz not null default now(),
  narrado_em timestamptz
);

alter table social_reels_narrados enable row level security;

create table if not exists social_narracao_uso (
  id bigint generated always as identity primary key,
  mes text not null check (mes ~ '^\d{4}-\d{2}$'),   -- 'AAAA-MM' em Brasília
  data date,
  caracteres integer not null check (caracteres >= 0),
  criado_em timestamptz not null default now()
);

create index if not exists social_narracao_uso_mes_idx on social_narracao_uso (mes);

alter table social_narracao_uso enable row level security;

update storage.buckets
  set allowed_mime_types = array['video/mp4', 'audio/mpeg']
  where id = 'reels';
