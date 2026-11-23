'use client';

// Peças pequenas do Manual usadas pelo page.js e pelos Complementos.

import { useEffect, useState } from 'react';
import m from './manual.module.css';

// MARKDOWN LEVE (**negrito** / *itálico*) → React nodes, sem dangerouslySetInnerHTML
export function renderInline(text) {
  const str = String(text ?? '');
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// QUEBRA UM TEXTO CORRIDO EM PARÁGRAFOS + DESTACA A FRASE FINAL ENTRE ASPAS (PULL-QUOTE)
export function splitBodyIntoParasAndQuote(body) {
  const raw = String(body ?? '').replace(/\r\n/g, '\n').trim();
  if (!raw) return { paragraphs: [], quote: null };
  const chunks = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!chunks.length) return { paragraphs: [], quote: null };
  const last = chunks[chunks.length - 1];
  const quoteMatch = last.match(/^["“](.+)["”]$/s);
  if (quoteMatch && chunks.length > 1 && quoteMatch[1].length <= 260) {
    return { paragraphs: chunks.slice(0, -1), quote: quoteMatch[1].trim() };
  }
  return { paragraphs: chunks, quote: null };
}

// ITEM DE CHECKLIST INTERATIVO (Plano 7 dias / Rituais / Calendário / meses)
export function CheckItem({ itemKey, checked, onToggle, children, id }) {
  return (
    <li
      id={id}
      className={`${m.check} ${checked ? m.checkOn : ''}`}
      onClick={() => onToggle(itemKey)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(itemKey); } }}
    >
      <span className={m.checkCaixa} aria-hidden="true" />
      <span className={m.checkTexto}>{children}</span>
    </li>
  );
}

// ROTEIROS FALADOS (texto puro, sem markdown, pra narração)
export function stripMarkdown(s) {
  return String(s ?? '').replace(/\*\*/g, '').replace(/\*/g, '');
}

export function buildRitualNarration(r) {
  const parts = [
    `Ritual: ${stripMarkdown(r.nome)}.`,
    r.quando ? `Use quando: ${stripMarkdown(r.quando)}.` : '',
    ...(Array.isArray(r.passos) ? r.passos.map((p, i) => `Passo ${i + 1}: ${stripMarkdown(p)}.`) : []),
    r.frase ? `Para fechar: ${stripMarkdown(r.frase)}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

export function buildDiagBlockNarration(block) {
  const parts = [
    block?.label ? `${stripMarkdown(block.label)}.` : '',
    stripMarkdown(block?.text),
  ];
  return parts.filter(Boolean).join(' ');
}

export function buildArchetypeNarration(item) {
  const parts = [
    `${stripMarkdown(item?.label)}: ${stripMarkdown(item?.nome)}.`,
    stripMarkdown(item?.descricao),
    item?.frase ? `Frase: ${stripMarkdown(item.frase)}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

export function buildProjecaoMesNarration(mes) {
  const parts = [
    `${stripMarkdown(mes?.label)}. Mês Pessoal ${mes?.mesPessoal}: ${stripMarkdown(mes?.titulo)}.`,
    stripMarkdown(mes?.texto),
    Array.isArray(mes?.foco) && mes.foco.length ? `O que favorece: ${mes.foco.map(stripMarkdown).join('. ')}.` : '',
    Array.isArray(mes?.atencao) && mes.atencao.length ? `Cuidado com: ${mes.atencao.map(stripMarkdown).join('. ')}.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

// BOTÃO "OUVIR" — narração 100% no navegador (Web Speech API), sem custo e sem API externa
export function ListenButton({ text, label = 'Ouvir', pauseLabel = 'Pausar áudio' }) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window); // eslint-disable-line react-hooks/set-state-in-effect
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => v.lang?.toLowerCase() === 'pt-br') ||
      voices.find((v) => v.lang?.toLowerCase().startsWith('pt')) ||
      null
    );
  };

  const handleToggle = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'pt-BR';
    utterance.rate = 0.95;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  return (
    <button type="button" className={m.acao} onClick={handleToggle}>
      {playing ? pauseLabel : label}
    </button>
  );
}
