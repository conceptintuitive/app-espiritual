'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Menu do site — aparece em TODAS as páginas (decisão de nov/2026, inclusive
// /, /resultado/[id] e /manual/[id]). `active` = chave do item da página atual
// (destaca o botão); páginas fora da lista passam null. "Minha Área" (/seu-dia)
// substituiu "Meu Mapa" e "Seu Dia" (nov/2026): lá ficam o mapa, o dia e as
// leituras pagas da pessoa logada.
// `sticky={false}` nas páginas com Olho Cósmico (/ceu, /manual/[id]): o palco
// da animação fica fixo na tela e o menu precisa sair de cena rolando.
// O menu carrega a própria fonte (Cinzel) pra ficar igual em qualquer página.
export default function SiteNav({ active = null, sticky = true }) {
  const [ultimaAnaliseId, setUltimaAnaliseId] = useState(null);
  // Celular: barra compacta (marca + Minha Área + ☰); o ☰ abre as ferramentas em grupos.
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setAberto(false); }, [pathname]);
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aberto]);

  useEffect(() => {
    try {
      setUltimaAnaliseId(window.localStorage.getItem('ic_ultima_analise_id'));
    } catch {}
  }, []);

  // Seu Manual: com análise no aparelho vai pra prévia (que manda pro Manual
  // se já pagou); sem análise, pro quiz.
  const manualHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}` : '/';
  const previsaoHref = ultimaAnaliseId ? `/previsao-do-ano/${ultimaAnaliseId}` : '/';
  const humanDesignHref = ultimaAnaliseId ? `/human-design/${ultimaAnaliseId}` : '/';
  const compatCompletaHref = ultimaAnaliseId ? `/compatibilidade-completa/${ultimaAnaliseId}` : '/';

  // "Explorar" é a página-base (hub de tudo) — fica na própria linha, sozinha
  // e bem maior que o resto; os demais links formam uma segunda linha menor
  // logo abaixo.
  const outrosItems = [
    { href: '/seu-dia', label: 'Minha Área', key: 'seu-dia' },
    { href: manualHref, label: 'Seu Manual', key: 'meu-mapa' },
    { href: '/assinar', label: 'Intuitive Completo', key: 'assinar' },
    { href: '/oraculo', label: 'Oráculo', key: 'oraculo' },
    { href: '/hexagrama-do-dia', label: 'Hexagrama do Dia', key: 'hexagrama' },
    { href: '/compatibilidade', label: 'Compatibilidade', key: 'compatibilidade' },
    { href: '/ceu', label: 'Céu do Nascimento', key: 'ceu' },
    { href: '/astrologia-chinesa', label: 'Astrologia Chinesa', key: 'astrologia-chinesa' },
    { href: '/anjo-da-guarda', label: 'Anjo da Guarda', key: 'anjo' },
    { href: '/kin-maia', label: 'Kin Maia', key: 'kin-maia' },
    { href: '/signos', label: 'Signos', key: 'signos' },
    { href: '/numerologia', label: 'Numerologia', key: 'numerologia' },
    { href: previsaoHref, label: 'Previsão do Ano', key: 'previsao' },
    { href: humanDesignHref, label: 'Human Design', key: 'human-design' },
    { href: compatCompletaHref, label: 'Compatibilidade Completa', key: 'compat-completa' },
    { href: '/blog', label: 'Blog', key: 'blog' },
  ];

  const porChave = Object.fromEntries(outrosItems.map((i) => [i.key, i]));
  const grupos = [
    { titulo: 'Você', itens: ['seu-dia', 'meu-mapa', 'assinar', 'oraculo'] },
    { titulo: 'Seus mapas', itens: ['ceu', 'astrologia-chinesa', 'anjo', 'kin-maia', 'previsao', 'human-design'] },
    { titulo: 'Amor', itens: ['compatibilidade', 'compat-completa'] },
    { titulo: 'Todo dia e conteúdo', itens: ['hexagrama', 'signos', 'numerologia', 'blog'] },
  ].map((g) => ({ ...g, itens: g.itens.map((k) => porChave[k]).filter(Boolean) }));

  return (
    <nav className={`site-nav${sticky ? '' : ' site-nav-static'}${aberto ? ' is-aberto' : ''}`}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800;900&display=swap"
        precedence="default"
      />
      <div className="site-nav-top">
        <Link href="/explorar" className="site-nav-brand">✦ Intuitive Concept</Link>
        <Link
          href="/explorar"
          className={`site-nav-explorar${active === 'explorar' ? ' is-active' : ''}`}
        >
          Explorar
        </Link>
        <div className="site-nav-spacer" aria-hidden="true" />
        <div className="site-nav-mobile">
          <Link href="/seu-dia" className={`site-nav-area${active === 'seu-dia' ? ' is-active' : ''}`}>Minha Área</Link>
          <button
            type="button"
            className="site-nav-burger"
            aria-expanded={aberto}
            aria-controls="site-nav-painel"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setAberto((v) => !v)}
          >
            <span aria-hidden="true">{aberto ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {aberto && (
        <div id="site-nav-painel" className="site-nav-painel">
          <Link href="/explorar" className={`site-nav-painel-explorar${active === 'explorar' ? ' is-active' : ''}`}>Explorar tudo ✦</Link>
          {grupos.map((g) => (
            <div key={g.titulo} className="site-nav-grupo">
              <span className="site-nav-grupo-titulo">{g.titulo}</span>
              <div className="site-nav-grupo-itens">
                {g.itens.map((item) => (
                  <Link key={item.key} href={item.href} className={`site-nav-link${active === item.key ? ' is-active' : ''}`} onClick={() => setAberto(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
        .site-nav.site-nav-static { position: relative; }
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
        .site-nav-mobile, .site-nav-painel { display: none; }
        @media (max-width: 640px) {
          /* Celular: barra de uma linha só (antes o menu inteiro ocupava a primeira tela). */
          .site-nav { padding: 10px 14px; }
          .site-nav-top { grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 0; }
          .site-nav-explorar, .site-nav-spacer, .site-nav-links { display: none; }
          .site-nav-brand { font-size: 14px; }
          .site-nav-mobile { display: flex; align-items: center; gap: 8px; }
          .site-nav-area {
            font-family: 'Cinzel', serif; font-size: 12.5px; font-weight: 700; color: #faf5ff; text-decoration: none; white-space: nowrap;
            padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(236, 72, 153, 0.5);
            background: linear-gradient(135deg, rgba(236, 72, 153, 0.28), rgba(139, 92, 246, 0.28));
          }
          .site-nav-burger {
            width: 40px; height: 40px; border-radius: 999px; border: 1px solid rgba(216, 180, 254, 0.3);
            background: rgba(139, 92, 246, 0.12); color: #faf5ff; font-size: 18px; line-height: 1; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .site-nav-painel {
            display: flex; flex-direction: column; gap: 14px; margin-top: 12px; padding-top: 12px;
            border-top: 1px solid rgba(216, 180, 254, 0.18); max-height: calc(100dvh - 80px); overflow-y: auto;
          }
          .site-nav-painel-explorar {
            align-self: stretch; text-align: center; font-family: 'Cinzel', serif; font-size: 16px; font-weight: 800; color: #faf5ff;
            text-decoration: none; padding: 11px; border-radius: 999px; border: 1px solid rgba(236, 72, 153, 0.5);
            background: linear-gradient(135deg, rgba(236, 72, 153, 0.34), rgba(139, 92, 246, 0.34));
          }
          .site-nav-grupo { display: flex; flex-direction: column; gap: 7px; }
          .site-nav-grupo-titulo { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #f5a524; }
          .site-nav-grupo-itens { display: flex; flex-wrap: wrap; gap: 7px; }
          .site-nav-link { font-size: 12.5px; padding: 8px 13px; }
        }
      `}</style>
    </nav>
  );
}
