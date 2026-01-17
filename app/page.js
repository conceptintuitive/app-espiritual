'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    data_nascimento: '',
    hora_nascimento: '',
    local_nascimento: '',
  });

  const [noTime, setNoTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [touched, setTouched] = useState({});
  const [focusHint, setFocusHint] = useState('');

  const starsBuiltRef = useRef(false);

  const firstName = useMemo(() => {
    const n = (formData.nome || '').trim().split(' ')[0];
    return n?.length ? n : '';
  }, [formData.nome]);

  const leadMagnetTitle = useMemo(() => {
    return firstName ? `Seu Mapa Espiritual, ${firstName}` : 'Seu Mapa Espiritual';
  }, [firstName]);

  const emailLooksValid = useMemo(() => {
    const v = (formData.email || '').trim();
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [formData.email]);

  const completion = useMemo(() => {
    const required = ['nome', 'email', 'data_nascimento'];
    const filledRequired = required.filter((k) => String(formData[k] || '').trim().length > 0).length;

    const optionalFilled = [
      !noTime && String(formData.hora_nascimento || '').trim().length > 0,
      String(formData.local_nascimento || '').trim().length > 0,
    ].filter(Boolean).length;

    const total = required.length + 2;
    const filled = filledRequired + optionalFilled;

    return Math.min(100, Math.round((filled / total) * 100));
  }, [formData, noTime]);

  const canSubmit = useMemo(() => {
    const ok =
      String(formData.nome || '').trim().length >= 3 &&
      String(formData.email || '').trim().length > 0 &&
      emailLooksValid &&
      String(formData.data_nascimento || '').trim().length > 0;

    return ok && !loading;
  }, [formData, emailLooksValid, loading]);

  // Restore saved fields (reduz abandono)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('leadForm_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
      const savedNoTime = localStorage.getItem('leadForm_noTime_v2');
      if (savedNoTime) setNoTime(savedNoTime === '1');
    } catch {}
  }, []);

  // Save fields
  useEffect(() => {
    try {
      localStorage.setItem('leadForm_v2', JSON.stringify(formData));
      localStorage.setItem('leadForm_noTime_v2', noTime ? '1' : '0');
    } catch {}
  }, [formData, noTime]);

  // Stars (limpo, não duplica)
  useEffect(() => {
    if (starsBuiltRef.current) return;
    starsBuiltRef.current = true;

    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;

    starsContainer.innerHTML = '';
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 55 : 120;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.opacity = String(0.25 + Math.random() * 0.75);
      star.style.transform = `scale(${0.7 + Math.random() * 1.6})`;
      starsContainer.appendChild(star);
    }

    return () => {
      if (starsContainer) starsContainer.innerHTML = '';
      starsBuiltRef.current = false;
    };
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById('formulario');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'email' ? value.replace(/\s/g, '') : value,
    }));
  };

  const onBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setErro('');

  const nome = String(formData.nome || '').trim();
  const email = String(formData.email || '').trim();
  const data = String(formData.data_nascimento || '').trim();

  if (nome.length < 3) {
    setErro('Por favor, preencha seu nome completo.');
    return;
  }
  if (!email || !emailLooksValid) {
    setErro('Digite um e-mail válido para receber seu mapa.');
    return;
  }
  if (!data) {
    setErro('Selecione sua data de nascimento para gerar o mapa.');
    return;
  }

  const payload = {
    ...formData,
    hora_nascimento: noTime ? '' : formData.hora_nascimento,
    noTime,
  };

  setLoading(true);

  try {
    // Track (se existir)
    try {
      window?.gtag?.('event', 'lead_submit', { event_category: 'lead', event_label: 'mapa_gratis' });
    } catch {}
    try {
      window?.fbq?.('track', 'Lead');
    } catch {}

    const response = await fetch('/api/gerar-analise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    let dataResp = null;

    // ✅ parse seguro (evita "Unexpected token <" quebrar)
    if (contentType.includes('application/json')) {
      dataResp = await response.json();
    } else {
      const rawText = await response.text();
      dataResp = { error: 'Resposta não-JSON (provável erro no servidor).', rawText };
    }

    // ✅ DEBUG (você pode remover depois)
    console.log('STATUS /api/gerar-analise:', response.status);
    console.log('CONTENT-TYPE:', contentType);
    console.log('BODY:', dataResp);

    if (!response.ok) {
      throw new Error(dataResp?.error || 'Falha ao gerar análise.');
    }

    if (dataResp?.id) {
      setErro('');
      router.push(`/resultado/${dataResp.id}`);
      return;
    }

    throw new Error('A API não retornou um ID. Verifique o /api/gerar-analise.');
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    setErro(
      error?.message ||
        'Ops! Tivemos uma instabilidade. Por favor, tente novamente — seu mapa está quase pronto.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {/* GLOBAL CSS */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #6b46c1;
          --secondary: #9333ea;
          --accent: #ec4899;
          --dark: #120622;
          --light: #f3e8ff;
          --gold: #f59e0b;
        }

        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        body {
          font-family: 'Cormorant Garamond', serif;
          color: #f3e8ff;
          background: radial-gradient(900px 500px at 50% 0%, rgba(147, 51, 234, 0.25), transparent 60%),
            linear-gradient(135deg, #120622 0%, #23103f 50%, #120622 100%);
          line-height: 1.6;
        }

        /* Container fixo (resolve “conteúdo perdido”) */
        .containerX {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Stars */
        .stars {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          animation: twinkle 3s infinite;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-16px);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }

        /* Melhor legibilidade em telas grandes */
        .heroWrap {
          padding: 96px 0 72px;
          min-height: 92vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .badgeTop {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(203, 213, 225, 0.15);
          background: rgba(17, 7, 32, 0.35);
          backdrop-filter: blur(10px);
          color: rgba(243, 232, 255, 0.9);
          font-size: 14px;
          margin-bottom: 18px;
        }

        .heroTitle {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: clamp(44px, 5vw, 68px);
          line-height: 1.05;
          margin-bottom: 18px;
          background: linear-gradient(90deg, #fb7185, #a855f7, #f59e0b);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: fadeInDown 0.9s ease-out;
        }

        .heroSub {
          font-size: clamp(18px, 2.2vw, 24px);
          color: rgba(233, 213, 255, 0.9);
          margin: 0 auto 22px;
          max-width: 820px;
          animation: fadeInUp 0.9s ease-out 0.12s backwards;
        }

        .heroProof {
          display: flex;
          gap: 22px;
          justify-content: center;
          flex-wrap: wrap;
          margin: 18px 0 26px;
          color: rgba(216, 180, 254, 0.95);
          font-size: 14px;
          animation: fadeInUp 0.9s ease-out 0.22s backwards;
        }

        .heroProof span {
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(203, 213, 225, 0.12);
          background: rgba(17, 7, 32, 0.28);
          backdrop-filter: blur(10px);
        }

        .ctaMain {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 30px;
          border-radius: 999px;
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 18px;
          color: white;
          background: linear-gradient(90deg, #ec4899, #7c3aed);
          box-shadow: 0 14px 40px rgba(236, 72, 153, 0.22);
          border: 2px solid rgba(236, 72, 153, 0.15);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.9s ease-out 0.32s backwards, pulse 2.4s infinite;
        }

        .ctaMain:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 55px rgba(236, 72, 153, 0.28);
        }

        .ctaMain::after {
          content: '';
          position: absolute;
          top: 0;
          left: -60%;
          width: 55%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: skewX(-20deg);
          animation: shimmer 2.6s infinite;
          opacity: 0.35;
        }

        .urgencyBox {
          margin-top: 18px;
          display: inline-flex;
          gap: 10px;
          align-items: center;
          padding: 12px 16px;
          border-radius: 16px;
          border: 1px solid rgba(239, 68, 68, 0.45);
          background: rgba(127, 29, 29, 0.18);
          color: rgba(254, 202, 202, 0.95);
          font-size: 14px;
          animation: fadeInUp 0.9s ease-out 0.45s backwards;
        }

        /* FORM SECTION */
        .formSection {
          position: relative;
          z-index: 10;
          padding: 86px 0;
          background: rgba(31, 10, 56, 0.65);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(216, 180, 254, 0.12);
          border-bottom: 1px solid rgba(216, 180, 254, 0.12);
        }

        .formCard {
          max-width: 760px;
          margin: 0 auto;
          border-radius: 26px;
          padding: 28px;
          background: linear-gradient(145deg, rgba(124, 58, 237, 0.18), rgba(17, 7, 32, 0.6));
          border: 1px solid rgba(236, 72, 153, 0.45);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
          position: relative;
          overflow: hidden;
        }

        .formCard::before {
          content: '✦';
          position: absolute;
          right: -40px;
          top: -55px;
          font-size: 220px;
          opacity: 0.08;
          transform: rotate(12deg);
        }

        .sectionTitle {
          font-family: 'Cinzel', serif;
          text-align: center;
          font-weight: 700;
          font-size: clamp(32px, 3.2vw, 44px);
          margin-bottom: 12px;
          color: rgba(243, 232, 255, 0.96);
        }

        .sectionSub {
          text-align: center;
          color: rgba(216, 180, 254, 0.92);
          font-size: 16px;
          margin-bottom: 18px;
        }

        .progressRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          color: rgba(233, 213, 255, 0.9);
          margin-bottom: 10px;
        }

        .progressBar {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(17, 7, 32, 0.4);
          border: 1px solid rgba(216, 180, 254, 0.12);
          margin-bottom: 18px;
        }

        .progressFill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #ec4899, #7c3aed);
          border-radius: 999px;
          transition: width 240ms ease;
        }

        .fieldLabel {
          display: block;
          margin-bottom: 8px;
          color: rgba(233, 213, 255, 0.9);
          font-size: 18px;
        }

        .inputX {
          width: 100%;
          padding: 14px 14px;
          border-radius: 16px;
          border: 1px solid rgba(216, 180, 254, 0.2);
          background: rgba(17, 7, 32, 0.55);
          color: rgba(243, 232, 255, 0.95);
          outline: none;
          font-size: 16px;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .inputX:focus {
          border: 1px solid rgba(236, 72, 153, 0.75);
          box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.12);
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 768px) {
          .grid2 {
            grid-template-columns: 1fr 1fr;
          }
          .formCard {
            padding: 36px;
          }
        }

        .miniHint {
          border-radius: 16px;
          border: 1px solid rgba(216, 180, 254, 0.15);
          background: rgba(17, 7, 32, 0.28);
          padding: 12px 14px;
          font-size: 13px;
          color: rgba(233, 213, 255, 0.88);
        }

        .errorBox {
          margin: 12px 0 16px;
          border-radius: 16px;
          border: 1px solid rgba(239, 68, 68, 0.55);
          background: rgba(127, 29, 29, 0.22);
          padding: 12px 14px;
          color: rgba(254, 202, 202, 0.98);
          font-size: 14px;
        }

        .submitBtn {
          width: 100%;
          margin-top: 10px;
          padding: 16px 18px;
          border-radius: 999px;
          font-family: 'Cinzel', serif;
          font-weight: 800;
          font-size: 18px;
          color: white;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          background: linear-gradient(90deg, #ec4899, #7c3aed);
          box-shadow: 0 16px 50px rgba(236, 72, 153, 0.18);
        }

        .submitBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 60px rgba(236, 72, 153, 0.24);
        }

        .submitBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.28);
          border-top-color: rgba(255, 255, 255, 0.95);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* SECTIONS BELOW */
        .sectionPad {
          position: relative;
          z-index: 10;
          padding: 82px 0;
        }

        .cardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 18px;
        }

        @media (min-width: 768px) {
          .cardGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .cardGrid {
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
          }
        }

        .benefitCard {
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(216, 180, 254, 0.14);
          background: rgba(17, 7, 32, 0.25);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          text-align: center;
        }

        .benefitCard:hover {
          transform: translateY(-6px);
          border-color: rgba(236, 72, 153, 0.45);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
        }

        .benefitIcon {
          font-size: 42px;
          margin-bottom: 10px;
        }

        .benefitTitle {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          color: rgba(245, 158, 11, 0.95);
          font-size: 20px;
          margin-bottom: 8px;
        }

        .benefitText {
          color: rgba(216, 180, 254, 0.92);
          font-size: 16px;
        }

        .listCard {
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(216, 180, 254, 0.14);
          background: rgba(17, 7, 32, 0.25);
          backdrop-filter: blur(10px);
        }

        .listRow {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid rgba(216, 180, 254, 0.08);
        }

        .listRow:last-child {
          border-bottom: none;
        }

        .listNum {
          font-size: 22px;
          width: 34px;
        }

        .listRow h4 {
          color: rgba(245, 158, 11, 0.95);
          font-size: 18px;
          margin-bottom: 2px;
        }

        .listRow p {
          color: rgba(216, 180, 254, 0.92);
          font-size: 16px;
        }

        .testiCard {
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(216, 180, 254, 0.14);
          background: rgba(17, 7, 32, 0.25);
          backdrop-filter: blur(10px);
          margin-bottom: 14px;
        }

        .testiText {
          color: rgba(243, 232, 255, 0.95);
          font-size: 18px;
          font-style: italic;
          margin-bottom: 12px;
        }

        .testiMeta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 800;
          background: linear-gradient(135deg, #ec4899, #7c3aed);
        }

        .ctaRowCenter {
          margin-top: 18px;
          text-align: center;
        }

        .ctaSecondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 26px;
          border-radius: 999px;
          font-family: 'Cinzel', serif;
          font-weight: 800;
          font-size: 16px;
          color: white;
          background: linear-gradient(90deg, #ec4899, #7c3aed);
          box-shadow: 0 14px 40px rgba(236, 72, 153, 0.18);
          cursor: pointer;
          border: 1px solid rgba(236, 72, 153, 0.18);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .ctaSecondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 55px rgba(236, 72, 153, 0.22);
        }

        .faqItem {
          border-radius: 18px;
          padding: 18px;
          border: 1px solid rgba(216, 180, 254, 0.14);
          background: rgba(17, 7, 32, 0.25);
          backdrop-filter: blur(10px);
          margin-bottom: 12px;
        }

        .faqQ {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          color: rgba(245, 158, 11, 0.95);
          font-size: 16px;
          margin-bottom: 8px;
        }

        .faqA {
          color: rgba(216, 180, 254, 0.92);
          font-size: 16px;
        }

        /* Sticky CTA (mobile) */
        .stickyCta {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 12px;
          z-index: 999;
          display: block;
          padding: 0 14px;
        }

        .stickyCard {
          max-width: 560px;
          margin: 0 auto;
          border-radius: 18px;
          border: 1px solid rgba(216, 180, 254, 0.14);
          background: rgba(17, 7, 32, 0.7);
          backdrop-filter: blur(12px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          padding: 10px 12px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .stickyText {
          flex: 1;
          font-size: 12px;
          color: rgba(233, 213, 255, 0.92);
          line-height: 1.2;
        }

        .stickyBtn {
          padding: 12px 14px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: 'Cinzel', serif;
          font-weight: 800;
          color: white;
          background: linear-gradient(90deg, #ec4899, #7c3aed);
          box-shadow: 0 14px 40px rgba(236, 72, 153, 0.18);
        }

        @media (min-width: 768px) {
          .stickyCta {
            display: none;
          }
        }
      `}</style>

      {/* Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* Stars */}
      <div id="stars" className="stars" />

      {/* Mobile Sticky CTA */}
      <div className="stickyCta" aria-hidden="false">
        <div className="stickyCard">
          <div className="stickyText">
            {completion >= 60 ? 'Falta pouco para gerar seu mapa ✨' : 'Gere seu mapa gratuito em 2 minutos ✨'}
            <div style={{ marginTop: 6 }} className="progressBar">
              <div className="progressFill" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <button type="button" className="stickyBtn" onClick={scrollToForm}>
            Começar
          </button>
        </div>
      </div>

      {/* HERO */}
      <section className="heroWrap">
        <div className="containerX">
          <div className="badgeTop" style={{ animation: 'fadeInDown 0.9s ease-out' }}>
            <span>🔒</span>
            <span>Privado • Sem spam • Resultado na hora</span>
          </div>

          <div className="heroTitle">Descubra os Segredos<br />da Sua Alma</div>

          <p className="heroSub">
            Numerologia + Astrologia + Neurociência Espiritual
            <br />
            em um mapa claro, direto e prático.
          </p>

          <div className="heroProof">
            <span>⭐ 4.9/5</span>
            <span>⚡ Instantâneo na tela</span>
            <span>✨ 2.847+ mapas gerados</span>
          </div>

          <button type="button" className="ctaMain" onClick={scrollToForm}>
            ✨ GERAR MEU MAPA GRÁTIS <span style={{ position: 'relative', zIndex: 2 }}>→</span>
          </button>

          <div className="urgencyBox">
            <span style={{ fontSize: 18 }}>🔥</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700 }}>Hoje está gratuito para novos acessos</div>
              <div style={{ opacity: 0.92 }}>Limite diário para manter a qualidade do processamento</div>
            </div>
          </div>

          <div style={{ marginTop: 18, opacity: 0.9 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', color: 'rgba(216,180,254,0.92)', fontSize: 13 }}>
              <span style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(17,7,32,0.22)' }}>
                🧠 Explicado de forma simples
              </span>
              <span style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(17,7,32,0.22)' }}>
                ⚡ Prático (próximos passos)
              </span>
              <span style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(216,180,254,0.12)', background: 'rgba(17,7,32,0.22)' }}>
                🔐 Dados protegidos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="formulario" className="formSection">
        <div className="containerX">
          <h2 className="sectionTitle">{leadMagnetTitle}</h2>
          <p className="sectionSub">Preencha para gerar seu mapa completo (grátis). Você decide se quer o Manual Completo depois.</p>

          <div className="formCard">
            <div className="progressRow">
              <span>Progresso</span>
              <span style={{ color: 'rgba(245,158,11,0.95)', fontWeight: 800 }}>{completion}%</span>
            </div>
            <div className="progressBar" aria-hidden="true">
              <div className="progressFill" style={{ width: `${completion}%` }} />
            </div>

            {erro ? (
              <div className="errorBox">
                <div style={{ fontWeight: 800 }}>⚠️ {erro}</div>
                <div style={{ marginTop: 4, opacity: 0.92, fontSize: 13 }}>
                  Dica: confira e-mail/data e tente novamente. Se persistir, recarregue a página.
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label className="fieldLabel">Nome Completo *</label>
                  <input
                    className="inputX"
                    type="text"
                    name="nome"
                    required
                    placeholder="Ex: Maria da Silva"
                    value={formData.nome}
                    onChange={handleChange}
                    onBlur={onBlur}
                    onFocus={() => setFocusHint('Use seu nome completo (como em documentos).')}
                  />
                  {touched.nome && String(formData.nome || '').trim().length > 0 && String(formData.nome || '').trim().length < 3 ? (
                    <div style={{ marginTop: 6, color: 'rgba(254,202,202,0.95)', fontSize: 13 }}>Digite seu nome completo.</div>
                  ) : null}
                </div>

                <div>
                  <label className="fieldLabel">E-mail *</label>
                  <input
                    className="inputX"
                    type="email"
                    name="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={onBlur}
                    onFocus={() => setFocusHint('Enviaremos seu mapa e, se você quiser, conteúdos (pode cancelar quando quiser).')}
                  />
                  {touched.email && !emailLooksValid ? (
                    <div style={{ marginTop: 6, color: 'rgba(254,202,202,0.95)', fontSize: 13 }}>Digite um e-mail válido.</div>
                  ) : null}
                </div>

                <div className="grid2">
                  <div>
                    <label className="fieldLabel">Data de Nascimento *</label>
                    <input
                      className="inputX"
                      type="date"
                      name="data_nascimento"
                      required
                      value={formData.data_nascimento}
                      onChange={handleChange}
                      onBlur={onBlur}
                      onFocus={() => setFocusHint('A data ativa a leitura do seu caminho de vida e ciclo atual.')}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <label className="fieldLabel" style={{ marginBottom: 8 }}>
                        Hora de Nascimento
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(216,180,254,0.95)' }}>
                        <input
                          type="checkbox"
                          checked={noTime}
                          onChange={(e) => {
                            setNoTime(e.target.checked);
                            if (e.target.checked) {
                              setFormData((prev) => ({ ...prev, hora_nascimento: '' }));
                            }
                          }}
                        />
                        Não sei a hora
                      </label>
                    </div>

                    <input
                      className="inputX"
                      type="time"
                      name="hora_nascimento"
                      value={formData.hora_nascimento}
                      onChange={handleChange}
                      disabled={noTime}
                      onFocus={() => setFocusHint('Se souber, melhora a precisão do seu mapa (especialmente na astrologia).')}
                      style={noTime ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                    />
                  </div>
                </div>

                <div>
                  <label className="fieldLabel">Local de Nascimento (opcional)</label>
                  <input
                    className="inputX"
                    type="text"
                    name="local_nascimento"
                    placeholder="Ex: Vitória - ES"
                    value={formData.local_nascimento}
                    onChange={handleChange}
                    onFocus={() => setFocusHint('Ajuda na leitura astrológica — mas não é obrigatório.')}
                  />
                </div>

                <div className="miniHint">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span>💡</span>
                    <span>{focusHint || 'Dica: “hora” e “local” aumentam a precisão, mas você já recebe o mapa mesmo sem eles.'}</span>
                  </div>
                </div>

                <button type="submit" className="submitBtn" disabled={!canSubmit}>
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                      <span className="spinner" />
                      Gerando seu mapa...
                    </span>
                  ) : (
                    '✨ GERAR MEU MAPA AGORA'
                  )}
                </button>

                <div style={{ textAlign: 'center', color: 'rgba(216,180,254,0.92)', fontSize: 13, marginTop: 2 }}>
                  🔒 Seus dados são protegidos e usados apenas para gerar seu mapa.
                  <br />
                  Você pode cancelar o recebimento de e-mails quando quiser.
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* O QUE VOCÊ RECEBE */}
      <section className="sectionPad">
        <div className="containerX">
          <h2 className="sectionTitle">Você vai receber agora</h2>
          <p className="sectionSub">Clareza + direção prática para sua próxima fase.</p>

          <div className="listCard" style={{ maxWidth: 820, margin: '0 auto' }}>
            {[
              { num: '1️⃣', title: 'Seu Caminho de Vida', desc: 'A missão central que sua alma veio desenvolver nesta encarnação.' },
              { num: '2️⃣', title: 'Seus 3 Talentos Naturais', desc: 'Os dons que você já tem — e como usar com mais confiança.' },
              { num: '3️⃣', title: '1 Bloqueio Principal + Prática de 3 Minutos', desc: 'Um ajuste prático para sentir mudança real no dia a dia.' },
              { num: '4️⃣', title: 'Seu Próximo Passo Personalizado', desc: 'Um plano simples e direto do que fazer a partir de agora.' },
            ].map((item, i) => (
              <div key={i} className="listRow">
                <div className="listNum">{item.num}</div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 14, borderRadius: 16, border: '1px solid rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.08)', padding: 14 }}>
              <div style={{ fontWeight: 800, color: 'rgba(245,158,11,0.95)' }}>✨ Importante</div>
              <div style={{ color: 'rgba(233,213,255,0.92)' }}>
                Depois do seu mapa grátis, você pode (se quiser) desbloquear o <b>Manual Completo</b> com aprofundamento e guia prático.
                <br />
                <span style={{ opacity: 0.9 }}>Sem pressão — só se fizer sentido pra você.</span>
              </div>
            </div>

            <div className="ctaRowCenter">
              <button type="button" className="ctaSecondary" onClick={scrollToForm}>
                Quero gerar o meu mapa
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE VOCÊ VAI DESCOBRIR */}
      <section className="sectionPad" style={{ background: 'rgba(31,10,56,0.35)' }}>
        <div className="containerX">
          <h2 className="sectionTitle">O que você vai descobrir</h2>
          <p className="sectionSub">Um mapa que traduz sua essência em clareza e próximos passos.</p>

          <div className="cardGrid">
            {[
              { icon: '🔮', title: 'Propósito', desc: 'Clareza sobre sua missão e o que sua alma veio aprender.' },
              { icon: '⚡', title: 'Dons', desc: 'Talentos naturais e como aplicar para destravar resultados.' },
              { icon: '💫', title: 'Bloqueios', desc: 'Padrões que te puxam para trás — e como ajustar com prática.' },
              { icon: '🌟', title: 'Relacionamentos', desc: 'Como você se conecta — e o ajuste que eleva sua escolha.' },
              { icon: '💎', title: 'Abundância', desc: 'Um caminho mais alinhado para prosperidade e consistência.' },
              { icon: '🦋', title: 'Transformação', desc: 'Um plano simples para você sentir evolução real.' },
            ].map((b, i) => (
              <div key={i} className="benefitCard">
                <div className="benefitIcon">{b.icon}</div>
                <div className="benefitTitle">{b.title}</div>
                <div className="benefitText">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="ctaRowCenter">
            <button type="button" className="ctaSecondary" onClick={scrollToForm}>
              ✨ Quero meu mapa grátis
            </button>
          </div>
        </div>
      </section>

      {/* TESTEMUNHOS */}
      <section className="sectionPad">
        <div className="containerX">
          <h2 className="sectionTitle">Vidas transformadas</h2>
          <p className="sectionSub">Relatos reais de pessoas que buscaram clareza e direção.</p>

          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            {[
              {
                text:
                  '“Eu sempre senti que tinha algo maior me puxando… mas não sabia nomear. O mapa me deu clareza e um passo prático. Foi como organizar a mente e o coração.”',
                name: 'Marina S., 34 anos - São Paulo, SP',
                avatar: 'M',
              },
              {
                text:
                  '“Achei que seria genérico — e me surpreendi. Bateu em pontos muito específicos e o exercício foi simples, mas realmente mudou meu dia.”',
                name: 'Julia M., 28 anos - Rio de Janeiro, RJ',
                avatar: 'J',
              },
              {
                text:
                  '“O melhor é que não fica só no ‘místico’: tem explicação e direção. Eu usei como bússola para decisões e fez diferença.”',
                name: 'Roberto C., 41 anos - Belo Horizonte, MG',
                avatar: 'R',
              },
            ].map((t, i) => (
              <div key={i} className="testiCard">
                <div className="testiText">{t.text}</div>
                <div className="testiMeta">
                  <div className="avatar">{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'rgba(245,158,11,0.95)' }}>{t.name}</div>
                    <div style={{ color: 'rgba(245,158,11,0.95)' }}>⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="ctaRowCenter">
              <button type="button" className="ctaSecondary" onClick={scrollToForm}>
                Quero ver meu mapa agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* OFERTA (GRÁTIS) */}
      <section className="sectionPad" style={{ background: 'rgba(31,10,56,0.45)' }}>
        <div className="containerX">
          <h2 className="sectionTitle">Acesso gratuito por tempo limitado</h2>
          <p className="sectionSub">Hoje está gratuito para novos acessos.</p>

          <div className="listCard" style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', right: -30, top: -55, fontSize: 180, opacity: 0.07, animation: 'rotate 22s linear infinite' }}>
              ⭐
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 999,
                background: 'rgba(245,158,11,0.95)',
                color: 'rgba(31,10,56,1)',
                fontWeight: 900,
                fontFamily: 'Cinzel, serif',
                letterSpacing: 1,
                marginBottom: 16,
              }}
            >
              🎁 GRÁTIS AGORA
            </div>

            <div style={{ color: 'rgba(216,180,254,0.9)', fontSize: 20, textDecoration: 'line-through' }}>De R$ 197,00</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 62, color: 'rgba(245,158,11,0.95)', marginTop: 4 }}>
              R$ 0
            </div>
            <div style={{ marginTop: 8, color: 'rgba(233,213,255,0.92)', fontSize: 18 }}>
              Gere seu mapa sem pagar nada.
              <br />
              <span style={{ color: 'rgba(216,180,254,0.92)' }}>Você só compra depois se fizer sentido.</span>
            </div>

            <div className="ctaRowCenter" style={{ marginTop: 20 }}>
              <button type="button" className="ctaSecondary" onClick={scrollToForm}>
                Quero meu mapa grátis agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section className="sectionPad">
        <div className="containerX">
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 10 }}>🛡️</div>
            <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 28, color: 'rgba(134,239,172,0.9)', marginBottom: 10 }}>
              Seguro e confidencial
            </h3>
            <p style={{ color: 'rgba(216,180,254,0.92)', fontSize: 18 }}>
              Seus dados são usados apenas para gerar o seu mapa personalizado.
              <br />
              Você pode cancelar comunicações por e-mail quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sectionPad" style={{ background: 'rgba(31,10,56,0.35)' }}>
        <div className="containerX">
          <h2 className="sectionTitle">Perguntas frequentes</h2>
          <p className="sectionSub">Transparência total — sem pegadinha.</p>

          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            {[
              {
                q: '📌 Como funciona o Mapa Espiritual?',
                a: 'Combinamos Numerologia, Astrologia e princípios de Neurociência (de forma prática) para gerar um relatório personalizado com clareza e próximos passos.',
              },
              {
                q: '📌 É realmente grátis?',
                a: 'Sim. O mapa básico é 100% gratuito. Depois, você pode (se quiser) desbloquear o Manual Completo com aprofundamento e guia prático.',
              },
              { q: '📌 Quanto tempo demora?', a: 'Cerca de 2 minutos para preencher. O resultado aparece instantaneamente na tela.' },
              { q: '📌 Preciso saber a hora de nascimento?', a: 'Não. Se souber, melhora a precisão (principalmente na astrologia). Se não souber, você ainda recebe o mapa.' },
              { q: '📌 Meus dados estão seguros?', a: 'Sim. Usamos seus dados apenas para gerar o mapa. Você pode cancelar e-mails quando quiser.' },
            ].map((item, i) => (
              <div key={i} className="faqItem">
                <div className="faqQ">{item.q}</div>
                <div className="faqA">{item.a}</div>
              </div>
            ))}

            <div className="ctaRowCenter" style={{ marginTop: 18 }}>
              <button type="button" className="ctaSecondary" onClick={scrollToForm}>
                ✨ Sim, quero descobrir agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="sectionPad">
        <div className="containerX">
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <h2 className="sectionTitle" style={{ marginBottom: 10 }}>
              Sua intuição já sabe.
              <br />
              Agora é hora de confirmar com clareza.
            </h2>
            <p className="sectionSub">Gere seu mapa gratuito agora — é rápido e sem pressão.</p>

            <div className="ctaRowCenter">
              <button type="button" className="ctaSecondary" onClick={scrollToForm}>
                ✨ Gerar meu mapa grátis
              </button>
            </div>

            <div className="urgencyBox" style={{ marginTop: 16 }}>
              <span style={{ fontSize: 18 }}>⏰</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800 }}>Hoje está gratuito para novos acessos</div>
                <div style={{ opacity: 0.92 }}>Garanta o seu antes de sair do ar</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
