-- Migração: rastreio de valor_pago e origem do pagamento na análise.
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- valor_pago: valor real cobrado (reais) na transação mais recente confirmada
-- por webhook pra essa análise — Manual (sozinho ou com combo tier2/hd),
-- bônus avulso (upsell) ou Compatibilidade Completa. Não é soma acumulada:
-- se a análise tiver mais de uma transação (ex: Manual numa compra, bônus
-- avulso em outra), valor_pago reflete a última confirmada, não o total.
--
-- origem: como o payment_status do Manual virou 'paid'.
--   'venda'    → webhook confirmou pagamento de verdade (MP ou Stripe).
--   'cortesia' → alguém marcou como pago manualmente (ex: scripts/test-ia.mjs).
--   'teste'    → uso interno/QA, sem venda real.
-- Novos registros só recebem 'venda' via webhook; 'cortesia'/'teste' são
-- gravados manualmente por quem marcar o pagamento à mão.

alter table analises add column if not exists valor_pago numeric;
alter table analises add column if not exists origem text;

-- Backfill, em 3 grupos. ATENÇÃO: antes da PR que acompanha essa migração, o
-- webhook do MP marcava payment_status='paid' sem preencher paid_at (só o do
-- Stripe preenchia) — por isso paid_at sozinho NÃO é prova de venda real, e
-- stripe_session_id também não (é gravado na abertura do checkout, antes de
-- qualquer pagamento).

-- 1) paid_at preenchido só acontece via webhook de verdade (Stripe sempre
--    gravou; MP passa a gravar a partir dessa PR) — venda confirmada.
update analises
  set origem = 'venda'
  where payment_status = 'paid' and paid_at is not null and origem is null;

-- 2) Sem paid_at e sem mp_payment_id: não tem como ter vindo de um pagamento
--    do MP confirmado (webhook grava mp_payment_id junto com payment_status),
--    nem do Stripe (webhook do Stripe sempre grava paid_at) — só pode ter
--    sido marcado como pago manualmente. Cobre tanto quem não tem nenhum dos
--    dois IDs quanto quem só tem stripe_session_id (criado na abertura do
--    checkout, não prova pagamento).
update analises
  set origem = 'cortesia'
  where payment_status = 'paid' and paid_at is null and mp_payment_id is null and origem is null;

-- 3) Sem paid_at mas COM mp_payment_id: ambíguo por SQL — pode ser uma venda
--    real do MP de antes dessa correção (que não gravava paid_at), ou uma
--    marcação manual que copiou/inventou um mp_payment_id. Fica com origem
--    NULL de propósito; resolva rodando scripts/backfill-origem-mp.mjs, que
--    consulta a API do MP pra confirmar o status de cada pagamento.
