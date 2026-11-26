// lib/manualCruzadoServidor.js — os outros sistemas da análise pras perguntas
// da IA do Manual (gerar-analise, gerar-manual-completo, webhook-mp).
//
// Só servidor: leva o Human Design (efeméride de precisão). O fuso é o mesmo
// da seção "O que os seus sistemas repetem" no browser (fusoDaAnalise), pra o
// texto da IA e a seção nunca discordarem do anjo ou do Kin.
// Best effort: qualquer erro devolve null e as seções saem como antes.

import { dadosCruzados, fusoDaAnalise } from './manualCruzado.js';
import { calcularHumanDesign } from './humanDesign.js';
import { offsetSalvo, buscarOffsetNascimento } from './sky.js';

/**
 * @param {{ data_nascimento?: string, hora_nascimento?: string|null, longitude?: number|string|null,
 *   fuso_iana?: string|null, utc_offset_nascimento?: number|string|null }} row
 */
export function cruzadoDaLinha(row) {
  try {
    const data = row?.data_nascimento;
    if (!data) return null;
    const hora = typeof row.hora_nascimento === 'string' && row.hora_nascimento ? row.hora_nascimento.slice(0, 5) : null;
    const lon = row.longitude === null || row.longitude === undefined || row.longitude === '' ? null : Number(row.longitude);
    // Mesmo offset do /human-design/[id] e dos Complementos do Manual.
    const hd = hora ? calcularHumanDesign(data, hora, offsetSalvo(row) ?? -3) : null;
    return dadosCruzados({ dataNascimento: data, hora, tz: fusoDaAnalise(row), lon: Number.isFinite(lon) ? lon : null, hd });
  } catch (err) {
    console.error('[manualCruzado] falhou:', err?.message || err);
    return null;
  }
}

/**
 * A linha com `__cruzado` pros build*Ctx. Busca o offset e o fuso em consulta
 * separada (as colunas das migrações 0015/0016 podem faltar).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 * @param {object} row
 */
export async function comCruzado(supabase, id, row) {
  let extra = {};
  try {
    const utc = await buscarOffsetNascimento(supabase, id);
    extra.utc_offset_nascimento = utc;
    const { data, error } = await supabase.from('analises').select('fuso_iana').eq('id', id).maybeSingle();
    if (!error && data?.fuso_iana) extra.fuso_iana = data.fuso_iana;
  } catch {}
  const linha = { ...row, ...extra };
  return { ...row, __cruzado: cruzadoDaLinha(linha) };
}
