'use client';

// /manual/[id] — o Manual do seu Mapa (pago). Visual da Minha Área desde
// nov/2026 (manual.module.css): coluna de leitura de ~680px, seções abertas
// com a frase de destaque em citação grande, agrupadas em capítulos
// (lib/manualLeitura.js), índice lateral (desktop) / botão "Índice"
// (celular) com ✓ nas lidas, "Continuar de onde parou", bloco do Seu Dia
// depois da abertura e no fim, card da frase e .ics dos rituais sob demanda.
//
// NÃO MUDOU: confirmação de pagamento MP pós-redirect (?payment_id, polling,
// timeout), paywall Stripe pra quem não pagou, geração sob demanda
// (gerar-manual-completo, pendingFields, "Preparando…"), Olho Cósmico,
// ChatAssistente, complementos (Previsão/HD/Compatibilidade) e checkouts,
// BotaoCompartilharStory, conteúdo do lib/manualgenerator.js.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

import { generateManual, renderManualMarkdown } from '@/lib/manualgenerator';
import { getTopMatches } from '@/lib/compatibilidade';
import { calcularSignosPessoa, gerarCompatibilidadeCompleta } from '@/lib/compatibilidadeCompleta';
import FeedbackSecao, { chaveSecao } from '@/app/components/FeedbackSecao';
import BotaoCompartilharStory from '@/app/components/BotaoCompartilharStory';
import { getPrecoManual, PRECO_ASSINATURA_MENSAL } from '@/lib/preco';
import { offsetSalvo } from '@/lib/sky';
import SiteNav from '@/app/components/SiteNav';
import { useAssinatura } from '@/app/components/assinatura';
import { salvarEmailSeuDia } from '@/lib/seuDiaRepasse';
import {
  agruparEmCapitulos, destaqueDaSecao, chaveLidas, lerLidas, marcarLida, secaoParaContinuar,
  CHAVE_JORNADA, lerJornada, iniciarJornada, hojeBrasilia,
} from '@/lib/manualLeitura';
import {
  renderInline, splitBodyIntoParasAndQuote, CheckItem, ListenButton,
  buildRitualNarration, buildDiagBlockNarration, buildArchetypeNarration,
} from './pecas';
import m from './manual.module.css';

// Olho Cósmico (abertura "Meu Mapa"): chunk separado, só baixa pra quem pagou.
const OlhoCosmicoManual = dynamic(() => import('@/app/components/olho/OlhoCosmicoManual'), { ssr: false });
// Chat flutuante do Oráculo: só carrega depois do Manual.
const ChatAssistente = dynamic(() => import('@/app/components/ChatAssistente'), { ssr: false });
// Projeção de 12 Meses + Human Design (cálculos pesados): depois da página.
const Complementos = dynamic(() => import('./Complementos'), { ssr: false });

// ==============================================
// SUPABASE CLIENT
// ==============================================
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Variáveis de ambiente do Supabase não configuradas');
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

function firstSentences(text, maxSentences = 1) {
  const clean = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
  if (!clean) return '';
  const sentences = clean.match(/[^.!?]+[.!?]+(\s+|$)/g);
  if (!sentences) return clean;
  return sentences.slice(0, maxSentences).join(' ').trim();
}

/** Nascimento da análise no formato do perfil local (céu do card da frase). */
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

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => { try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }); } catch { return ''; } };

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'manual', ...params }); } catch {}
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

// Colunas IA do Manual (mesma lista de app/api/gerar-manual-completo/route.js,
// exceto sintese_gerada — não vira seção própria, é usada só como insumo
// interno do "Seu Mapa Completo"). Usada pra saber quais seções ainda estão
// pendentes enquanto a geração roda — ver lib/manualgenerator.js (pend()).
const CAMPOS_GERADOS_IA = [
  'diagnostico_gerado', 'tipo_pessoa_gerado', 'arquetipos_gerado', 'amor_gerado',
  'objetivo_gerado', 'leitura_gerada', 'plano7_gerado', 'ponto_cego_gerado',
  'bloqueios_gerado', 'dinheiro_gerado', 'rituais_gerado', 'calendario_gerado',
  'fechamento_gerado',
];

function Pagina({ children }) {
  return (
    <div className={m.pagina}>
      {/* overflow-x: clip (e não hidden) pra não quebrar o "sticky" do índice */}
      <style jsx global>{`html, body { background: #07040d; max-width: 100%; overflow-x: clip; }`}</style>
      {children}
    </div>
  );
}

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================
export default function ManualPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const abrirChat = searchParams.get('chat') === '1';

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [gerando, setGerando] = useState(false);

  const geracaoIniciada = useRef(false);

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
        try { window.localStorage.setItem('ic_ultima_analise_id', id); } catch {}
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

  // Acesso do e-mail (assinatura / 30 dias de cortesia do Manual) — decide o
  // bloco do Seu Dia. E o Intuitive Completo ANUAL inclui o Manual: se o
  // e-mail da análise tem o anual ativo, o servidor marca esta análise como
  // paga (origem 'assinatura') e a página recarrega já liberada.
  const acesso = useAssinatura(row ? id : null);
  useEffect(() => {
    if (!hasPaid && acesso?.manualLiberado) window.location.reload();
  }, [acesso, hasPaid]);

  // ==============================================
  // CHEGOU DO REDIRECT DO MP (?payment_id=...) — confirmação pós-pagamento
  // Enquanto não sabemos se payment_status já virou 'paid' (corrida contra o
  // webhook), NUNCA mostra o paywall normal com botão "Desbloquear" pra quem
  // claramente acabou de pagar — mostra "Confirmando..." + polling.
  // ==============================================
  const mpPaymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const [confirmandoMp, setConfirmandoMp] = useState(Boolean(mpPaymentId));
  const [mpConfirmTimedOut, setMpConfirmTimedOut] = useState(false);
  const [mpConfirmRetryKey, setMpConfirmRetryKey] = useState(0);

  useEffect(() => {
    if (!mpPaymentId || !id || loading) return;
    if (hasPaid) { setConfirmandoMp(false); return; }

    let mounted = true;
    let timer = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 x 3s = 2 minutos
    setConfirmandoMp(true);
    setMpConfirmTimedOut(false);

    async function refetchRow() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;
        const { data } = await supabase.from('analises').select('*').eq('id', id).single();
        if (!mounted || !data) return false;
        setRow(data);
        return isPaid(data);
      } catch {
        return false;
      }
    }

    async function poll() {
      const pago = await refetchRow();
      if (!mounted) return;
      if (pago) { setConfirmandoMp(false); return; }
      attempts += 1;
      if (attempts >= maxAttempts) {
        setConfirmandoMp(false);
        setMpConfirmTimedOut(true);
        return;
      }
      timer = setTimeout(poll, 3000);
    }

    // Consulta a API do MP direto no servidor (sem esperar o webhook) — se
    // já estiver 'approved', libera na hora. Idempotente com o webhook
    // (ver lib/mpPagamentoManual.js): não importa qual dos dois chega primeiro.
    async function confirmarEEntaoPollar() {
      try {
        const res = await fetch('/api/confirmar-pagamento-mp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analiseId: id, paymentId: mpPaymentId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (data?.pago) {
          const confirmou = await refetchRow();
          if (!mounted) return;
          if (confirmou) { setConfirmandoMp(false); return; }
        }
      } catch {}
      if (!mounted) return;
      poll();
    }

    confirmarEEntaoPollar();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [mpPaymentId, id, loading, hasPaid, mpConfirmRetryKey]);

  // ==============================================
  // PIXEL DO META — PURCHASE (client-side)
  // Só dispara quando hasPaid já é true (mesma trava que libera o conteúdo).
  // event_id = o mesmo transactionId que o Conversions API já usa no
  // webhook (stripe_session_id ou mp_payment_id) — é isso que faz o Meta
  // deduplicar o evento do navegador com o do servidor em vez de contar a
  // compra duas vezes. Guarda em localStorage pra não reenviar se a pessoa
  // reabrir a página do manual depois.
  useEffect(() => {
    if (!hasPaid || !row) return;
    const transactionId = row.stripe_session_id || row.mp_payment_id;
    if (!transactionId) return;

    const storageKey = `ic_purchase_fired_${id}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
    } catch {}

    // Valor real cobrado (valor_pago) quando existe; senão a mesma regra do
    // checkout (lib/preco.js) com paid_at como referência — não "agora".
    const valorPurchase = typeof row.valor_pago === 'number'
      ? row.valor_pago
      : getPrecoManual(row.created_at, row.paid_at ? new Date(row.paid_at).getTime() : Date.now());

    try {
      window?.fbq?.(
        'track',
        'Purchase',
        {
          value: valorPurchase,
          currency: 'BRL',
          content_ids: [id],
          content_type: 'product',
          content_name: 'Manual Premium Personalizado',
        },
        { eventID: transactionId }
      );
    } catch {}

    try { window.localStorage.setItem(storageKey, '1'); } catch {}
  }, [hasPaid, row, id]);

  // ==============================================
  // BARRA DE PROGRESSO DE LEITURA
  // ==============================================
  const [readProgress, setReadProgress] = useState(0);
  // O botão "Índice" (celular) só aparece com o conteúdo na tela, não por cima do Olho.
  const [noConteudo, setNoConteudo] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      // O progresso conta a partir do conteúdo do manual, não do Olho Cósmico
      // que fica em cima dele (são ~9 telas de animação).
      const inicio = document.getElementById('manual')?.offsetTop || 0;
      const scrollable = (doc.scrollHeight || 0) - doc.clientHeight - inicio;
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, ((window.scrollY - inicio) / scrollable) * 100)) : 0;
      setReadProgress(pct);
      setNoConteudo(window.scrollY + window.innerHeight * 0.6 >= inicio);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ==============================================
  // CHECKLIST INTERATIVO (Plano 7 dias, Rituais, Calendário) — persiste por análise
  // ==============================================
  const [checks, setChecks] = useState({});
  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`ic_manual_checks_${id}`);
      if (raw) setChecks(JSON.parse(raw));  
    } catch {}
  }, [id]);

  const toggleCheck = useCallback((key) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { window.localStorage.setItem(`ic_manual_checks_${id}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [id]);

  // ==============================================
  // EFEITO: GERAÇÃO SOB DEMANDA
  // Quando pago e campos _gerado ausentes, chama a API para gerar agora.
  // O webhook tenta primeiro via after(); esta rota é o fallback garantido.
  // ==============================================
  useEffect(() => {
    if (!row || !hasPaid || row.fechamento_gerado) return;
    if (geracaoIniciada.current) return;

    geracaoIniciada.current = true;
    setGerando(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 270_000); // 4.5 min

    fetch('/api/gerar-manual-completo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analiseId: id }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then(async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { data } = await supabase.from('analises').select('*').eq('id', id).single();
        if (data) setRow(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('[manual] gerar-manual-completo falhou:', err?.message);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setGerando(false);
      });
  }, [row, hasPaid, id]);

  // ==============================================
  // GERAR MANUAL PREMIUM
  // ==============================================
  const manual = useMemo(() => {
    if (!row) return null;

    // Enquanto a geração IA ainda não terminou (mesma condição que dispara
    // o efeito de geração sob demanda acima), as seções cujo campo _gerado
    // ainda está null mostram "Preparando seu Manual..." em vez do texto
    // genérico de fallback — ver lib/manualgenerator.js (pend()).
    const iaPendente = isPaid(row) && !row.fechamento_gerado;
    const pendingFields = iaPendente ? new Set(
      CAMPOS_GERADOS_IA.filter((col) => !row[col])
    ) : null;

    const params = {
      pendingFields,
      nome: row.nome,
      signo: row.signo,
      numeroVida: row.numero_vida,
      objetivoPrincipal: row.objetivo_principal,
      relacaoStatus: row.relacao_status,
      trabalhoStatus: row.trabalho_status,
      local: row.local_nascimento,
      dataNascimentoISO: row.data_nascimento,
      diagnosticoGerado:  row.diagnostico_gerado  || null,
      amorGerado:         row.amor_gerado         || null,
      tipoPessoaGerado:   row.tipo_pessoa_gerado  || null,
      plano7Gerado:       row.plano7_gerado        || null,
      signoLua:           row.signo_lua            || null,
      signoVenus:         row.signo_venus          || null,
      signoMarte:         row.signo_marte          || null,
      signoNodo:          row.signo_nodo           || null,
      signoMercurio:      row.signo_mercurio       || null,
      signoAscendente:    row.signo_ascendente     || null,
      anoPessoal:         row.ano_pessoal          ?? null,
      numeroAlma:         row.numero_alma          ?? null,
      numeroExpressao:    row.numero_expressao     ?? null,
      arquetiposGerado:   row.arquetipos_gerado    || null,
      pontoCegoGerado:    row.ponto_cego_gerado   || null,
      bloqueiosGerado:    row.bloqueios_gerado     || null,
      dinheiroGerado:     row.dinheiro_gerado      || null,
      rituaisGerado:      row.rituais_gerado       || null,
      objetivoGerado:     row.objetivo_gerado      || null,
      leituraGerada:      row.leitura_gerada       || null,
      calendarioGerado:   row.calendario_gerado    || null,
      fechamentoGerado:          row.fechamento_gerado           || null,
      sinteseGerada:             row.sintese_gerada              || null,
      cartaTarot:                row.carta_tarot                 || null,
      cartaTarotInterpretacao:   row.carta_tarot_interpretacao   || null,
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
  // SEÇÕES VISÍVEIS EM CAPÍTULOS
  // A carta de tarot já aparece na abertura do manual (imagem + texto completo),
  // então é excluída daqui para não duplicar.
  // ==============================================
  const capitulos = useMemo(() => {
    if (!Array.isArray(manual?.sections)) return [];
    return agruparEmCapitulos(manual.sections.filter((s) => s?.type !== 'tarot'));
  }, [manual]);
  const ancoras = useMemo(() => capitulos.flatMap((c) => c.secoes.map((s) => s.ancora)), [capitulos]);

  // ==============================================
  // LIDAS (✓ no índice) E "CONTINUAR DE ONDE PAROU" — ic_manual_lidas_<id>
  // ==============================================
  const [leitura, setLeitura] = useState({ lidas: [], ultima: null });
  const [continuarPara, setContinuarPara] = useState(null);
  const leituraPronta = useRef(false);
  const conteudoPronto = hasPaid && !gerando && capitulos.length > 0;

  useEffect(() => {
    if (!conteudoPronto || leituraPronta.current) return;
    leituraPronta.current = true;
    let salvo = { lidas: [], ultima: null };
    try { salvo = lerLidas(window.localStorage.getItem(chaveLidas(id))); } catch {}
    setLeitura(salvo);  
    // Chegou com âncora (ex.: "Dia N do seu plano" no Seu Dia): vai direto, sem o aviso.
    if (!window.location.hash) setContinuarPara(secaoParaContinuar(salvo, ancoras));
  }, [conteudoPronto, id, ancoras]);

  // Âncora na URL: o conteúdo só existe depois do fetch, então o navegador não acha sozinho.
  useEffect(() => {
    if (!conteudoPronto || !window.location.hash) return undefined;
    const t = setTimeout(() => document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: 'start' }), 400);
    return () => clearTimeout(t);
  }, [conteudoPronto]);

  useEffect(() => {
    if (!conteudoPronto) return undefined;
    const salvar = (fn) => setLeitura((atual) => {
      const novo = fn(atual);
      if (novo !== atual) { try { window.localStorage.setItem(chaveLidas(id), JSON.stringify(novo)); } catch {} }
      return novo;
    });
    // Lida = o fim da seção passou pela tela.
    const obsFim = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) salvar((l) => marcarLida(l, e.target.dataset.secao));
    }, { threshold: 0 });
    document.querySelectorAll('[data-fim-secao]').forEach((el) => obsFim.observe(el));
    return () => obsFim.disconnect();
  }, [conteudoPronto, id]);

  // Seção atual (destacada no índice).
  const [atual, setAtual] = useState(null);
  useEffect(() => {
    if (!conteudoPronto) return undefined;
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) setAtual(e.target.id);
    }, { rootMargin: '-30% 0px -60% 0px' });
    ancoras.forEach((a) => { const el = document.getElementById(a); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [conteudoPronto, ancoras]);

  // Índice no celular
  const [indiceAberto, setIndiceAberto] = useState(false);

  // ==============================================
  // JORNADA DO PLANO / CALENDÁRIO — 1º check grava o início (ic_manual_jornada);
  // a aba Hoje do Seu Dia mostra "Dia N do seu plano: <título>".
  // ==============================================
  const marcarJornada = useCallback((tipo, itens, ancorasItens) => {
    try {
      const atualJ = lerJornada(window.localStorage.getItem(CHAVE_JORNADA));
      const nova = iniciarJornada(atualJ, { id, nome: pickFirstName(row?.nome), tipo, itens, ancoras: ancorasItens, hoje: hojeBrasilia() });
      if (nova !== atualJ) window.localStorage.setItem(CHAVE_JORNADA, JSON.stringify(nova));
    } catch {}
  }, [id, row?.nome]);

  // ==============================================
  // HANDLER: ABRIR CHECKOUT (Stripe — paywall de quem não pagou)
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
  // BÔNUS GRÁTIS: COMPATIBILIDADE COMPLETA (incluso pra quem já tem o
  // manual completo — cruza o mapa com o de uma segunda pessoa)
  // ==============================================
  const [pessoa2Nome, setPessoa2Nome] = useState('');
  const [pessoa2Data, setPessoa2Data] = useState('');

  useEffect(() => {
    if (row?.compat_pessoa2_nome && !pessoa2Nome) setPessoa2Nome(row.compat_pessoa2_nome);  
    if (row?.compat_pessoa2_data_nascimento && !pessoa2Data) setPessoa2Data(row.compat_pessoa2_data_nascimento);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const compatMinhasSignos = useMemo(() => {
    if (!row?.data_nascimento) return null;
    return calcularSignosPessoa(row.data_nascimento, row.hora_nascimento, offsetSalvo(row));
  }, [row]);

  const compatPessoa2Signos = useMemo(() => {
    if (!pessoa2Data || !/^\d{4}-\d{2}-\d{2}$/.test(pessoa2Data)) return null;
    return calcularSignosPessoa(pessoa2Data, null);
  }, [pessoa2Data]);

  const compatResultado = useMemo(() => {
    if (!compatMinhasSignos || !compatPessoa2Signos) return null;
    return gerarCompatibilidadeCompleta(compatMinhasSignos, compatPessoa2Signos);
  }, [compatMinhasSignos, compatPessoa2Signos]);

  // Salva a segunda pessoa em segundo plano assim que nome + data válidos
  // forem preenchidos — grátis, sem checkout, porque o manual já foi pago.
  useEffect(() => {
    if (!row || row.payment_status !== 'paid') return;
    const nome = pessoa2Nome.trim();
    if (!nome || !/^\d{4}-\d{2}-\d{2}$/.test(pessoa2Data)) return;
    if (row.compat_pessoa2_nome === nome && row.compat_pessoa2_data_nascimento === pessoa2Data) return;

    const t = setTimeout(() => {
      fetch('/api/salvar-compat-pessoa2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id, pessoa2Nome: nome, pessoa2DataNascimento: pessoa2Data }),
      }).catch((e) => console.error('Erro ao salvar compatibilidade grátis:', e));
    }, 600);
    return () => clearTimeout(t);
  }, [pessoa2Nome, pessoa2Data, row, id]);

  // ==============================================
  // COMPARTILHAR FRASE (card 1080x1920) e .ics DOS RITUAIS — sob demanda
  // ==============================================
  const [compartilhando, setCompartilhando] = useState(null);
  async function compartilharFrase(frase, secao) {
    const dados = dadosDaAnalise(row);
    if (!dados || compartilhando) return;
    setCompartilhando(secao);
    try {
      const { compartilharFrase: gerar } = await import('./compartilharFrase');
      const resultado = await gerar({ frase, nome: dados.nome, dataNascimento: dados.dataNascimento, hora: dados.hora, cidade: dados.cidade });
      evento('manual_frase_compartilhar', { secao, resultado });
    } catch (e) {
      console.error('[manual] card da frase', e);
      alert('Não deu pra gerar a imagem agora. Tente de novo.');
    } finally {
      setCompartilhando(null);
    }
  }

  async function agendarRitual(ritual, i) {
    try {
      const { baixarIcsRitual } = await import('./compartilharFrase');
      await baixarIcsRitual(ritual);
      evento('manual_ritual_agenda', { ritual: i + 1 });
    } catch (e) {
      console.error('[manual] .ics', e);
    }
  }

  // ==============================================
  // HANDLER: COPIAR MARKDOWN
  // ==============================================
  function copyMarkdown() {
    if (!markdown) {
      alert('Nenhum conteúdo para copiar.');
      return;
    }

    navigator.clipboard.writeText(markdown)
      .then(() => {
        alert('Manual copiado! Cole em qualquer editor para gerar PDF.');
      })
      .catch((err) => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Tente novamente.');
      });
  }

  // ==============================================
  // ESTADO: LOADING
  // ==============================================
  if (loading) {
    return (
      <Pagina>
        <div className={m.centro}>
          <div className={m.spinner} />
          <p className={m.texto}>Carregando seu Manual…</p>
        </div>
      </Pagina>
    );
  }

  // ==============================================
  // ESTADO: ERRO
  // ==============================================
  if (erro || !row) {
    return (
      <Pagina>
        <div className={m.centro}>
          <h1 className={m.centroTitulo}>Ops…</h1>
          <p className={m.texto}>{erro || 'Erro ao carregar dados'}</p>
          <button className={m.btn} onClick={() => router.push('/')}>Voltar ao início</button>
        </div>
      </Pagina>
    );
  }

  // ==============================================
  // ESTADO: ERRO NA GERAÇÃO DO MANUAL
  // ==============================================
  if (manual?.__error) {
    return (
      <Pagina>
        <div className={m.centro}>
          <h2 className={m.centroTitulo}>Erro ao gerar o Manual</h2>
          <p className={m.texto}>{manual.__error}</p>
          <p className={m.texto} style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
            signo: {row.signo || 'não encontrado'} · numero_vida: {row.numero_vida || 'não encontrado'} · objetivo_principal: {row.objetivo_principal || 'não encontrado'}
          </p>
          <button className={m.btn} onClick={() => router.push(`/resultado/${id}`)}>Ver página de resultado</button>
        </div>
      </Pagina>
    );
  }

  // ==============================================
  // EXTRAIR DADOS DO ROW
  // ==============================================
  const firstName = pickFirstName(row.nome);
  const objetivo = titleCase(row.objetivo_principal);
  const signo = row.signo;
  const numero = row.numero_vida;

  // Seu Dia: cortesia de 30 dias do Manual (Termos, seção 5) ou assinatura.
  // Enquanto o /api/assinatura/status não responde, usa o paid_at daqui.
  const cortesiaLocal = Boolean(row.paid_at) && Date.now() - new Date(row.paid_at).getTime() < 30 * 86400000;
  const seuDiaAtivo = acesso ? Boolean(acesso.ativa) : cortesiaLocal;
  const seuDiaOrigem = acesso?.ativa ? acesso.origem : (cortesiaLocal ? 'manual' : null);
  const seuDiaAte = acesso?.acessoAte || (row.paid_at ? new Date(new Date(row.paid_at).getTime() + 30 * 86400000).toISOString() : null);

  const tarotSection = Array.isArray(manual?.sections) ? manual.sections.find((s) => s?.type === 'tarot') : null;

  // ==============================================
  // PEDAÇOS
  // ==============================================
  // Funções que devolvem JSX (não componentes): definidas aqui dentro pra ler o
  // estado, mas chamadas como função pra não remontar a cada rolagem (a barra
  // de progresso muda estado no scroll; um componente novo por render cortaria o áudio).
  function blocoSeuDia(posicao) {
    const abrir = () => {
      evento('manual_seu_dia_clique', { destino: 'seu-dia', posicao, cortesia: seuDiaAtivo });
      salvarEmailSeuDia(row.email || '');
    };
    if (seuDiaAtivo) {
      return (
        <aside className={m.seuDia} aria-label="Seu Dia">
          <span className={m.eyebrow}>Seu Dia Completo</span>
          <h2 className={m.seuDiaTitulo}>
            {seuDiaOrigem === 'manual'
              ? <>Seu Manual vem com <em>30 dias do Seu Dia Completo</em></>
              : <>Seu Dia Completo <em>está ativo</em></>}
          </h2>
          <p className={m.texto}>
            O que fazer, o que evitar e as melhores horas, todo dia, lido pelo mesmo mapa deste Manual.
            {seuDiaAte ? ` Até ${dataBR(seuDiaAte)}.` : ''}
          </p>
          <a className={m.btn} href="/seu-dia?aba=hoje" onClick={abrir}>Abrir meu dia de hoje</a>
        </aside>
      );
    }
    return (
      <aside className={m.seuDia} aria-label="Seu Dia">
        <span className={m.eyebrow}>Seu Dia Completo</span>
        <h2 className={m.seuDiaTitulo}>O seu mapa, <em>lido pro dia de hoje</em></h2>
        <p className={m.texto}>Os 30 dias que vieram com o Manual acabaram. O resumo do seu dia continua grátis; o completo é com a assinatura.</p>
        <a
          className={m.btn}
          href={`/assinar?a=${encodeURIComponent(id)}&plano=mensal`}
          onClick={() => evento('manual_seu_dia_clique', { destino: 'assinar', posicao, cortesia: false })}
        >
          Continuar com o Seu Dia Completo · {brl(PRECO_ASSINATURA_MENSAL)}/mês
        </a>
        <a className={m.linkMono} href="/seu-dia?aba=hoje" onClick={abrir}>Abrir o resumo grátis do meu dia</a>
      </aside>
    );
  }

  function destaqueEl(frase, secao) {
    if (!frase) return null;
    return (
      <div className={m.destaque}>
        <p className={m.citacao}>“{frase}”</p>
        <div className={m.acoes}>
          <button type="button" className={m.acao} onClick={() => compartilharFrase(frase, secao)} disabled={compartilhando === secao}>
            {compartilhando === secao ? 'Gerando a imagem…' : 'Compartilhar'}
          </button>
        </div>
      </div>
    );
  }

  function listaIndice(aoClicar) {
    return (
      <>
        {capitulos.map((cap) => (
          <div key={cap.id} className={m.indiceCap}>
            <span className={m.rotulo} style={{ color: 'var(--ouro)' }}>{cap.rotulo}</span>
            <ul className={m.indiceItens}>
              {cap.secoes.map((s) => (
                <li key={s.ancora}>
                  <a href={`#${s.ancora}`} className={`${m.indiceItem} ${atual === s.ancora ? m.indiceAtual : ''}`} onClick={aoClicar}>
                    <span className={m.indiceMarca} aria-label={leitura.lidas.includes(s.ancora) ? 'lida' : undefined}>
                      {leitura.lidas.includes(s.ancora) ? '✓' : ''}
                    </span>
                    {s.titulo}
                  </a>
                </li>
              ))}
              {cap.id === 'amor' && (
                <>
                  <li><a href="#compatibilidade-astral" className={m.indiceItem} onClick={aoClicar}><span className={m.indiceMarca} />Compatibilidade Astral</a></li>
                  <li><a href="#compatibilidade-completa" className={m.indiceItem} onClick={aoClicar}><span className={m.indiceMarca} />Compatibilidade Completa</a></li>
                </>
              )}
            </ul>
          </div>
        ))}
        <div className={m.indiceRodape}>
          <a href="#projecao-12-meses" className={m.linkMono} onClick={aoClicar}>Complementos</a>
          <button type="button" className={m.acao} onClick={copyMarkdown} disabled={!markdown}>Copiar Manual (Markdown)</button>
        </div>
      </>
    );
  }

  // ==============================================
  // UMA SEÇÃO DO GERADOR
  // ==============================================
  function secaoEl(section, ancora) {
    const titulo = String(section.title || 'Seção').trim();
    const destaque = destaqueDaSecao(section);
    const cabeca = (
      <>
        <h2 className={m.h2}>{titulo}</h2>
        {destaqueEl(destaque, ancora)}
      </>
    );

    // TIPO: COVER
    if (section.type === 'cover') {
      return (
        <>
          <h2 className={m.h2}>{titulo}</h2>
          {section.subtitle && <p className={m.rotulo} style={{ marginTop: 8 }}>{section.subtitle}</p>}
          {Array.isArray(section.meta) && section.meta.length > 0 && (
            <ul className={m.lista}>{section.meta.map((x, i) => <li key={i}>{x}</li>)}</ul>
          )}
        </>
      );
    }

    // TIPO: MAPA
    if (section.type === 'mapa') {
      return (
        <>
          <h2 className={m.h2}>{titulo}</h2>
          <span className={m.rotuloOuro}>Legenda do seu mapa</span>
          <ul className={m.lista}>{Array.isArray(section.items) && section.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          {section.sintese && (
            <>
              <span className={m.rotuloOuro}>Síntese integrada</span>
              <p className={`${m.p} ${m.pre}`}>{section.sintese}</p>
            </>
          )}
        </>
      );
    }

    // TIPO: TOC
    if (section.type === 'toc') {
      return (
        <>
          <h2 className={m.h2}>{titulo}</h2>
          <ul className={m.lista}>{Array.isArray(section.items) && section.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </>
      );
    }

    // TIPO: PREPARANDO (IA ainda gerando essa seção)
    if (section.type === 'preparando') {
      return (
        <>
          <h2 className={m.h2}>{titulo}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <div className={m.spinnerPeq} />
            <p className={m.texto}>Preparando essa parte do seu Manual…</p>
          </div>
        </>
      );
    }

    // TIPO: TEXT
    if (section.type === 'text') {
      const { paragraphs, quote } = splitBodyIntoParasAndQuote(section.body);
      const ehPontoCego = titulo.toLowerCase() === 'ponto cego';
      return (
        <>
          {cabeca}
          {ehPontoCego && (
            <BotaoCompartilharStory analiseId={id} pago={hasPaid} tipo="ponto_cego" origem="manual_ponto_cego" className={m.btnSec} />
          )}
          {paragraphs.map((p, i) => <p key={i} className={m.p}>{renderInline(p)}</p>)}
          {quote && <p className={m.citacaoMenor}>“{renderInline(quote)}”</p>}
        </>
      );
    }

    // TIPO: DIAGNÓSTICO (blocos com subtítulo + pull-quote)
    if (section.type === 'diagnostico') {
      return (
        <>
          {cabeca}
          {Array.isArray(section.blocks) && section.blocks.map((b, i) => (
            <div key={i} className={m.bloco}>
              <span className={m.rotuloOuro} style={{ marginTop: 0 }}>{b.label}</span>
              {splitBodyIntoParasAndQuote(b.text).paragraphs.map((p, j) => <p key={j} className={m.p}>{renderInline(p)}</p>)}
              <div className={m.acoes}><ListenButton text={buildDiagBlockNarration(b)} label="Ouvir este bloco" /></div>
            </div>
          ))}
          {section.quote && section.quote.trim() !== destaque && <p className={m.citacaoMenor}>“{renderInline(section.quote)}”</p>}
        </>
      );
    }

    // TIPO: ARQUÉTIPOS
    if (section.type === 'archetypes') {
      return (
        <>
          {cabeca}
          {Array.isArray(section.items) && section.items.map((it, i) => (
            <div key={i} className={m.bloco}>
              <span className={m.rotulo}>{it.label}</span>
              <p className={m.h3}>{it.nome}</p>
              <p className={m.p}>{renderInline(it.descricao)}</p>
              {it.frase && i > 0 && <p className={m.citacaoMenor}>“{renderInline(it.frase)}”</p>}
              <div className={m.acoes}><ListenButton text={buildArchetypeNarration(it)} label="Ouvir este arquétipo" /></div>
            </div>
          ))}
        </>
      );
    }

    // TIPO: RITUAIS (passos numerados, áudio, agenda e check de prática)
    if (section.type === 'rituals') {
      return (
        <>
          {cabeca}
          {Array.isArray(section.items) && section.items.map((r, i) => {
            const ck = `rituals_${i}`;
            return (
              <div key={i} className={m.bloco}>
                <span className={m.rotulo}>Ritual {i + 1}</span>
                <p className={m.h3}>{r.nome}</p>
                {r.quando && <p className={m.nota}>Quando usar: {renderInline(r.quando)}</p>}
                {Array.isArray(r.passos) && r.passos.length > 0 && (
                  <ol className={m.passos}>{r.passos.map((p, j) => <li key={j}>{renderInline(p)}</li>)}</ol>
                )}
                {r.frase && i > 0 && <p className={m.citacaoMenor}>“{renderInline(r.frase)}”</p>}
                <div className={m.acoes}>
                  <ListenButton text={buildRitualNarration(r)} label="Ouvir este ritual guiado" />
                  <button type="button" className={m.acao} onClick={() => agendarRitual(r, i)}>Colocar na minha agenda</button>
                </div>
                <ul className={m.checks}>
                  <CheckItem itemKey={ck} checked={!!checks[ck]} onToggle={toggleCheck}>Já pratiquei este ritual</CheckItem>
                </ul>
              </div>
            );
          })}
        </>
      );
    }

    // TIPO: BULLETS
    if (section.type === 'bullets') {
      return (
        <>
          {cabeca}
          {section.note && <p className={m.p}>{section.note}</p>}
          <ul className={m.lista}>{Array.isArray(section.items) && section.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ul>
        </>
      );
    }

    // TIPO: PLAN7
    if (section.type === 'plan7') {
      const dias = Array.isArray(section.days) ? section.days : [];
      const ancorasDias = dias.map((_, i) => `plano-d${i + 1}`);
      const marcar = (k) => { if (!checks[k]) marcarJornada('plano', dias, ancorasDias); toggleCheck(k); };
      return (
        <>
          {cabeca}
          {section.hook && <p className={m.p}>{section.hook}</p>}
          <span className={m.rotuloOuro}>Passo a passo (7 dias)</span>
          <ul className={m.checks}>
            {dias.map((day, i) => {
              const ck = `plan7_${i}`;
              return <CheckItem key={i} id={ancorasDias[i]} itemKey={ck} checked={!!checks[ck]} onToggle={marcar}>{renderInline(day)}</CheckItem>;
            })}
          </ul>
        </>
      );
    }

    // TIPO: LOVE
    if (section.type === 'love') {
      return (
        <>
          {cabeca}
          {section.pattern && (
            <p className={`${m.p} ${m.pre}`}>{String(section.pattern).replace(/\r\n/g, '\n').replace(/\*\*/g, '').replace(/\*/g, '')}</p>
          )}
          <div className={m.duasListas}>
            <div>
              <span className={m.rotuloAlerta}>Pare de fazer isso</span>
              <ul className={m.lista}>{Array.isArray(section.whatToStop) && section.whatToStop.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div>
              <span className={m.rotuloOuro}>Comece a fazer isso</span>
              <ul className={m.lista}>{Array.isArray(section.whatToStart) && section.whatToStart.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          </div>
          <span className={m.rotuloOuro}>Frases prontas (sem joguinho)</span>
          <ul className={m.lista}>{Array.isArray(section.microScript) && section.microScript.map((script, i) => <li key={i}>{script}</li>)}</ul>
        </>
      );
    }

    // TIPO: MONEY
    if (section.type === 'money') {
      return (
        <>
          {cabeca}
          <div className={m.duasListas}>
            <div>
              <span className={m.rotuloAlerta}>Bloqueios</span>
              <ul className={m.lista}>{Array.isArray(section.blocks) && section.blocks.map((block, i) => <li key={i}>{block}</li>)}</ul>
            </div>
            <div>
              <span className={m.rotuloOuro}>Ações práticas</span>
              <ul className={m.lista}>{Array.isArray(section.actions) && section.actions.map((action, i) => <li key={i}>{action}</li>)}</ul>
            </div>
          </div>
          <span className={m.rotuloOuro}>Micro-hábitos</span>
          <ul className={m.lista}>{Array.isArray(section.microHabits) && section.microHabits.map((habit, i) => <li key={i}>{habit}</li>)}</ul>
        </>
      );
    }

    // TIPO: CALENDAR30
    if (section.type === 'calendar30') {
      const semanas = Array.isArray(section.weeks) ? section.weeks : [];
      const chavesDias = semanas.flatMap((week, i) => (Array.isArray(week.days) ? week.days.map((_, j) => `calendar30_w${i}d${j}`) : []));
      const textosDias = semanas.flatMap((week) => (Array.isArray(week.days) ? week.days : []));
      const ancorasDias = textosDias.map((_, k) => `calendario-d${k + 1}`);
      const totalDias = chavesDias.length;
      const diasFeitos = chavesDias.filter((ck) => checks[ck]).length;
      const progressoPct = totalDias > 0 ? Math.round((diasFeitos / totalDias) * 100) : 0;
      const marcar = (k) => { if (!checks[k]) marcarJornada('calendario', textosDias, ancorasDias); toggleCheck(k); };
      let k = 0;
      return (
        <>
          {cabeca}
          {totalDias > 0 && (
            <div className={m.progressoCal}>
              <div className={m.progressoCalLinha}><span>{diasFeitos} de {totalDias}</span><span>{progressoPct}%</span></div>
              <div className={m.progressoCalTrilho}><span style={{ width: `${progressoPct}%` }} /></div>
            </div>
          )}
          {semanas.map((week, i) => (
            <div key={i} className={m.semana}>
              <span className={m.rotuloOuro} style={{ marginTop: 0 }}>{week.week}</span>
              {week.focus && <p className={m.h3}>{week.focus}</p>}
              <ul className={m.checks}>
                {Array.isArray(week.days) && week.days.map((day, j) => {
                  const ck = `calendar30_w${i}d${j}`;
                  const ancoraDia = ancorasDias[k++];
                  return <CheckItem key={j} id={ancoraDia} itemKey={ck} checked={!!checks[ck]} onToggle={marcar}>{renderInline(day)}</CheckItem>;
                })}
              </ul>
            </div>
          ))}
        </>
      );
    }

    // TIPO: CLOSING
    if (section.type === 'closing') {
      const { paragraphs: closingParas, quote: closingQuote } = splitBodyIntoParasAndQuote(section.body);
      return (
        <>
          {cabeca}
          {closingParas.map((p, i) => <p key={i} className={m.p}>{renderInline(p)}</p>)}
          {closingQuote && <p className={m.citacaoMenor}>“{renderInline(closingQuote)}”</p>}
          {section.mantra && (
            <div className={m.bloco}>
              <span className={m.rotuloOuro} style={{ marginTop: 0 }}>Mantra</span>
              <p className={m.h3}>{section.mantra}</p>
              {section.signature && <p className={m.nota}>{section.signature}</p>}
              <BotaoCompartilharStory analiseId={id} pago={hasPaid} tipo="mantra" origem="manual_mantra" className={m.btnSec} style={{ marginTop: 16 }} />
            </div>
          )}
        </>
      );
    }

    // FALLBACK: tipo desconhecido
    return (
      <>
        <h2 className={m.h2}>{titulo}</h2>
        <p className={m.nota}>Tipo de seção desconhecido: <code>{section.type}</code></p>
      </>
    );
  }

  // ==============================================
  // RENDER PRINCIPAL
  // ==============================================
  return (
    <Pagina>
      {/* MENU — não-sticky: o palco do Olho Cósmico fica fixo na tela logo abaixo */}
      <SiteNav active="meu-mapa" sticky={false} />

      {/* BARRA DE PROGRESSO DE LEITURA */}
      <div className={m.progresso} aria-hidden="true"><span style={{ width: `${readProgress}%` }} /></div>

      {/* OLHO CÓSMICO — o céu do nascimento, só pra quem pagou */}
      {hasPaid && !gerando && <OlhoCosmicoManual row={row} />}

      {/* CONTEÚDO */}
      <div className={m.manual} id="manual">
        <div className={m.largura}>

        {/* ========== LOADING (aguardando geração IA) ========== */}
        {gerando ? (
          <div className={m.centro}>
            <div className={m.spinner} />
            <p className={m.centroTitulo}>Estamos preparando o seu Manual…</p>
            <p className={m.texto}>Isso leva de 30 a 60 segundos. Não feche esta página.</p>
            <p className={m.texto} style={{ fontSize: 14 }}>
              Você também vai receber o link de acesso por e-mail. Confira a caixa de spam caso não encontre.
            </p>
            <div className={m.barraGerando}><span /></div>
          </div>
        ) : (
        <>

        {/* ========== TOPO ========== */}
        <header className={m.topo}>
          <span className={m.eyebrow}>Manual do seu Mapa · personalizado</span>
          <h1 className={m.titulo}>{firstName}, seu padrão ficou claro. <em>Agora vamos virar a chave.</em></h1>
          <p className={m.subtitulo}>
            Nada aqui é por acaso. Quando colocamos tudo lado a lado, o padrão fica claro.
            Este Manual existe para nomear isso, e mostrar como sair dele.
          </p>
          <p className={m.chips}>
            {[signo, numero ? `Número ${numero}` : null, hasValidChoice(objetivo) ? objetivo : null].filter(Boolean).join(' · ')}
          </p>
        </header>

        {/* ========== CHEGOU DO MP, AINDA NÃO CONFIRMADO ========== */}
        {/* Nunca mostra o paywall com "Desbloquear" pra quem já pagou — só
            o estado de confirmação/timeout, até o banco confirmar. */}
        {!hasPaid && mpPaymentId && (
          <div className={m.caixaCentro}>
            {confirmandoMp ? (
              <>
                <div className={m.spinner} />
                <h2 className={m.h2}>Confirmando seu pagamento…</h2>
                <p className={m.texto}>Isso leva só um instante.</p>
              </>
            ) : (
              <>
                <h2 className={m.h2}>Pagamento recebido</h2>
                <p className={m.texto}>
                  Seu pagamento foi recebido e está sendo confirmado — isso pode levar
                  alguns minutos. Assim que for processado, seu acesso chega também
                  por e-mail.
                </p>
                <button className={m.btn} onClick={() => setMpConfirmRetryKey((k) => k + 1)}>
                  Verificar de novo
                </button>
                <p className={m.nota}>
                  Se demorar mais do que isso,{' '}
                  <a href={`mailto:conceptintuitive@gmail.com?subject=${encodeURIComponent('Paguei o Manual e não consegui acessar')}`}>
                    nos chame pelo suporte
                  </a>.
                </p>
              </>
            )}
          </div>
        )}

        {/* ========== PAYWALL (se não pagou, SEM vir do MP) ========== */}
        {!hasPaid && !mpPaymentId && (
          <div className={m.caixa}>
            <span className={m.rotulo}>Acesso bloqueado</span>
            <h2 className={m.h2}>Este é o Manual do seu Mapa</h2>
            <p className={m.p}>
              Para liberar todo o conteúdo (amor + dinheiro + calendário + plano de 7 dias), finalize o pagamento.
            </p>
            <span className={m.rotuloOuro}>O que você recebe</span>
            <ul className={m.lista}>
              <li>Análise completa do seu Signo + Número</li>
              <li>Mapeamento dos bloqueios invisíveis que te sabotam</li>
              <li>Plano de ação de 7 dias (prático e simples)</li>
              <li>Rituais rápidos (3–7 min) pro seu perfil</li>
              <li>Amor e Dinheiro (parte completa)</li>
            </ul>
            <span className={m.rotuloOuro}>Bônus</span>
            <ul className={m.lista}>
              <li>Mapa do Amor (padrão afetivo real)</li>
              <li>Mapa do Dinheiro (prosperidade e bloqueios)</li>
              <li>Calendário de Poder (4 semanas)</li>
            </ul>
            <button className={m.btn} style={{ width: '100%' }} onClick={handleComprar} disabled={processando}>
              {processando ? 'Abrindo checkout…' : 'Desbloquear o Manual do seu Mapa'}
            </button>
            <p className={m.nota} style={{ textAlign: 'center' }}>Pagamento seguro · Acesso imediato · Garantia de 7 dias</p>
            <p className={m.nota} style={{ textAlign: 'center' }}>
              <a href={`/assinar?a=${id}&plano=anual`}>Ou assine o Intuitive Completo anual — o Manual vem incluso</a>
            </p>
          </div>
        )}

        {/* ========== CONTEÚDO PREMIUM (só mostra se pagou) ========== */}
        {hasPaid && (
          <>
            {/* CONTINUAR DE ONDE PAROU */}
            {continuarPara && (
              <div className={m.continuar} role="status">
                <a
                  href={`#${continuarPara}`}
                  className={m.continuarTexto}
                  style={{ textDecoration: 'none' }}
                  onClick={() => { evento('manual_continuar'); setContinuarPara(null); }}
                >
                  <span className={m.rotulo}>Continuar de onde parou</span>
                  <span className={m.continuarTitulo}>{capitulos.flatMap((c) => c.secoes).find((s) => s.ancora === continuarPara)?.titulo} →</span>
                </a>
                <button type="button" className={m.fecharPeq} aria-label="Fechar aviso" onClick={() => setContinuarPara(null)}>✕</button>
              </div>
            )}

            {/* ABERTURA: A CARTA DO DIA */}
            {tarotSection && (() => {
              const c = tarotSection.carta || {};
              const fallbackText = tarotSection.interpBody || (c.invertida ? c.significadoInvertido : c.significado);
              const hookPhrase = normalize(tarotSection.interpTitulo) || firstSentences(fallbackText, 1);
              return (
                <section className={m.abertura} aria-label="Sua carta do dia">
                  <div className={m.cartaImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row?.imagem_ia_url || `/api/og/${id}`} alt="" />
                    <div className={m.cartaVeu}><span className={m.cartaNome}>{firstName}</span></div>
                  </div>
                  <span className={m.rotuloOuro}>Sua carta do dia · {c.nome}{c.invertida ? ' invertida' : ''}</span>
                  {hookPhrase && <p className={m.citacao} style={{ marginTop: 10 }}>“{hookPhrase}”</p>}
                  {fallbackText && <p className={`${m.p} ${m.pre}`}>{fallbackText}</p>}
                </section>
              );
            })()}

            {/* SEU DIA (logo depois da abertura) */}
            {blocoSeuDia('topo')}

            <div className={m.leitura}>
              {/* ÍNDICE LATERAL (desktop) */}
              <nav className={m.indice} aria-label="Índice do Manual">
                <span className={m.eyebrow}>Índice</span>
                {listaIndice()}
              </nav>

              <div className={m.coluna}>
                {capitulos.map((cap) => (
                  <div key={cap.id} className={m.capitulo}>
                    <p className={m.capituloRotulo}>{cap.rotulo}</p>
                    {cap.secoes.map(({ section, ancora }) => (
                      <Fragment key={ancora}>
                        <section id={ancora} className={m.secao}>
                          {secaoEl(section, ancora)}
                          {section.type !== 'cover' && section.type !== 'toc' && (
                            <FeedbackSecao manualId={id} secao={chaveSecao(section)} visual="ma" />
                          )}
                          <span data-fim-secao="" data-secao={ancora} aria-hidden="true" />
                        </section>

                        {/* Amor: compatibilidade astral (5 pontos) + Compatibilidade Completa grátis */}
                        {section.type === 'love' && (
                          <>
                            <section className={m.secao} id="compatibilidade-astral">
                              <h2 className={m.h2}>Compatibilidade Astral</h2>
                              <p className={m.p}>Com quem cada parte do seu mapa combina — calculado a partir do seu Sol, Lua, Ascendente, Vênus e Marte.</p>
                              {[
                                { chave: 'signo',            rotulo: 'Sol · Identidade' },
                                { chave: 'signo_lua',        rotulo: 'Lua · Emoção' },
                                { chave: 'signo_ascendente', rotulo: 'Ascendente · Máscara social' },
                                { chave: 'signo_venus',      rotulo: 'Vênus · Amor' },
                                { chave: 'signo_marte',      rotulo: 'Marte · Ação' },
                              ].map(({ chave, rotulo }) => {
                                const signoPonto = row[chave];
                                if (!signoPonto) return null;
                                const matches = getTopMatches(signoPonto, 3);
                                if (!matches.length) return null;
                                return (
                                  <div key={chave} className={m.bloco}>
                                    <span className={m.rotuloOuro} style={{ marginTop: 0 }}>{rotulo} · {signoPonto}</span>
                                    {matches.map((mt) => (
                                      <div key={mt.signo.nome} className={m.compat}>
                                        <div className={m.compatTopo}><span>{mt.signo.nome}</span><span className={m.compatScore}>{mt.score}%</span></div>
                                        <div className={m.compatTrilho}><span style={{ width: `${mt.score}%` }} /></div>
                                        <p className={m.compatTexto}>{mt.headline}</p>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </section>

                            <section className={m.secao} id="compatibilidade-completa">
                              <span className={m.selo}>Bônus grátis</span>
                              <h2 className={m.h2}>Compatibilidade Completa</h2>
                              <p className={m.p}>
                                Cruze seu mapa de verdade com o de outra pessoa específica — Sol, Lua, Vênus e Marte
                                dos dois, ponto a ponto. Diferente da compatibilidade genérica acima.
                              </p>
                              <div className={m.campos}>
                                <input type="text" className={m.campo} placeholder="Nome da pessoa" value={pessoa2Nome} onChange={(e) => setPessoa2Nome(e.target.value)} />
                                <input type="date" className={m.campo} value={pessoa2Data} onChange={(e) => setPessoa2Data(e.target.value)} />
                              </div>
                              {compatResultado && compatResultado.eixos.length > 0 && (
                                <>
                                  <p className={m.p}>Com <strong>{pessoa2Nome}</strong> — compatibilidade geral: <strong>{compatResultado.scoreGeral}%</strong></p>
                                  {compatResultado.eixos.map((e) => (
                                    <div key={e.chave} className={m.bloco}>
                                      <span className={m.rotuloOuro} style={{ marginTop: 0 }}>{e.rotulo} · {e.score}%</span>
                                      <p className={m.h3}>{e.headline}</p>
                                      <p className={m.p}>{e.corpo}</p>
                                    </div>
                                  ))}
                                </>
                              )}
                            </section>
                          </>
                        )}
                      </Fragment>
                    ))}
                  </div>
                ))}

                {/* FIM DO MANUAL: CARD DE STORY */}
                <section className={m.secao}>
                  <span className={m.rotulo}>Compartilhar</span>
                  <h2 className={m.h2}>Leve seu número pro story</h2>
                  <p className={m.p}>Um card só com seu número de vida, seu arquétipo e uma frase do seu mapa. Nenhum dado pessoal.</p>
                  <BotaoCompartilharStory analiseId={id} pago={hasPaid} numero={row?.numero_vida} origem="manual" className={m.btnSec} style={{ marginTop: 16 }} />
                </section>
              </div>
            </div>

            {/* SEU DIA (no fim) */}
            {blocoSeuDia('fim')}
          </>
        )}

        {/* COMPLEMENTOS: Projeção de 12 Meses e Human Design (compra ou conteúdo) */}
        {row && (
          <div className={m.coluna} style={{ marginTop: 40 }}>
            <Complementos row={row} id={id} checks={checks} toggleCheck={toggleCheck} />
          </div>
        )}

        {/* FOOTER */}
        <footer className={m.fim}>
          <p>Precisa de ajuda? <strong>conceptintuitive@gmail.com</strong></p>
        </footer>
        </>
        )}
        </div>
      </div>

      {/* ÍNDICE NO CELULAR */}
      {hasPaid && !gerando && capitulos.length > 0 && noConteudo && (
        <>
          <button type="button" className={m.botaoIndice} onClick={() => { setIndiceAberto(true); evento('manual_indice_abrir'); }}>Índice</button>
          {indiceAberto && (
            <>
              <div className={m.folhaFundo} onClick={() => setIndiceAberto(false)} />
              <nav className={m.folha} aria-label="Índice do Manual">
                <div className={m.folhaTopo}>
                  <span className={m.eyebrow}>Índice</span>
                  <button type="button" className={m.fecharPeq} aria-label="Fechar índice" onClick={() => setIndiceAberto(false)}>✕</button>
                </div>
                {listaIndice(() => setIndiceAberto(false))}
              </nav>
            </>
          )}
        </>
      )}

      {/* ASSISTENTE DE IA — livre (com teto diário) pra quem já comprou */}
      {hasPaid && <ChatAssistente analiseId={id} isPaid firstName={firstName} autoOpen={abrirChat} />}
    </Pagina>
  );
}
