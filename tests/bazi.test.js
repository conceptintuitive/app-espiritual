// Testes de lib/bazi.js — `npm test` (node --test, sem dependências).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularBazi, cicloDoDia, cicloParaPilar, dezDeuses, relacoesRamos, relacoesDoMapa,
  leituraDoAno, pilarDoAnoGregoriano, nomePilar, florDePessego, contarElementos, TRONCOS, RAMOS,
} from '../lib/bazi.js';

const nome = (p) => `${TRONCOS[p.tronco].pinyin} ${RAMOS[p.ramo].pinyin}`;

test('Vitória, 21/12/1994 07:25 (horário de verão) → Jia Xu / Bing Zi / Xin Si / Xin Mao', () => {
  const m = calcularBazi({ data: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo', lon: -40.34 });
  assert.equal(nome(m.ano), 'Jia Xu');
  assert.equal(nome(m.mes), 'Bing Zi');
  assert.equal(nome(m.dia), 'Xin Si');
  assert.equal(nome(m.hora), 'Xin Mao');
  assert.equal(m.offsetUtcHoras, -2);
  assert.equal(m.horarioDeVerao, true);
  // 09:25Z − 40,34°×4min + EoT(~+1,7) ≈ 06:45
  assert.match(m.horaSolar, /^06:4[3-7]$/);
  assert.equal(nomePilar(m.ano.tronco, m.ano.ramo), 'Cachorro de Madeira');
});

test('sem correção de horário de verão/longitude, o mesmo caso cairia no Dragão — por isso a correção', () => {
  // Hora do relógio tratada como solar: 07:25 → Chen (Dragão).
  const m = calcularBazi({ data: '1994-12-21', hora: '07:25', tz: 'UTC', lon: 0 });
  assert.equal(RAMOS[m.hora.ramo].animal, 'Dragão');
});

test('ciclo dos dias: 01/01/2000 = Wu Wu; 01/10/1949 = Jia Zi', () => {
  assert.equal(nome(cicloParaPilar(cicloDoDia(2000, 1, 1))), 'Wu Wu');
  assert.equal(nome(cicloParaPilar(cicloDoDia(1949, 10, 1))), 'Jia Zi');
});

test('anos: 2026 Cavalo de Fogo, 2027 Cabra de Fogo, 1984 Rato de Madeira', () => {
  assert.equal(nomePilar(...Object.values(pilarDoAnoGregoriano(2026))), 'Cavalo de Fogo');
  assert.equal(nomePilar(...Object.values(pilarDoAnoGregoriano(2027))), 'Cabra de Fogo');
  assert.equal(nomePilar(...Object.values(pilarDoAnoGregoriano(1984))), 'Rato de Madeira');
});

test('Lichun 2026 (~03/02 20:02 UTC): antes ainda é Serpente, depois já é Cavalo', () => {
  const antes = calcularBazi({ data: '2026-02-03', hora: '15:30', tz: 'America/Sao_Paulo', lon: -46.6 });
  const depois = calcularBazi({ data: '2026-02-03', hora: '18:30', tz: 'America/Sao_Paulo', lon: -46.6 });
  assert.equal(RAMOS[antes.ano.ramo].animal, 'Serpente');
  assert.equal(RAMOS[antes.mes.ramo].animal, 'Boi');
  assert.equal(RAMOS[depois.ano.ramo].animal, 'Cavalo');
  assert.equal(RAMOS[depois.mes.ramo].animal, 'Tigre');
});

test('janeiro antes do Lichun pertence ao ano anterior (15/01/1995 = Cachorro)', () => {
  const m = calcularBazi({ data: '1995-01-15', hora: null });
  assert.equal(RAMOS[m.ano.ramo].animal, 'Cachorro');
  assert.equal(m.hora, null);
});

test('23h solares já contam como o dia seguinte', () => {
  const a = calcularBazi({ data: '2000-01-01', hora: '22:30', tz: 'UTC', lon: 0 });
  const b = calcularBazi({ data: '2000-01-01', hora: '23:30', tz: 'UTC', lon: 0 });
  assert.equal(nome(a.dia), 'Wu Wu');
  assert.equal(nome(b.dia), 'Ji Wei');
  assert.equal(RAMOS[b.hora.ramo].animal, 'Rato');
});

test('Dez Deuses para Xin: Jia = Riqueza Direta, Bing = Oficial Direto, Gui = Deus da Comida', () => {
  assert.equal(dezDeuses(7, 0), 'riquezaDireta');
  assert.equal(dezDeuses(7, 2), 'oficialDireto');
  assert.equal(dezDeuses(7, 9), 'deusComida');
  assert.equal(dezDeuses(7, 3), 'seteMatancas');
  assert.equal(dezDeuses(7, 7), 'amigo');
});

test('relações: Cachorro–Cabra punição, Rato–Cavalo choque, Tigre–Cavalo trio, Rato–Coelho punição', () => {
  assert.deepEqual(relacoesRamos(10, 7), ['punicao']);
  assert.ok(relacoesRamos(0, 6).includes('choque'));
  assert.deepEqual(relacoesRamos(2, 6), ['trio']);
  assert.deepEqual(relacoesRamos(0, 3), ['punicao']);
  assert.equal(florDePessego(5), 6); // Serpente → Cavalo
});

test('mapa da Bianca: Bing–Xin se combinam; Rato–Coelho punição; 2026 é flor de pêssego', () => {
  const m = calcularBazi({ data: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo', lon: -40.34 });
  const rel = relacoesDoMapa(m);
  assert.ok(rel.some((r) => r.tipo === 'combinacaoTronco' && r.entre.join() === 'mes,dia'));
  assert.ok(rel.some((r) => r.tipo === 'punicao' && r.entre.join() === 'mes,hora'));
  const a26 = leituraDoAno(m, 2026);
  assert.equal(a26.deus, 'oficialDireto');
  assert.ok(a26.comAnimal.includes('trio'));
  assert.equal(a26.florDePessego, true);
  const a27 = leituraDoAno(m, 2027);
  assert.equal(a27.deus, 'seteMatancas');
  assert.ok(a27.comAnimal.includes('punicao'));
  const pts = contarElementos(m);
  assert.equal(pts.length, 5);
});
