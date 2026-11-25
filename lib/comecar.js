// lib/comecar.js — /comecar, a página do link da bio (/ig e /tt levam pra
// cá). Continua a conversa do post: mostra de novo o Reel interativo do dia
// (as 3 cartas, os números, as 8 práticas), a frase ou o narrado, e a pessoa
// interage aqui mesmo, sem precisar comentar. O post que ela toca vira o
// formato declarado da visita (lib/utmSocial.js). Puro: quem chama passa as
// fontes (tabelas do site e o que o banco disse que saiu). Testado em
// tests/comecar.test.js.

import { cartasDoDia, praticasDoDia, formatoDoReel, numerosDoSite, exemploDoDia } from './reelsInterativo.js';
import { contaDoDia } from './comecarConta.js';

export { contaDoDia };
import { utmDoPost } from './utmSocial.js';

/** Formatos que a página sabe continuar (o card de 9s não tem o que continuar). */
export const FORMATOS_COMECAR = ['carta', 'numero', 'pausa', 'frase', 'narrado'];
/** A partir dessa hora (Brasília) o Story da frase já saiu e vira o 1º bloco. */
export const HORA_STORY_FRASE = 21;
/** Quantos posts a página oferece (o de hoje + os anteriores nos chips). */
export const MAX_POSTS = 4;

export const LINHA_TESTE = 'Grátis, com 7 dias do Seu Dia Completo: seu dia chega por e-mail às 7h. Sem cartão, nada é cobrado depois, e dá pra cancelar o e-mail quando quiser.';

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const somarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const diaDaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** "hoje", "ontem" ou o dia da semana. */
export function quando(data, hoje) {
  if (data === hoje) return 'hoje';
  if (data === somarDias(hoje, -1)) return 'ontem';
  return DIAS[diaDaSemana(data)];
}

const TITULOS = {
  carta: 'Escolhe uma carta',
  numero: 'Ache seu número',
  pausa: 'Pausa o vídeo',
  frase: 'Frase do dia',
  narrado: 'Narrado',
};

/**
 * Os posts que a página oferece, do mais recente pro mais antigo.
 * @param {{ hoje: string, hora: number, publicados?: {data:string, formato:string}[]|null, fraseLigada?: boolean, comRoteiro?: Set<string> }} p
 *   publicados  Reels que saíram (social_posts, últimos dias); null/vazio = sem banco, usa o rodízio
 *   comRoteiro  dias com roteiro do narrado guardado (sem roteiro, o narrado não entra)
 */
export function postsDaEntrada({ hoje, hora, publicados = null, fraseLigada = false, comRoteiro = new Set() }) {
  const ok = (formato, data) => FORMATOS_COMECAR.includes(formato) && (formato !== 'narrado' || comRoteiro.has(data));
  let reels;
  if (publicados && publicados.length) {
    reels = [...publicados].filter((p) => p.data <= hoje && ok(p.formato, p.data))
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  } else {
    // Sem banco: o rodízio, só com o que sai das tabelas (sem narrado)
    reels = [];
    for (let k = 0; k < 7; k++) {
      const data = somarDias(hoje, -k);
      const formato = formatoDoReel(data, { frase: fraseLigada });
      if (formato !== 'narrado') reels.push({ data, formato });
    }
  }
  const lista = reels.map(({ data, formato }) => ({
    chave: `reels-${data}`, tipo: 'reels', data, formato,
    titulo: TITULOS[formato], quando: quando(data, hoje), origem: 'Reel',
  }));
  if (fraseLigada && hora >= HORA_STORY_FRASE) {
    lista.unshift({ chave: `story-${hoje}`, tipo: 'story_frase', data: hoje, formato: 'frase', titulo: TITULOS.frase, quando: 'hoje', origem: 'Story' });
  }
  // Mesmo conteúdo duas vezes (Reel da frase da sexta + Story da frase) = fica o mais recente
  const vistos = new Set();
  return lista.filter((p) => {
    const k = `${p.formato}-${p.formato === 'frase' ? p.data : p.chave}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  }).slice(0, MAX_POSTS);
}

/** A UTM declarada quando a pessoa toca neste post. */
export function utmDoBloco(post, rede = 'instagram') {
  return utmDoPost({ rede, tipo: post.tipo, formato: post.formato });
}

/**
 * O que o bloco mostra, já pronto (vai como prop pro navegador: só os textos
 * daquele post, nunca as tabelas inteiras).
 * @param {object} post  um item de postsDaEntrada
 * @param {{ arcanos, reflexao, temasSeuDia, numeroProfundo, fraseDoDia, creditoDaFrase, roteiros?: Record<string, object> }} f
 */
export function conteudoDoBloco(post, f) {
  const { data, formato } = post;
  if (formato === 'carta') {
    return {
      cartas: cartasDoDia(data, f.arcanos).map((c) => {
        const r = f.reflexao[c.id];
        return { posicao: c.posicao, nome: c.nome, romano: c.romano, palavras: c.palavras, central: r.central, pratica: r.pratica, pergunta: r.perguntas[(c.posicao - 1) % r.perguntas.length] };
      }),
    };
  }
  if (formato === 'numero') {
    const dia = exemploDoDia(data);
    return {
      exemplo: { dia, ...contaDoDia(dia) },
      numeros: numerosDoSite(f.numeroProfundo).map(({ numero, curta }) => ({ numero, curta, forca: f.numeroProfundo[numero].forca })),
    };
  }
  if (formato === 'pausa') return { praticas: praticasDoDia(data, f.temasSeuDia) };
  if (formato === 'frase') {
    const fr = f.fraseDoDia(data);
    return fr ? { frase: fr.frase, credito: f.creditoDaFrase(fr), hoje: fr.hoje } : null;
  }
  if (formato === 'narrado') {
    const r = f.roteiros?.[data];
    return r?.gancho && r?.pratica ? { gancho: r.gancho, porque: r.porque, virada: r.virada, pratica: r.pratica } : null;
  }
  return null;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Linha do topo: "Quarta, 26 de novembro · Lua Crescente em Peixes". */
export function linhaDoDia(data, lua = null) {
  const [, m, d] = data.split('-').map(Number);
  const dia = DIAS[diaDaSemana(data)];
  const fase = lua?.fase ? (/^lua /i.test(lua.fase) ? lua.fase : `Lua ${lua.fase}`) : null; // luaDoDia já diz "Lua Cheia"
  const textoLua = fase ? ` · ${fase}${lua.signo ? ` em ${lua.signo}` : ''}` : '';
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${d} de ${MESES[m - 1]}${textoLua}`;
}
