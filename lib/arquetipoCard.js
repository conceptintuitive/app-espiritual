// lib/arquetipoCard.js
// Resolve o "arquétipo principal" de uma pessoa (mesma prioridade objetivo >
// número > elemento já usada em manualgenerator.js) e monta os textos curtos
// pro Selo do Arquétipo — o cartão compartilhável da prévia grátis.

import {
  ELEMENTO_SIGNO,
  ARQUETIPOS,
  ARQ_POR_ELEMENTO,
  ARQ_POR_NUMERO,
  ARQ_POR_OBJETIVO,
  objetivoPerfil,
} from '@/lib/manualgenerator';

const MOTTO = {
  MAGO: 'Transforma pensamento em ação',
  ORACULO: 'Enxerga o que os outros não veem',
  GUERREIRO: 'Age quando todo mundo hesita',
  AMANTE: 'Vive com presença e magnetismo',
  SOBERANO: 'Não pede licença pra ocupar seu lugar',
  SABIO: 'Transforma caos em clareza',
  CONSTRUTOR: 'Constrói o que dura',
  CURADOR: 'Cura sem se perder no processo',
};

const EMOJI = {
  MAGO: '🔮',
  ORACULO: '👁️',
  GUERREIRO: '⚔️',
  AMANTE: '💗',
  SOBERANO: '👑',
  SABIO: '📜',
  CONSTRUTOR: '🏛️',
  CURADOR: '🌿',
};

// 12 signos × 12 números possíveis (1-9, 11, 22, 33) × 8 arquétipos —
// combinatória real, não estatística de população. Usado só como "1 em X
// combinações possíveis", nunca como "X% das pessoas".
export const TOTAL_COMBINACOES = 12 * 12 * 8;

function uniqKeepOrder(arr) {
  const out = [];
  const seen = new Set();
  (arr || []).forEach((x) => {
    if (!x || seen.has(x)) return;
    seen.add(x);
    out.push(x);
  });
  return out;
}

/**
 * @param {{ signo?: string, numeroVida?: number|string, objetivoPrincipal?: string }} dados
 */
export function getArquetipoPrincipal({ signo, numeroVida, objetivoPrincipal }) {
  const elemento = ELEMENTO_SIGNO[signo] || 'Ar';
  const numero = Number(numeroVida) || 7;
  const objPack = objetivoPerfil(objetivoPrincipal || '');

  const recObj = ARQ_POR_OBJETIVO[objPack?.label] || [];
  const recNum = ARQ_POR_NUMERO[numero] || ARQ_POR_NUMERO[7];
  const recElem = ARQ_POR_ELEMENTO[elemento] || ARQ_POR_ELEMENTO['Ar'];

  const [chave] = uniqKeepOrder([...recObj, ...recNum, ...recElem]);
  const chaveFinal = chave && ARQUETIPOS[chave] ? chave : 'SABIO';
  const arquetipo = ARQUETIPOS[chaveFinal];

  return {
    chave: chaveFinal,
    nome: arquetipo.nome,
    motto: MOTTO[chaveFinal],
    emoji: EMOJI[chaveFinal],
    elemento,
  };
}
