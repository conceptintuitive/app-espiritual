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

/**
 * Assinatura como caminho SECUNDÁRIO no paywall de Previsão do Ano, Human
 * Design e Compatibilidade Completa (nov/2026): o botão principal é sempre
 * "Desbloquear com o Manual do seu Mapa" (ou a compra do complemento, pra quem
 * já tem o Manual); a assinatura aparece aqui como link.
 */
export function CtaAssinatura({ analiseId, origem }) {
  const href = `/assinar?${analiseId ? `a=${encodeURIComponent(analiseId)}&` : ''}plano=anual`;
  return (
    <p className="p" style={{ fontSize: 14, margin: '10px 0 0', textAlign: 'center', opacity: 0.9 }}>
      ou{' '}
      <a
        href={href}
        style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}
        onClick={() => { try { window.gtag?.('event', 'assinar_click', { event_category: 'assinatura', origem }); } catch {} }}
      >
        libere tudo com o Intuitive Completo
      </a>
      {' '}— {brl(PRECO_ASSINATURA_MENSAL)}/mês ou {brl(PRECO_ASSINATURA_ANUAL)}/ano (o anual inclui o Manual).
    </p>
  );
}
