-- Migração: leituras de outras pessoas ocultadas da Minha Área.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- leituras_ocultas: chaves de pessoa ("primeironome|AAAA-MM-DD", ver
-- chavePessoa em lib/minhaArea.js) que a dona do perfil escolheu esconder de
-- "Outras leituras neste e-mail" com o botão "ocultar daqui". Só esconde da
-- Minha Área: nenhuma análise é apagada nem muda, e o link direto continua
-- funcionando. Dá pra desfazer em "mostrar ocultas".
--
-- Sem esta coluna, /api/seu-dia/produtos segue funcionando (nada oculto) e
-- /api/seu-dia/produtos/ocultar responde erro — o botão avisa que não deu.

alter table seu_dia_perfis add column if not exists leituras_ocultas text[] not null default '{}';
