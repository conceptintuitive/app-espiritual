'use client';

// Botão "Descobrir meu Human Design" do guia /human-design. Lê só o que já
// aconteceu neste aparelho (mesma chave do CtaMapa):
//   tem análise (ic_ultima_analise_id) → "Descobrir meu Human Design" → /human-design/<id>
//                                        (o Tipo é grátis; o resto, com o Manual)
//   não tem                            → "Fazer meu mapa grátis" → quiz; o HD sai do mesmo mapa
// Antes de ler o aparelho, mostra o caminho de quem não tem mapa (nunca
// promete um resultado que não existe).

import { useEffect, useState } from 'react';

const CHAVE_ANALISE = 'ic_ultima_analise_id';

export default function BotaoMeuHD({ className = '', origem = 'human-design' }) {
  const [id, setId] = useState(null);

  useEffect(() => {
    try { setId(window.localStorage.getItem(CHAVE_ANALISE)); } catch {}
  }, []);

  const href = id ? `/human-design/${id}` : '/?quiz=1';
  const rotulo = id ? 'Descobrir meu Human Design' : 'Fazer meu mapa grátis';

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        try { window.gtag?.('event', 'hd_guia_cta', { estado: id ? 'com-mapa' : 'sem-mapa', origem }); } catch {}
      }}
    >
      {rotulo}
    </a>
  );
}

/** Linha de apoio embaixo do botão, pelo mesmo estado. */
export function LinhaMeuHD({ className = '' }) {
  const [temMapa, setTemMapa] = useState(false);
  useEffect(() => {
    try { setTemMapa(!!window.localStorage.getItem(CHAVE_ANALISE)); } catch {}
  }, []);
  return (
    <p className={className}>
      {temMapa
        ? 'Calculado com a data, hora e local do seu mapa. Seu Tipo aparece na hora, grátis.'
        : 'O Human Design sai do mesmo mapa: data, hora e local de nascimento. Seu Tipo aparece grátis.'}
    </p>
  );
}
