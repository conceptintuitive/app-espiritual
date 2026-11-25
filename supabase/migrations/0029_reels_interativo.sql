-- Migração 0029: Reels INTERATIVO ("Escolhe uma carta", "Pausa o vídeo",
-- "Ache seu número"). Rode este script UMA VEZ inteiro no SQL Editor do
-- Supabase, ANTES de ligar SOCIAL_REELS_INTERATIVO=on. Depende da 0028
-- (narração, conta de caracteres e MP3 no bucket "reels").
-- Sem ela, o interativo não liga: o dia cai no narrado e depois no card de 9s.
--
-- social_reels_interativos: o roteiro do dia (montado das tabelas do site, sem
-- IA), os áudios de cada trecho, a linha do tempo (quando cada carta vira,
-- quando o contador roda, quando cada número acende) e `publicado_em`, que diz
-- que o Reels saiu no Instagram como interativo: só nesses o bot de
-- comentários responde "1/2/3" (carta) e "1–9" (número).

create table if not exists social_reels_interativos (
  data date primary key,                 -- dia em Brasília
  formato text not null check (formato in ('carta', 'pausa', 'numero')),
  roteiro jsonb not null,                -- segmentos + cena (cartas, práticas, números)
  texto text not null,                   -- tudo o que a voz fala
  segmentos jsonb,                       -- [{ id, audio_caminho, duracao }]
  linha jsonb,                           -- duracao, vozes, palavras, marcas, eventos
  gerado_em timestamptz not null default now(),
  narrado_em timestamptz,
  publicado_em timestamptz
);

alter table social_reels_interativos enable row level security;
