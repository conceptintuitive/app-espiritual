// Testes do contador anônimo das etapas do quiz (lib/quizEtapas.js e
// lib/quizEtapasServidor.js com um Supabase falso) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ETAPAS, origemDaVisita, linhaDaEtapa, funilDoQuiz, taxa, maiorPerda, diaBrasilia } from '../lib/quizEtapas.js';
import { registrarEtapa, funilQuiz } from '../lib/quizEtapasServidor.js';

const S = '0b5e9f6c-1d2a-4c3b-9e8f-7a6b5c4d3e2f';

test('etapas: 0 = viu a home … 5 = concluiu', () => {
  assert.deepEqual(ETAPAS.map((e) => e.n), [0, 1, 2, 3, 4, 5]);
  assert.equal(ETAPAS[0].rotulo, 'Viu a home');
  assert.equal(ETAPAS[5].rotulo, 'Concluiu');
});

test('origem: campanha conhecida, clique de anúncio ou direto', () => {
  assert.equal(origemDaVisita({ utm_source: 'TikTok' }), 'tiktok');
  assert.equal(origemDaVisita({ utm_source: 'instagram' }), 'instagram');
  assert.equal(origemDaVisita({ utm_source: 'facebook' }), 'meta');
  assert.equal(origemDaVisita({ utm_source: 'meta' }), 'meta');
  assert.equal(origemDaVisita({ utm_source: 'google' }), 'google');
  assert.equal(origemDaVisita({ utm_source: 'newsletter' }), 'outro');
  assert.equal(origemDaVisita({ clique: 'google' }), 'google');
  assert.equal(origemDaVisita({ clique: 'meta' }), 'meta');
  assert.equal(origemDaVisita({ clique: '<script>' }), 'direto');
  assert.equal(origemDaVisita({}), 'direto');
  assert.equal(origemDaVisita(), 'direto');
});

test('linhaDaEtapa: só dia, id aleatório, etapa e origem; recusa o resto', () => {
  const agora = Date.parse('2026-11-28T02:30:00Z'); // 27/11 em Brasília
  assert.deepEqual(
    linhaDaEtapa({ sessao: S.toUpperCase(), etapa: 3, utm_source: 'tiktok', email: 'x@y.z', ip: '1.2.3.4' }, agora),
    { dia: '2026-11-27', sessao: S, etapa: 3, origem: 'tiktok' },
  );
  assert.equal(linhaDaEtapa({ sessao: S, etapa: 6 }), null);
  assert.equal(linhaDaEtapa({ sessao: S, etapa: -1 }), null);
  assert.equal(linhaDaEtapa({ sessao: 'qualquer-coisa', etapa: 1 }), null);
  assert.equal(linhaDaEtapa(null), null);
  assert.equal(diaBrasilia(Date.parse('2026-11-28T03:30:00Z')), '2026-11-28');
});

test('funilDoQuiz: soma por origem, total, ordem por quem mais viu a home', () => {
  const f = funilDoQuiz([
    { dia: '2026-11-26', origem: 'tiktok', etapa: 0, sessoes: 200 },
    { dia: '2026-11-27', origem: 'tiktok', etapa: 0, sessoes: 50 },
    { dia: '2026-11-26', origem: 'tiktok', etapa: 1, sessoes: 30 },
    { dia: '2026-11-26', origem: 'tiktok', etapa: 2, sessoes: 25 },
    { dia: '2026-11-26', origem: 'tiktok', etapa: 3, sessoes: 12 },
    { dia: '2026-11-26', origem: 'tiktok', etapa: 4, sessoes: 9 },
    { dia: '2026-11-26', origem: 'tiktok', etapa: 5, sessoes: 7 },
    { dia: '2026-11-26', origem: 'direto', etapa: 0, sessoes: 40 },
    { dia: '2026-11-26', origem: 'direto', etapa: 1, sessoes: 10 },
    { dia: '2026-11-26', origem: 'xyz', etapa: 0, sessoes: 1 },
    { dia: '2026-11-26', origem: 'direto', etapa: 9, sessoes: 99 },
  ]);
  assert.deepEqual(f.linhas.map((l) => l.origem), ['tiktok', 'direto', 'outro']);
  assert.deepEqual(f.linhas[0].etapas, [250, 30, 25, 12, 9, 7]);
  assert.deepEqual(f.total.etapas, [291, 40, 25, 12, 9, 7]);
  assert.equal(taxa(7, 30), '23%');
  assert.equal(taxa(1, 0), '–');
  // maior perda entre abrir e concluir: etapa 2 → 3 (25 → 12)
  const p = maiorPerda(f.linhas[0].etapas);
  assert.deepEqual([p.de, p.para], [2, 3]);
  assert.equal(maiorPerda([10, 0, 0, 0, 0, 0]), null);
});

function falso(db, { semTabela = false } = {}) {
  class Q {
    constructor(t) { this.t = t; this.f = []; }
    upsert(v, opc) { this.op = 'upsert'; this.v = v; this.opc = opc; return this; }
    select() { this.op = 'select'; return this; }
    gte(c, v) { this.f.push((r) => r[c] >= v); return this; }
    limit() { return this; }
    then(ok, erro) {
      let res;
      if (semTabela) res = { data: null, error: { message: `relation "${this.t}" does not exist` } };
      else if (this.op === 'upsert') {
        const tab = (db[this.t] ||= []);
        const dup = tab.some((r) => r.sessao === this.v.sessao && r.etapa === this.v.etapa);
        if (!dup) tab.push({ ...this.v });
        else if (!this.opc?.ignoreDuplicates) res = { data: null, error: { message: 'duplicate key' } };
        res ||= { data: null, error: null };
      } else {
        // a view agrupa: aqui o falso monta o resumo a partir da tabela
        const rows = (db.quiz_etapas || []).filter((r) => this.f.every((fn) => fn(r)));
        const g = new Map();
        for (const r of rows) { const k = `${r.dia}|${r.origem}|${r.etapa}`; g.set(k, (g.get(k) || 0) + 1); }
        res = { data: [...g].map(([k, n]) => { const [dia, origem, etapa] = k.split('|'); return { dia, origem, etapa: Number(etapa), sessoes: n }; }), error: null };
      }
      return Promise.resolve(res).then(ok, erro);
    }
  }
  return { from: (t) => new Q(t) };
}

test('registrarEtapa: 1x por sessão e etapa; sem a migração, só avisa', async () => {
  const db = {};
  const sb = falso(db);
  const agora = Date.parse('2026-11-27T15:00:00Z');
  assert.deepEqual(await registrarEtapa(sb, { sessao: S, etapa: 0, utm_source: 'tiktok' }, agora), { ok: true });
  assert.deepEqual(await registrarEtapa(sb, { sessao: S, etapa: 0, utm_source: 'tiktok' }, agora), { ok: true });
  await registrarEtapa(sb, { sessao: S, etapa: 1, utm_source: 'tiktok' }, agora);
  assert.equal(db.quiz_etapas.length, 2, 'a repetida não entra');
  assert.deepEqual(Object.keys(db.quiz_etapas[0]).sort(), ['dia', 'etapa', 'origem', 'sessao']);
  assert.equal((await registrarEtapa(sb, { sessao: 'x', etapa: 1 })).motivo, 'pedido inválido');
  assert.match((await registrarEtapa(falso({}, { semTabela: true }), { sessao: S, etapa: 1 })).motivo, /0034/);
});

test('funilQuiz: lê o resumo do período e avisa sem a migração', async () => {
  const db = {
    quiz_etapas: [
      { dia: '2026-11-27', sessao: 'a', etapa: 0, origem: 'meta' },
      { dia: '2026-11-27', sessao: 'a', etapa: 1, origem: 'meta' },
      { dia: '2026-11-27', sessao: 'b', etapa: 0, origem: 'meta' },
      { dia: '2026-11-01', sessao: 'c', etapa: 0, origem: 'meta' }, // fora dos 14 dias
    ],
  };
  const f = await funilQuiz({ supabase: falso(db), hoje: '2026-11-27' });
  assert.equal(f.desde, '2026-11-14');
  assert.deepEqual(f.linhas, [{ origem: 'meta', etapas: [2, 1, 0, 0, 0, 0] }]);
  const sem = await funilQuiz({ supabase: falso({}, { semTabela: true }), hoje: '2026-11-27' });
  assert.match(sem.erro, /0034/);
  assert.deepEqual(sem.linhas, []);
});
