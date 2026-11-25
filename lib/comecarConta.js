// lib/comecarConta.js — a conta do "Ache seu número" (soma os algarismos do
// dia até sobrar 1), sem import nenhum: o /comecar usa no navegador sem levar
// lib/reelsInterativo.js junto. Mesma regra do reduzirDia (testado lado a lado).

/** 28 → { numero: 1, conta: "2 + 8 = 10 → 1 + 0 = 1" } */
export function contaDoDia(dia) {
  const passos = [];
  let n = dia;
  while (n > 9) {
    const ds = String(n).split('').map(Number);
    const soma = ds.reduce((a, b) => a + b, 0);
    passos.push(`${ds.join(' + ')} = ${soma}`);
    n = soma;
  }
  return { numero: n, conta: passos.length ? passos.join(' → ') : null };
}
