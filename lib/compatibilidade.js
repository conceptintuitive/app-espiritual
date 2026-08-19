// lib/compatibilidade.js
// Motor de compatibilidade entre signos — usado pela Compatibilidade pública
// (/compatibilidade) e pela seção personalizada de 5 pontos dentro do manual pago.
// Regras fixas (sem IA): elemento + modalidade decidem a pontuação e o texto.

export const SIGNOS = [
  { nome: 'Áries',       simbolo: '♈', elemento: 'Fogo',  modalidade: 'Cardinal', traco: 'iniciativa e impulso' },
  { nome: 'Touro',       simbolo: '♉', elemento: 'Terra', modalidade: 'Fixo',     traco: 'estabilidade e prazer' },
  { nome: 'Gêmeos',      simbolo: '♊', elemento: 'Ar',    modalidade: 'Mutável',  traco: 'curiosidade e comunicação' },
  { nome: 'Câncer',      simbolo: '♋', elemento: 'Água',  modalidade: 'Cardinal', traco: 'cuidado e memória emocional' },
  { nome: 'Leão',        simbolo: '♌', elemento: 'Fogo',  modalidade: 'Fixo',     traco: 'brilho e lealdade' },
  { nome: 'Virgem',      simbolo: '♍', elemento: 'Terra', modalidade: 'Mutável',  traco: 'precisão e cuidado prático' },
  { nome: 'Libra',       simbolo: '♎', elemento: 'Ar',    modalidade: 'Cardinal', traco: 'equilíbrio e parceria' },
  { nome: 'Escorpião',   simbolo: '♏', elemento: 'Água',  modalidade: 'Fixo',     traco: 'intensidade e verdade' },
  { nome: 'Sagitário',   simbolo: '♐', elemento: 'Fogo',  modalidade: 'Mutável',  traco: 'expansão e liberdade' },
  { nome: 'Capricórnio', simbolo: '♑', elemento: 'Terra', modalidade: 'Cardinal', traco: 'disciplina e ambição' },
  { nome: 'Aquário',     simbolo: '♒', elemento: 'Ar',    modalidade: 'Fixo',     traco: 'originalidade e visão coletiva' },
  { nome: 'Peixes',      simbolo: '♓', elemento: 'Água',  modalidade: 'Mutável',  traco: 'sensibilidade e intuição' },
];

function findSigno(nome) {
  return SIGNOS.find((s) => s.nome.toLowerCase() === String(nome ?? '').toLowerCase()) || null;
}

// Pontuação base por par de elementos (0-100), matriz simétrica
const ELEMENTO_SCORE = {
  'Fogo|Fogo': 90, 'Fogo|Ar': 85, 'Fogo|Terra': 60, 'Fogo|Água': 55,
  'Terra|Terra': 88, 'Terra|Água': 84, 'Terra|Ar': 58,
  'Ar|Ar': 82, 'Ar|Água': 56,
  'Água|Água': 87,
};

function elementoScore(elA, elB) {
  const key1 = `${elA}|${elB}`;
  const key2 = `${elB}|${elA}`;
  return ELEMENTO_SCORE[key1] ?? ELEMENTO_SCORE[key2] ?? 65;
}

// Frases por combinação de elemento (headline + corpo), reaproveitadas para qualquer par de signos daqueles elementos
const ELEMENTO_TEXTO = {
  'Fogo|Fogo': {
    headline: 'Duas chamas que se alimentam',
    corpo: (a, b) => `${a} e ${b} se entendem na velocidade — os dois quereM agir, não esperar. O risco é a combinação virar competição por quem lidera; o ganho, quando cada um cede espaço, é uma energia que não esfria.`,
  },
  'Fogo|Ar': {
    headline: 'A chama e o vento que a espalha',
    corpo: (a, b) => `${a} traz a faísca, ${b} traz o movimento que a mantém acesa. Combinação naturalmente leve — o cuidado é não deixar tudo virar ideia sem chão, já que nenhum dos dois puxa muito pra prática.`,
  },
  'Fogo|Terra': {
    headline: 'A chama que precisa aprender a não queimar o chão',
    corpo: (a, b) => `${a} quer avançar rápido, ${b} quer construir com segurança — o atrito inicial costuma virar complementaridade quando os dois entendem que velocidade e solidez não competem, se somam.`,
  },
  'Fogo|Água': {
    headline: 'Fogo e água — ou apagam, ou evaporam um no outro',
    corpo: (a, b) => `${a} age primeiro e sente depois; ${b} sente primeiro e demora pra agir. É a combinação que mais exige paciência das duas, mas também a que mais ensina — quando funciona, uma intensidade rara.`,
  },
  'Terra|Terra': {
    headline: 'Duas raízes no mesmo solo',
    corpo: (a, b) => `${a} e ${b} falam a mesma língua prática — constância, resultado, confiança que se prova com o tempo. O risco é a rotina virar zona de conforto demais; o ganho é uma base que raramente racha.`,
  },
  'Terra|Água': {
    headline: 'A terra que dá forma ao que a água sente',
    corpo: (a, b) => `${b} sente fundo, ${a} sustenta com estrutura — uma das combinações mais estáveis do mapa, desde que ${a} não sufoque o que ${b} precisa sentir sem explicação.`,
  },
  'Terra|Ar': {
    headline: 'Chão e vento em ritmos diferentes',
    corpo: (a, b) => `${a} quer plano e previsibilidade, ${b} quer variedade e ideias novas — funciona quando um empresta ao outro o que falta, trava quando cada um insiste no próprio ritmo.`,
  },
  'Ar|Ar': {
    headline: 'Duas mentes no mesmo vento',
    corpo: (a, b) => `${a} e ${b} se conectam pela conversa antes de qualquer outra coisa — trocam ideia com facilidade rara. O ponto cego é o vínculo ficar mais mental do que sentido de verdade.`,
  },
  'Ar|Água': {
    headline: 'O vento que tenta entender a maré',
    corpo: (a, b) => `${a} processa com lógica, ${b} processa com sentimento — línguas diferentes que, traduzidas com paciência, se completam mais do que parecem à primeira vista.`,
  },
  'Água|Água': {
    headline: 'Duas correntes que se encontram',
    corpo: (a, b) => `${a} e ${b} se entendem sem precisar de muita palavra — intuição reconhecendo intuição. O cuidado é não afundar junto quando os dois estão mal ao mesmo tempo.`,
  },
};

function modalidadeAjuste(modA, modB) {
  return modA === modB ? -4 : 4;
}

export function getCompatibilidade(nomeSignoA, nomeSignoB) {
  const a = findSigno(nomeSignoA);
  const b = findSigno(nomeSignoB);
  if (!a || !b) return null;

  const base = elementoScore(a.elemento, b.elemento);
  const ajuste = modalidadeAjuste(a.modalidade, b.modalidade);
  const score = Math.max(40, Math.min(97, base + ajuste));

  const key1 = `${a.elemento}|${b.elemento}`;
  const key2 = `${b.elemento}|${a.elemento}`;
  const par = ELEMENTO_TEXTO[key1] || ELEMENTO_TEXTO[key2];
  const [x, y] = ELEMENTO_TEXTO[key1] ? [a, b] : [b, a];

  return {
    signoA: a,
    signoB: b,
    score,
    headline: par.headline,
    corpo: par.corpo(x.nome, y.nome),
  };
}

export function getTopMatches(nomeSigno, limite = 3) {
  const alvo = findSigno(nomeSigno);
  if (!alvo) return [];
  return SIGNOS
    .filter((s) => s.nome !== alvo.nome)
    .map((s) => ({ signo: s, ...getCompatibilidade(alvo.nome, s.nome) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limite);
}
