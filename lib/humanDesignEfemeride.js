// lib/humanDesignEfemeride.js
// Posições planetárias de precisão para o Human Design, via astronomy-engine
// (VSOP87/ELP, mesma família de modelos do Swiss Ephemeris que os softwares
// de HD usam).
//
// Por que existe separado de lib/calculos.js: as fórmulas resumidas de lá
// (Meeus/Schlyter) erram em média ~0,01–0,06° e até ~0,3° no Nodo Lunar. Isso
// é bom para signo, mas no Human Design uma linha tem só 0,9375°. Na conferência
// de nov/2026 contra o Swiss Ephemeris (3.000 nascimentos aleatórios entre
// 1940 e 2015), ~1,8% dos mapas saíam com Tipo, Autoridade ou Perfil errado
// usando calculos.js. Com este módulo foram 0,03% (só Perfil, em casos de Sol
// literalmente em cima da virada de linha).
//
// Fica num arquivo próprio para não pesar o bundle das páginas que só usam
// calculos.js (o astronomy-engine tem ~47 KB gzip).

import {
  MakeTime,
  SunPosition,
  EclipticGeoMoon,
  GeoMoon,
  GeoVector,
  Rotation_EQJ_ECT,
  RotateVector,
  Body,
} from 'astronomy-engine';

const norm360 = (x) => ((x % 360) + 360) % 360;

const PLANETAS = {
  mercurio: Body.Mercury,
  venus: Body.Venus,
  marte: Body.Mars,
  jupiter: Body.Jupiter,
  saturno: Body.Saturn,
  urano: Body.Uranus,
  netuno: Body.Neptune,
  plutao: Body.Pluto,
};

// Vetor equatorial J2000 → eclíptica verdadeira da data.
function eclipticaDaData(vetorEqj, tempo) {
  return RotateVector(Rotation_EQJ_ECT(tempo), vetorEqj);
}

function longitude(v) {
  return norm360((Math.atan2(v.y, v.x) * 180) / Math.PI);
}

// Nodo Norte verdadeiro (osculante), o padrão do Human Design: nodo
// ascendente da órbita instantânea da Lua, a partir de posição × velocidade.
function nodoVerdadeiro(tempo) {
  const dt = 1 / 1440; // 1 minuto, em dias
  const p = eclipticaDaData(GeoMoon(tempo), tempo);
  const a = eclipticaDaData(GeoMoon(tempo.AddDays(-dt)), tempo);
  const b = eclipticaDaData(GeoMoon(tempo.AddDays(dt)), tempo);
  const v = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const h = { x: p.y * v.z - p.z * v.y, y: p.z * v.x - p.x * v.z };
  return norm360((Math.atan2(h.x, -h.y) * 180) / Math.PI);
}

function corpos(tempo) {
  const sol = SunPosition(tempo).elon;
  const nodoNorte = nodoVerdadeiro(tempo);
  const r = {
    sol,
    terra: norm360(sol + 180),
    lua: EclipticGeoMoon(tempo).lon,
    nodoNorte,
    nodoSul: norm360(nodoNorte + 180),
  };
  for (const [chave, corpo] of Object.entries(PLANETAS)) {
    r[chave] = longitude(eclipticaDaData(GeoVector(corpo, tempo, true), tempo));
  }
  return r;
}

// Momento em que o Sol estava exatamente 88° antes da posição no nascimento.
function tempoDesign(tempoNascimento) {
  const alvo = norm360(SunPosition(tempoNascimento).elon - 88);
  let t = tempoNascimento.AddDays(-89);
  for (let i = 0; i < 50; i++) {
    let diff = norm360(SunPosition(t).elon - alvo);
    if (diff > 180) diff -= 360;
    if (Math.abs(diff) < 1e-7) break;
    t = t.AddDays(-diff / 0.9856);
  }
  return t;
}

/**
 * Mesma assinatura e mesmo formato de retorno de
 * calcularCorposCelestesParaHumanDesign() em lib/calculos.js.
 *
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {string|null} horaNascimento "HH:MM" local (meio-dia se ausente)
 * @param {number} utcOffset offset local em horas (ex.: −3, −2 no horário de verão)
 * @returns {{ personalidade: Object, design: Object } | null} longitudes em graus
 */
export function calcularCorposHumanDesign(dataNascimentoISO, horaNascimento = null, utcOffset = -3) {
  const parts = (dataNascimentoISO || '').split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [ano, mes, dia] = parts;

  let hora = 12;
  let minuto = 0;
  if (horaNascimento && /^\d{1,2}:\d{2}/.test(String(horaNascimento))) {
    const [h, m] = String(horaNascimento).split(':').map(Number);
    if (!isNaN(h) && h >= 0 && h <= 23) { hora = h; minuto = m || 0; }
  }

  // Date.UTC normaliza hora fora de 0–23 (ex.: 23h com offset −3 → 2h do dia seguinte).
  const utcMs = Date.UTC(ano, mes - 1, dia, hora, minuto) - utcOffset * 3600000;
  const tempo = MakeTime(new Date(utcMs));

  return {
    personalidade: corpos(tempo),
    design: corpos(tempoDesign(tempo)),
  };
}
