// lib/seoTarot.js — dados das páginas públicas de SEO do tarô (/tarot e
// /tarot/[slug]) e a ponte tarô ↔ numerologia (/numerologia/numero-N).
// Sem IA e sem texto novo: junta lib/tarot.js (nome, palavras-chave,
// significado, invertida) com lib/tarotReflexao.js (o que o bot responde:
// significado central, a prática de hoje e as 3 perguntas). Puro, testado em
// tests/seoTarot.test.js. Só Server Components importam isto (o tarotReflexao
// não vai pro navegador).

import { ARCANOS_MAIORES } from './tarot.js';
import { REFLEXAO_ARCANOS } from './tarotReflexao.js';
import { contaNumeroVida } from './social.js';

export const BASE_URL = 'https://intuitiveconcept.com.br';

/** "A Roda da Fortuna" → "a-roda-da-fortuna" */
export function slugDoArcano(nome) {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const ARCANOS_SEO = ARCANOS_MAIORES.map((a) => ({
  id: a.id,
  nome: a.nome,
  slug: slugDoArcano(a.nome),
  palavrasChave: a.palavrasChave,
  significado: a.significado,
  invertida: a.significadoInvertido,
  ...REFLEXAO_ARCANOS[a.id],
}));

export function arcanoPorSlug(slug) {
  return ARCANOS_SEO.find((a) => a.slug === slug) || null;
}

/** Vizinhos na ordem dos Arcanos (o Mundo volta pro Louco). */
export function vizinhos(id) {
  const n = ARCANOS_SEO.length;
  return { anterior: ARCANOS_SEO[(id - 1 + n) % n], proximo: ARCANOS_SEO[(id + 1) % n] };
}

/**
 * O número do Arcano na numerologia, pela soma dos dígitos (11 fica, como
 * número mestre). O Louco (0) não tem.
 * @returns {{ numero: number, conta: string|null }|null}  conta = "1 + 9 = 10 → 1 + 0 = 1"
 */
export function numeroDoArcano(id) {
  if (!Number.isInteger(id) || id < 1) return null;
  if (id <= 9 || id === 11) return { numero: id, conta: null };
  const passos = [];
  let n = id;
  while (n > 9 && n !== 11) {
    const ds = String(n).split('').map(Number);
    const soma = ds.reduce((a, b) => a + b, 0);
    passos.push(`${ds.join(' + ')} = ${soma}`);
    n = soma;
  }
  return { numero: n, conta: passos.join(' → ') };
}

/** O Arcano com o mesmo número (1 a 9 e 11; 22 e 33 não têm Arcano). */
export function arcanoDoNumero(numero) {
  if (!(numero >= 1 && numero <= 9) && numero !== 11) return null;
  return ARCANOS_SEO.find((a) => a.id === numero) || null;
}

/** Arcanos cujo número reduz a este (ex.: 4 ← O Imperador, A Morte). */
export function arcanosQueReduzem(numero) {
  return ARCANOS_SEO.filter((a) => a.id !== numero && numeroDoArcano(a.id)?.numero === numero);
}

/**
 * Uma data de exemplo que dá este número de vida, com a conta (pra página do
 * número mostrar como se calcula). Determinística: a 1ª a partir de 14/07/1990.
 */
export function exemploDoNumero(numero) {
  const base = Date.UTC(1990, 6, 14);
  for (let k = 0; k < 4000; k++) {
    const d = new Date(base + k * 86400000);
    const br = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
    const c = contaNumeroVida(br);
    if (c.numero === numero) return { data: br, etapas: c.etapas };
  }
  return null;
}

const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cortar = (s, max) => {
  if (s.length <= max) return s;
  const corte = s.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(' '))}…`;
};

/** <title> e description de um Arcano (Google mostra ~60 e ~155 caracteres: o assunto vem antes da marca). */
export function metaDoArcano(a) {
  return {
    title: `${a.nome} no Tarô: significado e o que pede hoje | Intuitive Concept`,
    description: cortar(`${a.nome} (Arcano ${a.id}). ${a.central} ${a.pratica}`, 158),
  };
}

/** <title> e description de um número de vida. */
export function metaDoNumero(numero, perfil) {
  const mestre = [11, 22, 33].includes(numero);
  return {
    title: `Número ${numero} na Numerologia: ${mestre ? 'Número Mestre' : 'significado'}, força e sombra | Intuitive Concept`,
    // A força na description; essência, sombra e caminho ficam no corpo da página.
    description: cortar(`Número de vida ${numero}${mestre ? ' (Número Mestre)' : ''}: a força de quem tem o ${numero} (${perfil.forca}), a sombra, o caminho e como calcular o seu.`, 158),
    lead: `${maiuscula(perfil.essencia)}.`,
  };
}

/** JSON-LD de uma página de SEO: Article + BreadcrumbList. */
export function jsonLdDaPagina({ titulo, descricao, caminho, migalhas, sobre }) {
  const url = `${BASE_URL}${caminho}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: titulo,
      description: descricao,
      inLanguage: 'pt-BR',
      mainEntityOfPage: url,
      url,
      about: { '@type': 'Thing', name: sobre },
      author: { '@type': 'Organization', name: 'Intuitive Concept', url: BASE_URL },
      publisher: { '@type': 'Organization', name: 'Intuitive Concept', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: migalhas.map(([nome, c], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: `${BASE_URL}${c}` })),
    },
  ];
}

/** JSON pro <script type="application/ld+json"> sem abrir brecha pra </script>. */
export const jsonSeguro = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
