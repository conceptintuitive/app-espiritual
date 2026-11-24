-- Migração: bucket do Reels diário feito no GitHub Actions (scripts/reels).
-- Rode este script UMA VEZ, no SQL Editor do Supabase (depois da 0025).
--
-- reels   bucket PÚBLICO (o Instagram baixa o vídeo pela URL pública), só
--         MP4, até 50 MB por arquivo. Quem grava é o workflow do GitHub, com
--         uma URL de upload assinada que o site gera na hora (o GitHub não tem
--         chave do Supabase). Vídeos com mais de 7 dias são apagados sozinhos
--         (o Instagram já guardou a cópia dele).
-- Nome diferente? Crie com outro id e ponha em SOCIAL_REELS_BUCKET.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reels', 'reels', true, 52428800, array['video/mp4'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Pra conferir:  select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'reels';
