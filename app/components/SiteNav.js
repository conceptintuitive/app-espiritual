'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Menu fixo usado nas páginas de conteúdo/exploração (hub, blog, compatibilidade).
// NÃO aparece em / (venda), /resultado/[id] ou /manual/[id] — essas páginas
// ficam focadas só na conversão, sem links concorrendo com o CTA principal.
export default function SiteNav({ active }) {
  const [ultimaAnaliseId, setUltimaAnaliseId] = useState(null);

  useEffect(() => {
    try {
      setUltimaAnaliseId(window.localStorage.getItem('ic_ultima_analise_id'));
    } catch {}
  }, []);

  const meuMapaHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}` : '/';
  const previsaoHref = ultimaAnaliseId ? `/previsao-do-ano/${ultimaAnaliseId}` : '/';
  const humanDesignHref = ultimaAnaliseId ? `/human-design/${ultimaAnaliseId}` : '/';
  const compatCompletaHref = ultimaAnaliseId ? `/compatibilidade-completa/${ultimaAnaliseId}` : '/';

  // "Explorar" é a página-base (hub de tudo) — fica sozinha no centro do
  // menu, maior e mais destacada que o resto; os outros itens se dividem
  // dos dois lados dela.
  const itemsAntes = [
    { href: meuMapaHref, label: 'Meu Mapa', key: 'meu-mapa' },
    { href: '/oraculo', label: 'Oráculo', key: 'oraculo' },
    { href: '/hexagrama-do-dia', label: 'Hexagrama do Dia', key: 'hexagrama' },
    { href: '/compatibilidade', label: 'Compatibilidade', key: 'compatibilidade' },
    { href: previsaoHref, label: 'Previsão do Ano', key: 'previsao' },
  ];
  const itemsDepois = [
    { href: humanDesignHref, label: 'Human Design', key: 'human-design' },
    { href: compatCompletaHref, label: 'Compatibilidade Completa', key: 'compat-completa' },
    { href: '/blog', label: 'Blog', key: 'blog' },
  ];

  return (
    <nav className="site-nav">
      <Link href="/explorar" className="site-nav-brand">✦ Intuitive Concept</Link>
      <div className="site-nav-links">
        {itemsAntes.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`site-nav-link${active === item.key ? ' is-active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/explorar"
          className={`site-nav-link site-nav-link--principal${active === 'explorar' ? ' is-active' : ''}`}
        >
          Explorar
        </Link>
        {itemsDepois.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`site-nav-link${active === item.key ? ' is-active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="site-nav-spacer" aria-hidden="true" />

      <style jsx>{`
        .site-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          padding: 22px 24px;
          background: rgba(10, 1, 24, 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(216, 180, 254, 0.22);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25);
        }
        .site-nav-brand {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.06em;
          color: #faf5ff;
          text-decoration: none;
          white-space: nowrap;
          justify-self: start;
        }
        .site-nav-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 14px;
          justify-self: center;
        }
        .site-nav-spacer {
          justify-self: end;
        }
        .site-nav-link {
          font-family: 'Cinzel', serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: rgba(233, 213, 255, 0.88);
          text-decoration: none;
          white-space: nowrap;
          padding: 13px 28px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.16);
          border: 1px solid rgba(216, 180, 254, 0.3);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .site-nav-link.is-active {
          color: #faf5ff;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.3));
          border-color: rgba(236, 72, 153, 0.55);
          box-shadow: 0 6px 20px rgba(236, 72, 153, 0.22);
        }
        .site-nav-link:hover {
          color: #faf5ff;
          background: rgba(139, 92, 246, 0.26);
          border-color: rgba(216, 180, 254, 0.45);
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
        }
        .site-nav-link--principal {
          font-size: 30px;
          padding: 16px 38px;
          color: #faf5ff;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.32), rgba(139, 92, 246, 0.32));
          border-color: rgba(236, 72, 153, 0.5);
          box-shadow: 0 6px 22px rgba(236, 72, 153, 0.2);
        }
        .site-nav-link--principal:hover {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.44), rgba(139, 92, 246, 0.44));
          border-color: rgba(236, 72, 153, 0.65);
        }
        .site-nav-link--principal.is-active {
          box-shadow: 0 8px 26px rgba(236, 72, 153, 0.32);
        }
        @media (max-width: 640px) {
          .site-nav {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 12px;
            padding: 18px 20px;
          }
          .site-nav-brand { justify-self: center; }
          .site-nav-links { gap: 10px; }
          .site-nav-link { font-size: 18px; padding: 12px 24px; }
          .site-nav-link--principal { font-size: 22px; padding: 14px 28px; }
          .site-nav-spacer { display: none; }
        }
      `}</style>
    </nav>
  );
}
