// lib/social.js — conteúdo diário automático do Instagram e do TikTok.
// SÓ SERVIDOR (importa o manualgenerator). Puro: sem banco, sem rede, sem
// relógio escondido (toda função recebe a data "YYYY-MM-DD" de Brasília).
// Testes em tests/social.test.js.
//
// Nada aqui é pessoal: tudo é igual pra todo mundo no dia, calculado pelas
// mesmas contas do site (Lua do dia do Seu Dia, Kin, hexagrama, anjo destes
// dias = o do quinário do Sol, que troca a cada ~5 dias, como no Seu Dia).
//
//   Story "Energia de hoje" (todo dia)  → energiaDoDia(data): Lua, Kin e anjo
//     destes dias (o hexagrama fica no feed de domingo)
//   Post do feed (tema por dia da semana) → postDoDia(data, indice)
//     seg  número de vida, em série (1…9, 11, 22, 33)
//     ter  ponto cego de um signo, em série (Áries → Peixes)
//     qua  anjo da guarda, em série (1 → 72), com período do ano e dom
//     qui  nada (a autora posta à mão)
//     sex  alterna animal chinês e selo do Kin (cada um na sua série)
//     sáb  "Comenta sua data de nascimento…"
//     dom  a energia da semana (Lua, Kin e hexagrama dos próximos 7 dias)
//
// Séries: o banco guarda, por série, o próximo índice ABSOLUTO (social_series.
// proximo, migração 0024). Item = índice % tamanho; volta = índice / tamanho.
// Como o índice só cresce, nenhum item repete antes de a série dar a volta.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { SIGNO_PROFUNDO, NUMERO_PROFUNDO } from './manualgenerator.js';
import { calcularPlanetas } from './calculos.js';
import { kinDaData, nomeDoKin, seloDoKin, tomDoKin, SELOS } from './kin.js';
import { TEXTO_SELO, TEXTO_TOM } from './kinTextos.js';
import { anjoPorLongitude, dadosDoAnjo, periodosDoAno } from './anjos.js';
import { TEXTO_ANJO } from './anjosTextos.js';
import { longitudeSolar, RAMOS } from './bazi.js';
import { ANIMAIS } from './baziTextos.js';
import { anosDoAnimal } from './seoChines.js';
import { hexagramaDoDia } from './iching.js';
import { LUA_NO_SIGNO, oAnimal } from './seuDiaTextos.js';
import { luaNoCeu } from './blogCapa.js';
import { julianDay } from './sky.js';

export const SITE = 'intuitiveconcept.com.br';
export const CTA_FEED = 'Faz o seu mapa grátis: link na bio';
export const CTA_STORY = 'Seu dia completo, lido pelo seu mapa: link na bio';

export const SIGNOS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const GLIFO_SIGNO = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SLUG_SIGNO = ['aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes'];
export const NUMEROS_VIDA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

/** As séries e os itens de cada uma, na ordem em que saem. */
export const SERIES = {
  numero: NUMEROS_VIDA,
  ponto_cego: SIGNOS,
  anjo: Array.from({ length: 72 }, (_, i) => i + 1),
  animal: Array.from({ length: 12 }, (_, i) => i), // índice em RAMOS (0 = Rato)
  selo: Array.from({ length: 20 }, (_, i) => i + 1), // código do selo (1 = Dragão)
};

export const HASHTAGS_BASE = ['#numerologia', '#astrologia', '#mapaastral', '#signos', '#autoconhecimento', '#espiritualidade'];

const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const pad = (n) => String(n).padStart(2, '0');
const maiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const minuscula = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const semPonto = (s) => String(s || '').trim().replace(/[.\s]+$/, '');

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

/** Data de hoje em Brasília. */
export function hojeBrasilia(agora = new Date()) {
  return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** Meio-dia de Brasília (15h UTC) da data: o instante de referência do dia. */
const meioDia = (dataISO) => Date.parse(`${dataISO}T15:00:00Z`);

// ── Rotação por dia da semana ──────────────────────────────────────────────

// Sexta alterna animal e selo pela semana: 02/01/2026 (sexta) = animal.
const SEXTA_REFERENCIA = '2026-01-02';

/** Tema do post do feed no dia, ou null na quinta (post feito à mão). */
export function temaDoDia(dataISO) {
  switch (diaDaSemana(dataISO)) {
    case 1: return 'numero';
    case 2: return 'ponto_cego';
    case 3: return 'anjo';
    case 4: return null;
    case 5: {
      const semanas = Math.round((Date.parse(`${dataISO}T00:00:00Z`) - Date.parse(`${SEXTA_REFERENCIA}T00:00:00Z`)) / (7 * 86400000));
      return ((semanas % 2) + 2) % 2 === 0 ? 'animal' : 'selo';
    }
    case 6: return 'comenta';
    default: return 'semana';
  }
}

/** Série que o tema consome (temas fixos, como sábado e domingo, não têm). */
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
 * do banco ({ numero: 3, anjo: 10, … } = próximo índice de cada série).
 * Não muda `estado`. Usado pela prévia (hoje + 7 dias) e pelos testes.
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

// ── Lua do dia ─────────────────────────────────────────────────────────────

/**
 * Fase em 4 nomes, na convenção dos calendários brasileiros: vale a última
 * fase principal que já aconteceu (Cheia do instante da cheia até o quarto
 * minguante, e assim por diante). Idade = graus da Lua à frente do Sol.
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
  // Fase pelo fim do dia (23h59 de Brasília): o dia da cheia já é "Lua Cheia",
  // como nos calendários, mesmo que ela aconteça à tarde.
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

export function energiaDoDia(dataISO) {
  const lua = luaDoDia(dataISO);
  const kin = kinDaData(dataISO);
  const selo = seloDoKin(kin);
  const tom = tomDoKin(kin);
  const hex = hexagramaDoDia(new Date(meioDia(dataISO)));
  const anjo = dadosDoAnjo(anjoPorLongitude(longitudeSolar(meioDia(dataISO))));
  const { titulo, frase } = partirHoje(TEXTO_SELO[selo.codigo].hoje);

  return {
    data: dataISO,
    kicker: `Energia de hoje · ${DIAS_CURTOS[diaDaSemana(dataISO)]} ${dataCurta(dataISO)}`,
    titulo,
    frase,
    lua,
    // Sem o hexagrama: com a letra maior nas descrições não cabia no story
    // (ele aparece no feed de domingo, dia a dia).
    linhas: [
      { rotulo: 'Lua', valor: lua.signo ? `${lua.fase} em ${lua.signo}` : lua.fase, nota: lua.signo ? maiuscula(LUA_NO_SIGNO[lua.signo].clima) : '' },
      { rotulo: 'Kin do dia', valor: nomeDoKin(kin), nota: maiuscula(TEXTO_TOM[tom.numero].hoje) },
      { rotulo: 'Anjo destes dias', valor: anjo.nome, nota: maiuscula(TEXTO_ANJO[anjo.n].dom) },
    ],
    cta: CTA_STORY,
    // referências pra prévia/log
    kin, hexagrama: `${hex.superior.nome} sobre ${hex.inferior.nome}`, anjo: anjo.nome,
  };
}

// ── Post do feed ───────────────────────────────────────────────────────────

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

function primeiraFrase(texto) {
  const m = /^(.+?[.!?])(\s|$)/.exec(texto);
  return m ? m[1] : texto;
}

function anosRecentes(i, ano, n = 6) {
  return anosDoAnimal(i, ano - 12 * n - 1, ano).map((a) => a.ano).filter((a) => a <= ano).slice(-n);
}

/**
 * Conteúdo do post do feed. `indice` = índice absoluto da série do tema
 * (ignorado em sábado e domingo). Quinta devolve null.
 * Formato: { tema, serie, indice, item, kicker, grande, titulo, linhas[], frase?, legenda{gancho, texto[], hashtags[]} }
 */
export function postDoDia(dataISO, indice = 0) {
  const tema = temaDoDia(dataISO);
  if (!tema) return null;
  const serie = serieDoTema(tema);
  const s = serie ? itemDaSerie(serie, indice) : null;
  const ano = Number(dataISO.slice(0, 4));
  const base = { data: dataISO, tema, serie, indice: serie ? indice : null, posicao: s?.posicao ?? null, total: s?.total ?? null };
  let p;

  if (tema === 'numero') {
    const n = s.item;
    const t = NUMERO_PROFUNDO[n];
    const mestre = n >= 11;
    p = {
      item: String(n),
      kicker: mestre ? 'Número de vida · número mestre' : 'Número de vida',
      grande: String(n),
      titulo: maiuscula(t.essencia),
      linhas: [
        { rotulo: 'Força', texto: maiuscula(t.forca) },
        { rotulo: 'Sombra', texto: maiuscula(t.sombra) },
        { rotulo: 'O caminho', texto: maiuscula(t.cura) },
      ],
      legenda: {
        gancho: `Número de vida ${n}: ${t.essencia}.`,
        texto: [
          `Força: ${t.forca}.`,
          `Sombra: ${t.sombra}.`,
          `O caminho: ${t.cura}.`,
          mestre ? `O ${n} é número mestre: na soma da data de nascimento, ele não se reduz.` : 'Seu número de vida sai da soma de todos os dígitos da sua data de nascimento.',
        ],
        hashtags: ['#numerodevida', '#caminhodevida'],
      },
    };
  } else if (tema === 'ponto_cego') {
    const signo = s.item;
    const i = SIGNOS.indexOf(signo);
    const t = SIGNO_PROFUNDO[signo];
    p = {
      item: signo,
      kicker: 'Ponto cego',
      grande: GLIFO_SIGNO[i],
      titulo: `O ponto cego de ${signo}`,
      linhas: [
        { rotulo: 'O que trava', texto: maiuscula(t.risco) },
        { rotulo: 'A virada', texto: maiuscula(t.chave) },
      ],
      frase: t.frase,
      legenda: {
        gancho: `O ponto cego de ${signo} (vale pra quem tem Sol, Lua ou Ascendente em ${signo}).`,
        texto: [`${maiuscula(t.risco)}.`, `A virada: ${t.chave}.`, `"${t.frase}"`],
        hashtags: [`#${SLUG_SIGNO[i]}`, '#zodiaco'],
      },
    };
  } else if (tema === 'anjo') {
    const n = s.item;
    const a = dadosDoAnjo(n);
    const t = TEXTO_ANJO[n];
    const per = periodosDoAno(ano)[n - 1];
    p = {
      item: a.nome,
      kicker: `Anjo da guarda · ${n} de 72`,
      grande: a.nome,
      titulo: t.dom,
      linhas: [
        { rotulo: 'Quem nasce entre', texto: `${per.inicio} e ${per.fim}` },
        { rotulo: 'Essência', texto: primeiraFrase(t.essencia) },
        { rotulo: 'Peça a ele', texto: maiuscula(t.pedir.join(' · ')) },
      ],
      legenda: {
        gancho: `Nasceu entre ${per.inicio} e ${per.fim}? Seu anjo da guarda é ${a.nome}.`,
        texto: [
          primeiraFrase(t.essencia),
          `Dom: ${minuscula(t.dom)}. Peça a ele: ${t.pedir.join(', ')}.`,
          'As datas mudam até 1 dia de um ano pro outro: o site calcula pela posição exata do Sol no seu nascimento.',
        ],
        hashtags: ['#anjodaguarda', '#anjoscabalisticos'],
      },
    };
  } else if (tema === 'animal') {
    const i = s.item;
    const r = RAMOS[i];
    const anos = anosRecentes(i, ano);
    const t = ANIMAIS[i];
    p = {
      item: r.animal,
      kicker: 'Astrologia chinesa',
      grande: r.animal,
      // O ano chinês começa no Lichun (~4/fev), não em 1º de janeiro.
      titulo: `Nasceu em ${anos.slice(-3).join(', ')}?`,
      tituloNota: '(a partir de 4/fev)',
      linhas: [
        { rotulo: 'Anos (sempre a partir de 4/fev)', texto: anos.join(' · ') },
        { rotulo: 'Nasceu em janeiro ou até 3/fev?', texto: 'Você é do animal anterior.' },
        { rotulo: 'Perfil', texto: t.perfil },
      ],
      legenda: {
        gancho: `Nasceu em ${anos.slice(-4, -1).join(', ')} ou ${anos[anos.length - 1]} (a partir de 4/fev)? Você é ${oAnimal(r.animal)}.`,
        texto: [
          t.perfil,
          'Nasceu em janeiro ou até 3/fev? Você é do animal anterior: o ano chinês começa no Lichun, por volta de 4 de fevereiro, não em 1º de janeiro.',
          'No site, o mapa chinês completo (os 4 pilares) é grátis e usa a data exata da virada.',
        ],
        hashtags: ['#horoscopochines', '#astrologiachinesa'],
      },
    };
  } else if (tema === 'selo') {
    const c = s.item;
    const selo = SELOS[c - 1];
    const t = TEXTO_SELO[c];
    p = {
      item: selo.nomeCompleto,
      kicker: `Kin Maia · selo ${c} de 20`,
      grande: selo.nomeCompleto,
      titulo: t.palavras.join(' · '),
      linhas: [
        { rotulo: 'Quem tem esse selo', texto: t.texto },
        { rotulo: 'Sombra', texto: t.sombra },
      ],
      legenda: {
        gancho: `${selo.nomeCompleto}: ${t.palavras.map((w) => w.toLowerCase()).join(', ')}.`,
        texto: [t.texto, `Sombra: ${minuscula(t.sombra)}`, 'Seu selo sai da sua data de nascimento, no Sincronário da Paz. No site é grátis.'],
        hashtags: ['#kinmaia', '#sincronariodapaz'],
      },
    };
  } else if (tema === 'comenta') {
    // Exemplo muda toda semana: dia/mês do próprio post, ano entre 1985 e 2004.
    const [, mm, dd] = dataISO.split('-');
    const exAno = 1985 + (Math.floor(Date.parse(`${dataISO}T00:00:00Z`) / (7 * 86400000)) % 20);
    const exemplo = `${dd}/${mm}/${exAno}`;
    const conta = contaNumeroVida(exemplo);
    p = {
      item: exemplo,
      kicker: 'Numerologia',
      grande: '?',
      titulo: 'Comenta sua data de nascimento que eu te digo seu número de vida',
      linhas: [
        { rotulo: `Exemplo: ${exemplo}`, texto: conta.etapas.join(' → ') },
        { rotulo: 'Números mestres', texto: '11, 22 e 33 não se reduzem' },
      ],
      legenda: {
        gancho: 'Comenta sua data de nascimento que eu te digo seu número de vida.',
        texto: [
          'Escreve aqui embaixo no formato dia/mês/ano.',
          `Exemplo: ${exemplo} → ${conta.etapas.join(' → ')}. Número de vida ${conta.numero}.`,
          'Os números 11, 22 e 33 não se reduzem: são números mestres.',
        ],
        hashtags: ['#numerodevida', '#caminhodevida'],
      },
    };
  } else {
    // domingo: os próximos 7 dias (segunda a domingo)
    const dias = Array.from({ length: 7 }, (_, k) => {
      const d = somarDias(dataISO, k + 1);
      const lua = luaDoDia(d);
      const hx = hexagramaDoDia(new Date(meioDia(d)));
      return {
        data: d, rotulo: `${DIAS_CURTOS[diaDaSemana(d)]} ${dataCurta(d)}`, lua: lua.signo ? `Lua em ${lua.signo}` : lua.fase, fase: lua.fase,
        kin: nomeDoKin(kinDaData(d)), hexagrama: `${hx.superior.nome} sobre ${hx.inferior.nome}`,
      };
    });
    // Troca de fase principal na semana (nova/cheia/quartos), uma vez por dia.
    let faseAnterior = luaDoDia(dataISO).fase;
    for (const d of dias) {
      d.mudaFase = d.fase !== faseAnterior;
      faseAnterior = d.fase;
    }
    p = {
      item: `${dataCurta(dias[0].data)}–${dataCurta(dias[6].data)}`,
      kicker: 'A energia da sua semana',
      grande: null,
      titulo: `${dataCurta(dias[0].data)} a ${dataCurta(dias[6].data)}`,
      dias,
      linhas: dias.map((d) => ({ rotulo: d.rotulo, texto: `${d.lua}${d.mudaFase ? ` · ${d.fase.replace('Lua ', '')}` : ''} · ${d.kin} · ${d.hexagrama}` })),
      legenda: {
        gancho: 'A energia da sua semana, dia por dia.',
        texto: [
          'A Lua, o Kin Maia e o hexagrama de cada dia, iguais pra todo mundo. Salva pra consultar durante a semana.',
          ...dias.map((d) => `${d.rotulo}: ${d.lua}${d.mudaFase ? ` (${d.fase})` : ''} · Kin ${d.kin} · Hexagrama ${d.hexagrama}`),
          'Como cada dia bate no SEU mapa, o Seu Dia te mostra às 7h.',
        ],
        hashtags: ['#luadodia', '#kinmaia'],
      },
    };
  }

  return { ...base, ...p };
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
// O Instagram e o TikTok baixam a imagem por uma URL pública. A URL leva
// data, formato e item da série, assinados com HMAC: ninguém gera arte de
// graça no nosso servidor nem troca o item pela URL.

export const FORMATOS = { story: { width: 1080, height: 1920 }, feed: { width: 1080, height: 1350 } };

function chaveAssinatura(segredo) {
  return `social-img:${segredo}`;
}

export function assinarImagem({ data, formato, indice = null }, segredo) {
  const msg = `${data}|${formato}|${indice ?? ''}`;
  return createHmac('sha256', chaveAssinatura(segredo)).update(msg).digest('hex').slice(0, 32);
}

export function conferirAssinatura({ data, formato, indice = null, t }, segredo) {
  if (!segredo || typeof t !== 'string' || t.length !== 32) return false;
  const esperado = assinarImagem({ data, formato, indice }, segredo);
  try {
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(t));
  } catch {
    return false;
  }
}

/** Caminho da imagem (relativo), já assinado. */
export function caminhoImagem({ data, formato, indice = null }, segredo) {
  const t = assinarImagem({ data, formato, indice }, segredo);
  const q = new URLSearchParams();
  if (indice != null) q.set('i', String(indice));
  q.set('t', t);
  return `/api/social/imagem/${data}/${formato}.jpg?${q.toString()}`;
}

export const dataValida = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

// ── Chave liga/desliga ─────────────────────────────────────────────────────
// SOCIAL_AUTOMACAO: vazio/"off" = desligada; "on" = Instagram e TikTok;
// "instagram" ou "tiktok" = só aquela rede (lista separada por vírgula vale).
export function redesLigadas(valor) {
  const v = String(valor || '').trim().toLowerCase();
  if (!v || ['off', '0', 'false', 'nao', 'não', 'desligada'].includes(v)) return [];
  if (['on', '1', 'true', 'sim', 'ligada', 'todas'].includes(v)) return ['instagram', 'tiktok'];
  return ['instagram', 'tiktok'].filter((r) => v.split(/[,\s]+/).includes(r));
}
