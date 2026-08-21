-- Migração: upsell de Human Design (Tipo, Autoridade, Perfil), R$29,90 avulso ou
-- combinado com a Projeção de 12 Meses por R$50 (economia de R$9,80).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.
--
-- hd_payment_status fica null até o pagamento ser aprovado (mesmo padrão do
-- tier2_payment_status já usado pra Projeção de 12 Meses).

alter table analises add column if not exists hd_payment_status text;
alter table analises add column if not exists hd_mp_payment_id text;
alter table analises add column if not exists hd_mp_preference_id text;
alter table analises add column if not exists hd_paid_at timestamptz;
