'use client';

// Olho Cósmico — abertura animada por scroll: olho → íris → galáxia → estrela
// → (perguntas) → céu real do nascimento → dígitos da data → número do
// Caminho de Vida. Portado da demo reference/olho-cosmico/index.html (branch
// reference-olho — fora da main de propósito).
//
//   mode="publico"  (/ceu)          na estrela o scroll trava e aparecem as
//                                   perguntas; o CTA final chama onCta(dados).
//                                   "Nasci fora do Brasil" pula o céu real e vai
//                                   direto pros dígitos e pro número.
//   mode="manual"   (/manual/[id])  sem perguntas: `dados` vem do registro e
//                                   a estrela passa direto pro céu. Botão
//                                   "pular ↓" durante toda a animação; onVisto()
//                                   avisa quando a pessoa pulou ou chegou ao fim.
//
// Nunca importe este arquivo de forma estática numa página: use next/dynamic
// com ssr:false (ver app/ceu/CeuClient.js e OlhoCosmicoManual.js), pra ele
// não entrar no bundle de nenhuma outra rota.
//
// O motor da animação é imperativo (refs + requestAnimationFrame), como na
// demo — re-renderizar o React a cada evento de scroll seria caro demais.
// O React só cuida do formulário de perguntas.
//
// Dados de estrelas e constelações (public/olho/sky.json): d3-celestial
// (c) 2015 Olaf Frohn, licença BSD-3 — ver public/olho/LICENSE-d3-celestial.txt.

import { Fragment, useEffect, useRef, useState } from 'react';
import s from './OlhoCosmico.module.css';
import { localToUTC, julianDay, localSiderealDeg, altAz, sunRaDec, makeProjector } from '@/lib/sky';
import { calcularNumeroVida } from '@/lib/calculos';
import CidadeAutocomplete from '@/app/components/CidadeAutocomplete';

/* Cada camada tem keyframes: [progresso, escala, opacidade, rotação(graus), blur(px)] */
// Retrato (celular): imagens 9:16 e1–e4.webp
const KF_V = {
  e1: [[0, 1, 1, 0, 0], [0.22, 1.8, 1, 0, 0], [0.30, 2.15, 0, 0, 2]],
  e2: [[0.18, 0.84, 0, 0, 0], [0.30, 1, 1, 0, 0], [0.50, 2.6, 1, 0, 0], [0.60, 3.6, 0, 0, 5]],
  e3: [[0.44, 0.32, 0, -140, 3], [0.58, 1, 1, 0, 0], [0.72, 1.18, 1, 14, 0], [0.81, 4.2, 0, 30, 0]],
  e4: [[0.74, 1.45, 0, 0, 0], [0.85, 1, 1, 0, 0], [1, 1.04, 1, 0, 0]],
};
// Desktop/paisagem: imagens 16:9 e1w–e4w.webp (pupila menor na e1w, então o
// zoom inicial é um pouco maior)
const KF_W = {
  e1: [[0, 1, 1, 0, 0], [0.22, 1.75, 1, 0, 0], [0.30, 2.05, 0, 0, 2]],
  e2: [[0.18, 0.85, 0, 0, 0], [0.30, 1, 1, 0, 0], [0.50, 2.5, 1, 0, 0], [0.60, 3.4, 0, 0, 5]],
  e3: KF_V.e3,
  e4: KF_V.e4,
};
// Ponto de cada imagem pra onde o zoom converge (pupila, centro da galáxia, estrela)
const ORIGINS = {
  v: { e1: '48.9% 45.2%', e2: '50% 46.7%', e3: '50% 48%', e4: '50% 48.5%' },
  w: { e1: '49.2% 48.7%', e2: '49.8% 48.9%', e3: '49.7% 50.8%', e4: '50.1% 50.8%' },
};
const CAMADAS = ['e1', 'e2', 'e3', 'e4'];
// Telas quadradas ou largas (largura/altura > 0,9) usam as imagens 16:9 — mesmo
// limiar da demo. Celular em pé fica sempre no retrato.
const LIMIAR_LARGO = 0.9;
const ehLargo = () => typeof window !== 'undefined' && innerWidth / innerHeight > LIMIAR_LARGO;
const srcCamada = (k, largo) => `/olho/${k}${largo ? 'w' : ''}.webp`;
const TEXT = { // [entra, cheio, sai, some]
  t1: [0.02, 0.06, 0.13, 0.17],
  t2: [0.32, 0.36, 0.43, 0.47],
  t3: [0.60, 0.63, 0.70, 0.73],
};
const PT = { Ori: 'Órion', Sco: 'Escorpião', Cru: 'Cruzeiro do Sul', Cen: 'Centauro', Sgr: 'Sagitário', Leo: 'Leão', Tau: 'Touro',
  Gem: 'Gêmeos', Vir: 'Virgem', Cnc: 'Câncer', Ari: 'Áries', Psc: 'Peixes', Aqr: 'Aquário', Cap: 'Capricórnio', Lib: 'Libra',
  CMa: 'Cão Maior', Car: 'Carina', UMa: 'Ursa Maior', Cyg: 'Cisne', Lyr: 'Lira', Aql: 'Águia', Peg: 'Pégaso', Boo: 'Boieiro', Gru: 'Grou', Pav: 'Pavão', Vel: 'Vela' };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const GATE = 0.6;
const D2R = Math.PI / 180;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function sample(frames, p) {
  if (p <= frames[0][0]) return frames[0];
  const last = frames[frames.length - 1];
  if (p >= last[0]) return last;
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i], b = frames[i + 1];
    if (p >= a[0] && p <= b[0]) {
      const t = ease((p - a[0]) / (b[0] - a[0]));
      return a.map((v, j) => (j === 0 ? p : lerp(v, b[j], t)));
    }
  }
  return last;
}
function band(p, [a, b, c, d]) {
  if (p < a || p > d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p > c) return 1 - (p - c) / (d - c);
  return 1;
}
function starColor(bv) { // azul-branco pras quentes, dourado pras frias
  if (bv < 0.2) return '205,220,255'; if (bv < 0.6) return '255,248,235'; if (bv < 1.1) return '255,226,170'; return '255,196,140';
}

/* Quebra uma frase em palavras (cada uma anima sozinha). */
function Ws({ t }) {
  const ws = t.split(' ');
  return ws.map((w, i) => (
    <Fragment key={i}><span className={s.w}>{w}</span>{i < ws.length - 1 ? ' ' : ''}</Fragment>
  ));
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
// Motor (imperativo). Recebe os elementos e devolve os controles.
// ─────────────────────────────────────────────────────────────────────────────
function criarMotor(el, { mode, reduce, onGate, onVisto }) {
  const st = {
    SKY: null, place: null, birthUTC: null, approx: false, sun: null,
    proj: [], projLines: [], labels: [], digitEls: [],
    skyState: { stars: 0, lines: 0, dim: 1 },
    hasData: false, gateOpen: false, visivel: true, vivo: true, raf: 0, ticking: false,
    fora: false, // nasceu fora do Brasil: sem céu real, só dígitos e número
    kf: KF_V, largo: null,
    vistoAvisado: false,
  };
  const cx2 = el.sky.getContext('2d');
  const words = Object.fromEntries(Object.keys(TEXT).map((k) => [k, [...el[k].querySelectorAll(`.${s.w}`)]]));

  function medir() {
    const rect = el.root.getBoundingClientRect();
    const max = Math.max(1, el.root.offsetHeight - innerHeight);
    return { rect, max, top: rect.top + scrollY };
  }

  function buildDigits(dateStr, name, numero) {
    const [y, m, d] = dateStr.split('-');
    const ds = (d + m + y).split('').map(Number);
    el.digits.innerHTML = '';
    st.digitEls = ds.map((n, i) => {
      const e = document.createElement('div');
      e.className = s.digit; e.textContent = n;
      e.dataset.a = (i / ds.length) * Math.PI * 2 - Math.PI / 2;
      el.digits.appendChild(e); return e;
    });
    el.num.textContent = numero;
    el.who.textContent = `${name || 'Você'}, seu número é`;
  }

  function setCaption() {
    if (st.sun && st.sun.day) {
      el.skyl1.innerHTML = 'Você chegou<br><em>com o Sol no céu.</em>';
      el.skyl3.textContent = 'As estrelas estavam lá, escondidas pela luz.';
    } else {
      el.skyl1.innerHTML = st.approx ? 'Este era o céu<br>da noite em que <em>você chegou.</em>' : 'Este era o céu<br>quando <em>você chegou.</em>';
      el.skyl3.textContent = st.approx ? 'Céu aproximado: sem a hora, mostramos o céu às 21h.' : '';
    }
  }

  function setBirth(dateStr, timeStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (st.fora) {
      // Sem local no Brasil não dá pra montar o céu: some o céu, fica a legenda.
      st.birthUTC = null; st.sun = null; st.approx = false;
      st.proj = []; st.projLines = []; st.labels = [];
      el.skyl1.innerHTML = '';
      el.skyl3.textContent = 'O céu do seu nascimento ainda não está disponível para fora do Brasil.';
      el.skymeta.textContent = `${d} ${MESES[m - 1]} ${y}`;
      cx2.clearRect(0, 0, el.sky.width, el.sky.height);
      return;
    }
    st.approx = !timeStr;
    const [hh, mm] = (timeStr || '21:00').split(':').map(Number);
    st.birthUTC = localToUTC({ y, m, d, hh, mm }, st.place.tz);
    el.skymeta.textContent = `${st.place.name} · ${d} ${MESES[m - 1]} ${y} · ${st.approx ? 'hora desconhecida' : String(hh).padStart(2, '0') + 'h' + String(mm).padStart(2, '0')}`;
    computeSky();
  }

  function sizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    el.sky.width = el.stage.clientWidth * dpr; el.sky.height = el.stage.clientHeight * dpr;
    cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function computeSky() {
    if (!st.SKY || st.birthUTC === null) return;
    const W = el.stage.clientWidth, H = el.stage.clientHeight;
    const cx = W * 0.5, cy = H * 0.485, R = Math.max(W, H) * 0.56;
    const jd = julianDay(st.birthUTC);
    const lst = localSiderealDeg(jd, st.place.lon);
    // projeção estereográfica centrada no zênite (olhando pra cima: norte em cima, leste à esquerda)
    const P2 = makeProjector({ lstDeg: lst, latDeg: st.place.lat, cx, cy, R });
    // Sol: se estava acima do horizonte, a pessoa nasceu de dia (nunca sem hora)
    const [sra, sdec] = sunRaDec(jd);
    const [salt, saz] = altAz(sra, sdec, lst, st.place.lat);
    const sr = R * Math.tan((Math.PI / 2 - salt) / 2);
    const sun = { alt: salt, x: cx - sr * Math.sin(saz), y: cy - sr * Math.cos(saz), day: !st.approx && salt > -0.05 };
    st.zenite = { x: cx, y: cy };
    // se o Sol cai fora da tela, a luz vem da borda na direção dele
    sun.ex = Math.min(W + 40, Math.max(-40, sun.x)); sun.ey = Math.min(H + 40, Math.max(-40, sun.y));
    st.sun = sun;
    setCaption();
    const proj = [];
    for (const [ra, dec, mag, bv] of st.SKY.stars) {
      const [x, y, alt] = P2(ra, dec);
      if (alt < 0 || x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const ext = Math.min(1, alt / (12 * D2R)); // estrelas perto do horizonte ficam mais fracas
      proj.push([x, y, Math.max(0.5, (5.8 - mag) * 0.62), bv, ext, Math.random() * 6.28]);
    }
    const projLines = []; let labels = [];
    for (const [id, segs] of Object.entries(st.SKY.lines)) {
      const pts = []; let sx = 0, sy = 0, n = 0, minAlt = 9;
      for (const seg of segs) {
        const ps = seg.map(([ra, dec]) => P2(ra, dec));
        for (let i = 0; i < ps.length - 1; i++) {
          const a = ps[i], b = ps[i + 1];
          if (a[2] < 0.02 || b[2] < 0.02) continue;
          pts.push([a[0], a[1], b[0], b[1], Math.hypot(b[0] - a[0], b[1] - a[1])]);
        }
        for (const q of ps) { sx += q[0]; sy += q[1]; n++; minAlt = Math.min(minAlt, q[2]); }
      }
      if (!pts.length) continue;
      projLines.push({ id, pts, hi: id === 'Cru' });
      const lx = sx / n, ly = sy / n;
      if (PT[id] && minAlt > 0.15 && lx > 30 && lx < W - 30 && ly > 60 && ly + (id === 'Cru' ? 30 : 14) < H * 0.72)
        labels.push({ t: PT[id], x: lx, y: ly, d: Math.hypot(lx - cx, ly - cy), hi: id === 'Cru' });
    }
    labels.sort((a, b) => (b.hi - a.hi) || (a.d - b.d));
    labels = labels.filter((l) => Math.hypot(l.x - cx, l.y - cy) > 70).slice(0, 5);
    st.proj = proj; st.projLines = projLines; st.labels = labels;
    sizeCanvas(); drawSky();
  }

  function drawSky(now = performance.now()) {
    if (!st.SKY) return;
    const cv = el.sky, sun = st.sun;
    cx2.clearRect(0, 0, cv.width, cv.height);
    if (st.skyState.stars <= 0) return;
    const dayK = sun && sun.day ? 1 : 0;
    if (dayK) { // luz do dia vindo da direção do Sol
      const w = el.stage.clientWidth;
      cx2.fillStyle = 'rgba(70,45,95,.28)'; cx2.fillRect(0, 0, cv.width, cv.height); // céu mais claro
      const g = cx2.createRadialGradient(sun.ex, sun.ey, 0, sun.ex, sun.ey, w * 1.9);
      g.addColorStop(0, 'rgba(255,226,170,.95)'); g.addColorStop(0.18, 'rgba(250,180,100,.5)'); g.addColorStop(0.5, 'rgba(180,110,120,.18)'); g.addColorStop(1, 'rgba(60,40,90,0)');
      cx2.fillStyle = g; cx2.fillRect(0, 0, cv.width, cv.height);
      if (sun.x > -30 && sun.x < w + 30) { // disco do Sol quando está dentro da tela
        const d = cx2.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 46);
        d.addColorStop(0, 'rgba(255,248,225,1)'); d.addColorStop(0.25, 'rgba(255,214,140,.9)'); d.addColorStop(1, 'rgba(255,170,80,0)');
        cx2.fillStyle = d; cx2.beginPath(); cx2.arc(sun.x, sun.y, 46, 0, 6.283); cx2.fill();
      }
    }
    const starK = dayK ? 0.45 : 1; // de dia as estrelas ficam "escondidas"
    const t = now / 1000;
    for (const [x, y, r, bv, ext, ph] of st.proj) {
      const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 2.1 + ph);
      cx2.fillStyle = `rgba(${starColor(bv)},${Math.min(1, ext * tw) * starK})`;
      cx2.beginPath(); cx2.arc(x, y, r * 0.75, 0, 6.283); cx2.fill();
      if (r > 2.4) { // brilho em volta das estrelas mais fortes
        const g = cx2.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, `rgba(${starColor(bv)},${0.35 * ext})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        cx2.fillStyle = g; cx2.beginPath(); cx2.arc(x, y, r * 4, 0, 6.283); cx2.fill();
      }
    }
    if (dayK && st.zenite) {
      // Modo dia: a estrela do zênite (que de noite é a imagem e4) vira um
      // ponto pequeno e branco, pra não competir com o Sol nem parecer um
      // segundo Sol. A e4 some junto (ver render) — encolher a imagem mostraria
      // a borda retangular dela.
      const { x, y } = st.zenite;
      const g = cx2.createRadialGradient(x, y, 0, x, y, 16);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.18, 'rgba(240,244,255,.55)'); g.addColorStop(1, 'rgba(240,244,255,0)');
      cx2.fillStyle = g; cx2.beginPath(); cx2.arc(x, y, 16, 0, 6.283); cx2.fill();
      cx2.strokeStyle = 'rgba(255,255,255,.55)'; cx2.lineWidth = 0.8;
      cx2.beginPath(); cx2.moveTo(x - 14, y); cx2.lineTo(x + 14, y); cx2.moveTo(x, y - 14); cx2.lineTo(x, y + 14); cx2.stroke();
      cx2.fillStyle = '#fff'; cx2.beginPath(); cx2.arc(x, y, 2.2, 0, 6.283); cx2.fill();
    }
    if (st.skyState.lines > 0) {
      const L = st.skyState.lines;
      for (const c of st.projLines) {
        cx2.strokeStyle = c.hi ? `rgba(255,214,140,${0.95 * L})` : `rgba(242,199,123,${0.38 * L})`;
        cx2.lineWidth = c.hi ? 1.6 : 0.8;
        for (const [x1, y1, x2, y2, len] of c.pts) { // cada linha "se desenha" de uma ponta à outra
          cx2.setLineDash([len * L, len + 1]);
          cx2.beginPath(); cx2.moveTo(x1, y1); cx2.lineTo(x2, y2); cx2.stroke();
        }
      }
      cx2.setLineDash([]);
      cx2.font = '300 9.5px "Geist Mono", monospace'; cx2.textAlign = 'center';
      const Wc = el.sky.clientWidth || el.sky.width;
      for (const l of st.labels) {
        const txt = l.t.toUpperCase().split('').join(' ');
        // Nome que não cabe inteiro na tela (ex.: "…MAIOR" cortado na borda) não aparece.
        const meia = cx2.measureText(txt).width / 2;
        if (l.x - meia < 6 || l.x + meia > Wc - 6) continue;
        cx2.fillStyle = l.hi ? `rgba(255,220,160,${L})` : `rgba(230,215,190,${0.75 * L})`;
        cx2.fillText(txt, l.x, l.y + (l.hi ? 30 : 14));
      }
    }
  }

  // Brilho das estrelas: só roda com o céu visível na tela e sem reduced-motion.
  function twinkle(now) {
    st.raf = 0;
    if (!st.vivo || reduce || !st.visivel) return;
    st.raf = requestAnimationFrame(twinkle);
    try { if (st.skyState.stars > 0) drawSky(now); } catch (e) { console.error(e); }
  }
  function ligarTwinkle() { if (!st.raf && !reduce && st.visivel && st.vivo) st.raf = requestAnimationFrame(twinkle); }

  // "Sticky" do palco: fixo enquanto a seção está passando pela tela.
  function posicionarPalco(rect, max) {
    const fixo = rect.top <= 0 && -rect.top < max;
    const depois = -rect.top >= max;
    el.stageWrap.classList.toggle(s.fixo, fixo);
    el.stageWrap.classList.toggle(s.depois, depois);
  }

  // Troca retrato ↔ paisagem: imagens, keyframes, origens do zoom e máscara
  // elíptica da galáxia (.largo no CSS). Só age quando a orientação muda.
  function setOrientation() {
    const largo = ehLargo();
    if (largo === st.largo) return;
    st.largo = largo;
    st.kf = largo ? KF_W : KF_V;
    el.stageWrap.classList.toggle(s.largo, largo); // stageWrap: o React nunca reescreve o className dele
    for (const k of CAMADAS) {
      const src = srcCamada(k, largo);
      if (!el[k].getAttribute('src')?.endsWith(src)) el[k].setAttribute('src', src);
      el[k].style.transformOrigin = ORIGINS[largo ? 'w' : 'v'][k];
    }
  }

  function render() {
    st.ticking = false;
    let P;
    if (reduce) {
      // Versão estática: antes dos dados, a estrela com as perguntas; depois, o
      // quadro final (céu + número + CTA).
      P = st.hasData ? 1 : GATE;
    } else {
      const { rect, max, top } = medir();
      if (mode === 'publico' && !st.hasData && -rect.top > max * GATE) {
        scrollTo({ top: top + max * GATE, behavior: 'instant' });
      }
      const m2 = medir();
      posicionarPalco(m2.rect, m2.max);
      P = clamp01(-m2.rect.top / m2.max);
    }

    const atGate = mode === 'publico' && !st.hasData && P >= GATE - 0.004;
    if (atGate !== st.gateOpen) {
      st.gateOpen = atGate;
      onGate(atGate);
    }

    // linha do tempo: imagens (0–0.6) → céu real (0.6–0.82) → dígitos e número (0.82–1)
    const p = P < 0.6 ? P / 0.6 * 0.86 : P < 0.82 ? 0.86 : 0.86 + (P - 0.82) / 0.18 * 0.14;
    const sk = clamp01((P - 0.62) / 0.2);
    st.skyState.stars = clamp01(sk / 0.35);
    st.skyState.lines = ease(clamp01((sk - 0.3) / 0.5));
    st.skyState.dim = 1 - 0.55 * clamp01((P - 0.84) / 0.06);
    el.sky.style.opacity = st.skyState.stars * st.skyState.dim;
    const cap = reduce ? (st.hasData ? 1 : 0)
      : st.fora ? band(P, [0.70, 0.75, 1.01, 1.02]) // fica até o número (no topo, ver .capTopo)
      : band(P, [0.70, 0.75, 0.82, 0.86]);
    el.skycap.style.opacity = cap; el.skycap.style.transform = `translateY(${(1 - cap) * 12}px)`;
    el.zen.style.opacity = reduce || st.fora ? 0 : band(P, [0.66, 0.70, 0.80, 0.84]);
    try { drawSky(); } catch (e) { console.error(e); }

    // Modo dia: a imagem da estrela (e4) sai junto com a entrada do céu e o
    // canvas desenha no lugar uma estrela menor e branca (ver drawSky).
    const diaK = st.sun && st.sun.day ? st.skyState.stars : 0;
    for (const k of CAMADAS) {
      const [, sc, o, r, b] = sample(st.kf[k], p);
      const node = el[k];
      node.style.opacity = k === 'e4' ? o * (1 - diaK) : o;
      node.style.transform = `scale(${sc}) rotate(${r}deg)`;
      node.style.filter = b > 0.1 ? `blur(${b}px)` : 'none';
    }
    // clarão dourado na passagem galáxia -> estrela
    el.flash.style.opacity = reduce ? 0 : band(p, [0.70, 0.77, 0.78, 0.86]) * 0.9;

    for (const [k, w] of Object.entries(TEXT)) {
      const v = reduce ? 0 : band(p, w);
      el[k].style.opacity = v > 0 ? 1 : 0;
      const ws = words[k], n = ws.length, step = 0.5 / n;
      ws.forEach((node, i) => {
        const t = ease(clamp01((v - i * step) / 0.5));
        node.style.opacity = t;
        node.style.filter = t < 0.99 ? `blur(${(1 - t) * 10}px)` : 'none';
        node.style.transform = `translateY(${(1 - t) * 12}px)`;
      });
    }

    // dígitos da data: aparecem orbitando a estrela e convergem pro centro
    const W = el.stage.clientWidth;
    const appear = clamp01((p - 0.86) / 0.04);
    const merge = ease(clamp01((p - 0.92) / 0.05));
    const spin = p * 2.2;
    st.digitEls.forEach((node) => {
      const a = +node.dataset.a + spin;
      // raio pela menor dimensão: no desktop a largura sozinha jogaria os dígitos pra fora
      const r = Math.min(W, el.stage.clientHeight) * 0.34 * (1 - merge);
      node.style.opacity = appear * (1 - merge);
      node.style.transform = `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) scale(${1 - merge * 0.5})`;
    });
    const rv = st.hasData ? ease(clamp01((p - 0.955) / 0.03)) : 0;
    el.reveal.style.opacity = rv;
    el.reveal.style.transform = `translateY(-50%) scale(${0.85 + rv * 0.15})`;
    const cta = st.hasData ? clamp01((p - 0.975) / 0.02) : 0;
    el.cta.style.opacity = cta;
    el.cta.style.pointerEvents = cta > 0.9 ? 'auto' : 'none';
    el.hint.style.opacity = P > 0.02 ? 0 : 1;
    if (st.hasData && P >= 0.98) avisarVisto();
    if (st.skyState.stars > 0) ligarTwinkle();
  }

  function avisarVisto() {
    if (st.vistoAvisado) return;
    st.vistoAvisado = true;
    onVisto?.();
  }

  const onScroll = () => { if (!st.ticking) { st.ticking = true; requestAnimationFrame(render); } };
  const onResize = () => { setOrientation(); computeSky(); render(); };
  setOrientation();
  if (!reduce) addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);

  const io = new IntersectionObserver(([entry]) => {
    st.visivel = entry.isIntersecting;
    if (st.visivel) ligarTwinkle();
  });
  io.observe(el.root);

  return {
    setSky(json) { st.SKY = json; computeSky(); render(); },
    /** @param {{ nome: string, data: string, hora: string|null, place: {name,lat,lon,tz}|null, numero: number }} d
     *  place = null → nasceu fora do Brasil (sem céu real). */
    setDados(d) {
      st.place = d.place;
      st.fora = !d.place;
      el.skycap.classList.toggle(s.capTopo, st.fora);
      buildDigits(d.data, d.nome, d.numero);
      setBirth(d.data, d.hora);
      st.hasData = true; st.gateOpen = false;
      render();
    },
    /** Rola sozinho até o céu aparecer (depois de responder as perguntas). */
    seguirProCeu() {
      if (reduce) return;
      const { max, top } = medir();
      // fora do Brasil: pula o céu e para onde os dígitos começam a aparecer
      scrollTo({ top: top + max * (st.fora ? 0.84 : 0.74), behavior: 'smooth' });
    },
    /** "trocar dados": volta pra estrela com as perguntas. */
    editar() {
      st.hasData = false;
      if (!reduce) {
        const { max, top } = medir();
        scrollTo({ top: top + max * GATE, behavior: 'instant' });
      }
      render();
    },
    /** Rola pra logo depois da seção (CTA do modo manual). */
    rolarProFim() {
      avisarVisto();
      const { top } = medir();
      scrollTo({ top: top + el.root.offsetHeight, behavior: reduce ? 'instant' : 'smooth' });
    },
    render,
    destruir() {
      st.vivo = false;
      if (st.raf) cancelAnimationFrame(st.raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      io.disconnect();
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   mode: 'publico' | 'manual',
 *   dados?: { nome: string, data: string, hora: string|null,
 *             place: { name: string, lat: number, lon: number, tz: string }, numero: number } | null,
 *   onCta?: (dados: object) => void,
 *   onVisto?: () => void,
 * }} props
 *   mode="manual": `dados` obrigatório (pode chegar depois — fica preto até lá).
 *     `onVisto` é chamado uma vez quando a pessoa pula ou chega ao número.
 *   mode="publico": `onCta` recebe { nome, dataNascimento, hora, cidade } das
 *     respostas (cidade = null quando nasceu fora do Brasil).
 */
export default function OlhoCosmico({ mode = 'publico', dados = null, onCta, onVisto }) {
  const refs = {
    root: useRef(null), stageWrap: useRef(null), stage: useRef(null),
    e1: useRef(null), e2: useRef(null), e3: useRef(null), e4: useRef(null),
    sky: useRef(null), flash: useRef(null), t1: useRef(null), t2: useRef(null), t3: useRef(null),
    zen: useRef(null), skycap: useRef(null), skyl1: useRef(null), skyl3: useRef(null), skymeta: useRef(null),
    digits: useRef(null), reveal: useRef(null), who: useRef(null), num: useRef(null), cta: useRef(null), hint: useRef(null),
  };
  const motor = useRef(null);
  // ssr:false — dá pra ler a janela já no 1º render. useState pra não mudar
  // depois: quem troca as imagens no resize é o motor, direto no DOM.
  const [largoInicial] = useState(ehLargo);
  const [reduce, setReduce] = useState(false);
  const [pronto, setPronto] = useState(false);

  // Formulário (só no modo público)
  const [introAberta, setIntroAberta] = useState(false);
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [semHora, setSemHora] = useState(false);
  const [cidadeTexto, setCidadeTexto] = useState('');
  const [cidade, setCidade] = useState(null);
  const [respondido, setRespondido] = useState(false);
  // onVisto pode mudar a cada render do pai; o motor lê sempre a versão atual
  const onVistoRef = useRef(onVisto);
  onVistoRef.current = onVisto;
  const inputs = { 1: useRef(null), 2: useRef(null), 3: useRef(null), 4: useRef(null) };

  useEffect(() => {
    const r = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setReduce(r);
    const el = Object.fromEntries(Object.entries(refs).map(([k, v]) => [k, v.current]));
    const m = criarMotor(el, { mode, reduce: r, onGate: setIntroAberta, onVisto: () => onVistoRef.current?.() });
    motor.current = m;
    setPronto(true);
    let cancelado = false;
    fetch('/olho/sky.json')
      .then((res) => res.json())
      .then((json) => { if (!cancelado) m.setSky(json); })
      .catch((e) => console.error('[OlhoCosmico] sky.json', e));
    m.render();
    return () => { cancelado = true; m.destruir(); motor.current = null; };
    // refs são estáveis; o motor é criado uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Modo manual: dados do registro (podem chegar depois da montagem)
  useEffect(() => {
    if (mode === 'manual' && dados && pronto && motor.current) motor.current.setDados(dados);
  }, [mode, dados, pronto]);

  // Ao abrir a etapa, foca o campo dela (igual à demo: 350ms, sem rolar a página)
  useEffect(() => {
    if (!introAberta) return;
    const inp = inputs[step]?.current;
    if (!inp) return;
    const t = setTimeout(() => inp.focus({ preventScroll: true }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, introAberta]);

  const valido = step === 1 ? nome.trim().length > 0 : step === 2 ? !!data : step === 3 ? !!hora : step === 4 ? !!cidade : true;
  const avancar = () => { if (valido) setStep((n) => n + 1); };

  // `fora` = "Nasci fora do Brasil": sem cidade, pula o céu real
  function revelar(e, fora = false) {
    e?.preventDefault();
    if ((!cidade && !fora) || !data || !nome.trim()) return;
    if (fora) { setCidade(null); setCidadeTexto(''); }
    motor.current?.setDados({
      nome: nome.trim(),
      data,
      hora: semHora ? null : hora,
      place: fora ? null : { name: cidade.nome, lat: cidade.lat, lon: cidade.lon, tz: cidade.tz },
      numero: calcularNumeroVida(data),
    });
    setIntroAberta(false);
    setRespondido(true);
    try { window.gtag?.('event', 'ceu_revelar', { event_category: 'ceu', sem_hora: semHora, fora_do_brasil: fora }); } catch {}
    motor.current?.seguirProCeu();
  }

  function clicarCta(e) {
    e.preventDefault();
    if (mode === 'manual') { motor.current?.rolarProFim(); return; }
    onCta?.({
      nome: nome.trim(),
      dataNascimento: data,
      hora: semHora ? null : hora,
      cidade: cidade ? { ibge: cidade.ibge, nome: cidade.nome, uf: cidade.uf, lat: cidade.lat, lon: cidade.lon, tz: cidade.tz } : null,
    });
  }

  function editar() {
    setRespondido(false);
    setStep(1);
    motor.current?.editar();
  }

  const dotsOn = step - 1;

  return (
    <>
    <section ref={refs.root} className={`${s.root} ${reduce ? s.estatico : ''} ${mode === 'manual' ? s.manual : ''}`} aria-label="O céu do seu nascimento">
      <div ref={refs.stageWrap} className={s.stageWrap}>
        <div ref={refs.stage} className={s.stage}>
          {/* eslint-disable @next/next/no-img-element -- camadas animadas por transform; next/image não ajuda aqui */}
          {/* src inicial já na orientação certa (só baixa um jogo de imagens);
              depois, giro/resize troca pelo motor (setOrientation) */}
          <img ref={refs.e1} className={`${s.layer} ${s.e1}`} src={srcCamada('e1', largoInicial)} alt="" fetchPriority="high" />
          <img ref={refs.e2} className={`${s.layer} ${s.e2}`} src={srcCamada('e2', largoInicial)} alt="" />
          <img ref={refs.e3} className={`${s.layer} ${s.e3}`} src={srcCamada('e3', largoInicial)} alt="" />
          <img ref={refs.e4} className={`${s.layer} ${s.e4}`} src={srcCamada('e4', largoInicial)} alt="" />
          {/* eslint-enable @next/next/no-img-element */}
          <canvas ref={refs.sky} className={s.sky} />
          <div ref={refs.flash} className={s.flash} />
          <div className={s.vignette} />

          <div ref={refs.t1} className={`${s.line} ${s.top}`}><Ws t="Antes de você nascer," /><br /><Ws t="o céu já tinha" /> <em><Ws t="um desenho." /></em></div>
          <div ref={refs.t2} className={`${s.line} ${s.bottom}`}><Ws t="Ele ficou guardado" /><br /><em><Ws t="em você." /></em></div>
          <div ref={refs.t3} className={`${s.line} ${s.bottom}`}><Ws t="Nos seus" /> <em><Ws t="padrões." /></em><br /><Ws t="Nas suas" /> <em><Ws t="escolhas." /></em></div>

          <div ref={refs.zen} className={s.zen}>o ponto exato acima de você</div>
          <div ref={refs.skycap} className={s.skycap}>
            <div ref={refs.skyl1} className={s.l1} />
            <div ref={refs.skyl3} className={s.l3} />
            <div ref={refs.skymeta} className={s.l2} />
          </div>
          <div ref={refs.digits} />
          <div ref={refs.reveal} className={s.reveal}>
            <div ref={refs.who} className={s.who} />
            <div ref={refs.num} className={s.num} />
            <div className={s.what}>Número do Caminho de Vida</div>
          </div>
          <a ref={refs.cta} className={s.cta} href={mode === 'manual' ? '#manual' : '/'} onClick={clicarCta}>{mode === 'manual' ? 'Ler meu Manual ↓' : 'Abrir meu mapa'}</a>
          <div ref={refs.hint} className={s.hint}>role <span>↓</span></div>
        </div>

        {mode === 'manual' && (
          <button type="button" className={s.pular} onClick={() => motor.current?.rolarProFim()}>pular ↓</button>
        )}

        {mode === 'publico' && (
          <>
            <button type="button" className={`${s.edit} ${respondido ? '' : s.off}`} onClick={editar}>✎ trocar dados</button>

            <div className={`${s.intro} ${introAberta ? '' : s.hide}`}>
              <form
                className={s.introBox}
                autoComplete="off"
                onSubmit={revelar}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && step < 4) { e.preventDefault(); avancar(); }
                }}
              >
                <div className={`${s.step} ${step === 0 ? s.on : ''}`}>
                  <h1>Esse ponto de luz<br /><em>é você.</em></h1>
                  <p className={s.sub}>Descubra o céu exato do momento em que você chegou — e o número que ele deixou em você.</p>
                  <button type="button" className={s.go} onClick={() => setStep(1)}>Descobrir meu céu</button>
                </div>
                <div className={`${s.step} ${step === 1 ? s.on : ''}`}>
                  <h2>Como você <em>se chama?</em></h2>
                  <input ref={inputs[1]} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu primeiro nome" maxLength={16} />
                  <button type="button" className={s.go} disabled={step === 1 && !valido} onClick={avancar}>Continuar →</button>
                </div>
                <div className={`${s.step} ${step === 2 ? s.on : ''}`}>
                  <h2>Quando você <em>nasceu?</em></h2>
                  <input ref={inputs[2]} type="date" min="1920-01-01" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
                  <button type="button" className={s.go} disabled={step === 2 && !valido} onClick={avancar}>Continuar →</button>
                </div>
                <div className={`${s.step} ${step === 3 ? s.on : ''}`}>
                  <h2>Que <em>horas?</em></h2>
                  <input ref={inputs[3]} type="time" value={hora} onChange={(e) => { setHora(e.target.value); setSemHora(false); }} />
                  <button type="button" className={s.go} disabled={step === 3 && !valido} onClick={avancar}>Continuar →</button>
                  <button type="button" className={s.skip} onClick={() => { setSemHora(true); setHora(''); setStep(4); }}>Não sei a hora</button>
                </div>
                <div className={`${s.step} ${step === 4 ? s.on : ''}`}>
                  <h2>Em que <em>cidade?</em></h2>
                  <CidadeAutocomplete
                    tema="olho"
                    abrirPraCima
                    inputRef={inputs[4]}
                    value={cidadeTexto}
                    placeholder="Digite sua cidade"
                    onChangeText={(t) => { setCidadeTexto(t); setCidade(null); }}
                    onSelect={(m) => { setCidade(m); setCidadeTexto(m.nome); }}
                  />
                  <button type="button" className={`${s.skip} ${s.fora}`} onClick={(e) => revelar(e, true)}>Nasci fora do Brasil</button>
                  <button type="submit" className={s.go} disabled={step === 4 && !valido}>Revelar meu céu ✦</button>
                </div>
                <button type="button" className={`${s.back} ${step === 0 ? s.backOff : ''}`} onClick={() => step > 0 && setStep(step - 1)}>← voltar</button>
                <div className={s.dots} style={{ opacity: step === 0 ? 0 : 1 }}>
                  {[0, 1, 2, 3].map((i) => <i key={i} className={i === dotsOn ? s.dotOn : ''} />)}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </section>
    {mode === 'manual' && <div className={s.emenda} aria-hidden="true" />}
    </>
  );
}
