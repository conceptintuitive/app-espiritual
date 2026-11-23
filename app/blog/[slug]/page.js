// /blog/[slug] — post. Server Component estático (generateStaticParams): o
// texto vai no HTML, não no JS. Client só o menu, o CtaMapa e o bloco
// interativo (BlocoCarregador → next/dynamic ssr:false, depois do 2º
// intertítulo). Capa e imagem OG = céu real gerado no build (app/blog/_capa).

import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SiteNav from '@/app/components/SiteNav';
import CtaMapa from '@/app/components/CtaMapa';
import {
  BLOG_POSTS, getPostBySlug, postDoNumero, formatPostDate, rotuloCategoria, tempoLeitura, blocosDoCorpo, posicaoDoBloco, leiaTambem,
} from '@/lib/blogPosts';
import ItemPost from '../ItemPost';
import BlocoCarregador from './BlocoCarregador';
import b from '../blog.module.css';

const BASE_URL = 'https://intuitiveconcept.com.br';

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post não encontrado | Intuitive Concept' };

  const title = `${post.title} | Blog Intuitive Concept`;
  return {
    // URL absoluta da imagem OG (opengraph-image.js) no domínio oficial
    metadataBase: new URL(BASE_URL),
    title,
    description: post.excerpt,
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    // A imagem OG vem do opengraph-image.js ao lado (Next liga sozinho).
    openGraph: {
      title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${slug}`,
      locale: 'pt_BR',
      type: 'article',
      publishedTime: post.date,
    },
    twitter: { card: 'summary_large_image' },
  };
}

/** "texto com **negrito**" → nós do React (sem dangerouslySetInnerHTML). */
function Inline({ texto }) {
  return texto.split(/\*\*([^*]+)\*\*/g).map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : parte));
}

function Bloco({ bloco }) {
  if (bloco.tipo === 'h2') return <h2>{bloco.texto}</h2>;
  if (bloco.tipo === 'ul') return <ul>{bloco.itens.map((it) => <li key={it}><Inline texto={it} /></li>)}</ul>;
  return <p><Inline texto={bloco.texto} /></p>;
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const blocos = blocosDoCorpo(post.body);
  const pos = posicaoDoBloco(blocos);
  const rotulo = rotuloCategoria(post.categoria);
  const outros = leiaTambem(slug).map((p) => ({
    slug: p.slug, title: p.title, excerpt: p.excerpt, rotulo: rotuloCategoria(p.categoria), data: formatPostDate(p.date),
  }));

  // Números que têm post próprio (o bloco de Números linka pra eles). Vai como
  // prop pra o bloco não importar lib/blogPosts.js (o texto de todos os posts).
  const postsNumeros = {};
  if (post.categoria === 'numeros') {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) { const p = postDoNumero(n); if (p) postsNumeros[n] = p.slug; }
  }
  const interativo = (
    <BlocoCarregador slug={slug} categoria={post.categoria} numero={post.numero ?? null} signo={post.signo ?? null} postsNumeros={postsNumeros} />
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image: [`${BASE_URL}/blog/${slug}/capa/largo`],
    author: { '@type': 'Organization', name: 'Intuitive Concept', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Intuitive Concept', url: BASE_URL },
    mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
    articleSection: rotulo,
    inLanguage: 'pt-BR',
  };

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteNav active="blog" />

      <article className={`${b.ctr} ${b.post}`}>
        <div className={b.coluna}>
          <Link href="/blog" className={b.voltar}>← Blog</Link>
          <header className={b.postTopo}>
            <span className={b.rotulo}>
              <b>{rotulo}</b> · {formatPostDate(post.date)} · {tempoLeitura(post.body)}
            </span>
            <h1 className={b.postTitulo}>{post.title}</h1>
            <p className={b.postResumo}>{post.excerpt}</p>
          </header>
        </div>

        <div className={b.postCapa}>
          <div className={b.capaLarga}>
            <Image src={`/blog/${slug}/capa/largo`} alt="" fill priority sizes="(min-width: 1048px) 1000px, 100vw" />
          </div>
        </div>

        <div className={`${b.coluna} ${b.corpo}`}>
          {blocos.map((bloco, i) => (
            <Fragment key={i}>
              {i === pos && interativo}
              <Bloco bloco={bloco} />
            </Fragment>
          ))}
          {pos >= blocos.length && interativo}

          <div className={b.ctaFim}>
            <p className={b.ctaFimTexto}>Quer ver como isso conversa com o seu próprio mapa?</p>
            <CtaMapa className={b.btn} origem="blog" />
          </div>
        </div>

        <section className={`${b.coluna} ${b.leia}`} aria-labelledby="leia-tambem">
          <h2 id="leia-tambem" className={b.leiaTitulo}>Leia também</h2>
          <ul className={b.lista}>
            {outros.map((p) => <ItemPost key={p.slug} p={p} />)}
          </ul>
        </section>
      </article>
    </div>
  );
}
