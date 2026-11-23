// Regras e textos do bloco interativo dos posts do blog
// (app/blog/[slug]/BlocoInterativo.js). Puro, sem React: testado em
// tests/blog.test.js. As contas pesadas (número de vida, Ascendente, leitura
// do dia) ficam no componente, importadas sob demanda.

// Números com página própria em /numerologia/numero-N (lib/seoConteudo.js).
export const NUMEROS_COM_PAGINA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

const SIGNOS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];

// Casas em signos inteiros (casa 1 = signo do Ascendente).
export const CASAS = [
  'identidade e o jeito de chegar no mundo', 'dinheiro e o que você valoriza', 'comunicação e o dia a dia',
  'casa, família e raízes', 'criatividade, prazer e romance', 'rotina, trabalho e saúde',
  'relações e parcerias', 'intimidade, crises e transformação', 'estudos, viagens e crenças',
  'carreira e imagem pública', 'amigos, grupos e projetos', 'o inconsciente e os bastidores',
];

/** Tipo de bloco de cada categoria. */
export function tipoDoBloco(categoria) {
  if (categoria === 'numeros') return 'numero';
  if (categoria === 'signos') return 'signo';
  if (categoria === 'taro') return 'carta';
  return 'dia'; // principios, lua, mente
}

/** Pergunta do topo do bloco. */
export function perguntaDoBloco(categoria, signo) {
  switch (categoria) {
    case 'numeros': return 'Qual é o seu número de vida?';
    case 'signos': return `Onde ${signo || 'este signo'} cai no seu mapa?`;
    case 'taro': return 'Qual carta rege o seu dia hoje?';
    case 'mente': return 'Como aplicar isso no seu dia hoje?';
    default: return 'O que isso muda no seu dia hoje?'; // principios, lua
  }
}

const comNome = (nome, frase) => (nome ? `${nome}, ${frase.charAt(0).toLowerCase()}${frase.slice(1)}` : frase);

/**
 * Resultado do bloco de Números.
 * @returns {{ frase: string, sobreVoce: boolean, link: { href: string, rotulo: string } | null }}
 *   link null = o componente mostra o CtaMapa.
 */
export function resultadoNumero({ numero, numeroPost, nome = '', postDoNumero = null }) {
  const frase = nome ? `${nome}, seu número é ${numero}.` : `O seu é ${numero}.`;
  if (numero === numeroPost) return { frase, sobreVoce: true, link: null };
  if (postDoNumero) return { frase, sobreVoce: false, link: { href: `/blog/${postDoNumero}`, rotulo: `Ler sobre o número ${numero}` } };
  if (NUMEROS_COM_PAGINA.includes(numero)) return { frase, sobreVoce: false, link: { href: `/numerologia/numero-${numero}`, rotulo: `Ver o número ${numero}` } };
  return { frase, sobreVoce: false, link: null };
}

/** Casa (1–12, signos inteiros) em que `signo` cai pra quem tem Ascendente `ascendente`. */
export function casaDoSigno(signo, ascendente) {
  const s = SIGNOS.indexOf(signo), a = SIGNOS.indexOf(ascendente);
  if (s < 0 || a < 0) return null;
  return ((s - a + 12) % 12) + 1;
}

/**
 * Frases do bloco de Signos.
 * @returns {string[]} 1 ou 2 frases
 */
export function frasesSigno({ nome = '', signoPost, sol, ascendente = null }) {
  const casa = ascendente ? casaDoSigno(signoPost, ascendente) : null;
  if (casa) {
    const frases = [comNome(nome, `Com Ascendente em ${ascendente}, ${signoPost} cai na sua casa ${casa}: ${CASAS[casa - 1]}.`)];
    frases.push(sol === signoPost ? `E o seu Sol está em ${sol}: este post é sobre você.` : `O seu Sol está em ${sol}.`);
    return frases;
  }
  if (sol === signoPost) return [comNome(nome, `Seu Sol está em ${sol}: este post é sobre você.`), `Com a hora e a cidade de nascimento, o mapa mostra também em que casa ${signoPost} cai.`];
  return [comNome(nome, `Seu Sol está em ${sol}.`), `Pra saber em que casa ${signoPost} cai, o mapa usa a hora e a cidade de nascimento.`];
}

/** Primeira frase de um texto (pro resumo da carta do dia). */
export function primeiraFrase(texto = '') {
  const m = String(texto).match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : String(texto)).trim();
}
