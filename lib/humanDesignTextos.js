// lib/humanDesignTextos.js
// Textos amigáveis (PT-BR) pra exibir o resultado de calcularHumanDesign() na
// tela — separado de lib/humanDesign.js pra manter o motor de cálculo livre
// de texto de UI.

export const TIPO_DESCRICAO = {
  Generator: {
    titulo: 'Gerador',
    texto: 'Sua energia de vida é constante e responde ao mundo — o motor sacral funciona melhor reagindo do que iniciando. Você tem mais combustível que a maioria pra sustentar um trabalho, mas só quando ele realmente engaja essa energia; forçar um "sim" pra algo que não te acende de verdade costuma custar caro em frustração e cansaço.',
    comoAgir: 'Espere as coisas virem até você e responda com o corpo, não com a cabeça — um "sim" que dá vontade, ou um "não" que aperta o peito.',
  },
  'Manifesting Generator': {
    titulo: 'Gerador Manifestador',
    texto: 'Você tem a mesma energia de resposta do Gerador, mas com um atalho extra pra iniciativa — quando algo engaja de verdade, seu processo pula etapas que outras pessoas precisam seguir uma a uma. Isso rende eficiência real, mas também mal-entendidos: quem espera um passo a passo tradicional às vezes não acompanha seu ritmo.',
    comoAgir: 'Responda como o Gerador, mas se perceber que já sabe o próximo passo antes de terminar o atual, avise quem está por perto antes de sair executando — evita atrito.',
  },
  Manifestor: {
    titulo: 'Manifestador',
    texto: 'Você é feito pra iniciar, não pra esperar ser convidado. Sua energia não é constante como a de quem tem centro sacral definido — vem em rajadas, e depois de usada, precisa de descanso de verdade. O maior desafio não é ter ideias, é o impacto que gera nas pessoas ao redor quando age sem avisar.',
    comoAgir: 'Antes de agir, informe quem for afetado — não peça permissão, apenas avise. Isso dissolve boa parte da resistência que você normalmente sente vindo de fora.',
  },
  Projector: {
    titulo: 'Projetor',
    texto: 'Você não tem energia constante pra sustentar o ritmo dos tipos motores — mas em compensação, enxerga sistemas e pessoas com uma clareza que a maioria não tem. Sua energia rende melhor guiando do que fazendo em volume, e o reconhecimento certo (o convite certo, na hora certa) muda completamente sua experiência de vida.',
    comoAgir: 'Espere ser reconhecido e convidado antes de se oferecer ou insistir — principalmente em decisões grandes (trabalho, relacionamento). Cuidar do próprio descanso não é preguiça, é estratégia.',
  },
  Reflector: {
    titulo: 'Refletor',
    texto: 'Tipo raro — nenhum centro definido de forma fixa, o que te torna um espelho muito sensível do ambiente ao seu redor. Isso não é fraqueza: é uma capacidade única de sentir a saúde (ou a doença) de um grupo, lugar ou relação antes de qualquer outra pessoa perceber.',
    comoAgir: 'Decisões importantes pedem tempo — idealmente um ciclo lunar inteiro (~28 dias) de observação antes de fechar algo grande. O ambiente em que você está importa mais do que parece.',
  },
};

export const AUTORIDADE_DESCRICAO = {
  'Emocional (Solar Plexus)': {
    titulo: 'Autoridade Emocional',
    texto: 'Suas emoções não são ruído a ser ignorado na hora de decidir — são o próprio processo de decisão. Nenhuma clareza chega no calor do momento; ela vem depois de atravessar a onda emocional inteira, de um pico a um vale (ou vice-versa).',
    comoAgir: 'Nunca decida no "sim" ou "não" da primeira reação, especialmente sob pressão. Durma uma noite (ou mais, se for grande) antes de responder algo importante.',
  },
  Sacral: {
    titulo: 'Autoridade Sacral',
    texto: 'A resposta certa mora no corpo, não na análise. Um "sim" verdadeiro costuma vir como um impulso físico quase imediato; overthinking tende a atropelar esse sinal e substituí-lo por uma resposta mais "razoável", mas menos verdadeira.',
    comoAgir: 'Preste atenção na reação do corpo no primeiro segundo em que a pergunta é feita — antes de a mente entrar com argumentos.',
  },
  'Esplênica (Baço)': {
    titulo: 'Autoridade Esplênica',
    texto: 'Seu sistema de alerta é instantâneo e silencioso — não se repete, não grita, e é fácil de ignorar. É uma percepção ligada à sobrevivência e ao momento presente, não ao raciocínio sobre o passado ou o futuro.',
    comoAgir: 'Confie no primeiro sinal sutil, mesmo sem conseguir explicar racionalmente por quê. Ele não vai insistir uma segunda vez.',
  },
  'Ego Manifestado': {
    titulo: 'Autoridade do Ego (Coração)',
    texto: 'Suas decisões giram em torno de vontade própria e de compromissos que você genuinamente quer assumir — não do que "deveria" fazer por obrigação. Um "sim" real vem acompanhado de vontade de honrar a palavra dada.',
    comoAgir: 'Pergunte a si mesmo se você realmente quer se comprometer com isso — não se consegue, não se deveria, mas se quer.',
  },
  'Autoprojetada (G-Center)': {
    titulo: 'Autoridade Autoprojetada',
    texto: 'Sua clareza aparece ao falar em voz alta, não ao pensar em silêncio. Ouvir a própria voz narrando o assunto pra outra pessoa (mesmo que ela só escute) revela o que você realmente sente sobre o rumo a seguir.',
    comoAgir: 'Fale sobre a decisão com alguém de confiança antes de decidir sozinho na cabeça — preste atenção no tom da própria voz, não só nas palavras.',
  },
  'Lunar (Reflector)': {
    titulo: 'Autoridade Lunar',
    texto: 'Como Refletor, sua clareza não vem de um centro fixo — vem do tempo, acompanhando a Lua em seu ciclo de ~28 dias ao redor do seu mapa. É a autoridade mais lenta e também a mais raramente enganada.',
    comoAgir: 'Para decisões grandes, dê o tempo de um ciclo lunar inteiro antes de fechar — e converse com pessoas de confiança ao longo do caminho, não só no fim.',
  },
  'Mental / Ambiente (sem autoridade interna definida)': {
    titulo: 'Autoridade Mental / Ambiente',
    texto: 'Sem um centro motor conectado à garganta de forma definida, sua clareza tende a vir de fora — do ambiente certo, ou de processar a decisão em voz alta com outras pessoas, mais do que de uma sensação interna isolada.',
    comoAgir: 'Evite decidir sozinho e em silêncio. Busque conversar com 2-3 pessoas de confiança e observe em qual ambiente a decisão parece mais clara.',
  },
};

export function narracaoHumanDesign(hd) {
  if (!hd) return '';
  const tipo = TIPO_DESCRICAO[hd.tipo];
  const autoridade = AUTORIDADE_DESCRICAO[hd.autoridade];
  const parts = [
    `Seu Tipo é ${tipo?.titulo ?? hd.tipo}.`,
    tipo?.texto ?? '',
    `Sua Autoridade é ${autoridade?.titulo ?? hd.autoridade}.`,
    autoridade?.texto ?? '',
    `Seu Perfil é ${hd.perfil}.`,
  ];
  return parts.filter(Boolean).join(' ');
}
