// lib/reelsAnimacao.js — a linha do tempo do Reels diário (9s, 30fps,
// 1080x1920). Puro e sem dependências: usado pela página que o GitHub Actions
// filma (app/social/reels/[data]) e pelo roteiro alternativo do Creatomate
// (lib/socialReels.js), pra os dois motores darem o mesmo vídeo.
//
//   0,0–9,0s  céu do dia com zoom lento (100% → 112%)
//   0,4–4,4s  r1: o gancho do carrossel do dia (entra subindo, sai em fade)
//   4,6–7,2s  r2: a virada
//   7,3–9,0s  r3: "Faz o seu mapa grátis · link na bio" (fica até o fim)
//
// estadoNoTempo(t) devolve o estado de cada camada num instante: a captura
// quadro a quadro não depende do relógio da máquina, então o vídeo sai igual
// em qualquer runner, rápido ou lento.

export const REELS = { duracao: 9, fps: 30, largura: 1080, altura: 1920 };

export const ZOOM_CEU = 0.12;
export const ENTRADA = 0.8; // s
export const SAIDA = 0.4; // s
export const SUBIDA_PX = 77; // ~4% da altura

export const CAMADAS = [
  { id: 'r1', inicio: 0.4, fim: 4.4, sai: true },
  { id: 'r2', inicio: 4.6, fim: 7.2, sai: true },
  { id: 'r3', inicio: 7.3, fim: REELS.duracao, sai: false },
];

const limita = (x) => Math.min(1, Math.max(0, x));
const sobeSuave = (x) => 1 - (1 - x) ** 2; // quadratic-out
const desceSuave = (x) => x * x; // quadratic-in
const arred = (x, casas = 4) => Math.round(x * 10 ** casas) / 10 ** casas;

/** Estado de tudo no instante t (segundos). */
export function estadoNoTempo(t) {
  const escalaCeu = arred(1 + ZOOM_CEU * limita(t / REELS.duracao));
  const camadas = CAMADAS.map((c) => {
    if (t < c.inicio || t > c.fim) return { id: c.id, opacidade: 0, deslocY: 0 };
    const entrou = sobeSuave(limita((t - c.inicio) / ENTRADA));
    let opacidade = entrou;
    if (c.sai) opacidade *= 1 - desceSuave(1 - limita((c.fim - t) / SAIDA));
    return { id: c.id, opacidade: arred(opacidade), deslocY: arred((1 - entrou) * SUBIDA_PX, 2) };
  });
  return { escalaCeu, camadas };
}

export const totalQuadros = () => Math.round(REELS.duracao * REELS.fps); // 270
export const tempoDoQuadro = (i) => i / REELS.fps;
