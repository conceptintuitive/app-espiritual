// lib/utmSocial.js — UTMs das redes sociais e o funil por formato. Puro (sem
// window, fetch ou banco): testado em tests/utmSocial.test.js. O servidor que
// usa isto é lib/utmSocialServidor.js; o front, app/components/CapturaAtribuicao.js.
//
// Onde a UTM nasce: no Instagram e no TikTok o único link clicável é o da bio
// (link em legenda e em comentário não abre, e Story publicado pela API não
// aceita figurinha de link). Então a bio aponta pros links curtos /ig e /tt,
// que redirecionam pro site com utm_source=<rede>&utm_medium=bio. O formato
// (Reel interativo, narrado, frase, carrossel…) que trouxe a visita é:
//   - declarado: quando a UTM chega com medium/campaign de um post (ex.: a
//     página de entrada da bio pergunta de qual post a pessoa veio);
//   - provável: visita da bio sem formato declarado conta pro Reel publicado
//     no dia da chegada (pelo social_posts.formato).
//
// Nada aqui identifica a pessoa: utm_* são rótulos de campanha.

export const REDES_UTM = ['instagram', 'tiktok'];
export const MEDIUMS_UTM = ['bio', 'reel', 'story', 'feed', 'comentario'];
export const CAMPANHAS_UTM = ['interativo', 'narrado', 'frase', 'carrossel', 'card', 'dia'];
export const CONTEUDOS_UTM = ['carta', 'pausa', 'numero'];

/** Link curto que vai na bio de cada rede (app/ig/route.js, app/tt/route.js). */
export const CAMINHO_DA_BIO = { instagram: '/ig', tiktok: '/tt' };
/** Pra onde o link da bio leva: a página de entrada (app/comecar). */
export const DESTINO_DA_BIO = '/comecar';

const ROTULO_FORMATO = {
  carta: 'Escolhe uma carta',
  pausa: 'Pausa o vídeo',
  numero: 'Ache seu número',
  narrado: 'narrado',
  frase: 'Frase do dia',
  card: 'card de 9s',
};

/** Formato do Reel (social_posts.formato) → campanha e conteúdo da UTM. */
export function campanhaDoFormato(formato) {
  if (CONTEUDOS_UTM.includes(formato)) return { utm_campaign: 'interativo', utm_content: formato };
  if (formato === 'narrado' || formato === 'frase' || formato === 'card') return { utm_campaign: formato };
  return {};
}

/**
 * UTM de um post publicado pelas automações.
 * @param {{ rede?: string, tipo: 'reels'|'story'|'story_frase'|'feed'|'comentario', formato?: string|null }} p
 */
export function utmDoPost({ rede = 'instagram', tipo, formato = null }) {
  const base = { utm_source: REDES_UTM.includes(rede) ? rede : 'instagram' };
  if (tipo === 'feed') return { ...base, utm_medium: 'feed', utm_campaign: 'carrossel' };
  if (tipo === 'story') return { ...base, utm_medium: 'story', utm_campaign: 'dia' };
  if (tipo === 'story_frase') return { ...base, utm_medium: 'story', utm_campaign: 'frase' };
  if (tipo === 'reels') return { ...base, utm_medium: 'reel', ...campanhaDoFormato(formato) };
  if (tipo === 'comentario') return { ...base, utm_medium: 'comentario', ...campanhaDoFormato(formato) };
  return { ...base, utm_medium: 'bio' };
}

/** Acrescenta a UTM a um link (absoluto ou relativo), sem apagar o que já tem. */
export function comUtm(url, utm) {
  const absoluto = /^https?:\/\//i.test(url);
  const u = new URL(url, 'https://x.invalid');
  for (const [k, v] of Object.entries(utm || {})) if (v) u.searchParams.set(k, v);
  return absoluto ? u.toString() : `${u.pathname}${u.search}${u.hash}`;
}

/** Destino do link curto da bio, já com a UTM. */
export function destinoDaBio(rede) {
  return comUtm(DESTINO_DA_BIO, { utm_source: rede, utm_medium: 'bio' });
}

const limpo = (v, max = 60) => (typeof v === 'string' && v.trim() ? v.trim().toLowerCase().slice(0, max) : null);

/**
 * Visita vinda das redes, pronta pra contar (social_visitas). Só aceita os
 * valores conhecidos: o contador é público, não pode virar depósito de texto.
 * @returns {{ source: string, medium: string|null, campaign: string|null, content: string|null }|null}
 */
export function visitaDasRedes(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;
  const source = limpo(bruto.utm_source);
  if (!REDES_UTM.includes(source)) return null;
  const medium = limpo(bruto.utm_medium);
  const campaign = limpo(bruto.utm_campaign);
  const content = limpo(bruto.utm_content);
  return {
    source,
    medium: MEDIUMS_UTM.includes(medium) ? medium : null,
    campaign: CAMPANHAS_UTM.includes(campaign) ? campaign : null,
    content: CONTEUDOS_UTM.includes(content) ? content : null,
  };
}

/** Id aleatório da visita (gerado no navegador, 1 por sessão): só liga a visita à declaração do formato. */
export const sessaoValida = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/**
 * Formato declarado na página de entrada (a pessoa tocou num post): só vale
 * com medium de post (reel/story/feed/comentario), nunca "bio".
 */
export function declaracaoValida(bruto) {
  const v = visitaDasRedes(bruto);
  if (!v || !v.medium || v.medium === 'bio' || !v.campaign) return null;
  return v;
}

const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

/**
 * A UTM que vai pro perfil do Seu Dia (seu_dia_perfis.atribuicao) quando a
 * pessoa cria a conta ou começa o teste. Só rótulos de campanha e o dia da
 * chegada; nunca client_id, gclid nem nada que identifique.
 * @returns {object|null} null se não veio de campanha nenhuma
 */
export function utmParaPerfil(bruto, agora = new Date()) {
  if (!bruto || typeof bruto !== 'object') return null;
  const out = {};
  for (const k of UTMS) {
    if (typeof bruto[k] === 'string' && bruto[k].trim()) out[k] = bruto[k].trim().slice(0, 150);
  }
  if (!out.utm_source) return null;
  if (typeof bruto.clique_ts === 'number' && Number.isFinite(bruto.clique_ts)) out.clique_ts = bruto.clique_ts;
  out.em = agora.toISOString();
  return out;
}

/** Dia em Brasília (AAAA-MM-DD) de um instante (ms ou ISO). */
export function diaBrasilia(quando) {
  const ms = typeof quando === 'number' ? quando : Date.parse(quando);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms - 3 * 3600000).toISOString().slice(0, 10);
}

/** Dia da chegada pela UTM (clique_ts guardado no aparelho) ou, sem ele, a data de reserva. */
export function diaDaChegada(utm, reserva) {
  return (utm && Number.isFinite(utm.clique_ts) && diaBrasilia(utm.clique_ts)) || diaBrasilia(reserva);
}

/**
 * Linha do funil de uma UTM. Formato declarado (medium de post) = como veio;
 * visita da bio = o Reel publicado no dia da chegada (provável).
 * @param {object} utm  { utm_source, utm_medium, utm_campaign, utm_content } (ou { source, medium, ... })
 * @param {string|null} formatoDoReel  social_posts.formato do Reel daquele dia
 * @returns {{ chave: string, rede: string, rotulo: string, provavel: boolean }|null}
 */
export function linhaDoFunil(utm, formatoDoReel = null) {
  const v = visitaDasRedes({
    utm_source: utm?.utm_source ?? utm?.source,
    utm_medium: utm?.utm_medium ?? utm?.medium,
    utm_campaign: utm?.utm_campaign ?? utm?.campaign,
    utm_content: utm?.utm_content ?? utm?.content,
  });
  if (!v) return null;
  if (v.medium && v.medium !== 'bio') {
    const detalhe = v.content ? ROTULO_FORMATO[v.content] : v.campaign ? (ROTULO_FORMATO[v.campaign] || v.campaign) : null;
    return {
      chave: [v.source, v.medium, v.campaign || '-', v.content || '-'].join('/'),
      rede: v.source,
      rotulo: [v.medium, detalhe].filter(Boolean).join(' · '),
      provavel: false,
    };
  }
  const f = ROTULO_FORMATO[formatoDoReel] ? formatoDoReel : null;
  return {
    chave: [v.source, 'bio', f || 'sem-reel'].join('/'),
    rede: v.source,
    rotulo: f ? `bio · dia de Reel ${ROTULO_FORMATO[f]}` : 'bio · dia sem Reel publicado',
    provavel: true,
  };
}

const ETAPAS = ['visitas', 'quiz', 'teste', 'assinatura', 'manual'];

/**
 * Funil por formato: visitas → quiz → teste grátis → assinatura (+ Manual).
 * Cada lista traz { utm, dia } (dia = chegada em Brasília) e, menos visitas,
 * `pessoa` (e-mail normalizado) pra contar cada pessoa uma vez por linha.
 * @param {{ visitas?: object[], quiz?: object[], teste?: object[], assinatura?: object[], manual?: object[], formatoPorDia?: Record<string,string> }} p
 */
export function funilPorFormato({ formatoPorDia = {}, ...listas }) {
  const linhas = new Map();
  for (const etapa of ETAPAS) {
    for (const item of listas[etapa] || []) {
      const l = linhaDoFunil(item.utm, formatoPorDia[item.dia] ?? null);
      if (!l) continue;
      if (!linhas.has(l.chave)) linhas.set(l.chave, { ...l, ...Object.fromEntries(ETAPAS.map((e) => [e, 0])), pessoas: Object.fromEntries(ETAPAS.map((e) => [e, new Set()])) });
      const g = linhas.get(l.chave);
      if (etapa === 'visitas' || !item.pessoa) g[etapa] += 1;
      else if (!g.pessoas[etapa].has(item.pessoa)) { g.pessoas[etapa].add(item.pessoa); g[etapa] += 1; }
    }
  }
  const lista = [...linhas.values()].map(({ pessoas, ...l }) => l)
    .sort((a, b) => b.visitas - a.visitas || b.quiz - a.quiz || a.chave.localeCompare(b.chave));
  const total = Object.fromEntries(ETAPAS.map((e) => [e, lista.reduce((s, l) => s + l[e], 0)]));
  return { linhas: lista, total };
}

/** "12%" de b sobre a (ou "–" sem base). */
export function taxa(parte, base) {
  if (!base) return '–';
  return `${Math.round((parte / base) * 100)}%`;
}
