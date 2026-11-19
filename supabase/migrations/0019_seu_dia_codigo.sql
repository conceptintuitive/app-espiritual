-- Migração: login da Minha Área (/seu-dia) por código de 6 dígitos no e-mail.
-- Rode UMA VEZ no SQL Editor do Supabase. Sem ela, o login continua
-- funcionando pelo link do e-mail (o código só não é aceito).
--
-- Guarda só o HMAC do código (nunca o código), quando vence e quantas
-- tentativas erradas já houve (5 erradas = precisa pedir outro).

alter table seu_dia_perfis add column if not exists codigo_hash text;
alter table seu_dia_perfis add column if not exists codigo_expira timestamptz;
alter table seu_dia_perfis add column if not exists codigo_tentativas smallint not null default 0;

notify pgrst, 'reload schema';
