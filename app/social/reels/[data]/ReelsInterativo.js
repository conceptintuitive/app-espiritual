'use client';

// O Reels INTERATIVO (lib/reelsInterativo.js): mesma voz, mesmo céu do dia e
// mesma legenda palavra por palavra do narrado, com a cena de cada formato:
//   carta   3 cartas de costas, distribuídas como numa mesa; cada uma acende
//           quando a voz diz "um", "dois", "três"; contador 3-2-1 num anel que
//           se esvazia; cada carta gira (3D) quando a voz diz "Carta N".
//   pausa   8 práticas a 0,4s cada, num quadro com "❚❚ PAUSA AGORA" e 8
//           marcas de progresso; depois as 8, pequenas, pra quem voltou.
//   numero  o exemplo (dia 28 → 2 + 8 = 10 → 1 + 0 = 1) montado conforme a voz
//           fala, depois a grade 1–9 com o número falado aceso em dourado.
//   frase   a frase do dia grande, acendendo palavra por palavra com a voz (ela
//           mesma é a legenda); o crédito "— Autor, Livro" entra quando a voz
//           diz o autor; depois a frase sobe e encolhe e entra "PRA HOJE" com o
//           "Hoje, …" (texto nosso, separado da citação) e a chamada.
// Tudo é função do tempo t (window.__quadro(t) na captura), nada de relógio:
// o mesmo t dá sempre o mesmo quadro.
//   captura: o robô chama window.__carregar({ formato, cena, eventos,
//            palavras, duracao, vozes }) e depois window.__quadro(t).
//   normal:  pra assistir (prévia): toca os trechos de voz cada um no seu
//            segundo (depois de um toque) e repete.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { REELS, escalaCeuNarrado } from '@/lib/reelsAnimacao';
import { blocosDaLegenda, legendaNoTempo } from '@/lib/reelsRoteiro';
import { cenaCarta, cenaPausa, cenaNumero, cenaFrase, NOME_FORMATO } from '@/lib/reelsInterativo';

const OURO = '#f2c77b';
const TEXTO = '#f3e9da';
const FUNDO = '#07040d';
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"Geist Mono", ui-monospace, monospace';
const FONTES = `
@font-face { font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; src: url(/olho/fonts/instrument-serif-latin-400-normal.woff2) format('woff2'); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; font-weight: 400; src: url(/olho/fonts/instrument-serif-latin-400-italic.woff2) format('woff2'); }
@font-face { font-family: 'Geist Mono'; font-weight: 400; src: url(/olho/fonts/geist-mono-latin-400-normal.woff2) format('woff2'); }
.ic-cookies{display:none!important} html,body{margin:0;background:${FUNDO};overflow:hidden}`;

const limita = (x) => Math.min(1, Math.max(0, x));
const suave = (x) => 1 - Math.pow(1 - limita(x), 3); // desacelera no fim
const pulso = (t, marca, dur = 0.55) => (marca == null || t < marca ? 0 : Math.max(0, 1 - (t - marca) / dur));

// Zona segura do Reels (a interface do Instagram cobre o topo e o pé): a cena
// fica entre 300 e 1130 e a legenda entre 1180 e 1480.
const LEGENDA = { topo: 1180, altura: 300 };

function Legenda({ palavras, blocos, t }) {
  const agora = legendaNoTempo(blocos, palavras, t);
  const b = agora.bloco >= 0 ? blocos[agora.bloco] : null;
  // no silêncio (contador, rajada) a legenda some; a última fica até o fim
  const ultimo = agora.bloco === blocos.length - 1;
  if (!b || (!ultimo && t > palavras[b.ate].fim + 0.4)) return null;
  const entrada = limita((t - b.ini) / 0.12);
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: LEGENDA.topo, height: LEGENDA.altura, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ margin: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 86, lineHeight: 1.06, letterSpacing: '-0.01em', textShadow: '0 4px 28px rgba(7,4,13,.9)', opacity: entrada, transform: `translateY(${(1 - entrada) * 16}px)` }}>
        {palavras.slice(b.de, b.ate + 1).map((p, k) => {
          const i = b.de + k;
          const falada = i === agora.palavra;
          return (
            <span key={i} style={{ color: falada ? OURO : TEXTO, opacity: falada || i < agora.palavra ? 1 : 0.5, fontStyle: falada ? 'italic' : 'normal' }}>
              {p.texto}{k < b.ate - b.de ? ' ' : ''}
            </span>
          );
        })}
      </p>
    </div>
  );
}

// ── Carta ──────────────────────────────────────────────────────────────────

const CARTA = { w: 302, h: 530, gap: 24, topo: 340 };

function Estrela({ tamanho, cor = OURO, opacidade = 1 }) {
  // estrela de 8 pontas, a mesma do céu do site
  const r = tamanho / 2;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const raio = i % 2 ? r * 0.38 : i % 4 ? r * 0.62 : r;
    return `${(r + raio * Math.cos(a)).toFixed(1)},${(r + raio * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return <svg width={tamanho} height={tamanho} style={{ display: 'block', opacity: opacidade }}><polygon points={pts} fill={cor} /></svg>;
}

function Verso({ posicao, brilho }) {
  return (
    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 18, background: 'linear-gradient(160deg, #1a1029 0%, #0d0716 100%)', border: `2px solid rgba(242,199,123,${0.55 + 0.45 * brilho})`, boxShadow: `0 0 ${20 + 60 * brilho}px rgba(242,199,123,${0.12 + 0.5 * brilho}), inset 0 0 40px rgba(0,0,0,.5)`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(242,199,123,.35)', borderRadius: 10 }} />
      {/* constelação riscada no verso */}
      <svg width={CARTA.w} height={CARTA.h} style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
        <polyline points={`48,70 96,118 70,176 ${CARTA.w - 60},150 ${CARTA.w - 44},96`} fill="none" stroke={OURO} strokeWidth="1" />
        <polyline points={`52,${CARTA.h - 80} 110,${CARTA.h - 130} ${CARTA.w - 90},${CARTA.h - 96} ${CARTA.w - 50},${CARTA.h - 150}`} fill="none" stroke={OURO} strokeWidth="1" />
        {[[48, 70], [96, 118], [70, 176], [CARTA.w - 60, 150], [CARTA.w - 44, 96], [52, CARTA.h - 80], [110, CARTA.h - 130], [CARTA.w - 90, CARTA.h - 96], [CARTA.w - 50, CARTA.h - 150]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill={OURO} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Estrela tamanho={44} opacidade={0.9} />
        <div style={{ fontFamily: SERIF, fontSize: 210, lineHeight: 1, color: OURO, textShadow: `0 0 ${30 * brilho}px rgba(242,199,123,.8)` }}>{posicao}</div>
      </div>
    </div>
  );
}

function Frente({ carta }) {
  return (
    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 18, background: 'linear-gradient(170deg, #241634 0%, #120a1d 100%)', border: `2px solid ${OURO}`, boxShadow: '0 0 50px rgba(242,199,123,.35)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 18px 26px', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', inset: 12, border: '1px solid rgba(242,199,123,.4)', borderRadius: 10 }} />
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: '0.2em', color: OURO }}>{carta.romano}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Estrela tamanho={70} />
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 56, lineHeight: 1.02, color: TEXTO, textAlign: 'center' }}>{carta.nome}</div>
      <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: '0.12em', color: OURO, opacity: 0.85, textAlign: 'center', marginTop: 14, textTransform: 'uppercase', lineHeight: 1.4 }}>
        {(carta.palavras || []).join(' · ')}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 18, color: TEXTO, opacity: 0.6, marginTop: 14 }}>{carta.posicao}</div>
    </div>
  );
}

function CenaCarta({ cena, eventos, t }) {
  const { angulos, contador } = cenaCarta(eventos, t);
  const larguraTotal = 3 * CARTA.w + 2 * CARTA.gap;
  const esquerda = (REELS.largura - larguraTotal) / 2;
  const reveladas = angulos.filter((a) => a >= 90).length;
  const c = eventos.contador;
  const noSegundo = contador ? (c.fim - t) - (contador - 1) : 0; // 1 → 0 dentro de cada segundo
  const anel = 2 * Math.PI * 96;
  return (
    <>
      {cena.cartas.map((carta, k) => {
        const chegada = suave((t - 0.1 - 0.16 * k) / 0.5); // dadas uma a uma, de baixo
        const ang = angulos[k];
        const virando = ang > 0 && ang < 180;
        const meio = Math.sin((ang / 180) * Math.PI); // 0 → 1 → 0 durante o giro
        const apontada = pulso(t, eventos.apontar?.[k]);
        const contando = contador ? 0.35 + 0.25 * Math.sin(t * 9 + k) : 0; // as 3 piscam esperando a escolha
        const brilho = Math.max(apontada, contando);
        // a última revelada fica em destaque; as anteriores recuam um pouco
        const ativa = reveladas > 0 && k === reveladas - 1;
        const recua = reveladas > 0 && ang >= 180 && !ativa ? 1 : 0;
        const flutua = reveladas === 0 && !contador ? Math.sin(t * 1.7 + k * 1.4) * 7 : 0;
        const y = (1 - chegada) * 160 + flutua - meio * 26 - apontada * 18;
        const escala = (1 + meio * 0.06 + apontada * 0.05 + (ativa ? 0.04 : 0)) * (1 - recua * 0.06);
        return (
          <div key={carta.posicao} style={{ position: 'absolute', left: esquerda + k * (CARTA.w + CARTA.gap), top: CARTA.topo, width: CARTA.w, height: CARTA.h, perspective: 1800, opacity: chegada * (1 - recua * 0.35), transform: `translateY(${y.toFixed(2)}px) rotate(${((1 - chegada) * (k - 1) * 7).toFixed(2)}deg) scale(${escala.toFixed(4)})`, zIndex: virando || ativa ? 2 : 1 }}>
            <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ang}deg)` }}>
              <Verso posicao={carta.posicao} brilho={brilho} />
              <Frente carta={carta} />
            </div>
          </div>
        );
      })}
      {contador && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 920, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.3em', color: OURO, marginBottom: 14 }}>ESCOLHE A SUA</div>
          <div style={{ position: 'relative', width: 220, height: 220 }}>
            <svg width="220" height="220" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="110" cy="110" r="96" fill="rgba(7,4,13,.55)" stroke="rgba(242,199,123,.18)" strokeWidth="6" />
              <circle cx="110" cy="110" r="96" fill="none" stroke={OURO} strokeWidth="6" strokeLinecap="round" strokeDasharray={anel} strokeDashoffset={(anel * (1 - noSegundo)).toFixed(2)} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 150, color: TEXTO, transform: `scale(${(1 + 0.28 * limita((noSegundo - 0.8) / 0.2)).toFixed(3)})` }}>
              {contador}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Pausa ──────────────────────────────────────────────────────────────────

function CenaPausa({ cena, eventos, t }) {
  const i = cenaPausa(eventos, t);
  const r = eventos.rajada;
  const depois = t >= r.ini + r.passo * r.n;
  const fimAviso = r.ini - 0.15;
  const aviso = limita((t - (fimAviso - 1.2)) / 0.3); // o "❚❚" aparece com o "Pausa agora!"
  if (i >= 0) {
    const dentro = (t - r.ini - i * r.passo) / r.passo; // 0 → 1 em cada frase
    const flash = limita(1 - dentro / 0.18);
    return (
      <>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 360, height: 700, borderRadius: 28, border: `2px solid ${OURO}`, background: `rgba(26,16,41,${0.82 + 0.12 * flash})`, boxShadow: `0 0 ${40 + 60 * flash}px rgba(242,199,123,${0.2 + 0.3 * flash})` }}>
          <div style={{ position: 'absolute', top: 38, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 30, letterSpacing: '0.3em', color: OURO }}>❚❚ PAUSA AGORA</div>
          <div style={{ position: 'absolute', inset: '120px 56px 110px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: SERIF, fontSize: 84, lineHeight: 1.08, color: TEXTO, transform: `scale(${(1 + 0.05 * flash).toFixed(3)})` }}>
            {cena.mensagens[i]}
          </div>
          <div style={{ position: 'absolute', bottom: 40, left: 56, right: 56, display: 'flex', gap: 10 }}>
            {cena.mensagens.map((_, k) => (
              <div key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k <= i ? OURO : 'rgba(242,199,123,.2)' }} />
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 1090, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 26, letterSpacing: '0.2em', color: TEXTO, opacity: 0.7 }}>{i + 1} / {cena.mensagens.length}</div>
      </>
    );
  }
  if (depois) {
    // as 8, pequenas: quem não pausou a tempo volta e escolhe
    const entra = suave((t - (r.ini + r.passo * r.n)) / 0.5);
    return (
      <div style={{ position: 'absolute', left: 70, right: 70, top: 330, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, opacity: entra, transform: `translateY(${(1 - entra) * 30}px)` }}>
        {cena.mensagens.map((m, k) => (
          <div key={k} style={{ border: '1px solid rgba(242,199,123,.35)', borderRadius: 16, padding: '20px 22px', background: 'rgba(7,4,13,.55)', minHeight: 150, boxSizing: 'border-box' }}>
            <div style={{ fontFamily: MONO, fontSize: 20, color: OURO, letterSpacing: '0.2em', marginBottom: 8 }}>{String(k + 1).padStart(2, '0')}</div>
            <div style={{ fontFamily: SERIF, fontSize: 36, lineHeight: 1.1, color: TEXTO }}>{m}</div>
          </div>
        ))}
      </div>
    );
  }
  // antes da rajada: o ❚❚ grande, esperando
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
      <div style={{ display: 'flex', gap: 34, transform: `scale(${(0.9 + 0.1 * Math.sin(t * 4)).toFixed(3)})` }}>
        {[0, 1].map((k) => <div key={k} style={{ width: 70, height: 260, borderRadius: 16, background: OURO, opacity: 0.25 + 0.75 * aviso }} />)}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: '0.3em', color: OURO, opacity: 0.4 + 0.6 * aviso }}>PREPARA O DEDO</div>
    </div>
  );
}

// ── Número ─────────────────────────────────────────────────────────────────

function CenaNumero({ cena, eventos, t }) {
  const { passosVisiveis, listaVisivel, aceso } = cenaNumero(eventos, t);
  const { dia, numero, passos } = cena.exemplo;
  const linhas = [`dia ${dia}`, ...passos.map(([de, soma]) => `${String(de).split('').join(' + ')} = ${soma}`)];
  const saiExemplo = listaVisivel ? suave((t - eventos.lista) / 0.45) : 0;
  return (
    <>
      {saiExemplo < 1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: 1 - saiExemplo, transform: `translateY(${-saiExemplo * 60}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: '0.3em', color: OURO, opacity: passosVisiveis ? 1 : 0.5 }}>EXEMPLO</div>
          {linhas.map((l, k) => {
            const marca = eventos.exemplo[k];
            const entra = suave((t - marca) / 0.35);
            const final = k === linhas.length - 1;
            if (t < marca) return <div key={k} style={{ height: k ? 120 : 170 }} />;
            return (
              <div key={k} style={{ fontFamily: SERIF, fontSize: k ? 112 : 150, lineHeight: 1.05, color: TEXTO, opacity: entra, transform: `translateY(${(1 - entra) * 24}px)`, display: 'flex', alignItems: 'center', gap: 24 }}>
                <span style={{ fontStyle: k ? 'normal' : 'italic' }}>{l.replace(/ = \d+$/, '')}</span>
                {k > 0 && (
                  <>
                    <span style={{ color: OURO }}>=</span>
                    <span style={final ? { color: '#1a1020', background: OURO, borderRadius: 999, width: 140, height: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${50 * pulso(t, marca, 1.2) + 20}px rgba(242,199,123,.6)` } : { color: OURO }}>
                      {l.match(/= (\d+)$/)[1]}
                    </span>
                  </>
                )}
              </div>
            );
          })}
          {passos.length === 0 && <div style={{ fontFamily: SERIF, fontSize: 112, color: OURO }}>{numero}</div>}
        </div>
      )}
      {listaVisivel && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 330, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
          {cena.numeros.map((x, k) => {
            const entra = suave((t - eventos.lista - 0.05 * k) / 0.4);
            const marca = eventos.numeros[k];
            const falado = aceso === x.numero;
            const ja = t >= marca;
            const bate = pulso(t, marca, 0.6);
            return (
              <div key={x.numero} style={{ height: 248, borderRadius: 20, boxSizing: 'border-box', padding: '16px 14px', border: `2px solid ${falado ? OURO : 'rgba(242,199,123,.28)'}`, background: falado ? 'rgba(242,199,123,.14)' : 'rgba(7,4,13,.6)', boxShadow: falado ? `0 0 ${30 + 50 * bate}px rgba(242,199,123,.45)` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: entra * (ja || falado ? 1 : 0.55), transform: `scale(${(entra * (1 + 0.07 * bate)).toFixed(3)})` }}>
                <div style={{ fontFamily: SERIF, fontSize: 124, lineHeight: 1, color: falado ? OURO : TEXTO, fontStyle: falado ? 'italic' : 'normal' }}>{x.numero}</div>
                <div style={{ fontFamily: MONO, fontSize: 19, lineHeight: 1.35, letterSpacing: '0.04em', color: TEXTO, opacity: ja ? 0.9 : 0.5, textAlign: 'center', marginTop: 8 }}>{x.curta}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Frase do dia ───────────────────────────────────────────────────────────

/** Palavras faladas de um trecho, acendendo como na legenda. */
function Falado({ palavras, de, ate, t, tamanho, cor = TEXTO, italico = false }) {
  let atual = -1;
  for (let i = de; i < ate; i++) if (t >= palavras[i].ini) atual = i;
  // o dourado é só da palavra sendo dita: terminou o trecho, volta ao branco
  const falando = atual >= 0 && t <= palavras[atual].fim + 0.25 ? atual : -1;
  return (
    <p style={{ margin: 0, fontFamily: SERIF, fontSize: tamanho, lineHeight: 1.12, letterSpacing: '-0.01em', fontStyle: italico ? 'italic' : 'normal', textShadow: '0 4px 28px rgba(7,4,13,.85)' }}>
      {palavras.slice(de, ate).map((p, k) => {
        const i = de + k;
        return (
          <span key={i} style={{ color: i === falando ? OURO : cor, opacity: i <= atual ? 1 : 0.38 }}>
            {p.texto}{i < ate - 1 ? ' ' : ''}
          </span>
        );
      })}
    </p>
  );
}

function CenaFrase({ cena, eventos, palavras, t }) {
  const { credito, hoje, fecho } = cenaFrase(eventos, t);
  const nFrase = eventos.palavrasFrase;
  // palavras: a frase, o crédito falado, o "Hoje, …" e a chamada (nessa ordem)
  const iHoje = palavras.findIndex((p) => p.ini >= eventos.hoje - 0.001);
  const iFecho = palavras.findIndex((p) => p.ini >= eventos.fecho - 0.001);
  const tamanho = cena.frase.length <= 80 ? 92 : cena.frase.length <= 140 ? 80 : 68;
  const s = suave(hoje);
  return (
    <>
      {/* a citação: grande no meio; quando entra o "Pra hoje", sobe, encolhe e apaga um pouco */}
      <div style={{ position: 'absolute', left: 96, right: 120, top: 560 - s * 260, display: 'flex', flexDirection: 'column', transformOrigin: 'left top', transform: `scale(${(1 - 0.34 * s).toFixed(4)})`, opacity: 1 - 0.45 * s }}>
        <div style={{ fontFamily: SERIF, fontSize: 220, lineHeight: 0.6, height: 120, color: OURO }}>“</div>
        <Falado palavras={palavras} de={0} ate={nFrase} t={t} tamanho={tamanho} />
        <div style={{ width: `${Math.round(120 * credito)}px`, height: 2, background: OURO, marginTop: 52, marginBottom: 26 }} />
        <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: '0.06em', color: OURO, opacity: credito, transform: `translateY(${(1 - credito) * 14}px)` }}>{cena.credito}</div>
      </div>
      {/* pra hoje: texto nosso, com rótulo próprio, separado da citação */}
      {hoje > 0 && iHoje >= 0 && (
        <div style={{ position: 'absolute', left: 96, right: 120, top: 1010 - 40 * s, display: 'flex', flexDirection: 'column', opacity: s }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: '0.3em', color: OURO, marginBottom: 22 }}>PRA HOJE</div>
          <Falado palavras={palavras} de={iHoje} ate={iFecho >= 0 ? iFecho : palavras.length} t={t} tamanho={70} />
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: '0.14em', color: OURO, marginTop: 40, opacity: fecho, textTransform: 'uppercase' }}>Faz o seu mapa grátis · link na bio</div>
        </div>
      )}
    </>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

export default function ReelsInterativo({ ceu, dados: inicial, captura, dataRotulo }) {
  const [dados, setDados] = useState(inicial);
  const [t, setT] = useState(0);
  const [escala, setEscala] = useState(1);
  const [tocando, setTocando] = useState(false);
  const ceuRef = useRef(null);
  const audiosRef = useRef([]);
  const inicioRef = useRef(0);
  const prontoRef = useRef({ ceu: false, fontes: false });

  const palavras = useMemo(() => dados?.palavras || [], [dados]);
  const blocos = useMemo(() => blocosDaLegenda(palavras), [palavras]);
  const duracao = dados?.duracao || 1;

  const marcarPronto = useCallback(() => {
    if (prontoRef.current.ceu && prontoRef.current.fontes && palavras.length) window.__pronto = true;
  }, [palavras.length]);

  useEffect(() => {
    window.__carregar = (n) => new Promise((ok) => {
      flushSync(() => setDados(n));
      requestAnimationFrame(() => requestAnimationFrame(ok));
    });
    window.__quadro = (tempo) => new Promise((ok) => {
      flushSync(() => setT(tempo));
      requestAnimationFrame(() => requestAnimationFrame(ok));
    });
    const img = ceuRef.current;
    (img?.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { prontoRef.current.ceu = true; marcarPronto(); });
    Promise.all([
      document.fonts.load(`86px "Instrument Serif"`),
      document.fonts.load(`italic 86px "Instrument Serif"`),
      document.fonts.load(`22px "Geist Mono"`),
    ]).catch(() => {}).then(() => document.fonts.ready).then(() => { prontoRef.current.fontes = true; marcarPronto(); });
  }, [marcarPronto]);

  useEffect(() => { marcarPronto(); }, [marcarPronto]);

  // Assistir: relógio próprio; com som, cada trecho toca no seu segundo.
  useEffect(() => {
    if (captura || !palavras.length) return undefined;
    const ajustar = () => setEscala(Math.min(window.innerWidth / REELS.largura, window.innerHeight / REELS.altura, 1));
    ajustar();
    window.addEventListener('resize', ajustar);
    let raf;
    inicioRef.current = performance.now();
    const ciclo = duracao + 1.5;
    const tocados = new Set();
    const quadro = (agoraMs) => {
      const tempo = ((agoraMs - inicioRef.current) / 1000) % ciclo;
      if (tempo < 0.05) tocados.clear();
      if (tocando) {
        (dados?.vozes || []).forEach((v, k) => {
          const a = audiosRef.current[k];
          if (a && tempo >= v.inicio && !tocados.has(k)) {
            tocados.add(k);
            a.currentTime = Math.max(0, tempo - v.inicio);
            a.play().catch(() => {});
          }
        });
      }
      setT(tempo);
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', ajustar); };
  }, [captura, palavras.length, duracao, tocando, dados]);

  const tocar = () => {
    // o toque libera o som; o relógio volta pro 0 pra voz sair sincronizada
    audiosRef.current.forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
    inicioRef.current = performance.now();
    setTocando(true);
  };

  const cheia = { position: 'absolute', top: 0, left: 0, width: REELS.largura, height: REELS.altura };
  const formato = dados?.formato;
  return (
    <div style={{ position: 'fixed', inset: 0, background: FUNDO, overflow: 'hidden', display: 'flex', alignItems: captura ? 'flex-start' : 'center', justifyContent: captura ? 'flex-start' : 'center' }}>
      <div style={{ position: 'relative', width: REELS.largura, height: REELS.altura, flex: '0 0 auto', overflow: 'hidden', transform: captura ? 'none' : `scale(${escala})`, transformOrigin: 'center center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={ceuRef} src={ceu} alt="" style={{ ...cheia, objectFit: 'cover', transformOrigin: '50% 50%', transform: `scale(${escalaCeuNarrado(t, duracao)})` }} />
        <div style={{ ...cheia, background: 'linear-gradient(180deg, rgba(7,4,13,.6) 0%, rgba(7,4,13,.2) 16%, rgba(7,4,13,.35) 55%, rgba(7,4,13,.8) 100%)' }} />
        <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 24, letterSpacing: '0.32em', color: TEXTO, opacity: 0.85 }}>INTUITIVE CONCEPT</div>
        {formato && (
          <div style={{ position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 22, letterSpacing: '0.28em', color: OURO }}>
            {NOME_FORMATO[formato].toUpperCase()}{dataRotulo ? ` · ${dataRotulo}` : ''}
          </div>
        )}
        {formato === 'carta' && <CenaCarta cena={dados.cena} eventos={dados.eventos} t={t} />}
        {formato === 'pausa' && <CenaPausa cena={dados.cena} eventos={dados.eventos} t={t} />}
        {formato === 'numero' && <CenaNumero cena={dados.cena} eventos={dados.eventos} t={t} />}
        {formato === 'frase' && palavras.length > 0 && <CenaFrase cena={dados.cena} eventos={dados.eventos} palavras={palavras} t={t} />}
        {/* na frase do dia o próprio texto acende com a voz: sem legenda embaixo */}
        {palavras.length > 0 && formato !== 'frase' && <Legenda palavras={palavras} blocos={blocos} t={t} />}
      </div>
      {!captura && dados?.vozes?.length > 0 && (
        <>
          {dados.vozes.map((v, k) => <audio key={v.id} ref={(el) => { audiosRef.current[k] = el; }} src={v.audio} preload="auto" />)}
          {!tocando && (
            <button type="button" onClick={tocar} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '14px 24px', borderRadius: 999, border: 0, background: OURO, color: '#1a1020', fontFamily: 'monospace', letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Tocar com som
            </button>
          )}
        </>
      )}
      <style>{FONTES}</style>
    </div>
  );
}
