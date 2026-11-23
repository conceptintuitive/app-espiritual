// Capas do blog: o céu real sobre Brasília às 21h da data do post, com o
// coverGlyph grande em Instrument Serif dourado por cima. SÓ SERVIDOR/BUILD.
// Este arquivo é puro (Lua, SVG do céu, legenda; testado em
// tests/blogCapa.test.js); quem lê o sky.json e as fontes do disco e monta o
// PNG (ImageResponse) é app/blog/_capa/respostaCapa.js. Nada disso vai pro JS
// do navegador.
//
// Usado por:
//   app/blog/[slug]/opengraph-image.js   1200x630 (imagem OG do post)
//   app/blog/[slug]/capa/[formato]       'largo' (1200x630, destaque e topo do post)
//                                        e '4x5' (640x800, lista do índice)
// As duas rotas são estáticas (generateStaticParams): post novo em
// lib/blogPosts.js ganha capa no próximo build, sem passo manual.
//
// Traço igual ao de app/components/ceu/ceuCanvas.js (cores das estrelas,
// constelações em dourado, Cruzeiro do Sul em destaque), em SVG porque o
// ImageResponse (satori) não tem canvas.
//
// Dados de estrelas e constelações (public/olho/sky.json): d3-celestial
// (c) 2015 Olaf Frohn, licença BSD-3 — ver public/olho/LICENSE-d3-celestial.txt.
// Fontes em lib/blogCapaFontes (SIL OFL 1.1, ver LICENSE-OFL.txt ali).

import { resumoCeu, projetarCeu, LUGAR_PADRAO, horaCurta } from './ceuNascimento.js';
import { makeProjector } from './sky.js';

export const FORMATOS_CAPA = {
  largo: { width: 1200, height: 630 },
  '4x5': { width: 640, height: 800 },
};

export const HORA_CAPA = '21:00';
const LUGAR_CAPA = { ...LUGAR_PADRAO, nome: 'Brasília' };
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// ── Lua (baixa precisão, ~0,3°: sobra pra uma capa) ────────────────────────
/** RA/Dec da Lua (graus) e fração iluminada (0–1) no dia juliano `jd`. */
export function luaNoCeu(jd) {
  const d = jd - 2451545.0;
  const L = 218.316 + 13.176396 * d;  // longitude média
  const M = 134.963 + 13.064993 * d;  // anomalia média
  const F = 93.272 + 13.229350 * d;   // argumento da latitude
  const lam = (L + 6.289 * Math.sin(M * D2R)) * D2R;
  const bet = 5.128 * Math.sin(F * D2R) * D2R;
  const eps = (23.439 - 0.0000004 * d) * D2R;
  const ra = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam));
  const dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam));
  // Longitude do Sol (mesma ordem de precisão) pra fase.
  const g = (357.529 + 0.98560028 * d) * D2R;
  const lamSol = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const elong = Math.acos(Math.cos(bet) * Math.cos(lam - lamSol));
  return { ra: ((ra * R2D) + 360) % 360, dec: dec * R2D, iluminada: (1 - Math.cos(elong)) / 2 };
}

function corEstrela(bv) { // mesma de ceuCanvas.js
  if (bv < 0.2) return '205,220,255';
  if (bv < 0.6) return '255,248,235';
  if (bv < 1.1) return '255,226,170';
  return '255,196,140';
}
const f1 = (n) => Math.round(n * 10) / 10;

/** Desenho da Lua: disco escuro + parte iluminada voltada pro Sol. */
function svgLua(x, y, r, iluminada, anguloSol) {
  const xt = r * (1 - 2 * iluminada); // onde o terminador cruza o centro
  const varre = xt > 0 ? 0 : 1;
  const parteAcesa = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${f1(Math.abs(xt))} ${r} 0 0 ${varre} 0 ${-r}Z`;
  return `<g transform="translate(${f1(x)} ${f1(y)})">`
    + `<circle r="${f1(r * 5)}" fill="url(#halo)"/>`
    + `<circle r="${f1(r)}" fill="rgba(60,52,70,.9)"/>`
    + `<path d="${parteAcesa}" fill="#f6ecd8" transform="rotate(${f1(anguloSol)})"/>`
    + '</g>';
}

/**
 * SVG do céu sobre Brasília às 21h de `data` (YYYY-MM-DD), num retângulo W×H
 * com o zênite no centro.
 */
export function svgDoCeu(sky, data, { W, H, rotulos: comRotulos = true }) {
  const resumo = resumoCeu({ data, hora: HORA_CAPA, lugar: LUGAR_CAPA });
  const cx = W / 2, cy = H / 2;
  const R = 0.56 * Math.max(W, H * 1.5); // mesma escala do CeuNascimento
  const ceu = projetarCeu(sky, resumo, LUGAR_CAPA, { W, H, cx, cy, R, rotuloMaxY: H - 40, rotuloMinY: 40, maxRotulos: comRotulos ? 4 : 0 });
  const k = W / 600; // espessura/raio relativos (o croqui da Minha Área tem ~600px)

  const partes = [];
  partes.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  partes.push('<defs>'
    + '<radialGradient id="fundo" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#140c22"/><stop offset="1" stop-color="#07040d"/></radialGradient>'
    + '<radialGradient id="halo"><stop offset="0" stop-color="rgba(255,240,210,.45)"/><stop offset="1" stop-color="rgba(255,240,210,0)"/></radialGradient>'
    // véu escuro atrás do glifo, pra constelação nenhuma brigar com ele
    + '<radialGradient id="veu" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(7,4,13,.82)"/><stop offset=".55" stop-color="rgba(7,4,13,.45)"/><stop offset="1" stop-color="rgba(7,4,13,0)"/></radialGradient>'
    + '<radialGradient id="borda" cx="50%" cy="50%" r="72%"><stop offset=".6" stop-color="rgba(7,4,13,0)"/><stop offset="1" stop-color="rgba(7,4,13,.75)"/></radialGradient>'
    + '<linearGradient id="pe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(7,4,13,0)"/><stop offset="1" stop-color="rgba(7,4,13,.85)"/></linearGradient>'
    + '</defs>');
  partes.push(`<rect width="${W}" height="${H}" fill="url(#fundo)"/>`);

  for (const { x, y, r, bv, ext } of ceu.estrelas) {
    const cor = corEstrela(bv);
    const a = f1(Math.min(1, ext * 0.9) * 100) / 100;
    if (r > 2.4) partes.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 3 * k)}" fill="rgba(${cor},${f1(0.12 * ext * 100) / 100})"/>`);
    partes.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.75 * k)}" fill="rgba(${cor},${a})"/>`);
  }
  for (const c of ceu.linhas) {
    const d = c.pts.map(([x1, y1, x2, y2]) => `M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}`).join('');
    partes.push(`<path d="${d}" fill="none" stroke="${c.destaque ? 'rgba(255,214,140,.9)' : 'rgba(242,199,123,.34)'}" stroke-width="${f1((c.destaque ? 1.6 : 0.8) * k)}"/>`);
  }
  // Nomes das constelações saem fora do SVG (texto em SVG embutido não tem
  // fonte no rasterizador): a rota desenha cada um por cima, em Geist Mono.
  const tamRotulo = f1(9.5 * k);
  const rotulos = [];
  for (const l of ceu.rotulos) {
    const texto = l.texto.toUpperCase().split('').join(' ');
    const meia = texto.length * tamRotulo * 0.33; // Geist Mono ~0,6em por caractere, com folga
    if (l.x - meia < 8 || l.x + meia > W - 8) continue; // nome cortado na borda não aparece
    rotulos.push({ texto, x: f1(l.x), y: f1(l.y), meia: f1(meia), tamanho: tamRotulo, destaque: l.destaque });
  }

  // Lua, se estiver acima do horizonte e dentro da imagem
  const lua = luaNoCeu(resumo.jd);
  const P = makeProjector({ lstDeg: resumo.lstDeg, latDeg: LUGAR_CAPA.lat, cx, cy, R });
  const [lx, ly, lalt] = P(lua.ra, lua.dec);
  const rLua = 7 * k;
  if (lalt > 0.03 && lx > rLua * 2 && lx < W - rLua * 2 && ly > rLua * 2 && ly < H - rLua * 2) {
    const [sx, sy] = P(resumo.sunRa, resumo.sunDec); // Sol abaixo do horizonte: a direção ainda vale
    partes.push(svgLua(lx, ly, rLua, lua.iluminada, Math.atan2(sy - ly, sx - lx) * R2D));
  }

  const rv = Math.min(W, H) * 0.42;
  partes.push(`<ellipse cx="${cx}" cy="${cy}" rx="${f1(rv * 1.25)}" ry="${f1(rv)}" fill="url(#veu)"/>`);
  partes.push(`<rect width="${W}" height="${H}" fill="url(#borda)"/>`);
  // pé mais escuro: a legenda da capa larga fica legível
  partes.push(`<rect y="${f1(H * 0.72)}" width="${W}" height="${f1(H * 0.28)}" fill="url(#pe)"/>`);
  partes.push('</svg>');
  return { svg: partes.join(''), rotulos, resumo, luaVisivel: lalt > 0.03 };
}

/** Legenda da capa: "O CÉU SOBRE BRASÍLIA ÀS 21H DE 23/11/2026". */
export function legendaCapa(data) {
  return `O céu sobre Brasília às ${horaCurta(HORA_CAPA)} de ${data.split('-').reverse().join('/')}`;
}
