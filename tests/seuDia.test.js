// Testes de lib/seuDia.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarPerfil, leituraDoDia, proximosDias, somarDias, hojeNoFuso } from '../lib/seuDia.js';
import { TEMAS } from '../lib/seuDiaTextos.js';

const bianca = montarPerfil({ dataNascimento: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo', lon: -40.34 });

test('perfil: Sol em Sagitário, Day Master Xin', () => {
  assert.equal(bianca.signoSolar, 'Sagitário');
  assert.equal(bianca.mapa.diaMestre, 7);
});

test('19/11/2026: 7 Matanças, Galo de Fogo, dia pessoal 1, Lua em Peixes', () => {
  const l = leituraDoDia(bianca, '2026-11-19', { horas: true });
  assert.equal(l.chinesa.deusNome, '7 Matanças');
  assert.equal(l.chinesa.pilarNome, 'Galo de Fogo');
  assert.equal(l.numerologia.diaPessoal, 1);
  assert.equal(l.lua.signo, 'Peixes');
  assert.equal(l.lua.aspecto, 'quadratura');
  // Galo × Coelho (hora) = choque → o evite específico entra primeiro.
  assert.equal(l.evite[0], 'Decidir sobre os seus projetos pessoais');
  assert.ok(l.chinesa.relacoes.some((r) => r.tipo === 'trio' && r.pos === 'dia'));
  // Título sempre vem da tabela de temas.
  assert.equal(l.titulo, TEMAS[l.tema].tons[l.tom].titulo);
  assert.ok(l.concordam >= 1 && l.concordam <= l.totalLentes);
});

test('horas: Vitória em novembro ≈ 33 min de diferença entre sol e relógio', () => {
  const l = leituraDoDia(bianca, '2026-11-19', { horas: true });
  // Riqueza Indireta é a hora da Serpente solar (9h–11h) → ~08h25 no relógio.
  const venda = l.horas.forca.find((h) => h.deusNome === 'Riqueza Indireta');
  assert.equal(venda.faixa, '08h25–10h25');
  assert.equal(l.horas.aproximado, false);
});

test('determinístico: mesma pessoa e mesmo dia dão a mesma leitura', () => {
  assert.deepEqual(leituraDoDia(bianca, '2027-02-07'), leituraDoDia(bianca, '2027-02-07'));
});

test('sem hora e sem cidade: funciona, horas marcadas como aproximadas', () => {
  const p = montarPerfil({ dataNascimento: '1988-03-14', hora: null });
  assert.equal(p.mapa.hora, null);
  const l = leituraDoDia(p, '2026-11-19', { horas: true });
  assert.equal(l.horas.aproximado, true);
  assert.ok(TEMAS[l.tema]);
});

test('próximos dias: 7 itens em sequência, no máximo um "melhor dia"', () => {
  const s = proximosDias(bianca, '2026-11-19', 7);
  assert.equal(s.length, 7);
  assert.equal(s[6].data, '2026-11-25');
  assert.ok(s.filter((d) => d.melhor).length <= 1);
});

test('datas: somarDias atravessa mês e ano; hojeNoFuso respeita o fuso', () => {
  assert.equal(somarDias('2026-12-30', 3), '2027-01-02');
  assert.equal(hojeNoFuso('America/Sao_Paulo', new Date('2026-11-20T02:00:00Z')), '2026-11-19');
});

test('explicações do Completo: animais, relações e por quê do tom batem com a leitura', () => {
  const l = leituraDoDia(bianca, '2026-11-19');
  const coelho = l.chinesa.animais.find((a) => a.pos === 'hora');
  assert.equal(coelho.animal, 'Coelho');
  assert.equal(coelho.relacoes[0].tipo, 'choque');
  assert.ok(coelho.relacoes[0].naPratica.length > 20);
  assert.ok(l.chinesa.animais.find((a) => a.pos === 'mes').neutro);
  assert.equal(l.porQue.sinais.reduce((s, x) => s + x.peso, 0), l.porQue.pontos);
  assert.equal(l.chinesa.voce.elemento, 'Metal Yin');
  assert.match(l.numerologia.conta, /9 \+ 1 = 10 → 1/);
});
