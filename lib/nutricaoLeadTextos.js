// lib/nutricaoLeadTextos.js
// Gancho personalizado pro email de nutrição de leads (quem fez a prévia
// grátis mas não comprou) — cruza o tema do Mês Pessoal atual com o Sol, o
// Número de Vida e o objetivo já declarados no formulário, pra cada envio
// parecer sobre a pessoa específica, não um lembrete genérico repetido.
// Todos os dados usados aqui já existem na análise, sem cálculo novo.

const ELEMENTO_DO_SIGNO = {
  'Áries': 'fogo', 'Leão': 'fogo', 'Sagitário': 'fogo',
  'Touro': 'terra', 'Virgem': 'terra', 'Capricórnio': 'terra',
  'Gêmeos': 'ar', 'Libra': 'ar', 'Aquário': 'ar',
  'Câncer': 'água', 'Escorpião': 'água', 'Peixes': 'água',
};

const ELEMENTO_NUANCE = {
  fogo: 'você tende a querer resolver isso rápido — vale desacelerar só o suficiente pra não perder o que esse ciclo está mostrando',
  terra: 'você tende a transformar isso em rotina prática antes mesmo de sentir o que está por trás',
  ar: 'você tende a conversar e racionalizar isso antes de realmente processá-lo',
  água: 'você tende a sentir isso fundo antes de conseguir nomear o motivo',
};

const OBJETIVO_NUDGE = {
  'Amor e Relacionamentos': 'seu manual completo mostra exatamente como esse padrão aparece nos seus relacionamentos, e o que fazer diferente',
  'Carreira e Propósito': 'seu manual completo mostra como esse padrão trava (ou destrava) o que você quer construir profissionalmente',
  'Dinheiro e Abundância': 'seu manual completo mostra onde esse padrão custa dinheiro sem você perceber',
  'Autoconhecimento': 'seu manual completo pega esse fio solto e mostra de onde ele vem de verdade',
};

/**
 * @param {{ signo?: string, numeroVida?: number|string, objetivoPrincipal?: string }} dados
 * @returns {string} parágrafo curto, pode ser vazio se não houver dados suficientes
 */
export function gerarGanchoNutricaoLead({ signo, numeroVida, objetivoPrincipal }) {
  const partes = [];

  const elemento = ELEMENTO_DO_SIGNO[signo];
  if (signo && elemento) {
    partes.push(`Como seu Sol é em ${signo}, ${ELEMENTO_NUANCE[elemento]}.`);
  }

  if (numeroVida) {
    partes.push(`Seu Número de Vida ${numeroVida} soma outra camada a isso.`);
  }

  const nudge = OBJETIVO_NUDGE[objetivoPrincipal];
  if (nudge) {
    partes.push(`Sobre ${String(objetivoPrincipal).toLowerCase()}: ${nudge}.`);
  }

  return partes.join(' ');
}
