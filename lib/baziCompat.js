// lib/baziCompat.js
// Compatibilidade BaZi entre dois mapas (sinastria chinesa). Lógica pura, sem
// dependências: recebe dois mapas de calcularBazi() e devolve os fatos do
// cruzamento + uma nota 0–100. Os textos ficam em lib/baziCompatTextos.js.
//
// O que pesa, do mais forte pro mais fraco:
// 1. Day Masters (tronco do dia): combinação (合) > geração > controle > choque (冲).
// 2. Palácio do cônjuge (ramo do dia de cada um): combinação/trio x choque/punição/dano.
// 3. Atração escondida: o Day Master de um combina com um tronco oculto no
//    palácio do cônjuge do outro.
// 4. Clima: o que cada mapa pede (inverno pede Fogo, verão pede Água; fora
//    dos extremos, o que equilibra a força do Day Master) e se o outro tem.
// 5. Animais do ano (a camada "popular").
// 6. Demais cruzamentos entre pilares (troncos que combinam, ramos que
//    combinam/chocam) — peso pequeno e limitado.
//
// Sem gênero de propósito: em vez de "estrela do marido/esposa", usamos o Deus
// que cada Day Master representa para o outro (serve pra qualquer casal).

import {
  TRONCOS, RAMOS, dezDeuses, relacoesRamos, combinacaoTroncos, contarElementos, forcaDiaMestre,
} from './bazi.js';

const POSICOES = ['ano', 'mes', 'dia', 'hora'];

/** Choque de troncos (天干冲): Jia–Geng, Yi–Xin, Bing–Ren, Ding–Gui. Terra não choca. */
export function choqueTroncos(a, b) {
  return Math.abs(a - b) === 6 && Math.min(a, b) <= 3;
}

/**
 * Relação entre os elementos de dois troncos, do ponto de vista de `a`.
 * @returns {'mesmo'|'aGeraB'|'aControlaB'|'bControlaA'|'bGeraA'}
 */
export function relacaoElementos(a, b) {
  const rel = (TRONCOS[b].elemento - TRONCOS[a].elemento + 5) % 5;
  return ['mesmo', 'aGeraB', 'aControlaB', 'bControlaA', 'bGeraA'][rel];
}

/**
 * Elemento que o mapa mais pede e por quê.
 * - Nascidos no inverno chinês (Porco, Rato, Boi) → Fogo: o mapa é frio.
 * - No verão (Serpente, Cavalo, Cabra) → Água: o mapa é quente e seco.
 * - Fora dos extremos: Day Master fraco pede o elemento que o gera; forte pede
 *   o que ele gera (escoamento); equilibrado pede o elemento que mais falta.
 * @returns {{ elemento: number, motivo: 'frio'|'quente'|'fraco'|'forte'|'falta' }}
 */
export function necessidadeDoMapa(mapa) {
  const ramoMes = mapa.mes.ramo;
  if ([11, 0, 1].includes(ramoMes)) return { elemento: 1, motivo: 'frio' };
  if ([5, 6, 7].includes(ramoMes)) return { elemento: 4, motivo: 'quente' };
  const eu = TRONCOS[mapa.diaMestre].elemento;
  const { nivel } = forcaDiaMestre(mapa);
  if (nivel === 'fraco') return { elemento: (eu + 4) % 5, motivo: 'fraco' };
  if (nivel === 'forte') return { elemento: (eu + 1) % 5, motivo: 'forte' };
  const pts = contarElementos(mapa);
  let menor = 0;
  for (let i = 1; i < 5; i++) if (pts[i] < pts[menor]) menor = i;
  return { elemento: menor, motivo: 'falta' };
}

/** Fração (0–1) do mapa ocupada por um elemento. */
function fracao(mapa, elemento) {
  const pts = contarElementos(mapa);
  const total = pts.reduce((s, v) => s + v, 0);
  return total ? pts[elemento] / total : 0;
}

/**
 * Quanto `doador` supre o que `receptor` pede.
 * @returns {{ elemento: number, motivo: string, nivel: 'muito'|'algum'|'pouco', fracaoDoador: number, fracaoReceptor: number }}
 */
export function suprimento(receptor, doador) {
  const nec = necessidadeDoMapa(receptor);
  const fd = fracao(doador, nec.elemento);
  const fr = fracao(receptor, nec.elemento);
  // Só conta como suprir se o outro tiver MAIS desse elemento do que você.
  let nivel = 'pouco';
  if (fd > fr) nivel = fd >= 0.25 ? 'muito' : fd >= 0.12 ? 'algum' : 'pouco';
  return { ...nec, nivel, fracaoDoador: fd, fracaoReceptor: fr };
}

/** O Day Master de `quem` combina com algum tronco oculto no palácio do cônjuge de `outro`? */
function atracaoOculta(quem, outro) {
  const ocultos = RAMOS[outro.dia.ramo].ocultos;
  const idx = ocultos.findIndex((t) => combinacaoTroncos(quem.diaMestre, t) !== null);
  return idx === -1 ? null : { tronco: ocultos[idx], principal: idx === 0 };
}

/**
 * Cruza os dois mapas.
 * @param {object} a mapa de calcularBazi() (pessoa 1)
 * @param {object} b mapa de calcularBazi() (pessoa 2)
 */
export function compatibilidadeBazi(a, b) {
  // ── 1. Day Masters ──
  const dmA = a.diaMestre;
  const dmB = b.diaMestre;
  const dm = {
    relacao: relacaoElementos(dmA, dmB),
    combinacao: combinacaoTroncos(dmA, dmB), // elemento gerado ou null
    choque: choqueTroncos(dmA, dmB),
    mesmaPolaridade: TRONCOS[dmA].yang === TRONCOS[dmB].yang,
    bParaA: dezDeuses(dmA, dmB), // o que B é para A
    aParaB: dezDeuses(dmB, dmA),
  };

  // ── 2. Palácio do cônjuge ──
  const palacio = {
    ramos: [a.dia.ramo, b.dia.ramo],
    mesmo: a.dia.ramo === b.dia.ramo,
    relacoes: relacoesRamos(a.dia.ramo, b.dia.ramo),
  };

  // ── 3. Atração escondida ──
  const oculta = { aEmB: atracaoOculta(a, b), bEmA: atracaoOculta(b, a) };

  // ── 4. Clima ──
  const clima = { bSupreA: suprimento(a, b), aSupreB: suprimento(b, a) };

  // ── 5. Animais do ano ──
  const animais = {
    ramos: [a.ano.ramo, b.ano.ramo],
    mesmo: a.ano.ramo === b.ano.ramo,
    relacoes: relacoesRamos(a.ano.ramo, b.ano.ramo),
  };

  // ── 6. Demais cruzamentos (fora dia×dia e ano×ano, já lidos acima) ──
  const cruzadas = [];
  for (const pa of POSICOES) {
    for (const pb of POSICOES) {
      const x = a[pa];
      const y = b[pb];
      if (!x || !y) continue;
      if (pa === 'dia' && pb === 'dia') continue;
      const elem = combinacaoTroncos(x.tronco, y.tronco);
      if (elem !== null) cruzadas.push({ tipo: 'combinacaoTronco', posA: pa, posB: pb, troncos: [x.tronco, y.tronco], elemento: elem });
      if (choqueTroncos(x.tronco, y.tronco)) cruzadas.push({ tipo: 'choqueTronco', posA: pa, posB: pb, troncos: [x.tronco, y.tronco] });
      if (pa === 'ano' && pb === 'ano') continue;
      for (const tipo of relacoesRamos(x.ramo, y.ramo)) {
        cruzadas.push({ tipo, posA: pa, posB: pb, ramos: [x.ramo, y.ramo] });
      }
    }
  }

  // ── Nota ──
  let nota = 55;

  if (dm.combinacao !== null) nota += 15;
  else if (dm.choque) nota -= 6;
  else if (dm.relacao === 'aGeraB' || dm.relacao === 'bGeraA') nota += 6;
  else if (dm.relacao === 'mesmo') nota += 3;
  else if (!dm.mesmaPolaridade) nota += 4; // controle com polaridade oposta = Oficial Direto / Riqueza Direta

  if (palacio.mesmo) nota += 4;
  for (const r of palacio.relacoes) {
    nota += { combinacao: 10, trio: 7, choque: -10, punicao: -6, dano: -5 }[r] ?? 0;
  }

  if (oculta.aEmB) nota += 4;
  if (oculta.bEmA) nota += 4;

  for (const s of [clima.bSupreA, clima.aSupreB]) nota += { muito: 6, algum: 3, pouco: 0 }[s.nivel];

  for (const r of animais.relacoes) {
    nota += { combinacao: 4, trio: 4, choque: -4, punicao: -2, dano: -2 }[r] ?? 0;
  }

  let extra = 0;
  for (const c of cruzadas) {
    extra += { combinacaoTronco: 2, combinacao: 1.5, trio: 1, choqueTronco: -1, choque: -1.5, punicao: -1, dano: -0.5 }[c.tipo] ?? 0;
  }
  nota += Math.max(-8, Math.min(8, extra));

  const pontuacao = Math.round(Math.max(35, Math.min(97, nota)));
  const nivel = pontuacao >= 85 ? 'raro' : pontuacao >= 72 ? 'forte' : pontuacao >= 58 ? 'bom' : 'desafiador';

  return { pontuacao, nivel, dm, palacio, oculta, clima, animais, cruzadas };
}

/** sessionStorage: repasse da pessoa 1 do /astrologia-chinesa pra compatibilidade (nunca query string). */
export const CHAVE_COMPAT_PESSOA1 = 'ic_bazi_compat_p1';
