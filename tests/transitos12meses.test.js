// Previsão do Ano (lib/transitos12meses.js): textos contra as regras da
// marca, contexto do ano em toda combinação que existe, retorno no mesmo ano,
// virada de ano, aniversário e a ligação com o mapa — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MES_TEMA, ANO_TEMA, CONTEXTO_DO_ANO, LIGACAO_COM_O_MAPA,
  contextoDoMes, ligacaoComOMapa, gerarProjecao12Meses,
} from '../lib/transitos12meses.js';
import { problemasDoTexto } from '../lib/socialEditorial.js';
import { acharContrastes } from '../lib/manualEstilo.js';
import { TEMA_NUMERO, TEMAS } from '../lib/mapaSintese.js';

const ANOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const reduz = (n) => { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((a, b) => a + Number(b), 0); return n; };

function todosOsTextos() {
  const t = [];
  for (const [k, v] of Object.entries(MES_TEMA)) t.push(v.titulo, v.texto, ...v.foco, ...v.atencao, `Mês ${k}`);
  for (const v of Object.values(ANO_TEMA)) t.push(v.titulo, v.texto);
  for (const a of Object.keys(CONTEXTO_DO_ANO)) for (const m of Object.keys(CONTEXTO_DO_ANO[a])) t.push(contextoDoMes(Number(a), Number(m)));
  for (const a of Object.keys(LIGACAO_COM_O_MAPA)) for (const tema of Object.keys(LIGACAO_COM_O_MAPA[a])) t.push(ligacaoComOMapa(Number(a), { tema, nome: TEMAS[tema].nome }));
  return t;
}

test('todos os textos passam nas regras da marca e no detector de "não é X, é Y"', () => {
  const textos = todosOsTextos();
  assert.ok(textos.length > 200);
  for (const t of textos) {
    assert.deepEqual(problemasDoTexto(t), [], t);
    assert.deepEqual(acharContrastes(t), [], t);
    assert.doesNotMatch(t, /\btende(m)? a\b|\bcostuma(m)?\b/i, `hedge: ${t}`);
    assert.doesNotMatch(t, /—/, `travessão: ${t}`);
    assert.doesNotMatch(t, /m[eê]s anterior/i, `"mês anterior" (na virada de ano o número anda pra trás): ${t}`);
  }
});

test('caixas equilibradas: "O que favorece" e "Cuidado com" com 2 a 3 itens', () => {
  for (const [k, v] of Object.entries(MES_TEMA)) {
    assert.ok(v.foco.length >= 2 && v.foco.length <= 3, `Mês ${k} foco`);
    assert.ok(v.atencao.length >= 2 && v.atencao.length <= 3, `Mês ${k} cuidado`);
  }
});

test('todo Ano Pessoal possível tem título e 2 a 3 frases', () => {
  for (const a of ANOS) {
    const t = ANO_TEMA[a];
    assert.ok(t?.titulo, `Ano ${a}`);
    const frases = t.texto.split(/[.!?](?:\s|$)/).filter((x) => x.trim()).length;
    assert.ok(frases >= 2 && frases <= 3, `Ano ${a}: ${frases} frases`);
  }
});

test('toda combinação Ano × Mês que existe tem frase de contexto, com o número certo', () => {
  for (const a of ANOS) {
    for (let mes = 1; mes <= 12; mes++) {
      const m = reduz(a + mes);
      const c = contextoDoMes(a, m);
      assert.ok(c, `Ano ${a} × Mês ${m}`);
      assert.ok(c.startsWith(`Num Ano ${a}, `), c);
    }
  }
  // O Ano 1 + Mês 1 não repete a frase do texto do Ano 1.
  assert.doesNotMatch(contextoDoMes(1, 1), /dá o tom/);
  assert.match(ANO_TEMA[1].texto, /dá o tom/);
});

test('virada de ano: divisor só no 1º janeiro, e o mesmo número ganha outra frase no ano novo', () => {
  const p = gerarProjecao12Meses('1990-03-02', new Date(2026, 10, 27)); // novembro de 2026
  assert.equal(p.length, 12);
  assert.deepEqual(p.filter((m) => m.novoAno).map((m) => m.label), ['Janeiro 2027']);
  const nov = p[0];
  const jan = p.find((m) => m.label === 'Janeiro 2027');
  assert.equal(nov.mesPessoal, jan.mesPessoal, 'na virada o número de novembro volta em janeiro');
  assert.notEqual(nov.anoPessoal, jan.anoPessoal);
  assert.notEqual(nov.contexto, jan.contexto);
});

test('retorno no mesmo ano: o 2º mês do par cita o mês certo (jan, fev ou mar)', () => {
  const p = gerarProjecao12Meses('1990-03-02', new Date(2027, 0, 15)); // janeiro a dezembro de 2027
  const comRetorno = p.filter((m) => m.retorno);
  assert.deepEqual(comRetorno.map((m) => m.label), ['Outubro 2027', 'Novembro 2027', 'Dezembro 2027']);
  assert.match(comRetorno[0].retorno, /apareceu em janeiro/);
  assert.match(comRetorno[1].retorno, /apareceu em fevereiro/);
  assert.match(comRetorno[2].retorno, /apareceu em março/);
  for (const m of comRetorno) {
    const primeiro = p.find((x) => x.mes === m.mes - 9);
    assert.equal(primeiro.mesPessoal, m.mesPessoal);
    assert.equal(primeiro.retorno, null);
  }
});

test('mês do aniversário: só o mês do nascimento', () => {
  const p = gerarProjecao12Meses('1990-03-02', new Date(2026, 10, 27));
  assert.deepEqual(p.filter((m) => m.aniversario).map((m) => m.label), ['Março 2027']);
});

test('ligação com o mapa: só os temas do número do Ano Pessoal (TEMA_NUMERO), frase com um dois-pontos', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(LIGACAO_COM_O_MAPA).map(([a, t]) => [a, Object.keys(t).sort()])),
    Object.fromEntries(Object.entries(TEMA_NUMERO).map(([a, t]) => [a, [...t].sort()])),
  );
  assert.equal(
    ligacaoComOMapa(6, { tema: 'cuidar', nome: 'Cuidar' }),
    'O seu mapa repete Cuidar, e o Ano Pessoal 6 puxa pro mesmo lado: o cuidado é o centro deste ano, e você entra na lista.',
  );
  assert.equal(ligacaoComOMapa(7, { tema: 'construir', nome: 'Construir' }), null, 'combinação que não faz sentido fica de fora');
  assert.equal(ligacaoComOMapa(7, null), null);
  for (const t of Object.values(LIGACAO_COM_O_MAPA).flatMap((x) => Object.values(x))) assert.doesNotMatch(t, /:/, t);
});
