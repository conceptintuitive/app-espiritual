// lib/socialIA.js — a IA escreve os posts da automação social. SÓ SERVIDOR.
// Duas chamadas por dia de conteúdo (chamarClaude de lib/ia.js, a mesma do
// Manual):
//   1) gerar: guia editorial (lib/socialEditorial.js) + DADOS do dia
//      (dadosDoDia em lib/social.js) → carrossel, legenda, story e Reels;
//   2) revisar: o mesmo guia + checklist; aprova ou devolve reescrito.
// Depois, validarConteudo (checagem automática: formato, tamanho, palavras
// proibidas, número/signo/nota/citação batendo com os dados). Se nada passar,
// usa o texto de reserva das tabelas (reservaDoDia). Nunca publica texto da IA
// que não passou na checagem automática.

import { chamarClaude } from './ia.js';
import { GUIA_EDITORIAL, CHECKLIST_REVISAO, GUIA_REELS, CHECKLIST_REVISAO_REELS, problemasDoTexto } from './socialEditorial.js';
import { normalizarRoteiro, validarRoteiro, contarPalavras, textoNarrado, PALAVRAS_MIN, PALAVRAS_MAX } from './reelsRoteiro.js';
import { normalizarConteudo, validarConteudo, reservaDoDia, TEMAS } from './social.js';

// O formato do post (o mesmo na geração e no campo "conteudo" da revisão).
const ESQUEMA_POST = `{
  "telas": [
    { "titulo": "…", "texto": "…" }
  ],
  "legenda": { "gancho": "…", "texto": ["…", "…"] },
  "story": { "titulo": "…", "frase": "…" },
  "reels": { "gancho": "…", "virada": "…" }
}`;

const REGRAS_POST = `Regras do formato (passou do tamanho, o post é descartado; conte os caracteres):
- "telas": exatamente 5 telas do carrossel, nesta ordem: 1) gancho de identificação (é a capa), 2) o mecanismo, 3) um exemplo concreto da vida real, 4) a virada que contradiz o senso comum, 5) a prática de 1 frase pra hoje. "titulo" até 80 caracteres. "texto" até 260 caracteres: 2 ou 3 frases curtas, é uma tela de celular. NÃO escreva a tela de chamada final: ela é fixa e entra sozinha.
- "legenda": "gancho" é a 1ª linha da legenda (até 150 caracteres, a frase que faz parar de rolar); "texto" tem de 2 a 4 linhas curtas. Não escreva hashtags nem a chamada: entram sozinhas.
- "story": o story "Energia de hoje", escrito a partir dos DADOS DE ENERGIA DO DIA (não do tema do carrossel). "titulo" com até 4 palavras; "frase" com 1 frase de até 140 caracteres, específica do dia.
- "reels": versão de 7 a 10 segundos do carrossel: "gancho" até 90 caracteres, "virada" até 140.`;

const REGRAS_SEMANA = `NESTE TEMA (CICLOS), muda só isto: "telas" tem exatamente 2 telas (1: gancho da semana; 2: o ciclo, usando Ano e Mês Universal e as fases da Lua), e entra também
  "dias": [ { "data": "AAAA-MM-DD", "conselho": "…" } ]
com os 7 dias dos DADOS, na ordem, cada conselho com até 110 caracteres, específico daquele dia (Lua, Kin e número universal do dia).`;

const formatoDoPost = (tema) => `${ESQUEMA_POST}\n${REGRAS_POST}${tema === 'semana' ? `\n${REGRAS_SEMANA}` : ''}`;

/** Pedido de geração: devolver o post. */
const FORMATO_GERAR = (tema) => `Responda SÓ com um JSON válido, sem texto antes ou depois, neste formato:\n${formatoDoPost(tema)}`;

/**
 * Pedido de revisão: devolver o veredito COM o post dentro. (Antes, o pedido
 * terminava com o formato do post e a IA devolvia só o post, sem "aprovado".)
 */
const FORMATO_REVISAR = (tema) => `Responda SÓ com um JSON válido, sem texto antes ou depois, neste formato:
{ "aprovado": true ou false, "problemas": ["…"], "conteudo": { …o post final… } }
O campo "conteudo" segue exatamente este formato e estas regras:
${formatoDoPost(tema)}`;

const PEDIDO_DO_TEMA = {
  numero: (f) => `TEMA DE HOJE: PADRÕES. O que se repete na vida de quem tem número de vida ${f.numero_de_vida}${f.numero_mestre ? ' (número mestre)' : ''}. Comece com "Se você é ${f.numero_de_vida}, …".`,
  ponto_cego: (f) => `TEMA DE HOJE: SOMBRA. O ponto cego de ${f.signo} (vale pra ${f.vale_para}). Mostre de onde ele nasce (o motor do signo) e por que é difícil de ver de dentro.`,
  mente: (f) => `TEMA DE HOJE: MENTE E CIÊNCIA. Explique "${f.mecanismo}" e ligue a ${f.simbolo_ligado}. Seja honesta: diga só o que o campo "o_que_a_pesquisa_sustenta" diz, com o mesmo tamanho de certeza. O "rascunho" é um ponto de partida: escreva melhor, sem perder a honestidade.`,
  compat: (f) => `TEMA DE HOJE: RELAÇÕES. ${f.signo_a} × ${f.signo_b}, nota ${f.nota_de_compatibilidade} de compatibilidade no site (${f.nota_de}). Use a nota exata. Pode ir pelo ângulo de "por que você atrai sempre o mesmo tipo". A última linha do "texto" da legenda tem que ser exatamente: "${f.cta_extra}"`,
  pensador: (f) => `TEMA DE HOJE: PENSADORES. ${f.autor}: "${f.ideia}". A ideia central em linguagem simples e como aplicar hoje. Separe com clareza o que é crença ou linguagem simbólica do que a pesquisa sustenta (campo "o_que_e_crenca_e_o_que_a_pesquisa_sustenta"). ${f.citacao ? `Se citar, use SÓ esta citação, palavra por palavra, com o autor: "${f.citacao.texto}" (${f.citacao.fonte}).` : 'Não há citação nos dados: não cite.'} Nada que sugira que o autor recomenda o site.`,
  comenta: () => 'TEMA DE HOJE: INTERAÇÃO. O post convida a comentar a data de nascimento pra receber o número de vida (a conta responde sozinha nos comentários). Use o exemplo e a conta dos DADOS, exatamente.',
  semana: (f) => `TEMA DE HOJE: CICLOS. A energia da semana ${f.semana}.`,
};

function pedidoDeGeracao(dados) {
  const { energia, fatos } = dados;
  return [
    PEDIDO_DO_TEMA[dados.tema](fatos),
    '',
    'DADOS DO POST (use só estes fatos; não invente número, data, nota, estudo, porcentagem nem citação):',
    JSON.stringify(fatos, null, 2),
    '',
    'DADOS DE ENERGIA DO DIA (só pro story):',
    JSON.stringify(energia, null, 2),
    '',
    FORMATO_GERAR(dados.tema),
  ].join('\n');
}

const SISTEMA_GERAR = `${GUIA_EDITORIAL}\n\nVocê está escrevendo o post de hoje da série "${'{TEMA}'}". Escreva como quem conhece o assunto a fundo e respeita quem lê.`;

const SISTEMA_REVISAR = `${GUIA_EDITORIAL}\n\n${CHECKLIST_REVISAO}\n\nVocê é a editora-chefe. Sua resposta é sempre o veredito com o post dentro: { "aprovado", "problemas", "conteudo" }.
Se aprovado, "conteudo" é o rascunho sem mudança. Se reprovado, "conteudo" é o post reescrito corrigindo TODOS os problemas (inclusive os da checagem automática), mantendo os dados exatos.`;

/**
 * Lê a resposta da revisão. Aceita o veredito completo e também o caso em que
 * a IA devolve só o post reescrito (sem "aprovado"): vale como reescrita.
 */
export function lerRevisao(rev) {
  if (!rev || typeof rev !== 'object') return null;
  if (typeof rev.aprovado === 'boolean') {
    return { aprovado: rev.aprovado, problemas: Array.isArray(rev.problemas) ? rev.problemas.slice(0, 10) : [], conteudo: rev.conteudo?.telas ? rev.conteudo : null };
  }
  if (Array.isArray(rev.telas)) return { aprovado: null, problemas: [], conteudo: rev };
  if (rev.conteudo?.telas) return { aprovado: null, problemas: [], conteudo: rev.conteudo };
  return null;
}

const RODADAS_DE_REVISAO = 2;

/** Sem a tela de chamada e sem campos internos: o formato que a IA conhece. */
function paraIA(c) {
  const telas = c.telas.filter((t) => !t.dias && !/mapa grátis/i.test(t.titulo)).map(({ titulo, texto }) => ({ titulo, texto }));
  // hashtags ficam de fora: são fixas (tema/autor/signo), a IA não escolhe nem revisa
  const out = { telas, legenda: { gancho: c.legenda.gancho, texto: c.legenda.texto }, story: c.story, reels: c.reels };
  if (c.dias) out.dias = c.dias.map((d) => ({ data: d.data, conselho: d.conselho }));
  return out;
}

/**
 * Conteúdo final do dia: IA gerada + revisada e aprovada na checagem
 * automática, ou a reserva. Nunca lança.
 * @returns {Promise<{ conteudo, revisao }>}
 */
export async function gerarConteudoDoDia(dados, { chamar = chamarClaude } = {}) {
  const revisao = { geracao: null, revisao: null, checagem: null };
  try {
    const sistema = SISTEMA_GERAR.replace('{TEMA}', TEMAS[dados.tema].rotulo);
    const rascunho = await chamar(sistema, pedidoDeGeracao(dados), { maxTokens: 4096 });
    if (!rascunho || !Array.isArray(rascunho.telas)) {
      revisao.geracao = 'a IA não devolveu um JSON válido';
      return { conteudo: reservaDoDia(dados), revisao };
    }
    const c1 = normalizarConteudo(rascunho, dados, 'ia');
    const v1 = validarConteudo(c1, dados);

    // Revisão: até 2 rodadas. Se a reescrita ainda falhar na checagem
    // automática (ex.: texto longo), ela volta pra revisão com os problemas.
    let atual = c1;
    let vAtual = v1;
    const rodadas = [];
    for (let rodada = 1; rodada <= RODADAS_DE_REVISAO; rodada++) {
      const pedidoRevisao = [
        'DADOS (a verdade):', JSON.stringify({ tema: TEMAS[dados.tema].rotulo, ...dados.fatos }, null, 2),
        '', 'DADOS DE ENERGIA DO DIA (pro story):', JSON.stringify(dados.energia, null, 2),
        '', 'RASCUNHO:', JSON.stringify(paraIA(atual), null, 2),
        '', vAtual.ok ? 'A checagem automática não achou problema de formato.' : `A checagem automática achou (corrija todos, é obrigatório): ${vAtual.problemas.join('; ')}.`,
        '', FORMATO_REVISAR(dados.tema),
      ].join('\n');
      const lido = lerRevisao(await chamar(SISTEMA_REVISAR, pedidoRevisao, { maxTokens: 4096 }));
      if (!lido) {
        rodadas.push('a revisão não devolveu um JSON válido');
        break;
      }
      rodadas.push({ aprovado: lido.aprovado, problemas: lido.problemas });
      if (lido.aprovado === true && vAtual.ok) {
        revisao.revisao = rodadas.length === 1 ? rodadas[0] : rodadas;
        return { conteudo: atual, revisao };
      }
      if (!lido.conteudo) break;
      atual = normalizarConteudo(lido.conteudo, dados, 'ia-revisada');
      vAtual = validarConteudo(atual, dados);
      if (vAtual.ok) {
        revisao.revisao = rodadas.length === 1 ? rodadas[0] : rodadas;
        return { conteudo: atual, revisao };
      }
    }
    revisao.revisao = rodadas.length === 1 ? rodadas[0] : rodadas;
    // Sem revisão que funcionasse, o rascunho só sai se passou na checagem automática.
    if (rodadas[0] === 'a revisão não devolveu um JSON válido' && v1.ok) return { conteudo: c1, revisao };
    revisao.checagem = vAtual.problemas;
    return { conteudo: reservaDoDia(dados), revisao };
  } catch (err) {
    revisao.geracao = `erro: ${String(err?.message || err).slice(0, 200)}`;
    return { conteudo: reservaDoDia(dados), revisao };
  }
}

// ── Reels narrado (30–40s): roteiro falado ─────────────────────────────────
// Mesmo esquema do post: a IA escreve com os DADOS do dia, uma 2ª chamada
// revisa (CHECKLIST_REVISAO_REELS) e escolhe o gancho mais específico dos 3,
// em até 2 rodadas; a checagem local (validarRoteiro) tem a palavra final.
// Nada passou → roteiro null e o Reels sai no card antigo de 9s.

const ESQUEMA_ROTEIRO = `{
  "ganchos": ["…", "…", "…"],
  "porque": "…",
  "virada": "…",
  "pratica": "Quando …, …",
  "legenda": { "gancho": "…", "texto": ["…", "…", "…"] }
}`;

const regrasRoteiro = (fechamento) => `Regras (passou do tamanho, o roteiro é descartado; conte as palavras):
- "ganchos": exatamente 3 opções DIFERENTES de gancho, cada uma com até 15 palavras e a palavra "hoje". Situação concreta, nunca pergunta.
- "porque": de 30 a 40 palavras. Mecanismo + símbolo do dia (cite um DADO DE ENERGIA DO DIA pelo nome), separando ciência de simbólico.
- "virada": de 10 a 18 palavras.
- "pratica": de 12 a 22 palavras, começando com "Quando", "Na próxima vez que" ou "Sempre que", com vírgula separando o gatilho da ação.
- O fechamento é fixo e entra sozinho no fim: "${fechamento.texto}" (${contarPalavras(fechamento.texto)} palavras). NÃO escreva outro.
- Total falado (gancho + porque + virada + pratica + fechamento): de ${PALAVRAS_MIN} a ${PALAVRAS_MAX} palavras.
- "legenda": a legenda do post escrita (não falada). "gancho" com até 150 caracteres; "texto" com 2 a 4 linhas que resumem o porquê, a virada e a prática. Sem hashtags e sem a chamada final (entram sozinhas).`;

const SISTEMA_ROTEIRO = `${GUIA_EDITORIAL}\n\n${GUIA_REELS}\n\nVocê está escrevendo o roteiro falado do Reels de hoje da série "{TEMA}".`;

const SISTEMA_REVISAR_ROTEIRO = `${GUIA_EDITORIAL}\n\n${GUIA_REELS}\n\n${CHECKLIST_REVISAO_REELS}\n\nVocê é a editora-chefe. Sua resposta é sempre o veredito com o roteiro dentro: { "aprovado", "problemas", "gancho_escolhido", "conteudo" }.
Se aprovado, "conteudo" é o rascunho sem mudança. Se reprovado, "conteudo" é o roteiro reescrito corrigindo TODOS os problemas (inclusive os da checagem automática), mantendo os dados exatos.`;

function dadosDoRoteiro(dados, fechamento) {
  return [
    'DADOS DO TEMA (use só estes fatos; não invente número, data, nota, estudo, porcentagem nem citação):',
    JSON.stringify({ tema: TEMAS[dados.tema].rotulo, ...dados.fatos }, null, 2),
    '',
    'DADOS DE ENERGIA DO DIA (cite pelo menos um no porquê):',
    JSON.stringify(dados.energia, null, 2),
    '',
    `FECHAMENTO FIXO: ${fechamento.texto}`,
  ].join('\n');
}

/** Lê a revisão do roteiro (veredito completo, ou só o roteiro reescrito). */
export function lerRevisaoRoteiro(rev) {
  if (!rev || typeof rev !== 'object') return null;
  const g = rev.gancho_escolhido;
  const esc = g !== null && g !== undefined && g !== '' && Number.isInteger(Number(g)) ? Number(g) : null;
  if (typeof rev.aprovado === 'boolean') {
    return { aprovado: rev.aprovado, problemas: Array.isArray(rev.problemas) ? rev.problemas.slice(0, 10) : [], escolhido: esc, conteudo: Array.isArray(rev.conteudo?.ganchos) ? rev.conteudo : null };
  }
  if (Array.isArray(rev.ganchos)) return { aprovado: null, problemas: [], escolhido: esc, conteudo: rev };
  if (Array.isArray(rev.conteudo?.ganchos)) return { aprovado: null, problemas: [], escolhido: esc, conteudo: rev.conteudo };
  return null;
}

const paraIARoteiro = (r) => ({ ganchos: r.ganchos, porque: r.porque, virada: r.virada, pratica: r.pratica, legenda: r.legenda });

/**
 * Roteiro do Reels narrado do dia. Nunca lança.
 * @param {object} dados  dadosDoDia(data, indice) de lib/social.js
 * @param {{ chamar?: Function, fechamento: { tipo: string, texto: string } }} opcoes
 * @returns {Promise<{ roteiro: object|null, revisao: object }>}
 */
export async function gerarRoteiroReels(dados, { chamar = chamarClaude, fechamento }) {
  const revisao = { geracao: null, rodadas: [], checagem: null };
  const ctx = { energia: dados.energia, problemasDoTexto };
  try {
    const sistema = SISTEMA_ROTEIRO.replace('{TEMA}', TEMAS[dados.tema].rotulo);
    const pedido = [dadosDoRoteiro(dados, fechamento), '', `Responda SÓ com um JSON válido, sem texto antes ou depois, neste formato:\n${ESQUEMA_ROTEIRO}\n${regrasRoteiro(fechamento)}`].join('\n');
    const bruto = await chamar(sistema, pedido, { maxTokens: 2500 });
    if (!Array.isArray(bruto?.ganchos)) {
      revisao.geracao = 'a IA não devolveu um JSON válido';
      return { roteiro: null, revisao };
    }
    const r1 = normalizarRoteiro(bruto, { fechamento });
    const v1 = validarRoteiro(r1, ctx);

    let atual = r1;
    let vAtual = v1;
    for (let rodada = 1; rodada <= RODADAS_DE_REVISAO; rodada++) {
      const pedidoRev = [
        dadosDoRoteiro(dados, fechamento),
        '', 'RASCUNHO:', JSON.stringify(paraIARoteiro(atual), null, 2),
        '', `Contagem atual (com o gancho ${atual.escolhido + 1} e o fechamento): ${contarPalavras(textoNarrado(atual))} palavras.`,
        vAtual.ok ? 'A checagem automática não achou problema.' : `A checagem automática achou (corrija todos, é obrigatório): ${vAtual.problemas.join('; ')}.`,
        '', `Responda SÓ com um JSON válido, sem texto antes ou depois, neste formato:
{ "aprovado": true ou false, "problemas": ["…"], "gancho_escolhido": 0, 1 ou 2, "conteudo": { …o roteiro final… } }
"gancho_escolhido" é a posição (começando em 0) do gancho mais específico dentro de "conteudo.ganchos". O campo "conteudo" segue exatamente este formato e estas regras:
${ESQUEMA_ROTEIRO}
${regrasRoteiro(fechamento)}`,
      ].join('\n');
      const lido = lerRevisaoRoteiro(await chamar(SISTEMA_REVISAR_ROTEIRO, pedidoRev, { maxTokens: 3000 }));
      if (!lido) {
        revisao.rodadas.push('a revisão não devolveu um JSON válido');
        break;
      }
      revisao.rodadas.push({ aprovado: lido.aprovado, problemas: lido.problemas, gancho_escolhido: lido.escolhido });
      const escolhido = lido.escolhido ?? atual.escolhido;
      const reescrito = Boolean(lido.conteudo);
      atual = normalizarRoteiro(lido.conteudo || paraIARoteiro(atual), { fechamento, escolhido });
      vAtual = validarRoteiro(atual, ctx);
      if (vAtual.ok && (lido.aprovado === true || reescrito)) {
        return { roteiro: { ...atual, fonte: lido.aprovado === true && rodada === 1 ? 'ia' : 'ia-revisada', palavras: vAtual.palavras }, revisao };
      }
      if (!reescrito && lido.aprovado !== true) break;
    }
    // Sem revisão que funcionasse, o rascunho só sai se passou na checagem local.
    if (revisao.rodadas[0] === 'a revisão não devolveu um JSON válido' && v1.ok) return { roteiro: { ...r1, fonte: 'ia', palavras: v1.palavras }, revisao };
    revisao.checagem = vAtual.problemas;
    return { roteiro: null, revisao };
  } catch (err) {
    revisao.geracao = `erro: ${String(err?.message || err).slice(0, 200)}`;
    return { roteiro: null, revisao };
  }
}
