// Artes do Instagram/TikTok: story 1080x1920 ("Energia de hoje") e post do
// feed 1080x1350. SÓ SERVIDOR. Céu real do dia sobre Brasília (21h, estrelas,
// constelações, Lua com a fase — o mesmo traço das capas do blog,
// lib/blogCapa.js), Instrument Serif + Geist Mono, dourado sobre #07040d.
// Texto: lib/social.js. Sai em JPEG (o Instagram só aceita JPEG; o TikTok
// aceita JPEG/WEBP).
//
// Áreas seguras do story: nada nos 14% de cima (269px) nem nos 20% de baixo
// (384px) — a interface do Instagram cobre essas faixas.

import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { svgDoCeu, svgFaseLua, legendaCapa } from '@/lib/blogCapa';
import { FORMATOS, SITE, energiaDoDia, postDoDia } from '@/lib/social';
import { skyDoDisco, fontes } from '@/app/blog/_capa/respostaCapa';

const OURO = '#f2c77b';
const TEXTO = '#f3e9da';
const APAGADO = '#b9a9c9';
const AREIA = '#d9cbb8';
const LINHA = 'rgba(242,199,123,.28)';
const SERIF = 'Instrument Serif, Noto Sans Symbols, Noto Sans Symbols 2, Noto Sans Math';
const MONO = 'Geist Mono';

export const SAFE_STORY = { topo: Math.round(1920 * 0.14), base: Math.round(1920 * 0.8) }; // 269 … 1536

const mono = (tam, cor = AREIA, extra = {}) => ({ fontFamily: MONO, fontSize: tam, letterSpacing: '0.18em', textTransform: 'uppercase', color: cor, ...extra });
const serif = (tam, cor = TEXTO, extra = {}) => ({ fontFamily: SERIF, fontSize: tam, lineHeight: 1.12, color: cor, ...extra });
const svg64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function Fundo({ svg, rotulos, W, H, escurecer = 0.38 }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={svg64(svg)} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }} />
      {rotulos.map((l) => (
        <span key={l.texto} style={{ position: 'absolute', left: l.x - l.meia, top: l.y - l.tamanho, width: l.meia * 2, justifyContent: 'center', display: 'flex', whiteSpace: 'nowrap', fontFamily: MONO, fontSize: l.tamanho, color: l.destaque ? 'rgba(255,220,160,.9)' : 'rgba(230,215,190,.55)' }}>
          {l.texto}
        </span>
      ))}
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', backgroundColor: `rgba(7,4,13,${escurecer})` }} />
    </>
  );
}

// ── Story ───────────────────────────────────────────────────────────────────
function Story({ e, ceu }) {
  const { width: W, height: H } = FORMATOS.story;
  const lua = svgFaseLua(30, e.lua.iluminada, e.lua.crescente);
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}>
      <Fundo svg={ceu.svg} rotulos={ceu.rotulos} W={W} H={H} escurecer={0.42} />
      <div style={{ position: 'absolute', left: 90, right: 90, top: SAFE_STORY.topo + 24, height: SAFE_STORY.base - SAFE_STORY.topo - 24, display: 'flex', flexDirection: 'column' }}>
        <span style={mono(26, OURO)}>{e.kicker}</span>
        <span style={serif(128, OURO, { marginTop: 34, lineHeight: 1 })}>{e.titulo}</span>
        <span style={serif(52, TEXTO, { marginTop: 26, lineHeight: 1.2 })}>{e.frase}</span>
        <div style={{ display: 'flex', height: 1, backgroundColor: LINHA, marginTop: 50, marginBottom: 14 }} />
        {e.linhas.map((l, k) => (
          <div key={l.rotulo} style={{ display: 'flex', flexDirection: 'column', paddingTop: 22, paddingBottom: 22, borderTop: k ? `1px solid ${LINHA}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={mono(22, APAGADO)}>{l.rotulo}</span>
              {k === 0 && (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img src={svg64(lua)} width={64} height={64} style={{ marginLeft: 10, marginTop: -20, marginBottom: -20 }} />
              )}
            </div>
            <span style={serif(48, TEXTO, { marginTop: 8 })}>{l.valor}</span>
            {l.nota && <span style={{ fontFamily: MONO, fontSize: 23, lineHeight: 1.4, color: AREIA, marginTop: 8 }}>{l.nota}</span>}
          </div>
        ))}
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <span style={mono(22, OURO, { lineHeight: 1.5, letterSpacing: '0.12em' })}>{e.cta}</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <span style={mono(19, 'rgba(217,203,184,.7)')}>{SITE}</span>
          <span style={mono(19, 'rgba(217,203,184,.55)')}>Céu de Brasília · 21h</span>
        </div>
      </div>
    </div>
  );
}

// ── Feed ────────────────────────────────────────────────────────────────────
function tamanhoGrande(p) {
  if (!p.grande) return 0;
  if (p.tema === 'numero') return 380;
  if (p.tema === 'ponto_cego' || p.tema === 'comenta') return 300;
  return p.grande.length > 16 ? 104 : p.grande.length > 10 ? 124 : 150;
}

function Feed({ p, ceu, data }) {
  const { width: W, height: H } = FORMATOS.feed;
  const tamG = tamanhoGrande(p);
  const longo = p.linhas.some((l) => l.texto.length > 150);
  const tamTexto = longo ? 34 : 40;
  const semana = p.tema === 'semana';
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}>
      <Fundo svg={ceu.svg} rotulos={ceu.rotulos} W={W} H={H} escurecer={0.45} />
      <div style={{ position: 'absolute', left: 84, right: 84, top: 78, bottom: 56, display: 'flex', flexDirection: 'column' }}>
        {/* bloco centrado na altura; o rodapé fica embaixo */}
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <span style={mono(24, OURO)}>{p.kicker}</span>
        {p.grande && <span style={serif(tamG, OURO, { lineHeight: 1, marginTop: tamG > 200 ? 6 : 28 })}>{p.grande}</span>}
        <span style={serif(semana ? 84 : p.tema === 'comenta' ? 62 : 58, semana ? OURO : TEXTO, { marginTop: semana ? 26 : 18, lineHeight: 1.1 })}>{p.titulo}</span>
        <div style={{ display: 'flex', height: 1, backgroundColor: LINHA, marginTop: semana ? 30 : 36, marginBottom: semana ? 4 : 10 }} />
        {semana
          ? p.dias.map((d, k) => (
            <div key={d.data} style={{ display: 'flex', alignItems: 'center', paddingTop: 15, paddingBottom: 15, borderTop: k ? `1px solid ${LINHA}` : 'none' }}>
              <span style={mono(22, OURO, { width: 170 })}>{d.rotulo}</span>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={serif(38, TEXTO)}>{d.lua}{d.mudaFase ? ` · ${d.fase.replace('Lua ', '')}` : ''}</span>
                <span style={{ fontFamily: MONO, fontSize: 21, color: AREIA, marginTop: 4 }}>{`Kin ${d.kin}`}</span>
              </div>
            </div>
          ))
          : p.linhas.map((l, k) => (
            <div key={l.rotulo} style={{ display: 'flex', flexDirection: 'column', paddingTop: 18, paddingBottom: 18, borderTop: k ? `1px solid ${LINHA}` : 'none' }}>
              <span style={mono(20, APAGADO)}>{l.rotulo}</span>
              <span style={serif(tamTexto, TEXTO, { marginTop: 8, lineHeight: 1.2 })}>{l.texto}</span>
            </div>
          ))}
        {p.frase && <span style={serif(44, OURO, { marginTop: 22, lineHeight: 1.15 })}>{`“${p.frase}”`}</span>}
        <div style={{ display: 'flex', flexGrow: 1.3 }} />
        <span style={mono(21, OURO, { letterSpacing: '0.14em', marginBottom: 16 })}>Faz o seu mapa grátis · link na bio</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={mono(19, 'rgba(217,203,184,.75)')}>{SITE}</span>
          <span style={mono(17, 'rgba(217,203,184,.5)')}>{legendaCapa(data).replace('O céu sobre ', 'Céu de ')}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * JPEG da arte do dia.
 * @param {string} data "YYYY-MM-DD"
 * @param {'story'|'feed'} formato
 * @param {number|null} indice índice da série (feed)
 * @returns {Promise<Buffer|null>} null = não há post nesse dia (quinta)
 */
export async function arteJpeg(data, formato, indice = null) {
  const { width: W, height: H } = FORMATOS[formato];
  const [sky, fonts] = await Promise.all([skyDoDisco(), fontes()]);
  // sem nomes de constelação: brigariam com o texto
  const ceu = svgDoCeu(sky, data, { W, H, rotulos: false });
  let el;
  if (formato === 'story') {
    el = <Story e={energiaDoDia(data)} ceu={ceu} />;
  } else {
    const p = postDoDia(data, indice ?? 0);
    if (!p) return null;
    el = <Feed p={p} ceu={ceu} data={data} />;
  }
  const png = Buffer.from(await new ImageResponse(el, { width: W, height: H, fonts }).arrayBuffer());
  return sharp(png).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
}
