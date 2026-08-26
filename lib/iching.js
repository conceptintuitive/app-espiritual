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
  {
    id: 'ceu', nome: 'Céu', linhas: [1, 1, 1],
    chave: 'força criativa e impulso de começar',
    essencia: 'o princípio ativo, o movimento que inicia sem esperar permissão ou condições ideais.',
    convite: 'dar o primeiro passo em algo que você vinha adiando, mesmo sem todas as respostas prontas.',
  },
  {
    id: 'lago', nome: 'Lago', linhas: [1, 1, 0],
    chave: 'abertura, troca e alegria compartilhada',
    essencia: 'a superfície que reflete e comunica, a alegria que nasce do contato genuíno com o outro.',
    convite: 'ter uma conversa franca — dizer o que sente antes de organizar demais o que vai falar.',
  },
  {
    id: 'fogo', nome: 'Fogo', linhas: [1, 0, 1],
    chave: 'clareza e luz sobre o que estava oculto',
    essencia: 'a percepção que ilumina, a capacidade de ver com nitidez o que antes estava confuso.',
    convite: 'nomear com clareza algo que você já percebeu, mas ainda não colocou em palavras.',
  },
  {
    id: 'trovao', nome: 'Trovão', linhas: [1, 0, 0],
    chave: 'movimento súbito e ruptura do que estava parado',
    essencia: 'o choque que desperta, a energia que quebra a inércia sem pedir licença.',
    convite: 'agir sobre o que estava parado, mesmo que o movimento pareça abrupto demais.',
  },
  {
    id: 'vento', nome: 'Vento', linhas: [0, 1, 1],
    chave: 'penetração gradual e influência silenciosa',
    essencia: 'o que entra devagar e se espalha sem confronto direto, a persistência suave.',
    convite: 'insistir com paciência em algo, sem forçar, deixando o tempo fazer parte do processo.',
  },
  {
    id: 'agua', nome: 'Água', linhas: [0, 1, 0],
    chave: 'profundidade e fluxo em meio ao obstáculo',
    essencia: 'o perigo atravessado com consciência, a capacidade de seguir em frente mesmo sem controlar tudo.',
    convite: 'continuar mesmo sem clareza total, confiando que o movimento em si já é orientação.',
  },
  {
    id: 'montanha', nome: 'Montanha', linhas: [0, 0, 1],
    chave: 'quietude e um limite que fortalece',
    essencia: 'a parada necessária, o limite que protege em vez de aprisionar.',
    convite: 'dizer não a algo, ou simplesmente parar antes de continuar só por inércia.',
  },
  {
    id: 'terra', nome: 'Terra', linhas: [0, 0, 0],
    chave: 'receptividade e capacidade de sustentar',
    essencia: 'o que acolhe e sustenta sem precisar se impor, a base que permite tudo crescer.',
    convite: 'ouvir mais do que falar, e confiar no que já está sendo construído em silêncio.',
  },
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

  const leituraMutante = temMutante
    ? 'Há uma linha em movimento nesta leitura — o que parece fixo hoje já está em transição por dentro.'
    : 'Configuração estável hoje — o convite é sustentar o que já está posto, não mudar de direção.';

  return { dateStr, superior, inferior, linhas, temMutante, posicaoMutante, leituraMutante };
}
