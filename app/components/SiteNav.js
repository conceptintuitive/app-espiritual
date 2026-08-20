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
  // Chat vive dentro de /resultado ou /manual (precisa do contexto do mapa da pessoa) —
  // aqui só levamos pra lá com ?chat=1, que faz o widget já abrir sozinho.
  const chatHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}?chat=1` : '/';

  const items = [
    { href: meuMapaHref, label: 'Meu Mapa', key: 'meu-mapa' },
    { href: chatHref, label: 'Chat', key: 'chat' },
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
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: rgba(233, 213, 255, 0.8);
          text-decoration: none;
          white-space: nowrap;
          padding: 9px 20px;
          border-radius: 999px;
          border: 1px solid transparent;
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .site-nav-link.is-active {
          color: #faf5ff;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(139, 92, 246, 0.22));
          border-color: rgba(236, 72, 153, 0.45);
        }
        .site-nav-link:hover {
          color: #faf5ff;
          background: rgba(139, 92, 246, 0.12);
        }
        @media (max-width: 640px) {
          .site-nav {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 12px;
            padding: 18px 20px;
          }
          .site-nav-brand { justify-self: center; }
          .site-nav-links { gap: 8px; }
          .site-nav-link { font-size: 16px; padding: 8px 16px; }
          .site-nav-spacer { display: none; }
        }
      `}</style>
    </nav>
  );
}
