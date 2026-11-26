'use client';

// Botão dos guias de produto (/human-design, /previsao-do-ano,
// /compatibilidade-completa). Lê só o que já aconteceu NESTE aparelho (mesma
// chave do CtaMapa):
//   tem análise (ic_ultima_analise_id) → rotulo → `${base}/<id>` (o resultado
//                                        da pessoa, com a prévia grátis)
//   não tem                            → "Fazer meu mapa grátis" → quiz; os
//                                        complementos saem do mesmo mapa
// Antes de ler o aparelho, mostra o caminho de quem não tem mapa (nunca
// promete um resultado que não existe). GA4: guia_cta (produto, estado, origem).

import { useEffect, useState } from 'react';

const CHAVE_ANALISE = 'ic_ultima_analise_id';

function useTemMapa() {
  const [id, setId] = useState(null);
  useEffect(() => {
    try { setId(window.localStorage.getItem(CHAVE_ANALISE)); } catch {}
  }, []);
  return id;
}

/**
 * @param {{ base: string, rotulo: string, produto: string, origem?: string, className?: string }} props
 */
export default function BotaoMeuResultado({ base, rotulo, produto, origem, className = '' }) {
  const id = useTemMapa();
  return (
    <a
      href={id ? `${base}/${id}` : '/?quiz=1'}
      className={className}
      onClick={() => {
        try { window.gtag?.('event', 'guia_cta', { produto, estado: id ? 'com-mapa' : 'sem-mapa', origem }); } catch {}
      }}
    >
      {id ? rotulo : 'Fazer meu mapa grátis'}
    </a>
  );
}

/** Linha de apoio embaixo do botão, pelo mesmo estado. */
export function LinhaMeuResultado({ comMapa, semMapa, className = '' }) {
  const id = useTemMapa();
  return <p className={className}>{id ? comMapa : semMapa}</p>;
}
