-- Migração: assinatura "Intuitive Completo".
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- Uma linha por compra de assinatura. O acesso é por E-MAIL: a pessoa é
-- assinante se alguma linha dela tem acesso_ate no futuro.
--   metodo 'recorrente' = cartão, assinatura do Mercado Pago que renova sozinha
--   metodo 'prepago'    = Pix (ou cartão à vista) por um período; renova com
--                         um pagamento novo (lembrete por e-mail antes de vencer)
-- RLS ligado sem policy: só a service role (rotas /api/assinatura/*) acessa.

create table if not exists assinaturas (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  plano text not null check (plano in ('mensal', 'anual')),
  metodo text not null check (metodo in ('recorrente', 'prepago')),
  status text not null default 'pendente' check (status in ('pendente', 'ativa', 'cancelada', 'expirada')),
  acesso_ate timestamptz,
  mp_preapproval_id text unique,
  ultimo_mp_payment_id text,
  valor numeric,
  origem text,
  lembrete_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists assinaturas_email_idx on assinaturas (email);
create index if not exists assinaturas_acesso_idx on assinaturas (acesso_ate);

-- Um registro por pagamento aprovado já processado: torna o webhook e a
-- confirmação síncrona idempotentes (o mesmo pagamento não estende 2 vezes).
create table if not exists assinatura_pagamentos (
  mp_payment_id text primary key,
  assinatura_id uuid not null references assinaturas(id) on delete cascade,
  valor numeric,
  criado_em timestamptz not null default now()
);

alter table assinaturas enable row level security;
alter table assinatura_pagamentos enable row level security;

-- Painel rápido:  select * from assinatura_metricas;
create or replace view assinatura_metricas as
select
  (select count(distinct email) from assinaturas where acesso_ate > now()) as assinantes_ativos,
  (select count(distinct email) from assinaturas where acesso_ate > now() and plano = 'anual') as anuais,
  (select count(distinct email) from assinaturas where acesso_ate > now() and plano = 'mensal') as mensais,
  (select count(*) from assinaturas where acesso_ate > now() and metodo = 'recorrente' and status = 'ativa') as cartao_renovando,
  (select count(*) from assinaturas where status = 'cancelada' and acesso_ate > now()) as cancelados_ainda_com_acesso,
  (select coalesce(sum(valor), 0) from assinatura_pagamentos where criado_em >= date_trunc('month', now())) as receita_mes;
revoke all on assinatura_metricas from anon, authenticated;

notify pgrst, 'reload schema';
