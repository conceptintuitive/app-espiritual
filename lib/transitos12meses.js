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
const MES_TEMA = {
  1: { titulo: 'Começos', texto: 'Mês de abrir o que estava esperando o momento certo — iniciativa vale mais que plano perfeito.' },
  2: { titulo: 'Parcerias', texto: 'Colaborar rende mais que forçar sozinho. Escuta e paciência com o ritmo do outro.' },
  3: { titulo: 'Expressão', texto: 'Comunicar, criar, mostrar o que você anda fazendo — visibilidade favorecida.' },
  4: { titulo: 'Fundação', texto: 'Organizar, estruturar, construir a base. Trabalho de bastidor que sustenta o que vem depois.' },
  5: { titulo: 'Mudança', texto: 'Abra espaço pro imprevisto. Rigidez de roteiro tende a gerar atrito esse mês.' },
  6: { titulo: 'Cuidado', texto: 'Vínculos e responsabilidades pedem presença real, não só resolução prática.' },
  7: { titulo: 'Introspecção', texto: 'Menos ruído externo, mais escuta interna. Decisões importantes esperam clareza, não pressa.' },
  8: { titulo: 'Resultado', texto: 'Dinheiro, reconhecimento e consequências práticas do que já foi construído entram em foco.' },
  9: { titulo: 'Fechamento', texto: 'Soltar o que já cumpriu o ciclo antes de forçar a próxima página.' },
  11: { titulo: 'Intuição amplificada', texto: 'O que você sente chega antes do que consegue explicar — vale mais confiança, menos análise excessiva.' },
  22: { titulo: 'Construção em grande escala', texto: 'Visão de longo prazo favorecida. Bom momento pra decisões que não são só sobre o mês corrente.' },
  33: { titulo: 'Entrega', texto: 'O que você oferece ao redor ganha peso especial — cuidado pra não se esquecer de si nesse processo.' },
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
 * @returns {Array<{ mes:number, ano:number, label:string, anoPessoal:number, mesPessoal:number, titulo:string, texto:string }>}
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
    });
  }
  return meses;
}
