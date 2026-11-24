// lib/provaSocial.js — prova social do /resultado, só com respostas reais.
// Puro (testado em tests/provaSocial.test.js); quem lê o banco é
// app/api/prova-social/route.js.
//
// Fontes:
//   - manual_feedback (migração 0012): "Isso bate com você?" em cada seção do
//     Manual — bate_muito | em_parte | nao_bate.
//   - manual_avaliacoes (migração 0027): a avaliação do e-mail de 3 dias
//     depois da compra (mesmas 3 respostas + frase opcional + autorização).
//
// Uma pessoa = um Manual. Ela "disse que bate" quando:
//   - respondeu "bate muito" no e-mail de avaliação (resposta geral, vale
//     mais que as das seções), ou
//   - sem o e-mail, mais da metade das seções que ela marcou é "bate muito"
//     (empate não conta). "Em parte" não conta como bate.
// Compras de teste (origem 'teste') ficam de fora.

import { ehOfensivo } from './socialComentarios.js';

/**
 * @param {{ secoes?: Array<{ manual_id: string, resposta: string }>,
 *   avaliacoes?: Array<{ analise_id: string, resposta: string }>,
 *   excluir?: Set<string> }} p
 * @returns {{ pessoas: number, bate: number }}
 */
export function resumoDasRespostas({ secoes = [], avaliacoes = [], excluir = new Set() }) {
  const porPessoa = new Map();
  for (const a of avaliacoes) {
    if (!a?.analise_id || excluir.has(a.analise_id) || !a.resposta) continue;
    porPessoa.set(a.analise_id, a.resposta === 'bate_muito');
  }
  const votos = new Map();
  for (const s of secoes) {
    if (!s?.manual_id || excluir.has(s.manual_id) || porPessoa.has(s.manual_id)) continue;
    const v = votos.get(s.manual_id) || { bate: 0, total: 0 };
    v.total += 1;
    if (s.resposta === 'bate_muito') v.bate += 1;
    votos.set(s.manual_id, v);
  }
  for (const [id, v] of votos) porPessoa.set(id, v.bate * 2 > v.total);
  let bate = 0;
  for (const ok of porPessoa.values()) if (ok) bate += 1;
  return { pessoas: porPessoa.size, bate };
}

/** Frase que pode ir pro site: 15 a 280 caracteres, sem ofensa, link, e-mail ou telefone. */
export function frasePublicavel(frase) {
  const t = String(frase || '').replace(/\s+/g, ' ').trim();
  if (t.length < 15 || t.length > 280) return null;
  if (ehOfensivo(t) || /@|\d{4,}|https?:|www\./i.test(t)) return null;
  return t.replace(/^["“”']+|["“”']+$/g, '').trim();
}

/** Primeiro nome com só a 1ª letra maiúscula (nunca sobrenome). */
export function primeiroNome(nome) {
  const p = String(nome || '').trim().split(/\s+/)[0] || '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
}

/**
 * Depoimentos que podem aparecer no /resultado: autorizados, não ocultados,
 * com "bate muito" e frase publicável. Só primeiro nome + signo.
 * @param {Array<{ resposta: string, frase?: string, autoriza_publicar?: boolean, oculto?: boolean,
 *   nome_publico?: string, signo?: string, atualizado_em?: string }>} linhas
 */
export function depoimentosPublicaveis(linhas, limite = 3) {
  return (linhas || [])
    .filter((l) => l?.autoriza_publicar === true && !l.oculto && l.resposta === 'bate_muito' && primeiroNome(l.nome_publico))
    .map((l) => ({ texto: frasePublicavel(l.frase), nome: primeiroNome(l.nome_publico), signo: l.signo || null, quando: l.atualizado_em || '' }))
    .filter((d) => d.texto)
    .sort((a, b) => String(b.quando).localeCompare(String(a.quando)))
    .slice(0, limite)
    .map(({ texto, nome, signo }) => ({ texto, nome, signo }));
}
