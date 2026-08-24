'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';

export default function ExplorarPage() {
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

  const meuMapaHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}` : '/';
  const meuMapaCta = ultimaAnaliseId ? 'Ver meu resultado →' : 'Descobrir meu mapa →';
  const meuMapaDesc = ultimaAnaliseId
    ? 'Sua análise personalizada, com tudo que já revelamos sobre seu Sol, Lua, Ascendente e os pontos que mais importam agora.'
    : 'Numerologia e astrologia personalizadas a partir da sua data de nascimento — sua análise gratuita em poucos minutos.';
  const meuMapaTag = ultimaAnaliseId ? 'Já está pronto' : 'Comece por aqui';

  // Previsão do Ano e Human Design são bônus avulsos (R$29,90 cada), cada um
  // com sua própria página de prévia + desbloqueio. Se já existe uma análise,
  // manda direto pra lá; senão, começa pelo formulário, igual o Meu Mapa.
  const previsaoHref = ultimaAnaliseId ? `/previsao-do-ano/${ultimaAnaliseId}` : '/';
  const humanDesignHref = ultimaAnaliseId ? `/human-design/${ultimaAnaliseId}` : '/';
  const compatCompletaHref = ultimaAnaliseId ? `/compatibilidade-completa/${ultimaAnaliseId}` : '/';

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />
      <SiteNav active="explorar" />

      <div className="wordmark">
        <span className="glyph">✦</span>
        <span className="name">Intuitive Concept</span>
      </div>
      <p className="tagline">Escolha por onde quer começar hoje.</p>

      <div className="grid">
        <Link href={meuMapaHref} className="card primary">
          <div className="icon-badge">🔮</div>
          <span className="tag">{meuMapaTag}</span>
          <h3>Meu Mapa</h3>
          <p>{meuMapaDesc}</p>
          <span className="cta">{meuMapaCta}</span>
        </Link>

        <Link href="/oraculo" className="card quaternary">
          <div className="icon-badge">✦</div>
          <span className="tag">Grátis · 3 perguntas</span>
          <h3>Oráculo</h3>
          <p>Pergunta qualquer coisa sobre o seu mapa — ele já conhece seu Sol, Lua e seus números, e responde na hora.</p>
          <span className="cta">Perguntar agora →</span>
        </Link>

        <Link href="/compatibilidade" className="card secondary">
          <div className="icon-badge">♡</div>
          <span className="tag">Grátis · sem cadastro</span>
          <h3>Compatibilidade Astral</h3>
          <p>Escolhe dois signos e veja como eles se encontram no amor, na comunicação e no dia a dia.</p>
          <span className="cta">Testar compatibilidade →</span>
        </Link>

        <Link href={previsaoHref} className="card quinary">
          <div className="icon-badge">🔮</div>
          <span className="tag">A partir de R$ 29,90</span>
          <h3>Previsão do Ano</h3>
          <p>Os próximos 12 meses, um a um, com o que cada ciclo favorece e o que pede cuidado — a partir da sua data de nascimento.</p>
          <span className="cta">Ver minha previsão →</span>
        </Link>

        <Link href={humanDesignHref} className="card senary">
          <div className="icon-badge">🧬</div>
          <span className="tag">A partir de R$ 29,90</span>
          <h3>Human Design</h3>
          <p>Seu Tipo, sua Autoridade e seu Perfil — como sua energia funciona de verdade, a partir da data, hora e local de nascimento.</p>
          <span className="cta">Descobrir meu Human Design →</span>
        </Link>

        <Link href={compatCompletaHref} className="card septenary">
          <div className="icon-badge">💞</div>
          <span className="tag">R$ 29,90</span>
          <h3>Compatibilidade Completa</h3>
          <p>Seu mapa de verdade com o de outra pessoa — Sol, Lua, Vênus e Marte dos dois, ponto a ponto.</p>
          <span className="cta">Comparar mapas →</span>
        </Link>

        <Link href="/blog" className="card tertiary">
          <div className="icon-badge">✎</div>
          <span className="tag">Toda semana</span>
          <h3>Blog</h3>
          <p>Trânsitos, luas e numerologia do mês — conteúdo novo pra quem quer ir além do próprio mapa.</p>
          <span className="cta">Ler os posts →</span>
        </Link>
      </div>

      <style jsx global>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
        }
        .wrap {
          min-height: 100vh;
          background: var(--bg1);
          color: var(--text);
          font-family: 'Cormorant Garamond', Georgia, serif;
          position: relative;
        }
        .stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; animation: twinkle 3.4s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.9; } }

        .wordmark { text-align: center; padding: 56px 20px 8px; position: relative; z-index: 1; }
        .glyph { font-size: 30px; color: var(--warning); display: block; margin-bottom: 10px; }
        .name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; letter-spacing: 0.34em; text-transform: uppercase; }
        .tagline { text-align: center; font-size: 20px; color: var(--muted); max-width: 480px; margin: 14px auto 44px; line-height: 1.6; position: relative; z-index: 1; padding: 0 20px; }

        .grid {
          position: relative; z-index: 1;
          max-width: 980px; margin: 0 auto; padding: 0 20px 80px;
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1180px) { .grid { grid-template-columns: repeat(3, 1fr); } }

        .card {
          position: relative; border-radius: 22px; border: 1px solid var(--border);
          padding: 30px 24px 26px; display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
          overflow: hidden; isolation: isolate; text-decoration: none; color: var(--text);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
        .card::before { content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0.85; }
        .card.primary::before { background: radial-gradient(circle at 20% 0%, rgba(236,72,153,0.24), rgba(19,8,40,0.95) 70%); }
        .card.secondary::before { background: radial-gradient(circle at 20% 0%, rgba(139,92,246,0.24), rgba(19,8,40,0.95) 70%); }
        .card.tertiary::before { background: radial-gradient(circle at 20% 0%, rgba(245,158,11,0.18), rgba(19,8,40,0.95) 70%); }
        .card.quaternary::before { background: radial-gradient(circle at 20% 0%, rgba(236,72,153,0.16), rgba(139,92,246,0.16), rgba(19,8,40,0.95) 70%); }
        .card.quinary::before { background: radial-gradient(circle at 20% 0%, rgba(139,92,246,0.22), rgba(19,8,40,0.95) 70%); }
        .card.senary::before { background: radial-gradient(circle at 20% 0%, rgba(16,185,129,0.18), rgba(19,8,40,0.95) 70%); }
        .card.septenary::before { background: radial-gradient(circle at 20% 0%, rgba(236,72,153,0.2), rgba(139,92,246,0.12), rgba(19,8,40,0.95) 70%); }

        .icon-badge { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-strong); }
        .tag { font-family: 'Cinzel', serif; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--warning); }
        .card h3 { font-family: 'Cinzel', serif; font-size: 19px; font-weight: 700; margin: 0; line-height: 1.3; }
        .card p { font-size: 15px; line-height: 1.55; color: var(--muted); margin: 0; flex: 1; }
        .cta { margin-top: 4px; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.06em; display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 999px; border: 1px solid var(--border-strong); }
        .card.primary .cta { background: linear-gradient(135deg, var(--primary), #be185d); border-color: transparent; }
      `}</style>
    </div>
  );
}
