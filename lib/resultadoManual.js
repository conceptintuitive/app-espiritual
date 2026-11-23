// lib/resultadoManual.js
// Textos do bloco "O Manual do seu Mapa" e do FAQ do /resultado/[id]. Puro
// (testado em tests/resultado.test.js). As 14 seções seguem a lista de
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
 * As 14 seções do Manual com o título personalizado.
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
 * 7 dias, cortesia de 30 dias do Manual, teste de 7 dias do Seu Dia).
 * @param {{ testeAtivo: boolean }} o
 */
export function faqResultado({ testeAtivo }) {
  return [
    { q: 'O que é o Manual do seu Mapa?', a: 'Uma leitura de 14 seções escrita a partir do seu nascimento: diagnóstico, amor, dinheiro, arquétipos, ponto cego, rituais, um plano de 7 dias e um calendário de 4 semanas. O seu Mapa grátis é o começo dele.' },
    { q: 'Como eu recebo?', a: 'No Pix, o acesso é liberado na hora e o Manual abre na tela. No cartão, você recebe o link por e-mail em poucos minutos (confira também o spam).' },
    { q: 'E se eu não gostar?', a: 'Garantia de 7 dias: se o Manual não trouxer clareza real sobre o seu padrão, devolvemos 100% do valor. É só pedir pelo e-mail conceptintuitive@gmail.com.' },
    { q: 'O Seu Dia vem junto?', a: testeAtivo
      ? 'O resumo do seu dia é grátis. Ao criar a Minha Área você ganha 7 dias do Seu Dia Completo, sem cartão; quem compra o Manual ganha 30 dias, sem cobrança e sem renovação automática.'
      : 'O resumo do seu dia é grátis. Quem compra o Manual ganha 30 dias do Seu Dia Completo, sem cobrança e sem renovação automática.' },
    { q: 'Preciso saber a hora de nascimento?', a: 'Não. Com a hora e a cidade, o Ascendente e o céu ficam exatos; sem elas, o resto do Manual funciona igual.' },
  ];
}
