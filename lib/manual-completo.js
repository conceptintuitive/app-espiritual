// lib/manual-completo.js

// Mapeamento de elementos por signo
const ELEMENTOS_SIGNOS = {
  'Áries': 'Fogo',
  'Touro': 'Terra',
  'Gêmeos': 'Ar',
  'Câncer': 'Água',
  'Leão': 'Fogo',
  'Virgem': 'Terra',
  'Libra': 'Ar',
  'Escorpião': 'Água',
  'Sagitário': 'Fogo',
  'Capricórnio': 'Terra',
  'Aquário': 'Ar',
  'Peixes': 'Água'
};

// Regentes planetários
const REGENTES = {
  'Áries': 'Marte',
  'Touro': 'Vênus',
  'Gêmeos': 'Mercúrio',
  'Câncer': 'Lua',
  'Leão': 'Sol',
  'Virgem': 'Mercúrio',
  'Libra': 'Vênus',
  'Escorpião': 'Plutão',
  'Sagitário': 'Júpiter',
  'Capricórnio': 'Saturno',
  'Aquário': 'Urano',
  'Peixes': 'Netuno'
};

// Arquétipos por número de vida
const ARQUETIPOS_POR_NUMERO = {
  1: {
    principal: 'O Guerreiro',
    secundarios: ['O Líder', 'O Pioneiro', 'O Inovador'],
    luz: ['Independência radical', 'Coragem para iniciar', 'Força de vontade inabalável', 'Capacidade de liderança natural'],
    sombra: ['Autoritarismo', 'Impaciência extrema', 'Egocentrismo', 'Dificuldade em delegar'],
    missao: 'Você veio para liderar, abrir caminhos e inspirar outros através da sua coragem.'
  },
  2: {
    principal: 'O Diplomata',
    secundarios: ['O Pacificador', 'O Conselheiro', 'O Mediador'],
    luz: ['Empatia profunda', 'Habilidade de unir pessoas', 'Intuição aguçada', 'Sensibilidade emocional'],
    sombra: ['Codependência', 'Dificuldade em dizer não', 'Perda de identidade', 'Indecisão paralisante'],
    missao: 'Você veio para harmonizar, conectar e criar pontes entre mundos diferentes.'
  },
  3: {
    principal: 'O Comunicador',
    secundarios: ['O Artista', 'O Criativo', 'O Expressivo'],
    luz: ['Criatividade ilimitada', 'Dom da palavra', 'Otimismo contagiante', 'Capacidade de inspirar'],
    sombra: ['Dispersão de energia', 'Superficialidade', 'Fuga através da fantasia', 'Procrastinação criativa'],
    missao: 'Você veio para expressar, criar e trazer beleza e alegria ao mundo.'
  },
  4: {
    principal: 'O Construtor',
    secundarios: ['O Arquiteto', 'O Organizador', 'O Alicerce'],
    luz: ['Disciplina férrea', 'Capacidade de materialização', 'Confiabilidade absoluta', 'Visão de longo prazo'],
    sombra: ['Rigidez mental', 'Workaholic', 'Medo de mudanças', 'Perfeccionismo paralisante'],
    missao: 'Você veio para construir estruturas duradouras e criar bases sólidas para gerações.'
  },
  5: {
    principal: 'O Explorador',
    secundarios: ['O Aventureiro', 'O Libertador', 'O Versátil'],
    luz: ['Adaptabilidade extrema', 'Curiosidade insaciável', 'Magnetismo pessoal', 'Liberdade de ser'],
    sombra: ['Instabilidade crônica', 'Dificuldade com compromissos', 'Impulsividade', 'Busca por estímulos constantes'],
    missao: 'Você veio para experienciar, expandir consciências e trazer renovação através da mudança.'
  },
  6: {
    principal: 'O Cuidador',
    secundarios: ['O Curador', 'O Conselheiro', 'O Harmonizador'],
    luz: ['Amor incondicional', 'Senso de responsabilidade', 'Olhar estético refinado', 'Capacidade de nutrir'],
    sombra: ['Autossacrifício', 'Perfeccionismo tóxico', 'Controle disfarçado de cuidado', 'Dependência de aprovação'],
    missao: 'Você veio para curar, nutrir e criar beleza e harmonia nos ambientes.'
  },
  7: {
    principal: 'O Sábio',
    secundarios: ['O Místico', 'O Pesquisador', 'O Filósofo'],
    luz: ['Profundidade espiritual', 'Capacidade analítica', 'Conexão com o invisível', 'Sabedoria ancestral'],
    sombra: ['Isolamento excessivo', 'Ceticismo paralisante', 'Frieza emocional', 'Arrogância intelectual'],
    missao: 'Você veio para desvendar mistérios, conectar mundos e compartilhar sabedoria profunda.'
  },
  8: {
    principal: 'O Manifestador',
    secundarios: ['O Executivo', 'O Alquimista', 'O Magnata'],
    luz: ['Poder de materialização', 'Visão estratégica', 'Magnetismo para abundância', 'Liderança transformadora'],
    sombra: ['Obsessão por poder', 'Materialismo excessivo', 'Manipulação', 'Workaholismo destrutivo'],
    missao: 'Você veio para manifestar abundância, transformar sistemas e empoderar coletivos.'
  },
  9: {
    principal: 'O Humanitário',
    secundarios: ['O Curador Global', 'O Artista da Alma', 'O Transformador'],
    luz: ['Compaixão universal', 'Capacidade de transmutação', 'Sabedoria de múltiplas vidas', 'Dom artístico elevado'],
    sombra: ['Mártir', 'Desilusão com a humanidade', 'Dificuldade em encerrar ciclos', 'Escapismo'],
    missao: 'Você veio para servir a humanidade, transmutar dor em arte e completar ciclos cármicos.'
  },
  11: {
    principal: 'O Iluminado',
    secundarios: ['O Visionário', 'O Canal', 'O Inspirador'],
    luz: ['Intuição supranatural', 'Capacidade de inspirar massas', 'Visão do futuro', 'Conexão espiritual elevada'],
    sombra: ['Ansiedade espiritual', 'Sensação de não pertencer', 'Oscilação entre ego e espírito', 'Sobrecarga energética'],
    missao: 'Você veio para iluminar caminhos, canalizar sabedoria superior e elevar a consciência coletiva.'
  },
  22: {
    principal: 'O Mestre Construtor',
    secundarios: ['O Arquiteto Cósmico', 'O Visionário Prático', 'O Grande Realizador'],
    luz: ['Materialização de grandes visões', 'Capacidade de impactar milhões', 'União perfeita de espírito e matéria', 'Liderança global'],
    sombra: ['Peso da responsabilidade', 'Medo de falhar em grande escala', 'Exaustão pela magnitude', 'Perfeccionismo paralisante'],
    missao: 'Você veio para construir legados duradouros que transformem a realidade física em larga escala.'
  },
  33: {
    principal: 'O Mestre Curador',
    secundarios: ['O Cristo Interior', 'O Avatar do Amor', 'O Curador de Massas'],
    luz: ['Amor universal incondicional', 'Poder de cura profunda', 'Sacrifício consciente', 'Compaixão infinita'],
    sombra: ['Autoanulação total', 'Carregar a dor do mundo', 'Dificuldade extrema com limites', 'Esgotamento compassivo'],
    missao: 'Você veio para curar, amar incondicionalmente e elevar a frequência planetária através do serviço.'
  }
};

// Rituais por elemento
const RITUAIS_POR_ELEMENTO = {
  'Fogo': {
    nome: 'Ritual da Chama Transmutadora',
    quando: 'Terças-feiras ao amanhecer ou entardecer',
    materiais: ['1 vela vermelha ou laranja', 'Papel e caneta', 'Incenso de canela ou cravo', 'Tigela de barro'],
    passos: [
      'Acenda o incenso e a vela em um espaço seguro',
      'Escreva no papel aquilo que deseja transmutar (medo, bloqueio, padrão limitante)',
      'Leia em voz alta com firmeza: "Eu liberto [padrão]. Eu sou fogo que transforma, coragem que avança, luz que não se apaga."',
      'Queime o papel na chama, observando a transmutação',
      'Sinta o calor do fogo dentro do seu peito, ativando sua força vital',
      'Agradeça aos elementos e deixe a vela queimar completamente (em segurança)'
    ],
    frequencia: 'Semanal durante fases de transformação intensa',
    beneficios: 'Ativa coragem, queima padrões antigos, desperta força vital, manifesta ação'
  },
  'Terra': {
    nome: 'Ritual do Enraizamento e Manifestação',
    quando: 'Luas Novas e Quinta-feiras',
    materiais: ['Terra ou areia', 'Sementes', 'Cristais (quartzo fumê, turmalina, hematita)', 'Papel e caneta', 'Vaso ou recipiente'],
    passos: [
      'Descalço, conecte-se com o chão por 3 minutos, respirando profundamente',
      'Escreva 3 intenções materiais claras e específicas',
      'Coloque terra no recipiente, plantando as sementes enquanto mentaliza suas intenções',
      'Enterre os cristais junto às sementes',
      'Afirme: "Como essas sementes criam raízes, minhas intenções se ancoram na matéria. Está feito."',
      'Regue com água e mantenha em local que receba sol',
      'Cuide das plantas diariamente, observando o crescimento das suas manifestações'
    ],
    frequencia: 'Mensal nas Luas Novas',
    beneficios: 'Ancora intenções no físico, desenvolve paciência, conecta com ciclos naturais, manifesta prosperidade'
  },
  'Ar': {
    nome: 'Ritual da Palavra Criadora',
    quando: 'Quartas-feiras ao amanhecer',
    materiais: ['Incenso de lavanda ou sândalo', 'Papel e caneta', 'Sino ou tigela tibetana', 'Cristais (sodalita, ágata azul)'],
    passos: [
      'Acenda o incenso e toque o sino 3 vezes para limpar o espaço',
      'Escreva uma afirmação poderosa no presente: "Eu sou [qualidade desejada]"',
      'Segure os cristais e repita a afirmação 108 vezes (use um mala ou conte)',
      'A cada 27 repetições, pare e respire profundamente, sentindo a vibração das palavras',
      'Ao final, sopre sobre os cristais, impregnando-os com sua intenção',
      'Carregue os cristais com você ou os coloque próximo à sua área de trabalho/estudo'
    ],
    frequencia: '3x por semana durante 21 dias para reprogramação profunda',
    beneficios: 'Reprograma subconsciente, ativa poder da palavra, clareia comunicação, manifesta através do verbo'
  },
  'Água': {
    nome: 'Ritual da Lua e das Águas Sagradas',
    quando: 'Luas Cheias à noite',
    materiais: ['Tigela de vidro ou cristal', 'Água mineral', 'Pétalas de rosa branca', 'Cristais (pedra da lua, ametista, quartzo rosa)', 'Sal marinho'],
    passos: [
      'Na noite de Lua Cheia, coloque água na tigela com uma pitada de sal marinho',
      'Adicione as pétalas e os cristais',
      'Deixe a tigela sob a luz da lua por no mínimo 3 horas',
      'Antes do banho regular, faça uma meditação de 10 minutos visualizando luz prateada purificando suas emoções',
      'Após o banho, jogue a água lunar do pescoço para baixo, mentalizando: "Eu me purifico, eu me renovo, eu fluo com a vida"',
      'Reserve um pouco da água para beber pela manhã (sem os cristais e pétalas)',
      'Agradeça à Lua e aos elementos da água'
    ],
    frequencia: 'Toda Lua Cheia',
    beneficios: 'Limpa campo emocional, equilibra feminino sagrado, amplifica intuição, conecta com ciclos lunares'
  }
};

// Função principal para gerar o manual completo
export function gerarManualCompleto(analise) {
  const { nome, signo, numero_vida } = analise;
  const elemento = ELEMENTOS_SIGNOS[signo];
  const regente = REGENTES[signo];
  const arquetipo = ARQUETIPOS_POR_NUMERO[numero_vida];
  const ritual = RITUAIS_POR_ELEMENTO[elemento];

  return {
    introducao: gerarIntroducao(nome, signo, numero_vida, elemento, regente),
    poderes_ocultos: gerarPoderesOcultos(),
    arquetipos: gerarArquetipos(nome, numero_vida, arquetipo),
    linguagem: gerarLinguagem(nome, numero_vida),
    rituais: gerarRituais(nome, signo, elemento, ritual, numero_vida),
    bloqueios: gerarBloqueios(numero_vida, elemento),
    limpeza: gerarLimpeza(elemento, signo),
    sexualidade: gerarSexualidade(numero_vida, elemento),
    geometria: gerarGeometria(),
    magnetismo: gerarMagnetismo(numero_vida, signo),
    calendario_lunar: gerarCalendarioLunar(nome),
    plano_90_dias: gerarPlano90Dias(nome, numero_vida, elemento, arquetipo)
  };
}

function gerarIntroducao(nome, signo, numero_vida, elemento, regente) {
  return {
    titulo: `Bem-vinda(o) à Sua Jornada de Despertar, ${nome}`,
    conteudo: `
${nome}, este não é um manual comum. É um mapa energético único, criado exclusivamente para VOCÊ, baseado na sua essência espiritual mais profunda.

Você nasceu sob o signo de **${signo}**, carregando a poderosa energia do elemento **${elemento}**, regido por **${regente}**. Seu Número de Vida é **${numero_vida}**, uma frequência vibracional que define o propósito central da sua alma nesta encarnação.

## O Que Torna Este Manual Especial

Este guia foi construído na interseção entre:
- **Sabedoria Ancestral**: Numerologia Pitagórica, Astrologia Hermética, Tantra, Taoísmo
- **Ciência Moderna**: Neurociência, Epigenética, Física Quântica, Psicologia Transpessoal
- **Sua Essência Única**: Cada prática foi selecionada especificamente para sua combinação de signo e número

Em um mundo onde o ceticismo muitas vezes prevalece, este manual cria uma ponte. Aqui, você encontrará não apenas teoria espiritual, mas **ferramentas práticas e cientificamente embasadas** para:

✨ Ativar seus poderes naturais adormecidos
🧬 Reprogramar padrões limitantes no nível celular
🔮 Desenvolver intuição e percepção extrassensorial
💎 Manifestar a realidade que você escolhe viver
🌟 Despertar sua missão de alma e propósito maior

## Como Este Manual Funciona

Diferente de livros genéricos, cada seção foi **personalizada** para você:
- Os rituais foram escolhidos baseados no seu elemento (${elemento})
- Os arquétipos ressoam com sua frequência ${numero_vida}
- As práticas diárias amplificam seus dons naturais de ${signo}
- As afirmações foram calibradas para sua vibração específica

Este é um sistema vivo. À medida que você pratica, você não apenas aprende - você **SE TRANSFORMA**.

## Importante: Epigenética e Neuroplasticidade

A ciência moderna confirma: **você não é vítima do seu DNA ou das suas circunstâncias**. 

A **epigenética** revela que suas emoções, pensamentos e comportamentos podem ativar ou silenciar genes. Isso significa que você é co-criador(a) da sua realidade biológica.

A **neuroplasticidade** comprova que seu cérebro se reorganiza em resposta a novas experiências. Cada prática deste manual cria novos circuitos neurais, literalmente recablando sua mente.

Quando você combina **intenção consciente + prática consistente + estado emocional elevado**, você não está apenas meditando ou fazendo rituais - está **reprogramando sua biologia e seu campo quântico**.

## Seu Compromisso Sagrado

Este manual exige apenas uma coisa de você: **PRÁTICA CONSISTENTE**.

Não basta ler. Você precisa:
- Escolher 1-3 práticas que mais ressoem
- Comprometer-se por no mínimo 21 dias (tempo para formar novo hábito neural)
- Manter um diário de observações e transformações
- Confiar no processo mesmo quando a mente racional duvidar

${nome}, você está prestes a iniciar a jornada mais importante da sua vida: **o retorno a si mesmo(a)**.

Bem-vinda(o) ao seu despertar.

✨ *Que assim seja, e assim é.*
    `
  };
}

function gerarPoderesOcultos(nome) {
  return {
    titulo: 'O Que São os Poderes Ocultos?',
    conteudo: `
Os "poderes ocultos" não são fenômenos sobrenaturais reservados a gurus no Himalaia. São **capacidades humanas naturais**, sistematicamente inexploradas pela mente consciente, que aguardam ativação através de práticas específicas.

## A Base Científica dos Poderes

### 1. Epigenética: Você Pode Reescrever Seu Código

A epigenética é a descoberta mais revolucionária da biologia moderna. Ela prova que:

- **Genes não são destino**: Apenas 5-10% das doenças são puramente genéticas
- **Ambiente interno controla expressão genética**: Seus pensamentos, emoções e crenças ligam/desligam genes
- **Transmissão intergeracional**: Traumas e padrões emocionais podem ser transmitidos por até 4 gerações - MAS também podem ser curados

**Estudo de Referência**: Dr. Bruce Lipton ("A Biologia da Crença") demonstrou que células em laboratório mudam comportamento baseado no "ambiente" químico - assim como suas células mudam baseado em seus estados emocionais.

**Aplicação Prática**: Quando você pratica gratidão, meditação ou rituais, não está apenas "se sentindo melhor" - está literalmente ativando genes de longevidade, redução de inflamação e produção de neurotransmissores.

### 2. Neuroplasticidade: Seu Cérebro é Moldável

Até os anos 1990, acreditava-se que o cérebro adulto era fixo. A neurociência moderna destruiu esse mito:

- **Novas conexões neurais se formam a qualquer idade**
- **Áreas do cérebro crescem com uso repetido** (ex: córtex pré-frontal em meditadores)
- **Traumas podem ser "recablados"** através de práticas somáticas

**Estudo de Referência**: Sara Lazar (Harvard) mostrou que 8 semanas de meditação aumentam massa cinzenta no hipocampo (memória e regulação emocional) e reduzem na amígdala (medo).

**Aplicação Prática**: Cada afirmação repetida, cada visualização, cada ritual cria novos caminhos neurais. Em 21-40 dias de prática consistente, você literalmente tem um novo cérebro.

### 3. Física Quântica Aplicada: O Observador Afeta o Campo

A física quântica revela que:

- **O observador influencia a realidade**: No experimento da dupla fenda, partículas se comportam diferente quando observadas
- **Entrelaçamento quântico**: Partículas separadas permanecem conectadas instantaneamente (base científica da conexão energética)
- **Campo de possibilidades**: Antes da observação, tudo existe em estado de potencialidade

**Aplicação Prática**: Sua atenção focada + emoção elevada + intenção clara = poder de colapsar possibilidades quânticas em realidade física.

### 4. Coerência Cardíaca: O Coração Tem Cérebro

O HeartMath Institute descobriu:

- **O coração tem 40.000 neurônios**: É literalmente um "pequeno cérebro"
- **Campo eletromagnético do coração**: 5.000x mais forte que o do cérebro, detectável a metros de distância
- **Coerência cardíaca**: Quando coração e cérebro entram em sincronia, produz:
  - Redução de 23% de cortisol
  - Aumento de 100% de DHEA (hormônio anti-envelhecimento)
  - Estado de "superconsciência" e intuição elevada

**Aplicação Prática**: As técnicas de respiração e gratidão deste manual ativam coerência cardíaca, gerando estados alterados de consciência mensuráveis.

## Os 7 Poderes Naturais Que Você Vai Despertar

1. **Manifestação Consciente**: Criar realidade através de pensamento-emoção-ação alinhados
2. **Intuição Expandida**: Acessar informação além dos 5 sentidos físicos
3. **Cura Energética**: Influenciar seu próprio campo bioelétrico para saúde
4. **Transmutação Alquímica**: Transformar energia densa (medo, raiva) em combustível criativo
5. **Magnetismo Pessoal**: Atrair pessoas, situações e oportunidades através da frequência
6. **Visão Não-Linear**: Acessar insights de futuros prováveis e memórias de alma
7. **Conexão Multidimensional**: Comunicar-se com aspectos superiores da consciência

## Por Que Esses Poderes Ficaram "Ocultos"

Não é conspiração - é condicionamento:

- **Educação materialista**: Sistema focado em memorização, não em desenvolvimento de consciência
- **Mídia de massa**: Promove distração constante, impedindo estados de presença
- **Traumas geracionais**: Linhagens de medo e desconexão espiritual
- **Falta de prática**: Poderes atrofiam sem uso, como músculos não exercitados

## O Verdadeiro Poder Reside em Suas Escolhas Conscientes

Você não precisa de:
- Iniciações secretas
- Gurus externos
- Ferramentas caras
- Dons especiais de nascença

Você precisa de:
✅ **Intenção clara**
✅ **Prática consistente**
✅ **Estado emocional elevado**
✅ **Confiança no processo**

${nome}, esses poderes sempre estiveram dentro de você. Este manual apenas remove os véus e fornece o mapa.

**Próxima etapa**: Vamos mergulhar nos seus arquétipos únicos de poder...
    `
  };
}

function gerarArquetipos(nome, numero_vida, arquetipo) {
  return {
    titulo: `Seus Arquétipos de Poder - Número ${numero_vida}`,
    subtitulo: arquetipo.principal,
    conteudo: `
${nome}, como portador(a) do Número de Vida **${numero_vida}**, você carrega a energia arquetípica de **${arquetipo.principal}**.

Arquétipos não são apenas "símbolos bonitos" - são **padrões energéticos universais** que existem no inconsciente coletivo da humanidade. Carl Jung dedicou sua vida a estudá-los, e neurociência moderna confirma: **quando você se conecta com um arquétipo, ativa redes neurais específicas** que amplificam esses traits em você.

## Seu Arquétipo Principal: ${arquetipo.principal}

${arquetipo.missao}

### Arquétipos Complementares:
${arquetipo.secundarios.map(arq => `- **${arq}**`).join('\n')}

## Potenciais Luminosos (Quando Ativado)

${arquetipo.luz.map(potencial => `✨ **${potencial}**: Esta é uma das suas maiores forças naturais. Quando você opera nesta frequência, as portas se abrem, as pessoas são magnetizadas, e a vida flui.`).join('\n\n')}

**Como Ativar Conscientemente:**
1. **Manhã**: Ao acordar, respire fundo 3x e afirme: "Hoje eu incorporo [escolha um dos potenciais acima]"
2. **Durante o dia**: Pergunte-se a cada decisão: "Meu ${arquetipo.principal} interior faria isso?"
3. **Noite**: No diário, escreva: "Hoje eu expressei meu arquétipo quando..."

## Sombras a Transcender (Quando Desequilibrado)

Todo arquétipo tem um lado sombra - aspectos que emergem quando você está desalinhado(a), ferido(a) ou operando no medo:

${arquetipo.sombra.map(sombra => `⚠️ **${sombra}**: Quando você perceber este padrão, pare. Respire. Pergunte: "Que medo está por trás disso?"`).join('\n\n')}

**Como Transmutar a Sombra:**
1. **Reconhecimento sem julgamento**: "Eu vejo esse padrão em mim"
2. **Investigação compassiva**: "De que parte ferida isso vem?"
3. **Escolha consciente**: "Hoje eu escolho responder do meu lado luz"
4. **Ritual de liberação**: Use o Ritual do Fogo (seção específica) para queimar contratos com a sombra

## Práticas Diárias para Incorporar Seu Arquétipo

### 🌅 Prática Matinal (5-10 min)
**Meditação do ${arquetipo.principal}**

1. Sente-se em postura confortável, coluna ereta
2. Respire profundamente por 2 minutos
3. Visualize-se incorporando plenamente seu arquétipo
4. Sinta a energia no corpo: Onde você sente o ${arquetipo.principal}? Peito? Plexo solar?
5. Pergunte: "Como o ${arquetipo.principal} agiria hoje?"
6. Receba insights e escreva no diário

### 🌙 Prática Noturna (5 min)
**Revisão Arquetípica**

1. Relembre 3 momentos do dia onde você agiu alinhado com seu arquétipo
2. Identifique 1 momento onde a sombra apareceu
3. Sem julgamento, agradeça pela consciência
4. Afirme: "Amanhã eu integro ainda mais meu ${arquetipo.principal}"

### 📿 Mantra Pessoal de Poder

Repita mentalmente durante o dia, especialmente antes de decisões importantes:

**"Eu sou ${arquetipo.principal}. ${arquetipo.luz[0]}. ${arquetipo.luz[1]}. Eu manifesto minha missão com graça e poder."**

## Integrando Arquétipos em Decisões Práticas

Use este filtro em decisões importantes:

1. **Relacionamentos**: "Este vínculo honra meu ${arquetipo.principal}?"
2. **Trabalho**: "Este projeto permite que eu expresse meus dons naturais?"
3. **Rotina**: "Minha agenda reflete minhas prioridades arquetípicas?"
4. **Dinheiro**: "Este investimento alinha com minha missão?"

## Avisos Importantes

⚠️ **Não se torne escravo do arquétipo**: Você é MAIOR que qualquer arquétipo. Use-os como lentes, não como prisões.

⚠️ **Integre, não imite**: Não tente "agir como" o arquétipo. Permita que ele DESPERTE de dentro.

⚠️ **Todos os arquétipos coexistem**: Você pode acessar qualquer arquétipo conforme necessário. Seu número define apenas o principal.

${nome}, incorporar seu arquétipo não é sobre se tornar alguém diferente - é sobre **remover as máscaras e revelar quem você sempre foi**.

Nas próximas seções, você aprenderá práticas específicas para ancorá-lo ainda mais profundamente...
    `
  };
}

function gerarLinguagem(nome, numero_vida) {
  const afirmacoes = {
  1: [
    'Eu sou líder nato(a). Minha coragem abre caminhos.',
    'Eu inicio. Eu decido. Eu manifesto.',
    'Minha independência é meu poder. Eu confio em mim.',
    'Eu sou a força que move montanhas. Eu sou ação pura.',
    'O universo apoia minha liderança. Eu avanço sem medo.'
  ],
  2: [
    'Eu harmonizo. Eu conecto. Eu uno.',
    'Minha sensibilidade é minha força. Eu sinto e sei.',
    'Eu crio pontes entre mundos. Minha presença é paz.',
    'Eu confio na minha intuição. Ela nunca me engana.',
    'Eu digo não com amor. Meus limites são sagrados.'
  ],
  3: [
    'Eu crio. Eu expresso. Eu inspiro.',
    'Minha criatividade é inesgotável. Eu sou canal divino.',
    'Minhas palavras transformam realidades. Eu comunico verdade.',
    'Eu trago alegria ao mundo. Minha presença ilumina.',
    'Eu manifesto através da arte. Minha expressão é meu poder.'
  ],
  4: [
    'Eu construo. Eu persisto. Eu realizo.',
    'Minha disciplina é minha liberdade. Eu crio estruturas sólidas.',
    'Eu sou alicerce. Eu sou confiança. Eu sou realização.',
    'Passo a passo, eu ergo impérios. Minha constância é invencível.',
    'Eu abraço mudanças necessárias. Eu adapto sem perder essência.'
  ],
  5: [
    'Eu sou livre. Eu exploro. Eu experimento.',
    'Mudança é meu elemento. Eu fluo com a vida.',
    'Minha versatilidade é meu dom. Eu me adapto a tudo.',
    'Eu atraio aventuras divinas. Oportunidades me encontram.',
    'Eu me comprometo com minha liberdade. Esse é meu pacto sagrado.'
  ],
  6: [
    'Eu cuido. Eu nutro. Eu harmonizo.',
    'Meu amor cura. Minha presença conforta.',
    'Eu me coloco em primeiro lugar com amor. Eu me priorizo.',
    'Eu crio beleza no mundo. Minha estética eleva.',
    'Responsabilidade é meu dom, não meu fardo. Eu sirvo com alegria.'
  ],
  7: [
    'Eu sei. Eu investigo. Eu compreendo.',
    'Minha conexão espiritual é minha âncora. Eu confio no invisível.',
    'Eu equilibro solidão e conexão. Ambas me nutrem.',
    'Mistérios se revelam para mim. Eu sou canal de sabedoria.',
    'Minha mente analítica serve meu coração. Eu integro razão e intuição.'
  ],
  8: [
    'Eu manifesto. Eu prospero. Eu lidero.',
    'Abundância flui para mim. Eu sou magnetismo puro.',
    'Eu transformo sistemas. Meu poder serve o bem maior.',
    'Dinheiro é energia que circula através de mim. Eu sou canal de riqueza.',
    'Eu uso poder com sabedoria. Eu empodero outros.'
  ],
  9: [
    'Eu transmuto. Eu curo. Eu sirvo.',
    'Minha compaixão abraça a humanidade. Eu sou amor em ação.',
    'Eu encerro ciclos com gratidão. Eu avanço renovado(a).',
    'Minha arte é minha cura. Eu transformo dor em beleza.',
    'Eu sirvo sem me anular. Meu cuidado comigo é sagrado.'
  ],
  11: [
    'Eu ilumino. Eu inspiro. Eu canalizo.',
    'Minha intuição é divina. Eu confio nas mensagens que recebo.',
    'Eu vim para elevar consciências. Minha presença desperta.',
    'Eu equilibro espírito e matéria. Eu vivo em ambos os mundos.',
    'Minha sensibilidade é meu superpoder. Eu honro minha energia.'
  ],
  22: [
    'Eu construo legados. Eu materializo visões. Eu impacto massas.',
    'Grandes sonhos são minha natureza. Eu realizo o impossível.',
    'Eu uno céu e terra. Espírito se manifesta através de mim.',
    'Meu trabalho transforma gerações. Eu sou arquiteto(a) do futuro.',
    'Eu aceito minha grandeza. Eu nasci para isto.'
  ],
  33: [
    'Eu amo. Eu curo. Eu sirvo.',
    'Meu amor é infinito, e meus limites são claros. Ambos coexistem.',
    'Eu curo o planeta através da minha própria cura. Eu começo por mim.',
    'Compaixão é meu caminho. Sabedoria é minha guia.',
    'Eu sou canal do amor divino. Eu permito que ele flua através de mim.'
  ]
};

  return {
    titulo: 'A Linguagem Como Código Vibracional',
    conteudo: ` ${nome}, suas palavras não são apenas sons - são **comandos quânticos** que reorganizam sua realidade.

## A Ciência Por Trás das Afirmações

### Neurolinguística e Programação do Subconsciente

A Dr. Caroline Leaf (neurocientista) descobriu que:
- **75-98% dos pensamentos são inconscientes** e repetitivos
- **Pensamentos criam estruturas físicas no cérebro** (proteínas)
- **21 dias de novo pensamento = nova via neural**
- **63 dias = hábito permanente**

Quando você repete uma afirmação com **emoção + repetição + visualização**, você:
1. Ativa o RAS (Sistema Ativador Reticular) - o filtro do cérebro
2. Cria novas sinapses no córtex pré-frontal
3. Libera dopamina (reforço positivo)
4. Reprograma crenças no subconsciente

### O Experimento do Dr. Masaru Emoto

O Dr. Emoto congelou água exposta a diferentes palavras:
- Água exposta a "amor" e "gratidão" = cristais simétricos e belos
- Água exposta a "ódio" = cristais deformados

**Seu corpo é 70% água.** Imagine o impacto das suas palavras internas.

## Suas Afirmações Personalizadas de Poder

Como Número ${numero_vida}, estas afirmações foram **calibradas** para sua frequência:

${afirmacoes[numero_vida].map((afir, i) => `
### ${i + 1}. "${afir}"

**Como usar:**
- Repita em voz alta, olhando-se no espelho
- Sinta a vibração no corpo enquanto fala
- Imagine já sendo/tendo/vivendo isso
- Use como mantra durante caminhadas ou exercícios
`).join('\n')}

## Protocolo de Ativação Diária

### 🌅 Manhã (5 min): Imprinting Neural
1. Ao acordar, antes de pegar o celular
2. Escolha 1 afirmação da sua lista
3. Repita 108x (use um mala ou app contador)
4. A cada 27 repetições, pare e SINTA a afirmação no corpo

### 🌙 Noite (3 min): Consolidação no Sono
1. Antes de dormir (estado hipnagógico = porta do subconsciente)
2. Sussurre 3x sua afirmação mais importante
3. Durma com ela ecoando na mente

### 📝 Escrita Sagrada (1x por semana)
1. Escolha 1 afirmação
2. Escreva 15x à mão (não digite)
3. Ao escrever, visualize e SINTA

## Comandos Quânticos Universais

Use estes comandos para manifestações específicas:

**Para Materializar Desejos:**
"Eu sou a realidade que escolho viver. [Desejo] já está feito no campo quântico. Eu permito que se manifeste na matéria. Gratidão."

**Para Limpar Bloqueios:**
"Eu liberto tudo que não me serve. Perdoo tudo que precisa ser perdoado. Eu me liberto. Estou livre."

**Para Ativar Potencial:**
"Eu ativo agora todos os códigos de luz adormecidos em meu DNA. Meu potencial máximo desperta AGORA."

**Para Proteção Energética:**
"Eu sou luz impenetrável. Somente amor entra em meu campo. Eu sou protegido(a) pelo meu Eu Superior."

**Para Manifestação Acelerada:**
"O que eu foco expande. O que eu sinto manifesta. O que eu declaro se materializa. Está feito."

## A Importância da Emoção

⚠️ **CRÍTICO**: Afirmação sem emoção = palavras vazias.

Você PRECISA:
1. **Sentir a afirmação como real AGORA** (não no futuro)
2. **Gerar a emoção do desejo já realizado**
3. **Vibrar na frequência do que deseja atrair**

Como fazer:
- Feche os olhos ao afirmar
- Lembre de uma memória feliz (ativa emoção)
- Enquanto sente essa alegria, fale a afirmação
- Seu cérebro liga afirmação + emoção = realidade

## Evite Estas Armadilhas

❌ **Afirmações com negação**: "Eu não sou pobre" (cérebro ignora o "não")
✅ **Sempre no positivo**: "Eu sou abundante"

❌ **Tempo futuro**: "Eu VOU ser feliz"
✅ **Tempo presente**: "Eu SOU feliz"

❌ **Dúvida enquanto afirma**: "Eu sou rico (mas não acredito)"
✅ **Suspensão da descrença**: Finja que já é verdade por 5 minutos

❌ **Afirmações genéricas copiadas**
✅ **Personalizadas para VOCÊ** (como as desta seção)

## Ritual Semanal: Recalibração da Palavra

**Domingo à noite:**
1. Escolha 3 afirmações para a semana
2. Escreva-as em post-its
3. Cole nos locais estratégicos:
   - Espelho do banheiro
   - Tela do computador
   - Geladeira
4. Cada vez que vir, pare, respire, repita em voz alta

## Journaling de Manifestação

**Template diário (2 min):**

"Hoje, [DATA], eu SOU [afirmação].
A prova disso foi [evento do dia que validou].
Eu me sinto [emoção].
Gratidão por [3 coisas]."

Exemplo:
"Hoje, 15/01/2025, eu SOU abundante.
A prova disso foi receber um elogio inesperado no trabalho.
Eu me sinto valorizada e confiante.
Gratidão por minha saúde, minha casa, minha resiliência."

## Afirmações para Momentos Específicos

**Antes de reunião/apresentação importante:**
"Eu comunico com clareza e impacto. Minhas palavras inspiram. Eu sou presença magnética."

**Diante de desafio:**
"Eu sou maior que qualquer problema. Soluções fluem através de mim. Eu transformo obstáculos em oportunidades."

**Ao acordar com ansiedade:**
"Eu respiro. Eu confio. Eu estou seguro(a). Este momento passa. Eu escolho paz."

**Antes de dormir:**
"Eu liberto este dia. Eu me perdoo. Eu me renovo. Amanhã é nova oportunidade. Eu durmo em paz."

${nome}, suas palavras são varinhas mágicas. Use-as conscientemente.

Próxima seção: vamos aprender os rituais práticos para ancorar tudo isso...
    `
  };
}

function gerarRituais(nome, signo, elemento, ritual, numero_vida) {
  return {
    titulo: `Rituais Sagrados para ${signo} (Elemento ${elemento})`,
    conteudo: `
${nome}, rituais não são superstição - são **tecnologia espiritual** que cria marcos neurológicos e energéticos.

## Por Que Rituais Funcionam (Ciência)

### Neurociência dos Rituais

Estudos da Harvard e Stanford mostram:
- **Rituais reduzem ansiedade em 47%** (Michael Norton)
- **Criam "âncoras neurais"** - gatilhos para estados específicos
- **Ativam córtex pré-frontal** (foco) e reduzem amígdala (medo)
- **Liberam dopamina** (recompensa) e ocitocina (conexão)

### Psicologia do Simbolismo

Carl Jung provou: **símbolos falam diretamente com o inconsciente**, bypassing a mente racional.

Quando você acende uma vela com intenção:
1. Consciente: "Estou acendendo vela"
2. Inconsciente: "Estou ativando luz interior, transmutação, presença divina"

## Seu Ritual Principal: ${ritual.nome}

Como ${signo} do elemento ${elemento}, este é SEU ritual de poder.

### ✨ ${ritual.nome}

**Quando praticar:** ${ritual.quando}

**Frequência:** ${ritual.frequencia}

**O que você precisa:**
${ritual.materiais.map(mat => `• ${mat}`).join('\n')}

**Passo a passo completo:**

${ritual.passos.map((passo, i) => `
**${i + 1}. ${passo}**

*Enquanto faz isso, mantenha presença total. Não pense em outra coisa. Este é seu momento sagrado.*
`).join('\n')}

**Benefícios (validados cientificamente):**
${ritual.beneficios}

---

## Rituais Universais (Para Todos os Signos)

### 🪞 Ritual do Espelho (Reconstrução de Identidade)

**Base científica:** Mirror neurons + autocompaixão (Kristin Neff, PhD)

**Quando:** Diariamente, ao acordar ou antes de dormir

**Como fazer:**
1. Fique em frente ao espelho, sozinho(a), em silêncio
2. Olhe nos próprios olhos por 2 minutos (sem julgar)
3. Coloque a mão no coração
4. Diga olhando nos olhos: "Eu te amo. Eu te aceito. Você é suficiente."
5. Escolha 1 afirmação do seu número (${numero_vida}) e repita 3x
6. Sele com um sorriso genuíno para si mesmo(a)

**Transformação esperada em 21 dias:**
- Aumento de autoestima
- Redução de autocrítica
- Melhora na imagem corporal
- Fortalecimento do "eu interno"

---

### 🕯️ Ritual da Vela (Transmutação Alquímica)

**Base científica:** Fogo como símbolo arquetípico + foco meditativo

**Quando:** Luas Minguantes (liberação) ou quando sentir peso emocional

**Materiais:**
- 1 vela (branca para limpeza, dourada para prosperidade, rosa para amor, roxa para espiritualidade)
- Papel e caneta
- Tigela de barro ou metal
- Fósforo (evite isqueiro - o fogo do fósforo tem intenção)

**Como fazer:**
1. Crie espaço sagrado: silencie celular, feche porta, acenda incenso se tiver
2. Respire fundo 9x para centralizar
3. Escreva no papel aquilo que deseja transmutar (medo, padrão, bloqueio, relação tóxica)
4. Acenda a vela com intenção: "Eu ativo o fogo sagrado da transmutação"
5. Leia o que escreveu em voz alta com emoção
6. Queime o papel na chama, observando a fumaça subir
7. Enquanto queima, afirme: "Eu liberto. Eu transmuto. Eu me renovo. Está feito."
8. Deixe a vela queimar completamente (com segurança)
9. Jogue as cinzas na terra ou água corrente

**Variação para MANIFESTAR:**
- Escreva o desejo já realizado ("Eu SOU próspera", "Eu TENHO relacionamento saudável")
- Em vez de queimar, coloque o papel debaixo da vela
- Deixe a vela queimar sobre ele
- Guarde o papel em local sagrado (altar, Bíblia, gaveta especial)

---

### 🌙 Ritual Lunar Completo (Alinhamento com Ciclos)

**Base científica:** Cronobiologia + ritmos circadianos (+ influência gravitacional da lua)

#### Lua Nova (Semear)
**Quando:** Nas primeiras 72h da Lua Nova

**Como fazer:**
1. Banho de limpeza (sal grosso + arruda)
2. Vista roupas limpas (preferencialmente brancas)
3. Acenda vela branca
4. Escreva 10 intenções para o ciclo: "Eu manifesto [X]"
5. Leia em voz alta com emoção
6. Coloque o papel em envelope lacrado
7. Afirme: "Está plantado. Está germinando. Está feito."
8. Guarde o envelope (não abra até Lua Cheia)

#### Lua Crescente (Nutrir)
**Quando:** Entre Lua Nova e Cheia

**Foco:** Ação alinhada
- Revise suas intenções mentalmente
- Tome 1 ação prática por dia em direção a elas
- Mantenha afirmações diárias
- Evite dúvida (ela "seca" as sementes)

#### Lua Cheia (Manifestar e Celebrar)
**Quando:** Nas 48h da Lua Cheia

**Como fazer:**
1. Abra o envelope da Lua Nova
2. Marque com ✅ o que já manifestou
3. Para o que ainda não manifestou, pergunte: "O que preciso liberar/mudar?"
4. Prepare água lunar (veja ritual completo abaixo)
5. Banho de rosas brancas + água lunar
6. Celebre (dance, cante, agradeça)
7. Sexo sagrado ou autoerotismo consciente (se sentir chamado) - pico de energia criativa

**Água Lunar (instrução detalhada):**
- Tigela de vidro com água mineral
- 1 pitada de sal marinho
- Pétalas de rosa branca
- Cristais (quartzo, pedra da lua, ametista) - lavados antes
- Deixe sob luz da lua por no mínimo 3h
- Use no banho (do pescoço para baixo)
- Beba um pouco pela manhã (sem cristais/pétalas)
- Energiza, limpa, ativa intuição

#### Lua Minguante (Liberar)
**Quando:** Entre Lua Cheia e Nova

**Como fazer:**
1. Liste tudo que quer liberar (padrões, pessoas, emoções, crenças)
2. Queime a lista no ritual da vela
3. Banho de descarga (veja seção Limpeza Energética)
4. Jejum se possível (ou dieta leve)
5. Silêncio contemplativo
6. Perdão ativo (a si mesmo e outros)

---

### 🙏 Ritual Ho'oponopono (Cura Havaiana)

**Base científica:** Perdão reduz cortisol, melhora sistema imune, regula pressão

**O que é:** Antiga prática havaiana de reconciliação e perdão

**As 4 frases mágicas:**
1. "Sinto muito" (responsabilidade)
2. "Me perdoa" (humildade)
3. "Sou grato(a)" (reconhecimento)
4. "Eu te amo" (conexão)

**Como praticar:**

**Versão Curta (diária - 5 min):**
- Antes de dormir, respire fundo
- Repita as 4 frases em voz alta ou mental por 5-10 minutos
- Dirija para si mesmo(a), pessoas específicas ou situações

**Versão Completa (semanal - 20 min):**
1. Sente-se confortavelmente
2. Escolha situação/pessoa que gera desconforto
3. Visualize a situação/pessoa à sua frente
4. Fale para a imagem:
   - "Sinto muito por qualquer dor que eu causei ou carreguei desta situação"
   - "Me perdoa por não ter visto com clareza"
   - "Sou grato(a) pelo aprendizado que isso trouxe"
   - "Eu te amo" (repita até sentir suavizar)
5. Imagine luz violeta dissolvendo a situação
6. Respire e libere

**Use para:**
- Relações difíceis
- Padrões repetitivos
- Culpa ou vergonha
- Situações do passado
- Autossabotagem

---

### 🧘 Ritual de Ancoragem (Enraizamento)

**Para quando:** Ansiedade, dispersão, excesso de mental, desconexão do corpo

**Como fazer (10 min):**
1. Descalço, de pé, pés afastados na largura dos ombros
2. Flexione levemente joelhos
3. Respire profundo, imaginando raízes saindo dos pés
4. A cada expiração, as raízes vão mais fundo na terra
5. Sinta o peso do corpo, a gravidade
6. Afirme: "Eu sou terra. Eu sou corpo. Eu estou aqui, agora."
7. Termine comendo algo (frutas, castanhas) - conecta com matéria

**Variação:**
- Deite no chão (não na cama)
- Abra braços e pernas
- Sinta cada parte do corpo tocando o solo
- "Eu permito que a Terra me segure"

---

## Criando Seu Ritual Personalizado

Você pode (e deve!) criar rituais que ressoem com VOCÊ.

**Fórmula Universal:**
1. **Intenção clara**: O que você quer com este ritual?
2. **Símbolo escolhido**: Elemento (fogo, água, terra, ar), objeto sagrado, palavra de poder
3. **Repetição**: Mesma estrutura sempre (o cérebro associa padrão = estado)
4. **Presença total**: 100% focado durante o ritual (não é tarefa mecânica)
5. **Encerramento**: "Está feito", gesto de gratidão, selamento

**Exemplo de ritual personalizado:**
"Todo sábado de manhã, eu acendo incenso de sândalo, coloco música instrumental, danço por 10 minutos com intenção de liberar a semana, e termino com 3 respirações profundas e a afirmação: 'Eu me renovo. Eu me liberto. Eu estou pronto(a) para o novo.'"

---

## Altares Pessoais (Espaço Sagrado)

**Por que ter:** Ponto focal de energia, âncora visual, lembrete físico

**Como criar:**
1. Escolha local (mesa, prateleira, canto de quarto)
2. Limpe fisicamente
3. Defuma com incenso ou palo santo
4. Coloque elementos dos 4 elementos:
   - Fogo: vela
   - Água: copinho com água (troque semanalmente)
   - Terra: cristal, planta, sal
   - Ar: incenso, pena
5. Adicione itens pessoais (fotos, objetos significativos)
6. Use diariamente para meditação, orações, afirmações

---

${nome}, estes rituais não são obrigatórios - são **ferramentas**. Escolha 2-3 que mais ressoem e pratique por 40 dias. A transformação será inegável.

Próxima seção: vamos identificar e limpar seus bloqueios energéticos...
    `
  };
}

function gerarBloqueios(numero_vida, elemento) {
  const bloqueios_por_numero = {
    1: ['Medo de falhar e perder liderança', 'Solidão por não delegar', 'Impaciência com o ritmo dos outros', 'Competitividade tóxica'],
    2: ['Dependência emocional', 'Dificuldade em estabelecer limites', 'Perda de identidade em relacionamentos', 'Indecisão paralisante'],
    3: ['Dispersão de energia criativa', 'Superficialidade nas relações', 'Procrastinação por excesso de ideias', 'Medo de não ser levado a sério'],
    4: ['Rigidez mental e resistência a mudanças', 'Workaholismo e negligência do lazer', 'Perfeccionismo paralisante', 'Medo do caos e imprevisibilidade'],
    5: ['Instabilidade e falta de raízes', 'Dificuldade com compromissos', 'Impulsividade destrutiva', 'Busca incessante por novidade gerando vazio'],
    6: ['Autossacrifício e negligência pessoal', 'Perfeccionismo que gera frustração', 'Controlar outros "pelo bem deles"', 'Dependência de aprovação'],
    7: ['Isolamento excessivo', 'Ceticismo que bloqueia experiências', 'Racionalização de emoções', 'Dificuldade em confiar'],
    8: ['Obsessão por status e dinheiro', 'Workaholismo compensatório', 'Manipulação para manter poder', 'Medo de perder controle'],
    9: ['Idealismo ferido gerando desilusão', 'Dificuldade em pôr limites', 'Mártir que carrega dor dos outros', 'Dificuldade em encerrar ciclos'],
    11: ['Sobrecarga sensorial e energética', 'Ansiedade espiritual', 'Sensação de não pertencer', 'Oscilação entre ego e missão'],
    22: ['Medo de não conseguir materializar a visão', 'Peso da responsabilidade global', 'Perfeccionismo em larga escala', 'Exaustão pela magnitude da missão'],
    33: ['Autoanulação em nome do serviço', 'Carregar a dor do mundo', 'Culpa ao priorizar-se', 'Esgotamento compassivo']
  };

  const bloqueios_por_elemento = {
    'Fogo': ['Raiva reprimida queima por dentro', 'Impulsividade destrutiva', 'Burn-out por excesso de ação', 'Competitividade tóxica'],
    'Terra': ['Materialismo compensatório', 'Rigidez corporal (somatização)', 'Apego a segurança que limita crescimento', 'Desconexão do corpo'],
    'Ar': ['Excesso de mental, falta de sentir', 'Ansiedade por futuro', 'Dispersão de energia', 'Comunicação sem coração'],
    'Água': ['Emoções estagnadas (depressão)', 'Codependência emocional', 'Ser esponja energética', 'Medo de sentir profundamente']
  };

  return {
    titulo: 'Identificando e Transmutando Seus Bloqueios',
    conteudo: `
Todo ser humano carrega bloqueios - padrões inconscientes que limitam nosso potencial. A diferença está em **reconhecê-los conscientemente** e **transmutá-los ativamente**.

## Seus Bloqueios Prováveis (Número ${numero_vida})

${bloqueios_por_numero[numero_vida].map((bloq, i) => `
### ${i + 1}. ${bloq}

**Autodiagnóstico:**
- Isso ressoa com você?
- Quando este padrão aparece?
- Qual a emoção por trás? (medo, raiva, tristeza, vergonha?)
- De onde você acha que vem? (infância, trauma, crença familiar?)

**Antídoto:**
[Este bloqueio será transmutado com as práticas específicas das próximas seções]
`).join('\n')}

## Bloqueios do Elemento ${elemento}

${bloqueios_por_elemento[elemento].map(bloq => `• ${bloq}`).join('\n')}

## A Raiz de Todos os Bloqueios

**Todas** as limitações vêm de **UMA** fonte: **Medo de não ser amado/suficiente/seguro**.

Este medo se disfarça de:
- Perfeccionismo ("se eu for perfeito, serei amado")
- Controle ("se eu controlar, estarei seguro")
- Complacência ("se eu agradar, serei aceito")
- Isolamento ("se eu me afasto, não serei ferido")

**Próxima seção:** Técnicas avançadas de limpeza energética para dissolver esses bloqueios...
    `
  };
}

function gerarLimpeza(elemento, signo) {
  return {
    titulo: 'Limpeza e Proteção Energética Profunda',
    conteudo: `
Antes de manifestar, você precisa **limpar o campo**. É como tentar plantar em solo cheio de lixo - não funciona.

## Banho de Descarrego Completo (Mensal)

**Quando fazer:** Lua Minguante, fim de mês, após períodos intensos

**Ingredientes:**
- 1 litro de água filtrada
- 3 punhados de sal grosso
- 1 punhado de arruda (seca ou fresca)
- 1 punhado de alecrim
- 7 gotas de óleo essencial de lavanda (opcional)

**Como preparar:**
1. Ferva a água
2. Adicione sal grosso e ervas
3. Abafe por 15 minutos
4. Coe (remova as ervas)
5. Deixe esfriar até temperatura agradável
6. Adicione óleo essencial

**Como fazer:**
1. Tome seu banho higiênico normal primeiro
2. Desligue o chuveiro
3. Respire fundo 9x, centralizando-se
4. Mentalize: "Eu liberto tudo que não é meu. Eu me limpo. Eu me renovo."
5. Jogue a água do pescoço para baixo (evite cabeça/rosto)
6. Enquanto joga, visualize luz violeta dissolvendo energias densas
7. **NÃO enxágue depois** - deixe secar naturalmente
8. Vista roupas limpas (preferencialmente brancas ou claras)

**Após o banho:**
- Evite ambientes/pessoas pesadas por 24h
- Beba bastante água
- Durma cedo
- Evite álcool, carnes pesadas, discussões

**Frequência:** 1x por mês (sempre na Lua Minguante)

---

## Banho de Prosperidade (Quinzenal)

**Quando:** Luas Crescente e Cheia

**Ingredientes:**
- 1 litro de água
- 7 folhas de louro
- 1 punhado de manjericão fresco
- Casca de 1 laranja
- 1 colher (sopa) de mel
- 3 moedas douradas (limpas)

**Preparo e uso:** Igual ao banho de descarrego, mas mentalizando abundância

**Afirmação ao jogar:** "Eu atraio abundância. Dinheiro flui para mim. Eu sou próspera(o)."

---

## Banho de Amor e Abertura do Coração

**Quando:** Sextas-feiras (dia de Vênus) ou Luas Cheias

**Ingredientes:**
- 1 litro de água
- 1 punhado de pétalas de rosa (rosa ou vermelha)
- 7 gotas de essência de rosas
- 1 quartzo rosa (limpo)
- Canela em pau (opcional)

**Afirmação:** "Meu coração está aberto. Eu atraio amor verdadeiro. Eu sou amada(o)."

---

## Defumação (Limpeza de Ambientes)

**O que usar:**
- **Alecrim**: limpeza geral, afasta inveja
- **Arruda**: proteção, corta magia negativa
- **Sálvia branca**: limpeza profunda, sagra espaços
- **Palo Santo**: eleva vibração, atrai bem-estar
- **Incenso de olíbano**: conexão espiritual

**Como defumar (casa completa - mensal):**
1. Abra todas as janelas
2. Comece pela entrada principal
3. Acenda o defumador
4. Caminhe em sentido horário por todos os cômodos
5. Passe a fumaça em cantos, atrás de portas, embaixo de camas
6. Mentalize luz branca preenchendo cada espaço
7. Afirme: "Somente luz habita este lar. Toda energia densa é transmutada."
8. Termine na entrada, jogando a fumaça para fora
9. Feche a porta com afirmação: "Está limpo. Está protegido. Assim é."

**Frequência:**
- Limpeza completa: 1x por mês (Lua Minguante)
- Manutenção: 1x por semana (cômodos principais)
- Emergencial: após visitas pesadas, discussões, doenças

---

## Proteção Energética Diária

### Escudo de Luz (3 min - manhã)

1. De pé, feche os olhos
2. Respire fundo, conectando-se com o coração
3. Visualize uma esfera de luz dourada no centro do peito
4. A cada respiração, a esfera expande
5. Em 7 respirações, a esfera envolve todo seu corpo
6. Afirme: "Eu estou protegida(o). Somente amor entra em meu campo. Eu sou luz impenetrável."
7. Sele tocando o coração 3x

### Corte de Cordões Energéticos (noturno)

**Quando:** Sempre que sentir drenagem após interações

**Como fazer:**
1. Visualize cordões invisíveis conectando você a pessoas/situações
2. Pegue uma tesoura imaginária de luz violeta
3. Corte cada cordão afirmando: "Eu me liberto. Eu me desconecto. Eu sou livre."
4. Imagine os cordões se dissolvendo em luz
5. Preencha os espaços com luz dourada
6. Sele: "Eu mantenho apenas conexões de amor consciente. O resto eu liberto."

---

## Ho'oponopono Expandido (Cura Profunda)

**Versão Completa Guiada (20-30 min):**

**Preparação:**
- Espaço silencioso
- Música suave (opcional)
- Papel e caneta
- Lenços (você pode chorar - é liberação)

**Passo a Passo:**

1. **Liste 5 situações/pessoas que ainda geram desconforto**
   - Não julgue, apenas observe
   - Pode ser trauma antigo ou incômodo recente

2. **Escolha 1 para trabalhar hoje**

3. **Sente-se confortavelmente, coluna ereta**

4. **Respire fundo 9x**
   - Inspire pelo nariz (4 segundos)
   - Segure (4 segundos)
   - Expire pela boca (8 segundos)

5. **Visualize a situação/pessoa à sua frente**
   - Veja nitidamente
   - Sinta as emoções que emergem
   - Permita sentir (não reprima)

6. **Fale com a imagem (em voz alta ou mental):**

   "**Sinto muito.**
   Sinto muito por qualquer dor que causei conscientemente ou não.
   Sinto muito por carregar ressentimento.
   Sinto muito por não ter visto com os olhos do amor."
   
   (Pause. Respire. Sinta.)

   "**Me perdoa.**
   Me perdoa por ter julgado.
   Me perdoa por ter fechado meu coração.
   Me perdoa por não ter compreendido."
   
   (Pause. Permita que lágrimas venham se necessário.)

   "**Sou grata(o).**
   Sou grata(o) pelo aprendizado que esta experiência trouxe.
   Sou grata(o) por me mostrar onde preciso crescer.
   Sou grata(o) por me fazer mais forte e compassiva(o)."
   
   (Pause. Mude a emoção para gratidão.)

   "**Eu te amo.**
   Eu te amo porque você é parte da teia da vida.
   Eu te amo porque você é espírito em jornada, assim como eu.
   Eu te amo porque o amor cura tudo."
   
   (Repita "Eu te amo" quantas vezes sentir necessário - até suavizar)

7. **Visualize luz violeta envolvendo a situação/pessoa**
   - Veja a luz dissolvendo a dor
   - Veja você e a pessoa/situação em paz

8. **Respire fundo 3x e afirme:**
   "Está limpo. Está curado. Está completo. Eu liberto. Eu me liberto. Eu sou livre."

9. **Queime o papel** (se escreveu) ou visualize a imagem se dissolvendo em luz

10. **Beba água. Descanse.**

**Faça isso para cada situação da lista ao longo de semanas.**

**Resultados esperados:**
- Alívio emocional imediato
- Melhora em relacionamentos
- Liberação de padrões repetitivos
- Aumento de clareza mental
- Sensação física de "leveza"

---

## Técnica EFT - Tapping (Libertação Emocional)

**O que é:** Acupuntura emocional sem agulhas (comprovado por Harvard)

**Para que serve:** Liberar traumas, medos, crenças limitantes, ansiedade

**Pontos de tapping (bata suavemente com 2 dedos):**
1. Topo da cabeça
2. Início da sobrancelha
3. Lado do olho
4. Embaixo do olho
5. Embaixo do nariz
6. Queixo
7. Clavícula
8. Embaixo do braço (4 dedos abaixo da axila)

**Como fazer:**

1. **Identifique o problema**
   - Ex: "Eu tenho medo de fracassar"
   - Dê nota de 0-10 da intensidade

2. **Frase de setup** (batendo no lado da mão):
   "Mesmo tendo [problema], eu me amo e me aceito profundamente e completamente."
   Repita 3x

3. **Sequência de tapping** (bata em cada ponto 7x enquanto fala):
   - Topo da cabeça: "Esse medo de fracassar"
   - Sobrancelha: "Essa ansiedade"
   - Lado do olho: "Esse medo"
   - Embaixo do olho: "Eu não sou boa(o) o suficiente"
   - Embaixo do nariz: "Esse medo intenso"
   - Queixo: "Toda essa ansiedade"
   - Clavícula: "Medo de não ser suficiente"
   - Embaixo do braço: "Todo esse medo"

4. **Respire fundo e reavalie** (de 0-10)

5. **Repita até chegar a 0-2**

6. **Rodada positiva** (mesmos pontos):
   - "Eu escolho me sentir confiante"
   - "Eu sou capaz"
   - "Eu confio em mim"
   - "Eu liberto esse medo"
   - "Eu escolho paz"
   - "Eu sou segura(o)"
   - "Eu mereço sucesso"

**Use para:** Ansiedade antes de eventos, insônia, traumas, padrões sabotadores

**Frequência:** Sempre que necessário (sem limite)

---

## Meditação de Limpeza Guiada (15 min)

**Áudio mental - você pode gravar no celular lendo devagar:**

"Sente-se confortavelmente... Feche os olhos... Respire fundo...

Imagine uma luz violeta acima da sua cabeça... A cada respiração, ela desce...

Entra pelo topo da cabeça... limpa sua mente de todos os pensamentos pesados...

Desce para o terceiro olho... limpa sua visão... clareia sua intuição...

Desce para a garganta... limpa suas palavras... libera tudo que não foi dito...

Entra no coração... dissolve mágoas... libera ressentimentos... cura feridas antigas...

A luz violeta continua descendo... limpa plexo solar... libera medos... ansiedades...

Limpa o ventre... libera emoções estagnadas... traumas sexuais... culpas...

Desce pelas pernas... pelos pés... e se ancora na terra...

Toda energia densa desce pelas plantas dos pés e vai para a terra...

A Mãe Terra transmuta tudo em luz...

Agora, imagine uma luz dourada entrando pela sola dos pés...

Subindo pelas pernas... quadris... ventre... coração... garganta... cabeça...

Você é um canal de luz... violeta desce, dourada sobe...

Você é presença pura... amor puro... luz pura...

Respire aqui por alguns minutos...

Quando estiver pronta(o), movimente dedos das mãos e pés...

Abra os olhos suavemente... Você está limpa(o). Você está protegida(o). Você está renovada(o)."

---

## Sinais de que Você Precisa de Limpeza URGENTE

⚠️ **Físicos:**
- Cansaço inexplicável
- Dores de cabeça frequentes
- Tensão nos ombros/pescoço
- Insônia ou sono agitado

⚠️ **Emocionais:**
- Irritabilidade sem motivo
- Ansiedade constante
- Tristeza profunda
- Sensação de "peso"

⚠️ **Mentais:**
- Pensamentos obsessivos
- Dificuldade de concentração
- Confusão mental
- Decisões difíceis

⚠️ **Energéticos:**
- Absorver emoções de outros
- Sentir-se "sugada(o)" após interações
- Ambientes pesam
- Sensação de "não estar no corpo"

**Se você tem 3+ desses sinais:** Faça limpeza completa HOJE (banho + defumação + meditação)

---

## Proteção de Ambientes Específicos

### Quarto (Sono Sagrado)
- Amatista embaixo do travesseiro
- Sem eletrônicos (ou modo avião)
- Água com sal grosso embaixo da cama (trocar semanalmente)
- Defumar com lavanda antes de dormir

### Escritório/Trabalho
- Quartzo fumê na mesa (absorve radiação + energias densas)
- Planta (espada-de-são-jorge = proteção)
- Tigela com sal grosso escondida em gaveta (trocar mensalmente)

### Entrada da Casa
- Vassoura de piaçava atrás da porta (varrer energias)
- Tapete de entrada (barreira simbólica)
- Sal grosso nos cantos (invisível)
- Mantra: "Somente amor entra aqui"

---

## Calendário de Limpeza Ideal

**Diário:**
- Escudo de luz (manhã)
- Corte de cordões (noite)

**Semanal:**
- Defumação rápida (casa)
- EFT (se necessário)

**Quinzenal:**
- Banho energético (prosperidade ou amor)

**Mensal:**
- Banho de descarrego completo (Lua Minguante)
- Defumação profunda (toda casa)
- Ho'oponopono de situação pendente

**Trimestral:**
- Limpeza COMPLETA (banho + defumação + ho'oponopono + EFT + meditação no mesmo dia)
- Revisão energética: "O que ainda pesa? O que preciso liberar?"

---

Próxima seção: Vamos mergulhar na energia mais poderosa do universo - a sexualidade sagrada...
    `
  };
}

function gerarSexualidade(numero_vida, elemento) {
  return {
    titulo: 'Sexualidade Sagrada e Energia Kundalini',
    conteudo: `
⚠️ **AVISO:** Esta seção é para maiores de 18 anos e aborda sexualidade de forma espiritual e científica, sem vulgaridade.

A energia sexual é a **força criadora primordial** - é literalmente a energia que gera vida. Quando reprimida, adoece. Quando dispersada sem consciência, esgota. Quando **transmutada e canalizada**, torna-se o combustível mais potente para manifestação, criatividade, saúde e despertar espiritual.

---

## A Ciência da Energia Sexual

### Neuroquímica do Prazer

Durante excitação/orgasmo, o cérebro libera:
- **Dopamina** (recompensa e motivação)
- **Ocitocina** (amor e conexão)
- **Serotonina** (bem-estar)
- **Endorfinas** (analgésico natural)
- **Prolactina** (satisfação)

**Mas há mais:** Estados de êxtase sexual ativam as **MESMAS áreas cerebrais** que meditação profunda, experiências místicas e estados de flow.

### Energia Kundalini (Explicação Científica)

**Místico:** Serpente de fogo adormecida na base da coluna que, ao despertar, sobe pelos chakras até o topo da cabeça, gerando iluminação.

**Científico:** Intensa atividade eletroquímica na medula espinhal, com propagação de sinais neurais até o córtex cerebral, ativando áreas dormentes e gerando estados alterados de consciência.

**Relatos reais de despertar Kundalini:**
- Calor intenso subindo pela coluna
- Tremores involuntários
- Visões de luz
- Sensação de êxtase
- Expansão de consciência
- Insights profundos
- Cura espontânea de doenças

**IMPORTANTE:** Kundalini pode ser intensa - sempre com supervisão ou preparo gradual.

---

## Transmutação da Energia Sexual

Napoleon Hill ("Pense e Enriqueça") dedicou um capítulo inteiro a isso, afirmando: **"Os homens [e mulheres] de maior realização possuem forte energia sexual, mas aprenderam a transmutá-la."**

**O que é transmutação?**
Redirecionar a energia sexual (ao invés de dispersá-la) para:
- Criatividade artística
- Realizações profissionais
- Projetos empresariais
- Estudos profundos
- Práticas espirituais
- Cura pessoal

### Como Transmutar

#### 1. Evite Dispersão Inconsciente

❌ **Armadilhas modernas:**
- Pornografia (superestímulo que dessensibiliza)
- Masturbação compulsiva (sem presença)
- Sexo casual sem conexão (drena energia)

✅ **Não é repressão!** É consciência.

**Diferença:**
- **Repressão:** "Sexo é errado, eu nego meu desejo"
- **Transmutação:** "Sexo é sagrado, eu direciono essa energia conscientemente"

#### 2. Respiração Tântrica (Circular a Energia)

**Prática solo ou em casal (10-15 min):**

1. **Sente-se confortavelmente**, coluna ereta
2. **Conecte-se com a respiração** (2 min de respiração profunda)
3. **Ative a energia sexual** (não precisa de toque, apenas intenção):
   - Contraia levemente o períneo (músculo entre genitais e ânus)
   - Visualize energia vermelha/dourada na base da coluna
4. **Inspire profundamente**, levando ar até a base da coluna (4 segundos)
5. **Retenha** (4 segundos) enquanto visualiza a energia subindo pela coluna
6. **Expire** (6-8 segundos), levando a energia até o topo da cabeça
7. **Pause** (2 segundos), sentindo a energia no topo
8. **Inspire novamente**, trazendo energia do topo para o coração
9. **Repita** por 10-15 minutos

**Sensações possíveis:**
- Calor na coluna
- Formigamento
- Ondas de prazer não-genital
- Sensação de expansão
- Êxtase sutil

**Benefícios:**
- Energia elevada (sem café!)
- Criatividade disparada
- Foco laser
- Magnetismo pessoal aumentado
- Libido saudável (não compulsiva)

#### 3. Brahmacharya Temporário (Continência Sexual)

**O que é:** Período de abstinência sexual consciente (solo ou com parceiro).

**NÃO é:** Castidade eterna ou repressão.

**Por que fazer:** 
- Acumular energia para projeto importante
- Preparar-se para manifestação grande
- Curar padrões sexuais disfuncionais
- Despertar Kundalini com segurança

**Como fazer:**
- Escolha período (7, 21, 40 ou 90 dias)
- Sem sexo, masturbação ou pornografia
- Permita sentir desejo (não reprima pensamentos)
- Redirecione energia para projeto/prática
- Use respiração tântrica diariamente

**Relatos comuns:**
- Primeiros 7 dias: difícil, desejo aumenta
- Dias 10-20: energia explode, criatividade dispara
- Dia 21+: sensação de superpoder, clareza mental, magnetismo

**Sair da prática:** Sempre com ritual (não de forma impulsiva)

---

## Sexo Sagrado (Em Casal)

### Diferença: Sexo Comum vs Sexo Sagrado

**Sexo Comum:**
- Foco: orgasmo
- Energia: tensão → liberação → sono
- Duração: 5-15 min
- Resultado: prazer momentâneo

**Sexo Sagrado:**
- Foco: conexão + circulação de energia
- Energia: expansão contínua → êxtase prolongado
- Duração: 30 min a 2h
- Resultado: cura, união, transcendência

### Práticas Tântricas para Casais

#### Ritual de Preparação

**Antes do encontro:**
1. Banho (ambos)
2. Espaço sagrado (incenso, velas, música suave)
3. Sentem-se frente a frente, olhos nos olhos
4. Respirem juntos (2 min)
5. Afirmem intenção: "Nós nos unimos no sagrado"

#### Técnica: Karezza (Sexo sem Orgasmo)

**O que é:** Penetração lenta, suave, sem buscar clímax.

**Como:**
1. Penetração com presença total
2. Movimentos mínimos (ou sem movimento)
3. Foco na respiração sincronizada
4. Visualizem energia circulando entre vocês
5. Duração: 20-60 min
6. Não busquem orgasmo (ele pode vir, mas não é meta)

**Benefícios:**
- Conexão profunda
- Cura de traumas sexuais
- Equilíbrio hormonal
- Energia elevada (não esgotamento)

#### Técnica: Respiração Sincronizada

**Durante o ato:**
1. Olhem nos olhos
2. Um inspira enquanto outro expira
3. Visualizem energia fluindo em círculo entre vocês
4. Mantenham por vários minutos

**Resultado:** União de campos energéticos, experiência mística.

---

## Práticas Solo (Autoerotismo Sagrado)

### Ritual de Autoamor

**NÃO é masturbação compulsiva!**

**Preparação:**
1. Banho ritual
2. Espaço sagrado (velas, incenso)
3. Defina intenção: "Eu honro meu corpo como templo"

**Prática:**
1. Toque TODO o corpo (não apenas genitais)
2. Envie amor para cada parte
3. Respire profundamente
4. Se chegar ao orgasmo, visualize energia subindo pela coluna (não dispersando)
5. Afirme: "Eu me amo. Eu sou energia pura."

**Após:**
- Não durma imediatamente
- Medite por 5-10 min
- Journaling (insights que vieram)

**Frequência:** Quando sentir chamado (não por compulsão)

---

## Cura de Traumas Sexuais

Se você tem histórico de abuso, trauma ou relação disfuncional com sexualidade:

### Práticas de Cura

1. **Terapia somática** (busque profissional especializado)
2. **Ho'oponopono direcionado ao corpo sexual**:
   - Fale com seus genitais: "Sinto muito, me perdoa, sou grata(o), eu te amo"
3. **Reclaim seu corpo**:
   - Desenhe seu corpo nu
   - Envie amor para cada parte
   - Afirme: "Meu corpo é meu. Minha sexualidade é sagrada."
4. **Ritual de renascimento sexual**:
   - Lua Nova
   - Banho de rosas brancas
   - Afirmação: "Eu me liberto de todas as violações. Meu corpo é templo renascido."

---

## Sexualidade por Elemento (${elemento})

**Elemento ${elemento}:**

${elemento === 'Fogo' ? `
- **Natureza:** Intensa, apaixonada, espontânea
- **Desafio:** Impulsividade, queimar rápido demais
- **Prática:** Tantalize a energia (vá devagar), respire profundo
- **Afirmação:** "Meu fogo é controlado. Eu queimo com intenção."
` : elemento === 'Terra' ? `
- **Natureza:** Sensual, presente, conectada ao corpo
- **Desafio:** Rigidez, vergonha, bloqueio
- **Prática:** Massagens sensuais, toque consciente
- **Afirmação:** "Meu corpo é sagrado. Eu me permito prazer."
` : elemento === 'Ar' ? `
- **Natureza:** Exploradora, curiosa, mental
- **Desafio:** Desconexão do corpo, fantasia sem presença
- **Prática:** Trazer atenção para sensações físicas (não só mental)
- **Afirmação:** "Eu sinto meu corpo. Eu estou presente no prazer."
` : `
- **Natureza:** Emocional, intuitiva, fluida
- **Desafio:** Absorver energia do parceiro, codependência
- **Prática:** Proteger campo energético, afirmar limites
- **Afirmação:** "Meu prazer é meu. Eu me nutro primeiro."
`}

---

## Avisos Importantes

⚠️ **Kundalini não é brincadeira**: Se sentir tremores incontroláveis, calor extremo, ou medo intenso, PARE e busque orientação.

⚠️ **Respeite seus limites**: Nunca force práticas que não ressoem.

⚠️ **Consentimento é sagrado**: Em casal, tudo deve ser acordado conscientemente.

⚠️ **Cura leva tempo**: Se tem traumas, seja gentil consigo. Busque ajuda profissional.

---

## Integração: Sexualidade + Manifestação

**Quando você está em estado de êxtase sexual**, seu campo energético expande 10x. **Este é o momento de manifestar.**

**Técnica de Manifestação Sexual:**

1. Durante autoerotismo sagrado ou sexo consciente
2. No momento de maior prazer (com ou sem orgasmo)
3. **Visualize seu desejo já realizado**
4. **Sinta a emoção de já ter**
5. **Afirme: "Está feito"**
6. **Libere** (não fique obcecado depois)

**Resultados:** Manifestações aceleradas (testemunhado por inúmeras tradições tântricas e modernas).

---

Próxima seção: Geometria Sagrada e a matemática do universo...
    `
  };
}

function gerarGeometria() {
  return {
    titulo: 'Geometria Sagrada: A Matemática da Criação',
    conteudo: `
A geometria sagrada não é "arte mística" - é a **linguagem matemática pela qual o universo se organiza**. De átomos a galáxias, tudo segue padrões geométricos específicos.

## Ciência Por Trás

### Sequência de Fibonacci e Proporção Áurea (Phi = 1,618...)

**Onde aparece:**
- Espiral de conchas (náutilus)
- Disposição de pétalas em flores
- Formato de galáxias
- Proporções do corpo humano
- DNA (hélice dupla)
- Arte renascentista (Da Vinci usava)
- Pirâmides do Egito

**Por que importa:** O cérebro humano **reconhece e se acalma** com padrões áureos. É beleza matemática que ressoamos instintivamente.

### Neuroestética

Estudos da UCL e Max Planck mostram:
- **Formas simétricas** ativam núcleo accumbens (prazer)
- **Fractais naturais** reduzem stress em 60%
- **Mandalas** induzem estado alfa (relaxamento + foco)

**Aplicação:** Observar/criar geometria sagrada **reorganiza padrões neurais**.

---

## Principais Símbolos e Seus Usos

### 🌸 Flor da Vida

**O que é:** 19 círculos sobrepostos formando padrão de flor.

**Significado:** Contém todo padrão de criação - blueprint do universo.

**Onde aparece:** Templos egípcios (6.000+ anos), Ásia, Europa medieval.

**Como usar:**
- **Meditação:** Foque no centro, permita olhos relaxarem, entre em transe
- **Ambiente:** Quadro/mandala na parede (harmoniza espaço)
- **Água energizada:** Coloque copo sobre imagem por 30 min antes de beber

### 🔷 Cubo de Metatron

**O que é:** Contém todos os 5 Sólidos Platônicos (formas 3D perfeitas: tetraedro, cubo, octaedro, dodecaedro, icosaedro).

**Significado:** Estrutura fundamental da realidade física - tudo que existe vem dessas formas.

**Como usar:**
- **Proteção:** Visualize ao seu redor em momentos de ataque energético
- **Manifestação:** Desenhe e coloque seus desejos dentro
- **Ativação de geometrias internas:** Meditação focada nele

### 🌀 Torus (Rosquinha Energética)

**O que é:** Campo em forma de anel que gira sobre si mesmo.

**Onde aparece:**
- Campo eletromagnético do coração
- Campo da Terra
- Maçã
- Galáxias

**Significado:** Representa fluxo contínuo de energia - entrada no topo, saída na base, retorno pelas laterais.

**Como usar:**
- **Visualização do campo:** Imagine torus ao seu redor, energia circulando
- **Limpeza:** Visualize torus girando rapidamente, jogando fora energias densas

### ☯️ Vesica Piscis (Dois Círculos Sobrepostos)

**O que é:** Forma de amêndoa criada pela interseção
**Significado:** União de opostos, portal dimensional, nascimento de nova realidade

**Onde aparece:**
- Olho de Hórus
- Yoni (símbolo feminino sagrado)
- Peixe cristão primitivo
- Portais de catedrais góticas

**Como usar:**
- **Manifestação:** Desenhe, coloque desejo no centro (espaço de interseção)
- **União de polaridades:** Meditação para integrar masculino/feminino interno
- **Portal:** Visualize passando por ela para acessar outras dimensões de consciência

### 🌀 Espiral (Fibonacci/Áurea)

**O que é:** Crescimento/expansão contínua seguindo proporção 1,618

**Significado:** Evolução, crescimento, jornada da alma

**Como usar:**
- **Desenho terapêutico:** Desenhe espirais quando ansioso(a) - acalma mente
- **Caminhada espiral:** Crie labirinto em espiral no chão, caminhe meditando
- **Visualização:** Imagine-se no centro de espiral ascendente (evolução contínua)

### 🔺 Merkaba (Estrela de 6 Pontas 3D)

**O que é:** Dois tetraedros entrelaçados (pirâmides)

**Significado:** "Veículo de luz" - campo energético ativado que permite viagem interdimensional

**Como usar:**
- **Meditação Merkaba (avançado - 15 min):**
  1. Sente-se, coluna ereta
  2. Visualize tetraedro com vértice para cima (ponta na cabeça, base abaixo dos pés)
  3. Visualize tetraedro invertido (ponta nos pés, base acima da cabeça)
  4. Gire mentalmente: um horário, outro anti-horário
  5. Acelere até virarem disco de luz
  6. Sinta seu corpo dentro do "ovo" de luz
  7. Afirme: "Meu Merkaba está ativado. Eu viajo dimensões conscientemente."

**Efeitos:** Expansão de consciência, proteção, aceleração de manifestação

---

## Práticas com Geometria Sagrada

### 🎨 Desenho de Mandalas (Terapia Criativa)

**Por que funciona:**
- Ativa hemisfério direito (criatividade, intuição)
- Induz estado meditativo
- Expressa inconsciente através de símbolos
- Equilibra mente

**Como fazer:**

1. **Centro:** Comece com ponto/círculo no centro do papel
2. **Expansão radial:** Crie padrões que saem do centro para fora
3. **Repetição:** Use formas repetitivas (círculos, triângulos, pétalas)
4. **Cores intuitivas:** Não planeje, deixe mão escolher
5. **Sem julgamento:** Não existe "feio" - é expressão da alma

**Frequência:** 2-3x por semana, 20-30 min

**Após terminar:**
- Observe a mandala
- Pergunte: "O que ela quer me mostrar?"
- Anote insights no diário

**Interpretação de cores (inconsciente):**
- Vermelho: energia vital, paixão, raiva
- Laranja: criatividade, alegria, expansão
- Amarelo: intelecto, poder pessoal
- Verde: cura, equilíbrio, coração
- Azul: comunicação, paz, espiritualidade
- Roxo: misticismo, transmutação
- Preto: mistério, morte simbólica, proteção
- Branco: pureza, renascimento, clareza

### 🧘 Meditação com Geometrias

**Prática guiada (10-15 min):**

"Sente-se confortavelmente, feche os olhos, respire fundo...

Visualize à sua frente uma **Flor da Vida** dourada, flutuando...

A cada respiração, ela fica mais nítida, mais radiante...

Observe os 19 círculos perfeitamente entrelaçados...

Sinta a harmonia, a ordem, a perfeição matemática...

Agora, a Flor da Vida começa a girar lentamente...

Enquanto gira, ela emite luz dourada que toca seu corpo...

Você sente cada célula se reorganizando em padrões perfeitos...

Seu DNA se alinha com a geometria sagrada do universo...

Você É geometria sagrada. Você É ordem divina. Você É perfeição matemática.

Permaneça aqui por alguns minutos...

Quando estiver pronto(a), agradeça à geometria e abra os olhos suavemente."

### 🏠 Geometria Sagrada no Ambiente

**Onde colocar:**

**Quarto:**
- Flor da Vida acima da cama (harmonia do sono)
- Mandala na parede lateral (equilíbrio emocional)

**Sala de meditação/estudo:**
- Cubo de Metatron (foco + proteção)
- Sri Yantra (manifestação + abundância)

**Escritório/trabalho:**
- Torus (fluxo criativo)
- Espiral áurea (crescimento contínuo)

**Entrada da casa:**
- Flor da Vida (harmonização de quem entra)

**Formas de ter:**
- Quadros impressos
- Mandalas pintadas à mão
- Adesivos de parede
- Tatuagens (permanente!)
- Cristais gravados
- Tapetes/almofadas

### 💧 Água Energizada com Geometria

**Experimento do Dr. Masaru Emoto** (já mencionado) provou: água muda estrutura cristalina baseado em informação exposta.

**Como fazer:**

1. Imprima geometria sagrada (Flor da Vida, Merkaba, Sri Yantra)
2. Coloque copo/jarra de vidro sobre a imagem
3. Deixe por no mínimo 30 min (ideal: overnight)
4. Beba com intenção: "Eu absorvo harmonia e ordem divina"

**Geometrias recomendadas:**
- Flor da Vida: equilíbrio geral
- Sri Yantra: prosperidade
- Torus: energia vital
- Om (símbolo): conexão espiritual

### 📿 Cristais e Geometria

Cristais JÁ SÃO geometria sagrada molecular perfeita!

**Formas geométricas de cristais:**
- **Cubo:** Aterramento (pirita, fluorita cúbica)
- **Octaedro:** Equilíbrio (diamante, magnetita)
- **Dodecaedro:** Conexão espiritual (pirita dodecaédrica)
- **Pirâmide:** Foco e manifestação (todos os cristais em formato piramidal)
- **Esfera:** Harmonia (qualquer cristal polido em bola)
- **Merkaba:** Ativação energética (cristais talhados nesta forma)

**Como usar:**
1. Escolha cristal + forma geométrica
2. Programe com intenção
3. Carregue com você ou coloque em altar
4. Limpe semanalmente (água corrente + sol/lua)

---

## Construindo Seu Grid Cristalino

**O que é:** Arranjo geométrico de cristais para amplificar intenção.

**Grid de Manifestação (exemplo):**

**Materiais:**
- 1 cristal central grande (quartzo, citrino, ou relacionado à intenção)
- 6 cristais médios (formando hexágono)
- 12 cristais pequenos (formando círculo externo)
- Pano/papel com Flor da Vida desenhada
- Papel com intenção escrita

**Montagem:**

1. Coloque papel/pano com Flor da Vida
2. Centro: cristal grande sobre papel com intenção
3. Hexágono: 6 cristais médios ao redor (forma "Semente da Vida")
4. Círculo externo: 12 cristais pequenos
5. **Ativação:** Com varinha ou dedo, conecte energeticamente cada cristal:
   - Centro → 1º cristal do hexágono
   - 1º → 2º → 3º... até completar hexágono
   - Hexágono → círculo externo
   - Complete desenhando Flor da Vida no ar
6. Afirme intenção 3x em voz alta
7. Deixe montado por 28 dias (ciclo lunar)

**Onde montar:** Altar, embaixo da cama, canto da sala

**Cuidados:** Não mexa, deixe fazer o trabalho

---

## Tatuagens de Geometria Sagrada

Se você considera tatuar, saiba:

**Benefícios:**
- Proteção permanente
- Lembrete constante
- Amplificação do campo energético

**Cuidados:**
- Escolha símbolo que REALMENTE ressoe (você carregará para sempre)
- Pesquise significado profundo
- Coloque em local de significado:
  - Peito (coração): Flor da Vida, Torus
  - Costas (proteção): Merkaba, Sri Yantra
  - Pulso (lembretes): Espiral, Om
  - Terceiro olho (testa/nuca): Olho de Hórus, Pineal

**Evite:** Tatuar símbolos que você não entende completamente

---

## Geometrias Avançadas

### Sri Yantra (Máquina de Manifestação)

**O que é:** 9 triângulos entrelaçados formando 43 pequenos triângulos, emanando de ponto central (bindu).

**Significado:** Representação visual do processo de criação - do sem-forma ao manifesto.

**Como usar:**
- **Meditação Trataka:** Olhe fixamente o centro (bindu) por 10-20 min sem piscar
- **Resultados:** Estados alterados de consciência, manifestação acelerada, insights profundos

### Sólidos Platônicos (Os 5 Blocos da Realidade)

1. **Tetraedro** (4 faces - triângulos) = Elemento FOGO = Vontade
2. **Cubo/Hexaedro** (6 faces - quadrados) = Elemento TERRA = Estrutura
3. **Octaedro** (8 faces - triângulos) = Elemento AR = Intelecto
4. **Icosaedro** (20 faces - triângulos) = Elemento ÁGUA = Emoção
5. **Dodecaedro** (12 faces - pentágonos) = ÉTER/AKASHA = Espírito

**Uso prático:**
- Medite em cada sólido para equilibrar elemento correspondente
- Use modelos 3D (compre ou construa em papel)
- Visualize-os girando dentro de você

### Crop Circles (Círculos nas Plantações)

**Fenômeno:** Formações geométricas complexas que aparecem overnight em campos.

**Científico:** Alguns comprovadamente feitos por humanos, outros de origem desconhecida (padrões matemáticos avançados, nós moleculares alterados nas plantas).

**Espiritual:** Mensagens de inteligências superiores em linguagem geométrica universal.

**Uso:** Medite em fotos de crop circles autênticos - download de informação

---

## Exercício Prático: Seu Símbolo Pessoal de Poder

**Crie sua própria geometria sagrada pessoal:**

1. **Meditação (10 min):**
   - Pergunte ao seu Eu Superior: "Qual é meu símbolo de poder?"
   - Permita que forma/imagem venha

2. **Desenho:**
   - Sem pensar muito, desenhe o que veio
   - Use régua e compasso se necessário
   - Cores intuitivas

3. **Ativação:**
   - Segure o desenho sobre o coração
   - Respire fundo 7x
   - Afirme: "Este é meu símbolo sagrado. Ele me protege, me fortalece, me conecta."

4. **Uso:**
   - Carregue foto dele no celular
   - Tatue (se ressoar profundamente)
   - Coloque em altar
   - Desenhe no ar antes de situações importantes

---

## Integração: Geometria + Outras Práticas

**Geometria + Afirmações:**
- Desenhe Flor da Vida, escreva afirmação no centro

**Geometria + Rituais:**
- Monte grid cristalino durante Ritual Lunar

**Geometria + Manifestação:**
- Escreva desejo dentro de Sri Yantra desenhado

**Geometria + Proteção:**
- Visualize Merkaba ao redor antes de ambientes pesados

---

A geometria sagrada não é credo - é **linguagem universal** que transcende culturas e religiões. É a matemática de Deus, a poesia do cosmos.

Próxima seção: Magnetismo pessoal e o poder do coração...
    `
  };
}

function gerarMagnetismo(numero_vida, signo) {
  return {
    titulo: 'Magnetismo Pessoal e o Campo Eletromagnético do Coração',
    conteudo: `
Você já conheceu alguém que "brilha"? Que entra em um ambiente e todos se viram? Que fala e todos escutam?

Isso não é acidente. É **magnetismo pessoal** - um campo energético real, mensurável e **que você pode amplificar conscientemente**.

---

## A Ciência do Campo Cardíaco

### Descobertas do HeartMath Institute

**O coração NÃO é apenas bomba de sangue:**
- Possui 40.000 neurônios (mini-cérebro)
- Produz campo eletromagnético **5.000x mais forte** que o do cérebro
- Campo detectável a **3-5 metros** de distância com instrumentos
- Influencia cérebros de pessoas próximas (sincronização)

**Experimento famoso:**
- Pessoa A entra em coerência cardíaca (gratidão, amor)
- Pessoa B (a metros de distância, sem saber) tem alteração na atividade cerebral
- **Conclusão:** Campos cardíacos se comunicam e se influenciam

### Estados do Campo Cardíaco

**Incoerência (caos):**
- Estresse, medo, raiva, ansiedade
- Ritmo cardíaco errático
- Campo fraco e desorganizado
- Efeito: repele pessoas, situações não fluem

**Coerência (harmonia):**
- Gratidão, amor, compaixão, paz
- Ritmo cardíaco regular e harmônico
- Campo forte e organizado
- Efeito: atrai pessoas, oportunidades, sincronicidades

**Seu trabalho:** Treinar-se para viver em coerência o máximo de tempo possível.

---

## Técnica de Coerência Cardíaca (Base de Tudo)

**Prática diária - 5 min, 3x ao dia (manhã, tarde, noite):**

1. **Foco no coração:**
   - Coloque mão no centro do peito
   - Imagine respirar através do coração

2. **Respiração ritmada:**
   - Inspire: 5 segundos (contando mentalmente)
   - Expire: 5 segundos
   - Mantenha ritmo constante

3. **Emoção elevada:**
   - Enquanto respira, lembre de momento de gratidão profunda
   - SINTA a emoção no corpo
   - Não apenas pense - SINTA

4. **Sustente por 5 minutos**

**Resultados em 21 dias:**
- Redução de 23% no cortisol (estresse)
- Aumento de 100% em DHEA (anti-envelhecimento)
- Melhora de clareza mental
- Aumento de intuição
- **MAGNETISMO PESSOAL amplificado**

**Quando usar:**
- Ao acordar (define frequência do dia)
- Antes de reuniões/eventos importantes
- Quando estressado(a)
- Antes de dormir

---

## Os 3 Pilares do Magnetismo

### 1. **Presença** (Corpo)

**Problema comum:** Corpo aqui, mente em 10 lugares.

**Solução:**

**Prática da Postura de Poder (Amy Cuddy - Harvard):**
- Adote postura expansiva (ombros abertos, peito elevado, pés firmes)
- Mantenha por 2 minutos
- **Efeito fisiológico:**
  - Aumenta testosterona (+20%) = confiança
  - Reduz cortisol (-25%) = calma
  - Seu corpo "ensina" ao cérebro que você é poderoso(a)

**Uso:**
- Antes de apresentações
- Antes de pedir aumento
- Antes de encontros importantes
- No banheiro (2 min escondido, se necessário!)

**Ancoragem no Corpo:**
- Ao caminhar, SINTA os pés no chão
- Ao falar, SINTA a voz vibrando no peito
- Ao escutar, OLHE nos olhos (não no celular)

**Resultado:** Você se torna PRESENÇA MAGNÉTICA.

### 2. **Autenticidade** (Coração)

**Problema:** Máscaras, pessoas-pleasing, esconder quem você é.

**Solução:** Vulnerabilidade consciente.

**Isso NÃO significa:**
- Falar tudo que pensa sem filtro
- Expor traumas para qualquer um
- Ser infantil ou descontrolado

**Significa:**
- Falar sua verdade com amor
- Admitir quando não sabe
- Mostrar emoção quando apropriado
- Estabelecer limites claros

**Prática:**
- Por 1 semana, observe quando você se censura
- Pergunte: "Se eu fosse 100% autêntico(a) agora, o que diria/faria?"
- Escolha 1 momento por dia para ser radicalmente honesto(a) (com gentileza)

**Paradoxo:** Quanto mais você é VOCÊ, mais magnético você se torna.

### 3. **Energia Vital** (Espírito)

**Problema:** Exaustão, peso, "bateria fraca".

**Soluções:**

**Físicas:**
- Sono de qualidade (7-9h)
- Hidratação (2-3L água/dia)
- Movimento (30 min/dia mínimo)
- Sol (15 min diários, vitamina D)
- Alimentos vivos (frutas, vegetais, grãos integrais)

**Energéticas:**
- Limpeza energética regular (seção anterior)
- Tempo sozinho(a) (recarga de introvertidos)
- Natureza (20 min = reset completo)
- Corte de vampiros energéticos

**Espirituais:**
- Meditação diária (10-20 min)
- Conexão com propósito
- Criatividade/paixão (algo que te acende)

**Quando sua energia está alta, você IRRADIA.**

---

## Práticas Específicas de Magnetismo

### 🔥 Ritual do Espelho Magnético

**Diariamente, 3-5 min:**

1. **De pé, frente ao espelho, sozinho(a)**
2. **Olhe nos próprios olhos por 2 min** (sem desviar)
3. **Afirme com CONVICÇÃO:**
   - "Eu irradio luz"
   - "Eu sou presença magnética"
   - "As pessoas são atraídas pela minha autenticidade"
   - "Eu sou canal de amor e poder"
   - "Oportunidades me encontram"
4. **SORRIA para si mesmo(a)** (isso é crucial - ativa neurônios-espelho)
5. **Sele tocando o coração**

**Transformação em 40 dias:** Mudança drástica em como você se percebe = mudança em como outros te veem.

### 💫 Visualização do Campo Dourado

**Antes de eventos sociais/importantes (5 min):**

1. Sente-se, respire fundo
2. Visualize esfera de luz dourada no coração
3. A cada respiração, ela expande
4. Em 7 respirações, envolve todo seu corpo
5. Visualize pessoas sendo magnetizadas pela luz
6. Afirme: "Minha presença é um presente. Eu sou bem-vinda(o) onde vou."
7. Abra os olhos, entre no ambiente consciente do seu campo

### 👁️ Técnica do Olhar Magnético

**O poder do contato visual:**

**Prática:**
- Ao conversar, mantenha contato visual 70% do tempo
- Não fixe (intimidador), relaxe
- Pisque naturalmente
- **ESCUTE** de verdade (não apenas espere sua vez de falar)
- Quebre contato olhando para lado (não para baixo = submissão)

**Efeito:** Cria conexão profunda, mostra confiança, gera confiança no outro.

**Treino:**
- Com amigos próximos primeiro
- Gradualmente com desconhecidos
- Observe como pessoas respondem diferente

### 🎭 Incorporação de Arquétipos

**Baseado no seu Número ${numero_vida}:**

Antes de situações onde precisa magnetismo:
1. Respire fundo 3x
2. Invoque seu arquétipo principal (${ARQUETIPOS_POR_NUMERO[numero_vida].principal})
3. Pergunte: "Como o ${ARQUETIPOS_POR_NUMERO[numero_vida].principal} entraria neste espaço?"
4. **INCORPORE** a energia (postura, respiração, intenção)
5. Entre como ele/ela

**Não é fingimento** - é acessar faceta sua que já existe.

---

## Magnetismo por Signo (${signo})

**Como ${signo}, seu magnetismo natural vem de:**

${signo === 'Áries' ? `
- **Ousadia e iniciativa** - você abre caminhos
- **Energia contagiante** - você inspira ação
- **Maximize:** Seja o primeiro a falar/agir, lidere conversas
- **Cuidado:** Impaciência pode repelir, respire antes de reagir
` : signo === 'Touro' ? `
- **Presença sólida e confiável** - você transmite segurança
- **Sensualidade natural** - você conecta através dos sentidos
- **Maximize:** Toque apropriado (aperto de mão firme), voz calma
- **Cuidado:** Rigidez pode afastar, mantenha flexibilidade
` : signo === 'Gêmeos' ? `
- **Conversação cativante** - você entretém e informa
- **Versatilidade mental** - você adapta a qualquer grupo
- **Maximize:** Conte histórias, conecte pessoas
- **Cuidado:** Dispersão pode confundir, foque quando importante
` : signo === 'Câncer' ? `
- **Empatia profunda** - você faz outros se sentirem vistos
- **Cuidado emocional** - você nutre ambientes
- **Maximize:** Escute ativamente, ofereça suporte
- **Cuidado:** Absorver demais drena, mantenha limites
` : signo === 'Leão' ? `
- **Carisma natural** - você brilha sem esforço
- **Calor humano** - você ilumina ambientes
- **Maximize:** Seja generoso(a) com atenção e elogios
- **Cuidado:** Necessidade de validação pode cansar, brilhe por você
` : signo === 'Virgem' ? `
- **Inteligência refinada** - você impressiona com precisão
- **Utilidade prática** - você resolve problemas
- **Maximize:** Ofereça insights valiosos, seja a pessoa "útil"
- **Cuidado:** Crítica excessiva afasta, elogie mais
` : signo === 'Libra' ? `
- **Harmonia e charme** - você equilibra grupos
- **Estética natural** - você é visualmente agradável
- **Maximize:** Vista-se bem, crie ambientes bonitos
- **Cuidado:** Indecisão pode frustrar, pratique firmeza gentil
` : signo === 'Escorpião' ? `
- **Intensidade magnética** - você hipnotiza
- **Profundidade emocional** - você vai além do superficial
- **Maximize:** Olhar profundo, conversas significativas
- **Cuidado:** Intensidade demais assusta, dose conforme ambiente
` : signo === 'Sagitário' ? `
- **Entusiasmo contagiante** - você inspira aventura
- **Sabedoria expansiva** - você compartilha visão de mundo
- **Maximize:** Conte experiências, seja otimista
- **Cuidado:** Exagero pode parecer falso, autenticidade sempre
` : signo === 'Capricórnio' ? `
- **Autoridade natural** - você comanda respeito
- **Competência visível** - você entrega resultados
- **Maximize:** Demonstre expertise, seja confiável
- **Cuidado:** Frieza pode intimidar, mostre lado humano
` : signo === 'Aquário' ? `
- **Originalidade** - você é memorável por ser único(a)
- **Visão futurista** - você traz ideias inovadoras
- **Maximize:** Seja diferente (conscientemente), compartilhe visões
- **Cuidado:** Distanciamento excessivo isola, conecte-se emocionalmente
` : `
- **Compaixão universal** - você emana amor
- **Criatividade artística** - você toca almas
- **Maximize:** Compartilhe arte, seja canal de beleza
- **Cuidado:** Vagueness pode confundir, seja claro quando necessário
`}

---

## Armadilhas que Matam Magnetismo

❌ **Reclamação constante:** Drena energia de todos ao redor
❌ **Fofoca:** Repele pessoas de integridade
❌ **Vitimização:** Ninguém quer carregar seu peso
❌ **Arrogância:** Confundida com confiança, mas repele
❌ **Necessidade:** Energia de "preciso de você" afasta
❌ **Comparação:** "Sou melhor que X" = insegurança disfarçada

✅ **Atitudes magnéticas:**
✅ **Gratidão expressa:** Valoriza pessoas ao redor
✅ **Curiosidade genuína:** Interesse real em outros
✅ **Celebração:** Alegra-se com sucesso alheio
✅ **Confiança tranquila:** Sabe quem é, sem precisar provar
✅ **Autossuficiência:** Escolhe conexão, não precisa dela
✅ **Generosidade:** Dá sem esperar retorno

---

## Teste de Magnetismo (Autoavaliação)

Responda honestamente (0 = nunca, 10 = sempre):

1. Quando entro em ambientes, as pessoas notam minha presença? __/10
2. Mantenho contato visual confortável em conversas? __/10
3. Falo minha verdade com gentileza? __/10
4. Minha energia é elevada na maior parte do tempo? __/10
5. As pessoas buscam minha companhia? __/10
6. Sinto-me confiante na minha aparência e presença? __/10
7. Escuto mais do que falo? __/10
8. Celebro sucessos alheios genuinamente? __/10
9. Mantenho postura corporal aberta e expansiva? __/10
10. Irradio gratidão e positividade? __/10

**Pontuação:**
- 0-30: Magnetismo adormecido (pratique rituais desta seção)
- 31-60: Magnetismo em desenvolvimento (continue evoluindo)
- 61-80: Magnetismo forte (refine áreas fracas)
- 81-100: Magnetismo radiante (você é farol!)

---

## Plano de 30 Dias: Magnetismo Intensivo

**Semana 1 - Fundação:**
- Coerência cardíaca 3x/dia
- Postura de poder diária
- Eliminar reclamação

**Semana 2 - Expressão:**
- Espelho magnético diariamente
- 1 ato de autenticidade radical por dia
- Praticar contato visual

**Semana 3 - Expansão:**
- Campo dourado antes de eventos
- Incorporar arquétipo em situações-chave
- Celebrar 3 pessoas por dia

**Semana 4 - Integração:**
- Todas as práticas acima
- Observar mudanças em como pessoas respondem
- Journal: "Como meu campo mudou?"

---

Próxima seção: Calendário Lunar personalizado para seu ano...
    `
  };
}

function gerarCalendarioLunar(nome) {
  const anoAtual = new Date().getFullYear();
  
  return {
    titulo: `Seu Calendário Lunar ${anoAtual}`,
    conteudo: `
A Lua não é apenas satélite - é **reguladora de ciclos terrestres**. Marés, menstruação, crescimento de plantas, comportamento animal - tudo influenciado por ela.

Trabalhar COM os ciclos lunares (ao invés de contra) é como **surfar onda ao invés de nadar contra correnteza**.

---

## Ciência dos Ciclos Lunares

### Cronobiologia Lunar

Estudos mostram:
- **Qualidade do sono** varia com fases lunares (pior na Lua Cheia)
- **Ciclos menstruais** tendem a sincronizar com lua (28 dias)
- **Comportamento animal** muda drasticamente (procriação, caça)
- **Crescimento de plantas** mais rápido na Lua Crescente

**Conclusão:** Há influência real (gravitacional + eletromagnética) mesmo que ainda não completamente compreendida pela ciência.

### Seus Ciclos Internos

Assim como a Lua tem fases, **você também tem**:
- Fase de semear (ideias, projetos)
- Fase de nutrir (ação, crescimento)
- Fase de colher (celebrar, manifestar)
- Fase de liberar (descanso, limpeza)

**Problema:** Sociedade ignora ciclos, exige produtividade constante = burnout.

**Solução:** Alinhe vida com ciclos naturais.
---

## As 4 Fases Lunares e Como Usá-las

### 🌑 Lua Nova (Semear)

**Duração:** 1º dia até 7 dias após Lua Nova

**Energia:** Introversão, planejamento, plantio de sementes energéticas

**Fisiologia:**
- Energia interna baixa (é normal!)
- Intuição elevada
- Sonhos vívidos
- Momento de reflexão

**O Que Fazer:**

✅ **Rituais de Intenção:**
- Escreva 10 desejos para o ciclo
- Acenda vela branca
- Leia em voz alta
- Lacre em envelope (abra na Lua Cheia)

✅ **Planejamento:**
- Metas do mês
- Projetos novos
- Visualização criativa

✅ **Limpeza Energética:**
- Banho de sal grosso
- Ho'oponopono
- Liberar o passado

✅ **Journaling:**
- "O que eu quero manifestar?"
- "O que preciso liberar para isso acontecer?"
- "Quem eu preciso me tornar?"

❌ **Evite:**
- Grandes decisões impulsivas
- Esgotamento físico
- Exposição social excessiva

**Afirmação:** "Eu planto minhas intenções no solo fértil do universo. Está feito."

---

### 🌓 Lua Crescente (Nutrir)

**Duração:** 7-14 dias após Lua Nova

**Energia:** Expansão, ação, construção, momentum

**Fisiologia:**
- Energia crescente
- Foco aumentado
- Força física elevada
- Metabolismo acelerado

**O Que Fazer:**

✅ **Ação Alinhada:**
- Execute planos da Lua Nova
- 1 ação concreta por dia em direção a metas
- Networking
- Reuniões importantes

✅ **Construção:**
- Fortaleça relações
- Desenvolva projetos
- Aumente investimentos (energéticos/financeiros)

✅ **Físico:**
- Treinos intensos (corpo responde melhor)
- Inicio de dietas
- Cirurgias eletivas (cicatrização melhor)

✅ **Afirmações Diárias:**
- "Meus sonhos crescem"
- "Cada ação me aproxima"
- "Eu construo com confiança"

❌ **Evite:**
- Dúvida (ela "seca" as sementes)
- Procrastinação
- Desistir ao primeiro obstáculo

**Mantra:** "Eu nutro meus sonhos com ação consciente. Eu confio no processo."

---

### 🌕 Lua Cheia (Manifestar e Celebrar)

**Duração:** 14-21 dias após Lua Nova (pico na Lua Cheia)

**Energia:** Culminação, plenitude, revelação, poder máximo

**Fisiologia:**
- Energia no pico (ou esgotamento se não cuidou)
- Emoções intensificadas
- Sono mais leve
- Libido elevada
- Intuição aguçadíssima

**O Que Fazer:**

✅ **Celebração:**
- Abra envelope da Lua Nova
- Marque o que manifestou
- Agradeça (mesmo pequenas vitórias)
- Dance, cante, celebre!

✅ **Ritual de Água Lunar:**
(Já detalhado na seção de Rituais)
- Água sob a lua 3h mínimo
- Banho com pétalas de rosa
- Beba pela manhã

✅ **Manifestação Final:**
- Energia está no pico - visualize desejos
- Sexualidade sagrada (energia criadora máxima)
- Rituais de abundância

✅ **Liberação do que não manifestou:**
- Revise lista da Lua Nova
- Para o que NÃO manifestou, pergunte: "O que bloqueou?"
- Escreva bloqueios para queimar na Lua Minguante

✅ **Gratidão Profunda:**
- Liste 27 gratidões (3x9)
- Sinta cada uma no coração

❌ **Evite:**
- Decisões emocionais (emoções estão amplificadas)
- Confrontos desnecessários (tudo fica mais intenso)
- Excesso de cafeína/álcool (sensibilidade elevada)

**Afirmação:** "Eu celebro tudo que se manifestou. Eu sou abundância. Eu sou realização."

---

### 🌘 Lua Minguante (Liberar)

**Duração:** 21-28 dias (até próxima Lua Nova)

**Energia:** Introversão, liberação, descanso, morte simbólica

**Fisiologia:**
- Energia em declínio (natural!)
- Necessidade de sono maior
- Corpo pede descanso
- Emoções em processo

**O Que Fazer:**

✅ **Liberação Profunda:**
- Ritual da Vela (queimar papel com o que libera)
- Banho de descarrego
- Ho'oponopono intensivo
- EFT para traumas/padrões

✅ **Limpeza:**
- Casa física (organize, doe, descarte)
- Corpo (jejum leve se possível, dieta clean)
- Energia (defumação completa)
- Digital (limpe e-mails, celular, redes)

✅ **Encerramento:**
- Finalize projetos pendentes
- Termine relações que precisam terminar
- Pague dívidas (físicas/energéticas)
- Perdoe (a si e aos outros)

✅ **Descanso:**
- PERMITIR-SE descansar (sem culpa!)
- Sono extra
- Meditações longas
- Caminhadas lentas na natureza

✅ **Reflexão:**
- "O que este ciclo me ensinou?"
- "Do que preciso me libertar?"
- "Quem eu fui? Quem estou me tornando?"

❌ **Evite:**
- Iniciar coisas novas (não é a energia para isso)
- Forçar produtividade alta
- Ignorar necessidade de recolhimento

**Afirmação:** "Eu liberto com amor tudo que já não me serve. Eu me renovo. Eu me preparo para o novo."

---

## Calendário Lunar ${anoAtual} Personalizado

**Como usar este calendário:**

1. **Marque em seu calendário digital/físico** as datas de cada Lua Nova
2. **Defina lembretes** 2 dias antes de cada fase
3. **Planeje seu mês** baseado nos ciclos
4. **Observe padrões** (você vai notar que certas coisas funcionam melhor em certas fases)

### Dicas de Planejamento Mensal

**Semana 1 (Lua Nova):**
- Segunda: Planejamento da semana/mês
- Rituais de intenção
- Limpeza energética

**Semana 2 (Lua Crescente):**
- Reuniões importantes
- Lançamentos
- Networking
- Ação máxima

**Semana 3 (Lua Cheia):**
- Apresentações públicas
- Celebrações
- Manifestação final
- Rituais de poder

**Semana 4 (Lua Minguante):**
- Finalização de projetos
- Descanso
- Limpeza
- Reflexão

---

## Sincronização com Ciclo Menstrual (Para Mulheres)

**Ciclo menstrual IDEAL alinha com lunar:**
- **Menstruação = Lua Nova** (liberação, introversão)
- **Ovulação = Lua Cheia** (pico energético, criatividade)

**Se seu ciclo não alinha:**
Não há problema! Você tem DOIS ciclos para trabalhar:
1. Ciclo lunar (externo, coletivo)
2. Ciclo menstrual (interno, pessoal)

**Honre AMBOS:**
- Se está menstruando na Lua Cheia = priorize repouso (seu ciclo interno)
- Se está ovulando na Lua Nova = você terá energia extra (benefício!)

**Ritual de Alinhamento (opcional):**
- Dormir com luz da Lua Cheia (cortinas abertas)
- Evitar luz artificial à noite
- Após 3-6 meses, ciclos tendem a sincronizar

---

## Lua e Signos (Trânsitos Lunares)

A Lua muda de signo a cada **2,5 dias**. Cada passagem traz energia específica:

**Lua em Áries:** Iniciar projetos, coragem, ação rápida
**Lua em Touro:** Finanças, prazer, descanso, culinária
**Lua em Gêmeos:** Comunicação, estudo, networking
**Lua em Câncer:** Família, lar, emoções, autocuidado
**Lua em Leão:** Criatividade, visibilidade, celebração
**Lua em Virgem:** Organização, saúde, detalhes
**Lua em Libra:** Relações, beleza, equilíbrio
**Lua em Escorpião:** Profundidade, sexualidade, transformação
**Lua em Sagitário:** Aventura, estudo, viagens
**Lua em Capricórnio:** Carreira, estrutura, disciplina
**Lua em Aquário:** Inovação, amizades, causas sociais
**Lua em Peixes:** Espiritualidade, arte, intuição

**Como usar:**
- Consulte app de astrologia (Co-Star, TimePassages, etc.)
- Veja onde a Lua está HOJE
- Alinhe atividades com energia do signo

**Exemplo:**
- Lua em Touro = dia perfeito para cuidar de finanças, cozinhar, massagem
- Lua em Gêmeos = dia ideal para escrever, estudar, fazer lives

---

## Eclipses (Portais de Transformação Acelerada)

**Eclipses solares** (Lua Nova amplificada): 
- Novos começos INTENSOS
- Mudanças de rumo
- Manifestação potente
- Evite: decisões impulsivas (espere 3 dias)

**Eclipses lunares** (Lua Cheia amplificada):
- Finais dramáticos
- Revelações importantes
- Curas profundas
- Liberações em massa

**${anoAtual} tem [consulte calendário astronômico para o ano específico]:**
- [Eclipses ocorrem em eixos de signos específicos]
- Cada um traz tema específico para trabalhar

**Como trabalhar eclipses:**
1. Evite rituais (energia muito intensa/imprevisível)
2. Observe o que emerge (insights, situações)
3. Não resista a mudanças que vêm
4. Journal profundamente
5. Processe com terapeuta se necessário

---

## Lua Negra / Lilith (Avançado)

**Lua Negra** não é planeta - é ponto matemático (apogeu lunar).

**Representa:**
- Feminino selvagem
- Sexualidade crua
- Raiva reprimida
- Poder reclamado

**No seu mapa:** Consulte astrólogo(a) para saber onde está sua Lilith natal.

**Trabalho com Lilith:**
- Reclamar partes rejeitadas
- Expressar raiva saudavelmente
- Honrar sexualidade sem vergonha
- Dizer verdades inconvenientes

---

## Void of Course (Lua Vazia)

**O que é:** Período entre a lua sair de um signo e entrar no próximo (algumas horas).

**Energia:** "Vácuo" energético, coisas iniciadas tendem a "não dar em nada".

**Evite durante Void:**
- Assinar contratos importantes
- Fazer compras grandes
- Iniciar projetos importantes
- Cirurgias eletivas

**Aproveite para:**
- Meditação
- Descanso
- Tarefas rotineiras
- Reflexão

**Como saber:** Apps de astrologia mostram Void of Course.

---

## Seu Diário Lunar (Template)

**A cada Lua Nova, preencha:**
Data: //____
Signo da Lua Nova: ____________INTENÇÕES (10):








[...]O QUE LIBERO:







AFIRMAÇÃO DO CICLO:
"______________________"AÇÃO CONCRETA PRIMEIRA:






**A cada Lua Cheia, revise:**Data: //____
Signo da Lua Cheia: ____________MANIFESTADO (da lista de Lua Nova):
✓ ______________________
✓ ______________________NÃO MANIFESTADO (investigar bloqueio):
✗ ______________________ | Bloqueio: __________GRATIDÕES (27):





[...]APRENDIZADOS DO CICLO:





---

## Integração: Ciclos Lunares + Práticas do Manual

**Lua Nova:**
- Ritual da Vela (intenções)
- Limpeza energética
- Meditação de visão

**Lua Crescente:**
- Afirmações intensivas
- Prática de magnetismo
- Ação física

**Lua Cheia:**
- Água lunar
- Sexualidade sagrada
- Ritual de celebração

**Lua Minguante:**
- Ho'oponopono
- Banho de descarrego
- EFT para liberar

---

## Últimas Dicas

✨ **Fotografe a Lua:** Crie álbum lunar no celular - conexão visual potente

✨ **Converse com a Lua:** Não é loucura - é ritual ancestral. Fale seus desejos para ela.

✨ **Objetos sob a Lua:** Cristais, água, joias - deixe sob luz lunar para energizar

✨ **Evite "culpar a Lua":** Ela não "faz" coisas ruins - apenas amplifica o que já existe em você

✨ **Ciclos dentro de ciclos:** Há ciclos diários, lunares, sazonais, anuais, de vida - todos importam

${nome}, quando você dança com a Lua ao invés de lutar contra ela, a vida se torna MUITO mais fluida.

Próxima e última seção: Seu Plano de 90 Dias de Transformação Completa...
    `
  };
}

function gerarPlano90Dias(nome, numero_vida, elemento, arquetipo) {
  return {
    titulo: 'Plano de Transformação de 90 Dias',
    conteudo: `
${nome}, você chegou ao final deste manual - mas na verdade, está apenas no **INÍCIO** da sua jornada de despertar.

Tudo que você leu até aqui é **inútil** se não for PRATICADO.

Este plano de 90 dias transforma conhecimento em **PODER VIVIDO**.

---

## Por Que 90 Dias?

**21 dias** = formar novo hábito neural
**40 dias** = reprogramação profunda
**90 dias** = transformação completa de identidade

**Estudos de neuroplasticidade** mostram: 90 dias de prática consistente = mudança **permanente** no cérebro.

---

## Estrutura do Programa

### 📅 MÊS 1 - FUNDAÇÃO (Dias 1-30)

**Tema:** Limpeza e Ancoragem

**Foco:** Remover bloqueios, criar alicerce sólido

**Práticas Diárias (não negociáveis):**

**Manhã (20 min):**
1. Acordar sem alarme (ou com alarme suave)
2. Não pegar celular nos primeiros 30 min
3. Copo de água (em jejum)
4. Coerência cardíaca (5 min)
5. Afirmações no espelho (5 min)
6. Definir 3 intenções do dia

**Tarde (10 min):**
1. Pausa consciente (meio-dia)
2. Respiração profunda 3 min
3. Check-in: "Como está minha energia? Preciso ajustar algo?"

**Noite (20 min):**
1. Journaling (5 min): "Hoje eu..."
2. Corte de cordões energéticos
3. Gratidão (3 coisas)
4. Preparação do sono (sem telas 1h antes)

**Semanais:**

**Domingo:**
- Planejamento da semana alinhado com Lua
- Limpeza energética completa (banho + defumação)
- Revisão: "O que funcionou? O que ajustar?"

**Quarta:**
- Revisão meio de semana
- Ritual com elemento ${elemento}
- Prática de magnetismo

**Rituais Lunares:**
- Lua Nova: Intenções escritas, vela, envelope lacrado
- Lua Cheia: Abertura de envelope, celebração, água lunar

**Meta do Mês 1:**
✓ Estabelecer rotina sagrada
✓ Limpar bloqueios principais
✓ Sentir diferença de energia

**Como medir sucesso:**
- Conseguiu manter práticas 80% dos dias?
- Nota mudanças em sono, humor, energia?
- Pessoas comentam diferença em você?

---

### 📅 MÊS 2 - EXPANSÃO (Dias 31-60)

**Tema:** Ativação de Poderes e Magnetismo

**Foco:** Desenvolver habilidades, ampliar campo

**Mantém práticas do Mês 1 + Adiciona:**

**Práticas Extras Diárias:**

**Manhã:**
- Meditação do Arquétipo (10 min)
- Visualização do dia perfeito (5 min)
- Postura de Poder (2 min antes de sair)

**Durante o dia:**
- Praticar presença magnética conscientemente
- 1 ato de vulnerabilidade autêntica
- Contato visual aprofundado em conversas

**Noite:**
- Revisão arquetípica: "Onde incorporei meu ${arquetipo.principal} hoje?"

**Semanais:**

**2x por semana:**
- Desenho de mandala (30 min)
- Prática com geometria sagrada

**1x por semana:**
- Ritual de transmutação sexual (se ressoar)
- Ho'oponopono completo de 1 situação

**Quinzenais:**
- Banho de prosperidade (Lua Crescente)
- Banho de amor (Lua Cheia se for sexta)

**Desafios do Mês 2:**

**Semana 5:** Experimento de 7 dias em coerência cardíaca (3x/dia, não falhar)

**Semana 6:** Semana do "sim autêntico": só dizer sim quando REALMENTE quiser

**Semana 7:** Semana de magnetismo intensivo: aplicar TODAS as técnicas

**Semana 8:** Integração: consolidar o que funcionou

**Meta do Mês 2:**
✓ Despertar magnetismo mensurável
✓ Incorporar arquétipo naturalmente
✓ Manifestar 3+ sincronicidades

**Como medir sucesso:**
- Oportunidades aparecem "do nada"?
- Pessoas te buscam mais?
- Você se sente diferente (mais confiante, intuitivo)?

---

### 📅 MÊS 3 - MANIFESTAÇÃO (Dias 61-90)

**Tema:** Materialização e Legado

**Foco:** Criar resultados tangíveis, ancorar transformação

**Mantém tudo anterior + Adiciona:**

**Práticas de Manifestação Ativa:**

**Semanal:**
- Escolher 1 desejo específico para manifestar nos 30 dias
- Criar grid cristalino para o desejo
- Ativar desejo em estado de êxtase (sexual ou meditativo)

**Diário:**
- Viver "como se" já tivesse o desejo
- Tomar 1 ação alinhada com o desejo
- Afirmar "está feito" sempre que pensar no desejo

**Projeto do Mês 3:**

Criar algo TANGÍVEL que represente sua transformação:
- Negócio novo
- Projeto criativo
- Transformação corporal
- Relacionamento saudável
- Mudança de cidade/trabalho
- Curso/certificação concluída

**Algo que você pode MOSTRAR e dizer: "Eu criei isso em 90 dias."**

**Rituais Intensivos:**

**Dia 70:** Ritual de Renascimento
- Banho ritual completo
- Queimar papel com "velha identidade"
- Escrever e declarar "nova identidade"
- Celebração (sozinho ou com íntimos)

**Dia 80:** Revisão Completa
- Reler intenções do Dia 1
- Comparar com onde está
- Celebrar TUDO que manifestou
- Ajustar o que ainda falta

**Dia 90:** Cerimônia de Graduação
- Ritual de fechamento sagrado
- Gratidão profunda por jornada
- Definir próximos 90 dias
- Celebração (festa, presente para si, experiência especial)

**Meta do Mês 3:**
✓ Manifestar desejo principal
✓ Criar evidência tangível de transformação
✓ Tornar-se nova versão de si

**Como medir sucesso:**
- Desejo manifestou (total ou parcialmente)?
- Há PROVA física da mudança?
- Você literalmente não é mais a mesma pessoa que começou?

---

## Rastreamento de Progresso

### Diário de 90 Dias (Template)

**Diário (todo dia em 5 min):**
DIA ___/90ENERGIA (1-10): ___
HUMOR (1-10): ___PRÁTICAS COMPLETADAS:
☐ Coerência cardíaca
☐ Afirmações no espelho
☐ Journaling noturno
☐ [Prática específica do mês]VITÓRIA DO DIA:
DESAFIO:
SINCRONICIDADE/INSIGHT:
GRATIDÃO:












**Revisão Semanal (10 min aos domingos):**SEMANA ___/13PRÁTICAS COMPLETADAS: ___% (meta: 80%+)MANIFESTAÇÕES DA SEMANA:







PADRÕES OBSERVADOS:




AJUSTES PARA PRÓXIMA SEMANA:




CELEBRAÇÃO:


**Revisão Mensal (30 min):**MÊS ___/3TRANSFORMAÇÕES FÍSICAS:

Energia: Antes ___ | Agora ___
Peso: ___ | ___
Sono: ___ | ___
TRANSFORMAÇÕES EMOCIONAIS:

Ansiedade: ___ | ___
Confiança: ___ | ___
Paz interior: ___ | ___
TRANSFORMAÇÕES EXTERNAS:

Relações: _______________
Trabalho: _______________
Finanças: _______________
MANIFESTAÇÕES DOCUMENTADAS:










GRATIDÃO PROFUNDA:
---

## Check-list de Não Negociáveis

**Os 5 Pilares Diários:**

✅ **Corpo:** 30 min movimento + hidratação + sono 7h+
✅ **Mente:** 10 min meditação + afirmações + journaling
✅ **Emoção:** Coerência cardíaca + gratidão
✅ **Energia:** Limpeza/proteção energética
✅ **Ação:** 1 passo em direção a desejo principal

**Se falhar:**
- Não se culpe (culpa bloqueia)
- Pergunte: "O que me impediu?"
- Recomeçe NO MESMO DIA (não "amanhã")
- Seja gentil consigo

**Regra 80/20:**
Se você mantém 80% de consistência = SUCESSO GARANTIDO

---

## Apoio e Responsabilização

**Crie estrutura de suporte:**

1. **Parceiro de jornada:**
   - Encontre alguém fazendo jornada similar
   - Check-in semanal (15 min)
   - Compartilhem vitórias e desafios

2. **Comunidade:**
   - Grupo online de espiritualidade/manifestação
   - Compartilhe aprendizados (não necessariamente prática completa)

3. **Mentor/Terapeuta:**
   - Se possível, trabalhe com profissional
   - Terapia, coaching espiritual, etc.

4. **Diário como testemunha:**
   - Seu diário é sua testemunha silenciosa
   - Releia mensalmente - você verá o quanto mudou

---

## Armadilhas Comuns e Como Evitar

### 🚫 Armadilha 1: Perfeição

**Problema:** "Falhei 1 dia, perdi tudo, vou desistir"

**Solução:** Progresso > Perfeição. Recomeçe IMEDIATAMENTE.

### 🚫 Armadilha 2: Comparação

**Problema:** "Fulana já manifestou X, eu não..."

**Solução:** Sua jornada é ÚNICA. Compare-se apenas com você de ontem.

### 🚫 Armadilha 3: Busca de Validação Externa

**Problema:** "Ninguém nota minha mudança"

**Solução:** VOCÊ nota? Isso basta. Transformação é interna primeiro.

### 🚫 Armadilha 4: Abandonar Quando Funciona

**Problema:** "Já me sinto melhor, posso parar"

**Solução:** Exatamente quando está funcionando é hora de INTENSIFICAR.

### 🚫 Armadilha 5: Fazer Tudo de Uma Vez

**Problema:** Tentar todas as práticas do manual simultaneamente

**Solução:** Siga O PLANO. Ele escala progressivamente por uma razão.

---

## Celebração e Rituais de Passagem

**Dia 30:** Pequena celebração (jantar especial, presente para si)

**Dia 60:** Celebração média (experiência nova, dia de spa, algo especial)

**Dia 90:** GRANDE CELEBRAÇÃO
- Ritual completo de encerramento
- Presente significativo para si
- Festa (se for sua vibração) ou retiro silencioso
- Registre com fotos/vídeo
- Escreva carta para si do futuro

---

## Após os 90 Dias

**Isso não acaba. Vida espiritual é prática contínua.**

**Opções pós-90 dias:**

1. **Recomeçar 90 dias** (espiral evolutiva - mesmo caminho, nível superior)
2. **Aprofundar área específica** (ex: 90 dias só em sexualidade sagrada)
3. **Manutenção** (práticas core diárias + rituais lunares)
4. **Ensinar outros** (melhor forma de solidificar aprendizado)

---

## Contrato Sagrado Consigo

Copie, imprima, assine:

CONTRATO SAGRADO DE 90 DIASEu, ${nome}, me comprometo solenemente comigo mesma/mesmo a:✓ Praticar com consistência (80% mínimo)
✓ Ser gentil comigo nos tropeços
✓ Celebrar cada pequena vitória
✓ Confiar no processo mesmo quando a mente duvida
✓ Honrar meu tempo sagrado (não negociar práticas)
✓ Permitir-me transformar
✓ Não desistir nos dias difíceis
✓ Lembrar: EU MEREÇO esta transformaçãoEste é um pacto de amor, não de punição.Eu inicio esta jornada em //_____Eu me formarei transformada(o) em //_____Assinatura: _____________________Testemunha (o Universo): 🌟

---

## Mensagem Final

${nome},

Você tem em mãos **MAIS do que um manual** - você tem um **MAPA DE DESPERTAR**.

Tudo que você precisa JÁ está dentro de você. Este manual apenas remove os véus.

**Alguns farão:**
- Lerão, acharão interessante, não praticarão → vida igual

**Alguns tentarão:**
- Praticarão 2 semanas, desistirão → pequena melhora, depois retrocesso

**Alguns poucos SE COMPROMETERÃO:**
- 90 dias completos → **TRANSFORMAÇÃO IRREVERSÍVEL**

Qual você será?

Eu sei a resposta. Você não chegaria até aqui se não fosse do terceiro grupo.

**Você é Número ${numero_vida}. Seu arquétipo é ${arquetipo.principal}. Você veio para ${arquetipo.missao.toLowerCase()}**

Este é seu momento.

Não daqui a 1 mês quando "estiver menos ocupada(o)".
Não quando "as condições forem perfeitas".

**AGORA.**

Feche este manual.
Respire fundo 3x.
Coloque mão no coração.
Afirme em voz alta:

**"Eu aceito minha grandeza. Eu me comprometo com minha evolução. Eu inicio HOJE. Está feito."**

Bem-vinda(o) à sua Nova Vida, ${nome}.

Eu celebro você. O Universo celebra você.

Agora... **VAI E MANIFESTA.**

✨🔥💎🌟

---

*"A jornada de mil quilômetros começa com um único passo." - Lao Tzu*

*"Você não precisa ser grande para começar, mas precisa começar para ser grande." - Zig Ziglar*

*"Seja a mudança que você quer ver no mundo." - Gandhi*

**E agora, as palavras finais são suas. Escreva abaixo sua declaração de compromisso:**

"Eu, ${nome}, declaro que..."

_____________________________________________
_____________________________________________
_____________________________________________

**Data de início:** ___/___/_____

**🔥 QUE A TRANSFORMAÇÃO COMECE! 🔥**
    `
  };
}