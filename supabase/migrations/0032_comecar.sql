-- Migração 0032: formato declarado na página do link da bio (/comecar).
-- Depende da 0031 (social_visitas). Rode UMA VEZ no SQL Editor do Supabase;
-- pode rodar de novo sem problema. Sem ela, a visita conta igual (como "bio")
-- e o toque num post só não troca a visita de linha no funil.
--
-- social_visitas.sessao: id aleatório gerado no navegador, 1 por aba (não é
-- cookie nem id do aparelho e não se liga a nada da pessoa). Quando ela toca
-- num post do /comecar, a visita "bio" desta sessão passa pro formato tocado.

alter table social_visitas add column if not exists sessao text;
create index if not exists social_visitas_sessao_idx on social_visitas (sessao) where sessao is not null;
