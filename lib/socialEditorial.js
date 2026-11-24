// lib/socialEditorial.js — guia editorial da automação social e as séries de
// conteúdo que não vêm das tabelas do Manual. Puro (sem rede, sem banco).
// Usado no prompt da IA (lib/socialIA.js), na revisão automática e no texto de
// reserva quando a IA falha (lib/social.js). Testes em tests/social.test.js.
//
// Regra de ouro: a IA ESCREVE, os DADOS vêm daqui e dos cálculos do site.
// Número, signo, nota de compatibilidade, citação, estudo: nunca inventados.

// ── Guia (vai inteiro no system prompt) ────────────────────────────────────
export const GUIA_EDITORIAL = `Você escreve os posts do Instagram da Intuitive Concept, uma marca brasileira de autoconhecimento (numerologia, astrologia, arquétipos, Kin Maia, anjos) com um pé na psicologia e na neurociência.

TOM
- O mesmo do Manual e do blog: direto, específico, em português do Brasil coloquial, segunda pessoa ("você").
- Nada de frase de horóscopo genérico ("um dia de boas energias", "o universo conspira"). Cada frase tem que ser específica do dado do dia.
- Sem hedge: nunca "talvez", "pode ser que", "quem sabe". Afirme com clareza o que é a leitura simbólica, e deixe claro quando é símbolo.
- Frases curtas. Cada tela do carrossel é lida em 3 segundos num celular.

ESTRUTURA DE TODO POST
1. Gancho de identificação na 1ª frase, que faz a pessoa pensar "isso sou eu". Modelos: "Se você é 7, você provavelmente…", "Ninguém te conta que…", "O erro mais comum de quem…".
2. Um MECANISMO: por que esse padrão acontece (a lógica por trás, não só a descrição).
3. Um exemplo concreto, de vida real (trabalho, relação, dinheiro, rotina), sem nomes de pessoas.
4. Uma virada que contradiz o senso comum sobre o tema.
5. Uma prática de 1 frase pra fazer hoje, simples e possível.
6. Chamada final: "Faz o seu mapa grátis: link na bio".

PROIBIDO
- Promessa de cura, de dinheiro ou de resultado ("vai atrair", "garante", "cura", "enriquece").
- Diagnóstico ou conselho de saúde, física ou mental. Nada de "isso é ansiedade/depressão/TDAH".
- Fatalismo: "você nunca vai…", "está destinada a…", "não tem jeito".
- Afirmação científica falsa ou exagerada ("comprovado pela física quântica", "a ciência prova que o pensamento cria a realidade").
- Quando falar de neurociência, psicologia ou de um pensador: separe com clareza o que a pesquisa sustenta do que é crença, tradição ou linguagem simbólica. Use SÓ o que estiver nos dados sobre ciência; não cite estudo, autor ou número que não esteja nos dados.
- Citação: só a que vier nos dados, palavra por palavra, com o autor. Nunca invente nem "melhore" uma citação. Sem citação nos dados = sem citação no post.
- Nunca dizer ou sugerir que um pensador, autor ou cientista recomenda o site.
- Emojis.

VOCABULÁRIO DA MARCA
- "Mapa" = o resultado GRÁTIS do site. "Manual do seu Mapa" = o produto PAGO.
- Proibido como nome de produto: "diagnóstico completo", "análise completa", "mapa completo".
- A chamada é sempre "Faz o seu mapa grátis: link na bio".`;

export const CHECKLIST_REVISAO = `Revise o post contra o guia. Reprove se QUALQUER item falhar:
1. Genérico: alguma frase serviria pra qualquer número/signo/tema? (efeito Barnum)
2. Promessa de cura, dinheiro ou resultado, ou conselho de saúde.
3. Fatalismo ou hedge ("talvez", "pode ser que", "nunca vai").
4. Erro de dado: número, signo, nota, data, Lua, Kin, autor ou citação diferente dos DADOS, ou algo inventado que não está nos DADOS (estudo, porcentagem, citação, nome).
5. Ciência: afirmou como comprovado algo que os DADOS tratam como crença ou simbólico.
6. Faltou alguma parte da estrutura (gancho de identificação, mecanismo, exemplo concreto, virada, prática de 1 frase).
7. Vocabulário da marca errado ou emoji.
8. Texto grande demais pra tela (título > 80 caracteres, texto > 300).`;

// ── Mente e ciência (quarta) ────────────────────────────────────────────────
// Cada item: o mecanismo, o que a pesquisa sustenta (com o tamanho certo da
// evidência), o símbolo que conecta com o site, e um texto de reserva pronto
// (gancho → mecanismo → exemplo → virada → prática).
export const MECANISMOS = [
  {
    id: 'confirmacao', nome: 'Viés de confirmação', simbolo: 'o seu signo',
    ciencia: 'Bem estabelecido na psicologia: a mente procura, nota e lembra mais o que confirma o que já acredita.',
    gancho: 'Ninguém te conta que a história que você conta sobre você mesma escolhe o que você enxerga.',
    mecanismo: 'O viés de confirmação faz a mente notar e lembrar mais o que confirma a crença que você já tem. O resto passa batido.',
    exemplo: 'Quem se acha "azarada no amor" lembra de cada fora e esquece cada pessoa que se interessou e foi ignorada.',
    virada: 'Por isso um mapa não serve pra te rotular: serve pra escolher, de propósito, o que você vai observar.',
    pratica: 'Hoje, anote 3 fatos que contradizem a frase que você mais repete sobre você.',
  },
  {
    id: 'profecia', nome: 'Profecia autorrealizável', simbolo: 'a Lua (expectativa)',
    ciencia: 'Conceito clássico da sociologia (Merton): a expectativa muda o comportamento, que muda o resultado. O tamanho do efeito varia bastante entre estudos.',
    gancho: 'O erro mais comum de quem espera rejeição é se comportar como quem já foi rejeitada.',
    mecanismo: 'Expectativa muda comportamento: quem espera ser ignorada fala menos, sorri menos, se expõe menos. E aí é ignorada de verdade.',
    exemplo: 'Você entra na reunião certa de que sua ideia vai ser cortada, apresenta pela metade, e ela é cortada.',
    virada: 'A previsão não adivinhou o futuro. Ela fabricou o futuro.',
    pratica: 'Antes do próximo encontro importante, escreva o que você faria se tivesse certeza de que vai dar certo, e faça só isso.',
  },
  {
    id: 'barnum', nome: 'Efeito Barnum', simbolo: 'o horóscopo genérico',
    ciencia: 'Bem documentado (Forer, 1949): as pessoas aceitam descrições vagas como se fossem feitas sob medida pra elas.',
    gancho: 'Se um horóscopo "acertou em cheio" sobre você, desconfie dele.',
    mecanismo: 'O efeito Barnum: frases vagas ("você é forte, mas às vezes inseguro") servem pra quase todo mundo, e a mente sente como pessoais.',
    exemplo: 'Leia "você tem um potencial que ainda não usou" e tente achar alguém pra quem isso não vale.',
    virada: 'Leitura simbólica boa é específica: ela arrisca dizer algo que poderia estar errado sobre você.',
    pratica: 'Hoje, diante de qualquer conselho sobre você, pergunte: isso valeria pra qualquer pessoa?',
  },
  {
    id: 'habito', nome: 'Loop do hábito', simbolo: 'o número 4 (estrutura)',
    ciencia: 'Pesquisas sobre hábitos (Wendy Wood e outros) estimam que uma parte grande das ações do dia é feita no automático, disparada por contexto. O modelo gatilho-rotina-recompensa é uma simplificação útil.',
    gancho: 'Se você "não tem força de vontade", você provavelmente está brigando com o gatilho errado.',
    mecanismo: 'Hábito é contexto + rotina + recompensa. O gatilho (lugar, hora, emoção) dispara a ação antes de você decidir.',
    exemplo: 'O celular na mesa de cabeceira decide mais o seu início de dia do que qualquer meta de ano novo.',
    virada: 'Mudar o ambiente rende mais do que tentar ser mais disciplinada.',
    pratica: 'Hoje, mude de lugar uma coisa que dispara um hábito que você quer largar.',
  },
  {
    id: 'respiracao', nome: 'Sistema nervoso e respiração', simbolo: 'a Lua (emoção)',
    ciencia: 'A respiração lenta, com expiração mais longa, está associada a mais atividade parassimpática (o modo de descanso). Os efeitos são reais, mas moderados, e não substituem tratamento.',
    gancho: 'Ninguém te conta que você não consegue pensar com clareza com o corpo em modo de alerta.',
    mecanismo: 'Em alerta, o sistema nervoso prioriza reagir, não refletir. A respiração é um dos poucos controles desse sistema que estão na sua mão.',
    exemplo: 'A resposta atravessada na mensagem do trabalho sai em 10 segundos de alerta, não de quem você é.',
    virada: 'Às vezes o problema não é o que você pensa. É o estado do corpo em que você está pensando.',
    pratica: 'Antes de responder algo que te irritou hoje, faça 5 respirações com a expiração mais longa que a inspiração.',
  },
  {
    id: 'nomear', nome: 'Nomear a emoção', simbolo: 'a Lua em signos de Água',
    ciencia: 'Estudos de laboratório (Lieberman e colegas, 2007) mostram que pôr a emoção em palavras reduz a reatividade emocional no momento. É um efeito de curto prazo, medido em laboratório.',
    gancho: 'Se você sente tudo muito forte, você provavelmente está sentindo sem nomear.',
    mecanismo: 'Pôr a emoção em palavras ("isso é frustração", "isso é medo de ficar de fora") diminui a intensidade da reação na hora.',
    exemplo: 'O aperto no peito vira "estou com ciúme porque não fui chamada". E o aperto diminui.',
    virada: 'Não é ignorar o que sente. É ser específica sobre o que sente.',
    pratica: 'Hoje, quando uma emoção forte vier, diga pra você mesma o nome exato dela, em uma palavra.',
  },
  {
    id: 'intencao', nome: 'Intenção "se… então"', simbolo: 'o seu Ano Pessoal (planos)',
    ciencia: 'Uma das técnicas mais testadas da psicologia (Gollwitzer): planos no formato "se X acontecer, então eu faço Y" aumentam bastante a chance de cumprir o que se quer.',
    gancho: 'O erro mais comum de quem tem muitos planos é não decidir QUANDO vai fazer.',
    mecanismo: 'Intenção vaga ("vou meditar") compete com tudo. Intenção amarrada a um gatilho ("depois do café, sento 5 minutos") roda quase sozinha.',
    exemplo: '"Vou guardar dinheiro" não acontece. "Se o salário cair, transfiro 10% no mesmo dia" acontece.',
    virada: 'Motivação é a parte menos importante do plano.',
    pratica: 'Hoje, reescreva uma meta no formato: "Se [momento], então eu [ação]".',
  },
  {
    id: 'plasticidade', nome: 'Neuroplasticidade', simbolo: 'a onda de 13 dias do Kin',
    ciencia: 'O cérebro muda com a prática repetida (neuroplasticidade): isso é bem estabelecido. O que não é comprovado: que pensar sozinho muda o corpo ou o DNA, como prometem alguns autores.',
    gancho: 'Ninguém te conta que "eu sou assim" é, em boa parte, "eu pratiquei muito ser assim".',
    mecanismo: 'Caminhos que você repete ficam mais fáceis de repetir. Cada vez que você reage igual, o mesmo caminho fica mais rápido.',
    exemplo: 'Quem pede desculpa por tudo não nasceu assim: treinou por anos, todos os dias.',
    virada: 'A boa notícia é a mesma: o que foi treinado pode ser treinado de outro jeito, com repetição, não com um insight.',
    pratica: 'Escolha uma reação pequena pra treinar diferente nos próximos 13 dias, e comece hoje.',
  },
  {
    id: 'atencao', nome: 'Atenção seletiva', simbolo: 'a manifestação',
    ciencia: 'Atenção seletiva é bem estabelecida: o cérebro filtra a maior parte do que vê e prioriza o que é relevante pra você. A versão popular de que um "sistema" do cérebro atrai o que você deseja é uma simplificação sem base.',
    gancho: 'Se você decidiu comprar um carro vermelho, você provavelmente começou a ver carro vermelho em todo lugar.',
    mecanismo: 'O cérebro filtra quase tudo o que vê. Quando algo fica importante pra você, ele passa a deixar isso entrar.',
    exemplo: 'Os carros vermelhos sempre estiveram lá. O que mudou foi o que você estava procurando.',
    virada: 'Clareza de intenção não atrai coisas magicamente: faz você notar oportunidades que já estavam na sua frente.',
    pratica: 'Hoje, escreva em uma frase o que você quer encontrar, e repare no que aparece até a noite.',
  },
  {
    id: 'negatividade', nome: 'Viés de negatividade', simbolo: 'Saturno e a sombra',
    ciencia: 'Bem documentado: informações e experiências negativas pesam mais na mente do que positivas de mesma intensidade.',
    gancho: 'Ninguém te conta que uma crítica pesa mais que dez elogios por um motivo antigo.',
    mecanismo: 'O viés de negatividade: a mente dá mais peso ao que ameaça do que ao que agrada. Foi útil pra sobreviver, não pra ser feliz.',
    exemplo: 'O dia teve 9 coisas boas e 1 comentário atravessado. Adivinha o que você vai contar no jantar.',
    virada: 'Lembrar do bom não é positividade forçada. É corrigir uma balança que já vem torta.',
    pratica: 'Hoje à noite, anote uma coisa que deu certo e o que você fez pra ela dar certo.',
  },
  {
    id: 'autocompaixao', nome: 'Autocompaixão', simbolo: 'o número 6 (cuidado)',
    ciencia: 'Estudos de psicologia (Kristin Neff, Breines e Chen, 2012) associam tratar o próprio erro com gentileza a mais motivação pra melhorar, e não a menos.',
    gancho: 'Se você é dura com você mesma "pra não se acomodar", isso provavelmente está te travando.',
    mecanismo: 'Autocrítica pesada ativa vergonha, e vergonha faz a gente esconder o erro em vez de corrigir.',
    exemplo: 'Errou no orçamento do mês e passou a evitar olhar o extrato. A bronca não consertou nada.',
    virada: 'Gentileza com o erro não é passar pano: é o que deixa você olhar pra ele de frente.',
    pratica: 'Hoje, fale do seu último erro como falaria com uma amiga que errou a mesma coisa.',
  },
  {
    id: 'distancia', nome: 'Falar consigo na 3ª pessoa', simbolo: 'Mercúrio (a mente que conversa)',
    ciencia: 'Estudos de Ethan Kross mostram que falar consigo mesma pelo próprio nome, em vez de "eu", ajuda a pensar com mais distância em situações de estresse.',
    gancho: 'O erro mais comum de quem rumina é conversar consigo na 1ª pessoa.',
    mecanismo: 'Usar o próprio nome ("Ana, o que você vai fazer?") cria distância, e com distância a gente aconselha melhor, como faria com outra pessoa.',
    exemplo: '"Eu não aguento mais" trava. "Ana, qual é o próximo passo?" mexe.',
    virada: 'Não é se afastar de você. É sair da cabeça pra conseguir ajudar a si mesma.',
    pratica: 'Hoje, na próxima preocupação, pergunte a você mesma pelo seu nome qual é o próximo passo.',
  },
  {
    id: 'luz', nome: 'Luz da manhã e ritmo do corpo', simbolo: 'o Sol',
    ciencia: 'A exposição à luz natural de manhã ajuda a alinhar o relógio biológico (ritmo circadiano), que regula sono e energia. Efeito bem estabelecido.',
    gancho: 'Ninguém te conta que a sua noite começa às 8 da manhã.',
    mecanismo: 'A luz da manhã acerta o relógio interno do corpo, que decide a que horas você vai sentir sono à noite.',
    exemplo: 'Dia inteiro em ambiente fechado e tela até tarde: o corpo não sabe que horas são, e o sono atrasa.',
    virada: 'Às vezes o que parece falta de disciplina pra dormir é falta de Sol pra acordar.',
    pratica: 'Amanhã, fique 10 minutos na luz do dia antes de olhar o celular.',
  },
  {
    id: 'yerkes', nome: 'Pressão na medida certa', simbolo: 'Marte (impulso)',
    ciencia: 'A relação clássica de Yerkes-Dodson: um pouco de ativação melhora o desempenho, ativação demais piora. É um modelo simplificado, mas útil.',
    gancho: 'Se você só funciona "no desespero", você provavelmente está pagando caro por isso.',
    mecanismo: 'Um pouco de pressão foca. Pressão demais estreita a atenção e faz errar no que você sabe fazer.',
    exemplo: 'Deixar o projeto pra véspera funciona até o dia em que o arquivo não abre.',
    virada: 'Você não precisa de mais pressão. Precisa de prazos menores e mais cedo.',
    pratica: 'Hoje, crie um prazo falso pra amanhã em algo que vence na semana que vem.',
  },
  {
    id: 'exposicao', nome: 'Efeito de mera exposição', simbolo: 'Vênus (o que atrai)',
    ciencia: 'Bem documentado (Zajonc): a gente tende a gostar mais do que é familiar, só por ver com frequência.',
    gancho: 'Ninguém te conta que o "tipo" que você atrai às vezes é só o tipo que te é familiar.',
    mecanismo: 'A mente confunde familiar com seguro. O que você conhece desde cedo parece "certo", mesmo quando não faz bem.',
    exemplo: 'Quem cresceu tendo que conquistar atenção sente química justamente por quem dá atenção pela metade.',
    virada: 'Química forte nem sempre é sinal de combinar. Às vezes é sinal de repetir.',
    pratica: 'Hoje, liste 3 traços das pessoas que mais te atraíram e veja quais você já conhecia de casa.',
  },
  {
    id: 'identidade', nome: 'Identidade e hábito', simbolo: 'o seu número de vida',
    ciencia: 'Há estudos sugerindo que se ver como "alguém que faz X" ajuda a manter o comportamento, mas os resultados são mistos e alguns não se repetiram. Vale como ferramenta, não como lei.',
    gancho: 'O erro mais comum de quem quer mudar é mirar no resultado e não em quem vai fazer.',
    mecanismo: '"Quero correr 5 km" é uma meta. "Sou alguém que se mexe todo dia" é uma identidade, e cada ação pequena vira um voto nela.',
    exemplo: 'Dois minutos de caminhada não mudam o corpo. Mudam a história que você conta sobre você.',
    virada: 'A ação pequena não é pouco: é prova.',
    pratica: 'Hoje, faça a versão de 2 minutos de quem você quer ser.',
  },
];

// ── Pensadores (sexta) ─────────────────────────────────────────────────────
// Ideia central em linguagem simples + como aplicar + o cuidado (o que é crença
// e o que a pesquisa sustenta). Citação só quando temos fonte; tradução livre.
// Nada aqui sugere que algum autor recomenda o site.
export const PENSADORES = [
  {
    id: 'jung-sombra', autor: 'Carl Jung', ideia: 'A sombra',
    resumo: 'Partes de você que você rejeita não somem: ficam fora da consciência e aparecem projetadas nos outros, no que te irrita demais.',
    aplicar: 'Quando alguém te irritar de um jeito desproporcional, pergunte que parte disso você não se permite.',
    cuidado: 'Conceito da psicologia analítica: uma lente simbólica pra se observar, não um fato medido em laboratório.',
    citacao: { texto: 'Quem olha para fora, sonha; quem olha para dentro, desperta.', fonte: 'Carl Jung, carta de 1916 (tradução livre)' },
  },
  {
    id: 'jung-sincronicidade', autor: 'Carl Jung', ideia: 'Sincronicidade',
    resumo: 'Coincidências que parecem ter sentido: dois acontecimentos sem causa comum que você liga pelo significado.',
    aplicar: 'Anote as coincidências da semana e pergunte o que elas apontam em você, não fora.',
    cuidado: 'Ideia simbólica de Jung. A ciência explica muitas coincidências por acaso e atenção seletiva; o valor está na pergunta que ela provoca.',
  },
  {
    id: 'neville-fim', autor: 'Neville Goddard', ideia: 'Viver no fim',
    resumo: 'Imaginar, com sensação, a cena do desejo já realizado, como se fosse agora.',
    aplicar: 'Imagine por 1 minuto a cena do objetivo cumprido e, em seguida, anote o primeiro passo concreto pra chegar nela.',
    cuidado: 'É uma crença espiritual. O que a psicologia sustenta: ensaiar mentalmente ajuda; só fantasiar o resultado, sem plano, pode diminuir o esforço (pesquisas de Gabriele Oettingen).',
    citacao: { texto: 'O sentimento é o segredo.', fonte: 'Neville Goddard, título do livro de 1944 (tradução livre)' },
  },
  {
    id: 'neville-revisao', autor: 'Neville Goddard', ideia: 'A revisão',
    resumo: 'À noite, rever uma cena do dia que deu errado e reimaginar como você gostaria de ter agido.',
    aplicar: 'Antes de dormir, escolha uma cena do dia e ensaie mentalmente a resposta que você queria ter dado.',
    cuidado: 'Neville via a revisão como forma de mudar a realidade, o que é crença. O ensaio mental como preparo pra próxima vez tem apoio na psicologia do esporte.',
  },
  {
    id: 'dispenza-habito', autor: 'Joe Dispenza', ideia: 'O hábito de ser você mesma',
    resumo: 'A personalidade é, em parte, um conjunto de pensamentos, emoções e ações repetidos todos os dias até ficarem automáticos.',
    aplicar: 'Repare numa reação que você tem todo dia e faça, hoje, uma pequena versão diferente dela.',
    cuidado: 'Que hábitos e reações são treináveis é bem sustentado. Afirmações dele de que o pensamento, sozinho, muda o corpo, com base em termos da física moderna, não têm sustentação científica.',
  },
  {
    id: 'dispenza-pausa', autor: 'Joe Dispenza', ideia: 'Observar antes de reagir',
    resumo: 'Meditar treina perceber o pensamento antes de ser levada por ele, e isso abre espaço pra escolher outra resposta.',
    aplicar: 'Sente 5 minutos hoje e só conte quantas vezes a mente fugiu. Perceber já é o treino.',
    cuidado: 'Meditação tem efeitos moderados e documentados sobre estresse e atenção. Promessas maiores ficam no campo da crença.',
  },
  {
    id: 'watts-inseguranca', autor: 'Alan Watts', ideia: 'A sabedoria da insegurança',
    resumo: 'Buscar segurança total gera mais angústia, porque a vida muda o tempo todo. A saída é parar de brigar com a mudança.',
    aplicar: 'Escolha uma incerteza de hoje e, em vez de tentar controlar o resultado, decida só o próximo passo.',
    cuidado: 'Filosofia, não ciência. Conversa com terapias modernas baseadas em aceitação, que têm boa evidência.',
    citacao: { texto: 'A única maneira de entender a mudança é mergulhar nela, mover-se com ela e entrar na dança.', fonte: 'Alan Watts, A Sabedoria da Insegurança, 1951 (tradução livre)' },
  },
  {
    id: 'watts-musica', autor: 'Alan Watts', ideia: 'A vida não é uma corrida até o fim',
    resumo: 'A gente trata a vida como preparação pra algo que vem depois, como se a música só valesse no último acorde.',
    aplicar: 'Faça uma tarefa de hoje sem pensar no que vem depois dela, só nela.',
    cuidado: 'Ideia filosófica. O que a pesquisa sustenta é que atenção ao momento presente se associa a mais bem-estar.',
  },
  {
    id: 'murphy-repeticao', autor: 'Joseph Murphy', ideia: 'O poder do subconsciente',
    resumo: 'O que você repete com emoção, principalmente antes de dormir, vira o modo automático da mente.',
    aplicar: 'Antes de dormir, repita uma frase sobre você que seja ao mesmo tempo boa e crível.',
    cuidado: 'Murphy promete saúde e dinheiro pelo pensamento, o que não tem base. Atenção: estudos (Wood e colegas, 2009) mostram que afirmações exageradas podem piorar o humor de quem tem autoestima baixa. Por isso: crível.',
  },
  {
    id: 'murphy-preocupacao', autor: 'Joseph Murphy', ideia: 'Preocupação é imaginação ao contrário',
    resumo: 'Se preocupar é usar a imaginação pra ensaiar o que você não quer.',
    aplicar: 'Na próxima preocupação, termine a cena: o que você faria se aquilo acontecesse?',
    cuidado: 'Ideia de autoajuda. Pensar no plano pro pior cenário, em vez de só ruminar, é uma técnica usada em terapia.',
  },
  {
    id: 'shinn-bumerangue', autor: 'Florence Scovel Shinn', ideia: 'O jogo do bumerangue',
    resumo: 'O que você manda pro mundo, em palavra e atitude, tende a voltar pra você.',
    aplicar: 'Hoje, faça por alguém, sem anunciar, o que você gostaria que fizessem por você.',
    cuidado: 'Crença espiritual. O que a psicologia social sustenta é a reciprocidade: gentileza tende a gerar gentileza.',
    citacao: { texto: 'O jogo da vida é um jogo de bumerangues.', fonte: 'Florence Scovel Shinn, O Jogo da Vida e Como Jogá-lo, 1925 (tradução livre)' },
  },
  {
    id: 'shinn-palavra', autor: 'Florence Scovel Shinn', ideia: 'A palavra como decreto',
    resumo: 'Falar o tempo todo do que você teme é ensaiar o medo em voz alta.',
    aplicar: 'Repare hoje em quantas vezes você descreve a sua vida pelo que dá errado, e troque uma delas.',
    cuidado: 'Crença sobre o poder das palavras. O que se sustenta: a forma como a gente se descreve influencia o próprio comportamento e humor.',
  },
  {
    id: 'hay-aprovacao', autor: 'Louise Hay', ideia: 'Se aprovar',
    resumo: 'Décadas de autocrítica não fizeram você mudar. A proposta dela é testar o contrário: se aprovar.',
    aplicar: 'Hoje, diga uma frase gentil sobre você olhando no espelho, mesmo que soe estranho.',
    cuidado: 'Ela também atribuía causas emocionais a doenças, o que não tem base científica: isso não entra aqui. A autocompaixão, sim, tem boa pesquisa por trás.',
    citacao: { texto: 'Você vem se criticando há anos e não funcionou. Experimente se aprovar e veja o que acontece.', fonte: 'Louise Hay, 1984 (tradução livre)' },
  },
  {
    id: 'hay-afirmacao', autor: 'Louise Hay', ideia: 'Afirmações no presente',
    resumo: 'Falar de você no presente, como quem já está a caminho.',
    aplicar: 'Troque "eu preciso parar de…" por "eu estou aprendendo a…", numa frase de hoje.',
    cuidado: 'Afirmações funcionam melhor quando são críveis; frases exageradas podem ter efeito contrário (Wood e colegas, 2009).',
  },
  {
    id: 'tolle-agora', autor: 'Eckhart Tolle', ideia: 'Você não é os seus pensamentos',
    resumo: 'Existe quem pensa e quem percebe que está pensando. Perceber cria uma distância que acalma.',
    aplicar: 'Hoje, quando a mente acelerar, diga por dentro: "olha o pensamento".',
    cuidado: 'Linguagem espiritual. Práticas de atenção plena, que vão na mesma direção, têm efeitos moderados e documentados.',
    citacao: { texto: 'Perceba profundamente que o momento presente é tudo o que você tem.', fonte: 'Eckhart Tolle, O Poder do Agora, 1997 (tradução livre)' },
  },
  {
    id: 'tolle-dor', autor: 'Eckhart Tolle', ideia: 'O corpo de dor',
    resumo: 'Dores emocionais antigas viram um padrão que se reacende com pouca coisa, e a reação é maior que o fato.',
    aplicar: 'Na próxima reação desproporcional, repare onde ela aparece no corpo antes de responder.',
    cuidado: 'Metáfora espiritual, não conceito médico. Reconhecer padrões emocionais antigos é parte de várias abordagens de terapia.',
  },
];

// ── Relações (quinta): pares de signos ─────────────────────────────────────
const SIGNOS_ORDEM = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];

/** Os 78 pares (com o mesmo signo duas vezes), embaralhados de forma fixa. */
export const PARES_SIGNOS = (() => {
  const todos = [];
  for (let i = 0; i < 12; i++) for (let j = i; j < 12; j++) todos.push([SIGNOS_ORDEM[i], SIGNOS_ORDEM[j]]);
  // 29 é primo com 78: k → (k*29) % 78 percorre todos sem repetir e não deixa
  // semanas seguidas com o mesmo signo de abertura.
  return todos.map((_, k) => todos[(k * 29) % todos.length]);
})();

// ── Validação automática (depois da IA e da revisão) ───────────────────────
export const PROIBIDOS = [
  { re: /\bcur(a|ar|ou|e|am)\b/i, motivo: 'promessa de cura' },
  { re: /\bgaranti\w*|\bgarante\b/i, motivo: 'promessa de resultado' },
  { re: /\benriquec\w*|\bficar ric[ao]\b|\bmilion[aá]ri\w*/i, motivo: 'promessa de dinheiro' },
  { re: /\btalvez\b|\bpode ser que\b|\bquem sabe\b/i, motivo: 'hedge' },
  { re: /\b(nunca|jamais) (vai|vão|irá|irão|conseguir\w*)\b|\bestá destinad[ao]\b|\bnão tem jeito\b/i, motivo: 'fatalismo' },
  { re: /\bf[ií]sica qu[aâ]ntica\b|\b(a ci[eê]ncia|cientificamente) (prova|provado|comprova)\w*/i, motivo: 'ciência falsa' },
  { re: /\bdiagn[oó]stico completo\b|\ban[aá]lise completa\b|\bmapa completo\b/i, motivo: 'vocabulário da marca' },
  { re: /\b(ansiedade|depress[aã]o|tdah|transtorno)\b/i, motivo: 'tema de saúde' },
  { re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u, motivo: 'emoji' },
];

/** Problemas de um texto contra a lista de proibidos. */
export function problemasDoTexto(texto) {
  const t = String(texto || '');
  return PROIBIDOS.filter((p) => p.re.test(t)).map((p) => p.motivo);
}
