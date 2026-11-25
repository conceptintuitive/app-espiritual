// Artes da automação social. SÓ SERVIDOR. Céu real do dia sobre Brasília (21h,
// estrelas, constelações, Lua com a fase — o mesmo traço das capas do blog,
// lib/blogCapa.js), Instrument Serif + Geist Mono, dourado sobre #07040d.
// Texto: o conteúdo do dia (social_conteudos, da IA, ou a reserva).
//   story    1080x1920 JPEG  "Energia de hoje"
//   frase    1080x1920 JPEG  "Frase do dia" (21h): frase + "— Autor, Livro" (lib/frases.js)
//   c1…c7    1080x1350 JPEG  telas do carrossel (capa → … → chamada)
//   ceu      1080x1920 JPEG  só o céu (fundo do Reels)
//   r1…r3    1080x1920 PNG   textos do Reels, fundo transparente
// JPEG porque o Instagram só aceita JPEG (o TikTok aceita JPEG/WEBP).
//
// Áreas seguras: story sem texto nos 14% de cima nem nos 20% de baixo; Reels
// sem texto nos 22% de baixo (legenda e botões) nem nos 140px da direita.

import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { svgDoCeu, svgFaseLua, legendaCapa } from '@/lib/blogCapa';
import { FORMATOS, SITE, energiaDoDia } from '@/lib/social';
import { skyDoDisco, fontes } from '@/app/blog/_capa/respostaCapa';
import { FRASES, fraseDoDia, creditoDaFrase } from '@/lib/frases';

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

function Fundo({ svg, W, H, escurecer = 0.38 }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={svg64(svg)} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', backgroundColor: `rgba(7,4,13,${escurecer})` }} />
    </>
  );
}

/** Tamanho da letra pelo comprimento do texto (pra caber sem cortar). */
const porTamanho = (texto, faixas) => faixas.find(([max]) => String(texto || '').length <= max)?.[1] ?? faixas[faixas.length - 1][1];

// ── Story ───────────────────────────────────────────────────────────────────
function Story({ e, ceu }) {
  const { width: W, height: H } = FORMATOS.story;
  const lua = svgFaseLua(30, e.lua.iluminada, e.lua.crescente);
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}>
      <Fundo svg={ceu.svg} W={W} H={H} escurecer={0.42} />
      <div style={{ position: 'absolute', left: 90, right: 90, top: SAFE_STORY.topo + 24, height: SAFE_STORY.base - SAFE_STORY.topo - 24, display: 'flex', flexDirection: 'column' }}>
        <span style={mono(26, OURO)}>{e.kicker}</span>
        <span style={serif(porTamanho(e.titulo, [[16, 128], [24, 104], [40, 88]]), OURO, { marginTop: 34, lineHeight: 1 })}>{e.titulo}</span>
        <span style={serif(porTamanho(e.frase, [[90, 52], [160, 46]]), TEXTO, { marginTop: 26, lineHeight: 1.2 })}>{e.frase}</span>
        <div style={{ display: 'flex', height: 1, backgroundColor: LINHA, marginTop: 50, marginBottom: 14 }} />
        {e.linhas.map((l, k) => (
          <div key={l.rotulo} style={{ display: 'flex', flexDirection: 'column', paddingTop: 22, paddingBottom: 22, borderTop: k ? `1px solid ${LINHA}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={mono(26, APAGADO)}>{l.rotulo}</span>
              {k === 0 && (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img src={svg64(lua)} width={64} height={64} style={{ marginLeft: 10, marginTop: -20, marginBottom: -20 }} />
              )}
            </div>
            <span style={serif(48, TEXTO, { marginTop: 8 })}>{l.valor}</span>
            {l.nota && <span style={{ fontFamily: MONO, fontSize: 28, lineHeight: 1.38, color: AREIA, marginTop: 8 }}>{l.nota}</span>}
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

// ── Story da frase do dia ───────────────────────────────────────────────────
// Só a frase e o crédito ("— Autor, Livro"). A marca fica pequena no pé, longe
// do nome do autor, e não há chamada pro mapa: nada que pareça endosso.
function StoryFrase({ f, ceu }) {
  const { width: W, height: H } = FORMATOS.frase;
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}>
      <Fundo svg={ceu.svg} W={W} H={H} escurecer={0.55} />
      <div style={{ position: 'absolute', left: 96, right: 96, top: SAFE_STORY.topo + 24, height: SAFE_STORY.base - SAFE_STORY.topo - 24, display: 'flex', flexDirection: 'column' }}>
        <span style={mono(26, OURO)}>Frase do dia</span>
        <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }}>
          <span style={serif(200, OURO, { lineHeight: 0.6, height: 110 })}>“</span>
          <span style={serif(porTamanho(f.frase, [[60, 96], [110, 80], [160, 68], [220, 60]]), TEXTO, { lineHeight: 1.14 })}>{f.frase}</span>
          <div style={{ display: 'flex', width: 120, height: 1, backgroundColor: OURO, marginTop: 56, marginBottom: 28 }} />
          <span style={{ fontFamily: MONO, fontSize: 30, lineHeight: 1.4, letterSpacing: '0.06em', color: OURO }}>{creditoDaFrase(f)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={mono(19, 'rgba(217,203,184,.7)')}>{SITE}</span>
          <span style={mono(19, 'rgba(217,203,184,.55)')}>Céu de Brasília · 21h</span>
        </div>
      </div>
    </div>
  );
}

// ── Carrossel ───────────────────────────────────────────────────────────────
function tamanhoGrande(dados) {
  const g = dados.grande || '';
  if (dados.tema === 'numero') return 340;
  if (dados.tema === 'ponto_cego' || dados.tema === 'comenta') return 250;
  if (dados.tema === 'compat') return 190;
  return g.length > 16 ? 96 : 120;
}

function Rodape({ n, total, data }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span style={mono(19, 'rgba(217,203,184,.75)')}>{SITE}</span>
      <span style={mono(19, 'rgba(217,203,184,.6)')}>{n === 1 ? `${legendaCapa(data).replace('O céu sobre ', 'Céu de ').replace(/ de \d{4}$/, '')}` : `${n}/${total}`}</span>
    </div>
  );
}

function TelaDias({ tela }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tela.dias.map((d, k) => (
        <div key={d.data} style={{ display: 'flex', flexDirection: 'column', paddingTop: 24, paddingBottom: 24, borderTop: k ? `1px solid ${LINHA}` : 'none' }}>
          <span style={mono(24, OURO)}>{d.rotulo}</span>
          <span style={serif(46, TEXTO, { marginTop: 10 })}>{`${d.lua}${d.muda_fase ? ` · ${d.fase.replace('Lua ', '')}` : ''}`}</span>
          <span style={{ fontFamily: MONO, fontSize: 23, color: AREIA, marginTop: 8, lineHeight: 1.35 }}>{`Kin ${d.kin} · dia universal ${d.dia_universal}`}</span>
          <span style={serif(porTamanho(d.conselho, [[70, 40], [120, 36]]), APAGADO, { marginTop: 10, lineHeight: 1.2 })}>{d.conselho}</span>
        </div>
      ))}
    </div>
  );
}

function Tela({ k, dados, conteudo, ceu, data }) {
  const { width: W, height: H } = FORMATOS.feed;
  const telas = conteudo.telas;
  const tela = telas[k];
  const total = telas.length;
  const capa = k === 0;
  const cta = k === total - 1;
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}>
      <Fundo svg={ceu.svg} W={W} H={H} escurecer={capa || cta ? 0.42 : 0.6} />
      <div style={{ position: 'absolute', left: 84, right: 84, top: 78, bottom: 56, display: 'flex', flexDirection: 'column' }}>
        <span style={mono(23, OURO)}>{capa ? dados.kicker : tela.rotulo}</span>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        {capa && dados.grande && <span style={serif(tamanhoGrande(dados), OURO, { lineHeight: 1, marginBottom: 18 })}>{dados.grande}</span>}
        {cta ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={serif(104, OURO, { lineHeight: 1 })}>{tela.titulo}</span>
            <span style={serif(44, TEXTO, { marginTop: 28, lineHeight: 1.2 })}>{tela.texto}</span>
            <span style={mono(26, OURO, { marginTop: 40 })}>Link na bio · {SITE}</span>
          </div>
        ) : tela.dias ? (
          <TelaDias tela={tela} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={serif(porTamanho(tela.titulo, capa ? [[50, 88], [80, 76], [130, 64]] : [[40, 74], [80, 64], [130, 56]]), capa ? TEXTO : OURO, { lineHeight: 1.08 })}>{tela.titulo}</span>
            {tela.texto && <span style={serif(porTamanho(tela.texto, [[120, 54], [200, 48], [320, 43]]), capa ? AREIA : TEXTO, { marginTop: 26, lineHeight: 1.22 })}>{tela.texto}</span>}
          </div>
        )}
        <div style={{ display: 'flex', flexGrow: 1.4 }} />
        {capa && <span style={mono(20, AREIA, { marginBottom: 16 })}>Arrasta pro lado →</span>}
        <Rodape n={k + 1} total={total} data={data} />
      </div>
    </div>
  );
}

// ── Reels ───────────────────────────────────────────────────────────────────
function Sobreposicao({ rotulo, texto, cta = false }) {
  const { width: W, height: H } = FORMATOS.r1;
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 70, right: 140, top: Math.round(H * 0.24), height: Math.round(H * 0.5), display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '44px 48px', borderRadius: 28, backgroundColor: 'rgba(7,4,13,.62)', border: `1px solid ${LINHA}` }}>
          <span style={mono(26, OURO)}>{rotulo}</span>
          {cta ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={serif(96, OURO, { marginTop: 22, lineHeight: 1 })}>Faz o seu mapa grátis</span>
              <span style={mono(28, TEXTO, { marginTop: 30 })}>Link na bio</span>
              <span style={mono(22, AREIA, { marginTop: 14 })}>{SITE}</span>
            </div>
          ) : (
            <span style={serif(porTamanho(texto, [[50, 84], [90, 72], [160, 60]]), TEXTO, { marginTop: 22, lineHeight: 1.12 })}>{texto}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A arte pedida.
 * @param {{ data: string, formato: string, dados: object, conteudo: object }} p
 * @returns {Promise<{ buffer: Buffer, tipo: string }|null>} null = tela que não existe
 */
export async function gerarArte({ data, formato, dados, conteudo, indice = null }) {
  const { width: W, height: H } = FORMATOS[formato];
  const [sky, fonts] = await Promise.all([skyDoDisco(), fontes()]);
  let el;
  let transparente = false;

  if (formato === 'story') {
    el = <Story e={energiaDoDia(data, conteudo.story)} ceu={svgDoCeu(sky, data, { W, H, rotulos: false })} />;
  } else if (formato === 'frase') {
    // a frase vai na URL (índice na tabela): o Story mostra a que foi escolhida na hora de postar
    const f = (indice != null && FRASES[indice]) || fraseDoDia(data);
    if (!f) return null;
    el = <StoryFrase f={f} ceu={svgDoCeu(sky, data, { W, H, rotulos: false })} />;
  } else if (formato === 'ceu') {
    const ceu = svgDoCeu(sky, data, { W, H, rotulos: false });
    el = <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#07040d' }}><Fundo svg={ceu.svg} W={W} H={H} escurecer={0.25} /></div>;
  } else if (/^r[123]$/.test(formato)) {
    transparente = true;
    const r = conteudo.reels;
    el = formato === 'r1' ? <Sobreposicao rotulo={dados.kicker} texto={r.gancho} />
      : formato === 'r2' ? <Sobreposicao rotulo="A virada" texto={r.virada} />
        : <Sobreposicao rotulo="Agora é você" cta />;
  } else {
    const k = formato === 'feed' ? 0 : Number(formato.slice(1)) - 1;
    if (!conteudo.telas[k]) return null;
    el = <Tela k={k} dados={dados} conteudo={conteudo} ceu={svgDoCeu(sky, data, { W, H, rotulos: false })} data={data} />;
  }

  const png = Buffer.from(await new ImageResponse(el, { width: W, height: H, fonts }).arrayBuffer());
  if (transparente) return { buffer: png, tipo: 'image/png' };
  return { buffer: await sharp(png).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer(), tipo: 'image/jpeg' };
}
