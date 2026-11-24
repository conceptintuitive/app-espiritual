// Testes de lib/avaliacao.js (e-mail de avaliação 3 dias depois da compra) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SEU_DIA_SECRET = 'segredo-de-teste';
const {
  tokenAvaliacao, analiseDoTokenAvaliacao, deveReceberAvaliacao, montarEmailAvaliacao, processarLoteAvaliacao,
} = await import('../lib/avaliacao.js');
const { tokenLogin } = await import('../lib/seuDiaServidor.js');

const DIA = 86400000;
const AGORA = Date.parse('2026-11-24T12:00:00Z');
const pagaHa = (dias, extra = {}) => ({ payment_status: 'paid', paid_at: new Date(AGORA - dias * DIA).toISOString(), avaliacao_email_em: null, unsubscribed: false, ...extra });

test('token da avaliação: vale só como avaliação', () => {
  const t = tokenAvaliacao('abc-123');
  assert.equal(analiseDoTokenAvaliacao(t), 'abc-123');
  assert.equal(analiseDoTokenAvaliacao(tokenLogin('abc-123')), null);
  assert.equal(analiseDoTokenAvaliacao(t.slice(0, -2) + 'xx'), null);
});

test('quem recebe: paga há 3 a 14 dias, sem e-mail ainda, sem descadastro', () => {
  assert.equal(deveReceberAvaliacao(pagaHa(2.9), AGORA), false);
  assert.equal(deveReceberAvaliacao(pagaHa(3), AGORA), true);
  assert.equal(deveReceberAvaliacao(pagaHa(14), AGORA), true);
  assert.equal(deveReceberAvaliacao(pagaHa(15), AGORA), false);
  assert.equal(deveReceberAvaliacao(pagaHa(5, { avaliacao_email_em: '2026-11-20T00:00:00Z' }), AGORA), false);
  assert.equal(deveReceberAvaliacao(pagaHa(5, { unsubscribed: true }), AGORA), false);
  assert.equal(deveReceberAvaliacao(pagaHa(5, { payment_status: 'pending' }), AGORA), false);
});

test('e-mail: 3 respostas em 1 clique, autorização explicada, descadastro', () => {
  const m = montarEmailAvaliacao({ nome: 'Ana', link: 'https://x.com/avaliar?t=TOK', descadastro: 'https://x.com/api/unsubscribe?id=1' });
  assert.equal(m.subject, 'O seu Manual bate com você?');
  for (const r of ['bate_muito', 'em_parte', 'nao_bate']) {
    assert.ok(m.html.includes(`https://x.com/avaliar?t=TOK&amp;r=${r}`), r);
    assert.ok(m.text.includes(`https://x.com/avaliar?t=TOK&r=${r}`), r);
  }
  assert.match(m.text, /primeiro nome e signo/);
  assert.ok(m.html.includes('https://x.com/api/unsubscribe?id=1'));
  assert.match(m.html, /Ana, ele bate com você\?/);
});

// Supabase falso: só o que o lote usa (select com filtros + update condicional).
function fakeSupabase(linhas) {
  const updates = [];
  return {
    updates,
    from() {
      const q = { filtros: [], modo: 'select', valores: null };
      const api = {
        select() { if (q.modo === 'update') q.devolver = true; return api; },
        update(v) { q.modo = 'update'; q.valores = v; return api; },
        eq(c, v) { q.filtros.push((r) => r[c] === v); return api; },
        gte() { return api; }, lte() { return api; }, order() { return api; },
        is(c, v) { q.filtros.push((r) => (r[c] ?? null) === v); return api; },
        limit() { return api; },
        then(res) {
          const alvo = linhas.filter((r) => q.filtros.every((f) => f(r)));
          if (q.modo === 'update') {
            alvo.forEach((r) => Object.assign(r, q.valores));
            updates.push({ ...q.valores, n: alvo.length });
            return Promise.resolve({ data: alvo.map((r) => ({ id: r.id })), error: null }).then(res);
          }
          return Promise.resolve({ data: alvo.map((r) => ({ ...r })), error: null }).then(res);
        },
      };
      return api;
    },
  };
}

test('lote: 1 e-mail por pessoa, trava a análise, presente vai pra quem recebeu', async () => {
  const linhas = [
    { id: 'a1', nome: 'ana paula', email: 'ana@x.com', ...pagaHa(4) },
    { id: 'a2', nome: 'Ana', email: 'ANA@x.com', ...pagaHa(5) },      // mesma pessoa: fica pra próxima
    { id: 'b1', nome: 'Bia', email: 'mae@x.com', presente_email: 'bia@x.com', ...pagaHa(6) },
    { id: 'c1', nome: 'Cris', email: 'cris@x.com', ...pagaHa(1) },    // cedo demais
  ];
  const sb = fakeSupabase(linhas);
  const enviados = [];
  const resend = { emails: { send: async (m) => { enviados.push(m); return { error: null }; } } };
  const r = await processarLoteAvaliacao({ supabase: sb, resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.equal(r.enviados, 2);
  assert.deepEqual(enviados.map((m) => m.to).sort(), ['ana@x.com', 'bia@x.com']);
  assert.ok(linhas.find((l) => l.id === 'a1').avaliacao_email_em);
  assert.equal(linhas.find((l) => l.id === 'a2').avaliacao_email_em, null);
  assert.match(enviados.find((m) => m.to === 'ana@x.com').html, /Ana, ele bate/);

  // 2ª execução: a1 travada; a2 sai agora.
  enviados.length = 0;
  await processarLoteAvaliacao({ supabase: sb, resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.deepEqual(enviados.map((m) => m.to), ['ANA@x.com']);
});

test('lote: falha no envio devolve a vaga pra próxima execução', async () => {
  const linhas = [{ id: 'a1', nome: 'Ana', email: 'ana@x.com', ...pagaHa(4) }];
  const resend = { emails: { send: async () => ({ error: { message: 'limite' } }) } };
  const r = await processarLoteAvaliacao({ supabase: fakeSupabase(linhas), resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.equal(r.enviados, 0);
  assert.equal(linhas[0].avaliacao_email_em, null);
});
