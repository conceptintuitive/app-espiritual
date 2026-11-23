'use client';

// CtaMapa — o botão final de TODAS as páginas grátis (céu, anjo, Kin,
// astrologia chinesa e compatibilidade BaZi, signos, numerologia,
// compatibilidade, hexagrama, blog, explorar). O texto depende do que já
// aconteceu NESTE aparelho:
//
//   não fez o quiz (sem ic_ultima_analise_id) → "Fazer meu mapa grátis"
//        abre o quiz; com `onFazer`, a página salva antes os dados que a
//        pessoa digitou (lib/ceuDados.js) pro quiz abrir pré-preenchido.
//   fez e não pagou                           → "Ver meu mapa" (/resultado/<id>)
//   pagou (GET /api/status-analise)           → "Abrir meu Manual" (/manual/<id>)
//
// Vocabulário do site (nov/2026): "Mapa" = resultado grátis do quiz;
// "Manual do seu Mapa" / "seu Manual" = produto pago. Botão sem emoji.
//
// Enquanto o status do pagamento carrega, quem já tem análise vê "Ver meu
// mapa" (a prévia manda pro Manual se já estiver pago): nunca promete o
// Manual pra quem não comprou.

import { useEffect, useState } from 'react';

const CHAVE_ANALISE = 'ic_ultima_analise_id';

export const ROTULO_MAPA = {
  'sem-mapa': 'Fazer meu mapa grátis',
  mapa: 'Ver meu mapa',
  manual: 'Abrir meu Manual',
};

/**
 * Estado do mapa neste aparelho. `ativo: false` não lê nada (ex.: Olho no modo Manual).
 * @returns {{ estado: 'sem-mapa'|'mapa'|'manual', id: string|null, href: string, rotulo: string }}
 */
export function useEstadoMapa({ ativo = true } = {}) {
  const [id, setId] = useState(null);
  const [pago, setPago] = useState(false);

  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    let salvo = null;
    try { salvo = window.localStorage.getItem(CHAVE_ANALISE); } catch {}
    if (!salvo) return undefined;
    setId(salvo);
    fetch(`/api/status-analise?id=${encodeURIComponent(salvo)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j?.pago) setPago(true); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [ativo]);

  const estado = !id ? 'sem-mapa' : pago ? 'manual' : 'mapa';
  const href = estado === 'manual' ? `/manual/${id}` : estado === 'mapa' ? `/resultado/${id}` : '/?quiz=1';
  return { estado, id, href, rotulo: ROTULO_MAPA[estado] };
}

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'cta_mapa', ...params }); } catch {}
}

/**
 * @param {{
 *   className?: string, style?: object,
 *   onFazer?: () => void,   // "Fazer meu mapa grátis" com dados da página (salva ic_ceu_dados e vai pra home)
 *   origem?: string,        // página, pro GA4
 * }} props
 */
export default function CtaMapa({ className = '', style, onFazer, origem }) {
  const { estado, href, rotulo } = useEstadoMapa();
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        evento('cta_mapa_click', { estado, origem });
        if (estado === 'sem-mapa' && onFazer) {
          e.preventDefault();
          onFazer();
        }
      }}
    >
      {rotulo}
    </a>
  );
}

/**
 * Bloco de fim de página (índices de signos, números, blog e o /explorar):
 * uma frase curta + o CtaMapa num botão dourado, no padrão da Minha Área.
 */
export function CtaMapaBloco({ origem, texto = 'Signo, número, céu e arquétipo juntos, a partir do seu nascimento.' }) {
  return (
    <div style={{ maxWidth: 560, margin: '8px auto 72px', padding: '0 20px', textAlign: 'center', boxSizing: 'border-box' }}>
      <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.5, color: 'rgba(233,213,255,0.78)' }}>{texto}</p>
      <CtaMapa
        origem={origem}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 52, padding: '0 26px',
          borderRadius: 999, background: '#f2c77b', color: '#1a1020', textDecoration: 'none',
          fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace", fontSize: 12,
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}
      />
    </div>
  );
}
