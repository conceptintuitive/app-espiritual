'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// ── FAQ accordion ────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <div className="faq-q" onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <span style={{ fontSize: 20, color: 'rgba(245,158,11,.8)', flexShrink: 0, transition: 'transform .25s ease', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    data_nascimento: '',
    hora_nascimento: '',
    local_nascimento: '',
    objetivo_principal: '',
    relacao_status: '',
    trabalho_status: '',
  });

  const [noTime, setNoTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [touched, setTouched] = useState({});
  const [focusHint, setFocusHint] = useState('');
  const [showSticky, setShowSticky] = useState(false);
  const [liveCount, setLiveCount] = useState(2847);

  const starsBuiltRef = useRef(false);

  const firstName = useMemo(() => {
    const n = (formData.nome || '').trim().split(' ')[0];
    return n?.length ? n : '';
  }, [formData.nome]);

  const emailLooksValid = useMemo(() => {
    const v = (formData.email || '').trim();
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [formData.email]);

  // Progress: starts at 0, caps at 99 before submit
  const completion = useMemo(() => {
    const required = ['nome', 'email', 'data_nascimento'];
    const filledRequired = required.filter((k) => String(formData[k] || '').trim().length > 0).length;
    const optionalFilled = [
      !noTime && String(formData.hora_nascimento || '').trim().length > 0,
      String(formData.local_nascimento || '').trim().length > 0,
    ].filter(Boolean).length;
    return Math.min(99, Math.round(((filledRequired + optionalFilled) / (required.length + 2)) * 100));
  }, [formData, noTime]);

  const canSubmit = useMemo(() => (
    String(formData.nome || '').trim().length >= 3 &&
    String(formData.email || '').trim().length > 0 &&
    emailLooksValid &&
    String(formData.data_nascimento || '').trim().length > 0 &&
    !loading
  ), [formData, emailLooksValid, loading]);

  // Restore saved fields
  useEffect(() => {
    try {
      const saved = localStorage.getItem('leadForm_v2');
      if (saved) setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      const savedNoTime = localStorage.getItem('leadForm_noTime_v2');
      if (savedNoTime) setNoTime(savedNoTime === '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('leadForm_v2', JSON.stringify(formData));
      localStorage.setItem('leadForm_noTime_v2', noTime ? '1' : '0');
    } catch {}
  }, [formData, noTime]);

  // Stars
  useEffect(() => {
    if (starsBuiltRef.current) return;
    starsBuiltRef.current = true;
    const container = document.getElementById('stars');
    if (!container) return;
    container.innerHTML = '';
    const count = window.innerWidth < 768 ? 60 : 130;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*4}s;opacity:${0.2+Math.random()*0.8};transform:scale(${0.5+Math.random()*1.8})`;
      container.appendChild(s);
    }
    return () => { if (container) container.innerHTML = ''; starsBuiltRef.current = false; };
  }, []);

  // Sticky CTA: show when form is not in viewport
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('formulario');
      if (!el) return;
      const { top, bottom } = el.getBoundingClientRect();
      setShowSticky(top > window.innerHeight || bottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Live counter
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.55) setLiveCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 9000);
    return () => clearInterval(t);
  }, []);

  const scrollToForm = () => {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'email' ? value.replace(/\s/g, '') : value }));
  };

  const onBlur = (e) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    const nome = String(formData.nome || '').trim();
    const email = String(formData.email || '').trim();
    const data = String(formData.data_nascimento || '').trim();
    if (nome.length < 3) { setErro('Por favor, preencha seu nome completo.'); return; }
    if (!email || !emailLooksValid) { setErro('Digite um e-mail válido para receber seu mapa.'); return; }
    if (!data) { setErro('Selecione sua data de nascimento para gerar o mapa.'); return; }

    const payload = { ...formData, hora_nascimento: noTime ? '' : formData.hora_nascimento, noTime };
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
      let dataResp = ct.includes('application/json')
        ? await response.json()
        : { error: 'Resposta não-JSON (provável erro no servidor).', rawText: await response.text() };

      if (!response.ok) {
        const msg = dataResp?.details || (dataResp?.code ? `${dataResp.error} (code: ${dataResp.code})` : null) || dataResp?.error || 'Falha ao gerar análise.';
        throw new Error(msg);
      }
      if (dataResp?.id) { router.push(`/resultado/${dataResp.id}`); return; }
      throw new Error('A API não retornou um ID. Verifique o /api/gerar-analise.');
    } catch (error) {
      setErro(error?.message || 'Ops! Tivemos uma instabilidade. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  const OBJETIVOS = ['Ter mais disciplina','Reduzir ansiedade','Melhorar autoestima','Atrair relacionamento saudável','Melhorar meu relacionamento atual','Crescer profissionalmente','Organizar minha rotina'];
  const STATUS_RELACIONAMENTO = ['Solteiro(a)','Ficando','Relacionamento instável','Namorando','Casado(a)'];
  const STATUS_TRABALHO = ['CLT','Empreendedor(a)','Autônomo(a)','Transição de carreira','Estudando'];

  const progressLabel = completion === 0
    ? 'Preencha para ativar seu mapa'
    : completion < 40 ? 'Começando...'
    : completion < 80 ? 'Quase lá, continue!'
    : 'Pronto para gerar! ✨';

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body { max-width:100%; overflow-x:hidden; }

        :root {
          --pink: #ec4899;
          --purple: #7c3aed;
          --gold: #f59e0b;
          --bg: #09041a;
          --D: 'Cinzel', serif;
          --B: 'Crimson Pro', serif;
        }

        body {
          font-family: var(--B);
          color: #f3e8ff;
          background: var(--bg);
          min-height: 100vh;
          line-height: 1.6;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 150% 65% at 50% -8%, rgba(124,58,237,.30) 0%, transparent 55%),
            radial-gradient(ellipse 70% 55% at 88% 88%, rgba(236,72,153,.13) 0%, transparent 55%),
            radial-gradient(ellipse 50% 45% at 4% 70%, rgba(99,44,210,.11) 0%, transparent 55%);
        }

        .stars { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
        .star  { position:absolute; width:2px; height:2px; background:rgba(255,255,255,.92); border-radius:50%; animation:twinkle 3.5s ease-in-out infinite; }

        @keyframes twinkle  { 0%,100%{opacity:.15} 50%{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.042)} }
        @keyframes shimmer  { 0%{transform:translateX(-160%) skewX(-22deg)} 100%{transform:translateX(200%) skewX(-22deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:none} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow     { 0%,100%{opacity:.38} 50%{opacity:.82} }
        @keyframes rotate   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .a1{animation:fadeDown .75s ease-out both}
        .a2{animation:fadeUp .75s .1s ease-out both}
        .a3{animation:fadeUp .75s .18s ease-out both}
        .a4{animation:fadeUp .75s .26s ease-out both}
        .a5{animation:fadeUp .75s .34s ease-out both}
        .a6{animation:fadeUp .75s .42s ease-out both}

        /* Hero specific */
        .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:999px; border:1px solid rgba(216,180,254,.14); background:rgba(9,4,26,.42); backdrop-filter:blur(10px); color:rgba(216,180,254,.88); font-size:14px; font-family:var(--B); margin-bottom:24px; }

        .hero-h1 { font-family:var(--D); font-weight:700; font-size:clamp(30px,4.8vw,58px); line-height:1.12; max-width:880px; margin:0 auto 20px; }
        .hero-h1 em { font-style:normal; background:linear-gradient(112deg,#fb7185 0%,#c084fc 50%,#f59e0b 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .hero-sub { font-size:clamp(17px,2vw,21px); color:rgba(233,213,255,.85); max-width:620px; margin:0 auto 28px; font-family:var(--B); line-height:1.65; }
        .hero-sub strong { color:rgba(243,232,255,.98); font-style:italic; }

        .cta-wrap { display:inline-flex; flex-direction:column; align-items:center; gap:10px; }
        .cta-microcopy { font-size:13px; color:rgba(216,180,254,.58); font-family:var(--B); }
        .cta-microcopy span { color:rgba(134,239,172,.75); }

        .urgency-pill {
          display:inline-flex; gap:8px; align-items:center;
          padding:10px 16px; border-radius:12px;
          border:1px solid rgba(239,68,68,.38); background:rgba(127,29,29,.18);
          color:rgba(254,202,202,.92); font-size:13px; font-family:var(--B);
          animation: fadeUp .75s .5s ease-out both;
        }
        .urgency-pill strong { color:rgba(254,202,202,1); }

        .scroll-hint { display:flex; flex-direction:column; align-items:center; gap:6px; margin-top:10px; color:rgba(216,180,254,.4); font-size:12px; font-family:var(--B); animation:float 2.5s ease-in-out infinite; }
        .scroll-hint svg { opacity:.4; }

        .proof-pills { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-bottom:28px; }
        .proof-pill  { padding:8px 14px; border-radius:999px; font-size:13px; font-family:var(--B); border:1px solid rgba(216,180,254,.11); background:rgba(9,4,26,.28); color:rgba(216,180,254,.88); }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }
        .live-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; display:inline-block; margin-right:5px; animation:blink 1.8s ease-in-out infinite; flex-shrink:0; }

        /* Layout */
        .ctr    { width:100%; max-width:1100px; margin:0 auto; padding:0 clamp(16px,4vw,28px); }
        .ctr-md { width:100%; max-width:790px;  margin:0 auto; padding:0 clamp(16px,4vw,28px); }

        /* Sections */
        .sec     { position:relative; z-index:10; padding:clamp(52px,9vh,96px) 0; }
        .sec-alt { background:rgba(25,8,46,.5); }
        .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(216,180,254,.1),transparent); }

        /* Typography */
        .sec-title { font-family:var(--D); font-weight:700; font-size:clamp(26px,3.2vw,42px); color:rgba(243,232,255,.97); text-align:center; margin-bottom:10px; }
        .sec-sub   { font-size:clamp(16px,1.8vw,19px); color:rgba(216,180,254,.82); text-align:center; margin-bottom:34px; font-family:var(--B); }
        .lbl       { display:block; font-size:15px; color:rgba(233,213,255,.82); margin-bottom:7px; font-family:var(--B); }
        .field-err { font-size:13px; color:rgba(254,202,202,.9); margin-top:5px; }

        /* Buttons */
        .btn-main {
          display:inline-flex; align-items:center; justify-content:center; gap:10px;
          padding:17px 38px; border-radius:999px; border:none; cursor:pointer;
          font-family:var(--D); font-weight:700; font-size:17px; color:#fff;
          background:linear-gradient(90deg,var(--pink),var(--purple));
          box-shadow:0 16px 50px rgba(236,72,153,.30),0 0 0 1px rgba(236,72,153,.18);
          position:relative; overflow:hidden;
          transition:transform .2s ease,box-shadow .2s ease;
          animation:pulse 2.8s ease-in-out infinite;
        }
        .btn-main::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent); transform:translateX(-160%) skewX(-22deg); animation:shimmer 2.4s ease-in-out infinite; }
        .btn-main:hover  { transform:translateY(-3px); box-shadow:0 24px 64px rgba(236,72,153,.40),0 0 0 1px rgba(236,72,153,.28); }

        .btn-sec {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          padding:13px 28px; border-radius:999px; border:1px solid rgba(236,72,153,.25); cursor:pointer;
          font-family:var(--D); font-weight:700; font-size:15px; color:#fff;
          background:linear-gradient(90deg,var(--pink),var(--purple));
          box-shadow:0 10px 32px rgba(236,72,153,.2);
          transition:transform .2s ease,box-shadow .2s ease;
        }
        .btn-sec:hover { transform:translateY(-2px); box-shadow:0 16px 44px rgba(236,72,153,.28); }

        /* Inputs */
        .inp {
          width:100%; padding:13px 16px; border-radius:14px; font-family:var(--B); font-size:17px;
          border:1px solid rgba(216,180,254,.18); background:rgba(9,4,26,.62); color:rgba(243,232,255,.97);
          outline:none; transition:border .2s,box-shadow .2s;
        }
        .inp:focus  { border-color:rgba(236,72,153,.72); box-shadow:0 0 0 4px rgba(236,72,153,.11); }
        .inp::placeholder { color:rgba(216,180,254,.3); }
        .inp:disabled     { opacity:.5; cursor:not-allowed; }
        .inp option       { background:#18072e; }
        input[type=date], input[type=time] { color-scheme:dark; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter:invert(.65) sepia(.5) hue-rotate(240deg); cursor:pointer; }
        select.inp { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(216,180,254,.5)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:40px; }

        /* Progress bar */
        .prog-track { height:8px; border-radius:999px; background:rgba(255,255,255,.07); overflow:hidden; border:1px solid rgba(216,180,254,.08); }
        .prog-fill  { height:100%; border-radius:999px; background:linear-gradient(90deg,var(--pink),var(--purple)); transition:width .45s ease; box-shadow:0 0 12px rgba(236,72,153,.38); }

        /* Glass cards */
        .card {
          border-radius:20px; padding:clamp(16px,3vw,24px);
          border:1px solid rgba(216,180,254,.11); background:rgba(9,4,26,.32);
          backdrop-filter:blur(12px);
          transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease;
        }
        .card:hover { transform:translateY(-5px); border-color:rgba(236,72,153,.28); box-shadow:0 22px 56px rgba(0,0,0,.32); }

        /* Form card */
        .form-card {
          max-width:760px; margin:0 auto; border-radius:26px;
          padding:clamp(22px,4.5vw,40px);
          background:linear-gradient(145deg,rgba(124,58,237,.15),rgba(9,4,26,.72));
          border:1px solid rgba(236,72,153,.32);
          box-shadow:0 30px 84px rgba(0,0,0,.48),inset 0 0 0 1px rgba(236,72,153,.07);
          position:relative; overflow:hidden;
        }
        .form-card::before { content:'✦'; position:absolute; right:-30px; top:-40px; font-size:190px; opacity:.05; transform:rotate(14deg); pointer-events:none; color:#ec4899; }

        /* Trigger card */
        .trigger {
          max-width:680px; margin:0 auto 20px; text-align:center;
          padding:clamp(18px,3.5vw,26px) clamp(16px,4vw,30px); border-radius:22px;
          background:radial-gradient(ellipse at top,rgba(236,72,153,.1),transparent 55%),linear-gradient(145deg,rgba(124,58,237,.14),rgba(9,4,26,.62));
          border:1px solid rgba(236,72,153,.2); backdrop-filter:blur(10px);
          position:relative; overflow:hidden;
        }
        .trigger::after { content:'✦'; position:absolute; top:-12px; right:12px; font-size:56px; color:rgba(255,255,255,.05); transform:rotate(12deg); pointer-events:none; }

        /* Error */
        .err-box { border-radius:14px; border:1px solid rgba(239,68,68,.4); background:rgba(127,29,29,.22); padding:12px 16px; color:rgba(254,202,202,.97); font-size:15px; font-family:var(--B); margin-bottom:18px; }

        /* Submit */
        .sub-btn {
          width:100%; margin-top:6px; padding:17px; border-radius:999px; border:none; cursor:pointer;
          font-family:var(--D); font-weight:800; font-size:18px; color:#fff;
          background:linear-gradient(90deg,var(--pink),var(--purple));
          box-shadow:0 16px 52px rgba(236,72,153,.26);
          position:relative; overflow:hidden;
          transition:transform .2s ease,box-shadow .2s ease,opacity .2s ease;
        }
        .sub-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent); transform:translateX(-160%) skewX(-22deg); animation:shimmer 2.2s ease-in-out infinite; }
        .sub-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 22px 62px rgba(236,72,153,.34); }
        .sub-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
        .sub-btn:disabled::after { display:none; }

        /* Spinner */
        .spin { display:inline-block; width:18px; height:18px; border-radius:50%; border:2px solid rgba(255,255,255,.25); border-top-color:#fff; animation:spin .7s linear infinite; }

        /* Hint */
        .hint { border-radius:13px; border:1px solid rgba(216,180,254,.11); background:rgba(9,4,26,.28); padding:11px 14px; font-size:14px; color:rgba(233,213,255,.8); font-family:var(--B); }

        /* FAQ */
        .faq-item { border-radius:15px; border:1px solid rgba(216,180,254,.11); background:rgba(9,4,26,.3); overflow:hidden; margin-bottom:10px; }
        .faq-q    { padding:16px 20px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px; font-family:var(--D); font-weight:700; font-size:15px; color:rgba(245,158,11,.95); user-select:none; }
        .faq-q:hover { background:rgba(255,255,255,.025); }
        .faq-a    { padding:0 20px 16px; font-size:16px; color:rgba(216,180,254,.88); font-family:var(--B); line-height:1.65; }

        /* Testimonial */
        .testi { border-radius:20px; padding:22px 24px; border:1px solid rgba(216,180,254,.11); background:rgba(9,4,26,.32); backdrop-filter:blur(12px); }

        /* Urgency box */
        .urgency { display:inline-flex; gap:10px; align-items:center; padding:11px 18px; border-radius:13px; border:1px solid rgba(239,68,68,.28); background:rgba(127,29,29,.13); color:rgba(254,202,202,.9); font-size:14px; font-family:var(--B); }

        /* Sticky CTA */
        .sticky { position:fixed; bottom:0; left:0; right:0; z-index:900; padding:10px 16px 16px; background:rgba(9,4,26,.92); backdrop-filter:blur(18px); border-top:1px solid rgba(216,180,254,.09); transition:transform .35s ease,opacity .35s ease; }
        .sticky.off { transform:translateY(105%); opacity:0; pointer-events:none; }
        @media(min-width:768px) { .sticky { display:none !important; } }

        /* Avatar stack */
        .av-stack { display:flex; }
        .av { width:28px; height:28px; border-radius:50%; border:2px solid var(--bg); margin-left:-7px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff; font-family:var(--D); flex-shrink:0; }
        .av:first-child { margin-left:0; }

        /* Grids */
        .g2 { display:grid; grid-template-columns:1fr; gap:14px; }
        .g3 { display:grid; grid-template-columns:1fr; gap:14px; }
        @media(min-width:600px)  { .g2 { grid-template-columns:1fr 1fr; } .g3 { grid-template-columns:1fr 1fr; } }
        @media(min-width:900px)  { .g3 { grid-template-columns:1fr 1fr 1fr; } }

        /* Pill tag */
        .pill { padding:7px 13px; border-radius:999px; font-size:13px; font-family:var(--B); border:1px solid rgba(216,180,254,.1); background:rgba(9,4,26,.28); color:rgba(216,180,254,.88); }

        @media(max-width:600px) {
          .btn-main { font-size:15px; padding:15px 22px; width:100%; animation:none; }
          .btn-sec  { font-size:14px; padding:12px 20px; }
          .sub-btn  { font-size:16px; }
        }
      `}</style>

      <div id="stars" className="stars" />

      {/* ── Sticky mobile CTA ───────────────────────────────────────────────── */}
      <div className={`sticky ${showSticky ? '' : 'off'}`}>
        <button className="btn-main" style={{ width: '100%', fontSize: 15, padding: '14px 20px', animation: 'none' }} onClick={scrollToForm}>
          ✨ Descobrir meu mapa — gratuito
        </button>
      </div>

      {/* ═══════════════════════ HERO ═══════════════════════════════════════ */}
      <section className="sec" style={{ minHeight: '72vh', display: 'flex', alignItems: 'center', paddingBottom: 'clamp(28px,4vh,44px)' }}>
        <div className="ctr" style={{ textAlign: 'center' }}>

          {/* Eyebrow — trust + live activity */}
          <div className="a1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <span className="hero-eyebrow" style={{ margin: 0 }}>
              🔒 Privado · Sem spam · Resultado em minutos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 14px', borderRadius: 999, border: '1px solid rgba(34,197,94,.22)', background: 'rgba(34,197,94,.07)', color: 'rgba(134,239,172,.9)', fontSize: 13, fontFamily: 'var(--B)', gap: 4 }}>
              <span className="live-dot" />
              <strong style={{ color: 'rgba(134,239,172,1)' }}>{liveCount.toLocaleString('pt-BR')}</strong>&nbsp;mapas gerados essa semana
            </span>
          </div>

          {/* H1 — sentence case, emocional, não grita */}
          <div className="a2">
            <h1 className="hero-h1" style={{ textAlign: 'center' }}>
              <em>Você tenta mudar,</em><br />
              mas volta para o mesmo lugar.<br />
              <span style={{ color: 'rgba(233,213,255,.88)', fontWeight: 400, fontSize: '0.78em' }}>Existe um padrão invisível por trás disso.</span>
            </h1>
          </div>

          {/* Sub — faz a pessoa se sentir vista */}
          <div className="a3">
            <p className="hero-sub">
              Em menos de 2 minutos, seu mapa revela <strong>por que você repete ciclos</strong>,
              o que está te travando de verdade e qual é o próximo passo concreto para sair daqui.
            </p>
          </div>

          {/* Social proof com avatars */}
          <div className="a3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            <div className="av-stack">
              {[['M','#ec4899,#a855f7'],['J','#f59e0b,#ef4444'],['R','#6366f1,#8b5cf6']].map(([l,g],i)=>(
                <div key={i} className="av" style={{ background:`linear-gradient(135deg,${g})` }}>{l}</div>
              ))}
            </div>
            <span style={{ fontSize: 14, color: 'rgba(216,180,254,.82)', fontFamily: 'var(--B)' }}>
              <strong style={{ color: 'rgba(243,232,255,.97)' }}>Marina, Julia e mais {(liveCount - 3).toLocaleString('pt-BR')}</strong> já descobriram o padrão delas
            </span>
          </div>

          {/* Proof pills */}
          <div className="a4 proof-pills">
            {[
              '⭐ Clareza em minutos',
              '🎯 Próximo passo concreto',
              '✨ Leitura 100% personalizada',
            ].map((b) => (
              <span key={b} className="proof-pill">{b}</span>
            ))}
          </div>

          {/* CTA block */}
          <div className="a5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

            {/* Glow + button */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
              <div style={{ position: 'absolute', inset: -5, borderRadius: 999, background: 'linear-gradient(90deg,#ec4899,#7c3aed)', filter: 'blur(22px)', opacity: .45, animation: 'glow 2.6s ease-in-out infinite', zIndex: -1 }} />
              <button className="btn-main" onClick={scrollToForm} style={{ fontSize: 'clamp(15px,2vw,18px)', padding: 'clamp(15px,2.5vw,18px) clamp(28px,4vw,46px)' }}>
                ✨ Quero descobrir meu mapa agora →
              </button>
            </div>

            {/* Microcopy embaixo do botão — remove hesitação */}
            <p style={{ fontSize: 13, color: 'rgba(216,180,254,.52)', fontFamily: 'var(--B)', margin: '2px 0 16px' }}>
              <span style={{ color: 'rgba(134,239,172,.7)' }}>Gratuito</span> · Sem cartão · Resultado imediato na tela
            </p>

            {/* Urgency — visível, com número */}
            <div style={{
              display: 'inline-flex', gap: 10, alignItems: 'center',
              padding: '11px 20px', borderRadius: 14,
              border: '1px solid rgba(239,68,68,.42)', background: 'rgba(127,29,29,.2)',
              color: 'rgba(254,202,202,.92)', fontSize: 13, fontFamily: 'var(--B)',
            }}>
              🔥
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: 13, color: 'rgba(254,202,202,1)' }}>
                  Apenas <span style={{ color: '#fca5a5' }}>47 acessos gratuitos</span> disponíveis hoje
                </strong>
                <span style={{ fontSize: 12, opacity: .82 }}>O acesso pode ser encerrado a qualquer momento</span>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 22, display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'rgba(216,180,254,.38)', fontSize:12, fontFamily:'var(--B)', animation:'float 2.5s ease-in-out infinite' }}>
            <span>preencha abaixo e veja seu mapa</span>
            <svg width="14" height="18" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1v14M2 11l6 6 6-6" stroke="rgba(216,180,254,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

        </div>
      </section>

      {/* ═══════════════════════ FORM ═══════════════════════════════════════ */}
      <section id="formulario" className="sec sec-alt" style={{ paddingTop: 'clamp(32px,4vh,48px)' }}>
        <div className="ctr-md">

          {/* Compact header */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h2 style={{ fontFamily: 'var(--D)', fontWeight: 700, fontSize: 'clamp(20px,2.8vw,32px)', color: 'rgba(243,232,255,.97)', marginBottom: 12 }}>
              {firstName ? `Seu mapa, ${firstName}` : 'Seu mapa personalizado'}
            </h2>
            <div style={{ display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              {[['🔢','Numerologia'],['♑','Astrologia'],['🧠','Neurociência'],['✨','Esoterismo']].map(([icon,label]) => (
                <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:999, fontSize:13, fontFamily:'var(--B)', border:'1px solid rgba(216,180,254,.16)', background:'rgba(124,58,237,.12)', color:'rgba(216,180,254,.9)' }}>
                  {icon} {label}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 14, color: 'rgba(216,180,254,.6)', fontFamily: 'var(--B)' }}>Preencha abaixo — leva menos de 1 minuto.</p>
          </div>

          {/* Form card */}
          <div className="form-card">

            {/* Method explainer strip inside card */}
            <div style={{ borderRadius:12, background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.2)', padding:'10px 14px', marginBottom:18, fontSize:13, color:'rgba(216,180,254,.82)', fontFamily:'var(--B)', lineHeight:1.5, textAlign:'center' }}>
              Seu mapa cruza <strong style={{color:'rgba(243,232,255,.95)'}}>Numerologia</strong>, <strong style={{color:'rgba(243,232,255,.95)'}}>Astrologia</strong>, <strong style={{color:'rgba(243,232,255,.95)'}}>Neurociência</strong> e <strong style={{color:'rgba(243,232,255,.95)'}}>Esoterismo</strong> para revelar o padrão invisível por trás dos seus ciclos.
            </div>

            {/* Smart progress bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: 'rgba(233,213,255,.78)', fontFamily: 'var(--B)' }}>{progressLabel}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,158,11,.95)', fontFamily: 'var(--D)' }}>{completion}%</span>
            </div>
            <div className="prog-track" style={{ marginBottom: 24 }}>
              <div className="prog-fill" style={{ width: `${completion}%` }} />
            </div>

            {/* Error */}
            {erro && (
              <div className="err-box">
                <strong>⚠️ {erro}</strong>
                <div style={{ marginTop: 4, opacity: .82, fontSize: 13 }}>Dica: confira e-mail e data de nascimento, depois tente novamente.</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 16 }}>

                {/* Nome */}
                <div>
                  <label className="lbl">Nome Completo *</label>
                  <input className="inp" type="text" name="nome" required placeholder="Ex: Maria da Silva"
                    value={formData.nome} onChange={handleChange} onBlur={onBlur}
                    onFocus={() => setFocusHint('Use seu nome completo — ele aparecerá na sua leitura personalizada.')}
                  />
                  {touched.nome && (formData.nome || '').trim().length > 0 && (formData.nome || '').trim().length < 3 && (
                    <div className="field-err">Digite seu nome completo.</div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="lbl">E-mail *</label>
                  <input className="inp" type="email" name="email" required placeholder="seu@email.com"
                    value={formData.email} onChange={handleChange} onBlur={onBlur}
                    onFocus={() => setFocusHint('Enviaremos seu mapa aqui. Você pode cancelar quando quiser — sem pressão.')}
                  />
                  {touched.email && !emailLooksValid && <div className="field-err">Digite um e-mail válido.</div>}
                </div>

                {/* Data + Hora */}
                <div className="g2">
                  <div>
                    <label className="lbl">Data de Nascimento *</label>
                    <input className="inp" type="date" name="data_nascimento" required
                      value={formData.data_nascimento} onChange={handleChange} onBlur={onBlur}
                      onFocus={() => setFocusHint('A data ativa a leitura do seu caminho de vida e ciclo atual.')}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <label className="lbl" style={{ margin: 0 }}>Hora de Nascimento</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(216,180,254,.78)', cursor: 'pointer', fontFamily: 'var(--B)', userSelect: 'none' }}>
                        <input type="checkbox" checked={noTime} style={{ accentColor: '#ec4899', cursor: 'pointer' }}
                          onChange={(e) => { setNoTime(e.target.checked); if (e.target.checked) setFormData((p) => ({ ...p, hora_nascimento: '' })); }}
                        />
                        Não sei
                      </label>
                    </div>
                    <input className="inp" type="time" name="hora_nascimento"
                      value={formData.hora_nascimento} onChange={handleChange} disabled={noTime}
                      style={noTime ? { opacity: .45, cursor: 'not-allowed' } : undefined}
                      onFocus={() => setFocusHint('Melhora a precisão astrológica — mas não é obrigatório.')}
                    />
                  </div>
                </div>

                {/* Local */}
                <div>
                  <label className="lbl">Local de Nascimento <span style={{ opacity: .55, fontSize: 13 }}>(opcional)</span></label>
                  <input className="inp" type="text" name="local_nascimento" placeholder="Ex: Vitória - ES"
                    value={formData.local_nascimento} onChange={handleChange}
                    onFocus={() => setFocusHint('Ajuda na leitura astrológica — você já recebe o mapa sem isso.')}
                  />
                </div>

                {/* Dynamic hint */}
                <div className="hint">
                  <span style={{ marginRight: 8 }}>💡</span>
                  {focusHint || 'Dica: hora e local aumentam a precisão, mas você já recebe o mapa mesmo sem eles.'}
                </div>

                <p style={{ fontSize: 14, color: 'rgba(233,213,255,.72)', fontFamily: 'var(--B)' }}>
                  Essas respostas deixam sua leitura mais precisa e útil para o momento que você está vivendo.
                </p>

                {/* Personalize section */}
                <div style={{ paddingTop: 18, borderTop: '1px solid rgba(216,180,254,.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <p style={{ fontFamily: 'var(--D)', fontWeight: 700, fontSize: 13, color: 'rgba(245,158,11,.95)', textTransform: 'uppercase', letterSpacing: .6 }}>Personalize sua leitura</p>
                    <span style={{ fontSize: 12, background: 'rgba(245,158,11,.09)', border: '1px solid rgba(245,158,11,.2)', color: 'rgba(245,158,11,.82)', padding: '2px 10px', borderRadius: 999, fontFamily: 'var(--B)' }}>30 segundos</span>
                  </div>
                  <div className="g2" style={{ marginBottom: 13 }}>
                    <div>
                      <label className="lbl">Objetivo principal</label>
                      <select className="inp" name="objetivo_principal" value={formData.objetivo_principal} onChange={handleChange}>
                        <option value="">Selecionar</option>
                        {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Status de relacionamento</label>
                      <select className="inp" name="relacao_status" value={formData.relacao_status} onChange={handleChange}>
                        <option value="">Selecionar</option>
                        {STATUS_RELACIONAMENTO.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="lbl">Status de trabalho</label>
                    <select className="inp" name="trabalho_status" value={formData.trabalho_status} onChange={handleChange}>
                      <option value="">Selecionar</option>
                      {STATUS_TRABALHO.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="sub-btn" disabled={!canSubmit}>
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                      <span className="spin" /> Gerando seu mapa...
                    </span>
                  ) : '✨ DESCOBRIR MEU MAPA AGORA'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(216,180,254,.65)', fontFamily: 'var(--B)', lineHeight: 1.5 }}>
                  🔒 Seus dados são protegidos e usados apenas para gerar seu mapa.<br />
                  Você pode cancelar e-mails quando quiser.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ O QUE SEU MAPA MOSTRA ══════════════════════ */}
      <section className="sec">
        <div className="ctr">
          <h2 className="sec-title">O que seu mapa vai te mostrar</h2>
          <p className="sec-sub">Clareza + direção prática para sua próxima fase.</p>
          <div style={{ maxWidth: 820, margin: '0 auto', borderRadius: 22, border: '1px solid rgba(216,180,254,.11)', background: 'rgba(9,4,26,.28)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
            {[
              { n: '01', title: 'Seu padrão central', desc: 'O que mais se repete na sua vida hoje — e por que isso continua acontecendo.' },
              { n: '02', title: 'Seus talentos naturais', desc: 'Os dons e forças que você já tem, mas talvez ainda não esteja usando do jeito certo.' },
              { n: '03', title: 'Seu bloqueio principal', desc: 'O ponto que mais drena sua energia e atrasa seus resultados hoje.' },
              { n: '04', title: 'Seu próximo passo', desc: 'Uma direção prática e personalizada para você sair do lugar com mais clareza.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 24px', borderBottom: i < arr.length - 1 ? '1px solid rgba(216,180,254,.06)' : 'none' }}>
                <div style={{ fontFamily: 'var(--D)', fontSize: 28, fontWeight: 900, color: 'rgba(245,158,11,.18)', lineHeight: 1, width: 50, flexShrink: 0 }}>{item.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--D)', fontSize: 17, fontWeight: 700, color: 'rgba(245,158,11,.95)', marginBottom: 5 }}>{item.title}</h3>
                  <p style={{ fontSize: 16, color: 'rgba(216,180,254,.86)', fontFamily: 'var(--B)', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: '18px 24px', background: 'rgba(245,158,11,.055)', borderTop: '1px solid rgba(245,158,11,.14)' }}>
              <p style={{ fontWeight: 700, color: 'rgba(245,158,11,.95)', fontFamily: 'var(--D)', fontSize: 14, marginBottom: 6 }}>✨ Depois, se fizer sentido para você</p>
              <p style={{ color: 'rgba(233,213,255,.86)', fontSize: 15, fontFamily: 'var(--B)', lineHeight: 1.6 }}>
                Você poderá desbloquear o <strong>Manual Completo</strong> com aprofundamento, plano prático, amor, dinheiro e calendário personalizado. Primeiro você vê seu mapa. Depois decide com calma.
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-sec" onClick={scrollToForm}>Quero gerar o meu mapa agora</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ O QUE VOCÊ VAI DESCOBRIR ═══════════════════ */}
      <section className="sec sec-alt">
        <div className="ctr">
          <h2 className="sec-title">O que você vai descobrir</h2>
          <p className="sec-sub">Um mapa que traduz sua essência em clareza e próximos passos.</p>
          <div className="g3">
            {[
              { icon: '🔮', title: 'Propósito', desc: 'Clareza sobre sua missão e o que sua alma veio aprender.' },
              { icon: '⚡', title: 'Dons', desc: 'Talentos naturais e como aplicar para destravar resultados.' },
              { icon: '💫', title: 'Bloqueios', desc: 'Padrões que te puxam para trás — e como ajustar com prática.' },
              { icon: '🌟', title: 'Relacionamentos', desc: 'Como você se conecta — e o ajuste que eleva sua escolha.' },
              { icon: '💎', title: 'Abundância', desc: 'Um caminho mais alinhado para prosperidade e consistência.' },
              { icon: '🦋', title: 'Transformação', desc: 'Um plano simples para você sentir evolução real.' },
            ].map((b, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{b.icon}</div>
                <h3 style={{ fontFamily: 'var(--D)', fontSize: 16, fontWeight: 700, color: 'rgba(245,158,11,.95)', marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 15, color: 'rgba(216,180,254,.86)', fontFamily: 'var(--B)', lineHeight: 1.55 }}>{b.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-sec" onClick={scrollToForm}>✨ Quero meu mapa grátis</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ TESTEMUNHOS ════════════════════════════════ */}
      <section className="sec">
        <div className="ctr">
          <h2 className="sec-title">Relatos de quem já fez o mapa</h2>
          <p className="sec-sub">Pessoas reais. Clareza real.</p>
          <div className="g3" style={{ maxWidth: 980, margin: '0 auto' }}>
            {[
              { av: 'M', name: 'Marina S., 34 anos · São Paulo', text: '"Parecia que alguém tinha traduzido exatamente o que eu estava vivendo. Primeira vez que senti clareza de verdade."' },
              { av: 'J', name: 'Julia M., 28 anos · Rio de Janeiro', text: '"Achei que seria genérico, mas foi muito mais específico do que eu esperava. Me fez entender um padrão que repetia há anos."' },
              { av: 'R', name: 'Roberto C., 41 anos · Belo Horizonte', text: '"Não ficou só no místico. Me deu clareza e um próximo passo real que consegui aplicar no mesmo dia."' },
            ].map((t, i) => (
              <div key={i} className="testi">
                <p style={{ fontSize: 17, fontStyle: 'italic', color: 'rgba(243,232,255,.93)', fontFamily: 'var(--B)', lineHeight: 1.65, marginBottom: 16 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff', fontFamily: 'var(--D)', flexShrink: 0 }}>{t.av}</div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'rgba(245,158,11,.95)', fontSize: 13, fontFamily: 'var(--B)' }}>{t.name}</p>
                    <p style={{ fontSize: 13 }}>⭐⭐⭐⭐⭐</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-sec" onClick={scrollToForm}>Gerar meu mapa agora</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ OFERTA ═════════════════════════════════════ */}
      <section className="sec sec-alt">
        <div className="ctr">
          <h2 className="sec-title">Gere seu mapa gratuitamente agora</h2>
          <p className="sec-sub">Hoje está gratuito para novos acessos.</p>
          <div style={{ maxWidth: 700, margin: '0 auto', borderRadius: 24, padding: 'clamp(26px,4vw,46px)', textAlign: 'center', border: '1px solid rgba(216,180,254,.13)', background: 'rgba(9,4,26,.48)', backdropFilter: 'blur(14px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -40, fontSize: 160, opacity: .05, animation: 'rotate 28s linear infinite', pointerEvents: 'none' }}>⭐</div>
            <span style={{ display: 'inline-block', padding: '9px 18px', borderRadius: 999, background: 'rgba(245,158,11,.96)', color: 'rgba(9,4,26,1)', fontWeight: 900, fontFamily: 'var(--D)', letterSpacing: 1, marginBottom: 14, fontSize: 13 }}>🎁 GRÁTIS AGORA</span>
            <div style={{ color: 'rgba(216,180,254,.58)', fontSize: 18, textDecoration: 'line-through', fontFamily: 'var(--B)' }}>Valor simbólico: R$ 97,00</div>
            <div style={{ fontFamily: 'var(--D)', fontWeight: 900, fontSize: 'clamp(42px,10vw,72px)', color: 'rgba(245,158,11,.95)', lineHeight: 1, margin: '6px 0 14px' }}>Hoje: gratuito</div>
            <p style={{ color: 'rgba(233,213,255,.86)', fontSize: 17, fontFamily: 'var(--B)', lineHeight: 1.6, marginBottom: 6 }}>
              Você recebe sua leitura primeiro e só avança se fizer sentido.
            </p>
            <p style={{ color: 'rgba(216,180,254,.72)', fontSize: 16, fontFamily: 'var(--B)', marginBottom: 24 }}>
              Leva menos de 2 minutos. Você só compra depois se fizer sentido.
            </p>
            <button className="btn-sec" onClick={scrollToForm}>Quero meu mapa grátis agora</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ SEGURANÇA ══════════════════════════════════ */}
      <section className="sec">
        <div className="ctr">
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 54, marginBottom: 12, animation: 'float 4s ease-in-out infinite' }}>🛡️</div>
            <h3 style={{ fontFamily: 'var(--D)', fontWeight: 700, fontSize: 24, color: 'rgba(134,239,172,.9)', marginBottom: 12 }}>Seguro e confidencial</h3>
            <p style={{ color: 'rgba(216,180,254,.86)', fontSize: 17, fontFamily: 'var(--B)', lineHeight: 1.65 }}>
              Seus dados são usados apenas para gerar o seu mapa personalizado.<br />
              Você pode cancelar comunicações por e-mail quando quiser.
            </p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ FAQ ═════════════════════════════════════════ */}
      <section className="sec sec-alt">
        <div className="ctr">
          <h2 className="sec-title">Perguntas frequentes</h2>
          <p className="sec-sub">Transparência total — sem pegadinha.</p>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {[
              { q: '📌 Como funciona o Mapa Espiritual?', a: 'Seu mapa combina Numerologia, Astrologia e uma leitura prática de padrões para te mostrar o que se repete, o que te trava e qual é o próximo passo mais alinhado para você.' },
              { q: '📌 É realmente grátis?', a: 'Sim. Seu mapa inicial é gratuito. Depois de ver sua leitura, você decide com calma se quer desbloquear a versão completa.' },
              { q: '📌 Quanto tempo demora?', a: 'Menos de 1 minuto para preencher. O resultado aparece instantaneamente na tela.' },
              { q: '📌 Preciso saber a hora de nascimento?', a: 'Não. Se souber, melhora a precisão (principalmente na astrologia). Se não souber, você ainda recebe o mapa completo.' },
              { q: '📌 Meus dados estão seguros?', a: 'Sim. Usamos seus dados apenas para gerar o mapa. Você pode cancelar e-mails quando quiser.' },
            ].map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn-sec" onClick={scrollToForm}>✨ Sim, quero descobrir agora</button>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════════ FOOTER CTA ═════════════════════════════════ */}
      <section className="sec">
        <div className="ctr">
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--D)', fontWeight: 700, fontSize: 'clamp(26px,3.8vw,46px)', color: 'rgba(243,232,255,.97)', marginBottom: 14, lineHeight: 1.18 }}>
              O padrão que te trava não precisa continuar.<br />
              Descubra agora o que está por trás disso.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(216,180,254,.78)', fontFamily: 'var(--B)', marginBottom: 28 }}>
              Gere seu mapa gratuito agora — é rápido e sem pressão.
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ position: 'absolute', inset: -4, borderRadius: 999, background: 'linear-gradient(90deg,#ec4899,#7c3aed)', filter: 'blur(20px)', opacity: .4, animation: 'glow 2.6s ease-in-out infinite', zIndex: -1 }} />
              <button className="btn-main" onClick={scrollToForm}>✨ Quero descobrir meu mapa</button>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <div className="urgency">
                ⏰
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 13 }}>Hoje está gratuito para novos acessos</strong>
                  <span style={{ fontSize: 12, opacity: .82 }}>Garanta o seu antes de sair do ar</span>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 28, fontSize: 13, color: 'rgba(216,180,254,.38)', fontFamily: 'var(--B)' }}>
              🛡️ Seus dados são protegidos. Você pode cancelar e-mails quando quiser.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
