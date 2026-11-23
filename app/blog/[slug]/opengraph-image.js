// Imagem OG de cada post (1200x630): a mesma capa do céu (app/blog/_capa).
// Estática: gerada no build pra cada post de lib/blogPosts.js.

import { BLOG_POSTS, getPostBySlug } from '@/lib/blogPosts';
import { respostaCapa } from '@/app/blog/_capa/respostaCapa';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'O céu sobre Brasília na data do post, com o símbolo do tema';

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function Imagem({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug) || { date: '2026-01-01', coverGlyph: '✦' };
  return respostaCapa(post, 'largo');
}
