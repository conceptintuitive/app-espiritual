'use server';

import { createClient } from '@supabase/supabase-js';

const RESPOSTAS = new Set(['bate_muito', 'em_parte', 'nao_bate']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECAO_RE = /^[a-z0-9-]{1,60}$/;
const STATUS_PAGO = new Set(['paid', 'pago', 'succeeded', 'complete']);

// Server action chamada pelo FeedbackSecao. Roda só no servidor, então pode
// usar a service role — a tabela manual_feedback não tem policy pra anon.
// "Dono do manual" aqui = quem tem o link com o UUID (o app não tem login),
// então a checagem é: o manual existe e está pago.
export async function registrarFeedback(manualId, secao, resposta) {
  if (!UUID_RE.test(String(manualId)) || !SECAO_RE.test(String(secao)) || !RESPOSTAS.has(resposta)) {
    return { ok: false, erro: 'invalido' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, erro: 'config' };
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: analise } = await supabase
    .from('analises')
    .select('payment_status')
    .eq('id', manualId)
    .maybeSingle();

  if (!analise || !STATUS_PAGO.has(String(analise.payment_status || '').toLowerCase())) {
    return { ok: false, erro: 'nao_autorizado' };
  }

  const { error } = await supabase
    .from('manual_feedback')
    .insert({ manual_id: manualId, secao, resposta });

  // 23505 = unique_violation: já votou nessa seção. Pra quem está na tela o
  // resultado é o mesmo ("Obrigada!"), então conta como sucesso.
  if (error && error.code !== '23505') {
    console.error('[feedback] insert falhou:', error.message);
    return { ok: false, erro: 'db' };
  }
  return { ok: true, duplicado: error?.code === '23505' };
}
