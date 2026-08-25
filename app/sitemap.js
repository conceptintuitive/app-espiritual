import { BLOG_POSTS } from '@/lib/blogPosts';
import { SIGNOS, signoSlug, NUMEROS_VIDA } from '@/lib/seoConteudo';

const BASE_URL = 'https://intuitiveconcept.com.br';

export default function sitemap() {
  const estaticas = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explorar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/signos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/numerologia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  const posts = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const signos = SIGNOS.map((signo) => ({
    url: `${BASE_URL}/signos/${signoSlug(signo)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const numeros = NUMEROS_VIDA.map((numero) => ({
    url: `${BASE_URL}/numerologia/numero-${numero}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...estaticas, ...posts, ...signos, ...numeros];
}
