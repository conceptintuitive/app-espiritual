'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { hexagramaDoDia } from '@/lib/iching';

export default function HexagramaClient() {
  const [hexagrama, setHexagrama] = useState(null);
  const [ultimaAnaliseId, setUltimaAnaliseId] = useState(null);

  useEffect(() => {
    setHexagrama(hexagramaDoDia());
    try {
      setUltimaAnaliseId(window.localStorage.getItem('ic_ultima_analise_id'));
    } catch {}
  }, []);

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

  const ctaHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}` : '/';
  const ctaLabel = ultimaAnaliseId ? 'Ver meu mapa completo →' : 'Descobrir meu mapa completo →';

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />
      <SiteNav active="hexagrama" />

      <div className="content">
        <p className="eyebrow">Grátis · muda todo dia</p>
        <div className="glyph">☯</div>
        <h1>Hexagrama do Dia</h1>
        <p className="sub">
          Pra que serve: é um jeito simbólico de parar e olhar pro seu dia — não prevê o futuro,
          te dá um ângulo pra decidir com mais clareza o que fazer com o que já está na sua frente agora.
        </p>

        <details className="explicacao">
          <summary>De onde vem essa leitura?</summary>
          <div className="explicacao-corpo">
            <p>
              O I Ching é um sistema chinês milenar de leitura simbólica. Ele parte de 8 padrões
              básicos, os trigramas, cada um associado a uma força da natureza: Céu, Terra, Fogo, Água,
              Trovão, Vento, Montanha e Lago.
            </p>
            <p>
              Dois trigramas empilhados, um por cima e outro por baixo, formam a leitura do dia:
              o de cima mostra o que se expressa, o de baixo mostra a base que sustenta isso por dentro.
              Quando uma linha aparece destacada em laranja, é um ponto dessa configuração que já
              está em transição, mesmo que o resto pareça estável.
            </p>
          </div>
        </details>

        {hexagrama ? (
          <div className="leitura">
            <div className="hexagrama-visual" aria-hidden="true">
              {[...hexagrama.linhas].reverse().map((linha, i) => {
                const posicaoDeBaixo = 5 - i;
                const ativa = hexagrama.posicaoMutante === posicaoDeBaixo;
                return (
                  <div key={i} className={`linha ${linha ? 'yang' : 'yin'}${ativa ? ' mutante' : ''}`}>
                    {linha ? <span className="barra" /> : (
                      <>
                        <span className="barra" />
                        <span className="barra" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hex-card">
              <div className="hex-card-title">{hexagrama.superior.nome} sobre {hexagrama.inferior.nome}</div>
              <p className="hex-card-texto">{hexagrama.texto}</p>
              <div className="grid2">
                <div className="subcard highlight">
                  <div className="subttl">✅ O que favorece</div>
                  <ul className="list-check">
                    {hexagrama.favorece.map((f, i) => <li key={i}>✓ {f}</li>)}
                  </ul>
                </div>
                <div className="subcard danger">
                  <div className="subttl">⚠️ Cuidado com</div>
                  <ul className="list-check">
                    {hexagrama.cuidado.map((c, i) => <li key={i}>✓ {c}</li>)}
                  </ul>
                </div>
              </div>
              <p className="mutante-nota">{hexagrama.leituraMutante}</p>
            </div>
          </div>
        ) : (
          <div className="carregando">Consultando o hexagrama de hoje…</div>
        )}

        <Link href={ctaHref} className="cta">{ctaLabel}</Link>
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

        .content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 56px 20px 100px; text-align: center; }
        .eyebrow { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--secondary); margin: 0 0 18px; }
        .glyph { font-size: 34px; color: var(--warning); margin-bottom: 14px; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(30px, 5.5vw, 42px); margin: 0 0 16px; text-wrap: balance; }
        .sub { color: var(--muted); font-size: 19px; line-height: 1.7; margin: 0 0 36px; }

        .carregando { color: var(--muted); font-size: 16px; margin-bottom: 36px; }

        .explicacao {
          text-align: left; margin: 0 0 36px; background: rgba(139,92,246,0.06);
          border: 1px solid var(--border); border-radius: 14px; padding: 14px 18px;
        }
        .explicacao summary { cursor: pointer; font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 0.02em; color: var(--secondary); }
        .explicacao-corpo { margin-top: 12px; }
        .explicacao-corpo p { font-size: 15.5px; color: var(--muted); line-height: 1.7; margin: 0 0 12px; }
        .explicacao-corpo p:last-child { margin-bottom: 0; }

        .leitura { margin-bottom: 40px; }
        .hexagrama-visual {
          display: flex; flex-direction: column-reverse; align-items: center; gap: 8px;
          margin: 0 auto 24px; width: 180px;
        }
        .linha { display: flex; gap: 8px; width: 100%; height: 8px; }
        .linha .barra { flex: 1; background: rgba(216,180,254,0.85); border-radius: 3px; }
        .linha.yin .barra:first-child { flex: 0.42; }
        .linha.yin .barra:last-child { flex: 0.42; }
        .linha.mutante .barra { background: var(--warning); box-shadow: 0 0 10px rgba(245,158,11,0.6); }

        .hex-card {
          text-align: left; background: rgba(139,92,246,0.06); border: 1px solid var(--border);
          border-radius: 18px; padding: 22px 20px; margin-bottom: 36px;
        }
        .hex-card-title { font-family: 'Cinzel', serif; font-size: clamp(18px, 4vw, 22px); margin: 0 0 12px; }
        .hex-card-texto { font-size: 16.5px; line-height: 1.75; color: var(--text); margin: 0; }

        .grid2 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 18px; }
        @media (min-width: 560px) { .grid2 { grid-template-columns: 1fr 1fr; } }
        .subcard { border-radius: 14px; padding: 14px 16px; border: 1px solid var(--border); }
        .subcard.highlight { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }
        .subcard.danger { border-color: rgba(236,72,153,0.3); background: rgba(236,72,153,0.05); }
        .subttl { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.04em; margin-bottom: 8px; }
        .list-check { list-style: none; padding: 0; margin: 0; font-size: 14.5px; line-height: 1.7; color: var(--muted); }

        .mutante-nota { font-size: 14.5px; font-style: italic; color: var(--muted); margin: 18px 0 0; }

        .cta {
          display: inline-block; font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 0.06em;
          color: #fff; background: linear-gradient(135deg, var(--primary), #be185d);
          padding: 15px 32px; border-radius: 999px; text-decoration: none;
          box-shadow: 0 12px 34px rgba(236,72,153,0.35);
        }

      `}</style>
    </div>
  );
}
