// lib/instagram.js — publicação no Instagram. SÓ SERVIDOR. Usado por
// app/api/cron/social (conteúdo diário, lib/social.js) e pela rota de teste
// app/api/social/instagram-teste.
//
// Dois caminhos, escolhidos por modoInstagram():
//   'facebook'  → graph.facebook.com, token de usuário do sistema (SUAT) do
//                 "Instagram API with unified login" (Business Manager). Esse
//                 token NÃO expira: nada de renovar nem de guardar no banco.
//   'instagram' → graph.instagram.com, token do "Instagram API with Instagram
//                 login" (60 dias), renovado sozinho como abaixo.
// INSTAGRAM_API_HOST=facebook|instagram força o caminho; sem ela, vale o
// formato do token (os da Meta/Facebook começam com "EAA", os do login do
// Instagram com "IG"). Nos dois, as chamadas usam INSTAGRAM_USER_ID (o id da
// conta profissional, 1784…).
//
// Fluxo da Content Publishing API:
//   1) POST /{ig-user-id}/media           → container (image_url + caption,
//      ou media_type=STORIES pro story). A imagem precisa ser JPEG numa URL
//      pública: o Instagram baixa de /api/social/imagem/... (assinada).
//   2) GET  /{container}?fields=status_code → espera FINISHED
//   3) POST /{ig-user-id}/media_publish     → id do post
//
// Token (caminho 'instagram'): INSTAGRAM_ACCESS_TOKEN (longa duração, 60
// dias) + INSTAGRAM_USER_ID. Renovação sozinha: todo dia o cron confere a validade; faltando menos de
// 20 dias (ou sem data conhecida), troca por um novo em
// /refresh_access_token e guarda em social_tokens (migração 0024). Quando
// você gera um token novo e troca a variável, o do banco é descartado (ele
// guarda o hash do token da variável que o originou).
//
// Referência: https://developers.facebook.com/docs/instagram-platform/content-publishing/

import { createHash } from 'node:crypto';

export const IG_HOST = 'https://graph.instagram.com';
export const FB_HOST = 'https://graph.facebook.com';
export const versaoApi = () => process.env.INSTAGRAM_API_VERSION || 'v24.0';

/**
 * 'facebook' (graph.facebook.com, token SUAT que não expira) ou 'instagram'
 * (graph.instagram.com, token de 60 dias). INSTAGRAM_API_HOST manda; sem ela,
 * o prefixo do token decide (EAA… = Facebook). Na dúvida, o caminho antigo.
 */
export function modoInstagram(token = process.env.INSTAGRAM_ACCESS_TOKEN, host = process.env.INSTAGRAM_API_HOST) {
  const h = String(host || '').trim().toLowerCase();
  if (h === 'facebook' || h.includes('graph.facebook.com')) return 'facebook';
  if (h === 'instagram' || h.includes('graph.instagram.com')) return 'instagram';
  return String(token || '').trim().startsWith('EAA') ? 'facebook' : 'instagram';
}

/** Base das chamadas com versão: https://graph.facebook.com/v24.0 */
export const baseApi = (modo) => `${modo === 'facebook' ? FB_HOST : IG_HOST}/${versaoApi()}`;

const DIA = 86400000;
export const RENOVAR_FALTANDO_DIAS = 20;

/** Precisa renovar? Sem data conhecida = sim. No máximo 1 tentativa a cada 20h. */
export function precisaRenovar({ expiraEm, tentouEm }, agora = Date.now()) {
  const tentou = tentouEm ? Date.parse(tentouEm) : NaN;
  if (!Number.isNaN(tentou) && agora - tentou < 20 * 3600000) return false;
  const expira = expiraEm ? Date.parse(expiraEm) : NaN;
  if (Number.isNaN(expira)) return true;
  return expira - agora < RENOVAR_FALTANDO_DIAS * DIA;
}

export const hashToken = (t) => createHash('sha256').update(String(t)).digest('hex').slice(0, 16);

async function igFetch(url, { method = 'GET', params = {} } = {}) {
  const corpo = new URLSearchParams(params);
  let res;
  try {
    res = method === 'GET'
      ? await fetch(`${url}${url.includes('?') ? '&' : '?'}${corpo.toString()}`)
      : await fetch(url, { method, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corpo.toString() });
  } catch (err) {
    // Rede: sem resposta da Meta (DNS, timeout…). Nunca põe a URL (tem o token).
    throw new Error(`Instagram: sem resposta de ${new URL(url).host} (${err.cause?.code || err.message})`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`Instagram: ${e.message || `HTTP ${res.status}`}${e.code ? ` (código ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''})` : ''}`);
  }
  return json;
}

/**
 * Token válido do Instagram. Usa o do banco se ele veio da variável atual;
 * renova quando falta pouco (best effort: se a renovação falhar, segue com
 * o token que tem e devolve o erro em `aviso`).
 */
export async function tokenInstagram(supabase, agora = Date.now()) {
  const doEnv = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!doEnv) throw new Error('INSTAGRAM_ACCESS_TOKEN não configurado');
  // Token de usuário do sistema (graph.facebook.com) não expira: usa direto,
  // sem renovar e sem social_tokens.
  if (modoInstagram(doEnv) === 'facebook') return { token: doEnv, modo: 'facebook' };
  const envHash = hashToken(doEnv);

  let linha = null;
  let semTabela = false;
  const { data, error } = await supabase.from('social_tokens').select('*').eq('rede', 'instagram').maybeSingle();
  if (error) semTabela = true;
  else linha = data;

  const doBanco = linha && linha.env_hash === envHash && linha.access_token;
  let token = doBanco ? linha.access_token : doEnv;
  const estado = { expiraEm: doBanco ? linha.expires_at : null, tentouEm: doBanco ? linha.tentou_em : null };
  if (semTabela) return { token, modo: 'instagram', aviso: 'Tabela social_tokens não existe (rode a migração 0024): o token não é renovado sozinho.' };
  if (!precisaRenovar(estado, agora)) return { token, modo: 'instagram' };

  const quando = new Date(agora).toISOString();
  try {
    const r = await igFetch(`${IG_HOST}/refresh_access_token`, { params: { grant_type: 'ig_refresh_token', access_token: token } });
    token = r.access_token || token;
    await supabase.from('social_tokens').upsert({
      rede: 'instagram',
      access_token: token,
      expires_at: r.expires_in ? new Date(agora + r.expires_in * 1000).toISOString() : null,
      env_hash: envHash,
      renovado_em: quando,
      tentou_em: quando,
      ultimo_erro: null,
      updated_at: quando,
    }, { onConflict: 'rede' });
    return { token, modo: 'instagram', renovado: true };
  } catch (err) {
    await supabase.from('social_tokens').upsert({
      rede: 'instagram',
      access_token: token,
      expires_at: estado.expiraEm,
      env_hash: envHash,
      tentou_em: quando,
      ultimo_erro: err.message.slice(0, 500),
      updated_at: quando,
    }, { onConflict: 'rede' });
    // Token com menos de 24h não renova (regra do Instagram): não é erro de verdade.
    return { token, modo: 'instagram', aviso: `Não renovou o token do Instagram: ${err.message}` };
  }
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Publica uma imagem. tipo 'story' (sem legenda) ou 'feed' (com legenda).
 * @returns {Promise<{ id: string, container: string }>}
 */
export async function publicarNoInstagram({ token, tipo, imageUrl, legenda = '', modo = modoInstagram(token) }) {
  const igId = process.env.INSTAGRAM_USER_ID;
  if (!igId) throw new Error('INSTAGRAM_USER_ID não configurado');
  const base = baseApi(modo);

  const params = { image_url: imageUrl, access_token: token };
  if (tipo === 'story') params.media_type = 'STORIES';
  else params.caption = legenda;
  const { id: container } = await igFetch(`${base}/${igId}/media`, { method: 'POST', params });

  // Imagem costuma ficar pronta em poucos segundos; espera até ~40s.
  let status = 'IN_PROGRESS';
  for (let i = 0; i < 20 && status !== 'FINISHED'; i++) {
    if (i) await espera(2000);
    const r = await igFetch(`${base}/${container}`, { params: { fields: 'status_code', access_token: token } });
    status = r.status_code;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Instagram: container ${status}`);
  }
  if (status !== 'FINISHED') throw new Error('Instagram: a imagem não ficou pronta em 40s');

  const { id } = await igFetch(`${base}/${igId}/media_publish`, { method: 'POST', params: { creation_id: container, access_token: token } });
  return { id, container };
}

/**
 * Conferência do token, sem postar: GET /{ig-user-id}?fields=username no host
 * do modo atual. Usada pela rota app/api/social/instagram-teste.
 */
export async function conferirContaInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igId = process.env.INSTAGRAM_USER_ID;
  const modo = modoInstagram(token);
  const info = { modo, host: modo === 'facebook' ? FB_HOST : IG_HOST, versao: versaoApi(), user_id: igId || null, renova_sozinho: modo === 'instagram' };
  if (!token) return { ok: false, ...info, erro: 'INSTAGRAM_ACCESS_TOKEN não configurado' };
  if (!igId) return { ok: false, ...info, erro: 'INSTAGRAM_USER_ID não configurado' };
  try {
    const r = await igFetch(`${baseApi(modo)}/${igId}`, { params: { fields: 'username', access_token: token } });
    return { ok: true, ...info, resultado: r };
  } catch (err) {
    return { ok: false, ...info, erro: err.message };
  }
}
