// /tarot/[slug] — um Arcano Maior por página (22 estáticas). Server Component:
// o texto vai no HTML, não no JS. Sem IA: lib/tarot.js + lib/tarotReflexao.js
// (o mesmo que o bot responde no Reels "Escolhe uma carta"), via lib/seoTarot.js.
// Client só o menu e o CtaMapa (link pro quiz).

import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import CtaMapa from '@/app/components/CtaMapa';
import {
  ARCANOS_SEO, BASE_URL, arcanoPorSlug, vizinhos, numeroDoArcano, metaDoArcano, jsonLdDaPagina, jsonSeguro,
} from '@/lib/seoTarot';
import { getPostBySlug } from '@/lib/blogPosts';
import b from '@/app/blog/blog.module.css';
import s from '@/app/components/seo/seo.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCANOS_SEO.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = arcanoPorSlug(slug);
  if (!a) return { title: 'Carta não encontrada | Intuitive Concept' };
  const { title, description } = metaDoArcano(a);
  const url = `${BASE_URL}/tarot/${a.slug}`;
  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: 'pt_BR', type: 'article' },
  };
}

export default async function ArcanoPage({ params }) {
  const { slug } = await params;
  const a = arcanoPorSlug(slug);
  if (!a) notFound();

  const { description } = metaDoArcano(a);
  const num = numeroDoArcano(a.id);
  const post = getPostBySlug(`tarot-arcano-${a.slug}`);
  const { anterior, proximo } = vizinhos(a.id);
  const jsonLd = jsonLdDaPagina({
    titulo: `${a.nome} no Tarô`,
    descricao: description,
    caminho: `/tarot/${a.slug}`,
    migalhas: [['Início', '/'], ['Tarô', '/tarot'], [a.nome, `/tarot/${a.slug}`]],
    sobre: `${a.nome} (Arcano Maior ${a.id})`,
  });

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <SiteNav active="tarot" />

      <article className={`${b.ctr} ${b.post}`}>
        <div className={b.coluna}>
          <nav className={s.migalhas} aria-label="Você está em">
            <Link href="/">Início</Link><span aria-hidden="true">/</span><Link href="/tarot">Tarô</Link><span aria-hidden="true">/</span><span>{a.nome}</span>
          </nav>
          <header className={b.postTopo}>
            <span className={s.numeroGrande} aria-hidden="true">{a.id}</span>
            <span className={b.rotulo}><b>Arcano Maior {a.id}</b> · Tarô</span>
            <h1 className={b.postTitulo}>{a.nome} no Tarô</h1>
            <p className={b.postResumo}>{a.significado}</p>
            <div className={s.palavras}>
              {a.palavrasChave.map((p) => <span key={p} className={s.palavra}>{p}</span>)}
            </div>
          </header>
        </div>

        <div className={`${b.coluna} ${b.corpo}`}>
          <h2>O que {a.nome} significa</h2>
          <p>{a.central}</p>

          <h2>O que a carta pede hoje</h2>
          <p className={s.pratica}>{a.pratica}</p>

          <h2>Perguntas pra refletir</h2>
          <ol className={s.perguntas}>
            {a.perguntas.map((p) => <li key={p}>{p}</li>)}
          </ol>

          <h2>Quando a carta sai invertida</h2>
          <p>{a.invertida}</p>

          {num && (
            <>
              <h2>{a.nome} na numerologia</h2>
              <p>
                {a.nome} é o Arcano {a.id}
                {num.conta ? <>. Somando os dígitos: <span className={s.conta}>{num.conta}</span></> : null}
                . O número dele é o {num.numero}: <Link href={`/numerologia/numero-${num.numero}`} className={s.link}>veja o Número {num.numero} na Numerologia</Link>.
              </p>
            </>
          )}

          {post && (
            <p>No blog, mais sobre a carta: <Link href={`/blog/${post.slug}`} className={s.link}>{post.title}</Link>.</p>
          )}

          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Quer ver o que o seu próprio mapa diz sobre você?</p>
            <CtaMapa className={b.btn} origem="tarot" />
          </div>

          <nav className={s.vizinhos} aria-label="Outros Arcanos">
            <Link href={`/tarot/${anterior.slug}`} className={s.vizinho}><span>← Arcano {anterior.id}</span><b>{anterior.nome}</b></Link>
            <Link href={`/tarot/${proximo.slug}`} className={s.vizinho}><span>Arcano {proximo.id} →</span><b>{proximo.nome}</b></Link>
          </nav>
        </div>

        <section className={`${b.coluna} ${b.leia}`} aria-labelledby="todos">
          <h2 id="todos" className={b.leiaTitulo}>Os 22 Arcanos Maiores</h2>
          <div className={s.chips}>
            {ARCANOS_SEO.filter((x) => x.id !== a.id).map((x) => (
              <Link key={x.slug} href={`/tarot/${x.slug}`} className={s.chip}>{x.id} · {x.nome}</Link>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
