'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { gerarProjecao12Meses } from '@/lib/transitos12meses';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function pickFirstName(fullName) {
  const text = (fullName ?? '').toString().trim();
  return text.split(' ').filter(Boolean)[0] || 'Você';
}

function MesCard({ m, i }) {
  return (
    <div className="mes-card">
      <div className="mes-card-label">
        {m.label} {i === 0 && <span className="mes-card-agora">📍 mês atual</span>}
      </div>
      <div className="mes-card-title">{m.titulo} <span className="mes-card-numero">— Mês Pessoal {m.mesPessoal}</span></div>
      <p className="p">{m.texto}</p>
      <div className="grid2">
        <div className="subcard highlight">
          <div className="subttl">✅ O que favorece</div>
          <ul className="list-check">{m.foco.map((f, fi) => <li key={fi}>✓ {f}</li>)}</ul>
        </div>
        <div className="subcard danger">
          <div className="subttl">⚠️ Cuidado com</div>
          <ul className="list-check">{m.atencao.map((a, ai) => <li key={ai}>✓ {a}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

export default function PrevisaoDoAnoPage() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [combo, setCombo] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !id) { setErro(true); setLoading(false); return; }
    supabase
      .from('analises')
      .select('id,nome,data_nascimento,payment_status,tier2_payment_status,hd_payment_status')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setErro(true); } else { setRow(data); }
        setLoading(false);
      });
  }, [id]);

  async function handleComprar() {
    const produtos = combo && row?.hd_payment_status !== 'paid'
      ? ['projecao12m', 'humandesign']
      : ['projecao12m'];
    setProcessando(true);
    try {
      const response = await fetch('/api/criar-checkout-upsell-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id, produtos, redirectTo: 'previsao' }),
      });
      const data = await response.json().catch(() => ({}));
      const checkoutUrl = data?.url || data?.sandbox_url;
      if (checkoutUrl) { window.location.href = checkoutUrl; return; }
      throw new Error(data?.error || 'Erro ao criar checkout');
    } catch (e) {
      alert(e?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div id="stars" className="stars" />

      <div className="container">
        <div className="hero">
          <div className="badge">🔮 Previsão do Ano</div>
          <h1 className="h1">Seus próximos 12 meses, mês a mês</h1>
          <p className="lead">
            Ano Pessoal e Mês Pessoal calculados a partir da sua data de nascimento — o que cada
            ciclo favorece, o que pede cuidado, e como se preparar antes de cada virada.
          </p>
        </div>

        {loading && <div className="center muted">Carregando…</div>}

        {!loading && (erro || !row) && (
          <div className="card">
            <p className="p">Não encontramos essa análise. Comece pelo formulário principal.</p>
            <Link href="/" className="btn">Fazer minha análise →</Link>
          </div>
        )}

        {!loading && row && !row.data_nascimento && (
          <div className="card">
            <p className="p">Essa análise ainda não tem data de nascimento salva — volte pro formulário e finalize.</p>
          </div>
        )}

        {!loading && row && row.data_nascimento && (() => {
          const projecao = gerarProjecao12Meses(row.data_nascimento);
          const desbloqueado = row.tier2_payment_status === 'paid';
          return (
            <>
              {desbloqueado ? (
                projecao.map((m, i) => <MesCard key={`${m.ano}-${m.mes}`} m={m} i={i} />)
              ) : (
                <>
                  <MesCard m={projecao[0]} i={0} />
                  <div className="card paywall">
                    <h2 className="h2">🔒 Mais 11 meses bloqueados</h2>
                    <p className="p">
                      {pickFirstName(row.nome)}, esse foi só o mês atual. Desbloqueie pra ver o tema,
                      o que favorece e o que pede cuidado em cada um dos próximos 12 meses.
                    </p>
                    {row.hd_payment_status !== 'paid' && (
                      <label className={`combo${combo ? ' is-checked' : ''}`}>
                        <input type="checkbox" checked={combo} onChange={(e) => setCombo(e.target.checked)} />
                        <span>{combo ? '✅' : '🧬'} Incluir também o <strong>Mapa de Human Design</strong> — os dois por <strong>R$ 50</strong></span>
                      </label>
                    )}
                    <button className="btn btn-cta" onClick={handleComprar} disabled={processando}>
                      {processando ? '⏳ Abrindo…' : combo ? '🔓 Desbloquear os Dois — R$ 50' : '🔓 Desbloquear Previsão do Ano — R$ 29,90'}
                    </button>
                  </div>
                </>
              )}
            </>
          );
        })()}

        <div className="footer-links">
          <Link href="/explorar">← Voltar pro Explorar</Link>
        </div>
      </div>
    </div>
  );
}

const globalCss = `
  body { margin: 0; }
  :root {
    --bg1: #0a0118; --bg2: #130828;
    --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
    --text: #faf5ff; --muted: rgba(233,213,255,0.75);
    --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
  }
  .wrap { min-height: 100vh; background: var(--bg1); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; position: relative; }
  .stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
  .container { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 60px 20px 80px; }
  .hero { text-align: center; margin-bottom: 32px; }
  .badge { display: inline-block; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--warning); margin-bottom: 14px; }
  .h1 { font-family: 'Cinzel', serif; font-size: 30px; font-weight: 700; margin: 0 0 14px; line-height: 1.3; }
  .lead { font-size: 18px; color: var(--muted); line-height: 1.6; max-width: 480px; margin: 0 auto; }
  .center { text-align: center; padding: 40px 0; }
  .muted { color: var(--muted); }
  .card { border-radius: 20px; border: 1px solid var(--border); padding: 26px 24px; margin-bottom: 18px; background: rgba(255,255,255,0.02); }
  .card.paywall { border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.05); text-align: center; }
  .h2 { font-family: 'Cinzel', serif; font-size: 20px; margin: 0 0 10px; }
  .p { font-size: 16px; line-height: 1.6; color: var(--text); }
  .btn { display: inline-block; margin-top: 10px; padding: 13px 24px; border-radius: 999px; border: none; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; text-decoration: none; cursor: pointer; }
  .btn-cta { width: 100%; font-size: 17px; padding: 15px; }
  .btn:disabled { opacity: 0.6; cursor: default; }
  .mes-card { border-radius: 18px; border: 1px solid var(--border); padding: 22px 20px; margin-bottom: 16px; }
  .mes-card-label { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .mes-card-agora { color: var(--warning); margin-left: 8px; }
  .mes-card-title { font-family: 'Cinzel', serif; font-size: 19px; margin: 6px 0 10px; }
  .mes-card-numero { font-size: 13px; color: var(--muted); font-family: 'Cormorant Garamond', serif; }
  .grid2 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 14px; }
  @media (min-width: 560px) { .grid2 { grid-template-columns: 1fr 1fr; } }
  .subcard { border-radius: 14px; padding: 14px 16px; border: 1px solid var(--border); }
  .subcard.highlight { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }
  .subcard.danger { border-color: rgba(236,72,153,0.3); background: rgba(236,72,153,0.05); }
  .subttl { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.04em; margin-bottom: 8px; }
  .list-check { list-style: none; padding: 0; margin: 0; font-size: 14.5px; line-height: 1.7; color: var(--muted); }
  .combo { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 16px auto 0; padding: 12px 18px; max-width: 420px; border-radius: 999px; border: 1.5px solid rgba(139,92,246,0.5); background: rgba(139,92,246,0.1); font-size: 14px; cursor: pointer; }
  .combo.is-checked { border-color: rgba(16,185,129,0.6); background: rgba(16,185,129,0.1); }
  .combo input { accent-color: var(--secondary); width: 16px; height: 16px; }
  .footer-links { text-align: center; margin-top: 40px; }
  .footer-links a { color: var(--muted); text-decoration: none; font-size: 14px; }
`;
