// lib/frases.js — "Frase do dia": tabela fixa, sem IA. Puro, testado em
// tests/frases.test.js. Story às 21h (Instagram) e o Reel narrado da sexta
// (lib/reelsInterativo.js, formato 'frase'), atrás de SOCIAL_FRASE_DO_DIA=on.
//
// Só entram no rodízio as frases com `verificada: true` (fonte conferida por
// pessoa, não por máquina). O `id` leva o número do .md de revisão
// (ex.: "seneca-9" = frase 9). `hoje` = a aplicação que a voz lê no Reel
// depois da frase (texto nosso, nunca atribuído ao autor). `falado` = como a
// voz diz o crédito quando "<autor>, no livro <livro>." soa mal.
// Crédito no card e na legenda: sempre "— Autor, Livro" (creditoDaFrase).
// Traduções nossas, do original ou de traduções em domínio público.
//
// Rodízio (fraseDoDia): domínio público pesa o dobro por frase. As de autor
// ainda protegido entram 1 dia a cada (r + 1), com r = 2 × (domínio público ÷
// protegidas); dois dias seguidos nunca têm o mesmo autor. Mesma frase no
// Story e no Reel do dia.

/** Autores em domínio público no Brasil (morreram há mais de 70 anos). */
export const AUTORES_DOMINIO_PUBLICO = new Set([
  'Marco Aurélio', 'Sêneca', 'Epicteto', 'James Allen', 'Florence Scovel Shinn',
  'Khalil Gibran', 'Ralph Waldo Emerson', 'Henry David Thoreau', 'William James',
]);

export const FRASES = [
  {
    id: "marco-aurelio-1", autor: "Marco Aurélio", livro: "Meditações", ano: "c. 170–180", verificada: true,
    frase: "A alma se tinge da cor dos seus pensamentos.",
    hoje: "Hoje, repare no pensamento que mais se repete e em que cor ele está pintando o seu dia.",
    fonte: "Livro 5, 16", falado: "Marco Aurélio, nas Meditações.",
  },
  {
    id: "marco-aurelio-2", autor: "Marco Aurélio", livro: "Meditações", ano: "c. 170–180", verificada: true,
    frase: "O que impede a ação faz a ação avançar. O que está no caminho vira o caminho.",
    hoje: "Hoje, olhe pro obstáculo da vez e pergunte o que ele está te obrigando a aprender.",
    fonte: "Livro 5, 20", falado: "Marco Aurélio, nas Meditações.",
  },
  {
    id: "marco-aurelio-3", autor: "Marco Aurélio", livro: "Meditações", ano: "c. 170–180", verificada: true,
    frase: "Não perca mais tempo discutindo como deve ser um homem bom. Seja um.",
    hoje: "Hoje, troque uma opinião sobre como os outros deveriam agir por uma atitude sua.",
    fonte: "Livro 10, 16", falado: "Marco Aurélio, nas Meditações.",
  },
  {
    id: "marco-aurelio-4", autor: "Marco Aurélio", livro: "Meditações", ano: "c. 170–180", verificada: true,
    frase: "Se algo de fora te perturba, a dor não vem da coisa, mas do seu juízo sobre ela. E esse juízo você pode desfazer agora.",
    hoje: "Hoje, quando algo te incomodar, separe o que aconteceu da história que você contou sobre isso.",
    fonte: "Livro 8, 47", falado: "Marco Aurélio, nas Meditações.",
  },
  {
    id: "marco-aurelio-5", autor: "Marco Aurélio", livro: "Meditações", ano: "c. 170–180", verificada: true,
    frase: "A melhor vingança é não ser como quem te feriu.",
    hoje: "Hoje, se alguém te tratar mal, responda do jeito que você respeita em si.",
    fonte: "Livro 6, 6", falado: "Marco Aurélio, nas Meditações.",
  },
  {
    id: "marco-aurelio-6", autor: "Marco Aurélio", livro: "Meditações", ano: "c. 170–180", verificada: true,
    frase: "É preciso muito pouco pra viver uma vida feliz.",
    hoje: "Hoje, liste três coisas simples que já estão na sua vida e que você deixou de notar.",
    fonte: "Livro 7, 67", falado: "Marco Aurélio, nas Meditações.",
  },
  {
    id: "seneca-7", autor: "Sêneca", livro: "Sobre a brevidade da vida", ano: "c. 49", verificada: true,
    frase: "Não é que tenhamos pouco tempo. É que perdemos muito.",
    hoje: "Hoje, observe pra onde vai a primeira hora livre do seu dia.",
    fonte: "cap. 1",
  },
  {
    id: "seneca-8", autor: "Sêneca", livro: "Sobre a brevidade da vida", ano: "c. 49", verificada: true,
    frase: "A vida, se você souber usar, é longa.",
    hoje: "Hoje, escolha uma coisa que importa e dê a ela o seu melhor horário.",
    fonte: "cap. 2",
  },
  {
    id: "seneca-9", autor: "Sêneca", livro: "Cartas a Lucílio", ano: "c. 65", verificada: true,
    frase: "Sofremos mais na imaginação do que na realidade.",
    hoje: "Hoje, quando a cabeça antecipar um problema, pergunte se ele está acontecendo agora.",
    fonte: "Carta 13", falado: "Sêneca, nas Cartas a Lucílio.",
  },
  {
    id: "seneca-10", autor: "Sêneca", livro: "Cartas a Lucílio", ano: "c. 65", verificada: true,
    frase: "Enquanto adiamos, a vida passa.",
    hoje: "Hoje, faça a menor parte daquilo que você está adiando.",
    fonte: "Carta 1", falado: "Sêneca, nas Cartas a Lucílio.",
  },
  {
    id: "seneca-11", autor: "Sêneca", livro: "Cartas a Lucílio", ano: "c. 65", verificada: true,
    frase: "Não é por serem difíceis que não ousamos. É por não ousarmos que as coisas são difíceis.",
    hoje: "Hoje, encare por dez minutos a tarefa que parece maior do que é.",
    fonte: "Carta 104", falado: "Sêneca, nas Cartas a Lucílio.",
  },
  {
    id: "seneca-12", autor: "Sêneca", livro: "Cartas a Lucílio", ano: "c. 65", verificada: true,
    frase: "Quando não se sabe pra que porto se navega, nenhum vento é favorável.",
    hoje: "Hoje, escreva em uma frase aonde você quer chegar este mês.",
    fonte: "Carta 71", falado: "Sêneca, nas Cartas a Lucílio.",
  },
  {
    id: "seneca-13", autor: "Sêneca", livro: "Cartas a Lucílio", ano: "c. 65", verificada: true,
    frase: "Comece já a viver e conte cada dia como uma vida à parte.",
    hoje: "Hoje, trate o dia como inteiro: termine uma coisa antes de dormir.",
    fonte: "Carta 101", falado: "Sêneca, nas Cartas a Lucílio.",
  },
  {
    id: "allen-14", autor: "James Allen", livro: "O Homem É Aquilo que Pensa", ano: "1903", verificada: true,
    frase: "O homem é literalmente o que pensa. O seu caráter é a soma completa de todos os seus pensamentos.",
    hoje: "Hoje, anote um pensamento que você repete sobre si e veja se ele ainda é verdade.",
    fonte: "cap. 1",
  },
  {
    id: "allen-15", autor: "James Allen", livro: "O Homem É Aquilo que Pensa", ano: "1903", verificada: true,
    frase: "As circunstâncias não fazem o homem. Elas o revelam a si mesmo.",
    hoje: "Hoje, numa situação difícil, observe o que ela está mostrando sobre você.",
    fonte: "cap. 2",
  },
  {
    id: "allen-16", autor: "James Allen", livro: "O Homem É Aquilo que Pensa", ano: "1903", verificada: true,
    frase: "A mente é a mestra tecelã, tanto da roupa interior do caráter quanto da roupa exterior das circunstâncias.",
    hoje: "Hoje, escolha um pensamento pra cultivar de propósito e volte a ele três vezes.",
    fonte: "cap. 1",
  },
  {
    id: "allen-17", autor: "James Allen", livro: "O Homem É Aquilo que Pensa", ano: "1903", verificada: true,
    frase: "Os homens querem melhorar as suas circunstâncias, mas não querem melhorar a si mesmos. Por isso continuam presos.",
    hoje: "Hoje, em vez de mudar o cenário, mude um hábito seu dentro dele.",
    fonte: "cap. 2",
  },
  {
    id: "allen-18", autor: "James Allen", livro: "O Homem É Aquilo que Pensa", ano: "1903", verificada: true,
    frase: "A calma da mente é uma das belas joias da sabedoria.",
    hoje: "Hoje, antes de responder algo que te tirou do eixo, espere um minuto inteiro.",
    fonte: "cap. 7 (Serenidade)",
  },
  {
    id: "allen-19", autor: "James Allen", livro: "O Homem É Aquilo que Pensa", ano: "1903", verificada: true,
    frase: "Você será tão pequeno quanto o desejo que te controla, e tão grande quanto a sua aspiração dominante.",
    hoje: "Hoje, observe qual desejo está decidindo as suas escolhas.",
    fonte: "cap. 6 (Visões e ideais)",
  },
  {
    id: "shinn-20", autor: "Florence Scovel Shinn", livro: "O Jogo da Vida e Como Jogá-lo", ano: "1925", verificada: true,
    frase: "O jogo da vida é um jogo de bumerangues. Nossos pensamentos, atos e palavras voltam pra nós, cedo ou tarde, com uma precisão impressionante.",
    hoje: "Hoje, diga a alguém uma palavra que você gostaria de ouvir de volta.",
    fonte: "cap. 1",
  },
  {
    id: "shinn-21", autor: "Florence Scovel Shinn", livro: "O Jogo da Vida e Como Jogá-lo", ano: "1925", verificada: true,
    frase: "A intuição é uma faculdade espiritual. Ela não explica: simplesmente aponta o caminho.",
    hoje: "Hoje, siga uma intuição pequena sem pedir que ela se justifique.",
    fonte: "cap. \"Intuição ou orientação\"",
  },
  {
    id: "shinn-22", autor: "Florence Scovel Shinn", livro: "O Jogo da Vida e Como Jogá-lo", ano: "1925", verificada: true,
    frase: "O medo é só fé invertida.",
    hoje: "Hoje, quando o medo aparecer, pergunte em que você está acreditando sem perceber.",
    fonte: "cap. 1, \"O jogo\": \"fear is only inverted faith\"",
  },
  {
    id: "frankl-24", autor: "Viktor Frankl", livro: "Em Busca de Sentido", ano: "1946", verificada: true,
    frase: "Tudo pode ser tirado de uma pessoa, menos uma coisa: a última das liberdades humanas, escolher a própria atitude diante de qualquer circunstância.",
    hoje: "Hoje, numa situação que você não controla, escolha de propósito a sua atitude.",
    fonte: "parte 1 (experiências no campo)",
  },
  {
    id: "frankl-25", autor: "Viktor Frankl", livro: "Em Busca de Sentido", ano: "1946", verificada: true,
    frase: "Quando já não somos capazes de mudar uma situação, somos desafiados a mudar a nós mesmos.",
    hoje: "Hoje, pare de empurrar o que não se move e veja o que você pode mudar em si.",
    fonte: "parte 2 (logoterapia)",
  },
  {
    id: "frankl-26", autor: "Viktor Frankl", livro: "Em Busca de Sentido", ano: "1946", verificada: true,
    frase: "Quanto mais a pessoa se esquece de si, dedicando-se a uma causa ou a alguém pra amar, mais humana ela se torna.",
    hoje: "Hoje, faça algo por alguém sem contar pra ninguém.",
    fonte: "parte 2 (a essência da existência)",
  },
  {
    id: "frankl-27", autor: "Viktor Frankl", livro: "Em Busca de Sentido", ano: "1946", verificada: true,
    frase: "Viva como se já estivesse vivendo pela segunda vez, e como se da primeira tivesse agido tão errado quanto está prestes a agir agora.",
    hoje: "Hoje, antes de uma decisão, imagine que você já viu o resultado dela uma vez.",
    fonte: "parte 2 (a essência da existência)",
  },
  {
    id: "frankl-28", autor: "Viktor Frankl", livro: "Em Busca de Sentido", ano: "1984", verificada: true,
    frase: "O sucesso, como a felicidade, não pode ser perseguido. Ele tem que acontecer como consequência.",
    hoje: "Hoje, troque a obsessão pelo resultado pela atenção no que você está fazendo.",
    fonte: "prefácio da edição de 1984",
  },
  {
    id: "jung-30", autor: "Carl Jung", livro: "Aion", ano: "1951", verificada: true,
    frase: "Quando uma situação interior não se torna consciente, ela acontece do lado de fora, como destino.",
    hoje: "Hoje, quando algo se repetir com você, pergunte o que isso tem de seu.",
    fonte: "Obras Completas 9/2, § 126",
  },
  {
    id: "jung-31", autor: "Carl Jung", livro: "Cartas", ano: "1916", verificada: true,
    frase: "Quem olha pra fora sonha. Quem olha pra dentro desperta.",
    hoje: "Hoje, reserve cinco minutos pra olhar pra dentro antes de abrir o celular.",
    fonte: "Cartas, vol. 1: carta a Fanny Bowditch, 22/10/1916", falado: "Carl Jung, numa carta de 1916.",
  },
  {
    id: "jung-32", autor: "Carl Jung", livro: "Memórias, Sonhos, Reflexões", ano: "1962", verificada: false,
    frase: "Tudo o que nos irrita nos outros pode nos levar a entender a nós mesmos.",
    hoje: "Hoje, quando alguém te irritar, pergunte o que essa irritação diz sobre você.",
    fonte: "cap. \"Visões\" (conferir)", nota: "conferir a fonte",
  },
  {
    id: "jung-33", autor: "Carl Jung", livro: "O Homem Moderno em Busca de uma Alma", ano: "1933", verificada: true,
    frase: "O encontro de duas personalidades é como o contato de duas substâncias químicas: se há reação, as duas se transformam.",
    hoje: "Hoje, depois de uma conversa importante, repare no que mudou em você.",
    fonte: "ensaio \"Problemas da psicoterapia moderna\"",
  },
  {
    id: "jung-34", autor: "Carl Jung", livro: "Estudos Alquímicos", ano: "1945", verificada: true,
    frase: "Ninguém se ilumina imaginando figuras de luz, mas tornando consciente a escuridão.",
    hoje: "Hoje, olhe com calma pra uma parte sua que você costuma esconder.",
    fonte: "ensaio \"A árvore filosófica\", Obras Completas 13, § 335",
  },
  {
    id: "jung-35", autor: "Carl Jung", livro: "Cartas", ano: "c. 1955", verificada: false,
    frase: "Conhecer a própria escuridão é o melhor método pra lidar com a escuridão dos outros.",
    hoje: "Hoje, antes de julgar alguém, procure em você o mesmo traço.",
    fonte: "Cartas, vol. 1: carta a Kendig B. Cully (data a confirmar)", falado: "Carl Jung, numa carta.", nota: "conferir a fonte",
  },
  {
    id: "dispenza-44", autor: "Joe Dispenza", livro: "Quebrando o Hábito de Ser Você Mesmo", ano: "2012", verificada: false,
    frase: "A sua personalidade cria a sua realidade pessoal.",
    hoje: "Hoje, faça uma coisa pequena de um jeito diferente do seu automático.",
    fonte: "cap. 2 (conferir)", nota: "conferir a fonte",
  },
  {
    id: "dispenza-45", autor: "Joe Dispenza", livro: "Quebrando o Hábito de Ser Você Mesmo", ano: "2012", verificada: false,
    frase: "Se você pensa os mesmos pensamentos, faz as mesmas escolhas e repete os mesmos comportamentos, vai viver as mesmas experiências.",
    hoje: "Hoje, mude uma escolha que você faz no piloto automático.",
    fonte: "paráfrase recorrente no livro", nota: "conferir a fonte",
  },
  {
    id: "dispenza-46", autor: "Joe Dispenza", livro: "Quebrando o Hábito de Ser Você Mesmo", ano: "2012", verificada: false,
    frase: "O maior hábito que você precisa quebrar é o hábito de ser você mesmo.",
    hoje: "Hoje, observe uma reação sua que é sempre igual e tente outra.",
    fonte: "tese do livro (paráfrase)", nota: "conferir a fonte",
  },
  {
    id: "dispenza-47", autor: "Joe Dispenza", livro: "Sobrenatural", ano: "2017", verificada: false,
    frase: "Onde você coloca a sua atenção, você coloca a sua energia.",
    hoje: "Hoje, repare no que roubou a sua atenção três vezes e decida se isso merece.",
    fonte: "conferir capítulo", nota: "conferir a fonte",
  },
  {
    id: "dyer-55", autor: "Wayne Dyer", livro: "O Poder da Intenção", ano: "2004", verificada: false,
    frase: "Quando você muda a forma de olhar pras coisas, as coisas que você olha mudam.",
    hoje: "Hoje, descreva um problema seu como se ele fosse de outra pessoa.",
    fonte: "conferir", nota: "conferir a fonte",
  },
  {
    id: "dyer-56", autor: "Wayne Dyer", livro: "Seus Pontos Fracos", ano: "1976", verificada: false,
    frase: "Culpa pelo passado e preocupação com o futuro são as duas emoções mais inúteis.",
    hoje: "Hoje, troque uma preocupação por uma ação de dez minutos.",
    fonte: "cap. sobre culpa e preocupação (conferir)", nota: "conferir a fonte",
  },
  {
    id: "epicteto-61", autor: "Epicteto", livro: "Manual", ano: "c. 125", verificada: false,
    frase: "Não são as coisas que perturbam as pessoas, mas as opiniões que elas têm sobre as coisas.",
    hoje: "Hoje, quando algo te perturbar, escreva qual é a sua opinião sobre aquilo.",
    fonte: "Manual (Enchiridion), 5", falado: "Epicteto, no Manual.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "epicteto-62", autor: "Epicteto", livro: "Discursos", ano: "c. 108", verificada: false,
    frase: "Nada grande nasce de repente, nem mesmo um cacho de uva ou um figo.",
    hoje: "Hoje, dê um passo pequeno num projeto grande, sem cobrar o resultado inteiro.",
    fonte: "Discursos 1, 15", falado: "Epicteto, nos Discursos.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "epicteto-63", autor: "Epicteto", livro: "Discursos", ano: "c. 108", verificada: false,
    frase: "Primeiro diga a si mesmo o que você quer ser. Depois faça o que tem de fazer.",
    hoje: "Hoje, antes de começar, diga a si quem você quer ser neste dia.",
    fonte: "Discursos 3, 23", falado: "Epicteto, nos Discursos.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "epicteto-64", autor: "Epicteto", livro: "Discursos", ano: "c. 108", verificada: false,
    frase: "É impossível aprender aquilo que você acha que já sabe.",
    hoje: "Hoje, escute alguém sobre um assunto que você acha que já domina.",
    fonte: "Discursos 2, 17", falado: "Epicteto, nos Discursos.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "gibran-65", autor: "Khalil Gibran", livro: "O Profeta", ano: "1923", verificada: false,
    frase: "A sua dor é o rompimento da casca que envolve o seu entendimento.",
    hoje: "Hoje, olhe pra um incômodo recente e veja o que ele abriu em você.",
    fonte: "poema \"Da dor\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "gibran-66", autor: "Khalil Gibran", livro: "O Profeta", ano: "1923", verificada: false,
    frase: "Deixem que haja espaços na sua união.",
    hoje: "Hoje, numa relação próxima, respeite um espaço que é do outro.",
    fonte: "poema \"Do casamento\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "gibran-67", autor: "Khalil Gibran", livro: "O Profeta", ano: "1923", verificada: false,
    frase: "O trabalho é o amor tornado visível.",
    hoje: "Hoje, faça uma tarefa comum com o cuidado de quem faz pra alguém que ama.",
    fonte: "poema \"Do trabalho\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "gibran-68", autor: "Khalil Gibran", livro: "O Profeta", ano: "1923", verificada: false,
    frase: "A sua alegria é a sua tristeza sem máscara.",
    hoje: "Hoje, repare no que uma tristeza recente está te ensinando a valorizar.",
    fonte: "poema \"Da alegria e da tristeza\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "emerson-69", autor: "Ralph Waldo Emerson", livro: "Autoconfiança", ano: "1841", verificada: false,
    frase: "Nada pode te trazer paz, a não ser você mesmo.",
    hoje: "Hoje, faça uma coisa que te deixe em paz consigo, sem depender da aprovação de ninguém.",
    fonte: "ensaio \"Self-Reliance\", em Essays: First Series", falado: "Ralph Waldo Emerson, no ensaio Autoconfiança.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "emerson-70", autor: "Ralph Waldo Emerson", livro: "Autoconfiança", ano: "1841", verificada: false,
    frase: "Confie em si: todo coração vibra com essa corda de ferro.",
    hoje: "Hoje, tome uma decisão pequena sem pedir opinião.",
    fonte: "ensaio \"Self-Reliance\"", falado: "Ralph Waldo Emerson, no ensaio Autoconfiança.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "emerson-71", autor: "Ralph Waldo Emerson", livro: "Autoconfiança", ano: "1841", verificada: false,
    frase: "Uma coerência tola é o fantasma das mentes pequenas.",
    hoje: "Hoje, mude de ideia sobre alguma coisa sem pedir desculpas por isso.",
    fonte: "ensaio \"Self-Reliance\"", falado: "Ralph Waldo Emerson, no ensaio Autoconfiança.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "emerson-72", autor: "Ralph Waldo Emerson", livro: "Círculos", ano: "1841", verificada: false,
    frase: "Nada de grande jamais foi feito sem entusiasmo.",
    hoje: "Hoje, coloque energia de verdade em uma coisa só.",
    fonte: "ensaio \"Circles\", em Essays: First Series", falado: "Ralph Waldo Emerson, no ensaio Círculos.", nota: "lote 2: aguardando revisão",
  },
  {
    id: "thoreau-73", autor: "Henry David Thoreau", livro: "Walden", ano: "1854", verificada: false,
    frase: "A maioria das pessoas leva uma vida de quieto desespero.",
    hoje: "Hoje, nomeie uma coisa que você aceita em silêncio e não precisa aceitar.",
    fonte: "cap. 1, \"Economia\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "thoreau-74", autor: "Henry David Thoreau", livro: "Walden", ano: "1854", verificada: false,
    frase: "Fui para os bosques porque queria viver de forma deliberada, encarar só os fatos essenciais da vida.",
    hoje: "Hoje, tire do dia uma coisa que não é essencial.",
    fonte: "cap. 2, \"Onde vivi e para que vivi\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "thoreau-75", autor: "Henry David Thoreau", livro: "Walden", ano: "1854", verificada: false,
    frase: "Simplicidade, simplicidade, simplicidade!",
    hoje: "Hoje, resolva uma coisa do jeito mais simples possível.",
    fonte: "cap. 2, \"Onde vivi e para que vivi\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "thoreau-76", autor: "Henry David Thoreau", livro: "Walden", ano: "1854", verificada: false,
    frase: "O preço de uma coisa é a quantidade de vida que você troca por ela.",
    hoje: "Hoje, antes de uma compra ou de um compromisso, pergunte quanto de vida ele custa.",
    fonte: "cap. 1, \"Economia\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "william-james-77", autor: "William James", livro: "Princípios de Psicologia", ano: "1890", verificada: false,
    frase: "A minha experiência é aquilo a que eu aceito prestar atenção.",
    hoje: "Hoje, escolha de propósito onde colocar a atenção na primeira hora do dia.",
    fonte: "vol. 1, cap. 11, \"Atenção\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "william-james-78", autor: "William James", livro: "Palestras para Professores", ano: "1899", verificada: false,
    frase: "Toda a nossa vida, na medida em que tem forma definida, é só um amontoado de hábitos.",
    hoje: "Hoje, observe um hábito pequeno que está dando forma ao seu dia.",
    fonte: "cap. 8, \"As leis do hábito\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "william-james-79", autor: "William James", livro: "Palestras para Professores", ano: "1899", verificada: false,
    frase: "A ação parece vir depois do sentimento, mas na verdade ação e sentimento andam juntos.",
    hoje: "Hoje, quando faltar vontade, comece a ação e deixe o sentimento vir junto.",
    fonte: "palestra \"O evangelho do relaxamento\"", nota: "lote 2: aguardando revisão",
  },
  {
    id: "william-james-80", autor: "William James", livro: "A Vontade de Crer", ano: "1896", verificada: false,
    frase: "Acredite que a vida vale a pena, e a sua crença vai ajudar a criar o fato.",
    hoje: "Hoje, aja em uma coisa como se ela já valesse a pena, e repare no que muda.",
    fonte: "ensaio \"A vida vale a pena?\"", nota: "lote 2: aguardando revisão",
  },
];

// ── Crédito ────────────────────────────────────────────────────────────────

export const ehDominioPublico = (f) => AUTORES_DOMINIO_PUBLICO.has(f.autor);
/** Crédito do card e da legenda: "— Autor, Livro" (sem ano, sem nada que sugira endosso). */
export const creditoDaFrase = (f) => `— ${f.autor}, ${f.livro}`;
/** Como a voz diz o crédito no Reel. */
export const creditoFalado = (f) => f.falado || `${f.autor}, no livro ${f.livro}.`;
/** Só as verificadas entram no rodízio. */
export const frasesNoRodizio = (lista = FRASES) => lista.filter((f) => f.verificada === true);

// ── Rodízio ────────────────────────────────────────────────────────────────

function semente(texto) {
  let h = 2166136261;
  for (const c of String(texto)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}
function embaralhar(lista, seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...lista];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const mod = (a, n) => ((a % n) + n) % n;

/**
 * Ordem fixa da lista sem o mesmo autor em posições vizinhas, contando a volta
 * (o último encosta no primeiro): um de cada autor por rodada, o autor com mais
 * frases primeiro; o que sobrar colado é reencaixado onde os vizinhos são de
 * outros autores.
 */
export function ordemSemAutorSeguido(lista, seed) {
  const grupos = new Map();
  for (const f of embaralhar(lista, semente(seed))) {
    if (!grupos.has(f.autor)) grupos.set(f.autor, []);
    grupos.get(f.autor).push(f);
  }
  const filas = [...grupos.values()];
  const seq = [];
  while (filas.some((q) => q.length)) {
    filas.sort((a, b) => b.length - a.length);
    for (const q of filas) if (q.length) seq.push(q.shift());
  }
  const n = seq.length;
  if (n < 3) return seq;
  for (let volta = 0; volta < n * 2; volta++) {
    const k = seq.findIndex((f, i) => f.autor === seq[(i + 1) % n].autor);
    if (k < 0) break;
    const [x] = seq.splice((k + 1) % n, 1);
    const p = seq.findIndex((f, i) => f.autor !== x.autor && seq[mod(i - 1, seq.length)].autor !== x.autor);
    seq.splice(p < 0 ? seq.length : p, 0, x);
    if (p < 0) break; // um autor domina a lista: não tem como separar
  }
  return seq;
}

const BASE = Date.UTC(2026, 0, 1);
/** Dia corrido desde 01/01/2026 (negativo antes disso). */
export const diaDoRodizio = (dataISO) => {
  const [y, m, d] = dataISO.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - BASE) / 86400000);
};

/** Quantos dias de domínio público pra cada dia de autor protegido: cada frase de domínio público aparece o dobro. */
export const diasDominioPublico = (nPublico, nProtegido) => Math.max(1, Math.round((2 * nPublico) / nProtegido));

/** A frase do dia (a mesma no Story das 21h e no Reel da sexta), ou null sem nenhuma verificada. */
export function fraseDoDia(dataISO, lista = FRASES) {
  const ok = frasesNoRodizio(lista);
  if (!ok.length) return null;
  const pub = ordemSemAutorSeguido(ok.filter(ehDominioPublico), 'frases:dominio-publico');
  const prot = ordemSemAutorSeguido(ok.filter((f) => !ehDominioPublico(f)), 'frases:protegidas');
  const i = diaDoRodizio(dataISO);
  if (!prot.length) return pub[mod(i, pub.length)];
  if (!pub.length) return prot[mod(i, prot.length)];
  const r = diasDominioPublico(pub.length, prot.length);
  const ciclo = Math.floor(i / (r + 1));
  const pos = mod(i, r + 1);
  return pos === r ? prot[mod(ciclo, prot.length)] : pub[mod(ciclo * r + pos, pub.length)];
}

/** Dia da semana do Reel da frase (0 = domingo): sexta, no lugar do narrado. */
export const DIA_DO_REEL_FRASE = 5;
export const ehDiaDoReelFrase = (dataISO) => new Date(`${dataISO}T12:00:00Z`).getUTCDay() === DIA_DO_REEL_FRASE;
