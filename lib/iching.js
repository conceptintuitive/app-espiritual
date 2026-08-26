// lib/iching.js — Hexagrama do Dia (I Ching)
//
// Em vez de reproduzir os 64 hexagramas tradicionais (nomes e julgamentos
// clássicos, arriscado de citar de memória sem erro), a leitura é construída
// a partir dos 8 trigramas (Bagua) — atributos bem estabelecidos e simples —
// combinados dois a dois (superior + inferior = 8×8 = 64 hexagramas
// possíveis). O hexagrama do dia é determinístico a partir da data (fuso de
// Brasília), então todo mundo que visita no mesmo dia vê o mesmo resultado —
// sem custo de IA, sem tabela de conteúdo pra manter.

export const TRIGRAMAS = [
  { id: 'ceu',      nome: 'Céu',      linhas: [1, 1, 1], chave: 'força criativa e impulso de começar' },
  { id: 'lago',     nome: 'Lago',     linhas: [1, 1, 0], chave: 'abertura, troca e alegria compartilhada' },
  { id: 'fogo',     nome: 'Fogo',     linhas: [1, 0, 1], chave: 'clareza e luz sobre o que estava oculto' },
  { id: 'trovao',   nome: 'Trovão',   linhas: [1, 0, 0], chave: 'movimento súbito e ruptura do que estava parado' },
  { id: 'vento',    nome: 'Vento',    linhas: [0, 1, 1], chave: 'penetração gradual e influência silenciosa' },
  { id: 'agua',     nome: 'Água',     linhas: [0, 1, 0], chave: 'profundidade e fluxo em meio ao obstáculo' },
  { id: 'montanha', nome: 'Montanha', linhas: [0, 0, 1], chave: 'quietude e um limite que fortalece' },
  { id: 'terra',    nome: 'Terra',    linhas: [0, 0, 0], chave: 'receptividade e capacidade de sustentar' },
];

function _seedFromDate(dateStr) {
  let h = 0;
  for (const c of dateStr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Hexagrama do dia — determinístico pela data (America/Sao_Paulo), então é
 * o mesmo pra todo visitante naquele dia e muda sozinho à meia-noite.
 * @param {Date} [date]
 */
export function hexagramaDoDia(date = new Date()) {
  const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
  const seed = _seedFromDate(dateStr);

  const superior = TRIGRAMAS[seed % TRIGRAMAS.length];
  const inferior = TRIGRAMAS[Math.floor(seed / TRIGRAMAS.length) % TRIGRAMAS.length];
  const linhas = [...inferior.linhas, ...superior.linhas]; // 6 linhas, de baixo pra cima

  const temMutante = seed % 3 === 0; // ~1/3 dos dias tem linha em movimento
  const posicaoMutante = temMutante ? Math.floor(seed / (TRIGRAMAS.length * TRIGRAMAS.length)) % 6 : null;

  const significado = `${superior.nome} sobre ${inferior.nome}: ${superior.chave}, apoiado em ${inferior.chave}.`;
  const leituraMutante = temMutante
    ? 'Há uma linha em movimento nesta leitura — o que parece fixo hoje já está em transição por dentro.'
    : 'Configuração estável hoje — o convite é sustentar o que já está posto, não mudar de direção.';

  return { dateStr, superior, inferior, linhas, temMutante, posicaoMutante, significado, leituraMutante };
}
