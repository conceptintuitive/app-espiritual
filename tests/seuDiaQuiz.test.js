// Testes de lib/seuDiaQuiz.js (checkbox do Seu Dia no quiz) e do link do e-mail das 7h — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SEU_DIA_SECRET = 'segredo-de-teste';
const { dadosDoQuiz, planoDoCadastro, cadastrarSeuDiaDoQuiz } = await import('../lib/seuDiaQuiz.js');
const { tokenLinkDia, emailDoTokenDia, emailDoTokenLogin, tokenLogin, LINK_DIA_MS } = await import('../lib/seuDiaServidor.js');

const AGORA = Date.parse('2026-11-24T15:00:00Z');
const mun = { ibge: 3205309, lat: -20.3155, lon: -40.3128, tz: 'America/Sao_Paulo' };

test('dados do quiz: primeiro nome, hora válida, cidade só com o autocomplete', () => {
  assert.deepEqual(dadosDoQuiz({ nome: 'mARIANA souza lima', data: '1994-12-21', hora: '07:25', municipio: mun, localTexto: 'Vitória, es' }), {
    nome: 'Mariana', data_nascimento: '1994-12-21', hora_nascimento: '07:25',
    cidade_nome: 'Vitória', cidade_uf: 'ES', municipio_ibge: 3205309, latitude: -20.3155, longitude: -40.3128, fuso_iana: 'America/Sao_Paulo',
  });
  const livre = dadosDoQuiz({ nome: 'Ana', data: '1990-01-02', hora: '7h', municipio: null, localTexto: 'Interior de Minas' });
  assert.equal(livre.hora_nascimento, null);
  assert.equal(livre.cidade_nome, null);
  assert.equal(livre.municipio_ibge, null);
});

test('plano: perfil novo começa o teste; perfil que existe não perde dados nem recomeça teste', () => {
  const dados = dadosDoQuiz({ nome: 'Ana', data: '1990-01-02' });
  const novo = planoDoCadastro({ email: 'a@x.com', dados, existente: null, testeAtivo: true, agora: AGORA });
  assert.equal(novo.inserir.email, 'a@x.com');
  assert.equal(novo.inserir.teste_inicio, new Date(AGORA).toISOString());
  assert.equal(planoDoCadastro({ email: 'a@x.com', dados, existente: null, testeAtivo: false, agora: AGORA }).inserir.teste_inicio, null);

  const comDados = planoDoCadastro({ email: 'a@x.com', dados, existente: { data_nascimento: '1985-05-05', teste_inicio: '2026-10-01T00:00:00Z' }, testeAtivo: true, agora: AGORA });
  assert.deepEqual(comDados.atualizar, {});
  const vazio = planoDoCadastro({ email: 'a@x.com', dados, existente: { data_nascimento: null, teste_inicio: null }, testeAtivo: true, agora: AGORA });
  assert.equal(vazio.atualizar.data_nascimento, '1990-01-02');
  assert.equal(vazio.atualizar.teste_inicio, new Date(AGORA).toISOString());
});

function fakeSb(linhas, { semColuna = false } = {}) {
  const ops = [];
  return {
    ops,
    from() {
      let modo = 'select'; let valores = null; let email = null;
      const api = {
        select() { return api; },
        eq(_c, v) { email = v; return api; },
        insert(v) { modo = 'insert'; valores = v; return api; },
        update(v) { modo = 'update'; valores = v; return api; },
        maybeSingle() { return Promise.resolve({ data: linhas.find((l) => l.email === email) || null, error: null }); },
        then(res) {
          ops.push({ modo, valores });
          if (modo === 'insert') linhas.push({ ...valores });
          if (modo === 'update') {
            if (semColuna && 'cadastro_quiz_em' in valores) return Promise.resolve({ error: { message: 'column cadastro_quiz_em does not exist' } }).then(res);
            Object.assign(linhas.find((l) => l.email === email) || {}, valores);
          }
          return Promise.resolve({ error: null }).then(res);
        },
      };
      return api;
    },
  };
}

test('cadastrar: cria o perfil, liga o e-mail das 7h e grava o consentimento', async () => {
  const linhas = [];
  const sb = fakeSb(linhas);
  const r = await cadastrarSeuDiaDoQuiz({ sb, email: 'a@x.com', dados: dadosDoQuiz({ nome: 'Ana', data: '1990-01-02' }), testeAtivo: true, agora: AGORA });
  assert.deepEqual(r, { ok: true, novo: true, comecouTeste: true });
  // sem o teste ligado, o perfil sai sem começar teste (a UTM só vai pro perfil novo)
  const semTeste = await cadastrarSeuDiaDoQuiz({ sb: fakeSb([]), email: 'b@x.com', dados: dadosDoQuiz({ nome: 'Bia', data: '1990-01-02' }), testeAtivo: false, agora: AGORA });
  assert.deepEqual(semTeste, { ok: true, novo: true, comecouTeste: false });
  assert.equal(linhas[0].nome, 'Ana');
  assert.equal(linhas[0].email_diario, true);
  assert.equal(linhas[0].cadastro_quiz_em, new Date(AGORA).toISOString());
});

test('cadastrar: sem a migração 0027 o perfil sai igual, com aviso', async () => {
  const linhas = [];
  const r = await cadastrarSeuDiaDoQuiz({ sb: fakeSb(linhas, { semColuna: true }), email: 'a@x.com', dados: dadosDoQuiz({ nome: 'Ana', data: '1990-01-02' }), testeAtivo: true, agora: AGORA });
  assert.equal(r.ok, true);
  assert.match(r.aviso, /0027/);
  assert.equal(linhas.length, 1);
});

test('link do e-mail das 7h: entra logado, vale 3 dias, não serve como login de 30 min', () => {
  const t = tokenLinkDia('a@x.com');
  assert.equal(emailDoTokenDia(t), 'a@x.com');
  assert.equal(emailDoTokenLogin(t), null);
  assert.equal(emailDoTokenDia(tokenLogin('a@x.com')), null);
  assert.equal(LINK_DIA_MS, 3 * 86400 * 1000);
});
