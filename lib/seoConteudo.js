// lib/seoConteudo.js
// Mapeamento de slugs para as páginas de SEO evergreen (/signos/[signo] e
// /numerologia/numero-[numero]). Reaproveita os textos já existentes em
// manualgenerator.js (SIGNO_PROFUNDO, NUMERO_PROFUNDO etc.) — nenhum
// conteúdo novo é escrito aqui, só a montagem das páginas.

import {
  SIGNO_PROFUNDO,
  NUMERO_PROFUNDO,
  ELEMENTO_SIGNO,
  REGENTE_SIGNO,
  ESTILO_ELEMENTO,
} from '@/lib/manualgenerator';

export const SIGNOS = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes',
];

const SIGNO_SLUG = {
  'Áries': 'aries', 'Touro': 'touro', 'Gêmeos': 'gemeos', 'Câncer': 'cancer',
  'Leão': 'leao', 'Virgem': 'virgem', 'Libra': 'libra', 'Escorpião': 'escorpiao',
  'Sagitário': 'sagitario', 'Capricórnio': 'capricornio', 'Aquário': 'aquario', 'Peixes': 'peixes',
};

export function signoSlug(signo) {
  return SIGNO_SLUG[signo] || '';
}

export function signoPorSlug(slug) {
  const entry = Object.entries(SIGNO_SLUG).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

export function dadosDoSigno(signo) {
  const perfil = SIGNO_PROFUNDO[signo];
  if (!perfil) return null;
  const elemento = ELEMENTO_SIGNO[signo];
  const regente = REGENTE_SIGNO[signo];
  const estilo = ESTILO_ELEMENTO[elemento];
  return { signo, perfil, elemento, regente, estilo };
}

export const NUMEROS_VIDA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

export function dadosDoNumero(numero) {
  const perfil = NUMERO_PROFUNDO[numero];
  if (!perfil) return null;
  return { numero, perfil, mestre: numero === 11 || numero === 22 || numero === 33 };
}
