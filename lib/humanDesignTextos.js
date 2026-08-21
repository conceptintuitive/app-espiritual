// lib/humanDesignTextos.js
// Textos amigáveis (PT-BR) pra exibir o resultado de calcularHumanDesign() na
// tela — separado de lib/humanDesign.js pra manter o motor de cálculo livre
// de texto de UI.

export const TIPO_DESCRICAO = {
  Generator: {
    titulo: 'Gerador',
    texto: 'Sua energia de vida é constante e responde ao mundo — o motor sacral funciona melhor reagindo do que iniciando. Você tem mais combustível que a maioria pra sustentar um trabalho, mas só quando ele realmente engaja essa energia; forçar um "sim" pra algo que não te acende de verdade costuma custar caro em frustração e cansaço.',
    comoAgir: 'Espere as coisas virem até você e responda com o corpo, não com a cabeça — um "sim" que dá vontade, ou um "não" que aperta o peito.',
  },
  'Manifesting Generator': {
    titulo: 'Gerador Manifestador',
    texto: 'Você tem a mesma energia de resposta do Gerador, mas com um atalho extra pra iniciativa — quando algo engaja de verdade, seu processo pula etapas que outras pessoas precisam seguir uma a uma. Isso rende eficiência real, mas também mal-entendidos: quem espera um passo a passo tradicional às vezes não acompanha seu ritmo.',
    comoAgir: 'Responda como o Gerador, mas se perceber que já sabe o próximo passo antes de terminar o atual, avise quem está por perto antes de sair executando — evita atrito.',
  },
  Manifestor: {
    titulo: 'Manifestador',
    texto: 'Você é feito pra iniciar, não pra esperar ser convidado. Sua energia não é constante como a de quem tem centro sacral definido — vem em rajadas, e depois de usada, precisa de descanso de verdade. O maior desafio não é ter ideias, é o impacto que gera nas pessoas ao redor quando age sem avisar.',
    comoAgir: 'Antes de agir, informe quem for afetado — não peça permissão, apenas avise. Isso dissolve boa parte da resistência que você normalmente sente vindo de fora.',
  },
  Projector: {
    titulo: 'Projetor',
    texto: 'Você não tem energia constante pra sustentar o ritmo dos tipos motores — mas em compensação, enxerga sistemas e pessoas com uma clareza que a maioria não tem. Sua energia rende melhor guiando do que fazendo em volume, e o reconhecimento certo (o convite certo, na hora certa) muda completamente sua experiência de vida.',
    comoAgir: 'Espere ser reconhecido e convidado antes de se oferecer ou insistir — principalmente em decisões grandes (trabalho, relacionamento). Cuidar do próprio descanso não é preguiça, é estratégia.',
  },
  Reflector: {
    titulo: 'Refletor',
    texto: 'Tipo raro — nenhum centro definido de forma fixa, o que te torna um espelho muito sensível do ambiente ao seu redor. Isso não é fraqueza: é uma capacidade única de sentir a saúde (ou a doença) de um grupo, lugar ou relação antes de qualquer outra pessoa perceber.',
    comoAgir: 'Decisões importantes pedem tempo — idealmente um ciclo lunar inteiro (~28 dias) de observação antes de fechar algo grande. O ambiente em que você está importa mais do que parece.',
  },
};

export const AUTORIDADE_DESCRICAO = {
  'Emocional (Solar Plexus)': {
    titulo: 'Autoridade Emocional',
    texto: 'Suas emoções não são ruído a ser ignorado na hora de decidir — são o próprio processo de decisão. Nenhuma clareza chega no calor do momento; ela vem depois de atravessar a onda emocional inteira, de um pico a um vale (ou vice-versa).',
    comoAgir: 'Nunca decida no "sim" ou "não" da primeira reação, especialmente sob pressão. Durma uma noite (ou mais, se for grande) antes de responder algo importante.',
  },
  Sacral: {
    titulo: 'Autoridade Sacral',
    texto: 'A resposta certa mora no corpo, não na análise. Um "sim" verdadeiro costuma vir como um impulso físico quase imediato; overthinking tende a atropelar esse sinal e substituí-lo por uma resposta mais "razoável", mas menos verdadeira.',
    comoAgir: 'Preste atenção na reação do corpo no primeiro segundo em que a pergunta é feita — antes de a mente entrar com argumentos.',
  },
  'Esplênica (Baço)': {
    titulo: 'Autoridade Esplênica',
    texto: 'Seu sistema de alerta é instantâneo e silencioso — não se repete, não grita, e é fácil de ignorar. É uma percepção ligada à sobrevivência e ao momento presente, não ao raciocínio sobre o passado ou o futuro.',
    comoAgir: 'Confie no primeiro sinal sutil, mesmo sem conseguir explicar racionalmente por quê. Ele não vai insistir uma segunda vez.',
  },
  'Ego Manifestado': {
    titulo: 'Autoridade do Ego (Coração)',
    texto: 'Suas decisões giram em torno de vontade própria e de compromissos que você genuinamente quer assumir — não do que "deveria" fazer por obrigação. Um "sim" real vem acompanhado de vontade de honrar a palavra dada.',
    comoAgir: 'Pergunte a si mesmo se você realmente quer se comprometer com isso — não se consegue, não se deveria, mas se quer.',
  },
  'Autoprojetada (G-Center)': {
    titulo: 'Autoridade Autoprojetada',
    texto: 'Sua clareza aparece ao falar em voz alta, não ao pensar em silêncio. Ouvir a própria voz narrando o assunto pra outra pessoa (mesmo que ela só escute) revela o que você realmente sente sobre o rumo a seguir.',
    comoAgir: 'Fale sobre a decisão com alguém de confiança antes de decidir sozinho na cabeça — preste atenção no tom da própria voz, não só nas palavras.',
  },
  'Lunar (Reflector)': {
    titulo: 'Autoridade Lunar',
    texto: 'Como Refletor, sua clareza não vem de um centro fixo — vem do tempo, acompanhando a Lua em seu ciclo de ~28 dias ao redor do seu mapa. É a autoridade mais lenta e também a mais raramente enganada.',
    comoAgir: 'Para decisões grandes, dê o tempo de um ciclo lunar inteiro antes de fechar — e converse com pessoas de confiança ao longo do caminho, não só no fim.',
  },
  'Mental / Ambiente (sem autoridade interna definida)': {
    titulo: 'Autoridade Mental / Ambiente',
    texto: 'Sem um centro motor conectado à garganta de forma definida, sua clareza tende a vir de fora — do ambiente certo, ou de processar a decisão em voz alta com outras pessoas, mais do que de uma sensação interna isolada.',
    comoAgir: 'Evite decidir sozinho e em silêncio. Busque conversar com 2-3 pessoas de confiança e observe em qual ambiente a decisão parece mais clara.',
  },
};

// ── Integração com o resto do mapa (Signo + Número de Vida + objetivo) ──────
// Diferencial sobre uma calculadora de Human Design genérica: essas nunca
// sabem o resto do mapa astrológico/numerológico da pessoa, então não têm
// como cruzar as duas coisas. Aqui a gente já tem os dois.

const ELEMENTO_DO_SIGNO = {
  'Áries': 'fogo', 'Leão': 'fogo', 'Sagitário': 'fogo',
  'Touro': 'terra', 'Virgem': 'terra', 'Capricórnio': 'terra',
  'Gêmeos': 'ar', 'Libra': 'ar', 'Aquário': 'ar',
  'Câncer': 'água', 'Escorpião': 'água', 'Peixes': 'água',
};

// tipo × elemento do Signo — como a energia do Tipo se expressa através do
// temperamento do elemento (não é uma "regra" de Human Design, é leitura
// combinada das duas linguagens).
const TIPO_ELEMENTO_INTEGRACAO = {
  Generator: {
    fogo: 'Seu Sol de fogo empurra pra ação rápida, mas sua energia sacral só rende de verdade quando responde a algo, não quando sai atirando pra todo lado. O ajuste fino: deixe o impulso do fogo escolher entre respostas reais, não inventar tarefas do nada.',
    terra: 'Terra e Gerador combinam bem — os dois quando engajados sustentam esforço longo sem drama. O risco aqui não é falta de energia, é continuar num "sim" antigo que já não acende mais só por hábito ou responsabilidade.',
    ar: 'Sua mente de ar quer decidir tudo pensando; seu corpo sacral decide sozinho, na hora. Quando os dois brigam, o corpo geralmente está certo — a mente só chega depois pra explicar.',
    água: 'Água intensifica a escuta emocional que seu corpo sacral já usa pra responder. Isso é ótimo quando você dá tempo pra sentir antes de responder, e complicado quando a emoção do momento se disfarça de resposta do corpo.',
  },
  'Manifesting Generator': {
    fogo: 'Fogo turbina o atalho natural do Gerador Manifestador — você já pula etapas, e o fogo quer pular ainda mais rápido. Vale MUITO avisar antes de agir aqui, porque a velocidade combinada confunde quem está ao seu redor.',
    terra: 'A terra dá chão pro seu jeito multitarefa — ajuda a terminar o que começa em vez de deixar rastro de projetos pela metade, que é o risco clássico desse Tipo.',
    ar: 'Ar acelera ainda mais um Tipo que já é rápido — boa combinação pra ideias, arriscada pra compromisso. Fale em voz alta o que decidiu antes de sair fazendo, ou ninguém acompanha.',
    água: 'A profundidade emocional da água pede pausa; a pressa do Gerador Manifestador empurra pra frente. Quando os dois colidem, a pausa emocional deveria ganhar — decisão rápida numa onda emocional alta raramente é a resposta real.',
  },
  Manifestor: {
    fogo: 'Fogo e Manifestador juntam duas fontes de iniciativa — a energia de começar fica forte. É ainda mais importante avisar antes de agir, porque a combinação tende a atropelar sem perceber.',
    terra: 'A terra segura o impulso do Manifestador tempo suficiente pra ele virar plano, não só rajada. Use isso a seu favor: deixe a ideia assentar um pouco antes de anunciar o próximo passo.',
    ar: 'Ar dá ao Manifestador as palavras certas pra avisar bem — comunicar antes de agir fica mais natural, e isso dissolve boa parte da resistência que você costuma sentir vindo dos outros.',
    água: 'Água traz profundidade emocional a rajadas que, por natureza, são rápidas. Vale checar se o impulso é mesmo seu ou é a maré emocional do momento antes de anunciar algo grande.',
  },
  Projector: {
    fogo: 'O fogo empurra pra agir antes de ser convidado — exatamente o que mais desgasta um Projetor. Quando sentir essa pressa, é sinal de esperar mais, não de acelerar.',
    terra: 'Terra ajuda o Projetor a construir a expertise que puxa o reconhecimento certo — a paciência prática desse elemento é uma aliada rara pra esse Tipo.',
    ar: 'Ar e Projetor combinam bem: a clareza mental de enxergar o sistema todo (natural do Projetor) fica ainda mais afiada, e isso é justamente o que atrai o convite certo.',
    água: 'Água aprofunda a leitura fina que o Projetor já tem sobre as pessoas — ótimo pra guiar de verdade, arriscado se a sensibilidade emocional virar desgaste por absorver demais do ambiente.',
  },
  Reflector: {
    fogo: 'O fogo pede decisão rápida; o Refletor precisa do ciclo lunar inteiro. Esse é o maior atrito do seu mapa — reconhecer a pressa do fogo como um sinal pra desacelerar, não pra ceder.',
    terra: 'Terra ajuda a segurar a rotina enquanto o ciclo de observação do Refletor corre no tempo dele — uma base prática que estabiliza um Tipo naturalmente variável.',
    ar: 'Ar traz palavras pra nomear o que o Refletor sente do ambiente — conversar com pessoas de confiança durante o ciclo de decisão fica mais natural e mais rico.',
    água: 'Água intensifica ainda mais a esponja emocional que o Refletor já é. Cuidar de onde e com quem você passa tempo não é luxo, é a diferença entre um mapa saudável e um exausto.',
  },
};

const OBJETIVOS_VALIDOS = [
  'Amor e Relacionamentos',
  'Carreira e Propósito',
  'Dinheiro e Abundância',
  'Autoconhecimento',
];

// tipo × objetivo declarado no formulário — plano de ação de 2-3 passos.
const TIPO_OBJETIVO_ACAO = {
  Generator: {
    'Amor e Relacionamentos': ['Só avance com quem realmente te dá vontade no corpo — não com quem "faz sentido no papel".', 'Perceba quando está num relacionamento por hábito, não por resposta real.'],
    'Carreira e Propósito': ['Deixe de lado o plano de carreira perfeito no papel; responda às oportunidades reais que aparecem.', 'Se um trabalho não acende energia, é sinal pra mudar, não pra insistir mais.'],
    'Dinheiro e Abundância': ['Evite decisões financeiras tomadas por medo ou pressa — espere a resposta do corpo.', 'Construa renda em cima do que você já faz de bom quando engajado, não do que parece "seguro".'],
    'Autoconhecimento': ['Preste atenção em que tipo de pergunta faz seu corpo responder rápido, sem pensar.', 'Anote por uma semana quando você disse "sim" por impulso genuíno x por obrigação.'],
  },
  'Manifesting Generator': {
    'Amor e Relacionamentos': ['Avise seu par quando mudar de ideia rápido — seu ritmo confunde quem não está acostumado.', 'Não force compromisso só porque "já é hora"; espere o corpo confirmar.'],
    'Carreira e Propósito': ['Aceite pular etapas quando fizer sentido, mas comunique isso pra equipe — evita desconfiança.', 'Termine ao menos um projeto por vez antes de abrir outro, mesmo que a vontade seja iniciar tudo junto.'],
    'Dinheiro e Abundância': ['Diversifique fontes de renda em coisas que realmente engajam — multitarefa é sua força aqui.', 'Cuidado com decisões financeiras rápidas demais; confirme com o corpo antes de assinar algo.'],
    'Autoconhecimento': ['Observe se sua pressa é energia real ou fuga de ficar parado.', 'Pergunte-se, antes de abandonar algo: "isso parou de acender, ou eu só quero pular pra próxima coisa?"'],
  },
  Manifestor: {
    'Amor e Relacionamentos': ['Avise seu par antes de tomar decisões grandes sozinho — evita a sensação de "atropelamento".', 'Aceite que seu par pode precisar de mais tempo de resposta que você.'],
    'Carreira e Propósito': ['Inicie o projeto que está represado — ninguém mais vai dar a largada por você.', 'Comunique o plano antes de executar; isso dissolve resistência que parece "vinda do nada".'],
    'Dinheiro e Abundância': ['Não espere aprovação pra agir sobre uma oportunidade financeira clara — apenas avise quem for afetado.', 'Guarde parte do resultado das rajadas de energia pra sustentar os períodos de descanso.'],
    'Autoconhecimento': ['Observe o padrão: você inicia e depois esgota — respeite a pausa como parte do processo, não como falha.', 'Note quando a resistência das pessoas vem de você não ter avisado, não de você estar errado.'],
  },
  Projector: {
    'Amor e Relacionamentos': ['Espere ser convidado a se aprofundar — insistir de fora costuma desgastar mais que ajudar.', 'Seja claro sobre seu limite de energia social com seu par.'],
    'Carreira e Propósito': ['Construa reconhecimento mostrando sua leitura fiel do sistema, não competindo em volume de trabalho.', 'Recuse convites que não reconhecem seu valor real — esperar o certo rende mais que aceitar qualquer um.'],
    'Dinheiro e Abundância': ['Cobre pelo seu direcionamento, não pelas horas — sua energia não é feita pra escalar em volume.', 'Descanso agendado é parte do orçamento, não um luxo cortável.'],
    'Autoconhecimento': ['Repare em quais ambientes te esgotam rápido e quais te sustentam por mais tempo.', 'Note a diferença entre cansaço físico normal e o esgotamento de energia que não é sua pra sustentar.'],
  },
  Reflector: {
    'Amor e Relacionamentos': ['Dê pelo menos um ciclo lunar antes de decisões grandes de relacionamento.', 'Preste atenção em como você se sente diferente em ambientes diferentes com essa pessoa.'],
    'Carreira e Propósito': ['Escolha ambientes de trabalho saudáveis antes de escolher o cargo em si — o lugar te afeta mais que o cargo.', 'Não assine nada importante sem consultar 2-3 pessoas de confiança primeiro.'],
    'Dinheiro e Abundância': ['Evite decisões financeiras por impulso — o tempo revela se a oportunidade era real.', 'Observe se o ambiente ao redor do dinheiro (sócios, lugar) é saudável antes de entrar.'],
    'Autoconhecimento': ['Registre como você se sente em lugares diferentes por algumas semanas — o padrão revela muito sobre você.', 'Lembre-se: sua clareza não é falha por demorar mais — é assim que seu tipo funciona.'],
  },
};

/**
 * Cruza o Tipo de Human Design com o Signo, Número de Vida e objetivo
 * declarado no formulário — o que uma calculadora de HD isolada não
 * consegue fazer, porque não conhece o resto do mapa da pessoa.
 *
 * @returns {{ textoIntegracao: string, planoAcao: string[] } | null}
 */
export function gerarIntegracaoHumanDesign({ tipo, signo, numeroVida, objetivoPrincipal }) {
  if (!tipo) return null;

  const elemento = ELEMENTO_DO_SIGNO[signo] || null;
  const integracaoElemento = elemento ? TIPO_ELEMENTO_INTEGRACAO[tipo]?.[elemento] : null;

  const objetivoValido = OBJETIVOS_VALIDOS.includes(objetivoPrincipal) ? objetivoPrincipal : null;
  const planoAcao = objetivoValido ? (TIPO_OBJETIVO_ACAO[tipo]?.[objetivoValido] || []) : [];

  const partes = [];
  if (signo && integracaoElemento) {
    partes.push(`Combinando com seu Sol em ${signo}: ${integracaoElemento}`);
  }
  if (numeroVida) {
    partes.push(`Seu Número de Vida ${numeroVida} soma outra camada a essa leitura — vale ver as duas juntas no seu manual completo.`);
  }

  return {
    textoIntegracao: partes.join(' '),
    planoAcao,
  };
}

export function narracaoHumanDesign(hd) {
  if (!hd) return '';
  const tipo = TIPO_DESCRICAO[hd.tipo];
  const autoridade = AUTORIDADE_DESCRICAO[hd.autoridade];
  const parts = [
    `Seu Tipo é ${tipo?.titulo ?? hd.tipo}.`,
    tipo?.texto ?? '',
    `Sua Autoridade é ${autoridade?.titulo ?? hd.autoridade}.`,
    autoridade?.texto ?? '',
    `Seu Perfil é ${hd.perfil}.`,
  ];
  return parts.filter(Boolean).join(' ');
}
