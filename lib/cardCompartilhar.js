// lib/cardCompartilhar.js
// Helpers do card de story (/api/card): validação dos parâmetros, escolha da
// frase e montagem das URLs. Sem imports pesados de propósito — a rota edge
// importa este arquivo, e puxar o manualgenerator inteiro pro bundle edge
// não vale a pena só pra ler uma frase.

export const SITE_URL = 'https://intuitiveconcept.com.br';
export const SITE_HOST = 'intuitiveconcept.com.br';

// Link que vai no texto do share (WhatsApp etc.). Não vai impresso na imagem:
// texto dentro de story não é clicável, então UTM impressa não rastreia nada.
export const LINK_QUIZ = `${SITE_URL}/?utm_source=share&utm_medium=card`;

export const MAX_FRASE = 60;

const NUMEROS_VALIDOS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);

export function numeroValido(n) {
  const num = Number(n);
  return NUMEROS_VALIDOS.has(num) ? num : null;
}

// Tira markdown/quebras, colapsa espaços e corta em MAX_FRASE sem partir
// palavra no meio. A rota aplica isso de novo, então a URL nunca consegue
// forçar um texto maior que o layout aguenta.
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
// 2) fallback curado (ex.: SIGNO_PROFUNDO[signo].frase), que já é curto.
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

export function urlDoCard(numero, frase) {
  const n = numeroValido(numero);
  if (!n) return null;
  const params = new URLSearchParams({ n: String(n), frase: limparFrase(frase) });
  return `/api/card?${params.toString()}`;
}
