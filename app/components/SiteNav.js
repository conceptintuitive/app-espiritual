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

  // "Explorar" é a página-base (hub de tudo) — fica na própria linha, sozinha
  // e bem maior que o resto; os demais links formam uma segunda linha menor
  // logo abaixo.
  const outrosItems = [
    { href: meuMapaHref, label: 'Meu Mapa', key: 'meu-mapa' },
    { href: '/oraculo', label: 'Oráculo', key: 'oraculo' },
    { href: '/hexagrama-do-dia', label: 'Hexagrama do Dia', key: 'hexagrama' },
    { href: '/compatibilidade', label: 'Compatibilidade', key: 'compatibilidade' },
    { href: previsaoHref, label: 'Previsão do Ano', key: 'previsao' },
    { href: humanDesignHref, label: 'Human Design', key: 'human-design' },
    { href: compatCompletaHref, label: 'Compatibilidade Completa', key: 'compat-completa' },
    { href: '/blog', label: 'Blog', key: 'blog' },
  ];

  return (
    <nav className="site-nav">
      <div className="site-nav-top">
        <Link href="/explorar" className="site-nav-brand">✦ Intuitive Concept</Link>
        <Link
          href="/explorar"
          className={`site-nav-explorar${active === 'explorar' ? ' is-active' : ''}`}
        >
          Explorar
        </Link>
        <div className="site-nav-spacer" aria-hidden="true" />
      </div>

      <div className="site-nav-links">
        {outrosItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`site-nav-link${active === item.key ? ' is-active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <style jsx global>{`
        .site-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          padding: 20px 24px 18px;
          background: rgba(10, 1, 24, 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(216, 180, 254, 0.22);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25);
        }
        .site-nav-top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
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
        .site-nav-spacer {
          justify-self: end;
        }
        .site-nav-explorar {
          justify-self: center;
          font-family: 'Cinzel', serif;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #faf5ff;
          text-decoration: none;
          white-space: nowrap;
          padding: 16px 42px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.34), rgba(139, 92, 246, 0.34));
          border: 1px solid rgba(236, 72, 153, 0.5);
          box-shadow: 0 8px 26px rgba(236, 72, 153, 0.22);
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .site-nav-explorar:hover {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.46), rgba(139, 92, 246, 0.46));
          border-color: rgba(236, 72, 153, 0.65);
          transform: translateY(-1px);
        }
        .site-nav-explorar.is-active {
          box-shadow: 0 10px 32px rgba(236, 72, 153, 0.34);
        }

        .site-nav-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        .site-nav-link {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: rgba(233, 213, 255, 0.8);
          text-decoration: none;
          white-space: nowrap;
          padding: 9px 16px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(216, 180, 254, 0.2);
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        }
        .site-nav-link.is-active {
          color: #faf5ff;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.28), rgba(139, 92, 246, 0.28));
          border-color: rgba(236, 72, 153, 0.5);
        }
        .site-nav-link:hover {
          color: #faf5ff;
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(216, 180, 254, 0.4);
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .site-nav { padding: 16px 16px 14px; }
          .site-nav-top {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 10px;
          }
          .site-nav-brand { justify-self: center; }
          .site-nav-spacer { display: none; }
          .site-nav-explorar { font-size: 24px; padding: 13px 30px; }
          .site-nav-links { gap: 8px; }
          .site-nav-link { font-size: 12.5px; padding: 8px 13px; }
        }
      `}</style>
    </nav>
  );
}
