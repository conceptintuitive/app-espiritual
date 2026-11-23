'use client';

// Aba "Mapa" do Seu Dia: todos os sistemas da pessoa juntos, a síntese
// cruzada (lib/mapaSintese.js) e um card 1080x1920 pro story, desenhado no
// próprio navegador (canvas) — sem servidor, sem dados na URL.
// Grátis pra todo mundo: é o que a pessoa compartilha.

import { useMemo, useState } from 'react';
import { sistemasDaPessoa, sinteseDoMapa, TEMAS } from '@/lib/mapaSintese';
import ma from './minhaArea.module.css';

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'seu_dia', ...params }); } catch {}
}

const listaHumana = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

export default function AbaMapa({ perfil }) {
  const sistemas = useMemo(() => sistemasDaPessoa({
    dataNascimento: perfil.dataNascimento,
    hora: perfil.hora || null,
    cidade: perfil.cidade || null,
  }), [perfil.dataNascimento, perfil.hora, perfil.cidade]);
  const s = useMemo(() => sinteseDoMapa(sistemas), [sistemas]);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState('');
  const nome = (perfil.nome || '').split(' ')[0];

  async function compartilharCard() {
    setGerando(true);
    setAviso('');
    evento('sd_mapa_card');
    try {
      const blob = await gerarCardMapa({ nome, sistemas, sintese: s });
      const arquivo = new File([blob], 'meu-mapa-intuitive.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Meu mapa', text: 'Meu mapa no Intuitive Concept ✦ intuitiveconcept.com.br/seu-dia' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meu-mapa-intuitive.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setAviso('Imagem baixada. É só postar no story.');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setAviso('Não deu pra gerar a imagem agora. Tente de novo.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className={ma.duas}>
      <div className={ma.coluna}>
        <p className={ma.intro}>
          {nome ? `${nome}, ` : ''}{sistemas.length - 1} sistemas lidos juntos. Onde eles concordam é o que mais define você.
        </p>

        <section className={ma.secaoEd} aria-labelledby="mp-repete">
          <span id="mp-repete" className={ma.eyebrow}>O que seu mapa repete</span>
          {s.repete.length > 0 ? s.repete.map((r) => (
            <div key={r.tema} className={ma.temaGrande}>
              <h2 className={ma.temaNome}>{r.nome}</h2>
              <span className={ma.temaQuem}>{r.sistemas.length} sistemas dizem isso: {listaHumana(r.sistemas)}</span>
              <p className={ma.temaFrase}>{r.frase}</p>
            </div>
          )) : (
            <>
              <p className={ma.temaFrase}>Seu mapa é plural: cada sistema puxa pra um lado, e isso também é uma assinatura. Seus temas mais fortes:</p>
              {s.ranking.slice(0, 3).map((r) => (
                <div key={r.tema} className={ma.temaGrande}>
                  <h2 className={ma.temaNome}>{TEMAS[r.tema].nome}</h2>
                  <p className={ma.temaFrase}>{TEMAS[r.tema].frase}</p>
                </div>
              ))}
            </>
          )}
        </section>

        {s.tensao && (
          <section className={ma.secaoEd} aria-labelledby="mp-tensao">
            <span id="mp-tensao" className={ma.eyebrow}>Onde você se divide</span>
            <div className={ma.temaGrande}>
              <h2 className={ma.temaNome}>{s.tensao.nomeA} <span>×</span> {s.tensao.nomeB}</h2>
              <span className={ma.temaQuem}>
                {s.tensao.nomeA}: {listaHumana(s.tensao.sistemasA)} · {s.tensao.nomeB}: {listaHumana(s.tensao.sistemasB)}
              </span>
              <p className={ma.temaFrase}>{s.tensao.texto}</p>
            </div>
          </section>
        )}
      </div>

      <div className={ma.coluna}>
        <section className={ma.secaoEd} aria-labelledby="mp-sistemas">
          <h2 id="mp-sistemas" className={ma.h2Ed}>Seus sistemas</h2>
          <div>
            {sistemas.map((c) => (
              <a key={c.chave} href={c.href} className={ma.mapaLinha} onClick={() => evento('sd_mapa_sistema', { destino: c.chave })}>
                <span className={ma.mapaRotulo}>{c.sistema}</span>
                <span className={ma.mapaValor}>
                  {c.valor}
                  <span className={ma.sistemasSub} style={{ display: 'block' }}>{c.sub}</span>
                </span>
                <span className={ma.seta} aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

        <section className={ma.secaoEd} aria-labelledby="mp-story">
          <span id="mp-story" className={ma.eyebrow}>Pro seu story</span>
          <p>Um card com o seu mapa inteiro, no tamanho do story.</p>
          <div>
            <button type="button" className={ma.btn} onClick={compartilharCard} disabled={gerando}>
              {gerando ? 'Gerando…' : 'Gerar meu card'}
            </button>
          </div>
          {aviso && <p>{aviso}</p>}
        </section>
      </div>
    </div>
  );
}

// ── Card 1080x1920 ───────────────────────────────────────────────────────────

function quebrar(ctx, texto, largura) {
  const palavras = texto.split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > largura && atual) { linhas.push(atual); atual = p; } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

async function gerarCardMapa({ nome, sistemas, sintese }) {
  try { await document.fonts?.ready; } catch {}
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const fundo = ctx.createLinearGradient(0, 0, 0, H);
  fundo.addColorStop(0, '#1a0b33');
  fundo.addColorStop(0.55, '#0d0420');
  fundo.addColorStop(1, '#070112');
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, W, H);
  const brilho = ctx.createRadialGradient(W / 2, 260, 0, W / 2, 260, 700);
  brilho.addColorStop(0, 'rgba(245,212,138,0.20)');
  brilho.addColorStop(1, 'rgba(245,212,138,0)');
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, H);
  // estrelinhas fixas (pseudoaleatórias, sempre iguais)
  let semente = 7;
  const rnd = () => ((semente = (semente * 9301 + 49297) % 233280) / 233280);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 2.2 + 0.4, 0, Math.PI * 2); ctx.fill(); }

  const serif = "'Cormorant Garamond', Georgia, serif";
  const cinzel = "'Cinzel', Georgia, serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5d48a';
  ctx.font = `600 34px ${cinzel}`;
  ctx.fillText('M E U   M A P A', W / 2, 190);
  ctx.fillStyle = '#faf5ff';
  ctx.font = `700 96px ${cinzel}`;
  ctx.fillText(nome || 'Meu mapa', W / 2, 310);

  // temas que se repetem
  const temas = sintese.repete.length ? sintese.repete.map((r) => r.nome) : sintese.ranking.slice(0, 2).map((r) => TEMAS[r.tema].nome);
  ctx.fillStyle = '#f5d48a';
  ctx.font = `italic 600 64px ${serif}`;
  ctx.fillText(temas.join(' · '), W / 2, 430);

  // sistemas
  let y = 560;
  const lista = sistemas.filter((x) => x.chave !== 'ceu');
  for (const sis of lista) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(216,180,254,0.28)';
    ctx.lineWidth = 2;
    const altura = 150;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(90, y, W - 180, altura, 28) : ctx.rect(90, y, W - 180, altura);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f5d48a';
    ctx.font = `600 26px ${cinzel}`;
    ctx.fillText(sis.sistema.toUpperCase(), W / 2, y + 48);
    ctx.fillStyle = '#faf5ff';
    ctx.font = `700 50px ${cinzel}`;
    let valor = sis.valor;
    while (ctx.measureText(valor).width > W - 240 && valor.length > 4) valor = `${valor.slice(0, -2)}…`;
    ctx.fillText(valor, W / 2, y + 112);
    y += altura + 22;
  }

  // tensão (curta) ou frase do tema
  ctx.fillStyle = 'rgba(233,213,255,0.85)';
  ctx.font = `500 40px ${serif}`;
  const t1 = sintese.tensao ? sintese.tensao.texto.split('. ')[0] : '';
  const frase = sintese.tensao
    ? `${sintese.tensao.nomeA} × ${sintese.tensao.nomeB}: ${t1.charAt(0).toLowerCase()}${t1.slice(1)}.`
    : (sintese.repete[0]?.frase || '');
  const linhas = quebrar(ctx, frase, W - 220).slice(0, 4);
  y = Math.max(y + 40, 1540);
  for (const l of linhas) { ctx.fillText(l, W / 2, y); y += 52; }

  ctx.fillStyle = '#f5d48a';
  ctx.font = `600 34px ${cinzel}`;
  ctx.fillText('intuitiveconcept.com.br/seu-dia', W / 2, H - 110);

  return await new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
}
