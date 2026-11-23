// Testes de lib/seuDiaEmail.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailsDeHoje, montarEmailDiario, montarEmailTesteD5, montarEmailTesteD7 } from '../lib/seuDiaEmail.js';
import { montarPerfil, leituraDoDia } from '../lib/seuDia.js';

const inicio = '2026-11-23T23:30:00Z'; // dia 1 = 23/11 (Brasília)
const em = (d) => Date.parse(`2026-11-${d}T10:00:00Z`); // 7h de Brasília
const ctx = (d, extra = {}) => ({ hoje: `2026-11-${d}`, agora: em(d), assinou: false, manualPago: false, ...extra });

test('diário: 1x por dia; descadastro corta tudo', () => {
  assert.deepEqual(emailsDeHoje({ email_diario: true }, ctx(24)), ['diario']);
  assert.deepEqual(emailsDeHoje({ email_diario: null }, ctx(24)), ['diario']); // coluna nova sem valor = padrão ligado
  assert.deepEqual(emailsDeHoje({ email_diario_ultimo: '2026-11-24' }, ctx(24)), []); // cron rodou 2x
  assert.deepEqual(emailsDeHoje({ email_diario: false, teste_inicio: inicio }, ctx(27)), []);
  assert.deepEqual(emailsDeHoje(null, ctx(24)), []);
});

test('fim do teste: dia 5 e dia 7, 1x cada, só sem assinatura e sem Manual', () => {
  const row = { teste_inicio: inicio };
  assert.deepEqual(emailsDeHoje(row, ctx(27)), ['diario', 'teste_d5']);
  assert.deepEqual(emailsDeHoje(row, ctx(29)), ['diario', 'teste_d7']);
  assert.deepEqual(emailsDeHoje(row, ctx(28)), ['diario']);
  assert.deepEqual(emailsDeHoje({ ...row, email_teste_d5_em: '2026-11-27T10:00:00Z' }, ctx(27)), ['diario']);
  assert.deepEqual(emailsDeHoje(row, ctx(27, { assinou: true })), ['diario']);
  assert.deepEqual(emailsDeHoje(row, ctx(29, { manualPago: true })), ['diario']);
});

test('textos: assunto com o título do dia, Faça, botão e descadastro', () => {
  const l = leituraDoDia(montarPerfil({ dataNascimento: '1994-12-21', hora: '07:25' }), '2026-11-25');
  const e = montarEmailDiario({ nome: 'Bia <b>', leitura: l, completo: true, linkDia: 'https://x/seu-dia?aba=hoje', descadastro: 'https://x/api/unsubscribe?sd=t' });
  assert.equal(e.subject, `Hoje: ${l.titulo.replace(/[.!]+$/, '')}`);
  assert.ok(e.html.includes('Abrir meu dia') && e.html.includes(l.faca[0]) && e.html.includes('unsubscribe?sd=t'));
  assert.ok(!e.html.includes('<b>,'), 'nome escapado');
  assert.ok(e.text.includes('Não quer mais receber? https://x/api/unsubscribe?sd=t'));
  const resumo = montarEmailDiario({ nome: null, leitura: l, completo: false, linkDia: 'https://x', descadastro: 'https://u' });
  assert.ok(resumo.html.includes('Ver o dia completo'));
  assert.equal(montarEmailTesteD5({ nome: 'Bia', linkAssinar: 'a', descadastro: 'u' }).subject, 'Faltam 2 dias do seu Seu Dia Completo');
  const d7 = montarEmailTesteD7({ nome: null, linkAssinar: 'https://x/assinar', descadastro: 'u' });
  assert.equal(d7.subject, 'Amanhã seu dia volta pro resumo');
  assert.ok(d7.html.includes('https://x/assinar'));
});
