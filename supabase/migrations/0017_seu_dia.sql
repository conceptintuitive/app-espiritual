-- Migração: Seu Dia (/seu-dia) — fase 1 (grátis + teste de 7 dias + lista de espera).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- Sem Supabase Auth: o login é um link assinado no e-mail (lib/seuDiaServidor.js)
-- e quem lê/escreve aqui é só a service role, pelas rotas /api/seu-dia/*.
-- Por isso RLS ligado e NENHUMA policy (anon não lê nem escreve nada).

create table if not exists seu_dia_perfis (
  email text primary key check (char_length(email) between 3 and 254),
  nome text check (nome is null or char_length(nome) <= 60),
  data_nascimento date,
  hora_nascimento text check (hora_nascimento is null or hora_nascimento ~ '^\d{2}:\d{2}$'),
  cidade_nome text,
  cidade_uf text,
  municipio_ibge integer,
  latitude double precision,
  longitude double precision,
  fuso_iana text,
  criado_em timestamptz not null default now(),
  link_enviado_em timestamptz,
  verificado_em timestamptz,
  -- Início dos 7 dias de Seu Dia Completo (gravado quando a pessoa salva os dados).
  teste_inicio timestamptz,
  ultimo_acesso timestamptz,
  -- Fase 1 sem cobrança: o botão "Desbloquear" grava o interesse aqui.
  lista_espera_em timestamptz,
  lista_espera_plano text check (lista_espera_plano is null or lista_espera_plano in ('anual', 'mensal'))
);

-- Um registro por pessoa por dia em que abriu o Seu Dia (dia no fuso dela).
-- É a base da métrica de retorno.
create table if not exists seu_dia_visitas (
  email text not null references seu_dia_perfis(email) on delete cascade,
  dia date not null,
  primary key (email, dia)
);

-- Inscrições de Web Push (aviso das 7h). Uma pessoa pode ter vários aparelhos.
create table if not exists seu_dia_push (
  endpoint text primary key,
  email text not null references seu_dia_perfis(email) on delete cascade,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);
create index if not exists seu_dia_push_email_idx on seu_dia_push (email);

alter table seu_dia_perfis enable row level security;
alter table seu_dia_visitas enable row level security;
alter table seu_dia_push enable row level security;

-- Métricas da fase 1, pra abrir no SQL Editor:  select * from seu_dia_metricas;
-- "voltaram_em_7d" = entre quem abriu pela 1ª vez há 7+ dias, quantos voltaram
-- em algum dia do 1º ao 7º depois. Meta pra ligar a cobrança: ~20%.
create or replace view seu_dia_metricas as
with primeira as (
  select email, min(dia) as d0 from seu_dia_visitas group by email
)
select
  (select count(*) from seu_dia_perfis where data_nascimento is not null) as pessoas_com_mapa,
  (select count(*) from primeira where d0 <= current_date - 7) as coorte_7d,
  (select count(*) from primeira p
     where p.d0 <= current_date - 7
       and exists (select 1 from seu_dia_visitas v where v.email = p.email and v.dia between p.d0 + 1 and p.d0 + 7)
  ) as voltaram_em_7d,
  (select count(*) from seu_dia_visitas where dia >= current_date - 6) as visitas_ultimos_7d,
  (select count(distinct email) from seu_dia_visitas where dia = current_date) as pessoas_hoje,
  (select count(*) from seu_dia_perfis where lista_espera_em is not null) as lista_espera,
  (select count(*) from seu_dia_perfis where lista_espera_plano = 'anual') as lista_espera_anual,
  (select count(*) from seu_dia_perfis where lista_espera_plano = 'mensal') as lista_espera_mensal,
  (select count(distinct email) from seu_dia_push) as pessoas_com_aviso;

-- A view roda com permissão do dono; por isso ninguém além da service role
-- (e do SQL Editor) pode lê-la pela API.
revoke all on seu_dia_metricas from anon, authenticated;
