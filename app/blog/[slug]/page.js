import { getPostBySlug } from '@/lib/blogPosts';
import BlogPostClient from './BlogPostClient';

const BASE_URL = 'https://intuitiveconcept.com.br';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post não encontrado | Intuitive Concept' };

  const title = `${post.title} | Blog Intuitive Concept`;
  return {
    title,
    description: post.excerpt,
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    openGraph: {
      title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${slug}`,
      locale: 'pt_BR',
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
