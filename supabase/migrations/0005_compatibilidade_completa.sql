-- Migração: Compatibilidade Completa — bônus pago (R$29,90) que cruza o mapa
-- do cliente com o de uma segunda pessoa (nome + data de nascimento).
-- Rode este script UMA VEZ inteiro, de cima a baixo, no SQL Editor do Supabase.

alter table analises add column if not exists compat_payment_status text;
alter table analises add column if not exists compat_mp_payment_id text;
alter table analises add column if not exists compat_mp_preference_id text;
alter table analises add column if not exists compat_paid_at timestamptz;
alter table analises add column if not exists compat_pessoa2_nome text;
alter table analises add column if not exists compat_pessoa2_data_nascimento date;
