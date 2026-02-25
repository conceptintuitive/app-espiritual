'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ========================================
// GERADOR ULTRA PROFUNDO (300+ palavras/seção)
// ========================================

const ELEMENTOS_SIGNOS = {
  'Áries': 'Fogo', 'Touro': 'Terra', 'Gêmeos': 'Ar', 'Câncer': 'Água',
  'Leão': 'Fogo', 'Virgem': 'Terra', 'Libra': 'Ar', 'Escorpião': 'Água',
  'Sagitário': 'Fogo', 'Capricórnio': 'Terra', 'Aquário': 'Ar', 'Peixes': 'Água'
};

const REGENTES = {
  'Áries': 'Marte', 'Touro': 'Vênus', 'Gêmeos': 'Mercúrio', 'Câncer': 'Lua',
  'Leão': 'Sol', 'Virgem': 'Mercúrio', 'Libra': 'Vênus', 'Escorpião': 'Plutão',
  'Sagitário': 'Júpiter', 'Capricórnio': 'Saturno', 'Aquário': 'Urano', 'Peixes': 'Netuno'
};

const ARQUETIPOS_POR_NUMERO = {
  1: {
    principal: 'A Lâmina',
    luz: ['Iniciativa', 'Coragem', 'Liderança', 'Pioneirismo', 'Independência'],
    sombra: ['Impaciência', 'Controle excessivo', 'Arrogância', 'Impulsividade', 'Autoritarismo'],
    missao: 'Iniciar ciclos e liderar com presença autêntica, sem ego',
    bloqueio: 'Controle excessivo que afasta pessoas e oportunidades. A necessidade de estar sempre no comando cria resistência ao redor e bloqueia colaborações genuínas.',
    destrave: 'Liderar pela verdade e exemplo, não pelo ego ou imposição. Permitir que outros brilhem enquanto você guia.',
    mantra: 'Eu começo. Eu sustento. Eu confio no processo.',
    profundo: `O número 1 carrega a energia do pioneiro, daquele que abre caminhos onde não há trilha. Você nasceu com a marca da liderança gravada na alma - mas não qualquer liderança. A sua missão não é comandar por status ou controle, mas sim iniciar movimentos verdadeiros, puxar o primeiro fio que desfaz o nó coletivo.

A armadilha do 1 é confundir liderança com controle. Quando você sente que precisa provar sua força constantemente, quando não consegue delegar ou confiar no ritmo alheio, quando sua impaciência vira agressividade disfarçada de "honestidade" - esses são os sinais de que o ego assumiu o volante.

O 1 em sua luz é magnético sem esforço. Você naturalmente atrai pessoas porque carrega a energia do "primeiro passo" - e todos nós, em algum nível, precisamos de alguém que nos mostre que é possível começar. Mas essa liderança se corrompe quando vira show de força, quando você lidera para ser admirado em vez de para servir ao movimento.

Seu destrave passa por uma virada interna: entender que sua força não diminui quando você permite que outros também sejam fortes. Na verdade, o verdadeiro poder do 1 está em criar outros líderes, não seguidores. Você veio para iniciar, sim - mas também para sustentar sem dominar.

Quanto mais você lidera pela verdade (e não pelo ego), mais o campo ao seu redor se organiza naturalmente. Pessoas passam a te seguir não por medo ou obrigação, mas porque reconhecem em você a coragem que elas mesmas querem desenvolver.`
  },

  2: {
    principal: 'A Ponte',
    luz: ['Empatia profunda', 'Diplomacia', 'Sensibilidade', 'Cooperação', 'Intuição relacional'],
    sombra: ['Autoanulação', 'Indecisão crônica', 'Codependência', 'Medo de conflito', 'Perda de identidade'],
    missao: 'Harmonizar sem se diminuir, construir pontes sem se tornar o sacrifício',
    bloqueio: 'Busca excessiva de aprovação que apaga sua essência. Você se adapta tanto aos outros que esquece quem você é.',
    destrave: 'Dizer não com gentileza, sim com verdade. Escolher presença em vez de agrado.',
    mantra: 'Eu sinto sem me perder. Eu harmonizo sem me anular.',
    profundo: `O número 2 é a energia da ponte, do elo, da conexão sutil entre mundos. Você sente o que os outros sentem antes mesmo que eles digam - e isso é um dom raro. Mas também é uma faca de dois gumes, porque sentir demais sem fronteiras claras te transforma em esponja emocional.

A missão do 2 é linda e pesada ao mesmo tempo: você veio para harmonizar, para suavizar arestas, para criar pontes onde antes havia abismos. Mas a armadilha é confundir harmonização com autoanulação. Quantas vezes você já disse "sim" quando queria dizer "não"? Quantas vezes engoliu sua verdade para não "estragar o clima"?

O 2 em desequilíbrio vive no sacrifício silencioso. Você se adapta, cede, ajusta, contorna - até que um dia percebe que não sabe mais quem você é sem o outro. Sua identidade virou um reflexo das expectativas alheias. E aí vem a exaustão, a mágoa não dita, o ressentimento que você nem sabe nomear.

Mas o 2 em sua luz é uma força poderosa de transformação. Você não precisa gritar para ser ouvida. Sua presença suave é magnética justamente porque é genuína. Quando você está centrada em si mesma, sua capacidade de empatia se torna cura - não apenas para os outros, mas para você também.

O destrave do 2 é aprender que dizer "não" com gentileza é um ato de amor, não de rejeição. É entender que você pode harmonizar sem se dissolver. É perceber que sua sensibilidade é poder - mas só quando você escolhe conscientemente onde e como a usa. Você não precisa sentir tudo de todos o tempo todo. Você pode escolher.`
  },

  3: {
    principal: 'A Voz',
    luz: ['Criatividade abundante', 'Expressão autêntica', 'Alegria contagiante', 'Comunicação clara', 'Versatilidade'],
    sombra: ['Dispersão crônica', 'Superficialidade', 'Excesso e drama', 'Fuga pela distração', 'Falta de foco'],
    missao: 'Expressar a verdade com beleza, criar com profundidade, comunicar com impacto',
    bloqueio: 'Dispersão que impede a materialização real. Você começa mil coisas mas não finaliza nenhuma, deixando seu potencial espalhado sem forma concreta.',
    destrave: 'Foco criativo: menos projetos, mais profundidade. Um canal por vez, executado até o fim.',
    mantra: 'Eu expresso com foco. Eu crio com consistência.',
    profundo: `O número 3 é pura energia criativa em movimento - você é canal, é voz, é expressão pura. Você vê beleza e possibilidade onde outros veem vazio. Sua mente é um festival de ideias, sua boca nunca para, suas mãos criam sem esforço. Mas aí mora o problema: você cria tanto que nada ganha forma definitiva.

A missão do 3 é expressar o invisível, dar forma ao que ainda não existe, comunicar o que as pessoas não sabem que precisam ouvir. Você tem um dom raro: transformar complexidade em simplicidade, peso em leveza, dor em arte. Mas esse dom se perde quando você vira refém da sua própria dispersão.

O 3 em desequilíbrio é movimento sem direção. Você começa um projeto com entusiasmo, abandona no meio quando surge outra ideia "melhor", pula para a próxima coisa brilhante - e no fim do mês, do ano, da vida, você olha para trás e vê um cemitério de potenciais não realizados. A dispersão te rouba o impacto. Você tem talento de sobra, mas impacto zero porque nada chega até o fim.

Tem também o lado sombra do excesso: falar demais, criar drama onde não há, usar a alegria como máscara para evitar profundidade. O 3 desalinhado foge de si mesmo através da superfície - sempre na próxima festa, sempre na próxima piada, sempre na próxima distração.

Mas o 3 em sua luz é uma força de transformação cultural. Você muda o mundo através da sua expressão. Quando você escolhe foco, quando você se compromete com uma coisa até o fim, quando você permite que sua criatividade tenha profundidade e não apenas volume - aí você vira inesquecível. Aí sua voz não apenas ecoa: ela transforma.

O destrave do 3 é brutal mas simples: escolha. Um projeto por vez. Um canal por vez. Profundidade sobre variedade. E quando você sentir aquela coceira de pular para a próxima coisa - respire fundo e termine o que começou. Seu impacto está na finalização, não na iniciação.`
  },

  4: {
    principal: 'A Estrutura',
    luz: ['Disciplina', 'Consistência', 'Lealdade', 'Pragmatismo', 'Construção sólida'],
    sombra: ['Rigidez', 'Medo de mudança', 'Teimosia', 'Controle por segurança', 'Trabalho sem alma'],
    missao: 'Construir bases reais para que o sonho vire matéria, sem virar prisão',
    bloqueio: 'Medo de instabilidade que vira rigidez. Você tenta se sentir segura controlando tudo, e isso sufoca sua vida.',
    destrave: 'Estrutura flexível: rotina com espaço para o novo. Constância sem endurecimento.',
    mantra: 'Eu construo com constância. Eu confio sem endurecer.',
    profundo: `O número 4 é o arquétipo da estrutura: a pessoa que transforma intenção em realidade. Enquanto muitos sonham, você constrói. Enquanto muitos começam, você sustenta. Você tem algo raro: a capacidade de tornar o invisível concreto - passo a passo, tijolo por tijolo.

A sombra do 4 nasce do medo. Medo de perder o controle, medo do imprevisto, medo da queda. E aí a disciplina vira rigidez. A responsabilidade vira peso. O planejamento vira prisão. Você pode se tornar tão comprometida com a segurança que mata a espontaneidade, a alegria e até o desejo.

O 4 desalinhado vive no “depois eu vivo”. Trabalha, organiza, segura tudo - e quando percebe, a vida passou como um trem, e você ficou na plataforma segurando a mala do controle. Você faz muito, mas sente pouco. E isso cria uma sensação secreta de vazio: como se você estivesse sustentando o mundo, mas ninguém sustentasse você.

Mas o 4 em luz é poder puro: confiável, firme, impecável. Você inspira confiança porque sua energia diz “aqui tem chão”. Seu dom é ser base - para você e para os outros. O destrave é entender que estrutura é ferramenta, não identidade. Você não nasceu para ser uma parede. Você nasceu para ser fundação - que sustenta, mas não aprisiona.

Quando você aprende a flexibilizar sem desmoronar, você vira imbatível: disciplina com alma, rotina com prazer, construção com sentido. Aí tudo cresce em volta de você, porque você virou terra fértil.`
  },

  5: {
    principal: 'A Chave',
    luz: ['Liberdade autêntica', 'Versatilidade inteligente', 'Aventura consciente', 'Adaptabilidade', 'Coragem para mudança'],
    sombra: ['Impulso destrutivo', 'Inconstância', 'Fuga permanente', 'Medo de compromisso', 'Caos interno'],
    missao: 'Expandir fronteiras com consciência, trazer movimento estratégico, libertar sem destruir',
    bloqueio: 'Busca por liberdade que cria caos interno. Você muda tanto que nunca constrói nada sólido.',
    destrave: 'Movimento estratégico: liberdade com direção. Mudança com propósito.',
    mantra: 'Eu mudo com direção. Eu me movo com intenção.',
    profundo: `O número 5 é energia pura de movimento, expansão e liberdade. Você nasceu para não ficar parada - mas essa inquietação pode ser tanto sua maior força quanto sua maior armadilha. A missão do 5 é trazer renovação, quebrar estruturas obsoletas, mostrar que sempre há outro caminho possível. Você é a chave que abre portas que os outros nem viam como portas.

O problema é quando movimento vira fuga. Quando liberdade vira incapacidade de compromisso. Quando versatilidade vira inconsistência crônica. O 5 desalinhado não constrói nada porque nunca fica tempo suficiente em lugar nenhum. Você está sempre na próxima cidade, no próximo emprego, no próximo relacionamento - mas nunca AQUI, nunca profunda, nunca presente.

A sombra do 5 é confundir liberdade com ausência de responsabilidade. Você quer voar, mas voo sem direção é apenas queda disfarçada. Você quer experiência, mas experiência sem integração é só acúmulo de superfície. No fim, você tem mil histórias mas nenhuma raiz, mil começos mas nenhum legado.

Mas o 5 em luz é revolucionário. Você muda estruturas, abre caminhos, inspira movimento. Quando você aprende a escolher suas mudanças em vez de ser refém delas, quando você traz estratégia para sua inquietação, quando você usa sua liberdade para construir (e não apenas destruir o que foi construído) - aí você vira inesquecível.

Seu destrave passa por uma verdade incômoda: liberdade real não é ausência de compromisso. É capacidade de escolher seus compromissos conscientemente e sustentá-los. Você pode ser livre E profunda. Pode ser aventureira E confiável. Pode mudar E construir. Mas precisa aprender a diferença entre movimento estratégico e fuga impulsiva.`
  },

  6: {
    principal: 'O Templo',
    luz: ['Amor maduro', 'Cuidado consciente', 'Estética', 'Responsabilidade afetiva', 'Harmonia'],
    sombra: ['Controle emocional', 'Carência disfarçada de cuidado', 'Perfeccionismo', 'Ciúme', 'Salvar todo mundo'],
    missao: 'Curar pelo amor maduro: nutrir sem controlar, acolher sem aprisionar',
    bloqueio: 'Confundir amor com responsabilidade excessiva. Você assume tudo, vira “pilar” — e depois se ressente.',
    destrave: 'Amar com limites: dar sem se perder, cuidar sem carregar.',
    mantra: 'Eu amo com limites. Eu cuido sem me sacrificar.',
    profundo: `O número 6 é o arquétipo do templo: o lugar onde as pessoas se sentem seguras, vistas, acolhidas. Você tem uma energia naturalmente cuidadora, quase magnética, porque seu campo comunica “aqui tem amor”. Só que amor, quando não é consciente, vira controle.

O 6 em sombra tenta consertar o mundo para se sentir necessária. Você cuida, organiza, protege — mas por trás disso pode existir medo: medo de ser abandonada, medo de não ser escolhida, medo de que, se você relaxar, tudo desmorone. E aí você vira uma “mãe” de todos: do parceiro, da família, dos amigos, do time. Até que um dia percebe que está exausta e ninguém percebeu.

A armadilha do 6 é confundir valor com utilidade. Você pode começar a acreditar que seu amor precisa ser provado com esforço, com entrega, com sacrifício. E quando a troca não vem do jeito que você esperava, nasce o ressentimento silencioso — aquele que corrói por dentro e você nem se permite admitir.

Mas o 6 em luz é uma força de cura real. Você não só ama: você harmoniza ambientes, eleva o padrão, cria beleza e dignidade ao redor. Seu dom é transformar caos em lar. O destrave é aprender que amor maduro não prende. Amor maduro respeita. Amor maduro inclui você.

Quando você aprende a dizer “eu te amo, mas eu não carrego isso por você”, sua energia se refina. Você vira templo — mas com portas. E aí as pessoas certas entram, e as erradas não conseguem ficar.`
  },

  7: {
    principal: 'O Oráculo',
    luz: ['Intuição afiada', 'Sabedoria', 'Profundidade', 'Observação', 'Busca espiritual'],
    sombra: ['Isolamento', 'Ceticismo defensivo', 'Frieza', 'Autoexigência', 'Desconexão emocional'],
    missao: 'Revelar sentido: investigar a verdade e traduzir profundidade em clareza',
    bloqueio: 'Medo de ser invadida ou incompreendida. Você se fecha e chama isso de “eu sou assim”.',
    destrave: 'Vulnerabilidade consciente: permitir conexão sem perder sua soberania interna.',
    mantra: 'Eu confio na minha visão. Eu me abro com segurança.',
    profundo: `O número 7 é o arquétipo do oráculo: a pessoa que enxerga por trás das aparências. Você não se satisfaz com superfície. Você sente quando alguém está mentindo, quando algo não encaixa, quando existe um padrão oculto por trás do que está sendo dito. Sua mente é investigadora. Sua alma é buscadora.

A sombra do 7 é a armadura. Você já percebeu demais, já se decepcionou demais, já entendeu cedo demais como o mundo funciona — e aí criou distância para não se ferir. Você pode virar a pessoa que observa tudo, entende tudo, mas não se entrega. E chama isso de “independência”, quando muitas vezes é autoproteção.

O 7 em desequilíbrio se isola e se alimenta da própria solidão, como se estivesse “acima” das relações comuns. Mas por trás dessa postura pode existir medo de ser vista de verdade. Medo de ser vulnerável. Medo de não encontrar alguém que alcance a sua profundidade.

Mas o 7 em luz é puro poder: sabedoria, intuição, discernimento. Você veio para compreender e elevar — e isso inclui elevar a si mesma para além do medo. O destrave é aprender que vulnerabilidade não é fraqueza: é precisão emocional. Você não precisa se abrir para todos. Mas precisa se abrir para a vida.

Quando você une sua inteligência com o coração, você vira uma fonte: pessoas vêm até você porque sentem verdade. E você deixa de ser espectadora da vida e vira participante consciente.`
  },

  8: {
    principal: 'A Coroa',
    luz: ['Poder pessoal', 'Ambição saudável', 'Gestão', 'Autodomínio', 'Materialização'],
    sombra: ['Controle', 'Obsessão por resultado', 'Dureza', 'Medo de perder', 'Autoritarismo emocional'],
    missao: 'Materializar com ética e consciência: prosperar sem se tornar refém do poder',
    bloqueio: 'Associação interna entre valor e conquista. Você acha que só merece quando performa.',
    destrave: 'Poder com coração: liderança que serve, resultado com presença.',
    mantra: 'Eu prospero com integridade. Eu lidero com calma.',
    profundo: `O número 8 é o arquétipo da coroa: poder, realização, força de materialização. Você veio para lidar com matéria, com influência, com dinheiro, com impacto. O 8 não nasceu para sobreviver — nasceu para vencer. Mas vencer sem consciência vira prisão.

A sombra do 8 é a dureza: com você e com os outros. Você pode ficar tão orientada a resultado que esquece de viver. Pode amar “metas” mais do que experiências. Pode medir seu valor pelo que entrega. E isso cria uma fome que nunca acaba: porque sempre existe um próximo nível.

O 8 em desequilíbrio tenta controlar tudo porque teme perder. E quanto mais tenta controlar, mais perde: perde paz, perde prazer, perde conexão, perde saúde. Você vira uma máquina. E máquinas quebram.

Mas o 8 em luz é liderança real: firmeza, visão, capacidade de construir impérios. O destrave é lembrar que poder de verdade não grita e não se prova. Poder de verdade é silencioso, estável, ético. Você não precisa esmagar para conquistar. Você pode prosperar sem endurecer.

Quando você aprende a descansar sem culpa e a liderar sem violência interna, a vida começa a te responder com abundância natural. Porque a coroa só fica leve quando você não tenta usá-la para provar nada.`
  },

  9: {
    principal: 'A Fênix',
    luz: ['Compaixão', 'Visão humanitária', 'Transmutação', 'Sabedoria emocional', 'Encerramento de ciclos'],
    sombra: ['Apego ao passado', 'Drama de despedida', 'Martírio', 'Salvacionismo', 'Dificuldade de finalizar'],
    missao: 'Encerrar ciclos e elevar consciências: curar pelo exemplo e pela compaixão madura',
    bloqueio: 'Apego emocional ao que já morreu. Você tenta ressuscitar ciclos por medo do vazio.',
    destrave: 'Finalizar com amor: soltar sem ódio, fechar portas sem culpa.',
    mantra: 'Eu solto com amor. Eu renasço mais forte.',
    profundo: `O número 9 é o arquétipo da fênix: a alma que renasce. Você veio para finalizar ciclos — e isso não é simples. Você sente o mundo com intensidade, percebe a dor coletiva, carrega uma compaixão que muitas pessoas não conseguem sequer entender.

A sombra do 9 é o apego ao que já acabou. Você pode ficar presa em histórias, pessoas, versões de si mesma, tentando “consertar” o passado para não precisar enfrentar o vazio do novo. E isso cria um padrão: você reabre portas que deveriam estar fechadas, revive dores que já deveriam ter virado aprendizado.

O 9 em desequilíbrio vira mártir: ajuda todo mundo, se esquece, e depois se sente usada. Ou vira salvadora: tenta curar o mundo porque não quer olhar para a própria ferida. Mas o 9 em luz é pura alquimia: você transforma dor em sabedoria, perda em expansão, fim em começo.

Seu destrave é aprender a finalizar sem se destruir. Soltar não precisa ser trágico. Encerrar pode ser sagrado. Quando você aceita o ciclo completo — início, meio, fim — você se torna inevitável: uma presença que inspira cura só por existir.

Você não veio para carregar o mundo. Você veio para elevá-lo — e isso começa quando você se permite renascer.`
  },

  11: {
    principal: 'O Portal',
    luz: ['Intuição elevada', 'Inspiração', 'Magnetismo espiritual', 'Visão', 'Sensibilidade psíquica'],
    sombra: ['Ansiedade', 'Confusão energética', 'Idealismo paralisante', 'Medo de falhar', 'Oscilação emocional'],
    missao: 'Iluminar caminhos: inspirar sem se perder, canalizar visão em algo útil e humano',
    bloqueio: 'Energia alta sem aterramento. Você capta demais e se desregula, e aí trava.',
    destrave: 'Aterramento + ação: transformar insight em prática. Rotina espiritual simples e constante.',
    mantra: 'Eu canalizo com calma. Eu trago luz para a matéria.',
    profundo: `O número 11 é o portal. Você não veio com uma energia “comum”. Você sente antes, percebe antes, sonha antes. Sua alma tem antenas. E isso é um presente — mas também é um teste, porque energia alta sem estrutura vira tempestade interna.

O 11 em sombra vive oscilando: um dia você se sente destinada, no outro se sente incapaz. Você enxerga um futuro brilhante, mas trava na execução porque teme não corresponder ao que “deveria ser”. Idealismo vira paralisia. Sensibilidade vira ansiedade. Intuição vira ruído.

A missão do 11 é inspirar. Você veio para abrir portas na consciência alheia, para lembrar as pessoas do que é possível. Mas você só consegue fazer isso quando aprende a aterrissar sua própria luz. Porque luz sem chão vira fuga. Espiritualidade sem prática vira delírio.

Seu destrave é simples, quase irritante: rotina. Corpo. Sono. Limites. A energia do 11 precisa de canal — e o canal é a matéria. Quando você transforma visão em ações pequenas e consistentes, você vira farol. E farol não discute com a escuridão: ele só acende.

Quando você se compromete com o real, o extraordinário começa a acontecer.`
  },

  22: {
    principal: 'O Arquiteto',
    luz: ['Visão grande', 'Execução', 'Liderança estrutural', 'Impacto coletivo', 'Realização'],
    sombra: ['Pressão absurda', 'Perfeccionismo', 'Medo de começar', 'Controle', 'Colapso por excesso'],
    missao: 'Construir algo grande que sirva ao coletivo: transformar visão em legado',
    bloqueio: 'Querer fazer perfeito ou “grandioso” e por isso não começar. Você se cobra um império e abandona o tijolo.',
    destrave: 'Começar pequeno com padrão alto: sistema, consistência e equipe.',
    mantra: 'Eu construo tijolo por tijolo. Eu crio legado com presença.',
    profundo: `O número 22 é o arquétipo do arquiteto: a pessoa que nasceu para construir legado. Você tem visão grande — e diferente do 11, você tem potencial de execução real. O 22 é o “mestre construtor”: não é só intuição, é impacto.

A sombra do 22 é a pressão interna. Você sente que nasceu para algo enorme e isso vira um peso. Você se compara com a própria visão futura e se sente pequena no presente. E aí entra a armadilha: ou você tenta controlar tudo e colapsa, ou você adia eternamente porque “ainda não está pronto”.

O 22 em desequilíbrio vive num paradoxo: capacidade gigantesca, mas travada pelo medo de falhar em grande escala. Você não tem medo de errar pequeno — você tem medo de errar no nível do seu destino. E esse medo vira procrastinação sofisticada.

Seu destrave é entender que legado nasce do básico bem-feito. Sistema. Rotina. Prioridade. Delegação. O 22 não é feito para carregar tudo sozinho — é feito para liderar estruturas, construir times, organizar recursos.

Quando você aceita que o império começa com um tijolo e que o tijolo precisa ser colocado hoje, você vira inevitável. Porque o mundo responde a quem constrói.`
  },

  33: {
    principal: 'O Sopro',
    luz: ['Amor incondicional', 'Cura', 'Serviço elevado', 'Sabedoria compassiva', 'Presença transformadora'],
    sombra: ['Martírio', 'Síndrome do salvador', 'Exaustão', 'Culpa', 'Perda de limites'],
    missao: 'Curar e elevar pelo amor consciente: servir sem se sacrificar, amar sem se perder',
    bloqueio: 'Achar que amar é carregar. Você se culpa quando não consegue salvar ou sustentar todo mundo.',
    destrave: 'Serviço com limites: amar com discernimento, escolher onde sua energia realmente transforma.',
    mantra: 'Eu sirvo com limites. Eu amo com sabedoria.',
    profundo: `O número 33 é o mestre do amor consciente. É raro, é intenso, e não é “fofo”. O 33 não veio para romance e frases bonitas: veio para cura. Sua presença tem poder de transformar pessoas — mas isso exige maturidade emocional e limites firmes.

A sombra do 33 é o martírio. Você pode achar que precisa sofrer para provar amor. Pode achar que sua função é salvar. Pode atrair pessoas quebradas porque sente que consegue consertar. E aí você se perde: exausta, drenada, culpada por não fazer “o suficiente”.

O 33 em desequilíbrio vive numa armadilha espiritual: confunde compaixão com permissividade. Confunde amor com ausência de limites. E isso é perigoso, porque amor sem limite vira invasão.

Seu destrave é entender que serviço elevado não é se sacrificar — é sustentar presença. Você cura mais quando está inteira. Você transforma mais quando escolhe com consciência onde coloca sua energia. E você não precisa salvar ninguém: você precisa iluminar caminhos.

Quando você aprende a amar com discernimento, você vira “sopro”: chega e muda o ar do ambiente. E isso, por si só, já é cura.`
  }
};

const PERFIL_POR_ELEMENTO = {
  'Fogo': {
    motor: `Você cria por impulso, direção e coragem pura. Seu dom é iniciar - você é a faísca que acende o movimento, a primeira a entrar onde ninguém ousa pisar. O elemento Fogo te dá essa capacidade rara de agir antes de ter todas as respostas, de confiar na sua intuição visceral, de puxar o mundo atrás de você apenas pela força da sua convicção.

Mas o Fogo não queima apenas para fora - ele também queima para dentro. Quando você não tem um alvo claro, quando sua energia não tem direção definida, você vira um incêndio sem controle. Queima pontes, relações, oportunidades. A ansiedade que você tanto conhece não é "sua natureza" - é Fogo sem foco, energia sem canal.

O Fogo precisa de propósito como o corpo precisa de oxigênio. Sem um alvo claro, você dispersa. Com alvo definido + consistência de 21 dias, você vira imparável. A chave não é "se acalmar" (isso nunca funcionou pra você) - é canalizar. Direcionar. Transformar impulso em ação sustentada.`,
    
    energia: `Fogo precisa de alvo. Sem direção clara, você queima a si mesma. Sua energia é como gasolina: potente, explosiva, transformadora - mas precisa de um motor, de uma direção. Quando você acorda sem saber POR QUE está se movendo, quando age apenas por agir, quando sua coragem vira só reatividade - você está queimando combustível precioso em movimento vazio.`,
    
    sabotagem: `Você age rápido demais e queima etapas importantes. Toma decisões no calor da emoção e depois precisa lidar com as cinzas. Abandona projetos no meio porque o entusiasmo inicial já passou. Confunde velocidade com progresso. Machuca pessoas com sua "honestidade brutal" (que às vezes é só falta de filtro). Cria urgência desnecessária e vive em modo de emergência constante.`,
    
    destrave: `Um alvo claro que te faça levantar da cama + consistência de 21 dias consecutivos. O Fogo precisa de ritual, de rotina, de estrutura - não para te prender, mas para te potencializar. Você precisa de um "para quê" maior do que seu impulso do momento. Quando você tem isso, sua intensidade deixa de ser problema e vira superpoder.`,
    
    ritual: `Acenda uma vela vermelha ou laranja todas as noites por 7 noites consecutivas. Enquanto a vela queima, escreva 1 página sobre coragem - não coragem abstrata, mas a coragem que VOCÊ precisa agora. Depois, defina UMA ação objetiva para o dia seguinte e execute, mesmo que pequena. O fogo literal ajuda você a lembrar: sua energia precisa de direção consciente.`,
    
    protecao: `Não discuta, não decida, não confie na sua percepção quando você estiver reativa. Fogo reativo destrói em 5 minutos o que levou meses para construir. Quando sentir o calor subindo, quando a vontade de "falar umas verdades" vier - PAUSE. Respire. Espere seu corpo baixar. A verdade dita no fogo queima. A mesma verdade dita no tempo certo transforma.`
  },
  'Terra': {
    motor: `Você cria por consistência, método e construção gradual. Seu dom é materializar - você pega o abstrato e transforma em concreto, pega o caos e organiza em sistema. Enquanto outros sonham, você constrói. Enquanto outros começam e abandonam, você sustenta. O elemento Terra te dá essa capacidade rara de transformar tempo em resultado tangível.

Mas Terra em excesso vira prisão. Você confunde segurança com controle total, confunde responsabilidade com sacrifício, confunde construção com rigidez. E aí você para de crescer. Fica presa em estruturas que você mesma criou, mas que já não servem mais. A rotina que deveria te sustentar virou sua jaula.

O poder da Terra está em construir fundações sólidas sem se fossilizar nelas. Você precisa aprender a ser consistente sem ser rígida, ser confiável sem ser inflexível, construir sem se prender ao que construiu. A verdadeira segurança não vem de controlar tudo - vem de confiar na sua capacidade de reconstruir quando necessário.`,
    
    energia: `Terra precisa de flexibilidade. Sem movimento, você vira pedra - dura, imóvel, aparentemente forte, mas na verdade frágil. Você acredita que consistência significa "sempre fazer igual", mas não: consistência é manter a direção mesmo quando o caminho muda. Você pode ser sólida E fluida. Pode ter rotina E se adaptar. Pode construir E reconstruir.`,
    
    sabotagem: `Paralisia por análise de risco excessiva. Você quer garantias que a vida nunca dá. Medo de perder o que já construiu te impede de criar o novo. Rigidez relacional: "sempre foi assim" vira argumento contra mudança necessária. Você se sacrifica demais "pela responsabilidade" mas no fundo é medo. Confunde estabilidade com estagnação.`,
    
    destrave: `Uma mudança pequena por semana + micro-riscos calculados. Não precisa explodir tudo - mas precisa provar para si mesma que você aguenta movimento, que mudança não é sinônimo de caos, que você pode soltar sem desmoronar. O músculo da flexibilidade se constrói com prática, não teoria.`,
    
    ritual: `Crie uma rotina mínima de 21 dias (não negociável) + 10 minutos de organização do espaço físico por dia + um plano financeiro simples (quanto entra, quanto sai, para onde vai). Terra se conecta através do tangível. Quando seu espaço está organizado, sua mente clareia. Quando seu dinheiro está mapeado, sua ansiedade diminui.`,
    
    protecao: `Não aceite migalhas emocionais como se fossem amor verdadeiro. Terra tem essa tendência de "aguentar" porque é "responsável" - mas lealdade sem reciprocidade não é virtude, é autossabotagem. Você merece relações onde você não é a única construindo, a única sustentando, a única ficando.`
  },
  'Ar': {
    motor: `Você cria por visão, linguagem e inteligência afiada. Seu dom é clarear - você vê padrões invisíveis, conecta pontos que ninguém mais conecta, traduz complexidade em clareza. O elemento Ar te dá a capacidade de voar acima do caos e enxergar o mapa completo enquanto outros ainda estão presos no labirinto.

Mas Ar em excesso te desconecta do chão. Você vive tanto na sua cabeça que esquece que tem corpo, coração, presente. Você planeja, analisa, estrategiza - mas não age. Você pensa sobre sentir em vez de realmente sentir. Você está sempre dois passos à frente de onde seu corpo está, e isso cria uma desconexão crônica entre quem você é e quem você PENSA que deveria ser.

O poder do Ar está em usar sua inteligência para servir sua vida, não para substituí-la. Você não precisa parar de pensar - mas precisa aprender a pensar COM o corpo, não SOBRE o corpo. Presença não é ausência de pensamento: é pensamento ancorado no agora.`,
    
    energia: `Ar precisa de presença. Sem corpo, você vira só mente - e mente sozinha é ansiedade flutuante, é preocupação sem resolução, é plano que nunca vira ação. Você está sempre no "e se?" do futuro ou no "deveria ter" do passado, mas raramente no "o que é" do agora.`,
    
    sabotagem: `Análise paralítica: você pensa tanto que não age. Vive no futuro (preocupação) ou no passado (arrependimento), mas nunca aqui. Desconexão corpo-mente: você ignora sinais físicos até eles virarem crise. Comunicação excessiva que não diz nada de verdadeiro. Intelectualização das emoções: você explica o que sente em vez de sentir.`,
    
    destrave: `Práticas diárias de presença (respiração, movimento consciente, toque físico) + uma ação por dia, mesmo imperfeita. Ar precisa aprender que "feito imperfeito" é infinitamente melhor que "perfeito imaginado". Sua inteligência é poder quando se transforma em ação, não quando fica girando em loop na sua cabeça.`,
    
    ritual: `30 minutos diários sem estímulo externo (sem tela, sem som, sem leitura). Apenas você, sua respiração, seu corpo. No início vai ser desconfortável - você vai querer "fazer algo útil". Mas esse é justamente o ponto: você precisa se reconectar com o vazio fértil. Adicione escrita estratégica (não diário, mas planejamento claro) + conversas difíceis com linguagem limpa (dizer a verdade sem rodeios).`,
    
    protecao: `Não compartilhe seus planos com pessoas que não têm capacidade de sustentar sonho grande. Ar é vulnerável à opinião alheia - você deixa que argumentos externos contaminem sua clareza interna. Nem todo mundo precisa entender seu caminho. Nem todo mundo precisa concordar. Você não precisa de aprovação: precisa de ação.`
  },
  'Água': {
    motor: `Você cria por intuição, vínculo profundo e capacidade de sentir o invisível. Seu dom é ler o que não foi dito, perceber o que está por baixo da superfície, conectar-se na frequência da alma. O elemento Água te dá essa sensibilidade rara que é tanto bênção quanto fardo - você sente TUDO, de todos, o tempo todo.

Mas Água sem contêiner vira inundação. Você absorve tanto do campo emocional ao redor que não sabe mais o que é seu e o que é dos outros. Você se perde no papel de "aquela que entende", "aquela que acolhe", "aquela que aguenta tudo". E no fim, quem cuida de você? Quem te sustenta quando você desmorona?

O poder da Água está em sentir sem se afogar. Você não precisa parar de ser sensível - mas precisa aprender a ter limites claros sobre o que é responsabilidade sua e o que não é. Empatia sem fronteira não é virtude: é autodestruição disfarçada de amor.`,
    
    energia: `Água precisa de limites. Sem contêiner, você vira sobrecarga emocional constante. Você sente o que o outro sente, carrega o que o outro não consegue carregar, chora lágrimas que não são suas. E no fim do dia, você está exausta de uma forma que não consegue explicar - porque não é cansaço físico, é exaustão energética.`,
    
    sabotagem: `Absorção energética: você vira esponja emocional de quem está por perto. Sacrifício silencioso: você se doa até não restar nada. Falta de limites: você diz "sim" quando quer dizer "não", aceita o inaceitável porque "entende". Confunde compaixão com responsabilidade pelo outro. Se perde em relações desequilibradas porque "amor é assim".`,
    
    destrave: `Limites energéticos claros (não negociáveis) + corte semanal de drenagem emocional. Água precisa de ritual de limpeza constante - você não pode acumular peso alheio. Aprenda a sentir compaixão SEM carregar, a amar SEM se perder, a estar presente SEM se dissolver no outro.`,
    
    ritual: `Banho de descarrego suave (sal grosso + visualização de liberar o que não é seu) + limite energético diário: antes de dormir, corte conscientemente todos os fios energéticos que não são seus. Ritual de água: quando sentir peso demais, coloque as mãos na água corrente e permita que ela leve embora o que não é mais seu.`,
    
    protecao: `Não absorva emoções alheias como se fossem suas. Você pode ter compaixão sem se fundir. Pode amar sem se sacrificar. Pode estar presente sem virar terapeuta não remunerada de todo mundo. Sua sensibilidade é dom - mas só quando você escolhe conscientemente onde e como a usa.`
  }
};

const ANO_PESSOAL_MAP = {
  1: { 
    foco: 'Início, identidade e liderança', 
    alerta: 'Impulsividade e pressa que queimam etapas', 
    poder: 'Começar do jeito certo e sustentar o novo',
    acao: `Este é ano de plantar sementes com intenção, não de colher frutos. Você está iniciando um ciclo de 9 anos - tudo que você começar agora vai definir a trajetória dos próximos anos. Não é hora de resultados rápidos: é hora de fundação sólida. Escolha um foco, uma direção, um compromisso - e sustente por 12 meses mesmo quando a motivação inicial passar. O ano 1 testa sua capacidade de iniciar E sustentar, não apenas de começar e abandonar.`
  },
  2: { 
    foco: 'Parcerias, sensibilidade e diplomacia', 
    alerta: 'Indecisão e dependência excessiva', 
    poder: 'Diplomacia com limites claros',
    acao: `Este é ano de fortalecer vínculos verdadeiros e cortar os falsos. Você vai ser testada em todas as suas relações - quais delas são recíprocas? Quais te expandem? Quais só te drenam? O ano 2 não é sobre "aceitar todo mundo" - é sobre discernimento relacional. Não tenha medo de soltar quem não caminha mais contigo. Parceria real é troca, não sacrifício.`
  },
  3: { 
    foco: 'Expressão, visibilidade e criatividade', 
    alerta: 'Dispersão e superficialidade', 
    poder: 'Comunicar com propósito e profundidade',
    acao: `Este é SEU ano de brilhar, de se mostrar, de expressar. O que você guardou nos anos anteriores agora precisa vir à luz. Mas cuidado com a armadilha da dispersão: não adianta estar em mil lugares ao mesmo tempo. Escolha UM canal de expressão, UMA mensagem central, UM projeto criativo - e vai até o fim. Visibilidade sem profundidade é só barulho.`
  },
  5: {
    foco: 'Mudanças, movimento e liberdade',
    alerta: 'Instabilidade e impulso destrutivo',
    poder: 'Mudança estratégica, não caos',
    acao: `Este é ano de mudança - mas mudança consciente, não fuga impulsiva. Você vai sentir uma inquietação forte, uma vontade de explodir estruturas, de se libertar do que te prende. Isso é saudável. Mas antes de explodir tudo, pergunte: essa mudança me EXPANDE ou eu só estou fugindo do que preciso enfrentar? Movimento real tem direção. Mudança estratégica tem plano. Não confunda revolução com caos.`
  },
  7: {
    foco: 'Introspecção, estudo e refinamento interno',
    alerta: 'Isolamento excessivo e ceticismo',
    poder: 'Aprofundamento sem perda de conexão',
    acao: `Este NÃO é ano de visibilidade ou expansão externa. É ano de recolhimento estratégico, de estudar, de refinar, de ir fundo. Você vai sentir necessidade de ficar mais sozinha, de questionar tudo, de buscar verdade além da superfície. Isso é saudável - mas cuidado para não se isolar a ponto de perder conexão com quem te sustenta. Você pode se aprofundar sem se trancar.`
  },
  8: {
    foco: 'Poder, resultados e materialização',
    alerta: 'Dureza emocional e materialismo',
    poder: 'Manifestar com ética e compaixão',
    acao: `Este é ano de COLHER o que você plantou nos anos anteriores. Hora de materializar, de negociar, de assumir seu poder financeiro e profissional. O campo está favorável para resultados tangíveis - mas só se você agir com estratégia e ética. Poder sem coração vira tirania. Dinheiro sem propósito vira vazio. Negocie duro, mas não perca sua humanidade no processo.`
  },
  9: {
    foco: 'Fechamento de ciclos e desapego',
    alerta: 'Apego ao passado e dramatização',
    poder: 'Liberar com gratidão',
    acao: `Este é ano de FINALIZAR ciclos, não de começar novos. Você vai sentir encerramento em várias áreas - relações que terminam, projetos que chegam ao fim, fases que se completam. Isso não é perda: é preparação para o novo que vem. Solte com gratidão. Agradeça o que foi. Libere espaço. O ano 9 é portal - mas você só atravessa de mãos vazias.`
 },

  // 🔮 NÚMEROS MESTRES

  11: {
    foco: 'Despertar espiritual e expansão de consciência',
    alerta: 'Ansiedade, sobrecarga energética e confusão interna',
    poder: 'Canalizar visão em ação concreta',
    acao: `Ano altamente intuitivo e sensível. Você pode sentir que está "acordando" para algo maior — mas isso vem acompanhado de instabilidade emocional se não houver aterramento. Este é ano para alinhar propósito com prática. Rotina, disciplina e cuidado com o corpo são essenciais para sustentar a energia elevada do 11.`
  },

  22: {
    foco: 'Construção de algo grande e estrutural',
    alerta: 'Pressão excessiva e medo de falhar em grande escala',
    poder: 'Transformar visão em legado',
    acao: `Ano de responsabilidade ampliada. Você pode assumir posição de liderança ou estruturar algo que impacta mais pessoas. Mas cuidado com perfeccionismo paralisante. O 22 pede execução prática e visão estratégica. Grandes construções começam com pequenos sistemas diários.`
  },

  33: {
    foco: 'Serviço elevado, cura e impacto coletivo',
    alerta: 'Martírio e exaustão emocional',
    poder: 'Inspirar sem se sacrificar',
    acao: `Ano de missão elevada. Você pode se sentir chamada a ajudar, orientar ou sustentar outras pessoas. Mas o 33 exige maturidade: servir não é se sacrificar. Este é ano para equilibrar compaixão com limites. Quanto mais você cuida da própria energia, mais forte se torna seu impacto.`
  }
};

function parseDataISO(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

function reduzirNumero(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

function calcularNumeroVida(dataISO) {
  const p = parseDataISO(dataISO);
  if (!p) return 0;
  const soma = String(p.y).split('').reduce((a, b) => a + Number(b), 0) +
                String(p.m).split('').reduce((a, b) => a + Number(b), 0) +
                String(p.d).split('').reduce((a, b) => a + Number(b), 0);
  return reduzirNumero(soma);
}

function calcularAnoPessoal(dia, mes, anoAlvo) {
  return reduzirNumero(Number(dia) + Number(mes) + Number(anoAlvo));
}

function gerarManualCompleto(analise) {
  const { nome, data_nascimento, signo, numero_vida } = analise;
  const primeiroNome = (nome || '').trim().split(' ')[0] || 'você';
  const elemento = ELEMENTOS_SIGNOS[signo] || 'Fogo';
  const regente = REGENTES[signo] || 'Sol';
  const numeroVida = numero_vida || calcularNumeroVida(data_nascimento);
  const p = parseDataISO(data_nascimento);
  const anoPessoal2026 = p ? calcularAnoPessoal(p.d, p.m, 2026) : 1;
  const arquetipo = ARQUETIPOS_POR_NUMERO[numeroVida] || ARQUETIPOS_POR_NUMERO[1];
  const perfilElemento = PERFIL_POR_ELEMENTO[elemento] || PERFIL_POR_ELEMENTO['Fogo'];
  const anoInfo = ANO_PESSOAL_MAP[anoPessoal2026] || ANO_PESSOAL_MAP[1];

  return {
    meta: { nome, data_nascimento, signo, elemento, regente, numeroVida, anoPessoal2026 },
    
    introducao: {
      titulo: 'Antes de Começar: Este Não É Mais Um Texto Espiritual',
      conteudo: `${primeiroNome}, você já leu muita coisa sobre "autoconhecimento", já fez teste de personalidade, já ouviu que precisa "se amar mais" e "confiar no processo". E provavelmente nada mudou de verdade, certo? Porque a maioria do que você consumiu até agora era entretenimento disfarçado de transformação.

Este relatório não é isso. Não é para te fazer sentir bem. É para te fazer VER - ver seus padrões de repetição, ver onde você trava, ver como você mesma sabota o que diz querer. E depois de ver, te dar um mapa prático de como mudar.

A diferença é simples: a maioria dos materiais te diz "você é incrível do jeito que está". Este aqui te diz "você TEM incríveis potenciais, mas está operando em modo de autossabotagem - e aqui está o protocolo para mudar isso".

Não é motivacional. É diagnóstico + método.

Se você aplicar o que está aqui por 7 dias consecutivos - não ler, APLICAR - você vai sentir mudança real. Não por mágica, não por decreto, mas porque você vai parar de operar no piloto automático que te trouxe até aqui.

A má notícia: isso exige presença, disciplina e coragem para encarar verdades desconfortáveis sobre si mesma.

A boa notícia: você já tem tudo que precisa. Só estava usando errado.

💫Este não é um texto para ler quando tiver tempo. É um protocolo para executar quando você estiver cansada de repetir o mesmo padrão esperando resultado diferente.**`
    },
    
    leituraCompleta: {
  titulo: '1. Leitura Completa: Seu "Motor" + Sua "Arquitetura"',

  perfilEstrutural: {
    subtitulo: 'SEU PERFIL ESTRUTURAL (Diagnóstico rápido)',
    conteudo: `**Força dominante:** ${perfilEstrutural.forca}

**Risco oculto:** ${perfilEstrutural.risco}

**Gatilho emocional:** ${perfilEstrutural.gatilho}

**Tendência automática:** ${perfilEstrutural.tendencia}

**Modo sabotador:** ${perfilEstrutural.sabotador}

**Modo magnético:** ${perfilEstrutural.magnetico}`
  },

  motor: {
    subtitulo: '1.1 Seu "Motor" Energético (Signo + Elemento)',
    conteudo: `Você é ${signo}, do elemento ${elemento}. Isso não é folclore - é código operacional.

${perfilElemento.motor}

Seu Regente Planetário: ${regente}

O regente não é "influência astrológica mística", é a frequência dominante na sua psique. ${regente} dita o estilo da sua reação instintiva, a cor do seu impulso, o sabor da sua tomada de decisão. Quando você age sem pensar, você age pelo filtro de ${regente}.

${perfilElemento.energia}

A Verdade Que Ninguém Te Conta:

Quando você opera alinhada com seu elemento, a vida parece "sincronizar", as coisas fluem, as oportunidades aparecem, as pessoas certas cruzam seu caminho. Não é sorte: é ressonância. Você está vibrando na frequência natural do seu sistema, e o campo responde.

Quando você opera CONTRA seu elemento, tudo vira esforço. Você nada contra a corrent${
  elemento === 'Fogo' ? 'e do seu próprio fogo' :
  elemento === 'Água' ? 'e da sua própria água' :
  elemento === 'Terra' ? 'e da sua própria terra' :
  'e do seu próprio ar'
} - e ninguém ganha dessa batalha por muito tempo.

O trabalho não é "mudar quem você é". É parar de lutar contra sua natureza e aprender a usá-la a seu favor.`
  },

  arquitetura: {
    subtitulo: `1.2 Sua "Arquitetura" da Alma (Número de Vida ${numeroVida})`,
    conteudo: `O Número de Vida ${numeroVida} - Arquétipo: ${arquetipo.principal}

${arquetipo.profundo || `Este é o número que sua alma escolheu para dominar nesta vida. Não é coincidência. Não é aleatório. É o tema central da sua existência, a lição que vai se repetir de formas diferentes até você finalmente entender e integrar.`}

Quando você está na LUZ do ${numeroVida}:
${arquetipo.luz.map(l => `• ${l}`).join('\n')}

Essa é você magnética, você em fluxo, você irresistível. As pessoas sentem isso mesmo sem saber explicar. Você não precisa fazer esforço para atrair - você simplesmente é, e o campo ao redor se reorganiza.

Quando você cai na SOMBRA do ${numeroVida}:
${arquetipo.sombra.map(s => `• ${s}`).join('\n')}

Essa é você em autossabotagem, você em loop de repetição, você criando exatamente o que não quer. E a parte mais difícil: você não percebe. A sombra é "inteligente" - ela se disfarça de personalidade, de "jeito de ser", de "é assim que eu sou".

Sua Missão de Alma:
${arquetipo.missao}

Seu Bloqueio Principal:
${arquetipo.bloqueio}

Como Destravar:
${arquetipo.destrave}

Mantra de Poder:
${arquetipo.mantra}

Repita isso não como afirmação vazia, mas como lembrete consciente toda vez que você pegar se sabotando de novo.

A Dança Entre Signo e Número:

Seu signo é o COMO você se expressa. Seu número é O QUE você veio aprender. Quando os dois entram em coerência consciente, você vira um campo magnético ambulante - as coisas acontecem para você, não por esforço, mas por alinhamento.

Quando eles brigam (você agindo pelo signo mas ignorando a lição do número, ou vice-versa), nasce o padrão clássico: muito esforço, pouco retorno. Muita ação, pouca transformação real.`
  },

  sinteseOperacional: {
    subtitulo: 'SÍNTESE OPERACIONAL (Como você funciona na prática)',
    conteudo: `Se você quiser parar de repetir padrões, pare de tentar “virar outra pessoa”.

Você só precisa rodar seu sistema do jeito certo:

1) Direção antes de intensidade  
2) Estrutura antes de inspiração  
3) Ação pequena antes de promessa grande

Comando de 72 horas (para provar mudança):
Escolha UMA meta simples e execute 30 minutos por dia por 3 dias seguidos.  
Não é para “mudar sua vida”. É para quebrar o piloto automático e recuperar comando interno.`
  }
},
    
    bloqueiosOcultos: {
      titulo: '2. Bloqueios Ocultos: Como Você Se Sabota (E Como Parar)',
      conteudo: `Vamos direto ao ponto: você não está presa porque "não tem sorte", porque "as coisas não dão certo para você" ou porque "o mundo é injusto". Você está presa porque tem um sabotador interno operando 24/7 - e ele é tão sutil que você não reconhece como sabotagem.

Você chama de "meu jeito de ser". Ou de "eu só sou realista". Ou de "eu sou cautelosa". Mas não é. É mecanismo de proteção que virou prisão.

Como Você Se Sabota Pelo Seu Elemento (${elemento}):

${perfilElemento.sabotagem}

Reconhece? Claro que reconhece. Mas até agora você tratou isso como "defeito de personalidade" em vez de como padrão operacional que pode ser reprogramado.

Como Você Se Sabota Pelo Seu Número (${numeroVida}):

${arquetipo.bloqueio}

Isso dói, eu sei. Mas você não mudará o que não reconhece. E o primeiro passo para sair da prisão é admitir que você mesma construiu as grades.

A Verdade Dura Que Ninguém Te Fala:

Sua sabotagem é "inteligente". Ela não parece sabotagem - parece lógica, parece proteção, parece até sabedoria. "Eu só estou sendo realista" (na verdade você está desistindo antes de tentar). "Eu sou muito sensível para isso" (na verdade você está fugindo do desconforto necessário). "Eu preciso de mais tempo para decidir" (na verdade você está usando análise como forma de procrastinação).

O sabotador é mestre em se disfarçar de prudência, de amor próprio, de autocuidado. Mas o resultado é sempre o mesmo: você não age, não muda, não cresce. E aí vem a frustração - mas como a sabotagem é inconsciente, você culpa fatores externos.

Como Destravar AGORA (Não Depois, Não Quando Você Estiver "Pronta"):

${perfilElemento.destrave}

Isso não é teoria. É prática. Se você fizer isso por 7 dias consecutivos, você quebra o padrão. Se você fizer por 21 dias, você cria novo circuito neural. Se você fizer por 90 dias, você se torna outra pessoa - não porque mudou quem você é, mas porque parou de operar no modo de autossabotagem.

O Campo Muda Quando Você Muda.

Não antes. Não "quando as circunstâncias estiverem certas". Agora. Você mudando o padrão interno, o externo se reorganiza. Sempre foi assim. Sempre será.`
    },
    
    faseAtual: {
      titulo: `3. Fase Atual: Seu Ano Pessoal ${anoPessoal2026} em 2026`,
      conteudo: `Você está em Ano Pessoal ${anoPessoal2026}. Isso significa que 2026 tem uma frequência específica para você - e se você trabalhar COM ela (em vez de contra), o ano flui. Se você ignorar, você vai nadar contra a corrente o ano inteiro.

Tema Central de 2026 Para Você:
${anoInfo.foco}

Armadilha Principal deste Ano:
${anoInfo.alerta}

Seu Superpoder em 2026:
${anoInfo.poder}

O Que Fazer (Concretamente):
${anoInfo.acao}

O Tripé de Sustentação para 2026:

1. ENERGIA (Corpo + Mente)
Sem energia, você interpreta tudo como problema. Você vê ameaça onde há oportunidade, peso onde há desafio saudável. A energia não é só "dormir bem e comer direito" - é eliminar drenagem energética crônica (pessoas, situações, padrões mentais que te sugam) e reforçar fontes genuínas de vitalidade.

2. CLAREZA (1 Meta Por Vez)
Dispersão parece liberdade mas é prisão disfarçada. Quando você quer tudo ao mesmo tempo, não consegue nada de verdade. Escolha UMA prioridade para 2026. Uma. Não três. Uma. E estruture o ano inteiro ao redor dela. Você pode adicionar outras coisas depois - mas só depois que essa UMA coisa ganhar tração real.

3. AÇÃO (Ritmo Diário, Não Explosão Ocasional)
Destino não responde a intenção. Responde a repetição. 1 hora por dia durante 365 dias > 10 horas em um dia de motivação. O campo não se impressiona com entusiasmo - se impressiona com consistência. Pequenas ações diárias criam grande transformação ao longo do tempo. Explosões motivacionais criam apenas exaustão e frustração.

A Regra de Ouro Para 2026:

Você não precisa fazer muito. Você precisa fazer TODO DIA. Mesmo nos dias ruins. Especialmente nos dias ruins. O momento em que você mais quer desistir é exatamente o momento que define se você vai quebrar o padrão ou repeti-lo mais uma vez.`
    },
    
    rituais: {
      titulo: '4. Rituais de Poder: Práticas Rápidas (3-7min) Que Realmente Funcionam',
      conteudo: `Esqueça rituais elaborados que você nunca vai fazer. Aqui estão práticas objetivas, rápidas e que realmente mudam padrão. A consistência importa mais que a duração.

RITUAL 1: Reset do Sistema (3 minutos - faça quando estiver travada)

1. Coloque a mão no peito
2. Respiração 5-5: inspira 5 segundos, expira 5 segundos (faça 5 rodadas)
3. Pergunte (em voz alta se possível): "Qual é a verdade aqui que eu estou evitando?"
4. Espere a resposta - ela sempre vem, mesmo que demore 30 segundos de silêncio desconfortável
5. Tome UMA decisão mínima: "Hoje eu faço X" (algo pequeno, concreto, executável)

Esse ritual corta o loop mental. Você não precisa de horas de meditação quando está em crise - precisa de 3 minutos de corte radical da repetição mental.

RITUAL 2: Corte de Padrão (5 minutos - faça semanalmente)

Pegue papel e caneta (não digital):
• Escreva: "O padrão que eu repito é..."
• Escreva: "O preço que eu pago por isso é..."
• Escreva: "A nova regra é..."
• Finalize com uma AÇÃO concreta (não uma intenção, uma AÇÃO): envie 1 mensagem, marque 1 compromisso, delete 1 contato, cancele 1 assinatura, organize 1 gaveta - ALGO pequeno mas real.

O ritual não funciona se ficar só no insight. Precisa terminar em ação física.

RITUAL 3: Magnetismo Silencioso (7 minutos - faça de manhã quando possível)

• 2 min: Coerência cardíaca (respiração lenta + mão no peito + atenção no coração físico)
• 2 min: Postura de poder (coluna ereta + queixo paralelo ao chão + ombros para trás + olhar firme)
• 3 min: Visualização (você agindo no novo padrão sem negociar, sem drama, como se fosse natural)

Isso não é "lei da atração" - é reprogramação neurofisiológica. Seu corpo não distingue entre experiência real e imaginação vívida. Quando você se visualiza agindo diferente, você está criando novo circuito neural. Faça isso por 21 dias e o novo padrão vira automático.

**RITUAL ESPECÍFICO DO SEU ELEMENTO (${elemento}):**

${perfilElemento.ritual}

PROTEÇÃO ENERGÉTICA PARA ${elemento}:

${perfilElemento.protecao}

A Verdade Sobre Rituais:

Ritual não é sobre "energia mística". É sobre criar ponto de pausa consciente em meio ao piloto automático da sua vida. É sobre lembrar quem você decidiu ser quando está funcionando no modo de sobrevivência. É sobre ter uma âncora tangível para voltar quando você se perder (e você vai se perder - todo mundo se perde).

O ritual não te salva. Mas te lembra como você salva a si mesma.`
    },
    
    plano7Dias: {
      titulo: '5. Plano de 7 Dias: Protocolo de Mudança Real (Não Mais Um Desafio Motivacional)',
      conteudo: `Este não é mais um "desafio de 7 dias" que você vai começar empolgada e abandonar no dia 3. É um protocolo de diagnóstico: você vai provar para si mesma, em 7 dias, que você MUDA quando muda o PADRÃO. Simples assim.

**META ÚNICA DESTES 7 DIAS:**
Quebrar o ciclo de autossabotagem em pelo menos UMA área da sua vida. Uma. Não em todas. Uma. Porque uma vitória real vale mais que dez intenções motivacionais.

**DIA 1: LIMITE MÍNIMO (Você Aprende a Dizer Não)**

Escolha UM limite simples e não negociável para hoje:
• "Não vou justificar minhas decisões"
• "Não vou checar celular antes de levantar da cama"
• "Não vou aceitar mudança de plano de última hora"
• "Não vou falar de mim com quem não perguntou"

Um limite. Sustente por 24h. Observe o desconforto que vem (ele sempre vem) e sustente mesmo assim. Você não está sendo "difícil" - está criando contêiner para sua energia.

**DIA 2: ENERGIA FÍSICA (Você Lembra Que Tem Corpo)**

5 minutos de movimento (qualquer um - dança, polichinelo, alongamento)
2 copos de água assim que acordar
15 minutos sem celular ao acordar

Parece básico? É. Mas você não faz. E é por isso que você vive na cabeça, ansiosa, desconectada. Corpo hidratado + corpo em movimento + mente sem estimulação imediata = clareza que você não tem há meses.

**DIA 3: CLAREZA (Você Define O Que Realmente Quer)**

Sente e escreva (não pense muito, apenas escreva):

• "O que eu quero de verdade?" (não o que você acha que deveria querer - o que VOCÊ quer)
• "O que eu paro de tolerar a partir de hoje?" (seja específica)
• "Qual é a minha prioridade ÚNICA pelos próximos 7 dias?" (não três, UMA)

Guarde isso. Você vai precisar nos próximos dias quando a vida tentar te convencer de que você não tem direito de querer isso.

**DIA 4: AÇÃO (Você Termina Algo Que Começou)**

Escolha UMA pendência (não a maior, não a mais importante, não a mais urgente - apenas uma que você pode FINALIZAR hoje) e termine.

Limpar uma gaveta. Responder aquele e-mail. Terminar aquele texto. Fazer aquele telefonema. O cérebro precisa de VITÓRIA tangível, não de lista infinita de "to-do". Uma vitória pequena mas real reconfigura sua relação com ação.

**DIA 5: CORTE (Você Remove Drenagem)**

Corte, apenas por 24h, UM hábito que te suga:
• Rede social específica
• Conversa com pessoa específica
• Notícia/portal de fofoca
• Reclamação (sua ou de alguém)
• Procrastinação em forma de "pesquisa"

Apenas 24h. Observe o impacto. Você vai perceber quanto da sua energia vaza por esses ralos que você chama de "hábito normal".

**DIA 6: COMUNICAÇÃO LIMPA (Você Fala Verdade Sem Drama)**

Fale UMA verdade que você vem adiando. Não precisa ser "a conversa mais difícil da sua vida" - pode ser pequena:
• "Na verdade, eu não quero ir nesse evento"
• "Eu não concordo com isso"
• "Eu preciso de mais tempo"
• "Essa situação não está funcionando para mim"

Verdade sem agressividade. Sem justificativa excessiva. Sem pedir permissão para o que você sente. Apenas: "Eu sinto/penso/quero X". E ponto.

**DIA 7: CONSOLIDAÇÃO (Você Revisa e Decide)**

Sente e responda:

• "O que mudou em mim nesses 7 dias?"
• "Qual padrão enfraqueceu?"
• "Qual novo hábito eu vou manter pelos próximos 21 dias?"
• "O que eu aprendi sobre mim que eu não sabia antes?"

Este não é dia de começar nada novo. É dia de INTEGRAR o que aconteceu. De reconhecer a mudança. De celebrar a vitória (por menor que pareça).

**RESULTADO TÍPICO APÓS 7 DIAS:**
Menos ansiedade. Mais presença. Clareza sobre o que você realmente quer. Respeito próprio que você não tinha há muito tempo. Uma sensação de "eu consigo" que não é baseada em motivação externa, mas em evidência interna real.

**A PARTE QUE NINGUÉM TE CONTA:**

Os 3 primeiros dias você vai achar fácil (novidade + motivação). Dias 4 e 5 você vai querer desistir (tédio + resistência interna). Dia 6 você vai questionar se vale a pena. Dia 7 você vai entender que valeu.

A mudança real não acontece nos dias de motivação. Acontece nos dias em que você continua mesmo sem vontade.`
    },
    
    guiaDecisoes: {
      titulo: '6. Guia de Decisões: Como Parar de Escolher Com Base no Medo',
      conteudo: `Você toma decisão errada não porque "não sabe o certo" - você sabe. O problema é que você ignora o que sabe porque tem medo da consequência de escolher certo.

Deixa eu te dar um exemplo brutal: você já soube que precisava terminar aquele relacionamento, sair daquele emprego, cortar aquela amizade - mas não fez. Por quê? Porque estava escolhendo conforto temporário sobre verdade permanente.

**O TESTE DAS 3 PERGUNTAS (Use Antes de Qualquer Decisão)**

Antes de dizer sim, antes de concordar, antes de aceitar - pause e pergunte:

**1. Isso me EXPANDE ou me ENCOLHE?**

Sinta no corpo. Quando você imagina dizer sim para isso, seu peito abre ou fecha? Você respira fundo ou prende a respiração? Seu corpo não mente - só sua mente justifica.

Expansão = crescimento (mesmo que assuste)
Encolhimento = redução (mesmo que seja seguro)

**2. Isso vem de VERDADE ou de MEDO?**

Verdade = você escolheria isso se não tivesse medo das consequências
Medo = você só está escolhendo para evitar desconforto, conflito, decepção alheia

Se a única razão para dizer sim é "para não magoar", "para não decepcionar", "para não parecer difícil" - você está escolhendo do medo. E decisão baseada em medo SEMPRE te leva para lugar menor do que você merece.

**3. Eu escolheria isso se EU ME VALORIZASSE 20% A MAIS?**

Essa é a pergunta que mata justificativa. Se você se respeitasse um pouco mais, se você se visse como merece ser vista, você diria sim para isso? Ou você só está aceitando porque acha que não merece coisa melhor?

Se a resposta aponta medo/encolhimento/desvalorização, você já sabe: é padrão antigo disfarçado de "oportunidade".

**O "NÃO" QUE MUDA TUDO**

A maior virada na sua vida vai ser quando você aprender a:

• Dizer não sem justificar demais (Não = frase completa)
• Escolher sem pedir validação (Você não precisa de aprovação alheia para sua verdade interna)
• Sustentar sua decisão sem voltar atrás (Dúvida é normal; voltar atrás por insegurança é autossabotagem)

Você não precisa virar "durona". Você não precisa virar "fechada". Você só precisa virar CONSISTENTE - alinhada com o que você diz querer.

**O CORTE RÁPIDO QUE SALVA ANOS DA SUA VIDA:**

**"Eu não decido cansada. Eu descanso, clareio, e depois decido."**

Leia de novo.

Quantas decisões ruins você tomou no final do dia, no meio de uma crise, no pico da emoção? Todas, certo? Porque você decide de estados alterados e depois precisa lidar com consequências permanentes.

Nova regra: se você está cansada, ansiosa, sobrecarregada, reativa - NÃO DECIDA. Não é "deixar para depois" - é se proteger de você mesma quando você não está no seu centro.

**PROTOCOLO DE RETORNO AO CENTRO (Use Quando Estiver Perdida):**

1. PAUSA FÍSICA
Levanta. Respira. Sai do lugar onde você estava. Muda o estado físico antes de tentar mudar o estado mental.

2. PERGUNTA SILENCIOSA
"O que é verdade AGORA?" (não ontem, não amanhã, AGORA)

3. AÇÃO MÍNIMA
Escolha a menor ação possível que te aproxime do que é verdade. Não precisa ser a ação definitiva - apenas o próximo passo lógico.

**COMO SABER SE VOCÊ ESTÁ DECIDINDO CERTO:**

Você não vai ter certeza. Nunca vai. A vida não oferece garantia. Mas você vai ter CLAREZA - e clareza é suficiente.

Clareza não precisa de justificativa externa. Não precisa de aprovação. Não precisa de "sinais do universo". Você simplesmente SABE (mesmo que não goste do que sabe, mesmo que doa, mesmo que assuste).

A decisão certa não é necessariamente a confortável. É a ALINHADA.`
    },
    
    bonus: {
      titulo: '4 Bônus Exclusivos: Módulos Especiais',
      bonus1: {
        titulo: 'BÔNUS 1 — Mapa do Amor: Seu Padrão Afetivo Real (Não o Romantizado)',
        conteudo: `Vamos falar de amor - mas não daquela forma poética e superficial que você já ouviu mil vezes. Vamos falar da verdade: você atrai e é atraída por padrões específicos. E até você entender QUAIS são esses padrões e POR QUE você os repete, você vai continuar achando que "amor não dá certo comigo".

**SEU PADRÃO DE ATRAÇÃO PELO NÚMERO ${numeroVida}:**

${arquetipo.principal} atrai e é atraída por dinâmicas específicas. Você não "dá azar no amor" - você gravita em direção a tipos que refletem sua sombra não integrada.

${numeroVida === 1 ? `Você atrai pessoas que admiram sua força - mas pode afastar quem pede vulnerabilidade real. Sua sombra no amor é confundir liderança com controle, presença com dominação. Você quer ser vista como "forte" mesmo quando precisa de apoio. Resultado: relações onde você "não precisa de ninguém" (mas no fundo se sente sozinha mesmo acompanhada).

Seu destrave afetivo: permitir ser sustentada sem perder sua força. Vulnerabilidade não é fraqueza - é coragem. Quando você consegue ser forte E macia, poderosa E receptiva, você atrai parceria de verdade, não plateia de admiradores.`
: numeroVida === 2 ? `Você atrai quem precisa de cuidado - e perde sua voz no processo. Sua sombra no amor é autoanulação disfarçada de "amor verdadeiro". Você se adapta tanto ao outro que esquece quem você é. Vira camaleão emocional. E depois se ressente (mas não diz).

Seu padrão: escolher pessoas emocionalmente indisponíveis ou "projetos" que você precisa "salvar". Você confunde ser necessária com ser amada.

Seu destrave afetivo: entender que amor real não exige seu desaparecimento. Você pode estar presente sem se dissolver. Pode apoiar sem carregar. Pode amar sem se sacrificar. Quando você aprende a manter sua voz dentro da relação, você atrai quem ama VOCÊ - não quem ama ter uma cuidadora gratuita.`
: numeroVida === 3 ? `Você atrai com leveza e brilho - mas foge de profundidade emocional. Sua sombra no amor é usar charme como escudo contra intimidade real. Você mantém tudo leve, divertido, superficial - porque confronto, vulnerabilidade, peso emocional te assusta.

Seu padrão: relacionamentos que parecem "perfeitos" mas não têm raiz. Você está sempre na fase da paquera/encantamento - mas quando chega a hora de aprofundar, você acha um motivo para sair.

Seu destrave afetivo: permitir que amor seja também peso, também silêncio, também imperfeito. Nem tudo precisa ser "incrível" o tempo todo. As relações mais profundas têm momentos de tédio, de dificuldade, de feio - e está tudo bem. Quando você para de performar e permite ser vista de verdade (inclusive nas partes não interessantes), você acessa intimidade real.`
: numeroVida === 5 ? `Você atrai movimento, novidade, aventura - mas confunde liberdade com fuga. Sua sombra no amor é medo de compromisso disfarçado de "espírito livre". Você quer conexão mas sem "perder sua liberdade" - então você mantém as pessoas à distância, sempre com um pé fora.

Seu padrão: relações intensas mas breves. Você se entrega, se apaixona, vive intensamente - até sentir que está "presa". Aí você explode tudo e começa de novo. Ciclo sem fim.

Seu destrave afetivo: entender que compromisso consciente não é prisão. É escolha renovada diariamente. Você pode ser livre DENTRO de relação profunda - se você escolher parceiro que também valoriza autonomia. Liberdade real não é ausência de vínculo. É capacidade de escolher e sustentar suas escolhas.`
: `Cada número tem um padrão de atração específico. O seu está na forma como você confunde ${arquetipo.sombra[0].toLowerCase()} com amor, como você tolera menos do que merece porque acha que "amor é assim", como você repete sempre o mesmo tipo de relação esperando resultado diferente.`}

**3 REGRAS DE OURO PARA RELACIONAMENTO SAUDÁVEL (Independente do Seu Número):**

**REGRA 1: RECIPROCIDADE CLARA**
Amor sem troca equilibrada vira sacrifício disfarçado de "doação". Se você está sempre dando/cedendo/ajustando e o outro está sempre recebendo/exigindo/mantendo, isso não é amor. É desequilíbrio que você está chamando de "eu amo demais".

Teste simples: se você sumisse por 7 dias, a pessoa te procuraria ativamente ou apenas esperaria você voltar? Se a resposta é "esperaria", você está mais investida do que ela.

**REGRA 2: LIMITES RESPEITADOS**
Você ensina as pessoas como te tratar. Se você não tem limites claros (ou tem mas não sustenta), você está sinalizando que qualquer tratamento é aceitável. E aí você atrai quem não te respeita - não porque "as pessoas são ruins", mas porque você mesma sinalizou que não há consequência para desrespeito.

Novo padrão: Limite dito = limite sustentado. Sempre. Sem exceção. Sem "dessa vez eu deixo passar". Porque "dessa vez" vira "toda vez".

**REGRA 3: PROJETO COMPATÍVEL**
Não adianta "amor verdadeiro" se vocês querem coisas fundamentalmente diferentes. Alguém que quer casar vs alguém que não quer compromisso. Alguém que quer filhos vs alguém que não quer. Alguém que valoriza estabilidade vs alguém que valoriza aventura.

Amor não supera incompatibilidade de valores e direção. Você só vai se ressentir de ter abdicado do que queria "por amor" - e a pessoa vai se ressentir de ser cobrada por algo que nunca prometeu.

Compatibilidade não é "ter tudo igual". É ter valores alinhados E vontade mútua de construir junto.

**SINAIS VERMELHOS QUE VOCÊ IGNORA (Mas Não Deveria):**

• Você se sente pequena perto dessa pessoa (não é amor, é diminuição)
• Você justifica comportamento inaceitável "porque ele/a tem trauma" (compaixão é lindo, mas você não é terapeuta não remunerada)
• Você esconde partes de você para não "assustar" (se você não pode ser inteira, não é seu lugar)
• Você está sempre "trabalhando na relação" mas nada melhora (esforço sem reciprocidade é desperdício)
• Você precisa "provar" que merece amor (você já merece. A pessoa certa não te fará duvidar disso)

**SUA NOVA RÉGUA AFETIVA:**

Não é "será que ele/a gosta de mim?". É: "Essa pessoa me EXPANDE ou me ENCOLHE?". 

Se você sai dos encontros se sentindo melhor consigo mesma = expansão.
Se você sai precisando se provar, se justificar, se adaptar = encolhimento.

Simples assim.`
      },
      bonus2: {
        titulo: 'BÔNUS 2 — Dinheiro & Prosperidade: Seu Código Financeiro Real',
        conteudo: `Vamos falar de dinheiro - mas não daquela forma superficial de "visualize abundância". Vamos falar do padrão real que está bloqueando seu fluxo financeiro. Porque você não é "bloqueada" para dinheiro. Você só está operando com código financeiro bugado.

**SEU CÓDIGO DE PROSPERIDADE PELO NÚMERO ${numeroVida}:**

Pelo seu número, você materializa dinheiro através de: **${
  numeroVida === 1 ? 'liderança e iniciativa' :
  numeroVida === 2 ? 'parcerias e colaboração' :
  numeroVida === 3 ? 'expressão e criatividade' :
  numeroVida === 5 ? 'mudança e versatilidade' :
  'trabalho alinhado com sua missão'
}**

Isso não é "dica motivacional" - é como seu sistema energético se conecta com fluxo financeiro. Quando você trabalha PELO seu código, dinheiro flui. Quando você trabalha CONTRA, você nada contra a corrente.

**BLOQUEIO FINANCEIRO INVISÍVEL DO ${numeroVida}:**

${arquetipo.bloqueio}

Reconhece? Esse é o padrão energético que está bloqueando seu dinheiro - não "o mercado difícil", não "falta de oportunidade", não "crise econômica". É seu padrão interno de operação.

**OS 3 BLOQUEIOS FINANCEIROS QUE TODO MUNDO TEM (Mas Ninguém Admite):**

**BLOQUEIO 1: VOCÊ TRABALHA MUITO MAS COBRA POUCO**

Sua hora tem preço. Sua experiência tem preço. Seu conhecimento tem preço. Mas você cobra como se estivesse "começando" mesmo tendo anos de experiência. Por quê? Porque no fundo você não acredita que seu trabalho vale tanto.

Novo padrão: Seu preço não é baseado no que "o mercado paga". É baseado no VALOR que você entrega + o CUSTO de não ter você. Quando você começa a cobrar pelo valor real (não pelo tempo gasto), tudo muda.

**BLOQUEIO 2: VOCÊ NÃO SABE QUANTO GANHA NEM QUANTO GASTA**

Você vive no "mais ou menos" financeiro. "Mais ou menos ganho X", "mais ou menos gasto Y". Esse "mais ou menos" é a brecha por onde seu dinheiro escorre sem você nem perceber.

Nova regra: Sem organização financeira mínima, você não tem como crescer financeiramente. Você precisa saber EXATAMENTE quanto entra, quanto sai, e para onde vai. Não é sobre controle neurótico. É sobre consciência financeira.

**BLOQUEIO 3: VOCÊ TEM CRENÇA LIMITANTE DISFARÇADA DE "HUMILDADE"**

"Dinheiro não é tudo"
"Eu não trabalho por dinheiro, eu trabalho por propósito"
"Pessoas espirituais não se importam com dinheiro"

Tudo isso é bloqueio disfarçado de virtude. Você PODE ter propósito E dinheiro. Pode ser espiritual E próspera. Pode servir E ser bem remunerada. Uma coisa não anula a outra - a menos que VOCÊ acredite que anula.

**PLANO DE 14 DIAS PARA DESTRAVAR FLUXO FINANCEIRO:**

**SEMANA 1: DIAGNÓSTICO REAL**

DIA 1-2: Mapeie TUDO que entra e TUDO que sai. Sem julgamento. Apenas dados.
DIA 3-4: Identifique vazamentos (onde você gasta sem necessidade/consciência)
DIA 5-6: Liste suas fontes potenciais de renda (todas, não só as "oficiais")
DIA 7: Defina sua meta financeira clara para os próximos 90 dias

**SEMANA 2: AÇÃO CONSCIENTE**

DIA 8-10: Elimine 3 gastos desnecessários (assinaturas esquecidas, hábitos caros sem retorno)
DIA 11-12: Crie/ajuste sua precificação (se você presta serviço) ou negocie aumento (se você é CLT)
DIA 13-14: Tome UMA ação diária que te aproxime da meta (prospecção, networking, lançamento)

**O ERRO DE VIBRAÇÃO MAIS COMUM:**

Você trabalha MUITO mas não cobra o VALOR REAL do seu trabalho. Por quê? Porque você tem medo de "perder o cliente", "assustar as pessoas", "parecer mercenária".

Nova verdade: Se você cobra barato, você atrai cliente que não valoriza seu trabalho. Se você cobra certo, você atrai cliente que QUER o que você faz. A qualidade do seu cliente é proporcional ao seu preço.

**MANTRA FINANCEIRO (Não É Afirmação Vazia - É Lembrete):**

"Meu tempo tem valor. Meu trabalho tem preço. Eu mereço ser bem remunerada pelo que entrego."

Use isso toda vez que você for negociar, precificar, ou aceitar trabalho. Se você não se valoriza, ninguém vai valorizar por você.

**A VERDADE BRUTAL QUE NINGUÉM QUER OUVIR:**

Você não está "bloqueada" para dinheiro. Você só não quer pagar o preço do fluxo financeiro real - que é: cobrar certo, cortar drenagem, agir consistentemente, e parar de se sabotar com crenças limitantes disfarçadas de virtude.

Dinheiro é energia. Flui para quem respeita seu próprio valor e age alinhado com isso.`
      },
      bonus3: {
        titulo: 'BÔNUS 3 — Calendário de Poder: Rotina de 30 Dias Para Transformação Real',
        conteudo: `Este não é calendário motivacional com desafios diários. É estrutura de SUSTENTAÇÃO - porque transformação não acontece em 1 dia de motivação. Acontece em 30 dias de repetição consciente.

**META DESTE MÊS:**
Criar uma nova baseline operacional - ou seja, um novo "normal" para você. Você não vai virar outra pessoa. Mas vai elevar seu padrão de funcionamento em pelo menos 30%.

**SEMANA 1 (DIAS 1-7): CLAREZA**

FOCO: Definir prioridade única + eliminar distrações

Dia 1-2: Escolha UMA área da vida para focar este mês (não três, UMA)
Dia 3-4: Liste e elimine 5 distrações principais (apps, pessoas, hábitos)
Dia 5-6: Crie estrutura mínima para sua prioridade (o que precisa acontecer COMO)
Dia 7: Revisão: "Minha prioridade é X e vou executar fazendo Y"

**SEMANA 2 (DIAS 8-14): ENERGIA**

FOCO: Construir base física/mental sólida

Dia 8-9: Ajuste sono (horário fixo para dormir e acordar)
Dia 10-11: Adicione movimento diário (15min de qualquer atividade física)
Dia 12-13: Limpeza alimentar básica (tire 2 coisas que te detonam, adicione 2 que te nutrem)
Dia 14: Revisão: "Como está minha energia comparado com semana passada?"

**SEMANA 3 (DIAS 15-21): AÇÃO**

FOCO: Uma tarefa finalizada por dia (momento de COLHER)

Dia 15-17: Finalize 1 pendência por dia (não comece coisa nova, TERMINE o que está aberto)
Dia 18-19: Execute ação de impacto relacionada à sua prioridade do mês
Dia 20-21: Ajuste o que não está funcionando (estratégia, abordagem, método)
Dia 21: Revisão: "O que eu materializei esta semana?"

**SEMANA 4 (DIAS 22-28): CONSOLIDAÇÃO**

FOCO: Rituais do elemento ${elemento} + revisão semanal

Dia 22-24: Pratique ritual específico do seu elemento (conforme módulo 4)
Dia 25-26: Corte o que não serve mais (relação, hábito, compromisso)
Dia 27-28: Planeje próximo ciclo baseado no que funcionou este mês
Dia 28: Revisão: "O que mudou em mim neste mês?"

**DIAS 29-30: RECALIBRAÇÃO**

Dia 29: Pausa consciente - sem trabalho, sem produção, apenas SER
Dia 30: Planejamento do próximo ciclo baseado em dados reais (não entusiasmo)

**PRÁTICAS ESPECÍFICAS PARA ELEMENTO ${elemento}:**

${perfilElemento.ritual}

**COMO SABER SE ESTÁ FUNCIONANDO:**

Semana 1: Você vai sentir clareza (e um pouco de ansiedade sobre "será que vou conseguir")
Semana 2: Você vai sentir resistência (corpo e mente vão querer voltar ao velho padrão)
Semana 3: Você vai sentir tração (as coisas começam a fluir mais fácil)
Semana 4: Você vai sentir DIFERENÇA tangível (mais energia, mais clareza, mais resultado)

**O QUE FAZER QUANDO VOCÊ FALHAR (Porque Você Vai):**

Não existe "perder o desafio". Existe "recomeçar no dia seguinte". Você perdeu um dia? Volte no próximo. Perdeu três dias? Volte no quarto. O calendário não é rígido - é estrutura de apoio.

A diferença entre quem transforma e quem desiste não é "nunca falhar". É voltar depois de falhar. Sempre.`
      },
      bonus4: {
        titulo: `BÔNUS 4 — Arquétipo vs Anti-Arquétipo: Luz e Sombra do ${numeroVida}`,
        conteudo: `Você já sabe que é ${arquetipo.principal}. Mas você entende que carrega DOIS lados da mesma moeda - o arquétipo em luz (você magnética) e o anti-arquétipo em sombra (você em autossabotagem)?

A maioria das pessoas vive no anti-arquétipo achando que é só "jeito de ser". Não é. É padrão de sobrevivência cristalizado que você continua executando mesmo quando já não precisa mais.

**SEU ARQUÉTIPO DE PODER (${numeroVida} em LUZ):**

${arquetipo.luz.map(l => `• ${l}`).join('\n')}

Essa é você REAL. Você sem filtro de medo, sem mecanismo de defesa, sem máscara de proteção. Quando você opera daqui, você é magnética sem esforço. As pessoas sentem isso sem saber explicar. Oportunidades aparecem. Portas se abrem. O campo responde.

**SEU ANTI-ARQUÉTIPO (${numeroVida} em SOMBRA):**

${arquetipo.sombra.map(s => `• ${s}`).join('\n')}

Essa é você em modo de autossabotagem. Você operando do medo disfarçado de "prudência", da proteção disfarçada de "realismo", da resistência disfarçada de "isso não é para mim".

**GATILHOS QUE TE JOGAM NA SOMBRA (Aprenda a Reconhecer):**

• **Quando você sente que precisa PROVAR algo** (para si mesma ou para outros)
A sombra sempre precisa validação externa. A luz já SABE seu valor.

• **Quando você age por MEDO em vez de por VERDADE**
Se a única razão para fazer/não fazer algo é "o que vai acontecer se...", você está na sombra.

• **Quando você REPETE o padrão mesmo sabendo que não funciona**
A definição de loucura é fazer sempre igual esperando resultado diferente. Reconhece?

• **Quando você usa desculpas "racionais" para não agir** ("não é o momento", "preciso me preparar mais", "quando eu tiver X eu faço Y")
A sombra é mestre em racionalizar medo como "prudência".

**PROTOCOLO DE 7 DIAS PARA SAIR DA SOMBRA E VOLTAR PARA LUZ:**

**DIA 1: RECONHECIMENTO**
Identifique quando o anti-arquétipo apareceu hoje. Não julgue. Apenas observe: "Ah, eu caí na sombra quando X aconteceu".

**DIA 2: PAUSA CONSCIENTE**
Quando pegar o gatilho acontecendo EM TEMPO REAL, pause. Respire fundo 5 vezes. Saia do lugar físico se possível. Corte o loop antes de agir.

**DIA 3: PERGUNTA CHAVE**
Pergunte: "O que meu eu MAGNÉTICO faria agora?" (não o que seu eu assustado quer fazer - o que seu EU REAL faria)

**DIA 4: AÇÃO ALINHADA**
Escolha a ação do arquétipo em luz, mesmo que pequena. Mesmo que assuste. Mesmo que não tenha garantia. Uma ação. Uma decisão. Um movimento.

**DIA 5: REGISTRO**
Escreva em 2-3 linhas: "Hoje eu escolhi X em vez de Y. Me senti Z". Você está criando nova memória neural.

**DIA 6: REPETIÇÃO**
Faça de novo. E de novo. E de novo. Novo circuito neural se cria por repetição, não por insight único.

**DIA 7: OBSERVAÇÃO DO CAMPO**
Observe como o campo ao seu redor muda quando VOCÊ muda. As pessoas tratam você diferente? As oportunidades aparecem? Você se sente diferente?

**A VERDADE SOBRE ARQUÉTIPO E SOMBRA:**

Você NUNCA vai eliminar completamente a sombra. Ela é parte de você. Mas você pode escolher conscientemente não operar a partir dela. Reconhecer a sombra não é "admitir defeito" - é ter poder de escolha.

Quanto mais você reconhece seu padrão de sombra, mais rápido você sai dele. No começo demora dias. Depois horas. Depois minutos. Até que vira automático: "Ah, essa é minha sombra tentando me proteger de algo que eu nem preciso mais de proteção. Obrigada, mas não".

**VOCÊ NÃO É O PADRÃO. VOCÊ É A CONSCIÊNCIA QUE ESCOLHE PARAR DE REPETI-LO.**

Leia de novo. Essa frase muda tudo.`
      }
    },
    
    fechamento: {
      titulo: 'Sua Intuição Já Sabe: O Que Fazer Agora',
      conteudo: `${primeiroNome}, se você chegou até aqui, você leu mais de 10.000 palavras sobre você mesma. A maioria das pessoas não lê nem metade disso sobre própria vida. Então primeiro: reconheça que você QUER mudar. O problema nunca foi falta de vontade. Foi falta de método.

Agora você tem o método. Não tem mais desculpa.

**NÃO É A VIDA QUE TE PRENDE. É O PADRÃO.**

Você já percebeu isso, certo? Você repete sempre a mesma história, só com personagens diferentes. Mesmo conflito, nova pessoa. Mesmo sabotagem, novo projeto. Mesmo padrão, nova roupagem.

E o pior: você SABE que está repetindo. Mas continua porque o padrão é familiar. E familiaridade, por mais tóxica que seja, parece mais segura que mudança real.

**MAS AGORA VOCÊ TEM O DIAGNÓSTICO.**

Você sabe:
• Como seu elemento opera (motor)
• Qual sua lição de alma (número)
• Onde você se sabota (bloqueios)
• Como você destrava (protocolos)

Não tem mais "eu não entendo por que isso acontece comigo". Você entende. A pergunta agora é: você vai fazer algo diferente ou vai continuar lendo sobre mudança sem mudar?

**O CAMPO RESPONDE À COERÊNCIA.**

Coerência não é "pensar positivo". Não é "visualizar". Não é "afirmar". É AGIR alinhado com o que você diz querer. É escolher conscientemente mesmo quando o piloto automático quer te puxar de volta para o velho padrão.

O campo não se impressiona com intenção. Se impressiona com REPETIÇÃO CONSCIENTE. Pequenas escolhas diárias alinhadas criam grande transformação ao longo do tempo. Explosões motivacionais esporádicas não criam nada além de frustração.

**VOCÊ NÃO ESTÁ AQUI PARA SER PERFEITA.**

Você vai falhar. Vai cair na sombra. Vai esquecer o que leu aqui. Vai voltar pro padrão antigo. Isso é NORMAL. Mudança não é linear. É dois passos pra frente, um pra trás. Mas se você continuar - se você voltar depois de falhar, se você recomeçar depois de desistir - você chega.

**O QUE FAZER AGORA (NÃO AMANHÃ, NÃO "QUANDO ESTIVER PRONTA"):**

1. **Escolha UMA coisa** deste relatório para aplicar nos próximos 7 dias
2. **Não conte para ninguém** que você vai fazer (anunciar dissipa energia)
3. **Apenas faça** (mesmo mal feito, mesmo imperfeito, mesmo com medo)
4. **Observe o que muda** no campo quando você muda internamente

**E DEPOIS DE 7 DIAS:**

Se funcionou, escolha mais uma coisa. E repita. E repita. E repita.

Em 90 dias você vai olhar para trás e não vai reconhecer quem você era. Não porque você virou outra pessoa - mas porque você finalmente parou de se sabotar e permitiu que sua versão real emergisse.

---

*"Você não está aqui para ser perfeita. Você está aqui para ser VERDADEIRA. E verdade - verdade alinhada com ação sustentada - é poder real, é poder sustentável, é poder que ninguém pode tirar de você porque vem de dentro."*

O manual acabou.

A prática começa agora.

Sucesso não é desejo. É decisão sustentada por repetição consciente.

${primeiroNome}, você tem tudo que precisa. Sempre teve.

A única pergunta que resta é: você vai usar?`
    }
  };
}

// ========================================
// COMPONENTE DA PÁGINA
// ========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ManualCompletoPage() {
  const { id } = useParams();
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let mounted = true;

    async function buscarManual() {
  setLoading(true);
  setErro('');
  setManual(null);

  try {
    const { data: analise, error: analiseError } = await supabase
      .from('analises')
      .select('*')
      .eq('id', id)
      .single();

    if (analiseError || !analise) {
      throw new Error('Análise não encontrada');
    }

    if (!mounted) return;

 // ✅ TRAVA DE PAGAMENTO (corrigida)
const paymentStatus = String(analise.payment_status ?? '')
  .trim()
  .toLowerCase();

// opcional: aceita "pago" também (caso você use PT em algum lugar)
const liberado = paymentStatus === 'paid' || paymentStatus === 'pago';

console.log('DEBUG payment_status:', analise.payment_status, '=>', paymentStatus);

if (!liberado) {
  throw new Error(`Pagamento ainda não confirmado (payment_status="${paymentStatus || 'vazio'}")`);
}

// ✅ Só gera manual se estiver pago
const manualGerado = gerarManualCompleto(analise);
setManual(manualGerado);

  } catch (error) {
    if (!mounted) return;
    setErro(error?.message || 'Erro ao carregar manual');
  } finally {
    if (!mounted) return;
    setLoading(false);
  }
}

if (id) buscarManual();
return () => { mounted = false; };
}, [id]);

if (loading) {
  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>
      <div className="center">
        <div className="spinner" />
        <p style={{color:'rgba(233,213,255,0.86)',marginTop:10}}>
          Carregando seu manual ultra-profundo...
        </p>
      </div>
    </div>
  );
}

if (erro || !manual) {
  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>
      <div className="center">
        <div style={{
          maxWidth:600,
          padding:30,
          borderRadius:20,
          background:'rgba(17,7,32,0.5)',
          border:'1px solid rgba(216,180,254,0.2)'
        }}>
          <h1 style={{
            fontSize:32,
            marginBottom:15,
            color:'rgba(245,158,11,0.95)'
          }}>
            Acesso bloqueado
          </h1>

          <p style={{ color:'rgba(233,213,255,0.86)', fontSize:18 }}>
            {erro || 'Não foi possível carregar o manual.'}
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="wrap">
      <style jsx global>{globalCss}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@300;400;500&display=swap" rel="stylesheet" />

      <div className="container">
        <div className="hero">
          <div className="badge">✅ Manual Completo Desbloqueado</div>
          <h1 className="title">Seu Manual de Poder Completo</h1>
          {manual?.meta && (
            <div className="pills">
              <span className="pill">♈ {manual.meta.signo}</span>
              <span className="pill">🔢 Número {manual.meta.numeroVida}</span>
              <span className="pill">🌟 {manual.meta.elemento}</span>
              <span className="pill">⭐ Ano {manual.meta.anoPessoal2026}</span>
            </div>
          )}
        </div>

        {/* INTRODUÇÃO */}
        {manual?.introducao && (
          <section className="card">
            <h2 className="h2">{manual.introducao.titulo}</h2>
            <div className="texto">{manual.introducao.conteudo}</div>
          </section>
        )}

        {/* LEITURA COMPLETA */}
        {manual?.leituraCompleta && (
          <section className="card">
            <h2 className="h2">{manual.leituraCompleta.titulo}</h2>
            {manual.leituraCompleta.motor && (
              <div className="subsecao">
                <h3 className="h3">{manual.leituraCompleta.motor.subtitulo}</h3>
                <div className="texto">{manual.leituraCompleta.motor.conteudo}</div>
              </div>
            )}
            {manual.leituraCompleta.arquitetura && (
              <div className="subsecao">
                <h3 className="h3">{manual.leituraCompleta.arquitetura.subtitulo}</h3>
                <div className="texto">{manual.leituraCompleta.arquitetura.conteudo}</div>
              </div>
            )}
          </section>
        )}

        {/* BLOQUEIOS OCULTOS */}
        {manual?.bloqueiosOcultos && (
          <section className="card">
            <h2 className="h2">{manual.bloqueiosOcultos.titulo}</h2>
            <div className="texto">{manual.bloqueiosOcultos.conteudo}</div>
          </section>
        )}

        {/* FASE ATUAL */}
        {manual?.faseAtual && (
          <section className="card">
            <h2 className="h2">{manual.faseAtual.titulo}</h2>
            <div className="texto">{manual.faseAtual.conteudo}</div>
          </section>
        )}

        {/* RITUAIS */}
        {manual?.rituais && (
          <section className="card">
            <h2 className="h2">{manual.rituais.titulo}</h2>
            <div className="texto">{manual.rituais.conteudo}</div>
          </section>
        )}

        {/* PLANO 7 DIAS */}
        {manual?.plano7Dias && (
          <section className="card">
            <h2 className="h2">{manual.plano7Dias.titulo}</h2>
            <div className="texto">{manual.plano7Dias.conteudo}</div>
          </section>
        )}

        {/* GUIA DE DECISÕES */}
        {manual?.guiaDecisoes && (
          <section className="card">
            <h2 className="h2">{manual.guiaDecisoes.titulo}</h2>
            <div className="texto">{manual.guiaDecisoes.conteudo}</div>
          </section>
        )}

        {/* BÔNUS EXCLUSIVOS */}
        {manual?.bonus && (
          <section className="card">
            <h2 className="h2">{manual.bonus.titulo}</h2>
            
            {manual.bonus.bonus1 && (
              <div className="bonus">
                <h3 className="h3bonus">{manual.bonus.bonus1.titulo}</h3>
                <div className="texto">{manual.bonus.bonus1.conteudo}</div>
              </div>
            )}
            
            {manual.bonus.bonus2 && (
              <div className="bonus">
                <h3 className="h3bonus">{manual.bonus.bonus2.titulo}</h3>
                <div className="texto">{manual.bonus.bonus2.conteudo}</div>
              </div>
            )}
            
            {manual.bonus.bonus3 && (
              <div className="bonus">
                <h3 className="h3bonus">{manual.bonus.bonus3.titulo}</h3>
                <div className="texto">{manual.bonus.bonus3.conteudo}</div>
              </div>
            )}
            
            {manual.bonus.bonus4 && (
              <div className="bonus">
                <h3 className="h3bonus">{manual.bonus.bonus4.titulo}</h3>
                <div className="texto">{manual.bonus.bonus4.conteudo}</div>
              </div>
            )}
          </section>
        )}

        {/* FECHAMENTO */}
        {manual?.fechamento && (
          <section className="card">
            <h2 className="h2">{manual.fechamento.titulo}</h2>
            <div className="texto">{manual.fechamento.conteudo}</div>
          </section>
        )}

        {/* FOOTER */}
        <section className="card" style={{textAlign:'center',marginTop:30,marginBottom:50}}>
          <h2 className="h2">✨ Seu Manual Está Completo</h2>
          <p style={{color:'rgba(233,213,255,0.9)',fontSize:18,lineHeight:1.7,marginTop:15}}>
            Salve esta página nos favoritos e consulte sempre que precisar.
          </p>
        </section>

      </div>
    </div>
  );
}

const globalCss = `
  :root {
    --bg1: #120622;
    --bg2: #23103f;
    --txt: #f3e8ff;
    --muted: rgba(233, 213, 255, 0.86);
    --border: rgba(216, 180, 254, 0.14);
    --gold: rgba(245, 158, 11, 0.95);
    --card-bg: rgba(17, 7, 32, 0.35);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    max-width: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: 'Cormorant Garamond', serif;
    color: var(--txt);
    background: linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 50%, var(--bg1) 100%);
    line-height: 1.7;
  }

  .wrap {
    min-height: 100vh;
    position: relative;
    padding: 20px 0 50px;
  }

  .container {
    max-width: 980px;
    margin: 0 auto;
    padding: 0 20px;
    position: relative;
    z-index: 5;
  }

  .hero {
    padding: 30px 0 20px;
    text-align: center;
  }

  .badge {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 10px 16px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .title {
    margin: 0 0 20px;
    font-family: 'Cinzel', serif;
    font-size: clamp(32px, 5vw, 52px);
    line-height: 1.1;
    font-weight: 700;
    background: linear-gradient(90deg, #fb7185, #a855f7, #f59e0b);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .pills {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 15px;
  }

  .pill {
    padding: 10px 16px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    color: rgba(216, 180, 254, 0.95);
    font-size: 14px;
    font-weight: 500;
  }

  .card {
    margin-top: 20px;
    border-radius: 24px;
    padding: 28px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .h2 {
    font-family: 'Cinzel', serif;
    margin: 0 0 20px;
    font-size: 28px;
    font-weight: 700;
    color: var(--gold);
  }

  .h3 {
    font-family: 'Cinzel', serif;
    margin: 25px 0 15px;
    font-size: 22px;
    font-weight: 600;
    color: rgba(216, 180, 254, 0.95);
  }

  .h3bonus {
    font-family: 'Cinzel', serif;
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 600;
    color: rgba(236, 72, 153, 0.95);
  }

  .texto {
    color: rgba(233, 213, 255, 0.92);
    font-size: 19px;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  .subsecao {
    margin-top: 25px;
  }

  .bonus {
    margin-top: 25px;
    padding: 22px;
    border-radius: 18px;
    border: 1px solid rgba(236, 72, 153, 0.25);
    background: rgba(236, 72, 153, 0.08);
  }

  .center {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    text-align: center;
    padding: 30px 20px;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border-radius: 999px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: rgba(255, 255, 255, 0.9);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .card {
      padding: 20px;
    }
    .h2 {
      font-size: 24px;
    }
    .h3 {
      font-size: 20px;
    }
    .texto {
      font-size: 17px;
    }
  }
`;