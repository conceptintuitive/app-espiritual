// /blog — índice. Server Component: o texto dos posts não vai pro JS do
// navegador; só a lista com o filtro (BlogLista) é client, com o resumo de
// cada post. Capas = céu real gerado no build (app/blog/[slug]/capa).

import SiteNav from '@/app/components/SiteNav';
import { CtaMapaBloco } from '@/app/components/CtaMapa';
import { BLOG_POSTS, CATEGORIAS, formatPostDate, rotuloCategoria } from '@/lib/blogPosts';
import BlogLista from './BlogLista';
import b from './blog.module.css';

export const metadata = {
  title: 'Blog | Intuitive Concept — Numerologia e Astrologia',
  description: 'Trânsitos, luas e numerologia do mês — artigos semanais sobre astrologia, numerologia e autoconhecimento pra ir além do seu mapa.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/blog' },
  openGraph: {
    title: 'Blog | Intuitive Concept',
    description: 'Trânsitos, luas e numerologia do mês — artigos semanais pra ir além do seu mapa.',
    url: 'https://intuitiveconcept.com.br/blog',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function BlogPage() {
  // Mais recente primeiro (o array já vem assim; a ordenação garante).
  const posts = [...BLOG_POSTS]
    .sort((x, y) => y.date.localeCompare(x.date))
    .map((p) => ({
      slug: p.slug, title: p.title, excerpt: p.excerpt, categoria: p.categoria,
      rotulo: rotuloCategoria(p.categoria), data: formatPostDate(p.date),
    }));

  return (
    <div className={b.blog}>
      <SiteNav active="blog" />
      <main className={b.ctr}>
        <header className={b.topo}>
          <span className={b.eyebrow}>Toda semana</span>
          <h1 className={b.titulo}>Blog <em>Intuitive Concept</em></h1>
          <p className={b.sub}>Trânsitos, luas e numerologia do mês — pra ir além do seu mapa.</p>
        </header>
        <BlogLista posts={posts} categorias={CATEGORIAS} />
      </main>
      <div className={b.fimIndice}>
        <CtaMapaBloco origem="blog-indice" />
      </div>
    </div>
  );
}
