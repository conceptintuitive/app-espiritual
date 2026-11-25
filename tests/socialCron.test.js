// Testes do lado servidor da automação social (lib/socialServidor.js,
// lib/socialIA.js, lib/instagram.js) com Supabase, Instagram, Creatomate e IA
// falsos, em memória — `npm test`.
// Foco: 1 post por rede por dia mesmo com o cron rodando 2x, retentativa com o
// mesmo item, série andando 1 vez, carrossel, Reels em etapas, comentários
// respondidos 1 vez (guardando só o id), geração da semana com revisão.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { postarDia, reivindicar, avancarReels, responderComentarios, gerarSemana, tarefasDaHora, motorReels, trabalhoDoReels, publicarReelsDoArquivo, caminhoDoReels } from '../lib/socialServidor.js';
import { conferirAssinatura } from '../lib/social.js';
import { gerarConteudoDoDia } from '../lib/socialIA.js';
import { precisaRenovar, tokenInstagram, hashToken, modoInstagram, conferirContaInstagram, publicarNoInstagram } from '../lib/instagram.js';
import { dadosDoDia } from '../lib/social.js';

// ── Supabase falso (só o que a automação usa) ──────────────────────────────
const CHAVES = { social_posts: ['data', 'rede', 'tipo'], social_series: ['serie'], social_tokens: ['rede'], social_conteudos: ['data'], social_respostas: ['comentario_id'], social_alertas: ['chave'], social_reels_narrados: ['data'], social_narracao_uso: [], social_reels_interativos: ['data'] };
class Q {
  constructor(db, t) { Object.assign(this, { db, t, f: [], op: 'select', unico: false }); }
  select() { return this; }
  insert(row) { this.op = 'insert'; this.row = row; return this; }
  update(v) { this.op = 'update'; this.vals = v; return this; }
  upsert(row, o = {}) { this.op = 'upsert'; this.row = row; this.ign = o.ignoreDuplicates; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.f.push((r) => r[c] === v); return this; }
  in(c, vs) { this.f.push((r) => vs.includes(r[c])); return this; }
  not(c) { this.f.push((r) => r[c] != null); return this; }
  lt(c, v) { this.f.push((r) => r[c] < v); return this; }
  gte(c, v) { this.f.push((r) => r[c] >= v); return this; }
  or(expr) {
    const m = /^status\.eq\.erro,and\(status\.eq\.enviando,updated_at\.lt\.(.+)\)$/.exec(expr);
    assert.ok(m, `or() inesperado: ${expr}`);
    this.f.push((r) => r.status === 'erro' || (r.status === 'enviando' && r.updated_at < m[1]));
    return this;
  }
  order() { return this; }
  limit() { return this; }
  maybeSingle() { this.unico = true; return this; }
  then(ok, falha) { return Promise.resolve().then(() => this.exec()).then(ok, falha); }
  exec() {
    const tab = this.db[this.t];
    if (!tab) return { data: null, error: { message: `relation "${this.t}" does not exist`, code: '42P01' } };
    const k = CHAVES[this.t];
    const mesma = (a, b) => k.length > 0 && k.every((c) => a[c] === b[c]);
    if (this.op === 'insert') {
      if (tab.some((r) => mesma(r, this.row))) return { data: null, error: { code: '23505', message: 'duplicate key' } };
      tab.push({ tentativas: 1, created_at: new Date().toISOString(), ...this.row });
      return { data: null, error: null };
    }
    if (this.op === 'upsert') {
      const i = tab.findIndex((r) => mesma(r, this.row));
      if (i >= 0) { if (!this.ign) tab[i] = { ...tab[i], ...this.row }; } else tab.push({ ...this.row });
      return { data: null, error: null };
    }
    const achados = tab.filter((r) => this.f.every((fn) => fn(r)));
    if (this.op === 'delete') { this.db[this.t] = tab.filter((r) => !achados.includes(r)); return { data: null, error: null }; }
    if (this.op === 'update') { for (const r of achados) Object.assign(r, this.vals); return { data: achados.map((r) => ({ ...r })), error: null }; }
    return { data: this.unico ? (achados[0] || null) : achados.map((r) => JSON.parse(JSON.stringify(r))), error: null };
  }
}
// Storage falso: bucket guardado em db.storage[bucket] = Set de caminhos
const SB = 'https://sb.teste/storage/v1';
const fakeStorage = (db) => ({
  from: (b) => ({
    createSignedUploadUrl: async (p, o = {}) => {
      if (!db.storage?.[b]) return { data: null, error: { message: 'Bucket not found' } };
      db.uploadsPedidos = [...(db.uploadsPedidos || []), { b, p, upsert: o.upsert }];
      return { data: { signedUrl: `${SB}/object/upload/sign/${b}/${p}?token=tok`, path: p, token: 'tok' }, error: null };
    },
    getPublicUrl: (p) => ({ data: { publicUrl: `${SB}/object/public/${b}/${p}` } }),
    list: async () => ({ data: [...(db.storage?.[b] || [])].map((name) => ({ name })), error: null }),
    remove: async (ps) => { for (const x of ps) db.storage[b].delete(x); return { data: ps, error: null }; },
    upload: async (p, corpo, o = {}) => {
      if (!db.storage?.[b]) return { data: null, error: { message: 'Bucket not found' } };
      if (db.mimesPermitidos && !db.mimesPermitidos.includes(o.contentType)) return { data: null, error: { message: `mime type ${o.contentType} is not supported` } };
      db.storage[b].add(p);
      db.uploadsFeitos = [...(db.uploadsFeitos || []), { b, p, tipo: o.contentType, bytes: corpo?.length }];
      return { data: { path: p }, error: null };
    },
  }),
});
const fakeSupabase = (db) => ({ from: (t) => new Q(db, t), storage: fakeStorage(db) });
let bancoAtual = null; // pro HEAD do vídeo saber o que tem no bucket

// ── Instagram, Creatomate e imagens falsos ─────────────────────────────────
const IG_ID = '17840000000000000';
let chamadas;
let falharPublish = 0;
let comentarios = [];
let renderStatus = 'rendering';
let elevenFalha = false;
const BASE = 'https://site.teste';
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  if (u.startsWith(`${BASE}/api/social/imagem/`)) { chamadas.imagens.push(u); return new Response(new Uint8Array([0xff, 0xd8]), { headers: { 'Content-Type': u.includes('.png') ? 'image/png' : 'image/jpeg' } }); }
  if (u.startsWith('https://api.elevenlabs.io/v1/text-to-speech/')) {
    const corpo = JSON.parse(opts.body);
    chamadas.eleven.push({ url: u, corpo, chave: opts.headers['xi-api-key'] });
    // elevenFalha: true = sempre; número N = só a N-ª chamada
    if (elevenFalha === true || elevenFalha === chamadas.eleven.length) return json({ detail: { status: 'invalid_api_key', message: 'Invalid API key' } }, 401);
    const chars = [...corpo.text];
    return json({
      audio_base64: Buffer.from('MP3-FALSO').toString('base64'),
      alignment: { characters: chars, character_start_times_seconds: chars.map((_, i) => i * 0.06), character_end_times_seconds: chars.map((_, i) => (i + 1) * 0.06) },
    });
  }
  if (u.startsWith('https://api.creatomate.com/v1/renders')) {
    if (opts.method === 'POST') { chamadas.renders.push(JSON.parse(opts.body)); return json([{ id: 'render-1', status: 'planned' }], 202); }
    return json({ id: 'render-1', status: renderStatus, url: renderStatus === 'succeeded' ? 'https://cdn.creatomate.com/render-1.mp4' : null });
  }
  if (u.includes('/refresh_access_token')) { chamadas.refresh++; return json({ access_token: 'token-renovado', expires_in: 5184000 }); }
  if (u.includes('/media_publish')) {
    if (falharPublish > 0) { falharPublish--; return json({ error: { message: 'Falha de teste', code: 9007 } }, 400); }
    chamadas.publicados.push(new URLSearchParams(opts.body).get('creation_id'));
    return json({ id: `post-${chamadas.publicados.length}` });
  }
  if (/\/replies$/.test(u.split('?')[0]) && opts.method === 'POST') {
    chamadas.respostas.push({ comentario: u.split('/').at(-2), mensagem: new URLSearchParams(opts.body).get('message') });
    return json({ id: `resp-${chamadas.respostas.length}` });
  }
  if (u.includes(`/${IG_ID}/media`) && opts.method === 'POST') {
    const p = new URLSearchParams(opts.body);
    chamadas.containers.push({ url: u, tipo: p.get('media_type') || (p.get('is_carousel_item') ? 'ITEM' : 'FEED'), imagem: p.get('image_url'), video: p.get('video_url'), filhos: p.get('children'), legenda: p.get('caption'), feed: p.get('share_to_feed'), token: p.get('access_token') });
    return json({ id: `cont-${chamadas.containers.length}` });
  }
  if (u.includes(`/${IG_ID}/media?`)) return json({ data: [{ id: 'midia-1', timestamp: new Date().toISOString(), comments_count: comentarios.length }, { id: 'midia-velha', timestamp: '2020-01-01T00:00:00+0000', comments_count: 5 }] });
  if (u.includes('/midia-1/comments')) return json({ data: comentarios });
  if (u.startsWith(`${SB}/object/public/`)) {
    const [, bucket, ...resto] = u.slice(`${SB}/object/public/`.length - 1).split('/');
    return new Response(null, { status: bancoAtual?.storage?.[bucket]?.has(resto.join('/')) ? 200 : 404 });
  }
  if (u.includes('fields=status_code')) return json({ status_code: 'FINISHED' });
  if (u.includes('fields=username')) {
    chamadas.conferencias.push(u);
    if (u.includes('access_token=token-invalido')) return json({ error: { message: 'Invalid OAuth access token', code: 190 } }, 400);
    return json({ username: 'conta_teste', id: IG_ID });
  }
  throw new Error(`fetch inesperado: ${u}`);
};

process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
process.env.INSTAGRAM_USER_ID = IG_ID;
process.env.CREATOMATE_API_KEY = 'chave-falsa';
delete process.env.RESEND_API_KEY;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.SOCIAL_REELS;

const novoDb = () => ({
  social_posts: [], social_tokens: [], social_conteudos: [], social_respostas: [], social_alertas: [],
  social_series: [{ serie: 'numero', proximo: 0 }, { serie: 'ponto_cego', proximo: 5 }, { serie: 'mente', proximo: 15 }, { serie: 'compat', proximo: 0 }, { serie: 'pensador', proximo: 0 }],
});
const rodar = (db, data, redes = ['instagram'], extra = {}) => postarDia({ supabase: fakeSupabase(db), data, redes, baseUrl: BASE, segredo: 'segredo', esperarReelsMs: 0, ...extra });

beforeEach(() => { chamadas = { imagens: [], containers: [], publicados: [], refresh: 0, conferencias: [], renders: [], respostas: [], eleven: [] }; falharPublish = 0; comentarios = []; renderStatus = 'rendering'; elevenFalha = false; });

test('segunda: story + carrossel de 6 telas; rodar 2x não posta de novo e a série anda 1 vez', async () => {
  const db = novoDb();
  const r1 = await rodar(db, '2026-11-30');
  assert.equal(r1.erros.length, 0, JSON.stringify(r1.erros));
  assert.equal(chamadas.publicados.length, 2);
  const tipos = chamadas.containers.map((c) => c.tipo);
  assert.deepEqual(tipos, ['STORIES', 'ITEM', 'ITEM', 'ITEM', 'ITEM', 'ITEM', 'ITEM', 'CAROUSEL']);
  const carrossel = chamadas.containers.at(-1);
  assert.equal(carrossel.filhos.split(',').length, 6);
  assert.ok(carrossel.legenda.startsWith('Se você é 1'));
  assert.match(chamadas.containers[1].imagem, /\/c1\.jpg\?i=0&v=[0-9a-f]+&t=/);
  assert.equal(chamadas.containers[0].legenda, null);
  assert.equal(db.social_series.find((s) => s.serie === 'numero').proximo, 1);
  assert.equal(db.social_conteudos.length, 1, 'o conteúdo do dia fica guardado');
  assert.equal(db.social_conteudos[0].fonte, 'reserva', 'sem IA configurada, usa a reserva');

  const r2 = await rodar(db, '2026-11-30');
  assert.equal(chamadas.publicados.length, 2, 'não postou de novo');
  assert.ok(r2.resultado.every((x) => x.pulado));
  assert.equal(db.social_series.find((s) => s.serie === 'numero').proximo, 1);
});

test('erro: retentativa usa o MESMO item; no máximo 3 tentativas', async () => {
  const db = novoDb();
  falharPublish = 1; // o 1º publish (story) falha
  const r1 = await rodar(db, '2026-12-01'); // terça: ponto cego, índice 5 = Virgem
  assert.equal(r1.erros.length, 1);
  assert.equal(db.social_posts.find((p) => p.tipo === 'feed').item, 'Virgem');
  await rodar(db, '2026-12-01');
  const story = db.social_posts.find((p) => p.tipo === 'story');
  assert.equal(story.status, 'ok');
  assert.equal(story.tentativas, 2);
  assert.equal(db.social_series.find((s) => s.serie === 'ponto_cego').proximo, 6);

  const db2 = novoDb();
  falharPublish = 99;
  for (let k = 0; k < 5; k++) await rodar(db2, '2026-12-03');
  assert.equal(db2.social_posts.find((p) => p.tipo === 'story').tentativas, 3);
});

test('trava presa em "enviando" há mais de 15 min é retomada; recente, não', async () => {
  const db = novoDb();
  const sb = fakeSupabase(db);
  const linha = { data: '2026-11-27', rede: 'instagram', tipo: 'story' };
  db.social_posts.push({ ...linha, status: 'enviando', tentativas: 1, updated_at: new Date().toISOString() });
  assert.equal(await reivindicar(sb, linha), false);
  db.social_posts[0].updated_at = new Date(Date.now() - 20 * 60000).toISOString();
  assert.equal(await reivindicar(sb, linha), true);
});

test('sem a tabela social_posts não posta nada', async () => {
  const db = novoDb();
  delete db.social_posts;
  const r = await rodar(db, '2026-11-30');
  assert.equal(chamadas.publicados.length, 0);
  assert.match(r.erros[0].erro, /0024/);
});

test('TikTok sem conta conectada: erro só no TikTok, Instagram segue', async () => {
  const db = novoDb();
  const r = await rodar(db, '2026-12-05', ['instagram', 'tiktok']);
  assert.equal(chamadas.publicados.length, 2);
  assert.equal(r.erros.length, 1);
  assert.equal(r.erros[0].rede, 'tiktok');
});

test('Reels (Creatomate, alternativa): render → container REELS → publicado, 1 por dia', async () => {
  process.env.SOCIAL_REELS = 'creatomate';
  try {
    const db = novoDb();
    const sb = fakeSupabase(db);
    await rodar(db, '2026-11-30');
    assert.equal(chamadas.renders.length, 1);
    const roteiro = chamadas.renders[0].source;
    assert.equal(roteiro.duration, 9);
    assert.ok(roteiro.elements.some((e) => /\/r1\.png\?/.test(e.source)));
    const reels = () => db.social_posts.find((p) => p.tipo === 'reels');
    assert.equal(reels().status, 'aguardando');
    assert.equal(reels().etapa, 'render');

    await avancarReels({ supabase: sb }); // ainda renderizando
    assert.equal(reels().etapa, 'render');
    renderStatus = 'succeeded';
    await avancarReels({ supabase: sb }); // vídeo pronto → container
    assert.equal(reels().etapa, 'container');
    const c = chamadas.containers.find((x) => x.tipo === 'REELS');
    assert.equal(c.video, 'https://cdn.creatomate.com/render-1.mp4');
    assert.equal(c.feed, 'true');
    assert.ok(c.legenda.includes('Faz o seu mapa grátis'));
    await avancarReels({ supabase: sb }); // FINISHED → publica
    assert.equal(reels().status, 'ok');
    assert.equal(chamadas.publicados.length, 3); // story + carrossel + reels

    await rodar(db, '2026-11-30'); // 2º disparo do dia
    assert.equal(chamadas.renders.length, 1, 'não renderiza de novo');
  } finally {
    delete process.env.SOCIAL_REELS;
  }
});

test('comentários: responde 1x quem mandou data; guarda só o id', async () => {
  const db = novoDb();
  const sb = fakeSupabase(db);
  comentarios = [
    { id: 'c1', text: 'Nasci em 14/07/1990!', from: { id: 'u1', username: 'alguem' } },
    { id: 'c2', text: 'amei', from: { id: 'u2' } },
    { id: 'c3', text: 'golpe 01/01/1990', from: { id: 'u3' } },
    { id: 'c4', text: '12.03.85', from: { id: IG_ID } }, // a própria conta
    { id: 'c5', text: '3 de outubro de 1988', from: { id: 'u5' } },
  ];
  const r = await responderComentarios({ supabase: sb, pausaMs: 0 });
  assert.equal(r.respondidas, 2);
  assert.deepEqual(chamadas.respostas.map((x) => x.comentario), ['c1', 'c5']);
  assert.ok(chamadas.respostas[0].mensagem.includes('Seu mapa é grátis: link na bio'));
  // guardado: só o id e o modelo
  // (created_at/tentativas são do banco falso; o código grava só id e modelo)
  for (const linha of db.social_respostas) assert.deepEqual(Object.keys(linha).filter((k) => !['created_at', 'tentativas'].includes(k)).sort(), ['comentario_id', 'modelo']);
  const salvo = JSON.stringify(db.social_respostas);
  for (const proibido of ['1990', '1988', 'alguem', 'u1', 'Nasci', 'outubro']) assert.ok(!salvo.includes(proibido), `guardou ${proibido}`);

  const r2 = await responderComentarios({ supabase: sb, pausaMs: 0 });
  assert.equal(r2.respondidas, 0, 'nunca responde 2x');
  assert.equal(chamadas.respostas.length, 2);
});

test('comentários: respeita o limite por hora', async () => {
  const db = novoDb();
  comentarios = Array.from({ length: 10 }, (_, k) => ({ id: `x${k}`, text: `0${(k % 9) + 1}/05/1990`, from: { id: `u${k}` } }));
  const r = await responderComentarios({ supabase: fakeSupabase(db), limite: 3, pausaMs: 0 });
  assert.equal(r.respondidas, 3);
  assert.equal(db.social_respostas.length, 3);
});

test('cron da hora: liga comentários só com SOCIAL_RESPOSTAS=on', async () => {
  const db = novoDb();
  comentarios = [{ id: 'h1', text: '14/07/1990', from: { id: 'u1' } }];
  let r = await tarefasDaHora({ supabase: fakeSupabase(db), data: '2026-11-30' });
  assert.equal(r.comentarios, null);
  process.env.SOCIAL_RESPOSTAS = 'on';
  process.env.SOCIAL_RESPOSTAS_POR_HORA = '5';
  try {
    r = await tarefasDaHora({ supabase: fakeSupabase(db), data: '2026-11-30' });
    assert.equal(r.comentarios.respondidas, 1);
  } finally {
    delete process.env.SOCIAL_RESPOSTAS;
    delete process.env.SOCIAL_RESPOSTAS_POR_HORA;
  }
});

// ── IA falsa ───────────────────────────────────────────────────────────────
function rascunho(dados, ajuste = (x) => x) {
  const f = dados.fatos;
  const nome = f.numero_de_vida ?? f.signo ?? f.signo_a ?? f.autor ?? f.mecanismo ?? 'a semana';
  const capa = dados.tema === 'compat' ? `${f.signo_a} × ${f.signo_b}: nota ${f.nota_de_compatibilidade}` : `Se você é ${nome}, isso é sobre você`;
  const base = {
    telas: [
      { titulo: capa, texto: dados.tema === 'pensador' ? `${f.autor} propõe olhar pra dentro.` : 'Ninguém te conta por que isso se repete.' },
      { titulo: 'O mecanismo', texto: 'A mesma força que te move é a que te prende quando você não percebe.' },
      { titulo: 'Na vida real', texto: 'Você começa três projetos na mesma semana e termina nenhum.' },
      { titulo: 'A virada', texto: 'O problema não é a força: é usar sempre a mesma.' },
      { titulo: 'Pra hoje', texto: 'Escolha uma coisa só e termine.' },
    ],
    legenda: { gancho: capa, texto: ['Linha.', 'Outra linha.'], hashtags: ['#tema'] },
    story: { titulo: 'Dia de escutar', frase: 'A Lua pede menos pressa e mais escuta hoje.' },
    reels: { gancho: capa.slice(0, 80), virada: 'O problema não é a força: é usar sempre a mesma.' },
  };
  if (dados.tema === 'semana') {
    base.telas = base.telas.slice(0, 2);
    base.dias = dados.dias.map((d) => ({ data: d.data, conselho: `${d.lua}: um passo por vez.` }));
  }
  return ajuste(base);
}

test('IA: aprovado de primeira → fonte "ia"; prompt leva o guia e os dados', async () => {
  const dados = dadosDoDia('2026-11-30', 6);
  const pedidos = [];
  const chamar = async (sistema, usuario) => {
    pedidos.push({ sistema, usuario });
    return pedidos.length === 1 ? rascunho(dados) : { aprovado: true, problemas: [], conteudo: rascunho(dados) };
  };
  const { conteudo, revisao } = await gerarConteudoDoDia(dados, { chamar });
  assert.equal(conteudo.fonte, 'ia');
  assert.equal(revisao.revisao.aprovado, true);
  assert.ok(pedidos[0].sistema.includes('Faz o seu mapa grátis: link na bio'));
  assert.ok(pedidos[0].usuario.includes('"numero_de_vida": 7'));
  assert.ok(pedidos[1].sistema.includes('Revise o post'));
});

test('IA: revisão reescreve um rascunho com dado errado → "ia-revisada"', async () => {
  const dados = dadosDoDia('2026-11-30', 6); // 7
  const errado = { ...dadosDoDia('2026-11-30', 7) }; // rascunho fala do 8
  let n = 0;
  const chamar = async () => (++n === 1 ? rascunho(errado) : { aprovado: false, problemas: ['número errado'], conteudo: rascunho(dados) });
  const { conteudo } = await gerarConteudoDoDia(dados, { chamar });
  assert.equal(conteudo.fonte, 'ia-revisada');
  assert.ok(conteudo.telas[0].titulo.includes('7'));
});

test('IA: se nada passa na checagem, usa a reserva; IA fora do ar também', async () => {
  const dados = dadosDoDia('2026-11-30', 6);
  const ruim = rascunho(dados, (r) => { r.telas[3].texto = 'Talvez isso garanta dinheiro.'; return r; });
  let n = 0;
  const reprova = async () => (++n === 1 ? ruim : { aprovado: false, problemas: ['hedge'], conteudo: ruim });
  assert.equal((await gerarConteudoDoDia(dados, { chamar: reprova })).conteudo.fonte, 'reserva');
  assert.equal((await gerarConteudoDoDia(dados, { chamar: async () => null })).conteudo.fonte, 'reserva');
  let k = 0;
  const semRevisao = async () => (++k === 1 ? rascunho(dados) : null);
  assert.equal((await gerarConteudoDoDia(dados, { chamar: semRevisao })).conteudo.fonte, 'ia', 'sem revisão, o rascunho só sai se passou na checagem');
  assert.equal((await gerarConteudoDoDia(dados, { chamar: async () => { throw new Error('boom'); } })).conteudo.fonte, 'reserva');
});

test('IA: pedido de revisão pede o veredito com o post dentro (não só o post)', async () => {
  const dados = dadosDoDia('2026-11-30', 6);
  const pedidos = [];
  const chamar = async (sistema, usuario) => {
    pedidos.push(usuario);
    return pedidos.length === 1 ? rascunho(dados) : { aprovado: true, problemas: [], conteudo: rascunho(dados) };
  };
  await gerarConteudoDoDia(dados, { chamar });
  const rev = pedidos[1];
  const ultimo = rev.lastIndexOf('Responda SÓ com um JSON válido');
  assert.ok(ultimo > rev.indexOf('RASCUNHO:'), 'a instrução de resposta vem depois do rascunho');
  assert.ok(rev.slice(ultimo).startsWith('Responda SÓ com um JSON válido, sem texto antes ou depois, neste formato:\n{ "aprovado"'));
  assert.ok(rev.includes('"conteudo"'));
  assert.ok(!pedidos[0].includes('"aprovado"'), 'a geração não pede veredito');
});

test('IA: revisão que devolve só o post (sem "aprovado") vale como reescrita', async () => {
  const dados = dadosDoDia('2026-11-30', 6);
  let n = 0;
  const chamar = async () => (++n === 1 ? rascunho(dados) : rascunho(dados, (r) => { r.telas[4].texto = 'Escolha uma coisa só hoje e termine antes de começar outra.'; return r; }));
  const { conteudo, revisao } = await gerarConteudoDoDia(dados, { chamar });
  assert.equal(conteudo.fonte, 'ia-revisada');
  assert.equal(conteudo.telas[4].texto, 'Escolha uma coisa só hoje e termine antes de começar outra.');
  assert.equal(revisao.revisao.aprovado, null);
});

test('IA: texto longo demais volta pra 2ª rodada de revisão com o problema e sai encurtado', async () => {
  const dados = dadosDoDia('2026-11-30', 6);
  const longo = rascunho(dados, (r) => { r.telas[1].texto = 'Uma frase comprida sobre o mecanismo. '.repeat(10).trim(); return r; });
  const pedidos = [];
  const chamar = async (sistema, usuario) => {
    pedidos.push(usuario);
    if (pedidos.length === 1) return longo;
    if (pedidos.length === 2) return { aprovado: true, problemas: [], conteudo: longo }; // 1ª rodada não encurtou
    return { aprovado: false, problemas: ['tela 2 longa'], conteudo: rascunho(dados) };
  };
  const { conteudo, revisao } = await gerarConteudoDoDia(dados, { chamar });
  assert.equal(pedidos.length, 3);
  assert.match(pedidos[1], /texto da tela 2 longo \(\d+ caracteres; máximo 300/);
  assert.match(pedidos[2], /texto da tela 2 longo \(\d+ caracteres; máximo 300/, 'a 2ª rodada recebe o problema que sobrou');
  assert.equal(conteudo.fonte, 'ia-revisada');
  assert.ok(conteudo.telas.every((t) => t.texto.length <= 300));
  assert.equal(revisao.revisao.length, 2);
});

test('IA: nunca passa de 2 rodadas de revisão', async () => {
  const dados = dadosDoDia('2026-11-30', 6);
  const longo = rascunho(dados, (r) => { r.telas[1].texto = 'x'.repeat(400); return r; });
  let n = 0;
  const chamar = async () => (++n === 1 ? longo : { aprovado: false, problemas: ['longo'], conteudo: longo });
  const { conteudo, revisao } = await gerarConteudoDoDia(dados, { chamar });
  assert.equal(n, 3);
  assert.equal(conteudo.fonte, 'reserva');
  assert.ok(revisao.checagem.some((p) => /longo/.test(p)));
});

test('semana: gera 7 dias, anda cada série 1 vez, não refaz o que já existe', async () => {
  const db = novoDb();
  const sb = fakeSupabase(db);
  const chamar = async (sistema, usuario) => {
    const dados = JSON.parse(usuario.slice(usuario.indexOf('{'), usuario.indexOf('\n}\n') + 2));
    if (sistema.includes('Revise o post')) return null; // sem revisão: vale o rascunho se passar
    // descobre o tema pelos campos dos dados do pedido
    const temas = { signo_a: 'compat', numero_de_vida: 'numero', signo: 'ponto_cego', mecanismo: 'mente', autor: 'pensador', exemplo_de_data: 'comenta', semana: 'semana' };
    const tema = temas[Object.keys(temas).find((c) => c in dados)];
    return rascunho({ tema, fatos: dados, dias: dados.dias || [] });
  };
  const r = await gerarSemana({ supabase: sb, inicio: '2026-11-30', chamar });
  assert.equal(r.gerados.length, 7);
  assert.equal(db.social_conteudos.length, 7);
  const proximo = Object.fromEntries(db.social_series.map((s) => [s.serie, s.proximo]));
  assert.deepEqual(proximo, { numero: 1, ponto_cego: 6, mente: 16, compat: 1, pensador: 1 });
  assert.ok(db.social_conteudos.every((c) => c.conteudo.telas.length === 6 && c.versao));
  assert.deepEqual(db.social_conteudos.map((c) => c.fonte), Array(7).fill('ia'), JSON.stringify(db.social_conteudos.map((c) => [c.data, c.fonte, c.revisao])));
  const r2 = await gerarSemana({ supabase: sb, inicio: '2026-11-30', chamar });
  assert.equal(r2.gerados.length, 0);
  assert.equal(r2.pulados, 7);
  const r3 = await gerarSemana({ supabase: sb, inicio: '2026-11-30', dias: 1, refazer: true, chamar });
  assert.equal(r3.gerados.length, 1);
  assert.equal(db.social_series.find((s) => s.serie === 'numero').proximo, 1, 'refazer mantém o item');

  // o cron das 7h usa o conteúdo guardado (não chama a IA de novo)
  await rodar(db, '2026-11-30', ['instagram'], { chamar: async () => { throw new Error('não devia chamar'); } });
  assert.equal(chamadas.publicados.length, 2);
});

// ── Instagram: token e caminhos ────────────────────────────────────────────
test('token do Instagram: renova, guarda e usa o do banco; token novo na variável vence o do banco', async () => {
  assert.ok(precisaRenovar({ expiraEm: null, tentouEm: null }));
  const agora = Date.parse('2026-11-23T10:00:00Z');
  assert.ok(!precisaRenovar({ expiraEm: '2027-01-20T00:00:00Z' }, agora));
  assert.ok(precisaRenovar({ expiraEm: '2026-12-05T00:00:00Z' }, agora));

  const db = novoDb();
  const sb = fakeSupabase(db);
  assert.equal((await tokenInstagram(sb)).token, 'token-renovado');
  assert.equal(db.social_tokens[0].env_hash, hashToken('token-da-variavel'));
  await tokenInstagram(sb);
  assert.equal(chamadas.refresh, 1, 'não renova de novo com 60 dias pela frente');
  process.env.INSTAGRAM_ACCESS_TOKEN = 'outro-token';
  await tokenInstagram(sb);
  assert.equal(chamadas.refresh, 2);
  process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
});

test('modo do Instagram e token de usuário do sistema (graph.facebook.com, sem renovar)', async () => {
  assert.equal(modoInstagram('EAAGm0PX4ZCpsBAxyz', undefined), 'facebook');
  assert.equal(modoInstagram('IGAAJx1234', undefined), 'instagram');
  assert.equal(modoInstagram('IGAAJx1234', 'facebook'), 'facebook');
  process.env.INSTAGRAM_ACCESS_TOKEN = 'EAAsuat-de-teste';
  try {
    const db = novoDb();
    assert.deepEqual(await tokenInstagram(fakeSupabase(db)), { token: 'EAAsuat-de-teste', modo: 'facebook' });
    await rodar(db, '2026-11-30');
    assert.equal(chamadas.refresh, 0);
    for (const c of chamadas.containers) assert.ok(c.url.startsWith(`https://graph.facebook.com/v24.0/${IG_ID}/media`), c.url);
    const ok = await conferirContaInstagram();
    assert.equal(ok.ok, true);
    assert.ok(!JSON.stringify(ok).includes('EAAsuat'));
  } finally {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
  }
  await publicarNoInstagram({ token: 'IGAAantigo', tipo: 'story', imageUrl: `${BASE}/x.jpg` });
  assert.ok(chamadas.containers.at(-1).url.startsWith(`https://graph.instagram.com/v24.0/${IG_ID}/media`));
});

// ── Reels pelo GitHub Actions (motor padrão) ───────────────────────────────
test('motor do Reels: on/github = GitHub Actions; creatomate = alternativa; vazio = sem Reels', () => {
  assert.equal(motorReels('on'), 'github');
  assert.equal(motorReels('github'), 'github');
  assert.equal(motorReels('creatomate'), 'creatomate');
  assert.equal(motorReels('off'), null);
  assert.equal(motorReels(undefined), null);
});

test('GitHub: trabalho → upload → publicar → Instagram processa → publicado, 1 por dia', async () => {
  process.env.SOCIAL_REELS = 'on';
  process.env.SOCIAL_AUTOMACAO = 'instagram';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-publica';
  try {
    const db = { ...novoDb(), storage: { reels: new Set(['2026-11-01-velho.mp4', '2026-11-29-ontem.mp4']) } };
    bancoAtual = db;
    const sb = fakeSupabase(db);

    // o cron das 7h não começa Reels no motor GitHub
    await rodar(db, '2026-11-30');
    assert.equal(chamadas.renders.length, 0);
    assert.equal(db.social_posts.some((p) => p.tipo === 'reels'), false);

    const t = await trabalhoDoReels({ supabase: sb, data: '2026-11-30', baseUrl: BASE, segredo: 'segredo' });
    assert.ok(!t.pular, t.pular);
    assert.equal(t.fps, 30);
    assert.equal(t.duracao, 9);
    const versao = db.social_conteudos[0].versao;
    assert.equal(t.upload.caminho, caminhoDoReels('2026-11-30', versao));
    assert.equal(t.upload.apikey, 'anon-publica');
    assert.ok(db.uploadsPedidos[0].upsert);
    // a página da animação vem assinada com o conteúdo do dia
    const pag = new URL(t.pagina);
    assert.equal(pag.pathname, '/social/reels/2026-11-30');
    assert.ok(conferirAssinatura({ data: '2026-11-30', formato: 'reels', indice: 0, v: versao, t: pag.searchParams.get('t') }, 'segredo'));
    // limpeza: vídeo de mais de 7 dias sai do bucket, o de ontem fica
    assert.deepEqual([...db.storage.reels], ['2026-11-29-ontem.mp4']);

    // publicar antes de o vídeo estar no bucket = erro claro
    await assert.rejects(publicarReelsDoArquivo({ supabase: sb, data: '2026-11-30', caminho: t.upload.caminho }), /não está no bucket/);
    db.social_posts = db.social_posts.filter((p) => p.tipo !== 'reels');
    await assert.rejects(publicarReelsDoArquivo({ supabase: sb, data: '2026-11-30', caminho: '../x.mp4' }), /inválido/);

    db.storage.reels.add(t.upload.caminho); // o workflow subiu
    const r = await publicarReelsDoArquivo({ supabase: sb, data: '2026-11-30', caminho: t.upload.caminho });
    assert.ok(r.ok);
    const c = chamadas.containers.find((x) => x.tipo === 'REELS');
    assert.equal(c.video, `${SB}/object/public/reels/${t.upload.caminho}`);
    assert.equal(c.feed, 'true');
    const reels = () => db.social_posts.find((p) => p.tipo === 'reels');
    assert.equal(reels().status, 'aguardando');
    assert.equal(reels().etapa, 'container');

    // 2ª chamada (repescagem do workflow) não duplica
    assert.equal((await publicarReelsDoArquivo({ supabase: sb, data: '2026-11-30', caminho: t.upload.caminho })).pulado, 'já publicado ou em andamento');
    assert.match((await trabalhoDoReels({ supabase: sb, data: '2026-11-30', baseUrl: BASE, segredo: 'segredo' })).pular, /processando/);

    await avancarReels({ supabase: sb });
    assert.equal(reels().status, 'ok');
    assert.match((await trabalhoDoReels({ supabase: sb, data: '2026-11-30', baseUrl: BASE, segredo: 'segredo' })).pular, /já foi publicado/);
  } finally {
    delete process.env.SOCIAL_REELS;
    delete process.env.SOCIAL_AUTOMACAO;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    bancoAtual = null;
  }
});

test('GitHub: motor desligado ou Creatomate → workflow não faz nada; sem bucket → erro com a migração', async () => {
  const db = { ...novoDb(), storage: {} };
  const sb = fakeSupabase(db);
  process.env.SOCIAL_AUTOMACAO = 'on';
  try {
    assert.match((await trabalhoDoReels({ supabase: sb, data: '2026-11-30', baseUrl: BASE, segredo: 's' })).pular, /SOCIAL_REELS/);
    process.env.SOCIAL_REELS = 'creatomate';
    assert.match((await trabalhoDoReels({ supabase: sb, data: '2026-11-30', baseUrl: BASE, segredo: 's' })).pular, /creatomate/);
    process.env.SOCIAL_REELS = 'on';
    await assert.rejects(trabalhoDoReels({ supabase: sb, data: '2026-11-30', baseUrl: BASE, segredo: 's' }), /0026/);
  } finally {
    delete process.env.SOCIAL_REELS;
    delete process.env.SOCIAL_AUTOMACAO;
  }
});

test('GitHub: o cron da hora avisa se o Reels não chegou até o meio-dia', async () => {
  process.env.SOCIAL_REELS = 'on';
  try {
    const db = novoDb();
    const manha = await tarefasDaHora({ supabase: fakeSupabase(db), data: '2026-11-30', agora: new Date('2026-11-30T13:00:00Z') }); // 10h
    assert.equal(manha.reels.erros.length, 0);
    const tarde = await tarefasDaHora({ supabase: fakeSupabase(db), data: '2026-11-30', agora: new Date('2026-11-30T15:30:00Z') }); // 12h30
    assert.match(tarde.reels.erros[0].erro, /GitHub Actions/);
    assert.equal(db.social_alertas[0].ultimo, '2026-11-30', '1 e-mail por dia');
  } finally {
    delete process.env.SOCIAL_REELS;
  }
});

// ── Reels NARRADO (SOCIAL_REELS_NARRADO=on) ────────────────────────────────
import { TABELA_NARRADOS, caminhoDaPrevia } from '../lib/socialServidor.js';
import { textoNarrado, duracaoDoVideo } from '../lib/reelsRoteiro.js';

// Roteiro falso que passa nas regras de QUALQUER dia: lê o dia universal e a
// Lua do próprio pedido (os dados reais que o site mandou pra IA).
function roteiroDoPedido(usuario) {
  const n = /"dia_universal": (\d+)/.exec(usuario)?.[1] || '1';
  const lua = /"lua": "([^"]+)"/.exec(usuario)?.[1] || 'Lua Nova';
  return {
    ganchos: [
      'Hoje alguém vai te pedir algo e você vai dizer sim antes de pensar.',
      'Hoje você vai sentir vontade de agradar alguém que nem pediu nada.',
      'Hoje uma conversa simples vai mexer mais com você do que deveria.',
    ],
    porque: `Isso tem nome na psicologia: a mente prefere evitar o desconforto do não, e responde rápido pra encerrar a tensão. Simbolicamente, o dia universal ${n} pede atenção ao outro, e a ${lua} aumenta a vontade de cuidar.`,
    virada: 'Dizer sim rápido não é gentileza: é pressa de se livrar do incômodo.',
    pratica: 'Quando alguém te pedir algo hoje, respire uma vez e diga: me deixa ver e te respondo.',
    legenda: { gancho: 'Hoje alguém vai te pedir algo e você vai dizer sim antes de pensar.', texto: ['Dizer sim rápido é pressa de encerrar o desconforto.', 'Hoje, antes de responder, respire e diga: me deixa ver.'] },
  };
}
// IA falsa: post → null (sai a reserva); roteiro → o roteiro acima; revisão → aprova com o gancho 2.
const iaNarrado = (contador = { roteiro: 0 }) => async (sistema, usuario) => {
  if (!sistema.includes('ESTE TEXTO É FALADO')) return null;
  contador.roteiro += 1;
  if (sistema.includes('editora-chefe')) return { aprovado: true, problemas: [], gancho_escolhido: 2, conteudo: roteiroDoPedido(usuario) };
  return roteiroDoPedido(usuario);
};
const ENV_NARRADO = { SOCIAL_REELS: 'on', SOCIAL_AUTOMACAO: 'instagram', SOCIAL_REELS_NARRADO: 'on', ELEVENLABS_API_KEY: 'chave-eleven', ELEVENLABS_VOICE_ID: 'voz-1', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon' };
async function comEnv(env, fn) {
  const antes = {};
  for (const [k, v] of Object.entries(env)) { antes[k] = process.env[k]; if (v == null) delete process.env[k]; else process.env[k] = v; }
  try { return await fn(); } finally {
    for (const [k, v] of Object.entries(antes)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}
const dbNarrado = () => ({ ...novoDb(), social_reels_narrados: [], social_narracao_uso: [], storage: { reels: new Set() } });

test('narrado: trabalho gera roteiro + narração (1 vez), página narrada assinada, legenda do roteiro no Reels', async () => {
  await comEnv(ENV_NARRADO, async () => {
    const db = dbNarrado();
    bancoAtual = db;
    const sb = fakeSupabase(db);
    const ia = { roteiro: 0 };
    const t = await trabalhoDoReels({ supabase: sb, data: '2026-11-26', baseUrl: BASE, segredo: 'segredo', chamar: iaNarrado(ia) });
    assert.equal(t.narrado, true, t.aviso);
    const linha = db[TABELA_NARRADOS][0];
    assert.equal(linha.roteiro.gancho, linha.roteiro.ganchos[2], 'o gancho escolhido pela revisão');
    assert.equal(linha.texto, textoNarrado(linha.roteiro));
    // ElevenLabs: endpoint com timestamps, modelo multilíngue v2, a voz e a chave das variáveis
    assert.equal(chamadas.eleven.length, 1);
    assert.match(chamadas.eleven[0].url, /\/text-to-speech\/voz-1\/with-timestamps\?output_format=mp3_44100_128$/);
    assert.equal(chamadas.eleven[0].corpo.model_id, 'eleven_multilingual_v2');
    assert.equal(chamadas.eleven[0].corpo.text, linha.texto);
    assert.equal(chamadas.eleven[0].chave, 'chave-eleven');
    // MP3 no bucket, conta de caracteres do mês, tempo das palavras
    const mp3 = db.uploadsFeitos.find((u) => u.p.endsWith('.mp3'));
    assert.equal(mp3.tipo, 'audio/mpeg');
    assert.match(mp3.p, /^2026-11-26-narracao-[0-9a-f]{10}\.mp3$/);
    assert.equal(db.social_narracao_uso.length, 1);
    assert.equal(db.social_narracao_uso[0].caracteres, linha.texto.length);
    assert.equal(t.narracao.audio, `${SB}/object/public/reels/${mp3.p}`);
    assert.equal(t.narracao.palavras.length, linha.texto.split(/\s+/).length);
    assert.equal(t.duracao, duracaoDoVideo(t.narracao.palavras));
    assert.ok(t.duracao > 30 && t.duracao < 60, `${t.duracao}s`);
    const pag = new URL(t.pagina);
    assert.equal(pag.searchParams.get('n'), '1');
    assert.ok(conferirAssinatura({ data: '2026-11-26', formato: 'reels-narrado', indice: 0, v: db.social_conteudos[0].versao, t: pag.searchParams.get('t') }, 'segredo'));
    assert.ok(!conferirAssinatura({ data: '2026-11-26', formato: 'reels', indice: 0, v: db.social_conteudos[0].versao, t: pag.searchParams.get('t') }, 'segredo'), 'a assinatura do narrado não abre o card');

    // repescagem: não chama a IA nem o ElevenLabs de novo
    const ia2 = ia.roteiro;
    const t2 = await trabalhoDoReels({ supabase: sb, data: '2026-11-26', baseUrl: BASE, segredo: 'segredo', chamar: iaNarrado(ia) });
    assert.equal(t2.narrado, true);
    assert.equal(ia.roteiro, ia2);
    assert.equal(chamadas.eleven.length, 1);

    // publicado com a legenda do roteiro (+ chamada e hashtags)
    db.storage.reels.add(t.upload.caminho);
    const r = await publicarReelsDoArquivo({ supabase: sb, data: '2026-11-26', caminho: t.upload.caminho, narrado: true });
    assert.ok(r.ok);
    const c = chamadas.containers.find((x) => x.tipo === 'REELS');
    assert.ok(c.legenda.startsWith(linha.roteiro.legenda.gancho));
    assert.match(c.legenda, /Faz o seu mapa grátis: link na bio/);
    assert.match(c.legenda, /#numerologia/);
  });
  bancoAtual = null;
});

test('narrado: qualquer falha cai no card de 9s (ElevenLabs fora, limite do mês, sem migração, IA reprovada, chave desligada, card=1)', async () => {
  await comEnv(ENV_NARRADO, async () => {
    const card = (t) => { assert.equal(t.narrado, false); assert.ok(!new URL(t.pagina).searchParams.get('n')); assert.equal(t.duracao, 9); };
    // ElevenLabs recusando
    elevenFalha = true;
    let db = dbNarrado();
    let t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    card(t);
    assert.match(t.aviso, /ElevenLabs: Invalid API key/);
    assert.equal(db.social_narracao_uso.length, 0, 'nada cobrado, nada contado');
    elevenFalha = false;

    // limite do mês: nem chama o ElevenLabs
    chamadas.eleven = [];
    await comEnv({ ELEVENLABS_LIMITE_MES: '200' }, async () => {
      db = dbNarrado();
      t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
      card(t);
      assert.match(t.aviso, /limite do ElevenLabs do mês atingido \(0 de 200/);
      assert.equal(chamadas.eleven.length, 0);
    });
    // limite somado no mês: o uso guardado conta
    db = dbNarrado();
    const { mesBrasilia } = await import('../lib/elevenlabs.js');
    db.social_narracao_uso.push({ mes: mesBrasilia(), caracteres: 24900 });
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    card(t);
    assert.match(t.aviso, /24900 de 25000/);

    // sem a migração 0028
    db = { ...novoDb(), storage: { reels: new Set() } };
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    card(t);
    assert.match(t.aviso, /0028/);

    // bucket ainda sem audio/mpeg (0028 não rodou inteira)
    db = { ...dbNarrado(), mimesPermitidos: ['video/mp4'] };
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    card(t);
    assert.match(t.aviso, /audio\/mpeg/);

    // IA reprovando o roteiro (sem gatilho na prática, sempre)
    db = dbNarrado();
    const iaRuim = async (s, u) => {
      if (!s.includes('ESTE TEXTO É FALADO')) return null;
      const r = roteiroDoPedido(u);
      r.pratica = 'Respire fundo e diga que vai pensar com calma antes.';
      return s.includes('editora-chefe') ? { aprovado: false, problemas: ['prática'], gancho_escolhido: 0, conteudo: r } : r;
    };
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaRuim });
    card(t);
    assert.match(t.aviso, /roteiro narrado reprovado/);

    // card=1 (o workflow pede quando o vídeo narrado falha lá)
    db = dbNarrado();
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado(), card: true });
    card(t);
    assert.equal(t.aviso, undefined);
    assert.equal(db[TABELA_NARRADOS].length, 0);
  });
  // chave desligada: card, sem IA de roteiro e sem aviso
  await comEnv({ ...ENV_NARRADO, SOCIAL_REELS_NARRADO: null }, async () => {
    const ia = { roteiro: 0 };
    const t = await trabalhoDoReels({ supabase: fakeSupabase(dbNarrado()), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado(ia) });
    assert.equal(t.narrado, false);
    assert.equal(t.aviso, undefined);
    assert.equal(ia.roteiro, 0);
  });
});

test('narrado: prévia ignora as travas de publicação, salva -previa.mp4 e nunca publica', async () => {
  await comEnv({ ...ENV_NARRADO, SOCIAL_REELS_NARRADO: null }, async () => {
    const db = dbNarrado();
    bancoAtual = db;
    db.social_posts.push({ data: '2026-11-26', rede: 'instagram', tipo: 'reels', status: 'ok' });
    const sb = fakeSupabase(db);
    const t = await trabalhoDoReels({ supabase: sb, data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado(), previa: true });
    assert.equal(t.narrado, true, 'prévia é sempre narrada, mesmo com a chave desligada');
    assert.equal(t.previa, true);
    assert.equal(t.upload.caminho, caminhoDaPrevia('2026-11-26'));
    db.storage.reels.add(t.upload.caminho);
    await assert.rejects(publicarReelsDoArquivo({ supabase: sb, data: '2026-11-26', caminho: t.upload.caminho }), /prévia/);
    // falha na prévia aparece como erro (não vira card)
    elevenFalha = true;
    const db2 = dbNarrado();
    await assert.rejects(trabalhoDoReels({ supabase: fakeSupabase(db2), data: '2026-11-26', baseUrl: BASE, segredo: 's', chamar: iaNarrado(), previa: true }), /ElevenLabs/);
  });
  bancoAtual = null;
});

test('narrado: a geração de domingo escreve os roteiros falados da semana (narração fica pro dia)', async () => {
  await comEnv(ENV_NARRADO, async () => {
    const db = dbNarrado();
    const r = await gerarSemana({ supabase: fakeSupabase(db), inicio: '2026-11-30', chamar: iaNarrado() });
    assert.equal(r.narrados.length, 7);
    assert.ok(r.narrados.every((n) => n.fonte && !n.erro), JSON.stringify(r.narrados));
    assert.equal(db[TABELA_NARRADOS].length, 7);
    assert.ok(db[TABELA_NARRADOS].every((l) => l.audio_caminho === null), 'sem gastar ElevenLabs no domingo');
    assert.equal(chamadas.eleven.length, 0);
    // fechamento alterna (sem resposta automática: salva / manda)
    assert.deepEqual(new Set(db[TABELA_NARRADOS].map((l) => l.roteiro.fechamentoTipo)), new Set(['salva', 'manda']));
  });
});

// ── Reels interativo (SOCIAL_REELS_INTERATIVO=on, migração 0029) ───────────
const ENV_INTERATIVO = { ...ENV_NARRADO, SOCIAL_REELS_NARRADO: null, SOCIAL_REELS_INTERATIVO: 'on' };
const dbInterativo = () => ({ ...dbNarrado(), social_reels_interativos: [] });
const TERCA = '2026-12-01'; // carta
const QUINTA = '2026-12-03'; // narrado

test('interativo: dia de carta → 1 narração por trecho, linha do tempo, página n=2 assinada; repescagem não narra de novo; legenda pede o comentário', async () => {
  const { roteiroInterativo, textoDoSegmento } = await import('../lib/reelsInterativo.js');
  const { FONTES_INTERATIVO } = await import('../lib/socialServidor.js');
  await comEnv(ENV_INTERATIVO, async () => {
    const db = dbInterativo();
    bancoAtual = db;
    const sb = fakeSupabase(db);
    const ia = { roteiro: 0 };
    const t = await trabalhoDoReels({ supabase: sb, data: TERCA, baseUrl: BASE, segredo: 'segredo', chamar: iaNarrado(ia) });
    assert.equal(t.interativo, 'carta', t.aviso);
    assert.equal(t.narrado, true);
    assert.equal(t.aviso, undefined);
    assert.equal(ia.roteiro, 0, 'o interativo não usa IA: sai das tabelas do site');
    const r = roteiroInterativo(TERCA, 'carta', FONTES_INTERATIVO);
    // 2 trechos (antes e depois do contador), cada um narrado 1 vez com o texto exato
    assert.deepEqual(chamadas.eleven.map((c) => c.corpo.text), r.segmentos.map(textoDoSegmento));
    assert.ok(chamadas.eleven.every((c) => c.corpo.model_id === 'eleven_multilingual_v2' && /\/voz-1\/with-timestamps/.test(c.url)));
    const mp3s = db.uploadsFeitos.filter((u) => u.p.endsWith('.mp3'));
    assert.deepEqual(mp3s.map((u) => u.p.replace(/-[0-9a-f]{10}\.mp3$/, '')), ['2026-12-01-interativo-escolha', '2026-12-01-interativo-revelacao']);
    assert.ok(mp3s.every((u) => u.tipo === 'audio/mpeg'));
    assert.equal(db.social_narracao_uso.reduce((s, x) => s + x.caracteres, 0), r.segmentos.map(textoDoSegmento).join('').length);
    // o que a página recebe: vozes com o segundo de entrada, cena e eventos
    const row = db.social_reels_interativos[0];
    assert.equal(row.formato, 'carta');
    assert.ok(row.narrado_em && !row.publicado_em);
    assert.equal(t.duracao, row.linha.duracao);
    assert.deepEqual(t.narracao.vozes.map((v) => v.inicio), row.linha.vozes.map((v) => v.inicio));
    assert.equal(t.narracao.vozes[0].inicio, 0.5);
    assert.ok(t.narracao.vozes[1].inicio > t.narracao.vozes[0].inicio + 3, 'a revelação entra depois do contador');
    assert.ok(t.narracao.vozes.every((v, k) => v.audio === `${SB}/object/public/reels/${mp3s[k].p}`));
    assert.equal(t.narracao.cena.cartas.length, 3);
    assert.equal(t.narracao.eventos.revelar.length, 3);
    assert.ok(t.narracao.eventos.contador.fim > t.narracao.eventos.contador.ini);
    const pag = new URL(t.pagina);
    assert.equal(pag.searchParams.get('n'), '2');
    const v = db.social_conteudos[0].versao;
    assert.ok(conferirAssinatura({ data: TERCA, formato: 'reels-interativo', indice: db.social_conteudos[0].indice, v, t: pag.searchParams.get('t') }, 'segredo'));
    assert.ok(!conferirAssinatura({ data: TERCA, formato: 'reels-narrado', indice: db.social_conteudos[0].indice, v, t: pag.searchParams.get('t') }, 'segredo'));

    // repescagem (11h17): nada de ElevenLabs de novo
    const t2 = await trabalhoDoReels({ supabase: sb, data: TERCA, baseUrl: BASE, segredo: 'segredo', chamar: iaNarrado(ia) });
    assert.equal(t2.interativo, 'carta');
    assert.equal(chamadas.eleven.length, 2);

    // publicado: legenda do formato (sem prometer resposta com o bot desligado) e a marca pro bot
    db.storage.reels.add(t.upload.caminho);
    const pub = await publicarReelsDoArquivo({ supabase: sb, data: TERCA, caminho: t.upload.caminho, narrado: true, interativo: 'carta' });
    assert.ok(pub.ok);
    const c = chamadas.containers.find((x) => x.tipo === 'REELS');
    assert.ok(c.legenda.startsWith('Escolhe uma carta: 1, 2 ou 3.'));
    assert.match(c.legenda, /Comenta o número da sua carta\./);
    assert.doesNotMatch(c.legenda, /responde/);
    assert.match(c.legenda, /Faz o seu mapa grátis: link na bio/);
    assert.match(c.legenda, /#tarot/);
    assert.ok(db.social_reels_interativos[0].publicado_em, 'marcado: o bot responde "1/2/3" neste Reels');
  });
  bancoAtual = null;
});

test('interativo: nos outros dias (e com a chave), o narrado; chave desligada = só o narrado do #158', async () => {
  await comEnv(ENV_INTERATIVO, async () => {
    const db = dbInterativo();
    const t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: QUINTA, baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    assert.equal(t.interativo, undefined);
    assert.equal(t.narrado, true, 'a chave do interativo liga o narrado dos outros dias');
    assert.equal(new URL(t.pagina).searchParams.get('n'), '1');
    assert.equal(db.social_reels_interativos.length, 0);
  });
  await comEnv(ENV_NARRADO, async () => {
    const db = dbInterativo();
    const t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    assert.equal(t.interativo, undefined);
    assert.equal(t.narrado, true);
    assert.equal(db.social_reels_interativos.length, 0, 'sem a chave, nem tenta o interativo');
  });
});

test('interativo: falha cai no narrado (com aviso), e o narrado falhando cai no card', async () => {
  await comEnv(ENV_INTERATIVO, async () => {
    // sem a migração 0029: narrado
    let db = dbNarrado();
    let t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    assert.equal(t.interativo, undefined);
    assert.equal(t.narrado, true);
    assert.match(t.aviso, /interativo falhou, foi pro narrado: .*0029/);
    assert.ok(db.social_alertas.some((a) => /reels-interativo/.test(a.chave)), 'e-mail 1x por dia');

    // ElevenLabs fora: interativo e narrado caem, sai o card
    elevenFalha = true;
    db = dbInterativo();
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    assert.equal(t.narrado, false);
    assert.equal(t.duracao, 9);
    assert.match(t.aviso, /interativo falhou.*\| narrado falhou, saiu o card de 9s/);
    elevenFalha = false;

    // o workflow pede &narrado=1 quando o vídeo interativo falha lá
    chamadas.eleven = [];
    db = dbInterativo();
    t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado(), semInterativo: true });
    assert.equal(t.interativo, undefined);
    assert.equal(t.narrado, true);
    assert.equal(t.aviso, undefined);
    assert.equal(db.social_reels_interativos.length, 0);

    // limite do mês: não chama o ElevenLabs no interativo
    chamadas.eleven = [];
    await comEnv({ ELEVENLABS_LIMITE_MES: '50' }, async () => {
      db = dbInterativo();
      t = await trabalhoDoReels({ supabase: fakeSupabase(db), data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
      assert.equal(t.narrado, false);
      assert.match(t.aviso, /limite do ElevenLabs/);
      assert.equal(chamadas.eleven.length, 0);
    });
  });
});

test('interativo: o 2º trecho falhou → o 1º fica guardado e não é cobrado de novo', async () => {
  await comEnv(ENV_INTERATIVO, async () => {
    const db = dbInterativo();
    const sb = fakeSupabase(db);
    elevenFalha = 2;
    const t = await trabalhoDoReels({ supabase: sb, data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado() });
    assert.equal(t.interativo, undefined, 'caiu no narrado');
    assert.equal(db.social_reels_interativos[0].segmentos.length, 1);
    assert.equal(db.social_reels_interativos[0].linha, null);
    elevenFalha = false;
    chamadas.eleven = [];
    const t2 = await trabalhoDoReels({ supabase: sb, data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado(), semInterativo: false, card: false });
    // o narrado já tinha ficado pronto; o interativo só narra o trecho que faltou
    assert.equal(t2.interativo, 'carta');
    assert.equal(chamadas.eleven.length, 1);
    assert.match(chamadas.eleven[0].corpo.text, /^Carta um:/);
  });
});

test('interativo: prévia filma o formato pedido em qualquer dia, sem as travas', async () => {
  await comEnv({ ...ENV_NARRADO, SOCIAL_REELS_NARRADO: null }, async () => {
    const db = dbInterativo();
    db.social_posts.push({ data: QUINTA, rede: 'instagram', tipo: 'reels', status: 'ok' });
    const sb = fakeSupabase(db);
    let t = await trabalhoDoReels({ supabase: sb, data: QUINTA, baseUrl: BASE, segredo: 's', chamar: iaNarrado(), previa: true, formato: 'numero' });
    assert.equal(t.interativo, 'numero');
    assert.equal(t.upload.caminho, caminhoDaPrevia(QUINTA));
    assert.equal(t.narracao.eventos.numeros.length, 9);
    t = await trabalhoDoReels({ supabase: sb, data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado(), previa: true });
    assert.equal(t.interativo, 'carta', 'sem formato: o do rodízio do dia');
    t = await trabalhoDoReels({ supabase: sb, data: TERCA, baseUrl: BASE, segredo: 's', chamar: iaNarrado(), previa: true, formato: 'narrado' });
    assert.equal(t.interativo, undefined);
    assert.equal(t.narrado, true);
  });
});

test('bot: no Reels interativo de carta publicado, "2" ganha o recado da carta 2; ofensa, a própria conta e 2x continuam fora; guarda só o id', async () => {
  const { hojeBrasilia } = await import('../lib/social.js');
  const { cartasDoDia } = await import('../lib/reelsInterativo.js');
  const { ARCANOS_MAIORES } = await import('../lib/tarot.js');
  const hoje = hojeBrasilia();
  const db = { ...novoDb(), social_reels_interativos: [{ data: hoje, formato: 'carta', publicado_em: new Date().toISOString() }] };
  db.social_posts.push({ data: hoje, rede: 'instagram', tipo: 'reels', status: 'ok', post_id: 'midia-1' });
  comentarios = [
    { id: 'k1', text: '2', from: { id: 'u1', username: 'alguem' } },
    { id: 'k2', text: 'carta 3 ✨', from: { id: 'u2' } },
    { id: 'k3', text: '2 golpe', from: { id: 'u3' } },
    { id: 'k4', text: '1', from: { id: IG_ID } },
    { id: 'k5', text: 'amei demais', from: { id: 'u5' } },
    { id: 'k6', text: '4', from: { id: 'u6' } },
    { id: 'k7', text: '14/07/1990', from: { id: 'u7' } },
  ];
  const sb = fakeSupabase(db);
  const r = await responderComentarios({ supabase: sb, pausaMs: 0 });
  assert.deepEqual(chamadas.respostas.map((x) => x.comentario), ['k1', 'k2', 'k7']);
  const cartas = cartasDoDia(hoje, ARCANOS_MAIORES);
  const { REFLEXAO_ARCANOS } = await import('../lib/tarotReflexao.js');
  const carta2 = REFLEXAO_ARCANOS[cartas[1].id];
  assert.ok(chamadas.respostas[0].mensagem.includes(cartas[1].nome) && chamadas.respostas[0].mensagem.includes(carta2.central) && chamadas.respostas[0].mensagem.includes(carta2.pratica));
  assert.ok(carta2.perguntas.some((q) => chamadas.respostas[0].mensagem.includes(q)), '1 das 3 perguntas da carta');
  assert.ok(chamadas.respostas[1].mensagem.includes(cartas[2].nome));
  assert.ok(chamadas.respostas.every((x) => x.mensagem.endsWith('Seu mapa é grátis: link na bio.')));
  assert.equal(r.respondidas, 3);
  const salvo = JSON.stringify(db.social_respostas);
  for (const proibido of ['alguem', 'u1', 'carta 3', '1990']) assert.ok(!salvo.includes(proibido), `guardou ${proibido}`);
  const r2 = await responderComentarios({ supabase: sb, pausaMs: 0 });
  assert.equal(r2.respondidas, 0, 'nunca responde 2x');

  // o mesmo "2" num post que não é o interativo (ou interativo não publicado): sem resposta
  chamadas.respostas = [];
  const db2 = { ...novoDb(), social_reels_interativos: [{ data: hoje, formato: 'carta', publicado_em: null }] };
  db2.social_posts.push({ data: hoje, rede: 'instagram', tipo: 'reels', status: 'ok', post_id: 'midia-1' });
  comentarios = [{ id: 'z1', text: '2', from: { id: 'u1' } }];
  await responderComentarios({ supabase: fakeSupabase(db2), pausaMs: 0 });
  assert.equal(chamadas.respostas.length, 0);
  // sem a tabela 0029: o bot segue só com datas, sem erro
  const db3 = novoDb();
  comentarios = [{ id: 'y1', text: '2', from: { id: 'u1' } }, { id: 'y2', text: '14/07/1990', from: { id: 'u2' } }];
  const r3 = await responderComentarios({ supabase: fakeSupabase(db3), pausaMs: 0 });
  assert.deepEqual(chamadas.respostas.map((x) => x.comentario), ['y2']);
  assert.equal(r3.erros.length, 0);
});
