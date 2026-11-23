'use client';

// /resultado/[id] — o Mapa grátis (prévia) + a venda do Manual do seu Mapa.
// Visual da Minha Área desde nov/2026 (resultado.module.css). Ordem:
//   1. Topo: céu do nascimento, nome, arquétipo, signo · número · anjo · Kin
//   2. Leitura grátis inteira (preview, citação do diagnóstico, carta, 1º passo)
//   3. Seu dia de hoje (DiaResumo, motor do Seu Dia) → /seu-dia
//   4. O Manual do seu Mapa (#comprar): as 14 seções com título da pessoa,
//      1 trecho borrado, preço + contador, combo, garantia, UM botão
//   5. Fim: compatibilidade, Você também é…, card do story, presente, FAQ
// NÃO MUDOU: checkout (/api/criar-checkout-mp, modal de e-mail inválido,
// ?pagamento=recusado, ?pending=true), preço (lib/preco.js + contador de 24h),
// combo, eventos GA4/Meta. Peso: nada de lib/manualgenerator.js; céu, anjo,
// Kin, Seu Dia, ChatAssistente e VoceTambem entram via next/dynamic.
// Oráculo: só abre com ?chat=1 (link do /oraculo); sem o balão flutuante nem
// a abertura automática no fim da página. Exit-intent: removido.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import { getTopMatches } from '@/lib/compatibilidade';
import { TESTIMONIALS } from '@/lib/testimonials';
import { getArquetipoPrincipal } from '@/lib/arquetipoCard';
import BotaoCompartilharStory from '@/app/components/BotaoCompartilharStory';
import { PRECO_MANUAL_JANELA, PRECO_MANUAL_PADRAO, PRECO_BONUS_COMBO } from '@/lib/preco';
import { emailValido } from '@/lib/emailValidacao';
import SiteNav from '@/app/components/SiteNav';
import { salvarSeForMeu } from '@/lib/perfilLocal';
import { salvarEmailSeuDia } from '@/lib/seuDiaRepasse';
import { TESTE_SEU_DIA_ATIVO } from '@/lib/testeSeuDia';
import { secoesDoManual, rotuloContador, faqResultado } from '@/lib/resultadoManual';
import r from './resultado.module.css';

// Fora do pacote inicial: o céu e a linha anjo/Kin do topo, o dia de hoje
// (lib/seuDia.js), o Oráculo (só com ?chat=1) e o "Você também é…".
const CeuFundo = dynamic(() => import('./TopoCeu').then((m) => m.CeuFundo), { ssr: false });
const ExtrasTopo = dynamic(() => import('./TopoCeu').then((m) => m.ExtrasTopo), { ssr: false });
const DiaHoje = dynamic(() => import('./DiaHoje'), { ssr: false });
const ChatAssistente = dynamic(() => import('@/app/components/ChatAssistente'), { ssr: false });
const VoceTambem = dynamic(() => import('@/app/components/VoceTambem'), { ssr: false });

// ── Supabase ──────────────────────────────────────────────────────────────────
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Nascimento da análise no formato do perfil local (lib/perfilLocal.js). */
function dadosDaAnalise(a) {
  if (!a?.data_nascimento) return null;
  const temCidade = a.fuso_iana && typeof a.latitude === 'number' && typeof a.longitude === 'number';
  const [cidadeNome, uf] = String(a.local_nascimento || '').split(',').map((x) => x.trim());
  return {
    nome: String(a.nome || '').trim().split(' ')[0],
    dataNascimento: a.data_nascimento,
    hora: /^\d{2}:\d{2}/.test(a.hora_nascimento || '') ? a.hora_nascimento.slice(0, 5) : null,
    cidade: temCidade ? { ibge: a.municipio_ibge ?? null, nome: cidadeNome || '', uf: uf || '', lat: a.latitude, lon: a.longitude, tz: a.fuso_iana } : null,
  };
}

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

const semAspas = (t) => String(t || '').trim().replace(/^["“”']+|["“”']+$/g, '').trim();

function parseJson(txt, montar) {
  if (!txt) return null;
  try { return montar(JSON.parse(txt)); } catch { return null; }
}

// Add-on do combo (Projeção de 12 Meses + Human Design) junto com o Manual.
function ComboToggle({ checked, onChange, precoTotal }) {
  return (
    <label className={`${r.combo} ${checked ? r.comboOn : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        Incluir também a <strong>Projeção de 12 Meses + Mapa de Human Design</strong> (+R$ {PRECO_BONUS_COMBO}, R$ {precoTotal} no total)
      </span>
    </label>
  );
}

function Pagina({ children }) {
  return (
    <div className={r.pagina}>
      <style jsx global>{`html, body { background: #07040d; max-width: 100%; overflow-x: hidden; }`}</style>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultadoPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPending = searchParams.get('pending') === 'true';
  const pagamentoRecusado = searchParams.get('pagamento') === 'recusado';
  const abrirChat = searchParams.get('chat') === '1';

  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [retryCount, setRetryCount]   = useState(0);
  const [retrying,   setRetrying]     = useState(false);
  const [pendingTimedOut, setPendingTimedOut] = useState(false);
  const [pendingRetryKey, setPendingRetryKey] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [statsCount, setStatsCount] = useState(null);
  const [ofertaExpirada, setOfertaExpirada] = useState(false);
  const [incluirTier2, setIncluirTier2] = useState(false);
  const [presenteAberto, setPresenteAberto] = useState(false);
  const [ehPresente, setEhPresente] = useState(false);
  const [presenteEmail, setPresenteEmail] = useState('');
  const [presenteDe, setPresenteDe] = useState('');
  // Barra fixa do celular: aparece depois do topo, some com o bloco do Manual na tela.
  const [passouTopo, setPassouTopo] = useState(false);
  const [manualNaTela, setManualNaTela] = useState(false);
  // Link manual de reserva: alguns navegadores internos (Instagram/Facebook)
  // bloqueiam o redirecionamento automático pro Mercado Pago sem gerar erro
  // de JS nenhum — a pessoa só fica parada na mesma página. Guardando a URL
  // aqui garante que sempre exista um link real e clicável como alternativa.
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const topoRef = useRef(null);
  const manualRef = useRef(null);

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
        try { window.localStorage.setItem('ic_ultima_analise_id', id); } catch {}
        salvarSeForMeu(dadosDaAnalise(data));
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

  // contador real de análises geradas (prova social) — arredondado pra baixo, sem inventar número
  useEffect(() => {
    let mounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => { if (mounted) setStatsCount(data?.count ?? null); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // polling de confirmação de pagamento — só ativa com ?pending=true (retorno do PIX/MP)
  useEffect(() => {
    if (!isPending || !id) return;
    setPendingTimedOut(false);
    let mounted = true;
    let timer = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 x 4s ≈ 2 minutos

    async function checkPayment() {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data } = await supabase
            .from('analises')
            .select('payment_status')
            .eq('id', id)
            .single();
          if (!mounted) return;
          if (data?.payment_status === 'paid') {
            router.replace(`/manual/${id}`);
            return;
          }
        }
      } catch {}

      if (!mounted) return;
      attempts += 1;
      if (attempts >= maxAttempts) {
        setPendingTimedOut(true);
        return;
      }
      timer = setTimeout(checkPayment, 4000);
    }

    checkPayment();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [isPending, id, router, pendingRetryKey]);

  // derived
  const signoFinal = useMemo(() => {
    if (!analise) return '';
    return analise.signo || calcularSigno(analise.data_nascimento);
  }, [analise]);

  const numeroVidaFinal = useMemo(() => {
    if (!analise) return 0;
    return analise.numero_vida || calcularNumeroVida(analise.data_nascimento);
  }, [analise]);

  const diagnosticoParsed = useMemo(() => parseJson(analise?.diagnostico_gerado, (p) => ({ frase: p?.frase_diagnostico || null, combinacao: p?.combinacao || null })), [analise]);
  const amorParsed = useMemo(() => parseJson(analise?.amor_gerado, (p) => ({ headline: p?.headline || null })), [analise]);
  const dinheiroParsed = useMemo(() => parseJson(analise?.dinheiro_gerado, (p) => ({ headline: p?.headline || null })), [analise]);
  const arquetiposParsed = useMemo(() => parseJson(analise?.arquetipos_gerado, (p) => ({ dominante: p?.dominante || null, emocional: p?.emocional || null, sombra: p?.sombra || null })), [analise]);
  const cartaTarot = useMemo(() => parseJson(analise?.carta_tarot, (p) => p), [analise]);
  const cartaTarotInterp = useMemo(() => parseJson(analise?.carta_tarot_interpretacao, (p) => ({ titulo: p?.titulo || null, body: p?.body || null })), [analise]);
  const plano7Parsed = useMemo(() => parseJson(analise?.plano7_gerado, (p) => ({ headline: p?.headline || null, hook: p?.hook || null, days: Array.isArray(p?.days) ? p.days : [] })), [analise]);

  const iaCompleta = Boolean(
    analise?.diagnostico_gerado && analise?.amor_gerado && analise?.arquetipos_gerado
  );

  const compatTeaser = useMemo(() => {
    if (!signoFinal) return null;
    const matches = getTopMatches(signoFinal, 1);
    return matches[0] || null;
  }, [signoFinal]);

  const dados = useMemo(() => dadosDaAnalise(analise), [analise]);

  // polling — refetch até diagnostico + amor + arquetipos chegarem (até 10 tentativas × 4s = 40s)
  useEffect(() => {
    if (!analise || iaCompleta || retryCount >= 10) return;
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
  }, [analise, retryCount, id, iaCompleta]);

  // Barra fixa do celular: topo fora da tela e bloco do Manual fora da tela.
  useEffect(() => {
    if (!analise) return;
    const topo = topoRef.current, manual = manualRef.current;
    if (!topo || !manual) return;
    const obsTopo = new IntersectionObserver(([e]) => setPassouTopo(!e.isIntersecting), { threshold: 0 });
    const obsManual = new IntersectionObserver(([e]) => setManualNaTela(e.isIntersecting), { threshold: 0 });
    obsTopo.observe(topo);
    obsManual.observe(manual);
    return () => { obsTopo.disconnect(); obsManual.disconnect(); };
  }, [analise]);

  // Vindo do cadeado da Minha Área (/resultado/<id>#comprar): o conteúdo só
  // aparece depois do fetch, então o navegador não acha a âncora sozinho.
  useEffect(() => {
    if (!analise || typeof window === 'undefined' || window.location.hash !== '#comprar') return;
    const t = setTimeout(() => manualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    return () => clearTimeout(t);
  }, [analise]);

  // Instrumentação: primeira vez que a oferta entra na tela — separa
  // "não leu até lá" de "leu e não clicou". Dispara só 1x por visita.
  useEffect(() => {
    if (!analise) return;
    const offerEl = manualRef.current;
    if (!offerEl) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          try { window?.gtag?.('event', 'resultado_oferta_visivel', { event_category: 'engagement' }); } catch {}
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(offerEl);
    return () => obs.disconnect();
  }, [analise]);

  // Instrumentação: profundidade de rolagem — pra saber até onde a pessoa lê
  // antes de desistir. Cada marco dispara só 1x por visita.
  const firedDepthRef = useRef(new Set());
  useEffect(() => {
    if (!analise) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollable = (doc.scrollHeight || 0) - doc.clientHeight;
        const percent = scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 0;
        [25, 50, 75, 100].forEach((marco) => {
          if (percent >= marco && !firedDepthRef.current.has(marco)) {
            firedDepthRef.current.add(marco);
            try {
              window?.gtag?.('event', 'resultado_scroll_depth', { event_category: 'engagement', percent: marco });
            } catch {}
          }
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [analise]);

  // contador de urgência — ancorado no created_at real da análise (igual em
  // qualquer aparelho/sessão) em vez de "15min a partir de quando abriu a
  // página", que resetava sozinho e nunca mudava o preço de verdade.
  useEffect(() => {
    if (!analise?.created_at || typeof window === 'undefined') return;
    const DURACAO_MS = 24 * 60 * 60 * 1000; // 24 horas — preço vale só no dia em que a análise foi gerada
    const deadline = new Date(analise.created_at).getTime() + DURACAO_MS;
    const tick = () => {
      const rest = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(rest);
      if (rest <= 0) setOfertaExpirada(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [analise?.created_at]);

  const countdownLabel = useMemo(() => rotuloContador(secondsLeft), [secondsLeft]);

  // compra
  const handleShareWhatsapp = () => {
    try { window?.gtag?.('event', 'compartilhar_whatsapp', { event_category: 'engagement' }); } catch {}
    const shareUrl = `${window.location.origin}/?utm_source=whatsapp_share&utm_medium=referral`;
    const text = `Acabei de fazer meu mapa (numerologia + astrologia) e o resultado foi certeiro ✨🔮 Faz o seu grátis aqui: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Quando criar-checkout-mp recusa por e-mail inválido salvo na análise
  // (ver app/api/criar-checkout-mp/route.js), guarda a mensagem aqui em vez
  // do alert() genérico — o modal abaixo deixa corrigir sem refazer o quiz.
  const [emailCorrecaoInfo, setEmailCorrecaoInfo] = useState(null);
  const [novoEmailInput, setNovoEmailInput] = useState('');

  const handleComprar = async (emailCorrigido) => {
    if (ehPresente && !emailValido(presenteEmail)) {
      alert('Digite um email válido pra quem vai receber o presente.');
      return;
    }
    setProcessando(true);
    // Antes era hardcoded (47/97) — divergia do preço real fora da janela.
    // precoAtual já é a fonte de verdade (lib/preco.js) usada no botão/CTA.
    const valorTotal = incluirTier2 ? precoAtual + PRECO_BONUS_COMBO : precoAtual;
    try {
      try { window?.gtag?.('event', 'clique_comprar', { event_category: 'conversion', value: valorTotal, currency: 'BRL' }); } catch {}
      try { window?.fbq?.('track', 'InitiateCheckout', { value: valorTotal, currency: 'BRL' }); } catch {}
      const response = await fetch('/api/criar-checkout-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analiseId: id,
          incluirTier2,
          ...(ehPresente && { presenteEmail: presenteEmail.trim(), presenteDe: presenteDe.trim() }),
          ...(emailCorrigido && { emailCorrigido }),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.error === 'email_invalido') {
          setEmailCorrecaoInfo({ mensagem: data?.mensagem || 'O e-mail salvo parece inválido.' });
          setNovoEmailInput(emailCorrigido || data?.emailAtual || '');
          return;
        }
        throw new Error(data?.details || data?.error || 'Erro ao abrir checkout');
      }
      const url = data?.url || data?.sandbox_url;
      if (!url) throw new Error('Checkout sem URL');
      setEmailCorrecaoInfo(null);
      // Guarda a URL antes de tentar redirecionar: se o redirecionamento
      // automático for bloqueado silenciosamente (sem lançar erro nenhum),
      // o link manual abaixo continua disponível pra pessoa tocar.
      setCheckoutUrl(url);
      window.location.href = url;
      return;
    } catch (e) {
      console.error('Erro no checkout:', e);
      // 10 pessoas clicaram em comprar nos últimos 30 dias e nenhuma gerou
      // mp_preference_id no banco — sem acesso a log de produção, esse evento
      // é o único jeito de ver a mensagem de erro real na próxima vez que
      // isso acontecer.
      try { window?.gtag?.('event', 'erro_checkout', { event_category: 'error', erro: String(e?.message || e).slice(0, 100) }); } catch {}
      alert(e?.message || 'Erro. Tente novamente.');
    } finally { setProcessando(false); }
  };

  const handleConfirmarNovoEmail = () => {
    const trimmed = novoEmailInput.trim();
    if (!emailValido(trimmed)) {
      alert('Digite um e-mail válido.');
      return;
    }
    handleComprar(trimmed);
  };

  // "Receber meu dia todo dia às 7h": o e-mail da análise vai pro login por
  // código do /seu-dia por localStorage (lib/seuDiaRepasse.js), nunca na URL.
  const irProSeuDia = () => {
    try { window?.gtag?.('event', 'resultado_teste_clique', { event_category: 'seu_dia', pago: analise?.payment_status === 'paid' }); } catch {}
    salvarEmailSeuDia(analise?.email || '');
  };

  // Previsão do Ano e Human Design não têm mais compra avulsa — só liberam
  // junto com o Manual (combo acima e app/api/criar-checkout-upsell-mp/route.js,
  // que exige o Manual pago).

  // loading / erro
  if (loading) {
    return (
      <Pagina>
        <div className={r.centro}>
          <div className={r.spinner} />
          <p className={r.texto}>Carregando seu Mapa…</p>
        </div>
      </Pagina>
    );
  }

  if (erro || !analise) {
    return (
      <Pagina>
        <div className={r.centro}>
          <h1 className={r.centroTitulo}>Ops…</h1>
          <p className={r.texto}>{erro || 'Erro ao carregar'}</p>
          <button className={r.btn} onClick={() => router.push('/')}>Voltar</button>
        </div>
      </Pagina>
    );
  }

  if (isPending && !pendingTimedOut) {
    return (
      <Pagina>
        <div className={r.centro}>
          <div className={r.spinner} />
          <p className={r.texto}>Confirmando seu pagamento…</p>
          <p className={r.rotulo}>Isso pode levar alguns instantes.</p>
        </div>
      </Pagina>
    );
  }

  if (isPending && pendingTimedOut) {
    return (
      <Pagina>
        <div className={r.centro}>
          <h1 className={r.centroTitulo}>Quase lá…</h1>
          <p className={r.texto} style={{ maxWidth: 460 }}>
            Ainda estamos confirmando seu pagamento — isso pode levar alguns minutos.
            Você também vai receber o link do seu Manual por e-mail assim que for confirmado.
          </p>
          <button className={r.btn} onClick={() => setPendingRetryKey((k) => k + 1)}>
            Verificar de novo
          </button>
          <Link href={`/resultado/${id}`} className={r.link}>Voltar para a oferta</Link>
        </div>
      </Pagina>
    );
  }

  const firstName = pickFirstName(analise.nome);
  const pago = analise.payment_status === 'paid';
  // "mais de X" sempre arredondado pra baixo (nunca infla o número real); só mostra a partir de um mínimo plausível
  const roundedStatsCount = statsCount && statsCount >= 15 ? Math.floor(statsCount / 10) * 10 : null;
  // Preço de verdade, não só visual: depois que a janela de 24h expira, o
  // preço de lançamento acaba de fato — lib/preco.js é a fonte única dessa
  // regra, usada aqui e nos dois checkouts (MP e Stripe), então nunca fica
  // um valor exibido diferente do que é cobrado.
  const precoAtual = ofertaExpirada ? PRECO_MANUAL_PADRAO : PRECO_MANUAL_JANELA;
  const precoTotal = incluirTier2 ? precoAtual + PRECO_BONUS_COMBO : precoAtual;
  const rotuloComprar = incluirTier2
    ? `Desbloquear o Manual + Projeção e Human Design · R$ ${precoTotal}`
    : `Desbloquear o Manual do seu Mapa · R$ ${precoAtual}`;
  const arquetipo = signoFinal && numeroVidaFinal
    ? getArquetipoPrincipal({ signo: signoFinal, numeroVida: numeroVidaFinal, objetivoPrincipal: analise.objetivo_principal })
    : null;
  const secoes = secoesDoManual({
    nome: firstName, signo: signoFinal, numero: numeroVidaFinal, anoPessoal: analise.ano_pessoal,
    objetivo: analise.objetivo_principal, arquetipo: arquetipo?.nome,
    diagnostico: diagnosticoParsed, amor: amorParsed, dinheiro: dinheiroParsed, arquetipos: arquetiposParsed, plano7: plano7Parsed,
  });
  const trechoBorrado = !pago && diagnosticoParsed?.combinacao ? truncateAtWord(diagnosticoParsed.combinacao, 220) : null;
  // Manual pago há menos de 30 dias = Seu Dia Completo de cortesia (Termos, seção 5).
  const cortesiaAtiva = pago && analise.paid_at && Date.now() - new Date(analise.paid_at).getTime() < 30 * 86400000;
  const primeiroPasso = plano7Parsed?.days?.[0] || null;
  const mostrarBarra = !pago && passouTopo && !manualNaTela;

  return (
    <Pagina>
      <SiteNav active="meu-mapa" />

      {/* Pagamento recusado no MP — volta aqui via back_urls.failure */}
      {pagamentoRecusado && (
        <div className={r.banner} role="alert">
          <strong>Seu pagamento não foi aprovado.</strong> Tente outro cartão ou pague com Pix — costuma ser mais rápido e sem recusa.
        </div>
      )}

      {/* ══ 1. TOPO ══ */}
      <header ref={topoRef} className={r.hero}>
        {dados && <CeuFundo dados={dados} />}
        <div className={r.heroVeu} aria-hidden="true" />
        <div className={r.heroConteudo}>
          <div className={r.heroTexto}>
            <span className={r.eyebrow}>Seu Mapa</span>
            <h1 className={`${r.nome} ${firstName.length > 7 ? r.nomeLongo : ''}`}>{firstName || 'Você'}</h1>
            {arquetipo && <p className={r.arquetipo}>{arquetipo.nome}</p>}
            {dados
              ? <ExtrasTopo dados={dados} signo={signoFinal} numero={numeroVidaFinal} />
              : <p className={r.chips}>{[signoFinal, numeroVidaFinal].filter(Boolean).join(' · ')}</p>}
          </div>
          {numeroVidaFinal ? (
            <div className={r.heroNumero} aria-hidden="true">
              <span className={r.numeroGrande}>{numeroVidaFinal}</span>
              <span className={r.rotulo}>Número de vida</span>
            </div>
          ) : null}
        </div>
      </header>

      <main className={r.corpo}>

        {/* ══ 2. LEITURA GRÁTIS — inteira, sem borrão ══ */}
        <section className={r.secao} aria-labelledby="leitura">
          <div className={r.secaoTopo}>
            <span className={r.eyebrow}>Sua leitura grátis</span>
            <h2 id="leitura" className={r.h2}>{firstName}, olha o que apareceu <em>no seu mapa</em></h2>
          </div>
          {analise.preview_gerado && <p className={r.citacao}>“{semAspas(analise.preview_gerado)}”</p>}

          <div className={r.linhas}>
            {diagnosticoParsed?.frase && (
              <div className={r.linhaLeitura}>
                <span className={r.rotulo}>Seu diagnóstico</span>
                <p className={r.linhaTitulo}><em>“{semAspas(diagnosticoParsed.frase)}”</em></p>
              </div>
            )}

            {cartaTarot && (
              <div className={`${r.linhaLeitura} ${r.carta}`}>
                <div className={r.cartaImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={analise.imagem_ia_url || `/api/og/${id}`} alt="" />
                  <div className={r.cartaImgVeu}>
                    <span className={r.cartaImgNome}>{firstName}</span>
                    <span className={r.rotulo} style={{ color: 'var(--ouro-2)' }}>{cartaTarot.nome}{cartaTarot.invertida ? ' · invertida' : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className={r.rotulo}>Sua carta do dia · {cartaTarot.nome}{cartaTarot.invertida ? ' invertida' : ''}</span>
                  {cartaTarotInterp?.titulo && <p className={r.linhaTitulo}>{semAspas(cartaTarotInterp.titulo)}</p>}
                  {cartaTarotInterp?.body && <p className={r.texto}>{firstSentences(cartaTarotInterp.body, 2)}</p>}
                </div>
              </div>
            )}

            {primeiroPasso && (
              <div className={r.linhaLeitura}>
                <span className={r.rotulo}>Seu primeiro passo</span>
                <p className={r.texto}>{primeiroPasso}</p>
              </div>
            )}

            {/* enquanto diagnóstico + amor + arquétipos não chegam */}
            {!iaCompleta && (retrying || retryCount < 3) && (
              <div className={r.gerando}>
                <div className={r.spinner} />
                <span>Gerando o resto da sua leitura… leva alguns segundos.</span>
              </div>
            )}
          </div>
        </section>

        {/* ══ 3. SEU DIA DE HOJE ══ */}
        {dados && (
          <section className={r.secao} aria-labelledby="dia-hoje">
            <div className={r.dia}>
              <div className={r.diaTexto}>
                <span className={r.eyebrow}>Seu dia de hoje</span>
                <h2 id="dia-hoje" className={r.h2}>O seu mapa, <em>lido pro dia de hoje</em></h2>
                <p className={r.diaFrase}>O que fazer, o que evitar e as melhores horas, todo dia, a partir do seu nascimento.</p>
                <a className={r.btn} href="/seu-dia" onClick={irProSeuDia}>Receber meu dia todo dia às 7h</a>
                {cortesiaAtiva
                  ? <p className={r.teste}>Seu Dia Completo incluso por 30 dias com o seu Manual</p>
                  : TESTE_SEU_DIA_ATIVO && !pago && <p className={r.teste}>7 dias do Seu Dia Completo grátis, sem cartão</p>}
              </div>
              <div className={r.diaPrevia}>
                <span className={r.selo}>hoje, pra você</span>
                <DiaHoje dados={dados} />
              </div>
            </div>
          </section>
        )}

        {/* ══ 4. O MANUAL DO SEU MAPA (#comprar) ══ */}
        <section ref={manualRef} id="comprar" className={`${r.secao} ${r.manual}`} aria-labelledby="manual">
          <div className={`${r.secaoTopo} ${r.manualTopo}`}>
            <span className={r.eyebrow}>{pago ? 'Liberado' : 'O Manual do seu Mapa'}</span>
            <h2 id="manual" className={r.h2}>
              {pago ? <>O seu Manual <em>já está liberado</em></> : <>14 seções escritas <em>só pra {firstName || 'você'}</em></>}
            </h2>
          </div>

          <ol className={r.secoes}>
            {secoes.map((s, i) => (
              <li key={s.chave} className={r.secaoManual}>
                <span className={r.secaoNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={r.rotulo}>{s.rotulo}</span>
                <p className={r.secaoTitulo}>{s.titulo}</p>
                {/* O único trecho borrado da página: o começo do diagnóstico
                    (o mesmo texto que a prévia antiga já mostrava legível). */}
                {i === 0 && trechoBorrado && <p className={r.borrado} aria-hidden="true">{trechoBorrado}</p>}
              </li>
            ))}
          </ol>

          {pago ? (
            <div className={r.oferta}>
              <span className={r.liberado}>Pago · acesso liberado</span>
              <p className={r.texto}>As 14 seções estão prontas pra você ler, quantas vezes quiser.</p>
              <Link className={`${r.btn} ${r.btnLargo}`} href={`/manual/${id}`}>Abrir meu Manual</Link>
              {cortesiaAtiva && <p className={r.nota}>Com ele vêm 30 dias do Seu Dia Completo, sem cobrança e sem renovação automática.</p>}
            </div>
          ) : (
            <div className={r.oferta}>
              <div className={r.precoLinha}>
                {!ofertaExpirada && <span className={r.precoDe}>de R$ {PRECO_MANUAL_PADRAO},00</span>}
                <span className={r.precoPor}>R$ {precoAtual}</span>
              </div>
              {!ofertaExpirada && countdownLabel && (
                <p className={r.contador}>
                  R$ {PRECO_MANUAL_JANELA} só nas primeiras 24h, depois R$ {PRECO_MANUAL_PADRAO} · <strong>{countdownLabel}</strong>
                </p>
              )}
              <ul className={r.inclui}>
                <li>14 seções, 30+ páginas, só sobre você</li>
                <li>3 rituais com áudio guiado</li>
                <li>De bônus: a Compatibilidade Completa com uma pessoa (vendida por R$ 29,90)</li>
                <li>30 dias do Seu Dia Completo, sem cobrança</li>
                {!ofertaExpirada && <li>Enquanto esse preço valer: o Ritual de Ativação Personalizado</li>}
              </ul>
              <ComboToggle checked={incluirTier2} onChange={setIncluirTier2} precoTotal={precoAtual + PRECO_BONUS_COMBO} />
              <button className={`${r.btn} ${r.btnLargo}`} onClick={() => handleComprar()} disabled={processando}>
                {processando ? 'Abrindo…' : rotuloComprar}
              </button>
              <p className={r.nota}>Pix: acesso liberado na hora. Cartão: o link chega por e-mail em poucos minutos (confira o spam).</p>
              <div className={r.garantia}>
                <span className={r.garantiaTitulo}>Garantia de 7 dias</span>
                <p className={r.nota}>Se o Manual não trouxer clareza real sobre o seu padrão, devolvemos 100%. Sem perguntas.</p>
              </div>
              {roundedStatsCount && <p className={r.prova}>Mais de {roundedStatsCount} mapas feitos por aqui</p>}
            </div>
          )}

          {/* Depoimentos: só com conteúdo real em lib/testimonials.js (nunca inventar). */}
          {TESTIMONIALS.length > 0 && (
            <div className={r.fimLinhas} style={{ gridColumn: '1 / -1' }}>
              {TESTIMONIALS.slice(0, 3).map((t, i) => (
                <div key={i} className={r.fimLinha}>
                  <p className={r.linhaTitulo}><em>“{t.texto}”</em></p>
                  <span className={r.rotulo}>{t.nome}{t.cidade ? ` · ${t.cidade}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ 5. FIM ══ */}
        <section className={r.secao} aria-label="Mais do seu mapa">
          <div className={r.fimLinhas}>
            {compatTeaser && (
              <div className={r.fimLinha}>
                <span className={r.rotulo}>Compatibilidade</span>
                <p className={r.linhaTitulo}>{signoFinal} + {compatTeaser.signo.nome}: <em>{compatTeaser.score}%</em>, o par mais forte do seu signo</p>
                <Link className={r.link} href="/compatibilidade">Testar com outra pessoa</Link>
              </div>
            )}
            <div className={r.fimLinha}>
              <span className={r.rotulo}>Compartilhar</span>
              <p className={r.linhaTitulo}>O seu número, no story</p>
              <div className={r.compartilhar}>
                <BotaoCompartilharStory analiseId={id} pago={pago} numero={numeroVidaFinal} origem="resultado" className={r.btnSec} />
                <button type="button" className={r.btnSec} onClick={handleShareWhatsapp}>Mandar pra uma amiga</button>
              </div>
            </div>
          </div>
        </section>

        {dados && <VoceTambem dados={dados} atual="resultado" visual="ma" />}

        {!pago && (
          <section className={r.secao} aria-label="Presente">
            {!presenteAberto ? (
              <button type="button" className={r.link} onClick={() => { setPresenteAberto(true); setEhPresente(true); }}>
                Dar um Manual de presente
              </button>
            ) : (
              <div className={r.presente}>
                <span className={r.rotulo}>Dar um Manual de presente</span>
                <p className={r.nota}>O Manual continua sendo sobre os dados que você preencheu; o acesso vai direto pro e-mail abaixo, com uma mensagem de presente.</p>
                <label className={r.presenteCheck}>
                  <input type="checkbox" checked={ehPresente} onChange={(e) => setEhPresente(e.target.checked)} />
                  <span>É um presente pra outra pessoa</span>
                </label>
                {ehPresente && (
                  <>
                    <input type="email" className={r.campo} placeholder="E-mail de quem vai receber" value={presenteEmail} onChange={(e) => setPresenteEmail(e.target.value)} />
                    <input type="text" className={r.campo} placeholder="Seu nome (aparece no e-mail, opcional)" value={presenteDe} onChange={(e) => setPresenteDe(e.target.value)} />
                  </>
                )}
                <button type="button" className={r.btnSec} onClick={() => handleComprar()} disabled={processando}>
                  {processando ? 'Abrindo…' : ehPresente ? `Comprar de presente · R$ ${precoTotal}` : rotuloComprar}
                </button>
              </div>
            )}
          </section>
        )}

        <section className={r.secao} aria-labelledby="faq">
          <div className={r.secaoTopo}>
            <h2 id="faq" className={r.h2}>Perguntas frequentes</h2>
          </div>
          <div className={r.faq}>
            {faqResultado({ testeAtivo: TESTE_SEU_DIA_ATIVO }).map((f) => (
              <details key={f.q} className={r.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className={r.rodape}>
          <p>Precisa de ajuda? <strong>conceptintuitive@gmail.com</strong></p>
          <Link href="/?refazer=1" className={r.link}>Refazer meu mapa com outros dados</Link>
        </footer>
      </main>

      {/* Oráculo: só com ?chat=1 (link do /oraculo) */}
      {abrirChat && (
        <ChatAssistente analiseId={id} isPaid={false} firstName={firstName} autoOpen nudge={false} precoManual={precoAtual} />
      )}

      {/* Barra fixa do celular */}
      {mostrarBarra && (
        <div className={r.barra}>
          <div className={r.barraPreco}>
            <span className={r.barraValor}>R$ {precoAtual}</span>
            {!ofertaExpirada && countdownLabel && <span className={r.barraContador}>Esse preço por {countdownLabel}</span>}
          </div>
          <button type="button" className={r.btn} onClick={() => manualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            Ver o Manual
          </button>
        </div>
      )}

      {/* LINK MANUAL DE CHECKOUT — reserva pra quando o redirecionamento
          automático é bloqueado silenciosamente (comum em navegadores
          internos do Instagram/Facebook), sem gerar nenhum erro de JS. */}
      {checkoutUrl && (
        <div className={r.reserva}>
          <span>A tela de pagamento não abriu sozinha?</span>
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={r.link}>Abrir pagamento →</a>
        </div>
      )}

      {/* CORRIGIR E-MAIL — criar-checkout-mp recusou por e-mail inválido salvo */}
      {emailCorrecaoInfo && (
        <div className={r.modalFundo} onClick={() => setEmailCorrecaoInfo(null)}>
          <div className={r.modal} role="dialog" aria-modal="true" aria-labelledby="corrigir-email" onClick={(e) => e.stopPropagation()}>
            <button className={r.fechar} aria-label="Fechar" onClick={() => setEmailCorrecaoInfo(null)}>✕</button>
            <h2 id="corrigir-email" className={r.modalTitulo}>Confere seu e-mail?</h2>
            <p className={r.texto}>{emailCorrecaoInfo.mensagem}</p>
            <input
              type="email"
              className={r.campo}
              value={novoEmailInput}
              onChange={(e) => setNovoEmailInput(e.target.value.trim())}
              placeholder="seu@email.com"
            />
            <button className={`${r.btn} ${r.btnLargo}`} onClick={handleConfirmarNovoEmail} disabled={processando}>
              {processando ? 'Abrindo…' : 'Confirmar e continuar'}
            </button>
          </div>
        </div>
      )}
    </Pagina>
  );
}
