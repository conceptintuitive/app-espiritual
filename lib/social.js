// lib/social.js — conteúdo diário automático do Instagram e do TikTok.
// SÓ SERVIDOR (importa o manualgenerator). Puro: sem banco, sem rede, sem
// relógio escondido (toda função recebe a data "YYYY-MM-DD" de Brasília).
// Testes em tests/social.test.js.
//
// Nada aqui é pessoal: tudo é igual pra todo mundo no dia, calculado pelas
// mesmas contas do site.
//
// Desde dez/2026 os TEXTOS são escritos pela IA (lib/socialIA.js, guia em
// lib/socialEditorial.js) a partir dos DADOS daqui (dadosDoDia), e ficam
// prontos na tabela social_conteudos (o cron de domingo gera a semana). Se a
// IA falhar, reservaDoDia monta o mesmo formato com os textos das tabelas.
//
// Temas do feed (carrossel de 6 telas: gancho → mecanismo → exemplo → virada →
// prática → CTA), em temaDoDia:
//   seg PADRÕES      número de vida, em série (1…9, 11, 22, 33)
//   ter SOMBRA       ponto cego do signo, em série (Áries → Peixes)
//   qua MENTE        um mecanismo da mente ligado a um símbolo (MECANISMOS)
//   qui RELAÇÕES     compatibilidade entre signos, em série de pares (PARES_SIGNOS)
//   sex PENSADORES   a ideia central de um pensador (PENSADORES)
//   sáb INTERAÇÃO    "comenta sua data de nascimento…" (com a resposta automática)
//   dom CICLOS       a semana que vem: Lua, Kin, Ano/Mês/Dia Universal, 1 conselho por dia
// Story "Energia de hoje" todo dia; Reels com o gancho + a virada do carrossel.
//
// Séries: o banco guarda, por série, o próximo índice ABSOLUTO (social_series.
// proximo). Item = índice % tamanho; como o índice só cresce, nada repete
// antes de a série dar a volta.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { SIGNO_PROFUNDO, NUMERO_PROFUNDO } from './manualgenerator.js';
import { calcularPlanetas } from './calculos.js';
import { kinDaData, nomeDoKin, seloDoKin, tomDoKin } from './kin.js';
import { TEXTO_SELO, TEXTO_TOM } from './kinTextos.js';
import { anjoPorLongitude, dadosDoAnjo } from './anjos.js';
import { TEXTO_ANJO } from './anjosTextos.js';
import { longitudeSolar } from './bazi.js';
import { LUA_NO_SIGNO, DIA_PESSOAL } from './seuDiaTextos.js';
import { SIGNOS as SIGNOS_COMPAT, getCompatibilidade } from './compatibilidade.js';
import { luaNoCeu } from './blogCapa.js';
import { julianDay } from './sky.js';
import { MECANISMOS, PENSADORES, PARES_SIGNOS, problemasDoTexto } from './socialEditorial.js';

export const SITE = 'intuitiveconcept.com.br';
export const CTA_FEED = 'Faz o seu mapa grátis: link na bio';
export const CTA_STORY = 'Seu dia completo, lido pelo seu mapa: link na bio';

export const SIGNOS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
export const GLIFO_SIGNO = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SLUG_SIGNO = ['aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes'];
export const NUMEROS_VIDA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

/** As séries e os itens de cada uma, na ordem em que saem. */
export const SERIES = {
  numero: NUMEROS_VIDA,
  ponto_cego: SIGNOS,
  mente: MECANISMOS.map((m) => m.id),
  compat: PARES_SIGNOS.map(([a, b]) => `${a}|${b}`),
  pensador: PENSADORES.map((p) => p.id),
};

/** Tema → rótulo da série e hashtags do tema. */
export const TEMAS = {
  numero: { rotulo: 'Padrões', hashtags: ['#numerodevida', '#caminhodevida'] },
  ponto_cego: { rotulo: 'Sombra', hashtags: ['#zodiaco', '#sombra'] },
  mente: { rotulo: 'Mente e ciência', hashtags: ['#psicologia', '#neurociencia'] },
  compat: { rotulo: 'Relações', hashtags: ['#compatibilidade', '#relacionamento'] },
  pensador: { rotulo: 'Pensadores', hashtags: ['#desenvolvimentopessoal', '#leidaatracao'] },
  comenta: { rotulo: 'Interação', hashtags: ['#numerodevida', '#comenta'] },
  semana: { rotulo: 'Ciclos', hashtags: ['#luadodia', '#kinmaia'] },
};

/** Rótulos das telas de conteúdo do carrossel (a 1ª é o gancho/capa). */
export const ROTULOS_TELAS = ['', 'O mecanismo', 'Na vida real', 'A virada', 'Pra hoje'];

export const HASHTAGS_BASE = ['#numerologia', '#astrologia', '#mapaastral', '#signos', '#autoconhecimento', '#espiritualidade'];

const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const maiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const semPonto = (s) => String(s || '').trim().replace(/[.\s]+$/, '');
/** 1ª frase; se ainda passar de `max`, corta na última palavra inteira. */
function curta(texto, max) {
  const t = String(texto || '').trim();
  if (t.length <= max) return t;
  const m = /^(.+?[.!?])(\s|$)/.exec(t);
  if (m && m[1].length <= max) return m[1];
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

// ── Datas ──────────────────────────────────────────────────────────────────

/** 0 = domingo … 6 = sábado (aritmética de calendário, sem fuso). */
export function diaDaSemana(dataISO) {
  const [y, m, d] = dataISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function somarDias(dataISO, n) {
  const [y, m, d] = dataISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function dataCurta(dataISO) {
  const [, m, d] = dataISO.split('-');
  return `${d}/${m}`;
}

export const rotuloDia = (dataISO) => `${DIAS_CURTOS[diaDaSemana(dataISO)]} ${dataCurta(dataISO)}`;

/** Data de hoje em Brasília. */
export function hojeBrasilia(agora = new Date()) {
  return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** A segunda-feira seguinte (a semana que o cron de domingo gera). */
export function proximaSegunda(dataISO) {
  const dow = diaDaSemana(dataISO);
  return somarDias(dataISO, ((8 - dow) % 7) || 7);
}

/** Meio-dia de Brasília (15h UTC) da data: o instante de referência do dia. */
const meioDia = (dataISO) => Date.parse(`${dataISO}T15:00:00Z`);

// ── Rotação por dia da semana ──────────────────────────────────────────────

const TEMA_POR_DIA = ['semana', 'numero', 'ponto_cego', 'mente', 'compat', 'pensador', 'comenta'];

/** Tema do post do feed no dia (todo dia tem post desde dez/2026). */
export const temaDoDia = (dataISO) => TEMA_POR_DIA[diaDaSemana(dataISO)];

/** Série que o tema consome (sábado e domingo não têm). */
export const serieDoTema = (tema) => (tema && SERIES[tema] ? tema : null);

/** Item da série no índice absoluto, e em que volta ela está. */
export function itemDaSerie(serie, indice) {
  const lista = SERIES[serie];
  if (!lista) return null;
  const i = ((indice % lista.length) + lista.length) % lista.length;
  return { item: lista[i], posicao: i + 1, total: lista.length, volta: Math.floor(indice / lista.length) + 1 };
}

/**
 * Plano de n dias a partir de `inicio`, andando as séries a partir do estado
 * do banco ({ numero: 3, mente: 10, … } = próximo índice de cada série).
 * Não muda `estado`.
 */
export function planoDosDias(inicio, n, estado = {}) {
  const prox = { ...estado };
  const dias = [];
  for (let k = 0; k < n; k++) {
    const data = somarDias(inicio, k);
    const tema = temaDoDia(data);
    const serie = serieDoTema(tema);
    let indice = null;
    if (serie) {
      indice = prox[serie] ?? 0;
      prox[serie] = indice + 1;
    }
    dias.push({ data, tema, serie, indice });
  }
  return dias;
}

// ── Numerologia universal ──────────────────────────────────────────────────

/** Soma dos dígitos até um algarismo (11, 22, 33 param), com as etapas. Mesma regra de calcularNumeroVida. */
export function contaNumeroVida(dataBR) {
  const digitos = dataBR.replace(/\D/g, '').split('').map(Number);
  let soma = digitos.reduce((a, b) => a + b, 0);
  const etapas = [`${digitos.join('+')} = ${soma}`];
  while (soma > 9 && ![11, 22, 33].includes(soma)) {
    const ds = String(soma).split('').map(Number);
    soma = ds.reduce((a, b) => a + b, 0);
    etapas.push(`${ds.join('+')} = ${soma}`);
  }
  return { numero: soma, etapas };
}

const reduzir = (digitos) => contaNumeroVida(digitos).numero;

/** Ano, Mês e Dia Universal (soma dos dígitos da data, mestres preservados). */
export function universais(dataISO) {
  const [y, m, d] = dataISO.split('-');
  return { ano: reduzir(y), mes: reduzir(`${y}${m}`), dia: reduzir(`${y}${m}${d}`) };
}

// ── Lua do dia ─────────────────────────────────────────────────────────────

/**
 * Fase em 4 nomes, na convenção dos calendários brasileiros: vale a última
 * fase principal que já aconteceu. Idade = graus da Lua à frente do Sol.
 */
export function nomeDaFase(idade) {
  if (idade < 90) return 'Lua Nova';
  if (idade < 180) return 'Lua Crescente';
  if (idade < 270) return 'Lua Cheia';
  return 'Lua Minguante';
}

/** Signo da Lua (mesma conta do Seu Dia: meio-dia, UTC−3) e fase. */
export function luaDoDia(dataISO) {
  const signo = calcularPlanetas(dataISO, '12:00', -3)?.signoLua || null;
  const { iluminada } = luaNoCeu(julianDay(meioDia(dataISO)));
  // Fase pelo fim do dia (23h59 de Brasília): o dia da cheia já é "Lua Cheia".
  const { idade } = luaNoCeu(julianDay(Date.parse(`${dataISO}T02:59:00Z`) + 86400000));
  return { signo, fase: nomeDaFase(idade), iluminada, crescente: idade < 180, idade };
}

// ── Story "Energia de hoje" ────────────────────────────────────────────────

/** "Dia de nutrir: cuide do corpo…" → { titulo: 'Dia de nutrir', frase: 'Cuide do corpo…' } */
function partirHoje(texto) {
  const i = texto.indexOf(':');
  if (i < 0) return { titulo: 'Energia de hoje', frase: texto };
  return { titulo: texto.slice(0, i).trim(), frase: maiuscula(texto.slice(i + 1).trim()) };
}

/**
 * O dia (dados) + o texto de reserva do story. `story` (da IA) troca título e
 * frase; as linhas de dados são sempre as calculadas.
 */
export function energiaDoDia(dataISO, story = null) {
  const lua = luaDoDia(dataISO);
  const kin = kinDaData(dataISO);
  const selo = seloDoKin(kin);
  const tom = tomDoKin(kin);
  const anjo = dadosDoAnjo(anjoPorLongitude(longitudeSolar(meioDia(dataISO))));
  const reserva = partirHoje(TEXTO_SELO[selo.codigo].hoje);

  return {
    data: dataISO,
    kicker: `Energia de hoje · ${rotuloDia(dataISO)}`,
    titulo: story?.titulo || reserva.titulo,
    frase: story?.frase || reserva.frase,
    lua,
    linhas: [
      { rotulo: 'Lua', valor: lua.signo ? `${lua.fase} em ${lua.signo}` : lua.fase, nota: lua.signo ? maiuscula(LUA_NO_SIGNO[lua.signo].clima) : '' },
      { rotulo: 'Kin do dia', valor: nomeDoKin(kin), nota: maiuscula(TEXTO_TOM[tom.numero].hoje) },
      { rotulo: 'Anjo destes dias', valor: anjo.nome, nota: maiuscula(TEXTO_ANJO[anjo.n].dom) },
    ],
    cta: CTA_STORY,
    // dados pra IA escrever o story
    fatos: {
      lua: lua.signo ? `${lua.fase} em ${lua.signo}` : lua.fase,
      clima_da_lua: lua.signo ? LUA_NO_SIGNO[lua.signo].clima : null,
      kin: nomeDoKin(kin),
      kin_hoje: TEXTO_SELO[selo.codigo].hoje,
      palavras_do_selo: TEXTO_SELO[selo.codigo].palavras,
      tom_hoje: TEXTO_TOM[tom.numero].hoje,
      anjo_destes_dias: anjo.nome,
      dom_do_anjo: TEXTO_ANJO[anjo.n].dom,
      dia_universal: universais(dataISO).dia,
    },
    kin, anjo: anjo.nome,
  };
}

// ── Dados do dia (o que a IA recebe; nada aqui é inventado) ────────────────

function exemploDoSabado(dataISO) {
  const [, mm, dd] = dataISO.split('-');
  const ano = 1985 + (Math.floor(Date.parse(`${dataISO}T00:00:00Z`) / (7 * 86400000)) % 20);
  return `${dd}/${mm}/${ano}`;
}

function diasDaSemanaSeguinte(dataISO) {
  let faseAnterior = luaDoDia(dataISO).fase;
  return Array.from({ length: 7 }, (_, k) => {
    const d = somarDias(dataISO, k + 1);
    const lua = luaDoDia(d);
    const kin = kinDaData(d);
    const u = universais(d).dia;
    const muda = lua.fase !== faseAnterior;
    faseAnterior = lua.fase;
    return {
      data: d, rotulo: rotuloDia(d),
      lua: lua.signo ? `Lua em ${lua.signo}` : lua.fase,
      fase: lua.fase, muda_fase: muda,
      kin: nomeDoKin(kin), kin_hoje: TEXTO_SELO[seloDoKin(kin).codigo].hoje,
      dia_universal: u, dia_universal_palavra: DIA_PESSOAL[u]?.palavra || null,
    };
  });
}

/**
 * Tudo que o post do dia pode afirmar. `indice` = índice absoluto da série do
 * tema (ignorado em sábado e domingo).
 */
export function dadosDoDia(dataISO, indice = 0) {
  const tema = temaDoDia(dataISO);
  const serie = serieDoTema(tema);
  const s = serie ? itemDaSerie(serie, indice ?? 0) : null;
  const base = {
    data: dataISO, tema, rotuloTema: TEMAS[tema].rotulo, serie,
    indice: serie ? (indice ?? 0) : null, posicao: s?.posicao ?? null, total: s?.total ?? null,
  };
  let p;

  if (tema === 'numero') {
    const n = s.item;
    const t = NUMERO_PROFUNDO[n];
    p = {
      item: String(n), grande: String(n), kicker: `Padrões · número ${n}`,
      fatos: { numero_de_vida: n, numero_mestre: n >= 11, essencia: t.essencia, forca: t.forca, sombra: t.sombra, caminho: t.cura },
    };
  } else if (tema === 'ponto_cego') {
    const signo = s.item;
    const i = SIGNOS.indexOf(signo);
    const t = SIGNO_PROFUNDO[signo];
    const c = SIGNOS_COMPAT[i];
    p = {
      item: signo, grande: GLIFO_SIGNO[i], kicker: `Sombra · ${signo}`, slug: SLUG_SIGNO[i],
      fatos: { signo, elemento: c.elemento, modalidade: c.modalidade, motor: t.motor, ponto_cego: t.risco, virada: t.chave, frase_da_casa: t.frase, vale_para: `Sol, Lua ou Ascendente em ${signo}` },
    };
  } else if (tema === 'mente') {
    const m = MECANISMOS.find((x) => x.id === s.item);
    p = {
      item: m.nome, grande: null, kicker: `Mente e ciência · ${m.nome}`,
      fatos: { mecanismo: m.nome, o_que_a_pesquisa_sustenta: m.ciencia, simbolo_ligado: m.simbolo, rascunho: { gancho: m.gancho, mecanismo: m.mecanismo, exemplo: m.exemplo, virada: m.virada, pratica: m.pratica } },
    };
  } else if (tema === 'compat') {
    const [a, b] = s.item.split('|');
    const r = getCompatibilidade(a, b);
    const ia = SIGNOS.indexOf(a);
    const ib = SIGNOS.indexOf(b);
    p = {
      item: a === b ? `${a} × ${a}` : `${a} × ${b}`, grande: `${GLIFO_SIGNO[ia]} ${GLIFO_SIGNO[ib]}`, kicker: `Relações · ${a} × ${b}`,
      marca: { a, b },
      fatos: {
        signo_a: a, signo_b: b, nota_de_compatibilidade: r.score, nota_de: '40 a 97, calculada pelo elemento e pela modalidade (a mesma conta do site)',
        elemento_a: r.signoA.elemento, elemento_b: r.signoB.elemento, modalidade_a: r.signoA.modalidade, modalidade_b: r.signoB.modalidade,
        traco_a: r.signoA.traco, traco_b: r.signoB.traco, leitura_do_par: r.headline, texto_do_site: r.corpo,
        cta_extra: `É de ${a}? Marca quem é de ${b}.`,
      },
    };
  } else if (tema === 'pensador') {
    const x = PENSADORES.find((y) => y.id === s.item);
    p = {
      item: `${x.autor}: ${x.ideia}`, grande: x.autor, kicker: `Pensadores · ${x.autor}`,
      fatos: { autor: x.autor, ideia: x.ideia, resumo: x.resumo, como_aplicar: x.aplicar, o_que_e_crenca_e_o_que_a_pesquisa_sustenta: x.cuidado, citacao: x.citacao || null },
    };
  } else if (tema === 'comenta') {
    const exemplo = exemploDoSabado(dataISO);
    const conta = contaNumeroVida(exemplo);
    p = {
      item: exemplo, grande: '?', kicker: 'Interação · número de vida',
      fatos: {
        pedido: 'Comenta sua data de nascimento que eu te digo seu número de vida',
        exemplo_de_data: exemplo, conta_do_exemplo: conta.etapas.join(' → '), numero_do_exemplo: conta.numero,
        essencia_do_numero_do_exemplo: NUMERO_PROFUNDO[conta.numero].essencia,
        regra: 'soma todos os dígitos da data e reduz até um algarismo; 11, 22 e 33 não se reduzem (números mestres)',
        resposta: 'a conta responde nos comentários com o número de vida de quem comentar',
      },
    };
  } else {
    const dias = diasDaSemanaSeguinte(dataISO);
    const u = universais(dias[0].data);
    p = {
      item: `${dataCurta(dias[0].data)}–${dataCurta(dias[6].data)}`, grande: null, kicker: `Ciclos · ${dataCurta(dias[0].data)} a ${dataCurta(dias[6].data)}`,
      dias,
      fatos: {
        semana: `${dataCurta(dias[0].data)} a ${dataCurta(dias[6].data)}`,
        ano_universal: u.ano, ano_universal_palavra: DIA_PESSOAL[u.ano]?.palavra,
        mes_universal: u.mes, mes_universal_palavra: DIA_PESSOAL[u.mes]?.palavra,
        dias,
      },
    };
  }

  const energia = energiaDoDia(dataISO);
  return { ...base, ...p, energia: energia.fatos };
}

// ── Conteúdo (formato único, da IA ou da reserva) ──────────────────────────
// { telas: [{ rotulo, titulo, texto, dias? }] (6), legenda: { gancho, texto[], hashtags[] },
//   story: { titulo, frase }, reels: { gancho, virada }, dias?: [{ data, conselho }] }

const CTA_TELA = { rotulo: 'Seu mapa', titulo: 'Faz o seu mapa grátis', texto: 'Link na bio. Número, signo, Lua, Kin e anjo: o seu, calculado pela sua data.' };

/** Texto de reserva (tabelas do site) no mesmo formato da IA. */
export function reservaDoDia(dados) {
  const f = dados.fatos;
  const e = partirHoje(dados.energia.kin_hoje);
  let telas; let legenda; let reels; let dias;

  if (dados.tema === 'numero') {
    const n = f.numero_de_vida;
    telas = [
      { titulo: `Se você é ${n}, isso se repete na sua vida`, texto: `${maiuscula(f.essencia)}.` },
      { titulo: 'Por que acontece', texto: `A mesma força que te move (${f.forca}) é a que, sem freio, vira ${f.sombra}.` },
      { titulo: 'Repare', texto: `Quando o ${n} se sente pressionado, a sombra aparece antes da força: ${f.sombra}.` },
      { titulo: 'Não é virar outra pessoa', texto: `O caminho do ${n} é ${f.caminho}.` },
      { titulo: 'Hoje', texto: `Escolha uma situação de hoje e responda a ela pelo caminho do ${n}: ${f.caminho}.` },
    ];
    legenda = { gancho: `Se você é ${n}, isso se repete na sua vida.`, texto: [`Força: ${f.forca}.`, `Sombra: ${f.sombra}.`, `O caminho: ${f.caminho}.`], hashtags: TEMAS.numero.hashtags };
  } else if (dados.tema === 'ponto_cego') {
    telas = [
      { titulo: `O ponto cego de ${f.signo}`, texto: `Vale pra quem tem ${f.vale_para}.` },
      { titulo: 'De onde vem', texto: `${maiuscula(f.motor)} é a força de ${f.signo}. Sem consciência, ela vira o ponto cego.` },
      { titulo: 'Como aparece', texto: `${maiuscula(f.ponto_cego)}.` },
      { titulo: 'A virada', texto: `${maiuscula(f.virada)}. "${f.frase_da_casa}"` },
      { titulo: 'Hoje', texto: `Antes de reagir hoje, pergunte: isso é ${f.virada}?` },
    ];
    legenda = { gancho: `O ponto cego de ${f.signo}.`, texto: [`${maiuscula(f.ponto_cego)}.`, `A virada: ${f.virada}.`, `Vale pra ${f.vale_para}.`], hashtags: [`#${dados.slug}`, '#zodiaco'] };
  } else if (dados.tema === 'mente') {
    const r = f.rascunho;
    telas = [
      { titulo: r.gancho, texto: `${f.mecanismo}.` },
      { titulo: 'O mecanismo', texto: r.mecanismo },
      { titulo: 'Na vida real', texto: r.exemplo },
      { titulo: 'A virada', texto: r.virada },
      { titulo: 'Pra hoje', texto: r.pratica },
    ];
    legenda = { gancho: r.gancho, texto: [r.mecanismo, `O que a pesquisa sustenta: ${f.o_que_a_pesquisa_sustenta}`, r.pratica], hashtags: TEMAS.mente.hashtags };
  } else if (dados.tema === 'compat') {
    const mesmo = f.signo_a === f.signo_b;
    telas = [
      { titulo: `${f.signo_a} × ${f.signo_b}: nota ${f.nota_de_compatibilidade}`, texto: `${f.leitura_do_par}.` },
      { titulo: 'Por que funciona assim', texto: `${f.elemento_a} com ${f.elemento_b}: ${f.texto_do_site}`.slice(0, 300) },
      { titulo: 'Na vida real', texto: mesmo ? `Duas pessoas de ${f.signo_a}: ${f.traco_a} em dobro, pros dois lados.` : `${f.signo_a} chega com ${f.traco_a}. ${f.signo_b}, com ${f.traco_b}.` },
      { titulo: 'A virada', texto: 'Nota baixa não é sentença: mostra onde o casal precisa de acordo, não se vai dar certo.' },
      { titulo: 'Hoje', texto: `Pergunte a quem é de ${mesmo ? f.signo_a : f.signo_b} o que faz essa pessoa se sentir cuidada, e faça.` },
    ];
    legenda = { gancho: `${f.signo_a} × ${f.signo_b}: nota ${f.nota_de_compatibilidade} de compatibilidade.`, texto: [`${f.leitura_do_par}.`, f.cta_extra], hashtags: TEMAS.compat.hashtags };
  } else if (dados.tema === 'pensador') {
        // 4 telas + a chamada (5 no total): sem exemplo inventado na reserva.
    telas = [
      { titulo: `${f.autor}: ${f.ideia.toLowerCase()}`, texto: f.citacao ? `"${f.citacao.texto}"` : 'A ideia central, em linguagem simples.' },
      { titulo: 'A ideia', texto: f.resumo.slice(0, 300) },
      { titulo: 'O que é crença e o que a pesquisa diz', texto: f.o_que_e_crenca_e_o_que_a_pesquisa_sustenta.slice(0, 300) },
      { titulo: 'Pra hoje', texto: f.como_aplicar },
    ];
    legenda = { gancho: `${f.autor}: ${f.ideia.toLowerCase()}, em linguagem simples.`, texto: [f.resumo, f.citacao ? `"${f.citacao.texto}" (${f.citacao.fonte})` : f.como_aplicar, f.o_que_e_crenca_e_o_que_a_pesquisa_sustenta], hashtags: TEMAS.pensador.hashtags };
  } else if (dados.tema === 'comenta') {
    telas = [
      { titulo: 'Comenta sua data de nascimento que eu te digo seu número de vida', texto: 'Dia, mês e ano. A resposta vem aqui nos comentários.' },
      { titulo: 'Como se calcula', texto: 'Soma todos os dígitos da data e reduz até sobrar um algarismo.' },
      { titulo: `Exemplo: ${f.exemplo_de_data}`, texto: `${f.conta_do_exemplo}. Número de vida ${f.numero_do_exemplo}: ${f.essencia_do_numero_do_exemplo}.` },
      { titulo: 'Números mestres', texto: '11, 22 e 33 não se reduzem: carregam a força do número e uma exigência maior.' },
      { titulo: 'Agora é você', texto: 'Escreve a sua data aqui embaixo no formato dia/mês/ano.' },
    ];
    legenda = { gancho: 'Comenta sua data de nascimento que eu te digo seu número de vida.', texto: ['Escreve aqui embaixo no formato dia/mês/ano.', `Exemplo: ${f.exemplo_de_data} → ${f.conta_do_exemplo}. Número de vida ${f.numero_do_exemplo}.`, 'Os números 11, 22 e 33 não se reduzem: são números mestres.'], hashtags: TEMAS.comenta.hashtags };
  } else {
    dias = dados.dias.map((d) => ({ data: d.data, conselho: maiuscula(d.kin_hoje.split(':').slice(1).join(':').trim() || d.kin_hoje) }));
    telas = [
      { titulo: 'A energia da sua semana', texto: `${f.semana}. Lua, Kin e o número universal de cada dia, com um conselho.` },
      { titulo: 'O ciclo', texto: `Ano Universal ${f.ano_universal} (${f.ano_universal_palavra}), mês ${f.mes_universal} (${f.mes_universal_palavra}). É o pano de fundo coletivo da semana.` },
    ];
    legenda = { gancho: `A energia da sua semana: ${f.semana}.`, texto: ['Lua, Kin Maia e número universal de cada dia, com um conselho. Salva pra consultar.', `Ano Universal ${f.ano_universal}, mês ${f.mes_universal}.`, 'Como cada dia bate no SEU mapa, o Seu Dia te mostra às 7h.'], hashtags: TEMAS.semana.hashtags };
  }

  reels = { gancho: telas[0].titulo, virada: curta((dados.tema === 'pensador' ? telas[3] : telas[3] || telas[1]).texto, 160) };
  return normalizarConteudo({ telas, legenda, story: { titulo: e.titulo, frase: e.frase }, reels, dias }, dados, 'reserva');
}

/**
 * Deixa o conteúdo (da IA ou da reserva) no formato final: rótulos das telas,
 * telas dos dias no domingo, tela de CTA no fim, hashtags do tema e a linha
 * "Marca quem é…" na quinta.
 */
export function normalizarConteudo(c, dados, fonte = 'ia') {
  const limpa = (s) => String(s ?? '').trim();
  let telas = (c.telas || []).filter((t) => t && (t.titulo || t.texto)).map((t, k) => ({
    rotulo: limpa(t.rotulo) || ROTULOS_TELAS[k] || '', titulo: limpa(t.titulo), texto: limpa(t.texto),
  }));
  // a IA às vezes já põe a tela de CTA: tira, a nossa é fixa
  telas = telas.filter((t) => !/mapa grátis/i.test(`${t.titulo} ${t.texto}`) || telas.indexOf(t) === 0);

  let dias = null;
  if (dados.tema === 'semana') {
    const conselhos = Object.fromEntries((c.dias || []).map((d) => [d.data, limpa(d.conselho)]));
    dias = dados.dias.map((d) => ({ ...d, conselho: conselhos[d.data] || maiuscula(d.kin_hoje.split(':').slice(1).join(':').trim()) }));
    telas = telas.slice(0, 2);
    telas[0].rotulo = '';
    if (telas[1]) telas[1].rotulo = 'O ciclo';
    telas.push({ rotulo: 'A semana', titulo: '', texto: '', dias: dias.slice(0, 2) });
    telas.push({ rotulo: 'A semana', titulo: '', texto: '', dias: dias.slice(2, 4) });
    telas.push({ rotulo: 'A semana', titulo: '', texto: '', dias: dias.slice(4, 7) });
  } else {
    telas = telas.slice(0, 6);
  }
  telas.push({ ...CTA_TELA });

  const leg = c.legenda || {};
  const texto = (Array.isArray(leg.texto) ? leg.texto : [leg.texto]).map(limpa).filter(Boolean).slice(0, 4);
  if (dados.tema === 'compat' && !texto.some((l) => /marca quem/i.test(l))) {
    if (texto.length >= 4) texto.pop();
    texto.push(dados.fatos.cta_extra);
  }
  const hashtags = [...new Set([...(dados.slug ? [`#${dados.slug}`] : []), ...TEMAS[dados.tema].hashtags, ...((leg.hashtags || []).map(limpa))])]
    .filter((h) => /^#[\p{L}\p{N}_]+$/u.test(h)).slice(0, 2);

  return {
    fonte,
    telas,
    legenda: { gancho: limpa(leg.gancho) || telas[0].titulo, texto, hashtags },
    story: { titulo: limpa(c.story?.titulo), frase: limpa(c.story?.frase) },
    reels: { gancho: limpa(c.reels?.gancho) || telas[0].titulo, virada: limpa(c.reels?.virada) || (telas[3]?.texto || '') },
    dias,
  };
}

/** Confere o conteúdo final contra o guia (formato, tamanho, proibidos, dados). */
export function validarConteudo(c, dados) {
  const prob = [];
  const telas = c?.telas || [];
  if (telas.length < 5 || telas.length > 7) prob.push(`carrossel com ${telas.length} telas (quero 5 a 7)`);
  if (!/mapa grátis/i.test(telas[telas.length - 1]?.titulo || '')) prob.push('última tela sem a chamada');
  for (const [k, t] of telas.entries()) {
    if (t.dias) continue;
    if (!t.titulo) prob.push(`tela ${k + 1} sem título`);
    if (t.titulo.length > 120) prob.push(`título da tela ${k + 1} longo (${t.titulo.length} caracteres; máximo 120)`);
    if (t.texto.length > 300) prob.push(`texto da tela ${k + 1} longo (${t.texto.length} caracteres; máximo 300, encurte pra até 260)`);
  }
  const leg = c?.legenda || {};
  if (!leg.gancho || leg.gancho.length > 160) prob.push(`gancho da legenda vazio ou longo (${leg.gancho?.length || 0} caracteres; máximo 160)`);
  if (!leg.texto || leg.texto.length < 2 || leg.texto.length > 4) prob.push('legenda com menos de 2 ou mais de 4 linhas');
  if (!c?.story?.titulo || c.story.titulo.length > 40) prob.push(`título do story vazio ou longo (${c?.story?.titulo?.length || 0} caracteres; máximo 40)`);
  if (!c?.story?.frase || c.story.frase.length > 160) prob.push(`frase do story vazia ou longa (${c?.story?.frase?.length || 0} caracteres; máximo 160)`);
  if (!c?.reels?.gancho || c.reels.gancho.length > 110) prob.push(`gancho do Reels vazio ou longo (${c?.reels?.gancho?.length || 0} caracteres; máximo 110)`);
  if (!c?.reels?.virada || c.reels.virada.length > 160) prob.push(`virada do Reels vazia ou longa (${c?.reels?.virada?.length || 0} caracteres; máximo 160)`);

  const tudo = [
    ...telas.flatMap((t) => [t.titulo, t.texto, ...(t.dias || []).map((d) => d.conselho)]),
    leg.gancho, ...(leg.texto || []), c?.story?.titulo, c?.story?.frase, c?.reels?.gancho, c?.reels?.virada,
  ].join('\n');
  // Palavra "proibida" que já está nos próprios dados do site (ex.: o 33 tem
  // "cura" na essência) não conta: é o dado, não uma promessa da IA.
  const dadosTexto = JSON.stringify(dados.fatos);
  const doDado = new Set(problemasDoTexto(dadosTexto));
  for (const m of problemasDoTexto(tudo)) if (!doDado.has(m)) prob.push(`proibido: ${m}`);

  // dados: o post tem que falar do item certo
  const f = dados.fatos;
  const capa = `${telas[0]?.titulo} ${telas[0]?.texto} ${leg.gancho}`;
  if (dados.tema === 'numero' && !new RegExp(`\\b${f.numero_de_vida}\\b`).test(capa)) prob.push(`a capa não fala do número ${f.numero_de_vida}`);
  if (dados.tema === 'ponto_cego' && !capa.includes(f.signo)) prob.push(`a capa não fala de ${f.signo}`);
  if (dados.tema === 'compat') {
    if (!capa.includes(f.signo_a) || !capa.includes(f.signo_b)) prob.push('a capa não traz os dois signos');
    const notas = [...tudo.matchAll(/nota\D{0,12}(\d{2})/gi)].map((m) => Number(m[1]));
    if (notas.some((x) => x !== f.nota_de_compatibilidade)) prob.push(`nota errada (o certo é ${f.nota_de_compatibilidade})`);
  }
  if (dados.tema === 'pensador' && !tudo.includes(f.autor)) prob.push(`não cita o autor (${f.autor})`);
  // citação entre aspas: só a dos dados, palavra por palavra
  // (campo a campo, pra não casar a aspa de um texto com a de outro; aspas
  // curtas ou que já estão nos dados, como os exemplos dos mecanismos, valem)
  const campos = tudo.split('\n');
  const citadas = campos.flatMap((campo) => [...campo.matchAll(/["“]([^"”]{40,})["”]/g)].map((m) => m[1].trim()));
  const permitidas = [f.citacao?.texto, f.frase_da_casa].filter(Boolean);
  for (const q of citadas) {
    if (permitidas.some((p) => p.includes(q) || q.includes(p)) || dadosTexto.includes(q)) continue;
    prob.push(`citação que não está nos dados: "${q.slice(0, 40)}…"`);
  }
  if (dados.tema === 'semana' && (!c.dias || c.dias.length !== 7 || c.dias.some((d) => !d.conselho))) prob.push('faltou o conselho de algum dia');

  return { ok: prob.length === 0, problemas: prob };
}

/** Legenda pronta: gancho, texto, chamada e 5–8 hashtags. */
export function montarLegenda({ gancho, texto, hashtags = [] }) {
  const tags = [...new Set([...HASHTAGS_BASE, ...hashtags])].slice(0, 8);
  return [gancho, '', ...texto, '', CTA_FEED, '', tags.join(' ')].join('\n');
}

/** Título curto pro TikTok (limite de 90 caracteres). */
export function tituloCurto(gancho, max = 90) {
  const g = semPonto(gancho);
  return g.length <= max ? g : `${g.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

// ── Assinatura das URLs das imagens ────────────────────────────────────────
// O Instagram, o TikTok e o Creatomate baixam as imagens por URL pública. A URL
// leva data, formato, item da série e versão do conteúdo, assinados com HMAC:
// ninguém gera arte de graça no nosso servidor nem troca o conteúdo pela URL.
//   story          1080x1920 JPEG   story do dia
//   c1 … c7        1080x1350 JPEG   telas do carrossel
//   ceu            1080x1920 JPEG   só o céu (fundo do Reels)
//   r1 … r3        1080x1920 PNG    textos do Reels (transparentes)

export const FORMATOS = {
  story: { width: 1080, height: 1920, ext: 'jpg' },
  feed: { width: 1080, height: 1350, ext: 'jpg' },
  ceu: { width: 1080, height: 1920, ext: 'jpg' },
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [`c${n}`, { width: 1080, height: 1350, ext: 'jpg' }])),
  ...Object.fromEntries([1, 2, 3].map((n) => [`r${n}`, { width: 1080, height: 1920, ext: 'png' }])),
};

const chaveAssinatura = (segredo) => `social-img:${segredo}`;

export function assinarImagem({ data, formato, indice = null, v = '' }, segredo) {
  const msg = `${data}|${formato}|${indice ?? ''}|${v || ''}`;
  return createHmac('sha256', chaveAssinatura(segredo)).update(msg).digest('hex').slice(0, 32);
}

export function conferirAssinatura({ data, formato, indice = null, v = '', t }, segredo) {
  if (!segredo || typeof t !== 'string' || t.length !== 32) return false;
  const esperado = assinarImagem({ data, formato, indice, v }, segredo);
  try {
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(t));
  } catch {
    return false;
  }
}

/** Caminho da imagem (relativo), já assinado. `v` = versão do conteúdo (muda o cache). */
export function caminhoImagem({ data, formato, indice = null, v = '' }, segredo) {
  const t = assinarImagem({ data, formato, indice, v }, segredo);
  const q = new URLSearchParams();
  if (indice != null) q.set('i', String(indice));
  if (v) q.set('v', v);
  q.set('t', t);
  return `/api/social/imagem/${data}/${formato}.${FORMATOS[formato]?.ext || 'jpg'}?${q.toString()}`;
}

/** Versão curta do conteúdo (pro cache das imagens mudar quando o texto muda). */
export function versaoConteudo(conteudo) {
  return createHmac('sha256', 'v').update(JSON.stringify(conteudo || {})).digest('hex').slice(0, 10);
}

export const dataValida = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

// ── Chaves liga/desliga ────────────────────────────────────────────────────
// SOCIAL_AUTOMACAO: vazio/"off" = desligada; "on" = Instagram e TikTok;
// "instagram" ou "tiktok" = só aquela rede (lista separada por vírgula vale).
export function redesLigadas(valor) {
  const v = String(valor || '').trim().toLowerCase();
  if (!v || ['off', '0', 'false', 'nao', 'não', 'desligada'].includes(v)) return [];
  if (['on', '1', 'true', 'sim', 'ligada', 'todas'].includes(v)) return ['instagram', 'tiktok'];
  return ['instagram', 'tiktok'].filter((r) => v.split(/[,\s]+/).includes(r));
}

/** SOCIAL_REELS, SOCIAL_RESPOSTAS, TIKTOK_DIRECT_POST: só "on" (ou sim/1/true) liga. */
export const chaveLigada = (valor) => ['on', '1', 'true', 'sim', 'ligada'].includes(String(valor || '').trim().toLowerCase());
