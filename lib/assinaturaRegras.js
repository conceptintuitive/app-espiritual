// lib/assinaturaRegras.js
// Regras puras da assinatura "Intuitive Completo" (sem banco, sem rede) —
// testadas em tests/assinatura.test.js. Quem fala com MP e Supabase é
// lib/assinatura.js.

import { PRECO_ASSINATURA_MENSAL, PRECO_ASSINATURA_ANUAL } from './preco.js';

const DIA_MS = 86400 * 1000;

export const PLANOS = {
  mensal: {
    preco: PRECO_ASSINATURA_MENSAL,
    dias: 31,
    titulo: 'Intuitive Completo — Mensal',
    recorrencia: { frequency: 1, frequency_type: 'months' },
  },
  anual: {
    preco: PRECO_ASSINATURA_ANUAL,
    dias: 366,
    titulo: 'Intuitive Completo — Anual (inclui o Manual)',
    recorrencia: { frequency: 12, frequency_type: 'months' },
  },
};

export const METODOS = new Set(['recorrente', 'prepago']);

/** Quem comprou o Manual ganha esse tanto de Intuitive Completo (a partir do pagamento). */
export const DIAS_CORTESIA_MANUAL = 30;

/** Folga depois da data da próxima cobrança do cartão (o MP tenta de novo por alguns dias). */
export const FOLGA_CARTAO_DIAS = 3;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** external_reference usado no MP pras assinaturas. */
export const refAssinatura = (id) => `assin__${id}`;
export function idDaRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('assin__')) return null;
  const id = ref.slice('assin__'.length);
  return UUID.test(id) ? id : null;
}

/** Novo acesso_ate de um pré-pago: soma o período a partir de agora OU do vencimento atual (o que for maior). */
export function estenderAcesso(acessoAteAtual, dias, agora = Date.now()) {
  const atual = acessoAteAtual ? new Date(acessoAteAtual).getTime() : 0;
  return new Date(Math.max(agora, atual) + dias * DIA_MS);
}

/**
 * acesso_ate de uma assinatura de cartão a partir do preapproval do MP.
 * Autorizada = paga até a próxima cobrança (+ folga). Sem next_payment_date,
 * usa o período do plano a partir de agora. Nunca diminui um acesso já pago.
 */
export function acessoDoCartao({ status, nextPaymentDate, plano, acessoAteAtual, agora = Date.now() }) {
  const atual = acessoAteAtual ? new Date(acessoAteAtual).getTime() : 0;
  if (status !== 'authorized') return atual ? new Date(atual) : null;
  const prox = nextPaymentDate ? new Date(nextPaymentDate).getTime() : NaN;
  const alvo = Number.isFinite(prox) && prox > agora
    ? prox + FOLGA_CARTAO_DIAS * DIA_MS
    : agora + PLANOS[plano].dias * DIA_MS;
  return new Date(Math.max(atual, alvo));
}

/** Status da linha a partir do status do preapproval. */
export function statusDoCartao(statusMp) {
  if (statusMp === 'authorized') return 'ativa';
  if (statusMp === 'cancelled' || statusMp === 'paused') return 'cancelada';
  return 'pendente';
}

/**
 * Acesso de um e-mail juntando as linhas de assinatura e a cortesia do Manual.
 * @param {{ linhas: Array<{plano, metodo, status, acesso_ate}>, manualPagoEm?: string|null, agora?: number }} p
 */
export function resumoAcesso({ linhas = [], manualPagoEm = null, agora = Date.now() }) {
  const ativas = linhas
    .filter((l) => l.acesso_ate && new Date(l.acesso_ate).getTime() > agora)
    .sort((a, b) => new Date(b.acesso_ate) - new Date(a.acesso_ate));
  const melhor = ativas[0] || null;
  const anual = ativas.some((l) => l.plano === 'anual');
  const renovaSozinha = ativas.some((l) => l.metodo === 'recorrente' && l.status === 'ativa');

  if (melhor) {
    return {
      ativa: true,
      origem: 'assinatura',
      plano: anual ? 'anual' : melhor.plano,
      metodo: melhor.metodo,
      acessoAte: new Date(melhor.acesso_ate).toISOString(),
      renovaSozinha,
      incluiManual: anual,
    };
  }
  if (manualPagoEm) {
    const fim = new Date(manualPagoEm).getTime() + DIAS_CORTESIA_MANUAL * DIA_MS;
    if (fim > agora) {
      return { ativa: true, origem: 'manual', plano: null, metodo: null, acessoAte: new Date(fim).toISOString(), renovaSozinha: false, incluiManual: false };
    }
  }
  return { ativa: false, origem: null, plano: null, metodo: null, acessoAte: null, renovaSozinha: false, incluiManual: false };
}
