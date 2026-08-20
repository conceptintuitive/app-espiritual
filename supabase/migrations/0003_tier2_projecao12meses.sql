-- Migração: Tier 2 do manual — Projeção de 12 Meses (upsell R$97, só Mercado Pago por enquanto).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- tier2_payment_status fica null até o pagamento ser aprovado (evita ambiguidade
-- com o payment_status do manual base, que usa 'pending'/'paid').

alter table analises add column if not exists tier2_payment_status text;
alter table analises add column if not exists tier2_mp_payment_id text;
alter table analises add column if not exists tier2_mp_preference_id text;
alter table analises add column if not exists tier2_paid_at timestamptz;

-- Dados opcionais de uma segunda pessoa, pra uma futura leitura de compatibilidade
-- cruzada dentro do tier 2 — a pessoa preenche só se quiser, depois de já ter comprado.
alter table analises add column if not exists tier2_pessoa2_nome text;
alter table analises add column if not exists tier2_pessoa2_data_nascimento date;
