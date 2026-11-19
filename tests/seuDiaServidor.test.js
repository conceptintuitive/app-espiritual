// Testes de lib/seuDiaServidor.js (tokens e validação) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SEU_DIA_SECRET = 'segredo-de-teste';
const { tokenLogin, tokenSessao, emailDoTokenLogin, emailDaSessao, validarDados, emailExato, COOKIE_SESSAO } = await import('../lib/seuDiaServidor.js');

const req = (valor) => ({ cookies: { get: (n) => (n === COOKIE_SESSAO && valor ? { value: valor } : undefined) } });

test('token de login vale como login, não como sessão (e vice-versa)', () => {
  const t = tokenLogin('bia@exemplo.com');
  assert.equal(emailDoTokenLogin(t), 'bia@exemplo.com');
  assert.equal(emailDaSessao(req(t)), null);
  const s = tokenSessao('bia@exemplo.com');
  assert.equal(emailDaSessao(req(s)), 'bia@exemplo.com');
  assert.equal(emailDoTokenLogin(s), null);
});

test('token adulterado ou de outro segredo é recusado', () => {
  const t = tokenLogin('bia@exemplo.com');
  const [corpo, sig] = t.split('.');
  const outroCorpo = Buffer.from(JSON.stringify({ e: 'outra@exemplo.com', k: 'login', x: Date.now() + 1e6 })).toString('base64url');
  assert.equal(emailDoTokenLogin(`${outroCorpo}.${sig}`), null);
  assert.equal(emailDoTokenLogin(`${corpo}.${sig}x`), null);
  assert.equal(emailDoTokenLogin('lixo'), null);
  assert.equal(emailDaSessao(req(undefined)), null);
});

test('validarDados: aceita o básico e recusa cidade fora do Brasil', () => {
  const ok = validarDados({ nome: ' Bianca ', dataNascimento: '1994-12-21', hora: '07:25', cidade: { ibge: 3205309, nome: 'Vitória', uf: 'ES', lat: -20.32, lon: -40.34, tz: 'America/Sao_Paulo' } });
  assert.equal(ok.nome, 'Bianca');
  assert.equal(ok.cidade.tz, 'America/Sao_Paulo');
  assert.equal(validarDados({ dataNascimento: '1994-12-21', hora: null }).hora, null);
  assert.ok(validarDados({ dataNascimento: '21/12/1994' }).erro);
  assert.ok(validarDados({ dataNascimento: '1994-12-21', hora: '25:00' }).erro);
  assert.ok(validarDados({ dataNascimento: '1994-12-21', cidade: { ibge: 3205309, lat: 48.8, lon: 2.3, tz: 'Europe/Paris' } }).erro);
});

test('emailExato escapa curingas do ILIKE', () => {
  assert.equal(emailExato('a_b%c@x.com'), 'a\\_b\\%c@x.com');
});
