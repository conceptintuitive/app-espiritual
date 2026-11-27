// Testes de lib/manualCruzado.js e lib/manualCruzadoServidor.js: os outros
// sistemas do mapa no Manual (a seção sem IA e o contexto das 5 perguntas).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { dadosCruzados, secaoSistemas, blocoCruzadoParaIA, fusoDaAnalise, FOCO_CRUZADO } = await import('../lib/manualCruzado.js');
const { cruzadoDaLinha } = await import('../lib/manualCruzadoServidor.js');
const { calcularHumanDesign } = await import('../lib/humanDesign.js');
const { generateManual, buildDiagnosticoCtx, buildTipoPessoaCtx, buildPontoCegoCtx, buildLeituraCtx, buildFechamentoCtx, buildAmorCtx } = await import('../lib/manualgenerator.js');
const { destaqueDaSecao, agruparEmCapitulos } = await import('../lib/manualLeitura.js');
const { problemasDoTexto } = await import('../lib/socialEditorial.js');

const PESSOA = { dataNascimento: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo', lon: -40.3 };

test('fusoDaAnalise: IANA salvo → offset salvo como fuso fixo → Brasília', () => {
  assert.equal(fusoDaAnalise({ fuso_iana: 'America/Manaus', utc_offset_nascimento: -2 }), 'America/Manaus');
  assert.equal(fusoDaAnalise({ utc_offset_nascimento: -2 }), 'Etc/GMT+2');
  assert.equal(fusoDaAnalise({ utc_offset_nascimento: '-4' }), 'Etc/GMT+4');
  assert.equal(fusoDaAnalise({ utc_offset_nascimento: -3.5 }), 'America/Sao_Paulo');
  assert.equal(fusoDaAnalise({}), 'America/Sao_Paulo');
  assert.equal(fusoDaAnalise(null), 'America/Sao_Paulo');
});

test('fuso fixo da época dá o mesmo mapa que o IANA (verão de 1994, UTC-2)', () => {
  const a = dadosCruzados(PESSOA);
  const b = dadosCruzados({ ...PESSOA, tz: 'Etc/GMT+2' });
  assert.deepEqual(a.sistemas.map((s) => s.valor), b.sistemas.map((s) => s.valor));
});

test('dadosCruzados: data inválida = null; sem hora, sem anjo da mente nem Human Design', () => {
  assert.equal(dadosCruzados({ dataNascimento: '21/12/1994' }), null);
  assert.equal(dadosCruzados({}), null);
  const hd = calcularHumanDesign('1994-12-21', '07:25', -2);
  const semHora = dadosCruzados({ ...PESSOA, hora: null, hd });
  assert.ok(!semHora.sistemas.some((s) => s.chave === 'anjo-mente'));
  assert.equal(semHora.hd, null);
  const comHora = dadosCruzados({ ...PESSOA, hd });
  assert.ok(comHora.sistemas.some((s) => s.chave === 'anjo-mente'));
  assert.ok(comHora.hd.tipo && comHora.hd.autoridade && comHora.hd.comoAgir);
  assert.ok(comHora.diaMestre.titulo && comHora.diaMestre.sombra);
});

test('secaoSistemas: só o que os sistemas votaram, com de onde veio cada convergência', () => {
  const d = dadosCruzados(PESSOA);
  const s = secaoSistemas(d);
  assert.ok(s.sistemas.length >= 5);
  assert.ok(!s.sistemas.some((x) => x.sistema === 'Céu do nascimento'), 'o céu não vota');
  assert.ok(s.sistemas.every((x) => !/^Kin Maia \d/.test(x.sistema)));
  assert.equal(s.repete.length, d.sintese.repete.length);
  for (const [i, r] of s.repete.entries()) {
    assert.equal(r.nome, d.sintese.repete[i].nome);
    assert.match(r.onde, /^Aparece (no|na) /);
  }
  assert.ok(s.destaque.includes(s.repete[0].nome));
  if (d.sintese.tensao) {
    assert.equal(s.tensao.conselho, d.sintese.tensao.conselho);
    assert.match(s.tensao.titulo, / × /);
  }
  assert.match(s.intro, /^Seu signo, seu número/);
});

test('secaoSistemas: sem convergência, não inventa e diz que falam de coisas diferentes', () => {
  const d = dadosCruzados(PESSOA);
  const seco = { ...d, sintese: { ...d.sintese, repete: [], tensao: null } };
  const s = secaoSistemas(seco);
  assert.equal(s.repete.length, 1);
  assert.match(s.repete[0].onde, /coisas diferentes/);
  assert.match(s.destaque, /coisas diferentes/);
  assert.equal(s.tensao, null);
});

test('secaoSistemas: texto dentro das regras da marca, em várias datas', () => {
  for (const data of ['1990-07-14', '1985-02-03', '2001-10-30', '1972-05-09', '1994-12-21', '1999-09-09']) {
    const s = secaoSistemas(dadosCruzados({ dataNascimento: data, hora: '14:10', tz: 'America/Sao_Paulo', lon: -46.6 }));
    const texto = [s.destaque, s.intro, s.fecho, ...s.repete.flatMap((r) => [r.frase, r.onde]), s.tensao?.frase, s.tensao?.onde].filter(Boolean).join(' ');
    assert.ok(!texto.includes('(o)'), data);
    assert.deepEqual(problemasDoTexto(texto), [], `${data}: ${problemasDoTexto(texto).join(', ')}`);
  }
});

test('blocoCruzadoParaIA: os dados certos, a regra de citação de cada seção', () => {
  assert.equal(blocoCruzadoParaIA(null, 'diagnostico'), '');
  const hd = calcularHumanDesign('1994-12-21', '07:25', -2);
  const d = dadosCruzados({ ...PESSOA, hd });
  assert.equal(blocoCruzadoParaIA(d, 'amor'), '', 'seção sem foco não recebe o bloco');
  for (const secao of Object.keys(FOCO_CRUZADO)) {
    const b = blocoCruzadoParaIA(d, secao);
    assert.match(b, /OUTROS SISTEMAS DO MAPA/);
    assert.match(b, /Astrologia chinesa: /);
    assert.match(b, /Anjo da guarda: /);
    assert.match(b, /Kin Maia \d+: /);
    assert.match(b, new RegExp(`Human Design: ${d.hd.tipo}`));
    assert.match(b, /Nunca invente/);
    assert.ok(!b.includes('—'), 'sem travessão (os prompts proíbem)');
    for (const r of d.sintese.repete) assert.ok(b.includes(r.nome), `${secao}: ${r.nome}`);
    if (FOCO_CRUZADO[secao].nomear === 0) assert.match(b, /Não cite nenhum desses sistemas pelo nome/);
    else if (FOCO_CRUZADO[secao].nomear === 'citar') assert.match(b, /REGRA DE CITAÇÃO/);
    else assert.match(b, /Pode citar pelo nome no máximo/);
  }
  // Sem hora: nada de Human Design no texto (não dá pra calcular).
  assert.doesNotMatch(blocoCruzadoParaIA(dadosCruzados({ ...PESSOA, hora: null }), 'leitura'), /Human Design: /);
  // Pequeno: a pergunta cresce, a resposta não (uns 2.500 caracteres no máximo).
  assert.ok(blocoCruzadoParaIA(d, 'leitura').length < 2800);
});

test('cruzadoDaLinha: mesma conta do browser (fuso da análise) + Human Design com o offset salvo', () => {
  const row = { data_nascimento: '1994-12-21', hora_nascimento: '07:25:00', longitude: '-40.3', utc_offset_nascimento: -2 };
  const d = cruzadoDaLinha(row);
  const browser = dadosCruzados({ dataNascimento: '1994-12-21', hora: '07:25', tz: fusoDaAnalise(row), lon: -40.3 });
  assert.deepEqual(d.sistemas.map((s) => s.valor), browser.sistemas.map((s) => s.valor));
  const hd = calcularHumanDesign('1994-12-21', '07:25', -2);
  assert.equal(d.hd.perfil, hd.perfil);
  // Sem offset salvo (análise antiga), o Human Design usa -3 como no /human-design/[id].
  const legado = cruzadoDaLinha({ ...row, utc_offset_nascimento: null });
  assert.equal(legado.hd.perfil, calcularHumanDesign('1994-12-21', '07:25', -3).perfil);
  assert.equal(cruzadoDaLinha({}), null);
  assert.equal(cruzadoDaLinha({ data_nascimento: '1994-12-21' }).hd, null);
});

test('build*Ctx: só as 5 seções que cruzam recebem os outros sistemas', () => {
  const cruzado = { marca: 1 };
  const row = { nome: 'Ana Souza', signo: 'Leão', numero_vida: 7, __cruzado: cruzado };
  for (const b of [buildDiagnosticoCtx, buildTipoPessoaCtx, buildPontoCegoCtx, buildLeituraCtx, buildFechamentoCtx]) {
    assert.equal(b(row).cruzado, cruzado, b.name);
  }
  assert.equal(buildDiagnosticoCtx({ ...row, __cruzado: undefined }).cruzado, null);
  assert.equal(buildAmorCtx(row).cruzado, undefined);
});

test('generateManual: a seção entra logo depois do Mapa, no capítulo "Quem você é"', () => {
  const base = { nome: 'Ana Souza', signo: 'Leão', numeroVida: 7, objetivoPrincipal: 'Amor', dataNascimentoISO: '1990-07-14' };
  const sem = generateManual(base);
  assert.ok(!sem.sections.some((s) => s.type === 'sistemas'));

  const secao = secaoSistemas(dadosCruzados({ dataNascimento: '1990-07-14' }));
  const man = generateManual({ ...base, sistemasCruzados: secao });
  const i = man.sections.findIndex((s) => s.type === 'sistemas');
  assert.equal(man.sections[i - 1].type, 'mapa');
  assert.equal(man.sections[i].title.trim(), 'O que os seus sistemas repetem');
  assert.equal(destaqueDaSecao(man.sections[i]), secao.destaque);
  const quem = agruparEmCapitulos(man.sections).find((c) => c.id === 'quem');
  assert.ok(quem.secoes.some((x) => x.section.type === 'sistemas'));
});
