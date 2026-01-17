'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// -----------------------
// Helpers (mantidos iguais)
// -----------------------
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
  if (!Number.isFinite(n)) return 0;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split('')
      .reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);
  }
  return n;
}

function calcularNumeroVida(dataISO) {
  const p = parseISODate(dataISO);
  if (!p) return 0;
  const { y, m, d } = p;

  const soma = String(y)
    .split('')
    .reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0)
    + String(m).split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0)
    + String(d).split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);

  return reduzirNumero(soma);
}

function formatarDataBR(dataISO) {
  const p = parseISODate(dataISO);
  if (!p) return '';
  const dd = String(p.d).padStart(2, '0');
  const mm = String(p.m).padStart(2, '0');
  const yy = String(p.y);
  return `${dd}/${mm}/${yy}`;
}

function gerarRelatorioGratuito({ nome, dataISO, signo, numeroVida, local }) {
  const primeiroNome = (nome || '').trim().split(' ')[0] || 'você';


  // INSIGHT MATADOR EMPODERADO
  const insightPorNumero = {
    1: "Você nasceu pra LIDERAR. Quando todo mundo hesita, você age. Você tem um magnetismo natural que faz as pessoas te seguirem sem você pedir. O desafio? Você ainda acha que precisa carregar tudo sozinha pra provar seu valor — mas a verdade é: você já provou. Agora é hora de liderar permitindo apoio, e aí seu poder multiplica.",
    2: "Você é ALTAMENTE INTUITIVA. Você lê pessoas, energias e situações como ninguém. Você sente o que não é dito e sabe exatamente o que o outro precisa antes dele falar. O desafio? Você absorve tudo e esquece que nem tudo é seu pra carregar. Quando você aprende a FILTRAR em vez de absorver, sua intuição vira superpoder sem te drenar.",
    3: "Você é PURA CRIATIVIDADE e expressão. Ideias brilhantes surgem naturalmente pra você — você vê possibilidades onde os outros veem limites. Você nasceu pra criar, inspirar, manifestar. O desafio? Você dispersa antes de concluir porque já tá na próxima visão. Mas quando você aprende a FOCAR sem perder a magia, você vira imparável.",
    4: "Você é a MESTRA DA CONSTRUÇÃO. Você cria estrutura, estabilidade e resultados reais. Quando você se compromete, você ENTREGA. Você tem uma força de vontade que intimida os fracos. O desafio? Você constrói pro mundo, mas esquece de construir pra você mesma. Quando você direciona essa força pra VOCÊ primeiro, tudo muda — porque aí você constrói do overflow, não do vazio.",
    5: "Você é LIBERDADE PURA. Você se adapta, muda, expande — você não cabe em caixas. Você nasceu pra explorar, experimentar, viver intensamente. As pessoas invejam sua coragem de ser diferente. O desafio? Você foge quando deveria ficar, porque confunde compromisso com prisão. Mas quando você entende que liberdade é ESCOLHA (não fuga), você finalmente pertence sem se perder.",
    6: "Você é AMOR INCONDICIONAL em forma humana. Você cura, acolhe, nutre — as pessoas se sentem seguras com você. Você tem um dom raro: fazer os outros se sentirem vistos. O desafio? Você doa até se esvaziar, como se seu valor dependesse disso. Mas quando você aprende a AMAR COM LIMITE, você cura sem se destruir — e aí seu impacto multiplica.",
    7: "Você é PROFUNDIDADE RARA. Você enxerga camadas que os outros nem percebem. Você conecta padrões, busca verdade, vai além do óbvio. Você nasceu pra ensinar, pra elevar consciências. O desafio? Você se sente sozinha porque poucos acompanham sua profundidade. Mas quando você ACEITA seu nível sem se rebaixar, você atrai quem realmente te merece — e aí a solidão vira seletividade consciente.",
    8: "Você nasceu pra GRANDEZA. Você tem poder, presença, capacidade de materializar o impossível. Quando você entra num espaço, as pessoas SENTEM. Você veio pra liderar, prosperar, construir legado. O desafio? Você tem medo da sua própria magnitude e se sabota antes de brilhar. Mas quando você OCUPA seu espaço sem medo, você vira uma força imparável — e o mundo se ajusta a VOCÊ.",
    9: "Você é PROPÓSITO EM MOVIMENTO. Você veio pra servir algo maior que você mesma. Você sente o chamado de transformar, curar, elevar. Você tem compaixão que transcende o ego. O desafio? Você doa até se esgotar, esquecendo que você TAMBÉM é parte da missão. Mas quando você aprende a SERVIR SEM SE SACRIFICAR, você finalmente sustenta o impacto — e aí a transformação é duradoura.",
    11: "Você é uma ANTENA ESPIRITUAL. Você recebe insights, visões, downloads que chegam do nada e ACERTAM. Você tem acesso a frequências que a maioria não capta. Você nasceu pra CANALIZAR e inspirar. O desafio? A sensibilidade extrema vem com ansiedade e sobrecarga sensorial. Mas quando você aprende a ATERRAR sua visão, você transforma intuição em AÇÃO — e aí você vira um portal de manifestação.",
    22: "Você é uma CONSTRUTORA DE IMPÉRIOS. Você não veio pra coisas pequenas — você veio pra criar algo GRANDE, duradouro, que transcenda você. Você tem capacidade de materializar visões impossíveis. O desafio? Você procrastina por perfeccionismo e medo de não dar conta da própria grandeza. Mas a verdade é: você JÁ É gigante. Quando você para de se preparar e COMEÇA, o universo conspira a favor — porque você é o arquétipo do mestre construtor.",
    33: "Você é CURA VIVA. Você ama sem condição, acolhe sem julgar, transforma dor em luz. As pessoas curam só de estar perto de você. Você é o amor que o mundo precisa mas raramente merece. O desafio? Você se sacrifica até desaparecer, como se seu valor fosse medido pelo quanto você doa. Mas quando você entende que VOCÊ TAMBÉM merece a cura que oferece, você finalmente sustenta sua luz — e aí seu impacto se torna eterno, não esgotável."
  };

  const insightMatador = insightPorNumero[numeroVida] || "Você sente que há mais em você do que consegue expressar. A frustração não é falta de capacidade — é falta de direção clara. Você sabe que pode mais, mas não sabe exatamente como acessar isso de forma sustentável. E isso cansa, porque o potencial tá ali, latente, mas parece travado.";

  const espelhoMomento = [
    `Você sente que está pronta pra mudança — mas algo ainda te segura no mesmo padrão.`,
    `Não é falta de vontade. É falta de estrutura simples pra sustentar o que você já sabe.`,
    `O próximo nível não exige força — exige direção clara.`,
  ];

  const assinaturaSigno = (() => {
    const map = {
      'Áries': {
        luz: 'coragem, iniciativa e ação rápida',
        sombra: 'impaciência que vira pressa sem direção',
        ajuste: 'trocar impulso por decisão consciente',
      },
      'Touro': {
        luz: 'consistência e poder de construção',
        sombra: 'resistência à mudança por medo de perder controle',
        ajuste: 'soltar o que já não serve sem medo',
      },
      'Gêmeos': {
        luz: 'versatilidade e visão ampla',
        sombra: 'dispersão que impede conclusão',
        ajuste: 'escolher 1 foco por 7 dias',
      },
      'Câncer': {
        luz: 'intuição profunda e empatia',
        sombra: 'absorver energia alheia até se perder',
        ajuste: 'proteger sua energia sem culpa',
      },
      'Leão': {
        luz: 'magnetismo e expressão autêntica',
        sombra: 'buscar validação externa',
        ajuste: 'reconhecer seu valor internamente',
      },
      'Virgem': {
        luz: 'precisão e melhoria contínua',
        sombra: 'perfeccionismo que paralisa',
        ajuste: 'feito com verdade > perfeito com medo',
      },
      'Libra': {
        luz: 'equilíbrio e harmonia',
        sombra: 'indecisão por medo de desagradar',
        ajuste: 'escolher sua verdade sem negociar',
      },
      'Escorpião': {
        luz: 'transformação profunda',
        sombra: 'controle e desconfiança',
        ajuste: 'vulnerabilidade é força',
      },
      'Sagitário': {
        luz: 'visão e expansão',
        sombra: 'fuga quando se sente limitada',
        ajuste: 'liberdade com compromisso',
      },
      'Capricórnio': {
        luz: 'estrutura e realização',
        sombra: 'dureza consigo mesma',
        ajuste: 'descanso também é produtividade',
      },
      'Aquário': {
        luz: 'originalidade e visão futurista',
        sombra: 'distanciamento emocional',
        ajuste: 'presença no agora',
      },
      'Peixes': {
        luz: 'conexão espiritual profunda',
        sombra: 'confusão energética',
        ajuste: 'aterramento para proteger seu dom',
      },
    };
    return map[signo] || {
      luz: 'potencial único',
      sombra: 'padrão que se repete',
      ajuste: 'clareza + ação consistente',
    };
  })();

  const assinaturaNumero = (() => {
    const map = {
      1: { luz: 'liderança natural', sombra: 'fazer tudo sozinha', mantra: 'Eu lidero com apoio' },
      2: { luz: 'sensibilidade e intuição', sombra: 'anular-se pelo outro', mantra: 'Eu sinto sem me perder' },
      3: { luz: 'criatividade e expressão', sombra: 'dispersão', mantra: 'Eu crio com foco' },
      4: { luz: 'estrutura sólida', sombra: 'rigidez', mantra: 'Eu construo com leveza' },
      5: { luz: 'liberdade e mudança', sombra: 'instabilidade', mantra: 'Eu mudo com direção' },
      6: { luz: 'amor e cuidado', sombra: 'carregar responsabilidade alheia', mantra: 'Eu cuido sem me esgotar' },
      7: { luz: 'profundidade espiritual', sombra: 'isolamento', mantra: 'Eu confio e me abro' },
      8: { luz: 'poder e materialização', sombra: 'autocobrança extrema', mantra: 'Eu mereço abundância' },
      9: { luz: 'propósito e compaixão', sombra: 'salvar todo mundo', mantra: 'Eu sirvo com limites' },
      11: { luz: 'visão elevada', sombra: 'ansiedade e intensidade', mantra: 'Eu canalizo com paz' },
      22: { luz: 'mestre construtor', sombra: 'medo da própria grandeza', mantra: 'Eu sustento meu tamanho' },
      33: { luz: 'cura universal', sombra: 'sacrifício', mantra: 'Eu amo com limite' },
    };


    return map[numeroVida] || { luz: 'caminho singular', sombra: 'teste recorrente', mantra: 'Eu escolho clareza' };
  })();

  return {
    insightMatador,
    espelhoMomento,
    assinaturaSigno,
    assinaturaNumero,
    localFrase: local ? `📍 ${local}` : '',
    dataFrase: dataISO ? `🎂 ${formatarDataBR(dataISO)}` : '',
    headline: `${primeiroNome}, você está a um passo da virada`,
  };
}

export default function ResultadoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  // Timer de urgência (10 minutos)
  const [tempoRestante, setTempoRestante] = useState(600); // 600 segundos = 10 min
  const [mostrarUrgencia, setMostrarUrgencia] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const urgTimer = setTimeout(() => setMostrarUrgencia(true), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(urgTimer);
    };
  }, []);

  const minutos = Math.floor(tempoRestante / 60);
  const segundos = tempoRestante % 60;

  const starsBuiltRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function buscar() {
      setLoading(true);
      setErro('');
      try {
        const { data, error } = await supabase
          .from('analises')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) throw new Error('Resultado não encontrado');

        if (!mounted) return;
        setAnalise(data);

        try {
          window?.gtag?.('event', 'visualizou_resultado', {
            event_category: 'engagement',
            value: 1,
          });
        } catch {}
      } catch (e) {
        if (!mounted) return;
        setErro(e?.message || 'Erro ao carregar');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (id) buscar();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (starsBuiltRef.current) return;
    starsBuiltRef.current = true;

    const stars = document.getElementById('stars');
    if (!stars) return;

    stars.innerHTML = '';
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 55 : 120;

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

    return () => {
      stars.innerHTML = '';
      starsBuiltRef.current = false;
    };
  }, []);

  const signoFinal = useMemo(() => {
    if (!analise) return '';
    return analise.signo || calcularSigno(analise.data_nascimento);
  }, [analise]);

  const numeroVidaFinal = useMemo(() => {
    if (!analise) return 0;
    return analise.numero_vida || calcularNumeroVida(analise.data_nascimento);
  }, [analise]);

  const relatorio = useMemo(() => {
    if (!analise) return null;
    return gerarRelatorioGratuito({
      nome: analise.nome,
      dataISO: analise.data_nascimento,
      signo: signoFinal,
      numeroVida: numeroVidaFinal,
      local: analise.local_nascimento,
    });
  }, [analise, signoFinal, numeroVidaFinal]);

  const handleComprar = async () => {
    setProcessando(true);
    try {
      try {
        window?.gtag?.('event', 'clique_comprar', {
          event_category: 'conversion',
          value: 19.9,
          currency: 'BRL',
        });
      } catch {}

      const response = await fetch('/api/criar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id }),
      });

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Erro ao abrir checkout');
    } catch (e) {
      alert(e?.message || 'Erro. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center">
          <div className="spinner" />
          <p className="muted">Carregando sua análise…</p>
        </div>
      </div>
    );
  }

  if (erro || !analise || !relatorio) {
    return (
      <div className="wrap">
        <style jsx global>{globalCss}</style>
        <div id="stars" className="stars" />
        <div className="center card">
          <h1 style={{ marginBottom: 10 }}>Ops…</h1>
          <p className="muted">{erro || 'Erro ao carregar'}</p>
          <button className="btn" onClick={() => router.push('/')}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <div id="stars" className="stars" />

      {/* TIMER DE URGÊNCIA REAL */}
      {tempoRestante > 0 && (
        <div className="timer-bar">
          ⏰ Oferta especial expira em: <strong>{String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}</strong>
        </div>
      )}

      {mostrarUrgencia && tempoRestante > 0 && (
        <div className="floating">
          🔥 Já são <strong>8 pessoas</strong> nesta página agora
        </div>
      )}

      <div className="container">
        {/* HERO - Mais direto e impactante */}
        <div className="hero">
          <div className="badge">🔒 Resultado Privado • Gerado Agora</div>

          <h1 className="title">{relatorio.headline}</h1>

          <p className="subtitle">
            O que você vai ler aqui bate diferente — porque é <b>seu mapa real</b>, não genérico.
          </p>

          <div className="pills">
            <span className="pill">♈ {signoFinal}</span>
            <span className="pill">🔢 Número {numeroVidaFinal}</span>
            {relatorio.dataFrase && <span className="pill">{relatorio.dataFrase}</span>}
          </div>

          {relatorio.localFrase && <div className="muted" style={{ marginTop: 8 }}>{relatorio.localFrase}</div>}
        </div>

        {/* BLOCO INSIGHT MATADOR - O "soco no estômago" */}
        <div className="card insight-card">
          <div className="insight-icon">💡</div>
          <h2 className="h2" style={{ textAlign: 'center', marginBottom: 16 }}>
            Seu Número {numeroVidaFinal} revela algo sobre você
          </h2>
          <div className="insight-text">
            {relatorio.insightMatador}
          </div>
          <div className="insight-footer">
            Se isso bateu forte, não é acaso. É porque <b>o mapa funciona</b>.
          </div>
        </div>

        {/* CTA ANTECIPADO #1 - aparecer cedo */}
        <div className="cta-preview">
          <div className="cta-preview-text">
            👇 Se você quiser <b>pular direto pro plano completo</b> (com ações práticas), 
            o botão tá aqui embaixo. Mas recomendo ler antes — vai fazer mais sentido.
          </div>
          <button className="btnMedium" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ Abrindo…' : '🚀 Quero o Manual Completo (R$ 19,90)'}
          </button>
          <div className="muted" style={{ fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            ✓ Acesso imediato • ✓ Garantia de 7 dias • ✓ Pagamento seguro
          </div>
        </div>

        {/* BLOCO 1 - Espelho emocional (ela precisa SE VER) */}
        <div className="card">
          <h2 className="h2">💭 Se isso aqui faz sentido, não é coincidência</h2>

          <ul className="list-check">
            {relatorio.espelhoMomento.map((t, i) => (
              <li key={i}>✓ {t}</li>
            ))}
          </ul>

          <div className="note-alert">
            ⚠️ <strong>Ponto crítico:</strong><br />
            Você já sabe que precisa mudar. O problema não é falta de clareza — 
            é <b>falta de estrutura simples</b> pra sustentar o que você já entendeu.
          </div>

          <div className="note">
            Se você leu até aqui e pensou "caramba, é exatamente isso" — 
            isso significa que seu mapa <b>bate</b>. E quando bate, funciona.
          </div>
        </div>

        {/* BLOCO 2 - Padrão que trava (nome o dragão) */}
        <div className="card">
          <h2 className="h2">🔍 O padrão invisível que te segura</h2>

          <p className="p">
            Pelo seu perfil, o travamento não vem de fora — 
            vem de um <b>padrão interno que você repete sem perceber</b>.
          </p>

          <div className="grid2">
            <div className="subcard highlight">
              <div className="subttl">✨ Sua força natural</div>
              <div className="p">{relatorio.assinaturaSigno.luz}</div>
              <div className="micro">Quando você tá alinhada, isso flui</div>
            </div>

            <div className="subcard danger">
              <div className="subttl">⚠️ Seu ponto cego</div>
              <div className="p">{relatorio.assinaturaSigno.sombra}</div>
              <div className="micro">É aqui que você se sabota sem querer</div>
            </div>
          </div>

          <div className="note-solution">
            <strong>Ajuste necessário agora:</strong><br />
            {relatorio.assinaturaSigno.ajuste}
            <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              (O Manual Completo te mostra <b>como</b> fazer isso em 7 dias)
            </div>
          </div>
        </div>

        {/* CTA #2 - reforço após diagnóstico */}
        <div className="cta-inline">
          <div className="cta-inline-text">
            💡 Tá vendo como isso já tá fazendo sentido? Imagina ter o <b>passo a passo completo</b> 
            com rituais, práticas e plano de ação pro seu perfil específico.
          </div>
          <button className="btnBig pulse" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ Processando…' : '✨ SIM, QUERO MEU PLANO COMPLETO AGORA'}
          </button>
          <div className="price-row">
            <span className="price-old">de R$ 59,90</span>
            <span className="price-now">por apenas R$ 19,90</span>
          </div>
          <div className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            ⚡ Acesso em 2 minutos • 🔒 Pagamento 100% seguro • ✓ 7 dias de garantia
          </div>
        </div>

        {/* BLOCO 3 - Número de Vida (camada extra de validação) */}
        <div className="card">
          <h2 className="h2">🔢 O que seu Número {numeroVidaFinal} revela</h2>

          <p className="p">
            Esse número mostra <b>como você evoluir nesta vida</b> — 
            e também onde você costuma se cobrar além do necessário.
          </p>

          <div className="grid2">
            <div className="subcard">
              <div className="subttl">Luz</div>
              <div className="p">{relatorio.assinaturaNumero.luz}</div>
            </div>

            <div className="subcard">
              <div className="subttl">Sombra</div>
              <div className="p">{relatorio.assinaturaNumero.sombra}</div>
            </div>
          </div>

          <div className="note-mantra">
            <strong>Mantra do seu número:</strong><br />
            "{relatorio.assinaturaNumero.mantra}"
          </div>
        </div>

        {/* BLOCO 4 - Prova social (CRÍTICO para conversão) */}
        <div className="card social-proof">
          <h2 className="h2">⭐ O que quem já tem o Manual relata</h2>

          <div className="testimonial">
            <div className="testimonial-text">
              "Eu tava travada faz MESES. Li o manual, fiz as práticas e em 3 dias destravei. 
              Não é mágica — é estrutura simples que funciona."
            </div>
            <div className="testimonial-author">— Marina S., 34 anos</div>
          </div>

          <div className="testimonial">
            <div className="testimonial-text">
              "Achei que seria mais um textão bonito. Mas tem ritual, tem rotina, tem ação. 
              Pela primeira vez senti que tinha direção clara."
            </div>
            <div className="testimonial-author">— Júlia M., 28 anos</div>
          </div>

          <div className="testimonial">
            <div className="testimonial-text">
              "R$ 19,90 foi o melhor investimento que fiz em mim esse ano. 
              Só de ter clareza do que priorizar já valeu."
            </div>
            <div className="testimonial-author">— Roberto C., 41 anos</div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-number">2.847+</div>
              <div className="stat-label">pessoas transformadas</div>
            </div>
            <div className="stat">
              <div className="stat-number">4.9/5.0</div>
              <div className="stat-label">avaliação média</div>
            </div>
            <div className="stat">
              <div className="stat-number">7 dias</div>
              <div className="stat-label">de garantia total</div>
            </div>
          </div>
        </div>

        {/* OFERTA FINAL - Aqui é o kill shot */}
        <div className="offer-final">
          <div className="offer-badge">🔥 OFERTA ESPECIAL - EXPIRA EM {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}</div>

          <h2 className="offer-title">
            Manual Completo de Autoconhecimento<br />
            <span style={{ fontSize: 20, fontWeight: 400 }}>Seu plano de 7 dias para sair do ciclo</span>
          </h2>

          <div className="offer-box">
            <div className="offer-includes">
              <div className="offer-section">
                <strong>✅ O que você recebe:</strong>
              </div>
              <ul className="list-check compact">
                <li>✓ Análise completa do seu Signo + Número (aprofundada)</li>
                <li>✓ Mapeamento dos bloqueios invisíveis que te sabotam</li>
                <li>✓ Previsão do seu ciclo atual (próximos 3-6 meses)</li>
                <li>✓ Plano de ação de 7 dias (rotina simples e prática)</li>
                <li>✓ Rituais rápidos (3-7 min) pro seu perfil específico</li>
                <li>✓ Guia de decisões: como parar de repetir o mesmo padrão</li>
              </ul>

              <div className="offer-section">
                <strong>🎁 Bônus exclusivos:</strong>
              </div>
              <ul className="list-check compact">
                <li>✓ Meditação guiada personalizada (áudio)</li>
                <li>✓ Planilha de acompanhamento semanal</li>
                <li>✓ Suporte via email por 30 dias</li>
              </ul>
            </div>

            <div className="offer-price-box">
              <div className="price-compare">
                <div className="price-old-big">De R$ 59,90</div>
                <div className="price-now-big">Por apenas R$ 19,90</div>
                <div className="price-savings">Você economiza R$ 40,00 (67% OFF)</div>
              </div>

              <button className="btnHuge pulse" onClick={handleComprar} disabled={processando}>
                {processando ? '⏳ ABRINDO CHECKOUT SEGURO…' : '🚀 SIM! QUERO MEU MANUAL AGORA'}
              </button>

              <div className="offer-features">
                <span>⚡ Acesso em 2 minutos</span>
                <span>🔒 Pagamento 100% seguro</span>
                <span>✓ Garantia incondicional de 7 dias</span>
              </div>
            </div>
          </div>

          {/* Quebra de objeções */}
          <div className="faq-mini">
            <div className="faq-item">
              <strong>❓ É realmente personalizado?</strong>
              <div>Sim. Baseado no seu nascimento completo (data + signo + número). Nada genérico.</div>
            </div>

            <div className="faq-item">
              <strong>❓ Quando recebo?</strong>
              <div>Imediatamente após confirmação do pagamento (geralmente em 1-2 minutos).</div>
            </div>

            <div className="faq-item">
              <strong>❓ E se eu não gostar?</strong>
              <div><strong>7 dias de garantia.</strong> Não fez sentido? Devolvemos 100% do valor.</div>
            </div>

            <div className="faq-item">
              <strong>❓ Por que tão barato?</strong>
              <div>Porque queremos que chegue em quem realmente precisa. Preço acessível, resultado real.</div>
            </div>
          </div>

          <div className="offer-urgency">
            ⚠️ <strong>Última chamada:</strong> Esta página é única e o desconto é válido apenas nesta visita. 
            Se você sair, o valor volta para R$ 59,90.
          </div>

          <button className="btnHuge pulse" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ PROCESSANDO…' : '✨ GARANTIR MINHA VAGA COM 67% OFF'}
          </button>

          <div className="muted" style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
            🔐 Seus dados estão seguros • Processamento por Stripe (certificado PCI)
          </div>
        </div>

        {/* Footer com garantia */}
        <div className="guarantee-box">
          <div className="guarantee-icon">🛡️</div>
          <div className="guarantee-content">
            <strong>Garantia Incondicional de 7 Dias</strong>
            <div className="muted" style={{ marginTop: 4 }}>
              Se o Manual não fizer sentido pra você, basta enviar um email e devolvemos 
              100% do seu investimento. Sem perguntas, sem burocracia.
            </div>
          </div>
        </div>

        <div className="footer-note">
          <div className="muted">
            Precisa de ajuda? Email: <strong>conceptintuitive@gmail.com</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------
// CSS OTIMIZADO PRA CONVERSÃO
// -----------------------
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
    max-width: 880px;
    margin: 0 auto;
    padding: 20px 16px 60px;
    position: relative;
    z-index: 5;
  }

  /* Stars */
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

  /* Timer urgência */
  .timer-bar {
    position: sticky;
    top: 0;
    z-index: 999;
    background: linear-gradient(90deg, #ef4444, #dc2626);
    color: white;
    text-align: center;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    animation: pulse-bar 2s infinite;
  }

  @keyframes pulse-bar {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }

  .floating {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 998;
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(236, 72, 153, 0.4);
    color: #fecaca;
    padding: 10px 16px;
    border-radius: 999px;
    backdrop-filter: blur(15px);
    font-size: 13px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  /* Hero */
  .hero {
    padding: 20px 0;
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
    margin: 12px 0 8px;
    font-family: 'Cinzel', serif;
    font-size: clamp(28px, 5vw, 48px);
    line-height: 1.1;
    background: linear-gradient(90deg, #fb7185, #a855f7, #fbbf24);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .subtitle {
    font-size: 18px;
    color: var(--muted);
    margin: 12px 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
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

  /* Cards */
  .card {
    margin-top: 24px;
    border-radius: 24px;
    padding: 24px;
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .h2 {
    font-family: 'Cinzel', serif;
    margin: 0 0 12px;
    font-size: 24px;
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

  /* Listas */
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
    font-size: 16px;
  }

  /* Notes */
  .note {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    background: rgba(139, 92, 246, 0.1);
    color: var(--text);
    font-size: 16px;
  }

  .note-alert {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.1);
    color: #fecaca;
    font-size: 16px;
  }

  .note-solution {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.1);
    color: #a7f3d0;
    font-size: 16px;
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

  /* Grid */
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
    font-size: 16px;
    color: rgba(216, 180, 254, 0.95);
    margin-bottom: 8px;
  }

  .micro {
    font-size: 14px;
    color: var(--muted);
    margin-top: 6px;
  }

  /* CTA Preview (aparece cedo) */
  .cta-preview {
    margin-top: 24px;
    padding: 20px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15));
    border: 2px dashed rgba(236, 72, 153, 0.4);
    text-align: center;
  }

  .cta-preview-text {
    font-size: 16px;
    color: var(--text);
    margin-bottom: 14px;
  }

  /* CTA Inline */
  .cta-inline {
    margin-top: 28px;
    padding: 24px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2));
    border: 2px solid rgba(236, 72, 153, 0.5);
    text-align: center;
    box-shadow: 0 24px 70px rgba(236, 72, 153, 0.2);
  }

  .cta-inline-text {
    font-size: 18px;
    color: var(--text);
    margin-bottom: 16px;
  }

  /* Prova social */
  .social-proof {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1));
    border-color: rgba(16, 185, 129, 0.3);
  }

  .testimonial {
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid var(--warning);
  }

  .testimonial-text {
    font-size: 17px;
    color: var(--text);
    font-style: italic;
    margin-bottom: 8px;
  }

  .testimonial-author {
    font-size: 14px;
    color: var(--muted);
    font-weight: 600;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }

  .stat {
    text-align: center;
    padding: 14px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.3);
  }

  .stat-number {
    font-size: 28px;
    font-weight: 900;
    color: var(--warning);
    font-family: 'Cinzel', serif;
  }

  .stat-label {
    font-size: 13px;
    color: var(--muted);
    margin-top: 4px;
  }

  /* Oferta final */
  .offer-final {
    margin-top: 32px;
    padding: 28px;
    border-radius: 28px;
    background: linear-gradient(145deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.15));
    border: 3px solid var(--primary);
    box-shadow: 0 30px 90px rgba(236, 72, 153, 0.3);
  }

  .offer-badge {
    display: inline-block;
    padding: 10px 16px;
    border-radius: 999px;
    background: linear-gradient(90deg, #ef4444, #dc2626);
    color: white;
    font-weight: 900;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    letter-spacing: 0.5px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
  }

  .offer-title {
    margin: 16px 0 12px;
    font-family: 'Cinzel', serif;
    font-size: 28px;
    color: var(--text);
    text-align: center;
  }

  .offer-box {
    margin-top: 20px;
  }

  .offer-includes {
    margin-bottom: 24px;
  }

  .offer-section {
    margin-top: 20px;
    margin-bottom: 12px;
    font-size: 18px;
    color: var(--warning);
    font-family: 'Cinzel', serif;
  }

  .offer-price-box {
    padding: 24px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.4);
    text-align: center;
  }

  .price-compare {
    margin-bottom: 20px;
  }

  .price-old-big {
    font-size: 20px;
    color: var(--muted);
    text-decoration: line-through;
  }

  .price-now-big {
    font-size: 42px;
    font-weight: 900;
    color: var(--success);
    font-family: 'Cinzel', serif;
    margin: 8px 0;
  }

  .price-savings {
    font-size: 15px;
    color: var(--warning);
    font-weight: 600;
  }

  .price-row {
    text-align: center;
    margin-top: 12px;
  }

  .price-old {
    font-size: 16px;
    color: var(--muted);
    text-decoration: line-through;
  }

  .price-now {
    font-size: 32px;
    font-weight: 900;
    color: var(--success);
    margin: 4px 0;
  }

  .offer-features {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    margin-top: 14px;
    font-size: 13px;
    color: var(--muted);
  }

  .offer-features span {
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 12px;
    border-radius: 999px;
  }

  .offer-urgency {
    margin-top: 20px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fecaca;
    font-size: 15px;
    text-align: center;
  }

  /* FAQ mini */
  .faq-mini {
    margin-top: 24px;
    padding: 20px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.3);
  }

  .faq-item {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .faq-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .faq-item strong {
    display: block;
    margin-bottom: 6px;
    color: var(--text);
    font-size: 16px;
  }

  .faq-item div {
    color: var(--muted);
    font-size: 15px;
  }

  /* Garantia */
  .guarantee-box {
    margin-top: 28px;
    padding: 20px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(0, 0, 0, 0.3));
    border: 2px solid rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .guarantee-icon {
    font-size: 48px;
    flex-shrink: 0;
  }

  .guarantee-content strong {
    display: block;
    font-size: 18px;
    color: var(--success);
    margin-bottom: 6px;
  }

  /* Botões */
  .btn {
    padding: 12px 20px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(17, 7, 32, 0.6);
    color: var(--text);
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 15px;
    transition: all 0.2s;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
  }

  .btnMedium {
    width: 100%;
    padding: 14px 20px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 16px;
    color: white;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    box-shadow: 0 12px 40px rgba(236, 72, 153, 0.25);
    transition: all 0.2s;
  }

  .btnMedium:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 50px rgba(236, 72, 153, 0.35);
  }

  .btnMedium:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btnBig {
    width: 100%;
    padding: 18px 24px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 18px;
    color: white;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    box-shadow: 0 20px 60px rgba(236, 72, 153, 0.3);
    transition: all 0.2s;
  }

  .btnBig:hover {
    transform: translateY(-3px);
    box-shadow: 0 25px 70px rgba(236, 72, 153, 0.4);
  }

  .btnBig:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btnBig.pulse {
    animation: pulse-btn 2s infinite;
  }

  @keyframes pulse-btn {
    0%, 100% {
      box-shadow: 0 20px 60px rgba(236, 72, 153, 0.3);
    }
    50% {
      box-shadow: 0 25px 70px rgba(236, 72, 153, 0.5);
    }
  }

  .btnHuge {
    width: 100%;
    padding: 22px 28px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 20px;
    color: white;
    background: linear-gradient(90deg, #10b981, #059669);
    box-shadow: 0 25px 80px rgba(16, 185, 129, 0.4);
    transition: all 0.2s;
  }

  .btnHuge:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 90px rgba(16, 185, 129, 0.5);
  }

  .btnHuge:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btnHuge.pulse {
    animation: pulse-huge 1.5s infinite;
  }

  @keyframes pulse-huge {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 25px 80px rgba(16, 185, 129, 0.4);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 30px 90px rgba(16, 185, 129, 0.6);
    }
  }

  /* Loading */
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
    to {
      transform: rotate(360deg);
    }
  }

  /* Footer */
  .footer-note {
    margin-top: 28px;
    text-align: center;
    font-size: 14px;
  }

  /* Insight Card - O soco no estômago */
  .insight-card {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.15));
    border: 2px solid rgba(245, 158, 11, 0.4);
    text-align: center;
    position: relative;
    animation: fadeInUp 0.6s ease;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .insight-icon {
    font-size: 48px;
    margin-bottom: 12px;
    animation: pulse 2s infinite;
  }

  .insight-text {
    font-size: 23px;  /* <-- MUDA AQUI O TAMANHO */
    line-height: 1.8;
    color: var(--text);
    font-weight: 400;
    padding: 24px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    margin: 16px 0;
    border-left: 4px solid var(--warning);
    text-align: left;
  }

  .insight-footer {
    font-size: 16px;
    color: var(--muted);
    margin-top: 12px;
  }
`;