'use client';

// "Você também é…" — faixa no fim dos resultados ligando as ferramentas grátis.
// Calcula na hora (no browser) o signo, o número, o BaZi, o anjo e o Kin da
// pessoa mostrada e leva pra página de cada um. As páginas de destino abrem já
// com o resultado porque leem o perfil salvo neste aparelho (lib/perfilLocal.js).
// Sem dados pessoais na URL.

import { useMemo } from 'react';
import Link from 'next/link';
import { calcularSigno, calcularNumeroVida } from '@/lib/calculos';
import { calcularBazi, TRONCOS, RAMOS, ELEMENTOS } from '@/lib/bazi';
import { calcularAnjos, dadosDoAnjo } from '@/lib/anjos';
import { TEXTO_ANJO } from '@/lib/anjosTextos';
import { calcularKin } from '@/lib/kin';
import { TEXTO_SELO } from '@/lib/kinTextos';

const SLUG_SIGNO = {
  'Áries': 'aries', 'Touro': 'touro', 'Gêmeos': 'gemeos', 'Câncer': 'cancer', 'Leão': 'leao', 'Virgem': 'virgem',
  'Libra': 'libra', 'Escorpião': 'escorpiao', 'Sagitário': 'sagitario', 'Capricórnio': 'capricornio', 'Aquário': 'aquario', 'Peixes': 'peixes',
};

function evento(destino, origem) {
  try { window.gtag?.('event', 'voce_tambem_click', { event_category: 'integracao', destino, origem }); } catch {}
}

/** Os cartões de uma pessoa. Exportado pros testes visuais / outras telas. */
export function cartoesDaPessoa({ dataNascimento, hora = null, cidade = null }) {
  const [, m, d] = dataNascimento.split('-').map(Number);
  const tz = cidade?.tz || 'America/Sao_Paulo';
  const out = [];

  const signo = calcularSigno(d, m);
  out.push({ chave: 'signos', sistema: 'Signo solar', valor: signo, sub: 'O que move você', href: `/signos/${SLUG_SIGNO[signo]}` });

  const numero = calcularNumeroVida(dataNascimento);
  out.push({ chave: 'numerologia', sistema: 'Número de vida', valor: String(numero), sub: 'Sua missão em números', href: `/numerologia/numero-${numero}` });

  try {
    const mapa = calcularBazi({ data: dataNascimento, hora, tz, lon: typeof cidade?.lon === 'number' ? cidade.lon : null });
    const animal = RAMOS[mapa.ano.ramo].animal;
    const elemAno = ELEMENTOS[TRONCOS[mapa.ano.tronco].elemento].nome;
    const dm = TRONCOS[mapa.diaMestre];
    out.push({
      chave: 'astrologia-chinesa', sistema: 'Astrologia chinesa', valor: `${animal} de ${elemAno}`,
      sub: `Por dentro, você é ${ELEMENTOS[dm.elemento].nome} ${dm.yang ? 'Yang' : 'Yin'}`, href: '/astrologia-chinesa',
    });
  } catch {}

  try {
    const a = calcularAnjos({ data: dataNascimento, hora, tz });
    const g = dadosDoAnjo(a.guardiao);
    out.push({ chave: 'anjo', sistema: 'Anjo da guarda', valor: g.nome, sub: TEXTO_ANJO[g.n].dom, href: '/anjo-da-guarda' });
  } catch {}

  try {
    const k = calcularKin({ data: dataNascimento, hora });
    out.push({ chave: 'kin-maia', sistema: `Kin Maia ${k.kin}`, valor: k.nome, sub: TEXTO_SELO[k.selo.codigo].palavras.join(' · '), href: '/kin-maia' });
  } catch {}

  out.push({ chave: 'ceu', sistema: 'Céu do nascimento', valor: 'O seu céu', sub: 'As estrelas exatas da sua hora', href: '/ceu' });
  return out;
}

/**
 * @param {{ dados: { nome?: string, dataNascimento: string, hora?: string|null, cidade?: object|null },
 *   atual?: string, comSeuDia?: boolean }} props
 *   `atual` = chave da página atual (não aparece na lista).
 */
export default function VoceTambem({ dados, atual, comSeuDia = true }) {
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
    <section className="vt" aria-labelledby="vt-titulo">
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
      <style>{CSS_VT}</style>
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
