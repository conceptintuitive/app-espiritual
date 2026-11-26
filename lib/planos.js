// lib/planos.js — o que cada forma de pagar inclui (nov/2026).
// Fonte única da página /planos e do resumo "o que vem com o Manual" do
// /resultado. Preços SEMPRE de lib/preco.js.
//
// Divisão (decisão da Bianca, nov/2026): o Manual do seu Mapa é a compra de
// uma vez (você se conhece) e vem com 30 dias do Intuitive Completo de bônus;
// o Intuitive Completo é o acompanhamento de todo dia (Seu Dia, Previsão do
// Ano, Human Design). Previsão, Human Design e Compatibilidade não são mais
// vendidos avulsos: quem já comprou continua com acesso (tier2/hd/compat_*).
//
// Fatos conferidos no código antes de escrever:
//   - cortesia do Manual = acesso de assinante por 30 dias (lib/assinaturaRegras.js);
//   - Compatibilidade Completa grátis pra quem tem o Manual (salvar-compat-pessoa2)
//     e pra assinante (compatibilidade-completa/[id]);
//   - Oráculo: 3 perguntas grátis; Manual pago ou assinante = ilimitado
//     (app/api/assistente, com teto diário);
//   - anual libera o Manual da análise mais recente do e-mail.

import {
  PRECO_MANUAL_JANELA, PRECO_MANUAL_PADRAO, PRECO_ASSINATURA_MENSAL, PRECO_ASSINATURA_ANUAL,
} from './preco.js';
import { DIAS_CORTESIA_MANUAL } from './assinaturaRegras.js';

export const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Preço mensal equivalente do anual, no centavo (R$ 12,42, o mesmo do /assinar). */
export const anualPorMes = () => Math.round((PRECO_ASSINATURA_ANUAL / 12) * 100) / 100;

/** Os 3 cartões da página /planos, na ordem em que aparecem. */
export const PLANOS = [
  {
    chave: 'gratis',
    nome: 'Mapa grátis',
    preco: 'R$ 0',
    detalhePreco: 'pra sempre',
    praQuem: 'Pra conhecer o seu mapa.',
    inclui: [
      'Signo, número de vida, anjo da guarda, Kin e o céu do seu nascimento',
      'O começo do seu Diagnóstico e a carta do dia',
      'O resumo do seu dia, todo dia',
      `7 dias do Seu Dia Completo grátis, sem cartão`,
    ],
  },
  {
    chave: 'manual',
    nome: 'Manual do seu Mapa',
    preco: brl(PRECO_MANUAL_PADRAO),
    precoJanela: brl(PRECO_MANUAL_JANELA),
    detalhePreco: 'pagamento único, seu pra sempre',
    praQuem: 'Pra se entender de uma vez.',
    inclui: [
      '14 seções escritas só sobre você: diagnóstico, amor, dinheiro, ponto cego, plano de 7 dias',
      'A Compatibilidade Completa com uma pessoa',
      'O Oráculo sem limite de perguntas',
      `De bônus: ${DIAS_CORTESIA_MANUAL} dias do Intuitive Completo, sem cobrança e sem renovação automática`,
    ],
  },
  {
    chave: 'completo',
    nome: 'Intuitive Completo',
    preco: `${brl(PRECO_ASSINATURA_MENSAL)}/mês`,
    detalhePreco: `ou ${brl(PRECO_ASSINATURA_ANUAL)}/ano com o Manual incluso`,
    praQuem: 'Pra ter o seu mapa com você todo dia.',
    destaque: true,
    inclui: [
      'O Seu Dia Completo: o e-mail das 7h, a semana e as melhores horas',
      'A Previsão do Ano, mês a mês',
      'O Human Design completo: Tipo, Autoridade, Perfil e centros',
      'A Compatibilidade Completa e o Oráculo sem limite',
      'No anual: o Manual do seu Mapa incluso',
    ],
  },
];

/**
 * Tabela de comparação (linha a linha). Valor: true = incluso, false = não,
 * texto = incluso com condição.
 */
export const COMPARACAO = [
  { item: 'Seu Mapa (signo, número, anjo, Kin, céu)', gratis: true, manual: true, completo: true },
  { item: 'Resumo do seu dia', gratis: true, manual: true, completo: true },
  { item: 'Manual do seu Mapa (14 seções)', gratis: false, manual: true, completo: 'no anual' },
  { item: 'Compatibilidade Completa', gratis: false, manual: true, completo: true },
  { item: 'Oráculo', gratis: '3 perguntas', manual: 'sem limite', completo: 'sem limite' },
  { item: 'Seu Dia Completo (e-mail às 7h)', gratis: '7 dias', manual: `${DIAS_CORTESIA_MANUAL} dias`, completo: true },
  { item: 'Previsão do Ano (12 meses)', gratis: 'mês atual', manual: `${DIAS_CORTESIA_MANUAL} dias`, completo: true },
  { item: 'Human Design completo', gratis: 'só o Tipo', manual: `${DIAS_CORTESIA_MANUAL} dias`, completo: true },
];

/** O bônus do Manual numa linha (usada no /resultado e nos e-mails). */
export const BONUS_MANUAL = `${DIAS_CORTESIA_MANUAL} dias do Intuitive Completo: Seu Dia, Previsão do Ano e Human Design`;

/** O que deixa de valer quando a cortesia acaba (o Manual, a Compatibilidade e o Oráculo ficam). */
export const PERDE_NO_FIM_DA_CORTESIA = [
  'O Seu Dia Completo: o e-mail das 7h, a semana e as melhores horas',
  'A Previsão do Ano, mês a mês',
  'O Human Design completo',
];

export const FAQ_PLANOS = [
  {
    p: 'Qual a diferença entre o Manual e o Intuitive Completo?',
    r: 'O Manual do seu Mapa é uma leitura de 14 seções sobre você, que você compra uma vez e fica pra sempre. O Intuitive Completo é o acompanhamento de todo dia: o Seu Dia às 7h, a Previsão do Ano mês a mês e o Human Design completo.',
  },
  {
    p: 'Quem compra o Manual ganha o Intuitive Completo?',
    r: `Ganha ${DIAS_CORTESIA_MANUAL} dias, sem cobrança e sem renovação automática. Depois disso, o Manual, a Compatibilidade Completa e o Oráculo continuam seus; o Seu Dia, a Previsão do Ano e o Human Design completos ficam com a assinatura. A gente avisa por e-mail antes de acabar.`,
  },
  {
    p: 'O plano anual inclui o Manual?',
    r: `Sim. Com o anual (${brl(PRECO_ASSINATURA_ANUAL)}, ${brl(anualPorMes())} por mês), o Manual do seu Mapa mais recente do seu e-mail é liberado na hora.`,
  },
  {
    p: 'Posso cancelar a assinatura?',
    r: 'Pode, quando quiser, na Minha Área (aba Conta). No cartão, a cobrança se repete até você cancelar; no Pix, você paga um período por vez e nada renova sozinho. Em até 7 dias da contratação, devolvemos o valor pago.',
  },
  {
    p: 'Eu já comprei a Previsão do Ano ou o Human Design. Perco?',
    r: 'Não. O que você já comprou continua liberado pra sempre.',
  },
];
