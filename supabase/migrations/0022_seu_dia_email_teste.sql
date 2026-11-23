-- Migração: e-mail diário às 7h do Seu Dia + e-mails do fim do teste + métricas do teste.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- email_diario          a pessoa quer receber o dia às 7h (checkbox marcado no
--                       cadastro; o descadastro grava false e corta TODOS os
--                       e-mails do Seu Dia, inclusive os do fim do teste).
-- email_diario_ultimo   dia (Brasília) do último envio: garante 1 e-mail por
--                       dia mesmo se o cron rodar 2 vezes.
-- email_teste_d5_em /   quando saíram os e-mails do dia 5 e do dia 7 do teste
-- email_teste_d7_em     (1x cada).
--
-- Sem esta migração, o cron /api/cron/seu-dia-email responde erro e não envia
-- nada; o resto da Minha Área funciona igual.

alter table seu_dia_perfis add column if not exists email_diario boolean not null default true;
alter table seu_dia_perfis add column if not exists email_diario_ultimo date;
alter table seu_dia_perfis add column if not exists email_teste_d5_em timestamptz;
alter table seu_dia_perfis add column if not exists email_teste_d7_em timestamptz;

-- ── Métricas do teste de 7 dias ─────────────────────────────────────────────
-- Uma linha por pessoa que começou o teste:
--   dias_abertos_no_teste  dias distintos em que abriu o Seu Dia do dia 1 ao 7
--   assinou_ate_d10        assinatura paga (qualquer status que não 'pendente')
--                          criada até o fim do 10º dia
--   manual_pago            tem Manual pago no mesmo e-mail (não conta como assinatura)
-- Abrir:  select * from seu_dia_teste_metricas order by teste_inicio desc;
create or replace view seu_dia_teste_metricas as
select
  p.email,
  p.teste_inicio,
  (p.teste_inicio at time zone 'America/Sao_Paulo')::date as dia1,
  (select count(distinct v.dia) from seu_dia_visitas v
     where v.email = p.email
       and v.dia between (p.teste_inicio at time zone 'America/Sao_Paulo')::date
                     and (p.teste_inicio at time zone 'America/Sao_Paulo')::date + 6) as dias_abertos_no_teste,
  exists (select 1 from assinaturas a
     where lower(a.email) = lower(p.email)
       and a.status <> 'pendente'
       and a.criado_em < ((p.teste_inicio at time zone 'America/Sao_Paulo')::date + 10)::timestamp at time zone 'America/Sao_Paulo') as assinou_ate_d10,
  exists (select 1 from analises an
     where lower(an.email) = lower(p.email) and an.payment_status = 'paid') as manual_pago,
  p.email_diario
from seu_dia_perfis p
where p.teste_inicio is not null;

-- Resumo por semana de início (coorte). Só conta coortes que já passaram do dia 10.
-- Abrir:  select * from seu_dia_teste_resumo;
create or replace view seu_dia_teste_resumo as
select
  date_trunc('week', dia1)::date as semana,
  count(*) as comecaram,
  round(avg(dias_abertos_no_teste), 1) as media_dias_abertos,
  count(*) filter (where dias_abertos_no_teste >= 4) as abriram_4_ou_mais,
  count(*) filter (where assinou_ate_d10) as assinaram_ate_d10,
  round(100.0 * count(*) filter (where assinou_ate_d10) / nullif(count(*), 0), 1) as pct_assinou_ate_d10
from seu_dia_teste_metricas
where dia1 + 10 <= (now() at time zone 'America/Sao_Paulo')::date
group by 1
order by 1 desc;

-- As views têm e-mail: só a service role (SQL Editor) lê.
revoke all on seu_dia_teste_metricas from anon, authenticated;
revoke all on seu_dia_teste_resumo from anon, authenticated;
