'use client';

// Home = landing + quiz em 4 etapas (+ tela de carregamento).
// Visual da Minha Área desde nov/2026 (app/home.module.css). A lógica do quiz
// (estados, validação, sugestão de e-mail, /api/lead-parcial, /api/gerar-analise,
// eventos GA4/Meta/TikTok, pré-preenchimento, ?quiz=1, ?refazer=1,
// EVENTO_ABRIR_QUIZ) não mudou no redesign.
// Peso: é a página dos anúncios. Nada de OlhoCosmico nem lib/manualgenerator.js
// aqui; a prévia do Seu Dia (lib/seuDia.js) entra via next/dynamic.

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { TESTIMONIALS } from '@/lib/testimonials';
import { emailValido, sugestaoEmail } from '@/lib/emailValidacao';
import CidadeAutocomplete from '@/app/components/CidadeAutocomplete';
import { lerCeuDados, consumirAbrirQuiz, limparCeuDados } from '@/lib/ceuDados';
import { lerPerfil, salvarPerfil } from '@/lib/perfilLocal';
import { TESTE_SEU_DIA_ATIVO } from '@/lib/testeSeuDia';
import SiteNav, { EVENTO_ABRIR_QUIZ } from '@/app/components/SiteNav';
import { coletarAtribuicao } from '@/app/components/CapturaAtribuicao';
import h from './home.module.css';

const PreviaSeuDia = dynamic(() => import('@/app/components/home/PreviaSeuDia'), { ssr: false });

const ROTULO_CTA = 'Fazer meu mapa grátis — 1 min';

// ── Pergunta frequente (linha com divisor) ────────────────────────────────────
function FaqItem({ q, a, id }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${h.faqItem} ${open ? h.faqAberto : ''}`}>
      <button type="button" className={h.faqBotao} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={id}>
        <span className={h.faqPergunta}>{q}</span>
        <span className={h.faqMais} aria-hidden="true">+</span>
      </button>
      {open && <p id={id} className={h.faqResposta}>{a}</p>}
    </div>
  );
}

// ── Quiz Overlay ──────────────────────────────────────────────────────────────
// Identificador estável de cada etapa, usado no tracking de funil (quiz_step_view).
const QUIZ_STEP_IDS = {
  1: 'area_vida_travada',
  2: 'repeticao_padrao',
  3: 'data_nascimento',
  4: 'nome_email',
};

function QuizOverlay({ onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [areaTraada, setAreaTravada] = useState('');
  const [padrao, setPadrao] = useState('');
  const [dataNasc,   setDataNasc]   = useState('');
  const [horaNasc,   setHoraNasc]   = useState('');
  const [localNasc,  setLocalNasc]  = useState('');
  const [noSabeHora, setNoSabeHora] = useState(false);
  // Município escolhido no autocomplete (null = texto livre ou vazio)
  const [municipio, setMunicipio] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [erro, setErro] = useState('');
  const [nomeErro, setNomeErro] = useState('');
  const [emailErro, setEmailErro] = useState('');
  const [emailSugestao, setEmailSugestao] = useState('');

  // Veio do /ceu (Olho Cósmico)? Pré-preenche nome, data, hora e cidade pra
  // pessoa não responder de novo. Dados no localStorage, validade de 24h.
  // Sem repasse do /ceu, usa o perfil salvo neste aparelho (lib/perfilLocal.js).
  useEffect(() => {
    const d = lerCeuDados() || lerPerfil();
    if (!d) return;
    if (d.nome) setNome(d.nome);
    if (d.dataNascimento) setDataNasc(d.dataNascimento);
    if (d.hora) setHoraNasc(d.hora);
    else setNoSabeHora(true);
    if (d.cidade) {
      setMunicipio(d.cidade);
      setLocalNasc(`${d.cidade.nome}, ${d.cidade.uf}`);
    }
  }, []);

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    setLoadingStep(1);
    const t = setInterval(() => setLoadingStep(s => Math.min(s + 1, 4)), 3000);
    return () => clearInterval(t);
  }, [loading]);

  // Dispara a cada mudança de etapa (abertura inicial na Etapa 1, avanço via
  // goNext, retorno via goBack) — cobre as 4 etapas pra dar visibilidade de
  // onde o funil está perdendo gente.
  useEffect(() => {
    try {
      window?.gtag?.('event', 'quiz_step_view', {
        event_category: 'quiz',
        step_number: step,
        step_id: QUIZ_STEP_IDS[step] || `step_${step}`,
        timestamp: new Date().toISOString(),
      });
    } catch {}
  }, [step]);

  const goNext = (newStep) => {
    setDirection('forward');
    setErro('');
    setStep(newStep);
  };
  const goBack = (newStep) => {
    setDirection('back');
    setErro('');
    setStep(newStep);
  };

  const handleSubmit = async () => {
    const nomeTrimmed = nome.trim();
    const emailTrimmed = email.trim();
    setNomeErro('');
    setEmailErro('');
    const nomePalavras = nomeTrimmed.split(/\s+/).filter(Boolean);
    if (nomePalavras.length < 2) { setNomeErro('Digite seu nome completo para um resultado mais preciso.'); return; }
    if (!emailValido(emailTrimmed)) { setEmailErro('Digite um e-mail válido.'); return; }
    if (!dataNasc) { setErro('Selecione sua data de nascimento.'); return; }

    setLoading(true);
    setErro('');

    const payload = {
      nome: nomeTrimmed,
      email: emailTrimmed,
      data_nascimento: dataNasc,
      hora_nascimento: noSabeHora ? '' : horaNasc,
      local_nascimento: localNasc,
      noTime: noSabeHora || !horaNasc,
      // Só quando a pessoa escolheu uma sugestão — texto livre segue pro geocoding
      ...(municipio ? {
        municipio_ibge: municipio.ibge,
        latitude: municipio.lat,
        longitude: municipio.lon,
        fuso_iana: municipio.tz,
      } : {}),
      objetivo_principal: areaTraada,
      relacao_status: '',
      trabalho_status: '',
    };

    try {
      try { window?.gtag?.('event', 'lead_submit', { event_category: 'lead', event_label: 'quiz_overlay' }); } catch {}
      try { window?.fbq?.('track', 'Lead'); } catch {}

      const res = await fetch('/api/gerar-analise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // atribuicao: client_id/session_id do GA4 e gclid da visita, só com
        // aceite de cookies (lib/atribuicao.js); o servidor guarda na análise.
        body: JSON.stringify({ ...payload, atribuicao: await coletarAtribuicao() }),
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json')
        ? await res.json()
        : { error: 'Resposta inesperada do servidor.', rawText: await res.text() };

      if (!res.ok) {
        const msg = data?.details || data?.error || 'Falha ao gerar análise.';
        throw new Error(msg);
      }
      if (data?.id) {
        limparCeuDados();
        salvarPerfil({ nome: nome.trim().split(' ')[0], dataNascimento: dataNasc, hora: noSabeHora ? null : horaNasc, cidade: municipio || null });
        router.push(`/resultado/${data.id}`);
        return;
      }
      throw new Error('A API não retornou um ID.');
    } catch (err) {
      setErro(err?.message || 'Ops! Tivemos uma instabilidade. Tente novamente em instantes.');
      setLoading(false);
    }
  };

  // Lead parcial: captura silenciosa do e-mail da Etapa 4 ao perder foco, mesmo
  // sem clicar em "Ver meu padrão agora". capturedPartialEmailRef evita reenviar
  // o mesmo e-mail a cada blur repetido no mesmo campo.
  const capturedPartialEmailRef = useRef('');
  const handleEmailBlur = () => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) { setEmailErro(''); setEmailSugestao(''); return; }

    const sugestao = sugestaoEmail(trimmed);
    setEmailSugestao(sugestao || '');
    if (!emailValido(trimmed)) {
      setEmailErro(sugestao ? '' : 'Digite um e-mail válido.');
      return;
    }
    setEmailErro('');

    if (capturedPartialEmailRef.current === trimmed) return;
    capturedPartialEmailRef.current = trimmed;
    fetch('/api/lead-parcial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed, nome: nome.trim() || null }),
    }).catch(() => {});
  };

  const aplicarSugestaoEmail = () => {
    if (!emailSugestao) return;
    setEmail(emailSugestao);
    setEmailErro('');
    setEmailSugestao('');
  };

  const AREAS = ['Amor e Relacionamentos', 'Carreira e Propósito', 'Dinheiro e Abundância', 'Autoconhecimento'];
  const PADROES = ['O tempo todo', 'Às vezes', 'Não tenho certeza'];

  const animClass = direction === 'forward' ? h.slideIn : h.slideBack;

  return (
    <div className={h.quiz} role="dialog" aria-modal="true" aria-label="Fazer meu mapa">
      <button type="button" className={h.fechar} onClick={onClose} aria-label="Fechar">×</button>

      <div className={h.quizCaixa}>

        {/* Progresso */}
        <div className={h.topoQuiz}>
          <div className={h.progresso} aria-hidden="true">
            {[1, 2, 3, 4].map(s => <span key={s} className={s <= step ? h.on : ''} />)}
          </div>
          {step < 4 && !loading && (
            <p className={h.faltam}>
              {4 - step > 1 ? `Faltam só ${4 - step} perguntas.` : 'Falta só 1 pergunta.'} O que vem depois muda como você vê os próximos 12 meses.
            </p>
          )}
        </div>

        {loading ? (
          <div className={h.carregando} role="status">
            <div className={h.spinner} />
            <h3 className={h.carregandoTitulo}>Gerando seu mapa...</h3>
            <ul className={h.passos}>
              {['Calculando seu mapa astral…', 'Analisando seus padrões…', 'Gerando seu diagnóstico…', 'Preparando seu resultado…'].map((text, i) => (
                <li key={i} className={`${h.passo} ${loadingStep > i ? h.passoOn : ''}`}>{text}</li>
              ))}
            </ul>
            <p className={h.carregandoNota}>Isso leva de 10 a 20 segundos.</p>
          </div>
        ) : (
          <div className={animClass} key={step}>

            {/* STEP 1 — Área travada */}
            {step === 1 && (
              <div>
                <p className={h.etapa}>Etapa 1</p>
                <h2 className={h.pergunta}>Qual área da sua vida está mais travada agora?</h2>
                <p className={h.apoio}>Escolha a que mais ressoa com você neste momento.</p>
                <p className={h.apoioMudo}>
                  Seu mapa está sendo calculado com base exatamente nesses números — não existe combinação igual à sua. Se você sair agora, vai precisar recomeçar do zero e perder o alinhamento do dia de hoje.
                </p>
                <div className={h.opcoes}>
                  {AREAS.map((label) => (
                    <button key={label} type="button"
                      className={`${h.opcao} ${areaTraada === label ? h.opcaoOn : ''}`}
                      onClick={() => { setAreaTravada(label); goNext(2); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Padrão */}
            {step === 2 && (
              <div>
                <p className={h.etapa}>Etapa 2</p>
                <h2 className={h.pergunta}>Você sente que repete os mesmos padrões, mesmo tentando mudar?</h2>
                <p className={h.apoio}>Seja honesto — não existe resposta errada.</p>
                <div className={h.opcoes}>
                  {PADROES.map((label) => (
                    <button key={label} type="button"
                      className={`${h.opcao} ${padrao === label ? h.opcaoOn : ''}`}
                      onClick={() => { setPadrao(label); goNext(3); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button type="button" className={h.voltar} onClick={() => goBack(1)}>← Voltar</button>
              </div>
            )}

            {/* STEP 3 — Dados de nascimento */}
            {step === 3 && (
              <div>
                <p className={h.etapa}>Etapa 3</p>
                <h2 className={h.pergunta}>Qual é a sua data de nascimento?</h2>
                <p className={h.apoio}>A data é obrigatória. Hora e cidade são opcionais.</p>

                <div className={h.campos}>
                  {/* Data */}
                  <div>
                    <label className={h.rotulo} htmlFor="quiz-data">Data de nascimento</label>
                    <input
                      id="quiz-data"
                      type="date"
                      className={h.campo}
                      value={dataNasc}
                      onChange={e => setDataNasc(e.target.value)}
                    />
                  </div>

                  {/* Hora */}
                  <div>
                    <label className={h.rotulo} htmlFor="quiz-hora">
                      Hora de nascimento <span className={h.dica}>(opcional)</span>
                    </label>
                    <input
                      id="quiz-hora"
                      type="time"
                      className={h.campo}
                      value={horaNasc}
                      onChange={e => setHoraNasc(e.target.value)}
                      disabled={noSabeHora}
                    />
                    <label className={h.check}>
                      <input
                        type="checkbox"
                        checked={noSabeHora}
                        onChange={e => { setNoSabeHora(e.target.checked); if (e.target.checked) setHoraNasc(''); }}
                      />
                      <span>Não sei minha hora de nascimento</span>
                    </label>
                  </div>

                  {/* Cidade: autocomplete com os municípios do IBGE; texto livre continua valendo */}
                  <div>
                    <label className={h.rotulo} htmlFor="quiz-cidade">
                      Cidade onde nasceu <span className={h.dica}>(opcional)</span>
                    </label>
                    <CidadeAutocomplete
                      id="quiz-cidade"
                      value={localNasc}
                      onChangeText={(t) => { setLocalNasc(t); setMunicipio(null); }}
                      onSelect={(m) => { setLocalNasc(`${m.nome}, ${m.uf}`); setMunicipio(m); }}
                      placeholder="Ex: São Paulo, SP"
                      inputClassName={h.campo}
                      tema="ma"
                    />
                    <p className={h.ajuda}>Com hora e cidade calculamos seu Ascendente com precisão — mas não são obrigatórios.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`${h.btn} ${h.btnLargo}`}
                  style={dataNasc ? undefined : { opacity: .55, cursor: 'not-allowed' }}
                  onClick={() => { if (!dataNasc) { setErro('Selecione sua data de nascimento.'); return; } goNext(4); }}
                >
                  Continuar →
                </button>
                {erro && <p className={h.erro} style={{ textAlign: 'center' }}>{erro}</p>}
                <button type="button" className={h.voltar} onClick={() => goBack(2)}>← Voltar</button>
              </div>
            )}

            {/* STEP 4 — Nome + Email */}
            {step === 4 && (
              <div>
                <p className={h.etapa}>Etapa 4</p>
                <h2 className={h.pergunta}>Quase lá! Onde enviamos seu resultado?</h2>
                <p className={h.apoio}>Seu mapa personalizado ficará pronto em instantes.</p>
                <div className={h.campos}>
                  <div>
                    <label className={h.rotulo} htmlFor="quiz-nome">Seu nome completo (de nascimento)</label>
                    <input
                      id="quiz-nome"
                      type="text"
                      className={h.campo}
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Ex: Maria da Silva Santos"
                      autoComplete="name"
                    />
                    <p className={h.ajuda}>Use o nome que está na sua certidão de nascimento — ele é a base do seu mapa numerológico.</p>
                    {nomeErro && <p className={h.erro}>{nomeErro}</p>}
                  </div>
                  <div>
                    <label className={h.rotulo} htmlFor="quiz-email">Seu e-mail</label>
                    <input
                      id="quiz-email"
                      type="email"
                      className={`${h.campo} ${emailErro ? h.campoErro : ''}`}
                      value={email}
                      onChange={e => { setEmail(e.target.value.replace(/\s/g, '')); setEmailErro(''); setEmailSugestao(''); }}
                      onBlur={handleEmailBlur}
                      placeholder="seu@email.com"
                      autoComplete="email"
                    />
                    {emailSugestao && (
                      <p className={h.sugestao}>
                        Você quis dizer{' '}
                        <button type="button" onClick={aplicarSugestaoEmail}>{emailSugestao}</button>
                        ?
                      </p>
                    )}
                    {emailErro && <p className={h.erro}>{emailErro}</p>}
                  </div>
                </div>
                {erro && <div className={h.erroCaixa}>{erro}</div>}
                <button type="button" className={`${h.btn} ${h.btnLargo}`} onClick={handleSubmit} disabled={loading}>
                  Ver meu mapa agora
                </button>
                <p className={h.seguro}>Dados seguros · Resultado imediato · Gratuito</p>
                <button type="button" className={h.voltar} onClick={() => goBack(3)}>← Voltar</button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [quizOpen, setQuizOpen] = useState(false);
  const openQuiz = () => setQuizOpen(true);
  const closeQuiz = () => setQuizOpen(false);

  // Vindo de "Refazer minha análise" no /resultado — abre o quiz já limpo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    // ?quiz=1: botão "Fazer meu mapa grátis" do menu vindo de outra página
    if (params.get('refazer') === '1' || params.get('quiz') === '1') setQuizOpen(true);
    // Veio do CTA "Abrir meu mapa" do /ceu: abre o quiz já preenchido (uma vez)
    else if (consumirAbrirQuiz()) setQuizOpen(true);
    // O mesmo botão clicado aqui na home (o menu dispara um evento em vez de navegar)
    window.addEventListener(EVENTO_ABRIR_QUIZ, openQuiz);
    return () => window.removeEventListener(EVENTO_ABRIR_QUIZ, openQuiz);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = quizOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [quizOpen]);

  const CARDS = [
    { n: '01', title: 'Seu Padrão Central', desc: 'O número que rege sua vida — e por que você repete os mesmos ciclos sem perceber.' },
    { n: '02', title: 'Seu Arquétipo', desc: 'O papel que você assume no mundo — como você funciona no eixo e o que acontece quando sai.' },
    { n: '03', title: 'Seus Bloqueios', desc: 'Os mecanismos invisíveis que te travam justamente quando você está prestes a avançar.' },
    { n: '04', title: 'Direção Prática', desc: 'Não só o diagnóstico — o que fazer agora, com plano de ação e rituais personalizados.' },
  ];

  // "O que eu recebo de graça?" bate com os Termos (seção 5): o teste de 7 dias
  // é sem cartão, começa quando a pessoa cria a Minha Área e não cobra sozinho.
  const GRATIS = 'Seu Mapa: seu padrão central, seu arquétipo, seus principais bloqueios e uma direção prática, tudo personalizado com sua data de nascimento.'
    + (TESTE_SEU_DIA_ATIVO
      ? ' E, ao criar sua Minha Área depois do mapa, 7 dias do Seu Dia Completo (o que fazer, o que evitar e as melhores horas de cada dia), sem cartão e sem cobrança automática. Depois dos 7 dias, o resumo do seu dia continua grátis.'
      : ' Depois do mapa, o resumo do seu dia na Minha Área também é grátis.');

  const FAQS = [
    { q: 'Como funciona o mapa espiritual?', a: 'Combinamos Numerologia e análise de padrões comportamentais para revelar o que se repete na sua vida, o que te trava e qual é o próximo passo mais alinhado. Sem misticismo — só clareza.' },
    { q: 'O que eu recebo de graça?', a: GRATIS },
    { q: 'Preciso saber minha hora de nascimento?', a: 'Não. A análise funciona perfeitamente só com sua data de nascimento. A hora é opcional e, quando informada, aprofunda a leitura astrológica.' },
    { q: 'Meus dados estão seguros?', a: 'Sim. Seus dados são usados exclusivamente para gerar seu mapa e nunca são compartilhados com terceiros. Você pode cancelar comunicações a qualquer momento.' },
    { q: 'Quanto tempo demora?', a: 'Menos de 1 minuto para preencher o quiz. O resultado aparece na tela imediatamente após a análise.' },
  ];

  return (
    <>
      <style jsx global>{`
        html, body { background: #07040d; max-width: 100%; overflow-x: hidden; }
      `}</style>

      {/* Quiz overlay */}
      {quizOpen && <QuizOverlay onClose={closeQuiz} />}

      {/* Menu do site (mesmo de todas as páginas) */}
      <SiteNav />

      <div className={h.home}>

        {/* ═══════════════ HERO ═══════════════════════════════════════════════ */}
        <section className={h.hero}>
          <div className={h.heroCeu} aria-hidden="true">
            {/* Estrela: e4 no celular, e4w (16:9) a partir de 700px. Prioridade
                alta: é o maior elemento da primeira tela (LCP). */}
            <picture>
              <source media="(min-width: 700px)" srcSet="/olho/e4w.webp" />
              <img src="/olho/e4.webp" alt="" fetchPriority="high" loading="eager" decoding="async" />
            </picture>
            <div className={h.heroVeu} />
          </div>

          <div className={`${h.ctr} ${h.heroConteudo}`}>
            <span className={h.eyebrow}>Numerologia + Astrologia</span>
            <h1 className={h.titulo}>
              Você tenta mudar, mas algo invisível <em>te puxa de volta</em>
            </h1>
            <p className={h.sub}>
              Seu mapa revela o padrão que te trava — e o que fazer agora.{' '}
              <strong>Gratuito. Resultado na hora. Funciona mesmo sem saber sua hora de nascimento.</strong>
            </p>
            <div className={h.heroAcoes}>
              <button type="button" className={h.btn} onClick={openQuiz}>{ROTULO_CTA}</button>
              <p className={h.monoLinha}>1 minuto · grátis · funciona sem a hora</p>
            </div>
          </div>
        </section>

        {/* ═══════════════ O QUE VOCÊ VAI DESCOBRIR ══════════════════════════ */}
        <section className={h.secao} aria-labelledby="home-descobrir">
          <div className={h.ctr}>
            <div className={h.secaoTopo}>
              <span className={h.eyebrow}>No seu mapa</span>
              <h2 id="home-descobrir" className={h.h2}>O que você vai descobrir</h2>
              <p className={h.h2Sub}>Quatro dimensões que revelam quem você é — e o que está te impedindo de avançar.</p>
            </div>
            <ol className={h.linhas}>
              {CARDS.map(({ n, title, desc }) => (
                <li key={n} className={h.linha}>
                  <span className={h.linhaNum}>{n}</span>
                  <h3 className={h.linhaTitulo}>{title}</h3>
                  <p className={h.linhaTexto}>{desc}</p>
                </li>
              ))}
            </ol>
            <div className={h.acao}>
              <button type="button" className={h.btn} onClick={openQuiz}>{ROTULO_CTA}</button>
            </div>
          </div>
        </section>

        {/* ═══════════════ DEPOIS DO MAPA: SEU DIA ═══════════════════════════ */}
        <section className={h.secao} aria-labelledby="home-seu-dia">
          <div className={`${h.ctr} ${h.seuDia}`}>
            <div className={h.seuDiaTexto}>
              <span className={h.eyebrow}>Minha Área</span>
              <h2 id="home-seu-dia" className={h.h2}>Depois do mapa: <em>seu dia, todo dia</em></h2>
              <p className={h.frase}>O que fazer, o que evitar e as melhores horas, lido pelo seu mapa.</p>
              {TESTE_SEU_DIA_ATIVO && <p className={h.teste}>7 dias do Seu Dia Completo grátis, sem cartão</p>}
            </div>
            <div className={h.previaCaixa}>
              <span className={h.exemplo}>exemplo</span>
              <PreviaSeuDia />
            </div>
            {/* O caminho é mapa → Minha Área, então o botão abre o quiz. */}
            <div className={h.acao}>
              <button type="button" className={h.btn} onClick={openQuiz}>{ROTULO_CTA}</button>
            </div>
          </div>
        </section>

        {/* ═══════════════ DEPOIMENTOS — só aparece com conteúdo real em
            lib/testimonials.js. Nunca inventar um depoimento aqui. ════════════ */}
        {TESTIMONIALS.length > 0 && (
          <section className={h.secao} aria-labelledby="home-relatos">
            <div className={h.ctr}>
              <div className={h.secaoTopo}>
                <h2 id="home-relatos" className={h.h2}>Relatos de quem já fez o mapa</h2>
                <p className={h.h2Sub}>Pessoas reais. Clareza real.</p>
              </div>
              <div className={h.relatos}>
                {TESTIMONIALS.map(({ nome, cidade, texto }) => (
                  <figure key={nome} className={h.relato} style={{ margin: 0 }}>
                    <blockquote className={h.relatoTexto} style={{ margin: 0 }}>&ldquo;{texto}&rdquo;</blockquote>
                    <figcaption className={h.relatoQuem}>{nome}{cidade ? ` · ${cidade}` : ''}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ FAQ ════════════════════════════════════════════════ */}
        <section className={h.secao} aria-labelledby="home-faq">
          <div className={`${h.ctr} ${h.ctrSm}`}>
            <div className={h.secaoTopo}>
              <h2 id="home-faq" className={h.h2}>Perguntas frequentes</h2>
              <p className={h.h2Sub}>Transparência total — sem pegadinhas.</p>
            </div>
            <div className={h.faq}>
              {FAQS.map((item, i) => <FaqItem key={i} id={`faq-${i}`} q={item.q} a={item.a} />)}
            </div>
          </div>
        </section>

        {/* ═══════════════ CTA FINAL ══════════════════════════════════════════ */}
        <section className={h.secao} style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className={`${h.ctr} ${h.cta}`}>
            <h2 className={h.ctaTitulo}>
              O padrão que te trava não precisa continuar.{' '}
              <em>Descubra o que está por trás.</em>
            </h2>
            <p className={h.ctaSub}>Quiz de 1 minuto. Resultado imediato. Gratuito.</p>
            <button type="button" className={h.btn} onClick={openQuiz}>{ROTULO_CTA}</button>
            <p className={h.nota}>Seus dados são protegidos e usados apenas para gerar seu mapa.</p>
          </div>
        </section>

      </div>
    </>
  );
}
