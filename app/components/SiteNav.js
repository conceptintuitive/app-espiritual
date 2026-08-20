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

  const items = [
    { href: meuMapaHref, label: 'Meu Mapa', key: 'meu-mapa' },
    { href: '/explorar', label: 'Explorar', key: 'explorar' },
    { href: '/compatibilidade', label: 'Compatibilidade', key: 'compatibilidade' },
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
          padding: 20px 24px;
          background: rgba(10, 1, 24, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(216, 180, 254, 0.15);
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
          gap: 28px;
          justify-self: center;
        }
        .site-nav-spacer {
          justify-self: end;
        }
        .site-nav-link {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: rgba(233, 213, 255, 0.72);
          text-decoration: none;
          padding-bottom: 4px;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
        }
        .site-nav-link.is-active {
          color: #faf5ff;
          border-bottom-color: #ec4899;
        }
        .site-nav-link:hover {
          color: #faf5ff;
        }
        @media (max-width: 640px) {
          .site-nav {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 12px;
            padding: 18px 20px;
          }
          .site-nav-brand { justify-self: center; }
          .site-nav-links { gap: 24px; }
          .site-nav-spacer { display: none; }
        }
      `}</style>
    </nav>
  );
}
