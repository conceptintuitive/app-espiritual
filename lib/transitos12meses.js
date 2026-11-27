// lib/transitos12meses.js
// Projeção numerológica de 12 meses a partir de hoje (rolling window, não
// ano-calendário) — usa Ano Pessoal + Mês Pessoal (lib/calculos.js) pra montar
// um tema por mês. Autocontido: não depende de manualgenerator.js nem do
// mapaSintese (a ligação com o mapa recebe a convergência pronta).
//
// Textos revisados em nov/2026 (Previsão do Ano no visual novo): sem
// "ansiedade", sem "tende a", sem "não é X, é Y", sem travessão, sem emoji,
// e sem "o mês anterior" (na virada de ano o Mês Pessoal anda pra trás: o de
// janeiro é o de dezembro menos 1). Testado em tests/transitos12meses.test.js.

import { calcularAnoPessoal, calcularMesPessoal } from './calculos.js';

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Tema por Mês Pessoal — tom prático/orientado a ação (diferente do
// essencia/forca/sombra/cura mais introspectivo usado no manual completo).
// texto: parágrafo mais longo, explicando o mecanismo do mês.
// foco: o que esse mês favorece (3 pontos).
// atencao: o que costuma sair errado nesse ciclo (2 pontos).
export const MES_TEMA = {
  1: {
    titulo: 'Começos',
    texto: 'Um ciclo novo de nove meses começa agora, e ele pede o primeiro passo antes da certeza absoluta. A energia do mês empurra pra frente: em vez de revisar o mesmo plano mais uma vez, teste na prática. O que for iniciado agora carrega o impulso dos próximos meses.',
    foco: [
      'Abrir algo que estava só no papel ou na cabeça',
      'Tomar a iniciativa em vez de esperar o convite',
      'Decidir rápido e ajustar o rumo andando',
    ],
    atencao: [
      'Impaciência com quem ainda não está no seu ritmo',
      'Atropelar quem precisa participar da decisão',
    ],
  },
  2: {
    titulo: 'Parcerias',
    texto: 'Esse ciclo pede colaboração. Carregando tudo por conta própria, o avanço fica mais lento e mais desgastante do que precisaria ser. É um mês de escuta, de ajustar o passo com o outro e de deixar a coisa crescer em dupla.',
    foco: [
      'Buscar parcerias em vez de resolver tudo por conta própria',
      'Escutar antes de responder, inclusive as discordâncias',
      'Ajustar o ritmo ao de quem está do seu lado',
    ],
    atencao: [
      'Ceder demais só pra evitar atrito e perder o próprio eixo',
      'Esperar que o outro adivinhe o que você precisa',
    ],
  },
  3: {
    titulo: 'Expressão',
    texto: 'A energia se volta pra fora: comunicar, criar, mostrar o que vem sendo construído em silêncio. Visibilidade e leveza são aliadas neste mês, e ficar nos bastidores agora represa algo que precisava circular. Ideias soltas ganham forma quando são ditas em voz alta.',
    foco: [
      'Comunicar o que você anda pensando ou fazendo',
      'Criar sem exigir perfeição no primeiro rascunho',
      'Aparecer em conversas, redes e apresentações',
    ],
    atencao: [
      'Dispersão: começar três coisas e não aprofundar nenhuma',
      'Falar muito do plano e entregar pouco dele',
    ],
  },
  4: {
    titulo: 'Fundação',
    texto: 'Chega a hora do trabalho que ninguém vê de fora: organizar, estruturar, pôr ordem no que estava solto. O mês tem pouco brilho e sustenta os próximos: o que for bem construído agora evita retrabalho lá na frente. Rotina e método rendem mais que motivação.',
    foco: [
      'Organizar processos, finanças ou rotina',
      'Terminar tarefas de bastidor que estavam adiadas',
      'Construir com método, mesmo que devagar',
    ],
    atencao: [
      'Rigidez: travar tudo tentando deixar perfeito antes de agir',
      'Trabalhar tanto que não sobra tempo de descanso',
    ],
  },
  5: {
    titulo: 'Mudança',
    texto: 'Um período de movimento e imprevisto. Planos rígidos quebram com facilidade aqui, porque esse ciclo pede flexibilidade real. É um bom mês pra experimentar, viajar e mudar de rota, e um mês difícil pra quem quer controlar cada detalhe do roteiro.',
    foco: [
      'Abrir espaço pro imprevisto em vez de lutar contra ele',
      'Experimentar algo fora da rotina (viagem, curso, mudança pequena)',
      'Soltar um pouco o controle sobre como as coisas "deveriam" acontecer',
    ],
    atencao: [
      'Excesso: mudanças demais ao mesmo tempo',
      'Largar no meio um compromisso importante só pela novidade',
    ],
  },
  6: {
    titulo: 'Cuidado',
    texto: 'Vínculos entram em primeiro plano: família, relacionamento, responsabilidades que envolvem outras pessoas. É um mês de presença de verdade, além de resolver a logística dos outros. O que foi deixado de lado nos laços mais próximos pede atenção agora, e o que for cuidado com presença se fortalece.',
    foco: [
      'Dar presença de qualidade a quem importa',
      'Assumir responsabilidades que vinham sendo adiadas',
      'Cuidar sem se anular no processo',
    ],
    atencao: [
      'Sobrecarga: virar quem resolve tudo pra todo mundo',
      'Cobrar gratidão por um cuidado que ninguém pediu',
    ],
  },
  7: {
    titulo: 'Introspecção',
    texto: 'O ritmo desacelera, e é exatamente isso que o mês pede. Menos ruído de fora, mais espaço pra processar o que aconteceu nos últimos meses. Decisões grandes tomadas sob pressão agora pedem ajuste depois; as que esperam a clareza chegar duram mais.',
    foco: [
      'Dar espaço pra silêncio, estudo ou introspecção',
      'Adiar decisões grandes até sentir clareza',
      'Confiar na percepção mais sutil, mesmo sem prova concreta ainda',
    ],
    atencao: [
      'Confundir recolhimento com fuga de conversas que precisam acontecer',
      'Analisar tanto que a decisão não sai',
    ],
  },
  8: {
    titulo: 'Resultado',
    texto: 'O que foi plantado nos últimos meses aparece em forma de consequência prática: dinheiro, reconhecimento ou, se algo ficou de lado, a conta disso. É um mês de números, de acertar contas, literais e figuradas, e de assumir posição em vez de esperar que o mérito seja notado sozinho.',
    foco: [
      'Revisar e organizar as finanças de forma direta',
      'Negociar, pedir reconhecimento ou fechar acordos',
      'Assumir mais autoridade sobre o que você já construiu',
    ],
    atencao: [
      'Usar poder ou controle no lugar de uma conversa franca',
      'Aceitar um acordo ruim pela pressa de fechar',
    ],
  },
  9: {
    titulo: 'Fechamento',
    texto: 'Último mês do ciclo de nove: hora de soltar o que já cumpriu a função antes de virar a página. Começar algo grande agora frustra, porque a energia do mês é de encerramento. O que for solto com consciência abre espaço para o ciclo que vem.',
    foco: [
      'Encerrar o que já não faz sentido carregar',
      'Fazer as pazes com capítulos que ficaram em aberto',
      'Revisar o ciclo inteiro antes de olhar pro que vem',
    ],
    atencao: [
      'Começar algo grande demais justo neste mês',
      'Arrastar pro ciclo novo o que já devia ter ficado pra trás',
    ],
  },
  11: {
    titulo: 'Intuição amplificada',
    texto: 'Mês Pessoal mestre: a sensibilidade e a percepção ficam mais agudas que o normal, às vezes de um jeito quase desconfortável. O que você sente sobre uma situação chega antes da explicação racional, e vale confiar nesse sinal em vez de forçar uma análise que ainda não fechou.',
    foco: [
      'Confiar em pressentimentos, mesmo sem prova lógica ainda',
      'Prestar atenção em sinais e coincidências que se repetem',
      'Reduzir ruído externo pra não abafar essa sensibilidade',
    ],
    atencao: [
      'Captar demais e não separar o que é seu do que é do ambiente',
      'Tomar uma decisão grande no calor de uma sensação forte',
    ],
  },
  22: {
    titulo: 'Construção em grande escala',
    texto: 'Mês Pessoal mestre: o foco sai do imediato e vai pra visão de longo prazo. Decisões tomadas agora pesam muito além do mês, então vale pensar em estrutura antes de resolver o problema da semana. Bom momento pra planejar algo que leva tempo pra amadurecer.',
    foco: [
      'Planejar com visão de médio e longo prazo',
      'Investir tempo em algo que só dá retorno mais à frente',
      'Pensar estrutura antes de pensar tática',
    ],
    atencao: [
      'Paralisia por grandiosidade: o plano ficar grande demais pra sair do papel',
      'Cobrar de si em um mês um resultado de um ano inteiro',
    ],
  },
  33: {
    titulo: 'Entrega',
    texto: 'Mês Pessoal mestre: o que você oferece às pessoas ao redor ganha um peso especial, como se a sua presença tivesse mais efeito que o normal. É um mês fértil pra ensinar, cuidar ou liderar pelo exemplo, e o risco real é se doar tanto que sobra pouco pra você.',
    foco: [
      'Oferecer apoio, ensinar ou cuidar de quem está ao redor',
      'Liderar pelo exemplo',
      'Reservar tempo de recuperação proporcional ao que foi entregue',
    ],
    atencao: [
      'Esquecer de si até o esgotamento, achando que descansar é egoísmo',
      'Assumir problemas que pertencem a outras pessoas',
    ],
  },
};

// ── Ano Pessoal (topo da Previsão e o divisor da virada de ano) ─────────────
export const ANO_TEMA = {
  1: { titulo: 'O ano de começar', texto: 'Começa um ciclo novo de nove anos. É o ano de abrir caminhos, decidir por conta própria quando for preciso e dar o primeiro passo antes de ter todas as respostas. O que você iniciar agora dá o tom dos próximos anos.' },
  2: { titulo: 'O ano de juntar forças', texto: 'O ritmo fica mais lento e mais coletivo. É o ano de parcerias, acordos e paciência: o que cresce agora cresce em dupla. Escutar e ajustar o passo com o outro rende mais que forçar.' },
  3: { titulo: 'O ano de aparecer', texto: 'A energia vai pra fora: comunicar, criar e mostrar o que você vem construindo. É um ano de visibilidade, contatos novos e leveza. O risco é se espalhar em muitas frentes e não aprofundar nenhuma.' },
  4: { titulo: 'O ano de construir a base', texto: 'É o ano do trabalho que sustenta os próximos: rotina, método, organização e disciplina. O brilho fica pra depois: o que for bem feito agora evita retrabalho nos próximos anos. Constância rende mais que motivação.' },
  5: { titulo: 'O ano da mudança', texto: 'Chega movimento: viagens, mudanças de rota, experiências novas. É um ano pra testar, arriscar com critério e deixar o plano respirar. Segurar o controle demais cansa mais neste ano do que em qualquer outro.' },
  6: { titulo: 'O ano do cuidado', texto: 'Casa, família, relacionamentos e responsabilidades entram em primeiro plano. É o ano de assumir compromissos com quem você ama e de ajustar a vida doméstica. O cuidado vale também pra você: quem cuida de todo mundo precisa de pausa.' },
  7: { titulo: 'O ano de olhar pra dentro', texto: 'O ritmo desacelera de propósito. É o ano de estudar, refletir, rever crenças e confiar mais na percepção do que na pressa. Decisões grandes rendem mais quando esperam a clareza chegar.' },
  8: { titulo: 'O ano do resultado', texto: 'É o ano em que o que foi construído nos últimos anos pede retorno: dinheiro, reconhecimento, posição. Hora de negociar, assumir autoridade e cuidar dos números de perto. Poder e responsabilidade andam juntos neste ciclo.' },
  9: { titulo: 'O ano de fechar o ciclo', texto: 'Último ano do ciclo de nove. É hora de encerrar o que já cumpriu o papel, soltar, perdoar e abrir espaço pro próximo Ano 1. Começos grandes rendem menos agora; fechamentos bem feitos rendem muito.' },
  11: { titulo: 'O ano da intuição', texto: 'Ano Pessoal mestre, com a base do 2: parcerias e paciência, com a percepção mais aguda que o normal. É um ano pra confiar no que você sente antes de conseguir explicar, e pra separar o que é seu do que é do ambiente.' },
  22: { titulo: 'O ano das grandes obras', texto: 'Ano Pessoal mestre, com a base do 4: trabalho e estrutura, em escala maior. É o ano de planejar algo que leva tempo pra amadurecer e de pensar em estrutura antes de tática. O risco é o plano ficar grande demais pra sair do papel.' },
  33: { titulo: 'O ano da entrega', texto: 'Ano Pessoal mestre, com a base do 6: cuidado e responsabilidade, com mais alcance. É um ano fértil pra ensinar, orientar e liderar pelo exemplo. A entrega precisa de limite: reserve tempo de recuperação proporcional ao que você oferece.' },
};

// ── Contexto do ano em cada mês ("Num Ano 7, …") ────────────────────────────
// Uma frase por combinação Ano Pessoal × Mês Pessoal que existe de fato (com
// Mês = Ano + mês do calendário, nem toda combinação acontece). Os anos
// mestres usam a base (11 → 2, 22 → 4, 33 → 6) com o número de verdade na
// frase; as combinações que só existem neles têm frase própria.
const BASE_MESTRE = { 11: 2, 22: 4, 33: 6 };

export const CONTEXTO_DO_ANO = {
  1: {
    1: 'esse começo vale em dobro: o que você abrir agora dá o tom dos próximos nove anos.',
    2: 'essa parceria serve ao que é seu: aceite ajuda sem entregar a direção.',
    3: 'mostre o que você está começando: é assim que as pessoas certas ficam sabendo.',
    4: 'essa organização tira o começo do papel: dê forma e rotina ao que você iniciou.',
    5: 'essa mudança faz parte do começo: ajuste o plano novo sem largar a direção.',
    6: 'esse cuidado inclui você: abra espaço pro seu projeto sem deixar quem depende de você.',
    7: 'essa pausa serve pra conferir o rumo do que você começou antes de acelerar de novo.',
    8: 'essa colheita mede o começo: olhe pros primeiros números do que você abriu este ano.',
    9: 'esse fechamento abre espaço: solte o que ainda prende o seu começo.',
    11: 'a intuição aponta o caminho novo: anote os sinais antes de decidir o próximo passo.',
  },
  2: {
    1: 'esse começo pede companhia: inicie junto com alguém de confiança.',
    3: 'aparecer funciona melhor em dupla: divida o palco com quem está do seu lado.',
    4: 'essa organização envolve outras pessoas: combine papéis e prazos às claras.',
    5: 'essa mudança mexe com quem está perto: converse antes de mudar o plano.',
    6: 'esse cuidado passa pelos vínculos mais próximos: escute antes de resolver.',
    7: 'essa pausa ajuda a ouvir o que as suas relações estão pedindo.',
    8: 'essa colheita é dividida: reconheça quem construiu com você e acerte as contas.',
    9: 'esse fechamento passa pelas relações: encerre com cuidado o que já não é parceria.',
    11: 'a sensibilidade fica no máximo nas relações: perceba o que não está sendo dito.',
  },
  3: {
    1: 'esse começo pede plateia: comece algo que você possa mostrar.',
    3: 'aparecer está no volume máximo: é o mês do ano pra falar, publicar e apresentar.',
    4: 'essa organização dá forma às ideias: escolha uma e coloque prazo.',
    5: 'essa mudança vem pela conversa: deixe uma ideia nova mudar o seu rumo.',
    6: 'esse cuidado se mostra em palavras: diga a quem importa o que você sente.',
    7: 'essa pausa recarrega a criatividade: escreva e guarde ideias sem mostrar ainda.',
    8: 'essa colheita vem da visibilidade: cobre pelo que você mostrou e entregou.',
    9: 'esse fechamento passa pela fala: diga o que precisa ser dito antes de virar a página.',
    11: 'a intuição chega em forma de ideia: anote o que aparecer antes de explicar pra alguém.',
  },
  4: {
    1: 'esse começo precisa de método: comece com rotina e prazo definidos.',
    3: 'aparecer é mostrar o que já está de pé: apresente o que você construiu.',
    4: 'essa organização vale em dobro: é o mês do ano pra arrumar processos, contas e rotina.',
    5: 'essa mudança testa a estrutura: ajuste o que for preciso sem desmontar a base.',
    6: 'esse cuidado é prático: organize a casa, a agenda e os compromissos da família.',
    7: 'essa pausa serve pra revisar o método: veja o que está pesado e simplifique.',
    8: 'essa colheita é fruto de constância: confira os números do que você vem sustentando.',
    9: 'esse fechamento limpa a base: termine pendências antes do próximo bloco de trabalho.',
    11: 'a intuição ajuda a estruturar: confie no que você sente sobre o plano antes de detalhar.',
  },
  5: {
    1: 'esse começo tem cara de experimento: teste antes de se comprometer.',
    3: 'aparecer é circular: fale com gente fora do seu círculo de sempre.',
    4: 'essa organização segura o ano: crie um mínimo de rotina pra não se perder nas mudanças.',
    5: 'essa mudança vale em dobro: é o mês do ano pra viajar, mudar de rota ou testar algo novo.',
    6: 'esse cuidado equilibra o movimento: volte pra casa e pros vínculos entre uma mudança e outra.',
    7: 'essa pausa ajuda a digerir tanta novidade: escolha o que fica e o que foi só fase.',
    8: 'essa colheita vem do que você arriscou: veja o que deu retorno e corte o resto.',
    9: 'esse fechamento solta o que ficou pequeno: deixe ir o que não acompanhou as suas mudanças.',
    11: 'a intuição guia as mudanças: siga o sinal que se repete antes de mudar de rota.',
  },
  6: {
    1: 'esse começo envolve quem você ama: inicie algo que também cuide da casa ou dos vínculos.',
    3: 'aparecer inclui a família: compartilhe com quem é próximo o que você está criando.',
    4: 'essa organização começa em casa: arrume a rotina doméstica e as tarefas divididas.',
    5: 'essa mudança mexe com a casa ou a família: decida junto com quem será afetado.',
    6: 'esse cuidado vale em dobro: é o mês do ano pra presença, casa e vínculos.',
    7: 'essa pausa é pra você: descanse antes de voltar a cuidar de todo mundo.',
    8: 'essa colheita passa pela casa: acerte responsabilidades e contas com quem divide a vida com você.',
    9: 'esse fechamento passa pelos laços: devolva responsabilidades que não são suas.',
    11: 'a sensibilidade fica no máximo com quem você ama: perceba o que a família não está dizendo.',
  },
  7: {
    1: 'esse começo é por dentro: comece um estudo, um curso ou uma prática de silêncio.',
    3: 'aparecer pode ser escrever: compartilhe o que você está entendendo, no seu ritmo.',
    4: 'essa organização abre tempo pra pensar: arrume a agenda pra ter horas de silêncio.',
    5: 'essa mudança começa no olhar: mude a forma de ver uma situação antes de mudar a situação.',
    6: 'esse cuidado começa por você: proteja o seu tempo de silêncio sem se afastar de quem ama.',
    7: 'essa pausa vale em dobro: é o mês do ano pra estudar, refletir e decidir sem pressa.',
    8: 'essa colheita é de entendimento: anote o que você aprendeu antes de cobrar resultado de fora.',
    9: 'esse fechamento acontece mais por dentro: solte uma crença antes de soltar uma situação.',
    11: 'a intuição e a reflexão andam juntas: confie no que você percebe em silêncio.',
  },
  8: {
    1: 'esse começo já nasce com meta: defina número e prazo desde o primeiro passo.',
    2: 'essa parceria precisa de acordo claro: coloque valores e papéis no papel.',
    3: 'aparecer é posicionamento: mostre o seu trabalho pra quem pode contratar você.',
    4: 'essa organização mexe com dinheiro: revise contas, preços e contratos.',
    5: 'essa mudança é estratégica: mude o que trava o seu resultado, com a conta feita.',
    6: 'esse cuidado inclui o dinheiro da casa: alinhe gastos e responsabilidades com quem divide a vida com você.',
    7: 'essa pausa é estratégica: revise o plano antes da próxima negociação.',
    8: 'essa colheita vale em dobro: é o mês do ano pra negociar, cobrar e assumir posição.',
    9: 'esse fechamento cobra resultado: feche contas e acordos antes de virar a página.',
    11: 'a intuição entra nos negócios: confie no que você sente sobre uma proposta antes de assinar.',
  },
  9: {
    1: 'esse começo é um ensaio: teste o que você quer levar pro próximo ciclo, sem se prender ainda.',
    2: 'essa parceria passa por revisão: veja quais relações seguem com você pro próximo ciclo.',
    3: 'aparecer serve pra encerrar bem: conte o que você aprendeu neste ciclo.',
    4: 'essa organização é de saída: arquive, doe e termine o que ficou pela metade.',
    5: 'essa mudança é um desapego: solte um hábito ou um lugar que já cumpriu o papel.',
    6: 'esse cuidado é de despedida: feche ciclos com quem você ama, com carinho.',
    7: 'essa pausa revisa nove anos: olhe pra trás antes de decidir o que vem.',
    8: 'essa colheita fecha o ciclo: receba o que é seu e acerte o que ficou pendente.',
    9: 'esse fechamento vale em dobro: é o mês do ano pra encerrar, perdoar e soltar.',
    11: 'a intuição mostra o que já acabou: confie quando sentir que um capítulo terminou.',
  },
  // Só existem nos anos mestres (o resto usa a base).
  11: {
    2: 'essa parceria vale em dobro: é o mês do ano pra acordos e alianças.',
    22: 'esse plano grande nasce de uma parceria: construa junto com quem enxerga longe como você.',
  },
  22: {
    33: 'essa entrega ganha escala: o que você construiu pode servir a mais gente agora.',
  },
};

/** "Num Ano 8, esse fechamento cobra resultado: …" (ou null se a combinação não tem frase). */
export function contextoDoMes(anoPessoal, mesPessoal) {
  const base = BASE_MESTRE[anoPessoal] || anoPessoal;
  const cauda = CONTEXTO_DO_ANO[anoPessoal]?.[mesPessoal] || CONTEXTO_DO_ANO[base]?.[mesPessoal];
  return cauda ? `Num Ano ${anoPessoal}, ${cauda}` : null;
}

// ── Ligação com o mapa (topo) ───────────────────────────────────────────────
// Só quando a convergência principal do mapa (sinteseDoMapa, lib/mapaSintese.js)
// é um dos temas do número do Ano Pessoal (a mesma tabela TEMA_NUMERO do
// mapaSintese; o teste confere que as chaves batem). Fora disso, nada.
export const LIGACAO_COM_O_MAPA = {
  1: { liderar: 'é um ano pra tomar a frente do que é seu.' },
  2: { conectar: 'as parcerias deste ano encontram terreno fértil em você.', cuidar: 'o cuidado com quem está perto é o centro deste ano.' },
  3: { criar: 'o que você criar este ano tem espaço pra ser visto.', conectar: 'contatos e conversas deste ano rendem mais pra você.' },
  4: { construir: 'é o ano de pôr de pé o que você vem planejando.', ordem: 'é o ano de arrumar a casa, as contas e a rotina com o seu critério.' },
  5: { liberdade: 'é um ano pra mudar de rota sem pedir licença.', transformar: 'as mudanças que você vinha adiando têm espaço agora.' },
  6: { cuidar: 'o cuidado é o centro deste ano, e você entra na lista.' },
  7: { saber: 'é o ano de estudar a fundo o que te interessa.', intuir: 'é o ano de confiar no que você sente antes de explicar.' },
  8: { liderar: 'é o ano de assumir posição e cobrar o que é seu.', construir: 'o que você construiu até aqui pede retorno neste ano.' },
  9: { cuidar: 'o cuidado deste ano é encerrar com carinho o que já cumpriu o papel.', transformar: 'é o ano de soltar o que já mudou em você.' },
  11: { intuir: 'a percepção fica no volume máximo, e vale anotar o que você sente.', conectar: 'as conexões deste ano carregam mais significado que o normal.' },
  22: { construir: 'é o ano de planejar uma construção de longo prazo.', liderar: 'é o ano de liderar um projeto maior que os de costume.' },
  33: { cuidar: 'o seu cuidado alcança mais gente este ano, e parte dele precisa ficar com você.', criar: 'o que você criar este ano pode servir a muita gente.' },
};

/**
 * @param {number} anoPessoal
 * @param {{ tema: string, nome: string } | null | undefined} convergencia  repete[0] da síntese
 * @returns {string|null}
 */
export function ligacaoComOMapa(anoPessoal, convergencia) {
  const cauda = convergencia && LIGACAO_COM_O_MAPA[anoPessoal]?.[convergencia.tema];
  return cauda ? `O seu mapa repete ${convergencia.nome}, e o Ano Pessoal ${anoPessoal} puxa pro mesmo lado: ${cauda}` : null;
}

function temaDoMesPessoal(mesPessoal) {
  return MES_TEMA[mesPessoal] || MES_TEMA[1];
}

/**
 * Gera a projeção numerológica dos próximos 12 meses a partir de uma data de
 * referência (rolling window — não é ano-calendário fixo). Lida sozinho com
 * a virada de ano: meses que caem no ano seguinte recebem o Ano Pessoal
 * recalculado pra esse novo ano.
 *
 * Campos novos (nov/2026): `contexto` ("Num Ano N, …"), `retorno` (o mesmo
 * Mês Pessoal já apareceu no mesmo Ano Pessoal dentro da janela: diz em que
 * mês), `novoAno` (primeiro mês de um ano civil diferente do inicial: a página
 * põe o divisor com o Ano Pessoal novo) e `aniversario` (mês do nascimento).
 *
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {Date} [dataReferencia] — padrão: hoje
 * @returns {Array<{ mes:number, ano:number, label:string, anoPessoal:number, mesPessoal:number, titulo:string, texto:string, foco:string[], atencao:string[],
 *   contexto:string|null, retorno:string|null, novoAno:boolean, aniversario:boolean }>}
 */
export function gerarProjecao12Meses(dataNascimentoISO, dataReferencia = new Date()) {
  const mesInicial = dataReferencia.getMonth() + 1; // 1-12
  const anoInicial = dataReferencia.getFullYear();
  const mesNascimento = Number(String(dataNascimentoISO || '').split('-')[1]) || null;

  const meses = [];
  const vistos = {};
  for (let i = 0; i < 12; i++) {
    const offset = mesInicial - 1 + i;
    const ano = anoInicial + Math.floor(offset / 12);
    const mes = (offset % 12) + 1;

    const anoPessoal = calcularAnoPessoal(dataNascimentoISO, ano);
    const mesPessoal = calcularMesPessoal(dataNascimentoISO, ano, mes);
    if (anoPessoal == null || mesPessoal == null) continue;

    const tema = temaDoMesPessoal(mesPessoal);
    const chave = `${ano}-${mesPessoal}`;
    const antes = vistos[chave];
    vistos[chave] ||= mes;
    meses.push({
      mes,
      ano,
      label: `${MESES_LABEL[mes - 1]} ${ano}`,
      anoPessoal,
      mesPessoal,
      titulo: tema.titulo,
      texto: tema.texto,
      foco: tema.foco,
      atencao: tema.atencao,
      contexto: contextoDoMes(anoPessoal, mesPessoal),
      // A repetição no mesmo ano é sempre 9 meses depois (jan/out, fev/nov, mar/dez).
      retorno: antes ? `Esse tema já apareceu em ${MESES_LABEL[antes - 1].toLowerCase()}, neste mesmo Ano Pessoal. Agora ele volta no fim do ano: termine o que começou lá.` : null,
      novoAno: ano !== anoInicial && mes === 1,
      aniversario: mes === mesNascimento,
    });
  }
  return meses;
}
