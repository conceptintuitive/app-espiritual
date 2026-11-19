// lib/kin.js — Kin Maia (Sincronário da Paz / Dreamspell, José Argüelles).
//
// Kin = posição 1–260 no Tzolkin. Contagem do Dreamspell: todo ano tem 365
// dias — o 29/02 não conta (é o "0.0 Hunab Ku"); na tradição, quem nasce nele
// fica com o Kin do 28/02 se nasceu antes do meio-dia e com o do 01/03 depois.
// Âncora: 21/12/2012 = Kin 207 (Mão Cristal Azul). Conferido com tabelas
// publicadas (tests/kin.test.js).
//
// Selo = (kin−1) mod 20, tom = (kin−1) mod 13. Oráculo do Dreamspell:
// guia (mesma cor, depende do tom), análogo (códigos somam 19), antípoda
// (+10), oculto (códigos somam 21; Kin oculto = 261 − kin).
//
// Sem API, sem banco, sem IA. Textos em lib/kinTextos.js.

const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const dias365 = (y, m, d) => y * 365 + CUM[m - 1] + d;
const ANCORA = dias365(2012, 12, 21);
const KIN_ANCORA = 207;

// [nome, feminino?] — a ordem do Dreamspell (Dragão = código 1 … Sol = código 20).
const SELOS_BASE = [
  ['Dragão', false], ['Vento', false], ['Noite', true], ['Semente', true], ['Serpente', true],
  ['Enlaçador de Mundos', false], ['Mão', true], ['Estrela', true], ['Lua', true], ['Cachorro', false],
  ['Macaco', false], ['Humano', false], ['Caminhante do Céu', false], ['Mago', false], ['Águia', true],
  ['Guerreiro', false], ['Terra', true], ['Espelho', false], ['Tormenta', true], ['Sol', false],
];

const CORES = [
  { nome: 'Vermelha', m: 'Vermelho', f: 'Vermelha', acao: 'inicia', hex: '#ef4444' },
  { nome: 'Branca', m: 'Branco', f: 'Branca', acao: 'refina', hex: '#f5f5f4' },
  { nome: 'Azul', m: 'Azul', f: 'Azul', acao: 'transforma', hex: '#60a5fa' },
  { nome: 'Amarela', m: 'Amarelo', f: 'Amarela', acao: 'amadurece', hex: '#facc15' },
];

const TONS_BASE = [
  ['Magnético', 'Magnética'], ['Lunar', 'Lunar'], ['Elétrico', 'Elétrica'], ['Autoexistente', 'Autoexistente'],
  ['Harmônico', 'Harmônica'], ['Rítmico', 'Rítmica'], ['Ressonante', 'Ressonante'], ['Galáctico', 'Galáctica'],
  ['Solar', 'Solar'], ['Planetário', 'Planetária'], ['Espectral', 'Espectral'], ['Cristal', 'Cristal'], ['Cósmico', 'Cósmica'],
];

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** 20 selos: código 1–20, nome com a cor ("Dragão Vermelho"), cor. */
export const SELOS = SELOS_BASE.map(([nome, fem], i) => {
  const cor = CORES[i % 4];
  return { codigo: i + 1, nome, feminino: fem, cor, nomeCompleto: `${nome} ${fem ? cor.f : cor.m}`, slug: slugify(`${nome} ${fem ? cor.f : cor.m}`) };
});

export const TONS = TONS_BASE.map(([m, f], i) => ({ numero: i + 1, m, f }));

const mod = (n, k) => ((n % k) + k) % k;

/** Kin 1–260 de uma data civil "YYYY-MM-DD". 29/02: antes do meio-dia = 28/02, depois = 01/03. */
export function kinDaData(dataISO, hora = null) {
  const [y, m, d] = String(dataISO).split('-').map(Number);
  if (!y || !m || !d) throw new Error('data inválida');
  let n;
  if (m === 2 && d === 29) {
    const depoisMeioDia = typeof hora === 'string' && /^\d{1,2}:\d{2}$/.test(hora) && Number(hora.split(':')[0]) >= 12;
    n = depoisMeioDia ? dias365(y, 3, 1) : dias365(y, 2, 28);
  } else {
    n = dias365(y, m, d);
  }
  return mod(KIN_ANCORA - 1 + n - ANCORA, 260) + 1;
}

export const seloDoKin = (kin) => SELOS[mod(kin - 1, 20)];
export const tomDoKin = (kin) => TONS[mod(kin - 1, 13)];

/** Kin a partir de selo (código 1–20) e tom (1–13): único no ciclo de 260. */
export function kinDeSeloTom(codigo, tom) {
  for (let k = 1; k <= 260; k++) if (mod(k - 1, 20) + 1 === codigo && mod(k - 1, 13) + 1 === tom) return k;
  return null;
}

/** Nome do Kin no padrão do Sincronário: selo + tom + cor ("Terra Ressonante Vermelha"). */
export function nomeDoKin(kin) {
  const s = seloDoKin(kin);
  const t = tomDoKin(kin);
  return `${s.nome} ${s.feminino ? t.f : t.m} ${s.feminino ? s.cor.f : s.cor.m}`;
}

// Guia: deslocamento do código do selo conforme o tom (sempre a mesma cor).
const DESLOC_GUIA = { 1: 0, 6: 0, 11: 0, 2: 12, 7: 12, 12: 12, 3: 4, 8: 4, 13: 4, 4: 16, 9: 16, 5: 8, 10: 8 };
const codigo20 = (c) => mod(c - 1, 20) + 1;

/** Oráculo do Dreamspell: os quatro selos ao redor do seu. */
export function oraculo(kin) {
  const c = seloDoKin(kin).codigo;
  const t = tomDoKin(kin).numero;
  const guia = codigo20(c + DESLOC_GUIA[t]);
  const analogo = codigo20(19 - c);
  const antipoda = codigo20(c + 10);
  const oculto = codigo20(21 - c);
  return {
    destino: kin,
    guia: kinDeSeloTom(guia, t),
    analogo: kinDeSeloTom(analogo, t),
    antipoda: kinDeSeloTom(antipoda, t),
    oculto: 261 - kin,
  };
}

/** Onda Encantada: as 13 jornadas de 13 dias; leva o nome do selo do Kin de tom 1. */
export function ondaEncantada(kin) {
  const t = tomDoKin(kin).numero;
  const inicio = mod(kin - t, 260) + 1;
  return { inicio, selo: seloDoKin(inicio), posicao: t };
}

/** Tudo do Kin de uma pessoa. */
export function calcularKin({ data, hora = null }) {
  const kin = kinDaData(data, hora);
  const [, m, d] = String(data).split('-').map(Number);
  return {
    kin,
    nome: nomeDoKin(kin),
    selo: seloDoKin(kin),
    tom: tomDoKin(kin),
    oraculo: oraculo(kin),
    onda: ondaEncantada(kin),
    bissexto: m === 2 && d === 29,
  };
}

/**
 * Como o Kin do dia conversa com o Kin da pessoa (pelo selo).
 * @returns {'retorno'|'proprio'|'guia'|'analogo'|'antipoda'|'oculto'|'tom'|null}
 */
export function relacaoDoDia(kinPessoa, kinDia) {
  if (kinPessoa === kinDia) return 'retorno';
  const o = oraculo(kinPessoa);
  const sd = seloDoKin(kinDia).codigo;
  if (sd === seloDoKin(kinPessoa).codigo) return 'proprio';
  if (sd === seloDoKin(o.guia).codigo) return 'guia';
  if (sd === seloDoKin(o.analogo).codigo) return 'analogo';
  if (sd === seloDoKin(o.antipoda).codigo) return 'antipoda';
  if (sd === seloDoKin(o.oculto).codigo) return 'oculto';
  if (tomDoKin(kinDia).numero === tomDoKin(kinPessoa).numero) return 'tom';
  return null;
}
