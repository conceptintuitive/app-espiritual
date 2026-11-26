// lib/socialServidor.js — banco, geração, publicação e avisos da automação
// social. SÓ SERVIDOR. Conteúdo: lib/social.js (dados + reserva) e
// lib/socialIA.js (texto da IA). Tabelas: migrações 0024 (social_posts,
// social_series, social_tokens) e 0025 (social_conteudos, social_respostas,
// social_alertas, colunas do Reels).
//
// Quem chama:
//   app/api/cron/social-semana  gerarSemana       (domingo: a semana seguinte)
//   app/api/cron/social         postarDia         (7h: story, carrossel, TikTok, início do Reels)
//   app/api/cron/social-hora    avancarReels + responderComentarios + Story da frase (21h)
//   app/api/social/reels/*      trabalhoDoReels + publicarReelsDoArquivo (GitHub Actions)
//   app/api/social/imagem       conteudoParaArte  (as artes)
//   app/api/social/previa       planoDaPrevia
// Reels: card de 9s (0026) → narrado (0028, SOCIAL_REELS_NARRADO) → interativo
// (0029, SOCIAL_REELS_INTERATIVO), cada um caindo no anterior se falhar.

import { Resend } from 'resend';
import {
  temaDoDia, temaDoNarrado, indiceDoNarrado, serieDoTema, dadosDoDia, reservaDoDia, montarLegenda, tituloCurto, caminhoImagem, planoDosDias,
  somarDias, versaoConteudo, chaveLigada, hojeBrasilia, assinarImagem, redesLigadas,
} from './social.js';
import { REELS } from './reelsAnimacao.js';
import { gerarConteudoDoDia, gerarRoteiroReels } from './socialIA.js';
import {
  tokenInstagram, publicarNoInstagram, publicarCarrossel, criarContainerReels, statusContainer, publicarContainer,
  midiasRecentes, comentariosDaMidia, responderComentario, insightsDaMidia, METRICAS_REELS,
} from './instagram.js';
import { getValidAccessToken, getStoredTokens } from './tiktokOAuth.js';
import { enviarFotoProInbox, postarFotoDireto } from './tiktokContentPosting.js';
import { roteiroReels, trilhaDoDia, iniciarRender, consultarRender } from './socialReels.js';
import { decidirResposta } from './socialComentarios.js';
import { createHash } from 'node:crypto';
import { fechamentoDoDia, textoNarrado, palavrasDoAlinhamento, duracaoDoVideo } from './reelsRoteiro.js';
import { narrar, narracaoConfigurada, limiteMensal, mesBrasilia, cabeNoLimite } from './elevenlabs.js';
import {
  formatoDoDia, formatoDoReel, NOME_FORMATO, FORMATOS_INTERATIVOS, roteiroInterativo, textoDoRoteiro, textoDoSegmento, linhaDoTempo, legendaInterativa,
} from './reelsInterativo.js';
import { ARCANOS_MAIORES } from './tarot.js';
import { TEMAS as TEMAS_SEU_DIA } from './seuDiaTextos.js';
import { NUMERO_PROFUNDO } from './manualgenerator.js';
import { FRASES, fraseDoDia, creditoDaFrase, creditoFalado } from './frases.js';
import { getBaseUrl } from './baseUrl.js';
import { configGithub, dispararReelsSePreciso } from './githubActions.js';

const MAX_TENTATIVAS = 3;
const TRAVA_VENCE_MIN = 15; // 'enviando' parado há mais que isso = disparo anterior morreu
const REELS_DESISTE_H = 4; // Reels que não ficou pronto em 4h vira erro

export const EMAIL_ALERTA_PADRAO = 'conceptintuitive@gmail.com';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Séries ─────────────────────────────────────────────────────────────────

/** { numero: 3, mente: 10, … } — próximo índice de cada série. {} se a tabela não existe. */
export async function lerEstadoSeries(supabase) {
  const { data, error } = await supabase.from('social_series').select('serie, proximo');
  if (error) return { estado: {}, erro: error.message };
  return { estado: Object.fromEntries((data || []).map((r) => [r.serie, r.proximo])) };
}

/** Garante proximo >= valor (só anda pra frente). */
async function levarSerieAte(supabase, serie, valor) {
  const agora = new Date().toISOString();
  const { data } = await supabase.from('social_series').update({ proximo: valor, updated_at: agora }).eq('serie', serie).lt('proximo', valor).select('serie');
  if (!data?.length) await supabase.from('social_series').upsert({ serie, proximo: valor, updated_at: agora }, { onConflict: 'serie', ignoreDuplicates: true });
}

// ── Conteúdo guardado (social_conteudos) ───────────────────────────────────

export async function lerConteudo(supabase, data) {
  if (!supabase) return null;
  const { data: row, error } = await supabase.from('social_conteudos').select('*').eq('data', data).maybeSingle();
  if (error) return null;
  return row || null;
}

function linhaDeConteudo(dados, conteudo, revisao) {
  return {
    data: dados.data, tema: dados.tema, serie: dados.serie, indice: dados.indice, item: dados.item,
    conteudo, fonte: conteudo.fonte, revisao, versao: versaoConteudo(conteudo), gerado_em: new Date().toISOString(),
  };
}

/** Dados + conteúdo pra desenhar as artes (banco; sem linha, a reserva do índice da URL). */
export async function conteudoParaArte(supabase, data, indice = null) {
  const row = await lerConteudo(supabase, data);
  const dados = dadosDoDia(data, row?.indice ?? indice ?? 0);
  return { dados, conteudo: row?.conteudo || reservaDoDia(dados), versao: row?.versao || '' };
}

/**
 * Gera (IA + revisão) e guarda os dias de `inicio` a `inicio + dias - 1`.
 * Dia que já tem conteúdo é pulado (refazer=true gera de novo, com o mesmo
 * item da série). As séries andam aqui, na geração.
 */
export async function gerarSemana({ supabase, inicio, dias = 7, refazer = false, chamar }) {
  const datas = Array.from({ length: dias }, (_, k) => somarDias(inicio, k));
  const { data: existentes, error } = await supabase.from('social_conteudos').select('data, indice').in('data', datas);
  if (error) throw new Error(`social_conteudos: ${error.message} (rode a migração 0025)`);
  const { estado } = await lerEstadoSeries(supabase);
  const prox = { ...estado };

  const tarefas = [];
  for (const data of datas) {
    const ja = (existentes || []).find((e) => e.data === data);
    if (ja && !refazer) continue;
    const serie = serieDoTema(temaDoDia(data));
    let indice = ja?.indice ?? null;
    if (serie && indice == null) { indice = prox[serie] ?? 0; prox[serie] = indice + 1; }
    tarefas.push({ data, indice });
  }

  const feitos = await Promise.all(tarefas.map(async ({ data, indice }) => {
    const dados = dadosDoDia(data, indice);
    const { conteudo, revisao } = await gerarConteudoDoDia(dados, chamar ? { chamar } : undefined);
    const { error: e } = await supabase.from('social_conteudos').upsert(linhaDeConteudo(dados, conteudo, revisao), { onConflict: 'data' });
    return { data, tema: dados.tema, item: dados.item, fonte: conteudo.fonte, revisao, erro: e?.message || null };
  }));

  for (const [serie, valor] of Object.entries(prox)) if (valor !== estado[serie]) await levarSerieAte(supabase, serie, valor);

  // Reels narrado ligado: o roteiro falado de cada dia também sai agora (a
  // narração fica pro dia, no trabalho do workflow). Falhou = card de 9s no dia.
  let narrados = null;
  if (narradoLigado() || interativoLigado()) {
    narrados = await Promise.all(datas.map(async (data) => {
      try {
        const l = await garantirRoteiroNarrado({ supabase, data, chamar, refazer });
        return { data, fonte: l.fonte };
      } catch (err) {
        return { data, erro: String(err?.message || err).slice(0, 300) };
      }
    }));
  }

  const avisos = feitos.filter((f) => f.fonte === 'reserva' || f.erro).map((f) => ({
    rede: 'geração', tipo: `${f.data} ${f.tema}`,
    erro: f.erro || `saiu com o texto de reserva (${[f.revisao?.geracao, ...[].concat(f.revisao?.revisao || []).filter((r) => typeof r === 'string'), ...(f.revisao?.checagem || [])].filter(Boolean).join('; ') || 'IA reprovada'})`,
  }));
  for (const n of narrados || []) if (n.erro) avisos.push({ rede: 'reels narrado', tipo: n.data, erro: `${n.erro}. Nesse dia sai o card de 9s.` });
  await avisarErro(inicio, avisos, 'Geração da semana');
  return { gerados: feitos, pulados: datas.length - tarefas.length, ...(narrados && { narrados }) };
}

/** Conteúdo do dia pra postar: o guardado, ou gera na hora (IA, com reserva) e guarda. */
export async function garantirConteudoDoDia(supabase, data, { chamar } = {}) {
  const row = await lerConteudo(supabase, data);
  if (row) return row;
  const serie = serieDoTema(temaDoDia(data));
  const { estado } = await lerEstadoSeries(supabase);
  const indice = serie ? (estado[serie] ?? 0) : null;
  const dados = dadosDoDia(data, indice);
  const { conteudo, revisao } = await gerarConteudoDoDia(dados, chamar ? { chamar } : undefined);
  const linha = linhaDeConteudo(dados, conteudo, revisao);
  const { error } = await supabase.from('social_conteudos').insert(linha);
  if (!error && serie) await levarSerieAte(supabase, serie, indice + 1);
  return (await lerConteudo(supabase, data)) || linha;
}

// ── Trava + log (social_posts) ─────────────────────────────────────────────

/**
 * Tenta ficar com o post (dia, rede, tipo). true = pode postar.
 * Cria a linha 'enviando'; se já existe, só pega de volta se deu erro (até 3
 * tentativas) ou se ficou travada em 'enviando' por mais de 15 min. 'ok' e
 * 'aguardando' (Reels renderizando) nunca são pegos de volta.
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

// ── Avisos por e-mail ──────────────────────────────────────────────────────

export async function avisarErro(data, erros, assunto = 'Post automático falhou') {
  if (!erros.length || !process.env.RESEND_API_KEY) return;
  const para = process.env.SOCIAL_ALERTA_EMAIL || EMAIL_ALERTA_PADRAO;
  const linhas = erros.map((e) => `${e.rede} · ${e.tipo}: ${e.erro}`);
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Intuitive Concept <acesso@intuitiveconcept.com.br>',
      to: para,
      subject: `${assunto} (${data.split('-').reverse().join('/')})`,
      text: `A automação do Instagram/TikTok avisou em ${data}:\n\n${linhas.join('\n')}\n\nPosts: o cron tenta de novo no próximo disparo do dia (até 3 vezes). Log: tabelas social_posts e social_conteudos no Supabase.`,
    });
  } catch (err) {
    console.error('❌ Não consegui mandar o e-mail da automação social:', err.message);
  }
}

/** No máximo 1 e-mail por dia por `chave` (o cron da hora não pode virar spam). */
async function avisarUmaVezPorDia(supabase, chave, data, erros, assunto) {
  if (!erros.length) return;
  const { data: ja } = await supabase.from('social_alertas').select('ultimo').eq('chave', chave).maybeSingle();
  if (ja?.ultimo === data) return;
  await supabase.from('social_alertas').upsert({ chave, ultimo: data }, { onConflict: 'chave' });
  await avisarErro(data, erros, assunto);
}

// ── Imagens ────────────────────────────────────────────────────────────────

/** URL pública e assinada da arte. */
export function urlImagem(baseUrl, segredo, { data, formato, indice = null, v = '' }) {
  return `${baseUrl}${caminhoImagem({ data, formato, indice, v }, segredo)}`;
}

/** As URLs do dia: story, telas do carrossel e as peças do Reels. */
export function urlsDoDia(baseUrl, segredo, { data, indice, versao, conteudo }) {
  const u = (formato) => urlImagem(baseUrl, segredo, { data, formato, indice, v: versao });
  return {
    story: u('story'),
    telas: conteudo.telas.map((_, k) => u(`c${k + 1}`)),
    reels: { ceu: u('ceu'), r1: u('r1'), r2: u('r2'), r3: u('r3') },
  };
}

/** Baixa a arte uma vez antes de mandar pra rede: confirma que gera (e esquenta o cache). */
async function conferirImagem(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`a arte não gerou (HTTP ${r.status}): ${url.split('?')[0]}`);
  const tipo = r.headers.get('content-type') || '';
  if (!/jpeg|png/.test(tipo)) throw new Error(`a arte não veio em JPEG/PNG (${tipo})`);
  await r.arrayBuffer();
}

// ── O dia ──────────────────────────────────────────────────────────────────

async function tokenTikTok() {
  const salvo = await getStoredTokens();
  const escopos = String(salvo?.scope || '').split(/[,\s]+/);
  if (salvo?.scope && !escopos.includes('video.upload') && !escopos.includes('video.publish')) {
    throw new Error('o token do TikTok não tem o escopo video.upload: reconecte em /api/tiktok/connect');
  }
  return getValidAccessToken();
}

/**
 * Posta o dia: story + carrossel no Instagram, carrossel no TikTok (rascunho,
 * ou Direct Post se aprovado na tela /admin/tiktok e TIKTOK_DIRECT_POST=on) e,
 * no motor Creatomate (SOCIAL_REELS=creatomate), começa o Reels. Idempotente por (dia, rede, tipo).
 */
export async function postarDia({ supabase, data, redes, baseUrl, segredo, chamar, esperarReelsMs = 120000 }) {
  const resultado = [];
  const erros = [];

  // Sem a tabela de trava, não posta (não dá pra garantir 1 por dia).
  const { error: semTabela } = await supabase.from('social_posts').select('id').limit(1);
  if (semTabela) {
    const erro = /fetch failed|ENOTFOUND|ECONN|timeout/i.test(semTabela.message || '')
      ? `Supabase sem resposta (${semTabela.message}). Nada foi postado; o próximo disparo tenta de novo.`
      : `Tabela social_posts indisponível (${semTabela.message}). Rode as migrações 0024 e 0025.`;
    await avisarErro(data, [{ rede: 'todas', tipo: '-', erro }]);
    return { resultado, erros: [{ rede: 'todas', tipo: '-', erro }] };
  }

  const row = await garantirConteudoDoDia(supabase, data, { chamar });
  const c = row.conteudo;
  const urls = urlsDoDia(baseUrl, segredo, row);
  const legenda = montarLegenda(c.legenda);

  const tarefas = [];
  if (redes.includes('instagram')) tarefas.push({ rede: 'instagram', tipo: 'story' });
  for (const rede of redes) tarefas.push({ rede, tipo: 'feed' });
  // Reels: aqui só no motor Creatomate; no motor GitHub (padrão), quem
  // começa é o workflow (trabalhoDoReels / publicarReelsDoArquivo).
  if (redes.includes('instagram') && motorReels() === 'creatomate') tarefas.push({ rede: 'instagram', tipo: 'reels' });

  let ig = null;
  let tokenTt = null;

  for (const t of tarefas) {
    const linha = {
      data, rede: t.rede, tipo: t.tipo,
      tema: t.tipo === 'story' ? 'energia' : row.tema, serie: t.tipo === 'story' ? null : row.serie,
      indice: t.tipo === 'story' ? null : row.indice, item: t.tipo === 'story' ? null : row.item,
    };
    let minha = false;
    try {
      minha = await reivindicar(supabase, linha);
      if (!minha) { resultado.push({ ...t, pulado: 'já postado ou em andamento' }); continue; }

      if (t.rede === 'instagram' && !ig) {
        ig = await tokenInstagram(supabase);
        if (ig.aviso) console.warn('⚠️', ig.aviso);
      }

      let postId;
      if (t.tipo === 'story') {
        await conferirImagem(urls.story);
        postId = (await publicarNoInstagram({ token: ig.token, modo: ig.modo, tipo: 'story', imageUrl: urls.story })).id;
      } else if (t.tipo === 'feed' && t.rede === 'instagram') {
        for (const u of urls.telas) await conferirImagem(u);
        postId = (await publicarCarrossel({ token: ig.token, modo: ig.modo, imageUrls: urls.telas, legenda })).id;
      } else if (t.tipo === 'feed') {
        for (const u of urls.telas) await conferirImagem(u);
        tokenTt ||= await tokenTikTok();
        const ap = row.tiktok_aprovacao;
        if (chaveLigada(process.env.TIKTOK_DIRECT_POST) && ap?.aprovado) {
          postId = (await postarFotoDireto({
            accessToken: tokenTt, imageUrls: urls.telas, titulo: ap.titulo || tituloCurto(c.legenda.gancho), descricao: ap.descricao || legenda,
            privacyLevel: ap.privacy_level, disableComment: !!ap.disable_comment, autoAddMusic: ap.auto_add_music !== false,
            brandContent: !!ap.brand_content_toggle, brandOrganic: !!ap.brand_organic_toggle,
          })).publish_id;
          t.modo = 'direct_post';
        } else {
          postId = (await enviarFotoProInbox({ accessToken: tokenTt, imageUrls: urls.telas, titulo: tituloCurto(c.legenda.gancho), descricao: legenda })).publish_id;
        }
      } else {
        // Reels: só começa o render; o vídeo é publicado por avancarReels.
        for (const u of Object.values(urls.reels)) await conferirImagem(u);
        const renderId = await iniciarRender({ source: roteiroReels({ urls: urls.reels, trilha: trilhaDoDia(data) }), metadata: data });
        await registrar(supabase, linha, { status: 'aguardando', etapa: 'render', externo_id: renderId, erro: null });
        resultado.push({ ...t, ok: true, aguardando: 'render' });
        continue;
      }
      await registrar(supabase, linha, { status: 'ok', post_id: postId, erro: null });
      resultado.push({ ...t, ok: true, post_id: postId });
    } catch (err) {
      const msg = String(err?.message || err).slice(0, 800);
      console.error(`❌ social ${t.rede}/${t.tipo}:`, msg);
      if (minha) await registrar(supabase, linha, { status: 'erro', erro: msg });
      erros.push({ ...t, erro: msg });
      resultado.push({ ...t, ok: false, erro: msg });
    }
  }

  // Tenta terminar o Reels ainda neste disparo; o que sobrar, o cron da hora termina.
  if (tarefas.some((t) => t.tipo === 'reels')) {
    const r = await avancarReels({ supabase, esperarMs: esperarReelsMs, avisar: false });
    resultado.push(...r.resultado);
    erros.push(...r.erros);
  }

  await avisarErro(data, erros);
  return { resultado, erros, tema: row.tema, item: row.item, fonte: row.fonte };
}

// ── Reels: render → container → publicado ──────────────────────────────────

/**
 * Anda os Reels em 'aguardando' (etapa render → container → publicado).
 * Repete a cada 10s até `esperarMs` (0 = uma passada só).
 */
export async function avancarReels({ supabase, esperarMs = 0, avisar = true }) {
  const fim = Date.now() + esperarMs;
  const resultado = [];
  const erros = [];
  let ig = null;
  for (;;) {
    const { data: rows, error } = await supabase.from('social_posts').select('*').eq('tipo', 'reels').eq('status', 'aguardando').limit(5);
    if (error || !rows?.length) break;
    for (const row of rows) {
      const chave = { data: row.data, rede: row.rede, tipo: 'reels' };
      try {
        const idade = Date.now() - Date.parse(row.created_at || row.updated_at);
        if (row.etapa === 'render') {
          const r = await consultarRender(row.externo_id);
          if (r.status === 'failed') throw new Error(`Creatomate: ${r.erro || 'render falhou'}`);
          if (r.status !== 'succeeded') {
            if (idade > REELS_DESISTE_H * 3600000) throw new Error(`o render não ficou pronto em ${REELS_DESISTE_H}h (status ${r.status})`);
            continue;
          }
          ig ||= await tokenInstagram(supabase);
          const { conteudo } = await conteudoParaArte(supabase, row.data, row.indice);
          const container = await criarContainerReels({ token: ig.token, modo: ig.modo, videoUrl: r.url, legenda: montarLegenda(conteudo.legenda) });
          await registrar(supabase, chave, { etapa: 'container', externo_id: container });
        } else if (row.etapa === 'container') {
          ig ||= await tokenInstagram(supabase);
          const st = await statusContainer({ token: ig.token, modo: ig.modo, container: row.externo_id });
          if (st === 'ERROR' || st === 'EXPIRED') throw new Error(`Instagram: container do Reels ${st}`);
          if (st !== 'FINISHED') {
            if (idade > REELS_DESISTE_H * 3600000) throw new Error(`o Instagram não processou o Reels em ${REELS_DESISTE_H}h`);
            continue;
          }
          const id = await publicarContainer({ token: ig.token, modo: ig.modo, container: row.externo_id });
          await registrar(supabase, chave, { status: 'ok', etapa: 'publicado', post_id: id, erro: null });
          resultado.push({ rede: 'instagram', tipo: 'reels', ok: true, post_id: id });
        } else {
          throw new Error(`etapa desconhecida: ${row.etapa}`);
        }
      } catch (err) {
        const msg = String(err?.message || err).slice(0, 800);
        await registrar(supabase, chave, { status: 'erro', erro: msg });
        erros.push({ rede: 'instagram', tipo: 'reels', erro: msg });
        resultado.push({ rede: 'instagram', tipo: 'reels', ok: false, erro: msg });
      }
    }
    if (Date.now() + 10000 > fim) break;
    await espera(10000);
  }
  if (avisar && erros.length) await avisarErro(hojeBrasilia(), erros, 'Reels automático falhou');
  return { resultado, erros };
}

// ── Comentários ────────────────────────────────────────────────────────────

export const limiteRespostasPorHora = () => Math.min(50, Math.max(1, Number(process.env.SOCIAL_RESPOSTAS_POR_HORA) || 20));

/**
 * Mídias do Instagram (id → { formato, data }) dos Reels interativos de
 * carta/número publicados nos últimos 7 dias: só nelas "1/2/3" e "1–9"
 * ganham resposta. Sem a migração 0029, vazio (o bot segue só com datas).
 */
export async function reelsInterativosPublicados(supabase, hojeISO = hojeBrasilia()) {
  const mapa = new Map();
  try {
    const { data: posts } = await supabase.from('social_posts').select('data, post_id')
      .eq('rede', 'instagram').eq('tipo', 'reels').eq('status', 'ok').gte('data', somarDias(hojeISO, -7));
    const comId = (posts || []).filter((p) => p.post_id);
    if (!comId.length) return mapa;
    const { data: rows, error } = await supabase.from(TABELA_INTERATIVOS).select('data, formato, publicado_em').in('data', comId.map((p) => p.data));
    if (error) return mapa;
    for (const p of comId) {
      const r = (rows || []).find((x) => x.data === p.data && x.publicado_em && ['carta', 'numero'].includes(x.formato));
      if (r) mapa.set(String(p.post_id), { formato: r.formato, data: r.data });
    }
  } catch {
    // sem as tabelas: segue só com datas
  }
  return mapa;
}

/**
 * Responde comentários com data de nascimento nos posts dos últimos 7 dias
 * e, nos Reels interativos de carta/número, a escolha ("2", "sou 7").
 * Guarda SÓ o id do comentário (social_respostas), antes de responder (trava).
 * Não loga texto, data nem usuário.
 */
export async function responderComentarios({ supabase, limite = limiteRespostasPorHora(), pausaMs = 2500, hoje }) {
  const out = { respondidas: 0, vistas: 0, ignoradas: 0, erros: [] };
  const { error: semTabela } = await supabase.from('social_respostas').select('comentario_id').limit(1);
  if (semTabela) {
    out.erros.push({ rede: 'instagram', tipo: 'comentários', erro: `Tabela social_respostas indisponível (${semTabela.message}). Rode a migração 0025.` });
    return out;
  }
  const ig = await tokenInstagram(supabase);
  const proprioId = process.env.INSTAGRAM_USER_ID;
  const midias = await midiasRecentes({ token: ig.token, modo: ig.modo, desde: Date.now() - 7 * 86400000 });
  const interativos = await reelsInterativosPublicados(supabase);

  for (const m of midias) {
    if (out.respondidas >= limite) break;
    if (!m.comments_count) continue;
    let comentarios;
    try {
      comentarios = await comentariosDaMidia({ token: ig.token, modo: ig.modo, midia: m.id });
    } catch (err) {
      out.erros.push({ rede: 'instagram', tipo: 'comentários', erro: err.message });
      continue;
    }
    const ids = comentarios.map((c) => c.id);
    const { data: jaRespondidos } = ids.length
      ? await supabase.from('social_respostas').select('comentario_id').in('comentario_id', ids)
      : { data: [] };
    const ja = new Set((jaRespondidos || []).map((r) => r.comentario_id));

    for (const c of comentarios) {
      if (out.respondidas >= limite) break;
      out.vistas++;
      if (ja.has(c.id)) continue;
      const dec = decidirResposta({ id: c.id, texto: c.texto, proprio: !!proprioId && c.de === proprioId, interativo: interativos.get(String(m.id)) || null }, hoje);
      if (!dec.responder) { out.ignoradas++; continue; }
      // trava: só quem gravar o id responde
      const { error: e } = await supabase.from('social_respostas').insert({ comentario_id: c.id, modelo: dec.modelo });
      if (e) continue;
      try {
        await responderComentario({ token: ig.token, modo: ig.modo, comentario: c.id, mensagem: dec.texto });
        out.respondidas++;
        if (pausaMs) await espera(pausaMs);
      } catch (err) {
        await supabase.from('social_respostas').delete().eq('comentario_id', c.id); // tenta na próxima hora
        out.erros.push({ rede: 'instagram', tipo: 'comentários', erro: err.message });
        if (/limit|bloque|spam|#4\b|código (4|17|32|613)\b/i.test(err.message)) break; // limite da Meta: para por esta hora
      }
    }
  }
  return out;
}

// ── Reels pelo GitHub Actions (motor padrão) ───────────────────────────────

/**
 * Motor do Reels pela variável SOCIAL_REELS: "on"/"github" = GitHub Actions
 * (padrão, de graça; scripts/reels/gerar.mjs), "creatomate" = Creatomate
 * (alternativa paga), vazio/"off" = sem Reels.
 */
export function motorReels(valor = process.env.SOCIAL_REELS) {
  const v = String(valor || '').trim().toLowerCase();
  if (v === 'creatomate') return 'creatomate';
  if (v === 'github' || chaveLigada(v)) return 'github';
  return null;
}

export const bucketReels = () => process.env.SOCIAL_REELS_BUCKET || 'reels';
const DIAS_NO_BUCKET = 7;

/** Apaga do bucket os vídeos com mais de 7 dias (o Instagram já copiou). Best effort. */
async function limparReelsAntigos(supabase, data) {
  try {
    const limite = somarDias(data, -DIAS_NO_BUCKET);
    const { data: arquivos } = await supabase.storage.from(bucketReels()).list('', { limit: 100 });
    const velhos = (arquivos || []).map((a) => a.name).filter((n) => /^\d{4}-\d{2}-\d{2}-/.test(n) && n.slice(0, 10) < limite);
    if (velhos.length) await supabase.storage.from(bucketReels()).remove(velhos);
    return velhos;
  } catch {
    return [];
  }
}

/** Caminho do vídeo no bucket: "AAAA-MM-DD-<versão do texto>.mp4". */
export const caminhoDoReels = (data, versao) => `${data}-${versao || 'r'}.mp4`;
/** Vídeo de prévia (workflow com previa=sim): nunca vai pro Instagram. */
export const caminhoDaPrevia = (data) => `${data}-previa.mp4`;

// ── Reels narrado (SOCIAL_REELS_NARRADO=on, migração 0028) ─────────────────
// Roteiro (IA + revisão, lib/socialIA.js) → narração (ElevenLabs, com a trava
// de caracteres do mês) → o workflow filma a página no modo narrado. Qualquer
// falha no caminho = o Reels sai no card antigo de 9s (nunca fica sem post).

export const narradoLigado = () => chaveLigada(process.env.SOCIAL_REELS_NARRADO);
export const TABELA_NARRADOS = 'social_reels_narrados';
const hashCurto = (t) => createHash('sha256').update(String(t)).digest('hex').slice(0, 10);
/** MP3 da narração no bucket (na raiz, pra limpeza de 7 dias pegar junto). */
export const caminhoDaNarracao = (data, texto) => `${data}-narracao-${hashCurto(texto)}.mp3`;

/** Roteiro narrado do dia: o guardado, ou gera agora (IA) e guarda. Lança se a IA não entregar. */
export async function garantirRoteiroNarrado({ supabase, data, chamar, refazer = false }) {
  const { data: ja, error } = await supabase.from(TABELA_NARRADOS).select('*').eq('data', data).maybeSingle();
  if (error) throw new Error(`${TABELA_NARRADOS}: ${error.message} (rode a migração 0028)`);
  if (ja && !refazer) return ja;
  // Assunto próprio, diferente do carrossel do dia (temaDoNarrado), com o item
  // tirado longe de onde a série do carrossel está (indiceDoNarrado).
  const tema = temaDoNarrado(data);
  const { data: serieRow } = await supabase.from('social_series').select('proximo').eq('serie', tema).maybeSingle();
  const dados = dadosDoDia(data, indiceDoNarrado(data, tema, serieRow?.proximo ?? 0), tema);
  const fechamento = fechamentoDoDia(data, { comentarios: chaveLigada(process.env.SOCIAL_RESPOSTAS) });
  const { roteiro, revisao } = await gerarRoteiroReels(dados, { chamar, fechamento });
  if (!roteiro) {
    const motivo = [revisao.geracao, ...revisao.rodadas.filter((r) => typeof r === 'string'), ...(revisao.checagem || [])].filter(Boolean).join('; ');
    throw new Error(`roteiro narrado reprovado (${motivo.slice(0, 300) || 'IA'})`);
  }
  const linha = {
    data, tema: dados.tema, roteiro, fonte: roteiro.fonte, revisao, texto: textoNarrado(roteiro),
    // roteiro novo = narração nova
    audio_caminho: null, palavras: null, duracao: null, narrado_em: null, gerado_em: new Date().toISOString(),
  };
  const { error: e2 } = await supabase.from(TABELA_NARRADOS).upsert(linha, { onConflict: 'data' });
  if (e2) throw new Error(`${TABELA_NARRADOS}: ${e2.message}`);
  return linha;
}

/** Caracteres já narrados no mês (trava de custo do ElevenLabs). */
export async function usoDoMes(supabase, mes) {
  const { data, error } = await supabase.from('social_narracao_uso').select('caracteres').eq('mes', mes);
  if (error) throw new Error(`social_narracao_uso: ${error.message} (rode a migração 0028)`);
  return (data || []).reduce((s, r) => s + (Number(r.caracteres) || 0), 0);
}

/**
 * Narração do roteiro (ElevenLabs), uma vez por texto: com o MP3 já no bucket,
 * devolve o que tem. Lança se passar do limite do mês ou se o ElevenLabs falhar.
 */
export async function garantirNarracao({ supabase, linha, fetchFn, agora = Date.now() }) {
  if (linha.audio_caminho && Array.isArray(linha.palavras) && linha.palavras.length) return linha;
  if (!narracaoConfigurada()) throw new Error('ELEVENLABS_API_KEY ou ELEVENLABS_VOICE_ID não configurada');
  const mes = mesBrasilia(agora);
  const usado = await usoDoMes(supabase, mes);
  const limite = limiteMensal();
  if (!cabeNoLimite({ usado, texto: linha.texto, limite })) {
    throw new Error(`limite do ElevenLabs do mês atingido (${usado} de ${limite} caracteres; ELEVENLABS_LIMITE_MES)`);
  }
  const n = await narrar({ texto: linha.texto, ...(fetchFn && { fetchFn }) });
  // conta já: o ElevenLabs cobrou, mesmo que algo falhe daqui pra frente
  const { error: eUso } = await supabase.from('social_narracao_uso').insert({ mes, data: linha.data, caracteres: n.caracteres });
  if (eUso) console.error('⚠️ social_narracao_uso:', eUso.message);
  const palavras = palavrasDoAlinhamento(n.alinhamento);
  if (palavras.length < 10) throw new Error('a narração voltou sem o tempo das palavras');
  const caminho = caminhoDaNarracao(linha.data, linha.texto);
  const { error: eUp } = await supabase.storage.from(bucketReels()).upload(caminho, n.audio, { contentType: 'audio/mpeg', upsert: true });
  if (eUp) throw new Error(`Supabase Storage (MP3): ${eUp.message} (o bucket "${bucketReels()}" aceita audio/mpeg? migração 0028)`);
  const atualiza = { audio_caminho: caminho, palavras, duracao: n.duracao, narrado_em: new Date(agora).toISOString() };
  const { error: e2 } = await supabase.from(TABELA_NARRADOS).update(atualiza).eq('data', linha.data);
  if (e2) throw new Error(`${TABELA_NARRADOS}: ${e2.message}`);
  return { ...linha, ...atualiza };
}

// ── Reels interativo (SOCIAL_REELS_INTERATIVO=on, migração 0029) ──────────
// "Escolhe uma carta" (ter e sáb), "Pausa o vídeo" (qua), "Ache seu número"
// (seg); nos outros dias, o narrado. Roteiro das tabelas do site (sem IA,
// lib/reelsInterativo.js) → 1 narração por trecho (a fala antes do contador,
// a revelação depois) → linha do tempo (quando cada carta vira, cada número
// acende). Qualquer falha = o dia sai no narrado e, se ele falhar, no card.

export const interativoLigado = () => chaveLigada(process.env.SOCIAL_REELS_INTERATIVO);
export const TABELA_INTERATIVOS = 'social_reels_interativos';
export const FONTES_INTERATIVO = {
  arcanos: ARCANOS_MAIORES, temasSeuDia: TEMAS_SEU_DIA, numeroProfundo: NUMERO_PROFUNDO,
  fraseDoDia: (data) => fraseDoDia(data), creditoDaFrase, creditoFalado,
};
/** MP3 de um trecho do interativo no bucket (raiz: a limpeza de 7 dias pega junto). */
export const caminhoDoTrecho = (data, id, texto) => `${data}-interativo-${id}-${hashCurto(texto)}.mp3`;

/**
 * O Reels interativo do dia pronto pra filmar: roteiro + 1 MP3 por trecho +
 * linha do tempo, guardados em social_reels_interativos. Trecho já narrado
 * com o mesmo texto não é narrado de novo (o ElevenLabs cobra por caractere).
 * Lança se a migração faltar, passar do limite do mês ou o ElevenLabs falhar.
 */
export async function garantirInterativo({ supabase, data, formato = formatoDoDia(data), fetchFn, agora = Date.now() }) {
  if (!FORMATOS_INTERATIVOS.includes(formato)) throw new Error(`"${formato}" não é formato interativo`);
  const { data: ja, error } = await supabase.from(TABELA_INTERATIVOS).select('*').eq('data', data).maybeSingle();
  if (error) throw new Error(`${TABELA_INTERATIVOS}: ${error.message} (rode a migração 0029)`);
  const roteiro = roteiroInterativo(data, formato, FONTES_INTERATIVO);
  const texto = textoDoRoteiro(roteiro);
  if (ja?.formato === formato && ja.texto === texto && ja.linha?.palavras?.length && ja.segmentos?.length === roteiro.segmentos.length) return ja;

  const antigos = ja?.formato === formato && Array.isArray(ja.segmentos) ? ja.segmentos : [];
  const trechos = roteiro.segmentos.map((seg) => {
    const t = textoDoSegmento(seg);
    const caminho = caminhoDoTrecho(data, seg.id, t);
    const pronto = antigos.find((a) => a.id === seg.id && a.audio_caminho === caminho && a.palavras?.length);
    return { seg, texto: t, caminho, pronto };
  });
  const falta = trechos.filter((x) => !x.pronto);
  if (falta.length) {
    if (!narracaoConfigurada()) throw new Error('ELEVENLABS_API_KEY ou ELEVENLABS_VOICE_ID não configurada');
    const mes = mesBrasilia(agora);
    const usado = await usoDoMes(supabase, mes);
    const limite = limiteMensal();
    if (!cabeNoLimite({ usado, texto: falta.map((x) => x.texto).join(' '), limite })) {
      throw new Error(`limite do ElevenLabs do mês atingido (${usado} de ${limite} caracteres; ELEVENLABS_LIMITE_MES)`);
    }
  }
  const base = { data, formato, roteiro, texto, gerado_em: ja?.texto === texto ? ja.gerado_em : new Date(agora).toISOString() };
  const segmentos = trechos.filter((x) => x.pronto).map((x) => x.pronto);
  for (const x of falta) {
    const n = await narrar({ texto: x.texto, ...(fetchFn && { fetchFn }) });
    const { error: eUso } = await supabase.from('social_narracao_uso').insert({ mes: mesBrasilia(agora), data, caracteres: n.caracteres });
    if (eUso) console.error('⚠️ social_narracao_uso:', eUso.message);
    const palavras = palavrasDoAlinhamento(n.alinhamento);
    if (palavras.length < 3) throw new Error(`a narração do trecho "${x.seg.id}" voltou sem o tempo das palavras`);
    const { error: eUp } = await supabase.storage.from(bucketReels()).upload(x.caminho, n.audio, { contentType: 'audio/mpeg', upsert: true });
    if (eUp) throw new Error(`Supabase Storage (MP3): ${eUp.message} (o bucket "${bucketReels()}" aceita audio/mpeg? migração 0028)`);
    segmentos.push({ id: x.seg.id, audio_caminho: x.caminho, duracao: n.duracao, palavras });
    // guarda trecho a trecho: se o próximo falhar, este não é cobrado de novo
    const { error: eParcial } = await supabase.from(TABELA_INTERATIVOS).upsert({ ...base, segmentos, linha: null, narrado_em: null, publicado_em: null }, { onConflict: 'data' });
    if (eParcial) throw new Error(`${TABELA_INTERATIVOS}: ${eParcial.message}${formato === 'frase' ? ' (o formato frase vem da migração 0030)' : ''}`);
  }
  const ordenados = roteiro.segmentos.map((seg) => segmentos.find((x) => x.id === seg.id));
  const linha = linhaDoTempo(roteiro, ordenados);
  const pronta = { ...base, segmentos: ordenados, linha, narrado_em: new Date(agora).toISOString(), publicado_em: null };
  const { error: e2 } = await supabase.from(TABELA_INTERATIVOS).upsert(pronta, { onConflict: 'data' });
  if (e2) throw new Error(`${TABELA_INTERATIVOS}: ${e2.message}`);
  return pronta;
}

/** O que a página do interativo precisa pra filmar (o workflow entrega por window.__carregar). */
export function narracaoDoInterativo(supabase, row) {
  const url = (c) => supabase.storage.from(bucketReels()).getPublicUrl(c)?.data?.publicUrl || null;
  return {
    formato: row.formato,
    cena: row.roteiro.cena,
    eventos: row.linha.eventos,
    palavras: row.linha.palavras,
    duracao: row.linha.duracao,
    vozes: row.linha.vozes.map((v) => ({ id: v.id, inicio: v.inicio, audio: url(row.segmentos.find((x) => x.id === v.id).audio_caminho) })),
  };
}

/**
 * O que o workflow do GitHub tem que fazer hoje: a página da animação
 * (assinada), a trilha e uma URL de upload assinada do Supabase Storage. Ou
 * { pular } se não há nada a fazer.
 * Com SOCIAL_REELS_NARRADO=on: roteiro + narração prontos → { narrado: true,
 * pagina (modo narrado), duracao (fala + ~1s), narracao: { audio, palavras } };
 * se algo falhar, o trabalho do card de 9s, com `aviso` (e e-mail 1x por dia).
 * Com SOCIAL_REELS_INTERATIVO=on, nos dias de carta/pausa/número (rodízio de
 * lib/reelsInterativo.js): { narrado: true, interativo: <formato>, pagina
 * (modo interativo), narracao: { vozes: [{ audio, inicio }], palavras,
 * eventos, cena } }; nos outros dias, o narrado (a chave liga os dois). Falha
 * no interativo = narrado, com `aviso` (e e-mail 1x por dia); falha nos dois =
 * card de 9s.
 * `card` força o card (o workflow pede isso se o vídeo narrado falhar lá);
 * `semInterativo` pula o interativo (o workflow pede se o vídeo dele falhar).
 * `previa` (workflow com previa=sim): sem as travas de publicação, vídeo em
 * "AAAA-MM-DD-previa.mp4"; o workflow não publica. Formato = o do rodízio do
 * dia, ou `formato` (carta, pausa, numero ou narrado) pra ver qualquer um.
 */
export async function trabalhoDoReels({ supabase, data, baseUrl, segredo, card = false, semInterativo = false, previa = false, formato = null, chamar, fetchFn }) {
  if (!previa) {
    if (motorReels() !== 'github') return { pular: `SOCIAL_REELS não está no modo GitHub (valor: ${process.env.SOCIAL_REELS || 'vazio'})` };
    if (!redesLigadas(process.env.SOCIAL_AUTOMACAO).includes('instagram')) return { pular: 'automação do Instagram desligada (SOCIAL_AUTOMACAO)' };
    const { data: ja, error } = await supabase.from('social_posts').select('status, tentativas').eq('data', data).eq('rede', 'instagram').eq('tipo', 'reels').maybeSingle();
    if (error) throw new Error(`social_posts: ${error.message}`);
    if (ja?.status === 'ok') return { pular: `o Reels de ${data} já foi publicado` };
    if (ja?.status === 'aguardando') return { pular: `o Reels de ${data} já está com o Instagram, processando` };
    if (ja?.status === 'erro' && (ja.tentativas || 1) >= MAX_TENTATIVAS) return { pular: `o Reels de ${data} falhou ${MAX_TENTATIVAS} vezes` };
  }

  const row = await garantirConteudoDoDia(supabase, data, chamar ? { chamar } : undefined);
  const caminho = previa ? caminhoDaPrevia(data) : caminhoDoReels(data, row.versao);
  const { data: up, error: e2 } = await supabase.storage.from(bucketReels()).createSignedUploadUrl(caminho, { upsert: true });
  if (e2 || !up?.signedUrl) throw new Error(`Supabase Storage: ${e2?.message || 'sem URL de upload'} (o bucket "${bucketReels()}" existe? migração 0026)`);
  if (!previa) await limparReelsAntigos(supabase, data);

  const pagina = (formato, extra = {}) => {
    const q = new URLSearchParams();
    if (row.indice != null) q.set('i', String(row.indice));
    if (row.versao) q.set('v', row.versao);
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    q.set('t', assinarImagem({ data, formato, indice: row.indice, v: row.versao || '' }, segredo));
    return `${baseUrl}/social/reels/${data}?${q.toString()}`;
  };
  const trabalho = {
    data, ...REELS, narrado: false,
    pagina: pagina('reels'),
    trilha: trilhaDoDia(data),
    // a anon key é pública (já vai no JS do site); o que autoriza o upload é o token da URL
    upload: { url: up.signedUrl, caminho, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null },
    ...(previa && { previa: true }),
  };
  if (card) return trabalho;

  const formatoDia = previa && formato ? formato : formatoDoReel(data, { frase: fraseLigada() });
  // a frase do dia tem chave própria; carta, pausa e número, a do interativo
  const ligado = formatoDia === 'frase' ? fraseLigada() : interativoLigado();
  const avisos = [];
  if (!semInterativo && FORMATOS_INTERATIVOS.includes(formatoDia) && (previa || ligado)) {
    try {
      const row = await garantirInterativo({ supabase, data, formato: formatoDia, fetchFn });
      return {
        ...trabalho,
        narrado: true,
        interativo: row.formato,
        duracao: row.linha.duracao,
        pagina: pagina('reels-interativo', { n: '2' }),
        narracao: narracaoDoInterativo(supabase, row),
      };
    } catch (err) {
      if (previa) throw err;
      const msg = String(err?.message || err).slice(0, 500);
      const nome = NOME_FORMATO[formatoDia];
      const destino = narradoLigado() || interativoLigado() ? 'o narrado' : 'o card de 9s';
      await avisarUmaVezPorDia(supabase, 'reels-interativo', data, [{ rede: 'instagram', tipo: `reels ${nome}`, erro: `${msg}. Saiu ${destino}.` }], `Reels "${nome}" caiu n${destino}`);
      avisos.push(`${formatoDia === 'frase' ? 'frase do dia' : 'interativo'} falhou, foi pr${destino}: ${msg}`);
    }
  }
  if (!(previa || narradoLigado() || interativoLigado())) return { ...trabalho, ...(avisos.length && { aviso: avisos.join(' | ') }) };

  try {
    const linha = await garantirNarracao({ supabase, linha: await garantirRoteiroNarrado({ supabase, data, chamar }), fetchFn });
    const { data: pub } = supabase.storage.from(bucketReels()).getPublicUrl(linha.audio_caminho);
    return {
      ...trabalho,
      narrado: true,
      duracao: duracaoDoVideo(linha.palavras, REELS.fps),
      pagina: pagina('reels-narrado', { n: '1' }),
      narracao: { audio: pub?.publicUrl, palavras: linha.palavras, duracao: Number(linha.duracao) },
      ...(avisos.length && { aviso: avisos.join(' | ') }),
    };
  } catch (err) {
    if (previa) throw err;
    const msg = String(err?.message || err).slice(0, 500);
    await avisarUmaVezPorDia(supabase, 'reels-narrado', data, [{ rede: 'instagram', tipo: 'reels narrado', erro: `${msg}. Saiu o card de 9s.` }], 'Reels narrado caiu no card de 9s');
    return { ...trabalho, aviso: [...avisos, `narrado falhou, saiu o card de 9s: ${msg}`].join(' | ') };
  }
}

/**
 * O workflow subiu o MP4: cria o container REELS no Instagram com a URL
 * pública do vídeo. Trava de 1 por dia (social_posts); a publicação final é do
 * avancarReels (quando o Instagram termina de processar).
 */
export async function publicarReelsDoArquivo({ supabase, data, caminho, narrado = false, interativo = null }) {
  if (!new RegExp(`^${data}-[0-9a-z]{1,16}\\.mp4$`).test(caminho || '')) throw new Error('caminho do vídeo inválido');
  if (caminho === caminhoDaPrevia(data)) throw new Error('vídeo de prévia não vai pro Instagram');
  const { data: pub } = supabase.storage.from(bucketReels()).getPublicUrl(caminho);
  const videoUrl = pub?.publicUrl;
  const head = await fetch(videoUrl, { method: 'HEAD' }).catch(() => null);
  if (!head?.ok) throw new Error(`o vídeo não está no bucket (HTTP ${head?.status ?? 'sem resposta'})`);

  const row = await garantirConteudoDoDia(supabase, data);
  // Narrado: a legenda é a do roteiro (com a chamada e as hashtags do tema).
  let legenda = row.conteudo.legenda;
  if (narrado) {
    const { data: n } = await supabase.from(TABELA_NARRADOS).select('roteiro').eq('data', data).maybeSingle();
    if (n?.roteiro?.legenda?.gancho) legenda = { gancho: n.roteiro.legenda.gancho, texto: n.roteiro.legenda.texto || [], hashtags: row.conteudo.legenda?.hashtags || [] };
  }
  // Interativo: a legenda do formato (pede o comentário) e a marca de que este
  // Reels saiu interativo (publicado_em), que liga o bot de "1/2/3" e "1–9" nele.
  let interativoRow = null;
  if (interativo) {
    if (!FORMATOS_INTERATIVOS.includes(interativo)) throw new Error('formato interativo inválido');
    const { data: r } = await supabase.from(TABELA_INTERATIVOS).select('data, formato, roteiro').eq('data', data).maybeSingle();
    if (r?.formato === interativo && r.roteiro) {
      interativoRow = r;
      legenda = legendaInterativa(r.roteiro, { respostas: chaveLigada(process.env.SOCIAL_RESPOSTAS) });
    }
  }
  const linha = { data, rede: 'instagram', tipo: 'reels', tema: row.tema, serie: row.serie, indice: row.indice, item: row.item };
  if (!(await reivindicar(supabase, linha))) return { pulado: 'já publicado ou em andamento' };
  try {
    const ig = await tokenInstagram(supabase);
    const container = await criarContainerReels({ token: ig.token, modo: ig.modo, videoUrl, legenda: montarLegenda(legenda) });
    await registrar(supabase, linha, { status: 'aguardando', etapa: 'container', externo_id: container, erro: null });
    // rótulo do formato pros insights da prévia (coluna da 0030; sem ela, segue sem rótulo)
    const formato = interativo || (narrado ? 'narrado' : 'card');
    const { error: eFormato } = await supabase.from('social_posts').update({ formato }).eq('data', data).eq('rede', 'instagram').eq('tipo', 'reels');
    if (eFormato) console.warn('⚠️ social_posts.formato (migração 0030):', eFormato.message);
    if (interativoRow) {
      const { error: eMarca } = await supabase.from(TABELA_INTERATIVOS).update({ publicado_em: new Date().toISOString() }).eq('data', data);
      if (eMarca) console.error('⚠️ social_reels_interativos.publicado_em:', eMarca.message);
    }
    return { ok: true, container, videoUrl };
  } catch (err) {
    const msg = String(err?.message || err).slice(0, 800);
    await registrar(supabase, linha, { status: 'erro', erro: msg });
    await avisarErro(data, [{ rede: 'instagram', tipo: 'reels', erro: msg }], 'Reels automático falhou');
    throw err;
  }
}

/** Hora (0–23) em Brasília. */
const horaBrasilia = (agora) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' }).format(agora));
export const HORA_COBRAR_REELS = 12;
// A partir desta hora, o cron da hora dispara o workflow do Reels se ele ainda
// não saiu (lib/githubActions.js; o agendamento do GitHub não é confiável).
export const HORA_DISPARAR_REELS = 7;

// ── Frase do dia (SOCIAL_FRASE_DO_DIA=on, migração 0030) ───────────────────
// Story às 21h (pelo cron da hora, a partir do disparo das 21h) e o Reel
// narrado da sexta (formato 'frase' do interativo). Frase da tabela fixa de
// lib/frases.js, só as verificadas; a mesma no Story e no Reel do dia.

export const fraseLigada = () => chaveLigada(process.env.SOCIAL_FRASE_DO_DIA);
export const HORA_STORY_FRASE = 21;

/** URL assinada do Story da frase (o índice da frase na tabela vai na URL). */
export function urlStoryFrase(baseUrl, segredo, data, f) {
  const v = versaoConteudo({ id: f.id, frase: f.frase, credito: creditoDaFrase(f) });
  return urlImagem(baseUrl, segredo, { data, formato: 'frase', indice: FRASES.indexOf(f), v });
}

/**
 * Posta o Story da frase do dia no Instagram. 1 por dia (trava `story_frase`
 * em social_posts), até 3 tentativas como os outros posts. Lança se a trava
 * não existir (migração 0030).
 */
export async function postarStoryFrase({ supabase, data, baseUrl, segredo }) {
  const f = fraseDoDia(data);
  if (!f) return { pulado: 'nenhuma frase verificada em lib/frases.js' };
  const linha = { data, rede: 'instagram', tipo: 'story_frase', tema: 'frase', serie: null, indice: FRASES.indexOf(f), item: f.id };
  let minha;
  try {
    minha = await reivindicar(supabase, linha);
  } catch (err) {
    throw new Error(`${err.message} (o tipo story_frase vem da migração 0030)`);
  }
  if (!minha) return { pulado: 'já postado ou em andamento' };
  try {
    const ig = await tokenInstagram(supabase);
    const url = urlStoryFrase(baseUrl, segredo, data, f);
    await conferirImagem(url);
    const { id } = await publicarNoInstagram({ token: ig.token, modo: ig.modo, tipo: 'story', imageUrl: url });
    await registrar(supabase, linha, { status: 'ok', post_id: id, erro: null });
    return { ok: true, post_id: id, frase: f.id };
  } catch (err) {
    const msg = String(err?.message || err).slice(0, 800);
    await registrar(supabase, linha, { status: 'erro', erro: msg });
    return { erro: msg, frase: f.id };
  }
}

/** O que roda de hora em hora: termina Reels pendentes, responde comentários e, a partir das 21h, o Story da frase. */
export async function tarefasDaHora({ supabase, data, agora = new Date(), baseUrl = getBaseUrl(), segredo = process.env.CRON_SECRET, github = configGithub(), fetchGithub = globalThis.fetch }) {
  const reels = await avancarReels({ supabase, avisar: false });
  let disparo = null;
  if (motorReels() === 'github' && horaBrasilia(agora) >= HORA_DISPARAR_REELS) {
    const { data: hoje } = await supabase.from('social_posts').select('status').eq('data', data).eq('rede', 'instagram').eq('tipo', 'reels').maybeSingle();
    if (!hoje) {
      // Ainda não saiu: o site dispara o workflow (o agendamento do GitHub atrasa ou pula).
      try {
        disparo = await dispararReelsSePreciso({ config: github, hoje: data, fetchImpl: fetchGithub });
      } catch (err) {
        disparo = { disparado: false, erro: String(err?.message || err).slice(0, 300) };
      }
      // Até o meio-dia sem Reels: avisa por e-mail (1x por dia).
      if (horaBrasilia(agora) >= HORA_COBRAR_REELS) {
        const dica = !github
          ? ' Configure GITHUB_TOKEN_REELS na Vercel pra o site disparar o workflow sozinho.'
          : disparo?.erro ? ` O disparo pelo site falhou: ${disparo.erro}` : '';
        reels.erros.push({ rede: 'instagram', tipo: 'reels', erro: `o Reels de hoje não chegou do GitHub Actions. Veja a aba Actions do repositório (workflow "Reels diário").${dica}` });
      }
    }
  }
  let comentarios = null;
  if (chaveLigada(process.env.SOCIAL_RESPOSTAS)) {
    try {
      comentarios = await responderComentarios({ supabase });
    } catch (err) {
      comentarios = { respondidas: 0, erros: [{ rede: 'instagram', tipo: 'comentários', erro: err.message }] };
    }
  }
  let frase = null;
  if (fraseLigada() && horaBrasilia(agora) >= HORA_STORY_FRASE) {
    try {
      frase = await postarStoryFrase({ supabase, data, baseUrl, segredo });
    } catch (err) {
      frase = { erro: String(err?.message || err).slice(0, 500) };
    }
  }
  await avisarUmaVezPorDia(supabase, 'reels', data, reels.erros, 'Reels automático falhou');
  await avisarUmaVezPorDia(supabase, 'comentarios', data, comentarios?.erros || [], 'Resposta automática a comentários falhou');
  if (frase?.erro) await avisarUmaVezPorDia(supabase, 'frase', data, [{ rede: 'instagram', tipo: 'story da frase do dia', erro: frase.erro }], 'Story da frase do dia falhou');
  return { reels, disparo, comentarios, frase };
}

// ── Desempenho dos Reels (prévia) ──────────────────────────────────────────

const DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Desempenho dos Reels publicados nos últimos `dias`, por dia da semana (e o
 * formato de cada dia, quando a migração 0030 já gravou). Média por Reels de
 * cada métrica de METRICAS_REELS. Pra decidir o rodízio com dado, não com
 * palpite. { linhas, reels, erro? }; erro = sem permissão de insights etc.
 */
export async function desempenhoDosReels({ supabase, dias = 56, hoje = hojeBrasilia(), maxReels = 60 }) {
  const desde = somarDias(hoje, -dias);
  let { data: posts, error } = await supabase.from('social_posts').select('data, post_id, formato')
    .eq('rede', 'instagram').eq('tipo', 'reels').eq('status', 'ok').gte('data', desde);
  if (error && /formato/.test(error.message)) {
    ({ data: posts, error } = await supabase.from('social_posts').select('data, post_id')
      .eq('rede', 'instagram').eq('tipo', 'reels').eq('status', 'ok').gte('data', desde));
  }
  if (error) return { linhas: [], reels: 0, erro: `social_posts: ${error.message}` };
  const lista = (posts || []).filter((p) => p.post_id).sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, maxReels);
  if (!lista.length) return { linhas: [], reels: 0 };
  const ig = await tokenInstagram(supabase);
  const medidos = [];
  let erro = null;
  for (let i = 0; i < lista.length; i += 5) {
    const lote = await Promise.all(lista.slice(i, i + 5).map(async (p) => {
      try {
        return { ...p, m: await insightsDaMidia({ token: ig.token, modo: ig.modo, midia: p.post_id }) };
      } catch (err) {
        erro ||= err.message;
        return null;
      }
    }));
    medidos.push(...lote.filter(Boolean));
    if (!medidos.length && erro) break; // sem permissão: não insiste
  }
  const porDia = new Map();
  for (const p of medidos) {
    const dia = new Date(`${p.data}T12:00:00Z`).getUTCDay();
    if (!porDia.has(dia)) porDia.set(dia, { dia, nome: DIAS_DA_SEMANA[dia], reels: 0, formatos: new Map(), soma: {} });
    const g = porDia.get(dia);
    g.reels += 1;
    const f = p.formato || 'sem rótulo';
    g.formatos.set(f, (g.formatos.get(f) || 0) + 1);
    for (const k of METRICAS_REELS) g.soma[k] = (g.soma[k] || 0) + (Number(p.m[k]) || 0);
  }
  const linhas = [...porDia.values()].sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7)).map((g) => ({
    dia: g.dia, nome: g.nome, reels: g.reels,
    formatos: [...g.formatos].map(([f, n]) => `${f}${n > 1 ? ` ×${n}` : ''}`).join(', '),
    media: Object.fromEntries(METRICAS_REELS.map((k) => [k, Math.round((g.soma[k] || 0) / g.reels)])),
  }));
  return { linhas, reels: medidos.length, ...(erro && { erro }) };
}

// ── Prévia ─────────────────────────────────────────────────────────────────

/**
 * Os n dias a partir de `inicio`: o conteúdo guardado (se já foi gerado) ou o
 * plano com o texto de reserva, andando as séries a partir do banco.
 */
export async function planoDaPrevia(supabase, inicio, n) {
  let estado = {};
  let aviso = null;
  let guardados = [];
  if (supabase) {
    const r = await lerEstadoSeries(supabase);
    estado = r.estado;
    if (r.erro) aviso = 'Sem a tabela social_series (migração 0024): as séries começam do primeiro item.';
    const datas = Array.from({ length: n }, (_, k) => somarDias(inicio, k));
    const { data: rows, error } = await supabase.from('social_conteudos').select('*').in('data', datas);
    if (error) aviso = `${aviso ? `${aviso} ` : ''}Sem a tabela social_conteudos (migração 0025): a prévia mostra o texto de reserva.`;
    guardados = rows || [];
  } else {
    aviso = 'Supabase não configurado: a prévia mostra o texto de reserva, com as séries do primeiro item.';
  }
  const dias = planoDosDias(inicio, n, estado).map((d) => {
    const row = guardados.find((r) => r.data === d.data);
    const dados = dadosDoDia(d.data, row?.indice ?? d.indice);
    const conteudo = row?.conteudo || reservaDoDia(dados);
    return { ...d, indice: dados.indice, dados, conteudo, versao: row?.versao || '', fonte: row ? conteudo.fonte : 'reserva (ainda não gerado)', revisao: row?.revisao || null, aprovacao: row?.tiktok_aprovacao || null };
  });
  return { dias, aviso };
}
