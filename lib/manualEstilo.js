// lib/manualEstilo.js — regras de estilo que valem pra todas as seções do
// Manual (lib/ia.js) e o detector do contraste por negação. Puro: roda nos
// testes e na rota temporária de antes/depois.

// Contraste por negação ("não é X, é Y", "não por X, mas porque Y"): virou
// cacoete do texto gerado e faz todo Manual soar igual. Proibido em todas as
// seções, como o hedge ("tende a", "pode levar a").
export const REGRA_SEM_CONTRASTE = `
REGRA DE CONSTRUÇÃO (vale pra todos os campos): nunca monte a frase negando uma coisa pra depois afirmar outra. Proibido: "não é X, é Y", "não é X: é Y", "não é X. É Y.", "isso não é X, mas Y", "não por X, mas porque Y", "não X, e sim Y", "você não X: você Y" (ex.: "você não briga: desaparece"), "não se trata de X". Diga direto o que é. Em vez de "Não é falta de vontade: é excesso de critério", escreva "O que te trava é excesso de critério". Em vez de "Você não confronta: vai se afastando", escreva "Você vai se afastando em silêncio".`;

// Diagnóstico e Leitura integrada: cada afirmação diz de onde vem no mapa.
// Comportamento primeiro, sistema depois, como prova.
export const REGRA_DE_CITACAO = `
REGRA DE CITAÇÃO (o Manual cruza sistemas e mostra onde eles concordam): toda afirmação central sobre a pessoa diz de onde vem no mapa. Pelo menos uma citação por parágrafo; parágrafo sem citação está ERRADO.
• Forma: o comportamento primeiro, a fonte logo depois, numa frase curta. Ex.: "Isso aparece no seu Sol em Sagitário e de novo no seu número 11." / "Três sistemas dizem a mesma coisa aqui: o seu signo, a sua astrologia chinesa e o seu Kin." / "Quem mostra isso é a sua Lua em Câncer."
• Fontes que valem (só as que estão nos DADOS desta pessoa): Sol (signo), Lua, Vênus, Marte, Ascendente, Nodo Norte, número de vida, número da alma, número da expressão, ano pessoal, astrologia chinesa, anjo da guarda, anjo da mente, Kin Maia, Human Design.
• Só cite um sistema pra uma afirmação que os DADOS dele sustentam: a linha daquele sistema, ou a lista "O QUE MAIS DE UM SISTEMA REPETE" (os sistemas entre parênteses votaram naquele tema), ou "ONDE OS SISTEMAS PUXAM PRA LADOS OPOSTOS" (cada lado com os seus). Nunca atribua a um sistema algo que a linha dele não diz.
• Quando mais de um sistema sustenta a mesma coisa, cite os que concordam (no máximo 3 por frase): mostrar a concordância é o ponto.
• Nunca explique o que o sistema é, nunca abra o parágrafo pelo sistema ("Seu signo traz…") e nunca use jargão solto ("Day Master", "Autoridade", "Kin" sem o nome): "a sua astrologia chinesa", "o seu anjo da guarda, Nithael", "o seu Kin, Terra Ressonante".
• A frase-resumo curta ("frase_diagnostico", quando existir) fica sem citação.`;

// Human Design e Kin Maia são sistemas modernos. Vale pro Manual (bloco dos
// outros sistemas), pros posts das redes (GUIA_EDITORIAL) e pro Oráculo.
// O Sincronário da Paz (Kin) aparece entre 1987 e 1990 conforme a fonte, por
// isso "fim dos anos 1980" e não um ano exato.
export const REGRA_SISTEMAS_MODERNOS = 'Human Design (criado em 1987) e o Kin Maia do Sincronário da Paz (criado por José Argüelles no fim dos anos 1980) são sistemas modernos: nunca chame nenhum dos dois de milenar, antigo ou ancestral.';

// ── Detector ────────────────────────────────────────────────────────────────
// Pega as formas mais comuns do contraste por negação. Não é exaustivo (a
// regra no prompt é o que segura); serve pra medir antes/depois e pra
// garantir que os exemplos dos próprios prompts não ensinam o vício.
// \b do JavaScript só enxerga ASCII ("é" não é letra pra ele): as bordas
// de palavra aqui são feitas à mão.
const L = 'a-zA-Zà-úÀ-Ú0-9_';
const INI = `(?<![${L}])`;
const FIM = `(?![${L}])`;
const SER = `(?:é|era|foi|são|está|estava)`;
const PADROES = [
  // não é X, é Y · não é X: é Y · não é X. É Y · não é X — é Y · não era X; era Y
  new RegExp(`${INI}n[ãa]o ${SER}${FIM}[^.!?\\n]{1,80}?[,:;.—–]\\s+${SER}${FIM}`, 'gi'),
  // isso não é X, mas Y · você não é X, só Y
  new RegExp(`${INI}n[ãa]o ${SER}${FIM}[^.!?\\n:;]{1,80}?,?\\s+(?:mas|só|apenas)${FIM}`, 'gi'),
  // não um X, mas Y
  new RegExp(`${INI}n[ãa]o (?:um|uma|o|a|os|as)${FIM}[^.!?\\n]{1,60}?,\\s*mas${FIM}`, 'gi'),
  // não por X, mas porque Y
  new RegExp(`${INI}n[ãa]o (?:por|porque)${FIM}[^.!?\\n]{1,80}?${INI}mas${FIM}`, 'gi'),
  // não X, e sim Y
  new RegExp(`${INI}n[ãa]o${FIM}[^.!?\\n]{1,60}?,\\s*e sim${FIM}`, 'gi'),
  // você não X: (você) Y — negação curta seguida de dois-pontos
  new RegExp(`${INI}n[ãa]o [a-zà-ú]+(?: [a-zà-ú]+)?\\s*:\\s+(?:você\\s+)?[a-zà-ú]`, 'gi'),
  // não se trata de X
  new RegExp(`${INI}n[ãa]o se trata de${FIM}`, 'gi'),
];

/**
 * Trechos do texto com contraste por negação.
 * @param {string} texto
 * @returns {string[]}
 */
export function acharContrastes(texto) {
  const t = String(texto || '');
  const achados = [];
  for (const re of PADROES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const ini = Math.max(0, t.lastIndexOf(' ', Math.max(0, m.index - 30)));
      achados.push({ i: m.index, trecho: t.slice(ini, m.index + m[0].length + 25).trim() });
    }
  }
  // Um trecho pego por dois padrões conta uma vez.
  return achados.sort((a, b) => a.i - b.i)
    .filter((a, k, xs) => k === 0 || a.i - xs[k - 1].i > 10)
    .map((a) => a.trecho);
}

// Nomes de sistema que contam como citação (pra rota de antes/depois).
const CITACAO = /\b(Sol em|Lua em|Vênus em|Marte em|Ascendente em|Nodo Norte|n[úu]mero (de vida|da alma|da expressão|\d{1,2})|ano pessoal|astrologia chinesa|anjo da (guarda|mente)|Kin\b|Human Design|seu signo|seu Sol)\b/gi;

/** Quantas vezes o texto cita um sistema pelo nome. */
export function contarCitacoes(texto) {
  return (String(texto || '').match(CITACAO) || []).length;
}
