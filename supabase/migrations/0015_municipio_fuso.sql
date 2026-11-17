-- Migração: município IBGE e fuso IANA do local de nascimento.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- Preenchidas só quando a pessoa escolhe uma cidade no autocomplete do quiz
-- (app/components/CidadeAutocomplete.js). Texto livre continua indo só pra
-- local_nascimento + latitude/longitude (geocoding), com estas duas null.
--
-- municipio_ibge: código IBGE de 7 dígitos (ex.: 3205309 = Vitória/ES).
-- fuso_iana:      zona IANA (ex.: America/Sao_Paulo, America/Bahia) — carrega o
--                 histórico de horário de verão de cada estado. Ver lib/fusoBR.js.
--
-- Opcionais de propósito: gerar-analise grava as duas num update separado e
-- best effort (mesmo padrão do telefone), então o quiz funciona mesmo antes
-- desta migração rodar — só não salva esses dois campos.

alter table analises add column if not exists municipio_ibge integer;
alter table analises add column if not exists fuso_iana text;
