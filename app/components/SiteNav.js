'use client';

import Link from 'next/link';

// Menu fixo usado nas páginas de conteúdo/exploração (hub, blog, compatibilidade).
// NÃO aparece em / (venda), /resultado/[id] ou /manual/[id] — essas páginas
// ficam focadas só na conversão, sem links concorrendo com o CTA principal.
export default function SiteNav({ active }) {
  const items = [
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

      <style jsx>{`
        .site-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 24px;
          background: rgba(10, 1, 24, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(216, 180, 254, 0.15);
          flex-wrap: wrap;
        }
        .site-nav-brand {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.06em;
          color: #faf5ff;
          text-decoration: none;
          white-space: nowrap;
        }
        .site-nav-links {
          display: flex;
          gap: 22px;
        }
        .site-nav-link {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 600;
          color: rgba(233, 213, 255, 0.72);
          text-decoration: none;
          padding-bottom: 2px;
          border-bottom: 1px solid transparent;
        }
        .site-nav-link.is-active {
          color: #faf5ff;
          border-bottom-color: #ec4899;
        }
        .site-nav-link:hover {
          color: #faf5ff;
        }
      `}</style>
    </nav>
  );
}
