-- Migração: captura de lead parcial na Etapa 4 do quiz (campo de e-mail,
-- onBlur) — guarda quem chegou a digitar o e-mail mas não concluiu a
-- submissão, pra permitir remarketing futuro (o gatilho de e-mail em si
-- ainda não existe, só a captura). Rode este script UMA VEZ inteiro, de
-- cima a baixo, no SQL Editor do Supabase.

create table if not exists leads_parciais (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leads_parciais_email_key on leads_parciais (email);

alter table leads_parciais enable row level security;

-- A tabela `analises` já aceita insert com a anon key (chave também exposta
-- no browser via NEXT_PUBLIC_*, então o nível de confiança é o mesmo) —
-- replicando aqui pra permitir o upsert vindo de /api/lead-parcial. Sem
-- policy de select pra anon: os leads capturados não ficam legíveis
-- publicamente, só por quem acessa com a service role key.
create policy "leads_parciais_insert_anon" on leads_parciais
  for insert to anon
  with check (true);

create policy "leads_parciais_update_anon" on leads_parciais
  for update to anon
  using (true)
  with check (true);
