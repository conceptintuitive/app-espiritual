// Testes do cron do post automático (lib/socialServidor.js + lib/instagram.js)
// com um Supabase e um Instagram falsos, em memória — `npm test`.
// Foco: 1 story e 1 post por dia mesmo com o cron rodando 2x, retentativa com
// o mesmo item, série andando uma vez só, renovação do token.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { postarDia, reivindicar } from '../lib/socialServidor.js';
import { precisaRenovar, tokenInstagram, hashToken, modoInstagram, conferirContaInstagram, publicarNoInstagram } from '../lib/instagram.js';

// ── Supabase falso (só o que a automação usa) ──────────────────────────────
const CHAVES = { social_posts: ['data', 'rede', 'tipo'], social_series: ['serie'], social_tokens: ['rede'] };
class Q {
  constructor(db, t) { Object.assign(this, { db, t, f: [], op: 'select', unico: false }); }
  select() { return this; }
  insert(row) { this.op = 'insert'; this.row = row; return this; }
  update(v) { this.op = 'update'; this.vals = v; return this; }
  upsert(row, o = {}) { this.op = 'upsert'; this.row = row; this.ign = o.ignoreDuplicates; return this; }
  eq(c, v) { this.f.push((r) => r[c] === v); return this; }
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
      tab.push({ tentativas: 1, ...this.row });
      return { data: null, error: null };
    }
    if (this.op === 'upsert') {
      const i = tab.findIndex((r) => mesma(r, this.row));
      if (i >= 0) { if (!this.ign) tab[i] = { ...tab[i], ...this.row }; } else tab.push({ ...this.row });
      return { data: null, error: null };
    }
    const achados = tab.filter((r) => this.f.every((fn) => fn(r)));
    if (this.op === 'update') { for (const r of achados) Object.assign(r, this.vals); return { data: achados.map((r) => ({ ...r })), error: null }; }
    return { data: this.unico ? (achados[0] || null) : achados, error: null };
  }
}
const fakeSupabase = (db) => ({ from: (t) => new Q(db, t) });

// ── Instagram + imagem falsos ──────────────────────────────────────────────
let chamadas;
let falharPublish = 0;
const BASE = 'https://site.teste';
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  if (u.startsWith(`${BASE}/api/social/imagem/`)) { chamadas.imagens.push(u); return new Response(new Uint8Array([0xff, 0xd8]), { headers: { 'Content-Type': 'image/jpeg' } }); }
  if (u.includes('/refresh_access_token')) { chamadas.refresh++; return json({ access_token: 'token-renovado', expires_in: 5184000 }); }
  if (u.includes('/media_publish')) {
    if (falharPublish > 0) { falharPublish--; return json({ error: { message: 'Falha de teste', code: 9007 } }, 400); }
    chamadas.publicados.push(new URLSearchParams(opts.body).get('creation_id'));
    return json({ id: `post-${chamadas.publicados.length}` });
  }
  if (u.includes('/media') && opts.method === 'POST') {
    const p = new URLSearchParams(opts.body);
    chamadas.containers.push({ url: u, tipo: p.get('media_type') || 'FEED', imagem: p.get('image_url'), legenda: p.get('caption'), token: p.get('access_token') });
    return json({ id: `cont-${chamadas.containers.length}` });
  }
  if (u.includes('fields=status_code')) return json({ status_code: 'FINISHED' });
  if (u.includes('fields=username')) {
    chamadas.conferencias.push(u);
    if (u.includes('access_token=token-invalido')) return json({ error: { message: 'Invalid OAuth access token', code: 190 } }, 400);
    return json({ username: 'conta_teste', id: '17840000000000000' });
  }
  throw new Error(`fetch inesperado: ${u}`);
};

process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
process.env.INSTAGRAM_USER_ID = '17840000000000000';
delete process.env.RESEND_API_KEY;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;

const novoDb = () => ({ social_posts: [], social_series: [{ serie: 'numero', proximo: 0 }, { serie: 'ponto_cego', proximo: 5 }, { serie: 'anjo', proximo: 71 }, { serie: 'animal', proximo: 0 }, { serie: 'selo', proximo: 0 }], social_tokens: [] });
const rodar = (db, data, redes = ['instagram']) => postarDia({ supabase: fakeSupabase(db), data, redes, baseUrl: BASE, segredo: 'segredo' });

beforeEach(() => { chamadas = { imagens: [], containers: [], publicados: [], refresh: 0, conferencias: [] }; falharPublish = 0; });

test('segunda: story + feed; rodar 2x não posta de novo e a série anda 1 vez', async () => {
  const db = novoDb();
  const r1 = await rodar(db, '2026-11-23');
  assert.equal(r1.erros.length, 0, JSON.stringify(r1.erros));
  assert.equal(chamadas.publicados.length, 2);
  assert.deepEqual(chamadas.containers.map((c) => c.tipo), ['STORIES', 'FEED']);
  assert.match(chamadas.containers[0].imagem, /\/story\.jpg\?t=/);
  assert.match(chamadas.containers[1].imagem, /\/feed\.jpg\?i=0&t=/);
  assert.ok(chamadas.containers[1].legenda.startsWith('Número de vida 1:'));
  assert.equal(chamadas.containers[0].legenda, null); // story sem legenda
  assert.equal(db.social_series.find((s) => s.serie === 'numero').proximo, 1);
  assert.deepEqual(db.social_posts.map((p) => [p.tipo, p.status, p.item]), [['story', 'ok', null], ['feed', 'ok', '1']]);

  const r2 = await rodar(db, '2026-11-23');
  assert.equal(chamadas.publicados.length, 2, 'não postou de novo');
  assert.ok(r2.resultado.every((x) => x.pulado));
  assert.equal(db.social_series.find((s) => s.serie === 'numero').proximo, 1);
  assert.equal(db.social_posts.length, 2);
});

test('erro no feed: retentativa usa o MESMO item e a série não anda 2x', async () => {
  const db = novoDb();
  falharPublish = 1; // o story publica antes; o 1º publish que falha é o do story
  const r1 = await rodar(db, '2026-11-24'); // terça: ponto cego, índice 5 = Virgem
  assert.equal(r1.erros.length, 1);
  assert.equal(db.social_posts.find((p) => p.tipo === 'story').status, 'erro');
  assert.equal(db.social_posts.find((p) => p.tipo === 'feed').item, 'Virgem');
  assert.equal(db.social_series.find((s) => s.serie === 'ponto_cego').proximo, 6);

  const r2 = await rodar(db, '2026-11-24');
  assert.equal(r2.erros.length, 0);
  const story = db.social_posts.find((p) => p.tipo === 'story');
  assert.equal(story.status, 'ok');
  assert.equal(story.tentativas, 2);
  assert.equal(chamadas.publicados.length, 2); // feed na 1ª rodada, story na 2ª
  assert.equal(db.social_series.find((s) => s.serie === 'ponto_cego').proximo, 6);
});

test('erro no feed na 1ª rodada: a 2ª posta o mesmo item', async () => {
  const db = novoDb();
  // story ok, feed falha
  const fetchOrig = global.fetch;
  let publishes = 0;
  global.fetch = async (url, opts) => {
    if (String(url).includes('/media_publish') && ++publishes === 2) return new Response(JSON.stringify({ error: { message: 'feed falhou' } }), { status: 400 });
    return fetchOrig(url, opts);
  };
  await rodar(db, '2026-11-25'); // quarta: anjo, índice 71 = Mumiah
  global.fetch = fetchOrig;
  assert.equal(db.social_posts.find((p) => p.tipo === 'feed').status, 'erro');
  assert.equal(db.social_series.find((s) => s.serie === 'anjo').proximo, 72);
  await rodar(db, '2026-11-25');
  const feed = db.social_posts.find((p) => p.tipo === 'feed');
  assert.equal(feed.status, 'ok');
  assert.equal(feed.item, 'Mumiah');
  assert.equal(db.social_series.find((s) => s.serie === 'anjo').proximo, 72);
  assert.match(chamadas.containers.at(-1).imagem, /feed\.jpg\?i=71&/);
});

test('no máximo 3 tentativas no dia', async () => {
  const db = novoDb();
  falharPublish = 99;
  for (let k = 0; k < 5; k++) await rodar(db, '2026-11-26'); // quinta: só story
  const story = db.social_posts.find((p) => p.tipo === 'story');
  assert.equal(story.tentativas, 3);
  assert.equal(story.status, 'erro');
  assert.equal(db.social_posts.length, 1, 'quinta não tem feed');
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
  const r = await rodar(db, '2026-11-23');
  assert.equal(chamadas.publicados.length, 0);
  assert.match(r.erros[0].erro, /0024/);
});

test('TikTok sem conta conectada: erro só no TikTok, Instagram segue', async () => {
  const db = novoDb();
  const r = await rodar(db, '2026-11-28', ['instagram', 'tiktok']);
  assert.equal(chamadas.publicados.length, 2);
  assert.equal(r.erros.length, 1);
  assert.equal(r.erros[0].rede, 'tiktok');
  assert.equal(db.social_posts.find((p) => p.rede === 'tiktok').status, 'erro');
});

test('token do Instagram: renova, guarda e usa o do banco; token novo na variável vence o do banco', async () => {
  assert.ok(precisaRenovar({ expiraEm: null, tentouEm: null }));
  const agora = Date.parse('2026-11-23T10:00:00Z');
  assert.ok(!precisaRenovar({ expiraEm: '2027-01-20T00:00:00Z' }, agora));
  assert.ok(precisaRenovar({ expiraEm: '2026-12-05T00:00:00Z' }, agora));
  assert.ok(!precisaRenovar({ expiraEm: '2026-12-05T00:00:00Z', tentouEm: '2026-11-23T01:00:00Z' }, agora));

  const db = novoDb();
  const sb = fakeSupabase(db);
  const t1 = await tokenInstagram(sb);
  assert.equal(t1.token, 'token-renovado');
  assert.equal(chamadas.refresh, 1);
  assert.equal(db.social_tokens[0].env_hash, hashToken('token-da-variavel'));
  const t2 = await tokenInstagram(sb);
  assert.equal(t2.token, 'token-renovado');
  assert.equal(chamadas.refresh, 1, 'não renova de novo com 60 dias pela frente');

  process.env.INSTAGRAM_ACCESS_TOKEN = 'outro-token';
  const t3 = await tokenInstagram(sb);
  assert.equal(chamadas.refresh, 2, 'token novo na variável: descarta o do banco e renova');
  assert.equal(t3.token, 'token-renovado');
  process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
});

test('modo do Instagram: variável manda; sem ela, o formato do token decide', () => {
  assert.equal(modoInstagram('EAAGm0PX4ZCpsBAxyz', undefined), 'facebook');
  assert.equal(modoInstagram('IGAAJx1234', undefined), 'instagram');
  assert.equal(modoInstagram('qualquer', undefined), 'instagram'); // caminho antigo
  assert.equal(modoInstagram('IGAAJx1234', 'facebook'), 'facebook');
  assert.equal(modoInstagram('EAAGm0PX4ZCpsBAxyz', 'instagram'), 'instagram');
  assert.equal(modoInstagram('x', 'https://graph.facebook.com'), 'facebook');
  assert.equal(modoInstagram('x', 'FACEBOOK'), 'facebook');
});

test('token de usuário do sistema (graph.facebook.com): não renova, não grava e publica no host do Facebook', async () => {
  process.env.INSTAGRAM_ACCESS_TOKEN = 'EAAsuat-de-teste';
  try {
    const db = novoDb();
    const t = await tokenInstagram(fakeSupabase(db));
    assert.deepEqual(t, { token: 'EAAsuat-de-teste', modo: 'facebook' });
    assert.equal(chamadas.refresh, 0);
    assert.equal(db.social_tokens.length, 0);

    const r = await rodar(db, '2026-11-23');
    assert.equal(r.erros.length, 0, JSON.stringify(r.erros));
    assert.equal(chamadas.refresh, 0, 'SUAT nunca é renovado');
    assert.equal(chamadas.publicados.length, 2);
    for (const c of chamadas.containers) {
      assert.ok(c.url.startsWith('https://graph.facebook.com/v24.0/17840000000000000/media'), c.url);
      assert.equal(c.token, 'EAAsuat-de-teste');
    }
  } finally {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
  }
});

test('caminho antigo continua em graph.instagram.com', async () => {
  await publicarNoInstagram({ token: 'IGAAantigo', tipo: 'story', imageUrl: `${BASE}/x.jpg` });
  assert.ok(chamadas.containers[0].url.startsWith('https://graph.instagram.com/v24.0/17840000000000000/media'));
});

test('conferência da conta: GET /{ig-user-id}?fields=username, sem devolver o token', async () => {
  process.env.INSTAGRAM_ACCESS_TOKEN = 'EAAsuat-de-teste';
  try {
    const ok = await conferirContaInstagram();
    assert.equal(ok.ok, true);
    assert.equal(ok.modo, 'facebook');
    assert.equal(ok.renova_sozinho, false);
    assert.deepEqual(ok.resultado, { username: 'conta_teste', id: '17840000000000000' });
    assert.match(chamadas.conferencias[0], /^https:\/\/graph\.facebook\.com\/v24\.0\/17840000000000000\?fields=username&access_token=/);
    assert.ok(!JSON.stringify(ok).includes('EAAsuat'), 'não vaza o token');

    process.env.INSTAGRAM_ACCESS_TOKEN = 'token-invalido';
    process.env.INSTAGRAM_API_HOST = 'facebook';
    const erro = await conferirContaInstagram();
    assert.equal(erro.ok, false);
    assert.match(erro.erro, /Invalid OAuth access token \(código 190\)/);
    assert.ok(!JSON.stringify(erro).includes('token-invalido'));
  } finally {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'token-da-variavel';
    delete process.env.INSTAGRAM_API_HOST;
  }
});
