// lib/bazi.js
// Astrologia chinesa — BaZi (八字, "Quatro Pilares do Destino").
// Sem dependências, roda no browser e no Node — testes em tests/bazi.test.js.
//
// Como o mapa é montado:
// - ANO e MÊS seguem o calendário SOLAR chinês (não o lunar): o ano vira no
//   Lichun (Sol a 315° de longitude, ~4 de fevereiro) e cada mês começa num
//   "termo solar" (jie), a cada 30° de longitude do Sol. Por isso alguém nascido
//   em 20/jan pertence ao ano anterior, e o mês do Rato começa ~7/dez.
// - DIA vem do ciclo contínuo de 60 dias (sem reinício desde a Antiguidade).
// - HORA usa o HORÁRIO SOLAR VERDADEIRO: hora do relógio → UTC (com o horário
//   de verão histórico do fuso, via lib/sky.js) → + longitude/15 + equação do
//   tempo. Ex.: Vitória, 21/12/1994 07:25 de relógio (verão, UTC-2) = ~06:45
//   solar → hora do Coelho; sem a correção daria Dragão.
// - Virada do dia às 23h solares (início da hora do Rato pertence ao dia
//   seguinte — escola tradicional).
//
// Índices: tronco 0–9 (0 = Jia), ramo 0–11 (0 = Zi/Rato), elemento 0–4
// (0 Madeira, 1 Fogo, 2 Terra, 3 Metal, 4 Água — ciclo de geração).

import { localToUTC } from './sky.js';

const D2R = Math.PI / 180;

// ── Tabelas base ─────────────────────────────────────────────────────────────

export const TRONCOS = [
  { pinyin: 'Jia', hanzi: '甲', elemento: 0, yang: true },
  { pinyin: 'Yi', hanzi: '乙', elemento: 0, yang: false },
  { pinyin: 'Bing', hanzi: '丙', elemento: 1, yang: true },
  { pinyin: 'Ding', hanzi: '丁', elemento: 1, yang: false },
  { pinyin: 'Wu', hanzi: '戊', elemento: 2, yang: true },
  { pinyin: 'Ji', hanzi: '己', elemento: 2, yang: false },
  { pinyin: 'Geng', hanzi: '庚', elemento: 3, yang: true },
  { pinyin: 'Xin', hanzi: '辛', elemento: 3, yang: false },
  { pinyin: 'Ren', hanzi: '壬', elemento: 4, yang: true },
  { pinyin: 'Gui', hanzi: '癸', elemento: 4, yang: false },
];

/** `ocultos`: troncos escondidos no ramo, o 1º é o principal. */
export const RAMOS = [
  { pinyin: 'Zi', hanzi: '子', animal: 'Rato', slug: 'rato', elemento: 4, ocultos: [9] },
  { pinyin: 'Chou', hanzi: '丑', animal: 'Boi', slug: 'boi', elemento: 2, ocultos: [5, 9, 7] },
  { pinyin: 'Yin', hanzi: '寅', animal: 'Tigre', slug: 'tigre', elemento: 0, ocultos: [0, 2, 4] },
  { pinyin: 'Mao', hanzi: '卯', animal: 'Coelho', slug: 'coelho', elemento: 0, ocultos: [1] },
  { pinyin: 'Chen', hanzi: '辰', animal: 'Dragão', slug: 'dragao', elemento: 2, ocultos: [4, 1, 9] },
  { pinyin: 'Si', hanzi: '巳', animal: 'Serpente', slug: 'serpente', elemento: 1, ocultos: [2, 4, 6] },
  { pinyin: 'Wu', hanzi: '午', animal: 'Cavalo', slug: 'cavalo', elemento: 1, ocultos: [3, 5] },
  { pinyin: 'Wei', hanzi: '未', animal: 'Cabra', slug: 'cabra', elemento: 2, ocultos: [5, 3, 1] },
  { pinyin: 'Shen', hanzi: '申', animal: 'Macaco', slug: 'macaco', elemento: 3, ocultos: [6, 8, 4] },
  { pinyin: 'You', hanzi: '酉', animal: 'Galo', slug: 'galo', elemento: 3, ocultos: [7] },
  { pinyin: 'Xu', hanzi: '戌', animal: 'Cachorro', slug: 'cachorro', elemento: 2, ocultos: [4, 7, 3] },
  { pinyin: 'Hai', hanzi: '亥', animal: 'Porco', slug: 'porco', elemento: 4, ocultos: [8, 0] },
];

export const ELEMENTOS = [
  { nome: 'Madeira', slug: 'madeira', hanzi: '木', cor: '#4ade80' },
  { nome: 'Fogo', slug: 'fogo', hanzi: '火', cor: '#f87171' },
  { nome: 'Terra', slug: 'terra', hanzi: '土', cor: '#fbbf24' },
  { nome: 'Metal', slug: 'metal', hanzi: '金', cor: '#e5e7eb' },
  { nome: 'Água', slug: 'agua', hanzi: '水', cor: '#60a5fa' },
];

/** Gênero gramatical do animal, pra montar "Cachorro de Madeira" / "Cabra de Fogo". */
export function nomePilar(tronco, ramo) {
  return `${RAMOS[ramo].animal} de ${ELEMENTOS[TRONCOS[tronco].elemento].nome}`;
}

/** Tronco + ramo de um índice 0–59 do ciclo sexagenário. */
export function cicloParaPilar(i) {
  const n = ((i % 60) + 60) % 60;
  return { tronco: n % 10, ramo: n % 12 };
}

// ── Sol: longitude aparente e equação do tempo (Meeus, cap. 25 e 28) ─────────
// Precisão ~0,01° na longitude (≈15 min no instante de um termo solar) — o
// suficiente pro mapa; `pertoDaTroca` avisa quando o nascimento cai a menos de
// ~1h de uma virada de mês/ano.

function julianDay(utcMs) {
  return utcMs / 86400000 + 2440587.5;
}

function solar(utcMs) {
  const T = (julianDay(utcMs) - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const e = 0.016708634 - 0.000042037 * T;
  const Mr = M * D2R;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const omega = (125.04 - 1934.136 * T) * D2R;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);

  const eps = (23.439291 - 0.0130042 * T + 0.00256 * Math.cos(omega)) * D2R;
  const y = Math.tan(eps / 2) ** 2;
  const L0r = L0 * D2R;
  const E = y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr)
    + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r)
    - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr);

  return {
    longitude: ((lambda % 360) + 360) % 360,
    equacaoDoTempoMin: (E / D2R) * 4,
  };
}

/** Equação do tempo em minutos (horário solar verdadeiro − horário solar médio). */
export function equacaoDoTempoMin(utcMs) {
  return solar(utcMs).equacaoDoTempoMin;
}

/** Longitude aparente do Sol em graus [0, 360). Exportada pros testes. */
export function longitudeSolar(utcMs) {
  return solar(utcMs).longitude;
}

// ── Pilares ──────────────────────────────────────────────────────────────────

/** Índice 0–59 do dia (0 = Jia Zi) para uma data civil. 01/01/2000 = Wu Wu (54). */
export function cicloDoDia(y, m, d) {
  const jdn = Math.round(Date.UTC(y, m - 1, d) / 86400000 + 2440587.5);
  return (((jdn + 49) % 60) + 60) % 60;
}

function pilarDoAno(anoChines) {
  return { tronco: (((anoChines - 4) % 10) + 10) % 10, ramo: (((anoChines - 4) % 12) + 12) % 12 };
}

/**
 * Pilar do ano chinês que COMEÇA em fevereiro do ano gregoriano `ano`.
 * Ex.: 2026 → Cavalo de Fogo (Bing Wu), 2027 → Cabra de Fogo (Ding Wei).
 */
export function pilarDoAnoGregoriano(ano) {
  return pilarDoAno(ano);
}

/**
 * Monta o mapa BaZi.
 *
 * @param {{
 *   data: string,            // "YYYY-MM-DD"
 *   hora?: string|null,      // "HH:MM" do relógio, ou null se não sabe
 *   tz?: string,             // fuso IANA do local (default America/Sao_Paulo)
 *   lon?: number|null,       // longitude do local; sem ela, usa o meridiano do fuso (aproximado)
 * }} p
 */
export function calcularBazi({ data, hora = null, tz = 'America/Sao_Paulo', lon = null }) {
  const [y, m, d] = data.split('-').map(Number);
  if (!y || !m || !d) throw new Error('data inválida');

  const temHora = typeof hora === 'string' && /^\d{1,2}:\d{2}$/.test(hora);
  // Sem hora: meio-dia — o pilar do dia quase nunca muda e o ano/mês só mudam
  // em quem nasceu no próprio dia de um termo solar (sinalizado em pertoDaTroca).
  const [hh, mm] = temHora ? hora.split(':').map(Number) : [12, 0];
  const utcMs = localToUTC({ y, m, d, hh, mm }, tz);
  const offsetMin = Math.round((Date.UTC(y, m - 1, d, hh, mm) - utcMs) / 60000);

  const sol = solar(utcMs);

  // Mês solar: 0 = Tigre (começa em 315°) … 10 = Rato (255°), 11 = Boi (285°).
  const desdeLichun = (sol.longitude - 315 + 360) % 360;
  const mesIdx = Math.floor(desdeLichun / 30);
  const grausAteBorda = Math.min(desdeLichun % 30, 30 - (desdeLichun % 30));
  // Sol anda ~0,0417°/h → 0,05° ≈ 1h10.
  const pertoDaTroca = grausAteBorda < 0.05;

  // Ano: janeiro/início de fevereiro antes do Lichun ainda é o ano anterior.
  const anoChines = m <= 2 && mesIdx >= 10 ? y - 1 : y;
  const ano = pilarDoAno(anoChines);

  const troncoTigre = ((ano.tronco % 5) * 2 + 2) % 10;
  const mes = { tronco: (troncoTigre + mesIdx) % 10, ramo: (mesIdx + 2) % 12 };

  // Horário solar verdadeiro (minutos desde a meia-noite UTC do dia gregoriano local).
  // Sem longitude, usa o meridiano do fuso PADRÃO: no horário de verão o
  // offset do relógio está 1h adiantado (UTC-2 em vez de UTC-3), e usar ele
  // como meridiano adiantaria a hora solar em 1h de novo.
  const verao = temHora && offsetMinVerao(tz, utcMs, offsetMin);
  const offsetPadraoMin = verao ? offsetMin - 60 : offsetMin;
  const lonUsada = typeof lon === 'number' && Number.isFinite(lon) ? lon : (offsetPadraoMin / 60) * 15;
  const solarMs = utcMs + (lonUsada * 4 + sol.equacaoDoTempoMin) * 60000;
  const solarData = new Date(solarMs);
  const sy = solarData.getUTCFullYear();
  const sm = solarData.getUTCMonth() + 1;
  const sd = solarData.getUTCDate();
  const solarMin = solarData.getUTCHours() * 60 + solarData.getUTCMinutes();

  // Dia: pelo calendário solar; a partir das 23h já é o dia seguinte.
  let iDia = cicloDoDia(temHora ? sy : y, temHora ? sm : m, temHora ? sd : d);
  if (temHora && solarMin >= 23 * 60) iDia = (iDia + 1) % 60;
  const dia = cicloParaPilar(iDia);

  let horaPilar = null;
  if (temHora) {
    const ramoHora = Math.floor((solarMin + 60) / 120) % 12;
    const troncoRato = ((dia.tronco % 5) * 2) % 10;
    horaPilar = { tronco: (troncoRato + ramoHora) % 10, ramo: ramoHora };
  }

  const pad = (n) => String(n).padStart(2, '0');
  return {
    ano, mes, dia, hora: horaPilar,
    anoChines,
    diaMestre: dia.tronco,
    horaSolar: temHora ? `${pad(Math.floor(solarMin / 60))}:${pad(solarMin % 60)}` : null,
    horaRelogio: temHora ? `${pad(hh)}:${pad(mm)}` : null,
    offsetUtcHoras: offsetMin / 60,
    horarioDeVerao: verao,
    longitudeAproximada: !(typeof lon === 'number' && Number.isFinite(lon)),
    pertoDaTroca,
    longitudeSolar: sol.longitude,
  };
}

/** true quando o offset no nascimento é 1h "à frente" do padrão do fuso naquele ano. */
function offsetMinVerao(tz, utcMs, offsetMin) {
  const ano = new Date(utcMs).getUTCFullYear();
  // Junho é inverno no Brasil — nunca houve horário de verão em junho por aqui.
  const jun = localToUTC({ y: ano, m: 6, d: 21, hh: 12, mm: 0 }, tz);
  const offsetJun = Math.round((Date.UTC(ano, 5, 21, 12, 0) - jun) / 60000);
  return offsetMin > offsetJun;
}

// ── Dez Deuses (十神) ─────────────────────────────────────────────────────────

export const DEZ_DEUSES = {
  amigo: { nome: 'Amigo', hanzi: '比肩', pinyin: 'Bi Jian' },
  rival: { nome: 'Rival', hanzi: '劫财', pinyin: 'Jie Cai' },
  deusComida: { nome: 'Deus da Comida', hanzi: '食神', pinyin: 'Shi Shen' },
  oficialFerido: { nome: 'Oficial Ferido', hanzi: '伤官', pinyin: 'Shang Guan' },
  riquezaIndireta: { nome: 'Riqueza Indireta', hanzi: '偏财', pinyin: 'Pian Cai' },
  riquezaDireta: { nome: 'Riqueza Direta', hanzi: '正财', pinyin: 'Zheng Cai' },
  seteMatancas: { nome: '7 Matanças', hanzi: '七杀', pinyin: 'Qi Sha' },
  oficialDireto: { nome: 'Oficial Direto', hanzi: '正官', pinyin: 'Zheng Guan' },
  recursoIndireto: { nome: 'Recurso Indireto', hanzi: '偏印', pinyin: 'Pian Yin' },
  recursoDireto: { nome: 'Recurso Direto', hanzi: '正印', pinyin: 'Zheng Yin' },
};

/** Chave do Deus que o tronco `outro` representa para o Day Master `eu`. */
export function dezDeuses(eu, outro) {
  const a = TRONCOS[eu];
  const b = TRONCOS[outro];
  const mesmaPol = a.yang === b.yang;
  const rel = (b.elemento - a.elemento + 5) % 5;
  return [
    mesmaPol ? 'amigo' : 'rival',                       // mesmo elemento
    mesmaPol ? 'deusComida' : 'oficialFerido',          // eu gero
    mesmaPol ? 'riquezaIndireta' : 'riquezaDireta',     // eu controlo
    mesmaPol ? 'seteMatancas' : 'oficialDireto',        // me controla
    mesmaPol ? 'recursoIndireto' : 'recursoDireto',     // me gera
  ][rel];
}

// ── Relações entre ramos e troncos ───────────────────────────────────────────

const par = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const SEIS_COMBINACOES = new Set([par(0, 1), par(2, 11), par(3, 10), par(4, 9), par(5, 8), par(6, 7)]);
const DANOS = new Set([par(0, 7), par(1, 6), par(2, 5), par(3, 4), par(8, 11), par(9, 10)]);
export const TRIOS = [
  { ramos: [8, 0, 4], elemento: 4 }, // Macaco–Rato–Dragão: Água
  { ramos: [11, 3, 7], elemento: 0 }, // Porco–Coelho–Cabra: Madeira
  { ramos: [2, 6, 10], elemento: 1 }, // Tigre–Cavalo–Cachorro: Fogo
  { ramos: [5, 9, 1], elemento: 3 }, // Serpente–Galo–Boi: Metal
];
const PUNICOES = [
  { ramos: [2, 5, 8], tipo: 'Tigre–Serpente–Macaco' },
  { ramos: [1, 10, 7], tipo: 'Boi–Cachorro–Cabra' },
  { ramos: [0, 3], tipo: 'Rato–Coelho' },
];
const COMBINACOES_TRONCO = new Set([par(0, 5), par(1, 6), par(2, 7), par(3, 8), par(4, 9)]);
const ELEMENTO_COMBINACAO_TRONCO = { [par(0, 5)]: 2, [par(1, 6)]: 3, [par(2, 7)]: 4, [par(3, 8)]: 0, [par(4, 9)]: 1 };

/**
 * Relações entre dois ramos. Pode ter mais de uma (ex.: Cachorro–Cabra é
 * punição; Rato–Cavalo é choque).
 * @returns {Array<'combinacao'|'trio'|'choque'|'punicao'|'dano'>}
 */
export function relacoesRamos(a, b) {
  const out = [];
  if (a === b) return out;
  const k = par(a, b);
  if (SEIS_COMBINACOES.has(k)) out.push('combinacao');
  if (TRIOS.some((t) => t.ramos.includes(a) && t.ramos.includes(b))) out.push('trio');
  if ((a - b + 12) % 12 === 6) out.push('choque');
  if (PUNICOES.some((p) => p.ramos.includes(a) && p.ramos.includes(b))) out.push('punicao');
  if (DANOS.has(k)) out.push('dano');
  return out;
}

/** Elemento gerado quando dois troncos se combinam (ex.: Bing + Xin → Água), ou null. */
export function combinacaoTroncos(a, b) {
  const k = par(a, b);
  return COMBINACOES_TRONCO.has(k) ? ELEMENTO_COMBINACAO_TRONCO[k] : null;
}

/** Ramo "Flor de Pêssego" (romance/carisma) a partir de um ramo base. */
export function florDePessego(ramo) {
  const trio = TRIOS.find((t) => t.ramos.includes(ramo));
  return { 4: 9, 0: 0, 1: 3, 3: 6 }[trio.elemento];
}

export const NOMES_POSICAO = { ano: 'Ano', mes: 'Mês', dia: 'Dia', hora: 'Hora' };

/**
 * Lista as relações relevantes DENTRO do mapa (entre pilares) — troncos que
 * se combinam e ramos que se combinam/chocam/punem/ferem.
 */
export function relacoesDoMapa(mapa) {
  const posicoes = ['ano', 'mes', 'dia', 'hora'].filter((p) => mapa[p]);
  const out = [];
  for (let i = 0; i < posicoes.length; i++) {
    for (let j = i + 1; j < posicoes.length; j++) {
      const p1 = posicoes[i];
      const p2 = posicoes[j];
      const a = mapa[p1];
      const b = mapa[p2];
      const elem = combinacaoTroncos(a.tronco, b.tronco);
      if (elem !== null) out.push({ tipo: 'combinacaoTronco', entre: [p1, p2], elemento: elem, troncos: [a.tronco, b.tronco] });
      for (const tipo of relacoesRamos(a.ramo, b.ramo)) {
        out.push({ tipo, entre: [p1, p2], ramos: [a.ramo, b.ramo] });
      }
    }
  }
  return out;
}

/**
 * Contagem dos 5 elementos: cada tronco visível vale 1, cada ramo vale 1
 * (elemento principal) e os troncos ocultos secundários valem 0,3 — o peso
 * de "bastidor". O ramo do MÊS vale dobrado (estação do nascimento).
 */
export function contarElementos(mapa) {
  const pts = [0, 0, 0, 0, 0];
  for (const p of ['ano', 'mes', 'dia', 'hora']) {
    const pil = mapa[p];
    if (!pil) continue;
    pts[TRONCOS[pil.tronco].elemento] += 1;
    const pesoRamo = p === 'mes' ? 2 : 1;
    pts[RAMOS[pil.ramo].elemento] += pesoRamo;
    for (const t of RAMOS[pil.ramo].ocultos.slice(1)) pts[TRONCOS[t].elemento] += 0.3;
  }
  return pts.map((v) => Math.round(v * 10) / 10);
}

/**
 * Força aproximada do Day Master: pontos do próprio elemento + do elemento que
 * o gera, sobre o total. É uma régua simples (as escolas divergem nos pesos);
 * serve pra dizer se o mapa pede apoio ou escoamento.
 * @returns {{ apoio: number, total: number, proporcao: number, nivel: 'forte'|'equilibrado'|'fraco' }}
 */
export function forcaDiaMestre(mapa) {
  const pts = contarElementos(mapa);
  const eu = TRONCOS[mapa.diaMestre].elemento;
  const mae = (eu + 4) % 5;
  const apoio = pts[eu] + pts[mae];
  const total = pts.reduce((s, v) => s + v, 0);
  const proporcao = apoio / total;
  const nivel = proporcao >= 0.55 ? 'forte' : proporcao <= 0.38 ? 'fraco' : 'equilibrado';
  return { apoio: Math.round(apoio * 10) / 10, total: Math.round(total * 10) / 10, proporcao, nivel };
}

/**
 * Leitura de um ano chinês para o mapa: Deus do tronco do ano + relações do
 * ramo do ano com o ramo do ANO de nascimento (o "animal") e do DIA.
 */
export function leituraDoAno(mapa, anoGregoriano) {
  const anoP = pilarDoAno(anoGregoriano);
  return {
    ano: anoGregoriano,
    pilar: anoP,
    deus: dezDeuses(mapa.diaMestre, anoP.tronco),
    comAnimal: relacoesRamos(anoP.ramo, mapa.ano.ramo),
    mesmoAnimal: anoP.ramo === mapa.ano.ramo,
    comDia: relacoesRamos(anoP.ramo, mapa.dia.ramo),
    florDePessego: florDePessego(mapa.dia.ramo) === anoP.ramo,
    combinaDiaMestre: combinacaoTroncos(anoP.tronco, mapa.diaMestre) !== null,
  };
}
