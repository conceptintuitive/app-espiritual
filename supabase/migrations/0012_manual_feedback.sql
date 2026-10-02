-- Migração: feedback por seção do manual ("bate muito / em parte / não bate").
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do
-- Supabase.

do $$ begin
  create type feedback_resposta as enum ('bate_muito', 'em_parte', 'nao_bate');
exception when duplicate_object then null;
end $$;

create table if not exists manual_feedback (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references analises(id) on delete cascade,
  secao text not null check (char_length(secao) between 1 and 60),
  resposta feedback_resposta not null,
  created_at timestamptz not null default now()
);

-- Um voto por seção por manual. É isso que impede voto duplicado de verdade;
-- o estado no client (localStorage) é só conveniência de UI.
create unique index if not exists manual_feedback_manual_secao_key
  on manual_feedback (manual_id, secao);

alter table manual_feedback enable row level security;

-- Nenhuma policy criada de propósito. O app não usa Supabase Auth, então não
-- existe auth.uid() pra dizer quem é o "dono" do manual — o dono é quem tem o
-- link /manual/<uuid>. Uma policy de insert pra anon deixaria qualquer um com
-- a anon key (que é pública) inserir direto pela REST. Sem policy, só a
-- service role escreve aqui, via server action registrarFeedback
-- (app/manual/[id]/actions.js), que confere se o manual existe e está pago.
