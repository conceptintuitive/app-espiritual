// Desenho do céu do nascimento em canvas, compartilhado pelo topo da Minha
// Área (CeuNascimento) e pelo card do story (app/seu-dia/cardStory.js). A
// conta (projeção, Sol, modo dia) é de lib/ceuNascimento.js; aqui só o traço.
//
// Dados de estrelas e constelações (public/olho/sky.json): d3-celestial
// (c) 2015 Olaf Frohn, licença BSD-3 — ver public/olho/LICENSE-d3-celestial.txt.

// Ponto da estrela em cada imagem (mesmas origens do zoom no Olho Cósmico).
export const IMAGENS_CEU = {
  retrato: { src: '/olho/e4.webp', w: 941, h: 1672, fx: 0.5, fy: 0.485 },
  largo: { src: '/olho/e4w.webp', w: 1672, h: 941, fx: 0.501, fy: 0.508 },
};
export const LIMIAR_LARGO = 0.9;

// sky.json (~95 KB) baixa uma vez só por visita, e só quando o céu aparece.
let promessaSky = null;
export function carregarSky() {
  promessaSky ||= fetch('/olho/sky.json')
    .then((r) => { if (!r.ok) throw new Error(`sky.json ${r.status}`); return r.json(); })
    .catch((e) => { promessaSky = null; throw e; });
  return promessaSky;
}

function corEstrela(bv) { // azul-branco pras quentes, dourado pras frias
  if (bv < 0.2) return '205,220,255';
  if (bv < 0.6) return '255,248,235';
  if (bv < 1.1) return '255,226,170';
  return '255,196,140';
}

/**
 * Desenha o céu projetado (lib/ceuNascimento.js → projetarCeu) num canvas W×(altura do canvas).
 * `k` = escala (1 na tela; 2 no card de 1080px, desenhado no dobro do croqui).
 */
export function desenharCeu(ctx, ceu, W, k = 1) {
  const { estrelas, linhas, rotulos, sol } = ceu;
  if (sol.dia) { // luz do dia vindo da direção do Sol
    ctx.fillStyle = 'rgba(70,45,95,.28)';
    ctx.fillRect(0, 0, W, ctx.canvas.height);
    const g = ctx.createRadialGradient(sol.ex, sol.ey, 0, sol.ex, sol.ey, W * 1.9);
    g.addColorStop(0, 'rgba(255,226,170,.95)'); g.addColorStop(0.18, 'rgba(250,180,100,.5)');
    g.addColorStop(0.5, 'rgba(180,110,120,.18)'); g.addColorStop(1, 'rgba(60,40,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, ctx.canvas.height);
    if (sol.x > -30 && sol.x < W + 30) { // disco do Sol quando está dentro da tela
      const d = ctx.createRadialGradient(sol.x, sol.y, 0, sol.x, sol.y, 46 * k);
      d.addColorStop(0, 'rgba(255,248,225,1)'); d.addColorStop(0.25, 'rgba(255,214,140,.9)'); d.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = d; ctx.beginPath(); ctx.arc(sol.x, sol.y, 46 * k, 0, 6.283); ctx.fill();
    }
  }
  const brilho = sol.dia ? 0.45 : 1; // de dia as estrelas ficam "escondidas"
  for (const { x, y, r, bv, ext } of estrelas) {
    ctx.fillStyle = `rgba(${corEstrela(bv)},${Math.min(1, ext * 0.9) * brilho})`;
    ctx.beginPath(); ctx.arc(x, y, r * 0.75 * k, 0, 6.283); ctx.fill();
    if (r > 2.4) { // brilho em volta das mais fortes
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4 * k);
      g.addColorStop(0, `rgba(${corEstrela(bv)},${0.35 * ext})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4 * k, 0, 6.283); ctx.fill();
    }
  }
  if (sol.dia) {
    // Modo dia (igual ao Olho Cósmico): a imagem da estrela (e4) não aparece e
    // o zênite vira um ponto pequeno e branco, pra não parecer um segundo Sol.
    const { x, y } = ceu.zenite;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16 * k);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.18, 'rgba(240,244,255,.55)'); g.addColorStop(1, 'rgba(240,244,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16 * k, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.8 * k;
    ctx.beginPath(); ctx.moveTo(x - 14 * k, y); ctx.lineTo(x + 14 * k, y); ctx.moveTo(x, y - 14 * k); ctx.lineTo(x, y + 14 * k); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.2 * k, 0, 6.283); ctx.fill();
  }
  for (const c of linhas) {
    ctx.strokeStyle = c.destaque ? 'rgba(255,214,140,.95)' : 'rgba(242,199,123,.38)';
    ctx.lineWidth = (c.destaque ? 1.6 : 0.8) * k;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of c.pts) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
  }
  ctx.font = `300 ${9.5 * k}px "Geist Mono", monospace`;
  ctx.textAlign = 'center';
  for (const l of rotulos) {
    const txt = l.texto.toUpperCase().split('').join(' ');
    const meia = ctx.measureText(txt).width / 2;
    if (l.x - meia < 6 * k || l.x + meia > W - 6 * k) continue; // nome cortado na borda não aparece
    ctx.fillStyle = l.destaque ? 'rgba(255,220,160,1)' : 'rgba(230,215,190,.75)';
    ctx.fillText(txt, l.x, l.y);
  }
}
