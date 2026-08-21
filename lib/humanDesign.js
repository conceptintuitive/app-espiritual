// lib/humanDesign.js
// Cálculo de Human Design (Tipo, Autoridade, Perfil, Centros definidos) a
// partir de data/hora de nascimento. Autocontido: não depende de
// manualgenerator.js.
//
// ⚠️ ATENÇÃO — DADOS DE REFERÊNCIA PRECISAM DE VERIFICAÇÃO HUMANA
// A tabela GATE_WHEEL_ORDER (sequência espacial dos 64 portões ao redor do
// zodíaco) foi reconstruída a partir de conhecimento de treinamento do
// modelo, não de uma fonte ao vivo verificada linha a linha. Ela foi
// cross-checada em 9 fronteiras de graus consecutivas (portões 25→17→21→
// 51→42→3→27→24→2) contra uma busca na web e bateu exatamente — o que dá
// bastante confiança, mas não é o mesmo que conferir as 64 entradas contra
// uma fonte oficial. Os 9 centros e os 36 canais (CENTROS e CANAIS abaixo)
// foram confirmados via busca na web, ponto por ponto, e têm confiança alta.
// Antes de confiar 100% nisso pra clientes pagantes: gere 3-5 mapas de
// pessoas com Tipo/Autoridade já conhecidos (de um app de Human Design
// confiável) e compare com o resultado desta função.
//
// A precisão da posição planetária em si segue a mesma ressalva de
// lib/calculos.js (~1-2°, Plutão com margem maior) — perto de uma fronteira
// de portão (a cada 5,625°) isso pode ocasionalmente acertar o portão vizinho.

import { calcularCorposCelestesParaHumanDesign } from './calculos';

// ── Roda dos 64 portões ──────────────────────────────────────────────────────
// Portão 41 começa em 302° (2°00' Aquário). Cada portão ocupa 5°37'30" (5.625°).
// Ordem espacial ao redor do zodíaco (não é ordem numérica 1-64).
const GATE_WHEEL_START_DEG = 302.0;
const GATE_SPAN_DEG = 5.625;
const LINE_SPAN_DEG = GATE_SPAN_DEG / 6;

const GATE_WHEEL_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

// ── Centros e seus portões (confirmado via busca, alta confiança) ──────────
const CENTROS = {
  cabeca:       [61, 63, 64],
  ajna:         [47, 24, 4, 17, 43, 11],
  garganta:     [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  g:            [1, 13, 25, 46, 2, 15, 10, 7],
  sacral:       [34, 5, 14, 29, 59, 9, 3, 42, 27],
  plexoSolar:   [6, 37, 22, 36, 30, 55, 49],
  baco:         [48, 57, 44, 50, 32, 28, 18], // Baço/Splenic
  coracao:      [21, 51, 26, 40], // Coração/Ego/Vontade
  raiz:         [19, 39, 41, 52, 53, 54, 58, 60, 38],
};

// ── Os 36 canais (confirmado via busca, alta confiança) ─────────────────────
const CANAIS = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52],
  [10, 20], [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48],
  [17, 62], [18, 58], [19, 49], [20, 34], [20, 57], [21, 45], [23, 43],
  [24, 61], [25, 51], [26, 44], [27, 50], [28, 38], [29, 46], [30, 41],
  [32, 54], [34, 57], [35, 36], [37, 40], [39, 55], [42, 53], [47, 64],
];

// Centros motores (empurram energia) — usados na determinação do Tipo.
const CENTROS_MOTORES = ['sacral', 'plexoSolar', 'coracao', 'raiz'];

const GATE_TO_CENTRO = {};
Object.entries(CENTROS).forEach(([centro, gates]) => {
  gates.forEach((g) => { GATE_TO_CENTRO[g] = centro; });
});

// ── Grau → Portão + Linha ────────────────────────────────────────────────────
function grauParaPortaoLinha(grauAbsoluto) {
  const offset = ((grauAbsoluto - GATE_WHEEL_START_DEG) % 360 + 360) % 360;
  const indice = Math.floor(offset / GATE_SPAN_DEG);
  const portao = GATE_WHEEL_ORDER[indice];
  const dentroDoPortao = offset - indice * GATE_SPAN_DEG;
  const linha = Math.floor(dentroDoPortao / LINE_SPAN_DEG) + 1; // 1-6
  return { portao, linha };
}

// ── Extrai portão+linha de todos os corpos de um mapa (personalidade ou design) ──
function mapearCorpos(corpos) {
  const chaves = ['sol', 'terra', 'lua', 'nodoNorte', 'nodoSul', 'mercurio', 'venus', 'marte', 'jupiter', 'saturno', 'urano', 'netuno', 'plutao'];
  const resultado = {};
  chaves.forEach((chave) => {
    resultado[chave] = grauParaPortaoLinha(corpos[chave]);
  });
  return resultado;
}

// ── Determina canais e centros definidos a partir dos portões ativados ──────
function calcularDefinicoes(gatesAtivos) {
  const setGates = new Set(gatesAtivos);
  const canaisDefinidos = CANAIS.filter(([a, b]) => setGates.has(a) && setGates.has(b));
  const centrosDefinidos = new Set();
  canaisDefinidos.forEach(([a, b]) => {
    centrosDefinidos.add(GATE_TO_CENTRO[a]);
    centrosDefinidos.add(GATE_TO_CENTRO[b]);
  });
  return { canaisDefinidos, centrosDefinidos };
}

// ── Grafo de centros conectados por canais definidos (BFS) ──────────────────
function construirGrafoCentros(canaisDefinidos) {
  const grafo = {};
  Object.keys(CENTROS).forEach((c) => { grafo[c] = new Set(); });
  canaisDefinidos.forEach(([a, b]) => {
    const ca = GATE_TO_CENTRO[a];
    const cb = GATE_TO_CENTRO[b];
    grafo[ca].add(cb);
    grafo[cb].add(ca);
  });
  return grafo;
}

function mesmoComponente(grafo, centrosDefinidos, origem, destino) {
  if (!centrosDefinidos.has(origem) || !centrosDefinidos.has(destino)) return false;
  const visitados = new Set([origem]);
  const fila = [origem];
  while (fila.length) {
    const atual = fila.pop();
    if (atual === destino) return true;
    grafo[atual].forEach((viz) => {
      if (!visitados.has(viz)) { visitados.add(viz); fila.push(viz); }
    });
  }
  return visitados.has(destino);
}

// ── Tipo ──────────────────────────────────────────────────────────────────
function calcularTipo(centrosDefinidos, grafo) {
  if (centrosDefinidos.size === 0) return 'Reflector';

  const sacralDefinido = centrosDefinidos.has('sacral');
  const gargantaDefinida = centrosDefinidos.has('garganta');

  if (sacralDefinido) {
    if (gargantaDefinida && mesmoComponente(grafo, centrosDefinidos, 'sacral', 'garganta')) {
      return 'Manifesting Generator';
    }
    return 'Generator';
  }

  if (gargantaDefinida) {
    const conectadoAMotor = CENTROS_MOTORES.some(
      (m) => m !== 'sacral' && centrosDefinidos.has(m) && mesmoComponente(grafo, centrosDefinidos, 'garganta', m)
    );
    if (conectadoAMotor) return 'Manifestor';
  }

  return 'Projector';
}

// ── Autoridade (ordem de prioridade padrão) ─────────────────────────────────
function calcularAutoridade(centrosDefinidos, grafo) {
  if (centrosDefinidos.has('plexoSolar')) return 'Emocional (Solar Plexus)';
  if (centrosDefinidos.has('sacral')) return 'Sacral';
  if (centrosDefinidos.has('baco')) return 'Esplênica (Baço)';
  if (centrosDefinidos.has('coracao') && mesmoComponente(grafo, centrosDefinidos, 'coracao', 'garganta')) {
    return 'Ego Manifestado';
  }
  if (centrosDefinidos.has('g') && mesmoComponente(grafo, centrosDefinidos, 'g', 'garganta')) {
    return 'Autoprojetada (G-Center)';
  }
  if (centrosDefinidos.size === 0) return 'Lunar (Reflector)';
  return 'Mental / Ambiente (sem autoridade interna definida)';
}

/**
 * Calcula o mapa de Human Design a partir de data/hora de nascimento.
 *
 * @param {string} dataNascimentoISO "YYYY-MM-DD"
 * @param {string|null} horaNascimento "HH:MM" horário local (padrão meio-dia se ausente)
 * @param {number} utcOffset horas a subtrair do horário local para obter UTC
 *   (ex: −3 → Brasília padrão; −2 → horário de verão brasileiro, vigente em
 *   alguns anos até 2019 — confira antes de assumir −3 direto)
 * @returns {{
 *   tipo: string,
 *   autoridade: string,
 *   perfil: string,
 *   centrosDefinidos: string[],
 *   centrosIndefinidos: string[],
 *   canaisDefinidos: number[][],
 *   personalidade: Object,
 *   design: Object,
 *   avisoPrecisao: string,
 * } | null}
 */
export function calcularHumanDesign(dataNascimentoISO, horaNascimento = null, utcOffset = -3) {
  const corpos = calcularCorposCelestesParaHumanDesign(dataNascimentoISO, horaNascimento, utcOffset);
  if (!corpos) return null;

  const personalidade = mapearCorpos(corpos.personalidade);
  const design = mapearCorpos(corpos.design);

  const gatesAtivos = [
    ...Object.values(personalidade).map((p) => p.portao),
    ...Object.values(design).map((p) => p.portao),
  ];

  const { canaisDefinidos, centrosDefinidos } = calcularDefinicoes(gatesAtivos);
  const grafo = construirGrafoCentros(canaisDefinidos);

  const tipo = calcularTipo(centrosDefinidos, grafo);
  const autoridade = calcularAutoridade(centrosDefinidos, grafo);
  const perfil = `${personalidade.sol.linha}/${design.sol.linha}`;

  return {
    tipo,
    autoridade,
    perfil,
    centrosDefinidos: Object.keys(CENTROS).filter((c) => centrosDefinidos.has(c)),
    centrosIndefinidos: Object.keys(CENTROS).filter((c) => !centrosDefinidos.has(c)),
    canaisDefinidos,
    personalidade,
    design,
    avisoPrecisao: 'Este é um cálculo próprio, sem uso de software astronômico profissional — em casos raros, perto de uma virada de portão, um detalhe pode variar.',
  };
}

// Nomes amigáveis dos centros, pra exibir na interface.
export const CENTRO_NOME_AMIGAVEL = {
  cabeca: 'Cabeça',
  ajna: 'Ajna',
  garganta: 'Garganta',
  g: 'G (Identidade)',
  sacral: 'Sacral',
  plexoSolar: 'Plexo Solar',
  baco: 'Baço',
  coracao: 'Coração (Ego)',
  raiz: 'Raiz',
};
