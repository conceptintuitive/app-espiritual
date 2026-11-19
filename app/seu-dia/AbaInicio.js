'use client';

// Início da Minha Área (/seu-dia): a capa do mapa, o dia em uma linha, as
// leituras pagas do e-mail logado (/api/seu-dia/produtos), a assinatura e as
// ferramentas grátis já calculadas. Usa as classes sd-* do SeuDiaClient.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { sistemasDaPessoa, sinteseDoMapa, TEMAS } from '@/lib/mapaSintese';
import { PRECO_ASSINATURA_MENSAL } from '@/lib/preco';

const TOM = {
  fluxo: { rotulo: 'Dia a favor', classe: 'sd-tom-fluxo' },
  misto: { rotulo: 'Dia misto', classe: 'sd-tom-misto' },
  tensao: { rotulo: 'Dia de atenção', classe: 'sd-tom-tensao' },
};

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'minha_area', ...params }); } catch {}
}

const GRATIS_EXTRA = [
  { chave: 'hexagrama', sistema: 'I Ching', valor: 'Hexagrama do Dia', sub: 'O conselho de hoje, igual pra todos', href: '/hexagrama-do-dia' },
  { chave: 'compatibilidade', sistema: 'Compatibilidade', valor: 'Vocês combinam?', sub: 'Signos e astrologia chinesa', href: '/compatibilidade' },
  { chave: 'oraculo', sistema: 'Oráculo', valor: 'Pergunte o que quiser', sub: 'Respostas a partir do seu mapa', href: '/oraculo' },
];

export default function AbaInicio({ perfil, leitura, onIr }) {
  const nome = (perfil.nome || '').split(' ')[0];
  const sistemas = useMemo(() => sistemasDaPessoa({
    dataNascimento: perfil.dataNascimento,
    hora: perfil.hora || null,
    cidade: perfil.cidade || null,
  }), [perfil.dataNascimento, perfil.hora, perfil.cidade]);
  const sintese = useMemo(() => sinteseDoMapa(sistemas), [sistemas]);
  const temas = sintese.repete.length ? sintese.repete.map((r) => r.nome) : sintese.ranking.slice(0, 2).map((r) => TEMAS[r.tema].nome);
  const chips = sistemas.filter((x) => ['signos', 'numerologia', 'anjo', 'kin-maia'].includes(x.chave))
    .map((x) => (x.chave === 'kin-maia' ? `Kin ${x.sistema.replace(/\D/g, '')}` : x.chave === 'numerologia' ? `Número ${x.valor}` : x.valor));

  const [produtos, setProdutos] = useState(null); // null = carregando
  useEffect(() => {
    let vivo = true;
    fetch('/api/seu-dia/produtos', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { pessoas: [] }))
      .then((j) => { if (vivo) setProdutos(j.pessoas || []); })
      .catch(() => { if (vivo) setProdutos([]); });
    return () => { vivo = false; };
  }, []);

  const tom = TOM[leitura.tom];

  return (
    <>
      <section className="ma-capa" aria-label="Seu mapa">
        <span className="sd-eyebrow">MINHA ÁREA</span>
        <h1>{nome || 'Você'}</h1>
        <p className="ma-temas">{temas.join(' · ')}</p>
        <p className="ma-chips">{chips.join('  ·  ')}</p>
        {sintese.tensao && <p className="ma-tensao">{sintese.tensao.nomeA} × {sintese.tensao.nomeB}</p>}
        <button type="button" className="sd-btn-sec" onClick={() => onIr('mapa')}>Ver meu mapa completo</button>
      </section>

      <button type="button" className="sd-card ma-hoje" onClick={() => onIr('hoje')}>
        <span className="ma-linha">
          <span className="sd-eyebrow">HOJE · {leitura.temaNome.toUpperCase()}</span>
          <span className={`sd-tag ${tom.classe}`}>{tom.rotulo}</span>
        </span>
        <strong>{leitura.titulo}</strong>
        <span className="ma-sub">{leitura.frase}</span>
        <span className="ma-ir">Ver meu dia →</span>
      </button>

      <h2 className="sd-secao">Minhas leituras</h2>
      {produtos === null && <div className="sd-card ma-carregando">Carregando suas leituras…</div>}
      {produtos && produtos.length === 0 && (
        <div className="sd-card">
          <p>Você ainda não tem leituras no seu e-mail. O Manual começa por uma prévia grátis, já com os seus dados.</p>
          <Link className="sd-btn sd-btn-link" href="/" onClick={() => evento('ma_fazer_quiz')}>Ver minha prévia grátis</Link>
        </div>
      )}
      {produtos && produtos.map((p) => (
        <section key={p.id} className="sd-card ma-pessoa">
          <div className="ma-linha">
            <h3>{p.nome}</h3>
            <span className="ma-data">{dataBR(p.dataNascimento)}</span>
          </div>
          {p.presenteDe && <p className="sd-mudo">Presente de {p.presenteDe} ✦</p>}
          <ul className="ma-itens">
            {p.itens.map((it) => (
              <li key={it.chave}>
                <a href={it.href} className={`ma-item ma-${it.estado}`} onClick={() => evento('ma_leitura', { item: it.chave, estado: it.estado })}>
                  <span className="ma-icone" aria-hidden="true">{it.estado === 'aberto' ? '✓' : it.estado === 'travado' ? '🔒' : '◐'}</span>
                  <span className="ma-item-txt">
                    <strong>{it.titulo}</strong>
                    <span>{it.rotulo}</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {perfil.assinatura ? (
        <div className="sd-card ma-assin">
          <span className="sd-eyebrow">INTUITIVE COMPLETO</span>
          <p>
            Plano {perfil.assinatura.plano === 'anual' ? 'anual' : 'mensal'} ativo
            {perfil.assinatura.acessoAte ? ` até ${dataBR(perfil.assinatura.acessoAte)}` : ''}. Tudo destravado.
          </p>
        </div>
      ) : (
        <a className="sd-card ma-assin ma-assin-cta" href="/assinar" onClick={() => evento('ma_assinar')}>
          <span className="sd-eyebrow">INTUITIVE COMPLETO</span>
          <strong>Destrave tudo por {brl(PRECO_ASSINATURA_MENSAL)}/mês</strong>
          <span className="ma-sub">Seu Dia completo, Previsão do Ano, Human Design, Compatibilidade e Oráculo ilimitado.</span>
          <span className="ma-ir">Conhecer →</span>
        </a>
      )}

      <h2 className="sd-secao">Grátis, já calculado pra você</h2>
      <div className="mp-grade">
        {[...sistemas.filter((x) => x.chave !== 'anjo-mente'), ...GRATIS_EXTRA].map((c) => (
          <a key={c.chave} href={c.href} className="mp-sis" onClick={() => evento('ma_gratis', { destino: c.chave })}>
            <span className="mp-sis-nome">{c.sistema}</span>
            <strong>{c.valor}</strong>
            <span className="mp-sis-sub">{c.sub}</span>
          </a>
        ))}
      </div>

      <style>{CSS_INICIO}</style>
    </>
  );
}

const CSS_INICIO = `
  .ma-capa { position: relative; overflow: hidden; text-align: center; padding: 30px 18px 22px; border-radius: 22px; border: 1px solid #4a2f6e;
    background: radial-gradient(ellipse at 50% 0%, rgba(245,212,138,0.22), transparent 60%), linear-gradient(180deg, #1a0b33, #0d0420);
    display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ma-capa h1 { margin: 4px 0 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 40px; line-height: 1.1; }
  .ma-temas { margin: 0; font-style: italic; font-size: 26px; color: #f5d48a; }
  .ma-chips { margin: 4px 0 0; font-size: 16px; color: #cdbbe8; }
  .ma-tensao { margin: 0 0 10px; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.12em; color: #f5a524; text-transform: uppercase; }
  .ma-hoje { text-align: left; cursor: pointer; color: #faf5ff; font: inherit; width: 100%; }
  .ma-hoje strong { font-family: 'Cinzel', serif; font-size: 19px; line-height: 1.3; }
  .ma-linha { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .ma-sub { font-size: 16px; color: #cdbbe8; line-height: 1.4; }
  .ma-ir { color: #f5a524; font-size: 16px; }
  .ma-carregando { color: #cdbbe8; font-size: 16px; }
  .ma-pessoa h3 { margin: 0; font-family: 'Cinzel', serif; font-size: 18px; }
  .ma-data { color: #cdbbe8; font-size: 15px; }
  .ma-itens { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .ma-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; border: 1px solid #2e1f4a; background: #0f0620; color: #faf5ff; text-decoration: none; }
  .ma-item:hover { border-color: #f5a524; }
  .ma-item-txt { display: flex; flex-direction: column; flex: 1; }
  .ma-item-txt strong { font-family: 'Cinzel', serif; font-size: 14px; }
  .ma-item-txt span { font-size: 15px; color: #cdbbe8; }
  .ma-icone { width: 26px; height: 26px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .ma-aberto .ma-icone { background: rgba(74,222,128,0.15); color: #4ade80; }
  .ma-parcial .ma-icone { background: rgba(245,165,36,0.15); color: #f5a524; }
  .ma-travado .ma-icone { background: rgba(236,72,153,0.12); }
  .ma-aberto .ma-item-txt span { color: #86efac; }
  .ma-assin { text-decoration: none; color: #faf5ff; }
  .ma-assin strong { font-family: 'Cinzel', serif; font-size: 18px; }
  .ma-assin-cta { border-color: #db2777; background: linear-gradient(160deg, rgba(219,39,119,0.12), #150a28); }
  .mp-grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .mp-sis { display: flex; flex-direction: column; gap: 3px; padding: 14px 12px; border-radius: 16px; border: 1px solid #2e1f4a; background: #150a28; color: #faf5ff; text-decoration: none; }
  .mp-sis:hover { border-color: #f5a524; }
  .mp-sis-nome { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #f5a524; }
  .mp-sis strong { font-family: 'Cinzel', serif; font-size: 16px; line-height: 1.25; }
  .mp-sis-sub { font-size: 15px; color: #cdbbe8; line-height: 1.3; }
`;
