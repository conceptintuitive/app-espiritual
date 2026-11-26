// lib/blogPosts.js
// Conteúdo do blog. Pra publicar um post novo: adiciona um objeto no array
// abaixo (o mais recente primeiro) e faz o deploy — sem precisar de painel
// admin nem banco de dados por enquanto. A capa (céu real sobre Brasília às
// 21h da `date`) e a imagem OG saem sozinhas no build (lib/blogCapa.js).
//
// Campos: slug, categoria (id de CATEGORIAS), date (YYYY-MM-DD), title,
// excerpt, coverGlyph (vai grande na capa), body (parágrafos separados por
// linha em branco; uma linha inteira em **negrito** vira intertítulo; linhas
// com "- " viram lista). Opcionais: `numero` (Números: o número do post, pro
// bloco interativo) e `signo` (Signos: "Onde <signo> cai no seu mapa?").
// `cover` (a/b/c/d) é do visual antigo e não é mais usado.

// Ordem = ordem do filtro no /blog.
export const CATEGORIAS = [
  { id: 'signos', rotulo: 'Signos' },
  { id: 'numeros', rotulo: 'Números' },
  { id: 'taro', rotulo: 'Tarô' },
  { id: 'principios', rotulo: 'Princípios' },
  { id: 'lua', rotulo: 'Lua e trânsitos' },
  { id: 'mente', rotulo: 'Mente e manifestação' },
];

export const BLOG_POSTS = [
  {
    slug: 'temporada-de-sagitario-2026',
    categoria: 'signos',
    signo: 'Sagitário',
    title: 'Sol em Sagitário: por que a liberdade que todo mundo admira vira fuga sem ninguém perceber',
    date: '2026-11-23',
    excerpt: 'O signo mais empolgado do zodíaco tem um ponto cego: confundir tédio com desalinhamento real.',
    cover: 'b',
    coverGlyph: '♐',
    body: `Todo ano, por volta de 22 de novembro, o Sol entra em Sagitário e o estereótipo de sempre aparece: "chegou o signo da aventura, da sorte, do povo que não compromete com nada". É a leitura mais rasa possível de um signo cujo motor real não é inconstância — é busca genuína por sentido, e a recusa de viver uma vida que pareça pequena demais pra caber tudo que quer experimentar.

**O que a inquietação de Sagitário realmente é**
Sagitário não muda de direção por tédio raso. Muda porque enxerga, com clareza incômoda, quando um caminho parou de fazer sentido — e continuar nele, só por inércia, parece desperdício de vida maior do que o desconforto de recomeçar. O que de fora parece falta de compromisso é, por dentro, recusa de fingir entusiasmo por algo que já morreu internamente.

**O mal-entendido mais caro**
É achar que o problema de Sagitário é não terminar nada. Quase nunca é isso — é começar com intensidade real e, no meio do caminho, confundir o peso normal de qualquer processo (a parte chata, repetitiva, sem brilho) com sinal de que aquilo não era pra ser. Sagitário sai correndo da sensação de peso, não necessariamente do projeto errado. E boa parte das vezes era o projeto certo, só numa fase que ainda não tinha ficado interessante de novo.

**O que essa temporada realmente pede**
Não é prometer terminar tudo que começar daqui pra frente — isso trairia o próprio motor do signo. É aprender a diferenciar tédio de desalinhamento real, antes de abandonar. Visão só vira realidade quando vira repetição: a mesma energia que gera a ideia brilhante é quem precisa aparecer de novo, no dia sem graça, pra ela sair do papel.

**Como isso aparece na prática**
- Começar vários projetos ao mesmo tempo e perder o fôlego no meio
- Confundir liberdade com ausência total de estrutura
- Falar verdades sem filtro e se surpreender com a reação de quem ouviu
- Idealizar o próximo capítulo em vez de sustentar o atual até ele dar fruto

O convite de Sagitário não é encolher a visão pra caber numa rotina qualquer — é fazer a visão descer pro chão, com repetição suficiente pra virar resultado real, não só começo empolgado. Onde exatamente essa fuga do peso aparece com mais força pra você — trabalho, relação, dinheiro — Sagitário sozinho não mostra. Isso depende de outras posições no seu mapa pessoal.`,
  },
  {
    slug: 'tarot-arcano-o-diabo',
    categoria: 'taro',
    title: 'O Diabo no tarot: a carta mais satanizada do baralho fala de corrente, não de maldade',
    date: '2026-11-16',
    excerpt: 'As figuras acorrentadas na carta podem tirar a corrente do pescoço a qualquer momento — e quase nunca percebem isso.',
    cover: 'a',
    coverGlyph: 'XV',
    body: `Poucas cartas carregam tanto preconceito quanto O Diabo. Basta o nome — ninguém quer ouvir "saiu Diabo na sua leitura" e continuar tranquila. A imagem reforça o medo: um ser com chifres, duas figuras acorrentadas aos pés dele, fogo ao fundo. Parece anúncio de desgraça. E é exatamente aí que a leitura mais comum erra o alvo — essa carta não fala sobre o mal. Fala sobre corrente que você mesma aceitou carregar.

**O detalhe que ninguém repara na imagem**
Olhe outra vez pro par acorrentado aos pés da figura: as correntes em volta do pescoço deles estão largas o suficiente pra tirar sozinho, sem ajuda de ninguém. Não é prisão de verdade. É prisão que parece definitiva só porque ninguém nunca testou se dava pra sair. O Diabo não aprisiona — ele representa o momento em que você esquece que a saída sempre esteve disponível.

**O mal-entendido mais caro**
É tratar a carta como aviso de tentação externa, tipo "cuidado com influência ruim por perto". Quase nunca é isso. O vício, o padrão tóxico, a relação que drena, o trabalho que consome — eles não prendem por força. Prendem porque parecem mais seguros do que a incerteza de largar, mesmo custando caro todo santo dia. A corrente é confortável o suficiente pra nunca ser testada.

**Por que é tão difícil perceber a corrente própria**
Porque ela raramente chega de uma vez — chega em doses pequenas, cada uma parecendo razoável isoladamente. Um vício não começa viciante. Uma relação tóxica não começa tóxica. O acordo com o conforto de hoje vai se acumulando até virar um padrão que parece parte de quem você é, não uma escolha que ainda pode ser revista.

O convite dessa carta não é parar de usar nada que dê prazer, nem terminar toda relação difícil — é testar, de verdade, se a corrente que você carrega ainda está presa ou só parece estar. Onde especificamente essa corrente tende a se formar com mais força na sua vida — hábito, relação, trabalho, dinheiro — o seu mapa pessoal mostra com mais precisão do que qualquer carta isolada.`,
  },
  {
    slug: 'numerologia-numero-8',
    categoria: 'numeros',
    numero: 8,
    title: 'Número 8 na numerologia: o "número do dinheiro" não é sobre sorte nenhuma',
    date: '2026-11-09',
    excerpt: 'Ninguém fica rico por acidente numerológico. O 8 fala de poder construído, não de sorte caída do céu.',
    cover: 'd',
    coverGlyph: '8',
    body: `Poucos números carregam uma crença tão enraizada quanto o 8 — vira sinônimo de "número da sorte", do tipo que gente escolhe placa de carro ou horário de reunião esperando que o dinheiro apareça sozinho. É a leitura mais rasa possível de um número cuja função real não tem nada de sorte. É poder construído, tijolo por tijolo, por quem aprende a lidar com volume, escala e responsabilidade.

**O que poder realmente significa aqui**
O 8 não traz dinheiro caído do céu — traz capacidade de enxergar estrutura, assumir risco calculado e sustentar pressão que faria a maioria desistir no meio do caminho. É o número de quem aprende a pensar em sistema, não em tarefa isolada: em vez de só trabalhar duro, trabalha de um jeito que multiplica o resultado do próprio esforço. Isso parece sorte só pra quem está de fora e não viu o processo.

**O mal-entendido mais caro**
É achar que ter o número 8 forte garante prosperidade automática. Não garante nada sozinho — só entrega a capacidade. Quem tem esse potencial e não constrói estratégia, não delega direito e não aprende a jogar o jogo de longo prazo, vive numa versão frustrada do próprio número: toda a fome de resultado, sem o canal certo pra ela sair.

**Onde isso trava**
O risco do 8 não é preguiça — quase sempre é o oposto: dureza, controle excessivo, cobrança implacável consigo mesma e com todo mundo ao redor. A pessoa confunde liderar com pressionar, e constrói resultado à custa de relação queimada e corpo esgotado. Poder sem estratégia vira só pressão — e pressão sem válvula de escape cobra a conta, cedo ou tarde.

**O ajuste não é suavizar a ambição**
É trocar força bruta por estratégia: aprender a delegar o que não precisa ser feito por você, escolher batalhas com critério em vez de brigar em todas, e medir sucesso pelo sistema que funciona sem sua presença constante — não só pelo esforço que você consegue aguentar sozinha.

Se o seu número de vida — ou o número do ano pessoal que você está vivendo agora — for 8, vale prestar atenção em qual área exatamente essa fome de resultado está pedindo direção: carreira, negócio, dinheiro ou um projeto específico. Geralmente aparece com mais força num desses lugares, não em todos ao mesmo tempo, e isso o seu mapa completo mostra com mais precisão do que o número sozinho.`,
  },
  {
    slug: 'principio-hermetico-polaridade',
    categoria: 'principios',
    title: 'O Princípio da Polaridade: por que ódio e amor nunca foram opostos de verdade',
    date: '2026-11-02',
    excerpt: 'Extremos opostos são o mesmo fenômeno em graus diferentes — e isso muda completamente como você lida com o que sente.',
    cover: 'c',
    coverGlyph: '⚖',
    body: `Um dos sete princípios do hermetismo clássico diz algo que soa estranho até você testar na prática: tudo é duplo, tudo tem dois polos, opostos são idênticos em natureza, diferentes só em grau. Quente e frio não são duas coisas — são a mesma coisa (temperatura) medida em pontos diferentes de uma régua. O Princípio da Polaridade afirma que boa parte do que tratamos como contrários — amor e ódio, coragem e medo, confiança e insegurança — funciona exatamente assim.

**O erro que isso corrige**
A maioria trata emoção "negativa" como um inimigo separado, a ser eliminado — como se medo e coragem fossem duas substâncias diferentes, e a meta fosse trocar uma pela outra inteira. Não funciona assim. Medo e coragem estão na mesma régua. Coragem não é ausência de medo — é o mesmo material emocional, só que deslocado um pouco mais pra cima na escala. Quem espera eliminar o medo antes de agir vai esperar pra sempre, porque não existe ponto zero real nesse espectro, só posições diferentes nele.

**O que isso muda na prática**
Se opostos são graus da mesma coisa, a pergunta certa nunca é "como eu troco X pelo oposto de X" — é "como eu me movo um pouco mais na direção que eu quero, a partir de onde já estou". É o que o hermetismo chama de transmutação mental: não apagar o polo indesejado, mas deslocar a posição nele. Alguém tomado por raiva não precisa virar paz instantânea — precisa de um grau de deslocamento real, de raiva pra irritação, de irritação pra incômodo, até a régua se mover o suficiente pra mudar a decisão.

**Onde a maioria erra esse princípio**
É achar que polaridade significa que tudo é relativo e nada importa — "se é tudo a mesma coisa, a diferença não importa". Não é isso. A régua é real, e as posições nela têm consequência real: viver no polo do medo trava, viver no polo da raiva consome, viver no polo da insegurança paralisa. O princípio não apaga a diferença entre os polos. Só mostra que o caminho entre eles é gradual, não um interruptor de liga-desliga.

Saber que você está numa régua, não numa escolha binária, muda o que você tenta fazer com o que sente: em vez de brigar pra eliminar uma emoção inteira de uma vez — tarefa impossível —, você aprende a reconhecer um grau de deslocamento real e repetível. Onde esse tipo de régua emocional tende a travar com mais força pra você, e qual direção específica costuma destravar, varia de pessoa pra pessoa. Isso o seu padrão numérico e astrológico mostra com mais precisão do que qualquer princípio geral.`,
  },
  {
    slug: 'temporada-de-escorpiao-2026',
    categoria: 'signos',
    signo: 'Escorpião',
    title: 'Sol em Escorpião: o que todo mundo chama de ciúme quase nunca é sobre a outra pessoa',
    date: '2026-10-26',
    excerpt: 'A fama de signo perigoso esconde o motor real: não é controlar o outro, é não confiar que a verdade vai aparecer sozinha.',
    cover: 'b',
    coverGlyph: '♏',
    body: `Todo ano, por volta de 23 de outubro, o Sol entra em Escorpião e a fama de sempre vem junto: "cuidado, chegou o signo perigoso — ciumento, vingativo, manipulador". É a leitura mais rasa possível de um signo cujo motor real não é maldade. É recusa a aceitar qualquer coisa que não seja verdade sem verniz.

**O que a intensidade realmente é**
Escorpião não sente mais forte que os outros signos por drama. Sente mais forte porque processa tudo numa única camada: a profunda. Não existe, pra esse signo, conversa de superfície — ou é real, ou soa falso, e o desconforto com o falso é quase físico. O que de fora parece intensidade exagerada é, por dentro, recusa de fingir que algo raso é suficiente.

**O mal-entendido mais caro**
É confundir intensidade com necessidade de controlar o outro. O estereótipo do ciúme obsessivo não nasce de possessividade gratuita — nasce do medo de ser enganado sem perceber, de confiar e descobrir depois que a confiança não era merecida. O problema não é o cuidado com a verdade. É quando esse cuidado vira vigilância, e vigilância é tentativa de garantir por controle o que só a confiança realmente entrega.

**O que essa temporada realmente pede**
Não é desconfiar menos. É parar de tentar confirmar a verdade por controle, e aprender a tolerar a incerteza até ela se revelar sozinha, no tempo dela. Controle não substitui confiança: ele só adia o momento de descobrir se ela existe.

**Como isso aparece na prática**
- Precisar saber tudo sobre a vida do outro antes de sentir segurança
- Testar lealdade em vez de só observar o comportamento ao longo do tempo
- Cortar a relação no primeiro sinal de distância, antes de entender o motivo
- Guardar mágoa em silêncio até explodir tudo de uma vez

O convite de Escorpião não é sentir menos — isso trairia o dom real do signo, que é enxergar o que está por baixo da superfície onde a maioria só vê gentileza educada. É aprender a deixar a verdade aparecer no tempo dela, sem forçar a revelação por controle.

Onde exatamente esse padrão de controle-em-vez-de-confiança aparece com mais força pra você — trabalho, dinheiro, relação — Escorpião sozinho não mostra. Isso depende de outras posições no seu mapa pessoal.`,
  },
  {
    slug: 'tarot-arcano-a-morte',
    categoria: 'taro',
    title: 'A Morte no tarot: por que a carta mais temida do baralho nunca fala de morrer',
    date: '2026-10-19',
    excerpt: 'Ela não anuncia um fim trágico. Anuncia que alguma coisa já morreu há tempo — e só falta você parar de alimentar o cadáver.',
    cover: 'a',
    coverGlyph: 'XIII',
    body: `Poucas cartas assustam tanto numa tiragem quanto A Morte. O nome já faz o trabalho sujo sozinho — basta ver o esqueleto de armadura, a foice, o chão coberto de corpos, pra alguém puxar o ar antes mesmo de ouvir a leitura. A pergunta que vem junto, quase sempre sussurrada, é "alguém vai morrer de verdade?". É exatamente aí que a interpretação mais comum erra o alvo: A Morte quase nunca fala sobre morrer. Fala sobre o que você já devia ter deixado ir.

**O que a imagem realmente representa**
Na iconografia clássica, a figura de armadura não ataca ninguém em pé — ela segue cortando o que já está caído: reis, bispos, crianças, todos no chão antes da foice chegar. A leitura é precisa: esse fim simbólico não escolhe quem é importante. Ele termina o que já perdeu função, não importa quanto você investiu nisso. Um emprego que parou de fazer sentido há dois anos. Uma versão sua que existia só pra agradar alguém que já nem está mais por perto. Uma relação que roda no automático, sem presença real de nenhum lado. A Morte aparece quando esse fim já aconteceu por dentro — e falta só parar de fingir que não aconteceu.

**O mal-entendido mais caro**
É tratar a carta como presságio de desgraça, em vez de diagnóstico de atraso. Quem lê A Morte como ameaça costuma reagir segurando com mais força exatamente aquilo que a carta diz que já perdeu o pulso. É o oposto do que ela pede. A Morte não causa o fim de nada. Ela só se recusa a deixar você continuar fingindo que uma coisa morta ainda está viva — porque isso, no fundo, cansa mais do que o luto de admitir que acabou.

Isso explica por que soltar algo que já estava morto ainda dói tanto: o luto não é pela coisa em si, é pelo tempo e pela identidade construídos em cima dela. Largar um trabalho que não serve mais é admitir que os últimos meses ali foram, em parte, gastos à toa. Encerrar uma relação automática é reconhecer que você aceitou menos do que queria por tempo demais. A dor não é sinal de que a decisão está errada. É sinal de que ela está certa e atrasada.

**O vão que ninguém mostra na tiragem**
A carta seguinte do baralho, não por acaso, é A Temperança — a integração calma depois do corte. Mas entre uma e outra existe um trecho que a leitura raramente menciona: o período em que a coisa já morreu e o novo ainda não nasceu. É a parte mais desconfortável do processo, porque não tem nem o peso do luto nem a leveza do recomeço. Só vazio. A maioria desiste bem aí — tenta reanimar o que já acabou só pra escapar desse vazio, e é assim que gente passa anos num emprego morto, numa relação morta, numa versão de si mesma que já devia ter sido enterrada.

A Morte raramente aparece sozinha numa leitura séria — o que ela está encerrando, e o que vem depois dela, muda de pessoa pra pessoa. No seu mapa, os ciclos que tendem a terminar de um jeito abrupto ou de um jeito gradual seguem um padrão próprio, quase sempre ligado ao número do ano pessoal que você está vivendo agora. Saber qual é o seu muda completamente como atravessar esse tipo de fim.`,
  },
  {
    slug: 'numerologia-numero-4',
    categoria: 'numeros',
    numero: 4,
    title: 'Número 4 na numerologia: por que o número mais "chato" é o que te deixa livre',
    date: '2026-09-28',
    excerpt: 'Estrutura não é o oposto de liberdade. É o que sustenta ela quando o imprevisto chega.',
    cover: 'd',
    coverGlyph: '4',
    body: `Na numerologia, poucos números têm fama tão injusta quanto o 4. Enquanto o 7 vira "misterioso" e o 8 vira "poderoso", o 4 costuma ser resumido a uma palavra: chato. Trabalho braçal, rotina, planilha, nada de mágico. É a leitura mais rasa possível de um número cuja função real é sustentar tudo que os outros números fazem parecer fácil.

**O que estrutura realmente compra**
Todo mundo quer o resultado de disciplina sem querer o processo — o corpo que vem de treino repetido, o negócio que vem de operação organizada, a confiança que vem de mostrar pra si mesma, repetidas vezes, que cumpre o que promete. O 4 é o número que constrói exatamente essa base, tijolo por tijolo, sem pressa de aparecer. O problema não é o número. É a cultura que trata "constância" como sinônimo de "sem graça".

**O mal-entendido mais caro**
É achar que estrutura é o oposto de liberdade. Na prática é o contrário: quem nunca constrói uma base sólida vive refém de crise — cada imprevisto vira emergência, porque não existe nada armado por baixo pra absorver o choque. A pessoa 4 que ignora esse dom em nome de "ser mais espontânea" não fica mais livre. Fica mais exposta.

**Onde isso trava**
O risco do 4 não é falta de disciplina — quase sempre é o oposto: rigidez demais, virando resistência a qualquer mudança de plano, mesmo quando o plano original já não serve mais. Regra sem revisão periódica vira prisão que a própria pessoa construiu e depois esquece que tem a chave.

**O ajuste não é abandonar a estrutura**
É revisar ela com a mesma disciplina que a construiu — perguntar, de tempos em tempos, "essa rotina ainda serve o objetivo, ou já virou hábito por hábito?" Isso não é contradição com o 4. É a versão madura dele: constância que se atualiza, em vez de constância que só se apega.

Se o seu número de vida — ou o número do ano pessoal que você está vivendo agora — for 4, vale prestar atenção onde exatamente esse padrão aparece com mais força: trabalho, corpo, dinheiro ou relação. Geralmente é num desses lugares específicos, não em todos ao mesmo tempo, e isso o seu mapa completo mostra com mais precisão do que o número sozinho.`,
  },
  {
    slug: 'temporada-de-libra-2026',
    categoria: 'signos',
    signo: 'Libra',
    title: 'Sol em Libra: a indecisão que todo mundo zoa não é falta de opinião',
    date: '2026-09-21',
    excerpt: 'Decidir rápido não é sinônimo de decidir certo — é só decidir com menos variáveis na mesa.',
    cover: 'c',
    coverGlyph: '♎',
    body: `Todo ano, por volta de 23 de setembro, o Sol entra em Libra e o estereótipo de sempre reaparece: "cuidado, chegou o povo que não consegue nem escolher o restaurante". É a leitura mais rasa possível de um signo cujo motor real não é fraqueza de opinião — é excesso de informação processada ao mesmo tempo.

**O que a demora pra decidir realmente é**
Libra não trava porque não tem preferência. Trava porque enxerga, ao mesmo tempo, os prós de A, os prós de B, o que cada escolha custa pra quem está ao redor, e o efeito de longo prazo que ninguém mais na sala está calculando. Decidir rápido não é sinônimo de decidir certo — é só decidir com menos variáveis na mesa. O que parece indecisão de fora é, por dentro, uma sobrecarga de dados genuína.

**O mal-entendido mais caro**
É achar que o jeito de "curar" isso é forçar uma escolha rápida, tipo confiança de signo de fogo. Isso não desliga o processamento — só empurra ele pra depois, geralmente na forma de arrependimento ou ressentimento silencioso por ter cedido cedo demais numa negociação onde ainda não tinha certeza. Libra decide bem quando tem tempo pra pesar; decide mal quando é pressionado a parecer decisivo.

**O que essa temporada realmente pede**
Não é escolher mais rápido. É praticar decidir com informação incompleta — aceitando que nenhuma decisão importante tem todas as variáveis visíveis, e que esperar por clareza total é, na prática, uma forma de nunca decidir. Vale colocar um prazo real pra si mesma, não elástico, e honrar ele mesmo com a lista de prós e contras ainda em aberto.

**Como isso aparece na prática**
- Reler a mesma mensagem várias vezes antes de mandar
- Concordar numa reunião e se arrepender horas depois
- Pedir opinião de todo mundo antes de confiar na própria
- Evitar o confronto até acumular ressentimento em silêncio

O convite de Libra não é virar decisivo do dia pra noite — isso trairia o dom real do signo, que é enxergar nuance onde a maioria só vê dois lados. É aprender a decidir com a nuance ainda visível, sem precisar apagá-la pra parecer segura.

Onde exatamente esse padrão de pesar demais aparece com mais força — trabalho, relação, dinheiro — Libra sozinho não mostra. Isso depende de outras posições no seu mapa pessoal.`,
  },
  {
    slug: 'principio-hermetico-ritmo',
    categoria: 'principios',
    title: 'O Princípio do Ritmo: por que nenhuma fase, boa ou ruim, é permanente',
    date: '2026-09-14',
    excerpt: 'Tudo sobe e desce, inclusive você — o erro é tratar o topo ou o fundo como destino final.',
    cover: 'b',
    coverGlyph: '☯',
    body: `Existe um princípio hermético que raramente aparece fora dos livros mais densos, mas que explica um padrão que todo mundo já viveu: uma fase incrível que, sem aviso, esfria — e uma fase difícil que, quando você já tinha desistido de esperar melhora, começa a virar sozinha. O Princípio do Ritmo diz, em poucas palavras: tudo flui e reflui, tudo tem seu movimento de vaivém, tudo sobe e desce. Nada fica parado no topo. Nada fica parado no fundo.

**O erro que a maioria comete numa fase boa**
É tratar o auge como o novo normal — parar de cuidar do que sustentava aquilo, porque "agora está resolvido". Um negócio que decola e a dona para de prospectar porque "os clientes já vêm sozinhos". Uma relação que engrena e o casal para de se escutar porque "já deu certo". O Ritmo não pergunta se você está satisfeita com o resultado. Ele continua se movendo, e quem parou de remar sente a maré descer como se fosse azar, quando na real era previsível.

**O erro espelhado numa fase ruim**
É o oposto: tratar o fundo do poço como definitivo. "Sempre vai ser assim", "eu simplesmente não tenho sorte", "isso nunca vai melhorar". É o mesmo erro de leitura, só que na direção contrária — confundir um ponto do movimento com o destino final. O Ritmo garante justamente o oposto: pra tudo que desce, existe um retorno embutido no próprio mecanismo, não como milagre, mas como física do ciclo.

Isso não é otimismo barato tipo "vai passar, confia". É mais específico do que isso: já que você não consegue travar o pêndulo no ponto alto, o jogo é aprender a se mover com ele. Na fase boa, isso significa consolidar rápido — guardar reserva, documentar o que funcionou, fortalecer vínculo — em vez de só aproveitar o momento como se ele fosse eterno. Na fase difícil, significa agir no que está ao seu alcance sem gastar energia lutando contra o próprio movimento do ciclo, porque ele vai virar de qualquer jeito, com ou sem essa luta.

**A pergunta que separa quem sofre do ritmo e quem trabalha com ele**
Não é "quando isso vai acabar" — essa pergunta trava você em modo de espera passiva. É "o que essa fase, boa ou ruim, está me pedindo pra construir agora, que só faz sentido construir exatamente aqui?". A fase boa pede raiz. A fase difícil pede estrutura. Nenhuma das duas pede que você congele esperando a próxima virada.

Onde exatamente os seus ciclos tendem a virar — e com que frequência — é algo que o seu mapa mostra com mais precisão do que qualquer princípio geral: alguns temas nascem pra ciclos curtos e intensos, outros pra movimentos mais lentos e profundos. Saber que tipo de ritmo é o seu muda completamente como lidar com ele.`,
  },
  {
    slug: 'tarot-arcano-a-torre',
    categoria: 'taro',
    title: 'A Torre no tarot: por que a carta mais temida do baralho é também a mais honesta',
    date: '2026-09-01',
    excerpt: 'Ela não cria o desastre. Ela só para de deixar você adiar uma rachadura que já existia.',
    cover: 'a',
    coverGlyph: '⚡',
    body: `Poucas cartas do tarot carregam tanto peso quanto A Torre. Ela aparece numa tiragem e a reação costuma ser a mesma: um aperto no peito, seguido da pergunta "isso é ruim?". A imagem não ajuda — uma construção alta sendo atingida por um raio, gente caindo, fogo saindo das janelas. Parece o oposto de um bom presságio. E é exatamente aí que a leitura mais comum erra o alvo.

**O que a imagem realmente representa**
A Torre não fala sobre destruição aleatória. Fala sobre uma estrutura que foi erguida sobre uma base que já não sustentava o peso — e que ia cair de qualquer jeito, mais cedo ou mais tarde. O raio não é o vilão da cena. É só o gatilho que expôs uma rachadura que já existia havia tempo, silenciosa, ignorada porque era mais confortável fingir que a construção estava firme.

Pense num emprego que você sabia, há meses, que não fazia mais sentido — mas continuava indo porque trocar de vida dava mais medo do que continuar infeliz. Ou uma relação sustentada por hábito, não por escolha. Quando isso desmorona de um jeito abrupto (demissão, término, diagnóstico, crise), a sensação é de catástrofe. Mas o colapso não criou o problema. Só parou de deixar você adiar ele.

**Por que essa carta assusta mais do que devia**
Porque ela tira o controle da sua mão no momento exato — não antes, quando você ainda podia escolher desmontar aos poucos, com calma. A Torre chega quando a estrutura já passou do ponto de reparo suave. Isso não é punição. É física: quanto mais tempo uma rachadura fica sem atenção, mais abrupto é o jeito como ela finalmente se resolve.

O convite dessa carta não é "prepare-se pro pior". É perguntar, com honestidade, o que na sua vida você já sabe que não é sustentável — antes que a decisão seja tomada por você, de um jeito que dói mais do que precisava doer.

Vale reparar: A Torre raramente aparece sozinha numa leitura séria. O contexto das cartas ao redor dela — e o seu mapa natal, que mostra onde esse tipo de estrutura frágil tende a se formar na sua vida — é o que diferencia um alerta genérico de um recado específico, sobre uma área concreta que já está pedindo revisão antes que o raio decida por você.`,
  },
  {
    slug: 'virgem-quase-pronto-nunca-sai',
    categoria: 'signos',
    signo: 'Virgem',
    title: 'Virgem, "só mais um ajuste": por que o quase-pronto nunca sai da gaveta',
    date: '2026-09-01',
    excerpt: 'O motor de Virgem é melhorar. O problema é quando melhorar vira o jeito mais educado de nunca soltar.',
    cover: 'd',
    coverGlyph: '♍',
    body: `Ainda dentro da temporada de Virgem, tem um padrão que passa despercebido porque parece virtude: aquele projeto, texto, produto ou ideia que está "quase pronto" há semanas — ou meses. Não travou por falta de competência. Travou porque, pra Virgem, sempre existe mais um detalhe pra ajustar antes de mostrar pro mundo.

O motor desse signo é melhoria, precisão, inteligência prática. É um dom real — Virgem enxerga o que pode ficar melhor onde a maioria só vê "pronto o suficiente". O problema é quando esse dom vira critério pra adiar indefinidamente, porque sempre vai existir algo pra refinar. Perfeição não é um destino que se alcança. É um horizonte que anda junto com você.

**A diferença entre refinar e travar**
Refinar tem prazo e critério de parada: "vou revisar isso uma vez, corrigir o que for óbvio, e soltar". Travar não tem nem prazo nem critério — é um "ainda não" que se renova sozinho a cada revisão, porque a régua de "bom o suficiente" sobe junto com o trabalho. Se você não consegue responder com clareza "o que especificamente falta pra isso estar pronto", provavelmente não é refinamento. É medo com um roteiro de produtividade.

**De onde vem esse medo, na prática**
Quase sempre não é medo de errar — é medo de ser julgada por um erro que já viu, com clareza demais, antes de ninguém mais ver. Virgem tem a habilidade rara de identificar a própria falha antes de qualquer crítico externo abrir a boca. O problema é achar que, se você mesma encontrar o furo primeiro, ele deixa de existir quando lançar. Não deixa. Só atrasa o momento em que alguém — inclusive você — vai ter que conviver com ele.

**O que isso custa, sem parecer que custa**
Não é só o projeto parado. É o hábito se generalizando: a proposta que não sai porque "falta polir", o post que fica salvo como rascunho, a conversa difícil que é adiada até estar "no jeito certo" de ser puxada. Cada adiamento individual parece razoável. Somados, viram um padrão de vida inteiro vivido em modo de preparação, nunca em modo de execução.

**O ajuste não é abaixar o padrão**
É separar duas fases que a mente de Virgem tende a fundir: fazer e julgar. Enquanto uma parte sua produz, outra parte já está avaliando cada linha — e isso trava as duas. Produzir com o crítico desligado, revisar depois, num momento separado e com prazo definido, costuma destravar mais do que qualquer tentativa de "parar de ser exigente". A exigência continua. Só que organizada, em vez de simultânea a tudo.

Vale notar: nem todo Virgem trava do mesmo jeito, nem no mesmo lugar da vida — pra uma pessoa é o trabalho, pra outra é um relacionamento que nunca parece "maduro o suficiente" pra avançar. Onde exatamente esse adiamento aparece pra você é algo que o seu mapa mostra com mais precisão do que o signo sozinho.`,
  },
  {
    slug: 'virgem-cuidado-vira-controle',
    categoria: 'signos',
    signo: 'Virgem',
    title: 'Virgem te ensinou a cuidar — quando isso virou controle?',
    date: '2026-09-01',
    excerpt: 'Existe uma linha fina entre "eu resolvo porque me importo" e "eu resolvo porque não confio em mais ninguém". Virgem vive em cima dela.',
    cover: 'c',
    coverGlyph: '♍',
    body: `Ainda estamos na temporada de Virgem, e depois de falar sobre organizar o que ficou pela metade, vale olhar pro lado mais desconfortável desse signo: o ponto em que cuidar de tudo deixa de ser generosidade e vira uma forma sutil de controle.

Virgem tem um dom real de enxergar o que os outros não veem — o detalhe torto, o risco que ninguém notou, o jeito certo de fazer algo dar certo. O problema não é enxergar isso. É achar que, porque você enxerga, precisa ser você a resolver.

**Como o cuidado vira controle sem avisar**
Começa inocente: "deixa que eu faço, é mais rápido". Depois vira "ninguém faz do jeito certo além de mim". No fim, virou uma pessoa cercada de gente que aprendeu a não se oferecer, porque sabe que vai ser refeito de qualquer jeito. Isso não é excelência. É desconfiança disfarçada de zelo.

**O sintoma que passa despercebido**
Cansaço que não tem explicação óbvia. Você não está fazendo mais tarefas que os outros — está carregando o peso extra de vigiar se as tarefas dos outros também vão sair perfeitas, o que é um trabalho invisível e sem fim. Irritação com gente que "não se importa o suficiente" costuma ser, na real, irritação com você mesma por não conseguir soltar.

**De onde isso vem**
Quase sempre de um momento em que confiar em outra pessoa saiu caro — um erro que você teve que consertar, uma vez em que "deixar acontecer" deu errado. O sistema aprendeu: controlar o detalhe é o preço da segurança. Fazia sentido na época. Continuar pagando esse preço pra sempre não faz.

**O ajuste não é parar de se importar**
É separar duas perguntas que a mente costuma misturar: "isso precisa ser corrigido?" e "isso precisa ser corrigido por mim, agora, do meu jeito?" A primeira é legítima. A segunda, na maioria das vezes, é medo com roupa de responsabilidade.

Virgem que aprende a soltar o controle sem soltar o cuidado vira outra coisa: alguém em quem as pessoas confiam de verdade, porque sentem que são vistas, não vigiadas. Vale olhar onde isso aparece especificamente no seu mapa — o ponto exato onde seu senso de precisão vira peso é diferente pra cada pessoa.`,
  },
  {
    slug: 'temporada-de-virgem-2026',
    categoria: 'signos',
    signo: 'Virgem',
    title: 'Sol em Virgem: por que agosto pede ordem, não perfeição',
    date: '2026-08-24',
    excerpt: 'A temporada mais incompreendida do zodíaco não é sobre ser exigente — é sobre parar de viver no acúmulo.',
    cover: 'b',
    coverGlyph: '♍',
    body: `Todo ano, por volta de 23 de agosto, o Sol entra em Virgem e o discurso coletivo vira caricatura: "cuidado, chegou a época dos perfeccionistas chatos". É a leitura mais rasa possível de um mês que, na prática, é sobre outra coisa — reduzir o excesso até sobrar só o que funciona.

Virgem não pede perfeição. Pede função. A diferença é enorme, e é exatamente aí que a maioria das pessoas trava.

**O mal-entendido mais comum**
Perfeccionismo é medo disfarçado de padrão alto — a pessoa trava porque teme o julgamento, não porque se importa de verdade com o resultado. Virgem de verdade não é sobre nunca errar. É sobre revisar sem se punir, corrigir sem se odiar no processo.

**O que essa temporada realmente cobra**
Ela aponta pro que você andou acumulando sem organizar: tarefas paradas na metade, compromissos que se arrastam, uma rotina física que ficou pra depois. Não é hora de começar dez coisas novas. É hora de terminar o que já está aberto.

**Como isso aparece na prática**
- Vontade repentina de organizar gaveta, agenda, finanças
- Irritação crescente com bagunça, sua ou alheia
- Autocrítica mais alta que o normal — cuidado pra não confundir isso com "estar certa"
- Corpo cobrando atenção: sono, alimentação, rotina física negligenciada

**O ajuste que funciona**
Não é fazer uma faxina geral de uma vez só — isso costuma ser ansiedade disfarçada de produtividade. É escolher uma única área que está pedindo ordem e fechar essa, sem abrir outra frente antes. Virgem recompensa quem termina ciclos pequenos, não quem promete revolução.

O convite deste mês não é ser impecável. É parar de carregar o que já devia ter sido resolvido.`,
  },
  {
    slug: 'principio-hermetico-correspondencia',
    categoria: 'principios',
    title: 'O Princípio da Correspondência: por que seu mundo interno vira o seu mundo externo',
    date: '2026-08-20',
    excerpt: '"Como é dentro, é fora" não é poesia — é um mecanismo que dá pra observar.',
    cover: 'd',
    coverGlyph: '∴',
    body: `Um dos sete princípios do hermetismo clássico diz, em poucas palavras: como é dentro, é fora; como é em cima, é embaixo. Soa abstrato até você reparar no padrão mais chato e mais comum da vida adulta: a pessoa que vive cercada de gente que "some", ou a que sempre cai em chefes controladores, ou a que atrai parceiros distantes — repetindo cenário depois de cenário, com atores diferentes.

O hermetismo chamaria isso de correspondência. A neurociência comportamental chama de viés de confirmação somado a padrão de apego: sua mente treinada desde cedo a reconhecer um tipo específico de dinâmica (segurança, ameaça, abandono) filtra o ambiente pra encontrar mais disso — e ignora, sem querer, o que não se encaixa no roteiro conhecido. Duas linguagens diferentes descrevendo o mesmo mecanismo: o de fora tende a espelhar o de dentro, não porque o universo esteja "testando você", mas porque você é o instrumento que está fazendo a leitura.

**O erro mais comum ao ouvir isso**
É virar autoculpa — "então é tudo culpa minha". Não é. Correspondência não é sobre merecimento, é sobre padrão de reconhecimento. Você não atraiu aquela pessoa distante porque merecia sofrer; atraiu porque seu sistema de detecção estava calibrado pra reconhecer "distância" como algo familiar, e familiar costuma ser processado como seguro — mesmo quando dói.

**Como isso aparece na prática**
Repare no que se repete, não no que aconteceu uma vez. Um chefe difícil é só um chefe difícil. Três chefes difíceis seguidos, com o mesmo tipo de crítica, é correspondência: alguma parte sua ainda está calibrada pra um ambiente antigo, e o presente continua sendo lido com aquele filtro.

**O ajuste não é positividade forçada**
Não é "pensar bonito pra atrair coisa boa". É notar o padrão sem julgamento, nomear o que ele protegia originalmente (geralmente alguma forma de controle ou previsibilidade), e então, deliberadamente, praticar reconhecer como familiar aquilo que antes parecia estranho demais pra confiar — como calma, reciprocidade, gente que não some.

Dentro muda primeiro. Fora, historicamente, vem depois — e mais devagar do que a gente gostaria. Mas vem.`,
  },
  {
    slug: 'mercurio-retrogrado',
    categoria: 'lua',
    title: 'Mercúrio Retrógrado: o que muda pra cada elemento',
    date: '2026-08-18',
    excerpt: 'Não é hora de evitar tudo — é hora de revisar o que já estava pedindo atenção.',
    cover: 'a',
    coverGlyph: '☿',
    body: `Toda vez que Mercúrio "volta" no céu, alguma coisa se agita: mensagens que se perdem, planos que mudam de última hora, conversas antigas que voltam sem avisar. Mas o retrógrado não é um vilão — é um convite pra revisar o que você andou fazendo rápido demais pra prestar atenção de verdade.

Acontece três vezes por ano, por cerca de três semanas. Em 2027: de 9 de fevereiro a 3 de março (de Peixes pra Aquário), de 10 de junho a 4 de julho (de Câncer pra Gêmeos) e de 7 a 28 de outubro (de Escorpião pra Libra).

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
    categoria: 'lua',
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
    categoria: 'numeros',
    numero: 7,
    title: 'Número 7 na numerologia: o que ele está pedindo de você agora',
    date: '2026-08-04',
    excerpt: 'Profundidade não combina com pressa — e o 7 é o número que pede exatamente isso.',
    cover: 'c',
    coverGlyph: '7',
    body: `Quando o seu momento carrega a vibração do número 7 (ano pessoal, mês pessoal ou dia pessoal), o convite é sempre o mesmo: parar de olhar pra fora em busca de resposta e olhar pra dentro.

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

export function rotuloCategoria(id) {
  return CATEGORIAS.find((c) => c.id === id)?.rotulo || '';
}

/** "4 min de leitura" (200 palavras por minuto, mínimo 1). */
export function tempoLeitura(body) {
  const palavras = body.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(palavras / 200))} min de leitura`;
}

/**
 * Corpo do post em blocos: { tipo: 'h2' | 'p' | 'ul', texto | itens }.
 * Uma linha inteira em **negrito** vira intertítulo; linhas com "- " viram
 * lista; o resto, parágrafo (o **negrito** no meio da frase continua negrito).
 */
export function blocosDoCorpo(body) {
  const blocos = [];
  for (const trecho of body.split(/\n\s*\n/)) {
    let para = [];
    let lista = null;
    const fecharPara = () => { if (para.length) { blocos.push({ tipo: 'p', texto: para.join(' ') }); para = []; } };
    const fecharLista = () => { if (lista) { blocos.push({ tipo: 'ul', itens: lista }); lista = null; } };
    for (const bruta of trecho.split('\n')) {
      const linha = bruta.trim();
      if (!linha) continue;
      const titulo = linha.match(/^\*\*([^*]+)\*\*$/);
      if (titulo) { fecharPara(); fecharLista(); blocos.push({ tipo: 'h2', texto: titulo[1].trim() }); }
      else if (linha.startsWith('- ')) { fecharPara(); (lista ||= []).push(linha.slice(2).trim()); }
      else { fecharLista(); para.push(linha); }
    }
    fecharPara(); fecharLista();
  }
  return blocos;
}

/**
 * Onde entra o bloco interativo: antes do 3º intertítulo (= depois da parte
 * do 2º). Post com menos de 3 intertítulos: no meio, nunca antes do 2º bloco.
 */
export function posicaoDoBloco(blocos) {
  let h2 = 0;
  for (let i = 0; i < blocos.length; i++) {
    if (blocos[i].tipo === 'h2' && ++h2 === 3) return i;
  }
  return Math.max(2, Math.ceil(blocos.length / 2));
}

/** 3 posts pro "Leia também": mesma categoria primeiro (mais recentes), completa com os mais recentes. */
export function leiaTambem(slug, n = 3) {
  const post = getPostBySlug(slug);
  const outros = BLOG_POSTS.filter((p) => p.slug !== slug);
  const mesma = outros.filter((p) => p.categoria === post?.categoria);
  const resto = outros.filter((p) => p.categoria !== post?.categoria);
  return [...mesma, ...resto].slice(0, n);
}

/** Post de blog sobre um número (Números), se existir. */
export function postDoNumero(numero) {
  return BLOG_POSTS.find((p) => p.categoria === 'numeros' && p.numero === numero) || null;
}

export function formatPostDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d} de ${meses[m - 1]}`;
}
