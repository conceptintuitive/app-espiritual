'use client';

// "Você também é…" — faixa no fim dos resultados ligando as ferramentas grátis.
// Calcula na hora (no browser) o signo, o número, o BaZi, o anjo e o Kin da
// pessoa mostrada e leva pra página de cada um. As páginas de destino abrem já
// com o resultado porque leem o perfil salvo neste aparelho (lib/perfilLocal.js).
// Sem dados pessoais na URL.

import { useMemo } from 'react';
import Link from 'next/link';
import { sistemasDaPessoa } from '@/lib/mapaSintese';

function evento(destino, origem) {
  try { window.gtag?.('event', 'voce_tambem_click', { event_category: 'integracao', destino, origem }); } catch {}
}

// O anjo da mente fica de fora da faixa (aparece na página do anjo e no Meu Mapa).
const cartoesDaPessoa = (dados) => sistemasDaPessoa(dados).filter((c) => c.chave !== 'anjo-mente');

/**
 * @param {{ dados: { nome?: string, dataNascimento: string, hora?: string|null, cidade?: object|null },
 *   atual?: string, comSeuDia?: boolean, visual?: 'classico' | 'ma' }} props
 *   `atual` = chave da página atual (não aparece na lista).
 *   `visual="ma"` = linhas editoriais no visual da Minha Área (/resultado);
 *   o padrão continua o de cartões das ferramentas grátis.
 */
export default function VoceTambem({ dados, atual, comSeuDia = true, visual = 'classico' }) {
  const data = dados?.dataNascimento;
  const hora = dados?.hora || null;
  const tz = dados?.cidade?.tz;
  const lon = dados?.cidade?.lon;
  const cartoes = useMemo(() => {
    if (!data) return [];
    const cidade = tz ? { tz, lon } : null;
    try { return cartoesDaPessoa({ dataNascimento: data, hora, cidade }).filter((c) => c.chave !== atual); } catch { return []; }
  }, [data, hora, tz, lon, atual]);
  if (!cartoes.length) return null;

  const quem = dados.nome ? dados.nome.split(' ')[0] : null;

  return (
    <section className={visual === 'ma' ? 'vt vt-ma' : 'vt'} aria-labelledby="vt-titulo">
      <h2 id="vt-titulo" className="vt-titulo">{quem ? `${quem}, você também é…` : 'Você também é…'}</h2>
      <p className="vt-sub">As outras camadas do seu mapa, já calculadas. Toque pra ver cada uma por inteiro.</p>
      <div className="vt-grade">
        {cartoes.map((c) => (
          <Link key={c.chave} href={c.href} className="vt-card" onClick={() => evento(c.chave, atual)}>
            <span className="vt-sistema">{c.sistema}</span>
            <strong className="vt-valor">{c.valor}</strong>
            <span className="vt-linha">{c.sub}</span>
            <span className="vt-seta" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
      {comSeuDia && atual !== 'seu-dia' && (
        <Link href="/seu-dia" className="vt-seudia" onClick={() => evento('seu-dia', atual)}>
          <span>
            <strong>Tudo isso junto, todo dia.</strong> O Seu Dia cruza essas camadas com o dia de hoje.
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      <style>{visual === 'ma' ? CSS_VT + CSS_VT_MA : CSS_VT}</style>
    </section>
  );
}

const CSS_VT = `
  .vt { max-width: 760px; margin: 44px auto 0; padding: 0 20px; box-sizing: border-box; font-family: 'Cormorant Garamond', Georgia, serif; color: #faf5ff; }
  .vt-titulo { font-family: 'Cinzel', serif; font-size: clamp(20px, 4.5vw, 26px); margin: 0 0 4px; text-wrap: balance; }
  .vt-sub { font-size: 17px; color: rgba(233,213,255,0.72); margin: 0 0 14px; }
  .vt-grade { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  @media (min-width: 640px) { .vt-grade { grid-template-columns: repeat(3, 1fr); } }
  .vt-card { position: relative; display: flex; flex-direction: column; gap: 3px; padding: 14px 14px 30px; border-radius: 16px; text-decoration: none; color: #faf5ff;
    border: 1px solid rgba(216,180,254,0.22); background: linear-gradient(160deg, rgba(139,92,246,0.10), rgba(236,72,153,0.05) 70%, rgba(10,1,24,0.3)); }
  .vt-card:hover { border-color: #f5d48a; }
  .vt-sistema { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #f5d48a; }
  .vt-valor { font-family: 'Cinzel', serif; font-size: 17px; line-height: 1.25; }
  .vt-linha { font-size: 15px; line-height: 1.35; color: rgba(233,213,255,0.75); }
  .vt-seta { position: absolute; right: 12px; bottom: 8px; color: #f5d48a; font-size: 16px; }
  .vt-seudia { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; padding: 14px 16px; border-radius: 16px; text-decoration: none; color: #faf5ff; font-size: 17px; line-height: 1.4;
    border: 1px solid rgba(245,212,138,0.5); background: rgba(245,212,138,0.07); }
  .vt-seudia strong { color: #f5d48a; font-weight: 600; }
`;

// Visual da Minha Área (/resultado): lista editorial com linhas douradas, sem
// cartões. Serve dentro de um container que já tem as fontes (Instrument
// Serif, Geist, Geist Mono).
const CSS_VT_MA = `
  .vt-ma { max-width: none; margin: 0; padding: 48px 0; border-top: 1px solid rgba(242,199,123,.16); font-family: var(--font-geist-sans), 'Geist', system-ui, sans-serif; font-weight: 300; color: #f3e9da; }
  .vt-ma .vt-titulo { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 38px; line-height: 1.04; margin: 0 0 8px; }
  .vt-ma .vt-sub { font-size: 16px; line-height: 1.6; color: #b9a9c9; margin: 0 0 20px; }
  .vt-ma .vt-grade { grid-template-columns: 1fr; gap: 0; border-bottom: 1px solid rgba(242,199,123,.16); }
  .vt-ma .vt-card { display: grid; grid-template-columns: 1fr auto; grid-template-areas: 'sis seta' 'val seta' 'lin seta'; gap: 2px 16px; padding: 16px 0; border: 0; border-top: 1px solid rgba(242,199,123,.16); border-radius: 0; background: none; color: #f3e9da; }
  .vt-ma .vt-card:hover .vt-valor { color: #ffdca0; }
  .vt-ma .vt-sistema { grid-area: sis; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 10px; letter-spacing: .2em; color: #b9a9c9; }
  .vt-ma .vt-valor { grid-area: val; font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 24px; line-height: 1.15; }
  .vt-ma .vt-linha { grid-area: lin; font-size: 14px; color: #d9cbb8; }
  .vt-ma .vt-seta { grid-area: seta; position: static; align-self: center; color: #f2c77b; }
  .vt-ma .vt-seudia { margin-top: 18px; border-radius: 14px; border-color: rgba(242,199,123,.35); background: rgba(242,199,123,.04); color: #f3e9da; font-size: 15px; }
  .vt-ma .vt-seudia strong { color: #ffdca0; font-weight: 500; }
  @media (min-width: 700px) {
    .vt-ma { padding: 72px 0; }
    .vt-ma .vt-titulo { font-size: 52px; }
    .vt-ma .vt-grade { grid-template-columns: 1fr 1fr; column-gap: 56px; }
  }
`;
