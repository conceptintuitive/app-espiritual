-- Migração: lock de pós-pagamento do Manual.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- processado_em: timestamp de quando o pós-pagamento (e-mail de acesso) foi
-- disparado. O Manual pode ser liberado por dois caminhos diferentes quase
-- ao mesmo tempo — o webhook do MP e /api/confirmar-pagamento-mp (consulta
-- síncrona feita quando a pessoa chega do redirect do MP antes do webhook).
-- Os dois tentam gravar processado_em; só quem conseguir gravar primeiro
-- (coluna ainda NULL) dispara o e-mail de acesso — o outro vê 0 linhas
-- afetadas no UPDATE condicional e pula, evitando e-mail duplicado.
-- Ver lib/mpPagamentoManual.js (dispararPosPagamentoManual).

alter table analises add column if not exists processado_em timestamptz;
