'use client';

// Peças compartilhadas do Intuitive Completo nas páginas de ferramenta
// (Previsão do Ano, Human Design, Compatibilidade Completa, Manual).

import { useEffect, useState } from 'react';
import { PRECO_ASSINATURA_MENSAL, PRECO_ASSINATURA_ANUAL } from '@/lib/preco';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Acesso do Intuitive Completo pelo e-mail da análise. null enquanto carrega.
 * Com plano anual, o servidor já libera o Manual dessa análise (manualLiberado).
 */
export function useAssinatura(analiseId) {
  const [acesso, setAcesso] = useState(null);
  useEffect(() => {
    if (!analiseId) return undefined;
    let vivo = true;
    fetch('/api/assinatura/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analiseId }),
    })
      .then((r) => r.json())
      .then((j) => { if (vivo) setAcesso(j || { ativa: false }); })
      .catch(() => { if (vivo) setAcesso({ ativa: false }); });
    return () => { vivo = false; };
  }, [analiseId]);
  return acesso;
}

const linkCurto = { color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 };
const urlAssinar = (analiseId, plano) => `/assinar?${analiseId ? `a=${encodeURIComponent(analiseId)}&` : ''}plano=${plano}`;
const cliqueAssinar = (origem, plano) => () => {
  try { window.gtag?.('event', 'assinar_click', { event_category: 'assinatura', origem, plano }); } catch {}
};

/**
 * Assinatura como caminho SECUNDÁRIO embaixo do botão do Manual (quem ainda
 * não tem o Manual): link pro /assinar + "compare as opções" (/planos).
 */
export function CtaAssinatura({ analiseId, origem }) {
  return (
    <p className="p" style={{ fontSize: 14, margin: '10px 0 0', textAlign: 'center', opacity: 0.9 }}>
      ou{' '}
      <a href={urlAssinar(analiseId, 'mensal')} style={linkCurto} onClick={cliqueAssinar(origem, 'mensal')}>
        assine o Intuitive Completo
      </a>
      {' '}por {brl(PRECO_ASSINATURA_MENSAL)}/mês ·{' '}
      <a href="/planos" style={linkCurto} onClick={cliqueAssinar(origem, 'planos')}>compare as opções</a>
    </p>
  );
}

/**
 * Paywall de Previsão do Ano e Human Design (nov/2026, sem venda avulsa):
 *   sem o Manual  → "Desbloquear com o Manual do seu Mapa" (vem com 30 dias
 *                   do Intuitive Completo) + a assinatura como link;
 *   com o Manual  → a cortesia de 30 dias já acabou (senão a página estaria
 *                   aberta): "Continuar com o Intuitive Completo".
 * Usa as classes das páginas antigas (.p, .btn .btn-cta).
 * @param {{ analiseId: string, manualPago: boolean, produto: string, origem: string }} props
 */
export function OfertaComplemento({ analiseId, manualPago, produto, origem }) {
  if (!manualPago) {
    return (
      <>
        <p className="p" style={{ fontSize: 14 }}>
          {produto} vem nos 30 dias do Intuitive Completo que acompanham o <strong>Manual do seu Mapa</strong>.
        </p>
        <a href={`/resultado/${analiseId}#comprar`} className="btn btn-cta" onClick={cliqueAssinar(origem, 'manual')}>
          Desbloquear com o Manual do seu Mapa
        </a>
        <CtaAssinatura analiseId={analiseId} origem={origem} />
      </>
    );
  }
  return (
    <>
      <p className="p" style={{ fontSize: 14 }}>
        {produto} faz parte do <strong>Intuitive Completo</strong>. Os 30 dias que vieram com o seu Manual terminaram; o seu Manual continua seu pra sempre.
      </p>
      <a href={urlAssinar(analiseId, 'mensal')} className="btn btn-cta" onClick={cliqueAssinar(origem, 'mensal')}>
        Continuar com o Intuitive Completo · {brl(PRECO_ASSINATURA_MENSAL)}/mês
      </a>
      <p className="p" style={{ fontSize: 14, margin: '10px 0 0', textAlign: 'center', opacity: 0.9 }}>
        ou{' '}
        <a href={urlAssinar(analiseId, 'anual')} style={linkCurto} onClick={cliqueAssinar(origem, 'anual')}>
          {brl(PRECO_ASSINATURA_ANUAL)}/ano
        </a>
        {' '}({brl(PRECO_ASSINATURA_ANUAL / 12)}/mês) ·{' '}
        <a href="/planos" style={linkCurto} onClick={cliqueAssinar(origem, 'planos')}>compare as opções</a>
      </p>
    </>
  );
}
