// lib/sky.js
// Matemática do céu do nascimento, extraída da demo do Olho Cósmico
// (reference/olho-cosmico/index.html, na branch reference-olho — fora da main).
// Sem dependências, roda no browser e no
// Node — testes em tests/sky.test.js (`npm test`).
//
// Convenções: ângulos de entrada/saída em GRAUS, exceto altAz (radianos, pra
// não converter de novo a cada uma das ~3 mil estrelas por frame). Tempo em
// milissegundos UTC (o mesmo número de Date.now()).

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/** Normaliza um ângulo pra [0, 360). */
export function norm360(deg) {
  return ((deg % 360) + 360) % 360;
}

/**
 * Diferença (em minutos) entre a hora local de `zone` e UTC num instante.
 * Ex.: America/Sao_Paulo em jul/2020 → -180. Usa o tzdata do Intl, então já
 * inclui o horário de verão histórico de cada estado.
 * @param {number} utcMs
 * @param {string} zone zona IANA
 * @returns {number}
 */
export function tzOffsetMinutes(utcMs, zone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
      .formatToParts(new Date(utcMs))
      .map((x) => [x.type, x.value]),
  );
  const asUTC = Date.UTC(+parts.year, parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return (asUTC - utcMs) / 60000;
}

/**
 * Converte uma hora de relógio local (num fuso IANA) pra UTC.
 *
 * Duas iterações bastam: a 1ª estima o offset na hora "como se fosse UTC", a
 * 2ª corrige quando essa estimativa caiu do outro lado de uma troca de
 * horário de verão. Numa hora que não existiu (ex.: 00:30 do dia em que o
 * relógio pulou pra 01:00), o resultado é o instante equivalente depois do
 * pulo — suficiente pra um céu.
 *
 * Se o fuso for inválido ou o Intl não tiver tzdata, cai pra UTC-3.
 *
 * @param {{ y: number, m: number, d: number, hh: number, mm: number }} local m = 1–12
 * @param {string} zone
 * @returns {number} ms UTC
 */
export function localToUTC({ y, m, d, hh, mm }, zone) {
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  try {
    let guess = wall;
    for (let i = 0; i < 2; i++) guess = wall - tzOffsetMinutes(guess, zone) * 60000;
    return guess;
  } catch {
    return Date.UTC(y, m - 1, d, hh + 3, mm);
  }
}

/**
 * Offset UTC (em HORAS) que valia num nascimento, já com o horário de verão
 * histórico do fuso. Ex.: Vitória em 21/12/1994 → -2; em 21/06/1994 → -3.
 * Formato que `calcularAscendente` (lib/calculos.js) espera.
 * @param {{ data: string, hora: string, tz: string }} p data "YYYY-MM-DD", hora "HH:MM"
 * @returns {number}
 */
export function utcOffsetHoras({ data, hora, tz }) {
  const [y, m, d] = data.split('-').map(Number);
  const [hh, mm] = String(hora).split(':').map(Number);
  try {
    return tzOffsetMinutes(localToUTC({ y, m, d, hh, mm: mm || 0 }, tz), tz) / 60;
  } catch {
    return -3;
  }
}

/**
 * Offset gravado numa análise (`utc_offset_nascimento`), validado. null quando
 * não existe — todos os registros criados antes do fuso real, e os sem hora.
 * Quem recebe null usa o comportamento legado (não muda o que já foi entregue).
 * @param {{ utc_offset_nascimento?: number|string|null }} row
 * @returns {number|null}
 */
export function offsetSalvo(row) {
  const v = row?.utc_offset_nascimento;
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= -6 && n <= 0 ? n : null;
}

/**
 * Busca só `utc_offset_nascimento` de uma análise, em consulta separada e best
 * effort: se a coluna não existir (migração 0016 não rodou) ou der qualquer
 * erro, devolve null — e a página segue no cálculo legado em vez de quebrar a
 * consulta principal (que lista colunas explicitamente).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 * @returns {Promise<number|null>}
 */
export async function buscarOffsetNascimento(supabase, id) {
  try {
    const { data, error } = await supabase
      .from('analises').select('utc_offset_nascimento').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return offsetSalvo(data);
  } catch {
    return null;
  }
}

/** Dia Juliano a partir de ms UTC. */
export function julianDay(utcMs) {
  return utcMs / 86400000 + 2440587.5;
}

/**
 * Tempo sideral local, em graus (0–360). Fórmula simplificada da demo/Meeus
 * (GMST + longitude leste). Divida por 15 pra ter horas.
 * @param {number} jd
 * @param {number} lonDeg longitude (leste positivo — o Brasil é negativo)
 */
export function localSiderealDeg(jd, lonDeg) {
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + lonDeg);
}

/**
 * Ascensão reta/declinação → altura/azimute pro observador.
 * Azimute medido a partir do norte, crescendo pro leste.
 * @param {number} raDeg
 * @param {number} decDeg
 * @param {number} lstDeg tempo sideral local em graus
 * @param {number} latDeg
 * @returns {[number, number]} [alt, az] em RADIANOS
 */
export function altAz(raDeg, decDeg, lstDeg, latDeg) {
  const H = (lstDeg - raDeg) * D2R;
  const d = decDeg * D2R;
  const f = latDeg * D2R;
  const alt = Math.asin(Math.sin(d) * Math.sin(f) + Math.cos(d) * Math.cos(f) * Math.cos(H));
  const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(H));
  return [alt, az];
}

/**
 * Posição aproximada do Sol (precisão ~1°, suficiente pro visual).
 * @param {number} jd
 * @returns {[number, number]} [ra, dec] em graus
 */
export function sunRaDec(jd) {
  const n = jd - 2451545;
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * D2R;
  const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R;
  const eps = (23.439 - 4e-7 * n) * D2R;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * R2D;
  return [norm360(ra), Math.asin(Math.sin(eps) * Math.sin(lam)) * R2D];
}

/**
 * Projeção estereográfica centrada no zênite, "olhando pra cima": norte em
 * cima, leste à ESQUERDA (por isso o `cx - r·sin(az)`).
 * @param {{ lstDeg: number, latDeg: number, cx: number, cy: number, R: number }} o
 *   R = escala em px: o horizonte (alt = 0°) fica a exatamente R px do zênite (cx, cy).
 * @returns {(raDeg: number, decDeg: number) => [number, number, number]} → [x, y, alt(rad)]
 */
export function makeProjector({ lstDeg, latDeg, cx, cy, R }) {
  return (raDeg, decDeg) => {
    const [alt, az] = altAz(raDeg < 0 ? raDeg + 360 : raDeg, decDeg, lstDeg, latDeg);
    const r = R * Math.tan((Math.PI / 2 - alt) / 2);
    return [cx - r * Math.sin(az), cy - r * Math.cos(az), alt];
  };
}

/**
 * Céu de um nascimento, sem nada de tela: instante UTC, tempo sideral e Sol.
 * `horaConhecida = false` usa 21h (céu de noite "típico") e nunca marca dia.
 *
 * @param {{ data: string, hora?: string|null, lat: number, lon: number, tz: string }} p
 *   data "YYYY-MM-DD", hora "HH:MM" ou null
 * @returns {{ utcMs: number, jd: number, lstDeg: number, sunAltDeg: number,
 *   sunAzDeg: number, sunRa: number, sunDec: number, aproximado: boolean, dia: boolean }}
 */
export function birthSky({ data, hora = null, lat, lon, tz }) {
  const [y, m, d] = data.split('-').map(Number);
  const aproximado = !hora;
  const [hh, mm] = (hora || '21:00').split(':').map(Number);
  const utcMs = localToUTC({ y, m, d, hh, mm }, tz);
  const jd = julianDay(utcMs);
  const lstDeg = localSiderealDeg(jd, lon);
  const [sunRa, sunDec] = sunRaDec(jd);
  const [salt, saz] = altAz(sunRa, sunDec, lstDeg, lat);
  return {
    utcMs, jd, lstDeg, sunRa, sunDec,
    sunAltDeg: salt * R2D,
    sunAzDeg: norm360(saz * R2D),
    aproximado,
    // -0.05 rad ≈ -2,9°: crepúsculo já conta como "com o Sol no céu" (mesmo limiar da demo)
    dia: !aproximado && salt > -0.05,
  };
}
