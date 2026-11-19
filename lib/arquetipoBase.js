// lib/arquetipoBase.js
// Tabelas pequenas do arquétipo (elemento do signo, os 8 arquétipos, puxadores
// por elemento/número/objetivo e objetivoPerfil). Moram aqui, fora do
// manualgenerator.js, pra prévia grátis (/resultado, Selo do Arquétipo) não
// baixar o gerador inteiro do Manual (~50 KB gzip). O manualgenerator
// importa e reexporta tudo, então quem importa de lá continua funcionando.

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

export const ELEMENTO_SIGNO = {
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

export const ARQUETIPOS = {
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

export const ARQ_POR_ELEMENTO = {
  Fogo: ['GUERREIRO', 'MAGO', 'SOBERANO'],
  Terra: ['CONSTRUTOR', 'SOBERANO', 'SABIO'],
  Ar: ['SABIO', 'ORACULO', 'MAGO'],
  Água: ['CURADOR', 'AMANTE', 'ORACULO']
};

export const ARQ_POR_NUMERO = {
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

export const ARQ_POR_OBJETIVO = {
  'Reduzir Ansiedade': ['CURADOR', 'ORACULO', 'CONSTRUTOR'],
  'Ter Mais Disciplina': ['CONSTRUTOR', 'GUERREIRO', 'SOBERANO'],
  'Melhorar Autoestima': ['SOBERANO', 'AMANTE', 'GUERREIRO'],
  'Atrair Relacionamento Saudável': ['AMANTE', 'SOBERANO', 'CURADOR'],
  'Melhorar Meu Relacionamento Atual': ['CURADOR', 'SOBERANO', 'ORACULO'],
  'Crescer Profissionalmente': ['CONSTRUTOR', 'SABIO', 'SOBERANO'],
  'Organizar Minha Rotina': ['CONSTRUTOR', 'SABIO', 'GUERREIRO'],
  'Clareza e Virada': ['SABIO', 'ORACULO', 'CONSTRUTOR']
};

export function objetivoPerfil(obj) {
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
