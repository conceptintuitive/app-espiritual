// =============================================================================
// CÁLCULO DE POSIÇÕES PLANETÁRIAS (Etapa A — sem geocoding)
// Algoritmos: Jean Meeus "Astronomical Algorithms" 2ª ed. + Paul Schlyter
// Precisão: ~1–2° para 1900–2100 — suficiente para signo (setores de 30°)
// Sem dependências externas.
//
// Limitação de fuso: hora_nascimento é tratada como horário local sem conversão
// de timezone. Para usuários brasileiros (UTC-3), o erro máximo na Lua é ~1,5°.
// Etapa B (com geocoding) corrigirá isso usando o fuso real da cidade.
// =============================================================================

const SIGNOS_ZODIACAIS = [
  'Áries','Touro','Gêmeos','Câncer','Leão','Virgem',
  'Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'
];

// Normaliza ângulo para [0, 360)
function _norm360(deg) {
  return ((deg % 360) + 360) % 360;
}

function _toRad(deg) { return deg * Math.PI / 180; }
function _toDeg(rad) { return rad * 180 / Math.PI; }

// Número do Dia Juliano (Meeus cap. 7, calendário gregoriano)
function _toJD(year, month, day, hour = 12) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day + B - 1524.5 + hour / 24
  );
}

// Séculos desde J2000.0 — base para fórmulas de Meeus
function _T(jd) { return (jd - 2451545.0) / 36525; }

// Dias desde a época de Schlyter (2000 Jan 0.0 = 1999-12-31, 0h UT = JD 2451543.5)
// — usada nos elementos orbitais simplificados de Schlyter (Mercúrio a Netuno,
// Plutão, heliocêntrica da Terra). NÃO é a mesma época que J2000.0 (JD
// 2451545.0, Jan 1.5 2000) usada por _T() para as fórmulas de Meeus (Lua,
// Nodo) — são 1,5 dia de diferença. Usar J2000.0 aqui por engano desloca
// todo planeta calculado via _helioPos em ~1,5° (1,5 dia × ~0,9856°/dia pro
// Sol), invisível pra determinar signo (setores de 30°) mas grande o
// suficiente pra errar o portão de Human Design (setores de 5,625°) —
// confirmado testando o Sol contra o valor de referência em J2000.0 (~280,46°).
function _d(jd) { return jd - 2451543.5; }

// Equação de Kepler por iteração de Newton: E - e·sin(E) = M
function _solveKepler(M_rad, e) {
  let E = M_rad;
  for (let i = 0; i < 50; i++) {
    const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// Posição heliocêntrica eclíptica a partir de elementos orbitais keplerianos
// (Schlyter — N: nodo asc., i: inclinação, w: arg. de periélio, a: semi-eixo, e: exc., M: anomalia média)
function _helioPos(N_deg, i_deg, w_deg, a, e, M_deg) {
  const M_rad = _toRad(_norm360(M_deg));
  const E     = _solveKepler(M_rad, e);
  const xOrb  = a * (Math.cos(E) - e);
  const yOrb  = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v     = Math.atan2(yOrb, xOrb);   // anomalia verdadeira (rad)
  const r     = Math.sqrt(xOrb * xOrb + yOrb * yOrb);
  const N = _toRad(N_deg), inc = _toRad(i_deg), w = _toRad(w_deg);
  return {
    x: r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(inc)),
    y: r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(inc)),
    z: r * Math.sin(v + w) * Math.sin(inc)
  };
}

// Posição heliocêntrica da Terra (invertendo a posição geocêntrica do Sol)
function _earthHelioPos(d) {
  const w = _norm360(282.9404 + 0.0000470935 * d);
  const e = 0.016709 - 0.000000001151 * d;
  const M_rad = _toRad(_norm360(356.0470 + 0.9856002585 * d));
  const E    = _solveKepler(M_rad, e);
  const xOrb = Math.cos(E) - e;
  const yOrb = Math.sqrt(1 - e * e) * Math.sin(E);
  const r    = Math.sqrt(xOrb * xOrb + yOrb * yOrb);
  const v    = Math.atan2(yOrb, xOrb);
  const lsun = v + _toRad(w);
  return {
    x: r * Math.cos(lsun + Math.PI),
    y: r * Math.sin(lsun + Math.PI),
    z: 0
  };
}

// Longitude eclíptica geocêntrica (graus) a partir de posições heliocêntricas
function _geocentricLon(planet, earth) {
  return _norm360(_toDeg(Math.atan2(planet.y - earth.y, planet.x - earth.x)));
}

// Longitude de Mercúrio (geocêntrica eclíptica) — elementos de Schlyter
function _mercuryLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360( 48.3313  + 3.24587e-5    * d),
      7.0047             + 5.00e-8        * d,
      _norm360( 29.1241  + 1.01444e-4    * d),
      0.387098,
      0.205635           + 5.59e-10       * d,
      _norm360(168.6562  + 4.0923344368  * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude de Vênus (geocêntrica eclíptica) — elementos de Schlyter
function _venusLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360(76.6799  + 0.0004502608 * d),
      3.3946            + 0.0000002775 * d,
      _norm360(54.8910  + 0.0008081957 * d),
      0.720329,
      0.006773          - 0.000000001302 * d,
      _norm360(48.0052  + 1.6021302244 * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude de Marte (geocêntrica eclíptica) — elementos de Schlyter
function _marsLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360(49.5574  + 0.0002905082 * d),
      1.8497            - 0.0000001078 * d,
      _norm360(286.5016 + 0.0000024401 * d),
      1.523688,
      0.093405          + 0.000000002516 * d,
      _norm360(18.6021  + 0.5240207766 * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude do Sol (geocêntrica eclíptica) — mesmos elementos usados em
// _earthHelioPos, mas expondo `lsun` diretamente em vez de x/y heliocêntricos.
function _sunLon(d) {
  const w = _norm360(282.9404 + 0.0000470935 * d);
  const e = 0.016709 - 0.000000001151 * d;
  const M_rad = _toRad(_norm360(356.0470 + 0.9856002585 * d));
  const E = _solveKepler(M_rad, e);
  const xOrb = Math.cos(E) - e;
  const yOrb = Math.sqrt(1 - e * e) * Math.sin(E);
  const v = _toDeg(Math.atan2(yOrb, xOrb));
  return _norm360(v + w);
}

// Longitude de Júpiter (geocêntrica eclíptica) — elementos de Schlyter
function _jupiterLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360(100.4542  + 2.76854e-5    * d),
      1.3030             - 1.557e-7      * d,
      _norm360(273.8777  + 1.64505e-5    * d),
      5.20256,
      0.048498           + 4.469e-9      * d,
      _norm360( 19.8950  + 0.0830853001  * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude de Saturno (geocêntrica eclíptica) — elementos de Schlyter
function _saturnLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360(113.6634  + 2.38980e-5    * d),
      2.4886             - 1.081e-7      * d,
      _norm360(339.3939  + 2.97661e-5    * d),
      9.55475,
      0.055546           - 9.499e-9      * d,
      _norm360(316.9670  + 0.0334442282  * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude de Urano (geocêntrica eclíptica) — elementos de Schlyter
function _uranusLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360(74.0005   + 1.3978e-5     * d),
      0.7733             + 1.9e-8        * d,
      _norm360(96.6612   + 3.0565e-5     * d),
      19.18171           - 1.55e-8       * d,
      0.047318           + 7.45e-9       * d,
      _norm360(142.5905  + 0.011725806   * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude de Netuno (geocêntrica eclíptica) — elementos de Schlyter
function _neptuneLon(d) {
  return _geocentricLon(
    _helioPos(
      _norm360(131.7806  + 3.0173e-5     * d),
      1.7700             - 2.55e-7       * d,
      _norm360(272.8461  - 6.027e-6      * d),
      30.05826           + 3.313e-8      * d,
      0.008606           + 2.15e-9       * d,
      _norm360(260.2471  + 0.005995147   * d)
    ),
    _earthHelioPos(d)
  );
}

// Longitude de Plutão (geocêntrica eclíptica) — aproximação de baixa precisão
// (Schlyter, válida ~1800–2100). Órbita real de Plutão é perturbada por
// Netuno e não segue bem um modelo kepleriano de dois corpos; erro esperado
// aqui é maior que nos outros planetas. Mantido pra completar o mapa de
// Human Design (que usa Plutão), com essa ressalva explícita.
function _plutoLon(d) {
  const S = _toRad(_norm360(50.03 + 0.033459652 * d));
  const P = _toRad(_norm360(238.95 + 0.003968789 * d));
  return _norm360(
    238.9508 + 0.00400703 * d
    - 19.799 * Math.sin(P) + 19.848 * Math.cos(P)
    + 0.897  * Math.sin(2 * P) - 4.956 * Math.cos(2 * P)
    + 0.610  * Math.sin(3 * P) + 1.211 * Math.cos(3 * P)
    - 0.341  * Math.sin(4 * P) - 0.190 * Math.cos(4 * P)
    + 0.128  * Math.sin(5 * P) - 0.034 * Math.cos(5 * P)
    - 0.038  * Math.sin(6 * P) + 0.031 * Math.cos(6 * P)
    + 0.020  * Math.sin(S - P) - 0.010 * Math.cos(S - P)
  );
}

// Nodo Norte médio da Lua (Meeus cap. 47) — move-se retrógrado
function _northNodeLon(T) {
  return _norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
}

// Longitude da Lua geocêntrica eclíptica (Meeus cap. 47, 20 termos principais)
// Precisão: ~0,3° para 1900–2100 — bem abaixo do limiar de 1 signo (30°)
function _moonLon(T) {
  const L0 = _norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const M  = _norm360(357.5291092 +  35999.0502909  * T - 0.0001536 * T * T);
  const Mp = _norm360(134.9633964 + 477198.8675055  * T + 0.0087414 * T * T);
  const D  = _norm360(297.8501921 + 445267.1114034  * T - 0.0018819 * T * T);
  const F  = _norm360( 93.2720950 + 483202.0175233  * T - 0.0036539 * T * T);

  const Mr = _toRad(M), Mpr = _toRad(Mp), Dr = _toRad(D), Fr = _toRad(F);

  // Fator de excentricidade orbital da Terra (afeta termos com anomalia solar M)
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  // Soma dos termos periódicos de longitude (unidade: 10⁻⁶ grau)
  const SL =
    + 6288774 * Math.sin(Mpr)
    + 1274027 * Math.sin(2*Dr - Mpr)
    +  658314 * Math.sin(2*Dr)
    +  213618 * Math.sin(2*Mpr)
    -  185116 * E  * Math.sin(Mr)
    -  114332 * Math.sin(2*Fr)
    +   58793 * Math.sin(2*Dr - 2*Mpr)
    +   57066 * E  * Math.sin(2*Dr - Mr - Mpr)
    +   53322 * Math.sin(2*Dr + Mpr)
    +   45758 * E  * Math.sin(2*Dr - Mr)
    -   40923 * E  * Math.sin(Mr - Mpr)
    -   34720 * Math.sin(Dr)
    -   30383 * E  * Math.sin(Mr + Mpr)
    +   15327 * Math.sin(2*Dr - 2*Fr)
    -   12528 * Math.sin(Mpr + 2*Fr)
    +   10980 * Math.sin(Mpr - 2*Fr)
    +   10675 * Math.sin(4*Dr - Mpr)
    +   10034 * Math.sin(3*Mpr)
    +    8548 * Math.sin(4*Dr - 2*Mpr)
    -    7888 * E  * Math.sin(2*Dr + Mr - Mpr);

  return _norm360(L0 + SL * 1e-6);
}

function _lonToSigno(lon) {
  return SIGNOS_ZODIACAIS[Math.floor(_norm360(lon) / 30)];
}

// Retorna true se a longitude estiver a menos de `threshold` graus de uma cúspide de signo
function _isCuspide(lon, threshold) {
  const pos = _norm360(lon) % 30;
  return pos < threshold || pos > (30 - threshold);
}

/**
 * Calcula os signos de Lua, Vênus, Marte e Nodo Norte a partir da data de nascimento.
 *
 * @param {string} dataNascimentoISO  - "YYYY-MM-DD"
 * @param {string|null} horaNascimento - "HH:MM" ou null
 * @returns {{ signoLua, signoVenus, signoMarte, signoNodo, luaCuspide } | null}
 */
export function calcularPlanetas(dataNascimentoISO, horaNascimento = null) {
  const parts = (dataNascimentoISO || '').split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;

  let hour = 12;      // default: meio-dia (menor desvio médio sem hora)
  let temHora = false;
  if (horaNascimento && /^\d{1,2}:\d{2}/.test(String(horaNascimento))) {
    const [h, m] = String(horaNascimento).split(':').map(Number);
    if (!isNaN(h) && h >= 0 && h <= 23) {
      hour    = h + (m || 0) / 60;
      temHora = true;
    }
  }

  const jd = _toJD(year, month, day, hour);
  const T  = _T(jd);
  const d  = _d(jd);

  const lonLua      = _moonLon(T);
  const lonVenus    = _venusLon(d);
  const lonMarte    = _marsLon(d);
  const lonNodo     = _northNodeLon(T);
  const lonMercurio = _mercuryLon(d);

  // Sem hora: Lua pode ter movido até ±6° (±12h × 0,5°/h) — cúspide em 6°
  // Com hora: margem de 1,5° (precisão do algoritmo)
  const luaCuspide = _isCuspide(lonLua, temHora ? 1.5 : 6.0);

  return {
    signoLua:      _lonToSigno(lonLua),
    signoVenus:    _lonToSigno(lonVenus),
    signoMarte:    _lonToSigno(lonMarte),
    signoNodo:     _lonToSigno(lonNodo),
    signoMercurio: _lonToSigno(lonMercurio),
    luaCuspide
  };
}

/**
 * Calcula o signo do Ascendente a partir da data, hora local e coordenadas geográficas.
 * Usa GMST → LMST → fórmula padrão do horizonte eclíptico.
 *
 * @param {string} dataNascimentoISO  "YYYY-MM-DD"
 * @param {string|null} horaNascimento "HH:MM" horário LOCAL
 * @param {number} lat latitude (+ Norte, − Sul)
 * @param {number} lon longitude (+ Leste, − Oeste)
 * @param {number} utcOffset horas a subtrair do horário local para obter UTC (ex: −3 → utcHour = local + 3)
 * @returns {string|null}
 */
export function calcularAscendente(dataNascimentoISO, horaNascimento, lat, lon, utcOffset = -3) {
  if (!dataNascimentoISO || lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;
  const parts = dataNascimentoISO.split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;

  let localHour = 12;
  if (horaNascimento && /^\d{1,2}:\d{2}/.test(String(horaNascimento))) {
    const [h, m] = String(horaNascimento).split(':').map(Number);
    if (!isNaN(h) && h >= 0 && h <= 23) localHour = h + (m || 0) / 60;
  }
  // UTC = local − utcOffset (ex: utcOffset=−3 → UTC = local+3)
  const utcHour = localHour - utcOffset;

  const jd = _toJD(year, month, day, utcHour);
  const d  = _d(jd);

  // GMST simplificado (graus) — erro < 0.1° para 1900–2100
  const gmst = _norm360(280.46061837 + 360.98564736629 * d);
  // LMST: lon leste positivo, oeste negativo
  const lmst = _norm360(gmst + lon);

  // Obliquidade da eclíptica (graus)
  const eps = 23.4393 - 0.0000004 * d;

  const armcRad = _toRad(lmst);
  const epsRad  = _toRad(eps);
  const latRad  = _toRad(lat);

  const y = -Math.cos(armcRad);
  const x = Math.sin(epsRad) * Math.tan(latRad) + Math.cos(epsRad) * Math.sin(armcRad);

  if (Math.abs(x) < 1e-10 && Math.abs(y) < 1e-10) return null;

  let asc = _norm360(_toDeg(Math.atan2(y, x)));
  // Correção de quadrante: o Ascendente deve estar no hemisfério leste do céu,
  // ou seja, sin(asc − LMST) > 0. Caso contrário, adicionar 180°.
  if (Math.sin(_toRad(asc - lmst)) < 0) asc = _norm360(asc + 180);

  return _lonToSigno(asc);
}

// =============================================================================
// NUMEROLOGIA
// =============================================================================

// =============================================================================
// HUMAN DESIGN — posições planetárias completas (Personalidade + Design)
// Design = posições quando o Sol estava 88° antes da posição no nascimento
// (~88-89 dias antes, resolvido por iteração — não é uma contagem fixa de dias).
// =============================================================================

function _todosCorposCelestes(jd) {
  const d = _d(jd);
  const T = _T(jd);
  const sol = _sunLon(d);
  const nodoNorte = _northNodeLon(T);
  return {
    sol,
    terra: _norm360(sol + 180),
    lua: _moonLon(T),
    nodoNorte,
    nodoSul: _norm360(nodoNorte + 180),
    mercurio: _mercuryLon(d),
    venus: _venusLon(d),
    marte: _marsLon(d),
    jupiter: _jupiterLon(d),
    saturno: _saturnLon(d),
    urano: _uranusLon(d),
    netuno: _neptuneLon(d),
    plutao: _plutoLon(d),
  };
}

// Busca o Dia Juliano em que o Sol estava exatamente 88° antes da longitude
// solar de referência — método de Newton simples, converge em poucas iterações
// porque a velocidade do Sol (~0,9856°/dia) é quase constante.
function _encontrarJDDesign(jdReferencia) {
  const lonReferencia = _sunLon(_d(jdReferencia));
  const lonAlvo = _norm360(lonReferencia - 88);
  let jd = jdReferencia - 89; // estimativa inicial (88° ÷ ~0,9856°/dia)
  for (let i = 0; i < 30; i++) {
    const lonAtual = _sunLon(_d(jd));
    let diff = _norm360(lonAtual - lonAlvo);
    if (diff > 180) diff -= 360; // menor caminho angular (evita loop na virada 360°→0°)
    if (Math.abs(diff) < 0.0001) break;
    jd -= diff / 0.9856;
  }
  return jd;
}

/**
 * Calcula as longitudes eclípticas de todos os 13 "corpos" usados em Human
 * Design (Sol, Terra, Lua, Nodo Norte, Nodo Sul, Mercúrio, Vênus, Marte,
 * Júpiter, Saturno, Urano, Netuno, Plutão), tanto no momento do nascimento
 * ("Personalidade"/consciente) quanto ~88° solares antes ("Design"/inconsciente).
 *
 * Diferente de calcularPlanetas() (que trata a hora como horário local sem
 * conversão — aceitável pra estimar signo), aqui a hora É convertida pra UTC,
 * porque Human Design precisa do momento exato: um erro de fuso desloca a
 * Lua de verdade e pode até mudar o portão perto de uma fronteira.
 *
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {string|null} horaNascimento "HH:MM" horário local (padrão meio-dia se ausente)
 * @param {number} utcOffset horas a subtrair do horário local para obter UTC
 *   (ex: −3 → horário de Brasília padrão; −2 → horário de verão brasileiro,
 *   vigente em alguns períodos até 2019 — confira a data do horário de verão
 *   pro ano de nascimento antes de assumir −3 direto)
 * @returns {{ personalidade: Object, design: Object } | null} longitudes em graus (0–360)
 */
export function calcularCorposCelestesParaHumanDesign(dataNascimentoISO, horaNascimento = null, utcOffset = -3) {
  const parts = (dataNascimentoISO || '').split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;

  let hour = 12;
  if (horaNascimento && /^\d{1,2}:\d{2}/.test(String(horaNascimento))) {
    const [h, m] = String(horaNascimento).split(':').map(Number);
    if (!isNaN(h) && h >= 0 && h <= 23) hour = h + (m || 0) / 60;
  }
  const horaUTC = hour - utcOffset; // ex: utcOffset=-3 → horaUTC = hour + 3

  const jdPersonalidade = _toJD(year, month, day, horaUTC);
  const jdDesign = _encontrarJDDesign(jdPersonalidade);

  return {
    personalidade: _todosCorposCelestes(jdPersonalidade),
    design: _todosCorposCelestes(jdDesign),
  };
}

// Tabela pitagórica: A–Z → 1–9
const _PITAG = {
  A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
  J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
  S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8,
};
const _VOGAIS = new Set(['A', 'E', 'I', 'O', 'U']);

// Remove acentos e normaliza para letras A-Z maiúsculas
function _normLetras(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

// Reduz número a 1 dígito, preservando 11, 22, 33
function _reduz(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

/**
 * Número do Ano Pessoal: dia + mês de nascimento + ano corrente.
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {number} [anoAtual] — padrão: ano corrente do sistema
 * @returns {number|null}
 */
export function calcularAnoPessoal(dataNascimentoISO, anoAtual = new Date().getFullYear()) {
  const parts = (dataNascimentoISO || '').split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [, month, day] = parts;
  const soma = `${day}${month}${anoAtual}`.split('').reduce((a, c) => a + Number(c), 0);
  return _reduz(soma);
}

/**
 * Número do Mês Pessoal: Ano Pessoal + número do mês (1–12), reduzido.
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {number} ano — ano calendário do mês em questão
 * @param {number} mes — 1–12
 * @returns {number|null}
 */
export function calcularMesPessoal(dataNascimentoISO, ano, mes) {
  const anoPessoal = calcularAnoPessoal(dataNascimentoISO, ano);
  if (anoPessoal == null || !mes) return null;
  return _reduz(anoPessoal + mes);
}

/**
 * Número da Alma (Motivação): soma pitagórica das VOGAIS do nome completo.
 * @param {string} nomeCompleto
 * @returns {number|null}
 */
export function calcularNumeroAlma(nomeCompleto) {
  const letras = _normLetras(nomeCompleto);
  if (!letras) return null;
  const soma = letras.split('').filter(c => _VOGAIS.has(c)).reduce((a, c) => a + (_PITAG[c] || 0), 0);
  return soma ? _reduz(soma) : null;
}

/**
 * Número de Expressão (Destino): soma pitagórica de TODAS as letras do nome.
 * @param {string} nomeCompleto
 * @returns {number|null}
 */
export function calcularNumeroExpressao(nomeCompleto) {
  const letras = _normLetras(nomeCompleto);
  if (!letras) return null;
  const soma = letras.split('').reduce((a, c) => a + (_PITAG[c] || 0), 0);
  return soma ? _reduz(soma) : null;
}

// Calcular Número da Vida
export function calcularNumeroVida(dataNascimento) {
  const numeros = dataNascimento.replace(/\D/g, '');
  let soma = 0;
  
  for (let num of numeros) {
    soma += parseInt(num);
  }
  
  while (soma > 9 && ![11, 22, 33].includes(soma)) {
    soma = soma.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return soma;
}

// Calcular Signo
export function calcularSigno(dia, mes) {
  if ((mes === 3 && dia >= 21) || (mes === 4 && dia <= 19)) return 'Áries';
  if ((mes === 4 && dia >= 20) || (mes === 5 && dia <= 20)) return 'Touro';
  if ((mes === 5 && dia >= 21) || (mes === 6 && dia <= 20)) return 'Gêmeos';
  if ((mes === 6 && dia >= 21) || (mes === 7 && dia <= 22)) return 'Câncer';
  if ((mes === 7 && dia >= 23) || (mes === 8 && dia <= 22)) return 'Leão';
  if ((mes === 8 && dia >= 23) || (mes === 9 && dia <= 22)) return 'Virgem';
  if ((mes === 9 && dia >= 23) || (mes === 10 && dia <= 22)) return 'Libra';
  if ((mes === 10 && dia >= 23) || (mes === 11 && dia <= 21)) return 'Escorpião';
  if ((mes === 11 && dia >= 22) || (mes === 12 && dia <= 21)) return 'Sagitário';
  if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 19)) return 'Capricórnio';
  if ((mes === 1 && dia >= 20) || (mes === 2 && dia <= 18)) return 'Aquário';
  return 'Peixes';
}

// Significados dos Números
export const SIGNIFICADOS_NUMEROS = {
  1: {
    titulo: "O Líder",
    desc: "Pioneiro, independente, inovador",
    desafios: "Egoísmo, impaciência, arrogância",
    potenciais: "Empreendedorismo, coragem, originalidade"
  },
  2: {
    titulo: "O Diplomata",
    desc: "Cooperativo, sensível, pacificador",
    desafios: "Dependência emocional, indecisão",
    potenciais: "Mediação, empatia, parceria"
  },
  3: {
    titulo: "O Comunicador",
    desc: "Criativo, expressivo, sociável",
    desafios: "Superficialidade, dispersão",
    potenciais: "Arte, escrita, inspiração"
  },
  4: {
    titulo: "O Construtor",
    desc: "Prático, disciplinado, trabalhador",
    desafios: "Rigidez, teimosia",
    potenciais: "Organização, persistência"
  },
  5: {
    titulo: "O Aventureiro",
    desc: "Livre, versátil, curioso",
    desafios: "Instabilidade, impulsividade",
    potenciais: "Adaptabilidade, comunicação"
  },
  6: {
    titulo: "O Cuidador",
    desc: "Responsável, amoroso, protetor",
    desafios: "Controle excessivo, sacrifício",
    potenciais: "Cura, ensino, família"
  },
  7: {
    titulo: "O Místico",
    desc: "Analítico, introspectivo, espiritual",
    desafios: "Isolamento, frieza",
    potenciais: "Sabedoria, espiritualidade"
  },
  8: {
    titulo: "O Realizador",
    desc: "Ambicioso, poderoso, material",
    desafios: "Materialismo, domínio",
    potenciais: "Liderança, prosperidade"
  },
  9: {
    titulo: "O Humanitário",
    desc: "Compassivo, idealista, universal",
    desafios: "Mártir, desilusão",
    potenciais: "Filantropia, cura global"
  },
  11: {
    titulo: "O Iluminado",
    desc: "Intuitivo, inspirador, visionário",
    desafios: "Ansiedade, idealismo extremo",
    potenciais: "Iluminação, inspiração"
  },
  22: {
    titulo: "O Construtor Mestre",
    desc: "Visionário prático, realizador",
    desafios: "Pressão interna",
    potenciais: "Grandes realizações"
  },
  33: {
    titulo: "O Mestre Curador",
    desc: "Amor universal, cura planetária",
    desafios: "Sobrecarga emocional",
    potenciais: "Cura em massa"
  }
};

// Perfis dos Signos
export const PERFIS_SIGNOS = {
  'Áries': {
    elemento: 'Fogo',
    regente: 'Marte',
    desc: 'Corajoso, impulsivo, pioneiro',
    dons: 'Liderança, coragem',
    desafios: 'Impaciência, agressividade'
  },
  'Touro': {
    elemento: 'Terra',
    regente: 'Vênus',
    desc: 'Estável, sensual, persistente',
    dons: 'Determinação, lealdade',
    desafios: 'Teimosia, possessividade'
  },
  'Gêmeos': {
    elemento: 'Ar',
    regente: 'Mercúrio',
    desc: 'Comunicativo, versátil, curioso',
    dons: 'Inteligência, adaptação',
    desafios: 'Superficialidade, dispersão'
  },
  'Câncer': {
    elemento: 'Água',
    regente: 'Lua',
    desc: 'Emotivo, protetor, intuitivo',
    dons: 'Empatia, cuidado',
    desafios: 'Insegurança, apego'
  },
  'Leão': {
    elemento: 'Fogo',
    regente: 'Sol',
    desc: 'Carismático, generoso, dramático',
    dons: 'Criatividade, liderança',
    desafios: 'Orgulho, vaidade'
  },
  'Virgem': {
    elemento: 'Terra',
    regente: 'Mercúrio',
    desc: 'Analítico, perfeccionista, prestativo',
    dons: 'Organização, discernimento',
    desafios: 'Crítica excessiva, ansiedade'
  },
  'Libra': {
    elemento: 'Ar',
    regente: 'Vênus',
    desc: 'Equilibrado, charmoso, diplomático',
    dons: 'Harmonia, justiça',
    desafios: 'Indecisão, dependência'
  },
  'Escorpião': {
    elemento: 'Água',
    regente: 'Plutão',
    desc: 'Intenso, magnético, transformador',
    dons: 'Profundidade, regeneração',
    desafios: 'Ciúme, vingança'
  },
  'Sagitário': {
    elemento: 'Fogo',
    regente: 'Júpiter',
    desc: 'Otimista, aventureiro, filosófico',
    dons: 'Sabedoria, expansão',
    desafios: 'Exagero, irresponsabilidade'
  },
  'Capricórnio': {
    elemento: 'Terra',
    regente: 'Saturno',
    desc: 'Ambicioso, disciplinado, responsável',
    dons: 'Persistência, estrutura',
    desafios: 'Frieza, pessimismo'
  },
  'Aquário': {
    elemento: 'Ar',
    regente: 'Urano',
    desc: 'Inovador, humanitário, independente',
    dons: 'Originalidade, visão futura',
    desafios: 'Distanciamento, rebeldia'
  },
  'Peixes': {
    elemento: 'Água',
    regente: 'Netuno',
    desc: 'Compassivo, sonhador, místico',
    dons: 'Intuição, criatividade',
    desafios: 'Fuga da realidade, vítima'
  }
};