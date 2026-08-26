// lib/iching.js — Hexagrama do Dia (I Ching)
//
// Em vez de reproduzir os 64 hexagramas tradicionais (nomes e julgamentos
// clássicos, arriscado de citar de memória sem erro), a leitura é construída
// a partir dos 8 trigramas (Bagua) — atributos bem estabelecidos e simples —
// combinados dois a dois (superior + inferior = 8×8 = 64 hexagramas
// possíveis). O hexagrama do dia é determinístico a partir da data (fuso de
// Brasília), então todo mundo que visita no mesmo dia vê o mesmo resultado —
// sem custo de IA, sem tabela de conteúdo pra manter.
//
// Formato do payload (texto + favorece + cuidado) espelha de propósito o
// mesmo formato já usado em "Previsão do Ano" (ver app/previsao-do-ano) —
// é o padrão que já funciona no produto pra transformar leitura simbólica
// em algo que dá pra usar de verdade, não só descrever.

export const TRIGRAMAS = [
  {
    id: 'ceu', nome: 'Céu', linhas: [1, 1, 1],
    essencia: 'Céu é o princípio ativo: o impulso que começa sem esperar permissão ou condições ideais.',
    favorece: 'Dar o primeiro passo em algo que você vinha adiando',
    cuidado: 'Pressa: começar coisas novas sem sustentar o que já está em andamento',
  },
  {
    id: 'lago', nome: 'Lago', linhas: [1, 1, 0],
    essencia: 'Lago é a superfície que reflete e comunica: a alegria que nasce do contato genuíno com o outro.',
    favorece: 'Ter uma conversa franca, dizendo o que sente antes de calcular a resposta',
    cuidado: 'Dispersão: falar demais e ouvir de menos',
  },
  {
    id: 'fogo', nome: 'Fogo', linhas: [1, 0, 1],
    essencia: 'Fogo é a percepção que ilumina: a clareza que aparece sobre o que antes estava confuso.',
    favorece: 'Nomear com palavras algo que você já percebeu, mas ainda não disse',
    cuidado: 'Exposição precoce: mostrar demais antes da hora certa',
  },
  {
    id: 'trovao', nome: 'Trovão', linhas: [1, 0, 0],
    essencia: 'Trovão é o choque que desperta: a energia que quebra a inércia sem pedir licença.',
    favorece: 'Agir sobre o que estava parado, mesmo sem sentir 100% de certeza',
    cuidado: 'Impulsividade: decidir rápido demais no calor do momento',
  },
  {
    id: 'vento', nome: 'Vento', linhas: [0, 1, 1],
    essencia: 'Vento é a influência que entra devagar: a persistência suave que se espalha sem confronto direto.',
    favorece: 'Insistir com paciência em algo, sem forçar o resultado',
    cuidado: 'Indecisão: adiar demais esperando o momento perfeito',
  },
  {
    id: 'agua', nome: 'Água', linhas: [0, 1, 0],
    essencia: 'Água é o perigo atravessado com consciência: a capacidade de seguir em frente mesmo sem controlar tudo.',
    favorece: 'Continuar mesmo sem clareza total, confiando que o movimento já é orientação',
    cuidado: 'Sobrecarga emocional: carregar mais do que cabe hoje',
  },
  {
    id: 'montanha', nome: 'Montanha', linhas: [0, 0, 1],
    essencia: 'Montanha é a parada necessária: o limite que protege em vez de aprisionar.',
    favorece: 'Dizer não a algo, ou simplesmente parar antes de continuar só por inércia',
    cuidado: 'Rigidez: fechar-se demais e recusar ajuda genuína',
  },
  {
    id: 'terra', nome: 'Terra', linhas: [0, 0, 0],
    essencia: 'Terra é o que acolhe e sustenta: a base que permite tudo crescer, sem precisar se impor.',
    favorece: 'Ouvir mais do que falar, confiando no que já está sendo construído em silêncio',
    cuidado: 'Passividade: esperar demais que a solução venha de fora',
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

  const texto = `${superior.essencia} ${inferior.essencia}`;
  const favorece = [superior.favorece, inferior.favorece];
  const cuidado = [superior.cuidado, inferior.cuidado];
  const leituraMutante = temMutante
    ? 'Há uma linha em movimento nesta leitura — o que parece fixo hoje já está em transição por dentro.'
    : 'Configuração estável hoje — o convite é sustentar o que já está posto, não mudar de direção.';

  return { dateStr, superior, inferior, linhas, temMutante, posicaoMutante, texto, favorece, cuidado, leituraMutante };
}
