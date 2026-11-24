// lib/adminSessao.js — sessão da área administrativa (/admin/*). SÓ SERVIDOR.
// Entra com o CRON_SECRET (formulário em /admin/tiktok); o cookie guarda só a
// validade e um HMAC dela, nunca o segredo. Vale 12 horas.

import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_ADMIN = 'ic_admin';
const DURACAO_MS = 12 * 3600 * 1000;

const assinar = (exp, segredo) => createHmac('sha256', `admin:${segredo}`).update(String(exp)).digest('hex');

export function criarSessaoAdmin(segredo = process.env.CRON_SECRET, agora = Date.now()) {
  const exp = agora + DURACAO_MS;
  return { valor: `${exp}.${assinar(exp, segredo)}`, maxAge: DURACAO_MS / 1000 };
}

export function sessaoAdminValida(valor, segredo = process.env.CRON_SECRET, agora = Date.now()) {
  if (!segredo || typeof valor !== 'string') return false;
  const [exp, sig] = valor.split('.');
  if (!/^\d+$/.test(exp || '') || Number(exp) < agora || !/^[0-9a-f]{64}$/.test(sig || '')) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(assinar(exp, segredo)));
  } catch {
    return false;
  }
}

/** Compara o segredo digitado com o CRON_SECRET sem vazar tempo. */
export function segredoConfere(digitado, segredo = process.env.CRON_SECRET) {
  if (!segredo || typeof digitado !== 'string') return false;
  const a = createHmac('sha256', 'cmp').update(digitado).digest();
  const b = createHmac('sha256', 'cmp').update(segredo).digest();
  return timingSafeEqual(a, b);
}

/**
 * Regras da tela de Direct Post do TikTok (Content Sharing Guidelines):
 * privacidade escolhida à mão entre as opções do criador, consentimento
 * marcado, conteúdo comercial com pelo menos uma opção, e conteúdo de marca
 * nunca privado. Devolve a lista de problemas (vazia = pode).
 */
export function problemasDaAprovacao(a, criador) {
  const p = [];
  const opcoes = criador?.privacy_level_options || [];
  if (!a.privacy_level) p.push('Escolha quem pode ver o post.');
  else if (opcoes.length && !opcoes.includes(a.privacy_level)) p.push('Essa privacidade não está disponível pra conta.');
  if (a.disable_comment === false && criador?.comment_disabled) p.push('Os comentários estão desligados na conta do TikTok.');
  if (a.divulgacao && !a.brand_organic_toggle && !a.brand_content_toggle) p.push('Conteúdo comercial ligado: marque "Sua marca" e/ou "Conteúdo de marca".');
  if (a.brand_content_toggle && a.privacy_level === 'SELF_ONLY') p.push('Conteúdo de marca não pode ser privado.');
  if (a.consentimento !== true) p.push('Marque a concordância com a Confirmação de Uso de Música do TikTok.');
  if (String(a.titulo || '').length > 90) p.push('Título com mais de 90 caracteres.');
  if (String(a.descricao || '').length > 4000) p.push('Descrição com mais de 4.000 caracteres.');
  return p;
}
