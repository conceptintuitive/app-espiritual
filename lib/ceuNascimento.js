// lib/ceuNascimento.js — o céu do nascimento de uma pessoa, parado (sem
// animação): resumo em texto (legenda, "Manhã, Sol a leste") e projeção das
// estrelas/constelações pra um retângulo de W×H. Puro (sem window): usado pelo
// componente app/components/ceu/CeuNascimento.js (topo da Minha Área) e
// testado em tests/ceuNascimento.test.js.
//
// Mesmas regras do Olho Cósmico (app/components/olho/OlhoCosmico.js):
// - sem hora = 21h e "céu aproximado", nunca modo dia;
// - modo dia = Sol acima de ~-3° (birthSky de lib/sky.js);
// - projeção estereográfica no zênite, olhando pra cima: norte em cima, leste
//   à esquerda; a luz do dia vem da borda na direção do Sol.

import { birthSky, makeProjector } from './sky.js';

const D2R = Math.PI / 180;

// Sem cidade no perfil: Brasília (mesmo fallback do Olho no Manual).
export const LUGAR_PADRAO = { nome: null, lat: -15.79, lon: -47.88, tz: 'America/Sao_Paulo' };

// Nomes das constelações em português (mesma lista do Olho Cósmico).
export const NOMES_CONSTELACOES = {
  Ori: 'Órion', Sco: 'Escorpião', Cru: 'Cruzeiro do Sul', Cen: 'Centauro', Sgr: 'Sagitário', Leo: 'Leão', Tau: 'Touro',
  Gem: 'Gêmeos', Vir: 'Virgem', Cnc: 'Câncer', Ari: 'Áries', Psc: 'Peixes', Aqr: 'Aquário', Cap: 'Capricórnio', Lib: 'Libra',
  CMa: 'Cão Maior', Car: 'Carina', UMa: 'Ursa Maior', Cyg: 'Cisne', Lyr: 'Lira', Aql: 'Águia', Peg: 'Pégaso', Boo: 'Boieiro',
  Gru: 'Grou', Pav: 'Pavão', Vel: 'Vela',
};

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Cidade do perfil do Seu Dia ({ nome, uf, lat, lon, tz }) → lugar do céu. */
export function lugarDoPerfil(cidade) {
  const lat = num(cidade?.lat);
  const lon = num(cidade?.lon);
  if (lat === null || lon === null) return LUGAR_PADRAO;
  return { nome: cidade.nome || null, lat, lon, tz: cidade.tz || LUGAR_PADRAO.tz };
}

/** "07:25" → "7h25"; "21:00" → "21h". */
export function horaCurta(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const dataBR = (iso) => iso.split('-').reverse().join('/');

/**
 * Resumo do céu do nascimento, em texto.
 * @param {{ data: string, hora?: string|null, lugar?: { nome: string|null, lat: number, lon: number, tz: string } }} p
 */
export function resumoCeu({ data, hora = null, lugar = LUGAR_PADRAO }) {
  const ceu = birthSky({ data, hora, lat: lugar.lat, lon: lugar.lon, tz: lugar.tz });
  const horaUsada = hora || '21:00';
  const h = Number(horaUsada.split(':')[0]);
  const onde = lugar.nome ? `sobre ${lugar.nome}` : 'sobre o Brasil';
  // Azimute a partir do norte, no sentido do leste (0–180 = metade leste do céu).
  const solLeste = ceu.sunAzDeg > 0 && ceu.sunAzDeg < 180;

  let periodo;
  if (ceu.aproximado) periodo = 'Noite';
  else if (ceu.dia) periodo = h < 12 ? 'Manhã' : 'Tarde';
  else periodo = h < 5 ? 'Madrugada' : h < 12 ? 'Antes do amanhecer' : 'Noite';

  let valor;
  if (ceu.aproximado) valor = 'Noite, céu aproximado';
  else if (ceu.dia) valor = `${periodo}, Sol a ${solLeste ? 'leste' : 'oeste'}`;
  else valor = `${periodo}, céu estrelado`;

  let extra = '';
  if (ceu.dia) {
    if (ceu.sunAltDeg < 0) extra = h < 12 ? 'O Sol estava nascendo.' : 'O Sol estava se pondo.';
    else extra = h < 12 ? 'O Sol já tinha nascido.' : 'O Sol ainda estava no céu.';
  }

  return {
    ...ceu,
    solLeste,
    periodo,
    /** Linha "Céu do nascimento" do mapa: "Manhã, Sol a leste". */
    valor,
    /** "O céu sobre Vitória às 7h25 de 21/12/1994" (+ " · céu aproximado" sem hora). */
    legenda: `O céu ${onde} às ${horaCurta(horaUsada)} de ${dataBR(data)}${ceu.aproximado ? ' · céu aproximado' : ''}`,
    /** Frase extra do desktop ("O Sol já tinha nascido."), vazia de noite. */
    extra,
  };
}

/**
 * Projeta o céu num retângulo W×H com o zênite em (cx, cy).
 * @param {{ stars: Array<[number,number,number,number]>, lines: Record<string, number[][][]> }} sky  public/olho/sky.json
 * @param {ReturnType<typeof resumoCeu>} ceu
 * @param {{ lat: number }} lugar
 * @param {{ W: number, H: number, cx: number, cy: number, R: number, rotuloMaxY?: number, maxRotulos?: number }} caixa
 *   rotuloMaxY: nenhum nome de constelação abaixo disso (deixa o texto de cima limpo).
 *   rotuloMinY: nem acima disso (ex.: o cabeçalho do card do story).
 */
export function projetarCeu(sky, ceu, lugar, { W, H, cx, cy, R, rotuloMaxY = H * 0.6, rotuloMinY = 50, maxRotulos = 5 }) {
  const P = makeProjector({ lstDeg: ceu.lstDeg, latDeg: lugar.lat, cx, cy, R });

  const [sx, sy, salt] = P(ceu.sunRa, ceu.sunDec);
  const sol = {
    alt: salt, x: sx, y: sy, dia: ceu.dia,
    // Sol fora da tela: a luz vem da borda, na direção dele.
    ex: Math.min(W + 40, Math.max(-40, sx)),
    ey: Math.min(H + 40, Math.max(-40, sy)),
  };

  const estrelas = [];
  for (const [ra, dec, mag, bv] of sky.stars) {
    const [x, y, alt] = P(ra, dec);
    if (alt < 0 || x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    const ext = Math.min(1, alt / (12 * D2R)); // perto do horizonte, mais fraca
    estrelas.push({ x, y, r: Math.max(0.5, (5.8 - mag) * 0.62), bv, ext });
  }

  const linhas = [];
  let rotulos = [];
  for (const [id, segs] of Object.entries(sky.lines)) {
    const pts = [];
    let somaX = 0, somaY = 0, n = 0, minAlt = 9;
    for (const seg of segs) {
      const ps = seg.map(([ra, dec]) => P(ra, dec));
      for (let i = 0; i < ps.length - 1; i++) {
        const a = ps[i], b = ps[i + 1];
        if (a[2] < 0.02 || b[2] < 0.02) continue;
        pts.push([a[0], a[1], b[0], b[1]]);
      }
      for (const q of ps) { somaX += q[0]; somaY += q[1]; n++; minAlt = Math.min(minAlt, q[2]); }
    }
    if (!pts.length) continue;
    const destaque = id === 'Cru';
    linhas.push({ id, pts, destaque });
    const lx = somaX / n, ly = somaY / n;
    if (NOMES_CONSTELACOES[id] && minAlt > 0.15 && lx > 30 && lx < W - 30 && ly > rotuloMinY && ly + (destaque ? 30 : 14) < rotuloMaxY) {
      rotulos.push({ texto: NOMES_CONSTELACOES[id], x: lx, y: ly + (destaque ? 30 : 14), d: Math.hypot(lx - cx, ly - cy), destaque });
    }
  }
  rotulos.sort((a, b) => (b.destaque - a.destaque) || (a.d - b.d));
  rotulos = rotulos.filter((l) => l.d > 70).slice(0, maxRotulos);

  return { estrelas, linhas, rotulos, sol, zenite: { x: cx, y: cy } };
}

/**
 * Onde cai, num container W×H, um ponto (fx, fy em 0–1) de uma imagem iw×ih
 * desenhada com object-fit: cover centralizado. Serve pra alinhar o zênite do
 * canvas com a estrela da imagem de fundo (e4 / e4w).
 */
export function pontoNaCapa(W, H, iw, ih, fx, fy) {
  const s = Math.max(W / iw, H / ih);
  return { x: (W - iw * s) / 2 + fx * iw * s, y: (H - ih * s) / 2 + fy * ih * s };
}
