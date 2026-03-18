'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUIZ_STEPS = [
  {
    id: 'bloqueio',
    question: 'O que mais se parece com o que você vive?',
    options: [
      { emoji: '🔁', label: 'Repito os mesmos erros mesmo sabendo que é errado' },
      { emoji: '🧱', label: 'Tudo bem até chegar perto do que quero — aí traço' },
      { emoji: '😶', label: 'Sinto que estou no lugar errado mas não sei qual seria o certo' },
      { emoji: '⏳', label: 'Fico me preparando para agir, mas o momento nunca chega' },
    ],
  },
  {
    id: 'padrao',
    question: 'Quando você tenta mudar, o que normalmente acontece?',
    options: [
      { emoji: '💡', label: 'Começo com energia mas perco o foco em pouco tempo' },
      { emoji: '🌀', label: 'Caio no mesmo padrão que queria abandonar' },
      { emoji: '😩', label: 'Me critico muito e acabo desistindo' },
      { emoji: '🤷', label: 'Não consigo nem começar — dá um branco' },
    ],
  },
  {
    id: 'desejo',
    question: 'O que você mais quer descobrir com seu mapa?',
    options: [
      { emoji: '🎯', label: 'Por que trava exatamente quando preciso avançar' },
      { emoji: '🧩', label: 'O padrão invisível que me faz repetir ciclos' },
      { emoji: '🛤️', label: 'Qual o próximo passo concreto para sair daqui' },
      { emoji: '🔮', label: 'O que está me impedindo de confiar em mim mesma' },
    ],
  },
];

const OBJETIVOS = [
  'Ter mais disciplina', 'Reduzir ansiedade', 'Melhorar autoestima',
  'Atrair relacionamento saudável', 'Melhorar meu relacionamento atual',
  'Crescer profissionalmente', 'Organizar minha rotina',
];
const STATUS_RELACIONAMENTO = ['Solteiro(a)', 'Ficando', 'Relacionamento instável', 'Namorando', 'Casado(a)'];
const STATUS_TRABALHO = ['CLT', 'Empreendedor(a)', 'Autônomo(a)', 'Transição de carreira', 'Estudando'];

const TESTIMONIALS = [
  { avatar: 'M', name: 'Marina S., 34 anos · São Paulo', stars: 5, text: '"Parecia que alguém tinha traduzido exatamente o que eu estava vivendo. Primeira vez que senti clareza de verdade."' },
  { avatar: 'J', name: 'Julia M., 28 anos · Rio de Janeiro', stars: 5, text: '"Achei que seria genérico, mas foi muito mais específico do que eu esperava. Me fez entender um padrão que eu repetia há anos."' },
  { avatar: 'R', name: 'Roberto C., 41 anos · Belo Horizonte', stars: 5, text: '"Não ficou só no místico. Me deu clareza e um próximo passo real, que eu consegui aplicar no mesmo dia."' },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Stars({ count = 60 }) {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    setStars(Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      scale: 0.5 + Math.random() * 1.5,
      opacity: 0.2 + Math.random() * 0.6,
    })));
  }, [count]);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.left}%`, top: `${s.top}%`,
          width: 2, height: 2, borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          opacity: s.opacity, transform: `scale(${s.scale})`,
          animation: `twinkle ${2.5 + Math.random() * 2}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function FadeIn({ children, delay = 0, direction = 'up', className = '', style = {} }) {
  const [ref, inView] = useInView();
  const transform = direction === 'up' ? 'translateY(28px)' : direction === 'down' ? 'translateY(-28px)' : 'translateX(-28px)';
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : transform,
      transition: `opacity 0.7s ${delay}s ease, transform 0.7s ${delay}s ease`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SocialProof() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '0 0 28px' }}>
      <div style={{ display: 'flex' }}>
        {['#ec4899','#a855f7','#f59e0b'].map((bg, i) => (
          <div key={i} style={{
            width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(18,6,34,1)',
            background: bg, marginLeft: i ? -8 : 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white',
          }}>
            {['M','J','R'][i]}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 13, color: 'rgba(216,180,254,0.9)', fontFamily: 'var(--body)' }}>
        <strong style={{ color: 'rgba(243,232,255,0.98)' }}>2.847 pessoas</strong> descobriram seu mapa essa semana
      </span>
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 7, height: 7, borderRadius: 999,
          background: i <= current ? 'linear-gradient(90deg,#ec4899,#a855f7)' : 'rgba(255,255,255,0.12)',
          transition: 'all 0.35s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Quiz Step ────────────────────────────────────────────────────────────────
function QuizStep({ step, stepIndex, totalSteps, onAnswer, visible }) {
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const choose = useCallback((i) => {
    if (animating) return;
    setSelected(i);
    setAnimating(true);
    setTimeout(() => { onAnswer(i); setAnimating(false); setSelected(null); }, 420);
  }, [animating, onAnswer]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(10px)',
      transition: 'all 0.35s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <ProgressDots total={totalSteps} current={stepIndex} />
      <p style={{
        textAlign: 'center', fontSize: 'clamp(17px,2.2vw,20px)',
        fontFamily: 'var(--display)', fontWeight: 600,
        color: 'rgba(243,232,255,0.97)', marginBottom: 18, lineHeight: 1.4,
      }}>
        {step.question}
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {step.options.map((opt, i) => (
          <button key={i} onClick={() => choose(i)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            border: selected === i ? '1.5px solid rgba(236,72,153,0.9)' : '1px solid rgba(216,180,254,0.15)',
            background: selected === i ? 'rgba(236,72,153,0.18)' : 'rgba(17,7,32,0.4)',
            color: 'rgba(233,213,255,0.95)', fontSize: 15, fontFamily: 'var(--body)',
            transition: 'all 0.2s ease',
            transform: selected === i ? 'scale(0.98)' : 'scale(1)',
          }}
            onMouseEnter={e => { if (selected !== i) { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; } }}
            onMouseLeave={e => { if (selected !== i) { e.currentTarget.style.borderColor = 'rgba(216,180,254,0.15)'; e.currentTarget.style.background = 'rgba(17,7,32,0.4)'; } }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(216,180,254,0.45)', marginTop: 14, fontFamily: 'var(--body)' }}>
        Pergunta {stepIndex + 1} de {totalSteps} · Clique para avançar
      </p>
    </div>
  );
}

// ─── Email Capture Step ───────────────────────────────────────────────────────
function EmailStep({ quizAnswers, onNext }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = () => {
    if (nome.trim().length < 2) { setError('Digite seu nome para continuar.'); return; }
    if (!emailValid) { setError('Digite um e-mail válido para receber seu mapa.'); return; }
    setError('');
    onNext({ nome: nome.trim(), email: email.trim() });
  };

  // Map quiz answer index to a resonant phrase
  const resonance = [
    ['repetição de ciclos', 'bloqueio invisível', 'desconexão com seu caminho', 'paralisia pelo perfeccionismo'],
    ['perda de foco', 'retorno ao padrão antigo', 'autocrítica excessiva', 'bloqueio inicial'],
    ['o gatilho do travamento', 'o padrão que te prende', 'o próximo passo concreto', 'a barreira da autoconfiança'],
  ];

  const insight = quizAnswers.length === 3
    ? `Seu mapa vai revelar: ${resonance[2][quizAnswers[2]]}.`
    : 'Seu mapa está sendo personalizado com base nas suas respostas.';

  return (
    <div>
      <div style={{
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
        borderRadius: 14, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(245,158,11,0.97)', fontSize: 14, fontFamily: 'var(--body)', margin: 0 }}>
          ✨ {insight}
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 19, fontFamily: 'var(--display)', fontWeight: 600, color: 'rgba(243,232,255,0.97)', marginBottom: 18 }}>
        Para onde envio seu mapa?
      </p>

      {error && (
        <div style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ color: 'rgba(254,202,202,0.95)', fontSize: 13, fontFamily: 'var(--body)', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 6 }}>
            Seu primeiro nome
          </label>
          <input
            type="text" placeholder="Ex: Maria" value={nome}
            onChange={e => setNome(e.target.value)}
            onFocus={() => setFocused('nome')} onBlur={() => setFocused('')}
            style={{
              width: '100%', padding: '13px 15px', borderRadius: 14, fontSize: 16,
              fontFamily: 'var(--body)', outline: 'none', boxSizing: 'border-box',
              border: focused === 'nome' ? '1.5px solid rgba(236,72,153,0.7)' : '1px solid rgba(216,180,254,0.18)',
              background: 'rgba(17,7,32,0.6)', color: 'rgba(243,232,255,0.97)',
              boxShadow: focused === 'nome' ? '0 0 0 4px rgba(236,72,153,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 6 }}>
            Seu melhor e-mail
          </label>
          <input
            type="email" placeholder="seu@email.com" value={email}
            onChange={e => setEmail(e.target.value.replace(/\s/g, ''))}
            onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{
              width: '100%', padding: '13px 15px', borderRadius: 14, fontSize: 16,
              fontFamily: 'var(--body)', outline: 'none', boxSizing: 'border-box',
              border: focused === 'email' ? '1.5px solid rgba(236,72,153,0.7)' : '1px solid rgba(216,180,254,0.18)',
              background: 'rgba(17,7,32,0.6)', color: 'rgba(243,232,255,0.97)',
              boxShadow: focused === 'email' ? '0 0 0 4px rgba(236,72,153,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          />
        </div>
      </div>

      <button onClick={submit} style={{
        width: '100%', marginTop: 16, padding: '15px 18px', borderRadius: 999, border: 'none',
        cursor: 'pointer', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'white',
        background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
        boxShadow: '0 14px 40px rgba(236,72,153,0.22)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(236,72,153,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 14px 40px rgba(236,72,153,0.22)'; }}
      >
        ✨ VER MEU MAPA AGORA →
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(216,180,254,0.45)', marginTop: 10, fontFamily: 'var(--body)' }}>
        🔒 100% privado · sem spam · cancele quando quiser
      </p>
    </div>
  );
}

// ─── Birth Data Step ──────────────────────────────────────────────────────────
function BirthStep({ nome, formData, setFormData, noTime, setNoTime, onNext, loading, erro }) {
  const [focused, setFocused] = useState('');

  const canProceed = String(formData.data_nascimento || '').trim().length > 0;

  const inputStyle = (name) => ({
    width: '100%', padding: '13px 15px', borderRadius: 14, fontSize: 16,
    fontFamily: 'var(--body)', outline: 'none', boxSizing: 'border-box',
    border: focused === name ? '1.5px solid rgba(236,72,153,0.7)' : '1px solid rgba(216,180,254,0.18)',
    background: 'rgba(17,7,32,0.6)', color: 'rgba(243,232,255,0.97)',
    boxShadow: focused === name ? '0 0 0 4px rgba(236,72,153,0.1)' : 'none',
    transition: 'all 0.2s', colorScheme: 'dark',
  });

  const selectStyle = {
    ...inputStyle(''), appearance: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(216,180,254,0.5)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
    paddingRight: 36,
  };

  const labelStyle = { display: 'block', fontSize: 13, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 6 };

  return (
    <div>
      <p style={{ textAlign: 'center', fontSize: 19, fontFamily: 'var(--display)', fontWeight: 600, color: 'rgba(243,232,255,0.97)', marginBottom: 6 }}>
        Ativando sua leitura, {nome}
      </p>
      <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(216,180,254,0.7)', fontFamily: 'var(--body)', marginBottom: 20 }}>
        Esses dados geram a precisão do mapa
      </p>

      {erro && (
        <div style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ color: 'rgba(254,202,202,0.95)', fontSize: 13, fontFamily: 'var(--body)', margin: 0 }}>⚠️ {erro}</p>
          <p style={{ color: 'rgba(254,202,202,0.7)', fontSize: 12, fontFamily: 'var(--body)', margin: '4px 0 0' }}>Confira os dados e tente novamente. Se persistir, recarregue a página.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={labelStyle}>Data de Nascimento *</label>
          <input type="date" style={inputStyle('data')} value={formData.data_nascimento}
            onChange={e => setFormData(p => ({ ...p, data_nascimento: e.target.value }))}
            onFocus={() => setFocused('data')} onBlur={() => setFocused('')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Hora</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(216,180,254,0.65)', fontFamily: 'var(--body)', cursor: 'pointer' }}>
                <input type="checkbox" checked={noTime} onChange={e => { setNoTime(e.target.checked); if (e.target.checked) setFormData(p => ({ ...p, hora_nascimento: '' })); }} style={{ accentColor: '#ec4899' }} />
                Não sei
              </label>
            </div>
            <input type="time" disabled={noTime} style={{ ...inputStyle('hora'), opacity: noTime ? 0.45 : 1, cursor: noTime ? 'not-allowed' : 'text' }}
              value={formData.hora_nascimento}
              onChange={e => setFormData(p => ({ ...p, hora_nascimento: e.target.value }))}
              onFocus={() => setFocused('hora')} onBlur={() => setFocused('')}
            />
          </div>
          <div>
            <label style={labelStyle}>Local (opcional)</label>
            <input type="text" placeholder="Ex: Vitória - ES" style={inputStyle('local')}
              value={formData.local_nascimento}
              onChange={e => setFormData(p => ({ ...p, local_nascimento: e.target.value }))}
              onFocus={() => setFocused('local')} onBlur={() => setFocused('')}
            />
          </div>
        </div>

        <div style={{ background: 'rgba(17,7,32,0.35)', border: '1px solid rgba(216,180,254,0.1)', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, color: 'rgba(216,180,254,0.75)', fontFamily: 'var(--body)', margin: 0 }}>
            💡 Hora e local melhoram a precisão, mas você já recebe o mapa sem eles.
          </p>
        </div>

        <div style={{ paddingTop: 10, borderTop: '1px solid rgba(216,180,254,0.1)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,158,11,0.95)', fontFamily: 'var(--display)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Personalize sua leitura · 30 seg
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Objetivo principal</label>
              <select style={selectStyle} value={formData.objetivo_principal}
                onChange={e => setFormData(p => ({ ...p, objetivo_principal: e.target.value }))}>
                <option value="">Selecionar</option>
                {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Relacionamento</label>
              <select style={selectStyle} value={formData.relacao_status}
                onChange={e => setFormData(p => ({ ...p, relacao_status: e.target.value }))}>
                <option value="">Selecionar</option>
                {STATUS_RELACIONAMENTO.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Situação de trabalho</label>
            <select style={selectStyle} value={formData.trabalho_status}
              onChange={e => setFormData(p => ({ ...p, trabalho_status: e.target.value }))}>
              <option value="">Selecionar</option>
              {STATUS_TRABALHO.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={onNext} disabled={!canProceed || loading}
        style={{
          width: '100%', marginTop: 18, padding: '16px 18px', borderRadius: 999, border: 'none',
          cursor: canProceed && !loading ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'white',
          background: canProceed && !loading ? 'linear-gradient(90deg,#ec4899,#7c3aed)' : 'rgba(100,60,140,0.4)',
          boxShadow: canProceed && !loading ? '0 14px 40px rgba(236,72,153,0.22)' : 'none',
          opacity: canProceed && !loading ? 1 : 0.65,
          transition: 'all 0.25s',
          position: 'relative', overflow: 'hidden',
        }}
        onMouseEnter={e => { if (canProceed && !loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(236,72,153,0.3)'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = canProceed ? '0 14px 40px rgba(236,72,153,0.22)' : 'none'; }}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            Gerando seu mapa...
          </span>
        ) : '✨ DESCOBRIR MEU MAPA AGORA'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(216,180,254,0.4)', marginTop: 8, fontFamily: 'var(--body)' }}>
        🔒 Dados protegidos e usados apenas para gerar seu mapa
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  // Flow state
  // phase: 'hero' | 'quiz' | 'email' | 'birth'
  const [phase, setPhase] = useState('hero');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);

  const [formData, setFormData] = useLocalStorage('mapa_form_v3', {
    nome: '', email: '',
    data_nascimento: '', hora_nascimento: '', local_nascimento: '',
    objetivo_principal: '', relacao_status: '', trabalho_status: '',
  });
  const [noTime, setNoTime] = useLocalStorage('mapa_notime_v3', false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const formRef = useRef(null);

  const firstName = useMemo(() => {
    const n = (formData.nome || '').trim().split(' ')[0];
    return n?.length >= 2 ? n : '';
  }, [formData.nome]);

  // Scroll to form
  const goToForm = useCallback(() => {
    setPhase('quiz');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  // Quiz answer
  const handleQuizAnswer = useCallback((answerIndex) => {
    const next = [...quizAnswers, answerIndex];
    setQuizAnswers(next);
    if (quizStep < QUIZ_STEPS.length - 1) {
      setQuizStep(s => s + 1);
    } else {
      setPhase('email');
    }
  }, [quizAnswers, quizStep]);

  // Email capture done
  const handleEmailDone = useCallback(({ nome, email }) => {
    setFormData(p => ({ ...p, nome, email }));
    // Track email capture immediately
    try { window?.gtag?.('event', 'lead_email_captured', { event_category: 'lead' }); } catch {}
    setPhase('birth');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [setFormData]);

  // Final submit
  const handleSubmit = useCallback(async () => {
    setErro('');
    const data = String(formData.data_nascimento || '').trim();
    if (!data) { setErro('Selecione sua data de nascimento para gerar o mapa.'); return; }

    const payload = {
      ...formData,
      hora_nascimento: noTime ? '' : formData.hora_nascimento,
      noTime,
      quiz_answers: quizAnswers,
    };

    setLoading(true);
    try {
      try { window?.gtag?.('event', 'lead_submit', { event_category: 'lead', event_label: 'mapa_gratis' }); } catch {}
      try { window?.fbq?.('track', 'Lead'); } catch {}

      const response = await fetch('/api/gerar-analise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const ct = response.headers.get('content-type') || '';
      const dataResp = ct.includes('application/json') ? await response.json() : { error: await response.text() };

      if (!response.ok) {
        throw new Error(dataResp?.details || dataResp?.error || 'Falha ao gerar análise.');
      }
      if (!dataResp?.id) throw new Error('A API não retornou um ID.');

      router.push(`/resultado/${dataResp.id}`);
    } catch (err) {
      setErro(err?.message || 'Instabilidade temporária. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }, [formData, noTime, quizAnswers, router]);

  // Progress bar value
  const progress = useMemo(() => {
    if (phase === 'hero') return 0;
    if (phase === 'quiz') return Math.round(((quizStep + 1) / (QUIZ_STEPS.length + 2)) * 100);
    if (phase === 'email') return Math.round(((QUIZ_STEPS.length + 1) / (QUIZ_STEPS.length + 2)) * 100);
    // birth: based on fields
    const fields = ['data_nascimento'];
    const optional = [!noTime && formData.hora_nascimento, formData.local_nascimento, formData.objetivo_principal, formData.relacao_status, formData.trabalho_status].filter(Boolean).length;
    const filled = fields.filter(k => formData[k]).length;
    return Math.min(99, 80 + Math.round((filled + optional * 0.5) / (1 + 2.5) * 19));
  }, [phase, quizStep, formData, noTime]);

  const phaseLabel = {
    hero: '', quiz: `Pergunta ${quizStep + 1} de ${QUIZ_STEPS.length}`,
    email: 'Quase lá!', birth: 'Ativando seu mapa...',
  }[phase];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        :root {
          --display: 'Cinzel', serif;
          --body: 'EB Garamond', serif;
          --pink: #ec4899;
          --purple: #7c3aed;
          --gold: #f59e0b;
          --bg: #0e0520;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { max-width: 100%; overflow-x: hidden; }
        body {
          font-family: var(--body);
          color: rgba(243,232,255,0.96);
          background: var(--bg);
          line-height: 1.6;
          min-height: 100vh;
        }

        /* Nebula background */
        body::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 120% 60% at 50% -10%, rgba(147,51,234,0.28) 0%, transparent 55%),
            radial-gradient(ellipse 80% 50% at 80% 80%, rgba(236,72,153,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 10% 60%, rgba(124,58,237,0.1) 0%, transparent 50%),
            linear-gradient(180deg, #0e0520 0%, #18072e 50%, #0e0520 100%);
        }

        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.035)} }
        @keyframes shimmer { 0%{transform:translateX(-150%) skewX(-20deg)} 100%{transform:translateX(250%) skewX(-20deg)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes orb { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.08) rotate(180deg)} }
        @keyframes progressPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }

        .shimmer::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
          animation: shimmer 2.2s infinite;
        }
        .pulse-anim { animation: pulse 2.5s ease-in-out infinite; }

        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7) sepia(0.5) hue-rotate(240deg);
          cursor: pointer;
        }
        input[type="date"], input[type="time"] { color-scheme: dark; }
        input::placeholder { color: rgba(216,180,254,0.35); }
        select option { background: #18072e; color: rgba(243,232,255,0.97); }

        .ctr { width:100%; max-width:1100px; margin:0 auto; padding:0 20px; }
        .ctr-sm { width:100%; max-width:680px; margin:0 auto; padding:0 20px; }

        /* Sticky mobile CTA */
        .sticky-cta {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 900;
          padding: 10px 16px 14px;
          background: rgba(14,5,32,0.88); backdrop-filter: blur(16px);
          border-top: 1px solid rgba(216,180,254,0.1);
          display: none;
        }
        @media(max-width:767px){ .sticky-cta{ display:block } }

        @media(max-width:640px){
          .hero-title { font-size: clamp(28px,7.5vw,44px) !important; }
          .hero-sub { font-size: 17px !important; }
          .proof-badges { gap: 8px !important; }
          .proof-badge { font-size: 12px !important; padding: 7px 10px !important; }
        }
      `}</style>

      <Stars count={typeof window !== 'undefined' && window.innerWidth < 768 ? 50 : 110} />

      {/* ── STICKY MOBILE CTA ── */}
      {phase === 'hero' && (
        <div className="sticky-cta">
          <button onClick={goToForm} style={{
            width: '100%', padding: '14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'white',
            background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
            boxShadow: '0 8px 30px rgba(236,72,153,0.25)',
          }}>
            ✨ Descobrir meu mapa — grátis
          </button>
        </div>
      )}

      {/* ────────────────────────── HERO ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,96px) 0 clamp(36px,5vh,60px)', minHeight: '78vh', display: 'flex', alignItems: 'center' }}>
        <div className="ctr" style={{ textAlign: 'center' }}>

          {/* Trust badge */}
          <FadeIn delay={0}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 999,
              border: '1px solid rgba(216,180,254,0.15)', background: 'rgba(14,5,32,0.4)', backdropFilter: 'blur(10px)',
              color: 'rgba(216,180,254,0.88)', fontSize: 13, fontFamily: 'var(--body)',
              marginBottom: 22,
            }}>
              🔒 Privado · Sem spam · Resultado em minutos
            </div>
          </FadeIn>

          {/* Title */}
          <FadeIn delay={0.08}>
            <h1 className="hero-title" style={{
              fontFamily: 'var(--display)', fontWeight: 700,
              fontSize: 'clamp(34px,4.8vw,60px)', lineHeight: 1.1,
              marginBottom: 18,
              background: 'linear-gradient(110deg, #fb7185 0%, #c084fc 45%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Se você sente que algo te trava,<br />
              existe um padrão invisível<br />
              por trás disso.
            </h1>
          </FadeIn>

          {/* Sub */}
          <FadeIn delay={0.16}>
            <p className="hero-sub" style={{
              fontSize: 'clamp(17px,2vw,22px)', color: 'rgba(233,213,255,0.88)',
              maxWidth: 680, margin: '0 auto 24px', fontFamily: 'var(--body)', lineHeight: 1.6,
            }}>
              Descubra em minutos por que você repete ciclos, o que está te travando de verdade e qual é o seu próximo passo.
            </p>
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={0.22}>
            <SocialProof />
          </FadeIn>

          {/* Proof badges */}
          <FadeIn delay={0.28}>
            <div className="proof-badges" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              {['⭐ Clareza imediata', '⚡ Resultado em minutos', '✨ Leitura personalizada'].map(b => (
                <span key={b} className="proof-badge" style={{
                  padding: '9px 14px', borderRadius: 999, fontSize: 13, fontFamily: 'var(--body)',
                  border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(14,5,32,0.3)', backdropFilter: 'blur(8px)',
                  color: 'rgba(216,180,254,0.92)',
                }}>
                  {b}
                </span>
              ))}
            </div>
          </FadeIn>

          {/* Main CTA */}
          <FadeIn delay={0.34}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              {/* Glow */}
              <div style={{ position: 'absolute', inset: -2, borderRadius: 999, background: 'linear-gradient(90deg,#ec4899,#7c3aed)', filter: 'blur(16px)', opacity: 0.45, zIndex: -1, animation: 'pulse 2.5s ease-in-out infinite' }} />
              <button onClick={goToForm} className="shimmer pulse-anim" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: 'clamp(14px,2.5vw,18px) clamp(28px,4vw,44px)',
                borderRadius: 999, border: '1.5px solid rgba(236,72,153,0.3)', cursor: 'pointer',
                fontFamily: 'var(--display)', fontWeight: 700,
                fontSize: 'clamp(16px,2vw,20px)', color: 'white',
                background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                boxShadow: '0 16px 50px rgba(236,72,153,0.25)',
                position: 'relative', overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 22px 60px rgba(236,72,153,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 16px 50px rgba(236,72,153,0.25)'; }}
              >
                ✨ QUERO DESCOBRIR MEU MAPA AGORA →
              </button>
            </div>
          </FadeIn>

          {/* Urgency */}
          <FadeIn delay={0.42}>
            <div style={{
              display: 'inline-flex', gap: 10, alignItems: 'center', marginTop: 20,
              padding: '11px 18px', borderRadius: 16,
              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(127,29,29,0.12)',
              color: 'rgba(254,202,202,0.9)', fontSize: 14, fontFamily: 'var(--body)',
            }}>
              🔥 <div style={{ textAlign: 'left' }}>
                <strong>Seu mapa gratuito está disponível hoje</strong>
                <div style={{ opacity: 0.8, fontSize: 13 }}>O acesso pode ser encerrado a qualquer momento para novos pedidos</div>
              </div>
            </div>
          </FadeIn>

          {/* Bottom badges */}
          <FadeIn delay={0.48}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
              {['🧠 Sem linguagem complicada', '⚡ Com próximos passos práticos', '🔐 Privado e personalizado'].map(b => (
                <span key={b} style={{
                  padding: '7px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--body)',
                  border: '1px solid rgba(216,180,254,0.1)', background: 'rgba(14,5,32,0.2)',
                  color: 'rgba(216,180,254,0.8)',
                }}>
                  {b}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────────────────────── FORM SECTION ────────────────────────── */}
      <section id="formulario" ref={formRef} style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0 clamp(48px,8vh,96px)' }}>
        <div className="ctr-sm">

          {/* Section header */}
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,42px)', color: 'rgba(243,232,255,0.97)', marginBottom: 10 }}>
                {firstName ? `Seu mapa personalizado, ${firstName}` : 'Seu mapa personalizado'}
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)' }}>
                Leva menos de 2 minutos · Resultado imediato na tela
              </p>
            </div>
          </FadeIn>

          {/* Trigger card (only show before quiz starts) */}
          {phase === 'hero' && (
            <FadeIn delay={0.1}>
              <div style={{
                textAlign: 'center', padding: '26px 28px', borderRadius: 22, marginBottom: 20,
                background: 'linear-gradient(145deg,rgba(124,58,237,0.14),rgba(14,5,32,0.55))',
                border: '1px solid rgba(236,72,153,0.25)', backdropFilter: 'blur(10px)',
              }}>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, marginBottom: 14, color: 'rgba(243,232,255,0.97)' }}>
                  Se você sente que:
                </p>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginBottom: 16 }}>
                  {['repete ciclos mesmo tentando mudar', 'trava justo quando precisa avançar', 'sente que poderia estar muito mais à frente'].map(t => (
                    <li key={t} style={{ fontSize: 17, color: 'rgba(233,213,255,0.9)', fontFamily: 'var(--body)' }}>{t}</li>
                  ))}
                </ul>
                <span style={{
                  display: 'inline-block', padding: '10px 18px', borderRadius: 999,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                  color: 'rgba(245,158,11,0.98)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--body)',
                }}>
                  Seu mapa pode mostrar o que está por trás disso.
                </span>
              </div>
            </FadeIn>
          )}

          {/* Form card */}
          <FadeIn delay={0.15}>
            <div style={{
              borderRadius: 24, padding: 'clamp(22px,4vw,36px)',
              background: 'linear-gradient(145deg,rgba(124,58,237,0.14),rgba(14,5,32,0.65))',
              border: '1px solid rgba(236,72,153,0.3)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorative orb */}
              <div style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%)', pointerEvents: 'none', animation: 'orb 8s ease-in-out infinite' }} />

              {/* Progress bar (only in form phases) */}
              {phase !== 'hero' && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(216,180,254,0.75)', fontFamily: 'var(--body)' }}>
                      {phaseLabel}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,158,11,0.95)', fontFamily: 'var(--display)', animation: 'progressPulse 1.5s ease-in-out infinite' }}>
                      {progress}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'rgba(14,5,32,0.5)', overflow: 'hidden', border: '1px solid rgba(216,180,254,0.08)' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, transition: 'width 0.5s ease',
                      background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                      width: `${progress}%`,
                      boxShadow: '0 0 12px rgba(236,72,153,0.4)',
                    }} />
                  </div>
                </div>
              )}

              {/* Phase: HERO (show start quiz CTA) */}
              {phase === 'hero' && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 20 }}>
                    Responda 3 perguntas rápidas e receba seu mapa personalizado
                  </p>
                  <div style={{ display: 'inline-block', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -3, borderRadius: 999, background: 'linear-gradient(90deg,#ec4899,#7c3aed)', filter: 'blur(14px)', opacity: 0.4, zIndex: -1, animation: 'pulse 2.5s ease-in-out infinite' }} />
                    <button onClick={goToForm} className="shimmer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10,
                      padding: '15px 36px', borderRadius: 999, border: '1.5px solid rgba(236,72,153,0.3)',
                      cursor: 'pointer', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'white',
                      background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                      boxShadow: '0 14px 40px rgba(236,72,153,0.22)',
                      position: 'relative', overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 55px rgba(236,72,153,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 14px 40px rgba(236,72,153,0.22)'; }}
                    >
                      ✨ QUERO DESCOBRIR MEU MAPA AGORA →
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(216,180,254,0.4)', marginTop: 12, fontFamily: 'var(--body)' }}>
                    🔒 100% gratuito · privado · sem cartão
                  </p>
                </div>
              )}

              {/* Phase: QUIZ */}
              {phase === 'quiz' && (
                <QuizStep
                  key={quizStep}
                  step={QUIZ_STEPS[quizStep]}
                  stepIndex={quizStep}
                  totalSteps={QUIZ_STEPS.length}
                  onAnswer={handleQuizAnswer}
                  visible={true}
                />
              )}

              {/* Phase: EMAIL */}
              {phase === 'email' && (
                <EmailStep quizAnswers={quizAnswers} onNext={handleEmailDone} />
              )}

              {/* Phase: BIRTH */}
              {phase === 'birth' && (
                <BirthStep
                  nome={firstName || formData.nome}
                  formData={formData}
                  setFormData={setFormData}
                  noTime={noTime}
                  setNoTime={setNoTime}
                  onNext={handleSubmit}
                  loading={loading}
                  erro={erro}
                />
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────────────────────── O QUE VOCÊ RECEBE ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0' }}>
        <div className="ctr">
          <FadeIn>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', marginBottom: 10, color: 'rgba(243,232,255,0.97)' }}>
              O que seu mapa vai te mostrar
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 32 }}>
              Clareza + direção prática para a sua próxima fase.
            </p>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, maxWidth: 900, margin: '0 auto' }}>
            {[
              { num: '01', title: 'Seu padrão central', desc: 'O que mais se repete na sua vida hoje — e por que isso continua acontecendo.' },
              { num: '02', title: 'Seus talentos naturais', desc: 'Os dons e forças que você já tem, mas talvez ainda não esteja usando do jeito certo.' },
              { num: '03', title: 'Seu bloqueio principal', desc: 'O ponto que mais drena sua energia e atrasa seus resultados hoje.' },
              { num: '04', title: 'Seu próximo passo', desc: 'Uma direção prática e personalizada para você sair do lugar com mais clareza.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{
                  borderRadius: 20, padding: '22px 24px',
                  border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(14,5,32,0.35)', backdropFilter: 'blur(10px)',
                  transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-5px)'; el.style.borderColor = 'rgba(236,72,153,0.4)'; el.style.boxShadow = '0 20px 50px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.transform = ''; el.style.borderColor = 'rgba(216,180,254,0.12)'; el.style.boxShadow = ''; }}
                >
                  <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 900, color: 'rgba(245,158,11,0.2)', lineHeight: 1, marginBottom: 8 }}>{item.num}</div>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'rgba(245,158,11,0.95)', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: 'rgba(216,180,254,0.88)', fontFamily: 'var(--body)', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button onClick={goToForm} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 999,
                border: '1px solid rgba(236,72,153,0.3)', cursor: 'pointer',
                fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'white',
                background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                boxShadow: '0 12px 36px rgba(236,72,153,0.18)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(236,72,153,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 36px rgba(236,72,153,0.18)'; }}
              >
                Quero gerar o meu mapa agora ✨
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────────────────────── O QUE VOCÊ VAI DESCOBRIR ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0', background: 'rgba(31,10,56,0.3)' }}>
        <div className="ctr">
          <FadeIn>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', marginBottom: 10, color: 'rgba(243,232,255,0.97)' }}>
              O que você vai descobrir
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 32 }}>
              Um mapa que traduz sua essência em clareza e próximos passos.
            </p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, maxWidth: 960, margin: '0 auto' }}>
            {[
              { icon: '🔮', title: 'Propósito', desc: 'Clareza sobre sua missão e o que sua alma veio aprender.' },
              { icon: '⚡', title: 'Dons', desc: 'Talentos naturais para destravar resultados reais.' },
              { icon: '💫', title: 'Bloqueios', desc: 'Padrões que te puxam para trás — e como ajustar.' },
              { icon: '🌟', title: 'Relacionamentos', desc: 'Como você se conecta — e o ajuste que eleva sua escolha.' },
              { icon: '💎', title: 'Abundância', desc: 'Um caminho mais alinhado para prosperidade e consistência.' },
              { icon: '🦋', title: 'Transformação', desc: 'Um plano simples para você sentir evolução real.' },
            ].map((b, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div style={{
                  borderRadius: 18, padding: '20px 18px', textAlign: 'center',
                  border: '1px solid rgba(216,180,254,0.1)', background: 'rgba(14,5,32,0.3)', backdropFilter: 'blur(8px)',
                  transition: 'transform 0.25s, border-color 0.25s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(216,180,254,0.1)'; }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{b.icon}</div>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'rgba(245,158,11,0.95)', marginBottom: 6 }}>{b.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(216,180,254,0.85)', fontFamily: 'var(--body)', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── TESTIMONIALS ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0' }}>
        <div className="ctr">
          <FadeIn>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', marginBottom: 10, color: 'rgba(243,232,255,0.97)' }}>
              Relatos de quem já fez o mapa
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 32 }}>
              Pessoas reais. Clareza real.
            </p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, maxWidth: 960, margin: '0 auto' }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{
                  borderRadius: 20, padding: '22px 24px',
                  border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(14,5,32,0.35)', backdropFilter: 'blur(10px)',
                }}>
                  <p style={{ fontSize: 16, fontStyle: 'italic', color: 'rgba(243,232,255,0.92)', fontFamily: 'var(--body)', lineHeight: 1.6, marginBottom: 16 }}>
                    {t.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg,#ec4899,#7c3aed)',
                      fontWeight: 800, fontSize: 15, color: 'white', fontFamily: 'var(--display)',
                    }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'rgba(245,158,11,0.95)', fontSize: 14, fontFamily: 'var(--body)' }}>{t.name}</div>
                      <div style={{ color: 'rgba(245,158,11,0.85)', fontSize: 13 }}>{'⭐'.repeat(t.stars)}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button onClick={goToForm} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 999,
                border: '1px solid rgba(236,72,153,0.3)', cursor: 'pointer',
                fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'white',
                background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                boxShadow: '0 12px 36px rgba(236,72,153,0.18)', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(236,72,153,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 36px rgba(236,72,153,0.18)'; }}
              >
                Gerar meu mapa agora ✨
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────────────────────── OFERTA GRÁTIS ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0', background: 'rgba(31,10,56,0.35)' }}>
        <div className="ctr">
          <FadeIn>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', borderRadius: 24, padding: 'clamp(28px,4vw,44px)', border: '1px solid rgba(216,180,254,0.14)', background: 'rgba(14,5,32,0.45)', backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -50, fontSize: 160, opacity: 0.06, animation: 'orb 20s linear infinite', pointerEvents: 'none' }}>⭐</div>
              <span style={{ display: 'inline-block', padding: '9px 16px', borderRadius: 999, background: 'rgba(245,158,11,0.95)', color: 'rgba(14,5,32,1)', fontWeight: 900, fontFamily: 'var(--display)', letterSpacing: 1, marginBottom: 14, fontSize: 14 }}>
                🎁 GRÁTIS AGORA
              </span>
              <div style={{ color: 'rgba(216,180,254,0.6)', fontSize: 18, textDecoration: 'line-through', fontFamily: 'var(--body)' }}>Valor simbólico: R$ 97,00</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 'clamp(44px,8vw,72px)', color: 'rgba(245,158,11,0.95)', marginTop: 4, lineHeight: 1 }}>
                Hoje: gratuito
              </div>
              <p style={{ marginTop: 16, color: 'rgba(233,213,255,0.88)', fontSize: 16, fontFamily: 'var(--body)', lineHeight: 1.55 }}>
                Você vê sua leitura primeiro. Só avança se fizer sentido.<br />
                <span style={{ color: 'rgba(216,180,254,0.7)' }}>Leva menos de 2 minutos.</span>
              </p>
              <div style={{ marginTop: 22 }}>
                <button onClick={goToForm} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999,
                  border: '1px solid rgba(236,72,153,0.3)', cursor: 'pointer',
                  fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'white',
                  background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                  boxShadow: '0 12px 36px rgba(236,72,153,0.2)', transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(236,72,153,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 36px rgba(236,72,153,0.2)'; }}
                >
                  Quero meu mapa grátis agora ✨
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────────────────────── FAQ ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0' }}>
        <div className="ctr">
          <FadeIn>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', marginBottom: 10, color: 'rgba(243,232,255,0.97)' }}>
              Perguntas frequentes
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 32 }}>
              Transparência total — sem pegadinha.
            </p>
          </FadeIn>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gap: 12 }}>
            {[
              { q: '📌 Como funciona o Mapa Espiritual?', a: 'Seu mapa combina Numerologia, Astrologia e uma leitura prática de padrões para te mostrar o que se repete, o que te trava e qual é o próximo passo mais alinhado para você.' },
              { q: '📌 É realmente grátis?', a: 'Sim. Seu mapa inicial é 100% gratuito. Depois de ver sua leitura, você decide com calma se quer desbloquear a versão completa.' },
              { q: '📌 Quanto tempo demora?', a: 'Menos de 2 minutos para preencher. O resultado aparece imediatamente na tela.' },
              { q: '📌 Preciso saber a hora de nascimento?', a: 'Não. Se souber, melhora a precisão — especialmente na leitura astrológica. Se não souber, você ainda recebe o mapa completo.' },
              { q: '📌 Meus dados estão seguros?', a: 'Sim. Seus dados são usados apenas para gerar o mapa. Você pode cancelar e-mails quando quiser.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div style={{ borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(14,5,32,0.3)', backdropFilter: 'blur(8px)' }}>
                  <p style={{ fontFamily: 'var(--display)', fontWeight: 700, color: 'rgba(245,158,11,0.95)', fontSize: 15, marginBottom: 8 }}>{item.q}</p>
                  <p style={{ color: 'rgba(216,180,254,0.88)', fontSize: 15, fontFamily: 'var(--body)', lineHeight: 1.6 }}>{item.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.35}>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button onClick={goToForm} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 999,
                border: '1px solid rgba(236,72,153,0.3)', cursor: 'pointer',
                fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'white',
                background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                boxShadow: '0 12px 36px rgba(236,72,153,0.18)', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(236,72,153,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 36px rgba(236,72,153,0.18)'; }}
              >
                ✨ Sim, quero descobrir agora
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────────────────────── FOOTER CTA ────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(48px,8vh,80px) 0', background: 'rgba(14,5,32,0.6)' }}>
        <div className="ctr">
          <FadeIn>
            <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(26px,3.5vw,44px)', marginBottom: 12, color: 'rgba(243,232,255,0.97)', lineHeight: 1.2 }}>
                O padrão que te trava não precisa continuar.<br />
                Descubra agora o que está por trás disso.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(216,180,254,0.8)', fontFamily: 'var(--body)', marginBottom: 24 }}>
                Gere seu mapa gratuito agora — é rápido e sem pressão.
              </p>
              <button onClick={goToForm} style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', borderRadius: 999,
                border: '1.5px solid rgba(236,72,153,0.3)', cursor: 'pointer',
                fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'white',
                background: 'linear-gradient(90deg,#ec4899,#7c3aed)',
                boxShadow: '0 14px 45px rgba(236,72,153,0.22)', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 22px 60px rgba(236,72,153,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 14px 45px rgba(236,72,153,0.22)'; }}
              >
                ✨ Quero descobrir meu mapa
              </button>
              <div style={{
                display: 'inline-flex', gap: 10, alignItems: 'center', marginTop: 18,
                padding: '11px 18px', borderRadius: 14,
                border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(127,29,29,0.1)',
                color: 'rgba(254,202,202,0.85)', fontSize: 14, fontFamily: 'var(--body)',
              }}>
                ⏰ <div style={{ textAlign: 'left' }}>
                  <strong>Hoje está gratuito para novos acessos</strong>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>Garanta o seu antes de sair do ar</div>
                </div>
              </div>
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(216,180,254,0.08)', color: 'rgba(216,180,254,0.4)', fontSize: 12, fontFamily: 'var(--body)' }}>
                🛡️ Seus dados são protegidos e usados apenas para gerar seu mapa.<br />
                Você pode cancelar comunicações por e-mail quando quiser.
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
