-- Migração: histórico de publicações feitas via TikTok Content Posting API
-- (rota /api/tiktok/publish, chamada pelo Make depois que o Creatomate
-- gera o vídeo). Guarda o publish_id devolvido pelo TikTok e o último
-- status consultado. Rode este script UMA VEZ inteiro, de cima a baixo,
-- no SQL Editor do Supabase.

create table if not exists tiktok_publishes (
  id uuid primary key default gen_random_uuid(),
  publish_id text not null,
  video_url text not null,
  caption text,
  status text,
  status_detail jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tiktok_publishes_publish_id_key on tiktok_publishes (publish_id);

alter table tiktok_publishes enable row level security;

-- Nenhuma policy criada de propósito: com RLS ativado e zero policy, só a
-- service role key (usada em app/api/tiktok/publish) consegue ler ou
-- escrever nessa tabela.
