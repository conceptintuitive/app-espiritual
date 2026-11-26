'use client';

// Botões dos cartões do /planos. Lê só o que já aconteceu NESTE aparelho
// (ic_ultima_analise_id, a mesma chave do CtaMapa):
//   gratis   → com mapa: "Ver meu Mapa" (/resultado/<id>); sem: quiz
//   manual   → com mapa: "Ver o meu Manual" (/resultado/<id>#comprar);
//              sem: "Começar pelo Mapa grátis" (o Manual é escrito a partir dele)
//   completo → /assinar?plano=mensal|anual (&a=<id> com mapa: o anual libera
//              o Manual dessa análise)
// Antes de ler o aparelho, mostra o caminho de quem não tem mapa.
// GA4: planos_clique (plano, estado, botao).

import { useEffect, useState } from 'react';

const CHAVE_ANALISE = 'ic_ultima_analise_id';

function useAnalise() {
  const [id, setId] = useState(null);
  useEffect(() => {
    try { setId(window.localStorage.getItem(CHAVE_ANALISE)); } catch {}
  }, []);
  return id;
}

function destino(plano, id, botao) {
  if (plano === 'gratis') return id
    ? { href: `/resultado/${id}`, rotulo: 'Ver meu Mapa' }
    : { href: '/?quiz=1', rotulo: 'Fazer meu mapa grátis' };
  if (plano === 'manual') return id
    ? { href: `/resultado/${id}#comprar`, rotulo: 'Ver o meu Manual' }
    : { href: '/?quiz=1', rotulo: 'Começar pelo Mapa grátis' };
  const tipo = botao === 'anual' ? 'anual' : 'mensal';
  return {
    href: `/assinar?${id ? `a=${encodeURIComponent(id)}&` : ''}plano=${tipo}`,
    rotulo: tipo === 'anual' ? 'Ver o plano anual' : 'Assinar o Intuitive Completo',
  };
}

/** @param {{ plano: 'gratis'|'manual'|'completo', botao?: 'principal'|'anual', className?: string }} props */
export default function BotaoPlano({ plano, botao = 'principal', className = '' }) {
  const id = useAnalise();
  const { href, rotulo } = destino(plano, id, botao);
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        try { window.gtag?.('event', 'planos_clique', { plano, botao, estado: id ? 'com-mapa' : 'sem-mapa' }); } catch {}
      }}
    >
      {rotulo}
    </a>
  );
}

/** Linha embaixo do botão do Manual pra quem ainda não tem mapa. */
export function NotaManual({ className = '' }) {
  const id = useAnalise();
  if (id) return null;
  return <p className={className}>O Manual é escrito a partir do seu Mapa, então ele vem primeiro.</p>;
}
