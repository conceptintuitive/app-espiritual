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

/** Bloco de oferta pra pôr dentro do paywall de cada ferramenta. */
export function CtaAssinatura({ analiseId, origem }) {
  const href = `/assinar?${analiseId ? `a=${encodeURIComponent(analiseId)}&` : ''}plano=anual`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '6px 0 4px' }}>
      <a
        href={href}
        className="btn btn-cta"
        onClick={() => { try { window.gtag?.('event', 'assinar_click', { event_category: 'assinatura', origem }); } catch {} }}
      >
        ✦ Liberar tudo com o Intuitive Completo
      </a>
      <p className="p" style={{ fontSize: 14, margin: 0, opacity: 0.85, textAlign: 'center' }}>
        {brl(PRECO_ASSINATURA_MENSAL)}/mês ou {brl(PRECO_ASSINATURA_ANUAL)}/ano (o anual inclui o Manual). Seu Dia, Previsão do Ano, Human Design, Compatibilidade e Oráculo ilimitado.
      </p>
    </div>
  );
}
