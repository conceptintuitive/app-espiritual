// lib/socialServidor.js — banco, publicação e aviso de erro da automação
// diária do Instagram/TikTok. SÓ SERVIDOR. Conteúdo: lib/social.js.
// Tabelas: migração 0024 (social_posts, social_series, social_tokens).
// Chamado por app/api/cron/social (posta) e app/api/social/previa (só lê).

import { Resend } from 'resend';
import {
  temaDoDia, serieDoTema, postDoDia, montarLegenda, tituloCurto, caminhoImagem, planoDosDias,
} from './social.js';
import { tokenInstagram, publicarNoInstagram } from './instagram.js';
import { getValidAccessToken, getStoredTokens } from './tiktokOAuth.js';
import { enviarFotoProInbox } from './tiktokContentPosting.js';

const MAX_TENTATIVAS = 3;
const TRAVA_VENCE_MIN = 15; // 'enviando' parado há mais que isso = disparo anterior morreu

export const EMAIL_ALERTA_PADRAO = 'conceptintuitive@gmail.com';

// ── Séries ─────────────────────────────────────────────────────────────────

/** { numero: 3, anjo: 10, … } — próximo índice de cada série. {} se a tabela não existe. */
export async function lerEstadoSeries(supabase) {
  const { data, error } = await supabase.from('social_series').select('serie, proximo');
  if (error) return { estado: {}, erro: error.message };
  return { estado: Object.fromEntries((data || []).map((r) => [r.serie, r.proximo])) };
}

/** Índice do feed já usado neste dia (retentativa usa o mesmo item), ou null. */
async function indiceJaUsado(supabase, data) {
  const { data: linhas, error } = await supabase.from('social_posts').select('serie, indice').eq('data', data).eq('tipo', 'feed').not('indice', 'is', null).limit(1);
  if (error) throw new Error(`social_posts: ${error.message}`);
  return linhas?.[0] ? { serie: linhas[0].serie, indice: linhas[0].indice } : null;
}

/** Anda a série de `indice` pra `indice + 1` só se ainda estiver em `indice` (idempotente). */
async function avancarSerie(supabase, serie, indice) {
  const agora = new Date().toISOString();
  const { data, error } = await supabase.from('social_series').update({ proximo: indice + 1, updated_at: agora }).eq('serie', serie).eq('proximo', indice).select('serie');
  if (error) throw new Error(`social_series: ${error.message}`);
  if (!data?.length && indice === 0) {
    await supabase.from('social_series').upsert({ serie, proximo: 1, updated_at: agora }, { onConflict: 'serie', ignoreDuplicates: true });
  }
}

// ── Trava + log ────────────────────────────────────────────────────────────

/**
 * Tenta ficar com o post (dia, rede, tipo). true = pode postar.
 * Cria a linha 'enviando'; se já existe, só pega de volta se deu erro (até 3
 * tentativas) ou se ficou travada em 'enviando' por mais de 15 min.
 */
export async function reivindicar(supabase, linha) {
  const agora = new Date().toISOString();
  const { error } = await supabase.from('social_posts').insert({ ...linha, status: 'enviando', updated_at: agora });
  if (!error) return true;
  if (error.code !== '23505') throw new Error(`social_posts: ${error.message}`);
  const vencida = new Date(Date.now() - TRAVA_VENCE_MIN * 60000).toISOString();
  const { data: atual } = await supabase.from('social_posts').select('tentativas').eq('data', linha.data).eq('rede', linha.rede).eq('tipo', linha.tipo).maybeSingle();
  const tentativas = (atual?.tentativas || 1) + 1;
  const { data, error: e2 } = await supabase.from('social_posts')
    .update({ status: 'enviando', erro: null, tentativas, updated_at: agora })
    .eq('data', linha.data).eq('rede', linha.rede).eq('tipo', linha.tipo)
    .lt('tentativas', MAX_TENTATIVAS)
    .or(`status.eq.erro,and(status.eq.enviando,updated_at.lt.${vencida})`)
    .select('id');
  if (e2) throw new Error(`social_posts: ${e2.message}`);
  return !!data?.length;
}

async function registrar(supabase, { data, rede, tipo }, campos) {
  await supabase.from('social_posts').update({ ...campos, updated_at: new Date().toISOString() }).eq('data', data).eq('rede', rede).eq('tipo', tipo);
}

// ── Aviso por e-mail ───────────────────────────────────────────────────────

export async function avisarErro(data, erros) {
  if (!erros.length || !process.env.RESEND_API_KEY) return;
  const para = process.env.SOCIAL_ALERTA_EMAIL || EMAIL_ALERTA_PADRAO;
  const linhas = erros.map((e) => `${e.rede} · ${e.tipo}: ${e.erro}`);
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Intuitive Concept <acesso@intuitiveconcept.com.br>',
      to: para,
      subject: `Post automático falhou (${data.split('-').reverse().join('/')})`,
      text: `A automação do Instagram/TikTok deu erro em ${data}:\n\n${linhas.join('\n')}\n\nO cron tenta de novo no próximo disparo do dia (até 3 vezes). Log: tabela social_posts no Supabase.`,
    });
  } catch (err) {
    console.error('❌ Não consegui mandar o e-mail de erro da automação social:', err.message);
  }
}

// ── O dia ──────────────────────────────────────────────────────────────────

/** URL pública e assinada da arte. */
export function urlImagem(baseUrl, segredo, { data, formato, indice = null }) {
  return `${baseUrl}${caminhoImagem({ data, formato, indice }, segredo)}`;
}

/** Baixa a arte uma vez antes de mandar pra rede: confirma que gera (e esquenta o cache). */
async function conferirImagem(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`a arte não gerou (HTTP ${r.status}): ${url.split('?')[0]}`);
  const tipo = r.headers.get('content-type') || '';
  if (!tipo.includes('jpeg')) throw new Error(`a arte não veio em JPEG (${tipo})`);
  await r.arrayBuffer();
}

/**
 * Posta o dia: story do Instagram + post do feed (Instagram e rascunho do
 * TikTok). Idempotente por (dia, rede, tipo). Devolve o resumo; erros vão por
 * e-mail.
 */
export async function postarDia({ supabase, data, redes, baseUrl, segredo }) {
  const resultado = [];
  const erros = [];

  // Sem a tabela de trava, não posta (não dá pra garantir 1 por dia).
  const { error: semTabela } = await supabase.from('social_posts').select('id').limit(1);
  if (semTabela) {
    const erro = `Tabela social_posts indisponível (${semTabela.message}). Rode a migração 0024_social_automacao.sql.`;
    await avisarErro(data, [{ rede: 'todas', tipo: '-', erro }]);
    return { resultado, erros: [{ rede: 'todas', tipo: '-', erro }] };
  }

  // Feed do dia: tema, série e índice (o mesmo em todas as redes e retentativas).
  const tema = temaDoDia(data);
  let feed = null;
  if (tema) {
    const serie = serieDoTema(tema);
    let indice = null;
    if (serie) {
      const usado = await indiceJaUsado(supabase, data);
      if (usado && usado.serie === serie) indice = usado.indice;
      else {
        const { estado } = await lerEstadoSeries(supabase);
        indice = estado[serie] ?? 0;
      }
    }
    const post = postDoDia(data, indice ?? 0);
    feed = { tema, serie, indice, post, legenda: montarLegenda(post.legenda) };
  }

  const tarefas = [];
  if (redes.includes('instagram')) tarefas.push({ rede: 'instagram', tipo: 'story' });
  if (feed) for (const rede of redes) tarefas.push({ rede, tipo: 'feed' });

  let tokenIg = null;
  let modoIg;
  let tokenTt = null;

  for (const t of tarefas) {
    const ehFeed = t.tipo === 'feed';
    const linha = {
      data, rede: t.rede, tipo: t.tipo,
      tema: ehFeed ? feed.tema : 'energia',
      serie: ehFeed ? feed.serie : null,
      indice: ehFeed ? feed.indice : null,
      item: ehFeed ? String(feed.post.item) : null,
    };
    let minha = false;
    try {
      minha = await reivindicar(supabase, linha);
      if (!minha) { resultado.push({ ...t, pulado: 'já postado ou em andamento' }); continue; }
      if (ehFeed && feed.serie) await avancarSerie(supabase, feed.serie, feed.indice);

      const url = urlImagem(baseUrl, segredo, { data, formato: t.tipo, indice: ehFeed ? feed.indice : null });
      await conferirImagem(url);

      let postId;
      if (t.rede === 'instagram') {
        if (!tokenIg) {
          const r = await tokenInstagram(supabase);
          tokenIg = r.token;
          modoIg = r.modo;
          if (r.aviso) console.warn('⚠️', r.aviso);
        }
        const r = await publicarNoInstagram({ token: tokenIg, modo: modoIg, tipo: t.tipo, imageUrl: url, legenda: ehFeed ? feed.legenda : '' });
        postId = r.id;
      } else {
        if (!tokenTt) {
          const salvo = await getStoredTokens();
          const escopos = String(salvo?.scope || '').split(/[,\s]+/);
          if (salvo?.scope && !escopos.includes('video.upload')) throw new Error('o token do TikTok não tem o escopo video.upload: reconecte em /api/tiktok/connect');
          tokenTt = await getValidAccessToken();
        }
        const r = await enviarFotoProInbox({ accessToken: tokenTt, imageUrls: [url], titulo: tituloCurto(feed.post.legenda.gancho), descricao: feed.legenda });
        postId = r.publish_id;
      }
      await registrar(supabase, { data, rede: t.rede, tipo: t.tipo }, { status: 'ok', post_id: postId, erro: null });
      resultado.push({ ...t, ok: true, post_id: postId });
    } catch (err) {
      const msg = String(err?.message || err).slice(0, 800);
      console.error(`❌ social ${t.rede}/${t.tipo}:`, msg);
      if (minha) await registrar(supabase, { data, rede: t.rede, tipo: t.tipo }, { status: 'erro', erro: msg });
      erros.push({ ...t, erro: msg });
      resultado.push({ ...t, ok: false, erro: msg });
    }
  }

  await avisarErro(data, erros);
  return { resultado, erros, tema, item: feed?.post?.item ?? null };
}

/**
 * Plano da prévia (hoje + n−1 dias), começando do estado do banco. Se o feed
 * de hoje já saiu, hoje mostra o item que saiu.
 */
export async function planoDaPrevia(supabase, inicio, n) {
  let estado = {};
  let aviso = null;
  if (supabase) {
    const r = await lerEstadoSeries(supabase);
    estado = r.estado;
    if (r.erro) aviso = `Sem a tabela social_series (migração 0024): a prévia começa todas as séries do primeiro item.`;
    try {
      const usado = await indiceJaUsado(supabase, inicio);
      if (usado) estado[usado.serie] = usado.indice;
    } catch { /* sem tabela: segue */ }
  } else {
    aviso = 'Supabase não configurado: a prévia começa todas as séries do primeiro item.';
  }
  return { dias: planoDosDias(inicio, n, estado), aviso };
}
