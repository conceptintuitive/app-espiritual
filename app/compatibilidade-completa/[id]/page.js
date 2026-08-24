'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { calcularSignosPessoa, gerarCompatibilidadeCompleta } from '@/lib/compatibilidadeCompleta';

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

export default function CompatibilidadeCompletaPage() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [processando, setProcessando] = useState(false);

  const [pessoa2Nome, setPessoa2Nome] = useState('');
  const [pessoa2Data, setPessoa2Data] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !id) { setErro(true); setLoading(false); return; }
    supabase
      .from('analises')
      .select('id,nome,data_nascimento,hora_nascimento,compat_payment_status,compat_pessoa2_nome,compat_pessoa2_data_nascimento')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setErro(true); } else {
          setRow(data);
          if (data.compat_pessoa2_nome) setPessoa2Nome(data.compat_pessoa2_nome);
          if (data.compat_pessoa2_data_nascimento) setPessoa2Data(data.compat_pessoa2_data_nascimento);
        }
        setLoading(false);
      });
  }, [id]);

  const minhasSignos = useMemo(() => {
    if (!row?.data_nascimento) return null;
    return calcularSignosPessoa(row.data_nascimento, row.hora_nascimento);
  }, [row]);

  const pessoa2Signos = useMemo(() => {
    if (!pessoa2Data || !/^\d{4}-\d{2}-\d{2}$/.test(pessoa2Data)) return null;
    return calcularSignosPessoa(pessoa2Data, null);
  }, [pessoa2Data]);

  const resultado = useMemo(() => {
    if (!minhasSignos || !pessoa2Signos) return null;
    return gerarCompatibilidadeCompleta(minhasSignos, pessoa2Signos);
  }, [minhasSignos, pessoa2Signos]);

  async function handleComprar() {
    if (!pessoa2Nome.trim() || !pessoa2Data) {
      alert('Preencha o nome e a data de nascimento da segunda pessoa.');
      return;
    }
    setProcessando(true);
    try {
      const response = await fetch('/api/criar-checkout-compat-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id, pessoa2Nome: pessoa2Nome.trim(), pessoa2DataNascimento: pessoa2Data }),
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

  const desbloqueado = row?.compat_payment_status === 'paid';

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
          <div className="badge">💞 Compatibilidade Completa</div>
          <h1 className="h1">Como seu mapa conversa com o de outra pessoa</h1>
          <p className="lead">
            Sol, Lua, Vênus e Marte dos dois, comparados ponto a ponto — diferente da compatibilidade
            genérica de signo com signo, aqui é o seu mapa de verdade com o de alguém específico.
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

        {!loading && row && row.data_nascimento && (
          <>
            <div className="card">
              <h2 className="h2">A outra pessoa</h2>
              <p className="p" style={{ marginBottom: 14 }}>
                Só nome e data de nascimento — sem precisar de hora ou cadastro da parte dela.
              </p>
              <div className="form-row">
                <input
                  className="input"
                  type="text"
                  placeholder="Nome da pessoa"
                  value={pessoa2Nome}
                  onChange={(e) => setPessoa2Nome(e.target.value)}
                  disabled={desbloqueado}
                />
                <input
                  className="input"
                  type="date"
                  value={pessoa2Data}
                  onChange={(e) => setPessoa2Data(e.target.value)}
                  disabled={desbloqueado}
                />
              </div>
            </div>

            {resultado && resultado.eixos.length > 0 && (
              <div className="mes-card">
                <div className="mes-card-label">{desbloqueado ? 'Compatibilidade Geral' : 'Prévia — Sol com Sol'}</div>
                <div className="mes-card-title">
                  {desbloqueado ? `${resultado.scoreGeral}%` : `${resultado.eixos[0].score}%`}
                  {' — '}{desbloqueado ? 'Média dos 4 pontos' : resultado.eixos[0].headline}
                </div>

                {desbloqueado ? (
                  <>
                    {resultado.eixos.map((e) => (
                      <div key={e.chave} className="subcard" style={{ marginTop: 14 }}>
                        <div className="subttl">{e.emoji} {e.rotulo} — {e.score}%</div>
                        <p className="p" style={{ margin: '6px 0 4px' }}><strong>{e.headline}</strong></p>
                        <p className="p" style={{ margin: 0 }}>{e.corpo}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="p" style={{ marginTop: 10 }}>{resultado.eixos[0].corpo}</p>
                    <div className="locked-list">
                      <div className="locked-row">🔒 Lua · Emoção — como vocês se afetam de verdade</div>
                      <div className="locked-row">🔒 Vênus · Amor — se e como o afeto flui</div>
                      <div className="locked-row">🔒 Marte · Ação — como conflitos e decisões acontecem entre vocês</div>
                      <div className="locked-row">🔒 Compatibilidade geral (média dos 4 pontos)</div>
                    </div>
                    <button className="btn btn-cta" onClick={handleComprar} disabled={processando} style={{ marginTop: 16 }}>
                      {processando ? '⏳ Abrindo…' : '🔓 Ver Compatibilidade Completa — R$ 29,90'}
                    </button>
                  </>
                )}
              </div>
            )}

            {!resultado && !desbloqueado && (
              <div className="card muted" style={{ textAlign: 'center' }}>
                Preencha o nome e a data de nascimento acima pra ver a prévia.
              </div>
            )}
          </>
        )}

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
  .h2 { font-family: 'Cinzel', serif; font-size: 20px; margin: 0 0 10px; }
  .p { font-size: 16px; line-height: 1.6; color: var(--text); }
  .btn { display: inline-block; margin-top: 10px; padding: 13px 24px; border-radius: 999px; border: none; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; text-decoration: none; cursor: pointer; }
  .btn-cta { width: 100%; font-size: 17px; padding: 15px; }
  .btn:disabled { opacity: 0.6; cursor: default; }
  .form-row { display: flex; flex-direction: column; gap: 12px; }
  @media (min-width: 480px) { .form-row { flex-direction: row; } }
  .input {
    flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-strong);
    background: rgba(255,255,255,0.03); color: var(--text); font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
  }
  .input:disabled { opacity: 0.6; }
  .mes-card { border-radius: 18px; border: 1px solid var(--border); padding: 22px 20px; margin-bottom: 16px; }
  .mes-card-label { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .mes-card-title { font-family: 'Cinzel', serif; font-size: 22px; margin: 6px 0 10px; }
  .subcard { border-radius: 14px; padding: 14px 16px; border: 1px solid var(--border); }
  .subttl { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.04em; margin-bottom: 6px; }
  .locked-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
  .locked-row { font-size: 14px; color: var(--muted); padding: 10px 14px; border-radius: 10px; border: 1px dashed var(--border-strong); background: rgba(255,255,255,0.02); }
  .footer-links { text-align: center; margin-top: 40px; }
  .footer-links a { color: var(--muted); text-decoration: none; font-size: 14px; }
`;
