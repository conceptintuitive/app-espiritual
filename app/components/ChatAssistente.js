'use client';

import { useEffect, useRef, useState } from 'react';

const LIMITE_GRATIS = 3;

export default function ChatAssistente({ analiseId, isPaid, firstName, autoOpen }) {
  const [open, setOpen] = useState(Boolean(autoOpen));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [perguntasRestantes, setPerguntasRestantes] = useState(isPaid ? null : LIMITE_GRATIS);
  const [esgotado, setEsgotado] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const irParaOferta = () => {
    setOpen(false);
    document.querySelector('.offer-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    const texto = input.trim();
    if (!texto || loading || esgotado || !analiseId) return;

    setMessages((m) => [...m, { role: 'user', content: texto }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId, pergunta: texto }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.error === 'limite_gratis') {
        setEsgotado(true);
        setPerguntasRestantes(0);
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: 'Você usou suas 3 perguntas grátis. Desbloqueie o manual completo pra continuar conversando sem limite.' },
        ]);
        return;
      }
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data?.error || 'Não consegui responder agora. Tenta de novo.' }]);
        return;
      }

      setMessages((m) => [...m, { role: 'assistant', content: data.resposta }]);
      if (!isPaid && typeof data.perguntasRestantes === 'number') {
        setPerguntasRestantes(data.perguntasRestantes);
        if (data.perguntasRestantes <= 0) setEsgotado(true);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Erro de conexão. Tenta de novo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Fechar assistente' : 'Abrir assistente'}>
        {open ? '✕' : '✦'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>✦ Oráculo do seu mapa</span>
            {!isPaid && (
              <span className="chat-counter">
                {perguntasRestantes} pergunta{perguntasRestantes === 1 ? '' : 's'} grátis
              </span>
            )}
          </div>

          <div className="chat-body">
            {messages.length === 0 && (
              <p className="chat-empty">
                {firstName ? `Oi, ${firstName}! ` : 'Oi! '}
                Pergunta algo sobre o seu mapa — tipo "por que eu travo tanto no amor?"
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.role}`}>{m.content}</div>
            ))}
            {loading && <div className="chat-msg chat-msg-assistant chat-typing">digitando…</div>}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder={esgotado ? 'Limite grátis atingido' : 'Escreva sua pergunta...'}
              disabled={loading || esgotado}
            />
            <button onClick={handleSend} disabled={loading || esgotado || !input.trim()} aria-label="Enviar">➤</button>
          </div>

          {esgotado && !isPaid && (
            <button className="chat-upsell" onClick={irParaOferta}>
              Desbloquear perguntas ilimitadas — R$ 47
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .chat-fab {
          position: fixed; bottom: 20px; right: 20px; z-index: 110;
          width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: #fff; font-size: 22px;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.5);
        }
        .chat-panel {
          position: fixed; bottom: 88px; right: 20px; z-index: 110;
          width: min(360px, calc(100vw - 32px));
          max-height: min(520px, calc(100vh - 140px));
          display: flex; flex-direction: column;
          background: rgba(10, 1, 24, 0.97);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(216, 180, 254, 0.2);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        /* Em mobile o /resultado tem uma barra fixa de CTA no rodapé (64px, z-index 100) —
           sobe o botão/painel do chat pra não ficar coberto por ela. */
        @media (max-width: 767px) {
          .chat-fab { bottom: 92px; }
          .chat-panel { bottom: 160px; max-height: min(460px, calc(100vh - 212px)); }
        }
        .chat-header {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 14px 16px;
          font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.04em;
          color: #faf5ff;
          border-bottom: 1px solid rgba(216, 180, 254, 0.15);
        }
        .chat-counter { font-size: 11px; color: var(--warning); white-space: nowrap; }
        .chat-body {
          flex: 1; overflow-y: auto; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .chat-empty { font-size: 14px; color: rgba(233, 213, 255, 0.7); line-height: 1.6; }
        .chat-msg { font-size: 14.5px; line-height: 1.55; padding: 10px 13px; border-radius: 14px; max-width: 88%; }
        .chat-msg-user { align-self: flex-end; background: linear-gradient(135deg, var(--primary), #be185d); color: #fff; }
        .chat-msg-assistant { align-self: flex-start; background: rgba(139, 92, 246, 0.12); color: #faf5ff; }
        .chat-typing { opacity: 0.6; font-style: italic; }
        .chat-input-row {
          display: flex; gap: 8px; padding: 12px;
          border-top: 1px solid rgba(216, 180, 254, 0.15);
        }
        .chat-input-row input {
          flex: 1; padding: 10px 12px; border-radius: 999px;
          border: 1px solid rgba(216, 180, 254, 0.2);
          background: rgba(255, 255, 255, 0.04); color: #faf5ff;
          font-family: 'Cormorant Garamond', serif; font-size: 14px;
        }
        .chat-input-row input::placeholder { color: rgba(233, 213, 255, 0.4); }
        .chat-input-row input:disabled { opacity: 0.5; }
        .chat-input-row button {
          width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: #fff; font-size: 16px;
        }
        .chat-input-row button:disabled { opacity: 0.4; cursor: not-allowed; }
        .chat-upsell {
          display: block; width: 100%; text-align: center; padding: 12px;
          font-family: 'Cinzel', serif; font-size: 12.5px; letter-spacing: 0.02em;
          color: #fff; background: linear-gradient(135deg, var(--primary), #be185d);
          border: none; cursor: pointer;
        }
      `}</style>
    </>
  );
}
