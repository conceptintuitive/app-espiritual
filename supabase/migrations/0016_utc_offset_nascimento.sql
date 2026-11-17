-- Migração: offset UTC (em horas) do nascimento, usado nos cálculos com hora.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase,
-- ANTES do deploy do código que grava esta coluna.
--
-- utc_offset_nascimento: offset real da época e do lugar (fuso IANA com o
-- horário de verão histórico de cada estado), ex.: -3, -2 (verão), -4 (AM),
-- -5 (AC). Gravado por gerar-analise só em análises NOVAS com hora informada.
--
-- Por que gravar: Human Design e Compatibilidade Completa são recalculados a
-- cada visita a partir de data/hora. Com o offset salvo, análises novas usam o
-- fuso real; registros antigos ficam com esta coluna NULL e continuam no
-- cálculo legado (planetas sem conversão de fuso, Human Design em -3) — o que
-- a pessoa já recebeu não muda. Não há backfill de propósito.

alter table analises add column if not exists utc_offset_nascimento numeric(4, 2);
