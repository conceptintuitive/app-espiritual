-- Migração: atribuição de anúncios do Google na análise (nov/2026).
-- Rode este script UMA VEZ no SQL Editor do Supabase.
--
-- atribuicao  jsonb gravado pelo quiz (gerar-analise) e por cada checkout, a
--             partir do navegador (lib/atribuicao.js). Com aceite de cookies:
--             { consent: true, client_id, session_id, gclid?, gbraid?, wbraid?,
--               utm_*?, clique_ts?, em }. Sem aceite: { consent: false, em }.
--             Os webhooks usam no purchase do GA4 (Measurement Protocol) pra o
--             Google Ads atribuir a compra ao clique; o export
--             /api/admin/conversoes-google-ads usa o gclid.
--
-- Opcional: sem esta coluna, tudo funciona como antes (o purchase sai com o
-- client_id do servidor, sem atribuição).

alter table analises add column if not exists atribuicao jsonb;

-- Pra o export de conversões por gclid (compras pagas com clique do Google).
create index if not exists analises_paid_at_idx on analises (paid_at) where payment_status = 'paid';
