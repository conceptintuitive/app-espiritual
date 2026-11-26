// lib/mapaSintese.js — todos os sistemas de uma pessoa juntos + a síntese
// cruzada (onde eles concordam e onde puxam pra lados opostos).
//
// Usado pela faixa "Você também é…" (app/components/VoceTambem.js) e pela aba
// "Meu Mapa" do Seu Dia. Puro (sem window): roda no browser e nos testes.
//
// Cada sistema vota em 1–2 temas (tabelas abaixo, escolhidas pelo significado
// tradicional de cada signo/número/elemento/selo/anjo). Tema com 2+ votos =
// "o que seu mapa repete". Tensão = par de temas opostos que aparecem juntos.
// `eu` = a mesma ideia em primeira pessoa, curta (card do story).

import { calcularSigno, calcularNumeroVida, calcularSignoSolar } from './calculos.js';
import { utcOffsetHoras } from './sky.js';
import { calcularBazi, TRONCOS, RAMOS, ELEMENTOS } from './bazi.js';
import { calcularAnjos, dadosDoAnjo } from './anjos.js';
import { TEXTO_ANJO } from './anjosTextos.js';
import { calcularKin } from './kin.js';
import { TEXTO_SELO } from './kinTextos.js';

export const TEMAS = {
  construir: { nome: 'Construir', frase: 'Você veio pra construir coisas que duram: estrutura, constância e resultado concreto.', eu: 'Eu vim pra construir coisas que duram.' },
  criar: { nome: 'Criar', frase: 'Você veio pra criar e se expressar: ideias, beleza, coisas que ainda não existiam.', eu: 'Eu vim pra criar o que ainda não existe.' },
  cuidar: { nome: 'Cuidar', frase: 'Você veio pra cuidar: nutrir pessoas, projetos e vínculos.', eu: 'Eu vim pra cuidar de gente, de projetos e de vínculos.' },
  liderar: { nome: 'Liderar', frase: 'Você veio pra liderar: abrir caminho, decidir e ir na frente.', eu: 'Eu vim pra abrir caminho e ir na frente.' },
  saber: { nome: 'Saber', frase: 'Você veio pra entender as coisas a fundo e ensinar o que aprendeu.', eu: 'Eu vim pra entender as coisas a fundo.' },
  intuir: { nome: 'Intuir', frase: 'Você é guiada(o) pela intuição: sente antes de saber, e costuma acertar.', eu: 'Eu sinto antes de saber, e costumo acertar.' },
  transformar: { nome: 'Transformar', frase: 'Você veio pra transformar: renascer, mudar e fazer os outros mudarem.', eu: 'Eu vim pra mudar, e fazer mudar.' },
  conectar: { nome: 'Conectar', frase: 'Você veio pra conectar: pessoas, ideias e mundos diferentes.', eu: 'Eu vim pra ligar pessoas e mundos diferentes.' },
  liberdade: { nome: 'Liberdade', frase: 'Você veio pra explorar: movimento, horizonte e independência.', eu: 'Eu vim pra explorar: movimento e horizonte.' },
  ordem: { nome: 'Verdade e ordem', frase: 'Você veio pra pôr ordem no caos e defender o que é justo.', eu: 'Eu vim pra pôr ordem no caos.' },
};

const TEMA_SIGNO = {
  'Áries': ['liderar', 'liberdade'], 'Touro': ['construir', 'cuidar'], 'Gêmeos': ['conectar', 'saber'],
  'Câncer': ['cuidar', 'intuir'], 'Leão': ['liderar', 'criar'], 'Virgem': ['construir', 'ordem'],
  'Libra': ['conectar', 'criar'], 'Escorpião': ['transformar', 'intuir'], 'Sagitário': ['liberdade', 'saber'],
  'Capricórnio': ['construir', 'liderar'], 'Aquário': ['liberdade', 'transformar'], 'Peixes': ['intuir', 'cuidar'],
};

const TEMA_NUMERO = {
  1: ['liderar'], 2: ['conectar', 'cuidar'], 3: ['criar', 'conectar'], 4: ['construir', 'ordem'], 5: ['liberdade', 'transformar'],
  6: ['cuidar'], 7: ['saber', 'intuir'], 8: ['liderar', 'construir'], 9: ['cuidar', 'transformar'],
  11: ['intuir', 'conectar'], 22: ['construir', 'liderar'], 33: ['cuidar', 'criar'],
};

// Elemento do Day Master (índice de ELEMENTOS: Madeira, Fogo, Terra, Metal, Água).
const TEMA_ELEMENTO = [['criar', 'liberdade'], ['liderar', 'criar'], ['construir', 'cuidar'], ['ordem', 'construir'], ['intuir', 'saber']];

// Selo do Kin (código 1–20).
const TEMA_SELO = {
  1: 'cuidar', 2: 'conectar', 3: 'intuir', 4: 'construir', 5: 'transformar', 6: 'transformar', 7: 'cuidar', 8: 'criar',
  9: 'intuir', 10: 'cuidar', 11: 'criar', 12: 'saber', 13: 'liberdade', 14: 'intuir', 15: 'saber', 16: 'liderar',
  17: 'intuir', 18: 'ordem', 19: 'transformar', 20: 'liderar',
};

// Anjo (1–72), pelo dom de cada um em lib/anjosTextos.js.
const TEMA_ANJO = [null,
  'liderar', 'conectar', 'construir', 'liberdade', 'ordem', 'criar', 'saber', 'construir', 'cuidar', 'transformar',
  'liderar', 'intuir', 'conectar', 'ordem', 'ordem', 'liderar', 'intuir', 'ordem', 'saber', 'intuir',
  'saber', 'conectar', 'cuidar', 'cuidar', 'intuir', 'conectar', 'liberdade', 'construir', 'transformar', 'construir',
  'construir', 'ordem', 'ordem', 'ordem', 'cuidar', 'construir', 'transformar', 'intuir', 'cuidar', 'criar',
  'liderar', 'ordem', 'construir', 'liderar', 'transformar', 'intuir', 'saber', 'conectar', 'cuidar', 'conectar',
  'transformar', 'transformar', 'saber', 'construir', 'ordem', 'criar', 'liderar', 'liderar', 'saber', 'cuidar',
  'conectar', 'saber', 'conectar', 'criar', 'cuidar', 'intuir', 'transformar', 'cuidar', 'ordem', 'transformar',
  'liderar', 'transformar',
];

// Pares opostos: a ordem não importa. `frase` = a tensão (aberta pra todos);
// `conselho` = o que fazer (só pra quem tem o Manual); `texto` = os dois juntos.
export const TENSOES = [
  { a: 'liberdade', b: 'construir', frase: 'Uma parte de você quer raiz e estabilidade; outra quer estrada.', conselho: 'O equilíbrio é construir algo que te dê liberdade, não uma prisão.', eu: 'Uma parte de mim quer raiz. A outra quer estrada.' },
  { a: 'transformar', b: 'construir', frase: 'Você constrói e, de tempos em tempos, precisa derrubar pra recomeçar.', conselho: 'Não é falta de constância: é o seu ciclo.', eu: 'Eu construo e, de tempos em tempos, derrubo tudo pra recomeçar.' },
  { a: 'intuir', b: 'ordem', frase: 'Sua cabeça pede lógica e regra; seu corpo sabe antes.', conselho: 'Quando os dois discordarem, decida pela intuição e use a razão pra executar.', eu: 'Minha cabeça pede lógica. Meu corpo sabe antes.' },
  { a: 'liderar', b: 'cuidar', frase: 'Você quer comandar e quer proteger. O risco é carregar todo mundo nas costas.', conselho: 'Lidere cuidando — e deixe que cuidem de você.', eu: 'Eu quero comandar e quero proteger.' },
  { a: 'conectar', b: 'saber', frase: 'Você precisa de gente e precisa de silêncio.', conselho: 'Os dois são necessidade, não contradição: alterne sem culpa.', eu: 'Eu preciso de gente. E preciso de silêncio.' },
  { a: 'liberdade', b: 'cuidar', frase: 'Você quer voar e quer cuidar de quem ama.', conselho: 'Liberdade com vínculo existe — só precisa ser combinada às claras.', eu: 'Eu quero voar e quero cuidar de quem eu amo.' },
  { a: 'criar', b: 'ordem', frase: 'Sua criatividade quer bagunça; seu senso de ordem quer controle.', conselho: 'Crie primeiro, organize depois — nunca os dois ao mesmo tempo.', eu: 'Minha criatividade quer bagunça. Meu senso de ordem quer controle.' },
];
for (const t of TENSOES) t.texto = `${t.frase} ${t.conselho}`;

const SLUG_SIGNO = {
  'Áries': 'aries', 'Touro': 'touro', 'Gêmeos': 'gemeos', 'Câncer': 'cancer', 'Leão': 'leao', 'Virgem': 'virgem',
  'Libra': 'libra', 'Escorpião': 'escorpiao', 'Sagitário': 'sagitario', 'Capricórnio': 'capricornio', 'Aquário': 'aquario', 'Peixes': 'peixes',
};

/**
 * Todos os sistemas da pessoa. Cada item: { chave, sistema, valor, sub, href, temas }.
 * `temas` vazio = não vota na síntese (ex.: Céu).
 * @param {{ dataNascimento: string, hora?: string|null, cidade?: { tz?: string, lon?: number }|null }} p
 */
export function sistemasDaPessoa({ dataNascimento, hora = null, cidade = null }) {
  const [, m, d] = dataNascimento.split('-').map(Number);
  const tz = cidade?.tz || 'America/Sao_Paulo';
  const out = [];

  // Sol real (a tabela fixa erra o dia da troca de signo); offset do fuso da cidade quando há hora.
  const offsetSol = hora ? utcOffsetHoras({ data: dataNascimento, hora, tz }) : null;
  const signo = calcularSignoSolar(dataNascimento, hora, offsetSol) || calcularSigno(d, m);
  out.push({ chave: 'signos', sistema: 'Signo solar', valor: signo, sub: 'O que move você', href: `/signos/${SLUG_SIGNO[signo]}`, temas: TEMA_SIGNO[signo] || [] });

  const numero = calcularNumeroVida(dataNascimento);
  out.push({ chave: 'numerologia', sistema: 'Número de vida', valor: String(numero), sub: 'Sua missão em números', href: `/numerologia/numero-${numero}`, temas: TEMA_NUMERO[numero] || [] });

  try {
    const mapa = calcularBazi({ data: dataNascimento, hora, tz, lon: typeof cidade?.lon === 'number' ? cidade.lon : null });
    const animal = RAMOS[mapa.ano.ramo].animal;
    const elemAno = ELEMENTOS[TRONCOS[mapa.ano.tronco].elemento].nome;
    const dm = TRONCOS[mapa.diaMestre];
    out.push({
      chave: 'astrologia-chinesa', sistema: 'Astrologia chinesa', valor: `${animal} de ${elemAno}`,
      sub: `Por dentro, você é ${ELEMENTOS[dm.elemento].nome} ${dm.yang ? 'Yang' : 'Yin'}`, href: '/astrologia-chinesa',
      temas: TEMA_ELEMENTO[dm.elemento],
    });
  } catch {}

  try {
    const a = calcularAnjos({ data: dataNascimento, hora, tz });
    const g = dadosDoAnjo(a.guardiao);
    out.push({ chave: 'anjo', sistema: 'Anjo da guarda', valor: g.nome, sub: TEXTO_ANJO[g.n].dom, href: '/anjo-da-guarda', temas: [TEMA_ANJO[g.n]] });
    if (a.mente) {
      const mt = dadosDoAnjo(a.mente);
      out.push({ chave: 'anjo-mente', sistema: 'Anjo da mente', valor: mt.nome, sub: TEXTO_ANJO[mt.n].dom, href: `/anjo-da-guarda/${mt.slug}`, temas: [TEMA_ANJO[mt.n]] });
    }
  } catch {}

  try {
    const k = calcularKin({ data: dataNascimento, hora });
    out.push({
      chave: 'kin-maia', sistema: `Kin Maia ${k.kin}`, valor: k.nome, sub: TEXTO_SELO[k.selo.codigo].palavras.join(' · '),
      href: '/kin-maia', temas: [TEMA_SELO[k.selo.codigo]],
    });
  } catch {}

  out.push({ chave: 'ceu', sistema: 'Céu do nascimento', valor: 'O seu céu', sub: 'As estrelas exatas da sua hora', href: '/ceu', temas: [] });
  return out;
}

/**
 * Síntese cruzada.
 * @returns {{ repete: Array<{ tema: string, nome: string, frase: string, sistemas: string[] }>,
 *   tensao: { a: string, b: string, nomeA: string, nomeB: string, texto: string, sistemasA: string[], sistemasB: string[] } | null,
 *   ranking: Array<{ tema: string, votos: number }> }}
 */
export function sinteseDoMapa(sistemas) {
  const votos = {};
  for (const s of sistemas) {
    for (const t of new Set(s.temas)) {
      if (!t) continue;
      (votos[t] ||= []).push(s.sistema);
    }
  }
  // Empate: ordem fixa de TEMAS (estável entre visitas).
  const ordem = Object.keys(TEMAS);
  const ranking = Object.entries(votos)
    .map(([tema, lista]) => ({ tema, votos: lista.length }))
    .sort((x, y) => y.votos - x.votos || ordem.indexOf(x.tema) - ordem.indexOf(y.tema));

  const repete = ranking.filter((r) => r.votos >= 2).slice(0, 2)
    .map((r) => ({ tema: r.tema, nome: TEMAS[r.tema].nome, frase: TEMAS[r.tema].frase, eu: TEMAS[r.tema].eu, sistemas: votos[r.tema] }));

  let tensao = null;
  let melhor = 0;
  for (const t of TENSOES) {
    if (!votos[t.a] || !votos[t.b]) continue;
    const peso = votos[t.a].length + votos[t.b].length;
    if (peso > melhor) {
      melhor = peso;
      tensao = { a: t.a, b: t.b, nomeA: TEMAS[t.a].nome, nomeB: TEMAS[t.b].nome, texto: t.texto, frase: t.frase, conselho: t.conselho, eu: t.eu, sistemasA: votos[t.a], sistemasB: votos[t.b] };
    }
  }
  return { repete, tensao, ranking };
}

// ── Prévia do Manual na aba Meu Mapa (quem ainda não tem o Manual) ─────────
// Títulos fixos por tema/tensão, sem IA: mostram o que o Manual do seu Mapa
// traz pra ESTA pessoa. O começo do texto aparece borrado (enfeite).

const NOME_CURTO = { ordem: 'Ordem' }; // "Verdade e ordem" não cabe numa frase
const curto = (t) => NOME_CURTO[t] || TEMAS[t].nome;

// "Seu jeito de amar como alguém que …"
const AMOR_TEMA = {
  construir: 'veio pra Construir', criar: 'veio pra Criar', cuidar: 'veio pra Cuidar', liderar: 'veio pra Liderar',
  saber: 'veio pra entender tudo a fundo', intuir: 'sente antes de saber', transformar: 'veio pra Transformar',
  conectar: 'veio pra Conectar', liberdade: 'precisa de Liberdade', ordem: 'veio pra pôr ordem no caos',
};
// "Onde … te faz ganhar (e perder) dinheiro"
const DINHEIRO_TEMA = {
  construir: 'a vontade de Construir', criar: 'a Criatividade', cuidar: 'o Cuidado com os outros', liderar: 'a Liderança',
  saber: 'a sede de Saber', intuir: 'a Intuição', transformar: 'a vontade de Transformar', conectar: 'a Conexão com as pessoas',
  liberdade: 'a Liberdade', ordem: 'a busca por Ordem',
};

/**
 * Três seções do Manual com o título personalizado pelos temas da pessoa.
 * @param {ReturnType<typeof sinteseDoMapa>} sintese
 * @returns {Array<{ chave: string, titulo: string, inicio: string }>}
 */
export function previaDoManual(sintese) {
  const t1 = sintese.repete[0]?.tema || sintese.ranking[0]?.tema || 'construir';
  const t2 = sintese.repete[1]?.tema || sintese.ranking[1]?.tema || t1;
  const tensao = sintese.tensao;
  const d = DINHEIRO_TEMA[t2];
  return [
    tensao
      ? { chave: 'tensao', titulo: `Por que você se divide entre ${curto(tensao.a)} e ${curto(tensao.b)}, e como parar de escolher`,
        inicio: 'Essa divisão aparece em mais de um sistema do seu mapa, e explica por que você começa num caminho e sente falta do outro logo depois.' }
      : { chave: 'repete', titulo: `Por que seu mapa repete ${curto(t1)}, e o que fazer com isso`,
        inicio: 'Quando vários sistemas apontam pro mesmo lugar, isso não é coincidência: é o eixo em volta do qual a sua vida gira.' },
    { chave: 'amor', titulo: `Seu jeito de amar como alguém que ${AMOR_TEMA[t1]}`,
      inicio: 'No amor, você chega com tudo e, quando sente que o outro não acompanha, faz um movimento que quase ninguém percebe.' },
    { chave: 'dinheiro', titulo: `Onde ${d} te faz ganhar (e perder) dinheiro`,
      inicio: `${d[0].toUpperCase()}${d.slice(1)} abre portas pra você no trabalho, e é a mesma coisa que faz o dinheiro escapar quando você menos espera.` },
  ];
}
