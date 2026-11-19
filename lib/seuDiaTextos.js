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
