// lib/seuDiaTextos.js
// Textos fixos do Seu Dia (/seu-dia). Sem IA: custo zero por leitura.
// Tom do Manual: afirmativo, específico, sem "tende a".

// ── Temas: o título do dia sai da mistura das lentes (ver lib/seuDia.js) ─────

export const TEMAS = {
  dinheiro: {
    nome: 'Dinheiro',
    tons: {
      fluxo: { titulo: 'Dia de fazer dinheiro', frase: 'Os sinais se alinham pra ganho: proposta, venda e cobrança andam melhor hoje. Peça o que é seu.' },
      misto: { titulo: 'Dinheiro com cuidado', frase: 'Tem oportunidade na mesa, mas com ruído. Feche o que está claro e deixe o duvidoso pra depois.' },
      tensao: { titulo: 'Proteja o seu dinheiro', frase: 'Dia de pressão no bolso: gasto por impulso, empréstimo e promessa bonita custam caro hoje.' },
    },
    faca: ['Mandar a proposta ou cobrar quem te deve', 'Revisar preços e números', 'Negociar com calma, sem pressa de fechar'],
    evite: ['Compra por impulso', 'Emprestar dinheiro', 'Fechar negócio sem ler tudo'],
  },
  trabalho: {
    nome: 'Trabalho',
    tons: {
      fluxo: { titulo: 'Dia de ser vista no trabalho', frase: 'Reconhecimento e estrutura a seu favor: apresente, peça, assuma a frente.' },
      misto: { titulo: 'Trabalho com cobrança', frase: 'Vai ter entrega e vai ter cobrança. Organize antes de responder.' },
      tensao: { titulo: 'Pressão no trabalho', frase: 'Alguém vai testar o seu limite. Quem responde com estratégia sai com mais poder; quem responde com orgulho sai arranhada.' },
    },
    faca: ['Organizar as prioridades antes de tudo', 'Falar com quem decide', 'Entregar o que está pendente'],
    evite: ['Discutir com chefe ou cliente grande no calor', 'Assumir mais do que cabe', 'Responder no impulso'],
  },
  expressao: {
    nome: 'Expressão',
    tons: {
      fluxo: { titulo: 'Dia de se expressar', frase: 'Ideias fluem e as palavras chegam fácil: crie, publique, ensine, grave.' },
      misto: { titulo: 'Fale, mas escolha as palavras', frase: 'Criatividade alta e paciência baixa. O que você cria hoje é bom; o que você responde, nem sempre.' },
      tensao: { titulo: 'Língua afiada demais', frase: 'A vontade de falar tudo vem forte. Escreva primeiro, mande depois.' },
    },
    faca: ['Publicar ou gravar conteúdo', 'Colocar no papel a ideia que está na cabeça', 'Apresentar um projeto'],
    evite: ['Criticar em público', 'Mandar mensagem no calor da hora', 'Prometer sem pensar'],
  },
  relacoes: {
    nome: 'Pessoas',
    tons: {
      fluxo: { titulo: 'Dia das pessoas', frase: 'Encontros, conversas e afeto a favor. Bom pra marcar, reatar e fechar parceria.' },
      misto: { titulo: 'Pessoas, com paciência', frase: 'Tem gente boa por perto e tem ruído. Escute mais do que explica.' },
      tensao: { titulo: 'Atrito com quem está perto', frase: 'Casa, parceria ou sócio pedem cuidado. Converse cedo e não leve pro pessoal.' },
    },
    faca: ['Ter a conversa que você está adiando', 'Marcar um encontro', 'Pedir ajuda'],
    evite: ['Cobrar alguém em público', 'Discutir a relação à noite', 'Decidir pelos outros'],
  },
  recolhimento: {
    nome: 'Recolhimento',
    tons: {
      fluxo: { titulo: 'Dia de recarregar', frase: 'Estudo, intuição e descanso rendem mais que esforço hoje. O que você absorve agora vira força depois.' },
      misto: { titulo: 'Menos fora, mais dentro', frase: 'O mundo pede e o corpo pede pausa. Faça o essencial e guarde energia.' },
      tensao: { titulo: 'Proteja a sua energia', frase: 'Dia de cansaço e confusão emocional. Não decida nada grande; durma cedo.' },
    },
    faca: ['Estudar ou ler o que você adiou', 'Confiar na primeira intuição', 'Descansar de verdade'],
    evite: ['Agenda lotada', 'Decisões grandes', 'Absorver o problema dos outros'],
  },
  acao: {
    nome: 'Ação',
    tons: {
      fluxo: { titulo: 'Dia de começar', frase: 'Coragem e energia a favor: comece, peça, se mexa. O primeiro passo hoje vai longe.' },
      misto: { titulo: 'Ação com direção', frase: 'Energia alta e foco disperso. Escolha uma coisa e vá até o fim.' },
      tensao: { titulo: 'Competição no ar', frase: 'Tem disputa por espaço hoje. Mostre o que sabe fazer, sem entrar na briga dos outros.' },
    },
    faca: ['Começar o projeto que está parado', 'Mexer o corpo', 'Tomar a decisão que você vem adiando'],
    evite: ['Entrar em disputa por orgulho', 'Começar cinco coisas ao mesmo tempo', 'Gastar pra competir'],
  },
};

export const ORDEM_TEMAS = ['dinheiro', 'trabalho', 'expressao', 'relacoes', 'recolhimento', 'acao'];

// ── Lente 1: astrologia chinesa (Deus do dia sobre o Day Master) ─────────────

export const DEUS_DO_DIA = {
  amigo: { texto: 'Seu próprio elemento reforçado: autonomia e autoconfiança em alta. Bom pra fazer do seu jeito; ruim pra dividir espaço.', votos: { acao: 1, relacoes: 1 }, tom: 0, hora: 'tocar o que é só seu' },
  rival: { texto: 'Competição e gente disputando o mesmo espaço — ou o mesmo dinheiro. Ótimo pra se mexer; péssimo pra emprestar.', votos: { acao: 2 }, tom: -1, hora: 'vender com garra, competir' },
  deusComida: { texto: 'Expressão leve e prazer: o que você cria hoje sai com facilidade. Coma bem, publique, ensine.', votos: { expressao: 2 }, tom: 1, hora: 'criar, gravar, comer bem' },
  oficialFerido: { texto: 'Ideias geniais e língua afiada. Dia de inovar e quebrar regra — sem quebrar ponte.', votos: { expressao: 2 }, tom: -1, hora: 'ter ideias, escrever, inovar' },
  riquezaIndireta: { texto: 'Dinheiro de oportunidade: venda, comissão, negócio paralelo. Diga sim ao que aparece, de olho no risco.', votos: { dinheiro: 2 }, tom: 0, hora: 'proposta, venda, negociação' },
  riquezaDireta: { texto: 'Dinheiro de constância: cobrar, organizar as finanças, fechar o que está combinado.', votos: { dinheiro: 2 }, tom: 1, hora: 'finanças, cobrança, fechar contas' },
  seteMatancas: { texto: 'Pressão direta. Alguém ou algo vai testar o seu limite — estratégia vence orgulho.', votos: { trabalho: 2, acao: 1 }, tom: -1, hora: 'enfrentar o que você vem adiando' },
  oficialDireto: { texto: 'Estrutura, regras e reconhecimento. Dia de se apresentar bem e cumprir o combinado.', votos: { trabalho: 2 }, tom: 0, hora: 'reunião formal, se apresentar' },
  recursoIndireto: { texto: 'Intuição e estudo fora do padrão. Bom pra aprender algo diferente; ruim pra se isolar demais.', votos: { recolhimento: 2 }, tom: 0, hora: 'estudar, meditar, ouvir a intuição' },
  recursoDireto: { texto: 'Apoio e proteção: mentores, estudo, descanso. O dia te nutre — aceite ajuda.', votos: { recolhimento: 2 }, tom: 1, hora: 'pedir ajuda, estudar, descansar' },
};

// ── Lente 2: numerologia (dia pessoal) ───────────────────────────────────────

export const DIA_PESSOAL = {
  1: { palavra: 'começos', texto: 'Dia de iniciar. O que você começa hoje carrega a sua marca.', tema: 'acao' },
  2: { palavra: 'parcerias', texto: 'Dia de cooperar e escutar. A força está no "nós", não no "eu".', tema: 'relacoes' },
  3: { palavra: 'expressão', texto: 'Dia de comunicar, criar e se mostrar.', tema: 'expressao' },
  4: { palavra: 'estrutura', texto: 'Dia de organizar e colocar ordem. Trabalho bem feito rende.', tema: 'trabalho' },
  5: { palavra: 'mudança', texto: 'Dia de movimento e imprevisto. Flexibilidade vale mais que plano.', tema: 'acao' },
  6: { palavra: 'cuidado', texto: 'Dia de casa, família e responsabilidade afetiva.', tema: 'relacoes' },
  7: { palavra: 'introspecção', texto: 'Dia de pensar, estudar e ficar um pouco só.', tema: 'recolhimento' },
  8: { palavra: 'poder', texto: 'Dia de negociar, cobrar e assumir o comando.', tema: 'dinheiro' },
  9: { palavra: 'encerramento', texto: 'Dia de fechar ciclos e soltar o que não serve mais.', tema: 'recolhimento' },
  11: { palavra: 'intuição', texto: 'Número mestre: intuição altíssima. Confie no que você sente antes de saber explicar.', tema: 'recolhimento' },
  22: { palavra: 'grandes obras', texto: 'Número mestre: dia de construir algo grande e concreto.', tema: 'trabalho' },
  33: { palavra: 'serviço', texto: 'Número mestre: dia de cuidar, ensinar e servir.', tema: 'relacoes' },
};

// ── Lente 3: a Lua do dia no seu mapa ────────────────────────────────────────

export const SIGNOS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];

export const LUA_NO_SIGNO = {
  'Áries': { clima: 'impaciência e coragem', tema: 'acao' },
  'Touro': { clima: 'calma, prazer e dinheiro', tema: 'dinheiro' },
  'Gêmeos': { clima: 'conversa e curiosidade', tema: 'expressao' },
  'Câncer': { clima: 'emoção e casa', tema: 'relacoes' },
  'Leão': { clima: 'vontade de brilhar', tema: 'expressao' },
  'Virgem': { clima: 'foco em detalhe e rotina', tema: 'trabalho' },
  'Libra': { clima: 'diplomacia e beleza', tema: 'relacoes' },
  'Escorpião': { clima: 'intensidade e desconfiança', tema: 'recolhimento' },
  'Sagitário': { clima: 'otimismo e vontade de expandir', tema: 'acao' },
  'Capricórnio': { clima: 'seriedade e trabalho', tema: 'trabalho' },
  'Aquário': { clima: 'ideias e distanciamento', tema: 'expressao' },
  'Peixes': { clima: 'intuição e sensibilidade', tema: 'recolhimento' },
};

export const ASPECTO_LUA = {
  conjuncao: { nome: 'no seu signo', texto: 'A Lua passa pelo seu signo: você sente tudo mais forte e fica mais visível.', tom: 1 },
  trigono: { nome: 'em harmonia com o seu Sol', texto: 'A Lua está em harmonia com o seu Sol: o dia flui no seu jeito natural.', tom: 1 },
  sextil: { nome: 'conversando com o seu Sol', texto: 'A Lua conversa bem com o seu Sol: pequenas oportunidades aparecem se você se mexer.', tom: 1 },
  quadratura: { nome: 'em tensão com o seu Sol', texto: 'A Lua faz tensão com o seu Sol: o clima do dia não é o seu ritmo — ajuste em vez de brigar.', tom: -1 },
  oposicao: { nome: 'oposta ao seu Sol', texto: 'A Lua está oposta ao seu Sol: os outros puxam pra direção contrária. Bom pra negociar, ruim pra impor.', tom: -1 },
  neutro: { nome: 'sem tocar o seu Sol', texto: 'A Lua não toca o seu Sol hoje: o clima fica de fundo, sem empurrão nem freio.', tom: 0 },
};

export const RETORNO_LUNAR = 'E ela está no mesmo signo da sua Lua de nascimento: emoções à flor da pele hoje.';

// ── Lente 4: tarô (carta pessoal do dia) — por id do arcano em lib/tarot.js ──

export const TAROT_TEMA = [
  'acao', 'acao', 'recolhimento', 'dinheiro', 'trabalho', 'recolhimento', 'relacoes', 'acao',
  'acao', 'recolhimento', 'dinheiro', 'trabalho', 'recolhimento', 'acao', 'relacoes', 'dinheiro',
  'acao', 'expressao', 'recolhimento', 'expressao', 'trabalho', 'trabalho',
];
/** Cartas que pesam pra cima (+1) ou pra baixo (−1) no tom do dia. */
export const TAROT_TOM = { 10: 1, 17: 1, 19: 1, 21: 1, 15: -1, 16: -1, 18: -1 };

// ── Relações do dia com os ramos do mapa ─────────────────────────────────────

/** Com preposição, pra encaixar depois de "apoio", "atrito"… */
export const AREA_POSICAO = {
  ano: 'na sua imagem e na família',
  mes: 'no trabalho',
  dia: 'em casa e na relação',
  hora: 'nos projetos pessoais',
};
/** Forma curta, entre parênteses. */
export const AREA_CURTA = {
  ano: 'imagem e família',
  mes: 'trabalho',
  dia: 'casa e relação',
  hora: 'projetos pessoais',
};
/** O que evitar numa hora que choca com aquele ramo. */
export const EVITAR_NA_HORA = {
  ano: 'assunto de família',
  mes: 'reunião importante',
  dia: 'conversa difícil em casa',
  hora: 'decidir sobre projetos pessoais',
};
export const NOME_POSICAO = { ano: 'do ano', mes: 'do mês', dia: 'do dia', hora: 'da hora' };

const FEMININOS = new Set(['Serpente', 'Cabra']);
/** "o Galo" / "a Cabra" */
export function oAnimal(animal, maiuscula = false) {
  const a = FEMININOS.has(animal) ? 'a' : 'o';
  return `${maiuscula ? a.toUpperCase() : a} ${animal}`;
}
/** "seu Coelho" / "sua Serpente" */
export function seuAnimal(animal) {
  return `${FEMININOS.has(animal) ? 'sua' : 'seu'} ${animal}`;
}

export const VERBO_RELACAO = {
  trio: { verbo: 'forma trio com', efeito: 'apoio {area}' },
  combinacao: { verbo: 'se combina com', efeito: 'acordos fáceis {area}' },
  choque: { verbo: 'choca com', efeito: 'mexida {area} — nada definitivo sobre isso hoje' },
  punicao: { verbo: 'pune', efeito: 'cobrança e atrito {area}' },
  dano: { verbo: 'fere', efeito: 'mal-entendido {area}' },
};

/** Evite específico quando o dia choca com um ramo do mapa. */
export const EVITE_CHOQUE = {
  ano: 'Briga em família',
  mes: 'Decisão grande de carreira',
  dia: 'Discussão em casa ou com o parceiro',
  hora: 'Decidir sobre os seus projetos pessoais',
};

// ── Push das 7h ──────────────────────────────────────────────────────────────

export const TITULO_PUSH = (nome, titulo) => (nome ? `${nome}, hoje: ${titulo.toLowerCase()}` : `Hoje: ${titulo.toLowerCase()}`);

// ── Explicações do Seu Dia Completo ──────────────────────────────────────────
// (o resumo grátis não usa nada daqui)

/** O que cada um dos 4 animais do mapa representa. */
export const POSICAO_EXPLICA = {
  ano: { rotulo: 'Animal do ano', area: 'Imagem e família', texto: 'É o animal do seu ano de nascimento — o "signo chinês" que todo mundo conhece. No mapa, fala de como os outros te veem e da sua família.' },
  mes: { rotulo: 'Animal do mês', area: 'Trabalho', texto: 'É o animal do mês em que você nasceu. Fala do seu trabalho, da carreira e do ambiente em que você rende.' },
  dia: { rotulo: 'Animal do dia', area: 'Casa e relação', texto: 'É o animal do dia em que você nasceu, o mais íntimo do mapa. Fala de você por dentro, da sua casa e da sua relação amorosa.' },
  hora: { rotulo: 'Animal da hora', area: 'Projetos pessoais', texto: 'É o animal da hora em que você nasceu. Fala dos seus projetos pessoais, do que você cria e do seu futuro.' },
};

/** O que cada tipo de relação entre dois animais significa. */
export const TIPO_RELACAO = {
  trio: { nome: 'Trio', hanzi: '三合', oQue: 'Os dois animais são do mesmo time no zodíaco chinês: um reforça o outro.' },
  combinacao: { nome: 'Combinação', hanzi: '六合', oQue: 'Os dois animais formam um par que se completa: atração e acordo.' },
  choque: { nome: 'Choque', hanzi: '冲', oQue: 'Os dois animais são opostos no zodíaco chinês (a 6 casas de distância): puxam pra lados contrários. Traz movimento, mudança e instabilidade.' },
  punicao: { nome: 'Punição', hanzi: '刑', oQue: 'Os dois animais fazem parte de um grupo que se desgasta: cobrança, atrito com autoridade, regra que aperta.' },
  dano: { nome: 'Dano', hanzi: '害', oQue: 'Atrito discreto: não é briga aberta, é ruído — mal-entendido, alguém que atrapalha sem aparecer.' },
};

/** O que fazer com cada relação, por área do mapa. */
export const NA_PRATICA = {
  trio: {
    ano: 'As pessoas te leem com bons olhos hoje: bom dia pra aparecer, postar, se apresentar e encontrar a família.',
    mes: 'O trabalho flui: colegas colaboram, reunião rende, pedido é atendido. Use pra destravar o que depende dos outros.',
    dia: 'Apoio em casa e na relação: bom dia pra conversa a dois, programa juntos ou pedir ajuda pra quem mora com você.',
    hora: 'Seus projetos pessoais ganham empurrão: avance naquilo que é só seu e vive ficando pra depois.',
  },
  combinacao: {
    ano: 'Alianças com a família e com quem te vê de fora: bom dia pra acertar algo com parentes ou fechar parceria pública.',
    mes: 'Acordo fácil no trabalho: negociar com chefe, fornecedor ou cliente rende mais hoje.',
    dia: 'Atração e cumplicidade na relação: dia bom pra encontro, reconciliação ou conversa sobre o futuro a dois.',
    hora: 'Alguém aparece pra somar num projeto seu. Aceite a ajuda.',
  },
  choque: {
    ano: 'Sua imagem fica em evidência — pra bem ou pra mal. Evite polêmica pública e assunto delicado com a família.',
    mes: 'O trabalho sacode: mudança de plano, cobrança inesperada, alguém muda as regras. Não tome decisão grande de carreira hoje.',
    dia: 'Tensão em casa ou na relação. Converse cedo, sem cansaço, e não transforme detalhe em briga.',
    hora: 'Seus projetos pessoais balançam: dúvida, atraso, vontade de largar tudo. Não decida nada definitivo sobre eles hoje.',
  },
  punicao: {
    ano: 'Cobrança vinda da família ou de quem cuida da sua imagem. Responda com calma — e por escrito, se puder.',
    mes: 'Atrito com autoridade no trabalho: chefe, cliente grande, órgão público. Cumpra prazo e regra ao pé da letra.',
    dia: 'Desgaste na relação por cobrança — sua ou do outro. Troque crítica por pedido claro.',
    hora: 'Você se cobra demais pelos seus projetos hoje. Faça uma parte pequena e pare.',
  },
  dano: {
    ano: 'Ruído na sua imagem ou na família: alguém entende errado o que você disse. Revise mensagens antes de mandar.',
    mes: 'Mal-entendido no trabalho: confirme os combinados por escrito.',
    dia: 'Pequenos ruídos em casa. Não leve pro pessoal o que foi só cansaço.',
    hora: 'Alguém atrapalha um projeto seu sem perceber. Proteja o seu tempo.',
  },
};

export const NEUTRO_PRATICA = 'Neutro hoje: o dia não mexe nessa área — nem empurrão, nem freio.';

/** Como o elemento do dia age sobre o seu (por relação no ciclo dos 5 elementos). */
export const GERA = ['A Madeira alimenta o Fogo', 'O Fogo vira cinza e forma a Terra', 'A Terra guarda o Metal', 'O Metal condensa a Água', 'A Água nutre a Madeira'];
export const CONTROLA = ['A Madeira rompe a Terra', 'O Fogo derrete o Metal', 'A Terra represa a Água', 'O Metal corta a Madeira', 'A Água apaga o Fogo'];

/** O que esperar e como usar cada Deus do dia (versão longa). */
export const DEUS_EXPLICA = {
  amigo: { esperar: 'Você se sente mais segura e independente. Gente parecida com você aparece — parceria de igual pra igual ou disputa por espaço.', usar: 'Faça sozinha o que depende só de você. Evite dividir crédito ou dinheiro hoje.' },
  rival: { esperar: 'Competição: alguém quer o mesmo cliente, o mesmo lugar, a mesma atenção. Também vem coragem pra arriscar.', usar: 'Venda, compita, se mexa. Não empreste dinheiro e não entre em sociedade nova hoje.' },
  deusComida: { esperar: 'Leveza e criatividade: as ideias saem prontas, a comida fica mais gostosa, o conteúdo flui.', usar: 'Crie, grave, ensine, publique. Bom dia pra prazer sem culpa.' },
  oficialFerido: { esperar: 'Ideias brilhantes e paciência curta. Vontade de questionar regra e chefe.', usar: 'Use a afiação pra inovar e escrever. Antes de criticar alguém, durma em cima.' },
  riquezaIndireta: { esperar: 'Oportunidade solta: venda inesperada, comissão, convite. Dinheiro que vem de fora da rotina.', usar: 'Diga sim e faça proposta. Gaste com cuidado — o que entra fácil sai fácil.' },
  riquezaDireta: { esperar: 'Dinheiro de rotina e controle: o que é seu por direito, cobranças, organização.', usar: 'Cobre, organize a planilha, feche contas. Bom dia pra compra planejada.' },
  seteMatancas: { esperar: 'Pressão direta: prazo, cobrança, alguém que te desafia. É o dia mais duro do ciclo de 10.', usar: 'Responda com estratégia, não com orgulho. Enfrente o que você vem adiando — hoje você tem força pra isso.' },
  oficialDireto: { esperar: 'Estrutura e reconhecimento: regras, contratos, quem manda presta atenção em você.', usar: 'Apresente trabalho, assine, cumpra o combinado. Postura profissional rende.' },
  recursoIndireto: { esperar: 'Introspecção e intuição: vontade de ficar quieta, estudar algo diferente, ouvir o que não foi dito.', usar: 'Estude, medite, planeje. Só não suma pra quem precisa de você.' },
  recursoDireto: { esperar: 'Apoio: alguém te ajuda, o corpo pede descanso, aprender fica fácil.', usar: 'Peça ajuda, faça aquele curso, durma bem. Aceite cuidado sem achar que deve algo.' },
};

/** Por que o Deus se chama assim (relação do elemento do dia com o seu). */
export const RELACAO_DEUS = {
  mesmo: 'O dia tem o mesmo elemento que você: é como um espelho, reforça quem você é.',
  gero: 'O seu elemento gera o do dia: a energia sai de você em forma de expressão, ideia e criação.',
  controlo: 'O seu elemento domina o do dia. No sistema chinês, o que você domina é dinheiro e resultado.',
  controla: 'O elemento do dia controla o seu. No sistema chinês, o que te controla é pressão, regra e autoridade.',
  gera: 'O elemento do dia nutre o seu. No sistema chinês, o que te nutre é apoio, estudo e proteção.',
};
export const POLARIDADE = {
  igual: 'Mesma polaridade: a força chega direta, sem filtro — mais intensa.',
  oposta: 'Polaridade oposta: a força chega organizada — mais fácil de usar.',
};

/** Numerologia — versão longa do dia pessoal. */
export const DIA_PESSOAL_LONGO = {
  1: 'O 1 abre ciclos. O que você começa hoje tem força pra durar: mande a primeira mensagem, faça o primeiro rascunho, dê o primeiro passo. Esperar aprovação dos outros enfraquece o dia.',
  2: 'O 2 é o número do par. Hoje rende mais quem escuta, negocia e divide. Bom dia pra parceria, ruim pra decidir tudo sozinha.',
  3: 'O 3 é expressão. Fale, escreva, apareça. O risco é se espalhar em muitas conversas e não concluir nenhuma.',
  4: 'O 4 é estrutura. Dia de planilha, rotina, organização e trabalho bem feito. Pouco glamour, muito resultado.',
  5: 'O 5 é movimento. Imprevisto, mudança de plano, novidade. Quem é flexível ganha; quem se agarra ao plano se frustra.',
  6: 'O 6 é cuidado. Casa, família, responsabilidade afetiva. Bom dia pra cuidar de alguém — sem esquecer de você.',
  7: 'O 7 é introspecção. Estudo, silêncio, análise. Dia ruim pra agenda cheia, ótimo pra pensar com calma.',
  8: 'O 8 é poder e dinheiro. Negocie, cobre, assuma o comando. O que você pede hoje tem mais peso.',
  9: 'O 9 encerra ciclos. Termine, entregue, limpe, solte. Começar algo grande hoje rende menos que concluir o que está aberto.',
  11: 'O 11 é número mestre da intuição. Você sente antes de saber explicar — confie. Também é dia de sensibilidade alta.',
  22: 'O 22 é número mestre do construtor. Dia de pensar grande e concreto: projeto de longo prazo, base sólida.',
  33: 'O 33 é número mestre do cuidado. Ensinar, acolher e servir rendem mais que competir.',
};

/** Astrologia — o que cada aspecto da Lua com o Sol significa em graus e elementos. */
export const ASPECTO_EXPLICA = {
  conjuncao: 'Mesmo signo do seu Sol.',
  trigono: 'Ângulo de 120°: signos do mesmo elemento — conversam fácil.',
  sextil: 'Ângulo de 60°: elementos que se ajudam.',
  quadratura: 'Ângulo de 90°: elementos que se estranham.',
  oposicao: 'Ângulo de 180°: signos opostos, que puxam pra lados contrários.',
  neutro: 'Signos sem aspecto clássico entre si.',
};
