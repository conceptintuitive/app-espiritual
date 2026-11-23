// Capa do post em PNG: /blog/<slug>/capa/largo (1200x630, destaque do índice
// e topo do post) e /blog/<slug>/capa/4x5 (640x800, lista do índice).
// Estática: gerada no build pra cada post × formato. As páginas usam via
// next/image (WebP/AVIF no tamanho certo).

import { BLOG_POSTS, getPostBySlug } from '@/lib/blogPosts';
import { FORMATOS_CAPA } from '@/lib/blogCapa';
import { respostaCapa } from '@/app/blog/_capa/respostaCapa';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.flatMap((p) => Object.keys(FORMATOS_CAPA).map((formato) => ({ slug: p.slug, formato })));
}

export async function GET(_req, { params }) {
  const { slug, formato } = await params;
  const post = getPostBySlug(slug);
  if (!post || !FORMATOS_CAPA[formato]) return new Response('Não encontrado', { status: 404 });
  return respostaCapa(post, formato);
}
