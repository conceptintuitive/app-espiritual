-- Migração: tabela pra guardar o access_token/refresh_token do OAuth do
-- TikTok Login Kit (rotas /api/tiktok/connect e /api/tiktok/callback).
-- Só o servidor lê essa tabela, com a service role key — sem policy de
-- select/insert pra anon, os tokens não ficam legíveis publicamente.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do
-- Supabase.

create table if not exists tiktok_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  open_id text not null,
  access_token text not null,
  refresh_token text not null,
  scope text,
  token_type text,
  expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tiktok_oauth_tokens_open_id_key on tiktok_oauth_tokens (open_id);

alter table tiktok_oauth_tokens enable row level security;

-- Nenhuma policy criada de propósito: com RLS ativado e zero policy, só a
-- service role key (usada nas rotas /api/tiktok/* e no cron de renovação)
-- consegue ler ou escrever nessa tabela — nem a anon key vê essas linhas.
