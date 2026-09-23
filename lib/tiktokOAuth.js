// lib/tiktokOAuth.js
// OAuth do TikTok Login Kit (API v2) — fluxo separado do TIKTOK_ACCESS_TOKEN
// usado em lib/tiktok.js (esse é um token estático da Events API, gerado
// manualmente no TikTok Ads Manager; este arquivo lida com um token obtido
// via login OAuth de uma conta/usuário TikTok, com refresh automático).
//
// Nunca importe este arquivo de um Client Component — ele lê client_secret
// via variável de ambiente do servidor e nunca deve chegar ao navegador.
import { createClient } from "@supabase/supabase-js";

export const TIKTOK_OAUTH_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_OAUTH_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

// Escopos padrão — ajuste conforme o que o app está aprovado a usar no
// TikTok for Developers. Pode ser sobrescrito via env sem redeploy de código.
const DEFAULT_SCOPES = "user.info.basic";

// Precisa bater EXATAMENTE com o Redirect URI cadastrado no app do TikTok
// for Developers. Fixo no domínio de produção por padrão; TIKTOK_OAUTH_REDIRECT_URI
// só existe pra permitir trocar sem novo deploy, se um dia for preciso.
export function getRedirectUri() {
  return process.env.TIKTOK_OAUTH_REDIRECT_URI || "https://intuitiveconcept.com.br/api/tiktok/callback";
}

export function getScopes() {
  return process.env.TIKTOK_OAUTH_SCOPES || DEFAULT_SCOPES;
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function buildAuthorizeUrl(state) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) throw new Error("TIKTOK_CLIENT_KEY ausente");

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: getScopes(),
    redirect_uri: getRedirectUri(),
    state,
  });
  return `${TIKTOK_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

// Troca o authorization code (recebido em /api/tiktok/callback) pelo
// primeiro par access_token/refresh_token.
export async function exchangeCodeForTokens(code) {
  return postTokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
  });
}

// Troca um refresh_token válido por um novo access_token (e, em geral, um
// novo refresh_token — o TikTok rotaciona o refresh_token a cada uso).
export async function refreshTokens(refreshToken) {
  return postTokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function postTokenRequest(extraParams) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TIKTOK_CLIENT_KEY ou TIKTOK_CLIENT_SECRET ausentes");
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    ...extraParams,
  });

  const res = await fetch(TIKTOK_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: body.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    const detail = data.error_description || data.error || `HTTP ${res.status}`;
    throw new Error(`Falha ao trocar token com o TikTok: ${detail}`);
  }

  return data; // { access_token, expires_in, refresh_token, refresh_expires_in, open_id, scope, token_type }
}

// Salva/atualiza os tokens no Supabase. Uma linha por open_id — na prática,
// como é a conta TikTok de um único negócio, deve existir sempre uma linha só.
export async function saveTokens(tokenData) {
  const supabase = getSupabaseAdmin();
  const now = Date.now();

  const row = {
    open_id: tokenData.open_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    scope: tokenData.scope || null,
    token_type: tokenData.token_type || null,
    expires_at: new Date(now + (tokenData.expires_in ?? 0) * 1000).toISOString(),
    refresh_expires_at: tokenData.refresh_expires_in
      ? new Date(now + tokenData.refresh_expires_in * 1000).toISOString()
      : null,
    updated_at: new Date(now).toISOString(),
  };

  const { error } = await supabase
    .from("tiktok_oauth_tokens")
    .upsert(row, { onConflict: "open_id" });

  if (error) throw new Error(`Erro ao salvar tokens do TikTok no Supabase: ${error.message}`);
  return row;
}

// Busca a linha de token mais recente (assume uma única conta conectada).
export async function getStoredTokens() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tiktok_oauth_tokens")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Erro ao ler tokens do TikTok no Supabase: ${error.message}`);
  return data || null;
}

// Ponto único de acesso a um access_token válido: se estiver perto de
// expirar (ou já expirado), renova via refresh_token e persiste o resultado
// antes de devolver. Qualquer código futuro que precise chamar uma API do
// TikTok em nome da conta conectada deve passar por esta função em vez de
// ler o token direto do banco.
const RENOVAR_SE_FALTAR_MENOS_DE_MS = 5 * 60 * 1000; // 5 minutos de margem

export async function getValidAccessToken() {
  const stored = await getStoredTokens();
  if (!stored) {
    throw new Error("Nenhuma conta TikTok conectada ainda — acesse /api/tiktok/connect primeiro.");
  }

  const expiresAt = new Date(stored.expires_at).getTime();
  const precisaRenovar = Number.isNaN(expiresAt) || expiresAt - Date.now() < RENOVAR_SE_FALTAR_MENOS_DE_MS;

  if (!precisaRenovar) {
    return stored.access_token;
  }

  if (stored.refresh_expires_at) {
    const refreshExpiresAt = new Date(stored.refresh_expires_at).getTime();
    if (!Number.isNaN(refreshExpiresAt) && refreshExpiresAt <= Date.now()) {
      throw new Error("O refresh_token do TikTok expirou — é preciso reconectar via /api/tiktok/connect.");
    }
  }

  const refreshed = await refreshTokens(stored.refresh_token);
  // O open_id não vem sempre no retorno do refresh — mantém o já salvo.
  const saved = await saveTokens({ open_id: stored.open_id, ...refreshed });
  return saved.access_token;
}
