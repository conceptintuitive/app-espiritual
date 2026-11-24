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
import { GUIA_EDITORIAL, CHECKLIST_REVISAO } from './socialEditorial.js';
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
