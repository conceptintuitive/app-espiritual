// Card do story (1080×1920) da aba Meu Mapa, desenhado no navegador.
// Dois modelos (croquis reference/ux/CardCeu.dc.html e CardNumero.dc.html, em
// 540×960 = metade da escala; aqui tudo em ×2):
//   'ceu'    (padrão) o céu real do nascimento no alto, nome grande, síntese,
//            os 6 sistemas em grid, a frase em primeira pessoa e o rodapé.
//   'numero' o céu em tela cheia e o número de vida gigante no centro.
// E o card de frase do Manual (desenharCardFrase): o céu da pessoa em tela
// cheia + uma frase do Manual em Instrument Serif + intuitiveconcept.com.br.
// O céu é o mesmo do topo da Minha Área (lib/ceuNascimento.js +
// app/components/ceu/ceuCanvas.js), com modo dia. Textos: lib/cardStory.js.
// As fontes (Instrument Serif + Geist Mono, public/olho/fonts) são carregadas
// com FontFace ANTES de desenhar — senão o canvas usa a fonte reserva.

import { projetarCeu, pontoNaCapa, resumoCeu, lugarDoPerfil } from '@/lib/ceuNascimento';
import { IMAGENS_CEU, carregarSky, desenharCeu } from '@/app/components/ceu/ceuCanvas';

export const LARGURA = 1080;
export const ALTURA = 1920;
const K = 2; // escala do croqui (540 → 1080)

const COR = { fundo: '#07040d', texto: '#f3e9da', ouro: '#ffdca0', apagado: '#b9a9c9', linha: 'rgba(242,199,123,.22)', frase: '#e9dcc8' };
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"Geist Mono", ui-monospace, monospace';

const FONTES = [
  ['Instrument Serif', '/olho/fonts/instrument-serif-latin-400-normal.woff2', { style: 'normal', weight: '400' }],
  ['Instrument Serif', '/olho/fonts/instrument-serif-latin-400-italic.woff2', { style: 'italic', weight: '400' }],
  ['Geist Mono', '/olho/fonts/geist-mono-latin-300-normal.woff2', { style: 'normal', weight: '300' }],
  ['Geist Mono', '/olho/fonts/geist-mono-latin-400-normal.woff2', { style: 'normal', weight: '400' }],
];
let promessaFontes = null;
function carregarFontes() {
  promessaFontes ||= Promise.all(FONTES.map(async ([familia, url, desc]) => {
    const f = new FontFace(familia, `url(${url}) format('woff2')`, desc);
    await f.load();
    document.fonts.add(f);
  })).catch((e) => { promessaFontes = null; throw e; });
  return promessaFontes;
}

const imagens = {};
function carregarImagem(src) {
  imagens[src] ||= new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => { delete imagens[src]; erro(new Error(`imagem ${src}`)); };
    img.src = src;
  });
  return imagens[src];
}

// ── Texto ───────────────────────────────────────────────────────────────────

// Espaçamento entre letras desenhado à mão (ctx.letterSpacing não existe em
// todo navegador). align: 'left' | 'right' | 'center'.
function largura(ctx, t, esp) {
  return ctx.measureText(t).width + Math.max(0, t.length - 1) * esp;
}
function texto(ctx, t, x, y, { esp = 0, align = 'left' } = {}) {
  if (!esp) { ctx.textAlign = align; ctx.fillText(t, x, y); return; }
  const w = largura(ctx, t, esp);
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.textAlign = 'left';
  for (const ch of t) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + esp; }
}
// Diminui a fonte até caber em `max`.
function caber(ctx, t, max, tamanho, fonte, min = tamanho * 0.5) {
  let s = tamanho;
  ctx.font = fonte(s);
  while (ctx.measureText(t).width > max && s > min) { s -= 2; ctx.font = fonte(s); }
  return s;
}
function quebrar(ctx, t, max) {
  const linhas = [];
  let atual = '';
  for (const p of t.split(' ')) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > max && atual) { linhas.push(atual); atual = p; } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}
function linhaH(ctx, x1, x2, y) {
  ctx.fillStyle = COR.linha;
  ctx.fillRect(x1, y, x2 - x1, 2);
}

// ── Céu ─────────────────────────────────────────────────────────────────────

// O céu do nascimento num retângulo w×h: imagem da estrela (só de noite, como
// no Olho e na Minha Área) + estrelas, constelações e a luz do Sol.
// `zenite` (opcional) põe a estrela da imagem — e o zênite do céu — nesse
// ponto, ampliando a imagem o mínimo pra ela continuar cobrindo tudo.
async function canvasDoCeu(dados, w, h, { zenite = null, rotuloMinY = 50, rotuloMaxY = h * 0.42 } = {}) {
  const [sky, imgEstrela] = await Promise.all([
    carregarSky(),
    dados.ceu.dia ? Promise.resolve(null) : carregarImagem(IMAGENS_CEU.retrato.src).catch(() => null),
  ]);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, w, h);
  const im = IMAGENS_CEU.retrato;
  let z = pontoNaCapa(w, h, im.w, im.h, im.fx, im.fy);
  let escala = Math.max(w / im.w, h / im.h);
  let ox = (w - im.w * escala) / 2;
  let oy = (h - im.h * escala) / 2;
  if (zenite) {
    escala = Math.max(escala,
      zenite.x / (im.fx * im.w), (w - zenite.x) / ((1 - im.fx) * im.w),
      zenite.y / (im.fy * im.h), (h - zenite.y) / ((1 - im.fy) * im.h));
    ox = zenite.x - im.fx * im.w * escala;
    oy = zenite.y - im.fy * im.h * escala;
    z = zenite;
  }
  if (imgEstrela) ctx.drawImage(imgEstrela, ox, oy, im.w * escala, im.h * escala);
  const R = 0.56 * Math.max(w, h * 1.5);
  const proj = projetarCeu(sky, dados.ceu, dados.lugar, { W: w, H: h, cx: z.x, cy: z.y, R, rotuloMinY, rotuloMaxY });
  desenharCeu(ctx, proj, w, K);
  return cv;
}

// ── Modelos ─────────────────────────────────────────────────────────────────

const PAD = 40 * K;

async function modeloCeu(ctx, dados) {
  const W = LARGURA;
  const H = ALTURA;
  const alturaCeu = 600 * K;
  ctx.drawImage(await canvasDoCeu(dados, W, alturaCeu, { rotuloMinY: 90 * K }), 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, 620 * K);
  g.addColorStop(0, 'rgba(7,4,13,.55)'); g.addColorStop(0.18, 'rgba(7,4,13,0)'); g.addColorStop(0.45, 'rgba(7,4,13,0)');
  g.addColorStop(0.82, 'rgba(7,4,13,.9)'); g.addColorStop(1, COR.fundo);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 620 * K);

  // Topo
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${11 * K}px ${MONO}`;
  ctx.fillStyle = COR.texto;
  texto(ctx, 'MEU MAPA', PAD, PAD + 11 * K, { esp: 0.3 * 11 * K });
  ctx.fillStyle = COR.ouro;
  texto(ctx, 'INTUITIVE CONCEPT', W - PAD, PAD + 11 * K, { esp: 0.3 * 11 * K, align: 'right' });

  // Nome e síntese
  const larguraUtil = W - 2 * PAD;
  let y = 425 * K;
  ctx.fillStyle = COR.texto;
  caber(ctx, dados.nome, larguraUtil, 118 * K, (s) => `400 ${s}px ${SERIF}`);
  texto(ctx, dados.nome, PAD, y);
  y += 44 * K;
  ctx.fillStyle = COR.ouro;
  caber(ctx, dados.temas, larguraUtil, 38 * K, (s) => `italic 400 ${s}px ${SERIF}`);
  texto(ctx, dados.temas, PAD, y);

  // Grid dos 6 sistemas (2 colunas, linhas finas)
  y += 26 * K;
  const gap = 24 * K;
  const col = (larguraUtil - gap) / 2;
  const alturaLinha = 63 * K;
  linhaH(ctx, PAD, W - PAD, y);
  dados.sistemas.forEach((s, i) => {
    const c = i % 2;
    const r = Math.floor(i / 2);
    const x = PAD + c * (col + gap);
    const topo = y + r * alturaLinha;
    ctx.fillStyle = COR.apagado;
    ctx.font = `400 ${9 * K}px ${MONO}`;
    texto(ctx, s.k.toUpperCase(), x, topo + 11 * K + 9 * K, { esp: 0.2 * 9 * K });
    ctx.fillStyle = COR.texto;
    caber(ctx, s.v, col, 25 * K, (t) => `400 ${t}px ${SERIF}`);
    texto(ctx, s.v, x, topo + 11 * K + 9 * K + 2 * K + 25 * K);
    if (c === 1 || i === dados.sistemas.length - 1) linhaH(ctx, PAD, W - PAD, topo + alturaLinha);
  });
  y += Math.ceil(dados.sistemas.length / 2) * alturaLinha;

  // Frase em primeira pessoa
  if (dados.frase) {
    ctx.fillStyle = COR.frase;
    ctx.font = `italic 400 ${21 * K}px ${SERIF}`;
    const linhas = quebrar(ctx, dados.frase, larguraUtil).slice(0, 3);
    y += 20 * K;
    for (const l of linhas) { y += 21 * K * 1.3; texto(ctx, l, PAD, y - 5 * K); }
  }

  // Rodapé
  ctx.font = `400 ${9 * K}px ${MONO}`;
  const esp = 0.12 * 9 * K;
  const base = H - 34 * K;
  const entre = 9 * K * 1.6;
  ctx.fillStyle = COR.apagado;
  const leg = dados.legenda;
  leg.forEach((l, i) => texto(ctx, l, PAD, base - (leg.length - 1 - i) * entre, { esp }));
  ctx.fillStyle = COR.ouro;
  texto(ctx, 'Descubra o seu céu', W - PAD, base - entre, { esp, align: 'right' });
  ctx.fillStyle = COR.apagado;
  texto(ctx, 'intuitiveconcept.com.br/ceu', W - PAD, base, { esp, align: 'right' });
}

async function modeloNumero(ctx, dados) {
  const W = LARGURA;
  const H = ALTURA;
  // A estrela fica atrás do número (centro do algarismo) e sem nomes de constelação.
  ctx.drawImage(await canvasDoCeu(dados, W, H, { zenite: { x: W / 2, y: 330 * K }, rotuloMaxY: 0 }), 0, 0);
  // radial-gradient(ellipse 80% 60%) em volta do número + linear de cima e de baixo
  ctx.save();
  ctx.translate(W / 2, 330 * K);
  ctx.scale(1, (0.6 * H) / (0.8 * W));
  const r = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.8 * W);
  r.addColorStop(0, 'rgba(7,4,13,.15)'); r.addColorStop(1, 'rgba(7,4,13,.7)');
  ctx.fillStyle = r;
  ctx.fillRect(-W, -H, 2 * W, 4 * H);
  ctx.restore();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(7,4,13,.6)'); g.addColorStop(0.25, 'rgba(7,4,13,0)'); g.addColorStop(0.65, 'rgba(7,4,13,0)'); g.addColorStop(1, 'rgba(7,4,13,.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${11 * K}px ${MONO}`;
  ctx.fillStyle = COR.ouro;
  texto(ctx, 'INTUITIVE CONCEPT', cx, PAD + 11 * K, { esp: 0.3 * 11 * K, align: 'center' });

  ctx.fillStyle = COR.texto;
  const quem = dados.nome === 'Meu mapa' ? 'MEU NÚMERO É' : `${dados.nome.toUpperCase()}, SEU NÚMERO É`;
  caber(ctx, quem, W - 2 * PAD, 11 * K, (s) => `400 ${s}px ${MONO}`);
  texto(ctx, quem, cx, 172 * K, { esp: 0.3 * 11 * K, align: 'center' });

  ctx.fillStyle = COR.ouro;
  ctx.font = `400 ${300 * K}px ${SERIF}`;
  texto(ctx, String(dados.numero), cx, 430 * K, { align: 'center' });

  ctx.fillStyle = COR.texto;
  caber(ctx, dados.temas, W - 2 * PAD, 34 * K, (s) => `italic 400 ${s}px ${SERIF}`);
  texto(ctx, dados.temas, cx, 476 * K, { align: 'center' });

  // Três sistemas entre linhas
  const topo = 520 * K;
  const alt = 76 * K;
  linhaH(ctx, PAD, W - PAD, topo);
  linhaH(ctx, PAD, W - PAD, topo + alt);
  const col = (W - 2 * PAD) / dados.tres.length;
  dados.tres.forEach((s, i) => {
    const x = PAD + col * i + col / 2;
    ctx.fillStyle = COR.apagado;
    ctx.font = `400 ${9 * K}px ${MONO}`;
    texto(ctx, s.k.toUpperCase(), x, topo + 16 * K + 9 * K, { esp: 0.22 * 9 * K, align: 'center' });
    ctx.fillStyle = COR.texto;
    caber(ctx, s.v, col - 12 * K, 26 * K, (t) => `400 ${t}px ${SERIF}`);
    texto(ctx, s.v, x, topo + 16 * K + 9 * K + 4 * K + 26 * K, { align: 'center' });
  });

  // Rodapé
  ctx.font = `400 ${10 * K}px ${MONO}`;
  const esp = 0.14 * 10 * K;
  const base = H - 34 * K;
  ctx.fillStyle = COR.apagado;
  caber(ctx, dados.fundo, W - 2 * PAD, 10 * K, (s) => `400 ${s}px ${MONO}`);
  texto(ctx, dados.fundo, cx, base - 16 * K, { esp, align: 'center' });
  ctx.font = `400 ${10 * K}px ${MONO}`;
  ctx.fillStyle = COR.ouro;
  texto(ctx, 'Descubra o seu · intuitiveconcept.com.br/ceu', cx, base, { esp, align: 'center' });
}

/**
 * Desenha o card e devolve o canvas 1080×1920.
 * @param {'ceu'|'numero'} modelo
 * @param {ReturnType<import('@/lib/cardStory').dadosDoCard>} dados
 */
export async function desenharCard(modelo, dados) {
  await carregarFontes().catch(() => {}); // sem as fontes, desenha com a reserva
  const cv = document.createElement('canvas');
  cv.width = LARGURA; cv.height = ALTURA;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  if (modelo === 'numero') await modeloNumero(ctx, dados);
  else await modeloCeu(ctx, dados);
  return cv;
}

export function canvasParaBlob(cv) {
  return new Promise((ok, erro) => cv.toBlob((b) => (b ? ok(b) : erro(new Error('canvas'))), 'image/png'));
}

/**
 * Card de frase do Manual (1080×1920): o céu do nascimento em tela cheia, a
 * frase no meio em Instrument Serif itálico e o rodapé com o site.
 * @param {{ frase: string, nome?: string|null, dataNascimento: string, hora?: string|null, cidade?: object|null }} p
 */
export async function desenharCardFrase({ frase, nome = null, dataNascimento, hora = null, cidade = null }) {
  await carregarFontes().catch(() => {});
  const W = LARGURA;
  const H = ALTURA;
  const lugar = lugarDoPerfil(cidade);
  const dados = { ceu: resumoCeu({ data: dataNascimento, hora, lugar }), lugar };
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(await canvasDoCeu(dados, W, H, { zenite: { x: W / 2, y: 250 * K }, rotuloMinY: 80 * K, rotuloMaxY: 380 * K }), 0, 0);
  // Escurece o meio e o pé pra frase e o rodapé ficarem legíveis.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(7,4,13,.45)'); g.addColorStop(0.18, 'rgba(7,4,13,0)'); g.addColorStop(0.34, 'rgba(7,4,13,.55)');
  g.addColorStop(0.7, 'rgba(7,4,13,.8)'); g.addColorStop(1, 'rgba(7,4,13,.96)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${11 * K}px ${MONO}`;
  ctx.fillStyle = COR.ouro;
  texto(ctx, 'INTUITIVE CONCEPT', cx, PAD + 11 * K, { esp: 0.3 * 11 * K, align: 'center' });

  // Frase: diminui a fonte até caber em 9 linhas.
  const limpa = String(frase || '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^["“”]+|["“”]+$/g, '').trim();
  const max = W - 2 * PAD - 20 * K;
  let tam = 46 * K;
  let linhas;
  for (;;) {
    ctx.font = `italic 400 ${tam}px ${SERIF}`;
    linhas = quebrar(ctx, `“${limpa}”`, max);
    if (linhas.length <= 9 || tam <= 26 * K) break;
    tam -= 2 * K;
  }
  const entre = tam * 1.18;
  const meio = 560 * K;
  let y = meio - ((linhas.length - 1) * entre) / 2;
  ctx.fillStyle = COR.texto;
  for (const l of linhas) { texto(ctx, l, cx, y, { align: 'center' }); y += entre; }

  const quem = String(nome || '').trim().split(/\s+/)[0];
  ctx.font = `400 ${10 * K}px ${MONO}`;
  ctx.fillStyle = COR.ouro;
  texto(ctx, quem ? `DO MANUAL DE ${quem.toUpperCase()}` : 'DO MANUAL DO MEU MAPA', cx, y + 22 * K, { esp: 0.26 * 10 * K, align: 'center' });

  // Rodapé
  const base = H - 34 * K;
  const esp = 0.14 * 10 * K;
  ctx.fillStyle = COR.apagado;
  caber(ctx, dados.ceu.legenda, W - 2 * PAD, 10 * K, (s) => `400 ${s}px ${MONO}`);
  texto(ctx, dados.ceu.legenda, cx, base - 16 * K, { esp, align: 'center' });
  ctx.font = `400 ${10 * K}px ${MONO}`;
  ctx.fillStyle = COR.ouro;
  texto(ctx, 'intuitiveconcept.com.br', cx, base, { esp, align: 'center' });
  return cv;
}
