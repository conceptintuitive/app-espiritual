// PNG da capa do blog (ImageResponse). Só servidor/build: lê o sky.json e as
// fontes do disco (skyDoDisco/fontes também servem as artes do Instagram,
// app/api/social/_arte/respostaArte.js). A arte (céu, Lua, legenda) vem de lib/blogCapa.js.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { FORMATOS_CAPA, svgDoCeu, legendaCapa } from '@/lib/blogCapa';

// Promises no escopo do módulo: lê do disco uma vez por processo de build.
let promessaSky = null;
export function skyDoDisco() {
  promessaSky ||= readFile(join(process.cwd(), 'public/olho/sky.json'), 'utf8').then(JSON.parse);
  return promessaSky;
}
let promessaFontes = null;
export function fontes() {
  const dir = join(process.cwd(), 'lib/blogCapaFontes');
  const ler = (f) => readFile(join(dir, f));
  promessaFontes ||= Promise.all([
    ler('instrument-serif-latin-400-normal.woff'),
    ler('geist-mono-latin-400-normal.woff'),
    ler('noto-sans-symbols-symbols-400-normal.woff'),
    ler('noto-sans-symbols-2-sub.woff'),
    ler('noto-sans-math-sub.woff'),
  ]).then(([serif, mono, simbolos, simbolos2, mat]) => [
    // Os símbolos (♐ ⚖ ☯ ☿ ∴ ⚡…) não existem na Instrument Serif: o satori
    // procura o caractere nas outras fontes da lista.
    { name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' },
    { name: 'Geist Mono', data: mono, weight: 400, style: 'normal' },
    { name: 'Noto Sans Symbols', data: simbolos, weight: 400, style: 'normal' },
    { name: 'Noto Sans Symbols 2', data: simbolos2, weight: 400, style: 'normal' },
    { name: 'Noto Sans Math', data: mat, weight: 400, style: 'normal' },
  ]);
  return promessaFontes;
}

/**
 * Capa do post como PNG.
 * @param {{ date: string, coverGlyph: string }} post
 * @param {'largo'|'4x5'} formato
 */
export async function respostaCapa(post, formato = 'largo') {
  const { width: W, height: H } = FORMATOS_CAPA[formato] || FORMATOS_CAPA.largo;
  const [sky, fonts] = await Promise.all([skyDoDisco(), fontes()]);
  const largo = formato === 'largo';
  const { svg, rotulos } = svgDoCeu(sky, post.date, { W, H, rotulos: largo });
  const glifo = post.coverGlyph || '✦';
  // Glifo curto (♐, 8) bem grande; algarismo romano comprido (XIII) menor.
  const tamGlifo = Math.round(Math.min(W, H) * (glifo.length > 2 ? 0.34 : 0.5));
  const mono = { fontFamily: 'Geist Mono', fontSize: Math.round(W / (largo ? 75 : 46)), letterSpacing: '0.2em', color: 'rgba(217,203,184,.85)', textTransform: 'uppercase' };

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }} />
        {rotulos.map((l) => (
          <span key={l.texto} style={{ position: 'absolute', left: l.x - l.meia, top: l.y - l.tamanho, width: l.meia * 2, justifyContent: 'center', display: 'flex', whiteSpace: 'nowrap', fontFamily: 'Geist Mono', fontSize: l.tamanho, color: l.destaque ? 'rgba(255,220,160,1)' : 'rgba(230,215,190,.7)' }}>
            {l.texto}
          </span>
        ))}
        <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Instrument Serif, Noto Sans Symbols, Noto Sans Symbols 2, Noto Sans Math', fontSize: tamGlifo, lineHeight: 1, color: '#f2c77b' }}>
            {glifo}
          </span>
        </div>
        {largo && (
          <div style={{ position: 'absolute', left: 48, right: 48, bottom: 36, display: 'flex', justifyContent: 'space-between', ...mono }}>
            <span>Intuitive Concept</span>
            <span>{legendaCapa(post.date)}</span>
          </div>
        )}
      </div>
    ),
    { width: W, height: H, fonts },
  );
}
