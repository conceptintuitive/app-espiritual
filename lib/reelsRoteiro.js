// lib/reelsRoteiro.js — o Reels NARRADO (30–40s): roteiro, regras, e o tempo de
// cada palavra pra legenda. Puro (sem rede, sem banco), testado em
// tests/reels.test.js. Quem pede o texto à IA é lib/socialIA.js
// (gerarRoteiroReels); quem narra é lib/elevenlabs.js; quem filma é
// app/social/reels/[data] (modo narrado) pelo GitHub Actions.
//
// Formato fixo (o assunto muda com o tema do dia, lib/social.js):
//   a) gancho   uma situação concreta que a pessoa vai viver HOJE (nunca pergunta)
//   b) porquê   o mecanismo psicológico + como o símbolo do dia conversa com
//               isso, separando o que é ciência do que é simbólico; ancorado num
//               dado real do dia (dia universal, Lua, Kin, anjo destes dias)
//   c) virada   uma ideia que contradiz o senso comum
//   d) prática  "Quando X acontecer hoje, faça Y" (gatilho + ação de < 2 min)
//   e) fecho    alternado por dia: comentar a data / salvar / mandar pra alguém
// Total: 80 a 95 palavras (~2,5 palavras por segundo = 32–38s de áudio).

export const PALAVRAS_MIN = 80;
export const PALAVRAS_MAX = 95;
export const PALAVRAS_POR_SEGUNDO = 2.5;
export const FOLGA_FINAL = 1; // s de vídeo depois do fim da fala

export const FECHAMENTOS = {
  comenta: 'Comenta sua data de nascimento que eu te digo o seu número.',
  salva: 'Salva pra lembrar hoje à noite.',
  manda: 'Manda pra quem precisa ouvir isso hoje.',
};

const NUMERO_POR_EXTENSO = { 1: 'um', 2: 'dois', 3: 'tres', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 11: 'onze', 22: 'vinte e dois', 33: 'trinta e tres' };

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const limpa = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().replace(/^["“”']+|["“”']+$/g, '').trim();
const comPonto = (s) => (!s || /[.!?…]$/.test(s) ? s : `${s}.`);

/** Palavras de um texto falado (tokens com letra ou número). */
export function contarPalavras(texto) {
  return String(texto || '').split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p)).length;
}

const diaDoAno = (dataISO) => Math.floor(Date.parse(`${dataISO}T12:00:00Z`) / 86400000);

/**
 * Fechamento do dia, em rodízio. "Comenta sua data" só entra quando a
 * resposta automática a comentários está ligada (SOCIAL_RESPOSTAS): senão
 * ninguém responde.
 * @returns {{ tipo: 'comenta'|'salva'|'manda', texto: string }}
 */
export function fechamentoDoDia(dataISO, { comentarios = false } = {}) {
  const lista = comentarios ? ['comenta', 'salva', 'manda'] : ['salva', 'manda'];
  const tipo = lista[diaDoAno(dataISO) % lista.length];
  return { tipo, texto: FECHAMENTOS[tipo] };
}

/**
 * Âncoras do dia: o roteiro tem que citar pelo menos uma no "porquê" (é o
 * dado real que o site calcula; nada inventado).
 * @param {{ dia_universal?: number, lua?: string, kin?: string, anjo_destes_dias?: string }} energia
 * @returns {Array<{ rotulo: string, testa: (texto: string) => boolean }>}
 */
export function ancorasDoDia(energia = {}) {
  const out = [];
  if (energia.dia_universal) {
    const n = energia.dia_universal;
    // "dia universal 7", "o dia universal de hoje é 7", "dia universal sete"
    const num = `(${n}|${NUMERO_POR_EXTENSO[n] || n})`;
    const re = new RegExp(`\\b(dia|numero) universal(\\s+\\S+){0,3}?\\s+${num}\\b`);
    out.push({ rotulo: `dia universal ${n}`, testa: (t) => re.test(semAcento(t)) });
  }
  if (energia.lua) {
    const [fase, signo] = String(energia.lua).split(' em ');
    out.push({ rotulo: energia.lua, testa: (t) => semAcento(t).includes(semAcento(fase)) || (signo ? semAcento(t).includes(`lua em ${semAcento(signo)}`) : false) });
  }
  if (energia.kin) out.push({ rotulo: `Kin ${energia.kin}`, testa: (t) => semAcento(t).includes(semAcento(energia.kin).split(' ').slice(0, 2).join(' ')) });
  if (energia.anjo_destes_dias) out.push({ rotulo: energia.anjo_destes_dias, testa: (t) => semAcento(t).includes(semAcento(energia.anjo_destes_dias)) });
  return out;
}

const GATILHO = /^(quando|na pr[oó]xima vez que|sempre que|assim que|toda vez que|no momento em que)\b/i;

/** "Quando X acontecer hoje, faça Y": gatilho no começo, vírgula, ação concreta depois. */
export function praticaTemGatilho(pratica) {
  const p = limpa(pratica);
  if (!GATILHO.test(p)) return false;
  const i = p.indexOf(',');
  if (i < 0) return false;
  return contarPalavras(p.slice(i + 1)) >= 3 && contarPalavras(p.slice(0, i)) >= 3;
}

/** O texto que vai pro ElevenLabs (e vira a legenda): gancho, porquê, virada, prática, fecho. */
export function textoNarrado(r) {
  return [r.gancho, r.porque, r.virada, r.pratica, r.fechamento].map((x) => comPonto(limpa(x))).filter(Boolean).join(' ');
}

/**
 * Normaliza o que a IA devolveu. `escolhido` = índice do gancho que a revisão
 * escolheu (o mais específico); sem ele, o 1º.
 */
export function normalizarRoteiro(bruto, { fechamento, escolhido = 0 }) {
  const ganchos = (Array.isArray(bruto?.ganchos) ? bruto.ganchos : [bruto?.gancho]).map(limpa).filter(Boolean).slice(0, 3);
  const i = Number.isInteger(escolhido) && escolhido >= 0 && escolhido < ganchos.length ? escolhido : 0;
  const leg = bruto?.legenda || {};
  return {
    ganchos,
    escolhido: i,
    gancho: comPonto(ganchos[i] || ''),
    porque: comPonto(limpa(bruto?.porque)),
    virada: comPonto(limpa(bruto?.virada)),
    pratica: comPonto(limpa(bruto?.pratica)),
    fechamento: fechamento.texto,
    fechamentoTipo: fechamento.tipo,
    legenda: {
      gancho: limpa(leg.gancho),
      texto: (Array.isArray(leg.texto) ? leg.texto : [leg.texto]).map(limpa).filter(Boolean).slice(0, 5),
    },
  };
}

/**
 * Confere o roteiro normalizado. Devolve { ok, problemas, palavras }.
 * `problemasDoTexto` (lib/socialEditorial.js) entra injetado, pra este arquivo
 * ficar sem dependência.
 */
export function validarRoteiro(r, { energia = {}, problemasDoTexto = () => [] } = {}) {
  const prob = [];
  if ((r?.ganchos || []).length < 3) prob.push('quero 3 ganchos');
  for (const [k, g] of (r?.ganchos || []).entries()) {
    if (/\?\s*$/.test(g)) prob.push(`gancho ${k + 1} é pergunta (quero uma situação concreta)`);
    if (!/\bhoje\b/i.test(g)) prob.push(`gancho ${k + 1} não fala de hoje`);
    if (contarPalavras(g) > 20) prob.push(`gancho ${k + 1} longo (${contarPalavras(g)} palavras; máximo 20)`);
  }
  for (const campo of ['porque', 'virada', 'pratica']) if (!r?.[campo] || contarPalavras(r[campo]) < 4) prob.push(`faltou ${campo}`);
  if (r?.pratica && !praticaTemGatilho(r.pratica)) prob.push('prática sem gatilho + ação ("Quando X acontecer hoje, faça Y")');
  const ancoras = ancorasDoDia(energia);
  if (ancoras.length && !ancoras.some((a) => a.testa(r?.porque || ''))) {
    prob.push(`o porquê não cita nenhum dado do dia (${ancoras.map((a) => a.rotulo).join(' / ')})`);
  }
  const texto = textoNarrado(r || {});
  const palavras = contarPalavras(texto);
  if (palavras < PALAVRAS_MIN || palavras > PALAVRAS_MAX) prob.push(`${palavras} palavras no total (quero de ${PALAVRAS_MIN} a ${PALAVRAS_MAX})`);
  prob.push(...problemasDoTexto(texto).map((m) => `${m} no texto falado`));
  if (!r?.legenda?.gancho || r.legenda.gancho.length > 160) prob.push('gancho da legenda vazio ou longo');
  if (!r?.legenda?.texto?.length || r.legenda.texto.length < 2) prob.push('legenda com menos de 2 linhas');
  prob.push(...problemasDoTexto([r?.legenda?.gancho, ...(r?.legenda?.texto || [])].join('\n')).map((m) => `${m} na legenda`));
  return { ok: prob.length === 0, problemas: [...new Set(prob)], palavras };
}

// ── Tempo de cada palavra (alinhamento do ElevenLabs) ──────────────────────

/**
 * Do alinhamento por caractere do ElevenLabs (/with-timestamps) pro tempo de
 * cada palavra: começo = 1º caractere, fim = último. A pontuação fica grudada
 * na palavra (é o que aparece na legenda).
 * @param {{ characters: string[], character_start_times_seconds: number[], character_end_times_seconds: number[] }} al
 * @returns {Array<{ texto: string, ini: number, fim: number }>}
 */
export function palavrasDoAlinhamento(al) {
  const chars = al?.characters || [];
  const ini = al?.character_start_times_seconds || [];
  const fim = al?.character_end_times_seconds || [];
  const out = [];
  let atual = null;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) {
      if (atual) out.push(atual);
      atual = null;
      continue;
    }
    if (!atual) atual = { texto: '', ini: Number(ini[i]) || 0, fim: Number(fim[i]) || 0 };
    atual.texto += c;
    atual.fim = Number(fim[i]) || atual.fim;
  }
  if (atual) out.push(atual);
  const arred = (x) => Math.round(x * 1000) / 1000;
  return out.filter((p) => /[\p{L}\p{N}]/u.test(p.texto) || out.length === 1).map((p) => ({ texto: p.texto, ini: arred(p.ini), fim: arred(p.fim) }));
}

/** Duração do vídeo: fim da fala + ~1s, arredondado pra cima no quadro. */
export function duracaoDoVideo(palavras, fps = 30) {
  const fala = palavras?.length ? palavras[palavras.length - 1].fim : 0;
  return Math.ceil((fala + FOLGA_FINAL) * fps) / fps;
}

/**
 * Agrupa as palavras em blocos de legenda (o que fica na tela de cada vez):
 * até `maxPalavras` palavras e `maxCaracteres` letras, quebrando depois de
 * pontuação. Cada bloco vale do começo da 1ª palavra até o começo do próximo.
 * @returns {Array<{ de: number, ate: number, ini: number, fim: number }>} de/ate = índices (inclusive)
 */
export function blocosDaLegenda(palavras, { maxPalavras = 4, maxCaracteres = 24 } = {}) {
  const blocos = [];
  let de = 0;
  let letras = 0;
  for (let i = 0; i < palavras.length; i++) {
    const tam = palavras[i].texto.length;
    const n = i - de + 1;
    if (n > 1 && (n > maxPalavras || letras + 1 + tam > maxCaracteres)) {
      blocos.push({ de, ate: i - 1 });
      de = i;
      letras = 0;
    }
    letras += (letras ? 1 : 0) + tam;
    if (/[.!?:;,…]$/.test(palavras[i].texto)) {
      blocos.push({ de, ate: i });
      de = i + 1;
      letras = 0;
    }
  }
  if (de < palavras.length) blocos.push({ de, ate: palavras.length - 1 });
  return blocos.map((b, k) => ({
    ...b,
    ini: palavras[b.de].ini,
    fim: k + 1 < blocos.length ? palavras[blocos[k + 1].de].ini : palavras[b.ate].fim + FOLGA_FINAL,
  }));
}

/**
 * O que está na tela no instante t: o bloco (índice, -1 antes da 1ª fala) e a
 * palavra falada (índice global, -1 se nenhuma ainda). Depois da última
 * palavra, o último bloco fica, com a última palavra acesa.
 */
export function legendaNoTempo(blocos, palavras, t) {
  let b = -1;
  for (let k = 0; k < blocos.length; k++) if (t >= blocos[k].ini) b = k;
  if (b < 0) return { bloco: -1, palavra: -1 };
  let p = -1;
  for (let i = blocos[b].de; i <= blocos[b].ate; i++) if (t >= palavras[i].ini) p = i;
  return { bloco: b, palavra: p };
}
