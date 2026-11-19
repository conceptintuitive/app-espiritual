'use client';

// Aba "Mapa" do Seu Dia: todos os sistemas da pessoa juntos, a síntese
// cruzada (lib/mapaSintese.js) e um card 1080x1920 pro story, desenhado no
// próprio navegador (canvas) — sem servidor, sem dados na URL.
// Grátis pra todo mundo: é o que a pessoa compartilha.

import { useMemo, useState } from 'react';
import { sistemasDaPessoa, sinteseDoMapa, TEMAS } from '@/lib/mapaSintese';

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
    <>
      <header className="sd-cabecalho">
        <span className="sd-eyebrow">MEU MAPA</span>
        <h1>{nome ? `${nome}, este é você` : 'Este é você'}</h1>
        <p className="sd-mudo">{sistemas.length - 1} sistemas lidos juntos. Onde eles concordam é o que mais define você.</p>
      </header>

      <section className="sd-card mp-repete">
        <span className="sd-eyebrow">O QUE SEU MAPA REPETE</span>
        {s.repete.length > 0 ? s.repete.map((r) => (
          <div key={r.tema} className="mp-tema">
            <h2>{r.nome}</h2>
            <p className="mp-quem">{r.sistemas.length} sistemas dizem isso: {listaHumana(r.sistemas)}.</p>
            <p>{r.frase}</p>
          </div>
        )) : (
          <>
            <p>Seu mapa é plural: cada sistema puxa pra um lado, e isso também é uma assinatura. Seus temas mais fortes:</p>
            <ul className="sd-lista-simples">
              {s.ranking.slice(0, 3).map((r) => <li key={r.tema}><strong>{TEMAS[r.tema].nome}</strong> — {TEMAS[r.tema].frase}</li>)}
            </ul>
          </>
        )}
      </section>

      {s.tensao && (
        <section className="sd-card">
          <span className="sd-eyebrow">ONDE VOCÊ SE DIVIDE</span>
          <h2 className="mp-tensao">{s.tensao.nomeA} <span>×</span> {s.tensao.nomeB}</h2>
          <p>{s.tensao.texto}</p>
          <p className="sd-mudo">
            {s.tensao.nomeA}: {listaHumana(s.tensao.sistemasA)}. {s.tensao.nomeB}: {listaHumana(s.tensao.sistemasB)}.
          </p>
        </section>
      )}

      <h2 className="sd-secao">Seus sistemas</h2>
      <div className="mp-grade">
        {sistemas.map((c) => (
          <a key={c.chave} href={c.href} className="mp-sis" onClick={() => evento('sd_mapa_sistema', { destino: c.chave })}>
            <span className="mp-sis-nome">{c.sistema}</span>
            <strong>{c.valor}</strong>
            <span className="mp-sis-sub">{c.sub}</span>
            {c.temas.length > 0 && <span className="mp-sis-temas">{c.temas.map((t) => TEMAS[t].nome).join(' · ')}</span>}
          </a>
        ))}
      </div>

      <section className="sd-card mp-story">
        <span className="sd-eyebrow">PRO SEU STORY</span>
        <p>Um card com o seu mapa inteiro, no tamanho do story.</p>
        <button type="button" className="sd-btn" onClick={compartilharCard} disabled={gerando}>
          {gerando ? 'Gerando…' : 'Gerar meu card ✦'}
        </button>
        {aviso && <p className="sd-mudo">{aviso}</p>}
      </section>

      <style>{CSS_MAPA}</style>
    </>
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

const CSS_MAPA = `
  .mp-repete { gap: 14px; }
  .mp-tema h2 { margin: 2px 0 2px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 30px; color: #f5d48a; }
  .mp-tema + .mp-tema { border-top: 1px solid #2e1f4a; padding-top: 14px; }
  .mp-quem { font-size: 16px !important; color: #cdbbe8; margin-bottom: 6px !important; }
  .mp-tensao { font-family: 'Cinzel', serif; font-weight: 700; font-size: 24px; margin: 0; }
  .mp-tensao span { color: #f5a524; }
  .mp-grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .mp-sis { display: flex; flex-direction: column; gap: 3px; padding: 14px 12px; border-radius: 16px; border: 1px solid #2e1f4a; background: #150a28; color: #faf5ff; text-decoration: none; }
  .mp-sis:hover { border-color: #f5a524; }
  .mp-sis-nome { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #f5a524; }
  .mp-sis strong { font-family: 'Cinzel', serif; font-size: 16px; line-height: 1.25; }
  .mp-sis-sub { font-size: 15px; color: #cdbbe8; line-height: 1.3; }
  .mp-sis-temas { font-size: 13px; color: #f5d48a; margin-top: 4px; }
  .mp-story { align-items: stretch; text-align: center; }
`;
