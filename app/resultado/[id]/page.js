
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ── Supabase ──────────────────────────────────────────────────────────────────
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseISODate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function calcularSigno(dataISO) {
  const p = parseISODate(dataISO);
  if (!p) return '';
  const { m, d } = p;
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Áries';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Touro';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Gêmeos';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Câncer';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Leão';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Virgem';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Libra';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Escorpião';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagitário';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Capricórnio';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Aquário';
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Peixes';
  return '';
}

function reduzirNumero(n) {
  n = Number(n);
  if (!Number.isFinite(n)) return 0;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);
  }
  return n;
}

function calcularNumeroVida(dataISO) {
  const p = parseISODate(dataISO);
  if (!p) return 0;
  const { y, m, d } = p;
  const soma =
    String(y).split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0) +
    String(m).split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0) +
    String(d).split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);
  return reduzirNumero(soma);
}

function pickFirstName(nome) {
  const t = (nome ?? '').toString().trim();
  if (!t) return '';
  const first = t.split(' ')[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function truncateAtWord(text, maxChars) {
  if (!text || text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 0 ? cut.slice(0, lastSpace) + '…' : cut + '…';
}

function firstSentences(text, n = 2) {
  if (!text) return '';
  const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
  const result = sentences.slice(0, n).join(' ').trim();
  return result || text;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultadoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [showSticky, setShowSticky]   = useState(false);
  const [retryCount, setRetryCount]   = useState(0);
  const [retrying,   setRetrying]     = useState(false);

  // estrelas
  const starsBuiltRef = useRef(false);
  useEffect(() => {
    if (starsBuiltRef.current) return;
    starsBuiltRef.current = true;
    const stars = document.getElementById('stars');
    if (!stars) return;
    stars.innerHTML = '';
    const count = window.innerWidth < 768 ? 55 : 120;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.opacity = String(0.25 + Math.random() * 0.75);
      s.style.transform = `scale(${0.7 + Math.random() * 1.6})`;
      s.style.animationDelay = Math.random() * 3 + 's';
      stars.appendChild(s);
    }
    return () => { stars.innerHTML = ''; starsBuiltRef.current = false; };
  }, []);

  // fetch
  useEffect(() => {
    let mounted = true;
    async function buscar() {
      setLoading(true); setErro('');
      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('ENV do Supabase não configurada.');
        const { data, error } = await supabase.from('analises').select('*').eq('id', id).single();
        if (error || !data) throw new Error('Resultado não encontrado');
        if (!mounted) return;
        setAnalise(data);
        try { window?.gtag?.('event', 'visualizou_resultado', { event_category: 'engagement', value: 1 }); } catch {}
      } catch (e) {
        if (!mounted) return;
        setErro(e?.message || 'Erro ao carregar');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    if (id) buscar();
    return () => { mounted = false; };
  }, [id]);

  // derived
  const signoFinal = useMemo(() => {
    if (!analise) return '';
    return analise.signo || calcularSigno(analise.data_nascimento);
  }, [analise]);

  const numeroVidaFinal = useMemo(() => {
    if (!analise) return 0;
    return analise.numero_vida || calcularNumeroVida(analise.data_nascimento);
  }, [analise]);

  const diagnosticoParsed = useMemo(() => {
    if (!analise?.diagnostico_gerado) return null;
    try {
      const p = JSON.parse(analise.diagnostico_gerado);
      return { frase: p?.frase_diagnostico || null, combinacao: p?.combinacao || null };
    } catch { return null; }
  }, [analise]);

  const amorParsed = useMemo(() => {
    if (!analise?.amor_gerado) return null;
    try {
      const p = JSON.parse(analise.amor_gerado);
      return { headline: p?.headline || null, pattern: p?.pattern || null };
    } catch { return null; }
  }, [analise]);

  const arquetiposParsed = useMemo(() => {
    if (!analise?.arquetipos_gerado) return null;
    try {
      const p = JSON.parse(analise.arquetipos_gerado);
      return { dominante: p?.dominante || null, emocional: p?.emocional || null, sombra: p?.sombra || null };
    } catch { return null; }
  }, [analise]);

  const cartaTarot = useMemo(() => {
    if (!analise?.carta_tarot) return null;
    try { return JSON.parse(analise.carta_tarot); } catch { return null; }
  }, [analise]);

  const cartaTarotInterp = useMemo(() => {
    if (!analise?.carta_tarot_interpretacao) return null;
    try {
      const p = JSON.parse(analise.carta_tarot_interpretacao);
      return { titulo: p?.titulo || null, body: p?.body || null };
    } catch { return null; }
  }, [analise]);

  const plano7Parsed = useMemo(() => {
    if (!analise?.plano7_gerado) return null;
    try {
      const p = JSON.parse(analise.plano7_gerado);
      return { headline: p?.headline || null, hook: p?.hook || null, days: Array.isArray(p?.days) ? p.days : [] };
    } catch { return null; }
  }, [analise]);

  // polling — refetch até diagnostico_gerado chegar (até 10 tentativas × 4s = 40s)
  useEffect(() => {
    if (!analise || analise.diagnostico_gerado || retryCount >= 10) return;
    setRetrying(true);
    const timer = setTimeout(async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.from('analises').select('*').eq('id', id).single();
        if (data) setAnalise(data);
      } catch {}
      setRetryCount(c => c + 1);
      setRetrying(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [analise, retryCount, id]);

  // sticky CTA observer
  useEffect(() => {
    if (!analise) return;
    const previewEl = document.querySelector('.preview-card');
    const offerEl   = document.querySelector('.offer-card');
    if (!previewEl || !offerEl) return;

    const previewObs = new IntersectionObserver(
      ([e]) => setShowSticky(!e.isIntersecting),
      { threshold: 0 }
    );
    const offerObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setShowSticky(false); },
      { threshold: 0.1 }
    );
    previewObs.observe(previewEl);
    offerObs.observe(offerEl);
    return () => { previewObs.disconnect(); offerObs.disconnect(); };
  }, [analise]);

  // compra
  const handleComprar = async () => {
    setProcessando(true);
    try {
      try { window?.gtag?.('event', 'clique_comprar', { event_category: 'conversion', value: 47, currency: 'BRL' }); } catch {}
      const response = await fetch('/api/criar-checkout-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.details || data?.error || 'Erro ao abrir checkout');
      const checkoutUrl = data?.url || data?.sandbox_url;
      if (checkoutUrl) { window.location.href = checkoutUrl; return; }
      throw new Error('Checkout sem URL');
    } catch (e) {
      console.error('Erro no checkout:', e);
      alert(e?.message || 'Erro. Tente novamente.');
    } finally { setProcessando(false); }
  };

  // loading / erro
  if (loading) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center">
          <div className="spinner" />
          <p className="muted">Carregando seu resultado…</p>
        </div>
      </div>
    );
  }

  if (erro || !analise) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center">
          <h1 style={{ marginBottom: 10 }}>Ops…</h1>
          <p className="muted">{erro || 'Erro ao carregar'}</p>
          <button className="btn" onClick={() => router.push('/')}>Voltar</button>
        </div>
      </div>
    );
  }

  const firstName = pickFirstName(analise.nome);

  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@300;400;500&display=swap" rel="stylesheet" />
      <div id="stars" className="stars" />

      <div className="container">

        {/* ══ BLOCO 1 — HERO ══ */}
        <div className="hero">
          <h1 className="hero-title">{firstName}, olha o que apareceu no seu mapa.</h1>

          {/* Pills de signos */}
          <div className="pills pills-signos">
            {signoFinal        && <span className="pill pill-signo">☀️ {signoFinal} (Sol)</span>}
            {analise.signo_lua        && <span className="pill pill-signo">🌙 Lua em {analise.signo_lua}</span>}
            {analise.signo_ascendente && <span className="pill pill-signo">⬆️ Asc. em {analise.signo_ascendente}</span>}
            {analise.signo_venus      && <span className="pill pill-signo">💞 Vênus em {analise.signo_venus}</span>}
            {analise.signo_marte      && <span className="pill pill-signo">⚔️ Marte em {analise.signo_marte}</span>}
          </div>

          {/* Pills de números */}
          <div className="pills pills-numeros">
            {numeroVidaFinal           && <span className="pill pill-numero">🔢 Vida: {numeroVidaFinal}</span>}
            {analise.numero_alma       && <span className="pill pill-numero">🔢 Alma: {analise.numero_alma}</span>}
            {analise.numero_expressao  && <span className="pill pill-numero">🔢 Expressão: {analise.numero_expressao}</span>}
            {analise.ano_pessoal       && <span className="pill pill-numero">📅 Ano Pessoal: {analise.ano_pessoal}</span>}
          </div>
        </div>

        {/* ══ BLOCO 2 — PREVIEW ══ */}
        {analise.preview_gerado && (
          <div className="preview-card">
            <p className="preview-quote">"{analise.preview_gerado}"</p>
            <hr className="preview-divider" />
            <p className="micro-pergunta">Isso te descreveu?</p>
          <button
            className="mini-cta-link"
            onClick={() => document.querySelector('.offer-card')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver meu diagnóstico completo →
          </button>
        </div>
        )}

        {/* spinner de polling enquanto diagnóstico não chegou */}
        {!analise.diagnostico_gerado && (retrying || retryCount < 3) && (
          <div className="gerando-card">
            <div className="gerando-spinner" />
            <p className="gerando-text">Gerando seu diagnóstico…</p>
            <p className="gerando-sub">Isso leva alguns segundos.</p>
          </div>
        )}

        {/* ══ BLOCO 3 — DIAGNÓSTICO (parcial) ══ */}
        {diagnosticoParsed && (
          <div className="section-card">
            <div className="section-label">Seu Diagnóstico Profundo</div>
            {diagnosticoParsed.frase && (
              <p className="frase-destaque">"{diagnosticoParsed.frase}"</p>
            )}
            {diagnosticoParsed.combinacao && (
              <div className="content-fade" style={{ maxHeight: '140px' }}>
                <p className="body-text">{truncateAtWord(diagnosticoParsed.combinacao, 260)}</p>
              </div>
            )}
            <div className="locked-card">
              <div className="locked-icon">🔒</div>
              <p className="locked-text">
                O mecanismo que mantém esse ciclo rodando e o ajuste que muda o resultado estão no diagnóstico completo.
              </p>
              <button className="btn-cta" onClick={handleComprar} disabled={processando}>
                {processando ? '⏳ Abrindo…' : 'DESBLOQUEAR MEU MANUAL — R$ 47'}
              </button>
              <p className="pos-compra" style={{ marginTop: 10 }}>
                Após o pagamento, você receberá o link do seu manual por email em poucos minutos. Verifique também a caixa de spam.
              </p>
            </div>
          </div>
        )}

        {/* ══ IMAGEM IA (Pollinations) + fallback SVG ══ */}
        {cartaTarot && (
          <div style={{ position: 'relative', marginTop: 28, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,168,83,0.2)', aspectRatio: '1200/630', background: 'linear-gradient(135deg, #0a0118 0%, #2d0a4e 50%, #0d0125 100%)' }}>
            {/* Imagem real ou fallback SVG enquanto gera */}
            <img
              src={analise.imagem_ia_url || `/api/og/${id}`}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay com nome + carta via HTML/CSS */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,0,15,0.85) 0%, rgba(5,0,15,0.05) 55%, rgba(5,0,15,0.4) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: 28, gap: 8 }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#f0eff4', margin: 0, textAlign: 'center', textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}>{firstName}</p>
              <p style={{ fontSize: 13, color: 'rgba(240,200,112,0.85)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                {cartaTarot.simbolo} {cartaTarot.nome}{cartaTarot.invertida ? ' — Invertida' : ''}
              </p>
            </div>
          </div>
        )}

        {/* ══ BLOCO 4 — AMOR (parcial) ══ */}
        {amorParsed && (
          <div className="section-card">
            <div className="section-label">Seu Padrão no Amor</div>
            {amorParsed.headline && (
              <p className="amor-headline">"{amorParsed.headline}"</p>
            )}
            {amorParsed.pattern && (
              <div className="content-fade content-fade-sm" style={{ maxHeight: '120px' }}>
                <p className="body-text">{truncateAtWord(amorParsed.pattern, 200)}</p>
              </div>
            )}
            <div className="locked-card locked-card-quiet">
              <p className="locked-text">
                O que parar de fazer e o que começar no amor está no manual completo.
              </p>
            </div>
          </div>
        )}

        {/* ══ BLOCO A — MAPA DO DINHEIRO ══ */}
        {analise.dinheiro_gerado ? (() => {
          let dinheiroParsed = null;
          try { dinheiroParsed = JSON.parse(analise.dinheiro_gerado); } catch {}
          return dinheiroParsed ? (
            <div className="section-card">
              <div className="section-label">Seu Mapa do Dinheiro</div>
              {dinheiroParsed.headline && (
                <p className="amor-headline">"{dinheiroParsed.headline}"</p>
              )}
              {dinheiroParsed.pattern && (
                <div className="content-fade content-fade-sm" style={{ maxHeight: '120px' }}>
                  <p className="body-text">{truncateAtWord(dinheiroParsed.pattern, 200)}</p>
                </div>
              )}
              <div className="locked-card locked-card-quiet">
                <p className="locked-text">
                  Seus bloqueios financeiros e o caminho para destravar estão no manual completo.
                </p>
              </div>
            </div>
          ) : null;
        })() : (
          <div className="section-card">
            <div className="section-label">Seu Mapa do Dinheiro</div>
            <p className="amor-headline">"Seus bloqueios financeiros ocultos"</p>
            <div className="locked-card">
              <div className="locked-icon">🔒</div>
              <p className="locked-text">
                Seus bloqueios financeiros e o caminho para destravar estão no manual completo.
              </p>
              <button className="btn-cta" onClick={handleComprar} disabled={processando}>
                {processando ? '⏳ Abrindo…' : 'VER MEU DIAGNÓSTICO COMPLETO'}
              </button>
            </div>
          </div>
        )}

        {/* ══ BLOCO B — RITUAIS ══ */}
        <div className="section-card">
          <div className="section-label">3 Rituais Para Seu Perfil</div>
          <div className="arq-grid">
            {[
              { emoji: '🕯️', label: 'Ritual de Clareza' },
              { emoji: '🌊', label: 'Ritual de Limpeza' },
              { emoji: '🔮', label: 'Ritual de Ativação' },
            ].map(({ emoji, label }) => (
              <div key={label} className="arq-card">
                <div className="arq-emoji">{emoji}</div>
                <div className="arq-label">{label}</div>
                <div className="arq-desc-wrap">
                  <p className="arq-desc blur-content">ritual personalizado para o seu perfil</p>
                  <div className="arq-overlay">Desbloqueie no manual</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ BLOCO 5 — ARQUÉTIPOS ══ */}
        {arquetiposParsed && (
          <div className="section-card">
            <div className="section-label">Seus 3 Arquétipos</div>
            <div className="arq-grid">
              {[
                { emoji: '🔥', label: 'Dominante', data: arquetiposParsed.dominante },
                { emoji: '💧', label: 'Emocional',  data: arquetiposParsed.emocional },
                { emoji: '🌑', label: 'Sombra',     data: arquetiposParsed.sombra },
              ].map(({ emoji, label, data }) => data && (
                <div key={label} className="arq-card">
                  <div className="arq-emoji">{emoji}</div>
                  <div className="arq-label">{label}</div>
                  <div className="arq-nome">{data.nome}</div>
                  <div className="arq-desc-wrap">
                    <p className="arq-desc blur-content">{data.descricao}</p>
                    <div className="arq-overlay">Desbloqueie no manual</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ BLOCO TAROT — teaser carta ══ */}
        {cartaTarot && (
          <div className="section-card" style={{ background: 'linear-gradient(135deg, rgba(17,7,32,0.85) 0%, rgba(55,15,90,0.3) 100%)', borderColor: 'rgba(212,168,83,0.25)' }}>
            <div className="section-label" style={{ color: '#f0c870' }}>Sua Carta do Dia</div>
            {cartaTarotInterp?.titulo && (
              <p className="amor-headline">"{cartaTarotInterp.titulo}"</p>
            )}
            {cartaTarotInterp?.body && (
              <div className="content-fade content-fade-sm" style={{ maxHeight: '120px' }}>
                <p className="body-text">{firstSentences(cartaTarotInterp.body, 2)}</p>
              </div>
            )}
            <div className="locked-card" style={{ borderColor: 'rgba(212,168,83,0.25)' }}>
              <div className="locked-icon">🔒</div>
              <p className="locked-text">
                A interpretação completa de como {cartaTarot.nome}{cartaTarot.invertida ? ' Invertida' : ''} se conecta ao seu perfil e objetivo está no manual completo.
              </p>
              <button className="btn-cta" onClick={handleComprar} disabled={processando}>
                {processando ? '⏳ Abrindo…' : 'VER MINHA INTERPRETAÇÃO COMPLETA'}
              </button>
            </div>
          </div>
        )}

        {/* ══ BLOCO 6 — PLANO 7 DIAS (parcial) ══ */}
        {plano7Parsed && plano7Parsed.days.length > 0 && (
          <div className="section-card">
            <div className="section-label">Seu Plano de 7 Dias</div>
            {plano7Parsed.hook && <p className="plano-hook">{plano7Parsed.hook}</p>}
            <ul className="days-list">
              {plano7Parsed.days.map((day, i) => (
                <li key={i} className={i >= 1 ? 'day-item day-blurred' : 'day-item'}>
                  {day}
                </li>
              ))}
            </ul>
            <p className="plano-lock-note">Os 6 dias restantes estão no manual completo.</p>
          </div>
        )}

        {/* ══ SOCIAL PROOF ══ */}
        <div className="section-card social-proof-card">
          <p className="social-proof-text">✨ Mais de 25 análises geradas este mês</p>
        </div>

        {/* ══ BLOCO C — O QUE TEM NO MANUAL ══ */}
        <div className="section-card">
          <div className="section-label">O Que Tem no Seu Manual</div>
          <ul className="manual-index-list">
            {[
              { check: true,  label: 'Seu Mapa Completo' },
              { check: true,  label: 'Diagnóstico Profundo' },
              { check: false, label: 'Tipo de Pessoa (quem você é quando está no eixo — e fora dele)' },
              { check: true,  label: '3 Arquétipos' },
              { check: false, label: 'Objetivo do Ciclo Atual' },
              { check: false, label: 'Leitura Integrada (o que te potencializa vs. o que te sabota)' },
              { check: false, label: 'Seu Ponto Cego' },
              { check: false, label: 'Bloqueios Invisíveis (com passos de destravamento)' },
              { check: true,  label: 'Plano de 7 Dias' },
              { check: true,  label: '3 Rituais Personalizados' },
              { check: true,  label: 'Padrão no Amor (com "pare de fazer" e "comece a fazer")' },
              { check: true,  label: 'Mapa do Dinheiro (bloqueios e ações práticas)' },
              { check: false, label: 'Calendário de 30 Dias (dia a dia detalhado)' },
              { check: false, label: 'Fechamento e Mantra Pessoal' },
            ].map(({ check, label }) => (
              <li key={label} className={`manual-index-item ${check ? 'manual-index-seen' : 'manual-index-locked'}`}>
                <span className="manual-index-icon">{check ? '✓' : '🔒'}</span>
                {label}
              </li>
            ))}
          </ul>
          <p className="manual-index-footer">Você viu fragmentos de 7 seções. Seu manual completo tem 14 seções e 30+ páginas escritas só pra você.</p>
        </div>

        {/* ══ BLOCO 7 — OFERTA FINAL ══ */}
        <div className="card offer-card">
          <div className="offer-badge-sm">Seu plano completo</div>
          <p className="ancora-valor">13 seções personalizadas · 30+ páginas · feito só pra você</p>
          <div className="offer-price-row">
            <span className="price-old-sm">de R$ 97,00</span>
            <span className="price-now-sm">por R$ 47,00</span>
          </div>
          <ul className="list-check compact offer-list">
            <li>✓ Diagnóstico profundo do seu padrão</li>
            <li>✓ Mapa do amor (seu padrão afetivo real)</li>
            <li>✓ Mapa do dinheiro (bloqueios e direção)</li>
            <li>✓ Plano de 7 dias personalizado</li>
            <li>✓ Calendário de 30 dias</li>
            <li>✓ 3 rituais específicos pro seu perfil</li>
          </ul>
          <div className="manual-preview-note">
            📖 Seu manual tem 13 seções escritas exclusivamente para {firstName}. Nenhum outro manual é igual ao seu.
          </div>
          <button className="btn-cta" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ Abrindo…' : 'QUERO MEU MANUAL COMPLETO'}
          </button>
          <p className="pos-compra">
            Após o pagamento, você receberá o link do seu manual por email em poucos minutos. Verifique também a caixa de spam.
          </p>
          <div className="garantia-nova">
            <div className="garantia-icon">🛡️</div>
            <div className="garantia-titulo">Garantia de 7 dias sem risco</div>
            <p className="garantia-desc">Se o manual não trouxer clareza real sobre seu padrão, devolvemos 100%. Sem perguntas, sem burocracia.</p>
          </div>
          {analise.ano_pessoal && (
            <p className="countdown-real">
              ⏳ Seu Ano Pessoal é {analise.ano_pessoal}. Essa análise reflete seu ciclo atual — quanto antes aplicar, mais resultado no tempo certo.
            </p>
          )}
          <p className="pos-compra">Após o pagamento, seu manual aparece na tela e você recebe o link por email. Verifique também sua caixa de spam.</p>
        </div>

        {/* ══ AUTORIDADE ══ */}
        <p className="autoridade-text">
          Análise gerada combinando astrologia clássica, numerologia pitagórica e padrões comportamentais. Cada manual é único — gerado exclusivamente para o seu perfil.
        </p>

        {/* ══ BLOCO 8 — REFORÇO ══ */}
        <div className="reforco-block">
          <p className="reforco-text">Se as 3 primeiras frases já te descreveram, imagina o diagnóstico completo.</p>
          <button className="btn-cta btn-cta-sm" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ Abrindo…' : 'QUERO MEU MANUAL COMPLETO'}
          </button>
          <p className="pos-compra" style={{ marginTop: 10 }}>
            Após o pagamento, você receberá o link do seu manual por email em poucos minutos. Verifique também a caixa de spam.
          </p>
        </div>

        <div className="footer-note">
          <div className="muted">Precisa de ajuda? Email: <strong>conceptintuitive@gmail.com</strong></div>
        </div>

      </div>

      {/* ══ STICKY CTA — mobile only ══ */}
      {showSticky && (
        <div className="sticky-bar">
          <button
            className="sticky-btn"
            onClick={() => document.querySelector('.offer-card')?.scrollIntoView({ behavior: 'smooth' })}
          >
            VER DIAGNÓSTICO COMPLETO →
          </button>
        </div>
      )}

    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const globalCss = `
  :root {
    --bg1: #0a0118;
    --bg2: #130828;
    --primary: #ec4899;
    --secondary: #8b5cf6;
    --success: #10b981;
    --warning: #f59e0b;
    --text: #faf5ff;
    --muted: rgba(233, 213, 255, 0.75);
    --card: rgba(17, 7, 32, 0.65);
    --border: rgba(216, 180, 254, 0.14);
    --fade-bg: #0e0420;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { max-width: 100%; overflow-x: hidden; }

  body {
    font-family: 'Cormorant Garamond', serif;
    color: var(--text);
    background: linear-gradient(160deg, var(--bg1) 0%, var(--bg2) 60%, var(--bg1) 100%);
    min-height: 100vh;
    line-height: 1.65;
  }

  .wrap { min-height: 100vh; position: relative; }

  .container {
    max-width: 660px;
    margin: 0 auto;
    padding: 28px 16px 80px;
    position: relative;
    z-index: 5;
  }

  /* Stars */
  .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .star {
    position: absolute; width: 2px; height: 2px;
    background: rgba(255,255,255,0.9); border-radius: 50%;
    animation: twinkle 3s infinite;
  }
  @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }

  /* ── Hero ── */
  .hero { padding: 16px 0 12px; text-align: center; }

  .hero-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(20px, 4.5vw, 32px);
    line-height: 1.25;
    background: linear-gradient(90deg, #fb7185, #a855f7, #fbbf24);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    margin-bottom: 4px;
  }

  .pills {
    display: flex; gap: 8px; justify-content: center;
    flex-wrap: wrap; margin-top: 10px;
  }
  .pills-signos { margin-top: 14px; }
  .pills-numeros { margin-top: 8px; }

  .pill {
    padding: 7px 13px; border-radius: 999px;
    background: rgba(17,7,32,0.4);
    color: rgba(216,180,254,0.9); font-size: 13px;
  }
  .pill-signo {
    border: 1px solid rgba(139,92,246,0.3);
  }
  .pill-numero {
    border: 1px solid rgba(245,158,11,0.3);
    color: rgba(253,230,138,0.85);
  }

  /* ── Preview card ── */
  .preview-card {
    margin-top: 28px; border-radius: 20px; padding: 28px 28px 20px;
    background: rgba(245,158,11,0.06);
    border-left: 3px solid var(--warning);
    border-top: 1px solid rgba(245,158,11,0.2);
    border-right: 1px solid rgba(245,158,11,0.1);
    border-bottom: 1px solid rgba(245,158,11,0.1);
  }
  .preview-quote {
    font-size: clamp(17px, 2.5vw, 20px); line-height: 1.8;
    color: var(--text); font-style: italic;
  }
  .preview-divider {
    border: none; border-top: 1px solid rgba(216,180,254,0.15);
    margin: 18px 0 14px;
  }
  .micro-pergunta { font-size: 14px; color: var(--muted); text-align: center; letter-spacing: 0.04em; }

  /* ── Section cards (blocos com conteúdo parcial) ── */
  .section-card {
    margin-top: 28px; border-radius: 22px; padding: 26px 22px;
    background: var(--card); border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    box-shadow: 0 16px 50px rgba(0,0,0,0.3);
  }

  .section-label {
    font-family: 'Cinzel', serif;
    font-size: clamp(16px, 2.5vw, 19px);
    color: var(--warning);
    margin-bottom: 16px;
    letter-spacing: 0.04em;
  }

  .frase-destaque {
    font-size: clamp(16px, 2.5vw, 20px);
    font-style: italic;
    color: rgba(253,230,138,0.95);
    line-height: 1.7;
    margin-bottom: 18px;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(245,158,11,0.07);
    border-left: 2px solid rgba(245,158,11,0.4);
  }

  .body-text {
    font-size: clamp(15px, 2vw, 17px);
    line-height: 1.85;
    color: rgba(250,245,255,0.92);
  }

  /* ── Fade effect ── */
  .content-fade {
    position: relative;
    overflow: hidden;
    max-height: 380px;
  }
  .content-fade::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 130px;
    background: linear-gradient(to bottom, transparent, var(--fade-bg));
    pointer-events: none;
  }
  .content-fade-sm { max-height: 200px; }
  .content-fade-sm::after { height: 90px; }

  /* ── Locked card ── */
  .locked-card {
    margin-top: 16px; position: relative; z-index: 2;
    text-align: center; padding: 22px 20px; border-radius: 16px;
    background: rgba(17,7,32,0.92);
    border: 1px solid rgba(139,92,246,0.3);
    backdrop-filter: blur(8px);
  }
  .locked-card-quiet {
    background: rgba(17,7,32,0.6);
    border-color: rgba(139,92,246,0.15);
    padding: 14px 16px;
  }
  .locked-icon { font-size: 26px; margin-bottom: 10px; }
  .locked-text {
    font-size: 15px; color: var(--muted);
    line-height: 1.65; margin-bottom: 18px;
  }
  .locked-card-quiet .locked-text { margin-bottom: 0; font-size: 15px; }

  /* ── Amor headline ── */
  .amor-headline {
    font-size: clamp(16px, 2.5vw, 19px);
    font-family: 'Cinzel', serif;
    color: rgba(216,180,254,0.95);
    margin-bottom: 14px;
    line-height: 1.4;
  }

  /* ── Arquétipos ── */
  .arq-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 4px;
  }
  @media (min-width: 560px) {
    .arq-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .arq-card {
    border-radius: 18px; padding: 18px 16px;
    background: rgba(10,1,24,0.6);
    border: 1px solid rgba(139,92,246,0.2);
    display: flex; flex-direction: column; gap: 6px;
  }
  .arq-emoji { font-size: 20px; }
  .arq-label { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
  .arq-nome {
    font-family: 'Cinzel', serif; font-size: 13px;
    color: rgba(216,180,254,0.95); line-height: 1.35;
  }
  .arq-desc-wrap { position: relative; margin-top: 6px; }
  .arq-desc {
    font-size: 13px; color: var(--muted); line-height: 1.55;
    filter: blur(5px); user-select: none; pointer-events: none;
  }
  .arq-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase;
    color: rgba(139,92,246,0.8);
    background: rgba(10,1,24,0.25);
    border-radius: 8px;
  }

  /* ── Plano 7 dias ── */
  .plano-hook {
    font-size: 15px; color: var(--muted); line-height: 1.7;
    margin-bottom: 16px; font-style: italic;
  }
  .days-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .day-item {
    font-size: 15px; color: var(--text); line-height: 1.6;
    padding: 10px 14px; border-radius: 12px;
    background: rgba(139,92,246,0.07);
    border: 1px solid rgba(139,92,246,0.15);
  }
  .day-blurred {
    filter: blur(4px); user-select: none; pointer-events: none;
    color: var(--muted);
  }
  .plano-lock-note {
    margin-top: 14px; font-size: 13px; color: var(--muted);
    text-align: center; letter-spacing: 0.03em;
  }

  /* ── Offer card ── */
  .card {
    margin-top: 28px; border-radius: 24px; padding: 28px 22px;
    background: var(--card); border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  .offer-card {
    margin-top: 40px;
    border-color: rgba(168,85,247,0.35);
    background: linear-gradient(135deg, rgba(17,7,32,0.75), rgba(88,28,135,0.15));
    display: flex; flex-direction: column; align-items: center;
    text-align: center; gap: 18px;
  }
  .offer-badge-sm {
    display: inline-block; padding: 6px 18px; border-radius: 999px;
    background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.4);
    color: #c4b5fd; font-size: 12px; letter-spacing: 0.08em;
    text-transform: uppercase; font-family: 'Cinzel', serif;
  }
  .offer-price-row { display: flex; align-items: center; gap: 16px; justify-content: center; }
  .price-old-sm { font-size: 16px; color: var(--muted); text-decoration: line-through; }
  .price-now-sm {
    font-size: 32px; font-family: 'Cinzel', serif;
    color: var(--warning); font-weight: 700;
  }
  .offer-list { text-align: left; width: 100%; max-width: 340px; }
  .list-check { list-style: none; padding: 0; margin: 8px 0; }
  .list-check li {
    padding: 9px 0; color: var(--text); font-size: 17px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .list-check li:last-child { border-bottom: none; }
  .list-check.compact li { padding: 7px 0; font-size: 16px; }
  .offer-trust { font-size: 14px; color: var(--muted); margin-top: -4px; }

  /* ── CTA button ── */
  @keyframes cta-pulse {
    0%, 100% { box-shadow: 0 8px 32px rgba(168,85,247,0.5); }
    50%       { box-shadow: 0 10px 40px rgba(168,85,247,0.7); }
  }

  .btn-cta {
    width: 100%; max-width: 420px; padding: 18px 24px;
    border-radius: 16px; border: none;
    background: linear-gradient(135deg, #9333ea, #c026d3);
    color: white; font-family: 'Cinzel', serif;
    font-size: 15px; font-weight: 700; letter-spacing: 0.05em;
    cursor: pointer; box-shadow: 0 8px 32px rgba(168,85,247,0.6);
    transition: transform 0.15s, box-shadow 0.15s;
    animation: cta-pulse 2.5s ease-in-out infinite;
  }
  .btn-cta:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 14px 44px rgba(168,85,247,0.75);
    animation: none;
  }
  .btn-cta:disabled { opacity: 0.65; cursor: not-allowed; animation: none; }

  .btn-cta-sm {
    max-width: 340px; padding: 14px 20px; font-size: 13px;
    background: transparent; border: 1px solid rgba(139,92,246,0.5);
    box-shadow: none; color: #c4b5fd;
  }
  .btn-cta-sm:hover:not(:disabled) { background: rgba(139,92,246,0.1); transform: none; box-shadow: none; }

  /* ── Reforço ── */
  .reforco-block {
    margin-top: 48px; padding: 28px 16px;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    text-align: center;
  }
  .reforco-text { font-size: 17px; color: var(--muted); max-width: 420px; line-height: 1.7; font-style: italic; }

  /* ── Loading / erro ── */
  .center {
    min-height: 70vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    position: relative; z-index: 5; padding: 0 20px; text-align: center;
  }
  .spinner {
    width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: white; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .btn {
    padding: 12px 20px; border-radius: 14px;
    border: 1px solid var(--border); background: rgba(17,7,32,0.6);
    color: var(--text); cursor: pointer; font-family: 'Cinzel', serif;
    font-weight: 700; font-size: 15px; transition: all 0.2s;
  }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,92,246,0.3); }

  .muted { color: var(--muted); }
  .footer-note { margin-top: 32px; text-align: center; font-size: 14px; }

  /* Spinner de polling */
  .gerando-card {
    margin-top: 24px; border-radius: 20px; padding: 32px 24px;
    background: var(--card); border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    text-align: center;
  }
  .gerando-spinner {
    width: 36px; height: 36px; border-radius: 50%;
    border: 3px solid rgba(139,92,246,0.2);
    border-top-color: rgba(139,92,246,0.8);
    animation: spin 0.9s linear infinite;
  }
  .gerando-text { font-size: 16px; color: rgba(216,180,254,0.9); }
  .gerando-sub  { font-size: 13px; color: var(--muted); }

  /* Âncora de valor */
  .ancora-valor {
    font-size: 14px; color: var(--muted);
    letter-spacing: 0.04em; margin-bottom: 4px; margin-top: -4px;
  }

  /* Preview do manual */
  .manual-preview-note {
    width: 100%; max-width: 380px;
    font-size: 14px; padding: 12px 16px; border-radius: 12px;
    background: rgba(139,92,246,0.08);
    border: 1px solid rgba(139,92,246,0.2);
    text-align: center; color: rgba(216,180,254,0.9);
    line-height: 1.6; margin: 4px 0;
  }

  /* Garantia melhorada */
  .garantia-nova {
    width: 100%; max-width: 380px;
    padding: 16px; border-radius: 14px;
    border: 1px solid rgba(16,185,129,0.25);
    background: rgba(16,185,129,0.05);
    text-align: center; margin-top: 4px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .garantia-icon { font-size: 24px; }
  .garantia-titulo { font-size: 15px; font-weight: 700; color: rgba(167,243,208,0.95); }
  .garantia-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

  /* Countdown real */
  .countdown-real {
    font-size: 14px; color: var(--muted);
    text-align: center; line-height: 1.6; max-width: 380px;
  }

  /* Pós-compra */
  .pos-compra {
    font-size: 13px; color: var(--muted);
    text-align: center; margin-top: -4px;
  }

  /* Frase de transição */
  .transicao-text {
    text-align: center; font-size: 16px; color: var(--muted);
    margin: 24px 0; font-style: italic;
  }

  /* Sticky CTA — mobile only */
  .sticky-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    height: 64px;
    background: rgba(10,1,24,0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(139,92,246,0.3);
    align-items: center; justify-content: center;
    padding: 0 16px;
  }
  @media (max-width: 767px) {
    .sticky-bar { display: flex; }
  }
  .sticky-btn {
    width: 100%; max-width: 300px; padding: 12px 20px;
    border-radius: 12px; border: none;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white; font-family: 'Cinzel', serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
    cursor: pointer; box-shadow: 0 4px 20px rgba(139,92,246,0.4);
  }

  /* Mini-CTA link */
  .mini-cta-link {
    display: block; margin-top: 14px;
    background: none; border: none; cursor: pointer;
    color: rgba(139,92,246,0.9); font-size: 14px;
    font-family: 'Cormorant Garamond', serif;
    letter-spacing: 0.03em; text-decoration: none;
    transition: color 0.15s;
  }
  .mini-cta-link:hover { color: rgba(168,85,247,1); }

  /* Social proof */
  .social-block { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
  .testimonial-item {
    padding: 14px 18px; border-radius: 14px;
    background: transparent;
    border-left: 2px solid rgba(139,92,246,0.35);
  }
  .testimonial-text {
    font-size: 16px; font-style: italic;
    color: var(--text); line-height: 1.65; margin-bottom: 6px;
  }
  .testimonial-author { font-size: 13px; color: var(--muted); font-weight: 600; }

  /* Garantia */
  .garantia-card {
    width: 100%; max-width: 420px;
    padding: 14px 16px; border-radius: 12px;
    border: 1px solid rgba(16,185,129,0.3);
    background: transparent;
    color: rgba(167,243,208,0.85); font-size: 14px;
    line-height: 1.6; text-align: center;
  }

  /* ── Social proof ── */
  .social-proof-card {
    background: transparent; border-color: rgba(216,180,254,0.08);
    padding: 16px 22px; text-align: center;
  }
  .social-proof-text { font-size: 14px; color: var(--muted); letter-spacing: 0.04em; }

  /* ── Índice do manual ── */
  .manual-index-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
  .manual-index-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 15px; line-height: 1.5;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .manual-index-item:last-child { border-bottom: none; }
  .manual-index-seen { color: rgba(250,245,255,0.95); }
  .manual-index-locked { color: var(--muted); opacity: 0.7; }
  .manual-index-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
  .manual-index-seen .manual-index-icon { color: #10b981; font-weight: 700; }
  .manual-index-footer {
    margin-top: 18px; font-size: 14px; font-style: italic;
    color: var(--muted); text-align: center; line-height: 1.65;
  }

  /* Autoridade */
  .autoridade-text {
    margin-top: 40px;
    font-size: 14px; color: var(--muted);
    text-align: center; line-height: 1.7;
    max-width: 480px; margin-left: auto; margin-right: auto;
  }
`;
