'use client';

// /assinar/obrigado?r=<id da linha>&payment_id=…|preapproval_id=… — volta do
// Mercado Pago. Confirma na hora (/api/assinatura/confirmar) e, se o
// pagamento ainda estiver processando (Pix), tenta de novo por até 2 min.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';

function Obrigado() {
  const params = useSearchParams();
  const r = params.get('r');
  const paymentId = params.get('payment_id') || params.get('collection_id');
  const preapprovalId = params.get('preapproval_id');
  const [estado, setEstado] = useState('confirmando');
  const [acesso, setAcesso] = useState(null);

  useEffect(() => {
    if (!r) { setEstado('sem_ref'); return undefined; }
    let vivo = true;
    let tentativas = 0;
    async function confirmar() {
      tentativas += 1;
      try {
        const res = await fetch('/api/assinatura/confirmar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ r, paymentId, preapprovalId }),
        });
        const j = await res.json();
        if (!vivo) return;
        if (j?.ativa && j.origem === 'assinatura') {
          setAcesso(j);
          setEstado('ok');
          try { window.gtag?.('event', 'assinatura_ativa', { event_category: 'assinatura', plano: j.plano }); } catch {}
          return;
        }
      } catch {}
      if (vivo && tentativas < 40) setTimeout(confirmar, 3000);
      else if (vivo) setEstado('demorando');
    }
    confirmar();
    return () => { vivo = false; };
  }, [r, paymentId, preapprovalId]);

  const ate = acesso?.acessoAte ? new Date(acesso.acessoAte).toLocaleDateString('pt-BR') : '';

  return (
    <main className="ob-col">
      {estado === 'confirmando' && (
        <>
          <span className="ob-spinner" aria-label="Confirmando" />
          <h1>Confirmando seu pagamento…</h1>
          <p>No Pix, pode levar alguns segundos. Não precisa ficar nesta tela: assim que confirmar, o acesso libera pelo seu e-mail.</p>
        </>
      )}
      {estado === 'ok' && (
        <>
          <span className="ob-eyebrow">INTUITIVE COMPLETO</span>
          <h1>Pronto, está tudo liberado.</h1>
          <p>Seu acesso vai até {ate}{acesso?.renovaSozinha ? ' e renova sozinho no cartão' : ''}.{acesso?.incluiManual ? ' O seu Manual também foi liberado — mandamos o link por e-mail.' : ''}</p>
          <a className="ob-btn" href="/seu-dia">Abrir o Seu Dia</a>
          <a className="ob-sec" href="/explorar">Ver tudo no Explorar</a>
        </>
      )}
      {estado === 'demorando' && (
        <>
          <h1>Ainda não recebemos a confirmação.</h1>
          <p>Se você pagou, o acesso libera sozinho em alguns minutos. Se algo estiver errado, escreva pra conceptintuitive@gmail.com.</p>
          <a className="ob-sec" href="/explorar">Voltar pro Explorar</a>
        </>
      )}
      {estado === 'sem_ref' && (
        <>
          <h1>Link incompleto.</h1>
          <p>Se você acabou de pagar, o acesso libera pelo seu e-mail em alguns minutos.</p>
        </>
      )}
    </main>
  );
}

export default function ObrigadoPage() {
  return (
    <div className="ob-wrap">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet" />
      <SiteNav />
      <Suspense fallback={null}><Obrigado /></Suspense>
      <style jsx global>{`
        body { margin: 0; background: #0a0118; }
        .ob-wrap { min-height: 100vh; background: #0a0118; color: #faf5ff; font-family: 'Cormorant Garamond', Georgia, serif; }
        .ob-col { max-width: 480px; margin: 0 auto; padding: 56px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
        .ob-col h1 { margin: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 26px; }
        .ob-col p { margin: 0; font-size: 19px; line-height: 1.5; color: #e9dcff; }
        .ob-eyebrow { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.22em; color: #f5a524; }
        .ob-btn { min-height: 52px; padding: 0 28px; border-radius: 999px; background: #db2777; color: #fff; text-decoration: none; display: inline-flex; align-items: center; font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; }
        .ob-sec { color: #f5a524; font-size: 17px; min-height: 44px; display: inline-flex; align-items: center; }
        .ob-spinner { width: 36px; height: 36px; border-radius: 999px; border: 3px solid #2e1f4a; border-top-color: #f5a524; animation: obgira 0.9s linear infinite; }
        @keyframes obgira { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
