// Testes de lib/resultadoManual.js e lib/seuDiaRepasse.js (/resultado) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { secoesDoManual, rotuloContador, faqResultado } from '../lib/resultadoManual.js';
import { salvarEmailSeuDia, consumirEmailSeuDia, CHAVE_EMAIL_SEU_DIA } from '../lib/seuDiaRepasse.js';

test('secoesDoManual: 15 seções, com as frases da IA quando existem', () => {
  const s = secoesDoManual({
    nome: 'Bianca', signo: 'Sagitário', numero: 11, anoPessoal: 3, objetivo: 'Carreira e Propósito', arquetipo: 'A Visionária',
    diagnostico: { frase: '"Você corre antes de chegar."' }, amor: { headline: 'Você ama no futuro' },
    arquetipos: { dominante: { nome: 'A Exploradora' }, emocional: { nome: 'A Sábia' }, sombra: { nome: 'A Fugitiva' } },
  });
  assert.equal(s.length, 15);
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

// ── fim da leitura grátis ───────────────────────────────────────────────────
import { trechoDoDiagnostico, ganchoDoMapa, textoProvaSocial } from '../lib/resultadoManual.js';
import { ARQUETIPOS } from '../lib/arquetipoBase.js';

test('trechoDoDiagnostico: 2 parágrafos reais inteiros + o começo do 3º', () => {
  const d = {
    combinacao: 'Primeiro parágrafo da combinação.\n\nSegundo parágrafo da combinação.',
    conflito_central: 'O conflito central é um texto longo '.repeat(10).trim(),
    diagnostico_objetivo: 'Objetivo.',
  };
  const t = trechoDoDiagnostico(d);
  assert.deepEqual(t.visiveis, [
    { rotulo: 'A combinação', texto: 'Primeiro parágrafo da combinação.' },
    { rotulo: null, texto: 'Segundo parágrafo da combinação.' },
  ]);
  assert.equal(t.cortado.rotulo, 'O conflito central');
  assert.ok(t.cortado.texto.length <= 170);
  assert.ok(d.conflito_central.startsWith(t.cortado.texto), 'o corte é o começo do texto real');
  assert.ok(!/\s$/.test(t.cortado.texto));
});

test('trechoDoDiagnostico: 1 parágrafo por bloco; sem IA, null', () => {
  const t = trechoDoDiagnostico({ combinacao: 'A.', conflito_central: 'B.', diagnostico_objetivo: 'C.' });
  assert.deepEqual(t.visiveis.map((p) => p.rotulo), ['A combinação', 'O conflito central']);
  assert.equal(t.cortado.texto, 'C.');
  assert.equal(trechoDoDiagnostico(null), null);
  assert.equal(trechoDoDiagnostico({ combinacao: 'Só um.' }), null);
});

test('ganchoDoMapa: arquétipo da tabela + amor da IA + 3ª área fechada', () => {
  const g = ganchoDoMapa({ arquetipo: ARQUETIPOS.ORACULO, amorHeadline: '"Você ama no futuro"', objetivo: 'Carreira e Propósito' });
  assert.equal(g.itens.length, 3);
  assert.match(g.itens[0].rotulo, /Oráculo/);
  assert.equal(g.itens[0].texto, `${ARQUETIPOS.ORACULO.sombra.charAt(0).toUpperCase()}${ARQUETIPOS.ORACULO.sombra.slice(1)}.`);
  assert.equal(g.itens[1].texto, 'Você ama no futuro.');
  assert.equal(g.itens[2].rotulo, 'Na carreira');
  assert.equal(g.itens[2].texto, null);
  assert.match(g.chamada, /Bloqueios invisíveis/);
});

test('ganchoDoMapa: sem a frase do amor, as 2 áreas ficam fechadas; amor como objetivo vira dinheiro', () => {
  const g = ganchoDoMapa({ arquetipo: ARQUETIPOS.MAGO, objetivo: 'Amor e Relacionamentos' });
  assert.equal(g.itens[1].texto, null);
  assert.equal(g.itens[2].rotulo, 'No dinheiro');
  assert.match(g.chamada, /As outras duas/);
  assert.equal(ganchoDoMapa({ arquetipo: null }), null);
});

test('textoProvaSocial: só com 10+ pessoas, arredondado pra baixo', () => {
  assert.equal(textoProvaSocial({ pessoas: 9, bate: 9 }), null);
  assert.equal(textoProvaSocial({ pessoas: 10, bate: 8 }), '8 de cada 10 pessoas disseram que o Manual bate com elas');
  assert.equal(textoProvaSocial({ pessoas: 37, bate: 32 }), '8 de cada 10 pessoas disseram que o Manual bate com elas'); // 8,6 → 8
  assert.equal(textoProvaSocial({ pessoas: 20, bate: 1 }), null);
  assert.equal(textoProvaSocial(null), null);
});
