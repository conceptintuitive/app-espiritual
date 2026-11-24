// Testes de lib/provaSocial.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumoDasRespostas, frasePublicavel, primeiroNome, depoimentosPublicaveis } from '../lib/provaSocial.js';

const sec = (manual_id, ...respostas) => respostas.map((resposta) => ({ manual_id, resposta }));

test('resumo: maioria de "bate muito" por pessoa; empate e "em parte" não contam', () => {
  const r = resumoDasRespostas({
    secoes: [
      ...sec('a', 'bate_muito', 'bate_muito', 'em_parte'), // bate
      ...sec('b', 'bate_muito', 'nao_bate'),               // empate: não
      ...sec('c', 'em_parte', 'em_parte'),                 // não
      ...sec('d', 'bate_muito'),                           // bate
    ],
  });
  assert.deepEqual(r, { pessoas: 4, bate: 2 });
});

test('resumo: a avaliação do e-mail vale mais que as seções; teste fica de fora', () => {
  const r = resumoDasRespostas({
    secoes: [...sec('a', 'bate_muito', 'bate_muito'), ...sec('t', 'bate_muito')],
    avaliacoes: [{ analise_id: 'a', resposta: 'em_parte' }, { analise_id: 'e', resposta: 'bate_muito' }],
    excluir: new Set(['t']),
  });
  assert.deepEqual(r, { pessoas: 2, bate: 1 }); // a = em parte (e-mail), e = bate, t excluída
});

test('frasePublicavel: tamanho, ofensa, link, e-mail e telefone', () => {
  assert.equal(frasePublicavel('  "Parecia que alguém tinha me observado por meses."  '), 'Parecia que alguém tinha me observado por meses.');
  assert.equal(frasePublicavel('curto'), null);
  assert.equal(frasePublicavel('isso é golpe, não comprem nada aqui'), null);
  assert.equal(frasePublicavel('me chama no 27999998888 que te conto'), null);
  assert.equal(frasePublicavel('escreve pra mim em ana@exemplo.com depois'), null);
  assert.equal(frasePublicavel('veja mais em https://exemplo.com agora'), null);
  assert.equal(frasePublicavel('x'.repeat(281)), null);
});

test('depoimentos: só autorizados, "bate muito", não ocultos; primeiro nome + signo, mais recentes primeiro', () => {
  const base = { resposta: 'bate_muito', autoriza_publicar: true, frase: 'Bateu demais com o que eu vivo hoje.', signo: 'Leão' };
  const d = depoimentosPublicaveis([
    { ...base, nome_publico: 'ana paula souza', atualizado_em: '2026-11-20' },
    { ...base, nome_publico: 'Bia', atualizado_em: '2026-11-22' },
    { ...base, nome_publico: 'Carla', autoriza_publicar: false },
    { ...base, nome_publico: 'Duda', oculto: true },
    { ...base, nome_publico: 'Eva', resposta: 'em_parte' },
    { ...base, nome_publico: 'Fê', frase: 'ok' },
  ]);
  assert.deepEqual(d, [
    { texto: 'Bateu demais com o que eu vivo hoje.', nome: 'Bia', signo: 'Leão' },
    { texto: 'Bateu demais com o que eu vivo hoje.', nome: 'Ana', signo: 'Leão' },
  ]);
  assert.equal(primeiroNome('  mARIA clara '), 'Maria');
});
