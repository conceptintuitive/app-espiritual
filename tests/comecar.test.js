// Testes do /comecar, a página do link da bio (lib/comecar.js) e da
// declaração do formato (lib/utmSocial.js + lib/utmSocialServidor.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  postsDaEntrada, conteudoDoBloco, utmDoBloco, quando, linhaDoDia, LINHA_TESTE, MAX_POSTS, contaDoDia,
} from '../lib/comecar.js';
import { reduzirDia } from '../lib/reelsInterativo.js';
import { declaracaoValida, sessaoValida, DESTINO_DA_BIO } from '../lib/utmSocial.js';
import { registrarVisita, declararVisita } from '../lib/utmSocialServidor.js';
import { ARCANOS_MAIORES } from '../lib/tarot.js';
import { REFLEXAO_ARCANOS } from '../lib/tarotReflexao.js';
import { TEMAS } from '../lib/seuDiaTextos.js';
import { NUMERO_PROFUNDO } from '../lib/manualgenerator.js';
import { fraseDoDia, creditoDaFrase } from '../lib/frases.js';
import { problemasDoTexto } from '../lib/socialEditorial.js';

const HOJE = '2026-11-27'; // sexta
const FONTES = { arcanos: ARCANOS_MAIORES, reflexao: REFLEXAO_ARCANOS, temasSeuDia: TEMAS, numeroProfundo: NUMERO_PROFUNDO, fraseDoDia: (d) => fraseDoDia(d), creditoDaFrase };

test('postsDaEntrada: o que saiu, mais recente primeiro; sem card; narrado só com roteiro; até 4', () => {
  const publicados = [
    { data: '2026-11-24', formato: 'carta' },
    { data: '2026-11-25', formato: 'pausa' },
    { data: '2026-11-26', formato: 'narrado' },
    { data: '2026-11-23', formato: 'numero' },
    { data: '2026-11-22', formato: 'card' },
    { data: '2026-11-21', formato: 'carta' },
  ];
  const sem = postsDaEntrada({ hoje: HOJE, hora: 10, publicados });
  assert.deepEqual(sem.map((p) => [p.data, p.formato, p.quando]), [
    ['2026-11-25', 'pausa', 'quarta'], ['2026-11-24', 'carta', 'terça'], ['2026-11-23', 'numero', 'segunda'], ['2026-11-21', 'carta', 'sábado'],
  ]);
  const com = postsDaEntrada({ hoje: HOJE, hora: 10, publicados, comRoteiro: new Set(['2026-11-26']) });
  assert.equal(com[0].formato, 'narrado');
  assert.equal(com[0].quando, 'ontem');
  assert.equal(com.length, MAX_POSTS);
  assert.ok(com.every((p) => p.tipo === 'reels' && p.origem === 'Reel'));
});

test('postsDaEntrada: depois das 21h o Story da frase vem primeiro (sem repetir o Reel da frase do mesmo dia)', () => {
  const publicados = [{ data: HOJE, formato: 'frase' }, { data: '2026-11-25', formato: 'pausa' }];
  const manha = postsDaEntrada({ hoje: HOJE, hora: 20, publicados, fraseLigada: true });
  assert.deepEqual(manha.map((p) => [p.tipo, p.formato]), [['reels', 'frase'], ['reels', 'pausa']]);
  const noite = postsDaEntrada({ hoje: HOJE, hora: 21, publicados, fraseLigada: true });
  assert.deepEqual(noite.map((p) => [p.tipo, p.formato, p.origem]), [['story_frase', 'frase', 'Story'], ['reels', 'pausa', 'Reel']]);
  assert.equal(postsDaEntrada({ hoje: HOJE, hora: 22, publicados, fraseLigada: false })[0].tipo, 'reels', 'frase desligada: sem Story');
});

test('postsDaEntrada: sem banco, o rodízio (só o que sai das tabelas, sem narrado)', () => {
  const r = postsDaEntrada({ hoje: HOJE, hora: 10, publicados: null });
  assert.deepEqual(r.map((p) => [p.data, p.formato]), [['2026-11-25', 'pausa'], ['2026-11-24', 'carta'], ['2026-11-23', 'numero'], ['2026-11-21', 'carta']]);
  assert.equal(postsDaEntrada({ hoje: HOJE, hora: 10, publicados: [], fraseLigada: true })[0].formato, 'frase', 'sexta com a frase ligada');
});

test('utmDoBloco: tocar no post declara o formato certo', () => {
  assert.deepEqual(utmDoBloco({ tipo: 'reels', formato: 'carta' }), { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'interativo', utm_content: 'carta' });
  assert.deepEqual(utmDoBloco({ tipo: 'reels', formato: 'narrado' }), { utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'narrado' });
  assert.deepEqual(utmDoBloco({ tipo: 'story_frase', formato: 'frase' }), { utm_source: 'instagram', utm_medium: 'story', utm_campaign: 'frase' });
  for (const f of ['carta', 'pausa', 'numero', 'frase', 'narrado']) assert.ok(declaracaoValida(utmDoBloco({ tipo: 'reels', formato: f })), f);
});

test('conteudoDoBloco: os mesmos textos do Reel e do bot, só os do post', () => {
  const carta = conteudoDoBloco({ data: '2026-11-24', formato: 'carta' }, FONTES);
  assert.equal(carta.cartas.length, 3);
  for (const x of carta.cartas) {
    const id = ARCANOS_MAIORES.find((a) => a.nome === x.nome).id;
    assert.equal(x.central, REFLEXAO_ARCANOS[id].central);
    assert.equal(x.pratica, REFLEXAO_ARCANOS[id].pratica);
    assert.ok(REFLEXAO_ARCANOS[id].perguntas.includes(x.pergunta));
  }
  const num = conteudoDoBloco({ data: '2026-11-23', formato: 'numero' }, FONTES);
  assert.deepEqual(num.numeros.map((x) => x.numero), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(num.numeros[0].forca, NUMERO_PROFUNDO[1].forca);
  assert.equal(num.exemplo.numero, reduzirDia(num.exemplo.dia).numero);
  assert.equal(conteudoDoBloco({ data: '2026-11-25', formato: 'pausa' }, FONTES).praticas.length, 8);
  const frase = conteudoDoBloco({ data: HOJE, formato: 'frase' }, FONTES);
  assert.equal(frase.frase, fraseDoDia(HOJE).frase);
  assert.match(frase.credito, /^— /);
  assert.equal(conteudoDoBloco({ data: '2026-11-26', formato: 'narrado' }, FONTES), null, 'sem roteiro, sem bloco');
  const roteiro = { gancho: 'Hoje alguém vai te interromper.', porque: 'x', virada: 'y', pratica: 'Quando acontecer hoje, respira.' };
  assert.deepEqual(conteudoDoBloco({ data: '2026-11-26', formato: 'narrado' }, { ...FONTES, roteiros: { '2026-11-26': roteiro } }), roteiro);
  // só strings e números: vai como prop pro navegador
  assert.doesNotThrow(() => JSON.stringify(carta));
});

test('contaDoDia (navegador) = reduzirDia (Reel) de 1 a 31', () => {
  for (let d = 1; d <= 31; d++) assert.equal(contaDoDia(d).numero, reduzirDia(d).numero, `dia ${d}`);
  assert.deepEqual(contaDoDia(28), { numero: 1, conta: '2 + 8 = 10 → 1 + 0 = 1' });
  assert.deepEqual(contaDoDia(7), { numero: 7, conta: null });
});

test('textos: dia, "quando" e a linha do teste (e-mail, sem cartão, cancelar quando quiser) dentro das regras da marca', () => {
  assert.equal(quando(HOJE, HOJE), 'hoje');
  assert.equal(quando('2026-11-26', HOJE), 'ontem');
  assert.equal(quando('2026-11-24', HOJE), 'terça');
  assert.equal(linhaDoDia(HOJE, { fase: 'Crescente', signo: 'Peixes' }), 'Sexta, 27 de novembro · Lua Crescente em Peixes');
  assert.equal(linhaDoDia(HOJE, { fase: 'Lua Cheia', signo: 'Gêmeos' }), 'Sexta, 27 de novembro · Lua Cheia em Gêmeos', 'sem "Lua Lua"');
  assert.equal(linhaDoDia(HOJE), 'Sexta, 27 de novembro');
  assert.match(LINHA_TESTE, /7 dias/);
  assert.match(LINHA_TESTE, /e-mail/);
  assert.match(LINHA_TESTE, /Sem cartão/);
  assert.match(LINHA_TESTE, /cancelar .* quando quiser/);
  assert.deepEqual(problemasDoTexto(LINHA_TESTE), []);
  assert.equal(DESTINO_DA_BIO, '/comecar');
});

// Supabase falso mínimo (insert/update com eq) pra declaração da visita.
function falso(db, { semSessao = false } = {}) {
  class Q {
    constructor(t) { this.t = t; this.f = []; }
    insert(v) { this.op = 'insert'; this.v = v; return this; }
    update(v) { this.op = 'update'; this.v = v; return this; }
    eq(c, v) { this.f.push((r) => r[c] === v); return this; }
    then(ok, erro) {
      const tab = (db[this.t] ||= []);
      let res = { data: null, error: null };
      if (this.op === 'insert') {
        if (semSessao && 'sessao' in this.v) res = { data: null, error: { message: 'column "sessao" does not exist' } };
        else tab.push({ ...this.v });
      } else if (semSessao) res = { data: null, error: { message: 'column "sessao" does not exist' } };
      else for (const r of tab.filter((x) => this.f.every((fn) => fn(x)))) Object.assign(r, this.v);
      return Promise.resolve(res).then(ok, erro);
    }
  }
  return { from: (t) => new Q(t) };
}

const S = '0b5e9f6c-1d2a-4c3b-9e8f-7a6b5c4d3e2f';

test('declarar: a visita "bio" da sessão vira o formato tocado, 1x, sem visita nova', async () => {
  assert.equal(sessaoValida(S), true);
  assert.equal(sessaoValida('abc'), false);
  assert.equal(declaracaoValida({ utm_source: 'instagram', utm_medium: 'bio' }), null, 'bio não é declaração');
  const db = {};
  const sb = falso(db);
  await registrarVisita(sb, { utm_source: 'instagram', utm_medium: 'bio', sessao: S }, Date.parse('2026-11-27T15:00:00Z'));
  await registrarVisita(sb, { utm_source: 'instagram', utm_medium: 'bio', sessao: 'nao-e-uuid' }, Date.parse('2026-11-27T15:00:00Z'));
  assert.equal(db.social_visitas[0].sessao, S);
  assert.equal(db.social_visitas[1].sessao, undefined, 'id inválido não grava');
  assert.equal((await declararVisita(sb, { sessao: S, utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'interativo', utm_content: 'carta' })).ok, true);
  assert.deepEqual(db.social_visitas[0], { dia: '2026-11-27', source: 'instagram', medium: 'reel', campaign: 'interativo', content: 'carta', sessao: S });
  await declararVisita(sb, { sessao: S, utm_source: 'instagram', utm_medium: 'story', utm_campaign: 'frase' });
  assert.equal(db.social_visitas[0].campaign, 'interativo', 'a 1ª declaração fica');
  assert.equal(db.social_visitas.length, 2, 'nenhuma visita nova');
  assert.equal((await declararVisita(sb, { sessao: S, utm_source: 'instagram', utm_medium: 'bio' })).ok, false);
});

test('sem a migração 0032: a visita conta igual, sem o id; declarar só avisa', async () => {
  const db = {};
  const sb = falso(db, { semSessao: true });
  assert.equal((await registrarVisita(sb, { utm_source: 'instagram', utm_medium: 'bio', sessao: S })).ok, true);
  assert.deepEqual(db.social_visitas, [{ dia: db.social_visitas[0].dia, source: 'instagram', medium: 'bio', campaign: null, content: null }]);
  assert.match((await declararVisita(sb, { sessao: S, utm_source: 'instagram', utm_medium: 'reel', utm_campaign: 'narrado' })).motivo, /0032/);
});
