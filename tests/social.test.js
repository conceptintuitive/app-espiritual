// Testes do conteúdo da automação social (lib/social.js, lib/socialEditorial.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  temaDoDia, serieDoTema, itemDaSerie, planoDosDias, SERIES, TEMAS, dadosDoDia, reservaDoDia, normalizarConteudo,
  validarConteudo, energiaDoDia, montarLegenda, nomeDaFase, luaDoDia, contaNumeroVida, universais, tituloCurto,
  assinarImagem, conferirAssinatura, caminhoImagem, versaoConteudo, redesLigadas, chaveLigada, proximaSegunda,
  CTA_FEED, HASHTAGS_BASE, diaDaSemana,
} from '../lib/social.js';
import { GUIA_EDITORIAL, CHECKLIST_REVISAO, MECANISMOS, PENSADORES, PARES_SIGNOS, problemasDoTexto } from '../lib/socialEditorial.js';
import { calcularNumeroVida } from '../lib/calculos.js';
import { getCompatibilidade } from '../lib/compatibilidade.js';

// Semana de referência: 30/11/2026 (segunda) a 06/12/2026 (domingo).
const SEG = '2026-11-30';
const SEMANA = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'];
const DIA_DO_TEMA = { numero: SEMANA[0], ponto_cego: SEMANA[1], mente: SEMANA[2], compat: SEMANA[3], pensador: SEMANA[4] };

test('rotação por dia da semana: todo dia tem tema', () => {
  assert.equal(diaDaSemana(SEG), 1);
  assert.deepEqual(SEMANA.map(temaDoDia), ['numero', 'ponto_cego', 'mente', 'compat', 'pensador', 'comenta', 'semana']);
  for (const t of Object.keys(TEMAS)) assert.ok(TEMAS[t].rotulo && TEMAS[t].hashtags.length === 2);
  assert.equal(proximaSegunda('2026-11-29'), '2026-11-30'); // domingo → amanhã
  assert.equal(proximaSegunda('2026-11-30'), '2026-12-07'); // segunda → a próxima
});

test('séries: tamanhos, sem repetir antes da volta', () => {
  assert.deepEqual(SERIES.numero, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
  assert.equal(SERIES.ponto_cego.length, 12);
  assert.equal(SERIES.mente.length, MECANISMOS.length);
  assert.equal(SERIES.pensador.length, PENSADORES.length);
  assert.equal(SERIES.compat.length, 78);
  assert.equal(new Set(SERIES.compat).size, 78, '78 pares diferentes');
  for (const [serie, lista] of Object.entries(SERIES)) {
    const vistos = new Set();
    for (let i = 0; i < lista.length; i++) vistos.add(itemDaSerie(serie, i).item);
    assert.equal(vistos.size, lista.length, `${serie} repetiu antes da volta`);
    assert.equal(itemDaSerie(serie, lista.length).item, lista[0]);
    assert.equal(itemDaSerie(serie, lista.length).volta, 2);
  }
  assert.equal(new Set(PENSADORES.map((p) => p.autor)).size, 8, 'os 8 pensadores no rodízio');
  assert.equal(new Set(PARES_SIGNOS.slice(0, 12).map((p) => p[0])).size > 4, true, 'pares embaralhados');
  assert.equal(serieDoTema('comenta'), null);
  assert.equal(serieDoTema('semana'), null);
});

test('plano: cada série anda só no dia dela e não mexe no estado', () => {
  const estado = { numero: 11, compat: 77 };
  const plano = planoDosDias(SEG, 14, estado);
  assert.deepEqual(estado, { numero: 11, compat: 77 });
  assert.deepEqual(plano.filter((d) => d.tema === 'numero').map((d) => itemDaSerie('numero', d.indice).item), [33, 1]);
  assert.deepEqual(plano.filter((d) => d.tema === 'compat').map((d) => d.indice), [77, 78]);
  assert.deepEqual(plano.filter((d) => d.tema === 'mente').map((d) => d.indice), [0, 1]);
  for (const d of plano.filter((x) => ['comenta', 'semana'].includes(x.tema))) assert.equal(d.indice, null);
});

test('fase da Lua e números universais', () => {
  assert.equal(nomeDaFase(89), 'Lua Nova');
  assert.equal(nomeDaFase(179), 'Lua Crescente');
  assert.equal(nomeDaFase(185), 'Lua Cheia');
  assert.equal(nomeDaFase(300), 'Lua Minguante');
  assert.equal(luaDoDia('2026-11-24').fase, 'Lua Cheia');
  assert.equal(luaDoDia('2026-11-23').fase, 'Lua Crescente');
  assert.deepEqual(universais('2026-11-30'), { ano: 1, mes: 3, dia: 6 });
  assert.equal(universais('2029-02-09').ano, 4); // 2+0+2+9 = 13 → 4
  assert.equal(universais('2027-03-01').ano, 11); // 2+0+2+7 = 11, mestre
});

test('dados do dia: cada tema traz os fatos certos (nada inventado)', () => {
  const n = dadosDoDia(DIA_DO_TEMA.numero, 6);
  assert.equal(n.fatos.numero_de_vida, 7);
  assert.equal(n.grande, '7');
  assert.equal(dadosDoDia(DIA_DO_TEMA.ponto_cego, 7).fatos.signo, 'Escorpião');
  const c = dadosDoDia(DIA_DO_TEMA.compat, 0);
  const [a, b] = PARES_SIGNOS[0];
  assert.equal(c.fatos.nota_de_compatibilidade, getCompatibilidade(a, b).score);
  assert.equal(c.fatos.cta_extra, `É de ${a}? Marca quem é de ${b}.`);
  const j = dadosDoDia(DIA_DO_TEMA.pensador, 0);
  assert.equal(j.fatos.autor, 'Carl Jung');
  assert.ok(j.fatos.citacao.fonte.includes('Jung'));
  assert.ok(dadosDoDia(DIA_DO_TEMA.mente, 0).fatos.o_que_a_pesquisa_sustenta.length > 30);
  const s = dadosDoDia(SEMANA[5]);
  assert.equal(s.fatos.numero_do_exemplo, calcularNumeroVida(s.fatos.exemplo_de_data.split('/').reverse().join('-')));
  const d = dadosDoDia(SEMANA[6]);
  assert.equal(d.dias.length, 7);
  assert.equal(d.dias[0].data, '2026-12-07');
  for (const x of [n, c, j, s, d]) assert.ok(x.energia.kin && x.energia.anjo_destes_dias && x.energia.lua);
});

test('reserva: todo item de toda série passa na checagem automática', () => {
  for (const [serie, lista] of Object.entries(SERIES)) {
    for (let i = 0; i < lista.length; i++) {
      const dados = dadosDoDia(DIA_DO_TEMA[serie], i);
      const v = validarConteudo(reservaDoDia(dados), dados);
      assert.ok(v.ok, `${serie} ${dados.item}: ${v.problemas.join('; ')}`);
    }
  }
  for (const dia of SEMANA.slice(5)) {
    const dados = dadosDoDia(dia);
    const c = reservaDoDia(dados);
    assert.ok(validarConteudo(c, dados).ok);
    assert.equal(c.fonte, 'reserva');
  }
});

test('carrossel: 6 telas, a última é a chamada; domingo tem as telas dos dias', () => {
  const c = reservaDoDia(dadosDoDia(SEG, 0));
  assert.equal(c.telas.length, 6);
  assert.equal(c.telas[5].titulo, 'Faz o seu mapa grátis');
  assert.equal(c.telas[0].rotulo, '');
  assert.equal(c.telas[1].rotulo, 'O mecanismo');
  const dom = reservaDoDia(dadosDoDia(SEMANA[6]));
  assert.equal(dom.telas.length, 6);
  assert.equal(dom.telas[1].rotulo, 'O ciclo');
  assert.deepEqual(dom.telas.slice(2, 5).map((t) => t.dias.length), [2, 2, 3]);
  assert.ok(dom.dias.every((d) => d.conselho));
});

// Um rascunho "da IA" bom, pra testar normalização e validação.
function rascunhoBom(n) {
  return {
    telas: [
      { titulo: `Se você é ${n}, você provavelmente começa tudo sozinha`, texto: 'E termina cansada de carregar.' },
      { titulo: 'Por que', texto: 'A mesma decisão que te faz começar te impede de pedir apoio.' },
      { titulo: 'Na vida real', texto: 'O projeto nasce com você e morre com você, porque ninguém mais sabe onde está.' },
      { titulo: 'A virada', texto: 'Liderar não é fazer tudo: é fazer o outro conseguir fazer.' },
      { titulo: 'Hoje', texto: 'Delegue uma tarefa pequena e não refaça.' },
    ],
    legenda: { gancho: `Se você é ${n}, isso é sobre você.`, texto: ['Linha um.', 'Linha dois.'], hashtags: ['#numerodevida'] },
    story: { titulo: 'Dia de soltar', frase: 'A Lua pede menos controle e mais escuta hoje.' },
    reels: { gancho: `Se você é ${n}, para de carregar tudo.`, virada: 'Liderar é fazer o outro conseguir.' },
  };
}

test('validação: pega número errado, hedge, promessa, emoji, citação inventada, texto longo', () => {
  const dados = dadosDoDia(SEG, 6); // número 7
  const ok = normalizarConteudo(rascunhoBom(7), dados);
  assert.ok(validarConteudo(ok, dados).ok, validarConteudo(ok, dados).problemas.join('; '));
  assert.equal(ok.telas.length, 6, 'a tela da chamada entra sozinha');

  assert.ok(validarConteudo(normalizarConteudo(rascunhoBom(8), dados), dados).problemas.some((p) => p.includes('número 7')));

  const muda = (f) => { const r = rascunhoBom(7); f(r); return validarConteudo(normalizarConteudo(r, dados), dados).problemas; };
  assert.ok(muda((r) => { r.telas[3].texto = 'Talvez você precise delegar.'; }).includes('proibido: hedge'));
  assert.ok(muda((r) => { r.telas[4].texto = 'Isso garante que o dinheiro vem.'; }).includes('proibido: promessa de resultado'));
  assert.ok(muda((r) => { r.story.frase = 'Dia lindo ✨'; }).includes('proibido: emoji'));
  assert.ok(muda((r) => { r.telas[2].texto = 'Você nunca vai mudar isso.'; }).includes('proibido: fatalismo'));
  assert.ok(muda((r) => { r.telas[3].texto = 'Como disse Jung, "a vida começa onde termina a zona de conforto de verdade".'; }).some((p) => p.startsWith('citação')));
  assert.ok(muda((r) => { r.telas[1].texto = 'x'.repeat(400); }).some((p) => p.includes('longo')));
  assert.ok(muda((r) => { r.legenda.texto = ['só uma']; }).some((p) => p.includes('legenda')));
});

test('compatibilidade: nota tem que ser a do site; legenda leva o "marca quem é"', () => {
  const dados = dadosDoDia(DIA_DO_TEMA.compat, 5);
  const { signo_a: a, signo_b: b, nota_de_compatibilidade: nota } = dados.fatos;
  const base = () => ({
    telas: [
      { titulo: `${a} × ${b}: nota ${nota}`, texto: 'Ninguém te conta por que essa dupla briga pelo mesmo motivo.' },
      { titulo: 'Por que', texto: 'Os elementos pedem ritmos diferentes.' },
      { titulo: 'Na vida real', texto: 'Um quer resolver agora, o outro quer pensar.' },
      { titulo: 'A virada', texto: 'O problema não é a diferença: é cada um achar que o seu ritmo é o certo.' },
      { titulo: 'Hoje', texto: 'Pergunte do que o outro precisa antes de responder.' },
    ],
    legenda: { gancho: `${a} × ${b}.`, texto: ['Linha.', 'Outra.'] },
    story: { titulo: 'Dia de ouvir', frase: 'Hoje a escuta resolve mais que a pressa.' },
    reels: { gancho: `${a} × ${b}`, virada: 'Ritmo diferente não é defeito.' },
  });
  const c = normalizarConteudo(base(), dados);
  assert.equal(c.legenda.texto.at(-1), `É de ${a}? Marca quem é de ${b}.`);
  assert.ok(validarConteudo(c, dados).ok, validarConteudo(c, dados).problemas.join('; '));
  const errada = base();
  errada.telas[0].titulo = `${a} × ${b}: nota ${nota === 90 ? 91 : 90}`;
  assert.ok(validarConteudo(normalizarConteudo(errada, dados), dados).problemas.some((p) => p.startsWith('nota errada')));
});

test('editorial: guia tem as regras pedidas; textos fixos não tropeçam nos proibidos', () => {
  for (const t of ['Faz o seu mapa grátis: link na bio', 'Manual do seu Mapa', 'talvez', 'cura', 'separe com clareza', 'Citação: só a que vier nos dados', 'recomenda o site']) {
    assert.ok(GUIA_EDITORIAL.toLowerCase().includes(t.toLowerCase()), t);
  }
  assert.ok(CHECKLIST_REVISAO.includes('Genérico'));
  for (const m of MECANISMOS) for (const k of ['gancho', 'mecanismo', 'exemplo', 'virada', 'pratica']) assert.deepEqual(problemasDoTexto(m[k]), [], `${m.id}.${k}`);
  for (const p of PENSADORES) {
    for (const k of ['resumo', 'aplicar']) assert.deepEqual(problemasDoTexto(p[k]), [], `${p.id}.${k}`);
    assert.ok(p.cuidado.length > 40, `${p.id} sem o cuidado (crença x pesquisa)`);
    if (p.citacao) assert.ok(p.citacao.fonte.includes(p.autor.split(' ').at(-1)), `${p.id}: fonte da citação`);
  }
});

test('story: dados calculados sempre; título e frase da IA quando há', () => {
  const e = energiaDoDia('2026-11-24');
  assert.deepEqual(e.linhas.map((l) => l.rotulo), ['Lua', 'Kin do dia', 'Anjo destes dias']);
  assert.ok(e.titulo.startsWith('Dia '));
  const ia = energiaDoDia('2026-11-24', { titulo: 'Fala menos', frase: 'Hoje quem escuta decide.' });
  assert.equal(ia.titulo, 'Fala menos');
  assert.deepEqual(ia.linhas, e.linhas);
});

test('legenda: gancho, texto, chamada e 5–8 hashtags', () => {
  const leg = montarLegenda({ gancho: 'Gancho.', texto: ['A.', 'B.'], hashtags: ['#tema'] });
  const linhas = leg.split('\n');
  assert.equal(linhas[0], 'Gancho.');
  assert.ok(leg.includes(`\n\n${CTA_FEED}\n\n`));
  const tags = linhas.at(-1).split(' ');
  assert.ok(tags.length >= 5 && tags.length <= 8);
  for (const h of HASHTAGS_BASE) assert.ok(tags.includes(h));
  assert.ok(tituloCurto('a '.repeat(80)).length <= 90);
});

test('sábado: a conta do exemplo bate com calcularNumeroVida', () => {
  for (const dataBR of ['28/11/1994', '29/11/1999', '09/09/1989', '11/02/1990']) {
    const [d, m, y] = dataBR.split('/');
    assert.equal(contaNumeroVida(dataBR).numero, calcularNumeroVida(`${y}-${m}-${d}`), dataBR);
  }
});

test('URL da imagem assinada: data, formato, item e versão', () => {
  const seg = 'segredo-teste';
  const t = assinarImagem({ data: SEG, formato: 'c2', indice: 3, v: 'abc123' }, seg);
  assert.ok(conferirAssinatura({ data: SEG, formato: 'c2', indice: 3, v: 'abc123', t }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'c2', indice: 3, v: 'outra', t }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'c3', indice: 3, v: 'abc123', t }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'c2', indice: 3, v: 'abc123', t }, 'outro'));
  assert.match(caminhoImagem({ data: SEG, formato: 'r1', indice: 0, v: 'abc' }, seg), /^\/api\/social\/imagem\/2026-11-30\/r1\.png\?i=0&v=abc&t=[0-9a-f]{32}$/);
  assert.match(caminhoImagem({ data: SEG, formato: 'story' }, seg), /story\.jpg\?t=/);
  assert.notEqual(versaoConteudo({ a: 1 }), versaoConteudo({ a: 2 }));
});

test('chaves liga/desliga', () => {
  assert.deepEqual(redesLigadas(undefined), []);
  assert.deepEqual(redesLigadas('on'), ['instagram', 'tiktok']);
  assert.deepEqual(redesLigadas('instagram'), ['instagram']);
  assert.ok(chaveLigada('on'));
  assert.ok(!chaveLigada('off'));
  assert.ok(!chaveLigada(undefined));
});

// ── leitura do JSON da IA ─────────────────────────────────────────────────
import { _parseJSON } from '../lib/ia.js';

test('JSON da IA: aceita cerca de código e texto antes/depois', () => {
  assert.deepEqual(_parseJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(_parseJSON('Aqui está a revisão:\n{"aprovado": true, "problemas": []}\nQualquer coisa, me avise.'), { aprovado: true, problemas: [] });
  assert.deepEqual(_parseJSON('{"t": "linha 1\nlinha 2"}'), { t: 'linha 1\nlinha 2' });
  assert.throws(() => _parseJSON('sem json nenhum'));
});
