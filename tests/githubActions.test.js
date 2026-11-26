// O site dispara o workflow do Reels quando o agendamento do GitHub falha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configGithub, decidirDisparo, dispararReelsSePreciso, MAX_DISPAROS_POR_DIA } from '../lib/githubActions.js';

const run = (status, event, created_at) => ({ status, event, created_at });

test('configGithub: sem token = desligado; repo e ref com padrão', () => {
  assert.equal(configGithub({}), null);
  assert.deepEqual(configGithub({ GITHUB_TOKEN_REELS: ' t ' }), { token: 't', repo: 'conceptintuitive/app-espiritual', ref: 'main' });
});

test('decidirDisparo: não dispara com execução na fila ou rodando', () => {
  assert.equal(decidirDisparo([run('in_progress', 'schedule', '2026-11-26T10:20:00Z')], '2026-11-26').disparar, false);
  assert.equal(decidirDisparo([run('queued', 'workflow_dispatch', '2026-11-26T10:20:00Z')], '2026-11-26').disparar, false);
});

test('decidirDisparo: no máximo 3 disparos manuais por dia (de Brasília)', () => {
  const tres = Array.from({ length: MAX_DISPAROS_POR_DIA }, (_, i) => run('completed', 'workflow_dispatch', `2026-11-26T1${i}:00:00Z`));
  assert.equal(decidirDisparo(tres, '2026-11-26').disparar, false);
  // 01h UTC do dia 27 ainda é 26 em Brasília (22h)
  assert.equal(decidirDisparo([...tres.slice(0, 2), run('completed', 'workflow_dispatch', '2026-11-27T01:00:00Z')], '2026-11-26').disparar, false);
  // execuções agendadas e de outros dias não contam
  assert.equal(decidirDisparo([run('completed', 'schedule', '2026-11-26T10:00:00Z'), ...tres.map((r) => ({ ...r, created_at: r.created_at.replace('26', '25') }))], '2026-11-26').disparar, true);
});

test('dispararReelsSePreciso: lista as execuções e manda o dispatch com o ref', async () => {
  const chamadas = [];
  const fetchImpl = async (url, opts = {}) => {
    chamadas.push({ url, opts });
    if (url.endsWith('/runs?per_page=20')) return new Response(JSON.stringify({ workflow_runs: [] }), { status: 200 });
    return new Response(null, { status: 204 });
  };
  const r = await dispararReelsSePreciso({ config: { token: 'tk', repo: 'dona/repo', ref: 'main' }, hoje: '2026-11-26', fetchImpl });
  assert.deepEqual(r, { disparado: true });
  assert.equal(chamadas[1].url, 'https://api.github.com/repos/dona/repo/actions/workflows/reels.yml/dispatches');
  assert.equal(chamadas[1].opts.method, 'POST');
  assert.deepEqual(JSON.parse(chamadas[1].opts.body), { ref: 'main' });
  assert.equal(chamadas[1].opts.headers.Authorization, 'Bearer tk');
});

test('dispararReelsSePreciso: sem token não chama nada; erro da API vira exceção', async () => {
  assert.deepEqual(await dispararReelsSePreciso({ config: null, hoje: '2026-11-26', fetchImpl: () => { throw new Error('não devia'); } }), { disparado: false, motivo: 'sem GITHUB_TOKEN_REELS' });
  await assert.rejects(
    dispararReelsSePreciso({ config: { token: 'x', repo: 'a/b', ref: 'main' }, hoje: '2026-11-26', fetchImpl: async () => new Response('Bad credentials', { status: 401 }) }),
    /401/,
  );
});
