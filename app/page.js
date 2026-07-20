'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 14, border: '1px solid rgba(139,92,246,.15)',
      background: 'rgba(18,18,30,.7)', overflow: 'hidden', marginBottom: 10,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 22px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12, textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: 'var(--F)', fontWeight: 600, fontSize: 16, color: '#f0eff4' }}>{q}</span>
        <span style={{
          fontSize: 22, color: '#d4a853', flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform .25s ease',
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px', fontSize: 15, color: '#9896a8', lineHeight: 1.65, fontFamily: 'var(--F)' }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ── Quiz Overlay ──────────────────────────────────────────────────────────────
function QuizOverlay({ onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [areaTraada, setAreaTravada] = useState('');
  const [padrao, setPadrao] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    setLoadingStep(1);
    const t = setInterval(() => setLoadingStep(s => Math.min(s + 1, 4)), 3000);
    return () => clearInterval(t);
  }, [loading]);

  const goNext = (newStep) => {
    setDirection('forward');
    setErro('');
    setStep(newStep);
  };
  const goBack = (newStep) => {
    setDirection('back');
    setErro('');
    setStep(newStep);
  };

  const handleSubmit = async () => {
    const nomeTrimmed = nome.trim();
    const emailTrimmed = email.trim();
    if (nomeTrimmed.length < 3) { setErro('Por favor, preencha seu nome completo.'); return; }
    if (!emailTrimmed.includes('@')) { setErro('Digite um e-mail válido.'); return; }
    if (!dataNasc) { setErro('Selecione sua data de nascimento.'); return; }

    setLoading(true);
    setErro('');

    const payload = {
      nome: nomeTrimmed,
      email: emailTrimmed,
      data_nascimento: dataNasc,
      hora_nascimento: '',
      local_nascimento: '',
      noTime: true,
      objetivo_principal: areaTraada,
      relacao_status: '',
      trabalho_status: '',
    };

    try {
      try { window?.gtag?.('event', 'lead_submit', { event_category: 'lead', event_label: 'quiz_overlay' }); } catch {}
      try { window?.fbq?.('track', 'Lead'); } catch {}

      const res = await fetch('/api/gerar-analise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json')
        ? await res.json()
        : { error: 'Resposta inesperada do servidor.', rawText: await res.text() };

      if (!res.ok) {
        const msg = data?.details || data?.error || 'Falha ao gerar análise.';
        throw new Error(msg);
      }
      if (data?.id) { router.push(`/resultado/${data.id}`); return; }
      throw new Error('A API não retornou um ID.');
    } catch (err) {
      setErro(err?.message || 'Ops! Tivemos uma instabilidade. Tente novamente em instantes.');
      setLoading(false);
    }
  };

  const AREAS = [
    { emoji: '💔', label: 'Amor e Relacionamentos' },
    { emoji: '💼', label: 'Carreira e Propósito' },
    { emoji: '💰', label: 'Dinheiro e Abundância' },
    { emoji: '🌀', label: 'Autoconhecimento' },
  ];

  const PADROES = [
    { emoji: '😩', label: 'O tempo todo' },
    { emoji: '😐', label: 'Às vezes' },
    { emoji: '🤔', label: 'Não tenho certeza' },
  ];

  const animClass = direction === 'forward' ? 'quiz-slide-in' : 'quiz-slide-back';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,10,18,.96)', backdropFilter: 'blur(18px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 18, right: 18,
          background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.25)',
          borderRadius: '50%', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#9896a8', fontSize: 20, lineHeight: 1,
          transition: 'background .2s',
        }}
      >×</button>

      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? 'linear-gradient(90deg,#8b5cf6,#a78bfa)' : 'rgba(139,92,246,.18)',
                transition: 'background .3s ease',
              }} />
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#6b6980', fontFamily: 'var(--F)' }}>
            Etapa {step} de 4
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(139,92,246,.2)', borderTopColor: '#8b5cf6', animation: 'spin .9s linear infinite', margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: 'var(--T)', fontWeight: 700, fontSize: 22, color: '#f0eff4', marginBottom: 18 }}>
              Gerando seu mapa...
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
              {['Calculando seu mapa astral…', 'Analisando seus padrões…', 'Gerando seu diagnóstico…', 'Preparando seu resultado…'].map((text, i) => (
                <p key={i} style={{
                  fontSize: 15, fontFamily: 'var(--F)',
                  color: loadingStep > i ? '#d4a853' : 'rgba(152,150,168,.3)',
                  transition: 'color .5s ease',
                }}>✦ {text}</p>
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#6b6980', fontFamily: 'var(--F)', marginTop: 18 }}>
              Isso leva de 10 a 20 segundos.
            </p>
          </div>
        ) : (
          <div className={animClass} key={step}>

            {/* STEP 1 — Área travada */}
            {step === 1 && (
              <div>
                <p style={{ fontSize: 13, color: '#8b5cf6', fontFamily: 'var(--F)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Etapa 1</p>
                <h2 style={{ fontFamily: 'var(--T)', fontWeight: 800, fontSize: 'clamp(20px,4vw,26px)', color: '#f0eff4', marginBottom: 8, lineHeight: 1.25 }}>
                  Qual área da sua vida está mais travada agora?
                </h2>
                <p style={{ fontSize: 15, color: '#9896a8', fontFamily: 'var(--F)', marginBottom: 24 }}>
                  Escolha a que mais ressoa com você neste momento.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {AREAS.map(({ emoji, label }) => (
                    <button key={label}
                      onClick={() => { setAreaTravada(label); goNext(2); }}
                      style={{
                        padding: '16px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        border: `1px solid ${areaTraada === label ? '#8b5cf6' : 'rgba(139,92,246,.2)'}`,
                        background: areaTraada === label ? 'rgba(139,92,246,.18)' : 'rgba(18,18,30,.8)',
                        color: '#f0eff4', fontFamily: 'var(--F)', fontSize: 16, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all .2s ease',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Padrão */}
            {step === 2 && (
              <div>
                <p style={{ fontSize: 13, color: '#8b5cf6', fontFamily: 'var(--F)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Etapa 2</p>
                <h2 style={{ fontFamily: 'var(--T)', fontWeight: 800, fontSize: 'clamp(20px,4vw,26px)', color: '#f0eff4', marginBottom: 8, lineHeight: 1.25 }}>
                  Você sente que repete os mesmos padrões, mesmo tentando mudar?
                </h2>
                <p style={{ fontSize: 15, color: '#9896a8', fontFamily: 'var(--F)', marginBottom: 24 }}>
                  Seja honesto — não existe resposta errada.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PADROES.map(({ emoji, label }) => (
                    <button key={label}
                      onClick={() => { setPadrao(label); goNext(3); }}
                      style={{
                        padding: '16px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        border: `1px solid ${padrao === label ? '#8b5cf6' : 'rgba(139,92,246,.2)'}`,
                        background: padrao === label ? 'rgba(139,92,246,.18)' : 'rgba(18,18,30,.8)',
                        color: '#f0eff4', fontFamily: 'var(--F)', fontSize: 16, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all .2s ease',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => goBack(1)} style={{ background: 'none', border: 'none', color: '#6b6980', fontSize: 14, fontFamily: 'var(--F)', cursor: 'pointer', marginTop: 16, display: 'block', width: '100%', textAlign: 'center' }}>
                  ← Voltar
                </button>
              </div>
            )}

            {/* STEP 3 — Data de nascimento */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: 13, color: '#8b5cf6', fontFamily: 'var(--F)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Etapa 3</p>
                <h2 style={{ fontFamily: 'var(--T)', fontWeight: 800, fontSize: 'clamp(20px,4vw,26px)', color: '#f0eff4', marginBottom: 8, lineHeight: 1.25 }}>
                  Qual é a sua data de nascimento?
                </h2>
                <p style={{ fontSize: 15, color: '#9896a8', fontFamily: 'var(--F)', marginBottom: 24 }}>
                  Usamos para calcular seu número de vida e signo. Sem hora de nascimento necessária.
                </p>
                <input
                  type="date"
                  value={dataNasc}
                  onChange={e => setDataNasc(e.target.value)}
                  style={{
                    width: '100%', padding: '15px 18px', borderRadius: 14,
                    border: '1px solid rgba(139,92,246,.3)', background: 'rgba(18,18,30,.9)',
                    color: '#f0eff4', fontFamily: 'var(--F)', fontSize: 17,
                    outline: 'none', colorScheme: 'dark', marginBottom: 20,
                  }}
                />
                <button
                  onClick={() => { if (!dataNasc) { setErro('Selecione sua data de nascimento.'); return; } goNext(4); }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 999, border: 'none',
                    background: dataNasc ? 'linear-gradient(90deg,#7c3aed,#8b5cf6)' : 'rgba(139,92,246,.3)',
                    color: '#fff', fontFamily: 'var(--T)', fontWeight: 700, fontSize: 17,
                    cursor: dataNasc ? 'pointer' : 'not-allowed', transition: 'all .2s',
                  }}
                >
                  Continuar →
                </button>
                {erro && <p style={{ color: 'rgba(254,202,202,.9)', fontSize: 14, fontFamily: 'var(--F)', marginTop: 12, textAlign: 'center' }}>{erro}</p>}
                <button onClick={() => goBack(2)} style={{ background: 'none', border: 'none', color: '#6b6980', fontSize: 14, fontFamily: 'var(--F)', cursor: 'pointer', marginTop: 14, display: 'block', width: '100%', textAlign: 'center' }}>
                  ← Voltar
                </button>
              </div>
            )}

            {/* STEP 4 — Nome + Email */}
            {step === 4 && (
              <div>
                <p style={{ fontSize: 13, color: '#8b5cf6', fontFamily: 'var(--F)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Etapa 4</p>
                <h2 style={{ fontFamily: 'var(--T)', fontWeight: 800, fontSize: 'clamp(20px,4vw,26px)', color: '#f0eff4', marginBottom: 8, lineHeight: 1.25 }}>
                  Quase lá! Onde enviamos seu resultado?
                </h2>
                <p style={{ fontSize: 15, color: '#9896a8', fontFamily: 'var(--F)', marginBottom: 24 }}>
                  Seu mapa personalizado ficará pronto em instantes.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, color: '#9896a8', fontFamily: 'var(--F)', marginBottom: 7 }}>Seu nome</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Ex: Maria da Silva"
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: 14,
                        border: '1px solid rgba(139,92,246,.3)', background: 'rgba(18,18,30,.9)',
                        color: '#f0eff4', fontFamily: 'var(--F)', fontSize: 16,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, color: '#9896a8', fontFamily: 'var(--F)', marginBottom: 7 }}>Seu e-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value.replace(/\s/g, ''))}
                      placeholder="seu@email.com"
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: 14,
                        border: '1px solid rgba(139,92,246,.3)', background: 'rgba(18,18,30,.9)',
                        color: '#f0eff4', fontFamily: 'var(--F)', fontSize: 16,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                {erro && (
                  <div style={{ borderRadius: 12, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(127,29,29,.2)', padding: '12px 16px', color: 'rgba(254,202,202,.97)', fontSize: 14, fontFamily: 'var(--F)', marginBottom: 16 }}>
                    ⚠️ {erro}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '17px', borderRadius: 999, border: 'none',
                    background: 'linear-gradient(90deg,#7c3aed,#8b5cf6)',
                    color: '#fff', fontFamily: 'var(--T)', fontWeight: 700, fontSize: 17,
                    cursor: 'pointer', boxShadow: '0 16px 50px rgba(139,92,246,.3)',
                    opacity: loading ? .6 : 1, transition: 'all .2s',
                  }}
                >
                  ✦ Ver meu padrão agora
                </button>
                <p style={{ textAlign: 'center', fontSize: 13, color: '#6b6980', fontFamily: 'var(--F)', marginTop: 12 }}>
                  🔒 Dados seguros · Resultado imediato · Gratuito
                </p>
                <button onClick={() => goBack(3)} style={{ background: 'none', border: 'none', color: '#6b6980', fontSize: 14, fontFamily: 'var(--F)', cursor: 'pointer', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>
                  ← Voltar
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [quizOpen, setQuizOpen] = useState(false);

  const openQuiz = () => setQuizOpen(true);
  const closeQuiz = () => setQuizOpen(false);

  // Orbs ref
  const orbsBuilt = useRef(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = quizOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [quizOpen]);

  const CARDS = [
    { n: '01', title: 'Seu Padrão Central', desc: 'O número que rege sua vida — e por que você repete os mesmos ciclos sem perceber.' },
    { n: '02', title: 'Seu Arquétipo', desc: 'O papel que você assume no mundo — como você funciona no eixo e o que acontece quando sai.' },
    { n: '03', title: 'Seus Bloqueios', desc: 'Os mecanismos invisíveis que te travam justamente quando você está prestes a avançar.' },
    { n: '04', title: 'Direção Prática', desc: 'Não só o diagnóstico — o que fazer agora, com plano de ação e rituais personalizados.' },
  ];

  const TESTIMONIALS = [
    { init: 'M', name: 'Mariana S.', city: 'São Paulo', text: '"Eu chorei lendo meu mapa. Parecia que alguém finalmente colocou em palavras o que eu sinto há anos mas não conseguia explicar."' },
    { init: 'R', name: 'Rafael T.', city: 'Belo Horizonte', text: '"Sou cético, mas o nível de detalhe me impressionou. Acertou coisas sobre minha carreira que nem meu terapeuta tinha percebido."' },
    { init: 'F', name: 'Fernanda L.', city: 'Curitiba', text: '"Comprei o manual completo e valeu cada centavo. A parte do ano pessoal mudou completamente como eu tô planejando 2026."' },
  ];

  const FAQS = [
    { q: 'Como funciona o mapa espiritual?', a: 'Combinamos Numerologia e análise de padrões comportamentais para revelar o que se repete na sua vida, o que te trava e qual é o próximo passo mais alinhado. Sem misticismo — só clareza.' },
    { q: 'O que eu recebo de graça?', a: 'Um diagnóstico completo do seu padrão central, seu arquétipo, seus principais bloqueios e uma direção prática. Tudo personalizado com sua data de nascimento.' },
    { q: 'Preciso saber minha hora de nascimento?', a: 'Não. A análise funciona perfeitamente só com sua data de nascimento. A hora é opcional e, quando informada, aprofunda a leitura astrológica.' },
    { q: 'Meus dados estão seguros?', a: 'Sim. Seus dados são usados exclusivamente para gerar seu mapa e nunca são compartilhados com terceiros. Você pode cancelar comunicações a qualquer momento.' },
    { q: 'Quanto tempo demora?', a: 'Menos de 1 minuto para preencher o quiz. O resultado aparece na tela imediatamente após a análise.' },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { max-width: 100%; overflow-x: hidden; }

        :root {
          --bg:   #0a0a12;
          --card: #12121e;
          --pu:   #8b5cf6;
          --pg:   #a78bfa;
          --gold: #d4a853;
          --t1:   #f0eff4;
          --t2:   #9896a8;
          --t3:   #6b6980;
          --T: 'Playfair Display', Georgia, serif;
          --F: 'DM Sans', system-ui, sans-serif;
        }

        body {
          font-family: var(--F);
          color: var(--t1);
          background: var(--bg);
          min-height: 100vh;
          line-height: 1.6;
        }

        /* Orbs */
        .orb {
          position: fixed; pointer-events: none; z-index: 0;
          border-radius: 50%; filter: blur(120px);
          animation: orbPulse 8s ease-in-out infinite;
        }
        .orb-purple { width: 600px; height: 600px; top: -200px; left: -200px; background: rgba(139,92,246,.12); animation-delay: 0s; }
        .orb-gold   { width: 400px; height: 400px; bottom: -100px; right: -100px; background: rgba(212,168,83,.08); animation-delay: 4s; }

        @keyframes orbPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes shimmer { 0%{transform:translateX(-160%) skewX(-22deg)} 100%{transform:translateX(200%) skewX(-22deg)} }
        @keyframes glow { 0%,100%{opacity:.4} 50%{opacity:.75} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        .a1 { animation: fadeUp .7s .05s ease-out both; }
        .a2 { animation: fadeUp .7s .15s ease-out both; }
        .a3 { animation: fadeUp .7s .25s ease-out both; }
        .a4 { animation: fadeUp .7s .35s ease-out both; }
        .a5 { animation: fadeUp .7s .45s ease-out both; }

        /* Slide transitions for quiz steps */
        @keyframes slideIn   { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:none} }
        @keyframes slideBack { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:none} }
        .quiz-slide-in   { animation: slideIn   .28s ease-out both; }
        .quiz-slide-back { animation: slideBack .28s ease-out both; }

        /* Layout */
        .ctr    { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 clamp(16px,4vw,28px); }
        .ctr-sm { width: 100%; max-width: 700px;  margin: 0 auto; padding: 0 clamp(16px,4vw,28px); }

        /* Sections */
        .sec { position: relative; z-index: 10; padding: clamp(56px,9vh,100px) 0; }
        .sec-alt { background: rgba(16,16,28,.6); }
        .divider { height: 1px; background: linear-gradient(90deg,transparent,rgba(139,92,246,.12),transparent); position: relative; z-index: 10; }

        /* CTA button */
        .btn-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          padding: clamp(15px,2vw,18px) clamp(28px,4vw,48px);
          border-radius: 999px; border: none; cursor: pointer;
          font-family: var(--T); font-weight: 700; font-size: clamp(15px,2vw,18px); color: #fff;
          background: linear-gradient(90deg,#7c3aed,#8b5cf6);
          box-shadow: 0 16px 52px rgba(139,92,246,.32);
          position: relative; overflow: hidden;
          transition: transform .2s, box-shadow .2s;
        }
        .btn-cta::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
          transform: translateX(-160%) skewX(-22deg);
          animation: shimmer 2.4s ease-in-out infinite;
        }
        .btn-cta:hover { transform: translateY(-3px); box-shadow: 0 24px 64px rgba(139,92,246,.42); }

        /* Cards grid */
        .grid-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .grid-2x2 { grid-template-columns: 1fr; } }

        .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        @media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .grid-3 { grid-template-columns: 1fr; } }

        /* Glass card */
        .card {
          border-radius: 20px; padding: clamp(20px,3vw,28px);
          border: 1px solid rgba(139,92,246,.14); background: var(--card);
          transition: transform .25s, border-color .25s, box-shadow .25s;
        }
        .card:hover { transform: translateY(-5px); border-color: rgba(139,92,246,.35); box-shadow: 0 22px 56px rgba(0,0,0,.4); }

        /* Testimonial */
        .testi {
          border-radius: 20px; padding: 24px;
          border: 1px solid rgba(139,92,246,.14); background: var(--card);
        }

        /* Badge */
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 18px; border-radius: 999px;
          border: 1px solid rgba(212,168,83,.2); background: rgba(212,168,83,.06);
          color: var(--gold); font-size: 14px; font-family: var(--F); font-weight: 500;
          letter-spacing: .04em;
        }

        /* Proof pills */
        .proof-pills { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .proof-pill  { padding: 8px 16px; border-radius: 999px; font-size: 13px; font-family: var(--F); border: 1px solid rgba(139,92,246,.15); background: rgba(139,92,246,.06); color: var(--t2); }

        /* Section titles */
        .sec-title { font-family: var(--T); font-weight: 700; font-size: clamp(26px,3.5vw,44px); color: var(--t1); text-align: center; margin-bottom: 12px; line-height: 1.2; }
        .sec-sub   { font-size: clamp(15px,1.8vw,18px); color: var(--t2); text-align: center; margin-bottom: 40px; font-family: var(--F); max-width: 560px; margin-left: auto; margin-right: auto; }

        /* Number label */
        .card-num { font-family: var(--T); font-size: 38px; font-weight: 800; color: rgba(212,168,83,.15); line-height: 1; margin-bottom: 12px; }
        .card-title { font-family: var(--T); font-size: 18px; font-weight: 700; color: var(--gold); margin-bottom: 8px; }
        .card-desc { font-size: 15px; color: var(--t2); line-height: 1.6; font-family: var(--F); }

        /* Date input */
        input[type=date] { color-scheme: dark; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.6) sepia(.4) hue-rotate(230deg); cursor: pointer; }

        @media (max-width: 480px) {
          .btn-cta { width: 100%; font-size: 15px; padding: 15px 20px; }
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="orb orb-purple" />
      <div className="orb orb-gold" />

      {/* Quiz overlay */}
      {quizOpen && <QuizOverlay onClose={closeQuiz} />}

      {/* ═══════════════ HERO ═══════════════════════════════════════════════ */}
      <section className="sec" style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', paddingBottom: 'clamp(32px,5vh,56px)' }}>
        <div className="ctr" style={{ textAlign: 'center' }}>

          <div className="a1" style={{ marginBottom: 24 }}>
            <span className="badge">✦ Numerologia + Neurociência</span>
          </div>

          <div className="a2">
            <h1 style={{
              fontFamily: 'var(--T)', fontWeight: 800,
              fontSize: 'clamp(30px,5.2vw,62px)', lineHeight: 1.1,
              maxWidth: 860, margin: '0 auto 20px', color: 'var(--t1)',
            }}>
              Você tenta mudar, mas algo invisível{' '}
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(90deg,#d4a853,#f0c870)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                te puxa de volta
              </em>
            </h1>
          </div>

          <div className="a3">
            <p style={{
              fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(240,239,244,.8)',
              maxWidth: 580, margin: '0 auto 32px', fontFamily: 'var(--F)', lineHeight: 1.7,
            }}>
              Seu mapa revela o padrão que te trava — e o que fazer agora.{' '}
              <strong style={{ color: 'var(--t1)' }}>Gratuito. Resultado na hora. Sem hora de nascimento.</strong>
            </p>
          </div>

          <div className="a4" style={{ marginBottom: 24 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                position: 'absolute', inset: -6, borderRadius: 999,
                background: 'linear-gradient(90deg,#7c3aed,#8b5cf6)',
                filter: 'blur(24px)', opacity: .45, zIndex: -1,
                animation: 'glow 2.8s ease-in-out infinite',
              }} />
              <button className="btn-cta" onClick={openQuiz}>
                ✦ Descobrir meu padrão — 1 min
              </button>
            </div>
          </div>

          <div className="a5 proof-pills">
            {['⚡ Quiz rápido', '🔒 Dados seguros', '✦ 100% personalizado'].map(p => (
              <span key={p} className="proof-pill">{p}</span>
            ))}
          </div>

        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════ O QUE VOCÊ VAI DESCOBRIR ══════════════════════════ */}
      <section className="sec sec-alt">
        <div className="ctr">
          <h2 className="sec-title">O que você vai descobrir</h2>
          <p className="sec-sub">Quatro dimensões que revelam quem você é — e o que está te impedindo de avançar.</p>
          <div className="grid-2x2" style={{ maxWidth: 840, margin: '0 auto 36px' }}>
            {CARDS.map(({ n, title, desc }) => (
              <div key={n} className="card">
                <div className="card-num">{n}</div>
                <h3 className="card-title">{title}</h3>
                <p className="card-desc">{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button className="btn-cta" onClick={openQuiz}>✦ Descobrir meu padrão — 1 min</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════ DEPOIMENTOS ════════════════════════════════════════ */}
      <section className="sec">
        <div className="ctr">
          <h2 className="sec-title">Relatos de quem já fez o mapa</h2>
          <p className="sec-sub">Pessoas reais. Clareza real.</p>
          <div className="grid-3" style={{ maxWidth: 1000, margin: '0 auto' }}>
            {TESTIMONIALS.map(({ init, name, city, text }) => (
              <div key={name} className="testi">
                <p style={{
                  fontSize: 16, fontStyle: 'italic', color: 'rgba(240,239,244,.92)',
                  fontFamily: 'var(--F)', lineHeight: 1.7, marginBottom: 18,
                }}>{text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, color: '#fff', fontFamily: 'var(--T)', flexShrink: 0,
                  }}>{init}</div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--gold)', fontSize: 14, fontFamily: 'var(--F)' }}>{name}</p>
                    <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: 'var(--F)' }}>{city} · ⭐⭐⭐⭐⭐</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════ FAQ ════════════════════════════════════════════════ */}
      <section className="sec sec-alt">
        <div className="ctr-sm">
          <h2 className="sec-title">Perguntas frequentes</h2>
          <p className="sec-sub">Transparência total — sem pegadinhas.</p>
          <div>
            {FAQS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════ CTA FINAL ══════════════════════════════════════════ */}
      <section className="sec">
        <div className="ctr">
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--T)', fontWeight: 800,
              fontSize: 'clamp(26px,4vw,50px)', color: 'var(--t1)',
              lineHeight: 1.15, marginBottom: 16,
            }}>
              O padrão que te trava não precisa continuar.{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Descubra o que está por trás.</em>
            </h2>
            <p style={{ fontSize: 18, color: 'var(--t2)', fontFamily: 'var(--F)', marginBottom: 36 }}>
              Quiz de 1 minuto. Resultado imediato. Gratuito.
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                position: 'absolute', inset: -6, borderRadius: 999,
                background: 'linear-gradient(90deg,#7c3aed,#8b5cf6)',
                filter: 'blur(24px)', opacity: .4, zIndex: -1,
                animation: 'glow 2.8s ease-in-out infinite',
              }} />
              <button className="btn-cta" onClick={openQuiz}>✦ Descobrir meu padrão — 1 min</button>
            </div>
            <p style={{ marginTop: 22, fontSize: 13, color: 'var(--t3)', fontFamily: 'var(--F)' }}>
              🔒 Seus dados são protegidos e usados apenas para gerar seu mapa.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
