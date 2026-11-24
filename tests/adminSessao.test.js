// Testes da sessão do /admin e das regras da tela de Direct Post do TikTok
// (lib/adminSessao.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSessaoAdmin, sessaoAdminValida, segredoConfere, problemasDaAprovacao } from '../lib/adminSessao.js';

test('sessão: vale com o mesmo segredo e dentro de 12h', () => {
  const agora = Date.parse('2026-12-01T10:00:00Z');
  const { valor } = criarSessaoAdmin('s3gr3do', agora);
  assert.ok(sessaoAdminValida(valor, 's3gr3do', agora + 3600000));
  assert.ok(!sessaoAdminValida(valor, 's3gr3do', agora + 13 * 3600000), 'venceu');
  assert.ok(!sessaoAdminValida(valor, 'outro', agora));
  assert.ok(!sessaoAdminValida(valor.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a')), 's3gr3do', agora));
  assert.ok(!sessaoAdminValida('', 's3gr3do', agora));
  assert.ok(!sessaoAdminValida(valor, '', agora));
  assert.ok(!valor.includes('s3gr3do'), 'o cookie não leva o segredo');
  assert.ok(segredoConfere('abc', 'abc'));
  assert.ok(!segredoConfere('abd', 'abc'));
  assert.ok(!segredoConfere('abc', ''));
});

test('Direct Post: privacidade escolhida, consentimento e conteúdo comercial', () => {
  const criador = { privacy_level_options: ['PUBLIC_TO_EVERYONE', 'SELF_ONLY'], comment_disabled: false };
  const ok = { privacy_level: 'PUBLIC_TO_EVERYONE', consentimento: true, disable_comment: true, titulo: 'x', descricao: 'y' };
  assert.deepEqual(problemasDaAprovacao(ok, criador), []);
  assert.ok(problemasDaAprovacao({ ...ok, privacy_level: '' }, criador).length, 'sem valor padrão de privacidade');
  assert.ok(problemasDaAprovacao({ ...ok, privacy_level: 'FOLLOWER_OF_CREATOR' }, criador).length, 'só as opções da conta');
  assert.ok(problemasDaAprovacao({ ...ok, consentimento: false }, criador).length);
  assert.ok(problemasDaAprovacao({ ...ok, divulgacao: true }, criador).length, 'comercial sem opção');
  assert.deepEqual(problemasDaAprovacao({ ...ok, divulgacao: true, brand_organic_toggle: true }, criador), []);
  assert.ok(problemasDaAprovacao({ ...ok, divulgacao: true, brand_content_toggle: true, privacy_level: 'SELF_ONLY' }, criador).length, 'marca não pode ser privado');
  assert.ok(problemasDaAprovacao({ ...ok, disable_comment: false }, { ...criador, comment_disabled: true }).length);
  assert.ok(problemasDaAprovacao({ ...ok, titulo: 'x'.repeat(91) }, criador).length);
});
