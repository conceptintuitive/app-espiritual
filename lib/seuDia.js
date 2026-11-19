// lib/seuDia.js
// Motor do Seu Dia (/seu-dia): a leitura de UM dia pra UMA pessoa, misturando
// 4 lentes pessoais + 1 coletiva. Sem dependências e sem IA — roda no browser
// e no Node (push das 7h). Testes em tests/seuDia.test.js.
//
// Lentes (cada uma vota num TEMA e puxa o TOM pra cima ou pra baixo):
//   1. Astrologia chinesa — pilar do dia × Day Master (Dez Deuses, peso 2) e
//      relações do ramo do dia com os 4 ramos do mapa (só tom).
//   2. Numerologia — dia pessoal (mês pessoal + dia).
//   3. Astrologia ocidental — signo da Lua do dia e o aspecto dela com o Sol
//      de nascimento (e retorno lunar).
//   4. Tarô — carta pessoal do dia (hash de nascimento + data, determinística).
//   +  I Ching — hexagrama do dia: igual pra todo mundo, entra só como lente.
//
// Tema = o mais votado (empate: o do Deus do dia). Tom = soma dos sinais:
// ≥ 2 fluxo, ≤ −2 tensão, senão misto. O título vem de TEMAS[tema].tons[tom].

import {
  calcularBazi, cicloDoDia, cicloParaPilar, dezDeuses, relacoesRamos, florDePessego,
  forcaDiaMestre, TRONCOS, RAMOS, DEZ_DEUSES, nomePilar, equacaoDoTempoMin,
} from './bazi.js';
import { calcularPlanetas, calcularMesPessoal, calcularAnoPessoal, calcularSigno } from './calculos.js';
import { DIA_MESTRE } from './baziTextos.js';
import { ARCANOS_MAIORES } from './tarot.js';
import { hexagramaDoDia } from './iching.js';
import { tzOffsetMinutes, localToUTC, utcOffsetHoras } from './sky.js';
import {
  TEMAS, ORDEM_TEMAS, DEUS_DO_DIA, DIA_PESSOAL, SIGNOS, LUA_NO_SIGNO, ASPECTO_LUA, RETORNO_LUNAR,
  TAROT_TEMA, TAROT_TOM, AREA_POSICAO, AREA_CURTA, EVITAR_NA_HORA, NOME_POSICAO, VERBO_RELACAO, EVITE_CHOQUE, oAnimal, seuAnimal,
  POSICAO_EXPLICA, TIPO_RELACAO, NA_PRATICA, NEUTRO_PRATICA, GERA, CONTROLA, DEUS_EXPLICA, RELACAO_DEUS, POLARIDADE,
  DIA_PESSOAL_LONGO, ASPECTO_EXPLICA,
} from './seuDiaTextos.js';
import { ELEMENTOS } from './bazi.js';

const POSICOES = ['ano', 'mes', 'dia', 'hora'];

// ── Utilitários ──────────────────────────────────────────────────────────────

function reduz(n) {
  let x = n;
  while (x > 9 && x !== 11 && x !== 22 && x !== 33) {
    x = String(x).split('').reduce((a, c) => a + Number(c), 0);
  }
  return x;
}

/** Hash FNV-1a 32 bits — determinístico e igual no browser e no Node. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** "YYYY-MM-DD" somando `n` dias (sem fuso: aritmética de calendário). */
export function somarDias(dataISO, n) {
  const [y, m, d] = dataISO.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Data de hoje ("YYYY-MM-DD") num fuso IANA. */
export function hojeNoFuso(tz = 'America/Sao_Paulo', agora = new Date()) {
  try {
    return agora.toLocaleDateString('sv-SE', { timeZone: tz });
  } catch {
    return agora.toISOString().slice(0, 10);
  }
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function rotuloData(dataISO) {
  const [y, m, d] = dataISO.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { semana: DIAS_SEMANA[dow], dia: d, mes: MESES[m - 1], curto: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` };
}

// ── Perfil (calculado uma vez por pessoa) ────────────────────────────────────

/**
 * @param {{ dataNascimento: string, hora?: string|null, tz?: string, lon?: number|null }} p
 */
export function montarPerfil({ dataNascimento, hora = null, tz = 'America/Sao_Paulo', lon = null }) {
  const mapa = calcularBazi({ data: dataNascimento, hora, tz, lon });
  const [, m, d] = dataNascimento.split('-').map(Number);
  const signoSolar = calcularSigno(d, m);
  const offset = hora ? utcOffsetHoras({ data: dataNascimento, hora, tz }) : null;
  const signoLuaNatal = calcularPlanetas(dataNascimento, hora, offset)?.signoLua || null;
  return {
    dataNascimento, hora, tz, lon,
    mapa,
    signoSolar,
    signoLuaNatal,
    forca: forcaDiaMestre(mapa).nivel,
  };
}

// ── Lentes ───────────────────────────────────────────────────────────────────

function aspectoLua(signoLua, signoSolar) {
  const a = SIGNOS.indexOf(signoLua);
  const b = SIGNOS.indexOf(signoSolar);
  if (a < 0 || b < 0) return 'neutro';
  const dist = (a - b + 12) % 12;
  if (dist === 0) return 'conjuncao';
  if (dist === 4 || dist === 8) return 'trigono';
  if (dist === 2 || dist === 10) return 'sextil';
  if (dist === 3 || dist === 9) return 'quadratura';
  if (dist === 6) return 'oposicao';
  return 'neutro';
}

function textoRelacao(animalDia, r) {
  const animalNatal = RAMOS[r.ramoNatal].animal;
  const v = VERBO_RELACAO[r.tipo];
  const efeito = v.efeito.replace('{area}', AREA_POSICAO[r.pos]);
  return `${oAnimal(animalDia, true)} ${v.verbo} ${seuAnimal(animalNatal)} (${NOME_POSICAO[r.pos]}): ${efeito}.`;
}

/** Sinais de tom vindos das relações do ramo do dia com o mapa. */
function sinaisRelacoes(relacoes, animalDia) {
  const out = [];
  let positivos = 0;
  for (const r of relacoes) {
    const nome = `${TIPO_RELACAO[r.tipo].nome}: ${animalDia} × ${seuAnimal(RAMOS[r.ramoNatal].animal)}`;
    if (r.tipo === 'trio' || r.tipo === 'combinacao') {
      if (positivos < 2) out.push({ texto: nome, peso: 1 });
      positivos += 1;
    } else if (r.tipo === 'choque') {
      out.push({ texto: nome, peso: r.pos === 'dia' ? -2 : -1 });
    } else if (r.tipo === 'punicao') {
      out.push({ texto: nome, peso: -1 });
    }
  }
  return out;
}

const nomeElemento = (tronco) => `${ELEMENTOS[TRONCOS[tronco].elemento].nome} ${TRONCOS[tronco].yang ? 'Yang' : 'Yin'}`;

// ── Leitura de um dia ────────────────────────────────────────────────────────

/**
 * @param {ReturnType<typeof montarPerfil>} perfil
 * @param {string} dataISO "YYYY-MM-DD"
 * @param {{ horas?: boolean }} [opts]
 */
export function leituraDoDia(perfil, dataISO, { horas = false } = {}) {
  const [y, m, d] = dataISO.split('-').map(Number);
  const { mapa } = perfil;
  const pilar = cicloParaPilar(cicloDoDia(y, m, d));
  const animalDia = RAMOS[pilar.ramo].animal;

  // Lente 1 — astrologia chinesa
  const deus = dezDeuses(mapa.diaMestre, pilar.tronco);
  const deusInfo = DEUS_DO_DIA[deus];
  const relacoes = [];
  for (const pos of POSICOES) {
    if (!mapa[pos]) continue;
    for (const tipo of relacoesRamos(pilar.ramo, mapa[pos].ramo)) {
      relacoes.push({ pos, tipo, ramoNatal: mapa[pos].ramo });
    }
  }
  const flor = florDePessego(mapa.dia.ramo) === pilar.ramo;

  // Lente 2 — numerologia
  const mesPessoal = calcularMesPessoal(perfil.dataNascimento, y, m);
  const diaPessoal = reduz((mesPessoal || 0) + reduz(d));
  const dpInfo = DIA_PESSOAL[diaPessoal] || DIA_PESSOAL[reduz(diaPessoal % 9 || 9)];

  // Lente 3 — Lua do dia (meio-dia de Brasília)
  const signoLua = calcularPlanetas(dataISO, '12:00', -3)?.signoLua || null;
  const aspecto = signoLua ? aspectoLua(signoLua, perfil.signoSolar) : 'neutro';
  const retorno = !!signoLua && signoLua === perfil.signoLuaNatal;

  // Lente 4 — tarô pessoal do dia
  const h = hash(`${perfil.dataNascimento}|${dataISO}`);
  const carta = ARCANOS_MAIORES[h % ARCANOS_MAIORES.length];
  const invertida = ((h >>> 8) % 5) === 0;

  // Lente coletiva — hexagrama
  const hexagrama = hexagramaDoDia(new Date(`${dataISO}T12:00:00-03:00`));

  // Votação do tema
  const votos = Object.fromEntries(ORDEM_TEMAS.map((t) => [t, 0]));
  for (const [t, v] of Object.entries(deusInfo.votos)) votos[t] += v;
  votos[dpInfo.tema] += 1;
  if (signoLua) votos[LUA_NO_SIGNO[signoLua].tema] += 1;
  votos[TAROT_TEMA[carta.id]] += 1;
  if (flor) votos.relacoes += 1;

  const temaDeus = Object.entries(deusInfo.votos).sort((a, b) => b[1] - a[1])[0][0];
  let tema = temaDeus;
  for (const t of ORDEM_TEMAS) if (votos[t] > votos[tema]) tema = t;

  // A lente chinesa pode votar em mais de um tema (ex.: 7 Matanças = trabalho + ação).
  const lentesTema = [
    { lente: 'Astrologia chinesa', temas: Object.keys(deusInfo.votos).sort((a, b) => deusInfo.votos[b] - deusInfo.votos[a]) },
    { lente: 'Numerologia', temas: [dpInfo.tema] },
    ...(signoLua ? [{ lente: 'Lua', temas: [LUA_NO_SIGNO[signoLua].tema] }] : []),
    { lente: 'Tarô', temas: [TAROT_TEMA[carta.id]] },
  ];
  const concordam = lentesTema.filter((l) => l.temas.includes(tema)).length;

  // Tom — cada sinal fica registrado pra explicar o "por quê" no Completo.
  const sinais = [];
  if (deusInfo.tom) sinais.push({ texto: `${DEZ_DEUSES[deus].nome} (Deus do dia)`, peso: deusInfo.tom });
  sinais.push(...sinaisRelacoes(relacoes, animalDia));
  if (ASPECTO_LUA[aspecto].tom && signoLua) sinais.push({ texto: `Lua em ${signoLua} ${ASPECTO_LUA[aspecto].nome}`, peso: ASPECTO_LUA[aspecto].tom });
  if (flor) sinais.push({ texto: 'Flor de Pêssego (magnetismo e romance)', peso: 1 });
  if (invertida) sinais.push({ texto: `${carta.nome} invertida`, peso: -1 });
  if (TAROT_TOM[carta.id]) sinais.push({ texto: carta.nome, peso: TAROT_TOM[carta.id] });
  const pontos = sinais.reduce((acc, x) => acc + x.peso, 0);
  const tom = pontos >= 2 ? 'fluxo' : pontos <= -2 ? 'tensao' : 'misto';

  // Faça / evite
  const faca = [...TEMAS[tema].faca];
  const evite = [...TEMAS[tema].evite];
  const choques = relacoes.filter((r) => r.tipo === 'choque');
  for (const c of choques.reverse()) evite.unshift(EVITE_CHOQUE[c.pos]);
  if (diaPessoal === 1 && !faca.some((f) => f.startsWith('Começar'))) faca.splice(1, 0, 'Começar algo novo (dia pessoal 1)');

  // ── Explicações (Seu Dia Completo) ──
  const eu = mapa.diaMestre;
  const elemEu = TRONCOS[eu].elemento;
  const elemDia = TRONCOS[pilar.tronco].elemento;
  const rel = (elemDia - elemEu + 5) % 5;
  const chaveRel = ['mesmo', 'gero', 'controlo', 'controla', 'gera'][rel];
  const imagemFluxo = [null, GERA[elemEu], CONTROLA[elemEu], CONTROLA[elemDia], GERA[elemDia]][rel];
  const animais = POSICOES.filter((p) => mapa[p]).map((pos) => {
    const ramo = mapa[pos].ramo;
    const rels = relacoes.filter((r) => r.pos === pos).map((r) => ({
      tipo: r.tipo,
      nome: TIPO_RELACAO[r.tipo].nome,
      hanzi: TIPO_RELACAO[r.tipo].hanzi,
      oQue: TIPO_RELACAO[r.tipo].oQue,
      naPratica: NA_PRATICA[r.tipo][pos],
      positivo: r.tipo === 'trio' || r.tipo === 'combinacao',
    }));
    return {
      pos,
      rotulo: POSICAO_EXPLICA[pos].rotulo,
      area: POSICAO_EXPLICA[pos].area,
      explica: POSICAO_EXPLICA[pos].texto,
      animal: RAMOS[ramo].animal,
      hanzi: RAMOS[ramo].hanzi,
      relacoes: rels,
      neutro: rels.length === 0 ? NEUTRO_PRATICA : null,
    };
  });
  const anoPessoal = calcularAnoPessoal(perfil.dataNascimento, y);
  const diaReduzido = reduz(d);
  const somaDia = (mesPessoal || 0) + diaReduzido;

  const leitura = {
    data: dataISO,
    rotulo: rotuloData(dataISO),
    tema,
    temaNome: TEMAS[tema].nome,
    tom,
    titulo: TEMAS[tema].tons[tom].titulo,
    frase: TEMAS[tema].tons[tom].frase,
    concordam,
    totalLentes: lentesTema.length,
    faca: [...new Set(faca)].slice(0, 3),
    evite: [...new Set(evite)].slice(0, 3),
    chinesa: {
      deus,
      deusNome: DEZ_DEUSES[deus].nome,
      deusHanzi: DEZ_DEUSES[deus].hanzi,
      pilarNome: nomePilar(pilar.tronco, pilar.ramo),
      pilarHanzi: TRONCOS[pilar.tronco].hanzi + RAMOS[pilar.ramo].hanzi,
      texto: deusInfo.texto,
      relacoes: relacoes.map((r) => ({ ...r, texto: textoRelacao(animalDia, r), positivo: r.tipo === 'trio' || r.tipo === 'combinacao' })),
      flor,
      voce: { elemento: nomeElemento(eu), imagem: DIA_MESTRE[eu].imagem },
      diaElemento: nomeElemento(pilar.tronco),
      porQue: [RELACAO_DEUS[chaveRel], imagemFluxo ? `${imagemFluxo}.` : null, TRONCOS[eu].yang === TRONCOS[pilar.tronco].yang ? POLARIDADE.igual : POLARIDADE.oposta].filter(Boolean),
      esperar: DEUS_EXPLICA[deus].esperar,
      usar: DEUS_EXPLICA[deus].usar,
      animalDia: { animal: animalDia, hanzi: RAMOS[pilar.ramo].hanzi },
      animais,
    },
    numerologia: {
      diaPessoal,
      palavra: dpInfo.palavra,
      texto: dpInfo.texto,
      longo: DIA_PESSOAL_LONGO[diaPessoal] || dpInfo.texto,
      anoPessoal,
      mesPessoal,
      mesPalavra: DIA_PESSOAL[mesPessoal]?.palavra || '',
      conta: `Seu ano pessoal em ${y} é ${anoPessoal} e este mês é o seu mês ${mesPessoal}. O dia ${d} vale ${diaReduzido}; ${mesPessoal} + ${diaReduzido} = ${somaDia}${somaDia !== diaPessoal ? ` → ${diaPessoal}` : ''}.`,
    },
    lua: signoLua
      ? {
        signo: signoLua,
        clima: LUA_NO_SIGNO[signoLua].clima,
        aspecto,
        texto: ASPECTO_LUA[aspecto].texto,
        retorno: retorno ? RETORNO_LUNAR : null,
        signoSolar: perfil.signoSolar,
        signoLuaNatal: perfil.signoLuaNatal,
        aspectoExplica: ASPECTO_EXPLICA[aspecto],
      }
      : null,
    tarot: {
      id: carta.id,
      nome: carta.nome,
      invertida,
      texto: invertida ? carta.significadoInvertido : carta.significado,
      palavrasChave: carta.palavrasChave || [],
    },
    hexagrama: {
      superior: hexagrama.superior.nome,
      inferior: hexagrama.inferior.nome,
      favorece: hexagrama.favorece[0],
      cuidado: hexagrama.cuidado[0],
      texto: hexagrama.texto,
      movimento: hexagrama.leituraMutante,
      favoreceLista: hexagrama.favorece,
      cuidadoLista: hexagrama.cuidado,
    },
    porQue: {
      votos: lentesTema.map((v) => ({ lente: v.lente, temasNomes: v.temas.map((t) => TEMAS[t].nome).join(' + '), igual: v.temas.includes(tema) })),
      sinais,
      pontos,
    },
  };

  if (horas) leitura.horas = horasDoDia(perfil, dataISO, pilar);
  return leitura;
}

// ── Horas do dia (no relógio da cidade) ──────────────────────────────────────

const FAVORAVEIS = {
  fraco: new Set(['recursoDireto', 'recursoIndireto', 'amigo', 'rival']),
  equilibrado: new Set(['riquezaDireta', 'riquezaIndireta', 'deusComida', 'recursoDireto', 'oficialDireto']),
  forte: new Set(['deusComida', 'oficialFerido', 'riquezaDireta', 'riquezaIndireta', 'oficialDireto']),
};

function hhmm(min) {
  const x = ((Math.round(min / 5) * 5) % 1440 + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}h${String(x % 60).padStart(2, '0')}`;
}

/**
 * Os pilares de hora do dia (horário solar), pontuados pro mapa da pessoa e
 * convertidos pro relógio do fuso dela. Devolve até 3 horas de força e a pior
 * hora (atenção), só entre 6h e 23h do relógio.
 */
export function horasDoDia(perfil, dataISO, pilarDia = null) {
  const [y, m, d] = dataISO.split('-').map(Number);
  const { mapa, tz, forca } = perfil;
  const pilar = pilarDia || cicloParaPilar(cicloDoDia(y, m, d));
  const meioDiaUTC = localToUTC({ y, m, d, hh: 12, mm: 0 }, tz);
  const offsetMin = tzOffsetMinutes(meioDiaUTC, tz);
  // Sem longitude: meridiano do fuso PADRÃO (junho = inverno no Brasil, sem
  // horário de verão), igual ao calcularBazi — senão um eventual horário de
  // verão adiantaria a hora solar em 1h.
  const offsetPadraoMin = Math.min(offsetMin, tzOffsetMinutes(localToUTC({ y, m: 6, d: 21, hh: 12, mm: 0 }, tz), tz));
  const lon = typeof perfil.lon === 'number' ? perfil.lon : (offsetPadraoMin / 60) * 15;
  const solarMenosRelogio = lon * 4 + equacaoDoTempoMin(meioDiaUTC) - offsetMin;
  const troncoRato = ((pilar.tronco % 5) * 2) % 10;
  const fav = FAVORAVEIS[forca] || FAVORAVEIS.equilibrado;

  const lista = [];
  for (let ramo = 1; ramo < 12; ramo++) { // Boi (1h) … Porco (21h–23h); Rato (23h) já é outro dia
    const tronco = (troncoRato + ramo) % 10;
    const deus = dezDeuses(mapa.diaMestre, tronco);
    let score = fav.has(deus) ? 2 : deus === 'seteMatancas' && forca !== 'forte' ? -1 : 0;
    const notas = [];
    for (const pos of POSICOES) {
      if (!mapa[pos]) continue;
      for (const tipo of relacoesRamos(ramo, mapa[pos].ramo)) {
        const peso = pos === 'dia' ? 1.5 : 1;
        if (tipo === 'trio' || tipo === 'combinacao') { score += 1 * peso; notas.push({ tipo, pos }); }
        if (tipo === 'choque') { score -= 2 * peso; notas.push({ tipo, pos }); }
        if (tipo === 'punicao') score -= 1;
      }
    }
    const inicioSolar = ramo * 120 - 60;
    const inicio = inicioSolar - solarMenosRelogio;
    const fim = inicio + 120;
    if (inicio < 6 * 60 - 30 || fim > 23 * 60 + 30) continue;
    lista.push({ ramo, deus, score, inicio, faixa: `${hhmm(inicio)}–${hhmm(fim)}`, notas });
  }

  const animal = (r) => RAMOS[r].animal;
  const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const descreverForca = (h) => {
    const base = maiuscula(DEUS_DO_DIA[h.deus].hora);
    const n = h.notas.find((x) => x.tipo !== 'choque');
    return n ? `${base} — combina com ${seuAnimal(animal(mapa[n.pos].ramo))}.` : `${base}.`;
  };
  const descreverAtencao = (h) => {
    const n = h.notas.find((x) => x.tipo === 'choque');
    if (!n) return 'Hora de pressão: não marque nada importante.';
    return `Choca com ${seuAnimal(animal(mapa[n.pos].ramo))} (${AREA_CURTA[n.pos]}): evite ${EVITAR_NA_HORA[n.pos]} nesse horário.`;
  };

  const forcaHoras = lista.filter((h) => h.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3)
    .sort((a, b) => a.inicio - b.inicio)
    .map((h) => ({ faixa: h.faixa, animal: RAMOS[h.ramo].animal, deusNome: DEZ_DEUSES[h.deus].nome, texto: descreverForca(h), tipo: 'forca' }));
  const pior = lista.filter((h) => h.score <= -2).sort((a, b) => a.score - b.score)[0];
  const atencao = pior
    ? { faixa: pior.faixa, animal: RAMOS[pior.ramo].animal, deusNome: DEZ_DEUSES[pior.deus].nome, texto: descreverAtencao(pior), tipo: 'atencao' }
    : null;

  return { forca: forcaHoras, atencao, aproximado: typeof perfil.lon !== 'number' };
}

// ── Semana e mês ─────────────────────────────────────────────────────────────

/** Resumo de N dias a partir de `dataISO` (inclusive). */
export function proximosDias(perfil, dataISO, n = 7) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const dia = somarDias(dataISO, i);
    const l = leituraDoDia(perfil, dia);
    out.push({
      data: dia,
      rotulo: l.rotulo,
      tema: l.tema,
      temaNome: l.temaNome,
      tom: l.tom,
      titulo: l.titulo,
      frase: l.frase,
      deusNome: l.chinesa.deusNome,
      deusHanzi: l.chinesa.deusHanzi,
      pilarNome: l.chinesa.pilarNome,
      concordam: l.concordam,
      totalLentes: l.totalLentes,
      choqueCasa: l.chinesa.relacoes.some((r) => r.tipo === 'choque' && r.pos === 'dia'),
    });
  }
  // Melhor dia = fluxo com mais lentes concordando (só marca um).
  const candidatos = out.filter((x) => x.tom === 'fluxo').sort((a, b) => b.concordam - a.concordam);
  if (candidatos[0]) candidatos[0].melhor = true;
  return out;
}
