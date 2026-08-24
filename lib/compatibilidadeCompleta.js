// lib/compatibilidadeCompleta.js
// Compatibilidade Completa (bônus pago) — cruza o mapa de duas pessoas de
// verdade (Sol, Lua, Vênus, Marte), diferente da Compatibilidade Astral
// gratuita (lib/compatibilidade.js), que só compara dois signos escolhidos
// manualmente. Ascendente fica de fora aqui porque a segunda pessoa só
// informa nome + data de nascimento (sem hora/local), e Ascendente exige os
// dois pra ter qualquer precisão.

import { calcularPlanetas, calcularSigno } from './calculos';
import { getCompatibilidade } from './compatibilidade';

/**
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {string|null} horaNascimento "HH:MM" (opcional)
 * @returns {{ sol: string, lua: string|null, venus: string|null, marte: string|null } | null}
 */
export function calcularSignosPessoa(dataNascimentoISO, horaNascimento = null) {
  const parts = (dataNascimentoISO || '').split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [, month, day] = parts;

  const sol = calcularSigno(day, month);
  const planetas = calcularPlanetas(dataNascimentoISO, horaNascimento);

  return {
    sol,
    lua: planetas?.signoLua || null,
    venus: planetas?.signoVenus || null,
    marte: planetas?.signoMarte || null,
  };
}

const EIXOS = [
  { chave: 'sol', rotulo: 'Sol · Identidade', emoji: '☀️' },
  { chave: 'lua', rotulo: 'Lua · Emoção', emoji: '🌙' },
  { chave: 'venus', rotulo: 'Vênus · Amor', emoji: '💕' },
  { chave: 'marte', rotulo: 'Marte · Ação', emoji: '⚔️' },
];

/**
 * @param {{sol:string,lua:string,venus:string,marte:string}} pessoaA
 * @param {{sol:string,lua:string,venus:string,marte:string}} pessoaB
 * @returns {{ eixos: Array, scoreGeral: number|null }}
 */
export function gerarCompatibilidadeCompleta(pessoaA, pessoaB) {
  const eixos = EIXOS.map(({ chave, rotulo, emoji }) => {
    const a = pessoaA?.[chave];
    const b = pessoaB?.[chave];
    if (!a || !b) return null;
    const c = getCompatibilidade(a, b);
    if (!c) return null;
    return { chave, rotulo, emoji, ...c };
  }).filter(Boolean);

  const scoreGeral = eixos.length
    ? Math.round(eixos.reduce((soma, e) => soma + e.score, 0) / eixos.length)
    : null;

  return { eixos, scoreGeral };
}
