-- Migração: tabela de mensagens do assistente de IA (chat contextual ao mapa do usuário).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- Guarda o histórico de perguntas/respostas por análise. Serve duas finalidades:
-- 1) dar contexto de conversa pro modelo (últimas mensagens);
-- 2) contar quantas perguntas cada análise já fez, pra aplicar o limite de
--    3 perguntas grátis (prévia) e o teto diário de 30 perguntas (manual pago).

create table if not exists chat_mensagens (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references analises(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_mensagens_analise_id_idx on chat_mensagens(analise_id);
create index if not exists chat_mensagens_analise_id_created_at_idx on chat_mensagens(analise_id, created_at);
