'use client';

// CeuNascimento — o céu real do nascimento de uma pessoa, PARADO: mesmo
// desenho do Olho Cósmico (estrelas, constelações, luz do Sol vindo da direção
// certa no modo dia, 21h + "céu aproximado" sem hora), mas sem scroll, sem
// animação e sem brilho piscando. Preenche o pai (position: absolute; inset: 0),
// então o pai precisa de position: relative e altura.
//
// Uso: topo da Minha Área (app/seu-dia/AbaInicio.js). Retrato (largura/altura
// ≤ 0,9) usa a imagem e4.webp; banner largo usa e4w.webp — mesmo limiar do Olho.
// Modo dia: a imagem some e o zênite vira uma estrela pequena e branca (igual ao Olho).
// A conta do céu é de lib/ceuNascimento.js (pura, testada).
//
// Dados de estrelas e constelações (public/olho/sky.json): d3-celestial
// (c) 2015 Olaf Frohn, licença BSD-3 — ver public/olho/LICENSE-d3-celestial.txt.

import { useEffect, useMemo, useRef, useState } from 'react';
import s from './CeuNascimento.module.css';
import { resumoCeu, projetarCeu, pontoNaCapa, LUGAR_PADRAO } from '@/lib/ceuNascimento';

import { IMAGENS_CEU as IMAGENS, LIMIAR_LARGO, carregarSky, desenharCeu as desenhar } from './ceuCanvas';

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
  // Modo dia: sem a imagem da estrela (o canvas desenha um ponto branco no zênite).
  const dia = !!resumo?.dia;

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
      className={`${s.ceu} ${sky && (imgOk || dia) ? s.pronto : ''} ${className}`}
      role="img"
      aria-label={resumo ? resumo.legenda : 'O céu do seu nascimento'}
    >
      {tam && !dia && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={img.src} src={img.src} alt="" className={s.fundo} onLoad={() => setImgOk(true)} onError={() => setImgOk(true)} decoding="async" />
      )}
      <canvas ref={canvas} className={s.canvas} aria-hidden="true" />
    </div>
  );
}
