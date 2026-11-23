// Testes de lib/manualLeitura.js e lib/ritualIcs.js (/manual) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPITULOS, capituloDaSecao, agruparEmCapitulos, destaqueDaSecao, slugSecao, primeiraFrase,
  lerLidas, marcarLida, secaoParaContinuar, iniciarJornada, diaDaJornada, tituloDoDia, lerJornada, hojeBrasilia,
} from '../lib/manualLeitura.js';
import { horarioDoRitual, repeticaoDoRitual, inicioDoRitual, gerarIcsRitual, nomeArquivoIcs } from '../lib/ritualIcs.js';

// Ordem real do lib/manualgenerator.js (sem a carta de tarô)
const SECOES = [
  { type: 'cover', title: ' Resumo' },
  { type: 'mapa', title: ' Seu Mapa em detalhe', sintese: 'Você é fogo. E mais.' },
  { type: 'diagnostico', title: ' Diagnóstico ', quote: 'Você corre antes de chegar.', blocks: [{ label: 'A', text: 'x.' }] },
  { type: 'text', title: ' Tipo de Pessoa ', body: 'Você lidera. Sempre.' },
  { type: 'archetypes', title: ' Arquétipos ', items: [{ nome: 'A Sábia', frase: 'Eu vejo antes.' }] },
  { type: 'text', title: 'O que este ciclo pede', body: 'Foco.' },
  { type: 'text', title: ' Leitura integrada ', body: 'Junto.' },
  { type: 'text', title: ' Ponto cego ', body: 'Você não vê isso.' },
  { type: 'bullets', title: ' Bloqueios ', note: 'Três travas.', items: ['a'] },
  { type: 'plan7', title: ' Plano de 7 dias ', headline: 'Sete dias.', days: ['Dia 1: a'] },
  { type: 'rituals', title: ' Rituais ', items: [{ nome: 'Clareza', frase: 'Eu escolho.' }] },
  { type: 'love', title: ' Amor', headline: 'Você ama de longe.' },
  { type: 'money', title: ' Dinheiro', headline: 'O dinheiro some. Sempre.' },
  { type: 'calendar30', title: ' Calendário ', weeks: [{ focus: 'Semana de base' }] },
  { type: 'closing', title: ' Fechamento ', mantra: 'Eu termino o que começo.' },
];

test('capítulos: agrupa sem mudar a ordem interna', () => {
  const caps = agruparEmCapitulos(SECOES);
  assert.deepEqual(caps.map((c) => c.id), CAPITULOS.map((c) => c.id));
  const por = Object.fromEntries(caps.map((c) => [c.id, c.secoes.map((s) => s.titulo)]));
  assert.deepEqual(por.quem, ['Resumo', 'Seu Mapa em detalhe', 'Diagnóstico', 'Tipo de Pessoa', 'Arquétipos', 'O que este ciclo pede', 'Leitura integrada']);
  assert.deepEqual(por.amor, ['Amor']);
  assert.deepEqual(por.dinheiro, ['Dinheiro']);
  assert.deepEqual(por.trava, ['Ponto cego', 'Bloqueios']);
  assert.deepEqual(por.pratica, ['Plano de 7 dias', 'Rituais', 'Calendário', 'Fechamento']);
  assert.equal(caps[0].secoes[2].ancora, 's-diagnostico');
  // "Preparando…" mantém o título → mesmo capítulo; rituais sem IA (texto) também
  assert.equal(capituloDaSecao({ type: 'preparando', title: ' Amor' }), 'amor');
  assert.equal(capituloDaSecao({ type: 'text', title: ' Rituais ' }), 'pratica');
  assert.equal(slugSecao({ title: ' Seu Mapa em detalhe' }), 'seu-mapa-em-detalhe');
});

test('destaque: citação de cada tipo, sempre do texto gerado', () => {
  const por = Object.fromEntries(SECOES.map((s) => [s.type + s.title, destaqueDaSecao(s)]));
  assert.equal(por['diagnostico Diagnóstico '], 'Você corre antes de chegar.');
  assert.equal(por['text Tipo de Pessoa '], 'Você lidera.');
  assert.equal(por['archetypes Arquétipos '], 'Eu vejo antes.');
  assert.equal(por['money Dinheiro'], 'O dinheiro some.');
  assert.equal(por['closing Fechamento '], 'Eu termino o que começo.');
  assert.equal(por['cover Resumo'], '');
  assert.equal(primeiraFrase('x'.repeat(300)).length, 170);
});

test('lidas e continuar de onde parou', () => {
  let e = lerLidas(null);
  assert.deepEqual(e, { lidas: [], ultima: null });
  e = marcarLida(e, 's-a');
  e = marcarLida(e, 's-b');
  assert.equal(marcarLida(e, 's-b'), e);
  assert.deepEqual(lerLidas(JSON.stringify(e)), { lidas: ['s-a', 's-b'], ultima: 's-b' });
  assert.equal(secaoParaContinuar(e, ['s-a', 's-b', 's-c']), 's-b');
  assert.equal(secaoParaContinuar({ lidas: ['s-a'], ultima: 's-a' }, ['s-a', 's-b']), null);
  assert.equal(secaoParaContinuar(e, ['s-x']), null);
  assert.deepEqual(lerLidas('{quebrado'), { lidas: [], ultima: null });
});

test('jornada: começa no 1º check, Dia N no Seu Dia, calendário ganha do plano', () => {
  let j = iniciarJornada(null, { id: 'abc', nome: 'Bianca', tipo: 'plano', itens: ['Dia 1: **Escreva** o passo', 'Dia 2: b', 'c'], ancoras: ['p0', 'p1', 'p2'], hoje: '2026-11-20' });
  assert.equal(j.plano.inicio, '2026-11-20');
  assert.equal(iniciarJornada(j, { id: 'abc', tipo: 'plano', itens: ['z'], ancoras: [], hoje: '2026-11-22' }), j); // não reinicia
  assert.deepEqual(diaDaJornada(j, '2026-11-20'), { id: 'abc', tipo: 'plano', n: 1, total: 3, titulo: 'Escreva o passo', href: '/manual/abc#p0' });
  assert.equal(diaDaJornada(j, '2026-11-22').n, 3);
  assert.equal(diaDaJornada(j, '2026-11-23'), null); // acabou
  j = iniciarJornada(j, { id: 'abc', tipo: 'calendario', itens: Array.from({ length: 28 }, (_, i) => `Dia ${i + 1}: c${i}`), ancoras: [], hoje: '2026-11-21' });
  assert.deepEqual(diaDaJornada(j, '2026-11-22'), { id: 'abc', tipo: 'calendario', n: 2, total: 28, titulo: 'c1', href: '/manual/abc' });
  // outro Manual no aparelho substitui
  assert.equal(iniciarJornada(j, { id: 'xyz', tipo: 'plano', itens: ['a'], ancoras: [], hoje: '2026-11-22' }).id, 'xyz');
  assert.equal(lerJornada(JSON.stringify(j)).id, 'abc');
  assert.equal(lerJornada('null'), null);
  assert.equal(tituloDoDia('Dia 12 — Respire fundo.'), 'Respire fundo.');
  assert.match(hojeBrasilia(new Date('2026-11-23T02:00:00Z')), /^2026-11-22$/);
});

test('ritual: horário e repetição a partir do texto', () => {
  assert.deepEqual(horarioDoRitual('Toda noite às 21h30'), { h: 21, m: 30 });
  assert.deepEqual(horarioDoRitual('Pela manhã, ao acordar'), { h: 7, m: 0 });
  assert.deepEqual(horarioDoRitual('Antes de dormir'), { h: 21, m: 30 });
  assert.deepEqual(horarioDoRitual('Quando sentir ansiedade'), { h: 8, m: 0 });
  assert.deepEqual(repeticaoDoRitual('Toda segunda e quinta à noite'), { freq: 'WEEKLY', count: 4, byday: ['MO', 'TH'], dias: [1, 4] });
  assert.deepEqual(repeticaoDoRitual('Pela manhã, durante 21 dias'), { freq: 'DAILY', count: 21 });
  assert.deepEqual(repeticaoDoRitual('Todas as manhãs'), { freq: 'DAILY', count: 7 });
  assert.equal(repeticaoDoRitual('Na lua cheia'), null);
});

test('ritual: .ics válido, no próximo horário possível', () => {
  const agora = new Date(2026, 10, 23, 22, 0); // segunda, 22h
  assert.equal(inicioDoRitual('Pela manhã', agora).getDate(), 24);
  assert.equal(inicioDoRitual('Toda quinta à noite', agora).getDay(), 4);
  const ics = gerarIcsRitual({ nome: 'Ritual de **Clareza**', quando: 'Todas as noites, antes de dormir', passos: ['Respire, devagar; conte 4', 'Escreva'], frase: 'Eu escolho.' }, { agora, uid: 'teste' });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261124T213000\r\n/);
  assert.match(ics, /RRULE:FREQ=DAILY;COUNT=7\r\n/);
  assert.match(ics, /SUMMARY:Ritual: Ritual de Clareza\r\n/);
  assert.match(ics.replace(/\r\n /g, ''), /Respire\\, devagar\\; conte 4/); // desdobra as linhas
  assert.ok(ics.split('\r\n').every((l) => l.length <= 75));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal(nomeArquivoIcs('Ritual de Clareza'), 'ritual-ritual-de-clareza.ics');
});
