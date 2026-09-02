'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { SIGNOS, getCompatibilidade } from '@/lib/compatibilidade';

export default function CompatibilidadeClient() {
  const [signoA, setSignoA] = useState('Sagitário');
  const [signoB, setSignoB] = useState('Leão');

  useEffect(() => {
    const stars = document.getElementById('stars');
    if (!stars) return;
    const count = window.innerWidth < 768 ? 60 : 130;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.opacity = String(0.2 + Math.random() * 0.7);
      s.style.transform = `scale(${0.6 + Math.random() * 1.5})`;
      s.style.animationDelay = Math.random() * 3 + 's';
      stars.appendChild(s);
    }
    return () => { stars.innerHTML = ''; };
  }, []);

  const resultado = useMemo(() => getCompatibilidade(signoA, signoB), [signoA, signoB]);

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />
      <SiteNav active="compatibilidade" />

      <div className="content">
        <p className="eyebrow">Grátis · sem cadastro</p>
        <h1>Compatibilidade Astral</h1>
        <p className="sub">Escolhe dois signos e veja como eles se encontram.</p>

        <div className="picker">
          <select value={signoA} onChange={(e) => setSignoA(e.target.value)}>
            {SIGNOS.map((s) => <option key={s.nome} value={s.nome}>{s.simbolo} {s.nome}</option>)}
          </select>
          <span className="plus">+</span>
          <select value={signoB} onChange={(e) => setSignoB(e.target.value)}>
            {SIGNOS.map((s) => <option key={s.nome} value={s.nome}>{s.simbolo} {s.nome}</option>)}
          </select>
        </div>

        {resultado && (
          <div className="result-card">
            <div className="score-row">
              <span className="score">{resultado.score}%</span>
              <div className="score-track">
                <div className="score-fill" style={{ width: `${resultado.score}%` }} />
              </div>
            </div>
            <h2>{resultado.headline}</h2>
            <p className="body">{resultado.corpo}</p>
          </div>
        )}

        <div className="upsell">
          <p>
            Isso é uma leitura geral pelo Sol. Seu mapa completo cruza também Lua, Ascendente, Vênus e Marte —
            muito mais específico que só o signo solar.
          </p>
          <Link href="/" className="upsell-cta">Ver meu mapa completo →</Link>
        </div>
      </div>

      <style jsx global>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
        }
        .wrap { min-height: 100vh; background: var(--bg1); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; position: relative; }
        .stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; animation: twinkle 3.4s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.9; } }

        .content { position: relative; z-index: 1; max-width: 620px; margin: 0 auto; padding: 56px 20px 100px; text-align: center; }
        .eyebrow { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--secondary); margin: 0 0 12px; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(28px, 5vw, 38px); margin: 0 0 10px; }
        .sub { color: var(--muted); font-size: 19px; margin: 0 0 36px; }

        .picker { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 32px; flex-wrap: wrap; }
        select {
          font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600;
          background: var(--bg2); color: var(--text); border: 1px solid var(--border-strong);
          border-radius: 12px; padding: 12px 16px; cursor: pointer;
        }
        .plus { color: var(--muted); font-size: 20px; }

        .result-card {
          text-align: left; background: linear-gradient(180deg, rgba(19,8,40,0.9), rgba(10,1,24,0.9));
          border: 1px solid var(--border); border-radius: 20px; padding: 28px;
        }
        .score-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .score { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .score-track { flex: 1; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .score-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--secondary), var(--primary)); }
        .result-card h2 { font-family: 'Cinzel', serif; font-size: 21px; margin: 0 0 10px; }
        .result-card .body { font-size: 17px; line-height: 1.65; color: var(--muted); margin: 0; }

        .upsell { margin-top: 36px; padding: 22px; border-radius: 16px; border: 1px dashed var(--border-strong); }
        .upsell p { font-size: 15px; color: var(--muted); line-height: 1.6; margin: 0 0 14px; }
        .upsell-cta {
          display: inline-block; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.06em;
          color: #fff; background: linear-gradient(135deg, var(--primary), #be185d);
          padding: 11px 22px; border-radius: 999px; text-decoration: none;
        }
      `}</style>
    </div>
  );
}
