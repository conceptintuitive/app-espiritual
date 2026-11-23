// lib/seuDiaServidor.js — SÓ SERVIDOR (usa node:crypto e a service role).
//
// Login do Seu Dia sem Supabase Auth: a pessoa digita o e-mail, recebe um
// link com um token assinado (HMAC, vale 30 min) e, ao abrir, ganha um cookie
// de sessão também assinado (vale 180 dias). Nada de senha, nada de tabela de
// sessões. O segredo é SEU_DIA_SECRET; sem ela, derivamos uma chave da
// SUPABASE_SERVICE_ROLE_KEY (que já é secreta), então funciona sem env nova.

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { FUSOS_BR } from './fusoBR.js';
import { mapaDoPerfil } from './minhaArea.js';
import { fimDoTeste, diasRestantes } from './testeSeuDia.js';

export const COOKIE_SESSAO = 'ic_sd';
const LOGIN_MS = 30 * 60 * 1000;
const SESSAO_DIAS = 180;
export const TESTE_DIAS = 7;

export const OPCOES_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSAO_DIAS * 86400,
};

function chave() {
  const base = process.env.SEU_DIA_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error('SEU_DIA_SECRET/SUPABASE_SERVICE_ROLE_KEY ausente');
  return crypto.createHmac('sha256', base).update('intuitive-concept/seu-dia/v1').digest();
}

function assinar(payload) {
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', chave()).update(corpo).digest('base64url');
  return `${corpo}.${sig}`;
}

function verificar(token, tipo) {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const [corpo, sig] = token.split('.');
  if (!corpo || !sig) return null;
  let esperado;
  try {
    esperado = crypto.createHmac('sha256', chave()).update(corpo).digest('base64url');
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'));
    if (p.k !== tipo || typeof p.e !== 'string' || !(p.x > Date.now())) return null;
    return p;
  } catch {
    return null;
  }
}

export const tokenLogin = (email) => assinar({ e: email, k: 'login', x: Date.now() + LOGIN_MS });
export const tokenSessao = (email) => assinar({ e: email, k: 'sessao', x: Date.now() + SESSAO_DIAS * 86400 * 1000 });
export const emailDoTokenLogin = (t) => verificar(t, 'login')?.e || null;

/** Token assinado de uso geral (ex.: link de renovação da assinatura no e-mail). */
export const tokenEmail = (email, tipo, validadeMs) => assinar({ e: email, k: tipo, x: Date.now() + validadeMs });
export const emailDoToken = (t, tipo) => verificar(t, tipo)?.e || null;
// Descadastro dos e-mails do Seu Dia (link em todo e-mail; /api/unsubscribe?sd=…).
// Vale 10 anos: um e-mail antigo tem que continuar descadastrando.
export const tokenDescadastro = (email) => tokenEmail(email, 'descadastro', 10 * 365 * 86400 * 1000);
export const emailDoDescadastro = (t) => emailDoToken(t, 'descadastro');

// ── Código de 6 dígitos (login da Minha Área) ────────────────────────────────
export const CODIGO_MS = 15 * 60 * 1000;
export const CODIGO_MAX_TENTATIVAS = 5;

export function gerarCodigo() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

/** HMAC do código ligado ao e-mail: o banco nunca guarda o código em si. */
export function hashCodigo(email, codigo) {
  return crypto.createHmac('sha256', chave()).update(`codigo:${email}:${codigo}`).digest('base64url');
}

/**
 * Decide se um código digitado vale. Puro (testável).
 * @param {{ codigo_hash?: string|null, codigo_expira?: string|null, codigo_tentativas?: number }|null} row
 * @returns {'ok'|'sem'|'vencido'|'bloqueado'|'errado'}
 */
export function checarCodigo(row, email, codigo, agora = Date.now()) {
  if (!row?.codigo_hash || !row.codigo_expira) return 'sem';
  if (new Date(row.codigo_expira).getTime() <= agora) return 'vencido';
  if ((row.codigo_tentativas || 0) >= CODIGO_MAX_TENTATIVAS) return 'bloqueado';
  if (!/^\d{6}$/.test(String(codigo || ''))) return 'errado';
  const a = Buffer.from(hashCodigo(email, String(codigo)));
  const b = Buffer.from(row.codigo_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? 'ok' : 'errado';
}

/** E-mail da sessão (cookie) de uma Request, ou null. */
export function emailDaSessao(request) {
  return verificar(request.cookies.get(COOKIE_SESSAO)?.value, 'sessao')?.e || null;
}

export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('ENV do Supabase ausente');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Validação dos dados de nascimento ────────────────────────────────────────

/** Devolve os dados limpos ou { erro }. */
export function validarDados(body) {
  const nome = String(body?.nome ?? '').trim().slice(0, 60) || null;
  const data = String(body?.dataNascimento ?? '');
  const ano = Number(data.slice(0, 4));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || ano < 1900 || ano > new Date().getFullYear() || Number.isNaN(Date.parse(data))) {
    return { erro: 'Confira a data de nascimento.' };
  }
  const hora = body?.hora == null || body.hora === '' ? null : String(body.hora);
  if (hora !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return { erro: 'Confira a hora de nascimento.' };

  let cidade = null;
  const c = body?.cidade;
  if (c) {
    const ibge = Number(c.ibge);
    const lat = Number(c.lat);
    const lon = Number(c.lon);
    const ok = Number.isInteger(ibge) && ibge >= 1100000 && ibge <= 5399999
      && lat >= -34 && lat <= 5.5 && lon >= -74.5 && lon <= -28.5
      && FUSOS_BR.has(c.tz);
    if (!ok) return { erro: 'Escolha a cidade na lista.' };
    cidade = { ibge, lat, lon, tz: c.tz, nome: String(c.nome || '').slice(0, 80), uf: String(c.uf || '').slice(0, 2) };
  }
  return { nome, dataNascimento: data, hora, cidade };
}

// ── Perfil pro front ─────────────────────────────────────────────────────────

/** E-mail como padrão de ILIKE exato: escapa % e _ (senão "a_b@x" casaria "axb@x"). */
export function emailExato(email) {
  return email.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const COLUNAS = 'email, nome, data_nascimento, hora_nascimento, cidade_nome, cidade_uf, municipio_ibge, latitude, longitude, fuso_iana, teste_inicio, lista_espera_plano';

/**
 * Monta o perfil que o front usa: dados de nascimento, nível de acesso e,
 * se ainda não tem dados, uma sugestão vinda da última análise do quiz.
 */
// Consulta separada (best effort): sem a migração 0021 a coluna não existe e o
// perfil tem que carregar igual. undefined = coluna ausente/erro.
async function lerConfirmacao(sb, email) {
  try {
    const { data, error } = await sb.from('seu_dia_perfis').select('perfil_confirmado_em').eq('email', email).maybeSingle();
    if (error) return undefined;
    return data?.perfil_confirmado_em || null;
  } catch {
    return undefined;
  }
}

// Preferência do e-mail das 7h (migração 0022, best effort). undefined = coluna ausente.
async function lerEmailDiario(sb, email) {
  try {
    const { data, error } = await sb.from('seu_dia_perfis').select('email_diario').eq('email', email).maybeSingle();
    if (error) return undefined;
    return data ? data.email_diario !== false : true;
  } catch {
    return undefined;
  }
}

/** Grava a preferência do e-mail das 7h (best effort: sem a 0022, devolve false). */
export async function gravarEmailDiario(sb, email, quer) {
  try {
    const { error } = await sb.from('seu_dia_perfis').update({ email_diario: !!quer }).eq('email', email);
    return !error;
  } catch {
    return false;
  }
}

/** Marca o perfil como confirmado agora (best effort: sem a 0021, devolve false). */
export async function marcarConfirmado(sb, email) {
  try {
    const { error } = await sb.from('seu_dia_perfis').update({ perfil_confirmado_em: new Date().toISOString() }).eq('email', email);
    return !error;
  } catch {
    return false;
  }
}

export async function perfilParaFront(sb, email) {
  const [{ data: row }, confirmadoEm, emailDiario] = await Promise.all([
    sb.from('seu_dia_perfis').select(COLUNAS).eq('email', email).maybeSingle(),
    lerConfirmacao(sb, email),
    lerEmailDiario(sb, email),
  ]);

  // Assinatura Intuitive Completo (ou o 1º mês por conta do Manual). Import
  // dinâmico: lib/assinatura.js também importa daqui (ciclo resolvido em runtime).
  const { acessoPorEmail } = await import('./assinatura.js');
  const assinatura = await acessoPorEmail(sb, email);

  const temDados = !!row?.data_nascimento;
  let sugestao = null;
  if (!temDados) {
    const { data: a } = await sb
      .from('analises')
      .select('nome, data_nascimento, hora_nascimento, latitude, longitude')
      .ilike('email', emailExato(email))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (a?.data_nascimento) {
      sugestao = {
        nome: String(a.nome || '').trim().split(/\s+/)[0] || '',
        dataNascimento: a.data_nascimento,
        hora: a.hora_nascimento || null,
      };
    }
  }

  // Mapa da própria pessoa neste e-mail: decide o botão dos cadeados
  // ("Desbloquear com o Manual" → /resultado/<id>, ou "Fazer meu mapa grátis").
  let mapa = null;
  if (temDados) {
    try {
      const { data: rows } = await sb
        .from('analises')
        .select('id, nome, data_nascimento, payment_status, created_at')
        .ilike('email', emailExato(email))
        .order('created_at', { ascending: false })
        .limit(20);
      mapa = mapaDoPerfil(rows || [], { dataNascimento: row.data_nascimento, nome: row.nome });
    } catch {}
  }

  // Teste de 7 dias do Completo (de volta em nov/2026): começa no 1º
  // salvamento e vale até o fim do 7º dia no relógio de Brasília
  // (lib/testeSeuDia.js). No dia 8 voltam os cadeados.
  const testeAte = fimDoTeste(row?.teste_inicio || null);
  const emTeste = !!testeAte && Date.now() < testeAte;
  const acesso = assinatura.ativa || emTeste ? 'completo' : 'resumo';

  return {
    email,
    nome: row?.nome || null,
    dataNascimento: row?.data_nascimento || null,
    hora: row?.hora_nascimento || null,
    cidade: row?.municipio_ibge
      ? { ibge: row.municipio_ibge, nome: row.cidade_nome, uf: row.cidade_uf, lat: row.latitude, lon: row.longitude, tz: row.fuso_iana }
      : null,
    precisaDados: !temDados,
    // "Esta é você?": data da confirmação; null = não confirmou ainda;
    // undefined (campo ausente) = migração 0021 não rodou (o front usa o aparelho).
    ...(confirmadoEm === undefined ? {} : { confirmadoEm }),
    sugestao,
    acesso,
    motivoAcesso: assinatura.ativa ? assinatura.origem : emTeste ? 'teste' : null,
    assinatura: assinatura.ativa
      ? { plano: assinatura.plano, acessoAte: assinatura.acessoAte, renovaSozinha: assinatura.renovaSozinha, origem: assinatura.origem }
      : null,
    testeAte: testeAte ? new Date(testeAte).toISOString() : null,
    // Dias que faltam DEPOIS de hoje (0 = último dia); null fora do teste.
    testeDiasRestantes: emTeste ? diasRestantes(row.teste_inicio) : null,
    ...(emailDiario === undefined ? {} : { emailDiario }),
    listaEspera: row?.lista_espera_plano || null,
    mapa,
    pushPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
  };
}
