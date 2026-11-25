// Testes da atribuição das redes por formato (lib/utmSocial.js e
// lib/utmSocialServidor.js com um Supabase falso) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  utmDoPost, comUtm, destinoDaBio, CAMINHO_DA_BIO, visitaDasRedes, utmParaPerfil, diaBrasilia, diaDaChegada,
  linhaDoFunil, funilPorFormato, taxa, campanhaDoFormato,
} from '../lib/utmSocial.js';
import { registrarVisita, gravarUtmNoPerfil, funilSocial } from '../lib/utmSocialServidor.js';

test('utmDoPost: cada formato vira source/medium/campaign/content', () => {
  assert.deepEqual(utmDoPost({ tipo: 'reels', formato: 'carta' }), { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'interativo', utm_content: 'carta' });
  assert.deepEqual(utmDoPost({ tipo: 'reels', formato: 'narrado' }), { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'narrado' });
  assert.deepEqual(utmDoPost({ tipo: 'reels', formato: 'frase' }), { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'frase' });
  assert.deepEqual(utmDoPost({ tipo: 'story_frase' }), { utm_source: 'instagram', utm_medium: 'story', utm_campaign: 'frase' });
  assert.deepEqual(utmDoPost({ tipo: 'story' }), { utm_source: 'instagram', utm_medium: 'story', utm_campaign: 'dia' });
  assert.deepEqual(utmDoPost({ rede: 'tiktok', tipo: 'feed' }), { utm_source: 'tiktok', utm_medium: 'feed', utm_campaign: 'carrossel' });
  assert.deepEqual(utmDoPost({ tipo: 'comentario', formato: 'numero' }), { utm_source: 'instagram', utm_medium: 'comentario', utm_campaign: 'interativo', utm_content: 'numero' });
  assert.deepEqual(campanhaDoFormato('qualquer'), {});
});

test('links: UTM somada sem apagar o resto; bio curta em /ig e /tt', () => {
  assert.equal(comUtm('/?quiz=1', { utm_source: 'instagram', utm_medium: 'bio', utm_campaign: null }), '/?quiz=1&utm_source=instagram&utm_medium=bio');
  assert.equal(comUtm('https://intuitiveconcept.com.br/x#a', { utm_source: 'tiktok' }), 'https://intuitiveconcept.com.br/x?utm_source=tiktok#a');
  assert.equal(destinoDaBio('instagram'), '/comecar?utm_source=instagram&utm_medium=bio');
  assert.deepEqual(CAMINHO_DA_BIO, { instagram: '/ig', tiktok: '/tt' });
});

test('visitaDasRedes: só instagram/tiktok, só valores conhecidos (o contador é público)', () => {
  assert.deepEqual(visitaDasRedes({ utm_source: 'Instagram', utm_medium: 'bio' }), { source: 'instagram', medium: 'bio', campaign: null, content: null });
  assert.deepEqual(
    visitaDasRedes({ utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'interativo', utm_content: 'carta' }),
    { source: 'instagram', medium: 'reel', campaign: 'interativo', content: 'carta' },
  );
  assert.deepEqual(visitaDasRedes({ utm_source: 'instagram', utm_medium: '<script>', utm_campaign: 'x'.repeat(500) }), { source: 'instagram', medium: null, campaign: null, content: null });
  assert.equal(visitaDasRedes({ utm_source: 'google', utm_medium: 'cpc' }), null);
  assert.equal(visitaDasRedes(null), null);
});

test('utmParaPerfil: só UTM e o dia do clique, nada que identifique', () => {
  const agora = new Date('2026-11-25T12:00:00Z');
  const u = utmParaPerfil({ consent: true, client_id: '1.2', gclid: 'abcdefghijkl', session_id: '9', utm_source: 'instagram', utm_medium: 'bio', clique_ts: 1764000000000 }, agora);
  assert.deepEqual(u, { utm_source: 'instagram', utm_medium: 'bio', clique_ts: 1764000000000, em: agora.toISOString() });
  assert.equal(utmParaPerfil({ consent: false }), null);
  assert.equal(utmParaPerfil(null), null);
});

test('dias em Brasília', () => {
  assert.equal(diaBrasilia(Date.parse('2026-11-26T02:30:00Z')), '2026-11-25');
  assert.equal(diaBrasilia('2026-11-26T03:30:00Z'), '2026-11-26');
  assert.equal(diaBrasilia('x'), null);
  assert.equal(diaDaChegada({ clique_ts: Date.parse('2026-11-20T15:00:00Z') }, '2026-11-25T15:00:00Z'), '2026-11-20');
  assert.equal(diaDaChegada({}, '2026-11-25T15:00:00Z'), '2026-11-25');
});

test('linhaDoFunil: formato declarado como veio; bio = Reel do dia da chegada (provável)', () => {
  assert.deepEqual(linhaDoFunil({ utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'interativo', utm_content: 'carta' }, 'narrado'),
    { chave: 'instagram/reel/interativo/carta', rede: 'instagram', rotulo: 'reel · Escolhe uma carta', provavel: false });
  assert.deepEqual(linhaDoFunil({ source: 'instagram', medium: 'story', campaign: 'frase' }),
    { chave: 'instagram/story/frase/-', rede: 'instagram', rotulo: 'story · Frase do dia', provavel: false });
  assert.deepEqual(linhaDoFunil({ utm_source: 'instagram', utm_medium: 'bio' }, 'pausa'),
    { chave: 'instagram/bio/pausa', rede: 'instagram', rotulo: 'bio · dia de Reel Pausa o vídeo', provavel: true });
  assert.equal(linhaDoFunil({ utm_source: 'tiktok' }, null).rotulo, 'bio · dia sem Reel publicado');
  assert.equal(linhaDoFunil({ utm_source: 'google', utm_medium: 'cpc' }), null);
});

test('funilPorFormato: soma por linha, cada pessoa 1x por etapa, total e taxa', () => {
  const bio = { utm_source: 'instagram', utm_medium: 'bio' };
  const carta = { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'interativo', utm_content: 'carta' };
  const f = funilPorFormato({
    formatoPorDia: { '2026-11-24': 'carta', '2026-11-25': 'pausa' },
    visitas: [{ utm: { source: 'instagram', medium: 'bio' }, dia: '2026-11-24' }, { utm: { source: 'instagram', medium: 'bio' }, dia: '2026-11-24' }, { utm: { source: 'instagram', medium: 'bio' }, dia: '2026-11-25' }],
    quiz: [{ utm: bio, dia: '2026-11-24', pessoa: 'a' }, { utm: bio, dia: '2026-11-24', pessoa: 'a' }, { utm: carta, dia: '2026-11-25', pessoa: 'b' }],
    teste: [{ utm: bio, dia: '2026-11-24', pessoa: 'a' }],
    assinatura: [{ utm: bio, dia: '2026-11-24', pessoa: 'a' }],
    manual: [],
  });
  const carta24 = f.linhas.find((l) => l.chave === 'instagram/bio/carta');
  assert.deepEqual([carta24.visitas, carta24.quiz, carta24.teste, carta24.assinatura], [2, 1, 1, 1], 'quiz refeito conta 1 pessoa');
  assert.equal(f.linhas[0].chave, 'instagram/bio/carta', 'mais visitas primeiro');
  assert.equal(f.linhas.find((l) => l.chave === 'instagram/reel/interativo/carta').quiz, 1);
  assert.deepEqual(f.total, { visitas: 3, quiz: 2, teste: 1, assinatura: 1, manual: 0 });
  assert.equal(taxa(1, 4), '25%');
  assert.equal(taxa(1, 0), '–');
});

// Supabase falso, só o que as consultas usam.
function falso(db) {
  const log = [];
  class Q {
    constructor(t) { this.t = t; this.f = []; this.op = 'select'; }
    select() { return this; }
    insert(v) { this.op = 'insert'; this.v = v; return this; }
    update(v) { this.op = 'update'; this.v = v; return this; }
    eq(c, v) { this.f.push((r) => r[c] === v); return this; }
    gte(c, v) { this.f.push((r) => r[c] >= v); return this; }
    is(c, v) { this.f.push((r) => (r[c] ?? null) === v); return this; }
    in(c, vs) { this.f.push((r) => vs.includes(r[c])); return this; }
    not(c) { this.f.push((r) => r[c] != null); return this; }
    filter(c, op, v) {
      const [col, campo] = c.split('->>');
      const vs = v.replace(/[()]/g, '').split(',');
      this.f.push((r) => vs.includes(r[col]?.[campo]));
      return this;
    }
    limit() { return this; }
    then(ok, erro) { return Promise.resolve(this.rodar()).then(ok, erro); }
    rodar() {
      if (db.erro?.[this.t]) return { data: null, error: { message: db.erro[this.t] } };
      const tab = (db[this.t] ||= []);
      log.push([this.op, this.t]);
      if (this.op === 'insert') { tab.push(this.v); return { data: null, error: null }; }
      const achados = tab.filter((r) => this.f.every((fn) => fn(r)));
      if (this.op === 'update') { for (const r of achados) Object.assign(r, this.v); return { data: null, error: null }; }
      return { data: achados, error: null };
    }
  }
  return { from: (t) => new Q(t), log };
}

test('registrarVisita: grava só dia e rótulos; fora das redes não grava', async () => {
  const db = {};
  const sb = falso(db);
  assert.deepEqual(await registrarVisita(sb, { utm_source: 'instagram', utm_medium: 'bio', email: 'x@y.z', ip: '1.2.3.4' }, Date.parse('2026-11-25T15:00:00Z')), { ok: true });
  assert.deepEqual(db.social_visitas, [{ dia: '2026-11-25', source: 'instagram', medium: 'bio', campaign: null, content: null }]);
  assert.equal((await registrarVisita(sb, { utm_source: 'google' })).ok, false);
  assert.equal(db.social_visitas.length, 1);
});

test('gravarUtmNoPerfil: grava 1x (não troca a primeira) e avisa sem a migração', async () => {
  const db = { seu_dia_perfis: [{ email: 'ana@exemplo.com', atribuicao: null }] };
  const sb = falso(db);
  assert.equal((await gravarUtmNoPerfil(sb, ' Ana@Exemplo.com ', { utm_source: 'instagram', utm_medium: 'bio', client_id: '1.2' })).ok, true);
  assert.equal(db.seu_dia_perfis[0].atribuicao.utm_source, 'instagram');
  assert.equal(db.seu_dia_perfis[0].atribuicao.client_id, undefined);
  await gravarUtmNoPerfil(sb, 'ana@exemplo.com', { utm_source: 'tiktok', utm_medium: 'bio' });
  assert.equal(db.seu_dia_perfis[0].atribuicao.utm_source, 'instagram', 'a primeira fica');
  assert.equal((await gravarUtmNoPerfil(sb, 'ana@exemplo.com', { consent: false })).motivo, 'sem utm');
  const semColuna = falso({ erro: { seu_dia_perfis: 'column "atribuicao" does not exist' } });
  assert.match((await gravarUtmNoPerfil(semColuna, 'ana@exemplo.com', { utm_source: 'instagram' })).motivo, /0031/);
});

test('funilSocial: junta visitas, quiz, teste, assinatura e Manual pelas tabelas', async () => {
  const ts = Date.parse('2026-11-24T15:00:00Z'); // terça: Reel de carta
  const bio = { consent: false, utm_source: 'instagram', utm_medium: 'bio', clique_ts: ts };
  const db = {
    social_posts: [
      { data: '2026-11-24', rede: 'instagram', tipo: 'reels', status: 'ok', formato: 'carta' },
      { data: '2026-11-25', rede: 'instagram', tipo: 'reels', status: 'ok', formato: 'pausa' },
    ],
    social_visitas: [
      { dia: '2026-11-24', source: 'instagram', medium: 'bio', campaign: null, content: null },
      { dia: '2026-11-24', source: 'instagram', medium: 'bio', campaign: null, content: null },
      { dia: '2026-11-25', source: 'instagram', medium: 'bio', campaign: null, content: null },
    ],
    analises: [
      { email: 'ana@exemplo.com', created_at: '2026-11-24T16:00:00Z', payment_status: 'paid', origem: 'venda', atribuicao: bio },
      { email: 'bia@exemplo.com', created_at: '2026-11-24T17:00:00Z', payment_status: 'pending', origem: null, atribuicao: bio },
      { email: 'teste@exemplo.com', created_at: '2026-11-24T17:00:00Z', payment_status: 'paid', origem: 'teste', atribuicao: bio },
      { email: 'gui@exemplo.com', created_at: '2026-11-24T17:00:00Z', payment_status: 'paid', origem: 'venda', atribuicao: { utm_source: 'google' } },
    ],
    seu_dia_perfis: [
      { email: 'ana@exemplo.com', teste_inicio: '2026-11-24T16:05:00Z', atribuicao: { ...bio, em: '2026-11-24T16:05:00Z' } },
      { email: 'cid@exemplo.com', teste_inicio: null, atribuicao: { utm_source: 'instagram', utm_medium: 'bio', clique_ts: ts } },
    ],
    assinaturas: [
      { email: 'ana@exemplo.com', acesso_ate: '2026-12-30T00:00:00Z', criado_em: '2026-12-01T10:00:00Z' },
      { email: 'bia@exemplo.com', acesso_ate: null, criado_em: '2026-11-25T10:00:00Z' },
    ],
  };
  const f = await funilSocial({ supabase: falso(db), hoje: '2026-11-25' });
  assert.deepEqual(f.avisos, []);
  const carta = f.linhas.find((l) => l.chave === 'instagram/bio/carta');
  assert.deepEqual([carta.visitas, carta.quiz, carta.teste, carta.assinatura, carta.manual], [2, 2, 1, 1, 1], 'compra de teste e google fora');
  assert.equal(carta.provavel, true);
  assert.equal(f.linhas.find((l) => l.chave === 'instagram/bio/pausa').visitas, 1);
  // sem a migração 0031: visitas e perfis viram aviso, o resto segue
  const sem = await funilSocial({ supabase: falso({ ...db, erro: { social_visitas: 'relation does not exist', seu_dia_perfis: 'column atribuicao does not exist' } }), hoje: '2026-11-25' });
  assert.equal(sem.avisos.length, 2);
  assert.equal(sem.total.quiz, 2);
});
