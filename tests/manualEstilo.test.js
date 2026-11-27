// Regras de estilo do Manual (lib/manualEstilo.js) e os prompts de lib/ia.js
// com a API da Anthropic falsa (nada sai da máquina) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGRA_SEM_CONTRASTE, REGRA_DE_CITACAO, acharContrastes, contarCitacoes } from '../lib/manualEstilo.js';
import * as ia from '../lib/ia.js';
import * as mg from '../lib/manualgenerator.js';
import { cruzadoDaLinha } from '../lib/manualCruzadoServidor.js';

test('acharContrastes: pega o "não é X, é Y" e as variações', () => {
  for (const t of [
    'Não é fuga consciente: é o jeito que você aprendeu.',
    'O que te exaure não é o trabalho, é a sensação de que tudo para.',
    'Isso não é pouco. É o seu ciclo.',
    'Isso não é fraqueza, mas proteção.',
    'Você não é fria, só demora a confiar.',
    'Você não briga: desaparece.',
    'Quando o resultado demora, você não espera: você assume mais.',
    'Você adia, não por falta de vontade, mas porque mede demais.',
    'O ajuste é não um sentimento, e sim uma ação.',
    'Não se trata de força de vontade.',
  ]) assert.equal(acharContrastes(t).length, 1, t);
});

test('acharContrastes: deixa passar negação comum', () => {
  for (const t of [
    'Você não precisa de ninguém e faz questão de mostrar isso.',
    'Quando você não sabe, pergunta duas vezes.',
    'O que te trava é excesso de critério.',
    'Não é à toa que você cansa no fim da semana.',
    'Você some quando alguém pede que você fique.',
  ]) assert.deepEqual(acharContrastes(t), [], t);
});

test('contarCitacoes: conta sistema pelo nome', () => {
  assert.equal(contarCitacoes('Isso aparece no seu Sol em Sagitário e de novo no seu número 11.'), 2);
  assert.equal(contarCitacoes('Três sistemas dizem isso: o seu signo, a sua astrologia chinesa e o seu Kin, Terra.'), 3);
  assert.equal(contarCitacoes('Você some quando alguém pede que você fique.'), 0);
});

// ── Prompts ─────────────────────────────────────────────────────────────────

const LINHA = {
  id: 'x', nome: 'Mariana Souza', data_nascimento: '1994-12-21', hora_nascimento: '07:25', longitude: -40.31,
  utc_offset_nascimento: -2, fuso_iana: 'America/Sao_Paulo',
  signo: 'Sagitário', numero_vida: 11, ano_pessoal: 5, numero_alma: 6, numero_expressao: 3,
  signo_lua: 'Câncer', signo_venus: 'Escorpião', signo_marte: 'Capricórnio', signo_mercurio: 'Sagitário',
  signo_nodo: 'Escorpião', signo_ascendente: 'Capricórnio',
  objetivo_principal: 'Amor e Relacionamentos', relacao_status: 'Solteira', trabalho_status: 'Empreendedora',
};

async function capturar(fn) {
  const antes = { fetch: globalThis.fetch, key: process.env.ANTHROPIC_API_KEY };
  let corpo = null;
  process.env.ANTHROPIC_API_KEY = 'teste';
  globalThis.fetch = async (_url, opc) => {
    corpo = JSON.parse(opc.body);
    return { ok: true, json: async () => ({ content: [{ text: '{}' }] }) };
  };
  try { await fn(); } finally {
    globalThis.fetch = antes.fetch;
    if (antes.key === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = antes.key;
  }
  return { system: corpo?.system || '', user: corpo?.messages?.[0]?.content || '' };
}

const linha = { ...LINHA, __cruzado: cruzadoDaLinha(LINHA), __resumoAnterior: '' };
const SECOES = {
  sintese: () => ia.gerarSinteseIA(mg.buildMapaCtx(linha)),
  diagnostico: () => ia.gerarDiagnosticoIA(mg.buildDiagnosticoCtx(linha)),
  tipoPessoa: () => ia.gerarTipoPessoaIA(mg.buildTipoPessoaCtx(linha)),
  arquetipos: () => ia.gerarArquetiposIA(mg.buildArquetiposCtx(linha)),
  amor: () => ia.gerarAmorIA(mg.buildAmorCtx(linha)),
  objetivo: () => ia.gerarObjetivoIA(mg.buildObjetivoCtx(linha)),
  leitura: () => ia.gerarLeituraIA(mg.buildLeituraCtx(linha)),
  plano7: () => ia.gerarPlano7IA(mg.buildPlano7Ctx(linha)),
  pontoCego: () => ia.gerarPontoCegoIA(mg.buildPontoCegoCtx(linha)),
  bloqueios: () => ia.gerarBloqueiosIA(mg.buildBloqueiosCtx(linha)),
  dinheiro: () => ia.gerarDinheiroIA(mg.buildDinheiroCtx(linha)),
  rituais: () => ia.gerarRituaisIA(mg.buildRituaisCtx(linha)),
  calendario: () => ia.gerarCalendarioIA(mg.buildCalendarioCtx(linha)),
  fechamento: () => ia.gerarFechamentoIA(mg.buildFechamentoCtx(linha)),
  preview: () => ia.gerarPreviewIA({ signo: 'Sagitário', signoLua: 'Câncer', signoVenus: 'Escorpião', signoMarte: 'Capricórnio', numN: 11 }),
  tarot: () => ia.gerarInterpretacaoTarotIA({
    carta: { nome: 'A Estrela', palavrasChave: ['esperança'], significado: 'calma depois do barulho', significadoInvertido: 'desânimo' },
    invertida: false, signo: 'Sagitário', numN: 11, objetivo: 'Amor', firstName: 'Mariana',
  }),
};

test('todas as seções proíbem o contraste por negação; os exemplos dos prompts não ensinam o vício', async () => {
  for (const [nome, chamar] of Object.entries(SECOES)) {
    const { system, user } = await capturar(chamar);
    assert.ok(system.length > 200, `${nome}: prompt capturado`);
    assert.ok(system.includes(REGRA_SEM_CONTRASTE.trim()), `${nome}: tem a regra`);
    // Tirando o texto das regras (que cita o vício pra proibir), nada no
    // prompt (instruções, exemplos, dados) pode ter o padrão.
    const resto = `${system}\n${user}`.replace(REGRA_SEM_CONTRASTE.trim(), '').replace(REGRA_DE_CITACAO.trim(), '');
    assert.deepEqual(acharContrastes(resto), [], `${nome}: prompt sem o padrão`);
  }
});

test('Diagnóstico e Leitura integrada pedem a fonte de cada afirmação; as outras seções não', async () => {
  for (const [nome, chamar] of Object.entries(SECOES)) {
    const { system, user } = await capturar(chamar);
    const cita = nome === 'diagnostico' || nome === 'leitura';
    assert.equal(system.includes(REGRA_DE_CITACAO.trim()), cita, nome);
    if (cita) {
      assert.match(user, /REGRA DE CITAÇÃO/, `${nome}: o bloco dos outros sistemas manda citar`);
      assert.doesNotMatch(`${system}\n${user}`, /NUNCA cite planetas pelo nome/, nome);
    }
  }
  // A Leitura diz de qual planeta vem o padrão emocional (senão a IA não tem como citar a Lua).
  const { user } = await capturar(SECOES.leitura);
  assert.match(user, /Lua em Câncer, padrão emocional/);
});

test('textos fixos que entram na pergunta da IA também não têm o padrão (todos os Day Masters, Tipos, Autoridades e tensões)', async () => {
  const { DIA_MESTRE } = await import('../lib/baziTextos.js');
  const { TIPO_DESCRICAO, AUTORIDADE_DESCRICAO } = await import('../lib/humanDesignTextos.js');
  const { TENSOES, TEMAS } = await import('../lib/mapaSintese.js');
  const textos = [
    ...Object.values(DIA_MESTRE).flatMap((d) => [d.essencia, d.sombra]),
    ...Object.values(TIPO_DESCRICAO).map((t) => t.comoAgir || ''),
    ...Object.values(AUTORIDADE_DESCRICAO).map((a) => a.comoAgir || ''),
    ...TENSOES.flatMap((t) => [t.frase, t.conselho]),
    ...Object.values(TEMAS).map((t) => t.frase),
  ];
  for (const t of textos) assert.deepEqual(acharContrastes(t), [], t);
});

test('Human Design e Kin Maia nunca como milenares: regra no Manual, nas redes e no Oráculo', async () => {
  const { REGRA_SISTEMAS_MODERNOS } = await import('../lib/manualEstilo.js');
  assert.match(REGRA_SISTEMAS_MODERNOS, /milenar, antigo ou ancestral/);
  // Manual: as 5 seções que recebem os outros sistemas
  for (const nome of ['diagnostico', 'tipoPessoa', 'pontoCego', 'leitura', 'fechamento']) {
    const { user } = await capturar(SECOES[nome]);
    assert.ok(user.includes(REGRA_SISTEMAS_MODERNOS), nome);
  }
  const { GUIA_EDITORIAL } = await import('../lib/socialEditorial.js');
  assert.ok(GUIA_EDITORIAL.includes(REGRA_SISTEMAS_MODERNOS), 'posts das redes');
  const fonte = (await import('node:fs')).readFileSync(new URL('../lib/assistente.js', import.meta.url), 'utf8');
  assert.match(fonte, /\$\{REGRA_SISTEMAS_MODERNOS\}/, 'Oráculo');
});

test('seção "O que os seus sistemas repetem" sem "tradições que nunca conversaram"', async () => {
  const { dadosCruzados, secaoSistemas } = await import('../lib/manualCruzado.js');
  const s = secaoSistemas(dadosCruzados({ dataNascimento: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo', lon: -40.3 }));
  const texto = JSON.stringify(s);
  assert.doesNotMatch(texto, /nunca conversaram/);
  assert.deepEqual(acharContrastes(texto), []);
});
