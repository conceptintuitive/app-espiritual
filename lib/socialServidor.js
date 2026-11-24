// lib/socialServidor.js — banco, geração, publicação e avisos da automação
// social. SÓ SERVIDOR. Conteúdo: lib/social.js (dados + reserva) e
// lib/socialIA.js (texto da IA). Tabelas: migrações 0024 (social_posts,
// social_series, social_tokens) e 0025 (social_conteudos, social_respostas,
// social_alertas, colunas do Reels).
//
// Quem chama:
//   app/api/cron/social-semana  gerarSemana       (domingo: a semana seguinte)
//   app/api/cron/social         postarDia         (7h: story, carrossel, TikTok, início do Reels)
//   app/api/cron/social-hora    avancarReels + responderComentarios (de hora em hora)
//   app/api/social/imagem       conteudoParaArte  (as artes)
//   app/api/social/previa       planoDaPrevia

import { Resend } from 'resend';
import {
  temaDoDia, serieDoTema, dadosDoDia, reservaDoDia, montarLegenda, tituloCurto, caminhoImagem, planoDosDias,
  somarDias, versaoConteudo, chaveLigada, hojeBrasilia,
} from './social.js';
import { gerarConteudoDoDia } from './socialIA.js';
import {
  tokenInstagram, publicarNoInstagram, publicarCarrossel, criarContainerReels, statusContainer, publicarContainer,
  midiasRecentes, comentariosDaMidia, responderComentario,
} from './instagram.js';
import { getValidAccessToken, getStoredTokens } from './tiktokOAuth.js';
import { enviarFotoProInbox, postarFotoDireto } from './tiktokContentPosting.js';
import { roteiroReels, trilhaDoDia, iniciarRender, consultarRender } from './socialReels.js';
import { decidirResposta } from './socialComentarios.js';

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

  const avisos = feitos.filter((f) => f.fonte === 'reserva' || f.erro).map((f) => ({
    rede: 'geração', tipo: `${f.data} ${f.tema}`,
    erro: f.erro || `saiu com o texto de reserva (${[f.revisao?.geracao, ...[].concat(f.revisao?.revisao || []).filter((r) => typeof r === 'string'), ...(f.revisao?.checagem || [])].filter(Boolean).join('; ') || 'IA reprovada'})`,
  }));
  await avisarErro(inicio, avisos, 'Geração da semana');
  return { gerados: feitos, pulados: datas.length - tarefas.length };
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
 * ou Direct Post se aprovado na tela /admin/tiktok e TIKTOK_DIRECT_POST=on) e
 * começa o Reels (SOCIAL_REELS=on). Idempotente por (dia, rede, tipo).
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
  if (redes.includes('instagram') && chaveLigada(process.env.SOCIAL_REELS)) tarefas.push({ rede: 'instagram', tipo: 'reels' });

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
 * Responde comentários com data de nascimento nos posts dos últimos 7 dias.
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
      const dec = decidirResposta({ id: c.id, texto: c.texto, proprio: !!proprioId && c.de === proprioId }, hoje);
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

/** O que roda de hora em hora: termina Reels pendentes e responde comentários. */
export async function tarefasDaHora({ supabase, data }) {
  const reels = await avancarReels({ supabase, avisar: false });
  let comentarios = null;
  if (chaveLigada(process.env.SOCIAL_RESPOSTAS)) {
    try {
      comentarios = await responderComentarios({ supabase });
    } catch (err) {
      comentarios = { respondidas: 0, erros: [{ rede: 'instagram', tipo: 'comentários', erro: err.message }] };
    }
  }
  await avisarUmaVezPorDia(supabase, 'reels', data, reels.erros, 'Reels automático falhou');
  await avisarUmaVezPorDia(supabase, 'comentarios', data, comentarios?.erros || [], 'Resposta automática a comentários falhou');
  return { reels, comentarios };
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
