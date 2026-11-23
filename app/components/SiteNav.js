'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Menu do site — aparece em TODAS as páginas (decisão de nov/2026, inclusive
// /, /resultado/[id] e /manual/[id]). Redesign de nov/2026 (croqui em
// reference/ux/Main.dc.html e MenuCelular.dc.html, branch reference-ux): uma
// barra fina (~64px) com três portas em vez de 16 botões soltos.
//
//   Desktop (≥ 960px): logo | Descobrir ▾ · Meu Mapa · Seu Dia | Minha Área + "Fazer meu mapa grátis"
//   Celular: logo + Minha Área + ☰; o ☰ abre Descobrir / Meu Mapa / Todo dia,
//            com o botão dourado no topo.
//
// Oráculo, Previsão do Ano, Human Design, Compatibilidade Completa e Intuitive
// Completo NÃO entram no menu de propósito: ficam dentro da Minha Área e do
// Manual (produto pago só depois do "uau" grátis).
//
// Props:
//   active       chave do item da página atual. As ferramentas grátis
//                (DESCOBRIR) acendem "Descobrir"; 'meu-mapa' acende "Meu Mapa";
//                'seu-dia' acende "Minha Área". Outras chaves não acendem nada.
//   sticky       false nas páginas com o palco fixo do Olho Cósmico (/manual).
//   transparente barra por cima do céu (Minha Área e /ceu): sem fundo, em
//                position: absolute — a página começa embaixo dela.
//
// Fonte dos itens: Geist Mono do next/font do layout raiz (--font-geist-mono).
// O <link> da Cinzel continua aqui porque algumas páginas (Kin Maia, animais
// chineses) usam a Cinzel sem carregá-la.

export const DESCOBRIR = [
  { href: '/ceu', label: 'Céu do nascimento', key: 'ceu', destaque: true },
  { href: '/anjo-da-guarda', label: 'Anjo da Guarda', key: 'anjo' },
  { href: '/kin-maia', label: 'Kin Maia', key: 'kin-maia' },
  { href: '/astrologia-chinesa', label: 'Astrologia Chinesa', key: 'astrologia-chinesa' },
  { href: '/signos', label: 'Signos', key: 'signos' },
  { href: '/numerologia', label: 'Numerologia', key: 'numerologia' },
  { href: '/compatibilidade', label: 'Compatibilidade', key: 'compatibilidade' },
  { href: '/hexagrama-do-dia', label: 'Hexagrama do Dia', key: 'hexagrama' },
  { href: '/blog', label: 'Blog', key: 'blog' },
];
const CHAVES_DESCOBRIR = new Set([...DESCOBRIR.map((i) => i.key), 'explorar']);

// "Fazer meu mapa grátis" abre o quiz: em outra página, /?quiz=1; na home,
// um evento que a própria home escuta (mudar só a query não remonta a página).
export const EVENTO_ABRIR_QUIZ = 'ic-abrir-quiz';

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'menu', ...params }); } catch {}
}

export default function SiteNav({ active = null, sticky = true, transparente = false }) {
  const pathname = usePathname();
  const [ultimaAnaliseId, setUltimaAnaliseId] = useState(null);
  const [aberto, setAberto] = useState(false); // painel do celular
  const [descobrir, setDescobrir] = useState(false); // dropdown do desktop
  const refDescobrir = useRef(null);

  useEffect(() => {
    try { setUltimaAnaliseId(window.localStorage.getItem('ic_ultima_analise_id')); } catch {}
  }, []);

  // Fecha tudo ao trocar de página, com Esc e (dropdown) ao clicar fora.
  useEffect(() => { setAberto(false); setDescobrir(false); }, [pathname]);
  useEffect(() => {
    if (!aberto && !descobrir) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setAberto(false); setDescobrir(false); } };
    const onClick = (e) => { if (descobrir && refDescobrir.current && !refDescobrir.current.contains(e.target)) setDescobrir(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [aberto, descobrir]);

  // Meu Mapa = a leitura deste aparelho (a prévia manda pro Manual se já foi pago);
  // sem leitura, a home, que explica o mapa.
  const meuMapaHref = ultimaAnaliseId ? `/resultado/${ultimaAnaliseId}` : '/';
  const meuMapaRotulo = ultimaAnaliseId ? 'Ver meu mapa' : 'Como funciona o mapa';

  function fazerMapa(e) {
    evento('menu_fazer_mapa', { pagina: pathname });
    setAberto(false);
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new Event(EVENTO_ABRIR_QUIZ));
    }
  }

  const ativoDescobrir = CHAVES_DESCOBRIR.has(active);
  const classes = ['site-nav'];
  if (!sticky) classes.push('site-nav-static');
  if (transparente) classes.push('site-nav-transparente');
  if (aberto) classes.push('is-aberto');

  return (
    <nav className={classes.join(' ')} aria-label="Principal">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800;900&display=swap"
        precedence="default"
      />
      <div className="site-nav-barra">
        <Link href="/" className="site-nav-marca">Intuitive Concept</Link>

        <div className="site-nav-portas">
          <div className="site-nav-descobrir" ref={refDescobrir}>
            <button
              type="button"
              className={`site-nav-item${ativoDescobrir ? ' is-active' : ''}`}
              aria-expanded={descobrir}
              aria-controls="site-nav-dropdown"
              onClick={() => setDescobrir((v) => !v)}
            >
              Descobrir <span aria-hidden="true" className="site-nav-seta">▾</span>
            </button>
            {descobrir && (
              <div id="site-nav-dropdown" className="site-nav-dropdown">
                <span className="site-nav-rotulo">Grátis, na hora</span>
                {DESCOBRIR.map((i) => (
                  <Link key={i.key} href={i.href} className={`site-nav-drop-link${active === i.key ? ' is-active' : ''}${i.destaque ? ' is-destaque' : ''}`}
                    onClick={() => { setDescobrir(false); evento('menu_descobrir', { destino: i.key }); }}>
                    {i.label}
                  </Link>
                ))}
                <Link href="/explorar" className="site-nav-drop-tudo" onClick={() => setDescobrir(false)}>Ver tudo ›</Link>
              </div>
            )}
          </div>
          <Link href={meuMapaHref} className={`site-nav-item${active === 'meu-mapa' ? ' is-active' : ''}`}>Meu Mapa</Link>
          <Link href="/seu-dia?aba=hoje" className="site-nav-item">Seu Dia</Link>
        </div>

        <div className="site-nav-acoes">
          <Link href="/seu-dia" className={`site-nav-area${active === 'seu-dia' ? ' is-active' : ''}`}>Minha Área</Link>
          <Link href="/?quiz=1" className="site-nav-cta" onClick={fazerMapa}>Fazer meu mapa grátis</Link>
          <button
            type="button"
            className="site-nav-burger"
            aria-expanded={aberto}
            aria-controls="site-nav-painel"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            )}
          </button>
        </div>
      </div>

      {aberto && (
        <div id="site-nav-painel" className="site-nav-painel">
          <Link href="/?quiz=1" className="site-nav-cta site-nav-cta-largo" onClick={fazerMapa}>Fazer meu mapa grátis</Link>

          <div className="site-nav-grupo">
            <span className="site-nav-rotulo site-nav-rotulo-verde">Descobrir — grátis</span>
            {DESCOBRIR.map((i) => (
              <Link key={i.key} href={i.href} className={`site-nav-painel-link${active === i.key ? ' is-active' : ''}`}
                onClick={() => { setAberto(false); evento('menu_descobrir', { destino: i.key }); }}>
                {i.label}
              </Link>
            ))}
            <Link href="/explorar" className="site-nav-painel-tudo" onClick={() => setAberto(false)}>Ver tudo ›</Link>
          </div>

          <div className="site-nav-grupo">
            <span className="site-nav-rotulo">Meu Mapa</span>
            <Link href={meuMapaHref} className={`site-nav-painel-link${active === 'meu-mapa' ? ' is-active' : ''}`} onClick={() => setAberto(false)}>{meuMapaRotulo}</Link>
          </div>

          <div className="site-nav-grupo">
            <span className="site-nav-rotulo site-nav-rotulo-azul">Todo dia</span>
            <Link href="/seu-dia" className={`site-nav-painel-link${active === 'seu-dia' ? ' is-active' : ''}`} onClick={() => setAberto(false)}>Minha Área · Seu Dia</Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        .site-nav {
          --nav-mono: var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace;
          position: sticky; top: 0; z-index: 40;
          background: rgba(7, 4, 13, 0.9);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(242, 199, 123, 0.16);
          color: #f3e9da; font-family: var(--nav-mono);
        }
        .site-nav.site-nav-static { position: relative; }
        .site-nav.site-nav-transparente {
          position: absolute; left: 0; right: 0; top: 0;
          background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none; border-bottom-color: transparent;
        }
        .site-nav.site-nav-transparente.is-aberto { background: rgba(7, 4, 13, 0.97); }
        .site-nav-barra {
          box-sizing: border-box; height: 64px; max-width: 1280px; margin: 0 auto; padding: 0 40px;
          display: flex; align-items: center; gap: 24px;
        }
        .site-nav-marca {
          font-family: var(--nav-mono); font-size: 12px; font-weight: 400; letter-spacing: 0.3em; text-transform: uppercase;
          color: #f3e9da; text-decoration: none; white-space: nowrap;
        }
        .site-nav-marca:hover { color: #ffdca0; }
        .site-nav-portas { flex-grow: 1; display: flex; justify-content: center; align-items: center; gap: 32px; }
        .site-nav-item {
          position: relative; background: none; border: 0; padding: 8px 0; cursor: pointer;
          font-family: var(--nav-mono); font-size: 11px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase;
          color: #d9cbb8; text-decoration: none; white-space: nowrap;
        }
        .site-nav-item:hover { color: #ffdca0; }
        .site-nav-item.is-active { color: #f2c77b; }
        .site-nav-item.is-active::after { content: ''; position: absolute; left: 0; right: 0; bottom: 2px; border-bottom: 1px solid #f2c77b; }
        .site-nav-seta { font-size: 9px; margin-left: 2px; }
        .site-nav-descobrir { position: relative; }
        .site-nav-dropdown {
          position: absolute; top: calc(100% + 14px); left: 50%; transform: translateX(-50%); min-width: 320px;
          display: flex; flex-direction: column; padding: 14px 18px 12px; border-radius: 16px;
          background: rgba(10, 6, 18, 0.98); border: 1px solid rgba(242, 199, 123, 0.22); box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
        }
        .site-nav-rotulo {
          font-family: var(--nav-mono); font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #f2c77b; padding-bottom: 6px;
        }
        .site-nav-rotulo-verde { color: #8fd1b0; }
        .site-nav-rotulo-azul { color: #a9b6ff; }
        .site-nav-drop-link {
          font-family: var(--font-geist-sans), system-ui, sans-serif; font-size: 15px; font-weight: 300; color: #f3e9da; text-decoration: none;
          padding: 10px 0; border-bottom: 1px solid rgba(242, 199, 123, 0.1);
        }
        .site-nav-drop-link:hover, .site-nav-drop-link.is-active { color: #ffdca0; }
        .site-nav-drop-link.is-destaque { white-space: nowrap; }
        .site-nav-drop-link.is-destaque::after { content: ' · porta principal'; font-family: var(--nav-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #f2c77b; }
        .site-nav-drop-tudo { font-family: var(--nav-mono); font-size: 11px; letter-spacing: 0.1em; color: #b9a9c9; text-decoration: none; padding: 10px 0 2px; }
        .site-nav-drop-tudo:hover { color: #ffdca0; }

        .site-nav-acoes { display: flex; align-items: center; gap: 10px; }
        .site-nav-area, .site-nav-cta {
          display: inline-flex; align-items: center; justify-content: center; min-height: 40px; box-sizing: border-box;
          font-family: var(--nav-mono); font-size: 11px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase;
          text-decoration: none; white-space: nowrap; padding: 0 18px; border-radius: 999px;
        }
        .site-nav-area { color: #f3e9da; border: 1px solid rgba(242, 199, 123, 0.6); }
        .site-nav-area:hover, .site-nav-area.is-active { color: #ffdca0; border-color: #f2c77b; background: rgba(242, 199, 123, 0.08); }
        .site-nav-cta { color: #1a1020; background: #f2c77b; border: 0; }
        .site-nav-cta:hover { color: #1a1020; background: #ffdca0; }
        .site-nav-burger {
          display: none; width: 44px; height: 44px; border-radius: 999px; border: 1px solid rgba(243, 233, 218, 0.28);
          background: rgba(7, 4, 13, 0.35); color: #f3e9da; cursor: pointer; align-items: center; justify-content: center;
        }
        .site-nav-painel { display: none; }
        .site-nav :focus-visible { outline: 2px solid #f2c77b; outline-offset: 3px; }

        @media (max-width: 959px) {
          .site-nav-barra { padding: 0 16px 0 20px; gap: 10px; }
          .site-nav-marca { flex-grow: 1; font-size: 11px; letter-spacing: 0.28em; }
          .site-nav-portas, .site-nav-cta { display: none; }
          .site-nav-area { min-height: 40px; padding: 0 14px; font-size: 10px; letter-spacing: 0.16em; }
          .site-nav-burger { display: inline-flex; }
          .site-nav-painel {
            display: flex; flex-direction: column; gap: 24px; padding: 20px 20px 28px;
            border-top: 1px solid rgba(242, 199, 123, 0.16); max-height: calc(100dvh - 64px); overflow-y: auto; box-sizing: border-box;
          }
          .site-nav-painel .site-nav-cta { display: flex; }
          .site-nav-cta-largo { min-height: 54px; font-size: 12px; letter-spacing: 0.18em; }
          .site-nav-grupo { display: flex; flex-direction: column; }
          .site-nav-painel-link {
            font-family: var(--font-geist-sans), system-ui, sans-serif; font-size: 16px; font-weight: 300; color: #f3e9da; text-decoration: none;
            padding: 12px 0; border-bottom: 1px solid rgba(242, 199, 123, 0.1);
          }
          .site-nav-painel-link.is-active { color: #ffdca0; }
          .site-nav-painel-tudo { font-size: 13px; color: #b9a9c9; text-decoration: none; padding: 12px 0 0; letter-spacing: 0.06em; }
        }
        @media (max-width: 359px) {
          .site-nav-marca { letter-spacing: 0.18em; font-size: 10px; }
        }
      `}</style>
    </nav>
  );
}
