'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ✅ IMPORT do gerador de manual
import { generateManual, renderManualMarkdown } from '@/lib/manualgenerator';

// ==============================================
// SUPABASE CLIENT
// ==============================================
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas');
    return null;
  }
  return createClient(url, key);
}

// ==============================================
// HELPERS
// ==============================================
function normalize(s) {
  return (s ?? '').toString().trim();
}

function titleCase(s) {
  const text = normalize(s);
  if (!text) return '';
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function pickFirstName(fullName) {
  const text = normalize(fullName);
  const firstName = text.split(' ').filter(Boolean)[0];
  return firstName || 'Você';
}

function hasValidChoice(value) {
  const text = normalize(value).toLowerCase();
  if (!text) return false;
  return text !== 'selecionar' && text !== 'select' && text !== 'escolher';
}

// ==============================================
// VERIFICA SE O PAGAMENTO FOI CONFIRMADO
// ==============================================
function isPaid(row) {
  if (!row) return false;

  // Booleanos diretos
  if (row.pago === true || row.is_paid === true || row.paid === true) {
    return true;
  }

  // Status em string
  const status = String(
    row.pagamento_status ?? 
    row.payment_status ?? 
    row.status_pagamento ?? 
    ''
  ).toLowerCase();

  if (status === 'paid' || status === 'pago' || status === 'succeeded' || status === 'complete') {
    return true;
  }

  // Stripe status
  const stripeStatus = String(
    row.stripe_status ?? 
    row.stripe_session_status ?? 
    ''
  ).toLowerCase();

  if (stripeStatus === 'paid' || stripeStatus === 'complete' || stripeStatus === 'completed') {
    return true;
  }

  return false;
}

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================
export default function ManualPage() {
  const { id } = useParams();
  const router = useRouter();

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  const starsBuiltRef = useRef(false);

  // ==============================================
  // EFEITO: CRIAR ESTRELAS NO FUNDO
  // ==============================================
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
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = String(0.25 + Math.random() * 0.75);
      star.style.transform = `scale(${0.7 + Math.random() * 1.6})`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      starsContainer.appendChild(star);
    }

    return () => {
      if (starsContainer) {
        starsContainer.innerHTML = '';
      }
      starsBuiltRef.current = false;
    };
  }, []);

  // ==============================================
  // EFEITO: BUSCAR DADOS DO SUPABASE
  // ==============================================
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setErro('');

      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.');
        }

        const { data, error } = await supabase
          .from('analises')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro Supabase:', error);
          throw new Error('Manual não encontrado. Verifique se o ID está correto.');
        }

        if (!data) {
          throw new Error('Nenhum dado encontrado para este ID.');
        }

        if (!mounted) return;
        setRow(data);
        console.log('OBJETIVO DO BANCO:', data.objetivo_principal);
      } catch (e) {
        if (!mounted) return;
        console.error('Erro ao buscar dados:', e);
        setErro(e?.message || 'Erro desconhecido ao carregar dados');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    } else {
      setErro('ID não fornecido na URL');
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  // ==============================================
  // VERIFICAR SE ESTÁ PAGO
  // ==============================================
  const hasPaid = useMemo(() => isPaid(row), [row]);

  // ==============================================
  // GERAR MANUAL PREMIUM
  // ==============================================
  const manual = useMemo(() => {
    if (!row) return null;

    const params = {
      nome: row.nome,
      signo: row.signo,
      numeroVida: row.numero_vida,
      objetivoPrincipal: row.objetivo_principal,
      relacaoStatus: row.relacao_status,
      trabalhoStatus: row.trabalho_status,
      local: row.local_nascimento,
      dataNascimentoISO: row.data_nascimento,
    };

    try {
      return generateManual(params);
    } catch (e) {
      console.error('Erro ao gerar manual:', e);
      return { 
        __error: e?.message || 'Erro ao gerar manual', 
        params 
      };
    }
  }, [row]);

  useEffect(() => {
  if (!manual || manual.__error) return;
  console.log('SECTIONS:', manual.sections.map(s => `${s.type} | ${s.title} | body:${(s.body?.length || 0)}`));
}, [manual]);

  // ==============================================
  // RENDERIZAR MARKDOWN
  // ==============================================
  const markdown = useMemo(() => {
    if (!manual || manual.__error) return '';
    try {
      return renderManualMarkdown(manual);
    } catch (e) {
      console.error('Erro ao renderizar markdown:', e);
      return '';
    }
  }, [manual]);

  // ==============================================
  // HANDLER: ABRIR CHECKOUT
  // ==============================================
  async function handleComprar() {
    setProcessando(true);
    try {
      const response = await fetch('/api/criar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id }),
      });

      if (!response.ok) {
        throw new Error('Erro na resposta da API');
      }

      const data = await response.json();
      
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      
      throw new Error(data?.error || 'Erro ao criar sessão de checkout');
    } catch (e) {
      console.error('Erro ao abrir checkout:', e);
      alert(e?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  // ==============================================
  // HANDLER: COPIAR MARKDOWN
  // ==============================================
  function copyMarkdown() {
    if (!markdown) {
      alert('❌ Nenhum conteúdo para copiar');
      return;
    }
    
    navigator.clipboard.writeText(markdown)
      .then(() => {
        alert('✅ Manual copiado! Cole em qualquer editor para gerar PDF.');
      })
      .catch((err) => {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar. Tente novamente.');
      });
  }

  // ==============================================
  // ESTADO: LOADING
  // ==============================================
  if (loading) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center card">
          <div className="spinner" />
          <div className="muted">Carregando seu Manual Premium…</div>
        </div>
      </div>
    );
  }

  // ==============================================
  // ESTADO: ERRO
  // ==============================================
  if (erro || !row) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center card">
          <h1 style={{ marginBottom: 10 }}>⚠️ Ops…</h1>
          <p className="muted">{erro || 'Erro ao carregar dados'}</p>
          <button 
            className="btn" 
            onClick={() => router.push('/')}
            style={{ marginTop: 20 }}
          >
            ← Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // ==============================================
  // ESTADO: ERRO NA GERAÇÃO DO MANUAL
  // ==============================================
  if (manual?.__error) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center card">
          <h2 style={{ marginBottom: 10 }}>⚠️ Erro ao gerar Manual</h2>
          <p className="muted" style={{ maxWidth: 720, marginBottom: 20 }}>
            {manual.__error}
          </p>
          <div className="note" style={{ textAlign: 'left', maxWidth: 720 }}>
            <b>Verifique se os dados estão corretos:</b>
            <br />• <code>signo</code>: {row.signo || '❌ não encontrado'}
            <br />• <code>numero_vida</code>: {row.numero_vida || '❌ não encontrado'}
            <br />• <code>objetivo_principal</code>: {row.objetivo_principal || '❌ não encontrado'}
          </div>
          <button 
            className="btn" 
            onClick={() => router.push(`/resultado/${id}`)} 
            style={{ marginTop: 20 }}
          >
            Ver página de resultado
          </button>
        </div>
      </div>
    );
  }

  // ==============================================
  // EXTRAIR DADOS DO ROW
  // ==============================================
  const firstName = pickFirstName(row.nome);
  const objetivo = titleCase(row.objetivo_principal);
  const signo = row.signo;
  const numero = row.numero_vida;

  // ==============================================
  // RENDER PRINCIPAL
  // ==============================================
  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>

      {/* FONTS */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ESTRELAS */}
      <div id="stars" className="stars" />

      {/* CONTEÚDO */}
      <div className="container">
        
        {/* ========== HERO ========== */}
        <div className="hero">
          <div className="badge">
            🔒 Manual Completo • Premium • Personalizado
          </div>
          <h1 className="title">
            {firstName}, BIANCA, SEU PADRÃO FICOU CLARO.
AGORA VAMOS VIRAR A CHAVE.
          </h1>
          <p className="subtitle">
            Um mapa claro do seu padrão —  e de como virar a chave.
          </p>

          <div className="pills">
            {signo && <span className="pill">♈ {signo}</span>}
            {numero && <span className="pill">🔢 Número {numero}</span>}
            {hasValidChoice(objetivo) && <span className="pill">🎯 {objetivo}</span>}
          </div>
        </div>

        {/* ========== PAYWALL (se não pagou) ========== */}
        {!hasPaid && (
          <div className="card paywall">
            <h2 className="h2">🔒 Acesso Bloqueado</h2>
            <p className="p">
              Este é o <b>Manual Premium completo</b>. Para liberar todo o conteúdo 
              (amor + dinheiro + calendário + plano de 7 dias), finalize o pagamento.
            </p>

            <div className="offer-mini">
              <div className="offer-section">
                <strong>✅ O que você recebe:</strong>
              </div>
              <ul className="list-check compact">
                <li>✓ Análise completa do seu Signo + Número</li>
                <li>✓ Mapeamento dos bloqueios invisíveis que te sabotam</li>
                <li>✓ Plano de ação de 7 dias (prático e simples)</li>
                <li>✓ Rituais rápidos (3–7 min) pro seu perfil</li>
                <li>✓ Amor & Dinheiro (parte completa)</li>
              </ul>

              <div className="offer-section">
                <strong>🎁 Bônus exclusivos:</strong>
              </div>
              <ul className="list-check compact">
                <li>✓ Mapa do Amor (padrão afetivo real)</li>
                <li>✓ Mapa do Dinheiro (prosperidade e bloqueios)</li>
                <li>✓ Calendário de Poder (30 dias)</li>
              </ul>
            </div>

            <button 
              className="btnBig pulse" 
              onClick={handleComprar} 
              disabled={processando}
            >
              {processando ? '⏳ Abrindo checkout…' : '🚀 Desbloquear Manual Premium'}
            </button>

            <div className="muted" style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
              Pagamento seguro • Acesso imediato • Garantia de 7 dias
            </div>
          </div>
        )}

        {/* ========== CONTEÚDO PREMIUM (só mostra se pagou) ========== */}
        {hasPaid && (
          <>
            {/* TOOLBAR + SUMÁRIO */}
            <div className="card toolbar">
              <div className="toolbarLeft">
                <div className="toolbarTitle">📚 Navegue pelo seu manual</div>
                <div className="muted" style={{ fontSize: 14 }}>
                    Escolha por onde começar
                </div>
              </div>

              <div className="toolbarRight">
                <button 
                  className="btn" 
                  onClick={() => router.push(`/resultado/${id}`)}
                >
                  Voltar na página de venda
                </button>
                <button 
                  className="btnMedium" 
                  onClick={copyMarkdown} 
                  disabled={!markdown}
                >
                  ✍️ Copiar Manual (Markdown)
                </button>
              </div>

              {/* TABLE OF CONTENTS */}
              <div className="toc">
                {Array.isArray(manual?.sections) &&
                  manual.sections
                    .filter((s) => s?.title)
                    .map((s, idx) => {
                      const anchor = `sec_${idx}`;
                      return (
                        <a key={anchor} href={`#${anchor}`} className="tocItem">
                          {s.title}
                        </a>
                      );
                    })}
              </div>
            </div>

            {/* ========== RENDER DAS SEÇÕES ========== */}
            {Array.isArray(manual?.sections) &&
              manual.sections.map((section, idx) => {
                const anchor = `sec_${idx}`;
                

                // TIPO: COVER
                if (section.type === 'cover') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <div className="premiumTag">✨ Premium Entregue</div>
                      <h2 className="h2">{section.title}</h2>
                      {section.subtitle && (
                        <div className="muted" style={{ marginTop: 6 }}>
                          {section.subtitle}
                        </div>
                      )}
                      {Array.isArray(section.meta) && section.meta.length > 0 && (
                        <ul className="list-check compact" style={{ marginTop: 14 }}>
                          {section.meta.map((m, i) => (
                            <li key={i}>✓ {m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                // TIPO: TOC
                if (section.type === 'toc') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <h2 className="h2">{section.title}</h2>
                      <ul className="list-check">
                        {Array.isArray(section.items) && 
                          section.items.map((item, i) => (
                            <li key={i}>✓ {item}</li>
                          ))}
                      </ul>
                    </div>
                  );
                }

                // TIPO: TEXT
                if (section.type === 'text') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <h2 className="h2">{section.title}</h2>
                      <div className="richText">{section.body}</div>
                    </div>
                  );
                }

                // TIPO: BULLETS
                if (section.type === 'bullets') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <h2 className="h2">{section.title}</h2>
                      {section.note && <div className="note">{section.note}</div>}
                      <ul className="list-check">
                        {Array.isArray(section.items) && 
                          section.items.map((item, i) => (
                            <li key={i}>✓ {item}</li>
                          ))}
                      </ul>
                    </div>
                  );
                }

                // TIPO: PLAN7
                if (section.type === 'plan7') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <h2 className="h2">{section.title}</h2>
                      <div className="note-solution">
                        <b>{section.headline}</b>
                        <div style={{ marginTop: 10 }}>{section.hook}</div>
                      </div>

                      <div className="grid2" style={{ marginTop: 14 }}>
                        <div className="subcard highlight">
                          <div className="subttl">📍 Passo a passo (7 dias)</div>
                          <ul className="list-check compact">
                            {Array.isArray(section.days) && 
                              section.days.map((day, i) => (
                                <li key={i}>✓ {day}</li>
                              ))}
                          </ul>
                        </div>

                        <div className="subcard">
                          <div className="subttl">🧘 Rituais</div>
                          <ul className="list-check compact">
                            {Array.isArray(section.rituals) && 
                              section.rituals.map((ritual, i) => (
                                <li key={i}>✓ {ritual}</li>
                              ))}
                          </ul>

                          <div className="subttl" style={{ marginTop: 12 }}>
                            ✅ Checkpoints
                          </div>
                          <ul className="list-check compact">
                            {Array.isArray(section.checkpoints) && 
                              section.checkpoints.map((checkpoint, i) => (
                                <li key={i}>✓ {checkpoint}</li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }

                // TIPO: LOVE
                if (section.type === 'love') {
  if (process.env.NODE_ENV === 'development') {
    console.log('pattern raw:', JSON.stringify(section.pattern));
  }

  return (
    <div key={anchor} id={anchor} className="card premium">
      <h2 className="h2">{section.title}</h2>

      <div className="note noteLove">
        <b>{section.headline}</b>

<div style={{ marginTop: 12, fontSize: 19, lineHeight: 1.95, whiteSpace: 'pre-wrap' }}>
  {String(section.pattern || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')}
</div>
      </div>

                      <div className="grid2" style={{ marginTop: 14 }}>
                        <div className="subcard danger">
                          <div className="subttl">🚫 Pare de fazer isso</div>
                          <ul className="list-check compact">
                            {Array.isArray(section.whatToStop) && 
                              section.whatToStop.map((item, i) => (
                                <li key={i}>✓ {item}</li>
                              ))}
                          </ul>
                        </div>

                        <div className="subcard highlight">
                          <div className="subttl">✅ Comece a fazer isso</div>
                          <ul className="list-check compact">
                            {Array.isArray(section.whatToStart) && 
                              section.whatToStart.map((item, i) => (
                                <li key={i}>✓ {item}</li>
                              ))}
                          </ul>
                        </div>
                      </div>

                      <div className="note-mantra" style={{ marginTop: 14 }}>
                        <b>Frases prontas (sem joguinho):</b>
                        <div style={{ marginTop: 10, textAlign: 'left' }}>
                          <ul className="list-check compact">
                            {Array.isArray(section.microScript) && 
                              section.microScript.map((script, i) => (
                                <li key={i}>✓ {script}</li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }

                // TIPO: MONEY
                if (section.type === 'money') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <h2 className="h2">{section.title}</h2>
                      <div className="note">
                        <b>{section.headline}</b>
                      </div>

                      <div className="grid2" style={{ marginTop: 14 }}>
                        <div className="subcard danger">
                          <div className="subttl">⛔ Bloqueios</div>
                          <ul className="list-check compact">
                            {Array.isArray(section.blocks) && 
                              section.blocks.map((block, i) => (
                                <li key={i}>✓ {block}</li>
                              ))}
                          </ul>
                        </div>

                        <div className="subcard highlight">
                          <div className="subttl">🚀 Ações práticas</div>
                          <ul className="list-check compact">
                            {Array.isArray(section.actions) && 
                              section.actions.map((action, i) => (
                                <li key={i}>✓ {action}</li>
                              ))}
                          </ul>

                          <div className="subttl" style={{ marginTop: 12 }}>
                            ⚡ Micro-hábitos
                          </div>
                          <ul className="list-check compact">
                            {Array.isArray(section.microHabits) && 
                              section.microHabits.map((habit, i) => (
                                <li key={i}>✓ {habit}</li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }

                // TIPO: CALENDAR30
                if (section.type === 'calendar30') {
                  return (
                    <div key={anchor} id={anchor} className="card premium">
                      <h2 className="h2">{section.title}</h2>

                      {Array.isArray(section.weeks) &&
                        section.weeks.map((week, i) => (
                          <div key={i} className="subcard" style={{ marginTop: 12 }}>
                            <div className="subttl">{week.week}</div>
                            <div className="muted" style={{ marginTop: 6 }}>
                              <b>{week.focus}</b>
                            </div>
                            <ul className="list-check compact" style={{ marginTop: 10 }}>
                              {Array.isArray(week.days) && 
                                week.days.map((day, j) => (
                                  <li key={j}>✓ {day}</li>
                                ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  );
                }

                // TIPO: CLOSING
                if (section.type === 'closing') {
                  return (
                    <div key={anchor} id={anchor} className="card premium closing">
                      <h2 className="h2">{section.title}</h2>
                      <div className="richText">{section.body}</div>
                      
                      {section.mantra && (
                        <div className="note-mantra" style={{ marginTop: 14 }}>
                          <b>Mantra:</b> {section.mantra}
                          {section.signature && (
                            <div style={{ marginTop: 10 }}>{section.signature}</div>
                          )}
                        </div>
                      )}

                      <button 
                        className="btnBig pulse" 
                        onClick={copyMarkdown} 
                        disabled={!markdown} 
                        style={{ marginTop: 14 }}
                      >
                        ✍️ Copiar Manual Completo (Markdown)
                      </button>
                    </div>
                  );
                }

                // FALLBACK: tipo desconhecido
                return (
                  <div key={anchor} id={anchor} className="card premium">
                    <h2 className="h2">{section.title || 'Seção'}</h2>
                    <div className="muted">
                      Tipo de seção desconhecido: <code>{section.type}</code>
                    </div>
                  </div>
                );
              })}

            {/* FOOTER */}
            <div className="footer-note">
              <div className="muted">
                Precisa de ajuda? Email: <strong>conceptintuitive@gmail.com</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==============================================
// CSS GLOBAL
// ==============================================
const globalCss = `
  :root {
    --bg1: #0a0118;
    --bg2: #1a0933;
    --primary: #ec4899;
    --secondary: #8b5cf6;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --text: #faf5ff;
    --muted: rgba(233, 213, 255, 0.8);
    --card: rgba(17, 7, 32, 0.6);
    --border: rgba(216, 180, 254, 0.15);
  }

  * { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
  }
  
  html, body { 
    max-width: 100%; 
    overflow-x: hidden; 
  }

  body {
    font-family: 'Cormorant Garamond', serif;
    color: var(--text);
    background: linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 50%, var(--bg1) 100%);
    line-height: 1.65;
  }

  .wrap { 
    min-height: 100vh; 
    position: relative; 
  }

  .container {
    max-width: 980px;
    margin: 0 auto;
    padding: 20px 16px 70px;
    position: relative;
    z-index: 5;
  }

  /* ========== STARS ========== */
  .stars { 
    position: fixed; 
    inset: 0; 
    pointer-events: none; 
    z-index: 0; 
  }

  .star {
    position: absolute; 
    width: 2px; 
    height: 2px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    animation: twinkle 3s infinite;
  }

  @keyframes twinkle { 
    0%, 100% { opacity: 0.3; } 
    50% { opacity: 1; } 
  }

  /* ========== HERO ========== */
  .hero { 
    padding: 22px 0 10px; 
    text-align: center; 
  }

  .badge {
    display: inline-block;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(17, 7, 32, 0.5);
    backdrop-filter: blur(10px);
    color: var(--muted);
    font-size: 13px;
    margin-bottom: 12px;
  }

  .title {
    margin: 12px 0 10px;
    font-family: 'Cinzel', serif;
    font-size: clamp(28px, 5vw, 48px);
    line-height: 1.1;
    font-weight: 700;
    background: linear-gradient(90deg, #fb7185, #a855f7, #fbbf24);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .subtitle {
    font-size: 18px;
    color: var(--muted);
    margin: 10px auto 0;
    max-width: 680px;
  }

  .pills { 
    display: flex; 
    gap: 10px; 
    justify-content: center; 
    flex-wrap: wrap; 
    margin-top: 14px; 
  }

  .pill {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(17, 7, 32, 0.4);
    color: rgba(216, 180, 254, 0.95);
    font-size: 13px;
  }

  /* ========== CARDS ========== */
  .card {
    margin-top: 22px;
    border-radius: 24px;
    padding: 22px;
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .premium {
    border: 1px solid rgba(236, 72, 153, 0.25);
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.06), rgba(139, 92, 246, 0.06));
  }

  .premiumTag {
    display: inline-block;
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 12px;
    color: #fde68a;
    border: 1px solid rgba(245, 158, 11, 0.35);
    background: rgba(245, 158, 11, 0.08);
    padding: 8px 12px;
    border-radius: 999px;
    margin-bottom: 12px;
  }

  .paywall {
    border: 2px dashed rgba(236, 72, 153, 0.45);
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.10), rgba(139, 92, 246, 0.10));
  }

  .h2 {
    font-family: 'Cinzel', serif;
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 700;
    color: var(--warning);
  }

  .p { 
    margin: 0 0 12px; 
    color: var(--text); 
    font-size: 18px; 
  }

  .muted { 
    color: var(--muted); 
  }

  /* ========== RICH TEXT ========== */
  .richText {
    white-space: pre-wrap;
    font-size: 18px;
    color: var(--text);
    line-height: 1.8;
    margin-top: 10px;
  }

  /* ========== LISTS ========== */
  .list-check { 
    list-style: none; 
    padding: 0; 
    margin: 12px 0; 
  }

  .list-check li {
    padding: 10px 0;
    color: var(--text);
    font-size: 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .list-check.compact li { 
    padding: 6px 0; 
    font-size: 18px; 
    border-bottom: 1px solid rgba(255, 255, 255, 0.06); 
  }

  /* ========== NOTES ========== */
  .note {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    background: rgba(139, 92, 246, 0.1);
    color: var(--text);
    font-size: 18px;
  }

  .note-solution {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.1);
    color: #a7f3d0;
    font-size: 18px;
  }

  .note-mantra {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(245, 158, 11, 0.4);
    background: rgba(245, 158, 11, 0.1);
    color: #fde68a;
    font-size: 18px;
    font-style: italic;
    text-align: center;
  }

  /* ========== GRID ========== */
  .grid2 { 
    display: grid; 
    grid-template-columns: 1fr; 
    gap: 14px; 
    margin-top: 14px; 
  }

  @media (min-width: 768px) { 
    .grid2 { 
      grid-template-columns: 1fr 1fr; 
    } 
  }

  .subcard {
    border-radius: 18px;
    padding: 16px;
    border: 1px solid var(--border);
    background: rgba(17, 7, 32, 0.4);
  }

  .subcard.highlight {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.05);
  }

  .subcard.danger {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.05);
  }

  .subttl {
    font-family: 'Cinzel', serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(216, 180, 254, 0.95);
    margin-bottom: 8px;
  }

  /* ========== TOOLBAR + TOC ========== */
  .toolbar { 
    padding: 18px; 
  }

  .toolbarLeft { 
    display: flex; 
    flex-direction: column; 
    gap: 6px; 
  }

  .toolbarRight { 
    display: flex; 
    gap: 10px; 
    flex-wrap: wrap; 
    margin-top: 14px; 
  }

  .toolbarTitle { 
    font-family: 'Cinzel', serif; 
    font-weight: 900; 
    color: rgba(216, 180, 254, 0.98); 
  }

  .toc {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .tocItem {
    text-decoration: none;
    color: rgba(233, 213, 255, 0.95);
    border: 1px solid rgba(216, 180, 254, 0.18);
    background: rgba(17, 7, 32, 0.35);
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 18px;
    transition: transform 0.15s ease;
  }

  .tocItem:hover { 
    transform: translateY(-1px); 
    background: rgba(139, 92, 246, 0.15);
  }

  /* ========== BUTTONS ========== */
  .btn {
    padding: 12px 20px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(17, 7, 32, 0.6);
    color: var(--text);
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 18px;
    transition: all 0.2s ease;
  }

  .btn:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3); 
  }

  .btnMedium, .btnBig {
    width: 100%;
    padding: 16px 22px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 18px;
    color: white;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    box-shadow: 0 16px 50px rgba(236, 72, 153, 0.25);
    transition: all 0.2s ease;
  }

  .btnBig { 
    font-size: 18px; 
    padding: 18px 24px; 
  }

  .btnMedium:hover, .btnBig:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 22px 70px rgba(236, 72, 153, 0.35); 
  }

  .btnMedium:disabled, .btnBig:disabled { 
    opacity: 0.6; 
    cursor: not-allowed; 
    transform: none; 
  }

  .pulse { 
    animation: pulse-btn 1.8s infinite; 
  }

  @keyframes pulse-btn { 
    0%, 100% { filter: brightness(1); } 
    50% { filter: brightness(1.15); } 
  }

  /* ========== LOADING ========== */
  .center {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    position: relative;
    z-index: 5;
    padding: 0 20px;
    text-align: center;
  }

  .spinner {
    width: 48px; 
    height: 48px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { 
    to { transform: rotate(360deg); } 
  }

  /* ========== FOOTER ========== */
  .footer-note { 
    margin-top: 28px; 
    text-align: center; 
    font-size: 14px; 
    opacity: 0.9; 
  }

 .noteLove{
  font-size: 20px;
  line-height: 1.95;
  white-space: pre-wrap; /* mantém quebras */
}

.noteLove b{
  display:block;
  font-size: 22px;
  margin-bottom: 10px;
}

  /* ========== OFFER MINI ========== */
  .offer-mini {
    margin-top: 14px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .offer-section {
    margin-top: 12px;
    margin-bottom: 8px;
    font-size: 16px;
    color: var(--warning);
    font-family: 'Cinzel', serif;
  }

  /* ========== CODE ========== */
  code {
    background: rgba(139, 92, 246, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #c4b5fd;
  }

/* ========== FRASE MESTRE ========== */
  .fraseMestre {
  margin: 36px 0;
  padding: 22px 26px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(236,72,153,.12), rgba(139,92,246,.12));
  border: 1px solid rgba(236,72,153,.35);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
  letter-spacing: .2px;
}

  /* ========== RESPONSIVIDADE ========== */
  @media (max-width: 768px) {
    .toolbarRight {
      flex-direction: column;
    }

    .btn, .btnMedium {
      width: 100%;
    }
  }
`;