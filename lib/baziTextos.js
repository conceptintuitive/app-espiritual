// lib/baziTextos.js
// Textos fixos da página /astrologia-chinesa (BaZi). Escritos à mão, sem IA —
// custo zero por leitura e conteúdo indexável. Índices batem com lib/bazi.js:
// DIA_MESTRE por tronco (0 = Jia … 9 = Gui), ANIMAIS por ramo (0 = Rato … 11 = Porco).
//
// Tom: o mesmo do Manual — afirmativo, específico, sem "tende a"/"pode ser".

export const PAPEL_PILAR = {
  ano: {
    titulo: 'Pilar do Ano',
    sub: 'raízes, família e imagem social',
    texto: 'É o pilar mais visível: a primeira impressão que você causa, a herança da família e o "clima" da infância até mais ou menos os 16 anos. O animal daqui é o que todo mundo chama de "seu signo chinês" — mas ele fala mais de como os outros te leem do que de quem você é por dentro.',
  },
  mes: {
    titulo: 'Pilar do Mês',
    sub: 'carreira, pais e a estação em que você nasceu',
    texto: 'É o pilar com mais peso no equilíbrio do mapa, porque define a estação — e a estação diz se o seu elemento nasceu forte ou fraco. Representa o ambiente de trabalho, a relação com os pais e a fase dos 17 aos 32 anos.',
  },
  dia: {
    titulo: 'Pilar do Dia',
    sub: 'você e o seu parceiro',
    texto: 'O tronco de cima é VOCÊ — o Day Master, o centro do mapa inteiro. O ramo de baixo é o "palácio do cônjuge": vida íntima, casamento e o tipo de parceiro que te atrai. Rege a fase dos 33 aos 48 anos.',
  },
  hora: {
    titulo: 'Pilar da Hora',
    sub: 'filhos, projetos próprios e maturidade',
    texto: 'Fala do que você cria e deixa: filhos, obra, projetos autorais, o legado. Rege a segunda metade da vida e mostra os desejos mais íntimos — o que você quer de verdade quando ninguém está olhando.',
  },
};

// ── Day Master (o "eu" do mapa) ──────────────────────────────────────────────

export const DIA_MESTRE = [
  {
    imagem: 'a árvore grande',
    titulo: 'Madeira Yang — Jia',
    essencia: 'Jia é o tronco de árvore: cresce reto, para cima, e não dobra. Você tem senso de direção, princípios firmes e uma necessidade real de crescer — estagnação te adoece. As pessoas se apoiam em você como se apoiam numa árvore: você vira referência sem pedir.',
    forcas: 'Liderança natural, integridade, visão de longo prazo, capacidade de proteger quem está embaixo da sua copa.',
    sombra: 'Rigidez. Árvore grande não verga — quebra. Você tem dificuldade de recuar, pedir ajuda e admitir que mudou de ideia, e confunde teimosia com coerência.',
    amor: 'Precisa de admiração e de espaço para crescer. Relação que te poda demais acaba. Você protege muito e, às vezes, esquece de se deixar cuidar.',
    trabalho: 'Rende em posições de liderança, educação, projetos de longo prazo e qualquer coisa que exija construir do zero. Sofre em funções sem autonomia.',
    equilibrio: 'Água (estudo, descanso, pausa para recarregar) nutre a raiz; Metal na medida certa "poda" e dá forma — um mentor exigente faz bem a você.',
  },
  {
    imagem: 'a flor e a trepadeira',
    titulo: 'Madeira Yin — Yi',
    essencia: 'Yi é a planta flexível: grama, flor, trepadeira. Não vence pela força — vence contornando. Você lê ambientes, se adapta e acha passagem onde os outros só veem parede. Parece delicada; é das mais resistentes do mapa chinês, porque vento forte não arranca grama.',
    forcas: 'Diplomacia, inteligência social, sensibilidade estética, persistência silenciosa, talento para conectar pessoas.',
    sombra: 'Dependência de estrutura. A trepadeira precisa de onde se apoiar, e você às vezes escolhe a parede errada só para não ficar sem apoio. Também evita conflito direto até o ponto de se anular.',
    amor: 'Romântica, atenta aos detalhes, cria vínculo profundo. Precisa de um parceiro estável que não confunda a sua flexibilidade com falta de opinião.',
    trabalho: 'Comunicação, design, relacionamento, negociação, curadoria, consultoria. Vai bem em rede — sozinha, perde força.',
    equilibrio: 'Sol (Fogo) para florescer: visibilidade, reconhecimento, se expor. E uma estrutura sólida (pessoas e rotinas) em que possa se apoiar sem se perder.',
  },
  {
    imagem: 'o sol',
    titulo: 'Fogo Yang — Bing',
    essencia: 'Bing é o Sol: ilumina tudo sem escolher quem. Você é generosa, expansiva, calorosa e impossível de não notar. Entra num lugar e muda a temperatura. Fala o que pensa e espera o mesmo dos outros.',
    forcas: 'Carisma, otimismo, coragem, generosidade, energia para começar coisas e puxar gente junto.',
    sombra: 'Excesso. O sol não sabe brilhar pela metade: você queima energia rápido, promete além do que entrega e se frustra quando o mundo não acompanha seu ritmo. Também tem dificuldade com sutileza e bastidor.',
    amor: 'Intensa, aberta e leal. Precisa de alguém que receba a sua luz sem querer apagá-la — e que tenha vida própria, porque você não suporta ser o único sol da relação.',
    trabalho: 'Palco: vendas, liderança, comunicação, ensino, qualquer coisa com público. Rende mais começando projetos do que mantendo.',
    equilibrio: 'Água na medida (limites, estratégia, alguém que diga "calma") e Terra para canalizar o calor em resultado concreto.',
  },
  {
    imagem: 'a vela e a lareira',
    titulo: 'Fogo Yin — Ding',
    essencia: 'Ding é a chama da vela: pequena, focada, ilumina no escuro e aquece de perto. Você é intensa por dentro, intuitiva, atenta a quem está ao lado. Não brilha para multidão — brilha para quem chega perto, e marca essas pessoas para sempre.',
    forcas: 'Foco, profundidade, intuição, capacidade de inspirar individualmente, devoção a uma causa ou pessoa.',
    sombra: 'Instabilidade emocional — a chama treme com qualquer vento. Você sente demais, rumina e pode queimar por dentro sem ninguém perceber. Também se apaga quando o ambiente é frio.',
    amor: 'Profunda, leal, cuidadosa. Ama em detalhes. Precisa de segurança emocional constante — relação morna te apaga.',
    trabalho: 'Pesquisa, terapia, escrita, ensino individual, espiritualidade, design de detalhe — tudo que exige atenção sustentada.',
    equilibrio: 'Madeira (combustível): estudo, livros, mentores, ideias novas. E proteção contra "vento": rotina, poucas pessoas certas.',
  },
  {
    imagem: 'a montanha',
    titulo: 'Terra Yang — Wu',
    essencia: 'Wu é a montanha: estável, confiável, imóvel. Você é o porto seguro dos outros — calma em crise, firme na palavra, difícil de abalar. Muda devagar, mas quando muda é definitivo.',
    forcas: 'Confiabilidade, paciência, senso de responsabilidade, capacidade de sustentar estruturas grandes (famílias, empresas).',
    sombra: 'Inércia e teimosia. A montanha não se move nem quando deveria. Você guarda tudo para dentro, demora a reagir e pode virar a pessoa que carrega todo mundo e não é carregada por ninguém.',
    amor: 'Leal, protetora, prática. Demonstra amor com presença e solução, não com palavras. Precisa de alguém que perceba isso.',
    trabalho: 'Gestão, operações, finanças, imóveis, qualquer coisa que exija constância. É a pessoa que mantém o negócio de pé.',
    equilibrio: 'Madeira (movimento, novidade, alguém que te tire do lugar) e Fogo (entusiasmo) para não endurecer.',
  },
  {
    imagem: 'o solo fértil',
    titulo: 'Terra Yin — Ji',
    essencia: 'Ji é a terra de plantio: macia, nutritiva, faz tudo crescer. Você cuida, organiza, acolhe e transforma ideias soltas em coisa real. É prática e, ao mesmo tempo, muito sensível ao que os outros precisam.',
    forcas: 'Cuidado, versatilidade, inteligência prática, talento para desenvolver pessoas e projetos, memória afetiva.',
    sombra: 'Absorve tudo — preocupação, culpa, problema alheio. Você se mistura tanto com os outros que esquece onde termina. Também desconfia e se preocupa demais.',
    amor: 'Dedicada, presente, cuidadora. O risco é virar mãe do parceiro. Precisa de alguém que também cuide de você.',
    trabalho: 'Gestão de pessoas, educação, saúde, gastronomia, produto, RH, atendimento — tudo que nutre e desenvolve.',
    equilibrio: 'Fogo (sol para a terra) — reconhecimento, prazer, calor humano. E limites claros para não absorver o que não é seu.',
  },
  {
    imagem: 'a espada e o minério',
    titulo: 'Metal Yang — Geng',
    essencia: 'Geng é o metal bruto, a espada: forte, direto, justo. Você corta o que está sobrando, decide rápido e não tem paciência para enrolação. Tem um senso de justiça quase físico — injustiça te tira do sério.',
    forcas: 'Coragem, decisão, lealdade, execução, capacidade de agir sob pressão e de defender quem é seu.',
    sombra: 'Dureza. Você corta antes de ouvir, fala como lâmina e às vezes vence a discussão e perde a pessoa. Precisa de conflito para se sentir viva.',
    amor: 'Leal até o fim, protetora, direta. Precisa de um parceiro forte que não se ofenda com franqueza — e aprender que nem tudo é batalha.',
    trabalho: 'Execução, liderança em crise, direito, engenharia, esporte, empreendedorismo de risco. Rende com desafio.',
    equilibrio: 'Fogo forja a espada: um desafio de verdade, um chefe ou meta que exija o seu melhor. Sem ele, o Metal enferruja ou corta à toa.',
  },
  {
    imagem: 'a joia',
    titulo: 'Metal Yin — Xin',
    essencia: 'Xin é o metal lapidado: joia, agulha, lâmina fina. Você tem olho para detalhe e qualidade, padrão alto para si e para os outros, comunicação precisa e às vezes cortante. Cuida da imagem porque essa é a natureza da joia: ela existe para brilhar.',
    forcas: 'Refinamento, senso estético, precisão, inteligência analítica, capacidade de transformar o comum em premium.',
    sombra: 'Sensibilidade à crítica — joia não aguenta ser arranhada. Perfeccionismo que paralisa, orgulho ferido que vira distância, exigência que os outros sentem como julgamento.',
    amor: 'Seletiva e exigente. Precisa de admiração e de alguém à altura do seu padrão. Quando se sente desvalorizada, esfria sem avisar.',
    trabalho: 'Design, estética, finanças, curadoria, qualidade, joalheria, tecnologia de precisão, marca — tudo onde o detalhe é o produto.',
    equilibrio: 'Água para "lavar a joia" e mostrar o brilho: expressar, criar, ensinar, falar. Fogo em excesso derrete — pressão demais te desgasta.',
  },
  {
    imagem: 'o oceano e o rio',
    titulo: 'Água Yang — Ren',
    essencia: 'Ren é o oceano, o rio caudaloso: grande, em movimento, impossível de conter. Você é inteligente, curiosa, adaptável e pensa em escala. Precisa de liberdade e de horizonte — rotina estreita te sufoca.',
    forcas: 'Visão estratégica, inteligência, sociabilidade, coragem para o novo, capacidade de reunir recursos e pessoas.',
    sombra: 'Dispersão e excesso. Rio sem margem vira enchente: você começa mil coisas, muda de rumo rápido e pode atropelar quem está no caminho. Também foge de compromisso.',
    amor: 'Envolvente, livre, aventureira. Precisa de um parceiro que acompanhe o fluxo sem querer represar — e de aprender a ficar.',
    trabalho: 'Estratégia, comércio, viagens, tecnologia, comunicação em massa, empreendedorismo. Rende em ambientes que mudam rápido.',
    equilibrio: 'Terra (margem do rio): compromissos, estrutura, prazos, alguém que te ancore. Madeira para dar destino à energia.',
  },
  {
    imagem: 'a chuva e o orvalho',
    titulo: 'Água Yin — Gui',
    essencia: 'Gui é a chuva, a névoa, o orvalho: sutil, silenciosa, penetra em tudo. Você é intuitiva, imaginativa e lê o que não foi dito. Trabalha nos bastidores e muda as coisas devagar, por dentro.',
    forcas: 'Intuição, imaginação, sensibilidade, inteligência estratégica discreta, capacidade de nutrir sem aparecer.',
    sombra: 'Ansiedade e dispersão emocional. Você absorve o clima do ambiente, se perde em cenários imaginados e pode sumir em vez de enfrentar.',
    amor: 'Sensível, devotada, misteriosa. Precisa de segurança e de alguém que perceba o que você não fala.',
    trabalho: 'Pesquisa, psicologia, espiritualidade, arte, escrita, dados, planejamento — tudo que exige profundidade e leitura fina.',
    equilibrio: 'Metal (fonte da água): método, estudo, mentores. E Fogo suave para não esfriar demais — sol, movimento, gente.',
  },
];

// ── Os 12 animais ────────────────────────────────────────────────────────────
// `perfil`: como animal do ano (imagem social). `intimo`: como ramo do DIA
// (palácio do cônjuge). `mes`: como ramo do MÊS. `hora`: como ramo da HORA.

export const ANIMAIS = [
  {
    perfil: 'Esperto, rápido, sociável e estratégico. O Rato enxerga oportunidade antes de todo mundo e sabe juntar recursos. É charmoso, poupador e sempre tem um plano B.',
    intimo: 'Na vida íntima, busca parceiro inteligente e boa conversa. Relação com cumplicidade e projetos em comum — e muita desconfiança se sentir que está sendo enganada.',
    mes: 'Nascer no mês do Rato (meio do inverno chinês) dá um ambiente de trabalho movido a ideias, estratégia e circulação de informação.',
    hora: 'Na hora, o Rato mostra uma segunda metade da vida mais estratégica: projetos que rendem pela inteligência, não pela força.',
  },
  {
    perfil: 'Constante, trabalhador, confiável e teimoso. O Boi constrói devagar e não larga. Tem paciência que ninguém tem e uma força que só aparece quando é preciso.',
    intimo: 'Na vida íntima, quer estabilidade, lealdade e rotina a dois. Demora a se entregar, mas é para sempre. Detesta drama.',
    mes: 'Mês do Boi: ambiente de trabalho de esforço, disciplina e resultado lento e sólido. Você aprendeu cedo que nada vem de graça.',
    hora: 'Na hora, o Boi indica maturidade de colheita: o que você planta com paciência vira patrimônio.',
  },
  {
    perfil: 'Corajoso, magnético, independente e impulsivo. O Tigre lidera sem pedir licença, defende os seus e não aceita jaula. Vive em intensidade.',
    intimo: 'Na vida íntima, paixão e liberdade. Precisa de parceiro com vida própria e coragem — tédio é o que mata a relação.',
    mes: 'Mês do Tigre (início da primavera): ambiente de começo, risco e expansão. Você se sente em casa onde há algo a conquistar.',
    hora: 'Na hora, o Tigre mostra ambição que cresce com a idade: projetos próprios grandes e ousados.',
  },
  {
    perfil: 'Elegante, diplomático, sensível e refinado. O Coelho prefere paz a vitória, tem gosto apurado e lê ambientes com precisão. Parece frágil; é sobrevivente.',
    intimo: 'Na vida íntima, romance, delicadeza e um lar bonito. Foge de conflito — e acumula em silêncio até sair.',
    mes: 'Mês do Coelho (primavera plena): ambiente de crescimento harmonioso, estética e relações. Você rende onde há beleza e diplomacia.',
    hora: 'Na hora, o Coelho traz oportunidades por rede e relações, e um desejo íntimo de vida tranquila e bonita.',
  },
  {
    perfil: 'Ambicioso, carismático, visionário e orgulhoso. O Dragão nasceu para coisas grandes e sabe disso. Atrai sorte, holofote e também inveja.',
    intimo: 'Na vida íntima, quer admiração e um parceiro à altura. Generoso no amor, mas não aceita ficar em segundo plano.',
    mes: 'Mês do Dragão: ambiente de transformação e ambição. Você foi moldada para pensar grande e liderar mudança.',
    hora: 'Na hora, o Dragão indica que o melhor vem depois: projetos de impacto e reconhecimento na maturidade.',
  },
  {
    perfil: 'Intuitiva, sábia, discreta e magnética. A Serpente pensa antes de agir, guarda segredos e enxerga intenções. Elegante por natureza, estratégica por instinto.',
    intimo: 'Na vida íntima, profundidade, intensidade e lealdade total — com ciúme proporcional. A Serpente guarda Fogo, Terra e Metal: relação que transforma.',
    mes: 'Mês da Serpente (início do verão): ambiente de inteligência e estratégia silenciosa. Você aprendeu a observar antes de se mover.',
    hora: 'Na hora, a Serpente mostra uma vida interior rica e uma maturidade de sabedoria — conselheira, estrategista.',
  },
  {
    perfil: 'Livre, enérgico, apaixonado e direto. O Cavalo precisa de movimento, palco e independência. Entusiasma todo mundo — e se cansa rápido do que vira rotina.',
    intimo: 'Na vida íntima, paixão e liberdade. Ama intensamente e precisa de espaço — prender o Cavalo é perdê-lo.',
    mes: 'Mês do Cavalo (auge do verão): ambiente de muita energia, visibilidade e pressa. Fogo forte no mapa.',
    hora: 'Na hora, o Cavalo traz desejo de liberdade que cresce com a idade — viagens, independência, projetos com palco.',
  },
  {
    perfil: 'Criativa, gentil, sensível e estética. A Cabra cria beleza, cuida dos outros e prefere colaborar a competir. Precisa de segurança para florescer.',
    intimo: 'Na vida íntima, ternura, cuidado e um lar acolhedor. Precisa de parceiro que dê segurança material e emocional.',
    mes: 'Mês da Cabra (fim do verão): ambiente artístico e de cuidado; você aprendeu a criar a partir do afeto.',
    hora: 'Na hora, a Cabra indica projetos criativos e um desejo íntimo de paz, arte e família.',
  },
  {
    perfil: 'Inteligente, engenhoso, divertido e competitivo. O Macaco resolve qualquer problema, aprende tudo rápido e se entedia com o óbvio.',
    intimo: 'Na vida íntima, precisa de estímulo intelectual e humor. Relação parada perde o encanto; relação com projeto a dois prospera.',
    mes: 'Mês do Macaco (início do outono): ambiente de agilidade, técnica e solução. Você rende sob desafio intelectual.',
    hora: 'Na hora, o Macaco mostra uma maturidade inventiva: múltiplos projetos, reinvenção constante.',
  },
  {
    perfil: 'Precisa, observadora, elegante e exigente. O Galo nota cada detalhe, fala o que pensa e tem padrão alto em tudo — inclusive na própria imagem.',
    intimo: 'Na vida íntima, quer parceiro que admire e esteja à altura. Exigente, crítica, mas muito fiel.',
    mes: 'Mês do Galo (outono pleno): ambiente de rigor, qualidade e perfeccionismo. Metal forte no mapa.',
    hora: 'Na hora, o Galo traz reconhecimento pela excelência e um desejo íntimo de perfeição.',
  },
  {
    perfil: 'Leal, justo, protetor e crítico. O Cachorro defende os seus até o fim, tem faro para gente falsa e não tolera injustiça. Desconfiado no começo, fiel para sempre.',
    intimo: 'Na vida íntima, lealdade absoluta. Precisa confiar para se entregar — e uma traição não tem volta.',
    mes: 'Mês do Cachorro (fim do outono): ambiente de responsabilidade e dever. Você aprendeu cedo a proteger e a carregar.',
    hora: 'Na hora, o Cachorro indica uma maturidade de causas: trabalho com propósito e círculo fechado de gente leal.',
  },
  {
    perfil: 'Generoso, sincero, bon vivant e confiante. O Porco aproveita a vida, partilha o que tem e acredita nas pessoas — às vezes demais.',
    intimo: 'Na vida íntima, carinho, prazer e entrega. Ama sem jogo — e precisa aprender a ver sinais vermelhos.',
    mes: 'Mês do Porco (início do inverno): ambiente de abundância e intuição; Água forte no mapa.',
    hora: 'Na hora, o Porco traz uma maturidade confortável, de prazer e generosidade, com bom fluxo de recursos.',
  },
];

/** Tom que o elemento do tronco do ano dá ao animal ("Cachorro DE MADEIRA"). */
export const SABOR_ELEMENTO_ANO = [
  'A Madeira dá ao seu animal crescimento, generosidade e visão — uma versão mais cooperativa e idealista.',
  'O Fogo dá ao seu animal intensidade, carisma e pressa — uma versão mais visível e impulsiva.',
  'A Terra dá ao seu animal estabilidade, senso prático e paciência — uma versão mais confiável e conservadora.',
  'O Metal dá ao seu animal firmeza, ambição e rigor — uma versão mais determinada e exigente.',
  'A Água dá ao seu animal inteligência, intuição e flexibilidade — uma versão mais estratégica e comunicativa.',
];

// ── Dez Deuses ───────────────────────────────────────────────────────────────

export const TEXTO_DEUSES = {
  amigo: {
    curto: 'irmãos, colegas e autonomia',
    texto: 'Mesmo elemento e mesma polaridade que você: aliados, irmãos, pares. Dá autoconfiança e independência — e também competição por espaço.',
    ano: 'Ano de autonomia: você quer fazer do seu jeito, encontra parceiros de igual para igual e se afirma. Cuidado com gasto e com disputa por espaço.',
  },
  rival: {
    curto: 'competição e ousadia',
    texto: 'Mesmo elemento, polaridade oposta: o rival que te empurra. Dá ousadia, rede e garra — e risco de perder dinheiro para quem está perto.',
    ano: 'Ano de competição: aparece concorrência, sócio ou alguém disputando o que é seu. Ótimo para se mexer; péssimo para emprestar dinheiro.',
  },
  deusComida: {
    curto: 'expressão, prazer e talento',
    texto: 'O que você gera com leveza: talento, criatividade, prazer, comida boa, conteúdo. É a estrela da expressão natural — você brilha fazendo o que gosta.',
    ano: 'Ano de expressão e prazer: bom para criar, ensinar, publicar e aproveitar. Ideias viram produto com facilidade.',
  },
  oficialFerido: {
    curto: 'rebeldia, genialidade e crítica',
    texto: 'Expressão que quebra regras: gênio, rebeldia, palavra afiada, talento para performance e inovação. Não aceita autoridade burra.',
    ano: 'Ano de ruptura criativa: você questiona chefe, regra e estrutura. Ótimo para inovar e empreender; perigoso para falar sem filtro.',
  },
  riquezaIndireta: {
    curto: 'oportunidade, negócios e sorte',
    texto: 'Dinheiro que vem de fora do salário: negócios, investimentos, oportunidades, comissões. Também representa o pai e a generosidade.',
    ano: 'Ano de oportunidade: dinheiro por negócio, venda e risco calculado. Grandes entradas e grandes saídas.',
  },
  riquezaDireta: {
    curto: 'patrimônio, constância e controle',
    texto: 'Dinheiro do trabalho constante, patrimônio, poupança, controle do que é seu. Gestão e senso prático sobre recursos.',
    ano: 'Ano de construir patrimônio: trabalho que rende de forma estável, organização financeira, compromisso.',
  },
  seteMatancas: {
    curto: 'pressão, poder e coragem',
    texto: 'O elemento que te controla com a mesma polaridade: pressão direta, inimigos, desafios, poder. Bem canalizado, vira liderança em crise e coragem.',
    ano: 'Ano de pressão e confronto: competição, cobrança e decisões duras. Escolha bem as brigas — quem enfrenta com estratégia sai com mais poder.',
  },
  oficialDireto: {
    curto: 'carreira, status e regras',
    texto: 'Autoridade legítima: carreira, título, reputação, regras e responsabilidade. Para mulheres, é a estrela clássica do parceiro.',
    ano: 'Ano de carreira e reconhecimento: promoção, cargo, responsabilidade, contrato. Mais estrutura e mais cobrança. Para mulheres, ano marcado por relacionamento.',
  },
  recursoIndireto: {
    curto: 'intuição, estudo não convencional e solidão',
    texto: 'Conhecimento fora do padrão: intuição, espiritualidade, metafísica, técnicas raras. Também introspecção e um lado solitário.',
    ano: 'Ano de estudo e introspecção: bom para aprender algo diferente e para espiritualidade. Pode trazer isolamento e desconfiança.',
  },
  recursoDireto: {
    curto: 'proteção, estudo e mãe',
    texto: 'O elemento que te nutre: mãe, mentores, estudo formal, diplomas, proteção e apoio. Dá segurança e paciência.',
    ano: 'Ano de apoio e aprendizado: mentores, cursos, certificações, ajuda que chega. Bom para descansar e se fortalecer.',
  },
};

// ── Relações ─────────────────────────────────────────────────────────────────

export const TEXTO_RELACOES = {
  combinacaoTronco: {
    titulo: 'Combinação de troncos (合)',
    texto: 'Dois troncos que se atraem e se fundem num elemento novo — é a ligação mais forte entre dois pilares.',
  },
  combinacao: {
    titulo: 'Combinação (六合)',
    texto: 'Dois animais que se completam. Indica alianças, acordos e afeto entre as áreas desses pilares.',
  },
  trio: {
    titulo: 'Trio harmônico (三合)',
    texto: 'Animais do mesmo "time" — se reforçam e facilitam a vida entre essas áreas.',
  },
  choque: {
    titulo: 'Choque (冲)',
    texto: 'Animais opostos no zodíaco chinês. Indica movimento, mudanças bruscas e tensão entre essas áreas — energia que não fica parada.',
  },
  punicao: {
    titulo: 'Punição (刑)',
    texto: 'Atrito que desgasta: cobrança, conflito de autoridade, acordos que azedam. Pede atenção a contratos e ao jeito de falar.',
  },
  dano: {
    titulo: 'Dano (害)',
    texto: 'Atrito discreto: mal-entendidos, ressentimento e gente que atrapalha pelas costas.',
  },
};

// ── Elementos ────────────────────────────────────────────────────────────────

export const TEXTO_ELEMENTOS = [
  {
    excesso: 'Madeira em excesso: muitas ideias, muitos começos e teimosia. Crescimento sem poda.',
    falta: 'Sem Madeira: falta direção de longo prazo e iniciativa. Estudo, natureza, planejamento e plantas em casa ajudam.',
  },
  {
    excesso: 'Fogo em excesso: pressa, ansiedade e paixão que queima rápido. Tudo é urgente.',
    falta: 'Sem Fogo: falta visibilidade, entusiasmo e reconhecimento. Sol, exposição, palco e vermelho ajudam.',
  },
  {
    excesso: 'Terra em excesso: preocupação, peso e dificuldade de mudar. Acúmulo.',
    falta: 'Sem Terra: falta chão — rotina, estabilidade e constância. Rotina fixa, finanças organizadas e tons terrosos ajudam.',
  },
  {
    excesso: 'Metal em excesso: rigidez, crítica e perfeccionismo. Corte demais.',
    falta: 'Sem Metal: falta limite, foco e capacidade de dizer não. Método, organização e decisões claras ajudam.',
  },
  {
    excesso: 'Água em excesso: dispersão, medo e excesso de pensamento. Tudo flui, nada fica.',
    falta: 'Sem Água: falta flexibilidade, descanso e fluxo de ideias. Pausas, viagens, estudo e contato com água ajudam.',
  },
];

export const TEXTO_FORCA = {
  forte: 'Seu elemento nasceu forte: muito apoio no mapa. Você rende mais quando GASTA energia — produzir, se expressar, assumir desafio e responsabilidade. Parado, o excesso vira teimosia.',
  equilibrado: 'Seu elemento nasceu equilibrado: nem sobra nem falta. Você aguenta pressão e também sabe se recolher — o ponto é não pender demais para nenhum lado.',
  fraco: 'Seu elemento nasceu pedindo apoio: o mapa gasta mais do que repõe. Você rende mais com rede, mentores, estudo e descanso de verdade — e com menos frentes ao mesmo tempo.',
};
