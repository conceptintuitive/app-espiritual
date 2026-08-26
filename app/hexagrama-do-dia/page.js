'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { hexagramaDoDia } from '@/lib/iching';

export default function HexagramaDoDiaPage() {
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
          Uma leitura do I Ching pro dia de hoje — a mesma pra quem visitar até a meia-noite,
          construída a partir de dois trigramas: o que se expressa por cima e o que sustenta por baixo.
        </p>

        <details className="explicacao">
          <summary>O que é isso e como funciona?</summary>
          <div className="explicacao-corpo">
            <p>
              O I Ching é um sistema chinês milenar de leitura simbólica. Ele parte de 8 padrões
              básicos, os trigramas, cada um formado por 3 linhas cheias (yang) ou partidas (yin),
              associadas a uma força da natureza: Céu, Terra, Fogo, Água, Trovão, Vento, Montanha e Lago.
            </p>
            <p>
              Dois trigramas empilhados, um por cima e outro por baixo, formam um hexagrama de 6 linhas:
              a leitura do dia. O de cima mostra o que se expressa, o movimento visível. O de baixo mostra
              a base, o que sustenta essa expressão por dentro.
            </p>
            <p>
              Quando uma linha aparece destacada em laranja, é uma "linha em movimento": um ponto
              específico dessa configuração que já está em transição, mesmo que o resto pareça estável.
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

            <h2 className="titulo-hexagrama">{hexagrama.superior.nome} sobre {hexagrama.inferior.nome}</h2>

            <div className="trigramas">
              <div className="trigrama-card">
                <span className="trigrama-label">De cima · o que se expressa</span>
                <strong>{hexagrama.superior.nome}</strong>
                <p>{hexagrama.superior.chave}</p>
              </div>
              <div className="trigrama-card">
                <span className="trigrama-label">De baixo · o que sustenta</span>
                <strong>{hexagrama.inferior.nome}</strong>
                <p>{hexagrama.inferior.chave}</p>
              </div>
            </div>

            <div className="analise">
              <p>
                <strong>{hexagrama.superior.nome}</strong> rege o que se expressa hoje, por cima:{' '}
                {hexagrama.superior.essencia}
              </p>
              <p>
                <strong>{hexagrama.inferior.nome}</strong> sustenta por baixo: {hexagrama.inferior.essencia}
              </p>
              <p className="significado">{hexagrama.significado}</p>
              <p className="mutante-nota">{hexagrama.leituraMutante}</p>
            </div>

            <div className="convites">
              <p className="convites-titulo">Pra hoje, a leitura favorece:</p>
              <ul>
                <li>{hexagrama.superior.convite}</li>
                <li>{hexagrama.inferior.convite}</li>
              </ul>
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

        .titulo-hexagrama { font-family: 'Cinzel', serif; font-size: clamp(20px, 4vw, 26px); margin: 0 0 24px; }

        .trigramas { display: flex; gap: 14px; margin-bottom: 24px; }
        .trigrama-card {
          flex: 1; background: rgba(139,92,246,0.08); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px; text-align: left;
        }
        .trigrama-label { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--secondary); }
        .trigrama-card strong { display: block; font-family: 'Cinzel', serif; font-size: 17px; margin: 4px 0 6px; }
        .trigrama-card p { margin: 0; font-size: 14.5px; color: var(--muted); line-height: 1.5; }

        .analise { text-align: left; margin-bottom: 24px; }
        .analise p { font-size: 17px; line-height: 1.75; margin: 0 0 14px; }
        .analise strong { font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; }
        .analise p.significado { font-size: 18px; font-style: italic; }
        .analise p.mutante-nota { font-size: 15px; font-style: italic; color: var(--muted); margin: 0; }

        .convites {
          text-align: left; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2);
          border-radius: 14px; padding: 18px 20px; margin-bottom: 36px;
        }
        .convites-titulo { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--warning); margin: 0 0 10px; }
        .convites ul { margin: 0; padding-left: 20px; }
        .convites li { font-size: 16px; line-height: 1.6; color: var(--text); margin-bottom: 8px; }
        .convites li:last-child { margin-bottom: 0; }

        .cta {
          display: inline-block; font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 0.06em;
          color: #fff; background: linear-gradient(135deg, var(--primary), #be185d);
          padding: 15px 32px; border-radius: 999px; text-decoration: none;
          box-shadow: 0 12px 34px rgba(236,72,153,0.35);
        }

        @media (max-width: 480px) {
          .trigramas { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
