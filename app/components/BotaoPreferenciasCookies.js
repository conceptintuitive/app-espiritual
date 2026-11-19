'use client';

import { abrirPreferenciasCookies } from '@/app/components/AvisoCookies';

// Reabre o aviso de cookies pra pessoa mudar a escolha (usado na Política).
export default function BotaoPreferenciasCookies({ style }) {
  return (
    <button
      type="button"
      onClick={abrirPreferenciasCookies}
      style={{ background: 'none', border: 0, padding: 0, color: '#f5d48a', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', ...style }}
    >
      Mudar minha escolha de cookies
    </button>
  );
}
