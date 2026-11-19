'use client';

// Aviso de cookies (LGPD). Até a pessoa aceitar, GA4/Google Ads ficam em
// consent mode "denied", o pixel do Meta em consent "revoke" e o do TikTok em
// holdConsent (ver app/layout.js). A escolha fica em localStorage `ic_consent`
// ('sim' | 'nao'). Os eventos de compra enviados pelo servidor (CAPI/Events
// API/GA4 MP) não dependem disto.
// Rever a escolha: `abrirPreferenciasCookies()` (botão na Política de Privacidade).

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CHAVE = 'ic_consent';
const EVENTO = 'ic-abrir-cookies';

function aplicar(sim) {
  try {
    window.gtag?.('consent', 'update', {
      ad_storage: sim ? 'granted' : 'denied',
      ad_user_data: sim ? 'granted' : 'denied',
      ad_personalization: sim ? 'granted' : 'denied',
      analytics_storage: sim ? 'granted' : 'denied',
    });
  } catch {}
  try { window.fbq?.('consent', sim ? 'grant' : 'revoke'); } catch {}
  try { if (sim) window.ttq?.grantConsent?.(); else window.ttq?.revokeConsent?.(); } catch {}
}

export function abrirPreferenciasCookies() {
  try { window.dispatchEvent(new Event(EVENTO)); } catch {}
}

export default function AvisoCookies() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const ver = () => {
      let v = null;
      try { v = window.localStorage.getItem(CHAVE); } catch {}
      setAberto(v !== 'sim' && v !== 'nao');
    };
    ver();
    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO, abrir);
    return () => window.removeEventListener(EVENTO, abrir);
  }, []);

  function escolher(sim) {
    try { window.localStorage.setItem(CHAVE, sim ? 'sim' : 'nao'); } catch {}
    aplicar(sim);
    setAberto(false);
  }

  if (!aberto) return null;

  return (
    <div className="ic-cookies" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p>
        Usamos cookies para medir visitas e melhorar nossos anúncios. Você escolhe.{' '}
        <Link href="/politica-de-privacidade">Saiba mais</Link>
      </p>
      <div className="ic-cookies-botoes">
        <button type="button" className="ic-cookies-nao" onClick={() => escolher(false)}>Só o essencial</button>
        <button type="button" className="ic-cookies-sim" onClick={() => escolher(true)}>Aceitar</button>
      </div>
      <style>{`
        .ic-cookies {
          position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 70;
          max-width: 560px; margin: 0 auto; padding: 14px 16px; border-radius: 16px;
          background: rgba(19, 8, 40, 0.97); border: 1px solid rgba(216, 180, 254, 0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          color: #faf5ff; font-family: 'Cormorant Garamond', Georgia, serif;
          display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px;
        }
        .ic-cookies p { margin: 0; flex: 1 1 260px; font-size: 16px; line-height: 1.4; }
        .ic-cookies a { color: #f5d48a; }
        .ic-cookies-botoes { display: flex; gap: 8px; flex: 0 0 auto; }
        .ic-cookies button { min-height: 40px; padding: 0 16px; border-radius: 999px; cursor: pointer; font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 13px; }
        .ic-cookies-nao { background: transparent; color: #e9dcff; border: 1px solid rgba(216, 180, 254, 0.35); }
        .ic-cookies-sim { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; border: 0; }
      `}</style>
    </div>
  );
}
