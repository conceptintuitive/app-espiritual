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

  const items = [
    { href: meuMapaHref, label: 'Meu Mapa', key: 'meu-mapa' },
    { href: '/oraculo', label: 'Oráculo', key: 'oraculo' },
    { href: '/explorar', label: 'Explorar', key: 'explorar' },
    { href: '/compatibilidade', label: 'Compatibilidade', key: 'compatibilidade' },
    { href: previsaoHref, label: 'Previsão do Ano', key: 'previsao' },
    { href: humanDesignHref, label: 'Human Design', key: 'human-design' },
    { href: '/blog', label: 'Blog', key: 'blog' },
  ];

  return (
    <nav className="site-nav">
      <Link href="/explorar" className="site-nav-brand">✦ Intuitive Concept</Link>
      <div className="site-nav-links">
        {items.map((item) => (
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
          gap: 10px;
          justify-self: center;
        }
        .site-nav-spacer {
          justify-self: end;
        }
        .site-nav-link {
          font-family: 'Cinzel', serif;
          font-size: 21px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: rgba(233, 213, 255, 0.88);
          text-decoration: none;
          white-space: nowrap;
          padding: 12px 26px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(216, 180, 254, 0.18);
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
          background: rgba(139, 92, 246, 0.18);
          border-color: rgba(216, 180, 254, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
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
          .site-nav-link { font-size: 17px; padding: 10px 20px; }
          .site-nav-spacer { display: none; }
        }
      `}</style>
    </nav>
  );
}
