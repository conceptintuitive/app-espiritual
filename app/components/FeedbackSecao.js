'use client';

import { useEffect, useState, useTransition } from 'react';
import { registrarFeedback } from '@/app/manual/[id]/actions';

const OPCOES = [
  { valor: 'bate_muito', rotulo: '🎯 Bate muito' },
  { valor: 'em_parte', rotulo: '🤔 Em parte' },
  { valor: 'nao_bate', rotulo: '🙅‍♀️ Não bate' },
];

// Chave estável da seção pro banco. Não dá pra usar section.type porque ele
// se repete (há várias seções 'text'), então usa o slug do título:
// ' Ponto cego ' → 'ponto-cego'.
export function chaveSecao(section) {
  const base = String(section?.title || section?.type || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return base || String(section?.type || 'secao');
}

// `visual="ma"` = linha discreta no visual da Minha Área (/manual, nov/2026).
export default function FeedbackSecao({ manualId, secao, visual = 'classico' }) {
  const e = visual === 'ma' ? estilosMa : estilos;
  const storageKey = `feedback:${manualId}:${secao}`;
  const [votou, setVotou] = useState(false);
  const [erro, setErro] = useState(false);
  const [pendente, startTransition] = useTransition();

  // Lembra do voto depois de um reload. Quem garante 1 voto por seção é o
  // unique (manual_id, secao) no banco; isto aqui é só pra UI.
  useEffect(() => {
    try { if (localStorage.getItem(storageKey)) setVotou(true); } catch {}
  }, [storageKey]);

  if (votou) {
    return <div style={e.obrigada}>{visual === 'ma' ? 'Obrigada pela resposta.' : 'Obrigada! 💜'}</div>;
  }

  function votar(resposta) {
    setErro(false);
    startTransition(async () => {
      const res = await registrarFeedback(manualId, secao, resposta).catch(() => null);
      if (res?.ok) {
        try { localStorage.setItem(storageKey, resposta); } catch {}
        try { window?.gtag?.('event', 'feedback_secao', { event_category: 'engagement', secao, resposta }); } catch {}
        setVotou(true);
      } else {
        setErro(true);
      }
    });
  }

  return (
    <div style={e.wrap}>
      <div style={e.pergunta}>Isso bate com você?</div>
      <div style={e.botoes}>
        {OPCOES.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => votar(o.valor)}
            disabled={pendente}
            style={{ ...e.botao, opacity: pendente ? 0.5 : 1 }}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      {erro && <div style={e.erro}>Não conseguimos salvar. Tenta de novo?</div>}
    </div>
  );
}

const estilos = {
  wrap: {
    marginTop: 12,
    padding: '14px 16px',
    borderRadius: 16,
    border: '1px solid rgba(216,180,254,0.15)',
    background: 'rgba(17,7,32,0.45)',
    textAlign: 'center',
  },
  pergunta: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 17,
    fontWeight: 600,
    color: 'rgba(233,213,255,0.85)',
    marginBottom: 10,
  },
  botoes: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  botao: {
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid rgba(216,180,254,0.3)',
    background: 'rgba(139,92,246,0.12)',
    color: '#faf5ff',
    fontSize: 14,
    cursor: 'pointer',
  },
  obrigada: {
    marginTop: 12,
    padding: '14px 16px',
    textAlign: 'center',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 18,
    fontStyle: 'italic',
    color: 'rgba(233,213,255,0.85)',
  },
  erro: { marginTop: 8, fontSize: 13, color: '#fca5a5' },
};

const MONO = "'Geist Mono', var(--font-geist-mono), ui-monospace, monospace";
const estilosMa = {
  wrap: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', marginTop: 22 },
  pergunta: { fontFamily: MONO, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#b9a9c9' },
  botoes: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  botao: {
    minHeight: 34, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(243,233,218,.22)', background: 'transparent',
    color: '#f3e9da', fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer',
  },
  obrigada: { marginTop: 22, fontFamily: MONO, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#9fe0c0' },
  erro: { width: '100%', fontSize: 13, color: '#fca5a5' },
};
