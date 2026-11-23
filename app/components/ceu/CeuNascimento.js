'use client';

// CeuNascimento — o céu real do nascimento de uma pessoa, PARADO: mesmo
// desenho do Olho Cósmico (estrelas, constelações, luz do Sol vindo da direção
// certa no modo dia, 21h + "céu aproximado" sem hora), mas sem scroll, sem
// animação e sem brilho piscando. Preenche o pai (position: absolute; inset: 0),
// então o pai precisa de position: relative e altura.
//
// Uso: topo da Minha Área (app/seu-dia/AbaInicio.js). Retrato (largura/altura
// ≤ 0,9) usa a imagem e4.webp; banner largo usa e4w.webp — mesmo limiar do Olho.
// A conta do céu é de lib/ceuNascimento.js (pura, testada).
//
// Dados de estrelas e constelações (public/olho/sky.json): d3-celestial
// (c) 2015 Olaf Frohn, licença BSD-3 — ver public/olho/LICENSE-d3-celestial.txt.

import { useEffect, useMemo, useRef, useState } from 'react';
import s from './CeuNascimento.module.css';
import { resumoCeu, projetarCeu, pontoNaCapa, LUGAR_PADRAO } from '@/lib/ceuNascimento';

// Ponto da estrela em cada imagem (mesmas origens do zoom no Olho Cósmico).
const IMAGENS = {
  retrato: { src: '/olho/e4.webp', w: 941, h: 1672, fx: 0.5, fy: 0.485 },
  largo: { src: '/olho/e4w.webp', w: 1672, h: 941, fx: 0.501, fy: 0.508 },
};
const LIMIAR_LARGO = 0.9;

// sky.json (~95 KB) baixa uma vez só por visita, e só quando o céu aparece.
let promessaSky = null;
function carregarSky() {
  promessaSky ||= fetch('/olho/sky.json')
    .then((r) => { if (!r.ok) throw new Error(`sky.json ${r.status}`); return r.json(); })
    .catch((e) => { promessaSky = null; throw e; });
  return promessaSky;
}

function corEstrela(bv) { // azul-branco pras quentes, dourado pras frias
  if (bv < 0.2) return '205,220,255';
  if (bv < 0.6) return '255,248,235';
  if (bv < 1.1) return '255,226,170';
  return '255,196,140';
}

function desenhar(ctx, ceu, W) {
  const { estrelas, linhas, rotulos, sol } = ceu;
  if (sol.dia) { // luz do dia vindo da direção do Sol
    ctx.fillStyle = 'rgba(70,45,95,.28)';
    ctx.fillRect(0, 0, W, ctx.canvas.height);
    const g = ctx.createRadialGradient(sol.ex, sol.ey, 0, sol.ex, sol.ey, W * 1.9);
    g.addColorStop(0, 'rgba(255,226,170,.95)'); g.addColorStop(0.18, 'rgba(250,180,100,.5)');
    g.addColorStop(0.5, 'rgba(180,110,120,.18)'); g.addColorStop(1, 'rgba(60,40,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, ctx.canvas.height);
    if (sol.x > -30 && sol.x < W + 30) { // disco do Sol quando está dentro da tela
      const d = ctx.createRadialGradient(sol.x, sol.y, 0, sol.x, sol.y, 46);
      d.addColorStop(0, 'rgba(255,248,225,1)'); d.addColorStop(0.25, 'rgba(255,214,140,.9)'); d.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = d; ctx.beginPath(); ctx.arc(sol.x, sol.y, 46, 0, 6.283); ctx.fill();
    }
  }
  const k = sol.dia ? 0.45 : 1; // de dia as estrelas ficam "escondidas"
  for (const { x, y, r, bv, ext } of estrelas) {
    ctx.fillStyle = `rgba(${corEstrela(bv)},${Math.min(1, ext * 0.9) * k})`;
    ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, 6.283); ctx.fill();
    if (r > 2.4) { // brilho em volta das mais fortes
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, `rgba(${corEstrela(bv)},${0.35 * ext})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 6.283); ctx.fill();
    }
  }
  for (const c of linhas) {
    ctx.strokeStyle = c.destaque ? 'rgba(255,214,140,.95)' : 'rgba(242,199,123,.38)';
    ctx.lineWidth = c.destaque ? 1.6 : 0.8;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of c.pts) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
  }
  ctx.font = '300 9.5px "Geist Mono", monospace';
  ctx.textAlign = 'center';
  for (const l of rotulos) {
    const txt = l.texto.toUpperCase().split('').join(' ');
    const meia = ctx.measureText(txt).width / 2;
    if (l.x - meia < 6 || l.x + meia > W - 6) continue; // nome cortado na borda não aparece
    ctx.fillStyle = l.destaque ? 'rgba(255,220,160,1)' : 'rgba(230,215,190,.75)';
    ctx.fillText(txt, l.x, l.y);
  }
}

/**
 * @param {{
 *   data: string, hora?: string|null,
 *   lugar?: { nome: string|null, lat: number, lon: number, tz: string },
 *   rotuloMaxY?: number,   // fração da altura: abaixo disso, nenhum nome de constelação
 *   className?: string,
 * }} props
 */
export default function CeuNascimento({ data, hora = null, lugar = LUGAR_PADRAO, rotuloMaxY = 0.6, className = '' }) {
  const caixa = useRef(null);
  const canvas = useRef(null);
  const [tam, setTam] = useState(null); // { W, H }
  const [sky, setSky] = useState(null);
  const [imgOk, setImgOk] = useState(false);

  const resumo = useMemo(() => {
    try { return resumoCeu({ data, hora, lugar }); } catch { return null; }
  }, [data, hora, lugar]);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return undefined;
    const medir = () => {
      const W = el.clientWidth, H = el.clientHeight;
      setTam((t) => (t && t.W === W && t.H === H ? t : { W, H }));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let vivo = true;
    carregarSky().then((j) => { if (vivo) setSky(j); }).catch((e) => console.error('[CeuNascimento]', e));
    return () => { vivo = false; };
  }, []);

  const largo = tam ? tam.W / Math.max(1, tam.H) > LIMIAR_LARGO : false;
  const img = IMAGENS[largo ? 'largo' : 'retrato'];

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !tam || !sky || !resumo || tam.W < 2 || tam.H < 2) return undefined;
    let vivo = true;
    const { W, H } = tam;
    // Zênite = onde a estrela da imagem de fundo caiu depois do object-fit: cover.
    const z = pontoNaCapa(W, H, img.w, img.h, img.fx, img.fy);
    // Escala parecida com a do Olho em tela cheia, mesmo num banner mais baixo.
    const R = 0.56 * Math.max(W, H * 1.5);
    const ceu = projetarCeu(sky, resumo, lugar, { W, H, cx: z.x, cy: z.y, R, rotuloMaxY: H * rotuloMaxY });

    const pintar = () => {
      if (!vivo) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      desenhar(ctx, ceu, W);
    };
    pintar();
    // Os nomes das constelações usam a Geist Mono: redesenha quando ela chegar.
    try { document.fonts?.load('300 9.5px "Geist Mono"').then(pintar, () => {}); } catch {}
    return () => { vivo = false; };
  }, [tam, sky, resumo, lugar, img, rotuloMaxY]);

  return (
    <div
      ref={caixa}
      className={`${s.ceu} ${sky && imgOk ? s.pronto : ''} ${className}`}
      role="img"
      aria-label={resumo ? resumo.legenda : 'O céu do seu nascimento'}
    >
      {tam && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={img.src} src={img.src} alt="" className={s.fundo} onLoad={() => setImgOk(true)} onError={() => setImgOk(true)} decoding="async" />
      )}
      <canvas ref={canvas} className={s.canvas} aria-hidden="true" />
    </div>
  );
}
