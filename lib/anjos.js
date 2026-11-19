// lib/anjos.js — os 72 anjos da Cabala (Shem HaMephorash).
//
// Anjo guardião: pela POSIÇÃO EXATA DO SOL no nascimento, não por tabela de
// datas. Na tradição, cada anjo rege 5° do zodíaco (um "quinário"): Vehuiah
// = 0°–5° de Áries … Mumiah = 25°–30° de Peixes. As tabelas de datas que
// circulam ("Vehuiah: 21 a 25/03") são uma aproximação disso e erram em quem
// nasceu na virada, porque o Sol não entra no mesmo grau na mesma data todo
// ano. Aqui a virada é exata (com hora e fuso histórico).
//
// Anjo da mente: pela hora do relógio (cada anjo rege 20 minutos do dia,
// Vehuiah 00:00–00:20 … Mumiah 23:40–00:00), como na tradição.
//
// Anjo do dia: o quinário em que o Sol está hoje.
//
// Sem API, sem banco, sem IA. Textos em lib/anjosTextos.js.

import { localToUTC } from './sky.js';
import { longitudeSolar } from './bazi.js';

const NOMES = [
  'Vehuiah', 'Jeliel', 'Sitael', 'Elemiah', 'Mahasiah', 'Lelahel', 'Achaiah', 'Cahetel',
  'Haziel', 'Aladiah', 'Lauviah', 'Hahaiah', 'Iezalel', 'Mebahel', 'Hariel', 'Hekamiah',
  'Lauviah', 'Caliel', 'Leuviah', 'Pahaliah', 'Nelchael', 'Ieiaiel', 'Melahel', 'Haheuiah',
  'Nith-Haiah', 'Haaiah', 'Ierathel', 'Seheiah', 'Reiyel', 'Omael', 'Lecabel', 'Vasariah',
  'Iehuiah', 'Lehahiah', 'Chavakiah', 'Menadel', 'Aniel', 'Haamiah', 'Rehael', 'Ieiazel',
  'Hahahel', 'Mikael', 'Veuliah', 'Ielahiah', 'Sealiah', 'Ariel', 'Asaliah', 'Mihael',
  'Vehuel', 'Daniel', 'Hahasiah', 'Imamiah', 'Nanael', 'Nithael', 'Mebahiah', 'Poiel',
  'Nemamiah', 'Ieialel', 'Harahel', 'Mitzrael', 'Umabel', 'Iah-Hel', 'Anauel', 'Mehiel',
  'Damabiah', 'Manakel', 'Eiael', 'Habuhiah', 'Rochel', 'Jabamiah', 'Haiaiel', 'Mumiah',
];

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Os dois Lauviah (11 e 17) ganham o número no slug pra não colidir. */
export const ANJOS = NOMES.map((nome, i) => {
  const n = i + 1;
  const base = slugify(nome);
  return { n, nome, slug: nome === 'Lauviah' ? `${base}-${n}` : base };
});

export function anjoPorSlug(slug) {
  return ANJOS.find((a) => a.slug === slug) || null;
}

// 9 coros × 8 anjos, cada um sob um arcanjo e uma Sefirá da Árvore da Vida.
export const COROS = [
  { nome: 'Serafins', arcanjo: 'Metatron', sefira: 'Keter', sefiraPt: 'a Coroa' },
  { nome: 'Querubins', arcanjo: 'Raziel', sefira: 'Chokmah', sefiraPt: 'a Sabedoria' },
  { nome: 'Tronos', arcanjo: 'Tsaphkiel', sefira: 'Binah', sefiraPt: 'o Entendimento' },
  { nome: 'Dominações', arcanjo: 'Tsadkiel', sefira: 'Chesed', sefiraPt: 'a Misericórdia' },
  { nome: 'Potências', arcanjo: 'Camael', sefira: 'Geburah', sefiraPt: 'a Força' },
  { nome: 'Virtudes', arcanjo: 'Rafael', sefira: 'Tiphereth', sefiraPt: 'a Beleza' },
  { nome: 'Principados', arcanjo: 'Haniel', sefira: 'Netzach', sefiraPt: 'a Vitória' },
  { nome: 'Arcanjos', arcanjo: 'Mikael', sefira: 'Hod', sefiraPt: 'o Esplendor' },
  { nome: 'Anjos', arcanjo: 'Gabriel', sefira: 'Yesod', sefiraPt: 'o Fundamento' },
];

export const SIGNOS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const ELEMENTO_SIGNO = ['Fogo', 'Terra', 'Ar', 'Água'];
const NAIPE_ELEMENTO = { Fogo: 'Paus', Terra: 'Ouros', Ar: 'Espadas', 'Água': 'Copas' };
const NUMERO_CARTA = ['Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez'];

const pad = (x) => String(x).padStart(2, '0');

/** Tudo que é fixo de um anjo (n = 1…72). */
export function dadosDoAnjo(n) {
  const a = ANJOS[n - 1];
  const coro = COROS[Math.floor((n - 1) / 8)];
  const signoIdx = Math.floor((n - 1) / 6);
  const elemento = ELEMENTO_SIGNO[signoIdx % 4];
  const grauInicio = ((n - 1) % 6) * 5;
  // Golden Dawn: cada decanato é uma carta menor (2 a 10), dois anjos por decanato.
  const decanatoNoSigno = Math.floor(((n - 1) % 6) / 2);
  const numeroCarta = (signoIdx % 3) * 3 + decanatoNoSigno; // 0 → "Dois"
  const minIni = (n - 1) * 20;
  const minFim = n * 20;
  return {
    ...a,
    coro,
    posicaoNoCoro: ((n - 1) % 8) + 1,
    signo: SIGNOS[signoIdx],
    grauInicio,
    grauFim: grauInicio + 5,
    elemento,
    carta: `${NUMERO_CARTA[numeroCarta]} de ${NAIPE_ELEMENTO[elemento]}`,
    hora: `${pad(Math.floor(minIni / 60))}:${pad(minIni % 60)}–${pad(Math.floor(minFim / 60) % 24)}:${pad(minFim % 60)}`,
  };
}

/** Anjo (1–72) do quinário em que está uma longitude eclíptica. */
export function anjoPorLongitude(lon) {
  const l = ((lon % 360) + 360) % 360;
  return Math.min(72, Math.floor(l / 5) + 1);
}

/** Anjo (1–72) de uma hora "HH:MM" (blocos de 20 min a partir da meia-noite). */
export function anjoDaHora(hora) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora || '');
  if (!m) return null;
  const min = Number(m[1]) * 60 + Number(m[2]);
  if (min < 0 || min >= 1440) return null;
  return Math.floor(min / 20) + 1;
}

/**
 * Anjos de uma pessoa.
 * @param {{ data: string, hora?: string|null, tz?: string }} p data "YYYY-MM-DD", hora "HH:MM" do relógio
 */
export function calcularAnjos({ data, hora = null, tz = 'America/Sao_Paulo' }) {
  const [y, m, d] = String(data).split('-').map(Number);
  if (!y || !m || !d) throw new Error('data inválida');
  const temHora = anjoDaHora(hora) != null;

  const sol = (hh, mm) => longitudeSolar(localToUTC({ y, m, d, hh, mm }, tz));
  const inicioDia = anjoPorLongitude(sol(0, 0));
  const fimDia = anjoPorLongitude(sol(23, 59));

  let lon;
  if (temHora) {
    const [hh, mm] = hora.split(':').map(Number);
    lon = sol(hh, mm);
  } else {
    lon = sol(12, 0);
  }
  const guardiao = anjoPorLongitude(lon);
  const dentro = lon % 5; // graus andados dentro do quinário
  // Sol anda ~0,0417°/h: 0,04° ≈ 1h da virada.
  const pertoDaTroca = temHora && (dentro < 0.04 || 5 - dentro < 0.04);
  // Sem hora e com troca no meio do dia: o anjo depende da hora.
  const dependeDaHora = !temHora && inicioDia !== fimDia;
  const alternativo = dependeDaHora ? (guardiao === inicioDia ? fimDia : inicioDia) : null;

  return {
    guardiao,
    mente: temHora ? anjoDaHora(hora) : null,
    longitudeSolar: lon,
    signoSolar: SIGNOS[Math.floor(lon / 30)],
    grauNoSigno: Math.floor(lon % 30),
    pertoDaTroca,
    dependeDaHora,
    alternativo,
    trocaNoDia: dependeDaHora ? { de: inicioDia, para: fimDia } : null,
  };
}

/** Anjo regente de um instante: o do quinário do Sol (dia) e o do bloco de 20 min (hora local). */
export function anjosDoMomento(date = new Date(), tz = 'America/Sao_Paulo') {
  const partes = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(date);
  const hh = partes.find((p) => p.type === 'hour')?.value || '00';
  const mm = partes.find((p) => p.type === 'minute')?.value || '00';
  return {
    dia: anjoPorLongitude(longitudeSolar(date.getTime())),
    hora: anjoDaHora(`${hh}:${mm}`),
    horaLocal: `${hh}:${mm}`,
  };
}

/**
 * Datas aproximadas (dd/mm) em que o Sol passa pelo quinário de cada anjo num
 * ano, olhando o Sol ao meio-dia de Brasília. Variam 1 dia de um ano pro outro.
 * @returns {Array<{ inicio: string, fim: string }>} índice 0 = anjo 1
 */
export function periodosDoAno(ano) {
  const out = Array.from({ length: 72 }, () => ({ inicio: null, fim: null }));
  for (let t = Date.UTC(ano, 0, 1, 15); new Date(t).getUTCFullYear() === ano; t += 86400000) {
    const n = anjoPorLongitude(longitudeSolar(t));
    const dt = new Date(t);
    const s = `${pad(dt.getUTCDate())}/${pad(dt.getUTCMonth() + 1)}`;
    const p = out[n - 1];
    // Mumiah (72) e Vehuiah (1) não atravessam o ano; quem atravessa é quem
    // está no Sol em 01/01 (Capricórnio) — esse começa em dezembro.
    if (!p.inicio) p.inicio = s;
    p.fim = s;
  }
  // Corrige o anjo que atravessa o réveillon: o início real é o de dezembro.
  const n0 = anjoPorLongitude(longitudeSolar(Date.UTC(ano, 0, 1, 15)));
  let inicioDez = null;
  for (let t = Date.UTC(ano, 11, 31, 15); ; t -= 86400000) {
    if (anjoPorLongitude(longitudeSolar(t)) !== n0) break;
    const dt = new Date(t);
    inicioDez = `${pad(dt.getUTCDate())}/${pad(dt.getUTCMonth() + 1)}`;
  }
  if (inicioDez) {
    // o fim em janeiro: último dia de janeiro ainda nesse anjo
    let fimJan = null;
    for (let t = Date.UTC(ano, 0, 1, 15); anjoPorLongitude(longitudeSolar(t)) === n0; t += 86400000) {
      const dt = new Date(t);
      fimJan = `${pad(dt.getUTCDate())}/${pad(dt.getUTCMonth() + 1)}`;
    }
    out[n0 - 1] = { inicio: inicioDez, fim: fimJan };
  }
  return out;
}
