'use client';

import { useEffect, useRef, useState } from 'react';
import { urlDoCard, LINK_QUIZ, linkStoryTipo } from '@/lib/cardCompartilhar';

// Texto do share e nome do arquivo baixado variam por tipo de card — o resto
// do componente (gerar PNG, share nativo vs download) é o mesmo pros 3.
const CONFIG_POR_TIPO = {
  numero: {
    arquivo: (numero) => (numero ? `meu-numero-${numero}.png` : 'meu-numero.png'),
    texto: () => `Descobri meu número de vida ✨ Descubra o seu: ${LINK_QUIZ}`,
  },
  ponto_cego: {
    arquivo: () => 'meu-ponto-cego.png',
    texto: () => `Descobri meu ponto cego ✨ Descubra o seu: ${linkStoryTipo('ponto_cego')}`,
  },
  mantra: {
    arquivo: () => 'meu-mantra.png',
    texto: () => `Esse é o meu mantra pessoal ✨ Descubra o seu: ${linkStoryTipo('mantra')}`,
  },
};

// Botão "Compartilhar no story". No celular abre a folha de compartilhamento
// nativa com o PNG (dá pra mandar direto pro story do Instagram); no desktop
// baixa o PNG.
// Recebe o id da análise: o servidor monta o conteúdo do card (número,
// arquétipo e frase — ou a frase do Ponto Cego/Mantra, conforme `tipo`).
// `numero` só dá nome ao arquivo baixado no tipo "numero".
export default function BotaoCompartilharStory({ analiseId, pago, numero, origem, tipo = 'numero', className, style }) {
  const config = CONFIG_POR_TIPO[tipo] || CONFIG_POR_TIPO.numero;
  const src = urlDoCard(analiseId, pago, tipo);
  const btnRef = useRef(null);
  const arquivoRef = useRef(null);
  const [estado, setEstado] = useState('idle'); // idle | gerando | erro

  // Pré-carrega o PNG quando o botão chega perto da tela. Motivo: o
  // navigator.share só funciona dentro do "gesto do usuário" — se o clique
  // ainda tiver que esperar a imagem ser gerada, o iOS Safari pode recusar
  // o share (NotAllowedError) por ter passado tempo demais desde o toque.
  useEffect(() => {
    if (!src || !btnRef.current) return;
    arquivoRef.current = null;
    let cancelado = false;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        baixarArquivo(src, config.arquivo(numero))
          .then((file) => { if (!cancelado) arquivoRef.current = file; })
          .catch(() => {});
      },
      { rootMargin: '400px' }
    );
    obs.observe(btnRef.current);
    return () => { cancelado = true; obs.disconnect(); };
  }, [src, numero, config]);

  if (!src) return null;

  async function handleClick() {
    if (estado === 'gerando') return;
    setEstado('gerando');
    try {
      const file = arquivoRef.current || (await baixarArquivo(src, config.arquivo(numero)));
      arquivoRef.current = file;

      // "Mobile" = tela de toque E suporte a compartilhar arquivo. Só checar
      // canShare não basta: Safari/Chrome no Mac também suportam, e aí o
      // desktop abriria a folha de share em vez de baixar.
      const ehToque = window.matchMedia?.('(pointer: coarse)').matches;
      const podeCompartilhar = ehToque && navigator.canShare?.({ files: [file] });

      if (podeCompartilhar) {
        try {
          await navigator.share({
            files: [file],
            text: config.texto(),
          });
          track('share', origem, tipo);
        } catch (e) {
          // AbortError = a pessoa fechou a folha de share. Qualquer outro
          // erro (ex.: NotAllowedError) cai pro download.
          if (e?.name !== 'AbortError') {
            baixarPng(file);
            track('download_fallback', origem, tipo);
          }
        }
      } else {
        baixarPng(file);
        track('download', origem, tipo);
      }
      setEstado('idle');
    } catch (e) {
      console.error('[card] falhou:', e);
      setEstado('erro');
    }
  }

  return (
    <button
      ref={btnRef}
      type="button"
      className={className}
      style={className ? style : { ...ESTILO_PADRAO, ...style }}
      onClick={handleClick}
      disabled={estado === 'gerando'}
    >
      {estado === 'gerando'
        ? '⏳ Gerando imagem…'
        : estado === 'erro'
        ? '⚠️ Não deu — tentar de novo'
        : '📸 Compartilhar no story'}
    </button>
  );
}

async function baixarArquivo(src, nomeArquivo) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new File([blob], nomeArquivo, { type: 'image/png' });
}

function baixarPng(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function track(metodo, origem, tipo) {
  try {
    window?.gtag?.('event', 'compartilhar_story', { event_category: 'engagement', metodo, origem });
    // Evento novo, por tipo de card — pra medir Ponto Cego/Mantra separado
    // do card de número no GA4, sem quebrar relatórios já montados em cima
    // do compartilhar_story acima.
    window?.gtag?.('event', 'share_card', { event_category: 'engagement', tipo, metodo, origem });
  } catch {}
}

const ESTILO_PADRAO = {
  display: 'block',
  margin: '24px auto 0',
  padding: '12px 24px',
  borderRadius: 999,
  border: '1px solid rgba(232,196,122,0.45)',
  background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(232,196,122,0.15))',
  color: '#f6ecff',
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: 17,
  fontWeight: 600,
  cursor: 'pointer',
};
