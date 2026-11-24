'use client';

// Pix do Manual na própria página (POST /api/pix-manual, lib/pixManual.js):
// QR + copia-e-cola, checagem a cada 4s (e na hora em que a pessoa volta pra
// aba, vinda do app do banco) por POST /api/confirmar-pagamento-mp, que
// libera pelo lib/mpPagamentoManual.js. Aprovado → /manual/<id>.
// O Pix gerado fica no sessionStorage (recarregar a página não gera outro).
// GA4: clique_comprar (metodo: 'pix'), checkout_pix_gerado, pix_copiado.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { coletarAtribuicao } from '@/app/components/CapturaAtribuicao';
import r from './resultado.module.css';

const chaveStorage = (id) => `ic_pix_${id}`;

function lerSalvo(id, valor) {
  try {
    const p = JSON.parse(sessionStorage.getItem(chaveStorage(id)) || 'null');
    if (p && p.valorPedido === valor && p.expiraEm && Date.parse(p.expiraEm) > Date.now()) return p;
  } catch {}
  return null;
}

function novaChave() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}-pix`; }
}

function rotuloTempo(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * @param {{ analiseId: string, valor: number, incluirTier2: boolean,
 *   presente: { email: string, de: string } | null,
 *   onEmailInvalido: (info: { mensagem: string, emailAtual?: string }, tentarDeNovo: (email: string) => void) => void }} p
 */
export default function PixManual({ analiseId, valor, incluirTier2, presente, onEmailInvalido }) {
  const router = useRouter();
  const [pix, setPix] = useState(null);
  const [estado, setEstado] = useState('inicio'); // inicio | gerando | aguardando | expirado | erro
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const checandoRef = useRef(false);

  // Pix já gerado nesta aba (mesmo valor e ainda válido): mostra de novo.
  // Mudou o valor (ligou/desligou o combo): o Pix antigo não serve mais.
  useEffect(() => {
    const salvo = lerSalvo(analiseId, valor);
    if (salvo) { setPix(salvo); setEstado('aguardando'); return; }
    setPix((atual) => (atual && atual.valorPedido !== valor ? null : atual));
    setEstado((e) => (e === 'aguardando' || e === 'expirado' ? 'inicio' : e));
  }, [analiseId, valor]);

  const gerar = useCallback(async (emailCorrigido) => {
    setEstado('gerando'); setErro('');
    try { window?.gtag?.('event', 'clique_comprar', { event_category: 'conversion', metodo: 'pix', value: valor, currency: 'BRL' }); } catch {}
    try { window?.fbq?.('track', 'InitiateCheckout', { value: valor, currency: 'BRL' }); } catch {}
    try {
      const res = await fetch('/api/pix-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analiseId, chave: novaChave(), incluirTier2,
          ...(presente && { presenteEmail: presente.email.trim(), presenteDe: presente.de.trim() }),
          ...(emailCorrigido && { emailCorrigido }),
          atribuicao: await coletarAtribuicao(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.error === 'email_invalido') {
          setEstado('inicio');
          onEmailInvalido({ mensagem: data.mensagem, emailAtual: data.emailAtual }, (email) => gerar(email));
          return;
        }
        throw new Error(data?.error || 'Não conseguimos gerar o Pix agora');
      }
      const salvo = { ...data, valorPedido: valor };
      try { sessionStorage.setItem(chaveStorage(analiseId), JSON.stringify(salvo)); } catch {}
      setPix(salvo);
      setEstado('aguardando');
      try { window?.gtag?.('event', 'checkout_pix_gerado', { event_category: 'conversion', value: data.valor, currency: 'BRL' }); } catch {}
    } catch (e) {
      setErro(e?.message || 'Não conseguimos gerar o Pix agora');
      setEstado('erro');
      try { window?.gtag?.('event', 'erro_checkout', { event_category: 'error', metodo: 'pix', erro: String(e?.message || e).slice(0, 100) }); } catch {}
    }
  }, [analiseId, valor, incluirTier2, presente, onEmailInvalido]);

  // Checa o pagamento: a cada 4s com a aba aberta, e na hora em que ela volta.
  useEffect(() => {
    if (estado !== 'aguardando' || !pix?.paymentId) return;
    let vivo = true;
    const checar = async () => {
      if (checandoRef.current || document.visibilityState === 'hidden') return;
      checandoRef.current = true;
      try {
        const res = await fetch('/api/confirmar-pagamento-mp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analiseId, paymentId: pix.paymentId }),
        });
        const d = await res.json().catch(() => ({}));
        if (!vivo) return;
        if (d?.pago) {
          try { sessionStorage.removeItem(chaveStorage(analiseId)); } catch {}
          router.replace(`/manual/${analiseId}`);
          return;
        }
        if (['cancelled', 'rejected', 'expired'].includes(d?.status)) setEstado('expirado');
      } catch {} finally { checandoRef.current = false; }
    };
    const intervalo = setInterval(() => {
      setAgora(Date.now());
      if (pix.expiraEm && Date.now() > Date.parse(pix.expiraEm) + 60000) { setEstado('expirado'); return; }
      checar();
    }, 4000);
    const aoVoltar = () => { if (document.visibilityState === 'visible') checar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => { vivo = false; clearInterval(intervalo); document.removeEventListener('visibilitychange', aoVoltar); };
  }, [estado, pix, analiseId, router]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pix.qrCode);
    } catch {
      const el = document.getElementById('pix-copia-cola');
      el?.select?.(); try { document.execCommand('copy'); } catch {}
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
    try { window?.gtag?.('event', 'pix_copiado', { event_category: 'conversion' }); } catch {}
  };

  if (estado === 'inicio' || estado === 'gerando' || estado === 'erro') {
    return (
      <>
        <button type="button" className={`${r.btn} ${r.btnLargo}`} onClick={() => gerar()} disabled={estado === 'gerando'}>
          {estado === 'gerando' ? 'Gerando o Pix…' : `Pagar com Pix · R$ ${valor}`}
        </button>
        {estado === 'erro' && <p className={r.erroPix} role="alert">{erro}. Tente de novo ou pague com cartão.</p>}
      </>
    );
  }

  if (estado === 'expirado') {
    return (
      <div className={r.pix}>
        <p className={r.texto}>Esse Pix venceu. Se você já pagou, o Manual chega no seu e-mail em instantes.</p>
        <button type="button" className={`${r.btn} ${r.btnLargo}`} onClick={() => { try { sessionStorage.removeItem(chaveStorage(analiseId)); } catch {} gerar(); }}>
          Gerar outro Pix · R$ {valor}
        </button>
      </div>
    );
  }

  const resta = pix.expiraEm ? Date.parse(pix.expiraEm) - agora : null;
  return (
    <div className={r.pix} aria-live="polite">
      <span className={r.rotulo}>Pix · R$ {pix.valor}</span>
      {pix.qrCodeBase64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={r.pixQr} src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR code do Pix" width={220} height={220} />
      )}
      <ol className={r.pixPassos}>
        <li>Copie o código abaixo</li>
        <li>No app do seu banco, escolha Pix copia e cola</li>
        <li>Volte aqui: o Manual abre sozinho quando o pagamento cair</li>
      </ol>
      <input id="pix-copia-cola" className={r.campo} readOnly value={pix.qrCode} onFocus={(e) => e.target.select()} aria-label="Código Pix copia e cola" />
      <button type="button" className={`${r.btn} ${r.btnLargo}`} onClick={copiar}>{copiado ? 'Código copiado' : 'Copiar código Pix'}</button>
      <p className={r.pixEspera}>
        <span className={r.pixPonto} aria-hidden="true" /> Esperando o pagamento{resta !== null && resta > 0 ? ` · vale por ${rotuloTempo(resta)}` : ''}
      </p>
    </div>
  );
}
