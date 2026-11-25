// lib/utmSocialServidor.js — só servidor. Contador de visitas das redes
// (social_visitas), UTM no perfil do Seu Dia e o funil por formato da prévia.
// Migração 0031_utm_social.sql; sem ela, cada parte desliga sozinha (best effort).
// Regras puras em lib/utmSocial.js.

import { visitaDasRedes, utmParaPerfil, diaBrasilia, diaDaChegada, funilPorFormato, REDES_UTM } from './utmSocial.js';
import { isTestEmail } from './testEmails.js';

const somarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const FILTRO_REDES = `(${REDES_UTM.join(',')})`;
const emailNorm = (e) => String(e || '').trim().toLowerCase();

/** Conta uma visita vinda das redes. Nada que identifique a pessoa. */
export async function registrarVisita(supabase, bruto, agora = Date.now()) {
  const v = visitaDasRedes(bruto);
  if (!v || !supabase) return { ok: false, motivo: 'fora das redes' };
  const { error } = await supabase.from('social_visitas').insert({ dia: diaBrasilia(agora), ...v });
  if (error) return { ok: false, motivo: error.message };
  return { ok: true };
}

/**
 * Grava a UTM no perfil do Seu Dia, só se ainda não tem (a 1ª conta: criar a
 * conta ou começar o teste). Best effort, nunca lança.
 */
export async function gravarUtmNoPerfil(supabase, email, bruto, agora = new Date()) {
  const atribuicao = utmParaPerfil(bruto, agora);
  if (!supabase || !email || !atribuicao) return { ok: false, motivo: 'sem utm' };
  try {
    const { error } = await supabase.from('seu_dia_perfis').update({ atribuicao })
      .eq('email', emailNorm(email)).is('atribuicao', null);
    if (error) return { ok: false, motivo: `${error.message} (migração 0031?)` };
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: String(e?.message || e) };
  }
}

/**
 * Funil das redes por formato, pela chegada nos últimos `dias` dias:
 * visitas (social_visitas) → quiz (analises.atribuicao) → teste grátis
 * (seu_dia_perfis.atribuicao + teste_inicio) → assinatura paga (assinaturas
 * com acesso_ate, do mesmo e-mail) e Manual pago. Cada etapa que falhar vira
 * um aviso, sem derrubar as outras.
 */
export async function funilSocial({ supabase, dias = 56, hoje = diaBrasilia(Date.now()), limite = 5000 }) {
  const desde = somarDias(hoje, -dias);
  const desdeIso = `${desde}T03:00:00Z`;
  const avisos = [];
  const listas = { visitas: [], quiz: [], teste: [], assinatura: [], manual: [] };
  const dentro = (dia) => dia && dia >= desde;

  // Reel publicado em cada dia (pra visita da bio sem formato declarado)
  const formatoPorDia = {};
  {
    const { data, error } = await supabase.from('social_posts').select('data, formato')
      .eq('rede', 'instagram').eq('tipo', 'reels').eq('status', 'ok').gte('data', desde);
    if (error) avisos.push(`Reel de cada dia: ${error.message}`);
    for (const p of data || []) if (p.formato) formatoPorDia[p.data] = p.formato;
  }

  {
    const { data, error } = await supabase.from('social_visitas').select('dia, source, medium, campaign, content')
      .gte('dia', desde).limit(limite * 4);
    if (error) avisos.push(`Visitas: ${error.message} (migração 0031?)`);
    for (const v of data || []) listas.visitas.push({ utm: v, dia: v.dia });
  }

  // e-mail → a UTM mais antiga das redes (perfil manda; sem perfil, a análise)
  const utmDoEmail = new Map();
  const guardar = (email, utm, dia) => {
    const e = emailNorm(email);
    const atual = utmDoEmail.get(e);
    if (!atual || dia < atual.dia) utmDoEmail.set(e, { utm, dia });
  };

  {
    const { data, error } = await supabase.from('analises').select('email, created_at, payment_status, origem, atribuicao')
      .gte('created_at', desdeIso).filter('atribuicao->>utm_source', 'in', FILTRO_REDES).limit(limite);
    if (error) avisos.push(`Quiz: ${error.message}`);
    for (const a of data || []) {
      const dia = diaDaChegada(a.atribuicao, a.created_at);
      if (!dentro(dia) || a.origem === 'teste' || isTestEmail(a.email)) continue; // testes da casa fora
      const item = { utm: a.atribuicao, dia, pessoa: emailNorm(a.email) };
      listas.quiz.push(item);
      if (a.payment_status === 'paid') listas.manual.push(item);
      guardar(a.email, a.atribuicao, dia);
    }
  }

  const doPerfil = new Set();
  {
    const { data, error } = await supabase.from('seu_dia_perfis').select('email, teste_inicio, atribuicao')
      .filter('atribuicao->>utm_source', 'in', FILTRO_REDES).limit(limite);
    if (error) avisos.push(`Teste grátis: ${error.message} (migração 0031?)`);
    for (const p of data || []) {
      const dia = diaDaChegada(p.atribuicao, p.atribuicao?.em || p.teste_inicio);
      if (!dentro(dia) || isTestEmail(p.email)) continue;
      const e = emailNorm(p.email);
      if (p.teste_inicio) listas.teste.push({ utm: p.atribuicao, dia, pessoa: e });
      utmDoEmail.set(e, { utm: p.atribuicao, dia });
      doPerfil.add(e);
    }
  }

  const emails = [...utmDoEmail.keys()];
  for (let i = 0; i < emails.length; i += 200) {
    const { data, error } = await supabase.from('assinaturas').select('email, acesso_ate, criado_em')
      .in('email', emails.slice(i, i + 200)).not('acesso_ate', 'is', null);
    if (error) { avisos.push(`Assinatura: ${error.message}`); break; }
    for (const s of data || []) {
      const e = emailNorm(s.email);
      const origem = utmDoEmail.get(e);
      // assinatura que começou antes da chegada pelas redes não conta pra rede
      if (!origem || diaBrasilia(s.criado_em) < origem.dia) continue;
      listas.assinatura.push({ utm: origem.utm, dia: origem.dia, pessoa: e });
    }
  }

  return { ...funilPorFormato({ ...listas, formatoPorDia }), desde, avisos, perfis: doPerfil.size };
}
