// lib/testeSeuDia.js — calendário do teste de 7 dias do Seu Dia Completo.
// Puro (sem banco). Testado em tests/testeSeuDia.test.js.
//
// Regra (nov/2026): o teste começa no 1º salvamento dos dados (teste_inicio)
// e vale até o FIM do 7º dia no relógio de Brasília. O dia em que salvou é o
// dia 1; no dia 8 voltam os cadeados. Assim a linha do topo ("faltam N dias")
// e os e-mails do dia 5 e do dia 7 falam a mesma língua:
//   dia 1 → faltam 6 · dia 5 → faltam 2 · dia 6 → falta 1 · dia 7 → último dia.

import { localToUTC } from './sky.js';

// A chave fica num arquivo sem import (a home usa no quiz sem levar sky.js).
export { TESTE_SEU_DIA_ATIVO } from './testeSeuDiaChave.js';

export const TZ_TESTE = 'America/Sao_Paulo';
export const DIAS_TESTE = 7;

/** "YYYY-MM-DD" de um instante no relógio de Brasília. */
export function dataBrasilia(instante) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_TESTE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(instante));
  const v = Object.fromEntries(p.map((x) => [x.type, x.value]));
  return `${v.year}-${v.month}-${v.day}`;
}

const diasEntre = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Dia do teste (1 = o dia em que começou) num instante; null sem teste. */
export function diaDoTeste(inicio, agora = Date.now()) {
  if (!inicio) return null;
  return diasEntre(dataBrasilia(inicio), dataBrasilia(agora)) + 1;
}

/** Instante em que o teste acaba: 00:00 (Brasília) do dia 8. */
export function fimDoTeste(inicio) {
  if (!inicio) return null;
  const [y, m, d] = dataBrasilia(inicio).split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + DIAS_TESTE));
  return localToUTC({ y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate(), hh: 0, mm: 0 }, TZ_TESTE);
}

/** Dias que faltam DEPOIS de hoje (0 = hoje é o último). null fora do teste. */
export function diasRestantes(inicio, agora = Date.now()) {
  const dia = diaDoTeste(inicio, agora);
  if (dia === null || dia < 1 || dia > DIAS_TESTE) return null;
  return DIAS_TESTE - dia;
}

/** Linha mono do topo da Minha Área durante o teste. */
export function textoTeste(restantes) {
  if (restantes === null || restantes === undefined) return '';
  if (restantes <= 0) return 'Seu Dia Completo grátis: hoje é o último dia.';
  if (restantes === 1) return 'Seu Dia Completo grátis: falta 1 dia.';
  return `Seu Dia Completo grátis: faltam ${restantes} dias.`;
}
