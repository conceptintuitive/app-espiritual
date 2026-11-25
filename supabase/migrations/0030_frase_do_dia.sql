-- Migração 0030: "Frase do dia" + formato de cada Reels (pros insights).
-- Rode este script UMA VEZ inteiro no SQL Editor do Supabase, ANTES de ligar
-- SOCIAL_FRASE_DO_DIA=on. Depende da 0025 (social_posts com 'reels') e da 0029
-- (social_reels_interativos). Pode rodar de novo sem problema.
--
-- 1. social_posts.tipo ganha 'story_frase': o Story da frase das 21h tem trava
--    própria (1 por dia), separada do Story da energia da manhã.
-- 2. social_posts.formato: como o Reels saiu (card, narrado, carta, pausa,
--    numero, frase). Serve pra prévia comparar o desempenho por dia da semana
--    e por formato. Opcional: sem ela o Reels sai igual, só sem o rótulo.
-- 3. social_reels_interativos.formato ganha 'frase' (o Reel narrado da sexta).

alter table social_posts drop constraint if exists social_posts_tipo_check;
alter table social_posts add constraint social_posts_tipo_check check (tipo in ('story', 'feed', 'reels', 'story_frase'));

alter table social_posts add column if not exists formato text;

alter table social_reels_interativos drop constraint if exists social_reels_interativos_formato_check;
alter table social_reels_interativos add constraint social_reels_interativos_formato_check check (formato in ('carta', 'pausa', 'numero', 'frase'));
