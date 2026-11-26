// lib/cortesiaEmail.js — e-mails do fim dos 30 dias de cortesia do Manual
// (nov/2026). SÓ SERVIDOR (lib/seuDiaServidor.js).
//
// Quem compra o Manual ganha 30 dias do Intuitive Completo
// (lib/assinaturaRegras.js, DIAS_CORTESIA_MANUAL). Antes, o acesso acabava
// sem aviso nenhum. Agora saem 2 e-mails, com o link do /assinar:
//   d25 — "acabam em 5 dias" (25 a 30 dias depois da compra)
//   d30 — "terminou hoje"    (30 a 33 dias depois; passou disso, não manda)
// Regras: Manual pago (payment_status 'paid', paid_at), não pago pela
// assinatura anual (origem 'assinatura'), sem presente (a cortesia é do e-mail
// da análise, não de quem recebeu), sem descadastro, o Manual MAIS RECENTE do
// e-mail (uma compra nova recomeça os 30 dias) e sem assinatura ativa.
// Trava atômica por análise (analises.cortesia_d25_em / cortesia_d30_em,
// migração 0033); sem a migração, o lote não faz nada. Quem dispara: o cron
// de lembretes (app/api/cron/lembretes).

import { moldura, botao } from './seuDiaEmail.js';
import { emailExato } from './seuDiaServidor.js';
import { DIAS_CORTESIA_MANUAL } from './assinaturaRegras.js';
import { PRECO_ASSINATURA_MENSAL, PRECO_ASSINATURA_ANUAL } from './preco.js';
import { PERDE_NO_FIM_DA_CORTESIA, brl, anualPorMes } from './planos.js';

const DIA_MS = 86400000;
export const DIAS_AVISO_CORTESIA = DIAS_CORTESIA_MANUAL - 5; // 25
export const DIAS_LIMITE_FIM_CORTESIA = DIAS_CORTESIA_MANUAL + 3; // 33

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLUNA = { d25: 'cortesia_d25_em', d30: 'cortesia_d30_em' };

/** Data dd/mm no relógio de Brasília. */
export function dataCurtaBR(ms) {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
}

/**
 * Qual e-mail esta análise deve receber agora: 'd25', 'd30' ou null.
 * Não olha assinatura nem compra mais recente (isso precisa do banco).
 * @param {{ payment_status?: string, paid_at?: string|null, origem?: string|null, presente_email?: string|null,
 *   unsubscribed?: boolean|null, cortesia_d25_em?: string|null, cortesia_d30_em?: string|null }} row
 */
export function etapaDaCortesia(row, agora = Date.now()) {
  if (!row || row.payment_status !== 'paid' || !row.paid_at) return null;
  if (row.origem === 'assinatura' || row.presente_email || row.unsubscribed === true) return null;
  const dias = (agora - new Date(row.paid_at).getTime()) / DIA_MS;
  if (dias >= DIAS_CORTESIA_MANUAL && dias <= DIAS_LIMITE_FIM_CORTESIA) return row.cortesia_d30_em ? null : 'd30';
  // O aviso dos 5 dias só faz sentido antes do fim (e não sai junto com o d30).
  if (dias >= DIAS_AVISO_CORTESIA && dias < DIAS_CORTESIA_MANUAL) return row.cortesia_d25_em ? null : 'd25';
  return null;
}

/**
 * @param {{ etapa: 'd25'|'d30', nome?: string|null, fimMs: number, linkMensal: string, linkAnual: string, descadastro: string }} p
 */
export function montarEmailCortesia({ etapa, nome, fimMs, linkMensal, linkAnual, descadastro }) {
  const ola = nome ? `${esc(nome)}, ` : '';
  const quando = dataCurtaBR(fimMs);
  const lista = PERDE_NO_FIM_DA_CORTESIA
    .map((t) => `<li style="margin:0 0 8px">${esc(t)}</li>`).join('');
  const mensal = `Continuar por ${brl(PRECO_ASSINATURA_MENSAL)}/mês`;
  const anual = `ou ${brl(PRECO_ASSINATURA_ANUAL)}/ano (${brl(anualPorMes())} por mês)`;

  const d25 = etapa === 'd25';
  const subject = d25
    ? 'Seus 30 dias do Intuitive Completo acabam em 5 dias'
    : 'Seus 30 dias do Intuitive Completo terminaram';
  const titulo = d25 ? `${ola}faltam 5 dias` : `${ola}seus 30 dias terminaram`;
  const abertura = d25
    ? `Quando você comprou o Manual do seu Mapa, ganhou 30 dias do Intuitive Completo. Eles acabam em ${quando}. O seu Manual continua seu pra sempre; o que volta pra versão grátis é:`
    : 'O seu Manual do seu Mapa continua aberto, pra sempre, junto com a Compatibilidade Completa e o Oráculo. O que voltou pra versão grátis hoje foi:';

  const html = moldura({
    motivo: 'Você recebe este e-mail porque comprou o Manual do seu Mapa.',
    descadastro,
    conteudo: `
    <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#f2c77b">Intuitive Completo</p>
    <h1 style="margin:0 0 14px;font-weight:400;font-size:34px;line-height:1.08;color:#f3e9da">${titulo}</h1>
    <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#d9cbb8">${esc(abertura)}</p>
    <ul style="margin:0 0 6px;padding-left:20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#f3e9da">${lista}</ul>
    ${botao(linkMensal, mensal)}
    <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#d9cbb8"><a href="${esc(linkAnual)}" style="color:#f2c77b">${esc(anual)}</a></p>
    <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#8d7fa3">No cartão, você cancela quando quiser na Minha Área. No Pix, paga um mês por vez e nada renova sozinho.</p>`,
  });

  const text = [
    `${d25 ? `${nome ? `${nome}, f` : 'F'}altam 5 dias` : `${nome ? `${nome}, s` : 'S'}eus 30 dias terminaram`}.`,
    '',
    abertura,
    ...PERDE_NO_FIM_DA_CORTESIA.map((t) => `- ${t}`),
    '',
    `${mensal}: ${linkMensal}`,
    `${anual}: ${linkAnual}`,
    '',
    'No cartão, você cancela quando quiser na Minha Área. No Pix, paga um mês por vez e nada renova sozinho.',
    '',
    '—',
    `Não quer mais receber? ${descadastro}`,
  ].join('\n');

  return { subject, html, text };
}

const linkAssinar = (baseUrl, id, plano, etapa) =>
  `${baseUrl}/assinar?a=${encodeURIComponent(id)}&plano=${plano}&utm_source=email&utm_medium=cortesia&utm_campaign=${etapa}`;

/**
 * Lote do cron de lembretes. 1 e-mail por pessoa por execução; trava por
 * análise antes de enviar e devolve a trava se o envio falhar.
 */
export async function processarLoteCortesia({ supabase, resend, baseUrl, agora = Date.now(), limite = 100 }) {
  const desde = new Date(agora - DIAS_LIMITE_FIM_CORTESIA * DIA_MS).toISOString();
  const ate = new Date(agora - DIAS_AVISO_CORTESIA * DIA_MS).toISOString();
  const { data, error } = await supabase
    .from('analises')
    .select('id, nome, email, presente_email, payment_status, paid_at, origem, unsubscribed, cortesia_d25_em, cortesia_d30_em')
    .eq('payment_status', 'paid')
    .gte('paid_at', desde)
    .lte('paid_at', ate)
    .order('paid_at', { ascending: false })
    .limit(limite);
  if (error) {
    // 42703 = coluna não existe (migração 0033 ainda não rodou)
    if (error.code !== '42703') console.error('[cortesia] consulta', error.message);
    return { pulado: true, motivo: error.code === '42703' ? 'migração 0033' : 'erro' };
  }

  const vistos = new Set();
  let enviados = 0;
  for (const row of data || []) {
    const etapa = etapaDaCortesia(row, agora);
    if (!etapa) continue;
    const destino = String(row.email || '').trim();
    const chave = destino.toLowerCase();
    if (!destino || vistos.has(chave)) continue;
    vistos.add(chave);

    const padrao = emailExato(chave);
    // Manual comprado depois deste: a cortesia recomeçou, este aviso não vale.
    const { data: maisNovo } = await supabase
      .from('analises').select('id').ilike('email', padrao).eq('payment_status', 'paid')
      .gt('paid_at', row.paid_at).limit(1);
    if (maisNovo?.length) continue;
    // Já assina: nada a avisar.
    const { data: assinando } = await supabase
      .from('assinaturas').select('id').ilike('email', padrao)
      .gt('acesso_ate', new Date(agora).toISOString()).limit(1);
    if (assinando?.length) continue;

    const coluna = COLUNA[etapa];
    const { data: claim } = await supabase
      .from('analises')
      .update({ [coluna]: new Date(agora).toISOString() })
      .eq('id', row.id)
      .is(coluna, null)
      .select('id');
    if (!claim?.length) continue;

    const nome = String(row.nome || '').trim().split(/\s+/)[0] || null;
    const msg = montarEmailCortesia({
      etapa,
      nome: nome ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase() : null,
      fimMs: new Date(row.paid_at).getTime() + DIAS_CORTESIA_MANUAL * DIA_MS,
      linkMensal: linkAssinar(baseUrl, row.id, 'mensal', etapa),
      linkAnual: linkAssinar(baseUrl, row.id, 'anual', etapa),
      descadastro: `${baseUrl}/api/unsubscribe?id=${row.id}`,
    });
    try {
      const { error: errEnvio } = await resend.emails.send({
        from: 'acesso@intuitiveconcept.com.br',
        to: destino,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        headers: { 'List-Unsubscribe': `<${baseUrl}/api/unsubscribe?id=${row.id}>` },
      });
      if (errEnvio) throw new Error(errEnvio.message);
      enviados += 1;
    } catch (e) {
      console.error('[cortesia] envio', e?.message);
      await supabase.from('analises').update({ [coluna]: null }).eq('id', row.id);
    }
  }
  return { candidatos: data?.length || 0, enviados };
}
