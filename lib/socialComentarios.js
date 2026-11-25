// lib/socialComentarios.js — resposta automática a comentários com data de
// nascimento (o post de sábado pede isso). Puro: acha a data no texto, decide
// se responde e monta a resposta. Quem lê e responde no Instagram é
// lib/socialServidor.js (responderComentarios). Testes em
// tests/socialComentarios.test.js.
//
// No Reels INTERATIVO do dia (lib/reelsInterativo.js), responde também a
// escolha: "1", "2" ou "3" no "Escolhe uma carta" (o recado daquela carta da
// tiragem do dia) e "1"–"9" no "Ache seu número" (o que o número diz; dia de
// nascimento inteiro, tipo "28", é reduzido na resposta). Só nesses Reels: em
// qualquer outro post um "2" solto não ganha resposta.
//
// Privacidade: a data só existe na memória durante a conta. No banco fica SÓ o
// id do comentário (social_respostas), pra nunca responder 2 vezes. Nem a
// data, nem o usuário, nem o texto do comentário são guardados ou logados.

import { createHash } from 'node:crypto';
import { calcularNumeroVida } from './calculos.js';
import { NUMERO_PROFUNDO } from './manualgenerator.js';
import { contaNumeroVida } from './social.js';
import { ARCANOS_MAIORES } from './tarot.js';
import { cartasDoDia, reduzirDia } from './reelsInterativo.js';

export const CTA_RESPOSTA = 'Seu mapa é grátis: link na bio.';

const MESES = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4, maio: 5, mai: 5, junho: 6, jun: 6,
  julho: 7, jul: 7, agosto: 8, ago: 8, setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11, dezembro: 12, dez: 12,
};

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pad = (n) => String(n).padStart(2, '0');

function dataReal(d, m, y, hoje) {
  if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12)) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null; // 31/02 etc.
  if (y < 1900 || t > hoje) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * A 1ª data de nascimento do texto, "AAAA-MM-DD", ou null.
 * Aceita dd/mm/aaaa, dd/mm/aa, dd.mm.aaaa, dd-mm-aaaa, d/m/aaaa, com ou sem
 * espaço, e "14 de julho de 1990" / "14 jul 1990".
 */
export function dataNoComentario(texto, hoje = new Date()) {
  const t = semAcento(texto);
  const anoCurto = (aa) => {
    const n = Number(aa);
    const corte = hoje.getUTCFullYear() % 100;
    return n <= corte ? 2000 + n : 1900 + n;
  };
  for (const m of t.matchAll(/(?<!\d)(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{4}|\d{2})(?!\d)/g)) {
    const y = m[3].length === 2 ? anoCurto(m[3]) : Number(m[3]);
    const iso = dataReal(Number(m[1]), Number(m[2]), y, hoje);
    if (iso) return iso;
  }
  for (const m of t.matchAll(/(?<!\d)(\d{1,2})\s*(?:de\s+)?([a-z]{3,9})\.?\s*(?:de\s+)?(\d{4})(?!\d)/g)) {
    const mes = MESES[m[2]];
    if (!mes) continue;
    const iso = dataReal(Number(m[1]), mes, Number(m[3]), hoje);
    if (iso) return iso;
  }
  return null;
}

// Palavrão, ofensa, ataque ou spam: não responde (nem com número).
const OFENSIVOS = [
  'porra', 'caralho', 'merda', 'bosta', 'puta', 'puto', 'fdp', 'vtnc', 'vsf', 'pqp', 'cu', 'buceta', 'foder', 'fode', 'fodase',
  'idiota', 'otario', 'otaria', 'burro', 'burra', 'imbecil', 'retardado', 'retardada', 'lixo', 'nojento', 'nojenta', 'desgraca',
  'golpe', 'golpista', 'fraude', 'charlata', 'charlatao', 'charlatona', 'enganacao', 'mentirosa', 'mentiroso', 'satanas', 'demonio', 'macumbeira',
];
const RE_OFENSIVO = new RegExp(`\\b(${OFENSIVOS.join('|')})\\b`);

export function ehOfensivo(texto) {
  const t = semAcento(texto);
  return RE_OFENSIVO.test(t) || /https?:\/\/|www\./.test(t);
}

/** Modelo (0–3) pelo id do comentário: varia sem sortear. */
export function modeloDaResposta(idComentario) {
  return createHash('sha256').update(String(idComentario)).digest()[0] % 4;
}

/** Monta a resposta pra uma data "AAAA-MM-DD". */
export function respostaParaData(dataISO, modelo) {
  const n = calcularNumeroVida(dataISO);
  const t = NUMERO_PROFUNDO[n];
  const [y, m, d] = dataISO.split('-');
  const conta = contaNumeroVida(`${d}${m}${y}`).etapas.join(' → ');
  const mestre = n >= 11 ? ' (número mestre)' : '';
  const modelos = [
    `Seu número de vida é ${n}${mestre}: ${t.essencia}. ${CTA_RESPOSTA}`,
    `Deu ${n}${mestre}. Quem é ${n} tem força em ${t.forca}. ${CTA_RESPOSTA}`,
    `${conta}: número de vida ${n}${mestre}. ${t.essencia[0].toUpperCase()}${t.essencia.slice(1)}. ${CTA_RESPOSTA}`,
    `Número ${n}${mestre}! O caminho de quem é ${n}: ${t.cura}. ${CTA_RESPOSTA}`,
  ];
  return { numero: n, texto: modelos[((modelo % 4) + 4) % 4] };
}

// ── Reels interativo: a carta ou o número que a pessoa escolheu ───────────

const POR_EXTENSO = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9 };
// além do número, só palavras de escolha ("carta 2", "escolhi a dois", "sou 7", "nasci dia 28")
const PALAVRAS_DE_ESCOLHA = new Set(['carta', 'a', 'o', 'escolhi', 'escolho', 'sou', 'numero', 'n', 'meu', 'minha', 'deu', 'peguei', 'e', 'eu', 'nasci', 'dia', 'no']);

/**
 * O número que a pessoa escolheu num comentário curto, de 1 a `max`, ou null.
 * Comentário longo, com outras palavras ou com mais de um número (uma data,
 * "1 ou 2") = null: na dúvida, não responde.
 */
export function numeroEscolhido(texto, max) {
  const t = semAcento(texto).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!t || t.length > 30) return null;
  const palavras = t.split(' ');
  const digitos = palavras.filter((p) => /^\d+$/.test(p));
  const extenso = palavras.filter((p) => POR_EXTENSO[p]);
  if (digitos.length + extenso.length !== 1) return null;
  if (/\d/.test(palavras.filter((p) => !/^\d+$/.test(p)).join(''))) return null; // "2a", "1x"
  if (!palavras.every((p) => /^\d+$/.test(p) || POR_EXTENSO[p] || PALAVRAS_DE_ESCOLHA.has(p))) return null;
  const n = digitos.length ? Number(digitos[0]) : POR_EXTENSO[extenso[0]];
  return n >= 1 && n <= max ? n : null;
}

const maiuscula = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Resposta a quem comentou a escolha no Reels interativo do dia, ou null.
 * Carta: 4 modelos (pelo id do comentário, pra não repetir o mesmo texto em
 * todo comentário), sempre com o significado daquela carta no site. Número: o
 * que lib/manualgenerator.js diz do número (essência, força, caminho).
 * @param {{ formato: 'carta'|'numero'|'pausa', dataISO: string, texto: string, modelo?: number }} p
 */
export function respostaInterativa({ formato, dataISO, texto, modelo = 0 }) {
  const m = ((modelo % 4) + 4) % 4;
  if (formato === 'carta') {
    const n = numeroEscolhido(texto, 3);
    if (!n) return null;
    const c = cartasDoDia(dataISO, ARCANOS_MAIORES)[n - 1];
    const chave = c.palavras.map((p) => p.toLowerCase()).join(' e ');
    return [
      `Carta ${n}: ${c.nome}. ${c.significado} ${CTA_RESPOSTA}`,
      `A sua foi ${c.nome}. ${c.significado} ${CTA_RESPOSTA}`,
      `${c.nome}, ${chave}. ${c.significado} ${CTA_RESPOSTA}`,
      `A ${n} é ${c.nome}. ${c.significado} ${CTA_RESPOSTA}`,
    ][m];
  }
  if (formato === 'numero') {
    const bruto = numeroEscolhido(texto, 31);
    if (!bruto) return null;
    const { numero: n, passos } = reduzirDia(bruto);
    const conta = passos.length ? `${passos.map(([de, soma]) => `${String(de).split('').join(' + ')} = ${soma}`).join(', ')}. ` : '';
    const t = NUMERO_PROFUNDO[n];
    return conta + [
      `Número ${n}: ${t.essencia}. ${CTA_RESPOSTA}`,
      `Quem é ${n} tem força em ${t.forca}. ${CTA_RESPOSTA}`,
      `Número ${n}! ${maiuscula(t.essencia)}. O caminho: ${t.cura}. ${CTA_RESPOSTA}`,
      `Deu ${n}: ${t.essencia}. A força de quem é ${n}: ${t.forca}. ${CTA_RESPOSTA}`,
    ][m];
  }
  return null;
}

/**
 * Decide o que fazer com um comentário. { responder: false, motivo } ou
 * { responder: true, texto, modelo }. `proprio` = comentário da própria conta.
 * `interativo` = { formato, data } quando o comentário é no Reels interativo
 * daquele dia: aí "1/2/3" (carta) e "1–9" (número) também ganham resposta.
 * Data de nascimento completa vale em qualquer post (inclusive nesses).
 */
export function decidirResposta({ id, texto, proprio = false, interativo = null }, hoje = new Date()) {
  if (proprio) return { responder: false, motivo: 'da própria conta' };
  if (!texto || ehOfensivo(texto)) return { responder: false, motivo: 'ofensivo ou spam' };
  const modelo = modeloDaResposta(id);
  const data = dataNoComentario(texto, hoje);
  if (data) return { responder: true, modelo, texto: respostaParaData(data, modelo).texto };
  if (interativo) {
    const r = respostaInterativa({ formato: interativo.formato, dataISO: interativo.data, texto, modelo });
    if (r) return { responder: true, modelo, texto: r };
    return { responder: false, motivo: 'sem escolha' };
  }
  return { responder: false, motivo: 'sem data' };
}
