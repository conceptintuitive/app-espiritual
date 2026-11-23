// lib/ritualIcs.js
// "Colocar na minha agenda" dos rituais do Manual: monta um .ics no
// navegador (nada vai pro servidor). Puro; testado em tests/manual.test.js.
//
// O horário e a repetição saem do texto "quando" que a IA escreveu pro
// ritual ("Toda segunda à noite", "Pela manhã, por 7 dias", "às 21h"):
//   hora        "21h", "21:30", "às 7" → essa hora; senão pela palavra
//               (manhã/acordar 7h, almoço 12h30, tarde 16h, noite/dormir 21h30);
//               sem pista, 8h.
//   repetição   dia da semana citado → semanal nesses dias, 4 vezes;
//               "por N dias" / "durante N dias" → diário, N vezes (até 30);
//               "todo dia", "diariamente", "todas as manhãs/noites" → diário, 7 vezes;
//               sem pista → um evento só.
// Horário "flutuante" (sem fuso): a agenda usa o fuso do aparelho.

const DIAS = [
  ['domingo', 'SU', 0], ['segunda', 'MO', 1], ['terca', 'TU', 2], ['quarta', 'WE', 3],
  ['quinta', 'TH', 4], ['sexta', 'FR', 5], ['sabado', 'SA', 6],
];

const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const limpar = (t) => String(t ?? '').replace(/\*\*/g, '').replace(/\*/g, '').trim();

/** @returns {{ h: number, m: number }} */
export function horarioDoRitual(quando) {
  const q = semAcento(quando);
  const num = q.match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b/) || q.match(/\bas\s+(\d{1,2})\b/);
  if (num) {
    const h = Number(num[1]), m = Number(num[2] || 0);
    if (h >= 0 && h < 24 && m < 60) return { h, m };
  }
  if (/manha|acordar|ao despertar|cedo|amanhecer/.test(q)) return { h: 7, m: 0 };
  if (/almoco|meio-dia|meio dia/.test(q)) return { h: 12, m: 30 };
  if (/tarde/.test(q)) return { h: 16, m: 0 };
  if (/noite|dormir|deitar|anoitecer/.test(q)) return { h: 21, m: 30 };
  return { h: 8, m: 0 };
}

/** @returns {{ freq: 'DAILY'|'WEEKLY', count: number, byday?: string[], dias?: number[] } | null} */
export function repeticaoDoRitual(quando) {
  const q = semAcento(quando);
  const dias = DIAS.filter(([nome]) => q.includes(nome));
  if (dias.length) return { freq: 'WEEKLY', count: 4, byday: dias.map((d) => d[1]), dias: dias.map((d) => d[2]) };
  const n = q.match(/(?:por|durante)\s+(\d{1,2})\s+dias/);
  if (n) return { freq: 'DAILY', count: Math.min(30, Math.max(1, Number(n[1]))) };
  if (/todo(s)?\s+(os\s+)?dias?|diariamente|todas?\s+as\s+(manhas|noites|tardes)|cada dia/.test(q)) return { freq: 'DAILY', count: 7 };
  return null;
}

const pad = (n) => String(n).padStart(2, '0');
const dataIcs = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const dataUtcIcs = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const escapar = (t) => String(t ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Linhas de até 75 caracteres (RFC 5545): o resto continua com um espaço.
function dobrar(linha) {
  const partes = [];
  let resto = linha;
  while (resto.length > 75) { partes.push(resto.slice(0, 75)); resto = ` ${resto.slice(75)}`; }
  partes.push(resto);
  return partes.join('\r\n');
}

/** Primeiro horário a partir de `agora` (hoje se ainda der tempo, senão amanhã; no semanal, o próximo dia citado). */
export function inicioDoRitual(quando, agora = new Date()) {
  const { h, m } = horarioDoRitual(quando);
  const rep = repeticaoDoRitual(quando);
  const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m, 0, 0);
  if (rep?.dias) {
    for (let i = 0; i < 8; i++) {
      const c = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, h, m);
      if (rep.dias.includes(c.getDay()) && c.getTime() > agora.getTime() + 30 * 60000) return c;
    }
  }
  if (d.getTime() <= agora.getTime() + 30 * 60000) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * .ics de um ritual.
 * @param {{ nome: string, quando?: string, passos?: string[], frase?: string }} ritual
 * @param {{ agora?: Date, uid?: string, duracaoMin?: number }} [o]
 */
export function gerarIcsRitual(ritual, { agora = new Date(), uid = null, duracaoMin = 15 } = {}) {
  const ini = inicioDoRitual(ritual.quando, agora);
  const fim = new Date(ini.getTime() + duracaoMin * 60000);
  const rep = repeticaoDoRitual(ritual.quando);
  const passos = Array.isArray(ritual.passos) ? ritual.passos.map((p, i) => `${i + 1}. ${limpar(p)}`) : [];
  const descricao = [
    ritual.quando ? `Quando: ${limpar(ritual.quando)}` : '',
    ...passos,
    ritual.frase ? `Para fechar: ${limpar(ritual.frase)}` : '',
    'Do Manual do seu Mapa · intuitiveconcept.com.br',
  ].filter(Boolean).join('\n');
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Intuitive Concept//Manual do seu Mapa//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid || `ritual-${ini.getTime()}-${Math.random().toString(36).slice(2, 8)}`}@intuitiveconcept.com.br`,
    `DTSTAMP:${dataUtcIcs(agora)}`,
    `DTSTART:${dataIcs(ini)}`,
    `DTEND:${dataIcs(fim)}`,
    rep ? `RRULE:FREQ=${rep.freq};COUNT=${rep.count}${rep.byday ? `;BYDAY=${rep.byday.join(',')}` : ''}` : '',
    `SUMMARY:${escapar(`Ritual: ${limpar(ritual.nome)}`)}`,
    `DESCRIPTION:${escapar(descricao)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapar(`Ritual: ${limpar(ritual.nome)}`)}`,
    'TRIGGER:-PT5M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `${linhas.map(dobrar).join('\r\n')}\r\n`;
}

/** Nome do arquivo: "ritual-de-clareza.ics". */
export function nomeArquivoIcs(nome) {
  const slug = semAcento(limpar(nome)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return `ritual-${slug || 'manual'}.ics`;
}
