-- Migração: fluxo de presente — quem compra pode enviar o manual pronto pro
-- email de outra pessoa (o mapa continua sendo sobre os dados de nascimento
-- já preenchidos no formulário; só a entrega do acesso muda de destinatário).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.

alter table analises add column if not exists presente_email text;
alter table analises add column if not exists presente_de text;
