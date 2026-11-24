'use client';

// A animação do Reels (linha do tempo em lib/reelsAnimacao.js). Dois modos:
//   captura: parada no quadro 0; o robô chama window.__quadro(t) (devolve uma
//            Promise que resolve depois do próximo desenho) e tira a foto;
//            window.__pronto = true quando as 4 imagens carregaram.
//   normal:  toca em loop, reduzida pra caber na janela.
// Esconde o aviso de cookies do layout raiz (não pode aparecer no vídeo).

import { useEffect, useRef, useState } from 'react';
import { estadoNoTempo, REELS } from '@/lib/reelsAnimacao';

export default function ReelsAnimacao({ ceu, camadas, captura }) {
  const ceuRef = useRef(null);
  const camadasRef = useRef({});
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const aplicar = (t) => {
      const e = estadoNoTempo(t);
      if (ceuRef.current) ceuRef.current.style.transform = `scale(${e.escalaCeu})`;
      for (const c of e.camadas) {
        const el = camadasRef.current[c.id];
        if (!el) continue;
        el.style.opacity = String(c.opacidade);
        el.style.transform = `translateY(${c.deslocY}px)`;
      }
    };
    window.__quadro = (t) => new Promise((ok) => {
      aplicar(t);
      requestAnimationFrame(() => requestAnimationFrame(ok));
    });
    const imgs = [ceuRef.current, ...Object.values(camadasRef.current)].filter(Boolean);
    Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null))).then(() => {
      aplicar(0);
      window.__pronto = true;
    });

    if (captura) return undefined;
    const ajustar = () => setEscala(Math.min(window.innerWidth / REELS.largura, window.innerHeight / REELS.altura, 1));
    ajustar();
    window.addEventListener('resize', ajustar);
    let raf;
    const inicio = performance.now();
    const ciclo = REELS.duracao + 0.6; // meia pausa no fim antes de repetir
    const quadro = (agora) => {
      aplicar(((agora - inicio) / 1000) % ciclo);
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', ajustar);
    };
  }, [captura]);

  const cheia = { position: 'absolute', top: 0, left: 0, width: REELS.largura, height: REELS.altura };
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07040d', overflow: 'hidden', display: 'flex', alignItems: captura ? 'flex-start' : 'center', justifyContent: captura ? 'flex-start' : 'center' }}>
      <div style={{ position: 'relative', width: REELS.largura, height: REELS.altura, flex: '0 0 auto', overflow: 'hidden', transform: captura ? 'none' : `scale(${escala})`, transformOrigin: 'center center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={ceuRef} src={ceu} alt="" style={{ ...cheia, objectFit: 'cover', transformOrigin: '50% 50%' }} />
        {camadas.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={c.id} ref={(el) => { camadasRef.current[c.id] = el; }} src={c.src} alt="" style={{ ...cheia, opacity: 0 }} />
        ))}
      </div>
      <style>{'.ic-cookies{display:none!important} html,body{margin:0;background:#07040d;overflow:hidden}'}</style>
    </div>
  );
}
