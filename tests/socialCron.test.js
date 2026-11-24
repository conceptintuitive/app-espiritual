// Testes do lado servidor da automação social (lib/socialServidor.js,
// lib/socialIA.js, lib/instagram.js) com Supabase, Instagram, Creatomate e IA
// falsos, em memória — `npm test`.
// Foco: 1 post por rede por dia mesmo com o cron rodando 2x, retentativa com o
// mesmo item, série andando 1 vez, carrossel, Reels em etapas, comentários
// respondidos 1 vez (guardando só o id), geração da semana com revisão.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { postarDia, reivindicar, avancarReels, responderComentarios, gerarSemana, tarefasDaHora } from '../lib/socialServidor.js';
import { gerarConteudoDoDia } from '../lib/socialIA.js';
import { precisaRenovar, tokenInstagram, hashToken, modoInstagram, conferirContaInstagram, publicarNoInstagram } from '../lib/instagram.js';
import { dadosDoDia } from '../lib/social.js';

// ── Supabase falso (só o que a automação usa) ──────────────────────────────
const CHAVES = { social_posts: ['data', 'rede', 'tipo'], social_series: ['serie'], social_tokens: ['rede'], social_conteudos: ['data'], social_respostas: ['comentario_id'], social_alertas: ['chave'] };
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
    const mesma = (a, b) => k.every((c) => a[c] === b[c]);
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
const fakeSupabase = (db) => ({ from: (t) => new Q(db, t) });

// ── Instagram, Creatomate e imagens falsos ─────────────────────────────────
const IG_ID = '17840000000000000';
let chamadas;
let falharPublish = 0;
let comentarios = [];
let renderStatus = 'rendering';
const BASE = 'https://site.teste';
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  if (u.startsWith(`${BASE}/api/social/imagem/`)) { chamadas.imagens.push(u); return new Response(new Uint8Array([0xff, 0xd8]), { headers: { 'Content-Type': u.includes('.png') ? 'image/png' : 'image/jpeg' } }); }
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

beforeEach(() => { chamadas = { imagens: [], containers: [], publicados: [], refresh: 0, conferencias: [], renders: [], respostas: [] }; falharPublish = 0; comentarios = []; renderStatus = 'rendering'; });

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

test('Reels: render no Creatomate → container REELS → publicado, 1 por dia', async () => {
  process.env.SOCIAL_REELS = 'on';
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
  assert.ok(chamadas.respostas[0].mensagem.includes('Seu mapa completo é grátis: link na bio'));
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
