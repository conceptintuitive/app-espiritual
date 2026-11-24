// lib/avaliacao.js — e-mail de avaliação 3 dias depois da compra do Manual.
// SÓ SERVIDOR (token HMAC de lib/seuDiaServidor.js).
//
// O e-mail tem 3 botões ("Bate muito", "Em parte", "Não bate"). O clique abre
// /avaliar?t=<token>&r=<resposta>, que grava a resposta pela página (POST
// /api/avaliacao, não no GET: robô de antivírus que abre link de e-mail não
// vota) e oferece 1 frase opcional + a autorização pra publicar (só primeiro
// nome + signo, lidos da análise na hora de mostrar). Tabela
// manual_avaliacoes (migração 0027). Quem dispara: o cron de lembretes
// (app/api/cron/lembretes), 1 e-mail por análise paga, trava em
// analises.avaliacao_email_em.

import { tokenEmail, emailDoToken } from './seuDiaServidor.js';
import { moldura, botao } from './seuDiaEmail.js';

export const RESPOSTAS_AVALIACAO = { bate_muito: 'Bate muito', em_parte: 'Em parte', nao_bate: 'Não bate' };
export const DIAS_ATE_AVALIACAO = 3;
// Passou disso sem e-mail (ex.: a migração rodou depois), não manda mais.
export const DIAS_LIMITE_AVALIACAO = 14;
const TOKEN_MS = 90 * 86400 * 1000;

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Token do link do e-mail: identifica a análise (vale 90 dias). */
export const tokenAvaliacao = (analiseId) => tokenEmail(String(analiseId), 'avaliacao', TOKEN_MS);
export const analiseDoTokenAvaliacao = (t) => emailDoToken(t, 'avaliacao');

/**
 * A análise já pode receber o e-mail? Paga há 3 a 14 dias, sem e-mail ainda,
 * sem descadastro.
 * @param {{ payment_status?: string, paid_at?: string|null, avaliacao_email_em?: string|null, unsubscribed?: boolean|null }} row
 */
export function deveReceberAvaliacao(row, agora = Date.now()) {
  if (!row || row.payment_status !== 'paid' || !row.paid_at || row.avaliacao_email_em || row.unsubscribed === true) return false;
  const dias = (agora - new Date(row.paid_at).getTime()) / 86400000;
  return dias >= DIAS_ATE_AVALIACAO && dias <= DIAS_LIMITE_AVALIACAO;
}

/**
 * @param {{ nome?: string|null, link: string, descadastro: string }} p
 *   link = /avaliar?t=… (sem o &r=, que cada botão acrescenta)
 */
export function montarEmailAvaliacao({ nome, link, descadastro }) {
  const ola = nome ? `${esc(nome)}, ` : '';
  const url = (r) => `${link}&r=${r}`;
  const contorno = (href, texto) => `<a href="${esc(href)}" style="display:inline-block;margin:12px 8px 0 0;border:1px solid rgba(242,199,123,.5);color:#f2c77b;text-decoration:none;padding:14px 22px;border-radius:999px;font-family:'Courier New',monospace;font-size:13px;letter-spacing:.14em;text-transform:uppercase">${esc(texto)}</a>`;
  const html = moldura({
    motivo: 'Você recebe este e-mail porque comprou o Manual do seu Mapa.',
    descadastro,
    conteudo: `
    <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#f2c77b">O Manual do seu Mapa</p>
    <h1 style="margin:0 0 14px;font-weight:400;font-size:34px;line-height:1.08;color:#f3e9da">${ola}ele bate com você?</h1>
    <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#d9cbb8">Faz alguns dias que o seu Manual foi liberado. Um clique e pronto: a sua resposta ajuda outras pessoas a decidir.</p>
    ${botao(url('bate_muito'), RESPOSTAS_AVALIACAO.bate_muito)}<br>
    ${contorno(url('em_parte'), RESPOSTAS_AVALIACAO.em_parte)}${contorno(url('nao_bate'), RESPOSTAS_AVALIACAO.nao_bate)}
    <p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#8d7fa3">Se quiser, na página você deixa uma frase. Ela só aparece no site se você autorizar, e só com o seu primeiro nome e signo.</p>`,
  });
  const text = `${nome ? `${nome}, o` : 'O'} Manual do seu Mapa bate com você?\n\nUm clique e pronto:\n- Bate muito: ${url('bate_muito')}\n- Em parte: ${url('em_parte')}\n- Não bate: ${url('nao_bate')}\n\nSe quiser, na página você deixa uma frase. Ela só aparece no site se você autorizar, e só com o seu primeiro nome e signo.\n\n—\nNão quer mais receber? ${descadastro}`;
  return { subject: 'O seu Manual bate com você?', html, text };
}

/**
 * Lote do cron de lembretes: manda o e-mail de avaliação pras análises pagas
 * há 3 a 14 dias. Trava atômica por análise (avaliacao_email_em is null), 1
 * e-mail por pessoa por execução (a mesma pessoa com 2 Manuais recebe um
 * agora e o outro na próxima). Sem a migração 0027, não faz nada.
 */
export async function processarLoteAvaliacao({ supabase, resend, baseUrl, agora = Date.now(), limite = 100 }) {
  const desde = new Date(agora - DIAS_LIMITE_AVALIACAO * 86400000).toISOString();
  const ate = new Date(agora - DIAS_ATE_AVALIACAO * 86400000).toISOString();
  const { data, error } = await supabase
    .from('analises')
    .select('id, nome, email, presente_email, payment_status, paid_at, avaliacao_email_em, unsubscribed')
    .eq('payment_status', 'paid')
    .gte('paid_at', desde)
    .lte('paid_at', ate)
    .is('avaliacao_email_em', null)
    .order('paid_at', { ascending: true })
    .limit(limite);
  if (error) {
    // 42703 = coluna não existe (migração 0027 ainda não rodou)
    if (error.code !== '42703') console.error('[avaliacao] consulta', error.message);
    return { pulado: true, motivo: error.code === '42703' ? 'migração 0027' : 'erro' };
  }

  const vistos = new Set();
  let enviados = 0;
  for (const row of data || []) {
    if (!deveReceberAvaliacao(row, agora)) continue;
    const destino = String(row.presente_email || row.email || '').trim();
    const chave = destino.toLowerCase();
    if (!destino || vistos.has(chave)) continue;
    vistos.add(chave);

    const { data: claim } = await supabase
      .from('analises')
      .update({ avaliacao_email_em: new Date(agora).toISOString() })
      .eq('id', row.id)
      .is('avaliacao_email_em', null)
      .select('id');
    if (!claim?.length) continue;

    // Presente: quem leu foi quem recebeu, então o nome da análise vale.
    const nome = String(row.nome || '').trim().split(/\s+/)[0] || null;
    const msg = montarEmailAvaliacao({
      nome: nome ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase() : null,
      link: `${baseUrl}/avaliar?t=${encodeURIComponent(tokenAvaliacao(row.id))}`,
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
      // Devolve a vaga pra tentar na próxima execução.
      console.error('[avaliacao] envio', e?.message);
      await supabase.from('analises').update({ avaliacao_email_em: null }).eq('id', row.id);
    }
  }
  return { candidatos: data?.length || 0, enviados };
}
