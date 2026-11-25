'use client';

// O Reels NARRADO (30–40s): céu do dia com zoom lento + legenda palavra por
// palavra (lib/reelsRoteiro.js: blocosDaLegenda / legendaNoTempo), grande e
// centralizada, em Instrument Serif; a palavra falada acende em dourado.
//   captura: o robô chama window.__carregar({ palavras, duracao }) com a
//            narração do dia e depois window.__quadro(t) quadro a quadro;
//            window.__pronto = true quando céu, fontes e narração estão prontos.
//   normal:  pra assistir (prévia): toca o MP3 da narração junto (o navegador
//            pede um toque pra liberar o som) e repete; reduzida pra caber.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { REELS, escalaCeuNarrado } from '@/lib/reelsAnimacao';
import { blocosDaLegenda, legendaNoTempo, duracaoDoVideo } from '@/lib/reelsRoteiro';

const OURO = '#f2c77b';
const TEXTO = '#f3e9da';
const FONTES = `
@font-face { font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; src: url(/olho/fonts/instrument-serif-latin-400-normal.woff2) format('woff2'); }
@font-face { font-family: 'Geist Mono'; font-weight: 400; src: url(/olho/fonts/geist-mono-latin-400-normal.woff2) format('woff2'); }
.ic-cookies{display:none!important} html,body{margin:0;background:#07040d;overflow:hidden}`;

export default function ReelsNarrado({ ceu, narracao: inicial, captura }) {
  const [narracao, setNarracao] = useState(inicial);
  const [t, setT] = useState(0);
  const [escala, setEscala] = useState(1);
  const [tocando, setTocando] = useState(false);
  const ceuRef = useRef(null);
  const audioRef = useRef(null);
  const prontoRef = useRef({ ceu: false, fontes: false });

  const palavras = useMemo(() => narracao?.palavras || [], [narracao]);
  const blocos = useMemo(() => blocosDaLegenda(palavras), [palavras]);
  const duracao = useMemo(() => (palavras.length ? duracaoDoVideo(palavras, REELS.fps) : 1), [palavras]);
  const agora = legendaNoTempo(blocos, palavras, t);
  const bloco = agora.bloco >= 0 ? blocos[agora.bloco] : null;
  // entra com um fade curto a cada bloco novo
  const entrada = bloco ? Math.min(1, Math.max(0, (t - bloco.ini) / 0.12)) : 0;

  const marcarPronto = useCallback(() => {
    if (prontoRef.current.ceu && prontoRef.current.fontes && palavras.length) window.__pronto = true;
  }, [palavras.length]);

  useEffect(() => {
    window.__carregar = (n) => new Promise((ok) => {
      flushSync(() => setNarracao(n));
      requestAnimationFrame(() => requestAnimationFrame(ok));
    });
    window.__quadro = (tempo) => new Promise((ok) => {
      flushSync(() => setT(tempo));
      requestAnimationFrame(() => requestAnimationFrame(ok));
    });
    const img = ceuRef.current;
    (img?.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { prontoRef.current.ceu = true; marcarPronto(); });
    Promise.all([
      document.fonts.load(`104px "Instrument Serif"`),
      document.fonts.load(`22px "Geist Mono"`),
    ]).catch(() => {}).then(() => document.fonts.ready).then(() => { prontoRef.current.fontes = true; marcarPronto(); });
  }, [marcarPronto]);

  useEffect(() => { marcarPronto(); }, [marcarPronto]);

  // Assistir: com som (depois do toque) segue o tempo do MP3; sem, o relógio.
  useEffect(() => {
    if (captura || !palavras.length) return undefined;
    const ajustar = () => setEscala(Math.min(window.innerWidth / REELS.largura, window.innerHeight / REELS.altura, 1));
    ajustar();
    window.addEventListener('resize', ajustar);
    let raf;
    const inicio = performance.now();
    const ciclo = duracao + 1;
    const quadro = (agoraMs) => {
      const a = audioRef.current;
      setT(a && tocando && !a.paused ? a.currentTime : ((agoraMs - inicio) / 1000) % ciclo);
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', ajustar); };
  }, [captura, palavras.length, duracao, tocando]);

  const tocar = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().then(() => setTocando(true)).catch(() => {});
  };

  const cheia = { position: 'absolute', top: 0, left: 0, width: REELS.largura, height: REELS.altura };
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07040d', overflow: 'hidden', display: 'flex', alignItems: captura ? 'flex-start' : 'center', justifyContent: captura ? 'flex-start' : 'center' }}>
      <div style={{ position: 'relative', width: REELS.largura, height: REELS.altura, flex: '0 0 auto', overflow: 'hidden', transform: captura ? 'none' : `scale(${escala})`, transformOrigin: 'center center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={ceuRef} src={ceu} alt="" style={{ ...cheia, objectFit: 'cover', transformOrigin: '50% 50%', transform: `scale(${escalaCeuNarrado(t, duracao)})` }} />
        {/* véu: escurece o meio (legenda) e as pontas, sem apagar o céu */}
        <div style={{ ...cheia, background: 'radial-gradient(ellipse 85% 32% at 50% 50%, rgba(7,4,13,.55) 0%, rgba(7,4,13,.15) 70%, rgba(7,4,13,0) 100%), linear-gradient(180deg, rgba(7,4,13,.55) 0%, rgba(7,4,13,0) 18%, rgba(7,4,13,0) 78%, rgba(7,4,13,.7) 100%)' }} />
        <div style={{ position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: '"Geist Mono", monospace', fontSize: 24, letterSpacing: '0.32em', color: TEXTO, opacity: 0.85 }}>
          INTUITIVE CONCEPT
        </div>
        <div style={{ position: 'absolute', left: 80, right: 80, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {bloco && (
            <p style={{
              margin: 0, textAlign: 'center', fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 104, lineHeight: 1.08, letterSpacing: '-0.01em',
              textShadow: '0 4px 28px rgba(7,4,13,.85)', opacity: entrada, transform: `translateY(${(1 - entrada) * 18}px)`,
            }}>
              {palavras.slice(bloco.de, bloco.ate + 1).map((p, k) => {
                const i = bloco.de + k;
                const falada = i === agora.palavra;
                const ja = i < agora.palavra;
                return (
                  <span key={i} style={{ color: falada ? OURO : TEXTO, opacity: falada || ja ? 1 : 0.5, fontStyle: falada ? 'italic' : 'normal' }}>
                    {p.texto}{k < bloco.ate - bloco.de ? ' ' : ''}
                  </span>
                );
              })}
            </p>
          )}
        </div>
      </div>
      {!captura && narracao?.audio && (
        <>
          <audio ref={audioRef} src={narracao.audio} preload="auto" onEnded={() => setTimeout(tocar, 1000)} />
          {!tocando && (
            <button type="button" onClick={tocar} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '14px 24px', borderRadius: 999, border: 0, background: OURO, color: '#1a1020', fontFamily: 'monospace', letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Tocar com som
            </button>
          )}
        </>
      )}
      <style>{FONTES}</style>
    </div>
  );
}
