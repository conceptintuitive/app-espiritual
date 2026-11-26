// /planos — o que vem em cada forma de pagar (nov/2026). Server Component,
// sem IA; o conteúdo vem de lib/planos.js (fonte única) e os preços de
// lib/preco.js. Visual da Minha Área (base em app/blog/blog.module.css).
// Linkada como "Compare as opções" no /resultado, no /assinar e nos paywalls
// de Previsão do Ano, Human Design e Compatibilidade Completa.

import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { PLANOS, COMPARACAO, FAQ_PLANOS, O_QUE_E_O_MANUAL } from '@/lib/planos';
import { BASE_URL } from '@/lib/seoTarot';
import BotaoPlano, { NotaManual } from './BotaoPlano';
import b from '@/app/blog/blog.module.css';
import p from './planos.module.css';

const url = `${BASE_URL}/planos`;
const title = 'Planos: Mapa grátis, Manual do seu Mapa e Intuitive Completo | Intuitive Concept';
const description =
  'Compare o que vem no Mapa grátis, no Manual do seu Mapa (pagamento único) e no Intuitive Completo (Seu Dia, Previsão do Ano e Human Design).';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, locale: 'pt_BR', type: 'website' },
};

const COLUNAS = [
  { chave: 'gratis', nome: 'Grátis' },
  { chave: 'manual', nome: 'Manual' },
  { chave: 'completo', nome: 'Completo' },
];

function Celula({ valor, destaque }) {
  const cls = destaque ? p.colDestaque : undefined;
  if (valor === true) return <td className={cls}><span className={p.sim} aria-label="Incluso">✓</span></td>;
  if (valor === false) return <td className={cls}><span className={p.nao} aria-label="Não incluso">—</span></td>;
  return <td className={cls}><span className={p.cond}>{valor}</span></td>;
}

export default function PlanosPage() {
  return (
    <div className={b.blog}>
      <SiteNav />

      <main className={b.ctr}>
        <header className={p.topo}>
          <span className={b.eyebrow}>Planos</span>
          <h1 className={p.titulo}>Uma vez, ou <em>todo dia</em></h1>
          <p className={p.resumo}>
            O Manual do seu Mapa é a leitura que você compra uma vez e fica pra sempre. O Intuitive Completo é o seu mapa aplicado a cada dia.
          </p>
        </header>

        <ul className={p.planos}>
          {PLANOS.map((pl) => (
            <li key={pl.chave} className={`${p.plano} ${pl.destaque ? p.planoDestaque : ''}`}>
              {pl.destaque && <span className={p.selo}>O mais completo</span>}
              <h2 className={p.planoNome}>{pl.nome}</h2>
              <p className={p.praQuem}>{pl.praQuem}</p>
              <div className={p.preco}>
                <span className={p.precoValor}>{pl.preco}</span>
                <span className={p.precoDetalhe}>
                  {pl.detalhePreco}
                  {pl.precoJanela && <><br />{pl.precoJanela} nas primeiras 24h depois do seu Mapa</>}
                </span>
              </div>
              <ul className={p.inclui}>
                {pl.inclui.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <div className={p.acoes}>
                <BotaoPlano plano={pl.chave} className={pl.destaque ? b.btn : b.btnSec} />
                {pl.chave === 'manual' && <NotaManual className={p.nota} />}
                {pl.chave === 'completo' && <BotaoPlano plano="completo" botao="anual" className={p.linkMono} />}
              </div>
            </li>
          ))}
        </ul>

        <section className={p.secao} aria-labelledby="o-que-e">
          <h2 id="o-que-e" className={p.secaoTitulo}>{O_QUE_E_O_MANUAL.titulo}</h2>
          <p className={p.oQueEResumo}>{O_QUE_E_O_MANUAL.resumo}</p>
          <dl className={p.oQueE}>
            {O_QUE_E_O_MANUAL.itens.map((it) => (
              <div key={it.chave}>
                <dt>{it.titulo}</dt>
                <dd>{it.texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={p.secao} aria-labelledby="comparar">
          <h2 id="comparar" className={p.secaoTitulo}>Lado a lado</h2>
          <div className={p.tabelaWrap}>
            <table className={p.tabela}>
              <colgroup><col className={p.colItem} /><col /><col /><col /></colgroup>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left', paddingLeft: 0 }}>O que vem</th>
                  {COLUNAS.map((c) => (
                    <th key={c.chave} scope="col" className={c.chave === 'completo' ? p.colDestaque : undefined}>{c.nome}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARACAO.map((linha) => (
                  <tr key={linha.item}>
                    <th scope="row">{linha.item}</th>
                    {COLUNAS.map((c) => <Celula key={c.chave} valor={linha[c.chave]} destaque={c.chave === 'completo'} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${p.secao} ${p.faq}`} aria-labelledby="duvidas">
          <h2 id="duvidas" className={p.secaoTitulo}>Dúvidas</h2>
          {FAQ_PLANOS.map(({ p: pergunta, r }) => (
            <details key={pergunta}>
              <summary>{pergunta}</summary>
              <p>{r}</p>
            </details>
          ))}
        </section>

        <section className={p.fim}>
          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Ainda não fez o seu Mapa? Ele é grátis e é o começo de tudo.</p>
            <BotaoPlano plano="gratis" className={b.btn} />
            <p className={b.rotulo}>Regras completas nos <Link href="/termos-de-uso" className={p.blogLink}>Termos de Uso</Link></p>
          </div>
        </section>
      </main>
    </div>
  );
}
