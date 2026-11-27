// lib/manualCruzado.js — os outros sistemas do mapa dentro do Manual.
//
// Duas saídas, as duas sem IA nova:
// 1. `secaoSistemas(dados)`: a seção "O que os seus sistemas repetem" do Manual
//    (texto fixo, das tabelas de lib/mapaSintese.js). Custo zero.
// 2. `blocoCruzadoParaIA(dados, foco)`: o contexto que entra nas perguntas que
//    já fazemos à IA em 5 seções (Diagnóstico, Tipo de pessoa, Ponto cego,
//    Leitura integrada, Fechamento). Só aumenta a pergunta, não a resposta.
//
// Puro (sem window, sem banco): roda no browser (a seção, carregada sob demanda
// no /manual/[id]) e no servidor. O Human Design NÃO é calculado aqui (a
// efeméride pesa ~47 KB): quem chama passa o resultado de calcularHumanDesign
// em `hd`, só quando há hora de nascimento. Testes em tests/manualCruzado.test.js.

import { sistemasDaPessoa, sinteseDoMapa, TEMAS } from './mapaSintese.js';
import { calcularBazi, TRONCOS, RAMOS, ELEMENTOS } from './bazi.js';
import { DIA_MESTRE } from './baziTextos.js';
import { TIPO_DESCRICAO, AUTORIDADE_DESCRICAO } from './humanDesignTextos.js';
import { REGRA_SISTEMAS_MODERNOS } from './manualEstilo.js';

const TZ_PADRAO = 'America/Sao_Paulo';

/**
 * Fuso pra recalcular os sistemas no browser, sem a base de municípios:
 * o IANA salvo (migração 0015) → o offset salvo da época (0016) como fuso fixo
 * (Etc/GMT+3 = UTC-3; no Brasil o offset sempre foi hora cheia) → Brasília.
 * @param {{ fuso_iana?: string|null, utc_offset_nascimento?: number|string|null }} row
 */
export function fusoDaAnalise(row) {
  if (typeof row?.fuso_iana === 'string' && row.fuso_iana) return row.fuso_iana;
  const v = row?.utc_offset_nascimento;
  const n = v === null || v === undefined || v === '' ? NaN : Number(v);
  if (Number.isInteger(n) && n <= 0 && n >= -6) return n === 0 ? 'Etc/GMT' : `Etc/GMT+${-n}`;
  return TZ_PADRAO;
}

/** "Kin Maia 137" → "Kin Maia" (o número fica no valor). */
const nomeSistema = (s) => String(s || '').replace(/^Kin Maia \d+$/, 'Kin Maia');

/** "a, b e c" */
function listaPt(itens) {
  const l = [...new Set(itens.filter(Boolean))];
  if (l.length <= 1) return l[0] || '';
  return `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}`;
}

/**
 * Todos os sistemas + a síntese + o que cada um diz, prontos pras duas saídas.
 * @param {{ dataNascimento: string, hora?: string|null, tz?: string|null, lon?: number|null, hd?: object|null }} p
 * @returns {null | {
 *   sistemas: ReturnType<typeof sistemasDaPessoa>,
 *   sintese: ReturnType<typeof sinteseDoMapa>,
 *   diaMestre: { titulo: string, imagem: string, essencia: string, sombra: string, animal: string } | null,
 *   hd: { tipo: string, autoridade: string, perfil: string, comoAgir: string, decidir: string } | null,
 * }}
 */
export function dadosCruzados({ dataNascimento, hora = null, tz = null, lon = null, hd = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataNascimento || ''))) return null;
  const horaOk = typeof hora === 'string' && /^\d{1,2}:\d{2}/.test(hora) ? hora.slice(0, 5) : null;
  const fuso = tz || TZ_PADRAO;
  const longitude = typeof lon === 'number' && Number.isFinite(lon) ? lon : null;

  let sistemas;
  try {
    sistemas = sistemasDaPessoa({ dataNascimento, hora: horaOk, cidade: { tz: fuso, lon: longitude } });
  } catch {
    return null;
  }
  const sintese = sinteseDoMapa(sistemas);

  let diaMestre = null;
  try {
    const mapa = calcularBazi({ data: dataNascimento, hora: horaOk, tz: fuso, lon: longitude });
    const dm = TRONCOS[mapa.diaMestre];
    const t = DIA_MESTRE[mapa.diaMestre];
    if (dm && t) {
      diaMestre = {
        titulo: `${ELEMENTOS[dm.elemento].nome} ${dm.yang ? 'Yang' : 'Yin'}`,
        imagem: t.imagem,
        essencia: t.essencia,
        sombra: t.sombra,
        animal: RAMOS[mapa.ano.ramo].animal,
      };
    }
  } catch {}

  let hdResumo = null;
  if (horaOk && hd?.tipo) {
    const tipo = TIPO_DESCRICAO[hd.tipo];
    const aut = AUTORIDADE_DESCRICAO[hd.autoridade];
    if (tipo) {
      hdResumo = {
        tipo: tipo.titulo,
        autoridade: aut?.titulo || String(hd.autoridade || ''),
        perfil: String(hd.perfil || ''),
        comoAgir: tipo.comoAgir || '',
        decidir: aut?.comoAgir || '',
      };
    }
  }

  return { sistemas, sintese, diaMestre, hd: hdResumo };
}

// ── 1. A seção do Manual (sem IA) ────────────────────────────────────────────

const COMO_CHAMAR = {
  signos: 'seu signo', numerologia: 'seu número', 'astrologia-chinesa': 'sua astrologia chinesa',
  anjo: 'seu anjo da guarda', 'anjo-mente': 'seu anjo da mente', 'kin-maia': 'seu Kin Maia',
};
const NO = { signos: 'no seu signo', numerologia: 'no seu número', 'astrologia-chinesa': 'na sua astrologia chinesa', anjo: 'no seu anjo da guarda', 'anjo-mente': 'no seu anjo da mente', 'kin-maia': 'no seu Kin Maia' };
const DO = { signos: 'do seu signo', numerologia: 'do seu número', 'astrologia-chinesa': 'da sua astrologia chinesa', anjo: 'do seu anjo da guarda', 'anjo-mente': 'do seu anjo da mente', 'kin-maia': 'do seu Kin Maia' };

/** Rótulo do voto ("Kin Maia 137") → chave do sistema ("kin-maia"). */
function chavesDe(d, rotulos) {
  const porRotulo = Object.fromEntries(d.sistemas.map((s) => [s.sistema, s.chave]));
  return rotulos.map((r) => porRotulo[r]).filter(Boolean);
}

/**
 * Conteúdo da seção "O que os seus sistemas repetem".
 * @param {NonNullable<ReturnType<typeof dadosCruzados>>} d
 * @returns {{ destaque: string, intro: string, sistemas: Array<{ sistema: string, valor: string, sub: string, temas: string[] }>,
 *   repete: Array<{ nome: string, frase: string, onde: string }>, tensao: { titulo: string, frase: string, conselho: string, onde: string } | null,
 *   fecho: string }}
 */
export function secaoSistemas(d) {
  const votantes = d.sistemas.filter((s) => s.temas.length);
  const nomes = votantes.map((s) => COMO_CHAMAR[s.chave]).filter(Boolean);
  const lista = listaPt(nomes);
  const intro = `${lista.charAt(0).toUpperCase()}${lista.slice(1)} vêm de tradições diferentes, cada uma com a sua forma de ler o seu nascimento. Quando várias apontam pro mesmo lugar, isso deixa de ser detalhe e vira o eixo do seu mapa.`;

  const repete = d.sintese.repete.map((r) => ({
    nome: r.nome,
    frase: r.frase.replace('guiada(o)', 'guiada'),
    onde: `Aparece ${listaPt(chavesDe(d, r.sistemas).map((c) => NO[c]))}.`,
  }));

  // Ninguém repete: mostra o tema mais forte, sem fingir convergência.
  if (!repete.length && d.sintese.ranking[0]) {
    const t = TEMAS[d.sintese.ranking[0].tema];
    repete.push({ nome: t.nome, frase: t.frase.replace('guiada(o)', 'guiada'), onde: 'Seus sistemas falam de coisas diferentes, e este é o tema que mais pesa entre eles.' });
  }

  const ts = d.sintese.tensao;
  const tensao = ts ? {
    titulo: `${ts.nomeA} × ${ts.nomeB}`,
    frase: ts.frase,
    conselho: ts.conselho,
    onde: `${ts.nomeA} vem ${listaPt(chavesDe(d, ts.sistemasA).map((c) => DO[c]))}; ${ts.nomeB}, ${listaPt(chavesDe(d, ts.sistemasB).map((c) => DO[c]))}.`,
  } : null;

  const fecho = tensao
    ? 'O resto do Manual parte daqui: o diagnóstico, o ponto cego e a leitura integrada voltam a esse eixo e a essa divisão com o seu objetivo do quiz.'
    : 'O resto do Manual parte daqui: o diagnóstico, o ponto cego e a leitura integrada voltam a esse eixo com o seu objetivo do quiz.';

  const convergiu = d.sintese.repete.map((r) => r.nome);
  const destaque = convergiu.length
    ? `Tradições diferentes repetem a mesma palavra sobre você: ${listaPt(convergiu)}.`
    : `Seus sistemas falam de coisas diferentes, e o que mais pesa entre eles é ${repete[0]?.nome || 'o seu signo'}.`;

  return {
    destaque,
    intro,
    sistemas: votantes.map((s) => ({ sistema: nomeSistema(s.sistema), valor: s.valor, sub: s.sub, temas: s.temas.map((t) => TEMAS[t]?.nome).filter(Boolean) })),
    repete,
    tensao,
    fecho,
  };
}

// ── 2. O contexto pra IA ─────────────────────────────────────────────────────

/**
 * Como cada seção usa os outros sistemas. `nomear` = quantas vezes o texto pode
 * citar um sistema pelo nome (0 = traduz tudo em comportamento; 'citar' = cada
 * afirmação diz de onde vem, REGRA_DE_CITACAO de lib/manualEstilo.js).
 */
export const FOCO_CRUZADO = {
  diagnostico: {
    nomear: 'citar',
    foco: 'O tema que mais de um sistema repete é a espinha do campo "combinacao". A divisão entre sistemas, se houver, é a matéria-prima do "conflito_central". Se houver Human Design, a autoridade mostra como você decide por dentro: use isso no "diagnostico_objetivo".',
  },
  tipoPessoa: {
    nomear: 0,
    foco: 'Mostre o tema repetido como comportamento visível no dia a dia. Se houver Human Design, o Tipo e o "como agir" dizem como você gasta energia e quando trava: traduza em cena concreta, sem o nome do sistema.',
  },
  pontoCego: {
    nomear: 0,
    foco: 'O ponto cego nasce da divisão entre os sistemas (quando houver) ou da sombra da astrologia chinesa: o que você faz no automático por causa dessa divisão e não enxerga.',
  },
  leitura: {
    nomear: 'citar',
    foco: 'No eixo = quando você vive o tema que os sistemas repetem. Fora do eixo = quando a divisão entre sistemas toma conta, ou quando você contraria o "como agir" do Human Design. Mostre que tradições diferentes chegam ao mesmo lugar.',
  },
  fechamento: {
    nomear: 1,
    foco: 'Sele o Manual no tema que mais de um sistema repete. O mantra pode nascer dele ou da forma de resolver a divisão.',
  },
};

function regraDeNome(nomear) {
  if (nomear === 'citar') return 'Cite pelo nome os sistemas que sustentam cada afirmação, como manda a REGRA DE CITAÇÃO (os do signo, dos planetas e dos números também contam). Nunca explique o que é cada sistema e nunca diga "Day Master", "Autoridade" ou "Kin" como jargão.';
  if (!nomear) return 'Não cite nenhum desses sistemas pelo nome (astrologia chinesa, BaZi, Human Design, anjo, Kin Maia): traduza tudo em comportamento.';
  return `Pode citar pelo nome no máximo ${nomear === 1 ? '1 sistema, 1 vez' : `${nomear} sistemas, 1 vez cada`}, e só pra mostrar que eles concordam (ex.: "isso aparece no seu número e de novo na astrologia chinesa"). Nunca explique o que é cada sistema e nunca diga "Day Master", "Autoridade" ou "Kin" como jargão.`;
}

/**
 * O bloco que entra no fim da pergunta da IA. '' = nada (análise sem data, erro).
 * @param {ReturnType<typeof dadosCruzados>} d
 * @param {keyof typeof FOCO_CRUZADO} secao
 */
export function blocoCruzadoParaIA(d, secao) {
  if (!d) return '';
  const cfg = FOCO_CRUZADO[secao];
  if (!cfg) return '';
  const linhas = [];
  const porChave = Object.fromEntries(d.sistemas.map((s) => [s.chave, s]));

  if (d.diaMestre) {
    linhas.push(`Astrologia chinesa: ${d.diaMestre.animal} no ano; por dentro, ${d.diaMestre.titulo} (${d.diaMestre.imagem}). Essência: ${d.diaMestre.essencia} Sombra: ${d.diaMestre.sombra}`);
  }
  if (porChave.anjo) linhas.push(`Anjo da guarda: ${porChave.anjo.valor} (dom: ${porChave.anjo.sub}).`);
  if (porChave['anjo-mente']) linhas.push(`Anjo da mente (pela hora): ${porChave['anjo-mente'].valor} (dom: ${porChave['anjo-mente'].sub}).`);
  if (porChave['kin-maia']) linhas.push(`${porChave['kin-maia'].sistema}: ${porChave['kin-maia'].valor} (${porChave['kin-maia'].sub}).`);
  if (d.hd) {
    linhas.push(`Human Design: ${d.hd.tipo}, ${d.hd.autoridade}${d.hd.perfil ? `, Perfil ${d.hd.perfil}` : ''}. Como agir: ${d.hd.comoAgir}${d.hd.decidir ? ` Como decidir: ${d.hd.decidir}` : ''}`);
  }

  const repete = d.sintese.repete.length
    ? d.sintese.repete.map((r) => `${r.nome} (${listaPt(r.sistemas.map(nomeSistema))}): ${r.frase.replace('guiada(o)', 'guiada')}`).join('\n')
    : 'Nenhum tema se repete entre os sistemas. Use os sistemas só como cor, sem inventar convergência.';
  const ts = d.sintese.tensao;
  const tensao = ts
    ? `${ts.nomeA} (${listaPt(ts.sistemasA.map(nomeSistema))}) × ${ts.nomeB} (${listaPt(ts.sistemasB.map(nomeSistema))}): ${ts.frase} ${ts.conselho}`
    : 'Nenhuma divisão forte entre os sistemas.';

  // Os prompts proíbem travessão; os textos das tabelas têm. Tira antes de mandar.
  const semTravessao = (t) => t.replace(/\s*—\s*/g, ', ');
  return semTravessao(`

=== OUTROS SISTEMAS DO MAPA (calculados pela data, hora e cidade de nascimento) ===
${linhas.join('\n')}

O QUE MAIS DE UM SISTEMA REPETE:
${repete}

ONDE OS SISTEMAS PUXAM PRA LADOS OPOSTOS:
${tensao}

COMO USAR NESTA SEÇÃO: ${cfg.foco}
REGRAS DOS OUTROS SISTEMAS:
• Eles reforçam a leitura do signo, dos planetas e do número, que continua sendo a base. O texto continua sendo sobre comportamento e objetivo.
• Use só o que está escrito acima. Nunca invente posição, número, nome ou significado que não esteja aqui.
• Se um sistema contradiz os outros e não está na divisão listada, ignore em vez de forçar.
• ${REGRA_SISTEMAS_MODERNOS}
• ${regraDeNome(cfg.nomear)}`);
}
