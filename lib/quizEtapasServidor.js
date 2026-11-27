// lib/quizEtapasServidor.js — só servidor. Grava a etapa do quiz (anônimo) e
// lê o funil pra prévia. Migração 0034; sem ela, não grava e a prévia avisa.
// Regras puras em lib/quizEtapas.js.

import { linhaDaEtapa, funilDoQuiz, diaBrasilia } from './quizEtapas.js';

const somarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** Conta uma etapa (1x por sessão e etapa: o unique do banco descarta a repetida). */
export async function registrarEtapa(supabase, corpo, agora = Date.now()) {
  const linha = linhaDaEtapa(corpo, agora);
  if (!linha || !supabase) return { ok: false, motivo: 'pedido inválido' };
  const { error } = await supabase.from('quiz_etapas').upsert(linha, { onConflict: 'sessao,etapa', ignoreDuplicates: true });
  if (error) return { ok: false, motivo: `${error.message} (migração 0034?)` };
  return { ok: true };
}

/** Funil dos últimos `dias` dias (contando hoje), por origem. */
export async function funilQuiz({ supabase, dias = 14, hoje = diaBrasilia() }) {
  const desde = somarDias(hoje, -(dias - 1));
  const { data, error } = await supabase.from('quiz_etapas_resumo').select('dia, origem, etapa, sessoes').gte('dia', desde).limit(5000);
  if (error) return { ...funilDoQuiz([]), desde, erro: `${error.message} (migração 0034?)` };
  return { ...funilDoQuiz(data), desde };
}
