// lib/tarotReflexao.js — o que o bot de comentários diz de cada Arcano Maior
// no Reels "Escolhe uma carta" (lib/socialComentarios.js, respostaInterativa).
// Por carta, pelo id de lib/tarot.js:
//   central    o significado em 1–2 frases (começa sem o nome: a abertura da
//              resposta já diz "A sua foi O Eremita.")
//   pratica    o que a carta pede hoje, em 1 frase que começa com "Hoje,"
//   perguntas  3 perguntas de reflexão diferentes (o bot sorteia 1 pelo id
//              do comentário)
// Fica fora de lib/tarot.js de propósito: o tarot.js vai pro navegador junto
// com o Seu Dia, e estes textos só servem ao servidor.
// Mesmas regras do guia editorial: nada de promessa, hedge, fatalismo ou
// tema de saúde, e sem marcar gênero (testado em tests/reelsInterativo.test.js).

export const REFLEXAO_ARCANOS = {
  0: { // O Louco
    central: 'É o primeiro passo antes de ter o caminho inteiro na mão. Fala de começar pelo movimento, não pela certeza.',
    pratica: 'Hoje, dê um passo pequeno naquilo que você vem adiando até ter certeza.',
    perguntas: [
      'O que você começaria hoje se não precisasse acertar de primeira?',
      'Que certeza você está esperando antes de se mexer?',
      'Do que você abriria mão pra se sentir mais livre?',
    ],
  },
  1: { // O Mago
    central: 'Diz que as ferramentas já estão na sua mesa. O que falta não é recurso, é usar o que você já tem com intenção.',
    pratica: 'Hoje, escolha uma coisa que você já sabe fazer e use pra destravar um projeto parado.',
    perguntas: [
      'Que habilidade sua você anda subestimando?',
      'O que você está esperando ter pra começar, quando já dá pra começar com o que tem?',
      'Onde a sua energia está espalhada em vez de concentrada?',
    ],
  },
  2: { // A Sacerdotisa
    central: 'É o saber que chega antes da explicação. Pede silêncio pra você ouvir o que já sabe e ainda não disse em voz alta.',
    pratica: 'Hoje, antes de pedir opinião a alguém, escreva em uma linha o que você já acha.',
    perguntas: [
      'Que resposta você já tem e finge não saber?',
      'Quando foi a última vez que você seguiu uma intuição e ela estava certa?',
      'O que você ouviria se ficasse cinco minutos em silêncio?',
    ],
  },
  3: { // A Imperatriz
    central: 'É o crescimento que vem do cuidado constante. O que você alimenta com atenção cresce, inclusive você.',
    pratica: 'Hoje, dedique 20 minutos a algo que é só seu, sem justificar pra ninguém.',
    perguntas: [
      'O que você nutre nos outros e esquece de nutrir em si?',
      'Que projeto seu está pedindo mais atenção do que você tem dado?',
      'Onde você poderia receber em vez de só dar?',
    ],
  },
  4: { // O Imperador
    central: 'É a estrutura que protege o que importa. Limite claro não afasta as pessoas certas: organiza o espaço pra elas.',
    pratica: 'Hoje, diga um não que você vem adiando, com calma e sem se explicar demais.',
    perguntas: [
      'Que limite seu está sendo atravessado sem você dizer nada?',
      'Que área da sua vida está pedindo método em vez de improviso?',
      'Onde você está esperando alguém decidir por você?',
    ],
  },
  5: { // O Hierofante
    central: 'Fala de aprender com quem já fez o caminho. Seguir uma tradição é escolha, e você decide o que levar dela.',
    pratica: 'Hoje, peça um conselho a alguém que já viveu o que você está vivendo.',
    perguntas: [
      'Que regra você segue sem lembrar por que começou?',
      'Quem já passou pelo que você está passando e você ainda não ouviu?',
      'Que valor da sua família você quer manter, e qual quer deixar?',
    ],
  },
  6: { // Os Amantes
    central: 'É uma escolha, não só romance. Pergunta se a sua decisão está alinhada com o que você valoriza ou com o que parece mais seguro.',
    pratica: 'Hoje, antes de decidir algo, confira se a escolha combina com o que você valoriza.',
    perguntas: [
      'Que escolha você está evitando porque as duas opções custam algo?',
      'Que valor seu ficou de fora da sua última grande decisão?',
      'Numa relação importante pra você, o que está sendo dito e o que está sendo calado?',
    ],
  },
  7: { // O Carro
    central: 'É avançar com direção. Junta forças que puxam pra lados diferentes e coloca todas no mesmo rumo.',
    pratica: 'Hoje, escolha uma prioridade só e cuide dela antes de abrir as mensagens.',
    perguntas: [
      'Que desejo seu está puxando pro lado oposto do seu objetivo?',
      'Se você tivesse que escolher uma meta só pra esta semana, qual seria?',
      'O que te tira do rumo com mais frequência?',
    ],
  },
  8: { // A Força
    central: 'É firmeza com gentileza. O poder vem de dominar o impulso, não de vencer no grito.',
    pratica: 'Hoje, quando algo te irritar, respire e responda dez segundos depois.',
    perguntas: [
      'Em que situação você confunde força com dureza?',
      'Que impulso seu precisa de rédea, e não de castigo?',
      'Onde a paciência resolveria mais que a pressão?',
    ],
  },
  9: { // O Eremita
    central: 'É recuar pra enxergar melhor. Não é se isolar: é tirar o barulho de fora pra ouvir o que importa antes de agir.',
    pratica: 'Hoje, reserve 15 minutos sem celular e sem companhia pra pensar numa decisão.',
    perguntas: [
      'Que decisão você está tomando no meio do barulho dos outros?',
      'Do que você precisa se afastar pra ver com clareza?',
      'Que verdade sua só aparece quando você fica em silêncio?',
    ],
  },
  10: { // A Roda da Fortuna
    central: 'Fala de ciclos: nada fica parado, nem o que é bom nem o que é difícil. O que você solta abre espaço pro que vem.',
    pratica: 'Hoje, feche uma pendência que já terminou e você ainda não encerrou.',
    perguntas: [
      'Que ciclo da sua vida já acabou e você continua mantendo vivo?',
      'O que mudou nos últimos meses que você ainda não aceitou?',
      'Se essa fase é passageira, o que você quer aproveitar dela?',
    ],
  },
  11: { // A Justiça
    central: 'É a carta da causa e da consequência. Pede honestidade total com o que você escolheu e com o que ainda precisa escolher.',
    pratica: 'Hoje, resolva uma conta, conversa ou promessa que você deixou em aberto.',
    perguntas: [
      'Que escolha sua está pedindo mais honestidade agora?',
      'Que verdade você precisa dizer pra deixar uma situação mais justa?',
      'Como seria uma decisão honesta, mesmo que ela custe algo?',
    ],
  },
  12: { // O Enforcado
    central: 'É a pausa escolhida, que muda o ângulo. Parar de forçar não é derrota: é o que deixa você ver o que estava escondido.',
    pratica: 'Hoje, numa situação travada, pare de insistir e olhe pelo lado da outra pessoa.',
    perguntas: [
      'O que você está forçando que pede uma pausa?',
      'Como esse problema fica visto de cabeça pra baixo?',
      'Do que você abriria mão pra destravar uma situação?',
    ],
  },
  13: { // A Morte
    central: 'No tarô, é transformação, não fim literal. Algo na sua vida já cumpriu o papel e está pedindo passagem pro novo.',
    pratica: 'Hoje, cancele, jogue fora ou encerre uma coisa que você mantém só por hábito.',
    perguntas: [
      'Que versão sua já não cabe na vida que você quer?',
      'O que você mantém só por medo do vazio que vem depois?',
      'Se você deixasse isso ir, o que ganharia espaço?',
    ],
  },
  14: { // A Temperança
    central: 'É misturar opostos na medida certa. Fala de ritmo: nem tudo de uma vez, nem parar de vez.',
    pratica: 'Hoje, naquilo em que você costuma exagerar, faça a metade.',
    perguntas: [
      'Em que área você vive de oito ou oitenta?',
      'Que duas partes suas brigam e podiam trabalhar juntas?',
      'Que ritmo você conseguiria manter por um mês inteiro?',
    ],
  },
  15: { // O Diabo
    central: 'Mostra o que te prende e que você ajudou a criar. A corrente é real, mas fica mais leve quando você dá nome ao padrão.',
    pratica: 'Hoje, observe um hábito que te puxa e anote quando ele aparece, sem se julgar.',
    perguntas: [
      'Que hábito você defende, mesmo sabendo que ele te custa caro?',
      'O que você ganha mantendo esse padrão?',
      'Qual seria o primeiro passo pra afrouxar essa corrente?',
    ],
  },
  16: { // A Torre
    central: 'Derruba o que foi construído em base falsa. A queda assusta, mas limpa o terreno pra algo verdadeiro.',
    pratica: 'Hoje, admita pra você uma coisa que não está funcionando, sem tentar consertar ainda.',
    perguntas: [
      'Que estrutura da sua vida está de pé só pela aparência?',
      'O que caiu recentemente e te mostrou uma verdade?',
      'O que você construiria diferente se começasse do zero?',
    ],
  },
  17: { // A Estrela
    central: 'Vem depois da tempestade. Fala de renovação e de receber sem pressa o que o momento oferece.',
    pratica: 'Hoje, aceite uma ajuda ou um elogio sem diminuir e sem devolver na hora.',
    perguntas: [
      'O que se restaurou em você depois da última fase difícil?',
      'Que esperança você deixou de lado e quer retomar?',
      'O que você aceitaria receber se não precisasse merecer antes?',
    ],
  },
  18: { // A Lua
    central: 'Ilumina pouco e deixa muita coisa na sombra. Pede atenção ao que você não quer ver, porque é isso que está guiando as suas escolhas.',
    pratica: 'Hoje, quando sentir um medo sem motivo claro, escreva o que ele está tentando evitar.',
    perguntas: [
      'Que medo está decidindo por você?',
      'O que você está tratando como fato e é só suposição?',
      'Que intuição você está tratando como bobagem?',
    ],
  },
  19: { // O Sol
    central: 'É clareza e energia. O que estava confuso se ilumina, e você consegue se mostrar como é.',
    pratica: 'Hoje, mostre pra alguém uma coisa que você fez e ainda não tinha mostrado.',
    perguntas: [
      'O que te dá energia de verdade?',
      'Onde você ainda se esconde pra não incomodar?',
      'O que ficou claro pra você nos últimos dias?',
    ],
  },
  20: { // O Julgamento
    central: 'É um chamado pra rever a própria história. O passado foi vivido; agora é integrar o que aprendeu e responder ao que a vida pede.',
    pratica: 'Hoje, retome um projeto ou uma conversa que você abandonou e veja o que ainda faz sentido.',
    perguntas: [
      'Que chamado você vem ignorando há tempo?',
      'Que erro seu já te ensinou o que tinha pra ensinar?',
      'Se você recomeçasse algo hoje, o que levaria do passado?',
    ],
  },
  21: { // O Mundo
    central: 'É um ciclo que se completa por inteiro. Pede que você reconheça o que construiu antes de correr pro próximo passo.',
    pratica: 'Hoje, liste três coisas que você concluiu nos últimos meses e comemore pelo menos uma.',
    perguntas: [
      'Que conquista sua você ainda não reconheceu?',
      'O que precisa terminar pra o próximo ciclo começar?',
      'Quem participou do que você construiu e merece um obrigado?',
    ],
  },
};
