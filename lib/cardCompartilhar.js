// lib/cardCompartilhar.js
// Helpers do card de story (/api/card). A rota recebe só o id da análise e
// monta aqui, no servidor, o que vai na imagem: número, arquétipo e frase.
// Nada que venha da URL vira texto no card — assim ninguém consegue gerar um
// card com a nossa marca e um texto qualquer.

import { SIGNO_PROFUNDO, numeroArquetipo } from '@/lib/manualgenerator';
import { calcularNumeroVida } from '@/lib/calculos';

export const SITE_URL = 'https://intuitiveconcept.com.br';
export const SITE_HOST = 'intuitiveconcept.com.br';

// Link que vai no texto do share (WhatsApp etc.). Não vai impresso na imagem:
// texto dentro de story não é clicável, então UTM impressa não rastreia nada.
export const LINK_QUIZ = `${SITE_URL}/?utm_source=share&utm_medium=card`;

// Mesma ideia, mas pros cards de Ponto Cego/Mantra (card "Seu Manual
// Completo"): UTM própria por tipo, pra medir cada um separado no GA4.
export function linkStoryTipo(tipo) {
  return `${SITE_URL}/?utm_source=story&utm_medium=share&utm_content=${tipo}`;
}

export const MAX_FRASE = 60;

export const TIPOS_CARD = new Set(['numero', 'ponto_cego', 'mantra']);
export function tipoCardValido(t) {
  return TIPOS_CARD.has(String(t ?? '')) ? String(t) : 'numero';
}

const NUMEROS_VALIDOS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_PAGO = new Set(['paid', 'pago', 'succeeded', 'complete']);

export function idValido(id) {
  return UUID_RE.test(String(id ?? ''));
}

export function numeroValido(n) {
  const num = Number(n);
  return NUMEROS_VALIDOS.has(num) ? num : null;
}

// Tira markdown/quebras, colapsa espaços e corta em MAX_FRASE sem partir
// palavra no meio.
export function limparFrase(texto) {
  let t = String(texto ?? '')
    .replace(/[*_`#>]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/["“”]/g, '') // o card já envolve a frase em aspas
    .trim();

  if (t.length <= MAX_FRASE) return t;

  t = t.slice(0, MAX_FRASE - 1);
  const ultimoEspaco = t.lastIndexOf(' ');
  if (ultimoEspaco > 20) t = t.slice(0, ultimoEspaco);
  return `${t.replace(/[\s,;:.!?-]+$/, '')}…`;
}

function semAcento(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Escolhe a frase do card. Prioridade:
// 1) primeira frase da Síntese Integrada que caiba inteira em MAX_FRASE e não
//    cite o primeiro nome (card não pode carregar dado pessoal);
// 2) fallback curado (SIGNO_PROFUNDO[signo].frase), que já é curto.
// A Síntese é um parágrafo corrido gerado por IA, então na maioria dos manuais
// o fallback é que vai aparecer — e na prévia grátis a Síntese nem existe.
export function fraseParaCard({ sintese, firstName, fallback } = {}) {
  const nome = semAcento(firstName).trim();
  const frases = String(sintese ?? '')
    .replace(/\*\*|\*/g, '')
    .match(/[^.!?]+[.!?]+/g) || [];

  const candidata = frases
    .map((f) => f.replace(/\s+/g, ' ').trim())
    .find((f) => {
      if (f.length < 15 || f.length > MAX_FRASE) return false;
      if (nome && nome.length > 1 && semAcento(f).includes(nome)) return false;
      return true;
    });

  return limparFrase(candidata || fallback || 'Nada no seu mapa é por acaso.');
}

export function estaPago(row) {
  return STATUS_PAGO.has(String(row?.payment_status || '').toLowerCase());
}

// Tudo que o card mostra, derivado da linha de `analises`. Só sai daqui
// número, arquétipo e frase — o nome é usado apenas pra filtrar a Síntese.
export function dadosDoCard(row) {
  const numero = numeroValido(row?.numero_vida)
    || (row?.data_nascimento ? numeroValido(calcularNumeroVida(String(row.data_nascimento))) : null);
  if (!numero) return null;

  let sintese = null;
  try {
    const s = typeof row.sintese_gerada === 'string' ? JSON.parse(row.sintese_gerada) : row.sintese_gerada;
    sintese = s?.body || null;
  } catch {}

  const firstName = String(row?.nome || '').trim().split(/\s+/)[0] || '';
  const frase = fraseParaCard({ sintese, firstName, fallback: SIGNO_PROFUNDO[row?.signo]?.frase });

  // Arquétipo do número = o mesmo que o manual mostra ("Arquétipo: Investigador").
  // Na prévia grátis fica de fora: o manual ainda não foi liberado, e a página
  // de resultado já mostra outro arquétipo (o do Selo), o que confundiria.
  const nomeArq = estaPago(row) ? numeroArquetipo(numero)?.nome?.trim() : null;
  const arquetipo = nomeArq && nomeArq !== 'Seu Arquétipo' ? `O ${nomeArq}` : null;

  return { numero, arquetipo, frase };
}

// `v` só serve pra furar o cache do CDN quando o manual é pago (aí entram
// arquétipo e Síntese). A rota ignora o valor.
export function urlDoCard(id, pago, tipo = 'numero') {
  if (!idValido(id)) return null;
  const params = new URLSearchParams({ id, v: pago ? 'p' : 'f', tipo: tipoCardValido(tipo) });
  return `/api/card?${params.toString()}`;
}

// Ponto Cego e Mantra Pessoal vêm do manual completo (generateManual), não
// direto da linha de `analises` — a lógica de fallback estático (quando não
// tem *_gerado da IA) mora inteira em lib/manualgenerator.js, então a rota
// do card reaproveita o gerador em vez de duplicar essa lógica aqui.
// Extrai só uma frase curta, igual ao destaque que já aparece no Manual
// (app/manual/[id]/page.js) — mesma 1ª frase, mesmo texto, zero duplicação
// de conteúdo gerado.
export function fraseDoPontoCego({ manual, firstName }) {
  const secao = manual?.sections?.find(
    (s) => s?.type === 'text' && String(s?.title ?? '').trim().toLowerCase() === 'ponto cego'
  );
  if (!secao?.body) return null;
  return fraseParaCard({ sintese: secao.body, firstName, fallback: null });
}

// Mantra só existe quando o Fechamento foi gerado por IA (fechamento_gerado)
// — o fallback estático do Manual não produz mantra, então aqui retorna
// null nesse caso (a rota do card decide o que fazer: 404, sem fallback
// inventado).
export function fraseDoMantra({ manual }) {
  const secao = manual?.sections?.find((s) => s?.type === 'closing');
  if (!secao?.mantra) return null;
  return limparFrase(secao.mantra);
}
