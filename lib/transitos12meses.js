// lib/transitos12meses.js
// Projeção numerológica de 12 meses a partir de hoje (rolling window, não
// ano-calendário) — usa Ano Pessoal + Mês Pessoal (lib/calculos.js) pra montar
// um tema por mês. Autocontido: não depende de manualgenerator.js.

import { calcularAnoPessoal, calcularMesPessoal } from './calculos';

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Tema por Mês Pessoal — tom prático/orientado a ação (diferente do
// essencia/forca/sombra/cura mais introspectivo usado no manual completo).
// texto: parágrafo mais longo, explicando o mecanismo do mês.
// foco: o que esse mês favorece de verdade (2-3 pontos).
// atencao: o que costuma sair errado nesse ciclo, se não observado.
const MES_TEMA = {
  1: {
    titulo: 'Começos',
    texto: 'Um novo ciclo de nove meses começa agora, e ele sempre pede o mesmo: dar o primeiro passo antes de ter certeza absoluta. A energia desse mês empurra pra frente — não é hora de continuar revisando o mesmo plano, é hora de testar na prática. O que for iniciado agora carrega o impulso dos próximos meses.',
    foco: [
      'Abrir algo que estava só no papel ou na cabeça',
      'Tomar a iniciativa em vez de esperar o convite',
      'Decidir rápido e ajustar o rumo andando',
    ],
    atencao: ['Impaciência com quem ainda não está no mesmo ritmo que você'],
  },
  2: {
    titulo: 'Parcerias',
    texto: 'Depois do impulso solitário do mês anterior, esse ciclo pede o oposto: colaboração. Sozinho, o avanço fica mais lento e mais desgastante do que precisaria ser. É um mês de escuta, de ajustar o passo com o outro, de deixar que a coisa cresça em dupla em vez de insistir em carregar tudo com as próprias mãos.',
    foco: [
      'Buscar parcerias em vez de resolver tudo sozinho',
      'Escutar antes de responder — inclusive discordâncias',
      'Ajustar o ritmo ao de quem está do seu lado',
    ],
    atencao: ['Ceder demais só pra evitar atrito, perdendo o próprio eixo'],
  },
  3: {
    titulo: 'Expressão',
    texto: 'A energia se volta pra fora: comunicar, criar, mostrar o que já vem sendo construído em silêncio. É um mês em que visibilidade e leveza são aliadas — insistir em ficar nos bastidores agora tende a represar algo que precisava circular. Ideias que pareciam soltas ganham forma quando são ditas em voz alta.',
    foco: [
      'Comunicar o que você anda pensando ou fazendo',
      'Criar sem exigir perfeição no primeiro rascunho',
      'Aparecer — literalmente, em conversas, redes, apresentações',
    ],
    atencao: ['Dispersão: começar três coisas e não aprofundar nenhuma'],
  },
  4: {
    titulo: 'Fundação',
    texto: 'Depois do brilho do mês anterior, chega a hora do trabalho que ninguém vê de fora: organizar, estruturar, colocar ordem no que estava solto. Não é um mês empolgante, mas é o que sustenta os próximos — o que for bem construído agora evita retrabalho lá na frente. Rotina e método rendem mais que motivação nesse período.',
    foco: [
      'Organizar processos, finanças ou rotina',
      'Terminar tarefas de bastidor que estavam adiadas',
      'Construir com método, mesmo que devagar',
    ],
    atencao: ['Rigidez excessiva — travar tudo tentando deixar perfeito antes de agir'],
  },
  5: {
    titulo: 'Mudança',
    texto: 'A estrutura do mês anterior dá lugar a um período de movimento e imprevisto. Planos rígidos tendem a quebrar aqui — não porque algo deu errado, mas porque esse ciclo pede flexibilidade real. É um bom mês pra experimentar, viajar, mudar de rota, e um mês ruim pra quem insiste em controlar cada detalhe do roteiro.',
    foco: [
      'Abrir espaço pra imprevisto em vez de lutar contra ele',
      'Experimentar algo fora da rotina (viagem, curso, mudança pequena)',
      'Soltar um pouco o controle sobre como as coisas "deveriam" acontecer',
    ],
    atencao: ['Excesso: dispersar energia em mudanças demais ao mesmo tempo'],
  },
  6: {
    titulo: 'Cuidado',
    texto: 'Vínculos entram em primeiro plano — família, relacionamento, responsabilidades que envolvem outras pessoas. É um mês de presença real, não só de resolver logística alheia. O que for negligenciado nos laços mais próximos tende a cobrar a conta justamente agora, e o que for cuidado com atenção tende a se fortalecer de verdade.',
    foco: [
      'Priorizar presença de qualidade com quem importa',
      'Assumir responsabilidades que vinham sendo adiadas',
      'Cuidar sem se anular no processo',
    ],
    atencao: ['Sobrecarga: virar o "resolvedor" de tudo pra todo mundo ao seu redor'],
  },
  7: {
    titulo: 'Introspecção',
    texto: 'O ritmo desacelera, e isso não é um problema a ser corrigido — é exatamente o que o mês pede. Menos ruído externo, mais espaço pra processar o que já aconteceu nos meses anteriores. Decisões importantes tomadas sob pressão nesse período tendem a precisar de ajuste depois; as que esperam clareza chegar tendem a durar mais.',
    foco: [
      'Dar espaço pra silêncio, estudo ou introspecção',
      'Adiar decisões grandes até sentir clareza, não pressa',
      'Confiar na percepção mais sutil, mesmo sem prova concreta ainda',
    ],
    atencao: ['Confundir isolamento necessário com fuga de conversas que precisam acontecer'],
  },
  8: {
    titulo: 'Resultado',
    texto: 'O que foi plantado nos meses anteriores começa a aparecer em forma de consequência prática — dinheiro, reconhecimento, ou o oposto, se algo foi negligenciado. É um mês de números, de acertar contas (literais e figuradas), e de assumir posição em vez de esperar que o merecimento seja notado sozinho.',
    foco: [
      'Revisar e organizar finanças de forma direta',
      'Negociar, pedir reconhecimento ou fechar acordos',
      'Assumir uma posição de mais autoridade sobre o que já construiu',
    ],
    atencao: ['Usar poder ou controle como substituto de vulnerabilidade real'],
  },
  9: {
    titulo: 'Fechamento',
    texto: 'Último mês do ciclo de nove — hora de soltar o que já cumpriu sua função antes de forçar a virada de página. Tentar iniciar coisas grandes agora tende a frustrar, porque a energia do mês é de encerramento, não de começo. O que for solto com consciência libera espaço real para o próximo ciclo que se aproxima.',
    foco: [
      'Encerrar o que já não faz mais sentido carregar',
      'Fazer as pazes com capítulos que ficaram em aberto',
      'Revisar o ciclo inteiro antes de olhar pro que vem a seguir',
    ],
    atencao: ['Insistir em começar algo novo grande demais nesse mês específico'],
  },
  11: {
    titulo: 'Intuição amplificada',
    texto: 'Mês pessoal mestre — a sensibilidade e a percepção ficam mais agudas que o normal, às vezes de um jeito quase desconfortável. O que você sente sobre uma situação chega antes de conseguir explicar racionalmente por quê, e vale mais confiar nesse sinal do que forçar uma análise lógica que ainda não fechou.',
    foco: [
      'Confiar em pressentimentos, mesmo sem prova lógica ainda',
      'Prestar atenção em sincronicidades e sinais repetidos',
      'Reduzir ruído externo pra não abafar essa sensibilidade',
    ],
    atencao: ['Ansiedade: captar demais e não saber filtrar o que é realmente seu'],
  },
  22: {
    titulo: 'Construção em grande escala',
    texto: 'Mês pessoal mestre — o foco sai do imediato e vai pra visão de longo prazo. Decisões tomadas agora tendem a ter impacto muito além do mês corrente, então vale pensar em estrutura, não só em resolver o problema da semana. É um bom momento pra planejar algo que vai levar tempo pra amadurecer.',
    foco: [
      'Planejar com visão de médio/longo prazo, não só o imediato',
      'Investir tempo em algo que só vai dar retorno mais à frente',
      'Pensar estrutura antes de pensar tática',
    ],
    atencao: ['Paralisia por grandiosidade — o plano ficar grande demais pra sair do papel'],
  },
  33: {
    titulo: 'Entrega',
    texto: 'Mês pessoal mestre — o que você oferece pras pessoas ao redor ganha um peso especial, quase como se sua presença tivesse mais efeito que o normal nesse período. É um mês fértil pra ensinar, cuidar ou liderar pelo exemplo, mas o risco real é se doar tanto que sobra pouco pra si mesmo no final.',
    foco: [
      'Oferecer apoio, ensinar ou cuidar de quem está ao redor',
      'Liderar pelo exemplo, não pela cobrança',
      'Reservar tempo de recuperação proporcional ao que foi entregue',
    ],
    atencao: ['Esquecer de si mesmo até o esgotamento, achando que descansar é egoísmo'],
  },
};

function temaDoMesPessoal(mesPessoal) {
  return MES_TEMA[mesPessoal] || MES_TEMA[1];
}

/**
 * Gera a projeção numerológica dos próximos 12 meses a partir de uma data de
 * referência (rolling window — não é ano-calendário fixo). Lida sozinho com
 * a virada de ano: meses que caem no ano seguinte recebem o Ano Pessoal
 * recalculado pra esse novo ano.
 *
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {Date} [dataReferencia] — padrão: hoje
 * @returns {Array<{ mes:number, ano:number, label:string, anoPessoal:number, mesPessoal:number, titulo:string, texto:string, foco:string[], atencao:string[] }>}
 */
export function gerarProjecao12Meses(dataNascimentoISO, dataReferencia = new Date()) {
  const mesInicial = dataReferencia.getMonth() + 1; // 1-12
  const anoInicial = dataReferencia.getFullYear();

  const meses = [];
  for (let i = 0; i < 12; i++) {
    const offset = mesInicial - 1 + i;
    const ano = anoInicial + Math.floor(offset / 12);
    const mes = (offset % 12) + 1;

    const anoPessoal = calcularAnoPessoal(dataNascimentoISO, ano);
    const mesPessoal = calcularMesPessoal(dataNascimentoISO, ano, mes);
    if (anoPessoal == null || mesPessoal == null) continue;

    const tema = temaDoMesPessoal(mesPessoal);
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
    });
  }
  return meses;
}
