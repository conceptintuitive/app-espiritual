// lib/manualgenerator.js
// Manual Premium Completo — Signo + Número + Objetivo + Amor + Dinheiro + Plano 7 dias + Calendário 30 dias
// Exporta: generateManual(params) e renderManualMarkdown(manual)
// Formato compatível com seu page.js (manual.sections com types específicos)

function norm(s) {
  return (s ?? '').toString().trim();
}
function lower(s) {
  return norm(s).toLowerCase();
}
function titleCase(s) {
  const t = norm(s);
  if (!t) return '';
  return t
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
function pickFirstName(full) {
  const t = norm(full);
  const f = t.split(' ').filter(Boolean)[0];
  return f || 'Você';
}
function safeArr(a) {
  return Array.isArray(a) ? a : [];
}
function clampStr(s, max = 6000) {
  const t = norm(s);
  return t.length > max ? t.slice(0, max) + '…' : t;
}
function hasValidChoice(value) {
  const t = lower(value);
  if (!t) return false;
  return t !== 'selecionar' && t !== 'select' && t !== 'escolher';
}
function parseISODate(dateStr) {
  const d = norm(dateStr);
  if (!d || !d.includes('-')) return null;
  const [y, m, day] = d.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !day) return null;
  return { y, m, d: day };
}
function fmtBirth(dateISO) {
  const p = parseISODate(dateISO);
  if (!p) return '';
  const dd = String(p.d).padStart(2, '0');
  const mm = String(p.m).padStart(2, '0');
  return `${dd}/${mm}/${p.y}`;
}

const ELEMENTO_SIGNO = {
  'Áries': 'Fogo',
  'Touro': 'Terra',
  'Gêmeos': 'Ar',
  'Câncer': 'Água',
  'Leão': 'Fogo',
  'Virgem': 'Terra',
  'Libra': 'Ar',
  'Escorpião': 'Água',
  'Sagitário': 'Fogo',
  'Capricórnio': 'Terra',
  'Aquário': 'Ar',
  'Peixes': 'Água'
};

const REGENTE_SIGNO = {
  'Áries': 'Marte',
  'Touro': 'Vênus',
  'Gêmeos': 'Mercúrio',
  'Câncer': 'Lua',
  'Leão': 'Sol',
  'Virgem': 'Mercúrio',
  'Libra': 'Vênus',
  'Escorpião': 'Plutão/Marte',
  'Sagitário': 'Júpiter',
  'Capricórnio': 'Saturno',
  'Aquário': 'Urano/Saturno',
  'Peixes': 'Netuno/Júpiter'
};

const ESTILO_ELEMENTO = {
  'Fogo': {
    assinatura: 'ação, coragem, presença e impulso de movimento',
    excesso: 'impulsividade, intensidade sem direção e dificuldade de sustentar depois do entusiasmo inicial',
    cura: 'foco, aterramento, repetição do essencial e decisão prática em vez de impulso',
    neuro: 'tende a responder bem a desafio, novidade e metas visíveis; precisa transformar excitação em constância'
  },
  'Terra': {
    assinatura: 'consistência, estrutura, realidade e capacidade de construir no concreto',
    excesso: 'rigidez, controle excessivo, medo de errar e lentidão para mudar o que já perdeu sentido',
    cura: 'flexibilidade, exposição gradual, movimento possível e menos perfeccionismo',
    neuro: 'precisa de segurança, previsibilidade e micro-vitórias repetidas para confiar no processo'
  },
  'Ar': {
    assinatura: 'mente rápida, leitura estratégica, comunicação e visão ampla',
    excesso: 'hiper-análise, ansiedade mental, excesso de possibilidades e dispersão',
    cura: 'silêncio, prioridade única, menos ruído e execução em blocos curtos',
    neuro: 'tende a ativar demais a mente; regula melhor quando reduz estímulo e fecha abas internas'
  },
  'Água': {
    assinatura: 'intuição, profundidade emocional, magnetismo e leitura sutil do ambiente',
    excesso: 'apego, oscilação, confusão emocional e absorção da energia alheia',
    cura: 'limites, regulação emocional, descarrego interno e autocuidado consistente',
    neuro: 'alta sensibilidade ao ambiente; precisa regular corpo e emoção para enxergar com clareza'
  }
};

// ================================
// MÓDULO EXTRA — MAPAS PROFUNDOS
// ================================
const SIGNO_PROFUNDO = {
  'Áries': {
    motor: 'coragem, impulso de começo e necessidade de sentir movimento',
    risco: 'agir antes de sustentar, entrar pela força e perder constância no meio',
    amor: 'precisa de verdade, admiração e presença sem joguinho',
    dinheiro: 'cresce quando assume direção, age rápido e não espera permissão',
    chave: 'trocar pressa por direção',
    frase: 'Não é sobre correr mais. É sobre mirar melhor.'
  },
  'Touro': {
    motor: 'estabilidade, constância, prazer e construção segura',
    risco: 'apego ao conhecido, resistência à mudança e permanência em zonas de conforto que já venceram',
    amor: 'precisa de segurança, consistência e presença concreta',
    dinheiro: 'prospera com rotina, método e construção paciente',
    chave: 'soltar o que prende para sustentar o que realmente importa',
    frase: 'Nem tudo que é estável continua sendo certo.'
  },
  'Gêmeos': {
    motor: 'curiosidade, movimento mental, troca e expansão de possibilidades',
    risco: 'dispersão, excesso de estímulo e dificuldade de aprofundar',
    amor: 'precisa de conversa real, leveza e inteligência emocional',
    dinheiro: 'cresce com comunicação, vendas, estratégia e circulação de ideias',
    chave: 'escolher o essencial e sustentar',
    frase: 'Clareza vale mais do que muitas possibilidades abertas.'
  },
  'Câncer': {
    motor: 'afeto, segurança emocional, vínculo e intuição',
    risco: 'absorver demais, reagir pelo emocional e perder eixo quando o ambiente pesa',
    amor: 'precisa de cuidado recíproco, acolhimento e segurança',
    dinheiro: 'melhora quando cria limite emocional e não trabalha a partir da sobrecarga interna',
    chave: 'sentir sem se afogar no que sente',
    frase: 'Sensibilidade sem filtro vira peso.'
  },
  'Leão': {
    motor: 'presença, expressão, brilho e necessidade de viver com verdade',
    risco: 'condicionar valor à validação externa ou sustentar imagem demais',
    amor: 'precisa de lealdade, presença e valorização real',
    dinheiro: 'cresce quando se posiciona e ocupa o próprio lugar',
    chave: 'reconhecer o próprio valor antes de pedir confirmação',
    frase: 'Seu lugar não precisa ser disputado. Precisa ser ocupado.'
  },
  'Virgem': {
    motor: 'melhoria, precisão, inteligência prática e refinamento',
    risco: 'perfeccionismo, autocrítica e excesso de controle antes da ação',
    amor: 'precisa de coerência, clareza e maturidade',
    dinheiro: 'cresce com processo, método, melhoria contínua e execução limpa',
    chave: 'agir antes de tentar corrigir tudo',
    frase: 'Progresso consistente vale mais que perfeição atrasada.'
  },
  'Libra': {
    motor: 'harmonia, beleza, troca e senso de equilíbrio',
    risco: 'indecisão, adaptação excessiva e perda de si para manter paz aparente',
    amor: 'precisa de reciprocidade, alinhamento e escolha clara',
    dinheiro: 'cresce em negociação, estética, relações e senso de valor',
    chave: 'parar de adiar a escolha que já ficou óbvia',
    frase: 'O que você não escolhe também escolhe por você.'
  },
  'Escorpião': {
    motor: 'verdade, profundidade, transformação e intensidade',
    risco: 'controle, rigidez emocional, apego ao que já deveria ter mudado',
    amor: 'precisa de profundidade, lealdade e verdade sem jogos ocultos',
    dinheiro: 'cresce quando foca, aprofunda e para de desperdiçar força tentando controlar tudo',
    chave: 'transformar intensidade em direção',
    frase: 'Controle não substitui confiança.'
  },
  'Sagitário': {
    motor: 'visão, expansão, liberdade e sentido',
    risco: 'pular etapas, se empolgar mais do que sustentar e fugir quando sente peso',
    amor: 'precisa de verdade, leveza e liberdade com maturidade',
    dinheiro: 'cresce quando visão encontra rotina',
    chave: 'fazer a visão descer para o chão',
    frase: 'Visão só vira realidade quando vira repetição.'
  },
  'Capricórnio': {
    motor: 'estrutura, ambição, consistência e legado',
    risco: 'peso, dureza consigo, excesso de responsabilidade e vida vivida sob cobrança',
    amor: 'precisa de respeito, maturidade e constância',
    dinheiro: 'cresce com método, construção sólida e disciplina sem rigidez',
    chave: 'sustentar sem se endurecer',
    frase: 'Você não precisa carregar tudo para provar força.'
  },
  'Aquário': {
    motor: 'inovação, autonomia, visão de futuro e originalidade',
    risco: 'distância emocional, excesso de mente e desconexão do corpo',
    amor: 'precisa de amizade, espaço, verdade e autenticidade',
    dinheiro: 'cresce com comunidade, inovação, estratégia e visão própria',
    chave: 'dar forma prática ao que já enxerga',
    frase: 'Ideia sem estrutura continua sendo só ideia.'
  },
  'Peixes': {
    motor: 'sensibilidade, imaginação, empatia e conexão sutil',
    risco: 'fuga, idealização, confusão emocional e dificuldade de sustentar o real',
    amor: 'precisa de magia com limite, sensibilidade com filtro e vínculo com verdade',
    dinheiro: 'cresce quando coloca prazo, forma e chão no que sente',
    chave: 'ancorar no visível sem perder profundidade',
    frase: 'Sentir muito não basta. É preciso dar forma.'
  }
};

const REGENTE_PROFUNDO = {
  'Marte': {
    drive: 'ação, impulso e coragem para iniciar',
    alerta: 'pressa, reatividade e intensidade sem direção',
    chave: 'agir com direção e não só com urgência'
  },
  'Vênus': {
    drive: 'valor, prazer, vínculo e senso de merecimento',
    alerta: 'apego, comodismo e permanência no que já perdeu vida',
    chave: 'escolher o que sustenta, e não só o que conforta'
  },
  'Mercúrio': {
    drive: 'mente, leitura, comunicação e estratégia',
    alerta: 'ansiedade, excesso de pensamento e dispersão',
    chave: 'clareza simples seguida de execução'
  },
  'Lua': {
    drive: 'segurança emocional, memória e sensibilidade',
    alerta: 'oscilação, apego e reação guiada pelo ambiente',
    chave: 'regulação interna antes de decisão'
  },
  'Sol': {
    drive: 'identidade, expressão, presença e autorreconhecimento',
    alerta: 'ego ferido, necessidade excessiva de validação e orgulho defensivo',
    chave: 'autoestima estável e verdade interna'
  },
  'Plutão/Marte': {
    drive: 'transformação, intensidade e poder de regeneração',
    alerta: 'controle, tensão interna e tudo-ou-nada',
    chave: 'verdade, entrega e foco'
  },
  'Júpiter': {
    drive: 'expansão, visão, crescimento e sentido',
    alerta: 'dispersão, exagero e dificuldade de sustentar depois do entusiasmo',
    chave: 'repetição do essencial'
  },
  'Saturno': {
    drive: 'estrutura, responsabilidade, construção e maturidade',
    alerta: 'peso, rigidez, medo de falhar e autocobrança',
    chave: 'feito > perfeito, com constância'
  },
  'Urano/Saturno': {
    drive: 'inovação com estrutura, autonomia e visão aplicada',
    alerta: 'rebeldia sem sistema, excesso de quebra sem sustentação',
    chave: 'ideia + rotina + consistência'
  },
  'Netuno/Júpiter': {
    drive: 'imaginação, intuição, inspiração e expansão sutil',
    alerta: 'fuga, idealização e excesso de abstração',
    chave: 'ancorar no real sem perder sensibilidade'
  }
};

const ELEMENTO_ESTILO_VIDA = {
  'Fogo': {
    emDiaBom: 'você puxa, movimenta, contagia e toma iniciativa',
    emDiaRuim: 'acelera demais, reage rápido e se espalha antes de sustentar',
    ajuste: 'ritmo > intensidade'
  },
  'Terra': {
    emDiaBom: 'você sustenta, organiza, concretiza e finaliza',
    emDiaRuim: 'trava para evitar erro, endurece e tenta controlar tudo',
    ajuste: 'feito > perfeito'
  },
  'Ar': {
    emDiaBom: 'você entende, conecta, comunica e estrategiza',
    emDiaRuim: 'pensa demais, abre frentes demais e dispersa força',
    ajuste: 'prioridade única + execução'
  },
  'Água': {
    emDiaBom: 'você aprofunda, percebe, acolhe e transforma',
    emDiaRuim: 'absorve demais, se mistura ao ambiente e perde clareza',
    ajuste: 'limites + descarga emocional'
  }
};

const NUMERO_PROFUNDO = {
  1: {
    essencia: 'autonomia, liderança e impulso de começo',
    forca: 'decisão, coragem e capacidade de iniciar',
    sombra: 'impaciência, isolamento e dificuldade de pedir apoio',
    cura: 'liderar com presença, ritmo e menos dureza'
  },
  2: {
    essencia: 'conexão, sensibilidade e percepção relacional',
    forca: 'harmonia, escuta e leitura sutil do outro',
    sombra: 'dependência emocional, medo de desagradar e excesso de adaptação',
    cura: 'limites, verdade simples e mais eixo próprio'
  },
  3: {
    essencia: 'expressão, criatividade e circulação de energia',
    forca: 'carisma, comunicação e leveza expansiva',
    sombra: 'dispersão, superficialidade e fuga do desconforto',
    cura: 'rotina criativa, constância e entrega real'
  },
  4: {
    essencia: 'estrutura, construção e estabilidade',
    forca: 'disciplina, método e consistência',
    sombra: 'rigidez, perfeccionismo e medo de errar',
    cura: 'flexibilidade, movimento possível e menos controle'
  },
  5: {
    essencia: 'liberdade, mudança e expansão',
    forca: 'adaptação, coragem e movimento',
    sombra: 'excesso, instabilidade e dificuldade de sustentar direção',
    cura: 'regras simples, foco em um canal por vez e repetição do básico'
  },
  6: {
    essencia: 'cuidado, responsabilidade e vínculo',
    forca: 'lealdade, presença e capacidade de sustentar',
    sombra: 'controle, auto-sacrifício e sobrecarga emocional',
    cura: 'cuidar sem se apagar'
  },
  7: {
    essencia: 'profundidade, sabedoria e busca por verdade',
    forca: 'análise, intuição refinada e percepção profunda',
    sombra: 'isolamento, excesso de mente e paralisia silenciosa',
    cura: 'confiar no corpo, simplificar e executar pequeno'
  },
  8: {
    essencia: 'poder, realização e materialização',
    forca: 'resultado, visão e força de construção',
    sombra: 'dureza, controle, cobrança e excesso de pressão',
    cura: 'estratégia, delegação e ação mais inteligente'
  },
  9: {
    essencia: 'propósito, impacto e visão ampla',
    forca: 'empatia, generosidade e consciência do coletivo',
    sombra: 'querer salvar tudo, dificuldade de encerrar e autoabandono',
    cura: 'limites, direção e missão com forma'
  },
  11: {
    essencia: 'visão elevada, sensibilidade e intuição ampliada',
    forca: 'inspiração, percepção fina e potência espiritual',
    sombra: 'ansiedade, sobrecarga e excesso de estímulo interno',
    cura: 'aterrar, canalizar e reduzir ruído'
  },
  22: {
    essencia: 'materialização grande, estrutura e legado',
    forca: 'capacidade de construir em escala',
    sombra: 'pressão, perfeccionismo e medo do próprio tamanho',
    cura: 'executar simples, contínuo e com chão'
  },
  33: {
    essencia: 'cura, amor elevado e presença transformadora',
    forca: 'acolhimento, impacto humano e profundidade afetiva',
    sombra: 'auto-sacrifício, peso emocional e excesso de entrega',
    cura: 'amar com limites e preservar a própria energia'
  }
};
const ARQUETIPOS = {
  MAGO: {
    nome: 'Mago(a)',
    luz: 'transformação consciente, foco, direção e capacidade de converter energia em movimento real',
    sombra: 'controle excessivo, mentalização sem ação e tentativa de resolver tudo só no pensamento',
    uso: 'ative quando precisar parar de só visualizar e começar a canalizar energia em ação simples, clara e repetida',
    pratica: 'escolha 1 prioridade, faça 1 ritual curto de alinhamento e conclua 1 entrega concreta no dia'
  },

  ORACULO: {
    nome: 'Oráculo',
    luz: 'intuição refinada, leitura de padrões, sensibilidade precisa e percepção do que está por trás do óbvio',
    sombra: 'confundir sensibilidade com ruído, transformar ansiedade em “sinal” e perder clareza no excesso de interpretação',
    uso: 'ative quando precisar ouvir a própria percepção com mais verdade, sem cair em paranoia ou sobrecarga mental',
    pratica: 'escreva em 3 linhas: fato, sensação e próximo passo; depois decida dentro de 24 horas'
  },

  GUERREIRO: {
    nome: 'Guerreiro(a)',
    luz: 'coragem, corte, firmeza, ação e capacidade de sair da inércia',
    sombra: 'reatividade, pressa, dureza excessiva e necessidade de provar valor pelo esforço',
    uso: 'ative quando precisar romper procrastinação, se posicionar com firmeza ou colocar limite sem adiar',
    pratica: 'faça 25 minutos de execução sem interrupção e sustente 1 limite claro sem se justificar demais'
  },

  AMANTE: {
    nome: 'Amante',
    luz: 'magnetismo, presença, prazer consciente, autoestima encarnada e conexão com o corpo',
    sombra: 'carência, validação externa, apego à intensidade e confusão entre desejo e vínculo real',
    uso: 'ative quando precisar fortalecer autoestima, presença e relação mais íntegra com o próprio valor',
    pratica: 'reserve 5 minutos para presença corporal, ajuste a postura e faça 1 escolha concreta que te honra'
  },

  SOBERANO: {
    nome: 'Soberano(a)',
    luz: 'auto-respeito, padrão elevado, estabilidade emocional, presença firme e elegância nas escolhas',
    sombra: 'rigidez, frieza, orgulho defensivo e hábito de testar tudo para não se vulnerabilizar',
    uso: 'ative quando precisar manter padrão, sustentar valor e parar de entrar em jogos emocionais',
    pratica: 'defina padrões claros, sustente consistência e coloque limites sem excesso de explicação'
  },

  SABIO: {
    nome: 'Sábio(a)',
    luz: 'verdade, síntese, maturidade, discernimento e visão estratégica',
    sombra: 'isolamento, análise excessiva, observar demais e executar pouco',
    uso: 'ative quando precisar organizar a mente e transformar insight em direção executável',
    pratica: 'escreva 1 prioridade, quebre em 3 ações e execute hoje a menor delas'
  },

  CONSTRUTOR: {
    nome: 'Construtor(a)',
    luz: 'método, rotina, consistência, base sólida e materialização',
    sombra: 'perfeccionismo, controle, rigidez e demora para começar',
    uso: 'ative quando precisar dar chão ao potencial e sustentar processo por tempo suficiente',
    pratica: 'aplique “feito antes de perfeito”, use checklist simples e registre microvitórias'
  },

  CURADOR: {
    nome: 'Curador(a)',
    luz: 'acolhimento, presença emocional, regeneração e escuta interna',
    sombra: 'absorver demais, tentar salvar tudo e se apagar no processo',
    uso: 'ative quando precisar regular o sistema interno e limpar excesso emocional',
    pratica: 'faça descarrego por escrita, sustente 1 limite emocional e mantenha 1 gesto diário de autocuidado'
  }
};

// ================================
// PUXADORES POR ELEMENTO
// ================================
const ARQ_POR_ELEMENTO = {
  Fogo: ['GUERREIRO', 'MAGO', 'SOBERANO'],
  Terra: ['CONSTRUTOR', 'SOBERANO', 'SABIO'],
  Ar: ['SABIO', 'ORACULO', 'MAGO'],
  Água: ['CURADOR', 'AMANTE', 'ORACULO']
};

// ================================
// PUXADORES POR NÚMERO
// ================================
const ARQ_POR_NUMERO = {
  1: ['GUERREIRO', 'SOBERANO'],
  2: ['CURADOR', 'AMANTE'],
  3: ['AMANTE', 'MAGO'],
  4: ['CONSTRUTOR', 'SOBERANO'],
  5: ['GUERREIRO', 'MAGO'],
  6: ['CURADOR', 'SOBERANO'],
  7: ['SABIO', 'ORACULO'],
  8: ['SOBERANO', 'CONSTRUTOR'],
  9: ['CURADOR', 'SABIO'],
  11: ['ORACULO', 'MAGO', 'SABIO'],
  22: ['CONSTRUTOR', 'SOBERANO', 'MAGO'],
  33: ['CURADOR', 'AMANTE', 'SABIO']
};

// ================================
// PUXADORES POR OBJETIVO
// ================================
const ARQ_POR_OBJETIVO = {
  'Reduzir Ansiedade': ['CURADOR', 'ORACULO', 'CONSTRUTOR'],
  'Ter Mais Disciplina': ['CONSTRUTOR', 'GUERREIRO', 'SOBERANO'],
  'Melhorar Autoestima': ['SOBERANO', 'AMANTE', 'GUERREIRO'],
  'Atrair Relacionamento Saudável': ['AMANTE', 'SOBERANO', 'CURADOR'],
  'Melhorar Meu Relacionamento Atual': ['CURADOR', 'SOBERANO', 'ORACULO'],
  'Crescer Profissionalmente': ['CONSTRUTOR', 'SABIO', 'SOBERANO'],
  'Organizar Minha Rotina': ['CONSTRUTOR', 'SABIO', 'GUERREIRO'],
  'Clareza e Virada': ['SABIO', 'ORACULO', 'CONSTRUTOR']
};

// helper: pega lista única na ordem
function uniqKeepOrder(arr) {
  const out = [];
  const seen = new Set();
  safeArr(arr).forEach((x) => {
    if (!x) return;
    if (seen.has(x)) return;
    seen.add(x);
    out.push(x);
  });
  return out;
}


const FALLBACK_OBJECTIVE_LABEL = 'Clareza e virada';
const FALLBACK_OBJECTIVE_PHRASE = 'Quando você escolhe um eixo, sua energia para de se espalhar.';
const FALLBACK_OBJECTIVE_FOCUS = 'direção, clareza e constância';

// helper: texto lindo de objetivo (sem undefined)
function objetivoLabelFromPack(objPack, objetivoPrincipal) {
  if (norm(objPack?.label)) return objPack.label;
  if (norm(objetivoPrincipal)) return titleCase(objetivoPrincipal);
  return FALLBACK_OBJECTIVE_LABEL;
}
function objetivoFraseFromPack(objPack) {
  return norm(objPack?.frase) || FALLBACK_OBJECTIVE_PHRASE;
}

function objetivoFocusFromPack(objPack) {
  return norm(objPack?.focus) || FALLBACK_OBJECTIVE_FOCUS;
}

function hasRealObjective(objPack) {
  return !!norm(objPack?.label);
}

// MÓDULO EXTRA (texto)
function buildModuloExtraArquetipos({ firstName, signo, elemento, numN, objetivoPrincipal, objPack }) {
  const nome = firstName || 'Você';
  const elem = elemento || 'Ar';
  const n = Number(numN) || 7;

  const objetivoLabel = objetivoLabelFromPack(objPack, objetivoPrincipal);

  const recElem = ARQ_POR_ELEMENTO[elem] || ARQ_POR_ELEMENTO['Ar'];
  const recNum = ARQ_POR_NUMERO[n] || ARQ_POR_NUMERO[7];
const recObj = ARQ_POR_OBJETIVO[objetivoLabel] || [];

  const recomendados = uniqKeepOrder([...(recObj || []), ...recNum, ...recElem]).slice(0, 3);

  const a1 = ARQUETIPOS[recomendados[0]] || ARQUETIPOS.SABIA;
  const a2 = ARQUETIPOS[recomendados[1]] || ARQUETIPOS.RAINHA;
  const a3 = ARQUETIPOS[recomendados[2]] || ARQUETIPOS.MAGA;

  // Personalização narrativa por signo+numero
  const fraseSigno = norm(SIGNO_PROFUNDO?.[signo]?.frase) || 'Constância vira destino.';
  const motorSigno = norm(SIGNO_PROFUNDO?.[signo]?.motor) || 'movimento e expansão';
  const riscoSigno = norm(SIGNO_PROFUNDO?.[signo]?.risco) || 'dispersão';
  const numeroEssencia = norm(NUMERO_PROFUNDO?.[n]?.essencia) || 'consciência';
  const numeroSombra = norm(NUMERO_PROFUNDO?.[n]?.sombra) || 'autoexigência';
  const numeroCura = norm(NUMERO_PROFUNDO?.[n]?.cura) || 'rotina simples e repetida';

  const body = clampStr(`
Arquétipos (o “modo de operar” da sua personalidade)

O que são arquétipos (sem misticismo confuso)
Arquétipos são padrões universais de comportamento,  como “modos internos” que você ativa dependendo do seu estado emocional e do que a vida está exigindo.

Na prática, pense assim:
- Signo + elemento mostram como sua energia se move (impulso, mente, emoção, estrutura).
- Número mostra o que te move por dentro (motivação, sombra, missão).
- Arquétipos são a forma mais rápida de transformar isso em ação, porque te dão um “personagem interno” com regras claras.

Você não “vira outra pessoa”.
Você aprende a ativar o modo certo na hora certa.

✨ Por que isso é tão poderoso (neurociência + espiritualidade)
Quando você escolhe um arquétipo, você está fazendo 3 coisas ao mesmo tempo:
1) **Dando foco ao cérebro** (menos ruído, mais direção).  
2) **Criando identidade** (“eu ajo como Rei/Rainha / Construtor(a)”), o que aumenta constância.  
3) **Canalizando energia**: espiritualidade prática = intenção + corpo + repetição.

Agora, o pulo do gato:
você não consegue ${objetivoLabel.toLowerCase()} com motivação solta.
Você melhora quando sustenta comportamento, identidade e repetição.

Por isso, o que muda tudo para você não é “se entender mais”.
É ativar três modos internos bem escolhidos para o seu objetivo atual: ${objetivoLabel}.

✨ Seus 3 arquétipos ideais para este ciclo (${objetivoLabel})

Eles não foram escolhidos aleatoriamente.
Eles foram escolhidos porque corrigem exatamente o padrão que mais te trava nesse objetivo.

1) ${a1.nome}
Quando ativar: ${a1.uso}.  
O melhor de você: ${a1.luz}.  
Sua sombra quando exagera: ${a1.sombra}.  
Como usar (3–7 min + ação): ${a1.pratica}.

2) ${a2.nome}
Quando ativar: ${a2.uso}.  
O melhor de você: ${a2.luz}.  
Sua sombra quando exagera: ${a2.sombra}.  
Como usar (3–7 min + ação): ${a2.pratica}.

3) ${a3.nome}
Quando ativar: ${a3.uso}.  
O melhor de você: ${a3.luz}.  
Sua sombra quando exagera: ${a3.sombra}.  
Como usar (3–7 min + ação): ${a3.pratica}.


✨ Como usar arquétipos do jeito certo (método simples)
Use este protocolo (é aqui que vira *vida real*):

PASSO A — Escolha o arquétipo do dia
Pergunta: *“O que minha vida está pedindo hoje?”
- Se precisa de limite → Rei/Rainha / Guerreiro(a)
- Se precisa de constância → Construtor(a)
- Se precisa de clareza → Sábio(a) / Oráculo
- Se precisa regular emoção → Curador(a) 
- Se precisa magnetismo e autoestima → Amante 
- Se precisa transformar e executar → Mago(a)

PASSO B — Ritual curtíssimo (3 minutos)
1 minuto respirando (4–4–6)  
+ 1 frase de identidade: “Hoje eu ativo o arquétipo ${a1.nome}.”  
+ 1 microação que prova isso (15 min).

PASSO C — Uma prova concreta
Arquétipo sem prova vira fantasia.
O que sela o arquétipo é: um comportamento pequeno repetido.


✨ Selo deste módulo
Para o seu perfil (${signo} + ${n}), o que muda tudo é:
menos motivação solta, mais identidade em ação.

Você não transforma ${objetivoLabel.toLowerCase()} se apoiando só no que sente no momento.
Você transforma quando escolhe quem está conduzindo você naquele dia.

Você não precisa “se empurrar”.
Você precisa se conduzir.

Escolha: *Qual desses 3 arquétipos você ativa hoje?*
`);

  return {
    type: 'text',
    title: ' Arquétipos ',
    body
  };
}


function buildModuloExtraTipoPessoa({ firstName, signo, elemento, regente, numN, objPack, lovePack, workPack }) {
  const s = SIGNO_PROFUNDO[signo] || SIGNO_PROFUNDO['Sagitário'];
  const r = REGENTE_PROFUNDO[regente] || { drive:'direção', alerta:'excesso', chave:'constância' };
  const nBase = NUMERO_PROFUNDO[numN] || NUMERO_PROFUNDO[7] || {};
const n = {
  essencia: nBase.essencia || nBase.essencia || 'potencial único',
  forca: nBase.forca || nBase.força || 'presença',
  sombra: nBase.sombra || 'padrão repetido',
  loop: nBase.loop || 'você entra no automático, acelera, e depois tenta compensar',
  cura: nBase.cura || 'rotina mínima + consistência'
};
  const e = ELEMENTO_ESTILO_VIDA[elemento] || ELEMENTO_ESTILO_VIDA['Ar'];

const objetivo = objPack?.label ? objPack.label : 'clareza e virada';
const fraseObj = objPack?.frase || 'Constância vira destino.';
const focoObj = objPack?.foco || 'direção';

const mecanismoPorObjetivo = (() => {
  const o = lower(objetivo);

  if (o.includes('autoestima')) {
    return 'Mas, para você, isso só cresce quando existe constância, regulação emocional e alinhamento com o que você diz que merece.';
  }
  if (o.includes('ansiedade')) {
    return 'Mas, para você, isso só acontece quando existe regulação do sistema nervoso, menos ruído e mais clareza.';
  }
  if (o.includes('disciplina')) {
    return 'Mas, para você, isso só acontece quando existe estrutura simples, menos negociação interna e repetição.';
  }
  if (o.includes('rotina')) {
    return 'Mas, para você, isso só acontece quando existe eixo, prioridade e menos improviso.';
  }
  if (o.includes('profissional')) {
    return 'Mas, para você, isso só acontece quando existe direção estável, constância e sustentação do mesmo trilho.';
  }
  if (o.includes('atrair relacionamento')) {
    return 'Mas, para você, isso só acontece quando existe critério, calma e constância emocional.';
  }
  if (o.includes('relacionamento atual')) {
    return 'Mas, para você, isso só acontece quando existe comunicação clara, presença e acordo.';
  }

  return 'Mas, para você, isso só acontece quando existe ritmo, clareza e constância.';
})();

  const amorLinha = lovePack?.meta
    ? `No amor, seu ponto de evolução agora é: ${lovePack.meta}.`
    : `No amor, seu ponto de evolução é constância e clareza.`;

  const trabalhoLinha = workPack?.meta
    ? `No trabalho/dinheiro, seu ponto de evolução agora é: ${workPack.meta}.`
    : `No trabalho/dinheiro, seu ponto de evolução é foco e repetição.`;

  const txt =
`${firstName}, se você ler só uma parte deste manual, leia esta.
Porque aqui está o padrão que mais explica sua vida hoje.

Sua assinatura (Signo + Número):
• ${signo}: ${s.motor}
• ${numN}: ${n.essencia}
Regência (${regente}): força = ${r.drive} | alerta = ${r.alerta} | chave = ${r.chave}

Seu padrão emocional e comportamental funciona assim:

Você tende a entrar em ciclos de intensidade.
No início, sua energia sobe — você sente clareza, força e direção.
Depois, a cobrança interna aumenta e o ritmo acelera além do necessário.
Quando percebe, já está sem energia, e em sobrecarga.

É aqui que muita gente se perde — mas no seu caso existe um detalhe:

Seu elemento (${elemento}) não foi feito para velocidade.
Foi feito para presença.

Quando você se alinha:
${e.emDiaBom}.

Quando você sai do eixo:
${e.emDiaRuim}.

Sua correção não é “fazer mais”.
É fazer com ritmo.

Ajuste central da sua energia:
${e.ajuste}.

Seu sabotador invisível:
1) ${signo}: ${s.risco}
2) ${numN}: ${n.sombra}
Mistura disso = cobrança + pressa + sobrecarga.

Sua virada:
• Cura do número: ${n.cura}
• Chave do regente: ${r.chave}
Tradução: menos intensidade, mais ritmo.

Objetivo do seu ciclo: ${objetivo}
Seu foco é ${focoObj}.
${mecanismoPorObjetivo}
Frase-mestra: “${fraseObj}”

Ajustes finos:
${amorLinha}
${trabalhoLinha}

Compromisso do seu tipo de pessoa:
1) Uma prioridade por vez
2) Uma entrega por semana
3) Um limite por semana
4) Um ritual de 3 minutos por dia
`;

  return clampStr(txt, 9000);
}

function buildTipoPessoa({ signo, elemento, regente, numN, numArch, objPack, relacaoStatus, trabalhoStatus, firstName }) {
  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const n = NUMERO_PROFUNDO[numN] || NUMERO_PROFUNDO[7];
  const arq = numeroArquetipo(numN);
  const objetivo = objetivoPerfil(objPack?.label || objPack?.objetivo || objPack?.title || '');
  const amor = loveFrame(relacaoStatus);
  const trabalho = workFrame(trabalhoStatus);

  const nome = firstName || 'Você';

  const abertura = `\
${nome}, este módulo existe para responder uma pergunta silenciosa:
“afinal, como eu funciono de verdade?”

Aqui o manual deixa de ser só leitura e vira espelho.

Porque o seu padrão não nasce de uma coisa só.
Ele nasce da combinação entre a forma como você sente, a forma como reage, o tipo de energia que te move e o tipo de sobrecarga que te tira do eixo.`;

  const blocoAssinatura = `\
A sua assinatura principal aqui é: ${signo} + ${numN}.

Isso significa que existe uma mistura muito específica entre:
• a maneira como você entra na vida
• a maneira como você processa pressão
• a maneira como você sustenta — ou perde — o próprio eixo

Seu elemento (${elemento}) mostra como a sua energia se comporta no mundo.
Ele fala do seu ritmo, do seu impulso, da sua forma de reagir, se proteger, se mover e buscar resultado.

Quando essa energia está alinhada, aparece:
${e.assinatura}.

Quando perde eixo, o excesso aparece em:
${e.excesso}.

E a sua correção não está em se forçar mais.
Está em:
${e.cura}.

Neuro lembrete do seu perfil:
${e.neuro}.`;

  const blocoNumero = `\
Agora vem a camada que deixa tudo ainda mais pessoal:
o seu número ${numN}.

Ele ativa um arquétipo interno de ${arq.nome}.
Isso explica por que você não vive as coisas de forma rasa.

A essência do seu número é:
${n.essencia}.

A sua força natural aparece como:
${n.forca || n.força}.

Mas a sua sombra tende a aparecer como:
${n.sombra}.

E a sua chave evolutiva, neste momento, está em:
${n.cura}.

Traduzindo de forma prática:
o seu dom não vira resultado só porque existe.
Ele precisa de direção, repetição e canal certo.`;

  const blocoPadrao = `\
Quando juntamos ${elemento} com o número ${numN}, aparece um padrão muito claro:

você não foi feito(a) para viver no morno.
Você tende a sentir mais, perceber mais, reagir mais e querer mais da vida.

Quando isso está alinhado, vira presença, magnetismo, visão e força.
Quando isso perde eixo, vira sobrecarga, aceleração interna, ruído e sensação de estar vivendo muito sem conseguir sustentar o essencial.

É por isso que, em muitos momentos, você pode até parecer forte por fora —
mas por dentro sentir que a energia se espalha antes de virar avanço.

Esse é o ponto central do seu tipo de pessoa:
você tem potência.
O desafio nunca foi falta de potência.
O desafio é sustentação.`;

  const blocoObjetivo = `\
E é exatamente por isso que o seu foco atual faz tanto sentido.

O seu objetivo hoje é: ${objetivo.label}.
Isso não aparece por acaso.
Isso revela onde a sua energia está pedindo ajuste com mais urgência.

No seu caso, a evolução passa por:
${objetivo.foco}.

O seu perfil não melhora quando tenta resolver tudo ao mesmo tempo.
Melhora quando escolhe a frente certa e sustenta o suficiente para aquilo criar forma.

Então o seu foco agora não é “virar outra pessoa”.
É ficar mais coerente com a sua própria energia.`;

  const blocoAmor = `\
No amor, o seu momento atual mostra isto:
${amor.contexto}

O risco emocional mais importante aqui é:
${amor.risco}.

A sua evolução afetiva agora não está em sentir mais.
Está em:
${amor.meta}.

Porque no seu caso, vínculo saudável não nasce só de intensidade.
Nasce de clareza, filtro e constância.`;

  const blocoTrabalho = `\
No trabalho e no dinheiro, o seu momento atual mostra isto:
${trabalho.contexto}

O risco aqui é:
${trabalho.risco}.

A sua evolução prática agora pede:
${trabalho.meta}.

Você tende a render muito mais quando para de gastar energia tentando resolver tudo na força
e começa a repetir o que realmente move resultado.`;

  const blocoFechamento = `\
Se fosse resumir o seu tipo de pessoa em uma frase, seria esta:

você tem energia para viver muito —
mas a sua virada acontece quando para de transformar intensidade em sobrecarga
e começa a transformar potência em direção.

Em outras palavras:
o seu problema não é ser “demais”.
O problema é ficar sem estrutura para sustentar o que existe de mais forte em você.

Seu ajuste central agora é simples:
menos excesso,
mais eixo.

Menos pico,
mais repetição.

Menos reação,
mais direção.

Frase-mestra deste módulo:
**o seu poder cresce quando a sua energia para de se espalhar e começa a se organizar.**`;

  return [
    'Tipo de Pessoa',
    '',
    abertura,
    '',
    blocoAssinatura,
    '',
    blocoNumero,
    '',
    blocoPadrao,
    '',
    blocoObjetivo,
    '',
    blocoAmor,
    '',
    blocoTrabalho,
    '',
    blocoFechamento
  ].join('\n');
}

function toLifePath(n) {
  // aceita número já pronto (ex: 11) ou string
  const t = norm(n);
  if (!t) return null;
  const num = parseInt(t, 10);
  if (!Number.isFinite(num)) return null;
  return num;
}

function numeroArquetipo(n) {
  // Versão “uau” (simples, direta e útil)
  // 11 e 22 como “mestres” comuns; o resto em arquétipos práticos.
  const map = {
    1: { nome: ' Pioneiro', virtude: 'liderança', sombra: 'impaciência', chave: 'decidir e sustentar' },
    2: { nome: ' Diplomata', virtude: 'conexão', sombra: 'dependência', chave: 'limites claros' },
    3: { nome: ' Comunicador', virtude: 'carisma', sombra: 'dispersão', chave: 'rotina criativa' },
    4: { nome: ' Construtor', virtude: 'disciplina', sombra: 'rigidez', chave: 'feito > perfeito' },
    5: { nome: ' Livre', virtude: 'adaptação', sombra: 'excesso', chave: 'foco + liberdade com regras' },
    6: { nome: ' Guardião', virtude: 'cuidado', sombra: 'controle', chave: 'cuidar sem se perder' },
    7: { nome: ' Investigador', virtude: 'sabedoria', sombra: 'isolamento', chave: 'confiar e agir' },
    8: { nome: ' Realizador', virtude: 'prosperidade', sombra: 'dureza', chave: 'poder com coração' },
    9: { nome: ' Curador', virtude: 'propósito', sombra: 'salvar todos', chave: 'propósito com limites' },
    11: { nome: ' Intuitivo Mestre', virtude: 'visão', sombra: 'ansiedade/pressão', chave: 'canalizar em rotina' },
    22: { nome: ' Arquiteto Mestre', virtude: 'materialização', sombra: 'peso/perfeccionismo', chave: 'planejar e executar' },
    33: { nome: ' Mestre do Amor', virtude: 'cura afetiva', sombra: 'auto-sacrifício', chave: 'amar com limites' }
  };
  return map[n] || { nome: 'Seu Arquétipo', virtude: 'potencial único', sombra: 'padrões repetidos', chave: 'consistência' };
}

function objetivoPerfil(obj) {
  const o = lower(obj);

  if (o.includes('ansiedad') || o.includes('emoc')) {
    return { label: 'Reduzir Ansiedade', foco: 'regulação, aterramento e clareza interna' };
  }

  if (o.includes('autoestima')) {
    return { label: 'Melhorar Autoestima', foco: 'auto-respeito, valor próprio e constância interna' };
  }

  if (o.includes('disciplina')) {
    return { label: 'Ter Mais Disciplina', foco: 'constância, estrutura simples e execução sustentável' };
  }

  if (o.includes('rotina')) {
    return { label: 'Organizar Minha Rotina', foco: 'eixo diário, prioridade e menos improviso' };
  }

  if (o.includes('profissional')) {
    return { label: 'Crescer Profissionalmente', foco: 'posicionamento, direção e sustentação do próprio potencial' };
  }

  if (o.includes('atrair relacionamento')) {
    return { label: 'Atrair Relacionamento Saudável', foco: 'critério, calma emocional e constância afetiva' };
  }

  if (o.includes('relacionamento atual')) {
    return { label: 'Melhorar Meu Relacionamento Atual', foco: 'clareza, comunicação e presença no vínculo' };
  }

  if (o.includes('amor') || o.includes('relacion')) {
    return { label: 'Relacionamento', foco: 'clareza emocional, filtro e constância afetiva' };
  }

  if (o.includes('dinheiro') || o.includes('prosper') || o.includes('carreira') || o.includes('trabalho')) {
    return { label: 'Prosperidade', foco: 'decisão, repetição do essencial e posicionamento' };
  }

  if (o.includes('propósito') || o.includes('missão')) {
    return { label: 'Propósito', foco: 'direção, foco e materialização no mundo real' };
  }

  return {
  
    label: titleCase(obj),
    foco: 'clareza, direção e repetição do essencial'
  };
}

function statusNormalizado(s) {
  const t = lower(s);
  if (!t) return 'não informado';
  return t;
}

function loveFrame(relacaoStatus) {
  const st = statusNormalizado(relacaoStatus);
  if (st.includes('solte') || st.includes('single')) {
    return {
      contexto: 'Você está num ciclo de seleção — não de aceitação.',
      risco: 'entrar em ansiedade e baixar padrão por carência',
      meta: 'escolher com calma e exigir constância'
    };
  }
  if (st.includes('namor') || st.includes('relacion') || st.includes('casad')) {
    return {
      contexto: 'Você está num ciclo de construção — não de prova.',
      risco: 'confundir amor com teste e perder leveza',
      meta: 'melhorar comunicação + combinar expectativas'
    };
  }
  if (st.includes('complic') || st.includes('enrol') || st.includes('indecis')) {
    return {
      contexto: 'Você está num ciclo de ambiguidade — isso drena energia.',
      risco: 'viver em migalhas emocionais e se auto-trair',
      meta: 'criar limites e pedir clareza'
    };
  }
  return {
    contexto: 'Seu amor é um espelho: ele responde ao seu nível de clareza.',
    risco: 'agir no automático emocional',
    meta: 'constância e comunicação'
  };
}

function workFrame(trabalhoStatus) {
  const st = statusNormalizado(trabalhoStatus);
  if (st.includes('desemp') || st.includes('transi') || st.includes('mudan')) {
    return {
      contexto: 'Você está numa fase de reestruturação: o plano vale mais que a pressa.',
      risco: 'tomar decisão por medo e perder direção',
      meta: 'organizar prioridade e fazer 1 ação por dia'
    };
  }
  if (st.includes('estagn') || st.includes('trav') || st.includes('cans')) {
    return {
      contexto: 'Você está numa fase de saturação: seu sistema pede limpeza e foco.',
      risco: 'confundir exaustão com falta de capacidade',
      meta: 'reduzir ruído e voltar ao essencial'
    };
  }
  if (st.includes('cres') || st.includes('bom') || st.includes('evol')) {
    return {
      contexto: 'Você está numa fase de expansão: agora é hora de posicionar e sustentar.',
      risco: 'crescer sem estrutura e perder energia',
      meta: 'rotina mínima + consistência'
    };
  }
  return {
    contexto: 'Seu trabalho responde ao seu nível de clareza e repetição.',
    risco: 'fazer muitas coisas e avançar pouco',
    meta: 'foco e constância'
  };
}

function buildBlindSpot({ elemento, numArch, objPack }) {
  const objetivo = lower(objPack?.label || '');
  const fraseObj = objPack?.frase ? `\n\nFrase de ouro do seu objetivo: “${objPack.frase}”` : '';

  // AUTOESTIMA
  if (objetivo.includes('autoestima')) {
    return clampStr(
`Seu ponto cego não é falta de capacidade.
É a forma silenciosa como você se cobra.

No seu caso, isso aparece assim:
• você tenta resolver rápido para aliviar a tensão interna
• confunde intensidade com avanço
• começa forte e se frustra quando o ritmo cai

O erro invisível é este:
você tenta se provar antes de se sustentar.

Isso cria um ciclo:
acelera → cobra demais → perde constância → duvida de si.

A chave que muda tudo é simples:
autoestima não cresce quando você acelera.
Cresce quando você sustenta.

Leitura final:
você não precisa correr para confiar em si.
Precisa sustentar o suficiente para se tornar confiável.${fraseObj}`,
      2200
    );
  }

  // ANSIEDADE
  if (objetivo.includes('ansiedade') || objetivo.includes('regulação')) {
    return clampStr(
`Seu ponto cego não é sentir demais.
É tentar controlar demais.

No seu caso, isso aparece assim:
• você quer prever antes de viver
• pensa para tentar reduzir insegurança
• confunde preparação com paz

O erro invisível é este:
você tenta gerar segurança pela mente, quando o seu corpo já está em alerta.

Isso cria um ciclo:
antecipa → acelera → checa → esgota.

A chave que muda tudo é simples:
ansiedade não diminui quando você pensa mais.
Diminui quando você regula e volta para o que é real.

Leitura final:
você não precisa dominar todos os cenários.
Precisa aprender a voltar para si mais rápido.${fraseObj}`,
      2200
    );
  }

  // DISCIPLINA
  if (objetivo.includes('disciplina')) {
    return clampStr(
`Seu ponto cego não é falta de disciplina.
É excesso de negociação interna.

No seu caso, isso aparece assim:
• você espera vontade para começar
• adia quando não consegue fazer direito
• recomeça várias vezes em vez de sustentar

O erro invisível é este:
você ainda trata constância como se dependesse de motivação.

Isso cria um ciclo:
empolga → adia → se culpa → recomeça.

A chave que muda tudo é simples:
disciplina não nasce de inspiração.
Nasce de repetição pequena e inegociável.

Leitura final:
você não precisa sentir mais vontade.
Precisa decidir menos e sustentar mais.${fraseObj}`,
      2200
    );
  }

  // ROTINA
  if (objetivo.includes('rotina')) {
    return clampStr(
`Seu ponto cego não é falta de organização.
É excesso de improviso.

No seu caso, isso aparece assim:
• você reage ao dia em vez de conduzi-lo
• decide demais ao longo do caminho
• tenta compensar no final o que faltou no começo

O erro invisível é este:
você ainda espera clareza nascer no caos.

Isso cria um ciclo:
improvisa → dispersa → cansa → tenta apertar mais.

A chave que muda tudo é simples:
rotina não melhora quando você força.
Melhora quando você cria eixo.

Leitura final:
você não precisa controlar tudo.
Precisa reduzir o caos que rouba sua energia.${fraseObj}`,
      2200
    );
  }

  // CRESCIMENTO PROFISSIONAL
  if (objetivo.includes('profissional')) {
    return clampStr(
`Seu ponto cego não é falta de talento.
É dispersar potência.

No seu caso, isso aparece assim:
• você vê muitas possibilidades e muda direção cedo
• aprende, ajusta e refina mais do que expõe
• confunde movimento com consolidação

O erro invisível é este:
você solta o trilho antes de ele ganhar tração.

Isso cria um ciclo:
começa → ajusta demais → perde ritmo → duvida da rota.

A chave que muda tudo é simples:
crescimento não vem de mais ideia.
Vem de mais sustentação.

Leitura final:
você não precisa de mais potencial.
Precisa ficar tempo suficiente na mesma direção.${fraseObj}`,
      2200
    );
  }

  // ATRAIR RELACIONAMENTO SAUDÁVEL
  if (objetivo.includes('relacionamento saudável') || objetivo.includes('atrair relacionamento')) {
    return clampStr(
`Seu ponto cego não é escolher errado.
É insistir depois de perceber.

No seu caso, isso aparece assim:
• você tenta entender demais antes de observar
• justifica sinais que já incomodam
• dá tempo demais esperando coerência

O erro invisível é este:
você troca critério por esperança.

Isso cria um ciclo:
empolga → duvida → espera → se desgasta.

A chave que muda tudo é simples:
amor saudável não precisa ser entendido demais.
Precisa ser sentido e observado.

Leitura final:
quando algo é certo, ele não te confunde.
Ele te acalma.${fraseObj}`,
      2200
    );
  }

  // MELHORAR RELACIONAMENTO ATUAL
  if (objetivo.includes('relacionamento atual')) {
    return clampStr(
`Seu ponto cego não é falta de amor.
É excesso de adaptação.

No seu caso, isso aparece assim:
• você evita conflito para manter paz
• fala menos do que sente
• aceita mais do que gostaria

O erro invisível é este:
você tenta preservar o vínculo abrindo mão de si.

Isso cria um ciclo:
cede → acumula → explode → se culpa.

A chave que muda tudo é simples:
relacionamento melhora quando você aparece mais, não quando se reduz.

Leitura final:
quem te ama de verdade prefere verdade ao silêncio.${fraseObj}`,
      2200
    );
  }

  // FALLBACK
  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const sombraNum = numArch?.sombra || 'padrões repetidos';

  return clampStr(
`Seu ponto cego não é falta de capacidade.
É o jeito silencioso como você sai do eixo sem perceber.

No seu caso, isso aparece assim:
• você perde direção quando o ritmo interno muda
• tenta compensar no excesso
• se cobra em vez de se reorganizar

O erro invisível é este:
você reage ao desconforto antes de entender o padrão.

Isso cria um ciclo:
tensão → excesso → queda → frustração.

A chave que muda tudo é simples:
você não precisa fazer mais.
Precisa reconhecer mais rápido quando saiu do centro.

Leitura final:
seu perfil pede ${e.cura}, não mais pressão.
Sua sombra mais comum é ${sombraNum}.${fraseObj}`,
    2200
  );
}

function buildBlocks({ elemento, numArch, objPack, love, work }) {
  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const objetivo = lower(objPack?.label || '');
  const objetivoLabel = objPack?.label || 'Clareza e virada';
  const objetivoFoco = objPack?.foco || 'clareza e constância';
  const numero = numArch?._n || 0;
  const numeroChave = numArch?.chave || 'consistência';

  let intro = '';
  let blocks = [];

  // AUTOESTIMA
  if (objetivo.includes('autoestima')) {
    intro = clampStr(
`No seu perfil, os bloqueios não aparecem como fraqueza.
Eles aparecem como excesso.

Você não trava por falta de capacidade.
Você trava quando sai do eixo.

No seu caso, existe uma combinação muito específica:
• o seu elemento (${elemento}) te empurra para ${e.assinatura}
• o excesso dessa energia vira ${e.excesso}
• o seu número (${numero}) pede ${numeroChave}
• o foco do seu ciclo é ${objetivoFoco}

É por isso que o seu bloqueio não parece “fraqueza”.
Ele parece pressa, cobrança, oscilação e excesso de tentativa.

E é exatamente aí que autoestima baixa:
não quando você erra,
mas quando você começa a se abandonar no pequeno.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Ruído mental',
        how: 'Você começa com força, mas perde ritmo quando não vê resultado rápido. Sua mente busca novidade para aliviar a tensão.',
        invisible: 'O cérebro troca profundidade por dopamina rápida. Parece movimento, mas não é consolidação.',
        effect: 'Você se movimenta muito, mas avança menos do que poderia.',
        unlock: 'Escolha UMA prioridade por 7 dias. Escreva em uma linha. Faça 15 minutos por dia — sem negociar.'
      },
      {
        title: 'Bloqueio 2 — Oscilação emocional',
        how: 'Seu estado interno muda e a sua percepção sobre você mesma muda junto. Você decide conforme se sente.',
        invisible: 'Sem regulação, a emoção lidera a decisão. E decisão emocional raramente sustenta constância.',
        effect: 'Você começa várias vezes, mas consolida pouco — e isso enfraquece sua confiança interna.',
        unlock: 'Antes de decidir, regule: respiração 60 segundos + “o que é fato?” + “qual é o próximo passo?”'
      },
      {
        title: 'Bloqueio 3 — Auto-sabotagem silenciosa',
        how: 'Você adia o simples e complica o que seria direto. Se mantem em movimento, mas não resolve o que realmente importa.',
        invisible: 'Isso é proteção do ego. Se você não tenta de verdade, você não falha de verdade.',
        effect: 'Você se cansa sem sair do lugar — e autoestima cai porque o cérebro percebe incoerência.',
        unlock: 'Troque intensidade por constância: 15 minutos por dia, mesmo sem vontade.'
      }
    ];
  }

  // ANSIEDADE / REGULAÇÃO
  else if (objetivo.includes('ansiedade') || objetivo.includes('regulação')) {
    intro = clampStr(
`No seu perfil, a ansiedade não aparece só como medo.
Ela aparece como excesso de antecipação.

Você não trava porque “sente demais”.
Você trava porque o seu sistema tenta prever, resolver e controlar antes da hora.

No seu caso:
• o elemento (${elemento}) já traz ${e.assinatura}
• no excesso, isso vira ${e.excesso}
• o número (${numero}) amplifica sensibilidade e leitura interna
• e o foco do seu ciclo está em ${objetivoFoco}

Por isso, seus bloqueios não parecem falta de capacidade.
Eles parecem hiperatividade interna.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Ambiguidade alimentada',
        how: 'Você fica presa em “talvez”, hipótese, leitura de sinais e falta de definição.',
        invisible: 'Ambiguidade mantém o cérebro em alerta porque ele não consegue fechar ameaça nem descanso.',
        effect: 'Seu corpo não desliga e a mente continua rodando sem parar.',
        unlock: 'Troque interpretação por clareza: “o que é fato?” e “o que depende de mim agora?”'
      },
      {
        title: 'Bloqueio 2 — Checagem e controle',
        how: 'Você busca certeza em mensagens, sinais, planejamento, listas ou previsão.',
        invisible: 'Checar dá alívio rápido, mas reforça o padrão ansioso.',
        effect: 'Você sente pequeno alívio e depois volta ainda mais acelerada.',
        unlock: 'Toda vez que quiser checar, faça antes uma ação concreta de 10–15 minutos.'
      },
      {
        title: 'Bloqueio 3 — Excesso de futuro',
        how: 'Você vive mentalmente à frente do presente e tenta se proteger antecipando tudo.',
        invisible: 'O corpo interpreta cenário futuro como ameaça real quando a imaginação ganha força.',
        effect: 'Você perde presença, energia e clareza.',
        unlock: 'Volte para o corpo: respiração + água + uma ação simples no presente.'
      }
    ];
  }

  // DISCIPLINA
  else if (objetivo.includes('disciplina')) {
    intro = clampStr(
`No seu perfil, o bloqueio da disciplina não aparece como preguiça.
Ele aparece como negociação interna.

Você até quer fazer.
Mas, quando perde o pico inicial, sua mente tenta adiar, refinar ou reiniciar em vez de sustentar.

No seu caso:
• o elemento (${elemento}) traz ${e.assinatura}
• no excesso, isso vira ${e.excesso}
• o número (${numero}) pede ${numeroChave}
• e o foco do ciclo está em ${objetivoFoco}

Por isso, o problema não é começar.
É sustentar quando deixa de ser empolgante.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Começo negociável',
        how: 'Você espera vontade, clima certo ou energia alta para começar.',
        invisible: 'O cérebro evita desconforto antecipado e chama isso de “vou fazer depois”.',
        effect: 'O dia passa e a identidade de disciplina não se forma.',
        unlock: 'Nova regra: começar em 2 minutos. Não pensar. Começar.'
      },
      {
        title: 'Bloqueio 2 — Perfeccionismo disfarçado',
        how: 'Você quer fazer bem ou não faz.',
        invisible: 'Perfeccionismo protege do risco de falhar e de se decepcionar consigo.',
        effect: 'Você trava antes da repetição, e sem repetição não existe disciplina.',
        unlock: 'Versão 1 em 48h. Feito primeiro, refinado depois.'
      },
      {
        title: 'Bloqueio 3 — Dispersão de metas',
        how: 'Você tenta mudar tudo ao mesmo tempo.',
        invisible: 'Muitas metas dão sensação de controle, mas tiram profundidade.',
        effect: 'Você se mantem em movimento, mas não vira consistente em nada.',
        unlock: 'Uma prioridade por 7 dias. O resto vira manutenção mínima.'
      }
    ];
  }

  // ROTINA
  else if (objetivo.includes('rotina')) {
    intro = clampStr(
`No seu perfil, a bagunça não aparece só como desorganização.
Ela aparece como perda de eixo.

Você não necessariamente tem tarefa demais.
Você tem decisão demais, improviso demais e ruído demais.

No seu caso:
• o elemento (${elemento}) traz ${e.assinatura}
• no excesso, isso vira ${e.excesso}
• o número (${numero}) pede ${numeroChave}
• e o foco do seu ciclo está em ${objetivoFoco}

Por isso, o seu travamento não é falta de capacidade.
É excesso de caos evitável.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Agenda sem centro',
        how: 'Você tem tarefas, mas não tem uma prioridade que organiza o dia.',
        invisible: 'Sem eixo, tudo parece igualmente urgente.',
        effect: 'O essencial nunca ganha força real.',
        unlock: 'Defina 1 prioridade do dia antes de abrir mensagens, celular ou demandas.'
      },
      {
        title: 'Bloqueio 2 — Entrada no ruído',
        how: 'Você entra no celular, no externo ou no problema dos outros cedo demais.',
        invisible: 'Isso sequestra sua atenção antes de você entrar em si.',
        effect: 'Seu dia começa reativo, não conduzido.',
        unlock: '10 minutos sem tela ao acordar + 1 ação sua antes de responder o mundo.'
      },
      {
        title: 'Bloqueio 3 — Compensação no fim',
        how: 'Você tenta apertar o dia no final quando percebe que se perdeu.',
        invisible: 'A culpa vira tentativa de compensação.',
        effect: 'Cansaço sobe, satisfação cai e a rotina continua instável.',
        unlock: 'Menos compensação, mais eixo cedo. A manhã precisa carregar menos ruído.'
      }
    ];
  }

  // CRESCIMENTO PROFISSIONAL
  else if (objetivo.includes('profissional')) {
    intro = clampStr(
`No seu perfil, o bloqueio profissional não aparece como falta de potencial.
Ele aparece como potência dispersa.

Você pensa, enxerga, aprende e visualiza.
Mas o crescimento trava quando essa energia muda de direção cedo demais.

No seu caso:
• o elemento (${elemento}) traz ${e.assinatura}
• no excesso, isso vira ${e.excesso}
• o número (${numero}) pede ${numeroChave}
• e o foco do seu ciclo está em ${objetivoFoco}

Por isso, seu desafio não é “ter mais ideia”.
É sustentar o mesmo movimento por tempo suficiente para gerar tração.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Aprender no lugar de entregar',
        how: 'Você pesquisa, ajusta, estuda e refina antes de expor.',
        invisible: 'Aprender dá sensação de segurança sem risco real.',
        effect: 'A entrega nunca ganha volume suficiente para consolidar posição.',
        unlock: 'Entregar antes de otimizar. Uma entrega visível por semana, no mínimo.'
      },
      {
        title: 'Bloqueio 2 — Mensagem instável',
        how: 'Você muda foco, posicionamento ou narrativa cedo demais.',
        invisible: 'Sem repetição, o mercado não registra presença nem autoridade.',
        effect: 'Você demonstra potencial, mas não consolidada.',
        unlock: 'Escolha uma mensagem principal e sustente por 7 dias sem reinventar.'
      },
      {
        title: 'Bloqueio 3 — Medo de exposição',
        how: 'Você espera ter segurança suficiente para aparecer.',
        invisible: 'O julgamento imaginado pesa mais do que a ação concreta.',
        effect: 'Seu crescimento perde visibilidade e ritmo.',
        unlock: 'Exposição pequena diária: mensagem, post, proposta, entrega ou contato.'
      }
    ];
  }

  // ATRAIR RELACIONAMENTO
  else if (objetivo.includes('relacionamento saudável') || objetivo.includes('atrair relacionamento')) {
    intro = clampStr(
`No seu perfil, os bloqueios no amor não aparecem como falta de amor.
Eles aparecem como falta de filtro emocional.

Você sente, percebe, imagina, projeta.
Mas o problema não está em sentir.
Está em se vincular antes da base.

No seu caso:
• o elemento (${elemento}) influencia a forma como você reage no vínculo
• o número (${numero}) amplia sensibilidade e padrão afetivo
• o foco do ciclo está em ${objetivoFoco}

Por isso, o bloqueio não parece erro.
Parece esperança demais antes da hora.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Química com peso demais',
        how: 'Você sente conexão e já dá valor emocional alto muito cedo.',
        invisible: 'O cérebro se apega ao pico e ignora a falta de base.',
        effect: 'Você se envolve antes de ter consistência.',
        unlock: 'Troque química por observação. Comportamento repetido vale mais que sensação intensa.'
      },
      {
        title: 'Bloqueio 2 — Ambiguidade tolerada',
        how: 'Você aceita sinais mistos e pouca clareza por tempo demais.',
        invisible: 'Ambiguidade mantém a esperança viva e suspende a decisão.',
        effect: 'Você fica presa sem perceber.',
        unlock: 'Pergunte mais cedo. Clareza cedo poupa sofrimento depois.'
      },
      {
        title: 'Bloqueio 3 — Carência disfarçada de chance',
        how: 'Você flexibiliza o que sabe que importa quando bate vontade de viver algo.',
        invisible: 'A carência cria urgência emocional e baixa critério.',
        effect: 'Você aceita menos do que merece.',
        unlock: 'Volte para o corpo: paz no corpo vale mais que pico de emoção.'
      }
    ];
  }

  // MELHORAR RELACIONAMENTO ATUAL
  else if (objetivo.includes('relacionamento atual')) {
    intro = clampStr(
`No seu perfil, o bloqueio do relacionamento atual não aparece como falta de amor.
Ele aparece como acúmulo.

Você sente, percebe, engole, adapta, tenta evitar desgaste.
Mas o que não é dito vai ficando pesado.

No seu caso:
• o elemento (${elemento}) influencia sua forma de reagir em vínculo
• o número (${numero}) mostra como você processa emoção e expectativa
• o foco do ciclo está em ${objetivoFoco}

Por isso, o bloqueio não parece ruptura.
Parece desgaste silencioso.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Expectativa não dita',
        how: 'Você quer algo, mas segura até virar frustração.',
        invisible: 'A mente evita vulnerabilidade e desconforto.',
        effect: 'O outro erra sem saber e o vínculo acumula peso.',
        unlock: 'Fale antes de saturar. Verdade pequena é melhor que acúmulo grande.'
      },
      {
        title: 'Bloqueio 2 — Reação antes da necessidade',
        how: 'Você muda o tom, fecha ou explode antes de traduzir o que sente.',
        invisible: 'Sistema nervoso ativado fala antes da clareza.',
        effect: 'A conversa vira ruído e a necessidade real se perde.',
        unlock: 'Pause, regule e depois fale o pedido — não só a dor.'
      },
      {
        title: 'Bloqueio 3 — Falta de acordo real',
        how: 'Muita coisa importante fica implícita.',
        invisible: 'Cada um ama, espera e interpreta de um jeito.',
        effect: 'A relação vira tentativa, não construção.',
        unlock: 'Transforme expectativa em combinado. Relacionamento saudável precisa de acordo.'
      }
    ];
  }

  // FALLBACK
  else {
    intro = clampStr(
`No seu perfil, os bloqueios não aparecem como incapacidade.
Eles aparecem como desalinhamento.

Você não trava porque não consegue.
Você trava quando excesso, ruído e oscilação tomam o lugar do eixo.

No seu caso:
• o elemento (${elemento}) traz ${e.assinatura}
• no excesso, isso vira ${e.excesso}
• o número (${numero}) pede ${numeroChave}
• e o foco do ciclo está em ${objetivoFoco}

Por isso, o seu desafio não é fazer mais.
É reconhecer mais rápido quando saiu do centro.`,
      2200
    );

    blocks = [
      {
        title: 'Bloqueio 1 — Ruído',
        how: 'Você se espalha em muitas frentes ao mesmo tempo.',
        invisible: 'O cérebro busca alívio rápido em vez de profundidade.',
        effect: 'Nada ganha força suficiente.',
        unlock: 'Escolha uma prioridade e sustente por alguns dias.'
      },
      {
        title: 'Bloqueio 2 — Oscilação',
        how: 'Seu estado muda e sua direção muda junto.',
        invisible: 'Sem eixo, a emoção lidera mais do que a intenção.',
        effect: 'A constância se perde.',
        unlock: 'Regule antes de decidir.'
      },
      {
        title: 'Bloqueio 3 — Adiamento do simples',
        how: 'Você complica o que poderia ser direto.',
        invisible: 'O ego evita desconforto real.',
        effect: 'A vida trava no básico.',
        unlock: 'Faça o simples primeiro.'
      }
    ];
  }

  const note = clampStr(
`${intro}

Leitura final desta seção:
Você precisa de menos ruído, mais eixo e repetição do essencial.

No amor, seu ponto de evolução agora é: ${love?.meta || 'constância e clareza'}.
No trabalho/dinheiro, seu ponto de evolução agora é: ${work?.meta || 'foco e constância'}.`,
    2600
  );

  const items = blocks.map((b) => {
    return `${b.title}
• Como aparece: ${b.how}
• O invisível: ${b.invisible}
• O efeito real: ${b.effect}
• Destravamento: ${b.unlock}`;
  });

  return { note, items };
}

function buildPlan7({ elemento, numN, objPack, love, work }) {
  const objetivo = lower(objPack?.label || '');
  const objetivoLabel = objPack?.label || 'Virada';
  const fraseObj = objPack?.frase || 'Constância vira destino.';
  const curaElemento = ESTILO_ELEMENTO[elemento]?.cura || 'foco e constância';

  let headline = `Plano de 7 dias — ${objetivoLabel} (prático e executável)`;
  let hook = '';
  let days = [];
  let rituals = [];
  let checkpoints = [];

  // AUTOESTIMA
  if (objetivo.includes('autoestima')) {
    hook = `Este plano não foi feito para ser perfeito. Foi feito para funcionar. No seu caso, autoestima não cresce com pensamento bonito. Cresce com evidência diária. A regra é simples: pouco, claro e repetido.`;

    days = [
      'Dia 1 — Reset interno: escolha UMA prioridade real, escreva em uma linha e corte uma distração visível. Objetivo do dia: clarear.',
      'Dia 2 — Quebra de resistência: faça por 15 minutos a tarefa que você vinha adiando. Objetivo do dia: provar para si que você faz mesmo sem vontade.',
      'Dia 3 — Constância real: faça 1 bloco de 25 minutos em silêncio total. Objetivo do dia: sentir que consistência gera confiança.',
      'Dia 4 — Limite e energia: diga 1 “não” elegante sem justificar demais. Objetivo do dia: lembrar que autoestima cresce quando você se respeita.',
      'Dia 5 — Ação visível: entregue algo concreto, mesmo simples. Poste, mande ou registre. Objetivo do dia: reforçar que feito vale mais que perfeito.',
      'Dia 6 — Alinhamento real: decida o que fica e o que sai — pessoas, hábitos ou rotina. Objetivo do dia: sentir que clareza reduz ansiedade.',
      'Dia 7 — Selo de virada: escreva o que mudou em você, o que ficou mais leve e o que você não negocia mais. Depois, escolha 1 hábito para manter por 30 dias.'
    ];

    rituals = [
      'Respiração 4–4–6 (1 min) para sair da pressa interna.',
      'Mão no coração + frase: “eu volto para mim”.',
      'Escrita rápida: fato / sensação / próximo passo.',
      'Postura aberta + presença corporal por 30 segundos.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você cumpriu 1 ação por dia, mesmo pequena.',
      'Você reduziu ruído e parou de se explicar em excesso.',
      'Você aplicou pelo menos 1 limite real.',
      'Você fez algo que aumentou sua confiança interna.',
      'Você sustentou constância em vez de depender de pico.'
    ];
  }

  // ANSIEDADE / REGULAÇÃO
  else if (objetivo.includes('ansiedade') || objetivo.includes('regulação')) {
    hook = `Este plano foi feito para desacelerar o alarme interno sem te deixar passiva. No seu caso, ansiedade diminui quando existe clareza, menos ruído e uma ação real por vez.`;

    days = [
      'Dia 1 — Corte de ruído: remova 1 gatilho claro de ansiedade (notificação, contato, assunto ou hábito). Objetivo do dia: diminuir carga.',
      'Dia 2 — Volta para o corpo: 10 minutos de ação concreta depois de 1 minuto de respiração. Objetivo do dia: lembrar que movimento real acalma mais que pensamento.',
      'Dia 3 — Clareza no papel: escreva 3 blocos — fato / medo / próximo passo. Objetivo do dia: separar realidade de projeção.',
      'Dia 4 — Fechamento de ambiguidade: tenha 1 conversa clara ou tome 1 decisão que elimine um “talvez”. Objetivo do dia: reduzir alerta.',
      'Dia 5 — Presente primeiro: faça algo corporal (caminhada, alongamento, banho consciente) antes de entrar no celular. Objetivo do dia: devolver segurança ao corpo.',
      'Dia 6 — Controle do controlável: escreva “o que depende de mim hoje?” e faça só isso. Objetivo do dia: sair do excesso de futuro.',
      'Dia 7 — Plano anti-espiral: anote 3 gatilhos pessoais e 3 respostas práticas para eles. Objetivo do dia: criar segurança real.'
    ];

    rituals = [
      'Respiração 4–4–6 por 60 segundos.',
      'Escrita curta: “o que é fato agora?”',
      'Água gelada no pulso + postura aberta.',
      '1 microação no presente antes de qualquer checagem.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você reduziu pelo menos 1 fonte de ruído.',
      'Você regulou antes de decidir.',
      'Você trocou checagem por ação pelo menos 1 vez.',
      'Você trouxe clareza para uma ambiguidade.',
      'Você sentiu mais presença e menos espiral.'
    ];
  }

  // DISCIPLINA
  else if (objetivo.includes('disciplina')) {
    hook = `Este plano foi feito para transformar motivação em identidade. No seu caso, disciplina não nasce de cobrança. Nasce de repetição pequena e inegociável.`;

    days = [
      'Dia 1 — Começo mínimo: escolha 1 prioridade e defina a menor ação possível para ela. Objetivo do dia: tirar o começo do campo da negociação.',
      'Dia 2 — Início sem clima: comece por 2 minutos antes de pensar demais. Objetivo do dia: provar que ação vem antes da vontade.',
      'Dia 3 — Bloco de foco: 25 minutos sem ruído. Objetivo do dia: consolidar presença.',
      'Dia 4 — Redução de atrito: prepare ambiente, lista, roupa ou material do dia seguinte. Objetivo do dia: facilitar o sim para você mesma.',
      'Dia 5 — Entrega simples: faça uma versão 1 de algo importante. Objetivo do dia: vencer o perfeccionismo.',
      'Dia 6 — Revisão de sabotagem: anote onde você negociou demais durante a semana. Objetivo do dia: enxergar o padrão, não se culpar.',
      'Dia 7 — Selo de disciplina: escolha 1 ação diária fixa para repetir por 30 dias. Objetivo do dia: sair do recomeço eterno.'
    ];

    rituals = [
      'Regra dos 2 minutos para começar.',
      'Respiração curta + frase: “eu não negocio o começo”.',
      'Checklist: 1 prioridade / 1 próxima ação / 1 distração que vou ignorar.',
      'Feito > perfeito como regra do dia.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você começou mesmo sem vontade.',
      'Você sustentou 1 bloco de foco real.',
      'Você reduziu o atrito do seu sistema.',
      'Você entregou algo simples em vez de adiar por perfeição.',
      'Você trocou intensidade por repetição.'
    ];
  }

  // ROTINA
  else if (objetivo.includes('rotina')) {
    hook = `Este plano foi feito para te devolver eixo. No seu caso, rotina não melhora com controle excessivo. Melhora com estrutura simples que funcione até em dia ruim.`;

    days = [
      'Dia 1 — Eixo do dia: escolha 1 prioridade real antes de abrir o mundo. Objetivo do dia: parar de começar reativa.',
      'Dia 2 — Manhã limpa: 10 minutos sem tela ao acordar + 1 ação sua primeiro. Objetivo do dia: entrar em você antes de entrar nos outros.',
      'Dia 3 — Bloco fixo: faça 25 minutos no mesmo horário para o essencial. Objetivo do dia: criar trilho.',
      'Dia 4 — Corte estrutural: elimine 1 distração recorrente da rotina. Objetivo do dia: reduzir caos evitável.',
      'Dia 5 — Finalização: termine algo pequeno que estava aberto. Objetivo do dia: gerar sensação de fechamento.',
      'Dia 6 — Revisão de eixo: observe o que mais te tirou do centro. Objetivo do dia: ajustar o sistema, não se culpar.',
      'Dia 7 — Desenho dos próximos 7 dias: 1 prioridade por dia. Objetivo do dia: sair do improviso.'
    ];

    rituals = [
      'Respiração curta + pergunta: “o que é essencial hoje?”',
      'Escrita 3 linhas: prioridade / duas pequenas / o que pode esperar.',
      'Preparação do ambiente no fim do dia.',
      'Âncora física: postura + água + silêncio antes do ruído.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você criou pelo menos 1 eixo claro no dia.',
      'Você reduziu entrada no ruído.',
      'Você fez 1 bloco fixo do essencial.',
      'Você percebeu o que te tira do centro.',
      'Você terminou a semana mais conduzindo do que reagindo.'
    ];
  }

  // CRESCIMENTO PROFISSIONAL
  else if (objetivo.includes('profissional')) {
    hook = `Este plano foi feito para transformar potência em tração. No seu caso, crescer profissionalmente não depende de pensar mais. Depende de sustentar melhor o mesmo trilho.`;

    days = [
      'Dia 1 — Escolha de trilho: defina 1 foco principal de crescimento. Objetivo do dia: parar de dispersar potência.',
      'Dia 2 — Mensagem principal: escreva 1 frase clara sobre o que você oferece ou quer consolidar. Objetivo do dia: ganhar nitidez.',
      'Dia 3 — Entrega visível: publique, envie ou registre algo concreto. Objetivo do dia: trocar preparação por presença.',
      'Dia 4 — Exposição estratégica: faça 1 contato importante ou movimento visível. Objetivo do dia: fortalecer posicionamento.',
      'Dia 5 — Repetição: repita a mesma mensagem, sem reinventar. Objetivo do dia: construir lembrança.',
      'Dia 6 — Ajuste fino: revise o que gerou resposta real. Objetivo do dia: refinar sem mudar de direção cedo demais.',
      'Dia 7 — Plano de tração: escolha 1 ação profissional para repetir por 30 dias. Objetivo do dia: sustentar.'
    ];

    rituals = [
      'Respiração + frase: “entrega visível vence intenção”.',
      'Checklist: 1 foco / 1 ação / 1 exposição.',
      'Bloco de 25 minutos para algo que move carreira.',
      'Versão 1 primeiro, otimização depois.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você escolheu 1 trilho principal.',
      'Você repetiu a mesma mensagem mais de uma vez.',
      'Você se expôs de forma concreta.',
      'Você entregou antes de otimizar.',
      'Você terminou a semana com mais tração e menos dispersão.'
    ];
  }

  // ATRAIR RELACIONAMENTO SAUDÁVEL
  else if (objetivo.includes('relacionamento saudável') || objetivo.includes('atrair relacionamento')) {
    hook = `Este plano foi feito para recalibrar seu critério afetivo. No seu caso, amor saudável não começa em intensidade. Começa em observação, constância e paz no corpo.`;

    days = [
      'Dia 1 — Não-negociáveis: escreva 3 coisas que você não flexibiliza mais no amor. Objetivo do dia: criar critério.',
      'Dia 2 — Corte de ruído afetivo: afaste-se de 1 dinâmica confusa. Objetivo do dia: abrir espaço para clareza.',
      'Dia 3 — Resposta lenta: não responda no impulso. Objetivo do dia: sair do pico e voltar ao eixo.',
      'Dia 4 — Observação fria: anote o que é comportamento e o que é expectativa. Objetivo do dia: separar fato de projeção.',
      'Dia 5 — Clareza direta: formule 1 pergunta que você faria mais cedo daqui para frente. Objetivo do dia: parar de interpretar sinais demais.',
      'Dia 6 — Paz como critério: reflita sobre quem ou o que te deixa em paz no corpo. Objetivo do dia: recalibrar atração.',
      'Dia 7 — Selo afetivo: escreva o que você nunca mais romantiza. Objetivo do dia: consolidar novo padrão.'
    ];

    rituals = [
      'Mão no peito + frase: “eu escolho com calma”.',
      'Respiração antes de responder qualquer coisa emocional.',
      'Escrita curta: fato / fantasia / verdade.',
      'Esperar 20 minutos antes de agir no pico.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você aplicou pelo menos 1 critério real.',
      'Você confundiu menos intensidade com compatibilidade.',
      'Você observou mais e projetou menos.',
      'Você tolerou menos ambiguidade.',
      'Você terminou a semana com mais paz e menos urgência.'
    ];
  }

  // MELHORAR RELACIONAMENTO ATUAL
  else if (objetivo.includes('relacionamento atual')) {
    hook = `Este plano foi feito para transformar desgaste em construção. No seu caso, relacionamento melhora quando expectativa vira conversa, e conversa vira acordo.`;

    days = [
      'Dia 1 — Necessidade real: escreva o que você realmente precisa e ainda não disse com clareza. Objetivo do dia: sair do implícito.',
      'Dia 2 — Tradução emocional: transforme incômodo em pedido concreto. Objetivo do dia: falar necessidade, não só reação.',
      'Dia 3 — Presença real: crie um momento curto de presença sem resolver nada. Objetivo do dia: aliviar ruído.',
      'Dia 4 — Conversa simples: fale antes de acumular. Objetivo do dia: diminuir peso invisível.',
      'Dia 5 — Acordo pequeno: definam 1 combinado prático. Objetivo do dia: trocar expectativa por construção.',
      'Dia 6 — Revisão de tom: observe onde você reagiu antes de traduzir. Objetivo do dia: ganhar maturidade emocional.',
      'Dia 7 — Selo de vínculo: escreva o que essa relação precisa para ficar mais leve e mais forte. Objetivo do dia: criar direção.'
    ];

    rituals = [
      'Respiração antes de conversar sobre algo sensível.',
      'Escrita: fato / sentimento / pedido.',
      'Pausa de 90 segundos antes de reagir.',
      'Frase âncora: “eu quero construir, não só descarregar”.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você falou algo antes de acumular demais.',
      'Você transformou emoção em pedido concreto.',
      'Você criou ou fortaleceu 1 acordo.',
      'Você trouxe mais presença para a relação.',
      'Você terminou a semana com menos ruído e mais clareza.'
    ];
  }

  // FALLBACK
  else {
    hook = `Este plano foi feito para te devolver direção. A regra é simples: uma prioridade, uma ação por dia e menos negociação com o seu padrão sabotador.`;

    days = [
      'Dia 1 — Escolha 1 prioridade real.',
      'Dia 2 — Comece por 15 minutos.',
      'Dia 3 — Faça 1 bloco de foco.',
      'Dia 4 — Aplique 1 limite.',
      'Dia 5 — Entregue algo simples.',
      'Dia 6 — Revise o que te tirou do eixo.',
      'Dia 7 — Escolha 1 hábito para manter por 30 dias.'
    ];

    rituals = [
      'Respiração curta + foco.',
      'Escrita: fato / próximo passo.',
      'Âncora física simples.',
      `Ritual do seu elemento (${elemento}): ${curaElemento}.`
    ];

    checkpoints = [
      'Você agiu um pouco todo dia.',
      'Você reduziu ruído.',
      'Você repetiu o essencial.',
      'Você ganhou mais eixo.'
    ];
  }

  return {
    headline,
    hook: clampStr(hook, 1800),
    days,
    rituals,
    checkpoints
  };
}

function buildLove({ elemento, numArch, lovePack, relacaoStatus, signo, firstName }) {
  const numN = numArch?._n;
  const stRaw = (relacaoStatus || '').toLowerCase();
  const sigRaw = (signo || '').toLowerCase().trim();
  const nome = firstName || 'Você';

  // -------------------------
  // Normaliza status
  // -------------------------
  let st = stRaw;
  if (st.includes('solteir')) st = 'solteira';
  else if (st.includes('fic')) st = 'ficando';
  else if (st.includes('inst')) st = 'relacionamento instável';
  else if (st.includes('nam')) st = 'namorando';
  else if (st.includes('cas')) st = 'casada';

  // -------------------------
  // Arrays base (mantém)
  // -------------------------
  const stop = [];
  const start = [];
  const microScript = [];

  // =========================
  // 1) BASE (elemento + número) — MANTÉM e APROFUNDA
  // =========================
  if (elemento === 'Fogo') {
    stop.push('Parar de agir no pico (responder no impulso, acelerar carência, forçar conexão).');
    stop.push('Parar de confundir intensidade com compatibilidade.');
    stop.push('Parar de “provar valor” com energia e presença excessiva.');
    start.push('Começar a escolher por comportamento repetido (constância), não por química.');
    start.push('Começar a pedir clareza cedo: “qual é a sua intenção aqui?”');
    start.push('Começar a sustentar ritmo: menos urgência, mais continuidade.');
  }
  if (elemento === 'Terra') {
    stop.push('Parar de “aguentar” demais para manter estabilidade.');
    stop.push('Parar de controlar para não sentir vulnerabilidade.');
    stop.push('Parar de colocar amor como “dever” e esquecer presença.');
    start.push('Começar a falar necessidades com calma e objetividade (sem acumular).');
    start.push('Começar a medir amor por respeito + presença, não por promessa.');
    start.push('Começar a permitir pequenas demonstrações de vulnerabilidade (sem drama).');
  }
  if (elemento === 'Ar') {
    stop.push('Parar de racionalizar sentimentos até esfriar o vínculo.');
    stop.push('Parar de conversar muito e observar pouco.');
    stop.push('Parar de usar “independência” para evitar entrega emocional real.');
    start.push('Começar a alinhar expectativa: “o que é saudável pra mim?”');
    start.push('Começar a observar consistência: quem some, não sustenta.');
    start.push('Começar a transformar conversa em combinado (ação concreta).');
  }
  if (elemento === 'Água') {
    stop.push('Parar de absorver o humor do outro como se fosse sua responsabilidade.');
    stop.push('Parar de romantizar migalhas e chamar de “potencial”.');
    stop.push('Parar de amar “por esperança” e ignorar fatos.');
    start.push('Começar a colocar limites: amor que confunde, drena.');
    start.push('Começar a escolher reciprocidade e leveza (sem provar valor).');
    start.push('Começar a diferenciar intuição de ansiedade (corpo primeiro).');
  }

  // Ajustes por número (mantém e expande)
  if ([2, 6, 9, 33].includes(numN)) {
    stop.push('Parar de cuidar ou ceder para garantir pertencimento.');
    stop.push('Parar de “curar” o outro como forma de se sentir necessária.');
    start.push('Começar a se priorizar sem culpa (isso filtra quem é certo).');
    start.push('Começar a amar com limites: carinho sem autoabandono.');
  }
  if ([7, 11].includes(numN)) {
    stop.push('Parar de ler sinais demais e perguntar de menos.');
    stop.push('Parar de exigir “certeza total” para se entregar um pouco.');
    stop.push('Parar de idealizar conexão espiritual onde só existe intensidade.');
    start.push('Começar a confiar no corpo: calma é sinal, ansiedade é alerta.');
    start.push('Começar a aterrar intuição com fatos: “o que ele faz repetidamente?”');
    start.push('Começar a escolher clareza antes de química.');
  }
  if ([8, 22].includes(numN)) {
    stop.push('Parar de tratar amor como projeto/controle/avaliação.');
    stop.push('Parar de confundir poder com dureza.');
    start.push('Começar a permitir afeto real (vulnerabilidade pequena, mas constante).');
    start.push('Começar a escolher parceria: alguém que soma, não alguém que disputa.');
  }

  // =========================
  // 2) PERSONALIZAÇÃO POR STATUS — MANTÉM e APROFUNDA
  // =========================
  const statusHook = (() => {
    if (st === 'solteira') {
      stop.unshift('Parar de aceitar migalhas só para não ficar sozinha.');
      stop.unshift('Parar de negociar seus não-negociáveis quando bate vontade de ter alguém.');
      start.unshift('Definir 3 não-negociáveis (constância, respeito, clareza) e filtrar por ação.');
      start.unshift('Criar critério: “o que eu preciso para sentir paz?” e honrar isso.');
      microScript.push('“Eu não estou com pressa. Eu estou selecionando.”');
      microScript.push('“Química não decide. Comportamento decide.”');
      return `${nome}, você está em fase de **seleção** — não de aceitação.`;
    }
    if (st === 'ficando') {
      stop.unshift('Parar de agir como “já é” antes de existir consistência.');
      stop.unshift('Parar de compensar ausência com imaginação.');
      start.unshift('Criar ritmo: consistência por 2–3 semanas antes de criar expectativa.');
      start.unshift('Observar padrão: “como a pessoa se comporta quando não é conveniente?”');
      microScript.push('“Eu gosto de calma e consistência. Vamos ver como isso evolui.”');
      microScript.push('“Eu vou no seu ritmo, mas eu observo seu padrão.”');
      return `${nome}, você está em fase de **leitura emocional**: o que conta é repetição.`;
    }
    if (st === 'relacionamento instável') {
      stop.unshift('Parar de normalizar sumiço, ambiguidade e instabilidade.');
      stop.unshift('Parar de insistir no potencial e ignorar o que está acontecendo de verdade.');
      start.unshift('Colocar limite com consequência (não com ameaça).');
      start.unshift('Trocar “esperar melhorar” por “exigir clareza e constância”.');
      microScript.push('“Eu preciso de estabilidade. Se não tem, eu me retiro.”');
      microScript.push('“Eu não negocio respeito e constância.”');
      return `${nome}, seu ciclo pede realidade + limite (não justificativa).`;
    }
    if (st === 'namorando') {
      stop.unshift('Parar de engolir incômodos pequenos até virarem explosão.');
      stop.unshift('Parar de testar amor ao invés de construir acordo.');
      start.unshift('Fazer check-in semanal: “o que tá bom e o que precisa ajustar?”');
      start.unshift('Criar combinado de presença: “o que é mínimo para você e para mim?”');
      microScript.push('“Eu prefiro diálogo simples do que silêncio longo.”');
      microScript.push('“Vamos combinar o mínimo para dar certo.”');
      return `${nome}, agora é fase de **construção**: acordo, presença e repetição.`;
    }
    if (st === 'casada') {
      stop.unshift('Parar de viver no automático emocional e esquecer do vínculo.');
      stop.unshift('Parar de deixar a relação virar só logística.');
      start.unshift('Criar 1 ritual fixo do casal (20 min) para presença real.');
      start.unshift('Criar “manutenção do vínculo”: carinho + conversa + novidade pequena semanal.');
      microScript.push('“Quero presença de verdade, não só convivência.”');
      microScript.push('“Vamos cuidar do vínculo antes de virar distância.”');
      return `${nome}, agora é fase de **manutenção profunda**: presença > rotina.`;
    }
    return `${nome}, seu ciclo pede clareza: menos “talvez”, mais combinado.`;
  })();

  // =========================
  // 3) PERSONALIZAÇÃO POR SIGNO — MUITO mais profunda (sem virar misticismo confuso)
  // =========================
  const signoHook = (() => {
    const s = sigRaw;

    // Observação: mantive em PT e com “como se comporta” (comportamental)
    if (s.includes('sagit')) {
      start.push('Combinar liberdade com respeito: espaço + acordo + constância (não sumiço).');
      start.push('Escolher alguém que some menos e sustente mais (paz é critério).');
      stop.push('Parar de romantizar o “livre demais” quando isso vira ausência.');
      return `Como Sagitário, seu amor precisa de verdade, aventura e espaço — mas espaço saudável tem combinado. Seu ponto de evolução é: **liberdade com presença** (não liberdade com distância).`;
    }
    if (s.includes('câncer')) {
      stop.push('Parar de “cuidar para ser escolhida” e esquecer de ser cuidada.');
      start.push('Pedir reciprocidade claramente (sem indiretas).');
      return `Como Câncer, você ama com profundidade e proteção. Seu ponto cego é confundir vínculo com responsabilidade. Seu ponto de evolução é: **sentir sem se perder** (limite vira paz).`;
    }
    if (s.includes('peix')) {
      stop.push('Parar de transformar imaginação em realidade sem prova.');
      start.push('Criar critério: “o que é fato?” antes de entregar coração.');
      return `Como Peixes, sua sensibilidade é rara — mas seu aprendizado é: **amor não pode ser só energia; precisa ser ação**. Intuição boa traz calma, não tortura.`;
    }
    if (s.includes('escor')) {
      stop.push('Parar de testar para confirmar medo.');
      stop.push('Parar de vigiar, investigar e perder leveza.');
      start.push('Trocar controle por verdade: conversa direta + limite claro.');
      return `Como Escorpião, você ama de forma intensa e total. Seu ponto cego é tentar controlar para não se ferir. Seu ponto de evolução é: **confiança construída por comportamento repetido**.`;
    }
    if (s.includes('virg')) {
      stop.push('Parar de procurar falhas para se proteger.');
      stop.push('Parar de “melhorar a relação” sozinha.');
      start.push('Pedir o que precisa de forma simples e objetiva (sem crítica).');
      return `Como Virgem, você ama com cuidado e presença prática. Seu ponto cego é exigir perfeição para se sentir segura. Seu ponto de evolução é: **coerência com leveza**.`;
    }
    if (s.includes('libr')) {
      stop.push('Parar de evitar conversa difícil para manter “harmonia”.');
      start.push('Escolher paz com verdade, não paz com silêncio.');
      return `Como Libra, você busca equilíbrio e parceria. Seu ponto cego é evitar conflito necessário e entrar em indecisão. Seu ponto de evolução é: **clareza elegante**.`;
    }
    if (s.includes('capri')) {
      stop.push('Parar de endurecer quando sente vulnerabilidade.');
      start.push('Mostrar afeto de forma simples (pequenos gestos consistentes).');
      return `Como Capricórnio, você ama com lealdade e construção. Seu ponto cego é parecer “fria” quando na verdade está se protegendo. Seu ponto de evolução é: **permitir sentir sem perder estrutura**.`;
    }
    if (s.includes('touro')) {
      stop.push('Parar de ficar por conforto quando o coração pede reciprocidade real.');
      start.push('Escolher segurança emocional (não só rotina).');
      return `Como Touro, você precisa de estabilidade e presença. Seu ponto cego é confundir apego com amor. Seu ponto de evolução é: **segurança com verdade**.`;
    }
    if (s.includes('gême')) {
      stop.push('Parar de fugir quando aprofunda.');
      start.push('Transformar interesse em consistência (um passo por vez).');
      return `Como Gêmeos, você precisa de troca mental e leveza. Seu ponto cego é dispersar quando aprofunda. Seu ponto de evolução é: **presença real (não só conversa)**.`;
    }
    if (s.includes('aquár')) {
      stop.push('Parar de se proteger com distância emocional.');
      start.push('Mostrar intenção com clareza (sem sumir).');
      return `Como Aquário, você valoriza liberdade e autenticidade. Seu ponto cego é parecer distante quando está apenas se defendendo. Seu ponto de evolução é: **liberdade com vínculo**.`;
    }
    if (s.includes('leão')) {
      stop.push('Parar de aceitar migalhas por orgulho/vaidade.');
      start.push('Escolher alguém que valoriza você em ações (não só palavras).');
      return `Como Leão, você precisa se sentir vista e valorizada. Seu ponto cego é buscar validação e tolerar incoerência. Seu ponto de evolução é: **padrão alto + consistência**.`;
    }
    if (s.includes('árie')) {
      stop.push('Parar de transformar amor em disputa/pressa.');
      start.push('Dar tempo para a pessoa mostrar quem é (sem acelerar).');
      return `Como Áries, você ama com coragem e verdade direta. Seu ponto cego é a pressa. Seu ponto de evolução é: **ritmo e constância**.`;
    }

    return '';
  })();

  // =========================
  // 4) MICRO-SCRIPTS BASE — mantém os seus + expande por perfil
  // =========================
  microScript.push(
    '“Eu gosto de constância. Se você não consegue, eu sigo.”',
    '“Eu não entro em ansiedade. Eu converso com clareza.”',
    '“Eu observo comportamento, não promessa.”',
    '“Se for para ser leve, eu topo. Se for para confundir, eu saio.”'
  );

  // Extra por número
  if ([11, 7].includes(numN)) {
    microScript.push('“Eu não vou interpretar sinais. Eu prefiro pergunta direta e resposta clara.”');
    microScript.push('“Se a conexão é real, ela é simples — não é tortura.”');
  }
  if ([2, 6, 9, 33].includes(numN)) {
    microScript.push('“Eu não me apago para caber. Eu me escolho e vejo quem fica.”');
  }
  if ([8, 22].includes(numN)) {
    microScript.push('“Eu quero parceria: presença, plano e respeito. Sem jogo.”');
  }

  // Extra por status (já tem, mas reforça)
  if (st === 'relacionamento instável') {
    microScript.push('“Sem constância, eu não continuo. Eu mereço paz.”');
  }

  // =========================
  // 5) CAMADAS PROFUNDAS (comportamental + energética + espiritual prática)
  // =========================

  // 5.1 Necessidade emocional central (por elemento + número)
  const need = (() => {
    if (elemento === 'Água') return 'segurança emocional + reciprocidade + limite';
    if (elemento === 'Terra') return 'estabilidade + coerência + construção';
    if (elemento === 'Ar') return 'clareza + conversa honesta + leveza com ação';
    return 'verdade + presença + liberdade com combinado';
  })();

  const wound = (() => {
    // “ferida” / padrão raiz (sem drama, bem assertivo)
    if ([11, 7].includes(numN)) return 'medo de se entregar para alguém incoerente (por isso você tenta “entender tudo”).';
    if ([2, 6, 9, 33].includes(numN)) return 'medo de não ter reciprocidade (por isso você cuida demais).';
    if ([8, 22].includes(numN)) return 'medo de perder controle e se decepcionar (por isso você endurece).';
    if (elemento === 'Fogo') return 'medo de perder tempo (por isso você acelera e se frustra).';
    if (elemento === 'Ar') return 'medo de errar a escolha (por isso você pensa demais).';
    if (elemento === 'Terra') return 'medo de instabilidade (por isso você tolera mais do que deveria).';
    return 'medo de abandono/confusão (por isso você absorve e idealiza).';
  })();

  // 5.2 Padrão sabotador (como aparece no dia a dia)
  const sabotador = (() => {
    if (st === 'solteira') return 'abaixar padrão por ansiedade e chamar isso de “dar chance”.';
    if (st === 'ficando') return 'fantasiar futuro antes de existir constância.';
    if (st === 'relacionamento instável') return 'insistir no potencial e ignorar o que está se repetindo.';
    if (st === 'namorando') return 'engolir incômodos e depois explodir (ou fechar).';
    if (st === 'casada') return 'entrar no automático e perder presença.';
    return 'aceitar ambiguidade e se desgastar emocionalmente.';
  })();

  // 5.3 Virada prática (o que fazer diferente)
  const virada = (() => {
    if (st === 'solteira') return 'trocar carência por critério: tempo + observação + não-negociáveis.';
    if (st === 'ficando') return 'trocar ansiedade por leitura: observar padrão, consistência e intenção.';
    if (st === 'relacionamento instável') return 'trocar esperança por limite: clareza + consequência.';
    if (st === 'namorando') return 'trocar teste por acordo: check-in + combinado + presença.';
    if (st === 'casada') return 'trocar rotina por vínculo: ritual + novidade + conversa curta semanal.';
    return 'trocar “talvez” por clareza: pergunta direta e decisão.';
  })();

  // 5.4 Green/Red flags (bem objetivo, premium)
  const redFlags = (() => {
    const list = [
      'Sumiço recorrente / contato só quando convém',
      'Incoerência entre palavra e ação',
      'Ambiguidade prolongada (“vamos ver” infinito)',
      'Te deixa ansiosa mais do que te deixa em paz',
      'Te coloca para competir por atenção'
    ];
    if (elemento === 'Água') list.push('Você vira “terapeuta” da pessoa e some de si.');
    if (elemento === 'Terra') list.push('Você sustenta sozinha e chama isso de “amor maduro”.');
    if (elemento === 'Ar') list.push('Muita conversa e pouca atitude: promessa sem gesto.');
    if (elemento === 'Fogo') list.push('Picos intensos + quedas: montanha-russa emocional.');
    return uniqueShort(list).slice(0, 6);
  })();

  const greenFlags = (() => {
    const list = [
      'Consistência (não perfeita, mas repetida)',
      'Clareza de intenção',
      'Respeito ao seu tempo e limites',
      'Presença (você sente paz no corpo)',
      'Reciprocidade (troca real, não migalha)'
    ];
    if ([11, 7].includes(numN)) list.push('Conversa honesta + profundidade sem confusão.');
    if ([2, 6, 9, 33].includes(numN)) list.push('Carinho com responsabilidade (não só palavras doces).');
    if ([8, 22].includes(numN)) list.push('Parceria e admiração mútua (sem disputa de poder).');
    return uniqueShort(list).slice(0, 6);
  })();

  // 5.5 Perguntas de clareza (poderosas)
  const perguntas = (() => {
    const list = [
      '“Qual é a sua intenção comigo agora?”',
      '“O que você consegue sustentar na prática?”',
      '“O que você considera respeito num relacionamento?”',
      '“Como você resolve conflito quando aparece?”'
    ];
    if (st === 'ficando') list.unshift('“Você está disponível emocionalmente ou só passando tempo?”');
    if (st === 'relacionamento instável') list.unshift('“Você quer construir ou quer manter tudo em aberto?”');
    if (st === 'namorando' || st === 'casada') list.unshift('“O que você precisa para se sentir amado(a) e o que eu preciso?”');
    return uniqueShort(list).slice(0, 6);
  })();

  // 5.6 Ritual energético prático (3–7 min) — sem viagem
  const ritual = (() => {
    // “Energia” aqui = estado interno + corpo + intenção (bem pé no chão)
    if (elemento === 'Água') {
      return `Ritual de 3–7 min (Água): 1 min respiração 4–4–6 + 2 min escrita (“o que é fato / o que eu estou projetando?”) + 1 limite pequeno hoje.`;
    }
    if (elemento === 'Terra') {
      return `Ritual de 3–7 min (Terra): 60s respiração + escrever 1 necessidade objetiva (“eu preciso de X”) + praticar dizer isso com calma (sem justificar).`;
    }
    if (elemento === 'Ar') {
      return `Ritual de 3–7 min (Ar): 60s respiração + 3 linhas (fato/sensação/próximo passo) + transformar em 1 mensagem clara ou 1 decisão.`;
    }
    return `Ritual de 3–7 min (Fogo): 60s respiração + mão no peito (“eu escolho com calma”) + resposta lenta (esperar 20 min antes de agir).`;
  })();

  // =========================
  // 6) TEXTO PRINCIPAL (pattern) — AGORA “manual premium”
  // =========================
  const pattern = clampStr(
    [
      // Abertura (espelho)
      statusHook,
      '',
      `*Leitura do seu campo afetivo (comportamental + energético):*`,
      `Neste momento, o seu amor está pedindo *${need}*.`,
      `O ponto sensível que mais te pega (padrão raiz): *${wound}*`,
      '',
      // Contexto do lovePack (mantém sua lógica)
      (lovePack?.contexto ? `*Contexto:* ${lovePack.contexto}` : ''),
      `*Risco principal:* ${lovePack?.risco || 'entrar em ansiedade e baixar padrão por carência'}.`,
      `*Meta do ciclo:* ${lovePack?.meta || 'escolher com calma e exigir constância'}.`,
      '',
      // Padrão invisível (assertivo)
      `**Seu padrão invisível (o que se repete sem você perceber):**`,
      `Quando o vínculo não está claro, você tende a ${sabotador}`,
      `Isso não é fraqueza, é um mecanismo de proteção. Mas proteção repetida vira prisão.`,
      '',
      // Virada (direção clara)
      `*A virada é simples e adulta:* ${virada}`,
      `Regra de ouro do seu perfil: *paz no corpo > pico de emoção.*`,
      '',
      // Personalização por signo (se tiver)
      signoHook ? `*Chave do seu signo:* ${signoHook}` : '',
      '',
      // Green/Red flags
      `*Sinais que te protegem (green flags):*`,
      greenFlags.map((x) => `• ${x}`).join('\n'),
      '',
      `*Sinais que te drenam (red flags):*`,
      redFlags.map((x) => `• ${x}`).join('\n'),
      '',
      // Perguntas (clareza)
      `*Perguntas que colocam verdade na mesa (sem joguinho):*`,
      perguntas.map((x) => `• ${x}`).join('\n'),
      '',
      // Ritual
      `*Ritual rápido para alinhar seu campo (3–7 min):*`,
      ritual,
      '',
      // Fecho
      `**Selo deste mapa:** você não precisa de mais intensidade. Você precisa de **constância + clareza + limite**.`,
      `Quando você sustenta isso, o amor certo não te confunde — ele te acalma.`,
    ].filter(Boolean).join('\n'),
    4200
  );

  const headline = `Seu padrão afetivo real (e a virada)`;

  // =========================
  // 7) Retorno final (mantém seu shape)
  // =========================
  return {
    headline,
    pattern,
    whatToStop: uniqueShort(stop).slice(0, 10),     // aumentei capacidade
    whatToStart: uniqueShort(start).slice(0, 10),   // aumentei capacidade
    microScript: uniqueShort(microScript).slice(0, 10)
  };
}

function buildMoney({ elemento, numArch, workPack, objPack }) {
  const numN = numArch?._n;

  // Arquétipo de dinheiro por número (com ajustes por elemento)
  let archetype = 'Estratégia';
  if ([1, 8, 22].includes(numN)) archetype = 'Realizaçãa';
  if ([2, 6, 33].includes(numN)) archetype = 'Conexão';
  if ([3, 5].includes(numN)) archetype = 'Comunicação';
  if ([4].includes(numN)) archetype = 'Construção';
  if ([7, 11].includes(numN)) archetype = 'Visão/Intuição';
  if ([9].includes(numN)) archetype = 'Cura com Propósito';

  const blocks = [];
  const actions = [];
  const microHabits = [];

  // Bloqueios por elemento
  if (elemento === 'Terra') {
    blocks.push('Perfeccionismo: você “prepara demais” e executa tarde.');
    blocks.push('Medo de errar: você posterga decisões simples.');
    actions.push('Escolha 1 produto/serviço/ação e publique versão 1 em 48h.');
    actions.push('Crie uma rotina mínima: 1 bloco fixo por dia para dinheiro.');
    microHabits.push('15 min/dia de ação de receita (venda, oferta, contato, anúncio).');
    microHabits.push('Checklist: feito > perfeito (marcar todos os dias).');
  } else if (elemento === 'Ar') {
    blocks.push('Hiper-análise: você pesquisa e muda de direção rápido.');
    blocks.push('Dispersão: muitas metas simultâneas = pouco resultado.');
    actions.push('Defina 1 meta de receita e 1 alavanca por 7 dias (só).');
    actions.push('Bloqueie 25 min/dia de execução sem ruído (sem mensagens).');
    microHabits.push('Escrever 3 bullets: prioridade / próxima ação / “o que vou ignorar hoje”.');
    microHabits.push('Regra de 1 aba: executar antes de aprender mais.');
  } else if (elemento === 'Água') {
    blocks.push('Energia drenada: você carrega problemas que não são seus.');
    blocks.push('Oscilação emocional: muda o ritmo e perde consistência.');
    actions.push('Limite de energia: “não” para 1 drenador e “sim” para 1 ação de dinheiro.');
    actions.push('Ritual de regulação antes de trabalhar: 3 min respiração + escrita.');
    microHabits.push('Descarrego: 2 min de escrita ao final do dia (tirar peso da mente).');
    microHabits.push('Uma ação de receita antes de qualquer tarefa “para os outros”.');
  } else {
    blocks.push('Pressa: você quer resultado rápido e abandona cedo.');
    blocks.push('Intensidade sem direção: muito esforço, pouca estratégia.');
    actions.push('Metas curtas: 1 ação por dia por 7 dias (sem negociar).');
    actions.push('Regra do “um canal”: foque na melhor alavanca (ex: oferta + follow-up).');
    microHabits.push('Ritual de foco: 60s respiração + 1 tarefa que gera receita.');
    microHabits.push('Fechar o dia com 1 entrega concreta (mesmo pequena).');
  }

  // Ajustes por número (peso, poder, intuição)
  if ([8, 22].includes(numN)) {
    blocks.push('Controle: você tenta segurar tudo e cansa.');
    actions.push('Delegue 1 coisa pequena ou automatize 1 etapa hoje.');
    microHabits.push('Todo dia: 1 decisão que tira peso do seu futuro.');
  }
  if ([11, 7].includes(numN)) {
    blocks.push('Medo de se expor: você guarda a visão e não posiciona.');
    actions.push('Posicionamento: escreva 1 frase de oferta e repita por 7 dias.');
    microHabits.push('1 publicação/mensagem por dia: constância vence talento isolado.');
  }

  const headline = `Mapa do Dinheiro — prosperidade e bloqueios invisíveis`;
  const rule = `Regra de ouro do seu perfil: dinheiro responde a decisão + repetição + presença (não a “inspiração”).`;
  const meta = `Arquétipo de dinheiro: ${archetype}. Contexto atual: ${workPack.contexto}`;

  return {
    headline,
    blocks: uniqueShort(blocks),
    actions: uniqueShort(actions),
    microHabits: uniqueShort(microHabits),
    _meta: clampStr(`${meta}\n${rule}`, 1200)
  };
}

function buildCalendar30({ elemento, objPack }) {
  // Calendário 30 dias (4 semanas) — simples, visual, aplicável.
  // Cada semana: foco + 7 dias.
  const weeks = [];
  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];

  const weekTemplates = [
    {
      week: 'Semana 1 — Limpeza (desbloqueio)',
      focus: `Cortar ruído e recuperar energia. Cura do elemento: ${e.cura}.`,
      days: [
        'Dia 1: escolher 1 prioridade + cortar 1 distração',
        'Dia 2: 15 min da tarefa evitada',
        'Dia 3: arrumar ambiente (mesa/bolsa/casa) = mente mais limpa',
        'Dia 4: limite: 1 “não”',
        'Dia 5: 1 conversa de clareza (amor ou trabalho)',
        'Dia 6: ritual 3 min + 1 decisão prática',
        'Dia 7: revisar semana + definir 1 hábito'
      ]
    },
    {
      week: 'Semana 2 — Reprogramação (mente e hábito)',
      focus: `Repetição cria identidade. Você vira quem faz, não quem pensa.`,
      days: [
        'Dia 8: 25 min execução (sem ruído)',
        'Dia 9: recompensa pequena pós-execução',
        'Dia 10: “feito > perfeito” (entrega versão 1)',
        'Dia 11: escrever 3 linhas (fato / sensação / próximo passo)',
        'Dia 12: cortar 1 auto-sabotagem (ex: adiar)',
        'Dia 13: 1 ação de dinheiro (oferta/contato)',
        'Dia 14: 1 ação de amor (limite/clareza)'
      ]
    },
    {
      week: 'Semana 3 — Expansão (magnetismo e posicionamento)',
      focus: `Você começa a aparecer e sustentar a sua energia.`,
      days: [
        'Dia 15: publicar/mostrar algo (sem perfeição)',
        'Dia 16: repetir a mensagem-chave (posicionamento)',
        'Dia 17: networking: 1 contato importante',
        'Dia 18: foco: 1 canal, 1 meta',
        'Dia 19: cuidar do corpo (energia = resultado)',
        'Dia 20: ritual 5 min de magnetismo',
        'Dia 21: revisar e ajustar sem abandonar'
      ]
    },
    {
      week: 'Semana 4 — Consolidação (constância e estabilidade)',
      focus: `O segredo é sustentar. Constância vira destino.`,
      days: [
        'Dia 22: rotina mínima (mesmo em dia ruim)',
        'Dia 23: reduzir ruído digital',
        'Dia 24: 1 entrega concreta',
        'Dia 25: 1 limite com elegância',
        'Dia 26: 1 ação de receita',
        'Dia 27: 1 ação de amor (autocuidado + escolha)',
        'Dia 28–30: fechamento: celebrar + planejar próximos 30 dias'
      ]
    }
  ];

  // Ajusta uma frase pelo objetivo
  const objLine = objPack?.frase ? `Objetivo do ciclo: ${objPack.frase}` : '';

  weekTemplates.forEach((w) => {
    weeks.push({
      week: w.week,
      focus: clampStr(`${w.focus}${objLine ? ` • ${objLine}` : ''}`, 500),
      days: w.days
    });
  });

  return { weeks };
}

function uniqueShort(list) {
  const out = [];
  const seen = new Set();
  for (const it of safeArr(list)) {
    const t = norm(it);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, 12);
}

function buildIntroText(ctx) {
  const { firstName, signo, elemento, regente, numN, numArch, objPack, birthFmt, local } = ctx;

  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const v1 =
    `${firstName}, este manual foi feito para parecer um espelho — e depois virar um mapa.\n\n` +
    `A combinação do seu Signo (${signo || '—'}) com o seu Número (${numN || '—'}) cria um “padrão invisível”:\n` +
    `• Como você decide\n• Como você se sabota\n• Como você se regula\n• Como você destrava amor e dinheiro\n\n` +
    `Base do método:\n` +
    `1) Astrologia (elemento/regência → comportamento)\n` +
    `2) Numerologia (arquétipo → motivação e sombra)\n` +
    `3) Neurociência prática (hábito, dopamina, sistema nervoso → execução)\n\n` +
    (hasValidChoice(objPack.label)
      ? `Seu objetivo principal neste ciclo: ${objPack.label}.\n`
      : '') +
    (birthFmt ? `Data de nascimento: ${birthFmt}.\n` : '') +
    (local ? `Local: ${titleCase(local)}.\n` : '') +
    `\nSeu elemento (${elemento}) traz ${e.assinatura}. O desafio: ${e.excesso}. A cura: ${e.cura}.\n` +
    `Regente do seu signo: ${regente || '—'}.\n\n` +
    `Arquétipo do seu número: ${numArch?.nome || '—'}.\n` +
    `Virtude: ${numArch?.virtude || '—'} • Sombra: ${numArch?.sombra || '—'} • Chave: ${numArch?.chave || '—'}.`;

  return clampStr(v1, 3500);
}

function buildObjectiveDeepDive({ objetivoPrincipal, elemento, numArch }) {
  const obj = (objetivoPrincipal || '').toLowerCase();

  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const n = numArch?._n || 0;
  const archName = numArch?.nome || 'Seu Arquétipo';
  const archShadow = numArch?.sombra || 'padrões repetidos';
  const archKey = numArch?.chave || 'consistência';
  const neuro = e.neuro || 'reduza ruído e execute';
  const cura = e.cura || 'foco e constância';

  const personalization =
    `Personalização do seu perfil:\n` +
    `• Elemento: ${elemento} → assinatura: ${e.assinatura}\n` +
    `• Tendência no desequilíbrio: ${e.excesso}\n` +
    `• Cura prática do seu elemento: ${cura}\n` +
    `• Neuro (como seu cérebro reage): ${neuro}\n` +
    `• Número ${n} (${archName}) → sombra: ${archShadow} • chave: ${archKey}\n`;

 function wrap({ title, truth, mechanism, realLife, emotionalPattern, pivot, blocks, closing }) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];

  const safeTitle = norm(title);
  const safeTruth = norm(truth);
  const safeMechanism = norm(mechanism);
  const safeRealLife = norm(realLife);
  const safeEmotionalPattern = norm(emotionalPattern);
  const safePivot = norm(pivot);
  const safeClosing = norm(closing);

  const blocksTxt = safeBlocks.map((b, i) => {
    const name = norm(b?.name) || `Bloqueio ${i + 1}`;
    const appears = norm(b?.appears) || 'Esse padrão aparece de forma sutil no dia a dia e rouba clareza.';
    const invisible = norm(b?.invisible) || 'Existe um mecanismo interno atuando sem que você perceba com facilidade.';
    const effect = norm(b?.effect) || 'Isso enfraquece seu eixo e faz você sentir esforço sem avanço real.';

    return (
      `Bloqueio ${i + 1} — ${name}\n` +
      `• Como aparece: ${appears}\n` +
      `• O invisível: ${invisible}\n` +
      `• O efeito real: ${effect}\n`
    );
  }).join('\n');

  return {
    title: safeTitle,
    body:
`${safeTruth}

O mecanismo invisível do seu objetivo

${safeMechanism}

Como isso aparece na vida real

${safeRealLife || '• você abre o dia sem uma direção clara\n• responde o urgente antes do importante\n• começa várias coisas e termina poucas\n• sente que fez muito, mas avançou pouco\n• tenta se reorganizar quando já está cansada'}

O padrão emocional por trás

${safeEmotionalPattern || 'No fundo, existe uma tentativa de dar conta de tudo sem decepcionar ninguém. Isso cria um estado interno de vigilância e pressa. Você sente que precisa responder, resolver e acompanhar tudo, e com isso perde contato com o que realmente era essencial. O resultado é um cansaço que não vem só do excesso de tarefa, mas do excesso de microdecisões ao longo do dia.'}

A virada real do seu objetivo

${safePivot || 'A virada acontece quando você para de depender de motivação solta e cria uma estrutura simples que sustenta o essencial com constância.'}

${personalization}

=== OS 3 BLOQUEIOS INVISÍVEIS DO SEU OBJETIVO ===
${blocksTxt}

Fechamento deste objetivo

${safeClosing || 'Organizar sua rotina não é sobre controlar cada minuto. É sobre criar um eixo simples que sustente seu dia mesmo quando a vida estiver confusa. No seu caso, a virada acontece quando você troca improviso por trilho, culpa por constância e excesso por direção.'}
`
  };
}
  // =========================
  // 1) TER MAIS DISCIPLINA
  // =========================
 if (obj.includes('disciplina')) {
  return wrap({
    title: 'Objetivo do ciclo — Ter mais disciplina',

    truth:
`Você não precisa “virar uma pessoa disciplinada”.
Você precisa parar de depender do seu humor para fazer o que importa.

O que te trava não é falta de capacidade.
É um padrão silencioso: você começa forte, sente o pico, visualiza a virada… mas perde sustentação quando a novidade passa ou quando o resultado demora.

E então a mente tenta justificar:
“não era o momento”
“preciso me organizar melhor”
“segunda eu volto”
“quando eu estiver mais focada, eu faço direito”

Mas a verdade é simples:
quando você negocia o começo, você enfraquece o ciclo inteiro.

O seu problema não é iniciar.
É sustentar quando deixa de ser empolgante.

Disciplina, no seu caso, não pede mais cobrança.
Pede menos negociação interna.`,

    mechanism:
`O mecanismo invisível do seu objetivo é dopamina + atrito + perfeccionismo.

Seu cérebro não escolhe naturalmente “o que é melhor”.
Ele tende a escolher “o que alivia agora”.
Quando a tarefa tem atrito para começar e a recompensa está longe, a mente adia, dispersa ou troca por algo mais fácil.

Existe ainda um segundo ponto:
o seu perfil tende a querer fazer do jeito certo, no timing certo, com a energia certa.
Quando isso não acontece, você posterga.
E posterga não porque não quer — mas porque não aceita começar pequeno.

Aí nasce um padrão muito comum:
padrão alto, visão forte, intenção real…
mas execução intermitente.

Disciplina não é rigidez.
É a capacidade de repetir o essencial até nos dias médios.
É isso que constrói identidade.`,

    realLife:
`• você começa com força e perde ritmo depois
• espera vontade, clima ou energia certa para agir
• adia quando não consegue fazer do jeito ideal
• recomeça várias vezes em vez de sustentar
• confunde preparação com execução
• tenta compensar depois com pressão, culpa ou promessa de recomeço`,

    emotionalPattern:
`No fundo, existe uma dificuldade de sustentar quando o brilho inicial passa.
Você até quer fazer, mas quando a tarefa pede repetição, paciência ou desconforto, a mente tenta negociar.

Ela cria justificativas elegantes:
mais clareza, mais preparo, mais tempo, mais vontade, mais sistema.

O problema é que esse excesso de negociação corrói a autoconfiança.
Porque toda vez que você adia o essencial, você reforça internamente a ideia de que depende do momento certo para funcionar.

E quanto mais você depende do momento, menos livre você fica.

A disciplina não quebra por falta de potencial.
Ela quebra quando o desconforto do processo fala mais alto do que a direção escolhida.`,

    pivot:
`A virada do seu objetivo é essa:
**disciplina é um sistema simples que você repete, não uma energia que você “tem”.**

Você vai parar de esperar a versão mais motivada de si.
E vai começar a confiar em estrutura.

Regra deste ciclo:
• menos promessa
• mais repetição
• menos intensidade
• mais constância
• menos perfeição
• mais prova concreta

Você não precisa sentir mais vontade.
Precisa reduzir atrito, começar menor e sustentar melhor.`,

    blocks: [
      {
        name: 'Começo negociável',
        appears:
          'Você pensa demais antes de começar, espera o momento ideal e transforma o início em discussão interna.',
        invisible:
          'O cérebro evita desconforto antecipado. Em vez de chamar isso de medo ou resistência, ele disfarça como “preciso me organizar melhor antes”.',
        effect:
          'Você adia o início, perde tração cedo e reforça a identidade de alguém que sempre vai começar “depois”.',
        unlock:
          'Regra fixa: começar em 2 minutos. Mesmo pequeno. Mesmo imperfeito. O começo não entra em debate.'
      },
      {
        name: 'Padrão alto + execução baixa',
        appears:
          'Você quer fazer bem. Mas quando percebe que não vai ficar excelente, trava, adia ou refaz mentalmente sem entregar.',
        invisible:
          'Perfeccionismo funciona como proteção: se você não entra de verdade no processo, também não se expõe ao erro, ao julgamento ou à frustração.',
        effect:
          'Você trava antes de repetir, e sem repetição a disciplina nunca se consolida como identidade.',
        unlock:
          'Feito > perfeito. Regra: versão 1 em até 48 horas. Primeiro entrega, depois melhora.'
      },
      {
        name: 'Dispersão de metas',
        appears:
          'Você tenta mudar tudo ao mesmo tempo: rotina, corpo, trabalho, casa, energia, alimentação, vida emocional… e não sustenta nenhuma frente por muito tempo.',
        invisible:
          'Muitas metas dão sensação de controle e renovação, mas diluem energia. O cérebro entra em urgência e não consolida hábito.',
        effect:
          'Você gasta energia em muitas frentes e não constrói consistência suficiente em nenhuma delas.',
        unlock:
          'Escolha uma prioridade por 7 dias. Uma só. Todo o resto vira manutenção mínima.'
      }
    ],

    closing:
`Ter mais disciplina não é virar uma pessoa rígida.
É parar de depender do seu humor para fazer o que sustenta a vida que você quer construir.

No seu caso, a virada acontece quando você troca impulso por sistema, perfeição por repetição e recomeço por continuidade.

Menos negociação.
Mais constância.

Menos promessa.
Mais prova.

Disciplina não é um traço.
É uma identidade construída no pequeno.`,

    plan7: [
      'Dia 1: escolha 1 prioridade real e defina a menor ação diária possível para ela. Corte 1 distração estrutural.',
      'Dia 2: aplique a regra do começo: 2 minutos para iniciar antes de pensar demais.',
      'Dia 3: faça 1 bloco de execução de 25 minutos sem ruído. Depois, marque como concluído.',
      'Dia 4: reduza atrito: deixe ambiente, material, roupa, lista ou tela já preparados para amanhã.',
      'Dia 5: entregue uma versão 1 de algo importante. O objetivo é concluir, não impressionar.',
      'Dia 6: revise onde você negociou demais e remova 1 obstáculo do sistema.',
      'Dia 7: escolha 1 hábito para repetir por 30 dias e defina um horário simples e sustentável.'
    ],

    rituals: [
      'Ritual de início (3 min): respiração 4–4–6 + escrever “o que é essencial hoje?” + começar por 2 minutos.',
      'Ritual anti-procrastinação (3 min): postura aberta + água + frase “eu não negocio o começo”.',
      'Ritual de foco (5 min): escrever “1 prioridade / 1 próxima ação / 1 distração que vou ignorar hoje”.',
      `Ritual do seu elemento (${elemento}) (3–7 min): ${cura}.`
    ],

    phrases: [
      '“Eu não negocio o começo.”',
      '“Feito hoje vale mais do que perfeito nunca.”',
      '“Constância me dá a vida que intensidade não sustenta.”',
      '“Eu escolho o essencial e repito.”'
    ]
  });
}
  // =========================
  // 2) REDUZIR ANSIEDADE
  // =========================
  if (obj.includes('ansiedade')) {
    return wrap({
  title: 'Objetivo',

  truth:
`Ansiedade não é só “pensar demais”.
É viver internamente como se tudo precisasse ser resolvido antes da hora.

Quando a ansiedade cresce, geralmente ela vem junto de:
• excesso de futuro
• ambiguidade
• urgência interna
• tentativa de controle

E aí você tenta encontrar paz pensando mais.
Mas isso só acelera o alarme.`,

  mechanism:
`No seu caso, a ansiedade cresce quando o corpo entra em alerta e a mente tenta compensar criando cenário, hipótese, resposta e previsão.

O problema é que pensamento demais não regula.
Só prolonga ativação.

Você tenta pensar para se sentir segura.
Mas pensamento demais vira mais alarme, não mais paz.`,

  realLife:
`• você pensa 10 passos à frente
• tenta resolver tudo mentalmente
• sente urgência mesmo sem urgência real
• confunde intuição com alerta constante
• muda seu estado interno rápido e tenta compensar com controle`,

  emotionalPattern:
`No fundo, existe medo de errar, perder controle ou ser pega de surpresa.
Então sua mente tenta evitar dor antecipando tudo.

Mas antecipação constante esgota o sistema nervoso.`,

  pivot:
`Ansiedade não melhora com mais análise.
Melhora com regulação e direção.

No seu caso, a paz começa quando:
• você reduz ambiguidade
• regula o corpo antes de decidir
• corta excesso de estímulo
• volta para o que é fato
• escolhe uma ação pequena e concreta`,

  blocks: [
    {
      name: 'Alimentar ambiguidade',
      appears: 'você fica presa em talvez, hipótese e espera.',
      invisible: 'Ambiguidade mantém o cérebro em alerta.',
      effect: 'o corpo não desliga.'
    },
    {
      name: 'Checagem e controle',
      appears: 'você busca certeza em sinais, mensagens, listas e previsões.',
      invisible: 'Checagem dá alívio rápido, mas reforça ansiedade.',
      effect: 'você volta ao ciclo toda vez.'
    },
    {
      name: 'Excesso de futuro',
      appears: 'você vive à frente do presente.',
      invisible: 'Futuro demais vira ameaça constante.',
      effect: 'o agora perde força.'
    }
  ],

  closing:
`Você não precisa controlar tudo para se sentir segura.

Você precisa ensinar o seu corpo que ele pode sair do estado de alerta.

Ansiedade é energia sem direção. Clareza e ação pequena devolvem você para si.`
});
  }

  // =========================
  // 3) MELHORAR AUTOESTIMA
  // =========================
  if (obj.includes('autoestima')) {
    return wrap({
  title: ' Objetivo do ciclo ',

  truth:
`Autoestima não é “se achar incrível”.
Autoestima é se respeitar, principalmente quando ninguém está olhando.

Quando sua autoestima oscila, geralmente não é por falta de capacidade.
É porque ela ainda está conectada a três coisas instáveis:

• validação (receber reconhecimento, elogio ou aprovação)
• performance (resultado rápido)
• comparação (com outras pessoas ou com sua versão ideal)

Então você vive em picos:
se deu certo → você confia em si
se deu errado → você se questiona

Mas autoestima madura é outra coisa:
é constância interna.`,

  mechanism:
`No seu caso, o que mais enfraquece sua autoestima não é erro.
É promessa quebrada.

Você promete coisas para si e não sustenta.
E cada promessa quebrada vira uma micro-ferida de confiança.

O cérebro aprende:
“eu não posso contar comigo”.

E isso vira insegurança silenciosa.`,

  realLife:
`• você se sente forte quando está produzindo
• mas se diminui quando perde ritmo
• se cobra por não estar “melhor ainda”
• duvida de si quando não recebe retorno
• alterna entre potência e autocrítica`,

  emotionalPattern:
`No fundo, o que existe é medo de não ser suficiente.
E isso te faz tentar compensar com intensidade.

Mas intensidade sem constância destrói autoestima.`,

  pivot:
`Autoestima não cresce com afirmação bonita.
Cresce com evidência interna.

Evidência interna é:
• cumprir micro-promessas
• escolher limites
• parar de se explicar
• agir com elegância, mesmo sem plateia`,

  blocks: [
    {
      name: 'Autoexigência cruel',
      appears: 'você chama cobrança de padrão alto.',
      invisible: 'Padrão alto sem acolhimento quebra constância.',
      effect: 'você começa forte e abandona no meio.'
    },
    {
      name: 'Validação como combustível',
      appears: 'você se sente melhor quando é escolhida.',
      invisible: 'Qualquer silêncio vira ameaça.',
      effect: 'você oscila sem perceber.'
    },
    {
      name: 'Comparação silenciosa',
      appears: 'sensação constante de atraso.',
      invisible: 'Comparação destrói presença.',
      effect: 'você nunca sente que é suficiente.'
    }
  ],

  closing:
`Você não precisa se sentir melhor para agir melhor.

Você precisa agir de um jeito que te faça confiar mais em si.

Autoestima sobe quando você para de se trair no pequeno.`
});
  }

  // =========================
  // 4) ATRAIR RELACIONAMENTO SAUDÁVEL
  // =========================
  if (obj.includes('atrair relacionamento')) {
    return wrap({
  title: 'Objetivo ',

  truth:
`O seu problema no amor não é falta de sentimento.
É falta de filtro emocional nos momentos certos.

Quando você quer viver um relacionamento saudável, o que mais atrapalha não é “azar”.
É aceitar sinais mistos por tempo demais, romantizar intensidade e chamar ansiedade de conexão.

Relacionamento saudável não começa no pico.
Começa na coerência.`,

  mechanism:
`No seu caso, o mecanismo invisível é esse:
quando existe química, possibilidade ou expectativa, a mente tenta completar o resto.

Você imagina intenção onde ainda existe só abertura.
Projeta profundidade onde ainda existe só intensidade.
E vai se vinculando antes de existir base.

Isso não acontece por fraqueza.
Acontece porque o emocional quer antecipar segurança.`,

  realLife:
`• você sente muito antes de ter clareza
• cria expectativa antes de existir constância
• lê sinais demais e pergunta de menos
• se apega ao potencial e não ao padrão
• tolera ambiguidades que depois te drenam`,

  emotionalPattern:
`No fundo, existe medo de perder uma possibilidade boa, de “estragar” algo com cobrança ou de parecer exigente demais.
Então você flexibiliza cedo demais.

Mas flexibilidade sem critério vira autoabandono.`,

  pivot:
`Atrair um relacionamento saudável não depende de sentir mais.
Depende de selecionar melhor.

No seu caso, a virada começa quando você:
• para de escolher por intensidade
• observa comportamento repetido
• pede clareza mais cedo
• sustenta seus não-negociáveis
• confia mais na paz do corpo do que no pico da emoção`,

  blocks: [
    {
      name: 'Confundir química com compatibilidade',
      appears: 'você sente conexão e já dá peso emocional alto.',
      invisible: 'O cérebro se apega ao pico e ignora a consistência.',
      effect: 'você se envolve antes de ter base real.'
    },
    {
      name: 'Tolerar ambiguidade',
      appears: 'você aceita “vamos ver”, sinais mistos e intenção pouco clara.',
      invisible: 'Ambiguidade mantém esperança viva e decisão suspensa.',
      effect: 'você fica presa sem perceber.'
    },
    {
      name: 'Baixar padrão quando sente carência',
      appears: 'você flexibiliza o que sabe que importa.',
      invisible: 'Carência cria urgência emocional.',
      effect: 'você aceita menos do que merece.'
    }
  ],

  closing:
`Você não precisa viver um amor mais intenso.

Precisa viver um amor mais coerente.

Relacionamento saudável começa quando você para de escolher por ansiedade e começa a escolher por constância.`
});
  }

  // =========================
  // 5) MELHORAR RELACIONAMENTO ATUAL
  // =========================
  if (obj.includes('relacionamento atual')) {
    return wrap({
  title: 'Objetivo',

      truth:
`Seu problema no relacionamento não é falta de sentimento.
É falta de alinhamento nos momentos certos.

Quando você quer melhorar a relação atual, o que mais pesa não é “amor insuficiente”.
É acúmulo, expectativa não dita e reação antes da clareza.

Relacionamento não melhora só porque existe sentimento.
Melhora quando existe conversa, acordo e presença.`,

    mechanism:
`No seu caso, o mecanismo invisível funciona assim:

Você sente, percebe, nota incômodo, mas muitas vezes segura mais do que deveria.
Tenta evitar desgaste, evita conflito cedo demais ou espera o outro perceber sozinho.

Só que expectativa implícita vira ruído.
Ruído repetido vira acúmulo.
E acúmulo vira desgaste.

Isso não acontece por fraqueza.
Acontece porque o emocional tenta preservar o vínculo evitando desconforto imediato.

Mas evitar o desconforto pequeno cria um peso maior depois.`,

    realLife:
`• você percebe algo, mas demora para dizer
• guarda incômodos até virar frustração
• reage antes de traduzir o que realmente precisa
• tenta manter paz externa e perde clareza interna
• espera alinhamento sem transformar isso em combinado`,

    emotionalPattern:
`No fundo, existe medo de piorar a situação, de parecer exigente demais ou de transformar uma conversa em conflito.

Então você adapta, segura ou suaviza demais.

Mas adaptação sem verdade vira autoabandono.
E autoabandono desgasta a relação por dentro.`,

    pivot:
`Melhorar seu relacionamento atual não depende de sentir mais.
Depende de construir melhor.

No seu caso, a virada começa quando você:
• fala antes de acumular
• transforma emoção em pedido claro
• troca teste por acordo
• cria presença sem descarregar tensão
• sustenta verdade com maturidade`,

    blocks: [
      {
        name: 'Expectativa não dita',
        appears: 'você quer algo, mas segura até virar frustração.',
        invisible: 'A mente evita vulnerabilidade e desconforto.',
        effect: 'O outro erra sem saber e o vínculo acumula peso.'
      },
      {
        name: 'Reação antes da necessidade',
        appears: 'você muda o tom, fecha ou explode antes de traduzir o que sente.',
        invisible: 'Sistema nervoso ativado fala antes da clareza.',
        effect: 'A conversa vira ruído e a necessidade real se perde.'
      },
      {
        name: 'Falta de acordo real',
        appears: 'muita coisa importante fica implícita.',
        invisible: 'Cada um ama, espera e interpreta de um jeito.',
        effect: 'A relação vira tentativa, não construção.'
      }
    ],

    closing:
`Você não precisa de mais intensidade dentro da relação.

Precisa de mais clareza, acordo e presença.

Relacionamento melhora quando expectativa vira conversa, e conversa vira construção.`
  });
}
  // =========================
  // 6) CRESCER PROFISSIONALMENTE
  // =========================
  if (obj.includes('profissional')) {
    return wrap({
  title: 'Objetivo ',

  truth:
`O seu problema não é falta de talento.
É excesso de potência sem trilho estável.

Você tem visão, repertório e vontade de crescer;
mas isso nem sempre vira avanço concreto porque a energia se dispersa antes de consolidar resultado.`,

  mechanism:
`No seu caso, o crescimento trava quando você muda direção cedo demais, se cobra rápido demais ou espera clareza total para agir.

Potencial não basta.
Mercado responde a consistência, repetição e entrega visível.`,

  realLife:
`• muitas ideias, poucos ciclos completos
• aprender muito e expor pouco
• alternar entre intensidade e queda de ritmo
• mudar estratégia cedo demais
• esperar clareza total para agir`,

  emotionalPattern:
`No fundo, existe medo de se expor, de errar em público ou de sustentar uma rota e não ter retorno.
Então a mente se protege mudando, refinando ou adiando.

Mas isso impede tração.`,

  pivot:
`Crescer profissionalmente não depende de fazer mais.
Depende de sustentar melhor.

No seu caso, a virada começa quando você:
• escolhe um foco principal
• repete a mesma mensagem por mais tempo
• entrega antes de otimizar
• para de esperar o momento perfeito
• transforma visão em movimento visível`,

  blocks: [
    {
      name: 'Aprender no lugar de entregar',
      appears: 'você pesquisa, ajusta e refina demais.',
      invisible: 'Aprender dá sensação de segurança sem risco.',
      effect: 'a entrega nunca ganha volume.'
    },
    {
      name: 'Mensagem instável',
      appears: 'você muda foco e comunicação cedo demais.',
      invisible: 'Sem repetição, não existe lembrança.',
      effect: 'Você demonstra potencial, mas ainda não se consolidou.'
    },
    {
      name: 'Medo de exposição',
      appears: 'Você espera ter segurança suficiente para aparecer.',
      invisible: 'Medo de julgamento trava o posicionamento.',
      effect: 'o crescimento perde tempo e visibilidade.'
    }
  ],

  closing:
`Você não precisa de mais capacidade.

Precisa de mais sustentação.

Crescimento não vem de pensar mais. Vem de sustentar melhor.`
});
  }

  // =========================
  // 7) ORGANIZAR MINHA ROTINA
  // =========================
 if (obj.includes('rotina')) {
  return wrap({
    title: 'Objetivo',
    truth: `Seu problema não é falta de tempo.\nÉ falta de eixo.\n\nVocê reage ao dia.\nE quem reage ao dia perde energia tentando compensar depois.\n\nRotina organizada não é “agenda cheia”.\nÉ ter um eixo fixo.\nUm mínimo inegociável.\nUm sistema que funciona até em dia ruim.`,
    
    mechanism: `O mecanismo invisível é atrito + improviso.\nImproviso cria decisões o tempo todo.\nDecisão o tempo todo cansa o cérebro.\nCérebro cansado escolhe o fácil: distração.\n\nA rotina certa reduz decisão.\nE quando reduz decisão, você ganha vida.`,
    
    realLife: `• você abre o dia sem uma direção clara\n• responde o urgente antes do importante\n• começa várias coisas e termina poucas\n• sente que fez muito, mas avançou pouco\n• tenta se reorganizar no fim do dia, quando já está sem energia`,
    
    emotionalPattern: `No fundo, existe uma tentativa de dar conta de tudo sem decepcionar ninguém.\nIsso cria um estado interno de vigilância e pressa.\nVocê sente que precisa responder, resolver e acompanhar tudo, e com isso perde contato com o que realmente era essencial.\nO resultado é um cansaço que não vem só do excesso de tarefa, mas do excesso de microdecisões ao longo do dia.`,
    
    pivot: `A virada:\n**rotina mínima + repetição + revisão semanal.**\nSem perfeição.\nSem virar robô.\nSó com um eixo fixo.`,
    
    blocks: [
      {
        name: 'Agenda sem eixo',
        appears: 'Você tem muitas tarefas, mas não tem um bloco fixo do essencial.',
        invisible: 'Sem eixo, tudo vira urgência.',
        effect: 'O essencial perde espaço e o dia termina com sensação de esforço sem avanço real.'
      },
      {
        name: 'Começar o dia no celular',
        appears: 'Você entra no ruído antes de entrar em você.',
        invisible: 'Isso ativa ansiedade e dispersão.',
        effect: 'Sua atenção fica fragmentada logo cedo, e você passa o resto do dia tentando recuperar um centro que não foi criado no começo.'
      },
      {
        name: 'Tudo é importante',
        appears: 'Você tenta atender tudo e não termina o essencial.',
        invisible: 'Medo de decepcionar ou perder oportunidade.',
        effect: 'Você termina o dia sem energia, com sensação de dívida interna, mesmo tendo feito muita coisa.'
      }
    ],
    
    closing: `Organizar sua rotina não é sobre controlar cada minuto.\nÉ sobre criar um eixo simples que sustente seu dia mesmo quando a vida estiver confusa.\nNo seu caso, a virada acontece quando você para de depender de motivação e começa a confiar em estrutura.\nMenos improviso. Mais trilho.\nMenos culpa. Mais constância.`
  });
}

  // =========================
  // FALLBACK (se vier diferente)
  // =========================
  return wrap({
    title: 'Objetivo ',
    truth:
`Você não precisa fazer tudo.
Você precisa sustentar o essencial.

Quando você escolhe um alvo e repete o simples, o mundo muda de resposta.`,

    mechanism:
`O mecanismo invisível é dispersão:
muitas metas te dão sensação de controle, mas te tiram constância.`,

    pivot:
`A virada é: uma prioridade por vez + uma ação por dia.`,

    blocks: [
      {
        name: 'Ruído',
        appears: 'Você começa várias coisas.',
        invisible: 'O cérebro busca alívio rápido.',
        unlock: 'Escolha UMA prioridade por 7 dias.'
      },
      {
        name: 'Oscilação',
        appears: 'Seu humor muda e você muda a meta.',
        invisible: 'Falta regulação do sistema nervoso.',
        unlock: 'Regule antes de decidir.'
      },
      {
        name: 'Adiamento',
        appears: 'Você adia o simples.',
        invisible: 'Proteção do ego.',
        unlock: 'Ação mínima diária.'
      }
    ],
    plan7: [
      'Dia 1: escolha 1 prioridade real.',
      'Dia 2: comece 2 minutos.',
      'Dia 3: execute 25 min sem ruído.',
      'Dia 4: aplique 1 limite.',
      'Dia 5: entregue versão 1.',
      'Dia 6: ajuste o sistema.',
      'Dia 7: escolha 1 hábito por 30 dias.'
    ],
    rituals: [
      'Respiração 4–4–6 (1 min) + 1 linha de clareza.',
      'Ação mínima (15 min).',
      `Ritual do elemento (${elemento}): ${cura}.`
    ],
    phrases: [
      '“Eu escolho o simples.”',
      '“Eu sustento o processo.”',
      '“Eu viro a chave.”'
    ]
  });
}


function buildPersonalityText(ctx) {
  const { elemento, numArch, signo, objPack } = ctx;

  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const objetivo = objPack?.label || 'clareza e virada';
  const foco = objPack?.foco || 'constância e direção';

  return clampStr(
`Quando você está bem:
você expressa o melhor do seu perfil com força.
No seu caso, isso significa mais ${e.assinatura}, e mais sensação de direção.
Seu número (${numArch?.nome || 'Seu Arquétipo'}) entra em luz, e você sente mais ${numArch?.virtude || 'clareza'}.

Quando você começa a sair do eixo:
a sua energia acelera ou se embaralha.
O que antes era potência começa a virar ${e.excesso}.
Ao mesmo tempo, a sombra do seu número aparece: ${numArch?.sombra || 'padrões repetidos'}.

Quando isso acontece, o padrão costuma ser:
• você perde ritmo
• tenta compensar no excesso
• se cobra mais do que precisa
• e se afasta justamente do que te faria voltar ao centro

O mais importante sobre você é isso:
o seu problema raramente é falta de capacidade.
Geralmente é perda de eixo.

E o seu retorno ao eixo não vem de fazer mais.
Vem de lembrar como o seu sistema funciona.

No seu caso, o que te reorganiza é:
• ${e.cura}
• menos intensidade e mais constância
• menos reação e mais direção
• mais alinhamento com o seu foco atual: ${foco}

Leitura final desta seção:
você não precisa lutar contra quem você é.
Você precisa aprender a reconhecer mais rápido quando saiu do seu centro — e voltar antes da espiral crescer.`,
    4200
  );
}


function buildDiagnosticoPorObjetivo({ objetivoPrincipal, firstName, signo, elemento, regente, numN, numArch }) {
  const obj = lower(objetivoPrincipal);
  const nome = firstName || 'Você';

  const s = SIGNO_PROFUNDO[signo] || SIGNO_PROFUNDO['Sagitário'];
  const r = REGENTE_PROFUNDO[regente] || { drive: 'direção', alerta: 'excesso', chave: 'constância' };
  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const nBase = NUMERO_PROFUNDO[numN] || NUMERO_PROFUNDO[7] || {};
  const n = {
    essencia: nBase.essencia || 'potencial único',
    forca: nBase.forca || nBase.força || 'presença',
    sombra: nBase.sombra || 'padrão repetido',
    cura: nBase.cura || 'rotina mínima + consistência'
  };

  // =========================
  // 1) AUTOESTIMA
  // =========================
  if (obj.includes('autoestima')) {
    return clampStr(`
${nome}, o seu diagnóstico neste ciclo não é sobre “se amar mais”.
É sobre perceber como a sua autoestima oscila quando ela depende de validação, resultado rápido ou comparação.

No seu caso, existe um padrão invisível:
você até sabe o seu valor em alguns momentos;
mas quando algo não sai como queria, quando não recebe a resposta que esperava, ou quando sente que “deveria estar melhor”, a sua força interna desce rápido.

Isso acontece porque a sua autoestima ainda está muito conectada a prova externa ou performance.

Quando você vai bem, você confia em si.  
Quando o ritmo cai, você duvida de si.  
Esse é o padrão.

A sua combinação cria uma dinâmica muito específica:
você nasceu com visão, impulso e sensibilidade alta, mas, quando perde eixo, isso vira cobrança, ansiedade e oscilação interna.

Na prática, isso pode aparecer assim:
• você se sente forte quando está produzindo, resolvendo ou sendo admirada  
• mas se diminui quando perde ritmo, falha ou sente rejeição  
• promete coisas para si e, quando não sustenta, perde confiança em si  
• oscila entre potência e autocrítica  

O ponto central do seu diagnóstico é esse:
a sua autoestima não precisa de mais elogio. Precisa de mais evidência interna.

Evidência interna é:
• cumprir micro-promessas  
• agir com auto-respeito  
• manter limites  
• parar de se explicar tanto  
• confiar mais na sua conduta do que na opinião alheia  

A sua virada não vem de “pensar positivo”.
Vem de se tornar alguém confiável para si.

No seu perfil, autoestima cresce quando:
• você sustenta o que diz  
• você escolhe com mais verdade  
• você para de se abandonar nos detalhes  
• você troca intensidade por constância  

No seu caso, autoestima não cresce com discurso bonito.
Cresce quando você para de se abandonar em nome de aprovação, pressa ou perfeição.
O seu trabalho agora não é parecer mais confiante.
É construir confiança real.

Frase-mestra deste diagnóstico:
**Autoestima sobe quando você para de se trair no pequeno.**
`, 7000);
    }

  // =========================
  // 2) ANSIEDADE
  // =========================
  if (obj.includes('ansiedad')) {
    return clampStr(`
${nome}, o seu diagnóstico neste ciclo não é que “você pensa demais”.
É que o seu sistema interno entra em alerta com facilidade quando sente incerteza, excesso de possibilidades ou falta de controle.

No seu caso, a ansiedade não aparece só como medo.
Ela aparece como antecipação, urgência interna, excesso de pensamento e dificuldade de descansar de verdade.

Existe um padrão invisível aqui:
quando algo fica indefinido, ambíguo ou fora do seu controle, a sua mente tenta compensar criando cenário, previsão, resposta, hipótese e tentativa de solução.

Só que isso não te acalma.
Isso te acelera.

Você tenta pensar para se sentir segura.  
Mas pensamento demais vira mais alarme, não mais paz.

A sua combinação cria uma dinâmica muito específica:
você tem visão, sensibilidade e leitura rápida;
mas, quando perde eixo, isso vira sobrecarga, tensão e dificuldade de voltar para o presente.

Na prática, isso pode aparecer assim:
• você pensa 10 passos à frente e perde o agora  
• tenta resolver tudo mentalmente antes do tempo  
• sente urgência mesmo quando não existe urgência real  
• confunde intuição com alerta constante  
• muda seu estado interno rápido e depois tenta compensar no controle  

O ponto central do seu diagnóstico é esse:
a sua ansiedade não precisa de mais análise. Precisa de mais regulação e direção.

Regulação e direção, no seu caso, significam:
• reduzir ambiguidade  
• regular o corpo antes de decidir  
• cortar excesso de estímulo  
• voltar para o que é fato  
• escolher uma ação pequena e concreta  

A sua virada não vem de “entender tudo”.
Vem de ensinar o seu corpo que ele pode sair do estado de alerta.

No seu perfil, a ansiedade diminui quando:
• você para de alimentar o talvez  
• cria clareza em vez de cenário  
• reduz checagem  
• volta para o corpo  
• transforma energia em ação pequena e real  

No seu caso, paz não vem de controle total.
Vem de presença, clareza e ritmo.

Frase-mestra deste diagnóstico:
**Ansiedade é energia sem direção. Clareza e ação pequena devolvem você para si.**
`, 7000);
  }

  // =========================
  // 3) DISCIPLINA
  // =========================
  if (obj.includes('disciplina')) {
    return clampStr(`
${nome}, o seu diagnóstico neste ciclo não é falta de força.
É falta de sistema.

Você provavelmente já viveu esse padrão:
começa bem, sente motivação, organiza tudo, visualiza a virada…
mas depois perde ritmo quando a novidade passa ou quando a recompensa demora.

Isso não significa que você é indisciplinada.
Significa que ainda está tentando funcionar no impulso — e não no método.

Existe um padrão invisível aqui:
você começa quando sente vontade, quando está inspirada, quando o dia parece “certo”.
Mas quando precisa sustentar sem glamour, sem pressa boa e sem recompensa imediata, a força cai.

O seu problema não é começar.  
É sustentar quando deixa de ser empolgante.  
Esse é o padrão.

A sua combinação cria uma dinâmica muito específica:
você tem potência, visão e impulso para iniciar;
mas, quando perde eixo, isso vira dispersão, autocrítica e quebra de constância.

Na prática, isso pode aparecer assim:
• você começa forte e não sustenta  
• depende do humor para agir  
• adia quando não consegue fazer “do jeito certo”  
• confunde planejamento com execução  
• tenta mudar tudo de uma vez e perde tração  

O ponto central do seu diagnóstico é esse:
a sua disciplina não precisa de mais cobrança. Precisa de menos negociação interna.

Menos negociação interna significa:
• parar de esperar vontade  
• reduzir atrito  
• começar pequeno  
• escolher uma prioridade por vez  
• repetir o básico até virar identidade  

A sua virada não vem de motivação.
Vem de prova repetida.

Prova repetida é o que ensina o seu cérebro:
“eu faço o que disse que faria, mesmo sem clima perfeito.”

No seu perfil, disciplina cresce quando:
• você para de romantizar recomeço  
• cria começo simples  
• mede constância, não intensidade  
• troca perfeição por continuidade  
• sustenta o essencial mesmo em dia médio  

No seu caso, disciplina não nasce de pressão.
Nasce de estrutura.
Você não precisa virar outra pessoa.
Precisa parar de depender da sua versão inspirada para viver a vida que quer construir.

Frase-mestra deste diagnóstico:
**Disciplina não é dom. É identidade construída no pequeno.**
`, 7000);
  }

  // =========================
  // 4) ROTINA
  // =========================
  if (obj.includes('rotina')) {
    return clampStr(`
${nome}, o seu diagnóstico neste ciclo não é “falta de tempo”.
É falta de eixo.

Quando a rotina bagunça, geralmente não é porque você tem coisa demais.
É porque o seu dia começa sem um centro claro, e aí você vai reagindo ao que aparece, ao que chama mais atenção e ao que parece mais urgente.

Existe um padrão invisível aqui:
você até quer se organizar, quer render melhor, quer sentir que está no comando do dia,
mas, sem estrutura mínima, a sua energia se espalha antes de virar progresso.

E então acontece isso:
você decide demais, muda demais, responde demais e termina o dia com sensação de cansaço sem satisfação.

O seu problema não é só excesso de tarefa.  
É excesso de improviso.  
Esse é o padrão.

A sua combinação cria uma dinâmica muito específica:
você tem energia para fazer muita coisa;
mas, quando perde eixo, isso vira dispersão, ruído mental e acúmulo interno.

Na prática, isso pode aparecer assim:
• você começa o dia sem uma prioridade real  
• entra no celular ou no externo cedo demais  
• vai apagando incêndio e perde o essencial  
• decide muitas pequenas coisas ao longo do dia e cansa rápido  
• tenta compensar depois com pressão, culpa ou excesso de tarefa  

O ponto central do seu diagnóstico é esse:
a sua rotina não precisa de mais controle. Precisa de mais estrutura simples.

Estrutura simples, no seu caso, significa:
• uma prioridade por dia  
• um bloco fixo para o essencial  
• menos decisão desnecessária  
• menos ruído de manhã  
• mais repetição do básico

A sua virada não vem de planner bonito, lista perfeita ou promessa de “agora vai”.
Vem de criar um eixo tão simples que funcione até em dia ruim.

No seu perfil, rotina melhora quando:
• você para de começar o dia no automático  
• escolhe o essencial antes do urgente  
• reduz atrito  
• repete um mínimo inegociável  
• para de querer resolver tudo no mesmo dia  

No seu caso, organizar rotina não é ficar engessada.
É parar de desperdiçar energia com caos evitável.
Rotina boa não te prende.
Ela devolve força, clareza e presença.

Frase-mestra deste diagnóstico:
**Rotina não te prende. Rotina te devolve para o que importa.**
`, 7000);
  }

  // =========================
  // 5) CRESCER PROFISSIONALMENTE
  // =========================
  if (obj.includes('profissional')) {
    return clampStr(`
${nome}, o seu diagnóstico neste ciclo não é falta de capacidade.
É excesso de potência sem direção estável.

Você tem visão, repertório e vontade de crescer;
mas isso nem sempre vira avanço concreto porque a sua energia se dispersa antes de consolidar resultado.

Existe um padrão invisível aqui:
você pensa muito, aprende rápido, enxerga possibilidades;
mas nem sempre sustenta um movimento por tempo suficiente para gerar tração real.

E então acontece isso:
você começa forte, se empolga, visualiza crescimento…
mas muda direção cedo demais, se cobra rápido demais ou perde ritmo quando o retorno demora.

O seu problema não é falta de talento.  
É falta de sustentação no mesmo trilho.  
Esse é o padrão.

A sua combinação cria uma dinâmica muito específica:
você tem potência, leitura e visão estratégica;
mas, quando perde eixo, isso vira dispersão, autocrítica e excesso de movimento sem consolidação.

Na prática, isso pode aparecer assim:
• muitas ideias, poucos ciclos completos  
• aprender muito e expor pouco  
• alternar entre intensidade e queda de ritmo  
• mudar estratégia cedo demais  
• esperar clareza total para agir  

O ponto central do seu diagnóstico é esse:
crescimento profissional não depende de fazer mais. Depende de sustentar melhor.

Sustentar melhor, no seu caso, significa:
• escolher um foco principal  
• repetir a mesma mensagem por mais tempo  
• entregar antes de otimizar  
• parar de esperar o momento perfeito  
• transformar visão em movimento visível  

A sua virada não vem de mais planejamento.
Vem de continuidade.

Continuidade é o que gera:
• tração  
• posicionamento  
• autoridade  
• reconhecimento real  

No seu perfil, crescer profissionalmente acontece quando:
• você sustenta o mesmo movimento  
• para de mudar rota cedo demais  
• aparece com consistência  
• simplifica decisões  
• troca intensidade por presença contínua  

No seu caso, crescer não exige virar outra pessoa.
Exige parar de dispersar energia.

Frase-mestra deste diagnóstico:
**Crescimento não vem de pensar mais. Vem de sustentar melhor.**
`, 7000);
  }

  // fallback
  return clampStr(`
${nome}, seu diagnóstico neste ciclo mostra que o problema não é falta de potencial.
É falta de direção estável o suficiente para transformar energia em resultado.

Seu signo (${signo}) te move por ${s.motor}.
Seu elemento (${elemento}) traz ${e.assinatura}, mas no excesso cai em ${e.excesso}.
Seu número (${numN}) ativa ${n.essencia}, com sombra em ${n.sombra}.

A sua virada começa quando você para de negociar com o seu padrão repetido
e começa a sustentar o essencial.

Frase-mestra:
**Quando você escolhe um eixo e repete o simples, sua vida muda de resposta.**
`, 5000);
}


// ==========================================
// 1) DIAGNÓSTICO — SEU PADRÃO INVISÍVEL (PRO)
// Personaliza por: Signo + Elemento + Regente + Número + Objetivo + Amor/Trabalho
// Retorna TEXTO LONGO (pre-wrap), estilo “espelho + mapa”
// ==========================================

function buildDiagnosticoProfundo(ctx) {
  const {
    firstName,
    signo,
    elemento,
    regente,
    numN,
    numArch,
    objetivoPrincipal,
    birthFmt,
    local
  } = ctx;

  const s = SIGNO_PROFUNDO[signo] || SIGNO_PROFUNDO['Sagitário'];
  const r = REGENTE_PROFUNDO[regente] || {
    drive: 'direção',
    alerta: 'excesso',
    chave: 'constância'
  };
  const e = ESTILO_ELEMENTO[elemento] || ESTILO_ELEMENTO['Ar'];
  const nBase = NUMERO_PROFUNDO[numN] || NUMERO_PROFUNDO[7] || {};

  const n = {
    essencia: nBase.essencia || 'um potencial único',
    forca: nBase.forca || nBase.força || 'presença',
    sombra: nBase.sombra || 'um padrão que se repete',
    cura: nBase.cura || 'rotina mínima + consistência'
  };

  const localFmt = local ? titleCase(local) : '';
  const dadosNascimento = birthFmt
    ? `Você nasceu em ${birthFmt}${localFmt ? `, em ${localFmt}` : ''}.`
    : '';

  const abertura = [
    'Antes de tudo:',
    'o que aparece aqui não é opinião.',
    'É padrão.'
  ].join('\n');

  const combinacao = clampStr(
`${firstName}, a sua combinação ${signo} (${elemento} — ${regente}) com o número ${numN} não cria só um perfil.
Ela cria um campo interno muito específico: um jeito próprio de sentir, reagir, decidir e se movimentar pela vida.

Esse manual existe para colocar isso em palavras com clareza.
Porque quando o padrão ganha nome, ele deixa de te conduzir no automático.`,
    1800
  );

  const nascimento = dadosNascimento
    ? clampStr(
`${dadosNascimento}
Isso não é só informação biográfica.
Isso ajuda a explicar por que a sua energia funciona do jeito que funciona.`,
      700
    )
    : '';

  const blocoSigno = clampStr(
`O seu signo, ${signo}, te move por ${s.motor}.
Quando essa força está alinhada, ela te empurra para expansão, presença e direção.
Quando sai do eixo, o risco aparece em ${s.risco}.

A frase-mestra do seu signo neste manual é:
“${s.frase}”`,
    1600
  );

  const blocoRegencia = clampStr(
`A sua regência, ${regente}, mostra onde sua energia ganha potência, onde tende a exagerar e qual ajuste devolve direção.
No seu caso, a força está em ${r.drive}, o alerta está em ${r.alerta} e a chave está em ${r.chave}.`,
    1200
  );

  const blocoElemento = clampStr(
`O seu elemento, ${elemento}, traz ${e.assinatura}.
Isso explica parte importante do seu ritmo: como você entra em ação, como sente pressão e como perde o eixo.
O excesso costuma aparecer em ${e.excesso}.
A cura, no seu caso, não está em se controlar mais — está em ${e.cura}.

Neuro lembrete:
${e.neuro}.`,
    1600
  );

  const blocoNumero = clampStr(
`O seu número ${numN} ativa ${n.essencia}.
Essa configuração te dá ${n.forca}, mas também cria um ponto sensível: ${n.sombra}.
A sua chave evolutiva não está em fazer mais força.
Está em ${n.cura}.`,
    1400
  );

  const ponteObjetivo = hasValidChoice(objetivoPrincipal)
    ? clampStr(
`E é exatamente por isso que o seu objetivo atual não apareceu por acaso.
O que você busca agora revela, com bastante precisão, onde essa combinação está pedindo ajuste.`,
      900
    )
    : '';

  const diagnosticoObjetivo = buildDiagnosticoPorObjetivo({
    objetivoPrincipal,
    firstName,
    signo,
    elemento,
    regente,
    numN,
    numArch
  });

  const textoFinal = [
    abertura,
    combinacao,
    nascimento,
    blocoSigno,
    blocoRegencia,
    blocoElemento,
    blocoNumero,
    ponteObjetivo,
    diagnosticoObjetivo
  ]
    .filter(Boolean)
    .join('\n\n');

  return clampStr(textoFinal, 9000);
}

function gerarStopListAmor({ status, signo, numero }) {
  const s = (status || '').toLowerCase();
  const sig = (signo || '').toLowerCase();
  const num = Number(numero);

  const base = [
    'Parar de testar para “ver se a pessoa gosta”.',
    'Parar de confundir intensidade com conexão.',
    'Parar de exigir “certeza total” para se entregar um pouco.'
  ];

  if (s.includes('solteir')) base.unshift('Parar de aceitar migalhas só para não ficar sozinha.');
  else if (s.includes('fic')) base.unshift('Parar de agir como “já é” antes de existir consistência.');
  else if (s.includes('inst')) base.unshift('Parar de normalizar sumiço, ambiguidade e instabilidade.');
  else if (s.includes('nam')) base.unshift('Parar de engolir incômodos pequenos até virarem explosão.');
  else if (s.includes('cas')) base.unshift('Parar de viver no automático emocional e esquecer do vínculo.');

  if (sig.includes('câncer') || sig.includes('peixes')) base.push('Parar de absorver o humor do outro como se fosse responsabilidade sua.');
  if (num === 11 || num === 7) base.push('Parar de ler sinais demais e perguntar de menos.');

  return base.slice(0, 5);
}

function gerarStartListAmor({ status, signo, numero }) {
  const s = (status || '').toLowerCase();
  const sig = (signo || '').toLowerCase();
  const num = Number(numero);

  const base = [
    'Escolher pelo comportamento (constância), não só pela química.',
    'Pedir clareza cedo: “qual é a sua intenção aqui?”',
    'Confiar no corpo: calma é sinal, ansiedade é alerta.'
  ];

  if (s.includes('solteir')) base.unshift('Definir 3 não-negociáveis e filtrar por ação.');
  else if (s.includes('fic')) base.unshift('Criar “ritmo”: consistência por 2–3 semanas antes de se entregar.');
  else if (s.includes('inst')) base.unshift('Colocar limite com consequência (não com ameaça).');
  else if (s.includes('nam')) base.unshift('Fazer check-in semanal: “o que tá bom e o que precisa ajustar?”');
  else if (s.includes('cas')) base.unshift('Criar 1 ritual fixo do casal (20 min) para presença real.');

  if (sig.includes('sagit')) base.push('Combinar liberdade com respeito: espaço + acordo + constância.');
  if (num === 11) base.push('Aterrar a intuição com fatos: “o que ele faz repetidamente?”');

  return base.slice(0, 5);
}

function gerarFrasesProntasAmor({ status, signo, numero }) {
  const s = (status || '').toLowerCase();
  const num = Number(numero);

  const base = [
    'Eu gosto de constância. Se você não consegue, eu sigo.',
    'Eu não entro em ansiedade. Eu converso com clareza.',
    'Eu observo comportamento, não promessa.',
    'Se for para ser leve, eu topo. Se for para confundir, eu saio.'
  ];

  if (s.includes('solteir')) base.unshift('Eu não estou com pressa. Eu estou selecionando.');
  else if (s.includes('fic')) base.unshift('Eu gosto de calma e consistência. Vamos ver como isso evolui.');
  else if (s.includes('inst')) base.unshift('Eu preciso de estabilidade. Se não tem, eu me retiro.');
  else if (s.includes('nam')) base.unshift('Eu prefiro diálogo simples do que silêncio longo.');
  else if (s.includes('cas')) base.unshift('Quero presença de verdade, não só convivência.');

  if (num === 11) base.push('Intensidade sem constância não serve pra mim.');

  return base.slice(0, 6);
}

function buildRituals({ elemento, objPack }) {
  const objetivo = objPack?.label || 'clareza e virada';

  const curaElemento =
    ESTILO_ELEMENTO[elemento]?.cura || 'foco, presença e constância';

  const neuroElemento =
    ESTILO_ELEMENTO[elemento]?.neuro ||
    'menos ruído, mais execução simples e repetida';

  return clampStr(
`Você não precisa de rituais longos.
Precisa de rituais que entrem na sua vida real.
No seu perfil, ritual não serve para “parecer espiritual”. Serve para te tirar do automático mais rápido.
A forma certa de usar é simples: você escolhe o ritual pelo estado em que está — não pelo tempo que tem.

Ritual 1 — Quando houver aceleração interna (3 min)

Use quando:
• sua mente estiver corrida
• você sentir urgência sem clareza
• a ansiedade começar a subir
Passo a passo:
1) Respiração 4–4–6 por 1 minuto
2) Pergunta-chave: “o que é fato hoje?”
3) Escolha 1 ação mínima e real
Objetivo do ritual:
parar a espiral mental e voltar para direção.

Ritual 2 — Quando você estiver fora do eixo (5 min)

Use quando:
• estiver reativa
• sentir que se afastou de si
• estiver emocionalmente bagunçada
Passo a passo:
1) Postura aberta + olhar firme por 30 segundos
2) Visualize você agindo com constância por 2 minutos
3) Frase âncora: “eu volto para mim”
4) Faça 1 microação que prove isso
Objetivo do ritual:
voltar para identidade e presença.

Ritual 3 — Quando estiver adiando demais (7 min)

Use quando:
• souber o que precisa fazer
• mas estiver empurrando
• estiver esperando “clima”
Passo a passo:
1) Respiração por 1 minuto
2) Escreva a prioridade única do momento
3) Execute por 4 minutos sem pensar demais
4) Fechamento: “feito > perfeito”
Objetivo do ritual:
quebrar inércia e gerar tração real.

No seu caso, o que mais te reorganiza é:
${curaElemento}.
Neuro lembrete do seu perfil:
${neuroElemento}.

Leitura final deste bloco:

Ritual pequeno não muda sua vida sozinho.
Mas ritual pequeno + ação pequena + repetição constante muda completamente o seu padrão.

Você não precisa fazer perfeito.
Precisa só fazer sempre.`,
    6000
  );
}

function buildClosing({ elemento, objPack }) {
  const objetivo = objPack?.label || 'clareza e virada';

  let fraseCentral = 'sustentar o essencial';
  let mantra = 'Eu sustento o essencial. Eu executo. Eu viro a chave.';

  // PERSONALIZA POR OBJETIVO
  if (objetivo.includes('autoestima')) {
    fraseCentral = 'sustentar auto-respeito';
    mantra = 'Eu me respeito no pequeno. Eu sustento quem eu sou.';
  } else if (objetivo.includes('ansiedade')) {
    fraseCentral = 'sustentar clareza';
    mantra = 'Eu desacelero. Eu simplifico. Eu conduzo.';
  } else if (objetivo.includes('disciplina')) {
    fraseCentral = 'sustentar execução';
    mantra = 'Eu começo. Eu continuo. Eu termino.';
  } else if (objetivo.includes('rotina')) {
    fraseCentral = 'sustentar direção';
    mantra = 'Eu sigo o essencial. Eu não me disperso.';
  } else if (objetivo.includes('relacionamento')) {
    fraseCentral = 'sustentar limite';
    mantra = 'Eu escolho com calma. Eu sustento meu valor.';
  } else if (objetivo.includes('profissional')) {
    fraseCentral = 'sustentar consistência';
    mantra = 'Eu apareço. Eu executo. Eu sustento.';
  }

  // PERSONALIZA POR ELEMENTO
  let ajusteElemento = '';

  if (elemento === 'Fogo') {
    ajusteElemento = 'Seu desafio não é acelerar mais. É sustentar o ritmo.';
  } else if (elemento === 'Ar') {
    ajusteElemento = 'Seu desafio não é pensar mais. É dispersar menos.';
  } else if (elemento === 'Terra') {
    ajusteElemento = 'Seu desafio não é planejar mais. É travar menos.';
  } else if (elemento === 'Água') {
    ajusteElemento = 'Seu desafio não é sentir mais. É oscilar menos.';
  }

  return clampStr(
`Você não precisa mudar tudo de uma vez.
Precisa parar de abandonar o essencial.

Ao longo deste manual, uma coisa ficou clara:
o que te trava não é falta de potencial.
É padrão repetido.

E padrão repetido só muda quando decisão vira prática.

Seu selo de virada é simples:
1) Uma prioridade por vez
2) Uma ação por dia
3) Um limite por semana

Parece pouco.
Mas é exatamente o pouco certo que muda identidade.

No seu caso, virar a chave significa:
${fraseCentral}.

${ajusteElemento}

A virada começa quando decisão vira prática.

Agora escreva:
• O que eu paro hoje?
• O que eu começo hoje?
• O que eu sustento?

E lembre:
a vida muda quando você para de negociar com o que já sabe.
${mantra}`,
    5200
  );
}

export function generateManual(params = {}) {
  const nome = norm(params.nome);
  const firstName = pickFirstName(nome);

  const signo = titleCase(params.signo);
  const elemento = ELEMENTO_SIGNO[signo] || 'Ar';
  const regente = REGENTE_SIGNO[signo] || '';

  const numN = toLifePath(params.numeroVida);
  const archRaw = numeroArquetipo(numN || 0);
  const numArch = { ...archRaw, _n: numN || 0 };

const rawObj = norm(params.objetivoPrincipal);
const objetivoPrincipal = hasValidChoice(rawObj) ? titleCase(rawObj) : '';
const objPack = objetivoPerfil(objetivoPrincipal);

  const objective = buildObjectiveDeepDive({ objetivoPrincipal, elemento, numArch });

  const lovePack = loveFrame(params.relacaoStatus);
  const workPack = workFrame(params.trabalhoStatus);

  const birthFmt = fmtBirth(params.dataNascimentoISO);
  const local = norm(params.local);
  
  

  const ctx = {
    firstName,
    nome,
    signo,
    elemento,
    regente,
    numN,
    numArch,
    objetivoPrincipal,
    objPack,
    lovePack,
    workPack,
    birthFmt,
    local
  };

const moduloExtraArquetipos = buildModuloExtraArquetipos({
  firstName: ctx.firstName,
  signo: ctx.signo,
  elemento: ctx.elemento,
  numN: ctx.numN,
  objetivoPrincipal: ctx.objetivoPrincipal,
  objPack: ctx.objPack
});

  const moduloExtra = buildModuloExtraTipoPessoa({
  firstName,
  signo,
  elemento,
  regente,
  numN,
  objPack,
  lovePack,
  workPack
});

 const tipoPessoa = buildTipoPessoa({
  signo,
  elemento,
  regente,
  numN,
  numArch,
  objPack,
  relacaoStatus,
  trabalhoStatus,
  firstName
});

  // Conteúdos premium
  const intro = buildIntroText(ctx);
  const personalidade = buildPersonalityText(ctx);
  const blindSpot = buildBlindSpot({ elemento, numArch, objPack });

  const loveMeta = {
    meta: `${lovePack.meta}`,
    ...lovePack
  };
  const workMeta = {
    meta: `${workPack.meta}`,
    ...workPack
  };

  const blocks = buildBlocks({
    elemento,
    numArch,
    objPack,
    love: loveMeta,
    work: workMeta
  });

  const plan7 = buildPlan7({
    elemento,
    numN,
    objPack,
    love: loveMeta,
    work: workMeta
  });

const love = buildLove({
  elemento,
  numArch,
  lovePack,
  relacaoStatus: params.relacaoStatus,
  signo,
  firstName
});

// opcional: headline fixa
love.headline = 'Seu padrão afetivo real (e a virada)';
// ✅ opcional: também melhorar headline
love.headline = `Seu padrão afetivo real (e a virada)`;



function norm(s){ return (s ?? '').toString().trim(); }
function low(s){ return norm(s).toLowerCase(); }

function getMoneyPersonalizadoUAU({ nome, signo, numeroVida, objetivoPrincipal, trabalhoStatus }) {
  const first = norm(nome).split(' ')[0] || 'Você';
  const sign = low(signo);
  const num = String(numeroVida ?? '').trim();
  const obj = norm(objetivoPrincipal);
  const job = low(trabalhoStatus);

  const is11 = num === '11';
  const isFire = ['áries', 'aries', 'leão', 'leao', 'sagitário', 'sagitario'].includes(sign);
  const isSag = ['sagitário', 'sagitario'].includes(sign);

  const headline = 'Mapa do Dinheiro — prosperidade e bloqueios invisíveis';

  const subheadline = [
`${first}, no seu caso, o dinheiro não trava por falta de capacidade.
Trava por padrão emocional, comportamental e estratégico ao mesmo tempo.`,

`Existe uma dinâmica clara:
você enxerga rápido, começa com intensidade e acelera com facilidade.
Mas, quando o resultado não aparece no ritmo esperado, a constância diminui.`,

`O bloqueio não está na estratégia.
Está na sustentação.

A maioria das pessoas acha que dinheiro trava por falta de oportunidade.
No seu caso, trava quando existe:

• excesso de expectativa sobre resultado rápido  
• mudança de direção antes do tempo  
• esforço alto sem repetição suficiente  
• execução guiada por emoção, não por método  

Isso cria um ciclo invisível:

começo forte → expectativa alta → pouca resposta inicial → queda de energia → pausa → recomeço.`,

`O dinheiro cresce de outro jeito:

• quando existe menos urgência emocional  
• quando existe mais repetição estratégica  
• quando existe menos ajuste e mais execução  
• quando identidade pesa mais que motivação  

No seu perfil, prosperidade não vem de intensidade isolada.
Vem de ritmo sustentado.`,

`Destravar dinheiro e abundância, para você, significa mudar três coisas:

1) Relação com tempo  
Resultado financeiro exige repetição antes de resposta.

2) Relação com exposição  
Dinheiro cresce quando posicionamento vira rotina.

3) Relação com execução  
Movimento consistente vence talento irregular.`
].join('\n\n');

  const profile = [
    isFire
      ? 'Seu ritmo natural favorece ação rápida, coragem e começo forte.'
      : 'Seu perfil cresce melhor quando existe ritmo, previsibilidade e continuidade.',
    is11
      ? 'O número 11 amplia visão e sensibilidade, mas sem aterramento isso vira ruído mental e excesso de pressão interna.'
      : 'Seu número mostra que resultado cresce quando o simples é repetido por tempo suficiente.',
    obj
      ? `O seu objetivo atual (${obj}) influencia diretamente o dinheiro: quando há desalinhamento interno, a execução perde força.`
      : 'Quando há desalinhamento interno, a execução perde força e o dinheiro sente isso.'
  ];

  const objectiveBridge = obj
    ? `Conexão com o objetivo: no seu caso, prosperidade cresce quando dinheiro deixa de ser tratado como urgência emocional e passa a ser tratado como direção sustentada. O objetivo atual (${obj}) precisa aparecer na forma como você decide, executa e se posiciona.`
    : `Prosperidade cresce quando dinheiro deixa de ser tratado como urgência emocional e passa a ser tratado como direção sustentada.`;

  // BLOQUEIOS
  const blocks = [
    'Pressa silenciosa: existe urgência por resultado, e quando ele não vem rápido a constância cai.',
    'Intensidade sem direção: há esforço alto, mas nem sempre concentrado no que realmente gera retorno.',
    'Evitar exposição: visão existe, mas posicionamento e repetição ainda oscilam.',
    'Perfeccionismo funcional: ajustar demais vira desculpa elegante para adiar movimento real.',
    'Falta de repetição estratégica: o dinheiro responde mais à cadência do que ao talento isolado.'
  ];

  if (job.includes('clt')) {
    blocks.push('Segurança como escudo: a estabilidade da CLT pode virar justificativa para adiar o movimento que realmente expandiria renda.');
  } else if (job.includes('empre')) {
    blocks.push('Excesso de frentes: abrir muitas direções ao mesmo tempo enfraquece tração e previsibilidade.');
  } else if (job.includes('autôn') || job.includes('auton')) {
    blocks.push('Oscilação de posicionamento: quando a oferta muda demais, a percepção de valor também oscila.');
  } else if (job.includes('trans')) {
    blocks.push('Transição protegida demais: planejamento excessivo pode atrasar validação real e movimento concreto.');
  }

  // AÇÕES
  const actions = [
    'Escolher uma alavanca principal por vez e sustentar por alguns dias seguidos.',
    'Repetir a mesma ação comercial antes de reinventar estratégia.',
    'Transformar visibilidade em rotina: aparecer com constância vale mais do que aparecer impecável.',
    'Priorizar movimento real em vez de ajuste infinito.',
    'Criar uma cadência simples: 1 ação comercial por dia + 1 entrega concreta por dia.'
  ];

  if (job.includes('clt')) {
    actions.push('Definir um bloco fixo semanal para construir uma frente de renda fora da rotina principal.');
  } else if (job.includes('empre')) {
    actions.push('Reduzir complexidade: menos frentes, mais repetição da oferta principal.');
  } else if (job.includes('autôn') || job.includes('auton')) {
    actions.push('Consolidar uma mensagem clara de valor e sustentar essa narrativa por mais tempo.');
  } else if (job.includes('trans')) {
    actions.push('Testar movimento pequeno antes de esperar certeza grande.');
  }

  // MICRO-HÁBITOS
  const microHabits = [
    'Começar o dia com 1 tarefa que tenha relação direta com dinheiro.',
    'Fechar o dia com 1 entrega visível, mesmo simples.',
    'Revisar diariamente o que gerou retorno real.',
    'Reduzir ruído antes de começar a parte importante do dia.',
    'Repetir o que funciona em vez de reinventar sem necessidade.'
  ];

  if (is11) {
    microHabits.push('Criar higiene mental antes de dormir: menos tela, mais silêncio e menos excesso de estímulo.');
  }

  // SPRINT 7 DIAS
  const sprint7 = [
    'Dia 1: escolher 1 frente principal de geração de receita.',
    'Dia 2: escrever a mensagem central da oferta ou direção atual em 1 linha.',
    'Dia 3: executar 1 ação comercial concreta sem refinar demais.',
    'Dia 4: repetir a mesma ação, sem mudar estratégia cedo demais.',
    'Dia 5: revisar o que gerou resposta real e eliminar ruído.',
    'Dia 6: fazer 1 movimento visível de posicionamento.',
    'Dia 7: definir o que será repetido pelos próximos 7 dias.'
  ];

  return {
    headline,
    subheadline,
    profile,
    objectiveBridge,
    blocks,
    actions,
    microHabits,
    sprint7
  };
}

  const calendar = buildCalendar30({
    elemento,
    objPack
  });

  // MONEY (normal)
const money = buildMoney({
  elemento,
  numArch,
  workPack,
  objPack
});

// MONEY (UAU)
const moneyUAU = getMoneyPersonalizadoUAU({
  nome,
  signo,
  numeroVida: numN,
  objetivoPrincipal,
  trabalhoStatus: params.trabalhoStatus
});

  // Seções no formato do seu page.js
  const sections = [];

  // COVER
  sections.push({
    type: 'cover',
    title: ` Resumo`,
    subtitle: `Seu Manual de Virada`,
    meta: [
      `Signo: ${signo || '—'} • Elemento: ${elemento} • Regente: ${regente || '—'}`,
      `Número de Vida: ${numN || '—'} • Arquétipo: ${numArch?.nome || '—'}`,
      hasValidChoice(objetivoPrincipal) ? `Objetivo do ciclo: ${objetivoPrincipal}` : `Objetivo do ciclo: Clareza e virada`,
      birthFmt ? `Nascimento: ${birthFmt}${local ? ` • ${titleCase(local)}` : ''}` : (local ? `Local: ${titleCase(local)}` : '—'),
      `Inclui: Bloqueios invisíveis • Plano 7 dias • Rituais • Amor & Dinheiro • Calendário 30 dias`
    ]
  });

  // TEXT: Introdução
const diagnostico = buildDiagnosticoProfundo(ctx);

sections.push({
  type: 'text',
  title: ' Diagnóstico ',
  body: diagnostico
});

  sections.push({
  type: 'text',
  title: ' Tipo de Pessoa ',
  body: moduloExtra
});

sections.push(moduloExtraArquetipos);

sections.push({
  type: 'text',
  title: objective.title,
  body: objective.body
});

  // TEXT: Personalidade integrada
  sections.push({
    type: 'text',
    title: ' Leitura integrada ',
    body: personalidade
  });

  // TEXT: Ponto cego
  sections.push({
    type: 'text',
    title: ' Ponto cego ',
    body: blindSpot
  });

  // BULLETS: Bloqueios invisíveis
  sections.push({
    type: 'bullets',
    title: ' Bloqueios ',
    note: blocks.note,
    items: blocks.items
  });

  // PLAN7
  sections.push({
    type: 'plan7',
    title: ' Plano de 7 dias ',
    headline: plan7.headline,
    hook: plan7.hook,
    days: plan7.days,
    rituals: plan7.rituals,
    checkpoints: plan7.checkpoints
  });

  // TEXT: Rituais rápidos (3–7 min)
sections.push({
  type: 'text',
  title: ' Rituais ',
  body: buildRituals({ elemento, objPack })
});

  // LOVE
  sections.push({
    type: 'love',
    title: ' Amor',
    headline: love.headline,
    pattern: love.pattern,
    whatToStop: love.whatToStop,
    whatToStart: love.whatToStart,
    microScript: love.microScript
  });

  // MONEY
sections.push({
  type: 'money',
  title: ' Dinheiro',
   headline: moneyUAU.subheadline,
  subheadline: '',
  profile: moneyUAU.profile,
  objectiveBridge: moneyUAU.objectiveBridge,
  blocks: moneyUAU.blocks,
  actions: moneyUAU.actions,
  microHabits: moneyUAU.microHabits,
  sprint7: moneyUAU.sprint7,
});

  // CALENDAR 30
  sections.push({
    type: 'calendar30',
    title: ' Calendário ',
    weeks: calendar.weeks
  });

  // CLOSING
 // CLOSING
sections.push({
  type: 'closing',
  title: ' Fechamento ',
  body: buildClosing({ elemento, objPack }),
});

  return {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    params: {
      nome,
      signo,
      numeroVida: numN,
      objetivoPrincipal,
      relacaoStatus: norm(params.relacaoStatus),
      trabalhoStatus: norm(params.trabalhoStatus),
      local,
      dataNascimentoISO: norm(params.dataNascimentoISO)
    },
    sections
  };
}

export function renderManualMarkdown(manual) {
  // Converte sections -> markdown para copiar/colar em editor e gerar PDF
  if (!manual || !Array.isArray(manual.sections)) return '';

  const lines = [];
  lines.push(`# Manual Premium Completo`);
  lines.push('');
  if (manual?.params?.nome) lines.push(`**Nome:** ${manual.params.nome}`);
  if (manual?.params?.signo) lines.push(`**Signo:** ${manual.params.signo}`);
  if (manual?.params?.numeroVida) lines.push(`**Número de Vida:** ${manual.params.numeroVida}`);
  if (manual?.params?.objetivoPrincipal) lines.push(`**Objetivo:** ${manual.params.objetivoPrincipal}`);
  if (manual?.params?.dataNascimentoISO) lines.push(`**Nascimento:** ${manual.params.dataNascimentoISO}`);
  if (manual?.params?.local) lines.push(`**Local:** ${manual.params.local}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  manual.sections.forEach((s, idx) => {
    const title = norm(s.title) || `Seção ${idx + 1}`;
    const type = norm(s.type);

    // Cabeçalho
    lines.push(`## ${title}`);
    lines.push('');

    if (type === 'cover') {
      if (s.subtitle) {
        lines.push(`**${norm(s.subtitle)}**`);
        lines.push('');
      }
      safeArr(s.meta).forEach((m) => {
        lines.push(`- ${norm(m)}`);
      });
      lines.push('');
      lines.push('---');
      lines.push('');
      return;
    }

    if (type === 'toc') {
      safeArr(s.items).forEach((it) => lines.push(`- ${norm(it)}`));
      lines.push('');
      return;
    }

    if (type === 'text') {
      lines.push(norm(s.body));
      lines.push('');
      return;
    }

    if (type === 'bullets') {
      if (s.note) {
        lines.push(`> ${norm(s.note).replace(/\n/g, '\n> ')}`);
        lines.push('');
      }
      safeArr(s.items).forEach((it) => {
        const t = norm(it);
        // suporta blocos com quebras
        const parts = t.split('\n');
        lines.push(`- **${parts[0]}**`);
        for (let i = 1; i < parts.length; i++) {
          const p = norm(parts[i]);
          if (p) lines.push(`  - ${p.replace(/^•\s*/, '')}`);
        }
      });
      lines.push('');
      return;
    }

    if (type === 'plan7') {
      if (s.headline) lines.push(`**${norm(s.headline)}**\n`);
      if (s.hook) lines.push(norm(s.hook) + '\n');

      lines.push('### Passo a passo (7 dias)');
      safeArr(s.days).forEach((d) => lines.push(`- ${norm(d)}`));
      lines.push('');

      lines.push('### Rituais');
      safeArr(s.rituals).forEach((r) => lines.push(`- ${norm(r)}`));
      lines.push('');

      lines.push('### Checkpoints');
      safeArr(s.checkpoints).forEach((c) => lines.push(`- ${norm(c)}`));
      lines.push('');
      return;
    }

    if (type === 'love') {
      if (s.headline) lines.push(`**${norm(s.headline)}**\n`);
      if (s.pattern) lines.push(norm(s.pattern) + '\n');

      lines.push('### Pare de fazer isso');
      safeArr(s.whatToStop).forEach((x) => lines.push(`- ${norm(x)}`));
      lines.push('');

      lines.push('### Comece a fazer isso');
      safeArr(s.whatToStart).forEach((x) => lines.push(`- ${norm(x)}`));
      lines.push('');

      lines.push('### Frases prontas (sem joguinho)');
      safeArr(s.microScript).forEach((x) => lines.push(`- ${norm(x)}`));
      lines.push('');
      return;
    }

    if (type === 'money') {
  const clean = (t) =>
    norm(t)
      .replace(/\r\n/g, '\n')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '');

  // Headline
  if (s.headline) lines.push(`${clean(s.headline)}\n`);

  // Subheadline (parágrafos)
  if (s.subheadline) {
    clean(s.subheadline)
      .split(/\n\s*\n|\n/g)
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((p) => lines.push(`${p}\n`));
    lines.push('');
  }

  // Profile (bullets curtos “UAU”)
  if (Array.isArray(s.profile) && s.profile.length) {
    lines.push('### Seu perfil de dinheiro');
    s.profile.forEach((x) => lines.push(`- ${clean(x)}`));
    lines.push('');
  }

  // Ponte com objetivo
  if (s.objectiveBridge) {
    lines.push('### Conexão com seu objetivo');
    lines.push(`${clean(s.objectiveBridge)}\n`);
    lines.push('');
  }

  // Bloqueios
  lines.push('### Bloqueios');
  safeArr(s.blocks).forEach((x) => lines.push(`- ${clean(x)}`));
  lines.push('');

  // Ações práticas
  lines.push('### Ações práticas');
  safeArr(s.actions).forEach((x) => lines.push(`- ${clean(x)}`));
  lines.push('');

  // Micro-hábitos
  lines.push('### Micro-hábitos');
  safeArr(s.microHabits).forEach((x) => lines.push(`- ${clean(x)}`));
  lines.push('');

  // Sprint 7 dias (extra UAU)
  if (Array.isArray(s.sprint7) && s.sprint7.length) {
    lines.push('### Sprint de 7 dias (sem negociar)');
    s.sprint7.forEach((x) => lines.push(`- ${clean(x)}`));
    lines.push('');
  }

  return;
}

    if (type === 'calendar30') {
      safeArr(s.weeks).forEach((w) => {
        lines.push(`### ${norm(w.week)}`);
        lines.push('');
        if (w.focus) lines.push(`**Foco:** ${norm(w.focus)}\n`);
        safeArr(w.days).forEach((d) => lines.push(`- ${norm(d)}`));
        lines.push('');
      });
      return;
    }

    if (type === 'closing') {
      lines.push(norm(s.body));
      lines.push('');
      if (s.mantra) lines.push(`> **Mantra:** ${norm(s.mantra)}`);
      if (s.signature) lines.push(`\n_${norm(s.signature)}_`);
      lines.push('');
      return;
    }

    // fallback
    if (s.body) lines.push(norm(s.body));
    lines.push('');
  });

  return lines.join('\n');
}