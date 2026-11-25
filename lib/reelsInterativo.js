// lib/reelsInterativo.js — o Reels INTERATIVO (a pessoa escolhe, pausa ou
// calcula durante o vídeo e comenta). Puro (sem rede, sem banco), testado em
// tests/reelsInterativo.test.js. Mesma voz (ElevenLabs), mesma legenda palavra
// por palavra e mesma identidade do Reels narrado (lib/reelsRoteiro.js).
//
// Rodízio por dia da semana (Brasília), com o narrado do #158 nos outros dias:
//   seg  numero   "Ache seu número": reduzir o dia de nascimento a 1 dígito
//   ter  carta    "Escolhe uma carta": 3 cartas, contador, revelação
//   qua  pausa    "Pausa o vídeo": 8 práticas passando a 0,4s cada
//   qui  narrado · sex narrado · sáb carta · dom narrado
//
// O texto NÃO passa pela IA: sai das tabelas do site, então nada é inventado.
//   cartas    lib/tarot.js (ARCANOS_MAIORES: nome + 1ª frase do significado),
//             3 diferentes sorteadas pela data (sempre a mesma tiragem no dia)
//   práticas  lib/seuDiaTextos.js (o "Faça" dos 6 temas do Seu Dia)
//   números   lib/manualgenerator.js (NUMERO_PROFUNDO: essência e força)
// Quem chama passa as tabelas (`fontes`), pra este arquivo não importar o
// manualgenerator inteiro.
//
// Um roteiro tem segmentos (cada um vira um áudio do ElevenLabs) separados
// por pausas de silêncio (o contador da carta, a rajada de frases). Cada
// segmento tem partes com id: o tempo da 1ª palavra de cada parte (vindo do
// alinhamento) marca os eventos da animação (virar a carta, acender o número).

import { contarPalavras } from './reelsRoteiro.js';

export const FORMATO_POR_DIA = ['narrado', 'numero', 'carta', 'pausa', 'narrado', 'narrado', 'carta'];
export const FORMATOS_INTERATIVOS = ['carta', 'pausa', 'numero'];
export const NOME_FORMATO = { carta: 'Escolhe uma carta', pausa: 'Pausa o vídeo', numero: 'Ache seu número', narrado: 'Narrado' };

export const CONTADOR_S = 3; // contagem regressiva da carta
export const FLASH_S = 0.4; // cada frase da rajada
export const N_FLASH = 8;
const ENTRADA = 0.5; // céu sozinho antes da 1ª fala
const SAIDA = 1.2; // depois da última palavra

const diaDaSemana = (dataISO) => new Date(`${dataISO}T12:00:00Z`).getUTCDay();
export const formatoDoDia = (dataISO) => FORMATO_POR_DIA[diaDaSemana(dataISO)];

// ── Sorteio determinístico pela data ───────────────────────────────────────
function semente(texto) {
  let h = 2166136261;
  for (const c of String(texto)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}
function aleatorio(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function embaralhar(lista, seed) {
  const r = aleatorio(seed);
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Números por extenso (o que a voz fala) ─────────────────────────────────
const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
export function porExtenso(n) {
  if (n < 20) return UNIDADES[n];
  const dez = { 2: 'vinte', 3: 'trinta' }[Math.floor(n / 10)];
  return n % 10 ? `${dez} e ${UNIDADES[n % 10]}` : dez;
}
const maiuscula = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const ROMANOS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

/** 1ª frase de um texto. */
const primeiraFrase = (t) => String(t || '').split(/(?<=[.!?])\s+/)[0].trim();
/** "autonomia, liderança e impulso de começo" → "autonomia e liderança". */
export function essenciaCurta(essencia) {
  const itens = String(essencia || '').split(/,\s*|\s+e\s+/).map((s) => s.trim()).filter(Boolean);
  return itens.length >= 2 ? `${itens[0]} e ${itens[1]}` : itens[0] || '';
}

// ── Dados de cada formato ──────────────────────────────────────────────────

/** As 3 cartas do dia (diferentes), na ordem 1, 2, 3. */
export function cartasDoDia(dataISO, arcanos) {
  return embaralhar(arcanos, semente(`carta:${dataISO}`)).slice(0, 3).map((c, k) => ({
    posicao: k + 1,
    id: c.id,
    nome: c.nome,
    romano: ROMANOS[c.id] ?? String(c.id),
    palavras: (c.palavrasChave || []).slice(0, 2),
    frase: primeiraFrase(c.significado),
    significado: c.significado,
  }));
}

/** 8 práticas do dia: uma de cada tema do Seu Dia primeiro, depois o resto. */
export function praticasDoDia(dataISO, temasSeuDia, n = N_FLASH) {
  const temas = embaralhar(Object.keys(temasSeuDia).sort(), semente(`pausa:${dataISO}`));
  const porTema = temas.map((t) => embaralhar(temasSeuDia[t].faca || [], semente(`pausa:${dataISO}:${t}`)));
  const out = [];
  for (let rodada = 0; out.length < n && rodada < 5; rodada++) {
    for (const lista of porTema) if (lista[rodada] && out.length < n) out.push(lista[rodada]);
  }
  return out;
}

const EXEMPLOS = [28, 29, 19, 25, 13, 16, 31, 27, 14, 22, 17, 23];
/** Reduz somando os algarismos até sobrar 1 dígito: [[28,10],[10,1]] (passos). */
export function reduzirDia(dia) {
  const passos = [];
  let n = dia;
  while (n > 9) {
    const soma = String(n).split('').reduce((s, d) => s + Number(d), 0);
    passos.push([n, soma]);
    n = soma;
  }
  return { numero: n, passos };
}
export const exemploDoDia = (dataISO) => EXEMPLOS[semente(`numero:${dataISO}`) % EXEMPLOS.length];

/** Os 9 números com a frase curta (essência) e a força (pra resposta do bot). */
export function numerosDoSite(numeroProfundo) {
  return Array.from({ length: 9 }, (_, i) => {
    const t = numeroProfundo[String(i + 1)];
    return { numero: i + 1, curta: essenciaCurta(t.essencia), essencia: t.essencia, forca: t.forca };
  });
}

// ── Roteiros (texto falado + o que aparece na tela) ────────────────────────

const GANCHOS_CARTA = ['Hoje uma dessas três cartas é pra você.', 'Uma dessas três cartas tem o recado de hoje.', 'Uma dessas três cartas fala com você hoje.'];
const GANCHOS_NUMERO = ['Acha o seu número em cinco segundos.', 'Tem um número que é seu desde o dia em que você nasceu.'];

/**
 * Roteiro do formato no dia.
 * @param {{ arcanos: object[], temasSeuDia: object, numeroProfundo: object }} fontes
 * @returns {{ formato, segmentos: Array<{ id, partes: Array<{ id, texto }>, pausaDepois: number }>, cena: object, fechamento: string }}
 */
export function roteiroInterativo(dataISO, formato, fontes) {
  const k = semente(`gancho:${dataISO}`);
  if (formato === 'carta') {
    const cartas = cartasDoDia(dataISO, fontes.arcanos);
    return {
      formato,
      fechamento: 'Comenta o número da sua carta.',
      cena: { cartas: cartas.map(({ posicao, id, nome, romano, palavras }) => ({ posicao, id, nome, romano, palavras })) },
      segmentos: [
        { id: 'escolha', pausaDepois: CONTADOR_S + 0.3, partes: [
          { id: 'gancho', texto: GANCHOS_CARTA[k % GANCHOS_CARTA.length] },
          { id: 'pedido', texto: 'Escolhe uma: um, dois ou três. Vai na primeira que te chamou e guarda o número.' },
        ] },
        { id: 'revelacao', pausaDepois: 0, partes: [
          ...cartas.map((c) => ({ id: `carta${c.posicao}`, texto: `Carta ${porExtenso(c.posicao)}: ${c.nome}. ${c.frase}` })),
          { id: 'fecho', texto: 'Comenta o número da sua carta.' },
        ] },
      ],
      cartas,
    };
  }
  if (formato === 'pausa') {
    const mensagens = praticasDoDia(dataISO, fontes.temasSeuDia);
    return {
      formato,
      fechamento: 'Comenta qual você pegou.',
      cena: { mensagens },
      segmentos: [
        { id: 'aviso', pausaDepois: mensagens.length * FLASH_S + 0.3, partes: [
          { id: 'gancho', texto: `Vou passar ${porExtenso(mensagens.length)} frases bem rápido.` },
          { id: 'pedido', texto: 'Pausa o vídeo na que te chamar. Pausa agora!' },
        ] },
        { id: 'explica', pausaDepois: 0, partes: [
          { id: 'explica', texto: 'Cada frase é uma prática pra hoje, tirada do Seu Dia. A que você pegou é a sua: faz antes de dormir.' },
          { id: 'fecho', texto: 'Comenta qual você pegou.' },
        ] },
      ],
    };
  }
  if (formato === 'numero') {
    const dia = exemploDoDia(dataISO);
    const { numero, passos } = reduzirDia(dia);
    const numeros = numerosDoSite(fontes.numeroProfundo);
    const passoTexto = ([de, soma]) => `${maiuscula(String(de).split('').map((d) => porExtenso(Number(d))).join(' mais '))}, ${porExtenso(soma)}.`;
    return {
      formato,
      fechamento: 'Comenta o seu número.',
      cena: { exemplo: { dia, numero, passos }, numeros: numeros.map(({ numero: n, curta }) => ({ numero: n, curta })) },
      segmentos: [
        { id: 'numero', pausaDepois: 0, partes: [
          { id: 'gancho', texto: GANCHOS_NUMERO[k % GANCHOS_NUMERO.length] },
          { id: 'regra', texto: 'Pega o dia em que você nasceu e soma os algarismos até sobrar um só.' },
          { id: 'ex_dia', texto: `Exemplo: dia ${porExtenso(dia)}.` },
          ...passos.map((p, i) => ({ id: `ex_passo${i + 1}`, texto: passoTexto(p) })),
          { id: 'lista', texto: 'Agora vê o que o seu diz.' },
          ...numeros.map((x) => ({ id: `n${x.numero}`, texto: `${maiuscula(porExtenso(x.numero))}: ${x.curta}.` })),
          { id: 'fecho', texto: 'Comenta o seu número.' },
        ] },
      ],
    };
  }
  throw new Error(`formato interativo desconhecido: ${formato}`);
}

/** Texto falado de um segmento (o que vai pro ElevenLabs). */
export const textoDoSegmento = (seg) => seg.partes.map((p) => p.texto).join(' ');
/** Texto falado do roteiro inteiro (conta de caracteres e de palavras). */
export const textoDoRoteiro = (r) => r.segmentos.map(textoDoSegmento).join(' ');

// ── Linha do tempo (depois da narração) ────────────────────────────────────

/**
 * Junta os segmentos narrados numa linha do tempo só.
 * @param {object} roteiro  roteiroInterativo(...)
 * @param {Array<{ id: string, palavras: Array<{ texto, ini, fim }> }>} narrados  na ordem dos segmentos
 * @returns {{ duracao: number, vozes: Array<{ id, inicio }>, palavras: Array<{ texto, ini, fim }>, marcas: Record<string, number>, eventos: object }}
 */
export function linhaDoTempo(roteiro, narrados) {
  let t = ENTRADA;
  const vozes = [];
  const palavras = [];
  const marcas = {};
  const fins = {};
  roteiro.segmentos.forEach((seg, k) => {
    const n = narrados[k];
    if (!n || n.id !== seg.id || !n.palavras?.length) throw new Error(`faltou a narração do trecho "${seg.id}"`);
    const inicio = Math.round(t * 1000) / 1000;
    vozes.push({ id: seg.id, inicio });
    let indice = 0;
    for (const p of seg.partes) {
      const w = n.palavras[indice];
      if (!w) throw new Error(`a narração do trecho "${seg.id}" tem menos palavras que o texto`);
      marcas[p.id] = Math.round((inicio + w.ini) * 1000) / 1000;
      indice += contarPalavras(p.texto);
    }
    for (const w of n.palavras) palavras.push({ texto: w.texto, ini: Math.round((inicio + w.ini) * 1000) / 1000, fim: Math.round((inicio + w.fim) * 1000) / 1000 });
    const fimFala = inicio + n.palavras[n.palavras.length - 1].fim;
    fins[seg.id] = fimFala;
    t = fimFala + seg.pausaDepois;
  });
  const fimFala = palavras.length ? palavras[palavras.length - 1].fim : t;
  const duracao = Math.ceil((fimFala + SAIDA) * 30) / 30;

  const eventos = {};
  if (roteiro.formato === 'carta') {
    const ini = fins.escolha + 0.15;
    eventos.contador = { ini, fim: ini + CONTADOR_S };
    eventos.revelar = [1, 2, 3].map((p) => marcas[`carta${p}`]);
    // quando a voz diz "um", "dois", "três" no pedido: a carta acende junto
    const limpa = (w) => w.texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    eventos.apontar = ['um', 'dois', 'tres'].map((w) => palavras.find((p) => p.ini >= marcas.pedido && limpa(p) === w)?.ini ?? null);
  } else if (roteiro.formato === 'pausa') {
    eventos.rajada = { ini: fins.aviso + 0.15, passo: FLASH_S, n: roteiro.cena.mensagens.length };
  } else if (roteiro.formato === 'numero') {
    eventos.exemplo = ['ex_dia', ...roteiro.cena.exemplo.passos.map((_, i) => `ex_passo${i + 1}`)].map((id) => marcas[id]);
    eventos.lista = marcas.lista;
    eventos.numeros = Array.from({ length: 9 }, (_, i) => marcas[`n${i + 1}`]);
  }
  return { duracao, vozes, palavras, marcas, eventos };
}

// ── O que a tela mostra no instante t ──────────────────────────────────────

const limita = (x) => Math.min(1, Math.max(0, x));
export const VIRADA_S = 0.6; // a carta gira em 0,6s

/** Ângulo de cada carta (0 = de costas, 180 = de frente) e o contador. */
export function cenaCarta(eventos, t) {
  const angulos = eventos.revelar.map((r) => Math.round(180 * limita((t - r) / VIRADA_S) * 100) / 100);
  const c = eventos.contador;
  const contando = t >= c.ini && t < c.fim;
  return {
    angulos,
    contador: contando ? Math.ceil(c.fim - t) : null, // 3, 2, 1
    progresso: contando ? limita((t - c.ini) / (c.fim - c.ini)) : t >= c.fim ? 1 : 0,
  };
}

/** Frase da rajada no instante t (índice), ou -1 fora dela. */
export function cenaPausa(eventos, t) {
  const r = eventos.rajada;
  if (t < r.ini || t >= r.ini + r.passo * r.n) return -1;
  return Math.min(r.n - 1, Math.floor((t - r.ini) / r.passo));
}

/** Quantos passos do exemplo já apareceram e qual número está aceso (1–9, 0 antes da lista). */
export function cenaNumero(eventos, t) {
  const passosVisiveis = eventos.exemplo.filter((m) => t >= m).length;
  let aceso = 0;
  eventos.numeros.forEach((m, i) => { if (t >= m) aceso = i + 1; });
  return { passosVisiveis, listaVisivel: t >= eventos.lista, aceso };
}

// ── Legenda do post ────────────────────────────────────────────────────────

const LEGENDAS = {
  carta: (r, resp) => ({
    gancho: 'Escolhe uma carta: 1, 2 ou 3.',
    texto: [
      'Vai na primeira que te chamou, antes de pensar. As três cartas de hoje aparecem no fim do vídeo.',
      resp ? 'Comenta o número da sua carta que a gente te responde com o recado dela.' : 'Comenta o número da sua carta.',
    ],
    hashtags: ['#tarot', '#tarotdodia'],
  }),
  pausa: (r, resp) => ({
    gancho: 'Pausa o vídeo na frase que te chamar.',
    texto: [
      `São ${r.cena.mensagens.length} práticas pra hoje, tiradas do Seu Dia. A que você pegou é a sua: faz antes de dormir.`,
      'Comenta qual você pegou.',
    ],
    hashtags: ['#pausaovideo', '#energiadodia'],
  }),
  numero: (r, resp) => {
    const { dia, numero, passos } = r.cena.exemplo;
    const conta = passos.map(([de, soma]) => `${String(de).split('').join(' + ')} = ${soma}`).join(' → ');
    return {
      gancho: 'Acha o seu número em 5 segundos.',
      texto: [
        `Soma os algarismos do dia em que você nasceu até sobrar um só. Exemplo, dia ${dia}: ${conta}. Número ${numero}.`,
        resp ? 'Comenta o seu número que a gente te responde o que ele diz.' : 'Comenta o seu número.',
      ],
      hashtags: ['#numerodevida', '#caminhodevida'],
    };
  },
};

/**
 * Legenda do Reels interativo ({ gancho, texto[], hashtags[] }, o formato de
 * montarLegenda, que junta a chamada do mapa e as hashtags base). `respostas` = o bot de comentários está ligado
 * (SOCIAL_RESPOSTAS): só aí a legenda diz que a gente responde.
 */
export const legendaInterativa = (roteiro, { respostas = false } = {}) => LEGENDAS[roteiro.formato](roteiro, respostas);
