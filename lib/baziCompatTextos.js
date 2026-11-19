// lib/baziCompatTextos.js
// Textos fixos da compatibilidade BaZi (/astrologia-chinesa/compatibilidade).
// Escritos à mão, sem IA. Mesmo tom do Manual: afirmativo, específico, sem hedge.
// Cada função recebe o resultado de compatibilidadeBazi() + os nomes e devolve
// texto pronto — a página só monta o layout.

import { TRONCOS, RAMOS, ELEMENTOS, DEZ_DEUSES } from './bazi.js';
import { TEXTO_DEUSES } from './baziTextos.js';

const el = (i) => ELEMENTOS[i].nome;
const dmNome = (t) => `${ELEMENTOS[TRONCOS[t].elemento].nome} ${TRONCOS[t].yang ? 'Yang' : 'Yin'}`;

export const NIVEL_COMPAT = {
  raro: {
    titulo: 'Encaixe raro',
    texto: 'Os dois mapas se procuram em vários níveis ao mesmo tempo. Não é ausência de atrito — é a sensação de "a gente se entende sem esforço" que pouca gente encontra.',
  },
  forte: {
    titulo: 'Combinação forte',
    texto: 'Tem mais força puxando vocês juntos do que separando. Os pontos de atrito existem, mas são do tipo que dá para administrar quando os dois sabem onde estão.',
  },
  bom: {
    titulo: 'Boa, com ajustes',
    texto: 'Uma relação que funciona na base do acordo: vocês se completam em algumas áreas e se estranham em outras. Dá certo quando cada um entende o mapa do outro em vez de esperar que ele mude.',
  },
  desafiador: {
    titulo: 'Combinação desafiadora',
    texto: 'Os mapas puxam para lados diferentes em pontos importantes. Isso não condena nada — gera muita química e muito aprendizado — mas cobra mais maturidade dos dois do que a média.',
  },
};

// ── Day Masters ──────────────────────────────────────────────────────────────

/** Texto principal do encontro dos Day Masters. */
export function textoDiaMestre(c, a, b, nomeA, nomeB) {
  const tA = TRONCOS[a.diaMestre];
  const tB = TRONCOS[b.diaMestre];
  const par = `${nomeA} é ${dmNome(a.diaMestre)} (${tA.hanzi}) e ${nomeB} é ${dmNome(b.diaMestre)} (${tB.hanzi}).`;

  if (c.dm.combinacao !== null) {
    return `${par} Esses dois troncos formam uma das cinco combinações clássicas (合): juntos, se fundem em ${el(c.dm.combinacao)}. É a atração mais forte que existe entre dois Day Masters — vocês se reconhecem rápido, e a relação ganha uma identidade própria, maior do que cada um sozinho. O risco é o oposto do comum: se fundir tanto que cada um esquece o próprio eixo.`;
  }
  if (c.dm.choque) {
    const [forte, alvo] = c.dm.relacao === 'aControlaB' ? [nomeA, nomeB] : [nomeB, nomeA];
    return `${par} Esses troncos se chocam (冲): ${el(TRONCOS[c.dm.relacao === 'aControlaB' ? a.diaMestre : b.diaMestre].elemento)} corta ${el(TRONCOS[c.dm.relacao === 'aControlaB' ? b.diaMestre : a.diaMestre].elemento)}. É atração com fricção. ${forte} cobra, aponta e exige — e ${alvo} sente essa cobrança muito mais do que ${forte} percebe. Bem usado, ${forte} lapida ${alvo} e faz crescer; mal usado, vira corte. A diferença está no tom, não no conteúdo.`;
  }
  switch (c.dm.relacao) {
    case 'mesmo':
      return `${par} Mesmo elemento: vocês se espelham. Entendem o jeito um do outro sem explicação, têm o mesmo ritmo e as mesmas defesas. O desafio é que ninguém traz o que falta — e dois iguais disputam espaço quando os dois querem a mesma coisa.`;
    case 'aGeraB':
    case 'bGeraA': {
      const [nutre, nutrido] = c.dm.relacao === 'aGeraB' ? [nomeA, nomeB] : [nomeB, nomeA];
      return `${par} ${nutre} nutre ${nutrido}: o elemento de um alimenta o do outro. É uma relação de cuidado — ${nutrido} se sente apoiado e cresce perto de ${nutre}. O ponto de atenção é o fluxo de mão única: ${nutre} se cansa se só der, e precisa aprender a pedir.`;
    }
    default: {
      const [estrutura, estruturado] = c.dm.relacao === 'aControlaB' ? [nomeA, nomeB] : [nomeB, nomeA];
      if (!c.dm.mesmaPolaridade) {
        return `${par} ${estrutura} dá forma e limite a ${estruturado}, com polaridades opostas — a versão respeitosa do controle. Para ${estruturado}, ${estrutura} representa compromisso, direção e alguém para levar a sério. É uma das bases clássicas de casal duradouro no BaZi.`;
      }
      return `${par} ${estrutura} pressiona ${estruturado} com a mesma polaridade — no BaZi, isso é a energia das 7 Matanças (七杀). Atração intensa, cheia de desafio. ${estruturado} cresce muito perto de ${estrutura}, mas precisa de espaço para não se sentir encurralado.`;
    }
  }
}

/** "Para A, B é ..." — o Deus que cada Day Master representa para o outro. */
export function textoDeuses(c, nomeA, nomeB) {
  const d1 = DEZ_DEUSES[c.dm.bParaA];
  const d2 = DEZ_DEUSES[c.dm.aParaB];
  return [
    `Para ${nomeA}, ${nomeB} é ${d1.nome} (${d1.hanzi}) — ${TEXTO_DEUSES[c.dm.bParaA].curto}.`,
    `Para ${nomeB}, ${nomeA} é ${d2.nome} (${d2.hanzi}) — ${TEXTO_DEUSES[c.dm.aParaB].curto}.`,
  ];
}

// ── Palácio do cônjuge ───────────────────────────────────────────────────────

const PALACIO = {
  combinacao: 'Os dois palácios se combinam (六合): o que cada um busca na intimidade encaixa no que o outro oferece. É dos sinais mais claros de casal no BaZi — convivência fácil, vontade de construir junto.',
  trio: 'Os dois palácios são do mesmo trio (三合): mesma "turma", mesmo jeito de viver a intimidade. A rotina a dois flui sem esforço.',
  choque: 'Os dois palácios se chocam (冲): animais opostos no zodíaco chinês. Muita química e muito movimento — e expectativas opostas sobre o dia a dia. Precisa de acordos explícitos sobre espaço, rotina e convivência.',
  punicao: 'Os dois palácios se punem (刑): atrito de cobrança. A intimidade vira campo de "quem tem razão" com facilidade. Cuidem do jeito de falar nas discussões.',
  dano: 'Os dois palácios se ferem (害): atrito discreto, de mal-entendido e mágoa guardada. O risco não é a briga — é o que fica sem ser dito.',
};

export function textoPalacio(c, nomeA, nomeB) {
  const [ra, rb] = c.palacio.ramos.map((r) => RAMOS[r]);
  const intro = `O ramo do dia é o "palácio do cônjuge" — como cada um vive a intimidade. ${nomeA} tem ${ra.animal} (${ra.hanzi}); ${nomeB} tem ${rb.animal} (${rb.hanzi}).`;
  if (c.palacio.mesmo) {
    return `${intro} O mesmo animal nos dois: vocês querem a mesma coisa de uma relação e reconhecem isso um no outro. A ressonância é forte — e os dois têm os mesmos pontos sensíveis.`;
  }
  if (!c.palacio.relacoes.length) {
    return `${intro} Entre esses dois não há combinação nem choque: os palácios convivem em paz, sem um puxar o outro. A conexão de vocês vem de outros pontos do mapa.`;
  }
  return `${intro} ${c.palacio.relacoes.map((r) => PALACIO[r]).join(' ')}`;
}

// ── Atração escondida ────────────────────────────────────────────────────────

export function textosOcultos(c, a, b, nomeA, nomeB) {
  const out = [];
  const um = (quem, outro, info, nQuem, nOutro) => {
    const t = TRONCOS[info.tronco];
    return `O Day Master de ${nQuem} (${TRONCOS[quem.diaMestre].hanzi}) combina com o ${t.hanzi} (${dmNome(info.tronco)}) escondido no palácio do cônjuge de ${nOutro}${info.principal ? ', e é a energia principal daquele ramo' : ''}. É uma atração por baixo da superfície: ${nQuem} se encaixa exatamente no que ${nOutro} guarda na intimidade.`;
  };
  if (c.oculta.aEmB) out.push(um(a, b, c.oculta.aEmB, nomeA, nomeB));
  if (c.oculta.bEmA) out.push(um(b, a, c.oculta.bEmA, nomeB, nomeA));
  return out;
}

// ── Clima / complemento ──────────────────────────────────────────────────────

const MOTIVO = {
  frio: (n) => `${n} nasceu no inverno chinês: o mapa é frio e pede Fogo — calor, entusiasmo, alguém que acenda.`,
  quente: (n) => `${n} nasceu no verão chinês: o mapa é quente e seco e pede Água — calma, profundidade, alguém que esfrie a cabeça.`,
  fraco: (n, e) => `O Day Master de ${n} nasceu precisando de apoio e pede ${e} — o elemento que o fortalece.`,
  forte: (n, e) => `O Day Master de ${n} nasceu com força de sobra e pede ${e} — um canal para gastar essa energia.`,
  falta: (n, e) => `O mapa de ${n} está equilibrado, e o elemento que mais falta é ${e}.`,
};
const SUPRE = {
  muito: (doa, rec, e) => `${doa} tem ${e} de sobra — supre isso com folga. Perto de ${doa}, o mapa de ${rec} se equilibra.`,
  algum: (doa, rec, e) => `${doa} tem mais ${e} do que ${rec} — supre em parte. Ajuda, sem resolver sozinho.`,
  pouco: (doa, rec, e) => `${doa} não tem ${e} sobrando para dar — essa necessidade de ${rec} vai ser suprida fora da relação (amigos, trabalho, rotina).`,
};

export function textosClima(c, nomeA, nomeB) {
  const linha = (s, rec, doa) => `${MOTIVO[s.motivo](rec, el(s.elemento))} ${SUPRE[s.nivel](doa, rec, el(s.elemento))}`;
  return [linha(c.clima.bSupreA, nomeA, nomeB), linha(c.clima.aSupreB, nomeB, nomeA)];
}

export function resumoClima(c) {
  const n = [c.clima.bSupreA.nivel, c.clima.aSupreB.nivel].filter((x) => x !== 'pouco').length;
  if (n === 2) return 'Um completa o outro: cada mapa tem o que o outro pede. No BaZi, isso pesa mais do que combinar de signo.';
  if (n === 1) return 'O complemento é de mão única: um supre o outro, mas o contrário não acontece com a mesma força.';
  return 'Nenhum dos dois traz o que o outro mais pede — a relação se apoia em outros pontos, não no equilíbrio de elementos.';
}

// ── Animais do ano ───────────────────────────────────────────────────────────

const ANIMAIS_REL = {
  combinacao: 'combinam (六合) — afinidade social e de valores, se dão bem na frente dos outros',
  trio: 'são do mesmo trio (三合) — mesmo "time", visão de mundo parecida',
  choque: 'se chocam (冲) — visões de mundo opostas, o que atrai e também cansa',
  punicao: 'se punem (刑) — implicância e cobrança em temas de família e imagem',
  dano: 'se ferem (害) — pequenos ressentimentos em temas de família e círculo social',
};

export function textoAnimais(c, nomeA, nomeB) {
  const [ra, rb] = c.animais.ramos.map((r) => RAMOS[r]);
  if (c.animais.mesmo) {
    return `${nomeA} e ${nomeB} são do mesmo animal (${ra.animal}): mesma geração de valores, mesmo jeito de se mostrar para o mundo. É a camada mais visível — e a menos profunda.`;
  }
  if (!c.animais.relacoes.length) {
    return `${ra.animal} e ${rb.animal}: sem combinação nem choque entre os animais do ano. Na camada social vocês convivem bem, sem grandes atrações nem atritos.`;
  }
  return `${ra.animal} e ${rb.animal} ${c.animais.relacoes.map((r) => ANIMAIS_REL[r]).join('; e ')}. É a camada que todo mundo conhece, mas no BaZi ela é a menos importante: fala de imagem social, não de intimidade.`;
}

// ── Cruzamentos entre pilares ────────────────────────────────────────────────

const AREA = { ano: 'imagem e família', mes: 'trabalho e rotina', dia: 'intimidade', hora: 'projetos e futuro' };
const POS = { ano: 'Ano', mes: 'Mês', dia: 'Dia', hora: 'Hora' };

export function textoCruzada(x, nomeA, nomeB) {
  const onde = `${POS[x.posA]} de ${nomeA} × ${POS[x.posB]} de ${nomeB}`;
  const areas = AREA[x.posA] === AREA[x.posB] ? AREA[x.posA] : `${AREA[x.posA]} × ${AREA[x.posB]}`;
  switch (x.tipo) {
    case 'combinacaoTronco':
      return { positivo: true, titulo: `${TRONCOS[x.troncos[0]].hanzi} + ${TRONCOS[x.troncos[1]].hanzi} → ${el(x.elemento)}`, onde, texto: `Troncos que se combinam (合): afinidade em ${areas}.` };
    case 'choqueTronco':
      return { positivo: false, titulo: `${TRONCOS[x.troncos[0]].hanzi} × ${TRONCOS[x.troncos[1]].hanzi}`, onde, texto: `Troncos que se chocam (冲): opiniões opostas em ${areas}.` };
    default: {
      const nomes = `${RAMOS[x.ramos[0]].animal} + ${RAMOS[x.ramos[1]].animal}`;
      const map = {
        combinacao: [true, 'Combinação (六合)', `vocês se completam em ${areas}`],
        trio: [true, 'Trio (三合)', `mesmo time em ${areas}`],
        choque: [false, 'Choque (冲)', `movimento e tensão em ${areas}`],
        punicao: [false, 'Punição (刑)', `cobrança e atrito em ${areas}`],
        dano: [false, 'Dano (害)', `mal-entendidos em ${areas}`],
      }[x.tipo];
      return { positivo: map[0], titulo: `${nomes} — ${map[1]}`, onde, texto: `${map[2].charAt(0).toUpperCase()}${map[2].slice(1)}.` };
    }
  }
}

// ── Resumo: a favor x atrito ─────────────────────────────────────────────────

/** Listas curtas pro topo do resultado. */
export function pontosResumo(c, nomeA, nomeB) {
  const favor = [];
  const atrito = [];

  if (c.dm.combinacao !== null) favor.push(`Os Day Masters se combinam (合) — atração de base.`);
  else if (c.dm.choque) atrito.push(`Os Day Masters se chocam (冲) — cobrança e crítica pesam mais do que parece.`);
  else if (c.dm.relacao === 'aGeraB' || c.dm.relacao === 'bGeraA') favor.push(`Um Day Master nutre o outro — relação de cuidado.`);
  else if (c.dm.relacao === 'mesmo') favor.push(`Mesmo elemento no centro — vocês se entendem sem explicar.`);
  else if (!c.dm.mesmaPolaridade) favor.push(`Um dá estrutura ao outro, com polaridades opostas — base de compromisso.`);
  else atrito.push(`Um Day Master pressiona o outro (7 Matanças) — intensidade que precisa de espaço.`);

  if (c.palacio.mesmo) favor.push(`Mesmo animal no palácio do cônjuge — querem a mesma coisa da intimidade.`);
  for (const r of c.palacio.relacoes) {
    if (r === 'combinacao' || r === 'trio') favor.push(`Os palácios do cônjuge se combinam — convivência fácil.`);
    else atrito.push(`Os palácios do cônjuge se ${r === 'choque' ? 'chocam' : r === 'punicao' ? 'punem' : 'ferem'} — a rotina a dois pede acordos.`);
  }

  if (c.oculta.aEmB || c.oculta.bEmA) favor.push(`Atração escondida: ${c.oculta.aEmB && c.oculta.bEmA ? 'os dois combinam' : 'um combina'} com o que o outro guarda no palácio do cônjuge.`);

  const n = [c.clima.bSupreA, c.clima.aSupreB].filter((s) => s.nivel !== 'pouco').length;
  if (n === 2) favor.push(`Um completa o outro: cada mapa tem o elemento que o outro pede.`);
  else if (n === 1) favor.push(`${c.clima.bSupreA.nivel !== 'pouco' ? nomeB : nomeA} traz o elemento que ${c.clima.bSupreA.nivel !== 'pouco' ? nomeA : nomeB} pede.`);

  if ([c.clima.bSupreA, c.clima.aSupreB].some((s) => s.motivo === 'quente') && [c.clima.bSupreA, c.clima.aSupreB].some((s) => s.elemento === 1 && s.nivel === 'muito')) {
    atrito.push(`Muito Fogo somado nos dois mapas — o que aquece também pode sufocar.`);
  }

  for (const r of c.animais.relacoes) {
    if (r === 'combinacao' || r === 'trio') favor.push(`Os animais do ano combinam — afinidade social.`);
    if (r === 'choque') atrito.push(`Os animais do ano se chocam — visões de mundo opostas.`);
  }

  return { favor, atrito };
}

/** Linha final, pra fechar o resultado. */
export function conselhoFinal(c, nomeA, nomeB) {
  if (c.dm.choque) {
    const quemCobra = c.dm.relacao === 'aControlaB' ? nomeA : nomeB;
    return `O mapa diz que isso funciona enquanto a crítica de ${quemCobra} chegar como apoio, não como corte.`;
  }
  if (c.palacio.relacoes.includes('choque')) return 'O mapa diz que isso funciona com acordos claros sobre rotina e espaço — combinados antes de virarem briga.';
  if (c.dm.combinacao !== null) return 'O mapa diz que isso funciona enquanto cada um mantiver uma vida própria fora do "nós".';
  if (c.dm.relacao === 'mesmo') return 'O mapa diz que isso funciona quando vocês deixam de competir e dividem os papéis.';
  return 'O mapa diz que isso funciona quando cada um entende o que o outro pede — e entrega isso sem precisar ser cobrado.';
}
