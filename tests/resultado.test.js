// Testes de lib/resultadoManual.js e lib/seuDiaRepasse.js (/resultado) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { secoesDoManual, rotuloContador, faqResultado } from '../lib/resultadoManual.js';
import { salvarEmailSeuDia, consumirEmailSeuDia, CHAVE_EMAIL_SEU_DIA } from '../lib/seuDiaRepasse.js';

test('secoesDoManual: 14 seções, com as frases da IA quando existem', () => {
  const s = secoesDoManual({
    nome: 'Bianca', signo: 'Sagitário', numero: 11, anoPessoal: 3, objetivo: 'Carreira e Propósito', arquetipo: 'A Visionária',
    diagnostico: { frase: '"Você corre antes de chegar."' }, amor: { headline: 'Você ama no futuro' },
    arquetipos: { dominante: { nome: 'A Exploradora' }, emocional: { nome: 'A Sábia' }, sombra: { nome: 'A Fugitiva' } },
  });
  assert.equal(s.length, 14);
  const por = Object.fromEntries(s.map((x) => [x.chave, x.titulo]));
  assert.equal(por.diagnostico, 'Você corre antes de chegar.');
  assert.equal(por.amor, 'Você ama no futuro');
  assert.equal(por.arquetipos, 'A Exploradora · A Sábia · A Fugitiva');
  assert.equal(por.bloqueios, 'O que trava você na carreira agora');
  assert.match(por.calendario, /Ano Pessoal 3/);
  assert.match(por.fechamento, /Bianca/);
});

test('secoesDoManual: sem as frases da IA, cai nos títulos com signo e número', () => {
  const por = Object.fromEntries(secoesDoManual({ nome: 'Ana', signo: 'Leão', numero: 7 }).map((x) => [x.chave, x.titulo]));
  assert.equal(por.diagnostico, 'O padrão do número 7 na sua fase atual');
  assert.equal(por.amor, 'Como Leão ama, e onde se perde');
  assert.equal(por.bloqueios, 'O que trava o seu próximo passo');
  assert.match(por.objetivo, /ciclo atual/);
});

test('rotuloContador e FAQ', () => {
  assert.equal(rotuloContador(null), null);
  assert.equal(rotuloContador(3661), '01:01:01');
  assert.equal(rotuloContador(-5), '00:00:00');
  assert.match(faqResultado({ testeAtivo: true })[3].a, /7 dias do Seu Dia Completo/);
  assert.doesNotMatch(faqResultado({ testeAtivo: false })[3].a, /7 dias do Seu Dia Completo/);
  assert.match(faqResultado({ testeAtivo: true })[2].a, /Garantia de 7 dias/);
});

test('repasse do e-mail pro /seu-dia: 1 leitura, vence em 24h', () => {
  const mem = new Map();
  globalThis.window = { localStorage: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) } };
  salvarEmailSeuDia(' bianca@x.com ');
  assert.equal(consumirEmailSeuDia(), 'bianca@x.com');
  assert.equal(consumirEmailSeuDia(), '');
  salvarEmailSeuDia('a@x.com');
  assert.equal(consumirEmailSeuDia(Date.now() + 25 * 3600 * 1000), '');
  assert.equal(mem.has(CHAVE_EMAIL_SEU_DIA), false);
  delete globalThis.window;
});
