// lib/manualLeitura.js
// Leitura do Manual (/manual/[id]): capítulos, frase de destaque de cada
// seção, seções lidas / "continuar de onde parou" e a jornada do plano de 7
// dias e do calendário (que a aba Hoje do Seu Dia lê). Puro, sem React nem
// window direto (o storage é passado de fora). Testado em tests/manual.test.js.
//
// O conteúdo e a ordem das seções continuam sendo do lib/manualgenerator.js;
// aqui só agrupamos em capítulos, na ordem de CAPITULOS, mantendo a ordem
// interna do gerador dentro de cada capítulo.

export const CAPITULOS = [
  { id: 'quem', rotulo: 'Quem você é' },
  { id: 'amor', rotulo: 'Amor' },
  { id: 'dinheiro', rotulo: 'Dinheiro' },
  { id: 'trava', rotulo: 'O que te trava' },
  { id: 'pratica', rotulo: 'Prática' },
];

const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Mesma regra do chaveSecao (app/components/FeedbackSecao.js): título → slug. */
export function slugSecao(section) {
  const base = semAcento(section?.title || section?.type || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return base || String(section?.type || 'secao');
}

/** Capítulo de uma seção do gerador (pelo tipo; nas de texto, pelo título). */
export function capituloDaSecao(section) {
  const t = section?.type;
  if (t === 'love') return 'amor';
  if (t === 'money') return 'dinheiro';
  if (t === 'plan7' || t === 'rituals' || t === 'calendar30' || t === 'closing') return 'pratica';
  const titulo = semAcento(section?.title);
  if (titulo === 'amor') return 'amor';
  if (titulo === 'dinheiro') return 'dinheiro';
  if (titulo === 'ponto cego' || titulo === 'bloqueios') return 'trava';
  if (['plano de 7 dias', 'rituais', 'calendario', 'fechamento'].includes(titulo)) return 'pratica';
  return 'quem';
}

/**
 * Seções agrupadas em capítulos (só os que têm seção), com a âncora de cada uma.
 * @param {Array<object>} sections  manual.sections já sem a carta de tarô
 * @returns {Array<{ id: string, rotulo: string, secoes: Array<{ section: object, ancora: string, titulo: string }> }>}
 */
export function agruparEmCapitulos(sections) {
  const usadas = new Map();
  const ancora = (s) => {
    const base = `s-${slugSecao(s)}`;
    const n = (usadas.get(base) || 0) + 1;
    usadas.set(base, n);
    return n > 1 ? `${base}-${n}` : base;
  };
  const porCap = Object.fromEntries(CAPITULOS.map((c) => [c.id, []]));
  for (const s of sections || []) {
    if (!s) continue;
    porCap[capituloDaSecao(s)].push({ section: s, ancora: ancora(s), titulo: String(s.title || '').trim() });
  }
  return CAPITULOS.map((c) => ({ ...c, secoes: porCap[c.id] })).filter((c) => c.secoes.length);
}

// ── Frase de destaque ────────────────────────────────────────────────────────

const limpar = (t) => String(t ?? '').replace(/\r\n/g, '\n').replace(/\*\*/g, '').replace(/\*/g, '').trim();

/** Primeira frase (até `max` caracteres) — sempre do texto já gerado, nunca IA nova. */
export function primeiraFrase(texto, max = 170) {
  const t = limpar(texto);
  if (!t) return '';
  const m = t.match(/[^.!?]+[.!?]+(\s|$)/);
  const f = (m ? m[0] : t).trim();
  return f.length > max ? `${f.slice(0, max - 1).trimEnd()}…` : f;
}

/** A citação grande do começo de cada seção. '' = sem citação. */
export function destaqueDaSecao(s) {
  if (!s) return '';
  switch (s.type) {
    case 'text': return primeiraFrase(s.body);
    case 'diagnostico': return limpar(s.quote) || primeiraFrase(s.blocks?.[0]?.text);
    case 'archetypes': return limpar(s.items?.[0]?.frase) || primeiraFrase(s.items?.[0]?.descricao);
    case 'rituals': return limpar(s.items?.[0]?.frase);
    case 'bullets': return primeiraFrase(s.note || s.items?.[0]);
    case 'plan7': return limpar(s.headline);
    case 'love': return limpar(s.headline) || primeiraFrase(s.pattern);
    case 'money': return primeiraFrase(s.headline);
    case 'calendar30': return limpar(s.weeks?.[0]?.focus);
    case 'closing': return limpar(s.mantra) || primeiraFrase(s.body);
    case 'mapa': return primeiraFrase(s.sintese);
    default: return '';
  }
}

// ── Lidas e "continuar de onde parou" (localStorage ic_manual_lidas_<id>) ────

export const chaveLidas = (id) => `ic_manual_lidas_${id}`;

/** @returns {{ lidas: string[], ultima: string|null }} */
export function lerLidas(raw) {
  try {
    const d = JSON.parse(raw || 'null');
    if (Array.isArray(d)) return { lidas: d.filter((x) => typeof x === 'string'), ultima: null }; // formato antigo
    return { lidas: Array.isArray(d?.lidas) ? d.lidas.filter((x) => typeof x === 'string') : [], ultima: typeof d?.ultima === 'string' ? d.ultima : null };
  } catch {
    return { lidas: [], ultima: null };
  }
}

/** Marca uma seção como lida e como a última. Devolve o novo estado (o mesmo objeto se nada mudou). */
export function marcarLida(estado, ancora) {
  if (!ancora) return estado;
  if (estado.ultima === ancora && estado.lidas.includes(ancora)) return estado;
  return { lidas: estado.lidas.includes(ancora) ? estado.lidas : [...estado.lidas, ancora], ultima: ancora };
}

/**
 * Deve mostrar "Continuar de onde parou"? Só se a última seção lida existe
 * nesta versão do Manual e não é a primeira (quem parou no começo não precisa).
 */
export function secaoParaContinuar(estado, ancoras) {
  if (!estado?.ultima || !ancoras?.length) return null;
  const i = ancoras.indexOf(estado.ultima);
  return i > 0 ? estado.ultima : null;
}

// ── Jornada: plano de 7 dias e calendário (localStorage ic_manual_jornada) ──

export const CHAVE_JORNADA = 'ic_manual_jornada';

/** "2026-11-23" no relógio de Brasília. */
export function hojeBrasilia(agora = new Date()) {
  try { return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); } catch { return agora.toISOString().slice(0, 10); }
}

function diasEntre(aISO, bISO) {
  const [a, b] = [aISO, bISO].map((s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); });
  return Math.round((b - a) / 86400000);
}

/** "Dia 3: **Escreva** o próximo passo." → "Escreva o próximo passo." (curto) */
export function tituloDoDia(texto, max = 90) {
  const t = limpar(texto).replace(/^dia\s*\d+\s*[:—–-]\s*/i, '').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** @returns {object|null} a jornada salva (ou null) */
export function lerJornada(raw) {
  try {
    const d = JSON.parse(raw || 'null');
    return d?.v === 1 && d.id ? d : null;
  } catch {
    return null;
  }
}

/**
 * Registra o início do plano ou do calendário no 1º check. Não mexe se já
 * começou (no mesmo Manual). Outro Manual no mesmo aparelho substitui.
 * @param {object|null} jornada
 * @param {{ id: string, nome?: string, tipo: 'plano'|'calendario', itens: string[], ancoras: string[], hoje: string }} p
 */
export function iniciarJornada(jornada, { id, nome = '', tipo, itens, ancoras, hoje }) {
  const base = jornada?.id === id ? jornada : { v: 1, id, nome };
  if (base[tipo]?.inicio) return base;
  return { ...base, nome: nome || base.nome || '', [tipo]: { inicio: hoje, itens: itens.map((t) => tituloDoDia(t)), ancoras } };
}

/**
 * O que a aba Hoje do Seu Dia mostra: "Dia N do seu plano: <título>".
 * Calendário em andamento ganha do plano (é o mais longo); fora do período, nada.
 * @returns {{ id: string, tipo: 'plano'|'calendario', n: number, total: number, titulo: string, href: string } | null}
 */
export function diaDaJornada(jornada, hoje) {
  if (!jornada?.id) return null;
  for (const tipo of ['calendario', 'plano']) {
    const j = jornada[tipo];
    if (!j?.inicio || !Array.isArray(j.itens) || !j.itens.length) continue;
    const n = diasEntre(j.inicio, hoje) + 1;
    if (n < 1 || n > j.itens.length) continue;
    const ancora = j.ancoras?.[n - 1] || '';
    return { id: jornada.id, tipo, n, total: j.itens.length, titulo: j.itens[n - 1], href: `/manual/${jornada.id}${ancora ? `#${ancora}` : ''}` };
  }
  return null;
}
