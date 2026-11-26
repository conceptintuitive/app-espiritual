// lib/resultadoManual.js
// Textos do bloco "O Manual do seu Mapa" e do FAQ do /resultado/[id]. Puro
// (testado em tests/resultado.test.js). As 15 seções seguem a lista de
// app/api/gerar-manual-completo/route.js; o título de cada uma é montado com
// o que já existe da pessoa (frases da IA geradas no quiz, signo, número,
// Ano Pessoal, arquétipo), sem chamar IA nenhuma aqui.

const semAspas = (t) => String(t || '').trim().replace(/^["“”']+|["“”']+$/g, '').trim();

// Área escolhida na etapa 1 do quiz (objetivo_principal) → "no amor" etc.
function objetivoCurto(objetivo) {
  const o = String(objetivo || '').trim().toLowerCase();
  if (o.startsWith('amor')) return 'no amor';
  if (o.startsWith('carreira')) return 'na carreira';
  if (o.startsWith('dinheiro')) return 'com dinheiro';
  if (o.startsWith('autoconhecimento')) return 'no autoconhecimento';
  return null;
}

/**
 * As 15 seções do Manual com o título personalizado.
 * @param {{ nome?: string, signo?: string, numero?: number|string, anoPessoal?: number|string|null,
 *   objetivo?: string|null, arquetipo?: string|null,
 *   diagnostico?: { frase?: string|null } | null, amor?: { headline?: string|null } | null,
 *   dinheiro?: { headline?: string|null } | null,
 *   arquetipos?: { dominante?: { nome?: string }, emocional?: { nome?: string }, sombra?: { nome?: string } } | null,
 *   plano7?: { headline?: string|null } | null }} p
 * @returns {Array<{ chave: string, rotulo: string, titulo: string }>}
 */
export function secoesDoManual(p) {
  const nome = p.nome || 'você';
  const signo = p.signo || 'seu signo';
  const numero = p.numero || '';
  const obj = objetivoCurto(p.objetivo);
  const arq = p.arquetipo || 'seu arquétipo';
  const nomesArq = [p.arquetipos?.dominante?.nome, p.arquetipos?.emocional?.nome, p.arquetipos?.sombra?.nome].filter(Boolean);
  const ano = p.anoPessoal ? `no Ano Pessoal ${p.anoPessoal}` : 'no seu ciclo atual';

  return [
    { chave: 'diagnostico', rotulo: 'Diagnóstico profundo', titulo: semAspas(p.diagnostico?.frase) || `O padrão do número ${numero} na sua fase atual` },
    { chave: 'sistemas', rotulo: 'Seus sistemas cruzados', titulo: 'O que signo, número, astrologia chinesa, anjo e Kin Maia repetem sobre você' },
    { chave: 'tipo', rotulo: 'Tipo de pessoa', titulo: `Quem é ${nome} no melhor momento, e fora do eixo` },
    { chave: 'arquetipos', rotulo: 'Seus 3 arquétipos', titulo: nomesArq.length === 3 ? nomesArq.join(' · ') : `${arq} e as outras duas energias que te movem` },
    { chave: 'ponto_cego', rotulo: 'Ponto cego', titulo: `O que ${signo} com número ${numero} repete sem perceber` },
    { chave: 'bloqueios', rotulo: 'Bloqueios invisíveis', titulo: obj ? `O que trava você ${obj} agora` : 'O que trava o seu próximo passo' },
    { chave: 'amor', rotulo: 'Padrão no amor', titulo: semAspas(p.amor?.headline) || `Como ${signo} ama, e onde se perde` },
    { chave: 'dinheiro', rotulo: 'Mapa do dinheiro', titulo: semAspas(p.dinheiro?.headline) || `O bloqueio financeiro do número ${numero}` },
    { chave: 'compatibilidade', rotulo: 'Compatibilidade astral', titulo: `${signo} com os 12 signos: Sol, Lua, Ascendente, Vênus e Marte` },
    { chave: 'objetivo', rotulo: 'Objetivo do ciclo', titulo: `O que a vida está pedindo de você ${ano}` },
    { chave: 'integrada', rotulo: 'Leitura integrada', titulo: 'O que te potencializa e o que te sabota, lado a lado' },
    { chave: 'rituais', rotulo: '3 rituais', titulo: `Rituais pro arquétipo ${arq}` },
    { chave: 'plano7', rotulo: 'Plano de 7 dias', titulo: semAspas(p.plano7?.headline) || 'Sete dias pra aplicar o que você descobriu' },
    { chave: 'calendario', rotulo: 'Calendário de 4 semanas', titulo: `Seu mês dia a dia, ${ano}` },
    { chave: 'fechamento', rotulo: 'Fechamento e mantra', titulo: `Uma frase-guia só de ${nome}` },
  ];
}

/** Contador "HH:MM:SS" a partir de segundos (null = ainda não calculou). */
export function rotuloContador(segundos) {
  if (segundos === null || segundos === undefined) return null;
  const s = Math.max(0, Math.floor(segundos));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * FAQ curto do /resultado, conferido com os Termos (seções 4 e 5: garantia de
 * 7 dias, cortesia de 30 dias do Manual, teste de 7 dias do Seu Dia,
 * diferença pro Intuitive Completo, nov/2026).
 * @param {{ testeAtivo: boolean }} o
 */
export function faqResultado({ testeAtivo }) {
  return [
    { q: 'O que é o Manual do seu Mapa?', a: 'Uma leitura de 15 seções escrita a partir do seu nascimento, cruzando signo, número, astrologia chinesa, anjo e Kin Maia: diagnóstico, amor, dinheiro, arquétipos, ponto cego, rituais, um plano de 7 dias e um calendário de 4 semanas. O seu Mapa grátis é o começo dele.' },
    { q: 'Como eu recebo?', a: 'No Pix, o código aparece aqui mesmo na página e o Manual abre na tela assim que o pagamento cai (o link também chega por e-mail). No cartão, você recebe o link por e-mail em poucos minutos (confira também o spam).' },
    { q: 'E se eu não gostar?', a: 'Garantia de 7 dias: se o Manual não trouxer clareza real sobre o seu padrão, devolvemos 100% do valor. É só pedir pelo e-mail conceptintuitive@gmail.com.' },
    { q: 'O Seu Dia vem junto?', a: testeAtivo
      ? 'O resumo do seu dia é grátis. Ao criar a Minha Área você ganha 7 dias do Seu Dia Completo, sem cartão; quem compra o Manual ganha 30 dias do Intuitive Completo (Seu Dia, Previsão do Ano e Human Design), sem cobrança e sem renovação automática.'
      : 'O resumo do seu dia é grátis. Quem compra o Manual ganha 30 dias do Intuitive Completo (Seu Dia, Previsão do Ano e Human Design), sem cobrança e sem renovação automática.' },
    { q: 'Preciso saber a hora de nascimento?', a: 'Não. Com a hora e a cidade, o Ascendente e o céu ficam exatos; sem elas, o resto do Manual funciona igual.' },
    { q: 'Qual a diferença pro Intuitive Completo?', a: 'O Manual é a leitura que você compra uma vez e fica pra sempre. O Intuitive Completo é a assinatura do dia a dia: o Seu Dia às 7h, a Previsão do Ano e o Human Design completos. O plano anual já inclui o Manual. Tudo lado a lado em intuitiveconcept.com.br/planos.' },
  ];
}

// ── Fim da leitura grátis: trecho do diagnóstico + gancho ───────────────────

/** Corta na última palavra inteira antes de `max` caracteres. */
function cortarNaPalavra(texto, max) {
  const t = String(texto || '').trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const espaco = corte.lastIndexOf(' ');
  return (espaco > 0 ? corte.slice(0, espaco) : corte).replace(/[,;:.\s]+$/, '');
}

/**
 * Os primeiros parágrafos REAIS do Diagnóstico do Manual (a mesma ordem de
 * lib/manualgenerator.js: a combinação, o conflito central, o diagnóstico do
 * objetivo), vindos de `diagnostico_gerado` (gerado no quiz). Mostra os 2
 * primeiros inteiros e o começo do 3º, que a página corta com degradê.
 * Sem o texto da IA (ou com menos de 2 parágrafos), devolve null.
 * @param {{ combinacao?: string, conflito_central?: string, diagnostico_objetivo?: string } | null} d
 * @returns {{ visiveis: Array<{ rotulo: string|null, texto: string }>, cortado: { rotulo: string|null, texto: string } } | null}
 */
export function trechoDoDiagnostico(d) {
  if (!d?.combinacao) return null;
  const blocos = [
    ['A combinação', d.combinacao],
    ['O conflito central', d.conflito_central],
    ['Diagnóstico do seu objetivo', d.diagnostico_objetivo],
  ];
  const paragrafos = [];
  for (const [rotulo, texto] of blocos) {
    String(texto || '').split(/\n+/).map((s) => s.trim()).filter(Boolean)
      .forEach((t, i) => paragrafos.push({ rotulo: i === 0 ? rotulo : null, texto: t }));
  }
  if (paragrafos.length < 2) return null;
  const nVisiveis = Math.min(2, paragrafos.length - 1);
  const proximo = paragrafos[nVisiveis];
  return {
    visiveis: paragrafos.slice(0, nVisiveis),
    cortado: { rotulo: proximo.rotulo, texto: cortarNaPalavra(proximo.texto, 170) },
  };
}

// Onde o padrão mais pesa agora, pela área escolhida na etapa 1 do quiz, e a
// seção do Manual que fala disso. "Amor" já é a 2ª área, então a 3ª vira o dinheiro.
const TERCEIRA_AREA = {
  amor: { rotulo: 'No dinheiro', secao: 'Mapa do dinheiro' },
  carreira: { rotulo: 'Na carreira', secao: 'Bloqueios invisíveis' },
  dinheiro: { rotulo: 'No dinheiro', secao: 'Mapa do dinheiro' },
  autoconhecimento: { rotulo: 'No que você ainda não vê em você', secao: 'Ponto cego' },
};

function areaDoObjetivo(objetivo) {
  const o = String(objetivo || '').trim().toLowerCase();
  if (o.startsWith('amor')) return 'amor';
  if (o.startsWith('carreira')) return 'carreira';
  if (o.startsWith('dinheiro')) return 'dinheiro';
  if (o.startsWith('autoconhecimento')) return 'autoconhecimento';
  return 'dinheiro';
}

const maiuscula = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const comPonto = (s) => (/[.!?…]$/.test(s) ? s : `${s}.`);

/**
 * Frase de curiosidade do fim da leitura grátis, montada só com o que já
 * existe da pessoa (nada inventado): a sombra do arquétipo principal (tabela
 * de lib/arquetipoBase.js, calculado de signo + número + objetivo), a frase do
 * amor que a IA escreveu no quiz (se houver) e a 3ª área, que fica fechada e
 * aponta pra seção do Manual que trata dela.
 * @param {{ arquetipo?: { nome: string, sombra: string } | null, amorHeadline?: string|null, objetivo?: string|null }} p
 * @returns {{ titulo: string, itens: Array<{ rotulo: string, texto: string|null }>, chamada: string } | null}
 */
export function ganchoDoMapa({ arquetipo, amorHeadline = null, objetivo = null }) {
  if (!arquetipo?.sombra) return null;
  const terceira = TERCEIRA_AREA[areaDoObjetivo(objetivo)];
  const amor = semAspas(amorHeadline);
  const itens = [
    { rotulo: `No seu jeito de agir (${arquetipo.nome})`, texto: comPonto(maiuscula(arquetipo.sombra)) },
    { rotulo: 'No amor', texto: amor ? comPonto(amor) : null },
    { rotulo: terceira.rotulo, texto: null },
  ];
  const chamada = amor
    ? `A terceira é onde ele mais pesa agora. Ela está no Manual, na seção ${terceira.secao}.`
    : `As outras duas estão no Manual, nas seções Padrão no amor e ${terceira.secao}.`;
  return { titulo: 'O mesmo padrão aparece em 3 lugares da sua vida', itens, chamada };
}

/**
 * "X de cada 10 pessoas disseram que o Manual bate com elas", só com 10+
 * pessoas e sempre arredondado pra baixo (nunca infla). null = não mostra.
 * @param {{ pessoas: number, bate: number } | null} r
 */
export function textoProvaSocial(r) {
  if (!r || !Number.isFinite(r.pessoas) || r.pessoas < 10 || !Number.isFinite(r.bate)) return null;
  const x = Math.floor((10 * Math.min(r.bate, r.pessoas)) / r.pessoas);
  if (x < 1) return null;
  return `${x} de cada 10 pessoas disseram que o Manual bate com elas`;
}
