//código que estou usando manualcompleto

// lib/manual-completo.js

const ELEMENTOS_SIGNOS = {
  'Áries': 'Fogo', 'Touro': 'Terra', 'Gêmeos': 'Ar', 'Câncer': 'Água',
  'Leão': 'Fogo', 'Virgem': 'Terra', 'Libra': 'Ar', 'Escorpião': 'Água',
  'Sagitário': 'Fogo', 'Capricórnio': 'Terra', 'Aquário': 'Ar', 'Peixes': 'Água'
};

const REGENTES = {
  'Áries': 'Marte', 'Touro': 'Vênus', 'Gêmeos': 'Mercúrio', 'Câncer': 'Lua',
  'Leão': 'Sol', 'Virgem': 'Mercúrio', 'Libra': 'Vênus', 'Escorpião': 'Plutão',
  'Sagitário': 'Júpiter', 'Capricórnio': 'Saturno', 'Aquário': 'Urano', 'Peixes': 'Netuno'
};

const ARQUETIPOS_POR_NUMERO = {
  1: { principal: 'O Guerreiro', luz: ['Liderança', 'Coragem'], sombra: ['Autoritarismo'], missao: 'Liderar.' },
  2: { principal: 'O Diplomata', luz: ['Empatia'], sombra: ['Codependência'], missao: 'Harmonizar.' },
  3: { principal: 'O Comunicador', luz: ['Criatividade'], sombra: ['Dispersão'], missao: 'Expressar.' },
  4: { principal: 'O Construtor', luz: ['Disciplina'], sombra: ['Rigidez'], missao: 'Construir.' },
  5: { principal: 'O Explorador', luz: ['Liberdade'], sombra: ['Instabilidade'], missao: 'Explorar.' },
  6: { principal: 'O Cuidador', luz: ['Amor'], sombra: ['Sacrifício'], missao: 'Curar.' },
  7: { principal: 'O Sábio', luz: ['Sabedoria'], sombra: ['Isolamento'], missao: 'Ensinar.' },
  8: { principal: 'O Manifestador', luz: ['Poder'], sombra: ['Materialismo'], missao: 'Manifestar.' },
  9: { principal: 'O Humanitário', luz: ['Compaixão'], sombra: ['Martírio'], missao: 'Servir.' },
  11: { principal: 'O Iluminado', luz: ['Intuição'], sombra: ['Ansiedade'], missao: 'Iluminar.' },
  22: { principal: 'O Mestre Construtor', luz: ['Visão'], sombra: ['Pressão'], missao: 'Construir legados.' },
  33: { principal: 'O Mestre Curador', luz: ['Amor universal'], sombra: ['Esgotamento'], missao: 'Curar massas.' }
};

// Adicione estas funções NO INÍCIO do arquivo lib/manual-completo.js
// (depois das constantes ELEMENTOS_SIGNOS, REGENTES, ARQUETIPOS_POR_NUMERO)

// ==================== ANÁLISE NUMEROLÓGICA COMPLETA ====================

function calcularNumeroVida(dia, mes, ano) {
  const soma = parseInt(dia) + parseInt(mes) + ano;
  return reduzirNumero(soma);
}

function calcularNumeroExpressao(nomeCompleto) {
  const tabela = {
    A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
    J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
    S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8
  };
  const soma = nomeCompleto.toUpperCase().replace(/[^A-Z]/g, '').split('')
    .reduce((acc, letra) => acc + (tabela[letra] || 0), 0);
  return reduzirNumero(soma);
}

function calcularNumeroMotivacao(nomeCompleto) {
  const tabela = {
    A:1, E:5, I:9, O:6, U:3
  };
  const soma = nomeCompleto.toUpperCase().replace(/[^A-Z]/g, '').split('')
    .reduce((acc, letra) => acc + (tabela[letra] || 0), 0);
  return reduzirNumero(soma);
}

function calcularNumeroPersonalidade(nomeCompleto) {
  const tabelaConsoantes = {
    B:2, C:3, D:4, F:6, G:7, H:8, J:1, K:2, L:3,
    M:4, N:5, P:7, Q:8, R:9, S:1, T:2, V:4, W:5, X:6, Y:7, Z:8
  };
  const soma = nomeCompleto.toUpperCase().replace(/[^A-Z]/g, '').split('')
    .reduce((acc, letra) => acc + (tabelaConsoantes[letra] || 0), 0);
  return reduzirNumero(soma);
}

function calcularAnoPessoal(dia, mes, ano) {
  return reduzirNumero(parseInt(dia) + parseInt(mes) + ano);
}

// ==================== INTERPRETAÇÕES PROFUNDAS ====================

const INTERPRETACOES_NUMERO_VIDA = {

  1: {
    titulo: "O Pioneiro - Liderança e Independência",
    essencia: `O Número de Vida 1 é o número do início, da coragem e da liderança natural. Você nasceu para abrir caminhos onde outros ainda não ousaram ir. Sua energia é pioneira, original e independente.

O 1 representa o líder nato, aquele que não teme ser o primeiro. Você tem uma força interior incrível e uma capacidade de se reinventar que impressiona. Quando algo precisa começar, você está lá.`,
    
    missao: `Sua Missão de Alma é liderar pelo exemplo, inspirar outros a encontrarem sua própria força e abrir novos caminhos. Você veio para iniciar projetos, movimentos e ideias que transformam o mundo.`,
    
    dons: 
    
  `- Coragem inata para começar do zero

- Liderança natural que inspira confiança

- Independência e autoconfiança

- Capacidade de inovar e criar tendências

- Força de vontade excepcional`,
    
    sombra: 
    
  `No lado sombra, o 1 pode manifestar:

- Autoritarismo e teimosia

- Dificuldade em pedir ajuda ou trabalhar em equipe

- Impaciência com o ritmo dos outros

- Egoísmo disfarçado de autoconfiança

- Necessidade excessiva de controle`,
    
    luz: 
    
  `Quando alinhado, o 1 manifesta:

- Liderança inspiradora e não autoritária

- Coragem para defender causas justas

- Capacidade de motivar multidões

- Inovação constante

- Independência saudável que inspira outros a também serem livres`,
    
    relacionamentos: `Em relacionamentos, você precisa de um parceiro que respeite sua independência e que não se sinta intimidado pela sua força. Você ama profundamente, mas precisa de espaço para ser quem é.`,
    
    carreira: `Carreiras ideais: Empreendedorismo, cargos de liderança, áreas que exigem inovação, esportes competitivos, qualquer área onde você possa ser o pioneiro.`,
    
    desafio: `Seu maior desafio é aprender que força verdadeira não é controlar tudo, mas saber quando liderar e quando deixar outros brilharem também.`
  },

  2: {
    titulo: "O Diplomata - Harmonia e Sensibilidade",
    essencia: `O Número de Vida 2 carrega a energia da diplomacia, da cooperação e da sensibilidade profunda. Você nasceu para unir, para construir pontes e para trazer paz onde há conflito.

O 2 é o número da dualidade, da parceria e do equilíbrio. Você sente as emoções dos outros como se fossem suas e tem um dom natural para mediar situações difíceis. Sua presença acalma.`,
    
    missao: `Sua Missão de Alma é criar harmonia, facilitar conexões genuínas entre pessoas e trazer equilíbrio para situações de conflito. Você veio para ensinar que a verdadeira força está na união, não na divisão.`,
    
    dons: `- Empatia profunda e genuína
- Capacidade de mediar conflitos com sabedoria
- Intuição aguçada sobre pessoas
- Dom para criar parcerias duradouras
- Paciência e diplomacia naturais`,
    
    sombra: `No lado sombra, o 2 pode manifestar:
- Codependência emocional
- Dificuldade extrema em dizer "não"
- Perder-se no outro, esquecendo de si mesmo
- Indecisão paralisante
- Necessidade excessiva de aprovação`,
    
    luz: `Quando alinhado, o 2 manifesta:
- Cooperação saudável sem perder identidade
- Equilíbrio perfeito entre dar e receber
- Intuição que guia decisões certas
- Capacidade de unir pessoas com propósitos comuns
- Paz interior que irradia para fora`,
    
    relacionamentos: `Você foi feito para parcerias profundas. Relacionamentos são sua escola de alma. Você ama intensamente e precisa de reciprocidade genuína. Aprenda a manter sua individualidade dentro da união.`,
    
    carreira: `Carreiras ideais: Psicologia, mediação, recursos humanos, terapias, consultoria, áreas que envolvem colaboração e trabalho em equipe.`,
    
    desafio: `Seu maior desafio é aprender que cuidar dos outros não significa se anular. Você pode amar profundamente sem perder quem você é.`
  },

  3: {
    titulo: "O Comunicador - Criatividade e Expressão",
    essencia: `O Número de Vida 3 é o número da criatividade, da comunicação e da alegria de viver. Você nasceu para expressar, criar e trazer cor para um mundo que às vezes é cinza demais.

O 3 representa a criança interior que nunca morre, o artista que vê beleza onde outros veem o comum. Você tem um dom natural para palavras, arte, música — qualquer forma de expressão criativa.`,
    
    missao: `Sua Missão de Alma é expressar verdades através da arte, da palavra e da criatividade. Você veio para lembrar ao mundo que a vida pode ser leve, que a alegria é um caminho válido e que criar é sagrado.`,
    
    dons: `- Criatividade sem limites
- Dom natural para comunicação
- Otimismo contagiante
- Capacidade de transformar dor em arte
- Magnetismo pessoal único`,
    
    sombra: `No lado sombra, o 3 pode manifestar:
- Dispersão de energia em muitos projetos sem concluir nenhum
- Superficialidade emocional
- Uso do humor para fugir de emoções profundas
- Necessidade excessiva de atenção
- Drama desnecessário`,
    
    luz: `Quando alinhado, o 3 manifesta:
- Criatividade que inspira multidões
- Comunicação clara e impactante
- Alegria genuína que eleva ambientes
- Capacidade de motivar através de histórias
- Autoexpressão autêntica`,
    
    relacionamentos: `Você precisa de um parceiro que entenda sua necessidade de expressão e que não se sinta ameaçado pelo seu brilho. Relacionamentos monótonos sufocam você.`,
    
    carreira: `Carreiras ideais: Artes (música, escrita, teatro), marketing, publicidade, mídia, qualquer área que envolva criação e comunicação.`,
    
    desafio: `Seu maior desafio é aprender a focar sua energia criativa em projetos significativos, em vez de se dispersar. Profundidade pode coexistir com leveza.`
  },

  4: {
    titulo: "O Construtor - Disciplina e Estabilidade",
    essencia: `O Número de Vida 4 é o alicerce, a base sólida sobre a qual tudo se constrói. Você nasceu para criar estruturas duradouras, para trazer ordem ao caos e para construir legados que permanecem.

O 4 representa o trabalho árduo, a disciplina e a confiabilidade. Enquanto outros sonham, você constrói. Você tem uma capacidade única de transformar ideias abstratas em realidade tangível.`,
    
    missao: `Sua Missão de Alma é criar fundações sólidas — sejam negócios, famílias, sistemas ou projetos — que resistam ao tempo. Você veio para ensinar que o trabalho consistente supera o talento inconsistente.`,
    
    dons: `- Disciplina inabalável
- Capacidade de organizar o caos
- Confiabilidade que inspira confiança
- Praticidade e senso de realidade
- Persistência até o fim`,
    
    sombra: `No lado sombra, o 4 pode manifestar:
- Rigidez mental e resistência à mudança
- Workaholismo destrutivo
- Perfeccionismo paralisante
- Dificuldade com espontaneidade
- Controle excessivo`,
    
    luz: `Quando alinhado, o 4 manifesta:
- Estruturas que servem ao bem maior
- Trabalho que inspira outros a serem produtivos
- Estabilidade que permite que outros cresçam
- Organização que cria liberdade
- Disciplina flexível`,
    
    relacionamentos: `Você é leal até o fim. Relacionamentos para você são compromissos sérios. Você precisa de um parceiro que valorize estabilidade tanto quanto você, mas que te ajude a relaxar também.`,
    
    carreira: `Carreiras ideais: Engenharia, arquitetura, gestão de projetos, contabilidade, construção civil, qualquer área que exija planejamento e execução meticulosa.`,
    
    desafio: `Seu maior desafio é aprender que nem tudo precisa ser controlado ou planejado. A vida também acontece nos imprevistos, e isso é beleza, não caos.`
  },

  5: {
    titulo: "O Explorador - Liberdade e Mudança",
    essencia: `O Número de Vida 5 é a energia da liberdade, da aventura e da mudança constante. Você nasceu para experienciar TUDO que a vida oferece — e não se contentar com menos.

O 5 representa o explorador, o eterno aprendiz, aquele que não cabe em caixas. Você tem uma curiosidade insaciável e uma necessidade profunda de variedade. Para você, rotina é prisão.`,
    
    missao: `Sua Missão de Alma é expandir horizontes — os seus e os dos outros. Você veio para mostrar que a vida é vasta, que há sempre algo novo para aprender e que liberdade é o bem mais precioso.`,
    
    dons: `- Adaptabilidade excepcional
- Coragem para mudanças radicais
- Curiosidade que leva a aprendizados profundos
- Versatilidade em múltiplas áreas
- Magnetismo através da autenticidade`,
    
    sombra: `No lado sombra, o 5 pode manifestar:
- Instabilidade crônica
- Fuga de compromissos
- Impulsividade destrutiva
- Dificuldade em criar raízes
- Excesso (comida, bebida, experiências)`,
    
    luz: `Quando alinhado, o 5 manifesta:
- Liberdade responsável
- Mudanças estratégicas e conscientes
- Adaptabilidade que resolve crises
- Aprendizado contínuo aplicado
- Aventura que inspira, não destrói`,
    
    relacionamentos: `Você precisa de um parceiro que entenda sua necessidade de espaço e não tente te prender. Relacionamentos para você são aventuras compartilhadas, não gaiolas douradas.`,
    
    carreira: `Carreiras ideais: Jornalismo, turismo, vendas, consultoria, empreendedorismo, qualquer área que ofereça variedade e liberdade.`,
    
    desafio: `Seu maior desafio é aprender que compromisso não é prisão e que profundidade exige tempo. Algumas raízes são necessárias, mesmo para quem tem asas.`
  },

  6: {
    titulo: "O Cuidador - Amor e Responsabilidade",
    essencia: `O Número de Vida 6 carrega a energia do amor incondicional, do cuidado e da responsabilidade profunda. Você nasceu para nutrir, curar e criar beleza no mundo.

O 6 é o número da família, da harmonia e do serviço. Você sente uma necessidade profunda de cuidar — de pessoas, de animais, do planeta. Seu coração é enorme e sua capacidade de amar, infinita.`,
    
    missao: `Sua Missão de Alma é curar através do amor, criar lares (físicos e emocionais) onde outros possam se sentir seguros e ensinar que cuidar é um dos atos mais poderosos que existem.`,
    
    dons: `- Amor genuinamente incondicional
- Capacidade de criar harmonia e beleza
- Responsabilidade profunda
- Dom natural para cuidar e nutrir
- Senso estético refinado`,
    
    sombra: `No lado sombra, o 6 pode manifestar:
- Autossacrifício destrutivo
- Controle disfarçado de cuidado
- Perfeccionismo paralisante
- Dificuldade em receber
- Síndrome do salvador`,
    
    luz: `Quando alinhado, o 6 manifesta:
- Amor que empodera, não sufoca
- Cuidado que respeita limites
- Beleza que eleva espaços
- Responsabilidade equilibrada
- Família/comunidade saudável`,
    
    relacionamentos: `Você foi feito para amar profundamente. Relacionamentos são sagrados para você. Mas aprenda: amar não é se anular. Você pode cuidar sem se perder.`,
    
    carreira: `Carreiras ideais: Educação, saúde, terapias, design de interiores, nutrição, qualquer área que envolva cuidar ou embelezar.`,
    
    desafio: `Seu maior desafio é aprender que você também merece ser cuidado. Que dizer "não" não é egoísmo. Que amor próprio vem antes de amor aos outros.`
  },

  7: {
    titulo: "O Sábio - Busca e Espiritualidade",
    essencia: `O Número de Vida 7 é o número do místico, do pesquisador, daquele que busca verdades profundas além da superfície. Você nasceu para questionar tudo e encontrar respostas que transcendem o óbvio.

O 7 representa a busca espiritual, o conhecimento esotérico e a necessidade de solidão para processar. Você não se contenta com respostas rasas — você quer saber O PORQUÊ por trás de tudo.`,
    
    missao: `Sua Missão de Alma é buscar e compartilhar sabedoria profunda. Você veio para ser o professor, o guia espiritual, aquele que ilumina caminhos para outros através do conhecimento que adquiriu.`,
    
    dons: `- Intuição profundamente aguçada
- Capacidade analítica excepcional
- Conexão espiritual natural
- Amor pelo conhecimento
- Sabedoria que transcende idade`,
    
    sombra: `No lado sombra, o 7 pode manifestar:
- Isolamento excessivo
- Ceticismo que vira cinismo
- Arrogância intelectual
- Dificuldade com emoções
- Fuga do mundo material`,
    
    luz: `Quando alinhado, o 7 manifesta:
- Sabedoria acessível e humilde
- Equilíbrio entre espírito e matéria
- Ensino que transforma vidas
- Pesquisa que beneficia a humanidade
- Espiritualidade prática`,
    
    relacionamentos: `Você precisa de um parceiro que respeite sua necessidade de solidão e que compartilhe seu amor por conversas profundas. Superficialidade sufoca você.`,
    
    carreira: `Carreiras ideais: Pesquisa, espiritualidade, filosofia, ciência, escrita, qualquer área que envolva buscar verdades profundas.`,
    
    desafio: `Seu maior desafio é aprender que sabedoria sem amor é vazia. Que conexão humana é tão importante quanto conexão espiritual. Que solidão é diferente de isolamento.`
  },

  8: {
    titulo: "O Manifestador - Poder e Abundância",
    essencia: `O Número de Vida 8 é o número do poder, da manifestação material e da abundância. Você nasceu para construir impérios — sejam financeiros, empresariais ou de impacto social.

O 8 representa o mestre da matéria, aquele que entende as leis da abundância e sabe como aplicá-las. Você tem uma capacidade única de transformar ideias em resultados tangíveis e impressionantes.`,
    
    missao: `Sua Missão de Alma é manifestar abundância e usar seu poder para elevar outros. Você veio para provar que sucesso material e integridade espiritual podem coexistir — e devem.`,
    
    dons: `- Visão estratégica de longo prazo
- Capacidade de manifestar abundância
- Liderança natural em negócios
- Senso de justiça aguçado
- Autoridade que inspira respeito`,
    
    sombra: `No lado sombra, o 8 pode manifestar:
- Obsessão por dinheiro/poder
- Workaholismo destrutivo
- Manipulação para atingir objetivos
- Materialismo excessivo
- Autoritarismo`,
    
    luz: `Quando alinhado, o 8 manifesta:
- Abundância compartilhada
- Poder usado para elevar outros
- Sucesso com integridade
- Negócios éticos
- Liderança inspiradora`,
    
    relacionamentos: `Você precisa de um parceiro que seja seu igual em ambição mas que te lembre que há mais na vida do que conquistas. Equilíbrio é essencial para você.`,
    
    carreira: `Carreiras ideais: Empreendedorismo de alto impacto, finanças, gestão executiva, direito, qualquer área onde você possa construir algo grande.`,
    
    desafio: `Seu maior desafio é aprender que verdadeiro poder não é dominar, mas empoderar. Que abundância não é acumular, mas circular. Que sucesso sem propósito é vazio.`
  },

  9: {
    titulo: "O Humanitário - Compaixão e Serviço",
    essencia: `O Número de Vida 9 é o número do humanitário, daquele que veio para servir à humanidade. Você nasceu com um coração imenso e uma compaixão que abraça o mundo inteiro.

O 9 representa a conclusão do ciclo numerológico, a sabedoria acumulada de todos os números anteriores. Você sente a dor do mundo como sua e tem uma necessidade profunda de aliviar esse sofrimento.`,
    
    missao: `Sua Missão de Alma é servir à humanidade através da compaixão ativa. Você veio para ser o curador global, o artista que toca almas, o ativista que muda sistemas. Seu propósito transcende o pessoal.`,
    
    dons: `- Compaixão universal
- Sabedoria de alma antiga
- Capacidade de perdoar profundamente
- Visão humanitária
- Arte/criação que cura`,
    
    sombra: `No lado sombra, o 9 pode manifestar:
- Síndrome do mártir
- Idealismo que paralisa
- Dificuldade em encerrar ciclos
- Carregar a dor do mundo
- Autossacrifício destrutivo`,
    
    luz: `Quando alinhado, o 9 manifesta:
- Serviço que empodera
- Compaixão com limites saudáveis
- Arte que transforma sociedades
- Ativismo efetivo
- Sabedoria compartilhada`,
    
    relacionamentos: `Você ama a humanidade, mas precisa aprender a amar indivíduos também. Relacionamentos íntimos são seu desafio e sua cura. Você precisa de alguém que te ensine a receber.`,
    
    carreira: `Carreiras ideais: ONGs, terapias, artes, ativismo, educação transformadora, qualquer área onde você possa servir causas maiores.`,
    
    desafio: `Seu maior desafio é aprender que você não pode salvar o mundo sozinho. Que descansar não é egoísmo. Que você também é digno do amor que dá tão livremente.`
  },

  11: {
    titulo: "O Iluminado - Intuição e Inspiração (Número Mestre)",
    essencia: `O Número de Vida 11 é um dos chamados Números Mestres na numerologia — junto com o 22 e o 33. Ele carrega uma vibração espiritual muito elevada e representa uma alma que veio com uma missão de despertar consciência, tanto em si mesma quanto nos outros.

Você nasceu com uma sensibilidade e intuição acima da média. O 11 é o número da inspiração, da iluminação e da conexão espiritual. Ele combina a energia do 1 (liderança, iniciativa, criação) duplicada — o que dá uma força de manifestação muito poderosa — mas também traz a delicadeza e a empatia de quem sente profundamente o mundo.

Em essência, você veio para ser um canal entre o mundo material e o espiritual. Pode perceber sinais, sincronicidades, vibrações e emoções dos outros com facilidade — e seu maior desafio é aprender a equilibrar essa sensibilidade com a ação prática.`,
    
    missao: 
    
  `Sua Missão de Alma é inspirar e elevar os outros por meio da sua própria transformação. Você não veio apenas para viver uma vida comum — mas para servir de exemplo, de farol. Quando segue sua intuição e vive com autenticidade, você naturalmente desperta as pessoas ao seu redor.`,
    
    dons:

`- Intuição quase profética
- Capacidade de inspirar multidões
- Conexão espiritual profunda
- Visão de possibilidades futuras
- Magnetismo pessoal único
- Canal para mensagens superiores`,
    
    sombra: 

`No lado sombra, o 11 pode manifestar:
- Ansiedade e nervosismo constantes
- Sensação de não pertencer
- Sobrecarga emocional/energética
- Dificuldade em materializar visões
- Idealismo que paralisa
- Medo de assumir seu verdadeiro poder`,
    
    luz: 
    
    `Quando alinhado, o 11 manifesta:
- Clareza espiritual que guia
- Criatividade intensa
- Magnetismo que atrai oportunidades
- Capacidade de transformar dor em sabedoria
- Liderança inspiradora
- Mensagens que mudam vidas`,
    
    relacionamentos: `Você precisa de um parceiro que entenda sua natureza sensível e que não tente "consertar" sua intensidade. Relacionamentos superficiais drenam você. Você precisa de profundidade, autenticidade e espaço para processar suas emoções intensas.`,
    
    carreira: `Carreiras ideais: Qualquer área onde você possa inspirar — coaching, ensino espiritual, artes, escrita, palestras motivacionais. Você não foi feito para trabalhos comuns. Seu caminho é único.`,
    
    desafio: `Seu maior desafio é transformar sua sensibilidade extrema em poder, não em fraqueza. Aprender que ser "diferente" é seu dom, não sua maldição. E materializar suas visões em vez de apenas sonhar com elas.`
  },

  22: {
    titulo: "O Mestre Construtor - Visão e Manifestação (Número Mestre)",
    essencia: `O Número de Vida 22 é o Mestre Construtor — o mais poderoso de todos os números em termos de manifestação material. Você nasceu para materializar grandes visões, para construir estruturas que impactam gerações.

O 22 combina a visão espiritual do 11 com a capacidade prática do 4 (2+2=4). Você tem uma habilidade única de sonhar grande E realizar ainda maior. Enquanto outros veem impossibilidades, você vê o passo a passo.`,
    
    missao: `Sua Missão de Alma é construir legados que transformem o mundo. Você não veio para projetos pequenos — você veio para empreendimentos que beneficiem milhares, talvez milhões. Sua visão é global, não local.`,
    
    dons: `- Visão de longo prazo excep cional
- Capacidade de materializar sonhos impossíveis
- Liderança pragmática e inspiradora
- Senso de responsabilidade global
- Habilidade de coordenar grandes projetos
- Combina espiritualidade com praticidade`,
    
    sombra: `No lado sombra, o 22 pode manifestar:
- Peso esmagador da responsabilidade
- Medo de não estar à altura
- Perfeccionismo paralisante
- Workaholismo extremo
- Impaciência com "pequenezas"
- Teimosia em fazer tudo sozinho`,
    
    luz: `Quando alinhado, o 22 manifesta:
- Projetos que mudam indústrias
- Organizações que transformam sociedades
- Liderança que inspira gerações
- Equilíbrio entre visão e execução
- Legados duradouros
- Impacto global mensurável`,
    
    relacionamentos: `Você precisa de um parceiro que seja seu igual em ambição, mas que te ajude a lembrar de viver no presente também. Relacionamentos para você são parcerias estratégicas de alma — escolha alguém que esteja pronto para construir algo maior.`,
    
    carreira: `Carreiras ideais: Fundador de empresas de impacto, arquitetura de grande escala, projetos humanitários globais, política transformadora. Você não foi feito para o comum.`,
    
    desafio: `Seu maior desafio é não se perder no peso da própria missão. Lembrar que você é humano, que pode pedir ajuda, que o caminho é tão importante quanto o destino. Sua grandeza não precisa ser solitária.`
  },

  33: {
    titulo: "O Mestre Curador - Amor Universal (Número Mestre)",
    essencia: `O Número de Vida 33 é o mais raro e mais elevado dos Números Mestres. Conhecido como o Mestre Curador ou o Avatar do Amor, você carrega uma vibração de amor incondicional que poucos compreendem.

O 33 combina a compaixão do 6 (3+3=6) com a potência dupla do 3 — criatividade, expressão e alegria. Você veio para curar em massa, para elevar a frequência do planeta através do seu próprio exemplo de amor.`,
    
    missao: `Sua Missão de Alma é ser canal do amor divino, curando através da presença, do ensino e do exemplo. Você não veio apenas para curar indivíduos — você veio para elevar a consciência coletiva. Seu campo energético sozinho já transforma ambientes.`,
    
    dons: `- Amor verdadeiramente incondicional
- Capacidade de cura profunda (física, emocional, espiritual)
- Presença que transforma ambientes
- Compaixão que abraça toda a humanidade
- Sabedoria que transcende idade
- Criatividade aplicada à cura`,
    
    sombra: `No lado sombra, o 33 pode manifestar:
- Autoanulação total
- Carregar a dor do mundo inteiro
- Esgotamento compassivo
- Dificuldade extrema com limites
- Idealismo que paralisa
- Sensação de nunca ser "amoroso o suficiente"`,
    
    luz: `Quando alinhado, o 33 manifesta:
- Cura em massa
- Amor que transforma sistemas
- Ensino que desperta almas
- Criatividade a serviço da cura
- Movimentos de amor consciente
- Elevação da frequência planetária`,
    
    relacionamentos: `Você ama profunda e incondicionalmente, mas precisa aprender que amor próprio vem primeiro. Relacionamentos para você são sagrados, mas você precisa de um parceiro que te ensine sobre limites saudáveis.`,
    
    carreira: `Carreiras ideais: Terapias holísticas, ensino espiritual, artes curativas, liderança em movimentos de consciência. Seu trabalho é curar — de todas as formas possíveis.`,
    
    desafio: `Seu maior desafio é aprender que você não pode curar a todos. Que estabelecer limites não é falta de amor. Que cuidar de si mesmo não é egoísmo — é pré-requisito para continuar servindo. Sua luz só brilha plenamente quando você também se permite receber o amor que dá tão livremente.`
  }
};
function renderInterpretacaoNumeroVida(n) {
  const chave = (n === 11 || n === 22 || n === 33) ? n : reduzirNumero(n);
  const d = INTERPRETACOES_NUMERO_VIDA[chave];
  if (!d) return '';

  return `## Número de Vida ${n}

${d.titulo}

${d.essencia}

### Missão de Alma
${d.missao}

### Dons
${d.dons}

### Lado Sombra
${d.sombra}

### Quando Alinhado
${d.luz}
`;
}

const INTERPRETACOES_NUMERO_EXPRESSAO = {
  1: "Você se expressa com liderança, confiança e originalidade. Sua presença comanda atenção naturalmente.",
  2: "Você se expressa com gentileza, diplomacia e sensibilidade. Sua presença acalma e harmoniza.",
  3: "Você se expressa com criatividade, humor e alegria. Sua presença ilumina qualquer ambiente.",
  4: "Você se expressa com praticidade, confiabilidade e organização. Sua presença traz estabilidade.",
  5: "Você se expressa com versatilidade, entusiasmo e liberdade. Sua presença energiza e inspira mudanças.",
  6: "Você se expressa com amor, cuidado e responsabilidade. Sua presença conforta e acolhe.",
  7: "Você se expressa com sabedoria, profundidade e mistério. Sua presença intriga e fascina.",
  8: "Você se expressa com poder, autoridade e determinação. Sua presença inspira respeito.",
  9: "Você se expressa com compaixão, idealismo e generosidade. Sua presença toca corações.",
  11: "Você se expressa com inspiração, intuição e sensibilidade. Sua presença ilumina e desperta.",
  22: "Você se expressa com visão, praticidade e impacto. Sua presença transforma estruturas.",
  33: "Você se expressa com amor universal e cura. Sua presença eleva frequências."
};

const INTERPRETACOES_NUMERO_MOTIVACAO = {
  1: "Sua motivação interior é ser independente, liderar e iniciar projetos novos.",
  2: "Sua motivação interior é criar harmonia, cooperar e construir parcerias.",
  3: "Sua motivação interior é criar, se expressar e trazer alegria ao mundo.",
  4: "Sua motivação interior é construir estruturas sólidas e criar estabilidade.",
  5: "Sua motivação interior é experienciar liberdade, aventura e variedade.",
  6: "Sua motivação interior é amar, cuidar e criar beleza.",
  7: "Sua motivação interior é buscar verdades profundas e conhecimento espiritual.",
  8: "Sua motivação interior é manifestar abundância e ter impacto material.",
  9: "Sua motivação interior é servir à humanidade e fazer diferença no mundo.",
  11: "Sua motivação interior é inspirar outros e ser canal de luz.",
  22: "Sua motivação interior é construir legados que transformem o mundo.",
  33: "Sua motivação interior é curar em massa através do amor."
};

const INTERPRETACOES_NUMERO_PERSONALIDADE = {
  1: "Externamente, você parece confiante, forte e independente. As pessoas te veem como líder nato.",
  2: "Externamente, você parece gentil, acessível e harmonioso. As pessoas te veem como pacificador.",
  3: "Externamente, você parece alegre, criativo e comunicativo. As pessoas te veem como luz em forma humana.",
  4: "Externamente, você parece sério, confiável e organizado. As pessoas te veem como alicerce.",
  5: "Externamente, você parece aventureiro, energético e livre. As pessoas te veem como inspiração de liberdade.",
  6: "Externamente, você parece amoroso, responsável e cuidadoso. As pessoas te veem como porto seguro.",
  7: "Externamente, você parece misterioso, sábio e introspectivo. As pessoas te veem como enigma fascinante.",
  8: "Externamente, você parece poderoso, bem-sucedido e autoritário. As pessoas te veem como força da natureza.",
  9: "Externamente, você parece compassivo, idealista e generoso. As pessoas te veem como alma elevada.",
  11: "Externamente, você parece intenso, inspirador e diferente. As pessoas te veem como ser de luz.",
  22: "Externamente, você parece visionário, capaz e impressionante. As pessoas te veem como construtor de impérios.",
  33: "Externamente, você parece amoroso, curador e elevado. As pessoas te veem como avatar do amor."
};

const INTERPRETACOES_ANO_PESSOAL = {
  1: {
    tema: "Novos Começos",
    energia: "Ano de iniciar projetos corajosos, plantar sementes e abrir caminhos.",
    foco: "Liderança, independência, ação",
    conselho: "Este é SEU ano! Inicie tudo que vem adiando. A energia está a seu favor para novos começos. Seja corajoso e confie na sua força interior."
  },
  2: {
    tema: "Cooperação e Parcerias",
    energia: "Ano de construir pontes, colaborar e fortalecer relacionamentos.",
    foco: "Relacionamentos, paciência, diplomacia",
    conselho: "Ano de cultivar parcerias. Não tente fazer tudo sozinho. Conexões genuínas feitas este ano podem durar a vida toda. Pratique paciência."
  },
  3: {
    tema: "Criatividade e Expressão",
    energia: "Ano de criar, expressar e brilhar. Sua criatividade está amplificada.",
    foco: "Arte, comunicação, alegria",
    conselho: "Libere sua criatividade sem censura. Expresse-se! O que você compartilhar este ano abrirá portas inesperadas. Permita-se ser visto."
  },
  4: {
    tema: "Construção e Estrutura",
    energia: "Ano de trabalho duro, organização e construção de bases sólidas.",
    foco: "Disciplina, organização, persistência",
    conselho: "Ano de trabalhar com foco. As bases que você construir agora sustentarão os próximos anos. Seja disciplinado e persistente."
  },
  5: {
    tema: "Mudança e Liberdade",
    energia: "Ano de aventuras, transformações e expansão de horizontes.",
    foco: "Viagens, aprendizado, versatilidade",
    conselho: "Abra-se para o novo! Mudanças que você fizer este ano te libertarão. Saia da zona de conforto. Viaje. Aprenda. Expanda."
  },
  6: {
    tema: "Amor e Responsabilidade",
    energia: "Ano de cuidar da família, relacionamentos e responsabilidades.",
    foco: "Família, beleza, serviço",
    conselho: "Cuide das suas relações importantes. Este ano pede atenção ao lar e à família. Mas lembre: cuidar não é se anular. Equilibre."
  },
  7: {
    tema: "Introspecção e Sabedoria",
    energia: "Ano de mergulhar dentro de si, estudar e conectar-se espiritualmente.",
    foco: "Espiritualidade, estudo, solidão sagrada",
    conselho: "Ano de busca interior. Estude, medite, conecte-se com sua essência. O que você aprender este ano transformará sua vida. Respeite sua necessidade de solidão."
  },
  8: {
    tema: "Poder e Manifestação",
    energia: "Ano de colher abundância material e assumir seu poder.",
    foco: "Dinheiro, carreira, autoridade",
    conselho: "Ano de manifestação poderosa! Estabeleça metas financeiras GRANDES. Você tem poder de concretização amplificado. Aja com integridade."
  },
  9: {
    tema: "Finalização e Libertação",
    energia: "Ano de encerrar ciclos, perdoar e liberar o que não serve mais.",
    foco: "Liberação, perdão, conclusão",
    conselho: "Libere profundamente o que não te serve mais. Termine projetos pendentes. Perdoe. Este ano fecha um ciclo de 9 anos. Prepare-se para renascer."
  },
  11: {
    tema: "Iluminação e Inspiração",
    energia: "Ano espiritual intenso de insights, revelações e despertar.",
    foco: "Intuição, inspiração, visão",
    conselho: "Ano de intensidade espiritual. Confie profundamente na sua intuição. Insights deste ano podem mudar o curso da sua vida. Esteja aberto ao extraordinário."
  },
  22: {
    tema: "Mestre Construtor",
    energia: "Ano de materializar grandes visões e construir legados.",
    foco: "Projetos grandes, impacto global",
    conselho: "Este é um ano PODEROSO para você. Projetos que iniciar agora têm potencial de impacto massivo. Sonhe grande E execute maior. Você consegue."
  }
};

// ==================== FUNÇÃO GERADORA DA ANÁLISE COMPLETA ====================

function gerarAnaliseNumerologicaCompleta(nomeCompleto, dataNascimento) {
  // Parse da data
  const partes = dataNascimento.split('/');
  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]);
  const ano = parseInt(partes[2]);
  
  // Cálculos
  const numeroVida = calcularNumeroVida(dia, mes, ano);
  const numeroExpressao = calcularNumeroExpressao(nomeCompleto);
  const numeroMotivacao = calcularNumeroMotivacao(nomeCompleto);
  const numeroPersonalidade = calcularNumeroPersonalidade(nomeCompleto);
  const anoPessoal2025 = calcularAnoPessoal(dia, mes, 2025);
  const anoPessoal2026 = calcularAnoPessoal(dia, mes, 2026);
  
  // Interpretações
  const interpretacaoVida = INTERPRETACOES_NUMERO_VIDA[numeroVida];
  const interpretacaoExpressao = INTERPRETACOES_NUMERO_EXPRESSAO[numeroExpressao];
  const interpretacaoMotivacao = INTERPRETACOES_NUMERO_MOTIVACAO[numeroMotivacao];
  const interpretacaoPersonalidade = INTERPRETACOES_NUMERO_PERSONALIDADE[numeroPersonalidade];
  const interpretacao2025 = INTERPRETACOES_ANO_PESSOAL[anoPessoal2025];
  const interpretacao2026 = INTERPRETACOES_ANO_PESSOAL[anoPessoal2026];
  
  // Montar texto completo
  return `
  🔢 SUA ANÁLISE NUMEROLÓGICA COMPLETA

${nomeCompleto}, prepare-se para uma jornada profunda pelos números da sua alma.

🌟 NÚMERO DE VIDA: ${numeroVida}
 ${interpretacaoVida.titulo}

${interpretacaoVida.essencia}

💫 ${interpretacaoVida.missao}

✨ Seus Dons Naturais

${interpretacaoVida.dons}

🌑 Lado Sombra

${interpretacaoVida.sombra}

🌕 Quando Alinhado

${interpretacaoVida.luz}

💕 Relacionamentos

${interpretacaoVida.relacionamentos}

💼 Carreira

${interpretacaoVida.carreira}

🎯 Seu Maior Desafio

${interpretacaoVida.desafio}

🎭 NÚMERO DE EXPRESSÃO: ${numeroExpressao}
 Como Você se Mostra ao Mundo

${interpretacaoExpressao}

${numeroExpressao === numeroVida ? 
`
✨ ALINHAMENTO PERFEITO! ✨

Seu Número de Expressão é IGUAL ao seu Número de Vida (${numeroVida}). 

Isso é raro e poderoso! Significa que você se expressa NATURALMENTE de acordo com seu propósito de vida. Não há conflito interno entre quem você É e como você se MOSTRA. Sua autenticidade é magneticamente atrativa.

Pessoas como você têm uma coerência energética que atrai oportunidades e pessoas certas. Continue sendo você — é exatamente isso que o mundo precisa.
` : ` 🔄 DANÇA ENTRE SER E PARECER

Seu Número de Expressão (${numeroExpressao}) é DIFERENTE do seu Número de Vida (${numeroVida}).

Isso significa que existe uma DANÇA entre quem você É internamente (${numeroVida}) e como você se EXPRESSA externamente (${numeroExpressao}). Não é um problema — é uma riqueza! Você tem múltiplas facetas.

O desafio é integrar essas duas energias. Quando você consegue expressar externamente quem você é internamente, a mágica acontece.

Como integrar:
- Reconheça que ambas energias são VOCÊ
- Permita que seu ${numeroVida} interno se manifeste mais externamente
- Use seu ${numeroExpressao} como ferramenta, não como máscara
- A integração traz autenticidade irresistível
`}
💖 NÚMERO DE MOTIVAÇÃO: ${numeroMotivacao}
O Que Te Move Por Dentro

${interpretacaoMotivacao}

Este é o motor secreto da sua alma — o que realmente te faz levantar da cama pela manhã, mesmo quando ninguém está vendo.

👤 NÚMERO DE PERSONALIDADE: ${numeroPersonalidade}
    Sua Primeira Impressão

${interpretacaoPersonalidade}

Esta é a "roupa energética" que você veste. É a primeira impressão que causa antes mesmo de falar. Nem sempre corresponde ao que você sente por dentro — e tudo bem!

📅 PREVISÕES NUMEROLÓGICAS

2025 - Ano Pessoal ${anoPessoal2025}
 ${interpretacao2025.tema}

Energia do Ano:
${interpretacao2025.energia}

Onde Focar:
${interpretacao2025.foco}

Conselho Numerológico:
${interpretacao2025.conselho}

Janeiro-Março (Plantio):
${anoPessoal2025 === 1 ? 'Inicie TUDO que vem adiando. Este trimestre define seu ano inteiro. Seja corajoso!' :
  anoPessoal2025 === 2 ? 'Construa parcerias estratégicas. Conexões feitas agora duram anos. Não force, flua.' :
  anoPessoal2025 === 3 ? 'Libere criatividade sem censura. O que compartilha agora abre portas inesperadas.' :
  anoPessoal2025 === 4 ? 'Estruture projetos meticulosamente. Bases agora sustentam por anos. Trabalhe com foco.' :
  anoPessoal2025 === 5 ? 'Abra-se para o novo. Mudanças agora te libertam. Diga sim a aventuras!' :
  anoPessoal2025 === 6 ? 'Cuide das relações importantes. Isso será sua âncora o ano todo. Família é prioridade.' :
  anoPessoal2025 === 7 ? 'Mergulhe em estudos espirituais. O que aprende agora transforma sua vida para sempre.' :
  anoPessoal2025 === 8 ? 'Estabeleça metas financeiras GRANDES. Você tem poder de manifestação amplificado!' :
  anoPessoal2025 === 9 ? 'Libere o que não serve. Termine o que precisa terminar. Esvazie para encher de novo.' :
  anoPessoal2025 === 11 ? 'Confie na intuição como nunca antes. Insights deste trimestre mudam tudo.' :
  'Sonhe grande e planeje a execução. Bases de grandes projetos começam agora.'}

Abril-Junho (Crescimento):
Acelere! Seus projetos ganham momentum. A energia está A FAVOR. Seja visível. Comunique. Avance.

Julho-Setembro (Ajustes):
Meio do ano — momento de revisar rotas e ajustar o que não está funcionando. Persistência inteligente, não teimosia.

Outubro-Dezembro (Colheita):
Celebre o que construiu! Agradeça pelos aprendizados. Prepare-se para o próximo ciclo. Encerre bem.


IMPORTANTE:

O ano pessoal vai do seu aniversário do ano até o próximo aniversário. (portanto se voce faz aniversário no final do ano, a maior parte do seu ano será regida pelo número do ano anterior.)


2026 - Ano Pessoal ${anoPessoal2026}
${interpretacao2026.tema}

Energia do Ano:
${interpretacao2026.energia}

Onde Focar:
${interpretacao2026.foco}

Como Aproveitar 2026 ao Máximo:

Janeiro-Março (Plantio):
${anoPessoal2026 === 1 ? 'Este é SEU momento! Inicie projetos que sonha há anos. Este trimestre planta as sementes dos próximos 9 ANOS da sua vida. Seja AUDACIOSO!' :
  anoPessoal2026 === 2 ? 'Foque em parcerias e colaborações. As pessoas certas aparecem agora. Ouça mais, fale menos. Cultive paciência.' :
  anoPessoal2026 === 3 ? 'Sua criatividade explode! Compartilhe suas ideias sem medo. O que você expressar agora ganha vida própria. Crie sem censura!' :
  anoPessoal2026 === 4 ? 'Planeje meticulosamente. Organize finanças, projetos, rotinas. O que estruturar agora sustenta você por ANOS. Disciplina é poder.' :
  anoPessoal2026 === 5 ? 'Mudanças radicais são bem-vindas! Viaje, mude de emprego, mude de cidade. Liberdade é sua prioridade. Arrisque-se!' :
  anoPessoal2026 === 6 ? 'Família e relacionamentos pedem atenção. Cuide de quem ama. Crie harmonia no lar. Beleza ao seu redor reflete beleza interior.' :
  anoPessoal2026 === 7 ? 'Ano de introspecção profunda. Medite, estude, conecte-se consigo. Solidão é sagrada agora. Mergulhe em espiritualidade.' :
  anoPessoal2026 === 8 ? 'Estabeleça metas financeiras OUSADAS. Seu poder de manifestação está no auge. Pense GRANDE. Negocie. Lidere. Prospere!' :
  anoPessoal2026 === 9 ? 'Libere TUDO que pesa. Termine relacionamentos tóxicos, projetos mortos, crenças limitantes. Esvazie-se completamente. Renascimento vem após morte.' :
  anoPessoal2026 === 11 ? 'Sua intuição está AMPLIFICADA. Confie cegamente. Mensagens chegam por sonhos, sincronicidades, insights. Você é canal puro agora.' :
  anoPessoal2026 === 22 ? 'Projetos MASSIVOS começam agora. Pense em impacto global. Você tem poder de construir algo que transcende você. Sonhe ENORME!' :
  'Momento de integração profunda. Una tudo que aprendeu. Sua sabedoria se manifesta em ações concretas.'}

Abril-Junho (Crescimento):
${anoPessoal2026 === 1 ? 'Acelere sem freios! Suas iniciativas ganham tração. Seja visível. Lidere sem medo. O universo conspira A SEU FAVOR.' :
  anoPessoal2026 === 2 ? 'Parcerias florescem. Colaborações trazem frutos. Continue cultivando paciência e diplomacia. Conexões agora são ouro.' :
  anoPessoal2026 === 3 ? 'Sua voz alcança multidões. Comunique-se! Escreva, fale, crie. Suas palavras têm poder de transformação agora.' :
  anoPessoal2026 === 4 ? 'Continue construindo tijolo por tijolo. Não se dispersar é crucial. Foco intenso traz resultados sólidos.' :
  anoPessoal2026 === 5 ? 'Aventuras chegam! Diga SIM a convites inesperados. Cada experiência nova te liberta mais. Movimento é vida.' :
  anoPessoal2026 === 6 ? 'Harmonia se estabelece. Relacionamentos se aprofundam. Continue nutrindo com amor. Beleza se manifesta ao seu redor.' :
  anoPessoal2026 === 7 ? 'Sabedoria se aprofunda. Insights chegam em meditação. Continue na jornada interna. Respostas vêm do silêncio.' :
  anoPessoal2026 === 8 ? 'Negócios expandem! Oportunidades financeiras explodem. Negocie com confiança. Seu magnetismo para abundância está no auge!' :
  anoPessoal2026 === 9 ? 'Liberação continua. Perdoe profundamente. Solte completamente. Cada liberação te deixa mais leve para renascer.' :
  anoPessoal2026 === 11 ? 'Você inspira apenas por existir. Sua energia eleva ambientes. Continue confiando na intuição. Você É o canal.' :
  anoPessoal2026 === 22 ? 'Estruturas ganham forma. Sua visão se materializa. Continue executando com maestria. Impacto cresce exponencialmente.' :
  'Momentum aumenta! Continue no caminho. Ajustes sutis, grandes resultados. Persistência inteligente.'}

Julho-Setembro (Ajustes):
${anoPessoal2026 === 1 ? 'Revise rotas SEM perder impulso. Ajuste o que não funciona, mas NÃO pare. Liderança exige adaptação rápida.' :
  anoPessoal2026 === 2 ? 'Reavalie parcerias. Algumas precisam ajustes, outras precisam fim. Ouça sua intuição sobre relacionamentos.' :
  anoPessoal2026 === 3 ? 'Foque projetos criativos. Termine o que começou. Dispersão agora pode ser fatal. Escolha suas batalhas.' :
  anoPessoal2026 === 4 ? 'Meio do ano — análise fria de resultados. O que funciona? O que não? Ajuste estratégias. Recalcule rotas.' :
  anoPessoal2026 === 5 ? 'Momento de integrar experiências. Tantas mudanças precisam ser processadas. Viaje para DENTRO também.' :
  anoPessoal2026 === 6 ? 'Reequilibre dar e receber. Você também merece ser nutrido. Ajuste limites onde necessário. Amor próprio primeiro.' :
  anoPessoal2026 === 7 ? 'Aprofunde ainda mais. Os mistérios se revelam camada por camada. Paciência com o processo. Sabedoria não tem pressa.' :
  anoPessoal2026 === 8 ? 'Revise estratégias financeiras. O que não está dando retorno? Corte sem dó. Recursos são preciosos — otimize!' :
  anoPessoal2026 === 9 ? 'Últimas liberações profundas. O que AINDA pesa? Solte agora ou carregará para 2027. Liberdade está próxima!' :
  anoPessoal2026 === 11 ? 'Ansiedade pode aparecer. É apenas recalibração energética. Medite mais. Respire fundo. Confie no processo divino.' :
  anoPessoal2026 === 22 ? 'Ajustes em grande escala. Projetos massivos precisam correção de rota. Flexibilidade sem perder visão do TODO.' :
  'Ajustes necessários. Nem tudo sai como planejado — e tudo bem. Adapte-se com sabedoria.'}

Outubro-Dezembro (Colheita):
${anoPessoal2026 === 1 ? 'Celebre TUDO que iniciou! Você plantou um jardim inteiro. 2027 colherá frutos. Reconheça sua coragem. Você renasceu!' :
  anoPessoal2026 === 2 ? 'Parcerias consolidadas trazem frutos. Agradeça quem caminhou com você. Prepare-se para ano 3 — criatividade explode!' :
  anoPessoal2026 === 3 ? 'Suas criações ganham vida própria! Compartilhe resultados. Celebre com leveza. Ano 4 pedirá mais estrutura — aproveite a leveza agora!' :
  anoPessoal2026 === 4 ? 'Bases SÓLIDAS estão prontas! Olhe para trás — estrutura impecável. Ano 5 trará mudanças — descanse nas fundações que criou!' :
  anoPessoal2026 === 5 ? 'Você é LIVRE como nunca! Celebre todas mudanças. Ano 6 pedirá mais responsabilidade — aproveite liberdade AGORA!' :
  anoPessoal2026 === 6 ? 'Harmonia reina. Relacionamentos floresceram. Lar é templo. Ano 7 pedirá introspecção — celebre conexões agora!' :
  anoPessoal2026 === 7 ? 'Sabedoria PROFUNDA adquirida. Você não é mais quem era. Ano 8 trará abundância material — prepare-se!' :
  anoPessoal2026 === 8 ? 'ABUNDÂNCIA se manifesta! Colha frutos financeiros. Agradeça. Ano 9 pede liberação — aproveite prosperidade AGORA!' :
  anoPessoal2026 === 9 ? 'Você está VAZIO — e isso é LINDO! Leve como pena. Pronto para 2027 (Ano 1). RENASCIMENTO acontece em Janeiro!' :
  anoPessoal2026 === 11 ? 'Você iluminou muitos caminhos! Reconheça seu impacto. Descanse. Recarregue. Continue sendo luz!' :
  anoPessoal2026 === 22 ? 'Legado em construção! Estruturas massivas começaram. Continue — o mundo precisa do que você constrói!' :
  'Colheita generosa! Celebre TUDO. Agradeça aprendizados. Prepare-se para novo ciclo com gratidão!'}

${anoPessoal2026 === 1 ? `

🌱 SEMENTES PLANTADAS EM 2026 = ÁRVORES EM 2034 🌳

Lembre-se: TUDO que você iniciar em 2026 se desenvolverá pelos próximos 9 anos. Escolha com sabedoria. Plante com intenção. Seus projetos de 2026 estarão MADUROS em 2034!

- Janeiro 2026 → Frutos em 2027-2029
- Meio de 2026 → Colheita em 2030-2032  
- Final de 2026 → Maturidade em 2033-2034

Este ano define sua próxima DÉCADA. Não desperdice!
` : ''}

${anoPessoal2026 === 9 ? `

🦋 CHECKLIST DE LIBERAÇÃO PARA 2026 🦋

Use este ano para soltar TUDO:

Janeiro-Março:
- Relacionamentos tóxicos que drenam sua energia
- Empregos que não fazem mais sentido
- Crenças limitantes sobre você mesmo

Abril-Junho:
- Objetos físicos que não usa há 1+ ano
- Compromissos que assume por culpa, não por amor
- Padrões de comportamento que te sabotam

Julho-Setembro:
- Mágoas profundas — perdoe TUDO
- Expectativas irreais sobre si mesmo
- Necessidade de aprovação externa

Outubro-Dezembro:
- Últimas amarras — seja IMPLACÁVEL
- Qualquer coisa que não te permita voar
- Identidade antiga — você renascerá em 2027!

Em 31 de dezembro de 2026, você deve estar VAZIO, LEVE e PRONTO para renascer como versão 2.0 em Janeiro de 2027!
` : ''}Conselho Numerológico:
${interpretacao2026.conselho}

${anoPessoal2026 === 1 ? `
🎉 2026 É SEU ANO DE RENASCIMENTO! 🎉

Você inicia um NOVO CICLO DE 9 ANOS. Tudo que plantar em 2026 se desenvolve pelos próximos 9 anos.

Este é literalmente um dos anos mais importantes da sua vida. Use com sabedoria:
- Defina com clareza o que quer para os próximos 9 anos
- Inicie projetos que deseja ver florescer a longo prazo
- Seja corajoso — você tem o universo a seu favor
- Plantar em ano 1 é como plantar em solo fértil após chuva

Não desperdice este ano com indecisão. AJA.
` : ''}
${anoPessoal2026 === 9 ? `
🌊 2026 É SEU ANO DE ENCERRAMENTO! 🌊

Você FINALIZA um ciclo de 9 anos. É hora de liberar PROFUNDAMENTE o que não te serve mais e preparar-se para RENASCER em 2027 (Ano 1).

Como aproveitar um ano 9:
- Faça uma lista de tudo que precisa encerrar
- Perdoe — profundamente, completamente
- Libere relacionamentos, empregos, crenças que já cumpriram seu papel
- Doe, descarte, limpe (fisico e energético)
- Descanse — você trabalhou duro por 9 anos
- Prepare-se para renascer como versão 2.0 em 2027

Ano 9 é sobre morrer para uma velha identidade e preparar o terreno para uma nova.
` : ''}🎯 COMO USAR ESTA ANÁLISE NO DIA A DIA

Diariamente:
- Ao acordar, lembre seu Número de Vida (${numeroVida}) e pergunte: "O que eu vim fazer aqui?"
- Use isso como bússola para decisões grandes e pequenas
- Quando em dúvida, volte à sua missão de alma

Mensalmente:
- Calcule seu Mês Pessoal (dia + mês de nascimento + ano atual, reduzido)
- Alinhe suas ações com a energia do mês
- Planeje reuniões/lançamentos de acordo com seu mês pessoal

Anualmente:
- Revise esta seção todo início de ano
- Planeje o ano baseado no seu Ano Pessoal
- Celebre as conquistas alinhadas com a numerologia

Em Decisões Importantes:
- Pergunte: "Isso está alinhado com meu ${numeroVida}?"
- Se sim → avance com confiança
- Se não → reconsidere ou ajuste

💎 PALAVRAS FINAIS

${nomeCompleto}, os números não são prisões — são mapas.

Eles revelam padrões, tendências e potenciais. Mas VOCÊ sempre tem livre arbítrio. Use esta análise como guia, não como limitação.

Quando você vive alinhado com seus números, a vida flui. Quando vive contra eles, tudo parece mais difícil.

Seus números são:
- Vida: ${numeroVida} — Seu propósito
- Expressão: ${numeroExpressao} — Como você brilha
- Motivação: ${numeroMotivacao} — O que te move
- Personalidade: ${numeroPersonalidade} — Como te veem

Memorize esses números. Eles são as chaves do seu mapa de alma.

Que esta análise ilumine seu caminho e te lembre diariamente de quem você REALMENTE é.

Com amor e luz,
O Universo através dos Números 🔢✨
`;
}

function reduzirNumero(num) {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = num.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
  }
  return num;
}


// AQUI COMEÇA SUA FUNÇÃO gerarManualCompleto...

function gerarManualCompleto(nome, data_nascimento, signo, numero_vida) {
  const elemento = ELEMENTOS_SIGNOS[signo] || 'Fogo';
  const regente = REGENTES[signo] || 'Sol';
  const arquetipo = ARQUETIPOS_POR_NUMERO[numero_vida] || ARQUETIPOS_POR_NUMERO[1];
  const numeroExpressao = calcularNumeroExpressao(nome);

  let ano2025 = null, ano2026 = null;
  if (data_nascimento) {
    const partes = data_nascimento.split('/');
    if (partes.length >= 2) {
      ano2025 = calcularAnoPessoal(partes[0], partes[1], 2025);
      ano2026 = calcularAnoPessoal(partes[0], partes[1], 2026);
    }
  }


  const interpretacoes2025 = {
    1: { tema: "Novos Comecos", energia: "Ano de iniciar projetos corajosos", foco: "Lideranca, independencia, acao" },
    2: { tema: "Cooperacao e Parcerias", energia: "Ano de construir pontes e colaborar", foco: "Relacionamentos, paciencia, diplomacia" },
    3: { tema: "Criatividade e Expressao", energia: "Ano de criar, expressar e brilhar", foco: "Arte, comunicacao, alegria" },
    4: { tema: "Construcao e Estrutura", energia: "Ano de trabalho duro e bases solidas", foco: "Disciplina, organizacao, persistencia" },
    5: { tema: "Mudanca e Liberdade", energia: "Ano de aventuras e transformacoes", foco: "Viagens, aprendizado, versatilidade" },
    6: { tema: "Amor e Responsabilidade", energia: "Ano de cuidar da familia e relacoes", foco: "Familia, beleza, servico" },
    7: { tema: "Introspecao e Sabedoria", energia: "Ano de mergulhar dentro de si", foco: "Espiritualidade, estudo, solidao sagrada" },
    8: { tema: "Poder e Manifestacao", energia: "Ano de colher abundancia material", foco: "Dinheiro, carreira, autoridade" },
    9: { tema: "Finalizacao e Libertacao", energia: "Ano de encerrar ciclos e perdoar", foco: "Liberacao, perdao, arte" },
    11: { tema: "Iluminacao e Inspiracao", energia: "Ano espiritual intenso de insights", foco: "Intuicao, inspiracao, visao" },
    22: { tema: "Mestre Construtor", energia: "Ano de materializar grandes visoes", foco: "Projetos grandes, impacto global" }
  };

  return {
    introducao: {
      titulo: `💫 Bem vinda(o), ${nome} 💫`,
      conteudo: `✨ Bem vinda(o) a Sua Jornada de Despertar, ${nome}


${nome}, este nao é apenas um manual - é um mapa energetico unico criado para VOCÊ.

🌀🌀 Seu Mapa Astrologico e Numerologico

Você nasceu sob o signo de ${signo}, elemento ${elemento}, regido por ${regente}.

Seu Numero de Vida é ${numero_vida}.

🌀🌀 Sua Missao de Alma

${arquetipo.missao}

🌀🌀 O Que você verá aqui:

✨ Análise numerológica COMPLETA com previsões de 2025 e 2026
✨ Meditações guiadas com passo a passo para manhã e noite
✨ Técnicas para atingir estado Theta e manifestar a vida dos seus sonhos
✨ Rituais personalizados para seu elemento ${elemento}
✨ Indicações de como usar arquétipos no dia a dia
✨ Calendário lunar sincronizado
✨ Plano detalhado de 90 dias.

Que assim seja, e assim é.`
    },

analise_numerologica: {
  titulo: 'Sua Análise Numerologica Completa',
  conteudo: gerarAnaliseNumerologicaCompleta(nome, data_nascimento)
},

    poderes_ocultos: {
      titulo: 'Seus Poderes Naturais',
      conteudo: ` Seus Poderes Naturais Adormecidos

${nome}, voce nasceu com capacidades extraordinarias. Vamos despertar cada uma.

 ✨ Os 7 Poderes Que Voce Vai Desenvolver

1. INTUICAO EXPANDIDA
Voce ja "sentiu" algo antes de acontecer? Isso e sua intuicao - um radar interno.
Como desenvolver:
- Meditacao diaria (10 min)
- Anote pressentimentos
- Antes de decisoes, pause e SINTA no corpo

2. MANIFESTACAO CONSCIENTE
Seus pensamentos + emocoes + acoes = sua realidade.
Formula:
- Visualize desejo JA realizado
- SINTA a emocao de ja ter
- Tome UMA acao hoje

3. CURA ENERGETICA
Suas maos podem curar. Voce ja consolou alguem apenas estando perto? Isso e real.
Como ativar:
- Esfregue as maos, sinta calor
- Coloque sobre seu corpo onde doi
- Envie amor para o local

4. TRANSMUTAÇÃO ALQUÍMICA
Transformar medo em coragem, raiva em criatividade.
Pratica:
- Sinta a emocao densa
- Respire profundamente nela
- Pergunte: "O que essa emocao quer me ensinar?"
- Agradeça e libere

5. MAGNETISMO PESSOAL
Sua energia atrai pessoas e oportunidades.
Como amplificar:
- Pratique gratidao ao acordar
- Sorria mais
- Cuide da sua energia

6. VISAO ALEM DO FISICO
Sonhos premonitorios, sincronicidades.
Ative:
- Antes de dormir, peca orientacao
- Anote sonhos ao acordar
- Observe padroes

7. CONEXAO MULTIDIMENSIONAL
Voce e alma em jornada, conectada ao Todo.

✨ MEDITACAO MATINAL: Ativando Poderes (10 min)

Melhor horario: Logo ao acordar
Como fazer:
1. Sente-se confortavelmente
2. Respire fundo 3 vezes (4s inspira, 4s segura, 6s expira)
3. Coloque mao no coracao
4. Afirme: "Eu sou luz. Meus dons despertam agora."
5. Visualize luz dourada entrando pelo topo da cabeca
6. Sinta essa luz preenchendo todo seu corpo
7. Permaneca 5-7 minutos
8. Agradeça

Beneficio: Voce comeca o dia em frequencia elevada.

✨ MEDITACAO NOTURNA: Reprogramacao Profunda (15 min)

Melhor horario: 30 min antes de dormir

Por que a noite? Voce acessa estado THETA (4-8 Hz) - porta para o subconsciente.
Como fazer:
1. Deite-se confortavelmente
2. Desligue todas as luzes
3. Respire profundamente ate relaxar
4. Faca body scan (relaxe cada parte do corpo)
5. Voce esta em THETA (quase dormindo, mente alerta)
6. Afirme: "Eu liberto o que nao me serve. Eu sou abundancia."
7. Visualize seu desejo como se ja fosse real
8. Permita-se adormecer nesta vibracao

Beneficio: Voce reprograma o subconsciente enquanto dorme.

✨ COMO ATINGIR ESTADO THETA (Portal da Manifestacao)

O que e Theta: Ondas cerebrais 4-8 Hz. Estado de sonho acordado.
Por que e poderoso: No Theta, voce acessa SUBCONSCIENTE - onde 95% das suas crencas estao.

TECNICA 1: Respiração 4-7-8
- Inspire 4 segundos
- Segure 7 segundos
- Expire 8 segundos
- Repita 10 minutos

TECNICA 2: Escada para o Subconsciente
1. Visualize escada de 10 degraus
2. Conte de 10 a 1, descendo
3. A cada degrau, relaxe MAIS
4. No ultimo, voce esta em Theta
5. Plante suas intencoes aqui

TECNICA 3: Binaural Beats
- Use fones de ouvido
- Toque frequencia Theta 6 Hz (YouTube/Spotify)
- Seu cerebro sincroniza automaticamente

${nome}, seus poderes sao reais. Pratique por 40 dias e veja!`
    },

    
    arquetipos: {
      titulo: 'Arquetipos de Poder',
      conteudo: ` Seus Arquetipos de Poder

${nome}, voce é um caleidoscopio de arquetipos.

Seu Arquetipo Principal: ${arquetipo.principal}

Sua missao: ${arquetipo.missao}

Qualidades de Luz: ${arquetipo.luz.join(', ')}

Sombras: ${arquetipo.sombra.join(', ')}

Saiba que você pode usar arquétipos em qualquer situação.
Arquétipos são padrões universais de imagem e comportamento — que vivem no inconsciente coletivo. Eles funcionam como “atalhos simbólicos”: quando você ativa um arquétipo, as pessoas reconhecem aquele padrão de imediato e passam a perceber você com certas qualidades (autoridade, disciplina, sabedoria, magnetismo, liberdade). É como escolher uma frequência: você sintoniza num tipo de energia e comunica isso com clareza, sem precisar explicar demais.

Para usar, defina um arquétipo principal (seu eixo) e um de apoio (tempero), sempre alinhados ao seu objetivo atual. Depois, traduza em sinais visíveis:
• Visual (cores, roupas, layout da marca).
• Linguagem (vocabulário e tom).
• Corpo e ambiente — postura, olhar, trilha sonora, símbolos (uma coroa discreta, um totem de montanha, um livro aberto).
• Rotina — rituais curtos, afirmações e metas semanais coerentes com o arquétipo.

Voce NÃO está limitada(o) ao seu arquÉtipo principal!

Alguns Arquetipos Situacionais para serem utilizados: 

Para Lideranca:
- O Imperador/A Imperatriz
- O Guerreiro

Para Criatividade:
- O Artista
- O Mago

Para Relacionamentos:
- Os Amantes
- O Diplomata

Para Desafios:
- A Forca
- O Cacador

Para Sabedoria:
- O Sabio
- O Eterno Estudante

Para Transformacao:
- A Borboleta
- A Fenix

✨ TÉCNICA: utilização Consciente (5 min)

Antes de situacoes importantes:

1. Identifique arquetipo necessario
2. Feche olhos, respire fundo 3x
3. Visualize o arquetipo a sua frente
4. Convide-o para ENTRAR em voce
5. Sinta a energia mudando
6. Pergunte: "Como ele/ela agiria?"
7. Aja como tal

Você é todas as possibilidades!`
    },

    linguagem: {
      titulo: 'Linguagem Vibracional',
      conteudo: `Linguagem Vibracional de Luz

${nome}, suas palavras são feiticos.

✨ Suas Afirmacoes (Numero ${numero_vida})

1. Eu sou luz que ilumina meu caminho
2. Eu cocrio minha realidade com o universo
3. Eu sou grata(o) por todas as bençãos
4. Minha energia transforma espacos
5. Eu confio na minha sabedoria interior

✨ Pratica Matinal: Espelho (5 min)

1. De pé, frente ao espelho
2. Olhe nos préprios olhos
3. Escolha 3 afirmacoes
4. Repita cada uma 3 vezes em VOZ ALTA
5. SINTA cada palavra no corpo
6. Coloque mao no coracao: "Eu aceito essas verdades"
7. Sorria

✨ Pratica Noturna: Theta (10 min)

1. Deite-se, luzes apagadas
2. Respire até relaxar (sinta-se relaxado(a))
3. Entre em Theta (quase dormindo)
4. Sussurre suas afirmacções
5. Visualize como se ja fosse real
6. Durma nesta frequencia

✨ Palavras Que Elevam vs Drenam

Elimine:
- "Eu nao consigo"
- "E impossivel"
- "Eu sempre falho"

Substitua por:
- "Eu estou aprendendo"
- "Existe um caminho"
- "Cada experiencia me ensina"

Palavras são feiticos. Use-as sabiamente!`
    },

    bloqueios: {
      titulo: 'Bloqueios e Transmutação',
      conteudo: `Bloqueios Energéticos e Transmutação

Bloqueios são professores disfarçados.

✨ Seus Bloqueios Prováveis (Número ${numero_vida}): ${arquetipo.sombra.map(s => ` ${s}`).join('\n')}

✨ TÉCNICA: Alquimia Interior (20 min)

1. IDENTIFIQUE o bloqueio
2. SINTA no corpo onde ele mora
3. RESPIRE dentro da sensacao
4. PERGUNTE: "O que voce quer me ensinar?"
5. ESCUTE a resposta
6. AGRADEÇA: "Obrigada, mas agora escolho algo novo"
7. ESCOLHA novo padrao
8. ANCORE com respiracao profunda

Pratique toda vez que bloqueio aparecer.

✨ Bloqueios Por Elemento

Como ${elemento}, você tem padrões únicos:
${elemento === 'Fogo' ? `
Bloqueios do Fogo:
- Burnout por excesso de ação
- Impaciencia destrutiva
- Raiva reprimida ou explosiva

Ritual: Escreva o bloqueio, queime em vela vermelha. Sinta-o desaparecendo.
` : elemento === 'Terra' ? `
Bloqueios da Terra:
- Rigidez e resistencia a mudanca
- Apego excessivo ao material
- Lentidão que paralisa

Ritual: Enterre papel com bloqueio, plante semente em cima. Sinta-o desaparecendo.
` : elemento === 'Ar' ? `
Bloqueios do Ar:
- Analise excessiva que paralisa
- Desconexão emocional
- Superficialidade

Ritual: Rasgue papel com bloqueio, jogue ao vento. Sinta-o desaparecendo.
` : `Bloqueios da Agua:
- Absorcao de emocoes alheias
- Medo de ser engolida(o) emocionalmente 
- Vitimização

Ritual: Dissolva bloqueio em água corrente (banho/mar). Sinta-o desaparecendo.
`}
Seus bloqueios sao portais de crescimento!`
    },

    limpeza: {
      titulo: 'Limpeza Energetica',
      conteudo: `Limpeza e Protecao Energética

✨ Banho de Limpeza Mensal

Ingredientes:
- Sal grosso (3 punhados)
- Arruda, alecrim, lavanda

Como fazer:
1. Banho normal primeiro
2. Jogue agua com ervas do pescoco para baixo
3. Visualize luz violeta limpando
4. NAO enxague
5. Vista roupas limpas

✨ Defumação Semanal

Use alecrim, arruda ou salvia branca em todos os cômodos.

✨ Proteção Diária (3 min)

Tecnica da Bolha de Luz:
1. Visualize esfera dourada ao redor (1 metro)
2. Afirme: "Eu estou protegida(o)"
3. Sinta a bolha solidificando

Sua energia é seu templo. Cuide dela!`
    },

    sexualidade: {
      titulo: 'Sexualidade Sagrada',
      conteudo: ` Sexualidade Sagrada

Energia sexual é foça criadora. Quando transmutada, vira combustível para manifestação.

✨ Transmutação Sexual - Respiracao Tântrica (15 min)

1. Sente-se, coluna ereta
2. Contraia levemente o perineo
3. Visualize energia na base da coluna
4. INSPIRE: energia sobe pela coluna
5. EXPIRE: energia explode no topo da cabeça
6. Repita 10-15 minutos

✨ Para que usar:

- Manifestacao: Sinta desejo com intensidade sexual
- Criatividade: Canalize para projetos
- Cura: Direcione para area que dói

Use essa energia para criar, manifestar, curar!`
    },

    geometria: {
      titulo: 'Geometria Sagrada',
      conteudo: ` Geometria Sagrada

Padrões matemáticos que organizam o universo.

✨ Principais Simbolos

Flor da Vida: Blueprint do universo
Merkaba: Veiculo de luz
Sri Yantra: Maquina de manifestacao
Cubo de Metatron: Protecao maxima

✨ Como Usar

Para Manifestação:
- Coloque copo de agua sobre Flor da Vida por 8h
- Beba agua "programada"

Para Meditação:
- Observe Sri Yantra por 10 min
- Mentalize desejo
- Simbolo "processa" e manifesta

No Ambiente:
- Quadros com geometria harmonizam espaco
- Joias carregam frequencia

Geometria reorganiza seus padrões neurais!`
    },

    magnetismo: {
      titulo: 'Magnetismo Pessoal',
      conteudo: ` Magnetismo Pessoal

Seu campo energético atrai sua realidade.

✨ TECNICA PRINCIPAL: Coerencia Cardiaca (5 min, 3x/dia)

Quando: Ao acordar, meio-dia, antes de dormir
Como fazer:
1. Mao no coracao
2. Respire: 5s inspira, 5s expira
3. Lembre momento de GRATIDAO profunda
4. SINTA a emoção (nao apenas pense)
5. Sustente 5 minutos

Resultado em 21 dias:
- Voce se torna IMA para o que deseja
- Pessoas notam sua mudança
- Oportunidades aparecem "do nada"

✨ Amplificadores

Postura de Poder (2 min):
- Pes afastados
- Maos na cintura
- Peito aberto
- Segure 2 minutos
- Use antes de situacoes importantes

Elemento ${elemento} Amplifica:
${elemento === 'Fogo' ? 'Sua paixao contagia. Irradie vida!' :
  elemento === 'Terra' ? 'Sua solidez reconforta. Seja a ancora!' :
  elemento === 'Ar' ? 'Sua inteligencia fascina. Inspire!' :
  'Sua sensibilidade cura. Seja o oceano que acolhe!'}

Em 90 dias praticando: Sua vida muda DRASTICAMENTE!`
    },

    calendario_lunar: {
      titulo: 'Calendario Lunar',
      conteudo: ` Calendario Lunar

Alinhe-se com os ciclos da lua.

✨ As 4 Fases

Lua Nova (3 dias):
- PLANTE intencoes
- Ritual: Escreva 3-10 desejos
- "Eu planto estas sementes"

Lua Crescente (7 dias):
- AJA em direcao aos objetivos
- Energia esta A FAVOR
- Construa, crie, movimente-se

Lua Cheia (3 dias):
- CELEBRE manifestacoes
- LIBERE o que nao serve
- Ritual: Agradeca + queime papel com liberacoes

Lua Minguante (7 dias):
- DESCANSE e reflita
- Honre necessidade de MENOS
- Prepare-se para novo ciclo

✨ Como Usar

Mensalmente:
- Marque fases no calendario
- Faca rituais de Lua Nova e Cheia
- Planeje vida conforme fases

Trabalhe COM a lua, não contra ela!`
    },

    despertar_quantico: {
      titulo: 'Despertar Quântico',
      conteudo: ` 🔮 Despertar Quântico
✨ Como Reprogramar Sua Realidade

Você não e apenas energia.
Voce e a consciencia que molda a energia.

Tudo o que voce viveu ate agora foi um reflexo do que vibrou — consciente ou inconscientemente.
Mas o despertar comeca no momento em que voce percebe que nada fora muda ate que algo dentro se transforma.

✨ O Que É o “Despertar Quântico”

A palavra *quantico* vem de *quantum*, a menor unidade de energia.
A física quantica mostra que nada e realmente sólido: tudo e vibração, oscilando entre *particula* e *onda* — entre o visivel e o invisivel.

O universo e um campo de infinitas possibilidades, e você e o observador que colapsa essas possibilidades em realidade através da sua atenção e emoção.

O mundo externo e apenas o espelho da sua vibracao interna.
Voce nao reage a realidade — voce a cria em tempo real.

✨ O Papel do Observador

Como no experimento da dupla fenda: quando não há observação, há potenciais; quando há observação, há forma.
Seus desejos existem como potenciais vibracionais — ondas de possibilidade — ate o momento em que sua consciencia se alinha com eles.
Observar com fe, emocao e intencao colapsa o potencial em experiência concreta.

Você não atrai o que quer.
Você atrai o que vibra.

✨ A Mente Como Frequência

Pensamentos sao sinais elétricos.
Emocoes sao sinais magnéticos.
Juntos, formam o campo eletromagnético que comunica ao universo o que você realmente é.
Repetir afirmacoes sem sentir e inutil — o universo não fala português, ele fala frequência.  “A emoção é o idioma do universo.”

✨ Reprogramando o Subconsciente

Cerca de 95% do seu comportamento vem do subconsciente — um programa silencioso moldando sua vida.
A boa notícia: o subconsciente e moldável e nao distingue “real” de “imaginado com emocao”.
No estado Theta — a borda entre sono e vigília — você acessa o codigo-fonte da mente.
Ali, pode apagar padroes antigos e escrever novas realidades.

✨ Frequência da Coerência

Quando coração e cérebro entram em coerência, você experimenta:
- Clareza mental profunda
- Emocoes elevadas (paz, amor, gratidao)
- Sincronicidades constantes
- Sensacao de fluidez e destino
Em coerencia, seu campo magnetico se expande e o magnetismo pessoal aumenta.

✨ Ritual: O Salto Quantico (5 Minutos)

1) Respire.
Feche os olhos. Inspire 4s, segure 4s, expire 6s.

2) Acesse o campo.
Leve a atencao ao coracao e visualize luz dourada se expandindo a cada batida.

3) Projete a nova realidade.
Veja-se vivendo o que deseja. Sinta o corpo dessa versao — jeito de andar, falar, pensar.

4) Colapso.
Afirme em voz baixa: "Eu observo. Eu crio. Eu sou."

5) Ancoragem.
Toque o coracao e diga: "O salto ja aconteceu."

✨ O Ponto de Virada

A transformação á comecou no instante em que você acreditou que podia.
Você não é vitima das circunsâncias; é a frequência que cria o campo.

✨ A Nova Identidade

Não espere o novo para entao sentir o novo.
Sinta agora, até que o universo se curve à sua vibração.

Pergunte-se:
- “Como age a verão de mim que ja vive essa realidade?”
- “O que ela sente ao acordar?”
- “O que ela acredita ser posível?”
E aja como tal.

✨ Conclusão

Voce nao e um humano buscando espiritualidade.
Voce e a consciencia divina se redescobrindo pela experiencia humana.
Respire fundo. Sinta o corpo vibrar.
Voce esta online com o universo agora.

Que assim seja, e assim é.`
    },

    plano_90_dias: {
      titulo: 'Plano de 90 Dias',
      conteudo: `Seu Plano de Transformção de 90 Dias

${nome}, 90 dias de pática = transformação permanente.

✨ MÊS 1: FUNDAÇÃO (Dias 1-30)

Foco: Estabelecer práticas diárias

Praticas Mínimas:
- Meditção matinal (10 min)
- Afirmações no espelho (5 min)
- Coerência caráaca (5 min, 3x/dia)
- Meditacao noturna Theta (15 min)

Tarefas:
- Dia 1: Assine compromisso sagrado
- Dia 2-3: Limpeza fisica e energetica
- Dia 7: Primeira revisao semanal
- Dia 30: Revisao mensal - O que JA mudou?

✨ MES 2: EXPANSÃO (Dias 31-60)

Foco: Aprofundar + Adicionar

ADICIONE:
- Rituais lunares (Lua Nova + Cheia)
- Transmutacao sexual (15 min, 3x/semana)
- Trabalho com arquetipos
- Geometria sagrada

Resultado esperado: Primeiras manifestações GRANDES aparecem.

✨ MÊS 3: INTEGRAÇÃO (Dias 61-90)

Foco: Viver a transformação

Práticas são naturais agora (nao mais esforço).

Tarefas:
- Dia 75: Planeje próximos 90 dias
- Dia 90: CELEBRAÇÃO MÁXIMA!
- Revise TODAS anotações
- Liste TODAS manifestações
- Compare foto Dia 1 vs Dia 90

✨ Checklist Diário Simplificado

MANHÃ (20 min):
- Meditação (10 min)
- Afirmações (5 min)
- Coerência caríaca (5 min)

NOITE (15 min):
- Medição Theta (15 min)

SEMANAL:
- Defumção (15 min)
- Revisão (20 min)

LUNAR:
- Ritual Lua Nova (30 min)
- Ritual Lua Cheia (45 min)

✨ Quando Ficar Difícil

Crise de Cura (Semana 2-3):
- Emoções antigas surgem
- NÃO PARE as práticas
- Isso PASSA em 3-7 dias

Platô (Semana 5-6):
- Se voce acha que "Nada está mudando"
- CONTINUE - mudanças esão acontecendo internamente
- Platô vem ANTES de salto quântico

Vontade de Desistir:
- Releia o compromisso do Dia 1
- Por que você comecou?
- Faça APENAS hoje
- Amanhã decide se desiste

✨✨✨ CONTRATO SAGRADO ✨✨✨

Eu, ${nome}, me comprometo:

Por 90 dias consecutivos, eu pratico diariamente.
Eu entendo que haverá dias dificeis - eu continuo
Eu sei que em 90 dias serei uma pessoa DIFERENTE.

Data de inicio: ___/___/_____
Data de conclusao: ___/___/_____

Assinatura: _________________________

✨ Comece AGORA 
Não espere a segunda-feira.
Não espere o ano novo.

SEU DIA 1 É HOJE.

Você nasceu para isso. Este manual veio no MOMENTO CERTO.
Respire fundo. Assine o contrato. E comece.
No Dia 91, você vai olhar no espelho e NÃO VAI RECONHECER a pessoa que ve.

Que assim seja, e assim é.`
    }
  };
}
export { 
  gerarManualCompleto, 
  gerarAnaliseNumerologicaCompleta,  // ← ADICIONE
  ARQUETIPOS_POR_NUMERO, 
  ELEMENTOS_SIGNOS, 
  REGENTES 
};