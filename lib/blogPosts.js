// lib/blogPosts.js
// Conteúdo do blog. Pra publicar um post novo: adiciona um objeto no array
// abaixo (o mais recente primeiro) e faz o deploy — sem precisar de painel
// admin nem banco de dados por enquanto.

export const BLOG_POSTS = [
  {
    slug: 'mercurio-retrogrado-setembro',
    title: 'Mercúrio Retrógrado em setembro: o que muda pra cada elemento',
    date: '2026-08-18',
    excerpt: 'Não é hora de evitar tudo — é hora de revisar o que já estava pedindo atenção.',
    cover: 'a',
    coverGlyph: '☿',
    body: `Toda vez que Mercúrio "volta" no céu, alguma coisa se agita: mensagens que se perdem, planos que mudam de última hora, conversas antigas que voltam sem avisar. Mas o retrógrado não é um vilão — é um convite pra revisar o que você andou fazendo rápido demais pra prestar atenção de verdade.

**Signos de Fogo (Áries, Leão, Sagitário)**
Vocês tendem a agir primeiro e pensar depois — nesse período, o universo pede o contrário. Revise decisões tomadas por impulso nas últimas semanas antes de assumir mais compromissos.

**Signos de Terra (Touro, Virgem, Capricórnio)**
Cuidado com contratos, documentos e qualquer coisa que envolva letra miúda. Não é o melhor momento pra assinar nada novo — é o melhor momento pra reler o que já está assinado.

**Signos de Ar (Gêmeos, Libra, Aquário)**
Esse é o retrógrado que mexe mais direto com vocês, já que Mercúrio rege a comunicação. Esperado: mal-entendidos, mensagens que somem, gente do passado reaparecendo. Releia antes de enviar.

**Signos de Água (Câncer, Escorpião, Peixes)**
A confusão aqui é mais emocional do que prática — memórias antigas voltando à tona pedindo processamento, não repetição do mesmo padrão.

De um jeito ou de outro, a regra vale pra todo mundo: revisar, não repetir.`,
  },
  {
    slug: 'lua-cheia-peixes',
    title: 'Lua Cheia em Peixes: como sentir sem se perder',
    date: '2026-08-11',
    excerpt: 'A diferença entre atravessar uma emoção e ser engolida por ela.',
    cover: 'b',
    coverGlyph: '☾',
    body: `Lua Cheia em Peixes é território de sensibilidade máxima — as fronteiras entre o que é seu e o que é do outro ficam mais finas, e é fácil confundir empatia com absorção.

O convite dessa lua não é fechar a torneira do sentimento. É aprender a diferença entre **sentir** (o que atravessa e passa) e **carregar** (o que você guarda pra sempre, mesmo sem precisar).

Três perguntas úteis pra essa fase:
1. Isso que estou sentindo agora é meu, ou eu peguei emprestado de alguém?
2. Se eu deixasse essa emoção passar sem agir nela, o que aconteceria?
3. O que eu preciso soltar que já não faz mais sentido carregar?

Peixes não pede desapego frio — pede discernimento. Sentir fundo continua sendo o seu superpoder. Só não deixa isso virar naufrágio.`,
  },
  {
    slug: 'numerologia-numero-7',
    title: 'Numerologia do mês: o que o número 7 está pedindo de você agora',
    date: '2026-08-04',
    excerpt: 'Profundidade não combina com pressa — e agosto é mês de 7 universal.',
    cover: 'c',
    coverGlyph: '7',
    body: `Quando o mês carrega a vibração do número 7 (ano pessoal, mês universal ou dia), o convite é sempre o mesmo: parar de olhar pra fora em busca de resposta e olhar pra dentro.

O 7 não é um número de ação rápida. É o número da pausa que produz clareza — a introspecção que parece "não estar fazendo nada", mas que na verdade está reorganizando tudo por baixo.

**Se você está num ciclo pessoal de número 7 agora**, alguns sinais comuns:
- Vontade de ficar mais sozinha do que o normal
- Perguntas existenciais aparecendo sem aviso
- Cansaço de coisas superficiais que antes pareciam ok
- Interesse por espiritualidade, estudo, terapia, autoconhecimento

O erro mais comum nesse ciclo é tentar forçar produtividade externa quando o que está sendo pedido é justamente o oposto: menos ruído, mais presença. Se você está sentindo isso, não é preguiça. É o número fazendo o trabalho dele.`,
  },
];

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) || null;
}

export function formatPostDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d} de ${meses[m - 1]}`;
}
