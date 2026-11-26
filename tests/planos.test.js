// Testes de lib/planos.js (página /planos) e lib/cortesiaEmail.js (e-mails do
// fim da cortesia de 30 dias do Manual) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SEU_DIA_SECRET = 'segredo-de-teste';
const PLANOS_MOD = await import('../lib/planos.js');
const { PLANOS, COMPARACAO, FAQ_PLANOS, BONUS_MANUAL, PERDE_NO_FIM_DA_CORTESIA, anualPorMes, brl } = PLANOS_MOD;
const { etapaDaCortesia, montarEmailCortesia, processarLoteCortesia, DIAS_AVISO_CORTESIA, DIAS_LIMITE_FIM_CORTESIA } = await import('../lib/cortesiaEmail.js');
const { PRECO_MANUAL_JANELA, PRECO_MANUAL_PADRAO, PRECO_ASSINATURA_MENSAL, PRECO_ASSINATURA_ANUAL } = await import('../lib/preco.js');
const { DIAS_CORTESIA_MANUAL } = await import('../lib/assinaturaRegras.js');
const { problemasDoTexto } = await import('../lib/socialEditorial.js');

const DIA = 86400000;
const AGORA = Date.parse('2026-11-26T15:00:00Z');

test('planos: os 3 cartões, na ordem, com os preços de lib/preco.js', () => {
  assert.deepEqual(PLANOS.map((p) => p.chave), ['gratis', 'manual', 'completo']);
  const manual = PLANOS.find((p) => p.chave === 'manual');
  assert.equal(manual.preco, brl(PRECO_MANUAL_PADRAO));
  assert.equal(manual.precoJanela, brl(PRECO_MANUAL_JANELA));
  const completo = PLANOS.find((p) => p.chave === 'completo');
  assert.ok(completo.preco.includes(brl(PRECO_ASSINATURA_MENSAL)));
  assert.ok(completo.detalhePreco.includes(brl(PRECO_ASSINATURA_ANUAL)));
  assert.equal(completo.destaque, true);
  assert.equal(anualPorMes(), 12.42);
});

test('planos: o bônus do Manual é a cortesia de verdade (30 dias) e a tabela bate', () => {
  assert.ok(BONUS_MANUAL.startsWith(`${DIAS_CORTESIA_MANUAL} dias do Intuitive Completo`));
  for (const linha of COMPARACAO) {
    for (const col of ['gratis', 'manual', 'completo']) {
      assert.ok(typeof linha[col] === 'boolean' || typeof linha[col] === 'string', `${linha.item} / ${col}`);
    }
  }
  // O que some no fim da cortesia é exatamente o que o Manual tem por 30 dias.
  const porCortesia = COMPARACAO.filter((l) => l.manual === `${DIAS_CORTESIA_MANUAL} dias`).length;
  assert.equal(porCortesia, PERDE_NO_FIM_DA_CORTESIA.length);
});

test('planos: vocabulário da marca (nada de "diagnóstico completo", "análise completa", promessa)', () => {
  const tudo = [
    ...PLANOS.flatMap((p) => [p.nome, p.praQuem, p.detalhePreco, ...p.inclui]),
    ...COMPARACAO.map((l) => l.item),
    ...FAQ_PLANOS.flatMap((f) => [f.p, f.r]),
    BONUS_MANUAL,
  ].join('\n');
  assert.doesNotMatch(tudo, /diagn[oó]stico completo|an[aá]lise completa|mapa completo/i);
  assert.deepEqual(problemasDoTexto(tudo), []);
});

const pagaHa = (dias, extra = {}) => ({
  payment_status: 'paid', paid_at: new Date(AGORA - dias * DIA).toISOString(), origem: 'venda',
  presente_email: null, unsubscribed: false, cortesia_d25_em: null, cortesia_d30_em: null, ...extra,
});

test('cortesia: d25 entre 25 e 30 dias, d30 entre 30 e 33, nada fora disso', () => {
  assert.equal(DIAS_AVISO_CORTESIA, 25);
  assert.equal(DIAS_LIMITE_FIM_CORTESIA, 33);
  assert.equal(etapaDaCortesia(pagaHa(24.9), AGORA), null);
  assert.equal(etapaDaCortesia(pagaHa(25), AGORA), 'd25');
  assert.equal(etapaDaCortesia(pagaHa(29.9), AGORA), 'd25');
  assert.equal(etapaDaCortesia(pagaHa(30), AGORA), 'd30');
  assert.equal(etapaDaCortesia(pagaHa(33), AGORA), 'd30');
  assert.equal(etapaDaCortesia(pagaHa(33.1), AGORA), null);
  // já mandado, anual, presente, descadastro, não pago
  assert.equal(etapaDaCortesia(pagaHa(26, { cortesia_d25_em: '2026-11-25T00:00:00Z' }), AGORA), null);
  assert.equal(etapaDaCortesia(pagaHa(31, { cortesia_d30_em: '2026-11-25T00:00:00Z' }), AGORA), null);
  assert.equal(etapaDaCortesia(pagaHa(26, { origem: 'assinatura' }), AGORA), null);
  assert.equal(etapaDaCortesia(pagaHa(26, { presente_email: 'b@x.com' }), AGORA), null);
  assert.equal(etapaDaCortesia(pagaHa(26, { unsubscribed: true }), AGORA), null);
  assert.equal(etapaDaCortesia(pagaHa(26, { payment_status: 'pending' }), AGORA), null);
  // quem perdeu o d25 (ex.: migração rodou tarde) ainda recebe o d30
  assert.equal(etapaDaCortesia(pagaHa(31), AGORA), 'd30');
});

test('cortesia: e-mail com a data do fim, o que some, os dois planos e o descadastro', () => {
  const fim = Date.parse('2026-12-01T15:00:00Z');
  const m = montarEmailCortesia({ etapa: 'd25', nome: 'Ana', fimMs: fim, linkMensal: 'https://x.com/assinar?plano=mensal', linkAnual: 'https://x.com/assinar?plano=anual', descadastro: 'https://x.com/api/unsubscribe?id=1' });
  assert.equal(m.subject, 'Seus 30 dias do Intuitive Completo acabam em 5 dias');
  assert.match(m.html, /Ana, faltam 5 dias/);
  assert.match(m.text, /acabam em 01\/12/);
  for (const item of PERDE_NO_FIM_DA_CORTESIA) assert.ok(m.text.includes(item), item);
  assert.ok(m.html.includes('https://x.com/assinar?plano=mensal'));
  assert.ok(m.html.includes('https://x.com/assinar?plano=anual'));
  assert.ok(m.html.includes(brl(PRECO_ASSINATURA_MENSAL)));
  assert.ok(m.html.includes('https://x.com/api/unsubscribe?id=1'));
  assert.match(m.text, /pra sempre/);
  const d30 = montarEmailCortesia({ etapa: 'd30', nome: null, fimMs: fim, linkMensal: 'a', linkAnual: 'b', descadastro: 'c' });
  assert.equal(d30.subject, 'Seus 30 dias do Intuitive Completo terminaram');
  assert.match(d30.text, /^Seus 30 dias terminaram/);
  assert.deepEqual(problemasDoTexto(`${m.text}\n${d30.text}`), []);
});

// Supabase falso: as duas tabelas que o lote lê (analises e assinaturas).
function fakeSupabase({ analises, assinaturas = [] }) {
  return {
    from(tabela) {
      const linhas = tabela === 'assinaturas' ? assinaturas : analises;
      const q = { filtros: [], modo: 'select', valores: null };
      const api = {
        select() { return api; },
        update(v) { q.modo = 'update'; q.valores = v; return api; },
        eq(c, v) { q.filtros.push((r) => r[c] === v); return api; },
        ilike(c, v) { q.filtros.push((r) => String(r[c] || '').toLowerCase() === String(v).toLowerCase()); return api; },
        gt(c, v) { q.filtros.push((r) => r[c] && r[c] > v); return api; },
        gte() { return api; }, lte() { return api; }, order() { return api; }, limit() { return api; },
        is(c, v) { q.filtros.push((r) => (r[c] ?? null) === v); return api; },
        then(res) {
          const alvo = linhas.filter((r) => q.filtros.every((f) => f(r)));
          if (q.modo === 'update') alvo.forEach((r) => Object.assign(r, q.valores));
          return Promise.resolve({ data: alvo.map((r) => ({ ...r })), error: null }).then(res);
        },
      };
      return api;
    },
  };
}

test('lote: manda d25/d30, pula quem assina e quem comprou de novo, trava a análise', async () => {
  const analises = [
    { id: 'a', nome: 'ana paula', email: 'ana@x.com', ...pagaHa(26) },         // d25
    { id: 'b', nome: 'Bia', email: 'bia@x.com', ...pagaHa(31) },               // d30
    { id: 'c', nome: 'Cris', email: 'cris@x.com', ...pagaHa(27) },             // já assina
    { id: 'd', nome: 'Duda', email: 'duda@x.com', ...pagaHa(28) },             // comprou outro Manual depois
    { id: 'd2', nome: 'Duda', email: 'duda@x.com', ...pagaHa(2) },
  ];
  const assinaturas = [{ id: 's1', email: 'cris@x.com', acesso_ate: new Date(AGORA + 10 * DIA).toISOString() }];
  const sb = fakeSupabase({ analises, assinaturas });
  const enviados = [];
  const resend = { emails: { send: async (m) => { enviados.push(m); return { error: null }; } } };
  const r = await processarLoteCortesia({ supabase: sb, resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.equal(r.enviados, 2);
  assert.deepEqual(enviados.map((m) => m.to).sort(), ['ana@x.com', 'bia@x.com']);
  assert.match(enviados.find((m) => m.to === 'ana@x.com').subject, /acabam em 5 dias/);
  assert.match(enviados.find((m) => m.to === 'bia@x.com').subject, /terminaram/);
  assert.ok(enviados[0].html.includes('utm_medium=cortesia'));
  assert.ok(analises.find((l) => l.id === 'a').cortesia_d25_em);
  assert.ok(analises.find((l) => l.id === 'b').cortesia_d30_em);
  assert.equal(analises.find((l) => l.id === 'c').cortesia_d25_em, null);
  assert.equal(analises.find((l) => l.id === 'd').cortesia_d25_em, null);

  // 2ª execução: nada de novo.
  enviados.length = 0;
  await processarLoteCortesia({ supabase: sb, resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.equal(enviados.length, 0);
});

test('lote: falha no envio devolve a trava; sem a migração, pula', async () => {
  const analises = [{ id: 'a', nome: 'Ana', email: 'ana@x.com', ...pagaHa(26) }];
  const resend = { emails: { send: async () => ({ error: { message: 'limite' } }) } };
  const r = await processarLoteCortesia({ supabase: fakeSupabase({ analises }), resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.equal(r.enviados, 0);
  assert.equal(analises[0].cortesia_d25_em, null);

  const semColuna = { from() { const api = { select: () => api, eq: () => api, gte: () => api, lte: () => api, order: () => api, limit: () => api, then: (res) => Promise.resolve({ data: null, error: { code: '42703', message: 'column does not exist' } }).then(res) }; return api; } };
  const r2 = await processarLoteCortesia({ supabase: semColuna, resend, baseUrl: 'https://x.com', agora: AGORA });
  assert.equal(r2.pulado, true);
  assert.equal(r2.motivo, 'migração 0033');
});

test('O que é o Manual: texto claro, dentro das regras da marca, sem prometer o que não existe', () => {
  const { O_QUE_E_O_MANUAL } = PLANOS_MOD;
  const texto = [O_QUE_E_O_MANUAL.titulo, O_QUE_E_O_MANUAL.resumo, ...O_QUE_E_O_MANUAL.itens.flatMap((i) => [i.titulo, i.texto])].join(' ');
  assert.deepEqual(problemasDoTexto(texto), []);
  assert.match(texto, /uma vez só/i);
  assert.match(texto, /não é assinatura/i);
  assert.match(texto, /15 seções/);
  assert.ok(!/mapa completo|análise completa|diagnóstico completo/i.test(texto));
  // No /resultado a lista das seções vem embaixo: "o que tem dentro" fica só no /planos.
  assert.deepEqual(O_QUE_E_O_MANUAL.itens.filter((i) => i.noResultado === false).map((i) => i.chave), ['dentro']);
  assert.equal(new Set(O_QUE_E_O_MANUAL.itens.map((i) => i.chave)).size, O_QUE_E_O_MANUAL.itens.length);
});
