
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
    Capricórnio: { luz: 'estrutura e realização', sombra: 'dureza consigo', ajuste: 'descanso também é produtividade' },
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
    1: { luz: 'liderança natural', sombra: 'fazer tudo por conta própria', mantra: 'Eu lidero com apoio' },
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
    1: 'Com o 1, disciplina não funciona bem com enrolação. Você rende mais quando existe meta curta, comando claro e início rápido. Seu erro costuma ser esperar o momento perfeito, quando na verdade o seu número responde melhor a movimento imediato.',
    2: 'Com o 2, disciplina precisa respeitar seu emocional. Quando o plano é duro demais, você sente mais resistência. O que funciona é constância gentil, ambiente favorável e ritmo que não te coloque em guerra com você.',
    3: 'Com o 3, o risco é dispersar energia em coisas demais. Disciplina aqui não é rigidez: é foco leve, meta simples e repetição sem tédio. Quando você simplifica, sustenta muito mais.',
    4: 'Com o 4, disciplina é um talento natural — mas existe um ponto de atenção: quando vira rigidez, você trava. Seu número pede estrutura, mas uma estrutura viva, que organize sem te aprisionar.',
    5: 'Com o 5, disciplina não funciona no formato pesado. Sua mente precisa de movimento, variedade e espaço. O segredo aqui é regra simples, foco por vez e liberdade com direção.',
    6: 'Com o 6, a sua maior dificuldade não é falta de disciplina: é colocar todo mundo antes de você. Seu número sustenta muito quando existe compromisso afetivo, mas precisa aprender a priorizar você sem culpa.',
    7: 'Com o 7, disciplina depende de sentido. Você precisa entender o porquê, sentir coerência e ver profundidade no que está fazendo. Quando existe clareza, sua constância cresce muito.',
    8: 'Com o 8, você executa — mas tende a misturar disciplina com autocobrança. Seu número rende mais quando existe estratégia, ritmo e calma. Você vai mais longe quando para de tentar funcionar na base da pressão.',
    9: 'Com o 9, disciplina quebra quando você se envolve com tudo ao mesmo tempo. Seu número precisa de limite, seleção e direção emocional. O essencial aqui é parar de carregar mais do que consegue sustentar.',
    11: 'Com o 11, disciplina precisa começar no aterramento. Sua mente acelera fácil, então constância não nasce de força bruta: nasce de rotina mínima, silêncio interno e pequenas repetições que te trazem de volta para o corpo.',
    22: 'Com o 22, você pensa grande — e às vezes isso te paralisa. Seu número responde melhor quando o grande é quebrado em micro-passos. Disciplina aqui é transformar visão em construção real.',
    33: 'Com o 33, disciplina enfraquece quando você se doa demais e se abandona no processo. O seu aprendizado é constância com amor, limite e preservação da própria energia.',
  };
  return map[numeroVida] || 'Disciplina, no seu caso, depende de um sistema pequeno, claro e repetível — algo que você consiga sustentar até nos dias mais comuns.';
}

function ganchoNumeroAnsiedade(numeroVida) {
  const map = {
    1: 'Com o 1, ansiedade costuma vir de pressa interna, excesso de urgência e necessidade de resolver tudo logo. Seu número melhora quando troca aceleração por ação simples e ritmo constante.',
    2: 'Com o 2, ansiedade geralmente nasce de absorver o outro, ler demais o ambiente e se afetar demais pelo que está ao redor. Seu protocolo precisa incluir limite emocional e aterramento.',
    3: 'Com o 3, ansiedade vem de excesso de estímulo, excesso de pensamento e energia espalhada. O caminho aqui é reduzir ruído, simplificar e trazer foco curto para a mente não se perder.',
    4: 'Com o 4, ansiedade aparece quando a necessidade de controle cresce demais. Seu número pede estrutura, mas não rigidez. O alívio vem de flexibilidade com rotina mínima.',
    5: 'Com o 5, ansiedade costuma nascer da instabilidade, da dificuldade de sustentar eixo e da sensação de inquietação constante. Seu número precisa de âncoras simples no dia.',
    6: 'Com o 6, ansiedade vem de responsabilidade demais, peso demais e excesso de preocupação com o outro. Seu sistema melhora quando existe priorização, descanso e autocuidado real.',
    7: 'Com o 7, ansiedade tende a acontecer em silêncio. Você rumina, analisa e tenta entender tudo internamente. O protocolo aqui precisa incluir descarrego mental e menos isolamento da própria mente.',
    8: 'Com o 8, ansiedade geralmente vem de pressão por resultado, cobrança alta e medo de não estar à altura do que sabe que pode construir. Seu número melhora quando une execução com pausa e presença.',
    9: 'Com o 9, ansiedade aparece quando você tenta carregar mais do que é seu, manter ciclos além do ponto e absorver o peso do mundo. Seu eixo volta com limite e aterramento.',
    11: 'Com o 11, a sensibilidade é amplificada. Você sente antes de entender, capta antes de explicar. Por isso, ansiedade aqui não melhora só com pensamento: melhora quando sai da mente e volta para o corpo.',
    22: 'Com o 22, ansiedade costuma vir do tamanho da missão, da visão grande e do medo silencioso de não sustentar tudo. O caminho é micro-passos, constância e menos pressão pelo “grande” imediato.',
    33: 'Com o 33, ansiedade vem de se doar além do limite, sentir demais e tentar sustentar emocionalmente mais do que deveria. Seu protocolo precisa incluir amor com limite.',
  };
  return map[numeroVida] || 'No seu caso, ansiedade não se resolve com mais pensamento. Ela melhora quando existe aterramento, simplificação e um jeito mais claro de conduzir sua energia.';
}

function ganchoNumeroRelacionamento(numeroVida) {
  const map = {
    1: 'Com o 1, você precisa de admiração, clareza e alguém que some sem disputar espaço. Relacionamento saudável, no seu caso, não combina com confusão nem com jogos de poder.',
    2: 'Com o 2, o amor saudável precisa trazer segurança emocional, presença e reciprocidade. Seu número não floresce com migalha, ambiguidade ou vínculo raso.',
    3: 'Com o 3, relacionamento saudável precisa de leveza, troca real e verdade. Seu número se desgasta em jogos, silêncio confuso e relações que perdem brilho rápido.',
    4: 'Com o 4, amor saudável é constância. Você precisa sentir firmeza, coerência e estabilidade emocional. Relações frias ou imprevisíveis drenam muito seu número.',
    5: 'Com o 5, relacionamento saudável não é prisão. Seu número precisa de liberdade com compromisso, espaço com verdade e conexão sem sufoco.',
    6: 'Com o 6, você ama cuidando — mas seu aprendizado é não transformar amor em excesso de responsabilidade. O relacionamento saudável aqui é parceria, não maternagem.',
    7: 'Com o 7, amor saudável precisa de profundidade, verdade e respeito pelo seu tempo interno. Seu número não se entrega bem ao superficial.',
    8: 'Com o 8, você atrai intensidade — e por isso precisa escolher bem. O relacionamento saudável aqui é poder compartilhado, respeito e maturidade emocional, não controle.',
    9: 'Com o 9, seu coração é grande, mas isso exige critério. Amor saudável, no seu caso, pede limite para você não cair na armadilha de tentar salvar quem não quer crescer.',
    11: 'Com o 11, você sente tudo muito forte. Relacionamento saudável aqui exige clareza, limite energético e consistência, para intensidade não virar ansiedade afetiva.',
    22: 'Com o 22, você quer construir algo real. O amor saudável aqui é projeto a dois, presença concreta e alinhamento de futuro — não promessa vazia.',
    33: 'Com o 33, você se doa muito. Por isso, relacionamento saudável, no seu caso, precisa de reciprocidade real, maturidade e amor com limite.',
  };
  return map[numeroVida] || 'No seu caso, amor saudável depende menos de sorte e mais de filtro, critério e posicionamento emocional.';
}

function ganchoNumeroAutoestima(numeroVida) {
  const map = {
    1: 'Com o 1, autoestima cresce quando você se vê em movimento, decidindo e liderando a própria vida. Seu número perde força quando você espera validação externa para agir.',
    2: 'Com o 2, autoestima está muito ligada à forma como você se percebe nos vínculos. Seu número precisa aprender a não confundir ser amado(a) com se abandonar para ser aceito(a).',
    3: 'Com o 3, autoestima floresce quando você se expressa com liberdade. Seu número se enfraquece quando se compara demais, se censura ou sente que precisa caber em moldes que não são seus.',
    4: 'Com o 4, autoestima vem de consistência e evidência interna. Seu número confia mais em si quando percebe que consegue sustentar o que promete — sem transformar isso em rigidez.',
    5: 'Com o 5, autoestima cresce quando você se sente livre, vivo(a) e em expansão. Seu número sofre quando liberdade vira instabilidade e você perde referência de si no meio do excesso.',
    6: 'Com o 6, autoestima costuma oscilar quando você cuida de todo mundo e esquece de se incluir. Seu número precisa sentir que também merece atenção, descanso e prioridade.',
    7: 'Com o 7, autoestima depende muito de coerência interna. Você se fortalece quando honra sua profundidade e enfraquece quando tenta se adaptar ao raso para ser aceito(a).',
    8: 'Com o 8, autoestima está profundamente ligada ao valor pessoal e à capacidade de se posicionar. Seu número enfraquece quando confunde desempenho com merecimento.',
    9: 'Com o 9, autoestima cresce quando você reconhece a própria sensibilidade como força, não como peso. Seu número precisa parar de achar que amor exige autoabandono.',
    11: 'Com o 11, autoestima oscila quando sua sensibilidade é mal interpretada até por você. Seu número precisa entender que sentir muito não te diminui — só pede aterramento e direção.',
    22: 'Com o 22, autoestima está ligada ao quanto você honra o seu potencial real. Seu número se sabota quando diminui a própria visão por medo de não sustentar o tamanho dela.',
    33: 'Com o 33, autoestima amadurece quando você para de medir valor pelo quanto entrega aos outros. Seu número precisa sentir que merece amor mesmo sem viver em sacrifício.',
  };
  return map[numeroVida] || 'No seu caso, autoestima não sobe com frase bonita. Ela cresce quando você muda a forma como se trata, se posiciona e sustenta o próprio valor.';
}

function ganchoNumeroRelacionamentoAtual(numeroVida) {
  const map = {
    1: 'Com o 1, o relacionamento melhora quando existe respeito, admiração e espaço para individualidade. Seu número entra em atrito quando sente disputa, desvalorização ou controle excessivo.',
    2: 'Com o 2, a relação melhora com delicadeza, escuta e segurança emocional. Seu número sofre quando o vínculo entra em frieza, silêncio confuso ou instabilidade afetiva.',
    3: 'Com o 3, o relacionamento melhora quando volta a existir leveza, conversa e presença real. Seu número se desgasta quando a relação fica pesada, previsível e sem troca emocional viva.',
    4: 'Com o 4, a relação melhora com consistência, previsibilidade e construção concreta. Seu número precisa sentir firmeza para parar de entrar em estado de defesa.',
    5: 'Com o 5, o vínculo melhora quando existe renovação, verdade e espaço para respirar. Seu número sofre quando a relação vira rotina sufocante ou cobrança sem conexão.',
    6: 'Com o 6, o relacionamento melhora quando o cuidado deixa de ser unilateral. Seu número precisa de parceria e reciprocidade, não de excesso de peso emocional nas próprias costas.',
    7: 'Com o 7, o relacionamento melhora com verdade e profundidade. Seu número fecha quando não se sente compreendido(a) ou quando a relação fica superficial demais.',
    8: 'Com o 8, a relação melhora quando existe respeito mútuo, maturidade e poder equilibrado. Seu número entra em desgaste quando tudo vira disputa ou tentativa de controle.',
    9: 'Com o 9, o vínculo melhora quando existe perdão com consciência e limite com amor. Seu número sofre quando continua sustentando ciclos desgastados por apego ao que já foi.',
    11: 'Com o 11, o relacionamento melhora quando a energia do vínculo fica mais clara e menos caótica. Seu número precisa de paz, consistência e menos sobrecarga emocional.',
    22: 'Com o 22, a relação melhora quando volta a existir projeto comum, alinhamento e construção real. Seu número desanima em vínculos sem direção ou sem presença concreta.',
    33: 'Com o 33, o vínculo melhora quando o amor deixa de ser sacrifício e volta a ser troca. Seu número precisa amar sem se anular.',
  };
  return map[numeroVida] || 'No seu caso, melhorar a relação depende de sair da repetição automática e voltar para uma dinâmica mais consciente, clara e recíproca.';
}

function ganchoNumeroCrescimentoProfissional(numeroVida) {
  const map = {
    1: 'Com o 1, crescimento profissional vem quando você assume liderança, iniciativa e visibilidade. Seu número trava quando espera permissão demais para ocupar espaço.',
    2: 'Com o 2, crescimento profissional acontece quando você usa sua sensibilidade como inteligência relacional, sem deixar isso virar insegurança ou excesso de adaptação.',
    3: 'Com o 3, crescer profissionalmente depende de transformar talento e comunicação em direção. Seu número precisa parar de espalhar energia em muitas frentes ao mesmo tempo.',
    4: 'Com o 4, crescimento profissional é construção. Seu número avança com método, consistência e execução — desde que isso não vire rigidez ou perfeccionismo travando ação.',
    5: 'Com o 5, crescimento profissional vem quando existe movimento com estratégia. Seu número precisa de expansão, mas não pode viver de impulso ou excesso de dispersão.',
    6: 'Com o 6, crescer profissionalmente depende de aprender a servir sem se sobrecarregar. Seu número tem força para gerar valor, mas precisa de limite para não viver em exaustão.',
    7: 'Com o 7, crescimento profissional vem de profundidade, estudo, verdade e diferenciação. Seu número não floresce em ambientes rasos ou sem sentido.',
    8: 'Com o 8, crescimento profissional está diretamente ligado a poder pessoal, posicionamento e capacidade de materializar. Seu número cresce muito quando para de se sabotar por pressão excessiva.',
    9: 'Com o 9, crescer profissionalmente depende de propósito. Seu número avança quando sente sentido no que constrói e trava quando entra em lugares que drenam alma e energia.',
    11: 'Com o 11, crescimento profissional vem quando sua visão elevada encontra aterramento. Seu número tem percepção rara, mas precisa transformar insight em execução concreta.',
    22: 'Com o 22, crescimento profissional pode ser enorme — mas depende de estrutura. Seu número nasceu para construir grande, desde que pare de adiar por medo do próprio tamanho.',
    33: 'Com o 33, crescer profissionalmente passa por impacto humano, valor e presença. Seu número floresce quando transforma sensibilidade em contribuição sem se sacrificar no processo.',
  };
  return map[numeroVida] || 'No seu caso, crescimento profissional depende menos de capacidade e mais de direção, posicionamento e constância na frente certa.';
}

function ganchoNumeroRotina(numeroVida) {
  const map = {
    1: 'Com o 1, rotina precisa ser objetiva e prática. Seu número funciona melhor quando o dia começa com direção clara, e não com excesso de opções.',
    2: 'Com o 2, rotina precisa respeitar seu emocional. Seu número sustenta melhor quando o ambiente está mais leve e o ritmo não te coloca em guerra com você.',
    3: 'Com o 3, rotina quebra quando tudo fica solto demais. Seu número precisa de estrutura leve, foco por blocos e menos estímulo competindo pela sua atenção.',
    4: 'Com o 4, rotina é uma força natural — desde que não vire prisão. Seu número responde muito bem a ordem, previsibilidade e repetição funcional.',
    5: 'Com o 5, rotina não pode parecer jaula. Seu número organiza melhor o dia quando existe flexibilidade com regra simples e espaço para respirar.',
    6: 'Com o 6, rotina bagunça quando você começa o dia vivendo em função dos outros. Seu número precisa se incluir no planejamento para não terminar em exaustão.',
    7: 'Com o 7, rotina funciona quando tem sentido, silêncio e menos ruído. Seu número precisa de espaço mental para render de verdade.',
    8: 'Com o 8, rotina melhora muito quando existe prioridade clara, ritmo e execução limpa. Seu número não precisa fazer mais — precisa fazer com mais alinhamento.',
    9: 'Com o 9, rotina desorganiza quando você tenta abraçar tudo. Seu número precisa de enxugamento, limite e critério sobre o que realmente importa.',
    11: 'Com o 11, rotina começa no aterramento. Seu número precisa reduzir excesso mental logo cedo, senão o dia vira sobrecarga e dispersão.',
    22: 'Com o 22, rotina precisa servir construção grande sem parecer esmagadora. Seu número rende mais quando o dia é quebrado em etapas simples e concretas.',
    33: 'Com o 33, rotina só funciona quando inclui cuidado com sua energia. Seu número não sustenta organização se tudo for doação, peso e excesso de responsabilidade.',
  };
  return map[numeroVida] || 'No seu caso, organizar a rotina depende de simplificar o dia, reduzir o excesso e criar uma estrutura que seja sustentável na vida real.';
}


// ----------------------------------------------------
// GANCHOS por SIGNO (universal)
// ----------------------------------------------------
function ganchoSignoDisciplina(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Áries precisa de movimento. Disciplina aqui funciona com meta curta, ação imediata e menos planejamento excessivo.',
    'Touro': 'Touro sustenta muito quando entra no ritmo. Disciplina aqui é constância estável — sem rigidez que trava.',
    'Gêmeos': 'Gêmeos dispersa fácil. Disciplina aqui precisa de blocos curtos, variedade e menos estímulo competindo.',
    'Câncer': 'Câncer funciona melhor quando o ambiente está seguro. Disciplina aqui é constância gentil e proteção emocional.',
    'Leão': 'Leão sustenta quando vê sentido e reconhecimento interno. Disciplina aqui é presença, não pressão.',
    'Virgem': 'Virgem tem disciplina natural — o risco é exagerar na cobrança. Aqui funciona “bom o suficiente” com constância.',
    'Libra': 'Libra trava na indecisão. Disciplina aqui depende de escolher rápido e não voltar atrás toda hora.',
    'Escorpião': 'Escorpião sustenta com intensidade. Disciplina aqui precisa de foco profundo e menos dispersão emocional.',
    'Sagitário': 'Sagitário precisa de liberdade. Disciplina aqui é direção com espaço — não rotina sufocante.',
    'Capricórnio': 'Capricórnio sustenta muito — mas se sobrecarrega. Disciplina aqui é ritmo sustentável, não exaustão.',
    'Aquário': 'Aquário precisa de lógica. Disciplina aqui funciona com sistema simples e autonomia.',
    'Peixes': 'Peixes perde eixo fácil. Disciplina aqui começa no aterramento e rotina mínima.',
  };
  return map[s] || 'Disciplina aqui depende de ritmo simples, repetição leve e menos pressão.';
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
    'Áries': 'Áries precisa de admiração e verdade. Amor saudável aqui não combina com joguinho.',
    'Touro': 'Touro precisa de constância. Amor saudável aqui é presença com atitude.',
    'Gêmeos': 'Gêmeos precisa de conversa real. Amor saudável aqui é clareza, não ambiguidade.',
    'Câncer': 'Câncer precisa de segurança emocional. Amor saudável aqui é reciprocidade.',
    'Leão': 'Leão precisa de presença e respeito. Amor saudável aqui não aceita migalha.',
    'Virgem': 'Virgem precisa de clareza. Amor saudável aqui não é consertar o outro.',
    'Libra': 'Libra precisa de escolha. Amor saudável aqui é verdade, não indecisão.',
    'Escorpião': 'Escorpião precisa de lealdade. Amor saudável aqui não mistura intensidade com caos.',
    'Sagitário': 'Sagitário precisa de liberdade com verdade. Amor saudável aqui não prende nem foge.',
    'Capricórnio': 'Capricórnio precisa de construção. Amor saudável aqui é consistência.',
    'Aquário': 'Aquário precisa de autenticidade. Amor saudável aqui é conexão sem distância emocional.',
    'Peixes': 'Peixes precisa de limite. Amor saudável aqui é filtro emocional.',
  };
  return map[s] || 'Amor saudável aqui depende de clareza emocional e posicionamento.';
}

function ganchoSignoAutoestima(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Áries fortalece autoestima quando age. Você se sente melhor em movimento do que esperando validação.',
    'Touro': 'Touro precisa de estabilidade interna. Autoestima aqui cresce com consistência e autocuidado real.',
    'Gêmeos': 'Gêmeos oscila quando se compara. Autoestima aqui cresce quando você honra sua própria voz.',
    'Câncer': 'Câncer sente muito — autoestima cresce quando você para de se medir pelo outro.',
    'Leão': 'Leão precisa de reconhecimento interno. Autoestima aqui amadurece quando para de depender da validação externa.',
    'Virgem': 'Virgem se cobra demais. Autoestima aqui cresce quando você aprende a reconhecer o que já faz bem.',
    'Libra': 'Libra perde força tentando agradar. Autoestima aqui nasce quando você se escolhe primeiro.',
    'Escorpião': 'Escorpião se protege demais. Autoestima aqui cresce quando você confia mais em si.',
    'Sagitário': 'Sagitário se fortalece quando se expande. Autoestima aqui nasce do movimento e da experiência.',
    'Capricórnio': 'Capricórnio confunde valor com resultado. Autoestima aqui cresce quando você se respeita além da performance.',
    'Aquário': 'Aquário precisa de autenticidade. Autoestima aqui cresce quando você honra o que te torna diferente.',
    'Peixes': 'Peixes sente demais. Autoestima aqui nasce quando você aprende a se proteger emocionalmente.',
  };
  return map[s] || 'Autoestima aqui cresce quando você para de se comparar e começa a se posicionar.';
}

function ganchoSignoRelacionamentoAtual(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Para Áries, a relação melhora com diálogo direto e menos disputa.',
    'Touro': 'Para Touro, melhora quando existe segurança e consistência.',
    'Gêmeos': 'Para Gêmeos, melhora com comunicação clara e menos suposição.',
    'Câncer': 'Para Câncer, melhora quando existe acolhimento real.',
    'Leão': 'Para Leão, melhora quando existe presença e valorização.',
    'Virgem': 'Para Virgem, melhora com clareza e menos crítica.',
    'Libra': 'Para Libra, melhora quando decisões são tomadas sem evitar conflito.',
    'Escorpião': 'Para Escorpião, melhora com verdade e menos controle.',
    'Sagitário': 'Para Sagitário, melhora com liberdade e honestidade.',
    'Capricórnio': 'Para Capricórnio, melhora com atitude concreta.',
    'Aquário': 'Para Aquário, melhora com conexão emocional mais presente.',
    'Peixes': 'Para Peixes, melhora com limite e clareza emocional.',
  };
  return map[s] || 'A relação melhora quando existe mais verdade e menos repetição automática.';
}

function ganchoSignoCrescimentoProfissional(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Áries cresce quando lidera. Seu avanço depende de assumir posição.',
    'Touro': 'Touro cresce com consistência. Seu avanço vem da constância.',
    'Gêmeos': 'Gêmeos cresce com comunicação e estratégia.',
    'Câncer': 'Câncer cresce quando sente segurança no que faz.',
    'Leão': 'Leão cresce com visibilidade e protagonismo.',
    'Virgem': 'Virgem cresce com método e precisão.',
    'Libra': 'Libra cresce quando decide e se posiciona.',
    'Escorpião': 'Escorpião cresce com foco profundo.',
    'Sagitário': 'Sagitário cresce com expansão e movimento.',
    'Capricórnio': 'Capricórnio cresce com construção sólida.',
    'Aquário': 'Aquário cresce com inovação e autonomia.',
    'Peixes': 'Peixes cresce quando conecta propósito com prática.',
  };
  return map[s] || 'Crescimento aqui depende de direção clara e execução consistente.';
}

function ganchoSignoRotina(signo) {
  const s = norm(signo);
  const map = {
    'Áries': 'Áries precisa começar rápido. Rotina aqui começa com ação.',
    'Touro': 'Touro precisa de ritmo estável. Rotina aqui é previsibilidade.',
    'Gêmeos': 'Gêmeos precisa de variedade. Rotina aqui é blocos curtos.',
    'Câncer': 'Câncer precisa de ambiente seguro. Rotina aqui é conforto.',
    'Leão': 'Leão precisa de sentido. Rotina aqui é propósito.',
    'Virgem': 'Virgem precisa de ordem. Rotina aqui é estrutura simples.',
    'Libra': 'Libra precisa decidir. Rotina aqui é menos indecisão.',
    'Escorpião': 'Escorpião precisa de foco. Rotina aqui é profundidade.',
    'Sagitário': 'Sagitário precisa de liberdade. Rotina aqui é flexível.',
    'Capricórnio': 'Capricórnio precisa de execução. Rotina aqui é consistência.',
    'Aquário': 'Aquário precisa de autonomia. Rotina aqui é sistema simples.',
    'Peixes': 'Peixes precisa de aterramento. Rotina aqui é previsível.',
  };
  return map[s] || 'Rotina aqui depende de simplificar e repetir o essencial.';
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
  if (isSameObjective(oRaw, ['ter mais disciplina', 'disciplina', 'ter mais disciplina'])) {
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

    1:
      'Existe uma parte sua cansada de esperar. Seu Número 1 não nasceu para assistir a própria vida de fora — nasceu para decidir, iniciar e mover. O que acontece é que, nos últimos tempos, você tem sentido um conflito interno: vontade de avançar e, ao mesmo tempo, um peso estranho que desacelera. Isso não é fraqueza. É tensão acumulada. Quando seu 1 sai do eixo, você alterna entre impulso e exaustão, força e silêncio. Mas quando ele volta para o lugar, algo muda rápido: você para de duvidar do próprio passo e volta a agir com clareza. O ponto é: o momento que você vive agora pede decisão — não perfeição.',

    2:
      'Você sente mais do que demonstra. Seu Número 2 está atravessando um momento de sensibilidade alta, e isso explica por que certas situações têm pesado mais do que deveriam. Você percebe detalhes, mudanças de energia e intenções que outras pessoas ignoram — e isso cansa. Quando o 2 se sobrecarrega, você tenta manter harmonia enquanto se desgasta por dentro. O que seu momento atual pede não é mais esforço emocional. Pede limite, silêncio e escolha. Quando você para de absorver tudo, sua clareza volta rápido.',

    3:
      'Sua mente está cheia, mas sua energia anda fragmentada. Seu Número 3 vive um momento em que ideias existem, vontade existe, mas algo parece dispersar sua força no meio do caminho. Isso não é falta de capacidade — é excesso de estímulo sem direção clara. Quando o 3 perde eixo, você começa várias coisas e conclui menos do que gostaria. E isso pesa. O momento que você vive agora pede uma coisa só: foco simples. Quando você reduz o ruído, sua potência aparece quase imediatamente.',

    4:
      'Você vem carregando mais do que deveria. Seu Número 4 mostra um momento de responsabilidade intensa, autocobrança alta e sensação silenciosa de peso constante. Você sustenta muita coisa — por dentro e por fora — e nem sempre percebe o quanto isso te cansa. Quando o 4 se desequilibra, tudo vira obrigação e nada parece leve. O que seu momento pede agora não é mais controle. É ajuste. Quando você solta um pouco a rigidez, sua força volta sem esforço.',

    5:
      'Existe inquietação no seu momento atual. Seu Número 5 mostra uma fase de transição interna: vontade de mudança, incômodo com o que está parado e sensação de que algo precisa se mover. O problema é que, quando o 5 não tem direção, a energia vira ansiedade ou impulsividade. Você sente que quer sair de algo — mesmo sem saber exatamente para onde. E isso é sinal claro de ciclo virando. O que seu momento pede não é fugir. É escolher com consciência.',

    6:
      'Você tem dado mais do que recebe — e já sente isso. Seu Número 6 revela um momento em que responsabilidade emocional, cuidado e cobrança interna estão altos demais. Você segura muito, organiza muito, pensa muito nos outros — e sobra pouco espaço para você. Quando o 6 sai do eixo, o cansaço vem acompanhado de culpa por querer descansar. O que seu momento pede é simples e difícil ao mesmo tempo: parar de se colocar por último(a). Quando você faz isso, sua energia muda rápido.',

    7:
      'Você está em um momento profundamente interno. Seu Número 7 mostra uma fase de análise, silêncio e percepção intensa. Você observa mais do que fala, sente mais do que explica e percebe coisas que não consegue traduzir facilmente. Isso pode trazer isolamento, dúvida ou sensação de distância do mundo. Mas também traz clareza rara. O que seu momento pede não é mais respostas externas — é confiar mais no que você já percebeu por dentro.',

    8:
      'Você sente que poderia estar mais longe do que está. Seu Número 8 mostra um momento de cobrança interna, comparação e sensação silenciosa de atraso. Você sabe do próprio potencial — e isso às vezes pesa mais do que ajuda. Quando o 8 entra em tensão, tudo vira pressão: resultado, tempo, desempenho. O que seu momento pede agora não é correr mais. É alinhar melhor. Quando você reduz a pressão, sua execução melhora quase imediatamente.',

    9:
      'Seu momento é de fechamento emocional. Seu Número 9 mostra uma fase de encerramento de ciclo, revisão interna e sensibilidade alta. Você tem sentido mais nostalgia, mais reflexão e menos tolerância para o que não faz sentido. Isso não é fraqueza — é consciência. O desafio é não prolongar ciclos por apego ou culpa. O que seu momento pede agora é desapego consciente. Quando você solta, a vida abre espaço rápido.',

    11:
      'Seu momento está intenso — e você sente isso. Seu Número 11 mostra sensibilidade amplificada, mente acelerada e percepção energética muito ativa. Você capta sinais, atmosferas e padrões antes mesmo de entender racionalmente. Isso pode gerar ansiedade, cansaço e sobrecarga silenciosa. O problema não é sentir demais. É não conseguir desligar. O que seu momento pede agora é aterramento. Quando você desacelera o corpo, sua mente organiza quase sozinha.',

    22:
      'Você está diante de um momento grande — mesmo que ainda não pareça claro. Seu Número 22 mostra uma fase de expansão possível, mas também de medo silencioso do próprio tamanho. Você sente que pode mais, mas hesita. Quando o 22 entra em tensão, você adia, racionaliza e espera demais. O que seu momento pede agora não é certeza total. É movimento gradual. Quando você começa, o caminho aparece.',

    33:
      'Seu momento pede maturidade emocional profunda. Seu Número 33 mostra sensibilidade alta, entrega intensa e uma fase em que você tem sentido tudo com mais força. Você acolhe, sustenta e sente além do necessário — e isso cansa. O desafio agora não é amar menos. É amar com limite. Quando você para de carregar o que não é seu, sua leveza volta.'
  };

  return (
    map[numeroVida] ||
    'Existe algo no seu momento atual que ainda não está totalmente claro — mas você sente. Não é falta de capacidade. É um padrão interno pedindo ajuste. Quando isso ganha forma, tudo começa a fluir de outro jeito.'
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

function getGanchoSignoPorObjetivo(objetivo, signo) {
const o = lowerClean(objetivo);

  if (o === 'organizar minha rotina') return ganchoSignoRotina(signo);
  if (o === 'crescer profissionalmente') return ganchoSignoCrescimentoProfissional(signo);
  if (o === 'melhorar autoestima') return ganchoSignoAutoestima(signo);
  if (o === 'reduzir ansiedade') return ganchoSignoAnsiedade(signo);
  if (o === 'ter mais disciplina') return ganchoSignoDisciplina(signo);
  if (o === 'atrair relacionamento saudável') return ganchoSignoRelacionamento(signo);
  if (o === 'melhorar meu relacionamento atual') return ganchoSignoRelacionamentoAtual(signo);

  return '';
}

function getGanchoPorObjetivoENumero(objetivo, numeroVida) {
  const o = (objetivo || '').toLowerCase().trim();

  if (o === 'ter mais disciplina') return ganchoNumeroDisciplina(numeroVida);
  if (o === 'reduzir ansiedade') return ganchoNumeroAnsiedade(numeroVida);
  if (o === 'melhorar autoestima') return ganchoNumeroAutoestima(numeroVida);
  if (o === 'atrair relacionamento saudável') return ganchoNumeroRelacionamento(numeroVida);
  if (o === 'melhorar meu relacionamento atual') return ganchoNumeroRelacionamentoAtual(numeroVida);
  if (o === 'crescer profissionalmente') return ganchoNumeroCrescimentoProfissional(numeroVida);
  if (o === 'organizar minha rotina') return ganchoNumeroRotina(numeroVida);

  return 'Seu número mostra um ponto importante sobre como você vive esse momento — e o Manual aprofunda exatamente como transformar isso em direção prática.';
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

  const intro = [
    'Nada aqui é por acaso.',
    'Quando suas respostas são colocadas lado a lado, um padrão começa a aparecer.',
    'E esse padrão explica mais do que parece sobre o momento que você está vivendo.'
  ].join(' ');

  const objetivoLinha = `Você escolheu: ${objetivoFinal}. E isso não é só uma preferência. Isso aponta para uma necessidade real do seu momento.`;

  const ganchoSigno = getGanchoSignoPorObjetivo(objetivo_principal, signo);

  const ganchoNumero = getGanchoPorObjetivoENumero(objetivo_principal, numeroVida);

  const fechamento =
    'Seu objetivo não é virar outra pessoa. É entender com mais clareza onde sua energia está escapando — e o que precisa ser ajustado para a sua vida começar a responder diferente.';

  return [
    intro,
    objetivoLinha,
    ganchoSigno,
    ganchoNumero,
    fechamento
  ]
    .filter(Boolean)
    .join(' ');
})();

  // espelho emocional (identificação)
const espelhoMomento = espelhoPorObjetivo(objetivo_principal || '');

// gancho profundo (curiosidade para o manual)
const ganchoProfundo = (() => {
  if (!hasChoice(objetivoFinal)) return '';

  const blocos = {
    'Atrair Relacionamento Saudável':
      'O restante do seu mapa mostra com mais clareza onde você começa a se perder emocionalmente, o tipo de vínculo que realmente combina com você e o ajuste que impede você de repetir intensidade vazia achando que é conexão real.',

    'Melhorar Meu Relacionamento Atual':
      'O restante do seu mapa mostra onde a relação desgasta de verdade, qual padrão está corroendo o vínculo em silêncio e o que precisa mudar para sair da repetição e voltar para uma dinâmica mais leve e verdadeira.',

    'Reduzir Ansiedade':
      'O restante do seu mapa mostra o que mais acelera sua mente, por que o seu sistema entra em sobrecarga com tanta facilidade e o que realmente ajuda você a sair do excesso de ruído sem perder sua profundidade.',

    'Melhorar Autoestima':
      'O restante do seu mapa mostra onde você se abandona sem perceber, o que faz sua confiança oscilar e qual ajuste interno muda sua postura sem depender de validação externa.',

    'Ter Mais Disciplina':
      'O restante do seu mapa mostra por que sua constância quebra, onde você se sabota no meio do caminho e como criar um ritmo que funcione de verdade para a sua energia.',

    'Crescer Profissionalmente':
      'O restante do seu mapa mostra onde seu potencial está sendo desperdiçado, o padrão que trava sua expansão e qual reposicionamento faz sua energia começar a produzir avanço real.',

    'Organizar Minha Rotina':
      'O restante do seu mapa mostra o que mais drena sua energia, por que sua rotina desorganiza tão rápido e o que precisa ser ajustado para você sustentar um eixo mais estável.'
  };

  return (
    blocos[objetivoFinal] ||
    'O restante do seu mapa aprofunda esse padrão e mostra com clareza o que está por trás dele, onde ele se repete e como começar a mudar isso de forma prática.'
  );
})();

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
  ganchoProfundo,

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
             Se você chegou até aqui, é porque uma parte sua já percebeu que esse padrão está se repetindo.
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
    <h2 className="h2">📌 O PADRÃO QUE COMEÇA A APARECER</h2>

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
      <div className="note" style={{ marginTop: 16 }}>
        <strong>O que isso começa a revelar:</strong>
        <div style={{ marginTop: 10, lineHeight: 1.85 }}>
          {relatorio.explicacaoObjetivoPersonalizada}
        </div>
      </div>
    )}

    {relatorio.ganchoProfundo && (
      <div className="note-alert" style={{ marginTop: 14 }}>
        <strong>O que o restante do seu mapa aprofunda:</strong>
        <div style={{ marginTop: 10, lineHeight: 1.85 }}>
          {relatorio.ganchoProfundo}
        </div>
      </div>
    )}

    <div className="note-solution" style={{ marginTop: 14 }}>
      <strong>E aqui está a virada:</strong>
      <div style={{ marginTop: 10, lineHeight: 1.85 }}>
        Quando você entende esse padrão com mais clareza, parar de repetir o mesmo
        deixa de ser esforço — e começa a ser consequência.
      </div>
    </div>
  </div>
)}

{/* INSIGHT MATADOR */}
<div className="card insight-card">
  <div className="insight-icon">💡</div>

  <h2 className="h2" style={{ textAlign: 'center', marginBottom: 16 }}>
    Seu Número {numeroVidaFinal} mostra uma verdade importante sobre o seu momento
  </h2>

  <div className="muted" style={{ marginBottom: 12, textAlign: 'center' }}>
    Quando cruzamos seu número com o que você está vivendo agora, o padrão fica ainda mais claro.
  </div>

  <div className="insight-text">{relatorio.insightMatador}</div>

  <div className="insight-footer">
    Se isso fez sentido, é porque esse padrão já estava em você — o mapa só colocou em palavras.
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
              <div className="micro">Quando você se alinha, isso flui</div>
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