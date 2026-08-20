'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';

const EXEMPLOS = [
  'Por que eu travo tanto no amor?',
  'Qual é o meu maior bloqueio agora?',
  'Que tipo de pessoa combina comigo?',
  'O que o meu Ano Pessoal está pedindo de mim?',
];

export default function OraculoPage() {
  const [ultimaAnaliseId, setUltimaAnaliseId] = useState(null);

  useEffect(() => {
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

  const ctaHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}?chat=1` : '/';
  const ctaLabel = ultimaAnaliseId ? 'Perguntar ao Oráculo →' : 'Descobrir meu mapa primeiro →';

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />
      <SiteNav active="oraculo" />

      <div className="content">
        <p className="eyebrow">Grátis · 3 perguntas</p>
        <div className="glyph">✦</div>
        <h1>O Oráculo</h1>
        <p className="sub">
          Um espelho que já conhece o seu mapa. Pergunta qualquer coisa sobre o seu Sol,
          Lua, Ascendente ou seus números — e ele responde olhando pros seus dados
          reais, não pra um horóscopo genérico.
        </p>

        <div className="exemplos">
          {EXEMPLOS.map((e) => (
            <span key={e} className="exemplo-chip">"{e}"</span>
          ))}
        </div>

        <div className="como-funciona">
          <div className="passo">
            <span className="passo-num">1</span>
            <div>
              <h3>3 perguntas grátis</h3>
              <p>Assim que seu mapa gratuito estiver pronto, o Oráculo já responde — sem custo, sem cadastro extra.</p>
            </div>
          </div>
          <div className="passo">
            <span className="passo-num">2</span>
            <div>
              <h3>Livre pra quem já tem o manual</h3>
              <p>Depois que você desbloqueia o manual completo, as perguntas ficam livres (com um teto diário só pra evitar abuso).</p>
            </div>
          </div>
          <div className="passo">
            <span className="passo-num">3</span>
            <div>
              <h3>Sempre no contexto do seu mapa</h3>
              <p>Ele sabe seu signo, sua lua, seus números — a resposta é sempre conectada ao que já foi revelado sobre você.</p>
            </div>
          </div>
        </div>

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
        .sub { color: var(--muted); font-size: 19px; line-height: 1.7; margin: 0 0 32px; }

        .exemplos { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 44px; }
        .exemplo-chip {
          font-size: 14.5px; font-style: italic; color: rgba(216,180,254,0.9);
          background: rgba(139,92,246,0.08); border: 1px solid var(--border);
          border-radius: 999px; padding: 8px 16px;
        }

        .como-funciona { display: flex; flex-direction: column; gap: 22px; text-align: left; margin-bottom: 44px; }
        .passo { display: flex; gap: 16px; align-items: flex-start; }
        .passo-num {
          flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: #fff;
        }
        .passo h3 { font-family: 'Cinzel', serif; font-size: 17px; font-weight: 700; margin: 0 0 4px; }
        .passo p { font-size: 15.5px; color: var(--muted); line-height: 1.6; margin: 0; }

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
