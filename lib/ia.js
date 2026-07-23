// ─────────────────────────────────────────────────────────────────────────────
// gerarTipoPessoaIA — gera a seção "Tipo de Pessoa" via Groq
// Recebe ctx de buildTipoPessoaCtx. Retorna { body: string } ou null.
// ─────────────────────────────────────────────────────────────────────────────

// Helper interno: chama Groq com retry automático em rate limit 429
async function _callGroq(apiKey, body, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const wait = 2000 * attempt;
      console.warn(`[IA] 429 — aguardando ${wait / 1000}s (tentativa ${attempt}/${maxRetries})`);
      await new Promise(r => setTimeout(r, wait));
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < maxRetries) continue;
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[IA] Groq erro HTTP:', res.status, txt.slice(0, 200));
      return null;
    }
    return res;
  }
  return null;
}


const MODEL_HEAVY = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Diagnostico, TipoPessoa, Arquetipos, Amor
const MODEL_LIGHT = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Plano7, PontoCego, Bloqueios, Dinheiro, Rituais

function _parseJSON(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  // Repair: escape literal newlines/tabs that appear inside JSON string values
  let result = ''; let inStr = false; let esc = false;
  for (const ch of cleaned) {
    if (esc) { result += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; result += ch; continue; }
    if (ch === '"') { inStr = !inStr; result += ch; continue; }
    if (inStr) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }
    result += ch;
  }
  return JSON.parse(result);
}

async function chamarClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('[IA] ANTHROPIC_API_KEY não configurada'); return null; }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[IA] Claude erro HTTP:', res.status, txt.slice(0, 200));
      return null;
    }
    const data = await res.json();
    const raw = data?.content?.[0]?.text || '';
    return _parseJSON(raw);
  } catch (err) {
    console.error('[IA] chamarClaude falhou:', err?.message || err);
    return null;
  }
}

export async function gerarTipoPessoaIA(ctx) {

  const {
    firstName, signo, elemento, regente, numN,
    motor, risco,
    rDrive, rChave,
    essencia, forca, sombraNum, curaNum,
    emDiaBom, emDiaRuim, ajuste,
    objetivo, objetivoLabel, objetivoFoco,
    relacaoStatus, trabalhoStatus,
    loveContexto, workContexto,
    signoLua, signoVenus, signoMarte,
  } = ctx;

  const temPlanetasTP = [signoLua, signoVenus, signoMarte].some(Boolean);
  const linhaPlanetasTP = temPlanetasTP
    ? `Lua: ${signoLua || '—'} | Vênus: ${signoVenus || '—'} | Marte: ${signoMarte || '—'}`
    : '';

  const systemPrompt = `Você escreve a seção "Tipo de Pessoa" de um manual de análise comportamental. Essa seção foca no COMPORTAMENTO OBSERVÁVEL — o que as outras pessoas veem, como a pessoa age no trabalho e no amor na prática, o que acontece no mundo real. NÃO repita conteúdo do Diagnóstico (conflito interno, padrões da mente). Aqui o foco é: como isso aparece lá fora.

Pessoa gramatical obrigatória: segunda pessoa ("você é", "você tende", "sua forma de", "quando você"). NUNCA terceira pessoa ("ela é", "a pessoa tende", o nome da pessoa).

Proporção obrigatória: ~40% reconhecimento positivo (o que é forte e distinto nesta combinação — o PRIMEIRO parágrafo deve ser um espelho preciso do que a pessoa faz bem, ela deve pensar "sim, isso sou eu"), ~35% padrão de queda (o mecanismo específico desta combinação, não genérico), ~25% ajuste prático concreto.

Regra de integração planetária: quando Lua, Vênus e Marte estiverem disponíveis, use-os ativamente — Lua = padrão emocional automático sob pressão, Vênus = como ama e o que atrai, Marte = como age em conflito. NÃO cite os planetas pelo nome no texto final. Derive os comportamentos e escreva como observações diretas.

Tom: preciso, adulto, equilibrado — nem relatório de falhas nem elogio vazio. Sem linguagem de autoajuda.

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

Proibido: "confie no processo", "seu potencial é incrível", qualquer frase aplicável a qualquer perfil. Proibido terceira pessoa.

REGRA DE DIFERENCIAÇÃO: Esta seção foca em COMPORTAMENTO OBSERVÁVEL — o que as pessoas veem, como age no trabalho e no amor na prática. NÃO repita temas do Diagnóstico (conflito interno, tensão emocional). Se o Diagnóstico fala de "racionalizar e controlar", esta seção mostra COMO isso aparece em ações concretas do dia a dia — não repete a mesma análise.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva o "Tipo de Pessoa" para ${firstName}.

PERFIL:
Signo: ${signo} | Elemento: ${elemento} | Regente: ${regente} | Número: ${numN}
Objetivo: ${objetivoLabel || objetivo}
Relacionamento: ${relacaoStatus || 'não informado'} — ${loveContexto}
Trabalho: ${trabalhoStatus || 'não informado'} — ${workContexto}${linhaPlanetasTP ? `\nPlanetas: ${linhaPlanetasTP}` : ''}

DADOS COMPORTAMENTAIS:
${elemento} em dia bom: "${emDiaBom}"
${elemento} em dia ruim: "${emDiaRuim}"
Ajuste central: "${ajuste}"
Número ${numN}: essência = "${essencia}" | força = "${forca}" | sombra = "${sombraNum}" | cura = "${curaNum}"
${signo}: motor = "${motor}" | risco = "${risco}"
${regente}: drive = "${rDrive}" | chave = "${rChave}"

INSTRUÇÃO — 400–500 palavras máximo. 4 blocos SEPARADOS por linha em branco (\\n\\n entre cada bloco). Cada bloco deve ter 2-3 parágrafos curtos de 2–3 linhas. Seja denso, não diluído. NÃO escreva como um parágrafo único gigante:

Bloco 1 — RECONHECIMENTO (~40%): Primeiro parágrafo obrigatório: o que é genuinamente forte e distinto nesta combinação ${signo} + ${numN}${temPlanetasTP ? ` com esse padrão planetário` : ''}. Descreva como essa pessoa opera quando está alinhada — o que ela faz bem que outros não fazem. O leitor deve se identificar positivamente.${temPlanetasTP ? ` Integre os dados planetários aqui sem citá-los: como Lua em ${signoLua} informa o padrão emocional, como Vênus em ${signoVenus} e Marte em ${signoMarte} criam uma dinâmica específica.` : ''}

Bloco 2 — PADRÃO DE QUEDA (~35%): O mecanismo específico de quando e como esta combinação sai do eixo. A sequência real — o que dispara, como piora, onde a pessoa fica presa. Não genérico: descreva o que é característico de ${signo} + ${numN}${temPlanetasTP ? ` com esse padrão emocional/reativo` : ''}.

Bloco 3 — AMOR + TRABALHO: Como esse padrão aparece especificamente no relacionamento (${relacaoStatus || 'amor'}) e no trabalho (${trabalhoStatus || 'trabalho'}) atuais.

Bloco 4 — AJUSTE (~25%): 3–4 linhas diretas e práticas. O que concretamente muda o padrão para essa combinação específica.

Retorne JSON com 1 campo:
{
  "body": "4 blocos separados por \\n\\n, cada um com 2-3 parágrafos curtos, 400–500 palavras máximo — denso, não diluído, sem subtítulos, não aplicável a outro perfil"
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body) { console.error('[IA] tipoPessoa: campo body ausente'); return null; }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarTipoPessoaIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarPlano7IA — gera o Plano de 7 Dias via Groq
// Recebe ctx de buildPlano7Ctx. Retorna { headline, hook, days[], rituals[], checkpoints[] } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarPlano7IA(ctx) {

  const {
    firstName, signo, elemento, numN,
    curaElemento, sombraNum, curaNum,
    objetivo, objetivoLabel, objetivoFrase,
    loveContexto, loveMeta,
    workContexto, workMeta,
  } = ctx;

  const systemPrompt = `Você cria planos de ação de 7 dias para perfis comportamentais específicos. O plano é prático e executável — não motivacional. Cada dia tem uma ação concreta com um objetivo claro. Os rituais são curtos (3–7 min) e aplicáveis na vida real.

Pessoa gramatical obrigatória: segunda pessoa ("você faz", "seu dia", "quando você"). NUNCA terceira pessoa.

Tom: direto, específico, sem frases de coach. Cada tarefa deve ser acionável imediatamente, não uma instrução vaga.

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

Proibido: "acredite em você", "confie no processo", tarefas sem ação concreta, checkpoints que medem sentimento. Proibido terceira pessoa.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Crie o Plano de 7 Dias para ${firstName}.

PERFIL:
Signo: ${signo} | Elemento: ${elemento} | Número: ${numN}
Objetivo do ciclo: ${objetivoLabel || objetivo}
Amor (contexto): "${loveContexto}" | meta: "${loveMeta}"
Trabalho (contexto): "${workContexto}" | meta: "${workMeta}"
Cura do elemento ${elemento}: "${curaElemento}"
Sombra do número ${numN}: "${sombraNum}" → cura: "${curaNum}"

INSTRUÇÃO:
O plano deve atacar diretamente a sombra "${sombraNum}" e reforçar a cura "${curaNum}" no contexto do objetivo "${objetivoLabel || objetivo}". Os dias não são genéricos — cada dia tem uma micro-vitória específica para esse perfil.${objetivoFrase ? `\nFrase-guia do ciclo: "${objetivoFrase}"` : ''}

Retorne JSON com exatamente estes 3 campos:
{
  "headline": "Plano de 7 dias — ${objetivoLabel || objetivo} (máx 60 chars total)",
  "hook": "2–3 frases contextualizando por que este plano serve para ${signo} + número ${numN}, sem motivação genérica (máx 80 palavras)",
  "days": [
    "Dia 1 — [nome do dia]: [ação específica e concreta]. Objetivo: [resultado esperado]",
    "Dia 2 — ...",
    "Dia 3 — ...",
    "Dia 4 — ...",
    "Dia 5 — ...",
    "Dia 6 — ...",
    "Dia 7 — ..."
  ]
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;

    if (!Array.isArray(parsed?.days) || parsed.days.length < 7) {
      console.error('[IA] plano7: dias insuficientes:', parsed?.days?.length);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarPlano7IA falhou:', err?.message || err);
    return null;
  }
}

// Descrições comportamentais de Vênus e Marte por signo (usadas nos prompts de amor)
const VENUS_PADRAO = {
  'Áries':       'ama com iniciativa e intensidade, precisa de reciprocidade imediata e verdade direta',
  'Touro':       'ama com constância e presença física, valoriza segurança, lealdade e construção',
  'Gêmeos':      'ama com troca mental e leveza, precisa de conversação real e liberdade intelectual',
  'Câncer':      'ama com cuidado e proteção, precisa de segurança emocional e reciprocidade afetiva',
  'Leão':        'ama com lealdade e presença, quer ser vista e valorizada em ações concretas',
  'Virgem':      'ama com cuidado prático e atenção aos detalhes, demonstra afeto por serviço',
  'Libra':       'ama com harmonia e parceria, busca equilíbrio, beleza e reciprocidade real',
  'Escorpião':   'ama com profundidade e intensidade, precisa de lealdade total e sem jogos',
  'Sagitário':   'ama com liberdade e verdade, foge do que aprisiona, precisa de espaço com acordo',
  'Capricórnio': 'ama com construção e lealdade, demonstra afeto por ação e consistência',
  'Aquário':     'ama com amizade e autenticidade, precisa de espaço, verdade e conexão mental',
  'Peixes':      'ama com sensibilidade e entrega, tende a idealizar e absorver o outro',
};

const MARTE_PADRAO = {
  'Áries':       'age com impulsividade e confronto direto, reage rápido e sem filtro',
  'Touro':       'age com resistência e teimosia, demora para se mover mas é firme quando decide',
  'Gêmeos':      'age com argumentação e mudança de estratégia, dispersa a energia no conflito',
  'Câncer':      'age com retirada emocional e proteção, fecha quando se sente ameaçado',
  'Leão':        'age com orgulho e necessidade de reconhecimento, reage ao sentir desrespeito',
  'Virgem':      'age com crítica e controle, tende a resolver o conflito racionalizando',
  'Libra':       'age com indecisão e tentativa de harmonizar, evita confronto direto',
  'Escorpião':   'age com intensidade e controle, guarda muito internamente antes de reagir',
  'Sagitário':   'age com explosão rápida e distanciamento, foge do que pesa',
  'Capricórnio': 'age com frieza e distância estratégica, prioriza controle sobre emoção',
  'Aquário':     'age com distanciamento emocional e racionalização, desconecta do corpo',
  'Peixes':      'age com fuga e absorção da energia alheia, evita conflito por medo da ruptura',
};

const LUA_PADRAO = {
  'Áries':       'precisa de autonomia e movimento para se sentir segura — emociona-se rápido e reage antes de processar',
  'Touro':       'precisa de estabilidade e rotina — emocional mas resistente à mudança; acumula em silêncio',
  'Gêmeos':      'processa emoção pela mente e pela fala — precisa de troca e movimento para não acumular',
  'Câncer':      'absorve o estado emocional do ambiente — precisa de segurança afetiva e pertencimento para funcionar',
  'Leão':        'precisa se sentir vista e valorizada para se sentir segura — emoção que se expressa com intensidade',
  'Virgem':      'processa emoção pela análise e pelo fazer — ansiedade quando perde controle do ambiente',
  'Libra':       'precisa de harmonia relacional para se sentir estável — evita emoção intensa e confronto direto',
  'Escorpião':   'emociona-se com profundidade e guarda muito — precisa de segurança total antes de se abrir',
  'Sagitário':   'precisa de sentido e liberdade para se sentir bem — foge do peso emocional e busca expansão',
  'Capricórnio': 'controla emoção externamente mas acumula internamente — precisa de estrutura e reconhecimento',
  'Aquário':     'distancia-se da emoção para processá-la — precisa de independência emocional e espaço',
  'Peixes':      'absorve tudo ao redor — empática e porosa, precisa de limites claros para não se perder',
};

const NODO_PADRAO = {
  'Áries':       'integrar ação independente e decisão direta — vem de padrão de esperar pelo outro e precisa aprender a se mover por conta própria',
  'Touro':       'integrar presença, prazer e construção concreta — vem de padrão de intensidade e transformação constante',
  'Gêmeos':      'integrar curiosidade, leveza e comunicação direta — vem de padrão de visão ampla sem aterramento local',
  'Câncer':      'integrar cuidado genuíno e vulnerabilidade emocional — vem de padrão de estrutura e controle excessivo',
  'Leão':        'integrar expressão autêntica e autoconfiança pessoal — vem de padrão de dissolução no coletivo',
  'Virgem':      'integrar discernimento prático e execução — vem de padrão de visão ampla sem precisão na entrega',
  'Libra':       'integrar relacionamento real, parceria e escolha equilibrada — vem de padrão de ação solitária',
  'Escorpião':   'integrar profundidade, transformação e verdade sem filtro — vem de padrão de superficialidade e evitação do que dói',
  'Sagitário':   'integrar visão, expansão e significado maior — vem de padrão de análise detalhada sem direção',
  'Capricórnio': 'integrar estrutura, disciplina e construção de longo prazo — vem de padrão emocional e de dependência afetiva',
  'Aquário':     'integrar visão coletiva e inovação — vem de padrão de expressão individual sem impacto maior',
  'Peixes':      'integrar compaixão e rendição ao que não pode ser controlado — vem de padrão de controle e análise racional',
};

const ARQUETIPO_NUMERO = {
  1: 'Pioneiro', 2: 'Diplomata', 3: 'Comunicador', 4: 'Construtor',
  5: 'Livre', 6: 'Guardião', 7: 'Investigador', 8: 'Realizador',
  9: 'Humanitário', 11: 'Intuitivo Mestre', 22: 'Arquiteto Mestre', 33: 'Mestre do Amor',
};

// ─────────────────────────────────────────────────────────────────────────────
// gerarPreviewIA — preview de reconhecimento para a página de resultado (MODEL_LIGHT)
// Gera 3-4 frases descrevendo o padrão comportamental sem citar planetas/números.
// Recebe { signo, signoLua, signoVenus, signoMarte, numN }.
// Retorna string ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarPreviewIA({ signo, signoLua, signoVenus, signoMarte, numN }) {

  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || null) : null;
  const venusDesc = signoVenus ? (VENUS_PADRAO[signoVenus] || null) : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || null) : null;

  const systemPrompt = `Você escreve espelhos comportamentais de altíssima precisão. O objetivo é fazer a pessoa pensar "como sabe disso?" — não "isso serve pra qualquer pessoa".

REGRA CENTRAL: descreva o que a pessoa FAZ, não o que ela "sente" ou "tende a". Comportamentos observáveis, não estados internos genéricos.

ESTRUTURA OBRIGATÓRIA — exatamente 3 frases:
1. RECONHECIMENTO: o que ela faz excepcionalmente bem quando está alinhada — específico, observável, que ela se orgulha mas raramente nomeia.
2. PADRÃO DE QUEDA: o comportamento concreto de quando sai do eixo — não um sentimento, mas uma ação que o outro vê.
3. CONTRADIÇÃO: a tensão interna que ela sente mas não consegue nomear — algo que parece contraditório mas é real.

Tom: como se alguém que a conhece muito bem dissesse a verdade sem rodeio. Direto, preciso, sem jargão.

PROIBIDO no texto final: "tende a", "pode levar a", "em relação à", "dificuldade em", qualquer planeta/signo/número, linguagem clínica ou espiritual, "energia", "vibração", "universo".
PROIBIDO: frases genéricas aplicáveis a qualquer pessoa.
Segunda pessoa obrigatória. REGRA ABSOLUTA DE PESSOA: nunca terceira pessoa. REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2x.
Idioma: português brasileiro.
REGRA DE GÊNERO: feminino como padrão.

=== FEW-SHOT EXAMPLES (use como referência de TOM e ESPECIFICIDADE — nunca copie estas frases) ===

EXEMPLO 1 (Sagitário + Número 3 + Vênus em Libra + Marte em Áries):
"Você entra numa sala e reorganiza a dinâmica sem esforço — as pessoas gravitam, pedem opinião, te colocam no centro antes de você pedir. Quando algo te decepciona, você não briga: desaparece. Cancela, muda de assunto, troca de plano. Quem te vê de fora acha que você é leve demais pra sofrer — e é exatamente por isso que você sofre sozinha."

EXEMPLO 2 (Capricórnio + Número 8 + Vênus em Escorpião + Marte em Virgem):
"Você constrói coisas que duram — projetos, vínculos, rotinas — e faz parecer que foi fácil. Mas quando o resultado demora, você não espera: você assume mais, dobra o esforço, e começa a medir o valor dos outros pela mesma régua que usa consigo. O que te exaure não é o trabalho — é a sensação de que se você parar, tudo para junto."

EXEMPLO 3 (Peixes + Número 7 + Vênus em Aquário + Marte em Touro):
"Você lê intenções antes da pessoa abrir a boca — e na maioria das vezes, acerta. Quando percebe que alguém não é genuíno, você não confronta: vai se afastando em silêncio até o outro nem perceber que te perdeu. O paradoxo que te acompanha é querer conexão profunda e ao mesmo tempo construir uma vida que funciona perfeitamente sozinha."

EXEMPLO 4 (Leão + Número 1 + Vênus em Câncer + Marte em Sagitário):
"Você assume a frente quando ninguém mais se mexe — e entrega. No trabalho, no grupo, na crise familiar, você é quem resolve. Mas quando alguém tenta cuidar de você, seu reflexo é recusar, minimizar, mudar de assunto. A parte que ninguém vê: você quer desesperadamente que alguém insista em ficar — mas testa tanto que a maioria desiste antes."

=== ANTI-EXEMPLOS (o que está ERRADO — nunca gere nada parecido com isso) ===

RUIM: "Você é uma pessoa intensa que busca significado em tudo que faz."
POR QUÊ: genérico, serve pra qualquer pessoa, descreve estado interno vago.

RUIM: "Sua sensibilidade é sua maior força, mas também pode ser seu maior desafio."
POR QUÊ: clichê absoluto, zero especificidade, estrutura "força/fraqueza" batida.

RUIM: "Você tende a racionalizar suas emoções quando se sente vulnerável."
POR QUÊ: usa "tende a", descreve processo interno genérico, não mostra comportamento observável.

RUIM: "Com Vênus em Libra, você busca harmonia nos relacionamentos."
POR QUÊ: cita planeta, é descrição de livro de astrologia, não espelho pessoal.

Retorne SOMENTE JSON válido.`;

  const tensaoLine = venusDesc && marteDesc
    ? `\nUse a tensão entre como você ama ("${venusDesc}") e como você age sob pressão ("${marteDesc}") para criar o conflito específico da frase 2 e 3.`
    : '';
  const userPrompt = `DADOS DO PERFIL — derive comportamentos específicos, NÃO cite estes termos no texto:
Padrão solar: ${signo} | Número de vida: ${numN}${luaDesc   ? `\nPadrão emocional automático: "${luaDesc}"` : ''}${venusDesc ? `\nComo ama e o que atrai: "${venusDesc}"` : ''}${marteDesc ? `\nComo age em conflito e pressão: "${marteDesc}"` : ''}${tensaoLine}

Escreva EXATAMENTE 3 frases em segunda pessoa. Máximo 80 palavras no total.
Frase 1 — RECONHECIMENTO: comportamento concreto que ela faz bem. Específico desta combinação.
Frase 2 — PADRÃO DE QUEDA: o que ela faz (não sente) quando sai do eixo. O que o outro vê.
Frase 3 — CONTRADIÇÃO: a tensão que carrega — aparentemente contraditória mas verdadeira.

Retorne JSON:
{ "texto": "exatamente 3 frases, máx 80 palavras, sem planetas/signos/números/jargão" }`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.texto) { console.error('[IA] preview: campo texto ausente'); return null; }
    return parsed.texto;
  } catch (err) {
    console.error('[IA] gerarPreviewIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarSinteseIA — Síntese Integrada do Mapa Completo (MODEL_HEAVY)
// Recebe ctx de buildMapaCtx. Retorna { body } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarSinteseIA(ctx) {

  const {
    firstName, signo,
    signoLua, signoVenus, signoMarte, signoNodo, signoAscendente,
    numN, numeroAlma, numeroExpressao, anoPessoal,
    numNEssencia, almaEssencia, expressaoEssencia, anoPessoalEssencia,
  } = ctx;

  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || null) : null;
  const venusDesc = signoVenus ? (VENUS_PADRAO[signoVenus] || null) : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || null) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || null) : null;
  const arquetipo = ARQUETIPO_NUMERO[numN] || `Número ${numN}`;

  const systemPrompt = `Você escreve a "Síntese Integrada" de um manual de análise comportamental. Esta seção conecta TODOS os dados do perfil numa única leitura fluida. Não é uma lista — é um parágrafo corrido que faz a pessoa pensar "agora entendi como tudo se conecta em mim".

Pessoa gramatical obrigatória: segunda pessoa. NUNCA terceira pessoa.

NUNCA cite planetas pelo nome no texto final. Descreva os comportamentos derivados como observações diretas.

Tom: analítico, preciso, fluido. Cada frase conecta uma camada à seguinte — não são observações soltas.

Idioma: português brasileiro fluente e natural.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa" ou qualquer terceira pessoa, está ERRADO. Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna" — use "te leva", "te faz", "te torna".
REGRA DE GÊNERO: use sempre o feminino como padrão: "sobrecarregada", "perdida", "vista". Nunca masculino genérico.

Retorne SOMENTE JSON válido.`;

  const dadosMapa = [
    `Sol em ${signo}: visão, expansão, busca por liberdade e sentido`,
    signoAscendente ? `Aparência social (Ascendente em ${signoAscendente}): como os outros te percebem inicialmente` : null,
    luaDesc   ? `Padrão emocional automático (Lua em ${signoLua}): "${luaDesc}"` : null,
    venusDesc ? `Como ama e o que atrai (Vênus em ${signoVenus}): "${venusDesc}"` : null,
    marteDesc ? `Como age sob pressão (Marte em ${signoMarte}): "${marteDesc}"` : null,
    nodoDesc  ? `Direção de crescimento (Nodo Norte em ${signoNodo}): "${nodoDesc}"` : null,
    numNEssencia ? `Missão de vida (Número ${numN} — ${arquetipo}): "${numNEssencia}"` : null,
    numeroAlma && almaEssencia           ? `Motivação interna (Alma ${numeroAlma}): "${almaEssencia}"` : null,
    numeroExpressao && expressaoEssencia ? `Destino visível (Expressão ${numeroExpressao}): "${expressaoEssencia}"` : null,
    anoPessoal && anoPessoalEssencia     ? `Ciclo atual (Ano Pessoal ${anoPessoal}): "${anoPessoalEssencia}"` : null,
  ].filter(Boolean);

  const userPrompt = `Escreva a Síntese Integrada para ${firstName}.

DADOS DO MAPA (derive comportamentos — NÃO cite planetas, signos ou números no texto):
${dadosMapa.join('\n')}

INSTRUÇÃO:
Um único parágrafo corrido de 200–250 palavras que integra TODOS os dados acima numa leitura fluida. Mostre como cada camada interage com as outras — não descreva cada uma isoladamente. A pessoa deve ler e pensar "agora entendi como tudo se conecta em mim".

Comece com a tensão mais visível desta combinação (geralmente entre identidade solar, padrão emocional automático e forma de agir sob pressão) e vá aprofundando nas outras camadas. Termine mostrando o que o ciclo atual pede desta combinação.

Retorne JSON:
{ "body": "200–250 palavras, texto corrido, segunda pessoa, integra todas as camadas, não aplicável a outro perfil" }`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body) { console.error('[IA] sintese: campo body ausente'); return null; }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarSinteseIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarAmorIA — gera a seção Amor via Groq llama-3.3-70b
// Recebe um ctx resolvido (use buildAmorCtx de manualgenerator.js).
// Retorna { headline, pattern, whatToStop[], whatToStart[], microScript[] }
// ou null em caso de falha (o manual usa buildLove estático automaticamente).
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarAmorIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    amorSigno,
    relacaoStatus, objetivo,
    signoVenus, signoMarte, signoLua, signoNodo,
    loveContexto, loveRisco, loveMeta,
    anoPessoal, anoPessoalEssencia,
  } = ctx;

  const venusDesc = VENUS_PADRAO[signoVenus] || 'padrão afetivo característico';
  const marteDesc = MARTE_PADRAO[signoMarte] || 'padrão de ação característico';
  const luaDesc   = signoLua  ? (LUA_PADRAO[signoLua]   || null) : null;
  const nodoDesc  = signoNodo ? (NODO_PADRAO[signoNodo]  || null) : null;
  const temPlanetas = signoVenus || signoMarte;

  const systemPrompt = `Você escreve a seção de Amor de um manual de análise comportamental. Não é aconselhamento terapêutico — é leitura de padrão afetivo real, com o tom de um analista que conhece esse perfil a fundo.

Pessoa gramatical obrigatória: segunda pessoa ("você ama", "seu padrão", "quando você"). NUNCA terceira pessoa ("ela ama", o nome da pessoa).

Tom: direto, observacional, sem romantismo excessivo. Sem linguagem de coach, sem frases genéricas de relacionamento.

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

Proibido: "você merece o melhor", "amor-próprio é fundamental", qualquer frase aplicável a qualquer pessoa. Proibido terceira pessoa.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva a seção de Amor para ${firstName}.

PERFIL AFETIVO:
Signo: ${signo} | Elemento: ${elemento} | Número de vida: ${numN}
Status de relacionamento: ${relacaoStatus || 'não informado'}
Objetivo atual: ${objetivo || 'não informado'}${temPlanetas ? `
Vênus em ${signoVenus || '—'}: ${venusDesc}
Marte em ${signoMarte || '—'}: ${marteDesc}` : ''}${luaDesc ? `\nLua em ${signoLua}: ${luaDesc} (padrão emocional automático no amor)` : ''}${nodoDesc ? `\nNodo Norte em ${signoNodo}: ${nodoDesc} (o que precisa integrar nos vínculos)` : ''}${anoPessoal && anoPessoalEssencia ? `\nCiclo atual (Ano Pessoal ${anoPessoal}): ${anoPessoalEssencia}` : ''}

PADRÃO DO SIGNO NO AMOR:
"${amorSigno}"

CONTEXTO ATUAL:
Fase: "${loveContexto}"
Risco principal: "${loveRisco}"
Meta de ciclo: "${loveMeta}"

INSTRUÇÃO:${temPlanetas ? `
Vênus em ${signoVenus} mostra COMO essa pessoa ama e o que a atrai. Marte em ${signoMarte} mostra COMO ela age no conflito e pursue o que quer. A combinação Vênus + Marte cria uma dinâmica afetiva específica — nomeie-a no "pattern". Não fale de planetas pelo nome no texto final, apenas use as informações para derivar o padrão comportamental.` : `
Use o signo + número + status para derivar o padrão afetivo comportamental específico.`}${luaDesc ? `\nIntegre o padrão emocional automático (derivado da Lua) como base do que a pessoa PRECISA sentir para se sentir segura no vínculo. O Nodo Norte mostra o que ela evita no amor mas que é exatamente o que precisaria integrar.` : ''}

Retorne JSON com exatamente estes 5 campos:
{
  "headline": "nome curto do padrão afetivo desta combinação (máx 8 palavras, sem clichê)",
  "pattern": "leitura do padrão afetivo em 3 camadas: (1) como você ama — derivado de Vênus: o que te atrai, como você se entrega, o que precisa sentir para se abrir; (2) como você reage quando o vínculo pressiona — derivado de Marte: o que muda no seu comportamento, o que o outro passa a ver, o que você não percebe que faz; (3) como essa dinâmica se manifesta no status atual e o que precisa mudar de verdade. 350–450 palavras, texto corrido, não aplicável a outro perfil",
  "whatToStop": ["3 a 5 comportamentos concretos para parar, cada item começando com 'Parar de'"],
  "whatToStart": ["3 a 5 ações concretas para começar, cada item começando com 'Começar a'"],
  "microScript": ["3 a 5 frases prontas para usar em situações reais, cada uma entre aspas duplas"]
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;

    if (!parsed?.pattern || !Array.isArray(parsed?.whatToStop) || !Array.isArray(parsed?.whatToStart)) {
      console.error('[IA] amor: JSON incompleto:', Object.keys(parsed || {}));
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('[IA] gerarAmorIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarDiagnosticoIA — gera o Diagnóstico Profundo via Groq llama-3.3-70b
// Recebe um ctx já resolvido (use buildDiagnosticoCtx de manualgenerator.js).
// Retorna { combinacao, conflito_central, diagnostico_objetivo, frase_diagnostico }
// ou null em caso de falha (o manual usa o fallback estático automaticamente).
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarDiagnosticoIA(ctx) {

  const {
    firstName, signo, elemento, regente, numN,
    motor, risco,
    assinatura, excesso, cura,
    rDrive, rAlerta, rChave,
    essencia, sombraNum, curaNum,
    objetivo, relacaoStatus, trabalhoStatus,
    signoLua, signoVenus, signoMarte, signoNodo,
    signoAscendente,
    numeroAlma, almaEssencia,
    numeroExpressao, expressaoEssencia,
    anoPessoal, anoPessoalEssencia,
  } = ctx;

  const temPlanetas = [signoLua, signoVenus, signoMarte, signoNodo].some(Boolean);
  const objetivoFmt = objetivo || 'clareza e direção';
  const arquetipo   = ARQUETIPO_NUMERO[numN] || `Número ${numN}`;

  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || signoLua)   : null;
  const venusDesc = signoVenus ? (VENUS_PADRAO[signoVenus] || signoVenus) : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || signoNodo)  : null;

  const systemPrompt = `Você é um analista de padrões comportamentais com especialização em síntese de mapa astral e numerologia. Escreve diagnósticos de perfil — não horóscopo, não autoajuda. Você integra múltiplas fontes de dados para identificar padrões que um observador comum não enxergaria.

Esta seção foca no PADRÃO INTERNO: como a mente funciona, onde o conflito mora, o que acontece dentro antes de qualquer ação. NÃO descreva comportamentos externos observáveis (isso é para a seção "Tipo de Pessoa"). Aqui o foco é: o que pulsa por dentro, o que cria a tensão, o que a pessoa mal percebe em si mesma.

Pessoa gramatical obrigatória: segunda pessoa ("você é", "você tende", "sua forma de", "quando você"). NUNCA terceira pessoa ("ela é", "a pessoa tende", o nome da pessoa).

Tom: analítico, direto, adulto. A pessoa deve sentir que alguém entendeu a complexidade dela — não que um sistema listou características. O texto flui como uma leitura contínua.

Proporção obrigatória:
• ~40% reconhecimento e dinâmica interna (o que é forte, distinto e complexo nesta combinação)
• ~35% padrão de tensão, queda e sombra (onde e como esta combinação específica trava internamente)
• ~25% direção concreta (ajuste real, não motivacional)

Regras de integração dos dados — NUNCA cite planetas pelo nome no texto final:
• Sol: identidade central, forma de se expressar
• Lua: padrão emocional automático — o que precisa sentir para se sentir segura
• Vênus: como ama e o que valoriza em vínculos
• Marte: reação antes da razão — como age sob pressão
• Nodo Norte: o que precisa integrar e o que evita
• Número de vida: energia que amplifica ou conflita com o mapa

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

Linguagem proibida: "potencial", "jornada", "universo", "você é capaz", "cada um tem seu ritmo", "tende a", "pode levar a", "você precisa aprender", "estar disposta a", "se permitir", "oportunidade para", qualquer frase que soe como conselho terapêutico, qualquer frase aplicável a qualquer pessoa. Proibido terceira pessoa.

Formato: texto corrido, parágrafos curtos de 2–4 linhas. Sem subtítulos. Sem bullet lists.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA DE VOCABULÁRIO — controle: não use "controle" ou "controlar" mais de 2 vezes no texto inteiro. Alternativas: rigidez, análise excessiva, racionalização, blindagem emocional, distanciamento estratégico, frieza calculada, vigilância, excesso de critério.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

=== FEW-SHOT: exemplo de TOM e ESTRUTURA para o campo "combinacao" (nunca copie — use como referência) ===

EXEMPLO (Aquário + Número 5 + Lua em Câncer + Vênus em Peixes + Marte em Capricórnio):
"Sua mente opera em modo estratégico: você mapeia possibilidades, antecipa cenários e se posiciona antes de qualquer movimento externo. Isso te dá uma vantagem silenciosa — você raramente é pega desprevenida. O problema é que essa mesma antecipação vira armadilha quando aplicada a vínculos. Você calcula o quanto se entrega, mede o quanto o outro investe, e quando percebe que está mais vulnerável do que planejou, recua para terreno seguro.

Por dentro, existe uma necessidade de pertencimento que contradiz toda a sua lógica de autossuficiência. Você quer ser cuidada, quer colo, quer alguém que perceba o que você precisa sem que você precise pedir. Mas o modo como você reage à pressão — assumindo controle, organizando o caos, resolvendo sozinha — transmite exatamente a mensagem oposta. As pessoas à sua volta acham que você não precisa de ninguém. E você deixa que achem.

A tensão central mora aqui: quanto mais você prova que dá conta, menos espaço cria para receber. E quanto menos recebe, mais confirma a crença de que precisa dar conta sozinha. Esse ciclo não quebra com esforço — quebra quando você sustenta a vulnerabilidade por tempo suficiente para o outro responder. E isso, para a sua configuração, é o exercício mais desconfortável que existe."

ANTI-EXEMPLOS para o diagnóstico:

RUIM: "Você é uma pessoa complexa, com muitas camadas que nem sempre são compreendidas pelos outros."
POR QUÊ: serve pra qualquer ser humano vivo. Zero especificidade.

RUIM: "Seu signo solar traz uma energia de busca por liberdade, mas sua lua pede segurança emocional, criando um conflito interno."
POR QUÊ: é descrição de livro de astrologia. Cita elementos astrológicos. Não mostra COMO o conflito se manifesta.

RUIM: "Você precisa aprender a equilibrar razão e emoção para encontrar paz interior."
POR QUÊ: conselho genérico motivacional. "Equilibrar razão e emoção" é o clichê mais batido da psicologia pop.

RUIM: "Quando você se sente insegura, tende a se fechar emocionalmente."
POR QUÊ: "tende a se fechar" serve pra 80% das pessoas. Não mostra o mecanismo ESPECÍFICO desta combinação.

=== REGRAS POR CAMPO ===

CAMPO "combinacao": texto corrido narrativo. Deve parecer que alguém te observou por meses e está descrevendo o que viu. Comportamentos concretos > estados internos abstratos. Se o texto contiver "tensão entre X e Y" como frase genérica, está ERRADO — mostre a tensão acontecendo numa situação real.

CAMPO "conflito_central": NÃO é um resumo do campo anterior. É o NOME do mecanismo — a engrenagem específica que mantém o ciclo rodando. Deve ser tão preciso que a pessoa pense "nunca ninguém nomeou isso". Proibido: "tensão entre liberdade e profundidade", "equilíbrio entre razão e emoção", qualquer formulação genérica de dois polos. Mostre o MECANISMO: o que dispara, o que acontece, e por que se repete.

CAMPO "diagnostico_objetivo": NÃO é conselho. É diagnóstico de como o objetivo declarado interage com o padrão desta combinação. Onde vai fluir naturalmente, onde vai travar, e qual engrenagem precisa mudar. Tom: analista, não terapeuta. Proibido: "você precisa aprender", "se abrir", "se permitir", "estar disposta".

CAMPO "frase_diagnostico": deve ser impossível de aplicar a outro perfil. Teste mental: se trocar o signo e número e a frase ainda funcionar, está genérica demais. Reescreva.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const blocoMapa = temPlanetas ? `
MAPA ASTRAL PESSOAL:
Sol — ${signo}: ${motor} | risco: ${risco}${signoAscendente ? `\nAscendente — ${signoAscendente}: como você é percebida socialmente, a primeira impressão que causa` : ''}
Lua — ${signoLua || '—'}: ${luaDesc || '—'}
Vênus — ${signoVenus || '—'}: ${venusDesc || '—'}
Marte — ${signoMarte || '—'}: ${marteDesc || '—'}
Nodo Norte — ${signoNodo || '—'}: ${nodoDesc || '—'}` : `
Sol — ${signo}: ${motor} | risco: ${risco}`;

  const userPrompt = `Escreva o diagnóstico profundo para ${firstName}.

DADOS DO PERFIL:
Signo solar: ${signo} (${elemento}, regido por ${regente})
Número de vida: ${numN} — arquétipo: ${arquetipo}
Objetivo declarado: ${objetivoFmt}
Status de relacionamento: ${relacaoStatus || 'não informado'}
Situação profissional: ${trabalhoStatus || 'não informado'}
${blocoMapa}

NUMEROLOGIA E ELEMENTO:
Número ${numN}: essência = "${essencia}" | sombra = "${sombraNum}" | cura = "${curaNum}"${numeroAlma && almaEssencia ? `\nNúmero da Alma ${numeroAlma}: motivação interna = "${almaEssencia}"` : ''}${numeroExpressao && expressaoEssencia ? `\nNúmero da Expressão ${numeroExpressao}: como o mundo te vê = "${expressaoEssencia}"` : ''}${anoPessoal && anoPessoalEssencia ? `\nAno Pessoal ${anoPessoal}: ciclo atual = "${anoPessoalEssencia}"` : ''}
${elemento}: manifestação = "${assinatura}" | excesso = "${excesso}" | cura = "${cura}"
${regente}: força = "${rDrive}" | alerta = "${rAlerta}" | chave = "${rChave}"

INSTRUÇÃO — escreva uma leitura contínua que integre todos os dados acima. Estrutura interna obrigatória (sem marcar seções no texto):

CRÍTICO — TENSÕES PLANETÁRIAS COMO CENTRO: as tensões específicas desta combinação devem ser o núcleo do texto, não menções de passagem. Mostre a dinâmica concreta derivada dos dados acima: como Vênus e Marte criam uma contradição real (ex: ama de um jeito, age de outro quando pressionada — nomeie o mecanismo específico), como Lua e Ascendente se contradizem ou se reforçam (ex: precisa de reconhecimento internamente mas a postura externa esconde isso). Nunca use adjetivos genéricos como "controle" ou "intensidade" sem mostrar O QUE exatamente acontece com esta combinação. Cada adjetivo deve ter um comportamento concreto por trás.

1. ABERTURA — espelho positivo: integre Sol (${signo}), Lua (${signoLua || 'não informada'}) e número ${numN} (${arquetipo}). O primeiro parágrafo deve ser um reconhecimento preciso — a pessoa lê e pensa "sim, isso sou eu." Mostre o que é genuinamente distinto e forte nesta combinação.

2. DINÂMICA INTERNA: como o padrão solar ("${motor}") interage com o padrão emocional automático${luaDesc ? ` ("${luaDesc}")` : ''} e com a forma de agir sob pressão${marteDesc ? ` ("${marteDesc}")` : ''}. Onde se complementam. Onde criam tensão que a pessoa não percebe em si mesma.

3. PADRÃO AFETIVO: como o que a pessoa valoriza em vínculos${venusDesc ? ` ("${venusDesc}")` : ''} colide ou alinha com a forma como reage quando o vínculo pressiona${marteDesc ? ` ("${marteDesc}")` : ''}. Nomeie a dinâmica específica sem citar planetas.

4. NODO NORTE + OBJETIVO: o que esta pessoa precisa integrar nesta vida${nodoDesc ? ` ("${nodoDesc}")` : ''} — e como isso se conecta ao objetivo "${objetivoFmt}". O que ela tende a evitar que é exatamente o que precisaria fazer.

5. NUMEROLOGIA CRUZADA: como o arquétipo ${arquetipo} (número ${numN}, essência: "${essencia}") amplifica ou conflita com os padrões do mapa. A sombra "${sombraNum}" é onde o padrão se auto-sabota de forma específica.${numeroAlma && almaEssencia ? ` Integre também o Número da Alma ${numeroAlma} (motivação interna: "${almaEssencia}"),` : ''}${numeroExpressao && expressaoEssencia ? ` o Número da Expressão ${numeroExpressao} (como o mundo te vê: "${expressaoEssencia}")` : ''}${anoPessoal && anoPessoalEssencia ? ` e o Ano Pessoal ${anoPessoal} (o que este ciclo específico pede: "${anoPessoalEssencia}")` : ''}.

6. FECHAMENTO: o conflito central desta combinação, nomeado com precisão. O ajuste real — não motivacional — que muda o resultado.

Retorne JSON com exatamente estes 4 campos:
{
  "combinacao": "abertura + dinâmica interna + padrão afetivo — texto corrido fluindo sem seções, 350–450 palavras, não aplicável a outro perfil",
  "conflito_central": "o conflito estrutural desta combinação nomeado com precisão, 130–170 palavras",
  "diagnostico_objetivo": "nodo norte + objetivo + numerologia cruzada + fechamento — 350–450 palavras",
  "frase_diagnostico": "frase-constatação única para este perfil, máx 18 palavras, sem imperativo"
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;

    if (
      !parsed?.combinacao ||
      !parsed?.conflito_central ||
      !parsed?.diagnostico_objetivo ||
      !parsed?.frase_diagnostico
    ) {
      console.error('[IA] JSON incompleto:', Object.keys(parsed || {}));
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('[IA] gerarDiagnosticoIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarArquetiposIA — gera os 3 arquétipos (Dominante, Emocional, Sombra)
// Recebe ctx de buildArquetiposCtx. Retorna { dominante, emocional, sombra } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarArquetiposIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    motor, risco, amorSigno,
    essencia, forca, sombraNum, curaNum,
    objetivo,
    signoLua, signoVenus, signoMarte, signoNodo,
  } = ctx;

  const arquetipo = ARQUETIPO_NUMERO[numN] || `Número ${numN}`;
  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || signoLua)   : null;
  const venusDesc = signoVenus ? (VENUS_PADRAO[signoVenus] || signoVenus) : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || signoNodo)  : null;

  const systemPrompt = `Você cria retratos arquetípicos precisos para análises de perfil comportamental. Arquétipo não é rótulo — é um padrão de comportamento recorrente que descreve como uma pessoa opera, como se sente por dentro e como reage quando perde o eixo.

Pessoa gramatical nas descrições: segunda pessoa ("você age", "quando você perde o eixo", "sua forma de"). NUNCA terceira pessoa.

Cada arquétipo precisa de:
• Um nome evocativo e específico — não genérico. O nome deve capturar a nuance única desta combinação.
• Uma descrição em segunda pessoa mostrando o arquétipo em ação: comportamentos concretos, situações reais.
• Uma frase-chave memorável.

REGRA CRÍTICA DO ARQUÉTIPO SOMBRA: o nome DEVE soar como um mecanismo de defesa real, não como qualidade ou virtude. Exemplos do que NÃO fazer: "O Guardião do Equilíbrio" (soa positivo), "A Estrategista" (soa competente). Exemplos corretos: "A Controladora Silenciosa", "A Analista Blindada", "O Fugitivo Elaborado", "A Perfeccionista que Paralisa". O nome deve fazer a pessoa pensar "sim, é exatamente isso que faço quando estou com medo" — não "que virtude bonita".

Tom: reconhecimento, não julgamento. A Sombra é uma proteção desenvolvida por razão válida — descreva com respeito mas com precisão sobre o que é: um mecanismo de defesa, não uma força.

NUNCA cite planetas pelo nome no texto. Escreva comportamentos derivados como observações diretas.

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Crie os 3 arquétipos para ${firstName}.

PERFIL:
Signo solar: ${signo} (${elemento}) | número de vida: ${numN} (${arquetipo})
Essência: "${essencia}" | força: "${forca}" | sombra: "${sombraNum}" | cura: "${curaNum}"
Objetivo atual: ${objetivo || 'não informado'}

COMO OPERA NO MUNDO:
Motor (o que move): "${motor}"
Risco (onde trava): "${risco}"
Como ama: "${amorSigno}"${luaDesc ? `\nPadrão emocional automático: "${luaDesc}"` : ''}${venusDesc ? `\nO que valoriza em vínculos: "${venusDesc}"` : ''}${marteDesc ? `\nComo age sob pressão: "${marteDesc}"` : ''}${nodoDesc ? `\nO que precisa integrar: "${nodoDesc}"` : ''}

TRÊS ARQUÉTIPOS:

1. DOMINANTE — como ${firstName} opera no automático e como os outros a percebem.
   Base: como ${signo} (${motor}) se combina com ${arquetipo} (${essencia}) na expressão externa.
   Nome: deve capturar o papel que ela performa — o que ela faz, não quem ela é.

2. EMOCIONAL — o padrão interno, invisível para a maioria.
   Base: ${luaDesc ? `padrão emocional ("${luaDesc}")` : 'padrão emocional'}${venusDesc ? ` + como ama ("${venusDesc}")` : ''}.
   Mostre o contraste entre como ela aparenta e o que precisa de verdade.

3. SOMBRA — o mecanismo de proteção quando perde o eixo.
   Base: ${marteDesc ? `reação sob pressão ("${marteDesc}")` : 'reação sob pressão'} + sombra do número ("${sombraNum}")${nodoDesc ? ` + o que ainda evita integrar ("${nodoDesc}")` : ''}.
   Descreva como proteção que faz sentido, não como defeito.

Retorne JSON com exatamente esta estrutura:
{
  "dominante": {
    "nome": "nome evocativo e específico para esta combinação (não genérico)",
    "descricao": "80–120 palavras mostrando como este arquétipo aparece em comportamento concreto",
    "frase": "uma frase que captura a essência deste arquétipo"
  },
  "emocional": {
    "nome": "nome evocativo e específico",
    "descricao": "80–120 palavras",
    "frase": "frase memorável"
  },
  "sombra": {
    "nome": "nome evocativo e específico — com respeito",
    "descricao": "80–120 palavras descrevendo a proteção, não o defeito",
    "frase": "frase memorável"
  }
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.dominante?.nome || !parsed?.emocional?.nome || !parsed?.sombra?.nome) {
      console.error('[IA] arquetipos: estrutura incompleta:', Object.keys(parsed || {}));
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarArquetiposIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarPontoCegoIA — gera o Ponto Cego via Groq
// Recebe ctx de buildPontoCegoCtx. Retorna { body, frase } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarPontoCegoIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    motor, risco, essencia, sombraNum, curaNum,
    objetivo, relacaoStatus, trabalhoStatus,
    signoMarte, signoNodo,
  } = ctx;

  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || signoNodo)  : null;

  const systemPrompt = `Você escreve o "Ponto Cego" de um manual de perfil comportamental. Ponto cego é o padrão de autossabotagem que a pessoa não consegue ver em si mesma — porque opera no automático, porque é o mecanismo de defesa mais arraigado, ou porque nunca foi nomeado com precisão.

Pessoa gramatical obrigatória: segunda pessoa ("você repete", "seu padrão", "quando você"). NUNCA terceira pessoa.

A leitura deve ser: específica para esta combinação (não genérica por objetivo), respeitosa e precisa. A pessoa deve ler e pensar "como você sabia?".

O ponto cego emerge da tensão entre a sombra interna (o padrão que a pessoa repete sem perceber), a forma como reage automaticamente sob pressão, e o que resiste integrar. Não cite planetas pelo nome.

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva o Ponto Cego para ${firstName}.

PERFIL:
Signo: ${signo} (${elemento}) | Número: ${numN}
Motor: "${motor}" | Risco: "${risco}"
Sombra do número ${numN}: "${sombraNum}" | Cura: "${curaNum}"
Objetivo atual: ${objetivo || 'não informado'}
Status amor: ${relacaoStatus || 'não informado'} | Trabalho: ${trabalhoStatus || 'não informado'}${marteDesc ? `\nComo age sob pressão: "${marteDesc}"` : ''}${nodoDesc ? `\nO que precisa integrar: "${nodoDesc}"` : ''}

INSTRUÇÃO:
O ponto cego desta combinação nasce da interação entre:
1. A sombra interna: "${sombraNum}" — o que se repete sem perceber
2. A reação automática sob pressão${marteDesc ? ` ("${marteDesc}")` : ''} — o que a pessoa faz antes de pensar
3. A resistência à integração${nodoDesc ? ` ("${nodoDesc}")` : ''} — o que evita exatamente o que precisaria fazer

Não use a estrutura genérica do objetivo. Mostre como ${signo} + número ${numN} cria este ponto cego específico — diferente de qualquer outro perfil.

Retorne JSON com 2 campos:
{
  "body": "150–200 palavras em texto corrido descrevendo: como o ponto cego aparece sem que a pessoa perceba, o mecanismo por trás, e por que é difícil de ver nesta combinação específica",
  "frase": "frase-diagnóstica única para este perfil, máx 18 palavras, sem imperativo"
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body) { console.error('[IA] pontoCego: campo body ausente'); return null; }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarPontoCegoIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarBloqueiosIA — gera os 3 Bloqueios via Groq
// Recebe ctx de buildBloqueiosCtx. Retorna { note, items[] } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarBloqueiosIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    motor, risco, essencia, sombraNum, curaNum,
    assinatura, excesso,
    objetivo, relacaoStatus, trabalhoStatus,
    loveContexto, loveMeta, workContexto, workMeta,
    signoLua, signoVenus, signoMarte, signoNodo,
  } = ctx;

  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || signoLua)   : null;
  const venusDesc = signoVenus ? (VENUS_PADRAO[signoVenus] || signoVenus) : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || signoNodo)  : null;

  const systemPrompt = `Você escreve a seção "Bloqueios" de um manual de perfil comportamental. Os bloqueios são os 3 padrões específicos que travam esta combinação — não genéricos por objetivo, mas derivados do cruzamento de signo, lua, vênus, marte, número e status atual.

Pessoa gramatical obrigatória: segunda pessoa ("você trava", "sua tendência", "quando você"). NUNCA terceira pessoa.

Cada bloqueio:
• Nome: específico para esta combinação — não "Procrastinação" ou "Falta de Foco", mas o mecanismo real desta pessoa
• Como aparece: uma situação concreta no dia a dia, em segunda pessoa
• O invisível: o mecanismo por trás que a pessoa não percebe
• Destravamento: a ação concreta que quebra o ciclo

NUNCA cite planetas pelo nome. Escreva os comportamentos como observações diretas.

Idioma: escreva em português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.
REGRA DO NOTE: o campo "note" NUNCA deve começar com o nome da pessoa + verbo. Comece sempre com "Você" ou "Sua". NUNCA use o nome da pessoa como sujeito de terceira pessoa no note (ex: errado: "Bianca é uma Sagitário"; correto: "Você trava em ciclos de busca por significado"). O campo "note" deve ser redigido inteiramente em segunda pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva os 3 Bloqueios para ${firstName}.

PERFIL COMPLETO:
Signo: ${signo} (${elemento}) | Número: ${numN}
Motor: "${motor}" | Risco: "${risco}"
${elemento}: manifestação = "${assinatura}" | excesso = "${excesso}"
Número ${numN}: essência = "${essencia}" | sombra = "${sombraNum}" | cura = "${curaNum}"
Objetivo: ${objetivo || 'não informado'}${luaDesc ? `\nPadrão emocional automático: "${luaDesc}"` : ''}${venusDesc ? `\nO que valoriza em vínculos: "${venusDesc}"` : ''}${marteDesc ? `\nComo age sob pressão: "${marteDesc}"` : ''}${nodoDesc ? `\nO que precisa integrar: "${nodoDesc}"` : ''}

STATUS ATUAL:
Amor (${relacaoStatus || 'não informado'}): "${loveContexto}" → meta: "${loveMeta}"
Trabalho (${trabalhoStatus || 'não informado'}): "${workContexto}" → meta: "${workMeta}"

INSTRUÇÃO:
Derive os 3 bloqueios do cruzamento real dos dados acima — não do objetivo isolado. Cada bloqueio deve ser específico para ${signo} + número ${numN} com estes padrões (emocional, relacional, reativo).

Sugira como estrutura interna:
• Bloqueio 1: tensão entre o drive externo ("${motor}") e o padrão emocional interno${luaDesc ? ` ("${luaDesc}")` : ''}
• Bloqueio 2: tensão relacional entre o que valoriza em vínculos${venusDesc ? ` ("${venusDesc}")` : ''} e como reage quando pressionada${marteDesc ? ` ("${marteDesc}")` : ''}
• Bloqueio 3: tensão entre a sombra interna ("${sombraNum}") e o que evita integrar${nodoDesc ? ` ("${nodoDesc}")` : ''} no contexto do trabalho atual

Retorne JSON:
{
  "note": "2–3 frases contextualizando os bloqueios desta combinação específica (não genérico por objetivo)",
  "items": [
    "Bloqueio 1 — [Nome específico desta combinação]\\n• Como aparece: [situação concreta no dia a dia]\\n• O invisível: [mecanismo por trás]\\n• Destravamento: [ação concreta]",
    "Bloqueio 2 — [Nome]\\n• Como aparece: ...\\n• O invisível: ...\\n• Destravamento: ...",
    "Bloqueio 3 — [Nome]\\n• Como aparece: ...\\n• O invisível: ...\\n• Destravamento: ..."
  ]
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!Array.isArray(parsed?.items) || parsed.items.length < 3) {
      console.error('[IA] bloqueios: items insuficientes:', parsed?.items?.length);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarBloqueiosIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarDinheiroIA — gera a seção Dinheiro via Groq
// Recebe ctx de buildDinheiroCtx. Retorna { headline, blocks[], actions[], microHabits[] } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarDinheiroIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    dinheiroSigno, sombraNum, curaNum,
    assinatura, excesso, cura,
    objetivo, trabalhoStatus,
    workContexto, workMeta,
    signoMarte, signoNodo,
  } = ctx;

  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || signoNodo)  : null;

  const systemPrompt = `Você escreve a seção Dinheiro de um manual de análise comportamental. Foco no padrão financeiro concreto desta combinação específica — como ganha, como perde, onde trava. Tom prático e direto, sem clichê de "abundância", "prosperidade", "manifestação" ou linguagem espiritual de dinheiro.

Pessoa gramatical obrigatória: segunda pessoa ("você ganha", "seu padrão", "quando você"). NUNCA terceira pessoa.

Os bloqueios e ações devem ser derivados do cruzamento real de signo + número + forma de agir sob pressão + status de trabalho. Não genéricos.

Idioma: português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.
REGRA DE CLÍTICO: use sempre clíticos femininos ao se referir à pessoa: "te fazem", "te levam", "te travam". NUNCA use "o fazem", "a fazem", "o levam".

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva a seção Dinheiro para ${firstName}.

PERFIL:
Signo: ${signo} (${elemento}) | Número: ${numN}
Como esse signo cresce financeiramente: "${dinheiroSigno}"
Sombra do número ${numN}: "${sombraNum}" | Cura: "${curaNum}"
${elemento}: manifestação = "${assinatura}" | excesso = "${excesso}" | cura = "${cura}"${marteDesc ? `\nComo age sob pressão (inclui pressão financeira): "${marteDesc}"` : ''}${nodoDesc ? `\nO que precisa integrar no trabalho/dinheiro: "${nodoDesc}"` : ''}
Status de trabalho: ${trabalhoStatus || 'não informado'} — ${workContexto}
Meta de trabalho: "${workMeta}"
Objetivo geral: ${objetivo || 'não informado'}

INSTRUÇÃO:
Derive os 3 bloqueios da intersecção real entre:
• Como esse signo naturalmente ganha e onde auto-sabota (sombra do número)
• Como age quando pressiona resultados${marteDesc ? ` (${marteDesc})` : ''}
• O que evita integrar${nodoDesc ? ` (${nodoDesc})` : ''} no contexto do trabalho atual

Não cite planetas pelo nome. Escreva observações diretas em segunda pessoa.

Retorne JSON:
{
  "headline": "2–3 frases sobre o padrão financeiro desta combinação: como você ganha, como você perde, onde você trava — sem clichê, em segunda pessoa",
  "blocks": [
    "Bloqueio 1 — [nome específico desta combinação]: [como aparece no dia a dia financeiro]",
    "Bloqueio 2 — ...",
    "Bloqueio 3 — ..."
  ],
  "actions": [
    "Ação 1: [verbo + ação concreta e específica para este perfil]",
    "Ação 2: ...",
    "Ação 3: ..."
  ],
  "microHabits": [
    "Hábito 1: [micro-hábito diário de 5–15 minutos, concreto e acionável]",
    "Hábito 2: ...",
    "Hábito 3: ..."
  ]
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.headline || !Array.isArray(parsed?.blocks) || !Array.isArray(parsed?.actions)) {
      console.error('[IA] dinheiro: estrutura incompleta'); return null;
    }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarDinheiroIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarRituaisIA — gera os 3 Rituais personalizados via Groq
// Recebe ctx de buildRituaisCtx. Retorna { rituals: [{nome, quando, passos[], frase}] } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarRituaisIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    excesso, cura, sombraNum, curaNum,
    signoLua, signoVenus, signoMarte, signoNodo,
  } = ctx;

  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || signoLua)   : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;
  const nodoDesc  = signoNodo  ? (NODO_PADRAO[signoNodo]   || signoNodo)  : null;

  const systemPrompt = `Você escreve a seção de Rituais de um manual de análise comportamental. Os rituais são práticas de 3–7 minutos específicas para esta combinação — não genéricas. Cada ritual regula um estado interno preciso desta combinação e existe por uma razão derivada dos dados do perfil.

Pessoa gramatical obrigatória: segunda pessoa ("você usa quando", "sua tendência", "quando você"). NUNCA terceira pessoa.

NUNCA cite planetas pelo nome. Escreva os comportamentos derivados como observações diretas.

Os passos devem ser físicos e mentais, concretos e acionáveis em 3–7 minutos reais — não instruções vagas como "medite" ou "reflita".

Idioma: português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Crie os 3 Rituais para ${firstName}.

PERFIL:
Signo: ${signo} (${elemento}) | Número: ${numN}
Quando ${elemento} acelera demais: "${excesso}" | Cura do elemento: "${cura}"
Sombra do número ${numN} (o que se repete): "${sombraNum}" | Cura: "${curaNum}"${luaDesc ? `\nPadrão emocional automático: "${luaDesc}"` : ''}${marteDesc ? `\nComo age quando esquiva/procrastina: "${marteDesc}"` : ''}${nodoDesc ? `\nO que evita integrar: "${nodoDesc}"` : ''}

TRÊS RITUAIS ESPECÍFICOS PARA ESTE PERFIL:

RITUAL 1 — para quando você está acelerando demais / sobrecarregando o sistema
Base: "${excesso}" — este é o padrão automático de ${signo} quando perde o eixo. O ritual deve interromper esse ciclo.

RITUAL 2 — para quando você está fora do eixo emocional / reativo
Base: padrão emocional automático${luaDesc ? ` ("${luaDesc}")` : ''} — o que acontece internamente quando o ambiente pressiona.

RITUAL 3 — para quando você está procrastinando / evitando o que precisa fazer
Base: reação de esquiva${marteDesc ? ` ("${marteDesc}")` : ''}${nodoDesc ? ` + o que resiste integrar ("${nodoDesc}")` : ''}.

Retorne JSON:
{
  "rituals": [
    {
      "nome": "nome específico do Ritual 1 para esta combinação",
      "quando": "em 1 linha: a situação exata quando usar",
      "passos": ["4–6 passos físicos/mentais concretos em segunda pessoa, 3–7 min total"],
      "frase": "frase-âncora memorável para este ritual"
    },
    {
      "nome": "nome específico do Ritual 2",
      "quando": "situação exata",
      "passos": ["4–6 passos concretos"],
      "frase": "frase-âncora"
    },
    {
      "nome": "nome específico do Ritual 3",
      "quando": "situação exata",
      "passos": ["4–6 passos concretos"],
      "frase": "frase-âncora"
    }
  ]
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!Array.isArray(parsed?.rituals) || parsed.rituals.length < 3) {
      console.error('[IA] rituais: estrutura incompleta'); return null;
    }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarRituaisIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarObjetivoIA — deep dive do Objetivo do Ciclo (MODEL_HEAVY)
// Retorna { title, body } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarObjetivoIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    motor, risco, fraseSigno,
    essencia, sombraNum, curaNum,
    objetivo, signoNodo,
  } = ctx;

  const nodoDesc = signoNodo ? (NODO_PADRAO[signoNodo] || signoNodo) : null;

  const systemPrompt = `Você escreve o "Objetivo do Ciclo" de um manual de análise comportamental. Esta seção explica o que o objetivo declarado significa especificamente para esta combinação — onde vai fluir com naturalidade, onde vai travar, e qual ajuste real faz esse objetivo sair do lugar.

Pessoa gramatical obrigatória: segunda pessoa ("você busca", "seu padrão", "quando você"). NUNCA terceira pessoa.

Tom: analítico, preciso, sem motivação vazia. A pessoa deve sentir que o texto descreve exatamente como ESSA combinação se relaciona com esse objetivo — não uma análise genérica do objetivo.

Idioma: português brasileiro fluente e natural. Nunca misture inglês ou espanhol.

Proibido: "potencial", "jornada", "você é capaz", frases aplicáveis a qualquer pessoa. Proibido terceira pessoa.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva o Objetivo do Ciclo para ${firstName}.

PERFIL:
Signo: ${signo} (${elemento}) | Número: ${numN}
Motor de ${signo}: "${motor}" | Risco: "${risco}"
Essência do número ${numN}: "${essencia}" | Sombra: "${sombraNum}" | Cura: "${curaNum}"
Objetivo declarado: ${objetivo || 'clareza e direção'}${nodoDesc ? `\nO que você precisa integrar neste ciclo: "${nodoDesc}"` : ''}
Frase-mestra do seu signo: "${fraseSigno}"

INSTRUÇÃO:
Explique o que "${objetivo || 'clareza e direção'}" significa especificamente para ${signo} + número ${numN}:
1. Onde essa combinação naturalmente facilita esse objetivo (o motor ajuda como?)
2. Onde essa combinação vai travar (a sombra "${sombraNum}" sabota como?)
3. O que o Nodo Norte${nodoDesc ? ` ("${nodoDesc}")` : ''} tem a ver com esse objetivo
4. O ajuste real — o que precisa mudar de verdade para esse objetivo sair do lugar

Retorne JSON:
{
  "title": "Objetivo do ciclo — ${objetivo || 'clareza e direção'}",
  "body": "400–500 palavras, texto corrido, segunda pessoa, não aplicável a outro perfil"
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body) { console.error('[IA] objetivo: campo body ausente'); return null; }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarObjetivoIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarLeituraIA — Leitura Integrada: perfil no eixo vs fora do eixo (MODEL_HEAVY)
// Retorna { body } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarLeituraIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    motor, risco,
    assinatura, excesso, cura, neuro,
    essencia, forca, sombraNum, curaNum,
    emDiaBom, emDiaRuim, ajuste,
    objetivo, signoLua, signoMarte,
  } = ctx;

  const luaDesc   = signoLua   ? (LUA_PADRAO[signoLua]    || signoLua)   : null;
  const marteDesc = signoMarte ? (MARTE_PADRAO[signoMarte] || signoMarte) : null;

  const systemPrompt = `Você escreve a "Leitura Integrada" de um manual de análise comportamental. Esta seção mostra o perfil em dois estados: quando está no eixo (comportamentos observáveis concretos) e quando sai do eixo (o que muda na prática, os sinais visíveis de que perdeu o centro).

Pessoa gramatical obrigatória: segunda pessoa. NUNCA terceira pessoa.

Os comportamentos devem ser observáveis e específicos para esta combinação — não adjetivos abstratos como "você fica ansiosa". Mostre o que muda no dia a dia, nas relações, nas decisões.

Idioma: português brasileiro fluente e natural. Nunca misture inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva a Leitura Integrada para ${firstName}.

PERFIL:
Signo: ${signo} (${elemento}) | Número: ${numN}
Motor: "${motor}" | Risco: "${risco}"
${elemento}: assinatura = "${assinatura}" | excesso = "${excesso}" | cura = "${cura}"
${elemento} quando alinhada: "${emDiaBom}"
${elemento} fora do eixo: "${emDiaRuim}"
Ajuste central: "${ajuste}"
Número ${numN}: essência = "${essencia}" | força = "${forca}" | sombra = "${sombraNum}"${luaDesc ? `\nPadrão emocional (quando pressiona): "${luaDesc}"` : ''}${marteDesc ? `\nComo age quando perde o eixo: "${marteDesc}"` : ''}
Objetivo do ciclo: ${objetivo || 'não informado'}

INSTRUÇÃO:
Dois blocos em texto corrido, fluindo um para o outro sem subtítulos marcados:

Bloco 1 — QUANDO ESTÁ NO EIXO: o que você faz bem quando alinhada — comportamentos observáveis específicos desta combinação ${signo} + ${numN}${luaDesc ? ` com esse padrão emocional` : ''}. Não adjetivos — ações e reações concretas.

Bloco 2 — QUANDO SAI DO EIXO: o que muda na prática. Os sinais observáveis de que você perdeu o centro. O que acontece com seu trabalho, suas relações, suas decisões${marteDesc ? ` — incluindo a reação automática de "${marteDesc}"` : ''}.

Retorne JSON:
{
  "body": "300–400 palavras, dois blocos em texto corrido, segunda pessoa, comportamentos concretos, não aplicável a outro perfil"
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body) { console.error('[IA] leitura: campo body ausente'); return null; }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarLeituraIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarCalendarioIA — Calendário 30 Dias personalizado (MODEL_LIGHT)
// Retorna { weeks: [{week, focus, days[]}] } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarCalendarioIA(ctx) {

  const {
    firstName, signo, elemento, numN,
    curaElemento, sombraNum, curaNum, essencia,
    objetivo, signoNodo,
  } = ctx;

  const nodoDesc = signoNodo ? (NODO_PADRAO[signoNodo] || signoNodo) : null;

  const systemPrompt = `Você cria calendários de 30 dias personalizados para perfis comportamentais. 4 semanas com tema específico para este signo, número e objetivo — não genérico. Cada semana tem um tema que faz sentido para esta combinação, e cada dia tem uma ação concreta de 10–20 minutos.

Pessoa gramatical obrigatória: segunda pessoa. NUNCA terceira pessoa.

Idioma: português brasileiro fluente e natural. Nunca misture inglês ou espanhol.

Proibido: ações vagas como "reflita sobre si", "seja mais você". Cada dia deve ter uma ação acionável imediatamente.
REGRA DE ESPECIFICIDADE: As ações diárias devem ser ESPECÍFICAS e ACIONÁVEIS para este perfil — não exercícios genéricos de autoajuda como "escreva uma carta para si mesmo" ou "faça um quadro de visão". Cada ação deve ser algo que esta combinação específica precisa fazer DIFERENTE de outras combinações.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Crie o Calendário de 30 Dias para ${firstName}.

PERFIL:
Signo: ${signo} (${elemento}) | Número: ${numN}
Essência do número ${numN}: "${essencia}" | Sombra: "${sombraNum}" | Cura: "${curaNum}"
Cura do elemento ${elemento}: "${curaElemento}"
Objetivo do ciclo: ${objetivo || 'clareza e direção'}${nodoDesc ? `\nO que precisa integrar: "${nodoDesc}"` : ''}

INSTRUÇÃO:
4 semanas com progressão lógica para este perfil e objetivo. Cada semana tem:
• Um tema específico para ${signo} + ${numN} — não genérico
• Um foco que explica POR QUE essa semana faz sentido para esta combinação
• 7 ações diárias concretas (10–20 min cada), específicas para este perfil

Progressão sugerida: Semana 1 = desbloqueio/limpeza → Semana 2 = construção do padrão novo → Semana 3 = exposição/aplicação → Semana 4 = consolidação

Retorne JSON:
{
  "weeks": [
    {
      "week": "Semana 1 — [tema específico para ${signo} + ${numN}]",
      "focus": "por que esta semana faz sentido para você neste ciclo (1–2 linhas)",
      "days": [
        "Dia 1: [ação concreta + objetivo do dia]",
        "Dia 2: ...",
        "Dia 3: ...",
        "Dia 4: ...",
        "Dia 5: ...",
        "Dia 6: ...",
        "Dia 7: ..."
      ]
    },
    { semana 2 },
    { semana 3 },
    { semana 4 }
  ]
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!Array.isArray(parsed?.weeks) || parsed.weeks.length < 4) {
      console.error('[IA] calendario: semanas insuficientes:', parsed?.weeks?.length); return null;
    }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarCalendarioIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarFechamentoIA — Fechamento com mantra pessoal (MODEL_LIGHT)
// Retorna { body, mantra } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarFechamentoIA(ctx) {

  const {
    firstName, signo, numN,
    fraseSigno, essencia, curaNum, objetivo,
  } = ctx;

  const systemPrompt = `Você escreve o Fechamento de um manual de análise comportamental. Curto, impactante e pessoal. A mensagem final deve integrar os temas do manual — não repetir conteúdo, mas selar com uma direção clara.

Pessoa gramatical obrigatória: segunda pessoa. NUNCA terceira pessoa.

O mantra deve ser único para este perfil — não uma frase motivacional genérica, mas algo que a pessoa vai reconhecer como "isso é meu".

Idioma: português brasileiro fluente e natural. Nunca misture inglês ou espanhol.

Proibido: "potencial", "jornada", "você merece o melhor", "confie no processo", "dar vida aos seus sonhos", "você está pronta", "manifeste seus desejos", qualquer frase genérica. Proibido terceira pessoa.
REGRA DE TOM: O fechamento deve ser uma constatação precisa — como se alguém que te conhece profundamente dissesse a verdade final sem enfeite. Nunca motivacional.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes no texto. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: se o texto contiver "ela", "dele", "a pessoa", "o ajuda" ou qualquer terceira pessoa, está ERRADO — reescreva em segunda pessoa ("você", "seu", "sua"). Pronomes clíticos proibidos: nunca use "a leva", "o faz", "a torna", "o torna", "lhe diz" — use sempre "te leva", "te faz", "te torna", "te diz". Nunca use o nome da pessoa como sujeito de terceira pessoa.

REGRA DE GÊNERO: use sempre o feminino como padrão ao se referir à pessoa: "sobrecarregada", "perdida", "vista". Nunca use masculino genérico.

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva o Fechamento para ${firstName}.

PERFIL:
Signo: ${signo} | Número: ${numN}
Essência do número ${numN}: "${essencia}"
Cura central: "${curaNum}"
Objetivo do ciclo: ${objetivo || 'clareza e direção'}
Frase-mestra do signo: "${fraseSigno}"

INSTRUÇÃO:
1. Mensagem final: 150–200 palavras que selem o manual. Integra o que é forte nesta combinação, o conflito central, e a direção clara. Não um resumo — um convite para agir com o que foi descoberto.
2. Mantra: 1 linha memorável, única para este perfil, que a pessoa vai carregar. Deve soar como uma verdade desta combinação específica — não uma frase motivacional genérica.

Retorne JSON:
{
  "body": "150–200 palavras, segunda pessoa, impactante e personalizado",
  "mantra": "1 linha única para este perfil — algo que só funciona para ${signo} + número ${numN}"
}`;

  try {
    const parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body || !parsed?.mantra) { console.error('[IA] fechamento: estrutura incompleta'); return null; }
    return parsed;
  } catch (err) {
    console.error('[IA] gerarFechamentoIA falhou:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// gerarInterpretacaoTarotIA — conecta a carta sorteada com o perfil da pessoa
// Recebe { carta, invertida, signo, numN, objetivo, firstName }.
// Retorna { titulo, body } ou null.
// ─────────────────────────────────────────────────────────────────────────────
export async function gerarInterpretacaoTarotIA({ carta, invertida, signo, numN, objetivo, firstName }) {
  if (!carta?.nome) return null;

  const significadoBase = invertida ? carta.significadoInvertido : carta.significado;
  const statusCarta = invertida ? 'invertida' : 'na posição normal';

  const systemPrompt = `Você escreve a seção "Sua Carta do Dia" de um manual de análise comportamental. A carta de tarot é usada como espelho simbólico do momento — não como previsão mágica. Seu papel é conectar o significado da carta com o padrão real da pessoa (signo + número de vida + objetivo atual) de forma concreta e específica.

Pessoa gramatical obrigatória: segunda pessoa ("você está", "seu momento", "quando você"). NUNCA terceira pessoa.

Tom: reflexivo, preciso, sem misticismo exagerado. A carta é uma lente — não um oráculo.

NUNCA diga que "o universo enviou" ou "o destino escolheu" — a carta é sorteada, e o texto deve tratar isso com naturalidade, como um espelho do momento.

Idioma: português brasileiro fluente e natural. Nunca misture palavras em inglês ou espanhol.

REGRA ANTI-REPETIÇÃO: nunca repita a mesma palavra-chave mais de 2 vezes. Use sinônimos, reformule ou corte.
REGRA ABSOLUTA DE PESSOA: nunca terceira pessoa. Pronomes clíticos: sempre "te leva", "te faz", "te torna" — nunca "a leva", "o faz".
REGRA DE GÊNERO: feminino como padrão ("sobrecarregada", "perdida", "vista").

Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.`;

  const userPrompt = `Escreva a interpretação da carta para ${firstName}.

CARTA SORTEADA: ${carta.nome} (${statusCarta})
Palavras-chave: ${carta.palavrasChave.join(' · ')}
Significado desta posição: "${significadoBase}"

PERFIL:
Signo: ${signo} | Número de vida: ${numN}
Objetivo do ciclo: ${objetivo || 'clareza e direção'}

INSTRUÇÃO:
Conecte o significado de "${carta.nome}" (${statusCarta}) com o padrão real de ${signo} + número ${numN} no contexto do objetivo "${objetivo || 'clareza e direção'}".

Estrutura interna (sem subtítulos no texto):
1. O que essa carta espelha no momento atual desta combinação — não o significado genérico da carta, mas o que ela revela quando aparece para ${signo} + ${numN} agora.
2. O que essa carta está pedindo concretamente — uma ação ou mudança de perspectiva específica para este perfil, não genérica.
3. A conexão com o objetivo "${objetivo || 'clareza e direção'}" — como a mensagem da carta se encaixa no que a pessoa está construindo ou desbloqueando.

150–200 palavras, texto corrido, segunda pessoa, específico para esta combinação.

Retorne JSON:
{
  "titulo": "nome curto e evocativo para esta leitura — máx 8 palavras, referencia a carta e o perfil",
  "body": "150–200 palavras, texto corrido, segunda pessoa, não aplicável a outro perfil"
}`;

  try {
    let parsed = await chamarClaude(systemPrompt, userPrompt);
    if (!parsed) return null;
    if (!parsed?.body) { console.error('[IA] tarot: campo body ausente'); return null; }

    if (!parsed?.titulo) {
      console.warn('[IA] tarot: campo titulo ausente, tentando novamente');
      const retry = await chamarClaude(systemPrompt, userPrompt);
      if (retry?.titulo && retry?.body) {
        parsed = retry;
      } else {
        console.warn('[IA] tarot: titulo ausente mesmo após nova tentativa — mantendo body original');
      }
    }

    return parsed;
  } catch (err) {
    console.error('[IA] gerarInterpretacaoTarotIA falhou:', err?.message || err);
    return null;
  }
}

export async function gerarAnaliseEspiritual(dados) {
  const { nome, signo, numeroVida, significado, perfilSigno } = dados;
  
  const prompt = `Você é uma mestra espiritual experiente em numerologia, astrologia, e neurociencia.

DADOS DO CONSULENTE:
Nome: ${nome}
Signo Solar: ${signo} (${perfilSigno.elemento}, regido por ${perfilSigno.regente})
Número da Vida: ${numeroVida} - "${significado.titulo}"

TAREFA:
Crie uma análise espiritual personalizada, profunda e acolhedora seguindo EXATAMENTE esta estrutura:

 🌟 **SEU PERFIL ENERGÉTICO**

[Escreva 2-3 parágrafos combinando a energia do signo ${signo} com o número ${numeroVida}. Seja específico sobre como essas energias se manifestam na vida de ${nome}. Use o nome da pessoa. Tom místico mas acessível.]

 💫 **MISSÃO DE ALMA**

[Explique o propósito de vida baseado no número ${numeroVida} e signo ${signo}. O que ${nome} veio fazer nesta encarnação? Quais dons trouxe? 2 parágrafos.]

 ⚡ **DESAFIOS KÁRMICOS**

[Liste 3 desafios principais que ${nome} precisa transcender, baseados nos dados. Seja compassivo mas direto.]

1. [Desafio 1 + como superar]
2. [Desafio 2 + como superar]
3. [Desafio 3 + como superar]

 🔮 **POTENCIAIS OCULTOS**

[Revele 3 talentos/dons que ${nome} ainda não desenvolveu completamente mas que estão latentes.]

1. [Potencial 1]
2. [Potencial 2]
3. [Potencial 3]

 💎 **MENSAGEM FINAL**

[Mensagem inspiradora e empoderadora para ${nome}. Termine criando curiosidade sobre "segredos mais profundos do seu mapa" que não foram revelados aqui. 1-2 parágrafos.]

IMPORTANTE:
- Use SEMPRE o nome "${nome}" para personalizar
- Seja específico, NÃO genérico
- Tom acolhedor, místico, revelador
- Evite clichês tipo "você é especial"
- Foque em insights práticos e transformadores`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_HEAVY,
        messages: [
          {
            role: 'system',
            content: 'Você é uma mestra espiritual especializada em numerologia, astrologia, e neurociencia conhecida por leituras profundas e precisas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro na API do Groq');
    }
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    throw new Error('Não foi possível gerar a análise espiritual. Tente novamente.');
  }
}