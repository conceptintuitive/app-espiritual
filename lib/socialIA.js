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

const FORMATO = `Responda SÓ com um JSON válido, sem texto antes ou depois, neste formato:
{
  "telas": [
    { "titulo": "…", "texto": "…" }
  ],
  "legenda": { "gancho": "…", "texto": ["…", "…"], "hashtags": ["#…", "#…"] },
  "story": { "titulo": "…", "frase": "…" },
  "reels": { "gancho": "…", "virada": "…" }
}
Regras do formato:
- "telas": exatamente 5 telas do carrossel, nesta ordem: 1) gancho de identificação (é a capa), 2) o mecanismo, 3) um exemplo concreto da vida real, 4) a virada que contradiz o senso comum, 5) a prática de 1 frase pra hoje. Título até 80 caracteres; texto até 260. NÃO escreva a tela de chamada final: ela é fixa e entra sozinha.
- "legenda": "gancho" é a 1ª linha da legenda (até 150 caracteres, a frase que faz parar de rolar); "texto" tem de 2 a 4 linhas curtas; "hashtags" no máximo 2, do tema, sem espaço. Não escreva a chamada nem as hashtags fixas: entram sozinhas.
- "story": o story "Energia de hoje", escrito a partir dos DADOS DE ENERGIA DO DIA (não do tema do carrossel). "titulo" com até 4 palavras; "frase" com 1 frase de até 140 caracteres, específica do dia.
- "reels": versão de 7 a 10 segundos do carrossel: "gancho" até 90 caracteres, "virada" até 140.`;

const FORMATO_SEMANA = `${FORMATO}
NESTE TEMA (CICLOS), muda só isto: "telas" tem exatamente 2 telas (1: gancho da semana; 2: o ciclo, usando Ano e Mês Universal e as fases da Lua), e entra também
  "dias": [ { "data": "AAAA-MM-DD", "conselho": "…" } ]
com os 7 dias dos DADOS, na ordem, cada conselho com até 110 caracteres, específico daquele dia (Lua, Kin e número universal do dia).`;

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
    dados.tema === 'semana' ? FORMATO_SEMANA : FORMATO,
  ].join('\n');
}

const SISTEMA_GERAR = `${GUIA_EDITORIAL}\n\nVocê está escrevendo o post de hoje da série "${'{TEMA}'}". Escreva como quem conhece o assunto a fundo e respeita quem lê.`;

const SISTEMA_REVISAR = `${GUIA_EDITORIAL}\n\n${CHECKLIST_REVISAO}\n\nVocê é a editora-chefe. Responda SÓ com JSON:
{ "aprovado": true|false, "problemas": ["…"], "conteudo": { …o post final, no MESMO formato do rascunho… } }
Se aprovado, "conteudo" é o rascunho sem mudança. Se reprovado, "conteudo" é o post reescrito corrigindo TODOS os problemas, mantendo os dados exatos.`;

/** Sem a tela de chamada e sem campos internos: o formato que a IA conhece. */
function paraIA(c) {
  const telas = c.telas.filter((t) => !t.dias && !/mapa grátis/i.test(t.titulo)).map(({ titulo, texto }) => ({ titulo, texto }));
  const out = { telas, legenda: c.legenda, story: c.story, reels: c.reels };
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
    const rascunho = await chamar(sistema, pedidoDeGeracao(dados), { maxTokens: 3000 });
    if (!rascunho || !Array.isArray(rascunho.telas)) {
      revisao.geracao = 'a IA não devolveu um JSON válido';
      return { conteudo: reservaDoDia(dados), revisao };
    }
    const c1 = normalizarConteudo(rascunho, dados, 'ia');
    const v1 = validarConteudo(c1, dados);

    const pedidoRevisao = [
      'DADOS (a verdade):', JSON.stringify({ tema: TEMAS[dados.tema].rotulo, ...dados.fatos }, null, 2),
      '', 'DADOS DE ENERGIA DO DIA (pro story):', JSON.stringify(dados.energia, null, 2),
      '', 'RASCUNHO:', JSON.stringify(paraIA(c1), null, 2),
      '', v1.ok ? 'A checagem automática não achou problema de formato.' : `A checagem automática achou: ${v1.problemas.join('; ')}.`,
      '', dados.tema === 'semana' ? FORMATO_SEMANA : FORMATO,
    ].join('\n');
    const rev = await chamar(SISTEMA_REVISAR, pedidoRevisao, { maxTokens: 3500 });

    if (rev && typeof rev.aprovado === 'boolean') {
      revisao.revisao = { aprovado: rev.aprovado, problemas: (rev.problemas || []).slice(0, 10) };
      if (rev.aprovado && v1.ok) return { conteudo: c1, revisao };
      if (rev.conteudo?.telas) {
        const c2 = normalizarConteudo(rev.conteudo, dados, 'ia-revisada');
        const v2 = validarConteudo(c2, dados);
        if (v2.ok) return { conteudo: c2, revisao };
        revisao.checagem = v2.problemas;
      }
    } else {
      revisao.revisao = 'a revisão não devolveu um JSON válido';
      // Sem revisão, o rascunho só sai se passou na checagem automática.
      if (v1.ok) return { conteudo: c1, revisao };
    }
    revisao.checagem = revisao.checagem || v1.problemas;
    return { conteudo: reservaDoDia(dados), revisao };
  } catch (err) {
    revisao.geracao = `erro: ${String(err?.message || err).slice(0, 200)}`;
    return { conteudo: reservaDoDia(dados), revisao };
  }
}
