// Testes da "Frase do dia" (lib/frases.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FRASES, AUTORES_DOMINIO_PUBLICO, ehDominioPublico, creditoDaFrase, creditoFalado, frasesNoRodizio, fraseDoDia,
  ordemSemAutorSeguido, diaDoRodizio, diasDominioPublico, ehDiaDoReelFrase,
} from '../lib/frases.js';
import { problemasDoTexto } from '../lib/socialEditorial.js';

const somarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

test('tabela: campos, ids únicos, crédito "— Autor, Livro", nada fora das regras da marca', () => {
  assert.ok(FRASES.length >= 30);
  assert.equal(new Set(FRASES.map((f) => f.id)).size, FRASES.length, 'ids únicos');
  assert.equal(new Set(FRASES.map((f) => f.frase)).size, FRASES.length, 'frases únicas');
  for (const f of FRASES) {
    for (const campo of ['id', 'autor', 'livro', 'ano', 'fonte', 'frase', 'hoje']) assert.ok(typeof f[campo] === 'string' && f[campo].trim(), `${f.id}: ${campo}`);
    assert.equal(typeof f.verificada, 'boolean', `${f.id}: verificada é true/false`);
    assert.match(f.id, /^[a-z-]+-\d+$/, f.id);
    assert.equal(creditoDaFrase(f), `— ${f.autor}, ${f.livro}`);
    assert.ok(f.frase.length <= 220, `${f.id}: ${f.frase.length} caracteres (Story e ~12s de voz)`);
    assert.match(f.hoje, /^Hoje, /, `${f.id}: aplicação começa com "Hoje,"`);
    assert.match(f.hoje, /[.!]$/, `${f.id}: aplicação é uma frase só, sem pergunta`);
    // a aplicação é nossa: nunca põe palavra na boca do autor
    const sobrenome = f.autor.split(' ').pop();
    assert.ok(!f.hoje.includes(sobrenome), `${f.id}: "Hoje" não cita o autor`);
    assert.doesNotMatch(f.hoje, /segundo|como diz|recomenda|ensina que/i, `${f.id}: sem endosso`);
    assert.match(creditoFalado(f), /\.$/);
  }
});

test('verificadas: passam no teste das regras da marca (frase, "Hoje" e crédito); fora quem a revisão tirou', () => {
  const ok = frasesNoRodizio();
  assert.equal(ok.length, 31);
  for (const f of ok) {
    assert.deepEqual(problemasDoTexto(f.frase), [], `${f.id}: ${f.frase}`);
    assert.deepEqual(problemasDoTexto(f.hoje), [], `${f.id}: ${f.hoje}`);
    assert.deepEqual(problemasDoTexto(creditoDaFrase(f)), [], `${f.id}: ${creditoDaFrase(f)}`);
  }
  const autores = new Set(FRASES.map((f) => f.autor));
  for (const fora of ['Rumi', 'Louise Hay', 'Napoleon Hill', 'Neville Goddard', 'Bob Proctor']) assert.ok(!autores.has(fora), `${fora} saiu na revisão`);
  // conferir e 2º lote ficam fora do rodízio até a revisão
  assert.equal(FRASES.find((f) => f.id === 'shinn-22').frase, 'O medo é só fé invertida.');
  for (const id of ['jung-32', 'jung-35', 'dispenza-44', 'dyer-55', 'epicteto-61', 'william-james-80']) {
    assert.equal(FRASES.find((f) => f.id === id).verificada, false, id);
  }
});

test('domínio público: lista de autores mortos há mais de 70 anos', () => {
  for (const a of ['Marco Aurélio', 'Sêneca', 'James Allen', 'Florence Scovel Shinn', 'Epicteto', 'Khalil Gibran', 'Ralph Waldo Emerson', 'Henry David Thoreau', 'William James']) assert.ok(AUTORES_DOMINIO_PUBLICO.has(a), a);
  for (const a of ['Viktor Frankl', 'Carl Jung', 'Joe Dispenza', 'Wayne Dyer']) assert.ok(!AUTORES_DOMINIO_PUBLICO.has(a), a);
});

test('rodízio: só verificadas, mesma frase no mesmo dia, dois anos sem autor repetido em dias seguidos, domínio público pesa o dobro', () => {
  const ok = new Set(frasesNoRodizio().map((f) => f.id));
  assert.equal(fraseDoDia('2026-12-04').id, fraseDoDia('2026-12-04').id);
  let anterior = null;
  const vezes = new Map();
  for (let k = 0; k < 730; k++) {
    const f = fraseDoDia(somarDias('2026-01-01', k));
    assert.ok(ok.has(f.id), `${f.id} não é verificada`);
    if (anterior) assert.notEqual(f.autor, anterior.autor, `mesmo autor em dias seguidos: ${anterior.id} → ${f.id}`);
    vezes.set(f.id, (vezes.get(f.id) || 0) + 1);
    anterior = f;
  }
  // todas as verificadas aparecem; cada uma de domínio público ~2x mais que cada protegida
  assert.equal(vezes.size, ok.size);
  const media = (pub) => { const v = [...vezes].filter(([id]) => ehDominioPublico(FRASES.find((f) => f.id === id)) === pub).map(([, n]) => n); return v.reduce((s, n) => s + n, 0) / v.length; };
  const razao = media(true) / media(false);
  assert.ok(razao > 1.7 && razao < 2.5, `domínio público aparece ${razao.toFixed(2)}x`);
  // sem verificadas, nada
  assert.equal(fraseDoDia('2026-12-04', FRASES.map((f) => ({ ...f, verificada: false }))), null);
  // frase marcada como não verificada sai do rodízio
  const semSeneca = FRASES.map((f) => (f.autor === 'Sêneca' ? { ...f, verificada: false } : f));
  for (let k = 0; k < 60; k++) assert.notEqual(fraseDoDia(somarDias('2026-12-01', k), semSeneca).autor, 'Sêneca');
});

test('rodízio: peso e ordem sem vizinho do mesmo autor (inclusive na volta)', () => {
  assert.equal(diasDominioPublico(21, 9), 5);
  assert.equal(diasDominioPublico(41, 9), 9);
  assert.equal(diasDominioPublico(1, 9), 1);
  const lista = frasesNoRodizio().filter(ehDominioPublico);
  const ordem = ordemSemAutorSeguido(lista, 'x');
  assert.equal(ordem.length, lista.length);
  for (let i = 0; i < ordem.length; i++) assert.notEqual(ordem[i].autor, ordem[(i + 1) % ordem.length].autor, `posição ${i}`);
  assert.equal(diaDoRodizio('2026-01-01'), 0);
  assert.equal(diaDoRodizio('2026-12-31'), 364);
  assert.equal(diaDoRodizio('2025-12-31'), -1);
  assert.ok(fraseDoDia('2025-06-01'), 'antes da base também funciona');
});

test('Reel da frase: sexta', () => {
  assert.equal(ehDiaDoReelFrase('2026-12-04'), true); // sexta
  assert.equal(ehDiaDoReelFrase('2026-12-03'), false);
  assert.equal(ehDiaDoReelFrase('2026-12-06'), false);
});
