import BlogIndexClient from './BlogIndexClient';

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
  return <BlogIndexClient />;
}
