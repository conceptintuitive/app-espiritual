// Calcular Número da Vida
export function calcularNumeroVida(dataNascimento) {
  const numeros = dataNascimento.replace(/\D/g, '');
  let soma = 0;
  
  for (let num of numeros) {
    soma += parseInt(num);
  }
  
  while (soma > 9 && ![11, 22, 33].includes(soma)) {
    soma = soma.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return soma;
}

// Calcular Signo
export function calcularSigno(dia, mes) {
  if ((mes === 3 && dia >= 21) || (mes === 4 && dia <= 19)) return 'Áries';
  if ((mes === 4 && dia >= 20) || (mes === 5 && dia <= 20)) return 'Touro';
  if ((mes === 5 && dia >= 21) || (mes === 6 && dia <= 20)) return 'Gêmeos';
  if ((mes === 6 && dia >= 21) || (mes === 7 && dia <= 22)) return 'Câncer';
  if ((mes === 7 && dia >= 23) || (mes === 8 && dia <= 22)) return 'Leão';
  if ((mes === 8 && dia >= 23) || (mes === 9 && dia <= 22)) return 'Virgem';
  if ((mes === 9 && dia >= 23) || (mes === 10 && dia <= 22)) return 'Libra';
  if ((mes === 10 && dia >= 23) || (mes === 11 && dia <= 21)) return 'Escorpião';
  if ((mes === 11 && dia >= 22) || (mes === 12 && dia <= 21)) return 'Sagitário';
  if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 19)) return 'Capricórnio';
  if ((mes === 1 && dia >= 20) || (mes === 2 && dia <= 18)) return 'Aquário';
  return 'Peixes';
}

// Significados dos Números
export const SIGNIFICADOS_NUMEROS = {
  1: {
    titulo: "O Líder",
    desc: "Pioneiro, independente, inovador",
    desafios: "Egoísmo, impaciência, arrogância",
    potenciais: "Empreendedorismo, coragem, originalidade"
  },
  2: {
    titulo: "O Diplomata",
    desc: "Cooperativo, sensível, pacificador",
    desafios: "Dependência emocional, indecisão",
    potenciais: "Mediação, empatia, parceria"
  },
  3: {
    titulo: "O Comunicador",
    desc: "Criativo, expressivo, sociável",
    desafios: "Superficialidade, dispersão",
    potenciais: "Arte, escrita, inspiração"
  },
  4: {
    titulo: "O Construtor",
    desc: "Prático, disciplinado, trabalhador",
    desafios: "Rigidez, teimosia",
    potenciais: "Organização, persistência"
  },
  5: {
    titulo: "O Aventureiro",
    desc: "Livre, versátil, curioso",
    desafios: "Instabilidade, impulsividade",
    potenciais: "Adaptabilidade, comunicação"
  },
  6: {
    titulo: "O Cuidador",
    desc: "Responsável, amoroso, protetor",
    desafios: "Controle excessivo, sacrifício",
    potenciais: "Cura, ensino, família"
  },
  7: {
    titulo: "O Místico",
    desc: "Analítico, introspectivo, espiritual",
    desafios: "Isolamento, frieza",
    potenciais: "Sabedoria, espiritualidade"
  },
  8: {
    titulo: "O Realizador",
    desc: "Ambicioso, poderoso, material",
    desafios: "Materialismo, domínio",
    potenciais: "Liderança, prosperidade"
  },
  9: {
    titulo: "O Humanitário",
    desc: "Compassivo, idealista, universal",
    desafios: "Mártir, desilusão",
    potenciais: "Filantropia, cura global"
  },
  11: {
    titulo: "O Iluminado",
    desc: "Intuitivo, inspirador, visionário",
    desafios: "Ansiedade, idealismo extremo",
    potenciais: "Iluminação, inspiração"
  },
  22: {
    titulo: "O Construtor Mestre",
    desc: "Visionário prático, realizador",
    desafios: "Pressão interna",
    potenciais: "Grandes realizações"
  },
  33: {
    titulo: "O Mestre Curador",
    desc: "Amor universal, cura planetária",
    desafios: "Sobrecarga emocional",
    potenciais: "Cura em massa"
  }
};

// Perfis dos Signos
export const PERFIS_SIGNOS = {
  'Áries': {
    elemento: 'Fogo',
    regente: 'Marte',
    desc: 'Corajoso, impulsivo, pioneiro',
    dons: 'Liderança, coragem',
    desafios: 'Impaciência, agressividade'
  },
  'Touro': {
    elemento: 'Terra',
    regente: 'Vênus',
    desc: 'Estável, sensual, persistente',
    dons: 'Determinação, lealdade',
    desafios: 'Teimosia, possessividade'
  },
  'Gêmeos': {
    elemento: 'Ar',
    regente: 'Mercúrio',
    desc: 'Comunicativo, versátil, curioso',
    dons: 'Inteligência, adaptação',
    desafios: 'Superficialidade, dispersão'
  },
  'Câncer': {
    elemento: 'Água',
    regente: 'Lua',
    desc: 'Emotivo, protetor, intuitivo',
    dons: 'Empatia, cuidado',
    desafios: 'Insegurança, apego'
  },
  'Leão': {
    elemento: 'Fogo',
    regente: 'Sol',
    desc: 'Carismático, generoso, dramático',
    dons: 'Criatividade, liderança',
    desafios: 'Orgulho, vaidade'
  },
  'Virgem': {
    elemento: 'Terra',
    regente: 'Mercúrio',
    desc: 'Analítico, perfeccionista, prestativo',
    dons: 'Organização, discernimento',
    desafios: 'Crítica excessiva, ansiedade'
  },
  'Libra': {
    elemento: 'Ar',
    regente: 'Vênus',
    desc: 'Equilibrado, charmoso, diplomático',
    dons: 'Harmonia, justiça',
    desafios: 'Indecisão, dependência'
  },
  'Escorpião': {
    elemento: 'Água',
    regente: 'Plutão',
    desc: 'Intenso, magnético, transformador',
    dons: 'Profundidade, regeneração',
    desafios: 'Ciúme, vingança'
  },
  'Sagitário': {
    elemento: 'Fogo',
    regente: 'Júpiter',
    desc: 'Otimista, aventureiro, filosófico',
    dons: 'Sabedoria, expansão',
    desafios: 'Exagero, irresponsabilidade'
  },
  'Capricórnio': {
    elemento: 'Terra',
    regente: 'Saturno',
    desc: 'Ambicioso, disciplinado, responsável',
    dons: 'Persistência, estrutura',
    desafios: 'Frieza, pessimismo'
  },
  'Aquário': {
    elemento: 'Ar',
    regente: 'Urano',
    desc: 'Inovador, humanitário, independente',
    dons: 'Originalidade, visão futura',
    desafios: 'Distanciamento, rebeldia'
  },
  'Peixes': {
    elemento: 'Água',
    regente: 'Netuno',
    desc: 'Compassivo, sonhador, místico',
    dons: 'Intuição, criatividade',
    desafios: 'Fuga da realidade, vítima'
  }
};