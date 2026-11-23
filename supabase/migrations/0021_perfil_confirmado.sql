-- Migração: "Esta é você?" da Minha Área.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- perfil_confirmado_em: quando a dona do e-mail confirmou (ou corrigiu) os dados
-- de nascimento do perfil. Null = ainda não confirmou: depois do login, a Minha
-- Área mostra a tela "Esta é você?" com nome, data, hora e cidade.
-- Salvar os dados na tela de dados também conta como confirmado.
--
-- Sem esta coluna tudo continua funcionando: a confirmação fica guardada só no
-- aparelho (localStorage), então a tela pode voltar em outro aparelho.

alter table seu_dia_perfis add column if not exists perfil_confirmado_em timestamptz;
