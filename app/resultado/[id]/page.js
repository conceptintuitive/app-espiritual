
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

/**
 * ✅ ResultadoPage completo (compila) + usa:
 * - numero_vida (ou calcula)
 * - signo (ou calcula)
 * - objetivo_principal
 * - relacao_status
 * - trabalho_status
 *
 * IMPORTANTE:
 * 1) Removi aqueles blocos soltos `{analise?.objetivo_principal && (...)}` que estavam FORA do return (isso quebra build).
 * 2) Padronizei os nomes dos campos para bater com seu SQL:
 *    objetivo_principal, relacao_status, trabalho_status
 * 3) Estruturei a narrativa (curiosidade → identificação → tensão → solução → oferta) e personalização com os 3 campos.
 */

// -----------------------
// Supabase
// -----------------------
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// -----------------------
// Helpers (data, signo, numero vida)
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
    String(y)
      .split('')
      .reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0) +
    String(m)
      .split('')
      .reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0) +
    String(d)
      .split('')
      .reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);

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

// -----------------------
// Text helpers
// -----------------------
// -----------------------
// Text helpers (DEFINIR 1x só)
// -----------------------
function norm(s) {
  return (s ?? '').toString().trim();
}

function lowerClean(s) {
  return norm(s).toLowerCase();
}

function titleCase(s) {
  const t = norm(s);
  if (!t) return '';
  return t
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function hasChoice(v) {
  const t = norm(v);
  if (!t) return false;
  const low = t.toLowerCase();
  return low !== 'selecionar' && low !== 'select';
}

function isSameObjective(input, options) {
  const t = lowerClean(input);
  return options.some((o) => t === lowerClean(o));
}

// -----------------------
// Copy: assinatura por signo/numero (tensão + solução)
// -----------------------
function assinaturaSigno(signo) {
  const map = {
    Áries: { luz: 'coragem, iniciativa e ação rápida', sombra: 'pressa sem direção', ajuste: 'trocar impulso por decisão consciente' },
    Touro: { luz: 'consistência e construção', sombra: 'resistência à mudança', ajuste: 'soltar o que já não serve sem medo' },
    Gêmeos: { luz: 'visão ampla e inteligência', sombra: 'dispersão', ajuste: 'escolher 1 foco por 7 dias' },
    Câncer: { luz: 'intuição e empatia', sombra: 'absorver energia alheia', ajuste: 'proteger sua energia sem culpa' },
    Leão: { luz: 'magnetismo e expressão', sombra: 'buscar validação externa', ajuste: 'reconhecer seu valor internamente' },
    Virgem: { luz: 'precisão e evolução', sombra: 'perfeccionismo que paralisa', ajuste: 'feito com verdade > perfeito com medo' },
    Libra: { luz: 'harmonia e inteligência social', sombra: 'indecisão por medo de desagradar', ajuste: 'escolher sua verdade sem negociar' },
    Escorpião: { luz: 'poder de transformação', sombra: 'controle e desconfiança', ajuste: 'vulnerabilidade é força' },
    Sagitário: { luz: 'expansão e visão', sombra: 'fuga quando se sente limitada', ajuste: 'liberdade com compromisso' },
    Capricórnio: { luz: 'estrutura e realização', sombra: 'dureza consigo mesma', ajuste: 'descanso também é produtividade' },
    Aquário: { luz: 'originalidade e futuro', sombra: 'distanciamento emocional', ajuste: 'presença no agora' },
    Peixes: { luz: 'conexão espiritual', sombra: 'confusão energética', ajuste: 'aterramento para proteger seu dom' },
  };

  return (
    map[signo] || {
      luz: 'potencial único',
      sombra: 'padrão que se repete',
      ajuste: 'clareza + ação consistente',
    }
  );
}

function assinaturaNumero(numeroVida) {
  const map = {
    1: { luz: 'liderança natural', sombra: 'fazer tudo sozinha', mantra: 'Eu lidero com apoio' },
    2: { luz: 'sensibilidade e intuição', sombra: 'anular-se pelo outro', mantra: 'Eu sinto sem me perder' },
    3: { luz: 'criatividade e expressão', sombra: 'dispersão', mantra: 'Eu crio com foco' },
    4: { luz: 'estrutura e disciplina', sombra: 'rigidez', mantra: 'Eu construo com leveza' },
    5: { luz: 'mudança e liberdade', sombra: 'instabilidade', mantra: 'Eu mudo com direção' },
    6: { luz: 'amor e cuidado', sombra: 'cuidar de todos menos de você', mantra: 'Eu cuido sem me esgotar' },
    7: { luz: 'profundidade e verdade', sombra: 'isolamento', mantra: 'Eu confio e me abro' },
    8: { luz: 'poder e materialização', sombra: 'autocobrança', mantra: 'Eu mereço abundância' },
    9: { luz: 'propósito e compaixão', sombra: 'salvar todo mundo', mantra: 'Eu sirvo com limites' },
    11: { luz: 'visão elevada', sombra: 'ansiedade/intensidade', mantra: 'Eu canalizo com paz' },
    22: { luz: 'mestre construtor', sombra: 'medo da grandeza', mantra: 'Eu sustento meu tamanho' },
    33: { luz: 'cura universal', sombra: 'sacrifício', mantra: 'Eu amo com limite' },
  };
  return map[numeroVida] || { luz: 'caminho singular', sombra: 'teste recorrente', mantra: 'Eu escolho clareza' };
}

// ----------------------------------------------------
// GANCHOS por NÚMERO (universal)
// ----------------------------------------------------
function ganchoNumeroDisciplina(numeroVida) {
  const map = {
    '1': 'Com o 1, você funciona melhor com meta curta + comando claro. Disciplina é direção e início rápido.',
    '2': 'Com o 2, disciplina é consistência gentil. Você sustenta mais quando o plano respeita seu emocional.',
    '3': 'Com o 3, o risco é dispersar. Disciplina aqui é foco curto e repetível (sem tédio).',
    '4': 'Com o 4, você ama estrutura. O cuidado é não transformar isso em rigidez que trava.',
    '5': 'Com o 5, a mente pede novidade. Disciplina é variedade com regra simples (um foco por vez).',
    '6': 'Com o 6, você assume demais. Disciplina é priorizar você sem culpa e sem se esgotar.',
    '7': 'Com o 7, você precisa entender o “porquê”. Disciplina é clareza + rotina mínima, sem excesso.',
    '8': 'Com o 8, você dá conta — mas se cobra. Disciplina é execução com calma, não autocobrança tóxica.',
    '9': 'Com o 9, você se envolve com tudo. Disciplina é limites e escolha do essencial.',
    '11': 'Com o 11, sua mente dispara fácil — disciplina precisa ser aterramento + rotina mínima.',
    '22': 'Com o 22, você pensa grande — disciplina é dividir em micro-passos pra virar construção real.',
    '33': 'Com o 33, você cuida demais — disciplina é “limite com amor” pra manter constância.',
  };
  return map[numeroVida] || 'Disciplina aqui é um sistema pequeno que você sustenta até em dias ruins.';
}

function ganchoNumeroAnsiedade(numeroVida) {
  const map = {
    1: 'Com o 1, ansiedade vem de pressa interna. O protocolo é ação simples + ritmo constante.',
    2: 'Com o 2, ansiedade vem de absorver o outro. O protocolo é limite emocional + aterramento.',
    3: 'Com o 3, ansiedade vem de excesso de estímulo. O protocolo é reduzir ruído + foco curto.',
    4: 'Com o 4, ansiedade vem de controle/rigidez. O protocolo é flexibilidade com rotina mínima.',
    5: 'Com o 5, ansiedade vem de instabilidade. O protocolo é “âncora diária” + decisão simples.',
    6: 'Com o 6, ansiedade vem de responsabilidade demais. O protocolo é priorização + autocuidado real.',
    7: 'Com o 7, você rumina em silêncio — o protocolo é clareza + descarrego mental curto.',
    8: 'Com o 8, ansiedade vem de pressão por resultado. O protocolo é execução com pausa e corpo presente.',
    9: 'Com o 9, ansiedade vem de carregar o mundo. O protocolo é limite + aterramento.',
    11: 'O 11 amplifica sensibilidade — o protocolo precisa tirar você da mente e levar pro corpo.',
    22: 'Com o 22, ansiedade vem do “tamanho da missão”. O protocolo é micro-passos e consistência.',
    33: 'Com o 33, ansiedade vem de se doar além do limite. O protocolo é “amor com limite”.',
  };
  return map[numeroVida] || 'O protocolo é aterramento e decisão simples (sem ruminação).';
}

function ganchoNumeroRelacionamento(numeroVida) {
  const map = {
    1: 'Com o 1, você precisa de admiração e clareza. Amor saudável é escolher quem soma e não disputa poder.',
    2: 'Com o 2, você precisa de segurança emocional. Amor saudável é reciprocidade, não migalha.',
    3: 'Com o 3, você precisa de leveza e verdade. Amor saudável é presença, não joguinho.',
    4: 'Com o 4, você precisa de constância. Amor saudável é estabilidade com afeto, não frieza.',
    5: 'Com o 5, você precisa de liberdade com compromisso. Amor saudável não prende — alinha.',
    6: 'Com o 6, você ama cuidar. Amor saudável é parceria, não maternagem.',
    7: 'Com o 7, você precisa de profundidade. Amor saudável é verdade e respeito pelo seu tempo.',
    8: 'Com o 8, você atrai intensidade. Amor saudável é poder compartilhado, não controle.',
    9: 'Com o 9, você é coração grande. Amor saudável é limite para não “salvar” o outro.',
    11: 'Com o 11, você sente tudo forte — amor saudável é limite energético + clareza (pra não virar ansiedade).',
    22: 'Com o 22, você quer construir. Amor saudável é projeto a dois, não promessas vazias.',
    33: 'Com o 33, você dá muito. Amor saudável é amor com limite e reciprocidade real.',
  };
  return map[numeroVida] || 'Amor saudável aqui é critério + posicionamento (sem ansiedade).';
}

// ----------------------------------------------------
// GANCHOS por SIGNO (universal)
// ----------------------------------------------------
function ganchoSignoDisciplina(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Áries precisa de começo rápido — o método é “ação pequena agora”, não planejamento eterno.',
    'Touro': 'Touro sustenta quando faz sentido — o método é consistência e progresso visível.',
    'Gêmeos': 'Gêmeos precisa de variedade com regra simples. Um foco por vez, por 7 dias.',
    'Câncer': 'Câncer precisa de segurança emocional — disciplina é rotina que acolhe, não que pune.',
    'Leão': 'Leão sustenta quando se sente reconhecida — disciplina é ritual com recompensa inteligente.',
    'Virgem': 'Virgem se cobra — o método é “feito com verdade”, não perfeição.',
    'Libra': 'Libra trava na indecisão — disciplina é decidir o essencial e parar de negociar com o hábito.',
    'Escorpião': 'Escorpião vai ao extremo — disciplina é intensidade com constância (sem 8 ou 80).',
    'Sagitário': 'Sagitário precisa de liberdade — o método é estrutura leve, não rigidez.',
    'Capricórnio': 'Capricórnio ama metas — disciplina é plano enxuto + execução diária.',
    'Aquário': 'Aquário precisa de sentido e autonomia — disciplina é sistema inteligente, não regra vazia.',
    'Peixes': 'Peixes absorve energia — disciplina é aterramento + limites simples para não se perder.',
  };
  return map[s] || 'O método respeita sua energia para você não depender de motivação.';
}

function ganchoSignoAnsiedade(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Áries acelera — então o ajuste é desacelerar o corpo e tomar 1 decisão simples por vez.',
    'Touro': 'Touro se prende no controle — o ajuste é segurança com flexibilidade (sem rigidez).',
    'Gêmeos': 'Gêmeos hiperestimula a mente — o ajuste é reduzir ruído e focar em blocos curtos.',
    'Câncer': 'Câncer absorve — o ajuste é limite emocional e proteção energética sem culpa.',
    'Leão': 'Leão sente pressão por performance — o ajuste é presença e autoestima que não depende de validação.',
    'Virgem': 'Virgem rumina e se cobra — o ajuste é “bom o suficiente” com rotina mínima.',
    'Libra': 'Libra fica presa em possibilidades — o ajuste é decisão e encerramento de ciclos.',
    'Escorpião': 'Escorpião intensifica — o ajuste é aterramento e confiança sem controle.',
    'Sagitário': 'Sagitário foge quando se sente limitado — o ajuste é liberdade com compromisso (sem fuga).',
    'Capricórnio': 'Capricórnio carrega demais — o ajuste é descanso estratégico e autocobrança saudável.',
    'Aquário': 'Aquário pode desconectar do corpo — o ajuste é presença e prática somática curta.',
    'Peixes': 'Peixes sente tudo — o ajuste é aterramento e filtros energéticos simples.',
  };
  return map[s] || 'Ajuste do signo: presença no corpo + escolha simples (sem ruminação).';
}

function ganchoSignoRelacionamento(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'No amor, Áries precisa de admiração e verdade — sem joguinho e sem disputa.',
    'Touro': 'No amor, Touro precisa de constância — promessa sem atitude te drena.',
    'Gêmeos': 'No amor, Gêmeos precisa de conversa real — sinal confuso vira ansiedade.',
    'Câncer': 'No amor, Câncer precisa de segurança — sem reciprocidade, você absorve demais.',
    'Leão': 'No amor, Leão precisa de presença e respeito — migalha não combina com você.',
    'Virgem': 'No amor, Virgem precisa de clareza — não é seu trabalho “consertar” o outro.',
    'Libra': 'No amor, Libra precisa de escolha — paz não é evitar conflito, é alinhar verdade.',
    'Escorpião': 'No amor, Escorpião precisa de lealdade — intensidade sem compromisso vira caos.',
    'Sagitário': 'No amor, Sagitário precisa de liberdade — mas com compromisso, não com fuga.',
    'Capricórnio': 'No amor, Capricórnio precisa de construção — consistência é linguagem de amor.',
    'Aquário': 'No amor, Aquário precisa de autenticidade — conexão real sem distância emocional.',
    'Peixes': 'No amor, Peixes precisa de limite — amor sem filtro vira confusão energética.',
  };
  return map[s] || 'No amor: critério emocional + posicionamento (sem ansiedade).';
}

// ----------------------------------------------------
// PLANOS/BÔNUS (reutilizáveis) — você pode trocar depois
// ----------------------------------------------------
const PLANO7_DISCIPLINA = [
  'Dia 1: identificar o sabotador (o padrão que te faz parar)',
  'Dia 2: rotina mínima (5–12 min) que você consegue manter',
  'Dia 3: “trava anti-procrastinação” (ação de 2 minutos)',
  'Dia 4: foco por blocos (sem depender de motivação)',
  'Dia 5: recompensa inteligente (sem culpa)',
  'Dia 6: disciplina emocional (não só agenda)',
  'Dia 7: plano de manutenção (3 hábitos-chave)',
];

const BONUS_DISCIPLINA = [
  'Checklist de Rotina (30 dias)',
  'Ritual de Foco (3–5 min)',
  'Mapa do Dinheiro (destravamento)',
];

const PLANO7_ANSIEDADE = [
  'Dia 1: mapear gatilhos (o que te acelera de verdade)',
  'Dia 2: aterramento (respiração + corpo, 4 minutos)',
  'Dia 3: corte de sobrecarga (3 ajustes práticos)',
  'Dia 4: “limite energético” (pra não absorver tudo)',
  'Dia 5: rotina de sono/mente (sem radicalismo)',
  'Dia 6: confiança na decisão (sem ruminação)',
  'Dia 7: manutenção (ritual de 3–7 min por dia)',
];

const BONUS_ANSIEDADE = [
  'Guia Anti-Ruminação',
  'Ritual de Aterramento (3–7 min)',
  'Mapa do Amor (ansiedade afetiva)',
];

const PLANO7_RELACIONAMENTO = [
  'Dia 1: seu padrão de atração (o que você repete sem perceber)',
  'Dia 2: o filtro certo (3 sinais que você não pode ignorar)',
  'Dia 3: limite elegante (sem drama)',
  'Dia 4: postura interna (mulher que sustenta valor)',
  'Dia 5: comunicação que alinha (sem joguinho)',
  'Dia 6: corte de ansiedade (não se perder em sinais)',
  'Dia 7: plano de manutenção (amor saudável é padrão, não sorte)',
];

const BONUS_RELACIONAMENTO = [
  'Mapa do Amor completo',
  'Checklist de sinais',
  'Ritual de autoestima',
];

// ----------------------------------------------------
// ✅ FUNÇÃO PRINCIPAL (substitui seu bloco inteiro)
// ----------------------------------------------------
 function getObjetivoCopy(objetivo, numeroVida, signo) {
  const oRaw = norm(objetivo);
  const o = lowerClean(oRaw);

  if (!oRaw || o === 'selecionar' || o === 'select') {
    return {
      headline: 'Seu mapa já mostrou o padrão. Agora falta o plano que muda o jogo.',
      subheadline: 'Clareza sem execução vira só consciência dolorida.',
      dor: 'Você já percebeu onde se repete. O que falta não é entender mais. É ter uma estrutura simples para não voltar para o mesmo ciclo.',
      virada: 'O Manual transforma insight em direção prática, com passos pequenos o bastante para você conseguir sustentar.',
      promessa: 'Você sai daqui com um plano de 7 dias para sair do padrão e entrar em movimento real.',
      plano7: [
        'Dia 1: clareza do padrão principal',
        'Dia 2: corte do que mais drena',
        'Dia 3: ação simples de reposicionamento',
        'Dia 4: redução de ruído',
        'Dia 5: constância mínima',
        'Dia 6: ajuste emocional',
        'Dia 7: manutenção do novo ritmo',
      ],
      bonus: ['Mapa do Amor', 'Mapa do Dinheiro', 'Calendário de Poder (30 dias)'],
      fechamento: 'Você já entendeu o padrão. O Manual existe para impedir que você continue vivendo exatamente a mesma história com nomes diferentes.',
      ctaLabel: '🚀 Quero meu plano completo agora',
    };
  }

  // DISCIPLINA
  if (isSameObjective(oRaw, ['ter mais disciplina', 'disciplina', 'ser mais disciplinada'])) {
    return {
      headline: 'Disciplina, no seu caso, não é força. É estrutura certa.',
      subheadline: 'O problema não é preguiça. É depender de vontade para fazer o que precisa ser sustentado.',
      dor: 'Você até começa bem. Mas quando o dia pesa, o ritmo quebra. E cada vez que você quebra o que prometeu para si, sua confiança interna diminui.',
      virada: 'O Manual te mostra como criar constância sem viver em autocobrança. Menos promessa vazia. Mais sistema simples.',
      promessa: 'Você aprende a funcionar mesmo em dias normais, sem depender de motivação alta para manter o básico.',
      plano7: [
        'Dia 1: identificar o sabotador que te faz parar',
        'Dia 2: criar sua rotina mínima real',
        'Dia 3: instalar a trava anti-procrastinação',
        'Dia 4: focar sem depender de clima',
        'Dia 5: repetir sem se punir',
        'Dia 6: ajustar recaídas sem largar tudo',
        'Dia 7: consolidar o hábito principal',
      ],
      bonus: ['Checklist de Rotina', 'Ritual de Foco', 'Mapa do Dinheiro'],
      fechamento: 'Você não precisa virar outra pessoa. Precisa parar de negociar com o que já sabe que funciona.',
      ctaLabel: '⚡ Quero criar disciplina de verdade',
    };
  }

  // ANSIEDADE
  if (isSameObjective(oRaw, ['reduzir ansiedade', 'ansiedade', 'diminuir ansiedade'])) {
    return {
      headline: 'Ansiedade, no seu caso, não é exagero. É excesso de ruído sem aterramento.',
      subheadline: 'Você não precisa se controlar mais. Precisa se regular melhor.',
      dor: 'Sua mente acelera, o corpo acompanha e tudo vira urgência. O problema é que, quando tudo parece urgente, você perde clareza até sobre o que realmente importa.',
      virada: 'O Manual te dá um protocolo simples para sair da espiral mental e voltar para direção, corpo e presença.',
      promessa: 'Você aprende a diminuir o ruído interno sem perder sua intensidade, só deixando de ser conduzida por ela.',
      plano7: [
        'Dia 1: mapear os gatilhos reais',
        'Dia 2: aterramento rápido do corpo',
        'Dia 3: corte de sobrecarga invisível',
        'Dia 4: limite energético',
        'Dia 5: rotina mínima anti-ruído',
        'Dia 6: decisão com calma',
        'Dia 7: manutenção emocional prática',
      ],
      bonus: ['Guia Anti-Ruminação', 'Ritual de Aterramento', 'Mapa do Amor'],
      fechamento: 'Se você continuar tentando resolver ansiedade só pensando mais, vai continuar cansada e sem direção. O Manual quebra esse ciclo.',
      ctaLabel: '🧘 Quero diminuir minha ansiedade',
    };
  }

  // AUTOESTIMA
  if (isSameObjective(oRaw, ['melhorar autoestima', 'autoestima'])) {
    return {
      headline: 'Autoestima não sobe quando você se elogia mais. Sobe quando você se trai menos.',
      subheadline: 'O seu problema não é falta de valor. É falta de evidência interna sustentada.',
      dor: 'Você até se sente forte em alguns momentos. Mas quando perde ritmo, falha ou sente rejeição, a confiança desce rápido. Isso acontece porque sua autoestima ainda oscila junto com validação, performance e comparação.',
      virada: 'O Manual te mostra como transformar autoestima em comportamento: limite, constância, auto-respeito e micro-promessas cumpridas.',
      promessa: 'Você para de depender do que acontece fora para se sentir mais firme por dentro.',
      plano7: [
        'Dia 1: identificar onde você se abandona',
        'Dia 2: cumprir a primeira micro-promessa',
        'Dia 3: cortar 1 comportamento de auto-desrespeito',
        'Dia 4: sustentar 1 limite real',
        'Dia 5: fazer 1 ação que gera orgulho interno',
        'Dia 6: reduzir comparação',
        'Dia 7: consolidar um novo padrão de respeito próprio',
      ],
      bonus: ['Mapa do Amor', 'Ritual de Presença', 'Calendário de Poder'],
      fechamento: 'Você não precisa parecer mais confiante. Precisa começar a agir de um jeito que faça você confiar mais em si.',
      ctaLabel: '✨ Quero fortalecer minha autoestima',
    };
  }

  // ATRAIR RELACIONAMENTO SAUDÁVEL
  if (isSameObjective(oRaw, ['atrair relacionamento saudável', 'atrair um relacionamento saudável', 'relacionamento saudável'])) {
    return {
      headline: 'Você não atrai um relacionamento saudável só porque quer. Atrai quando muda o filtro.',
      subheadline: 'O padrão no amor não quebra quando você sente mais. Quebra quando você escolhe melhor.',
      dor: 'Você pode até perceber quando algo parece confuso, mas ainda assim se envolver rápido, criar expectativa cedo ou insistir no potencial. E é aí que a ansiedade entra e o padrão repete.',
      virada: 'O Manual te mostra como sair da escolha emocional impulsiva e entrar em critério, clareza e posicionamento afetivo.',
      promessa: 'Você aprende a reconhecer o que te drena antes de se perder, e a escolher consistência em vez de intensidade vazia.',
      plano7: [
        'Dia 1: identificar seu padrão de atração',
        'Dia 2: definir seus 3 não-negociáveis',
        'Dia 3: cortar o que te mantém no quase',
        'Dia 4: ajustar sua postura afetiva',
        'Dia 5: praticar clareza sem joguinho',
        'Dia 6: reduzir ansiedade emocional',
        'Dia 7: consolidar seu novo filtro amoroso',
      ],
      bonus: ['Mapa do Amor completo', 'Checklist de sinais', 'Ritual de autoestima'],
      fechamento: 'Se você continuar entrando no amor pelo pico, vai continuar saindo dele pela dor. O Manual te ensina a entrar pelo critério.',
      ctaLabel: '💞 “SIM! QUERO SAIR DESSE PADRÃO AGORA',
    };
  }

  // MELHORAR RELACIONAMENTO ATUAL
  if (isSameObjective(oRaw, ['melhorar meu relacionamento atual', 'melhorar relacionamento atual'])) {
    return {
      headline: 'Seu relacionamento não melhora só com sentimento. Melhora com ajuste prático.',
      subheadline: 'O problema nem sempre é amor. Muitas vezes é padrão, ruído e repetição.',
      dor: 'Quando o vínculo entra em desgaste, a tendência é repetir reação, mal-entendido, cobrança ou silêncio. E sem ajuste, o que poderia ser resolvido vira peso acumulado.',
      virada: 'O Manual te mostra como enxergar o ponto que realmente está corroendo a relação, e como agir sem drama, sem implorar e sem continuar girando em círculo.',
      promessa: 'Você entende onde o vínculo desgasta e como reposicionar sua energia para criar mais verdade, clareza e consistência.',
      plano7: [
        'Dia 1: mapear o padrão do vínculo',
        'Dia 2: identificar o gatilho principal',
        'Dia 3: cortar excesso de reação',
        'Dia 4: criar comunicação mais clara',
        'Dia 5: reforçar limite e respeito',
        'Dia 6: reorganizar sua postura emocional',
        'Dia 7: consolidar um novo ritmo relacional',
      ],
      bonus: ['Mapa do Amor', 'Ritual de regulação', 'Calendário de Poder'],
      fechamento: 'Sem ajuste de padrão, o relacionamento só continua vivendo a mesma tensão em versões diferentes. O Manual te mostra onde virar essa chave.',
      ctaLabel: '❤️ Quero melhorar meu relacionamento',
    };
  }

  // CRESCER PROFISSIONALMENTE
  if (isSameObjective(oRaw, ['crescer profissionalmente', 'crescimento profissional'])) {
    return {
      headline: 'Seu crescimento profissional não trava por falta de potencial. Trava por falta de direção sustentada.',
      subheadline: 'Você não precisa de mais capacidade. Precisa de mais constância no que realmente expande sua vida.',
      dor: 'Você pensa, vê possibilidades, sente que pode mais, mas sem um trilho claro, a energia se espalha. E o que poderia virar avanço vira esforço sem consolidação.',
      virada: 'O Manual te mostra como transformar visão em posicionamento, foco e movimento real.',
      promessa: 'Você sai do “eu podia estar muito melhor” e entra em um plano prático para construir progresso visível.',
      plano7: [
        'Dia 1: clareza do próximo nível',
        'Dia 2: corte de dispersão profissional',
        'Dia 3: foco na frente certa',
        'Dia 4: ação de visibilidade',
        'Dia 5: ajuste de posicionamento',
        'Dia 6: consistência prática',
        'Dia 7: consolidação do novo ritmo',
      ],
      bonus: ['Mapa do Dinheiro', 'Ritual de foco', 'Calendário de Poder'],
      fechamento: 'Você não precisa esperar se sentir pronta. Precisa começar a agir de um jeito que faça seu próximo nível te reconhecer.',
      ctaLabel: '🚀 Quero crescer profissionalmente',
    };
  }

  // ORGANIZAR ROTINA
  if (isSameObjective(oRaw, ['organizar minha rotina', 'organizar rotina', 'rotina'])) {
    return {
      headline: 'Organizar sua rotina não é sobre fazer mais. É sobre parar de viver no improviso.',
      subheadline: 'O caos não vem só da falta de tempo. Vem da falta de um eixo que se sustente.',
      dor: 'Quando sua rotina não tem estrutura real, tudo vira urgência. Você até tenta se reorganizar, mas sem um sistema simples, volta rápido para o mesmo descontrole.',
      virada: 'O Manual te mostra como construir uma rotina mínima, prática e realista, sem rigidez e sem ilusão de produtividade.',
      promessa: 'Você troca correria solta por direção concreta, clareza mental e repetição que cabe na sua vida real.',
      plano7: [
        'Dia 1: identificar o que mais drena sua energia',
        'Dia 2: criar sua rotina mínima realista',
        'Dia 3: cortar 1 distração estrutural',
        'Dia 4: organizar seu foco sem sobrecarga',
        'Dia 5: transformar intenção em bloco prático',
        'Dia 6: ajustar o que te tira do eixo',
        'Dia 7: consolidar o novo ritmo',
      ],
      bonus: ['Checklist de Rotina', 'Ritual de foco', 'Calendário de Poder'],
      fechamento: 'Se você continuar tentando resolver a rotina só no impulso, vai continuar cansada e se sentindo atrasada. O Manual te dá eixo.',
      ctaLabel: '🗓️ QUERO VIRAR ESSA CHAVE',
    };
  }

  // fallback
  return {
    headline: `Você escolheu: ${oRaw}. Então vamos direto ao ponto.`,
    subheadline: 'Seu mapa já mostrou o padrão. Agora falta transformar isso em movimento real.',
    dor: 'Sem um plano simples, a tendência é você continuar entendendo o que sente — mas repetindo o que te trava.',
    virada: 'O Manual existe para transformar clareza em prática.',
    promessa: 'Você recebe um plano enxuto, direto e aplicável para começar a virar esse ciclo.',
    plano7: [
      'Dia 1: clareza do padrão',
      'Dia 2: reset emocional',
      'Dia 3: ação prática',
      'Dia 4: blindagem',
      'Dia 5: foco',
      'Dia 6: alinhamento',
      'Dia 7: manutenção',
    ],
    bonus: ['Mapa do Amor', 'Mapa do Dinheiro', 'Calendário de Poder'],
    fechamento: 'Você já entendeu o padrão. Agora falta aplicar.',
    ctaLabel: '🚀 Quero o plano completo',
  };
}
// -----------------------
// Copy: RELAÇÃO/TRABALHO (micro-personalização + tensão)
// -----------------------
function getRelacionamentoCopy(status, numeroVida, signo) {
  const s = titleCase(status);
  if (!hasChoice(s)) return null;

  const extra =
    numeroVida === 11
      ? 'Seu 11 intensifica conexão — então você precisa de limite energético pra não se sobrecarregar.'
      : numeroVida === 7
        ? 'Seu 7 não aceita superficialidade — isso é dom, mas precisa de filtro pra não virar isolamento.'
        : '';

  const signoTouch =
    signo === 'Libra'
      ? 'Libra tende a evitar conflito — o Manual te dá clareza sem culpa.'
      : signo === 'Escorpião'
        ? 'Escorpião sente tudo no extremo — o Manual te dá limite sem esfriar.'
        : '';

  const map = {
    Solteira: {
      title: '💞 Sobre seu momento afetivo',
      text:
        `Estar solteira agora pode ser um período de reorganização emocional. ${extra} ${signoTouch} ` +
        'No Manual, você vê seu padrão de atração (o que te puxa pro “quase”) e como virar isso em escolha consciente.',
    },
    Ficando: {
      title: '💞 Sobre seu momento afetivo',
      text:
        `Ficar “no meio” costuma disparar ansiedade e leitura de sinais. ${extra} ` +
        'No Manual você aprende a conduzir com clareza sem se perder — e a entender quando insistir e quando cortar.',
    },
    'Relacionamento Instável': {
      title: '💞 Sobre seu momento afetivo',
      text:
        `Seu mapa mostra onde o ciclo de vai-e-volta nasce. ${extra} ${signoTouch} ` +
        'No Manual, você aprende o limite que muda o jogo sem drama e sem implorar consistência.',
    },
    Namorando: {
      title: '💞 Sobre seu momento afetivo',
      text:
        `Seu mapa mostra como fortalecer respeito e admiração (e o que evitar pra não desgastar). ${extra} ` +
        'No Manual, você recebe um ajuste simples de comunicação + energia que melhora o dia a dia.',
    },
    Casada: {
      title: '💞 Sobre seu momento afetivo',
      text:
        `Seu mapa revela o ponto que gera atrito no cotidiano e como voltar para parceria sem sobrecarga. ${extra} ` +
        'No Manual, você recebe práticas curtas que reorganizam a energia do vínculo.',
    },
  };

  return (
    map[s] || {
      title: '💞 Sobre seu momento afetivo',
      text:
        `Seu mapa ajuda você a entender seu padrão afetivo e destravar a próxima fase com maturidade. ${extra} ${signoTouch}`,
    }
  );
}

function getTrabalhoCopy(status, numeroVida, signo) {
  const s = titleCase(status);
  if (!hasChoice(s)) return null;

  const extra =
    numeroVida === 8 || numeroVida === 22
      ? 'Seu número tem energia de materialização — mas exige foco e execução sem autocobrança tóxica.'
      : numeroVida === 3 || numeroVida === 5
        ? 'Seu número ama movimento — então sua prosperidade depende de estrutura simples, não de rigidez.'
        : '';

  const signoTouch =
    signo === 'Capricórnio'
      ? 'Capricórnio cresce com metas e ritmo — o Manual te dá um plano enxuto e aplicável.'
      : signo === 'Sagitário'
        ? 'Sagitário precisa de propósito — o Manual te dá direção sem te prender.'
        : '';

  const map = {
    CLT: {
      title: '💼 Sobre seu trabalho',
      text:
        `Seu mapa mostra como crescer com consistência e parar de se sabotar por pressa/perfeccionismo. ${extra} ${signoTouch} ` +
        'No Manual, você vê o padrão que te trava e o ajuste de 7 dias pra voltar pro controle.',
    },
    Empreendedora: {
      title: '💼 Sobre seu trabalho',
      text:
        `Seu mapa revela onde você dispersa ou se cobra demais — e como alinhar foco + execução pra escalar. ${extra} ${signoTouch} ` +
        'No Manual, você recebe um plano de execução curto que vira resultado.',
    },
    Autônoma: {
      title: '💼 Sobre seu trabalho',
      text:
        `Seu mapa mostra como organizar rotina, vendas e energia sem viver no modo “correria”. ${extra} ${signoTouch} ` +
        'No Manual, você aplica um plano simples de 7 dias pra voltar pra constância.',
    },
    'Transição De Carreira': {
      title: '💼 Sobre seu trabalho',
      text:
        `Seu mapa mostra o próximo passo lógico e como escolher caminho com clareza e confiança. ${extra} ${signoTouch} ` +
        'No Manual, você recebe um plano prático pra sair do “travada” e ir pra ação.',
    },
    Estudando: {
      title: '💼 Sobre seu trabalho',
      text:
        `Seu mapa mostra como manter constância sem se punir quando a motivação oscila. ${extra} ${signoTouch} ` +
        'No Manual, você aprende um sistema simples pra estudar e evoluir sem travar.',
    },
  };

  return (
    map[s] || {
      title: '💼 Sobre seu trabalho',
      text: `Seu mapa ajuda você a tomar decisões melhores e construir progresso real. ${extra} ${signoTouch}`,
    }
  );
}

// -----------------------
// Insight por número (o seu “soco no estômago”) — mantive sua ideia, mas aqui vou colocar um exemplo enxuto.
// Se você quiser, você cola seu bloco gigante original aqui sem problema.
// -----------------------
function insightPorNumero(numeroVida) {
  const map = {
    11:
      'Você é uma ANTENA ESPIRITUAL. Você capta sinais e padrões que a maioria ignora. O desafio: sua mente tenta acompanhar algo que é energético — e isso vira ansiedade e exaustão silenciosa. Quando você aterra essa visão, você transforma intuição em ação.',
    7:
      'Você é PROFUNDIDADE RARA. Você enxerga camadas que os outros não veem. O desafio: quando algo te frustra, você se fecha. Quando você transforma isso em seletividade consciente, você atrai pessoas e oportunidades do seu nível.',
    8:
      'Você nasceu pra GRANDEZA. Você materializa. O desafio: medo da própria magnitude e autocobrança. Quando você ocupa seu espaço com calma, o mundo se ajusta a você.',
  };
  return (
    map[numeroVida] ||
    'Você sente que há mais em você do que consegue expressar. A frustração não é falta de capacidade — é falta de direção clara. O próximo nível não exige força; exige estrutura simples.'
  );
}

// -----------------------
// Espelho emocional por OBJETIVO (conversão)
// -----------------------
function espelhoPorObjetivo(objetivo) {
  const o = titleCase(objetivo);
  const base = [
    'Você já percebeu que o problema não é falta de potencial.',
    'Você sente que o padrão se repete, mesmo quando tenta fazer diferente.',
    'Você não precisa de mais motivação. Precisa de estrutura simples.',
  ];

  const map = {
    'Ter Mais Disciplina': [
      'Você não é “sem disciplina”. Você só não tem um sistema pequeno que você sustenta.',
      'Você começa bem e cai quando a mente pesa — e isso gera culpa.',
      'O problema não é motivação: é estrutura mínima + gatilho certo.',
      'Quando você acerta isso, você vira constante sem sofrimento absurdo.',
      'O próximo nível é consistência inteligente.',
    ],
    'Reduzir Ansiedade': [
      'Você sente sua mente acelerando mesmo quando “tá tudo bem”.',
      'Você entende tudo, mas não consegue desligar o ruído.',
      'Seu corpo pede aterramento — e você sabe disso.',
      'Você quer paz sem perder sua intensidade.',
      'O próximo nível é calma com direção.',
    ],
    'Atrair Relacionamento Saudável': [
      'Você não quer mais “quase”. Você quer consistência.',
      'Você sente quando algo é raso — e isso te cansa.',
      'Você quer um amor que some, não que te drene.',
      'Você quer escolher melhor sem ficar ansiosa.',
      'O próximo nível é filtro + posicionamento.',
    ],
  };

  const key = Object.keys(map).find((k) => k.toLowerCase() === o.toLowerCase());
  return key ? map[key] : base;
}

// -----------------------
// Relatório (objeto final que a UI vai usar)
// -----------------------
function gerarRelatorioGratuito(params) {
  params = params || {};

  const {
    nome,
    dataISO,
    signo,
    numeroVida,
    local,
    objetivo_principal,
    relacao_status,
    trabalho_status,
  } = params;

const primeiroNome = (nome || '').trim().split(' ')[0] || 'Você';

  const objetivoFinal = titleCase(objetivo_principal);
  const relacionamentoFinal = titleCase(relacao_status);
  const trabalhoFinal = titleCase(trabalho_status);

  const assSigno = assinaturaSigno(signo);
  const assNumero = assinaturaNumero(numeroVida);

  const objetivoPack = getObjetivoCopy(objetivo_principal || '', numeroVida, signo);
  const relPack = getRelacionamentoCopy(relacao_status || '', numeroVida, signo);
  const trabPack = getTrabalhoCopy(trabalho_status || '', numeroVida, signo);

  const headline = hasChoice(objetivoFinal)
    ? `${primeiroNome}, sua virada começa agora`
    : `${primeiroNome}, aqui começa a leitura do seu padrão principal`;
  // bloco “isso não é aleatório” (aparece quando tem objetivo)
  const explicacaoObjetivoPersonalizada = (() => {
    if (!hasChoice(objetivoFinal)) return '';

    const CONEXAO_SIGNO = {
      'Áries':
        'Como Áries, você funciona melhor com ação rápida e direção clara. O ajuste não é se frear demais, é canalizar impulso com consistência.',
      'Touro':
        'Como Touro, você precisa de constância e segurança para sustentar mudança. O ajuste é sair da rigidez sem perder estabilidade.',
      'Gêmeos':
        'Como Gêmeos, você precisa de foco curto e repetível. O ajuste é parar de espalhar energia e escolher uma direção por vez.',
      'Câncer':
        'Como Câncer, seu emocional influencia muito seu ritmo. O ajuste é criar segurança interna para não decidir a partir da oscilação.',
      'Leão':
        'Como Leão, você precisa sentir presença e verdade no que faz. O ajuste é sustentar valor próprio sem depender de validação externa.',
      'Virgem':
        'Como Virgem, você se cobra e tenta melhorar tudo. O ajuste é constância sem perfeição e movimento antes de controle total.',
      'Libra':
        'Como Libra, você tende a oscilar quando tenta agradar demais ou manter tudo em equilíbrio. O ajuste é decisão com mais verdade.',
      'Escorpião':
        'Como Escorpião, você vive tudo com profundidade e intensidade. O ajuste é transformar intensidade em direção, não em excesso.',
      'Sagitário':
        'Como Sagitário, você precisa de liberdade e espaço para sentir que está viva. O ajuste é criar uma estrutura leve, não rígida.',
      'Capricórnio':
        'Como Capricórnio, você funciona bem com estrutura e meta. O ajuste é não transformar isso em peso, autocobrança ou dureza.',
      'Aquário':
        'Como Aquário, você precisa de autonomia e clareza para sustentar constância. O ajuste é dar forma prática ao que sua mente já enxerga.',
      'Peixes':
        'Como Peixes, você precisa de aterramento para não se perder no excesso de sensação, imaginação ou ruído emocional.',
    };

    const CONEXAO_NUMERO = {
      1: 'Seu Número 1 pede iniciativa e autonomia. A constância vem de direção clara, não de esperar o momento perfeito.',
      2: 'Seu Número 2 pede sensibilidade e vínculo. A constância vem de ritmo gentil, não de cobrança agressiva.',
      3: 'Seu Número 3 pede expressão e leveza. A constância vem de foco simples, não de excesso de estímulo.',
      4: 'Seu Número 4 quer estrutura, mas quando isso vira rigidez, trava. O ajuste é leveza com consistência.',
      5: 'Seu Número 5 pede movimento e liberdade. A constância vem de regra simples, não de prisão.',
      6: 'Seu Número 6 tende a cuidar demais e assumir peso que não precisa. A constância vem de se incluir no que você sustenta.',
      7: 'Seu Número 7 pede profundidade e clareza interna. A constância vem de confiança no processo, não de isolamento.',
      8: 'Seu Número 8 pede realização e força. A constância vem de foco estratégico, não de pressão contínua.',
      9: 'Seu Número 9 pede propósito e sentido. A constância vem de limite e direção, não de carregar tudo.',
      11: 'Seu Número 11 amplifica sensibilidade e aceleração mental. A constância vem de aterramento e rotina mínima.',
      22: 'Seu Número 22 pede construção grande e visão aplicada. A constância vem de dividir o grande em passos simples.',
      33: 'Seu Número 33 pede entrega, cuidado e presença. A constância vem de amor com limite, não de autoabandono.',
    };

    const signoNormalizado = titleCase(signo || '');
    const numeroNormalizado = Number(numeroVida);

    const conexaoSigno = CONEXAO_SIGNO[signoNormalizado] || '';
    const conexaoNumero = CONEXAO_NUMERO[numeroNormalizado] || '';

    return [
      `Você escolheu: ${objetivoFinal}. E isso não é aleatório.`,
      conexaoSigno,
      conexaoNumero,
      'Seu objetivo não é mudar quem você é. É ajustar como você usa sua energia.'
    ]
      .filter(Boolean)
      .join(' ');
  })();

  const espelhoMomento = espelhoPorObjetivo(objetivo_principal || '');

  const localFrase = local ? `📍 ${local}` : '';
  const dataFrase = dataISO ? `🎂 ${formatarDataBR(dataISO)}` : '';

  // CTA label dinâmico (conversão)
  const ctaLabel = objetivoPack?.ctaLabel || '🚀 Quero o Manual Completo (R$ 47,00)';

  return {
    headline,
    localFrase,
    dataFrase,
    objetivoFinal,
    relacionamentoFinal,
    trabalhoFinal,

    insightMatador: insightPorNumero(numeroVida),
    espelhoMomento,

    assinaturaSigno: assSigno,
    assinaturaNumero: assNumero,

    explicacaoObjetivoPersonalizada,

    objetivoPack,
    relPack,
    trabPack,

    ctaLabel,
  };
}
// -----------------------
// Page Component
// -----------------------
export default function ResultadoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  // urgência (10 min)
  const [tempoRestante, setTempoRestante] = useState(600);
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

  // estrelas
  const starsBuiltRef = useRef(false);
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

  // fetch supabase
useEffect(() => {
  let mounted = true;

  async function buscar() {
    setLoading(true);
    setErro('');

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('ENV NEXT_PUBLIC do Supabase não configurada (URL/ANON).');

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

    // ✅ Nomes iguais ao seu SQL:
  // ✅ Nomes iguais ao seu SQL:
  const objetivo_principal = analise?.objetivo_principal ?? null;
  const relacao_status = analise?.relacao_status ?? null;
  const trabalho_status = analise?.trabalho_status ?? null;

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
      objetivo_principal,
      relacao_status,
      trabalho_status,
    });
  }, [analise, signoFinal, numeroVidaFinal, objetivo_principal, relacao_status, trabalho_status]);

  const handleComprar = async () => {
  setProcessando(true);
  try {
    try {
      window?.gtag?.('event', 'clique_comprar', {
        event_category: 'conversion',
        value: 47,
        currency: 'BRL',
      });
    } catch {}

    const response = await fetch('/api/criar-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analiseId: id }),
    });

    const data = await response.json().catch(() => ({}));
    console.log('checkout response:', data);

    if (!response.ok) {
      throw new Error(data?.details || data?.error || 'Erro ao abrir checkout');
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error('Checkout sem URL');
  } catch (e) {
    console.error('Erro no checkout:', e);
    alert(e?.message || 'Erro. Tente novamente.');
  } finally {
    setProcessando(false);
  }
};

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

  const temObjetivo = hasChoice(relatorio.objetivoFinal);
  const temRelacionamento = hasChoice(relatorio.relacionamentoFinal);
  const temTrabalho = hasChoice(relatorio.trabalhoFinal);

  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <div id="stars" className="stars" />

      {/* TIMER */}
      {tempoRestante > 0 && (
        <div className="timer-bar">
          ⏰ Oferta especial expira em:{' '}
          <strong>
            {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
          </strong>
        </div>
      )}

      {mostrarUrgencia && tempoRestante > 0 && (
        <div className="floating">
          🔥 Já são <strong>8 pessoas</strong> nesta página agora
        </div>
      )}

      <div className="container">
        {/* HERO */}
        <div className="hero">
          <div className="badge">🔒 Resultado Privado • Gerado Agora</div>
          <h1 className="title">{relatorio.headline}</h1>
          <p className="subtitle">
            Se você chegou até aqui, é porque algo se repete.
          </p>

          <div className="pills">
            <span className="pill">♈ {signoFinal}</span>
            <span className="pill">🔢 Número {numeroVidaFinal}</span>
            {relatorio.dataFrase && <span className="pill">{relatorio.dataFrase}</span>}
            {temObjetivo && <span className="pill">🎯 {relatorio.objetivoFinal}</span>}
            {temRelacionamento && <span className="pill">💞 {relatorio.relacionamentoFinal}</span>}
            {temTrabalho && <span className="pill">💼 {relatorio.trabalhoFinal}</span>}
          </div>

          {relatorio.localFrase && <div className="muted" style={{ marginTop: 8 }}>{relatorio.localFrase}</div>}
        </div>

        {/* O QUE VOCÊ CONTOU */}
        {(temObjetivo || temRelacionamento || temTrabalho) && (
          <div className="card personal-card">
            <h2 className="h2">📌 O que você me contou no formulário</h2>

            {temObjetivo && (
              <div className="personal-row">
                <div className="personal-label">🎯 Objetivo principal:</div>
                <div className="personal-value">{relatorio.objetivoFinal}</div>
              </div>
            )}

            {temRelacionamento && (
              <div className="personal-row">
                <div className="personal-label">💞 Status de relacionamento:</div>
                <div className="personal-value">{relatorio.relacionamentoFinal}</div>
              </div>
            )}

            {temTrabalho && (
              <div className="personal-row">
                <div className="personal-label">💼 Status de trabalho:</div>
                <div className="personal-value">{relatorio.trabalhoFinal}</div>
              </div>
            )}

            {temObjetivo && (
              <div className="note" style={{ marginTop: 14 }}>
                <strong>Por que isso importa:</strong>
                <div style={{ marginTop: 6 }}>{relatorio.explicacaoObjetivoPersonalizada}</div>
              </div>
            )}

            <div className="note" style={{ marginTop: 14 }}>
              O Manual não é “conteúdo bonito”. Ele vira um <b>plano prático</b> para o seu cenário real.
            </div>
          </div>
        )}

        {/* INSIGHT MATADOR */}
        <div className="card insight-card">
          <div className="insight-icon">💡</div>
          <h2 className="h2" style={{ textAlign: 'center', marginBottom: 16 }}>
            Seu Número {numeroVidaFinal} revela algo sobre você
          </h2>
          <div className="insight-text">{relatorio.insightMatador}</div>
          <div className="insight-footer">
            Se isso bateu forte, não é acaso. É porque <b>o mapa funciona</b>.
          </div>
        </div>


{/* OBJETIVO - plano 7 dias (venda) */}
{relatorio.objetivoPack && (
  <div className="card objective-card">
    <h2 className="h2">🎯 Agora vamos ao ponto que realmente muda sua vida</h2>

    <div className="objective-head">
      {relatorio.objetivoPack.headline}
    </div>

    {relatorio.objetivoPack.subheadline && (
      <p className="p objective-subheadline">
        {relatorio.objetivoPack.subheadline}
      </p>
    )}

    {relatorio.objetivoPack.dor && (
      <div className="objective-block objective-block-danger">
        <strong>O que está te travando de verdade:</strong>
        <div style={{ marginTop: 8 }}>
          {relatorio.objetivoPack.dor}
        </div>
      </div>
    )}

    {relatorio.objetivoPack.virada && (
      <div className="objective-block objective-block-highlight">
        <strong>A virada que o Manual te mostra:</strong>
        <div style={{ marginTop: 8 }}>
          {relatorio.objetivoPack.virada}
        </div>
      </div>
    )}

    <div className="note-solution">
      <strong>O que muda quando você aplica isso:</strong>
      <div style={{ marginTop: 8 }}>
        {relatorio.objetivoPack.promessa}
      </div>
    </div>

    <div className="objective-plan">
      <div className="subttl">
        Seu plano de 7 dias (versão do Manual)
      </div>

      <ul className="list-check">
        {Array.isArray(relatorio.objetivoPack.plano7) &&
          relatorio.objetivoPack.plano7.map((x, idx) => (
            <li key={idx}>✓ {x}</li>
          ))}
      </ul>
    </div>

    {relatorio.objetivoPack.fechamento && (
      <div className="objective-final-hook">
        {relatorio.objetivoPack.fechamento}
      </div>
    )}
  </div>
)}
        {/* AMOR / TRABALHO (micro-personalização) */}
        {(relatorio.relPack || relatorio.trabPack) && (
          <div className="card">
            <h2 className="h2">🔍 Onde isso pega na sua vida real</h2>

            {relatorio.relPack && (
              <div className="note">
                <strong>{relatorio.relPack.title}</strong>
                <div style={{ marginTop: 6 }}>{relatorio.relPack.text}</div>
              </div>
            )}

            {relatorio.trabPack && (
              <div className="note" style={{ marginTop: 12 }}>
                <strong>{relatorio.trabPack.title}</strong>
                <div style={{ marginTop: 6 }}>{relatorio.trabPack.text}</div>
              </div>
            )}

            <div className="note-alert" style={{ marginTop: 12 }}>
              ⚠️ <strong>Sem um plano prático</strong>, a tendência é você voltar pro mesmo padrão — só com mais consciência.
              O Manual existe pra impedir isso.
            </div>
          </div>
        )}

        {/* CTA cedo */}
        <div className="cta-preview">
          <div className="cta-preview-text">
            Você quer ver a parte completa de <b>amor</b>, <b>dinheiro</b> e o <b>plano de 7 dias</b> pro seu caso?
          </div>
          <button className="btnMedium" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ Abrindo…' : relatorio.ctaLabel}
          </button>
          <div className="muted" style={{ fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            ✓ Acesso imediato • ✓ Garantia de 7 dias • ✓ Pagamento seguro
          </div>
        </div>

{/* ESPELHO emocional */}
<div className="card">
  <h2 className="h2">💭 Se isso aqui faz sentido, não é coincidência</h2>

  <ul className="list-check">
    {Array.isArray(relatorio.espelhoMomento) &&
      relatorio.espelhoMomento.map((t, i) => (
        <li key={i}>✓ {t}</li>
      ))}
  </ul>

  <div className="note-alert">
    ⚠️ <strong>Ponto crítico:</strong>
    <br />
    Você já tem clareza. O que faltava era um jeito de  <b>sustentar a mudança</b>  sem voltar para o caos.
  </div>
</div>

        {/* PADRÃO invisível (tensão + solução) */}
        <div className="card">
          <h2 className="h2">🔍 O padrão invisível que te segura</h2>

          <p className="p">
            O que te trava não é falta de capacidade.
É um padrão interno que se repete sempre que você sai do eixo.
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
            <strong>Ajuste necessário agora:</strong>
            <br />
            {relatorio.assinaturaSigno.ajuste}
            <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              (No Manual, você recebe o passo a passo de 7 dias pra isso virar prática.)
            </div>
          </div>
        </div>

        {/* CTA forte */}
        <div className="cta-inline">
          <div className="cta-inline-text">
            💡 Se isso já bateu, o Manual é o <b>próximo passo lógico</b>: você sai do insight e entra no plano.
          </div>
          <button className="btnBig pulse" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ Processando…' : '✨ SIM, QUERO MEU PLANO COMPLETO AGORA'}
          </button>
          <div className="price-row">
            <span className="price-old">de R$ 97,00</span>
            <div className="price-now">por apenas R$ 47,00</div>
          </div>
        </div>

        {/* NÚMERO (validação) */}
        <div className="card">
          <h2 className="h2">🔢 Seu Número {numeroVidaFinal}: luz e sombra</h2>

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
            <strong>Mantra do seu número:</strong>
            <br />
            "{relatorio.assinaturaNumero.mantra}"
          </div>
        </div>

        {/* OFERTA FINAL */}
        <div className="offer-final">
          <div className="offer-badge">
            🔥 OFERTA ESPECIAL - EXPIRA EM {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
          </div>

          <h2 className="offer-title">
            Manual Completo para Sair do Seu Padrão
            <br />
            <span style={{ fontSize: 20, fontWeight: 400 }}>Seu plano direto e prático para sair do ciclo</span>
          </h2>

          <div className="offer-box">
            <div className="offer-includes">
              <div className="offer-section">
                <strong>✅ O que você recebe:</strong>
              </div>
              <ul className="list-check compact">
                <li>✓ Um mapa claro do seu padrão real (não genérico — feito para você)</li>
                <li>✓ Diagnóstico do padrão invisível que se repete (o que te trava — e por quê)</li>
                <li>✓ Clareza emocional e direção prática (sem excesso de teoria)</li>
                <li>✓ Um plano de 7 dias pronto para executar (sem depender de motivação)</li>
                <li>✓ Ferramentas rápidas para aplicar no dia a dia (feitos para o seu perfil emocional)</li>
              </ul>

              <div className="offer-section">
                <strong>🎁 Bônus:</strong>
              </div>
              <ul className="list-check compact">
                <li>✓ Mapa do Amor (seu padrão afetivo real + onde você se sabota)</li>
                <li>✓ Mapa do Dinheiro (prosperidade, bloqueios e direção)</li>
                <li>✓ Calendário de Poder (30 dias) (o que fazer e quando fazer)</li>
              </ul>
            </div>

            <div className="offer-price-box">
              <div className="price-compare">
                <div className="price-old-big">De R$ 97,00</div>
                <div className="price-now-big">Por apenas R$ 47,00</div>
                <div className="price-savings">
                  Se você sair agora, a tendência é continuar entendendo o padrão, mas vivendo o mesmo ciclo. </div>
              </div>

              <div className="offer-features">
                <span>⚡ Acesso em 2 minutos</span>
                <span>🔒 Pagamento 100% seguro</span>
                <span>✓ 7 dias de garantia</span>
              </div>
            </div>
          </div>

          <div className="offer-urgency">
            ⚠️ <strong>Última chamada:</strong>  desconto disponível só agora.
          </div>

          <button className="btnHuge pulse" onClick={handleComprar} disabled={processando}>
            {processando ? '⏳ PROCESSANDO…' : '✨ QUERO MEU PLANO COMPLETO AGORA'}
          </button>

          <div className="muted" style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
            🔐 Seus dados estão seguros • Processamento por Stripe
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

/**
 * ✅ CSS:
 * Cole aqui o seu globalCss atual (o grandão que você já tem),
 * porque ele já tá lindo e otimizado.
 *
 * Pra não explodir a mensagem, deixei um “base” mínimo abaixo.
 * Substitua pelo seu globalCss completo.
 */
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

  .objective-card {
  border: 1px solid rgba(16, 185, 129, 0.35);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(139, 92, 246, 0.06));
}

.objective-head {
  font-family: 'Cinzel', serif;
  font-size: 24px;
  line-height: 1.35;
  margin-bottom: 12px;
  color: rgba(216, 180, 254, 0.98);
}

.objective-subheadline {
  font-size: 19px;
  color: var(--text);
  margin-bottom: 14px;
}

.objective-block {
  margin-top: 14px;
  padding: 16px;
  border-radius: 18px;
  font-size: 17px;
  line-height: 1.75;
}

.objective-block-danger {
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  color: #fecaca;
}

.objective-block-highlight {
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
  color: #fde68a;
}

.objective-plan {
  margin-top: 18px;
}

.objective-bonus {
  margin-top: 18px;
}

.objective-final-hook {
  margin-top: 18px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(236,72,153,.12), rgba(139,92,246,.12));
  border: 1px solid rgba(236,72,153,.35);
  color: var(--text);
  font-size: 18px;
  line-height: 1.7;
  text-align: center;
  font-weight: 600;
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
    font-size: 23px;
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

  /* ✅ NOVO CSS (sem remover nada) */
  .personal-card {
    border: 1px solid rgba(236, 72, 153, 0.35);
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.08));
  }

  .personal-row {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
  }

  .personal-row:last-child {
    border-bottom: none;
  }

  .personal-label {
    color: rgba(233, 213, 255, 0.85);
    font-weight: 700;
    font-family: 'Cinzel', serif;
    font-size: 14px;
  }

  .personal-value {
    color: var(--text);
    font-size: 18px;
  }

  .objective-card {
    border: 1px solid rgba(16, 185, 129, 0.35);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(139, 92, 246, 0.06));
  }

  .objective-head {
    font-family: 'Cinzel', serif;
    font-size: 20px;
    margin-bottom: 10px;
    color: rgba(216, 180, 254, 0.98);
  }

  .objective-hook {
    margin-top: 6px;
  }

  .objective-plan {
   margin-top: 16px;
}

.objective-bonus {
  margin-top: 16px;
}
  /* CTA FINAL */

.ctaFinal {
  margin-top: 40px;
  padding: 28px;
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(236,72,153,.12), rgba(139,92,246,.12));
  border: 2px solid rgba(236,72,153,.5);
  box-shadow: 0 30px 90px rgba(236,72,153,.25);
  text-align: center;
}

/* PREÇO */

.oldPrice {
  text-decoration: line-through;
  color: rgba(255,255,255,.6);
  font-size: 18px;
  margin-bottom: 6px;
}

.newPrice {
  font-family: 'Cinzel', serif;
  font-size: 34px;
  font-weight: 900;
  color: #10b981;
  margin-bottom: 12px;
}

.newPrice span {
  font-size: 42px;
}

/* TEXTO */

.warningText {
  font-size: 16px;
  color: #f59e0b;
  margin-bottom: 22px;
}
  warningText p {
  margin: 0;
}

.warningText p + p {
  margin-top: 8px;
}

/* BOTÃO PRINCIPAL */

.ctaMainBtn {
  width: 100%;
  padding: 18px 22px;
  border-radius: 999px;
  border: none;
  font-family: 'Cinzel', serif;
  font-size: 18px;
  font-weight: 900;
  color: white;
  cursor: pointer;

  background: linear-gradient(90deg, #10b981, #059669);
  box-shadow: 0 18px 60px rgba(16,185,129,.35);

  transition: all .2s ease;
}

.ctaMainBtn:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 70px rgba(16,185,129,.45);
}

/* INFOS */

.ctaInfos {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 13px;
  color: rgba(255,255,255,.7);
}

.ctaInfos span {
  background: rgba(255,255,255,.05);
  padding: 6px 12px;
  border-radius: 999px;
}

/* ÚLTIMA CHAMADA */

.lastCall {
  margin-top: 22px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.4);
  color: #fecaca;
  font-size: 14px;
}

/* BOTÃO SECUNDÁRIO */

.ctaSecondaryBtn {
  width: 100%;
  margin-top: 16px;
  padding: 18px 22px;
  border-radius: 999px;
  border: none;
  font-family: 'Cinzel', serif;
  font-size: 18px;
  font-weight: 900;
  color: white;
  cursor: pointer;
  background: linear-gradient(90deg, #10b981, #059669);
  box-shadow: 0 18px 60px rgba(16,185,129,.35);
  transition: all .2s ease;
}

.ctaSecondaryBtn:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 70px rgba(16,185,129,.45);
}
`;