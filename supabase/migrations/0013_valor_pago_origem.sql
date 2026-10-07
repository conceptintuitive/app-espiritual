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

-- Backfill: até essa migração, o webhook do MP marcava payment_status='paid'
-- sem preencher paid_at (só o do Stripe preenchia) — por isso usamos também
-- mp_payment_id/stripe_payment_intent, não só paid_at, pra identificar quem
-- passou de fato por um webhook de pagamento (venda real) dos marcados à mão
-- (cortesia, sem nenhum desses IDs).
update analises
  set origem = 'venda'
  where payment_status = 'paid'
    and origem is null
    and (paid_at is not null or mp_payment_id is not null or stripe_payment_intent is not null);

update analises
  set origem = 'cortesia'
  where payment_status = 'paid' and paid_at is null and origem is null;
